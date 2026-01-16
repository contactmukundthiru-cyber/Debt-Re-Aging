"""
Case Manager Module
Save, resume, and track cases with full history

Provides persistent case storage and outcome tracking.
"""

import json
import os
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict, field
from typing import List, Dict, Any, Optional
from enum import Enum
import shutil


# Storage directories
CASES_DIR = Path(__file__).parent.parent / 'output' / 'cases'
HISTORY_FILE = CASES_DIR / 'case_history.json'


class CaseStatus(Enum):
    """Status of a case in the workflow."""
    DRAFT = "draft"                    # In progress, not complete
    PENDING_REVIEW = "pending_review"  # Ready for attorney review
    DISPUTED = "disputed"              # Dispute sent
    AWAITING_RESPONSE = "awaiting_response"  # Waiting for bureau/furnisher
    RESOLVED_SUCCESS = "resolved_success"    # Successfully corrected
    RESOLVED_PARTIAL = "resolved_partial"    # Partially corrected
    RESOLVED_DENIED = "resolved_denied"      # Dispute denied
    CLOSED = "closed"                  # Case closed (any reason)
    ESCALATED = "escalated"            # Escalated to litigation


class DisputeType(Enum):
    """Type of dispute filed."""
    BUREAU_ONLINE = "bureau_online"
    BUREAU_MAIL = "bureau_mail"
    FURNISHER_DIRECT = "furnisher_direct"
    DEBT_VALIDATION = "debt_validation"
    CFPB_COMPLAINT = "cfpb_complaint"
    STATE_AG = "state_ag"
    LITIGATION = "litigation"


@dataclass
class DisputeRecord:
    """Record of a dispute action."""
    dispute_id: str
    dispute_type: str
    date_sent: str
    recipient: str
    tracking_number: Optional[str] = None
    response_due_date: Optional[str] = None
    response_received_date: Optional[str] = None
    outcome: Optional[str] = None
    notes: str = ""


@dataclass
class CaseData:
    """Complete case data for persistence."""
    case_id: str
    created_at: str
    updated_at: str
    status: str = CaseStatus.DRAFT.value

    # Workflow state
    current_step: int = 1
    extracted_text: str = ""
    extraction_method: str = ""
    extraction_quality: float = 0.0

    # Field data
    original_fields: Dict[str, Any] = field(default_factory=dict)
    verified_fields: Dict[str, Any] = field(default_factory=dict)
    field_edits: List[Dict[str, Any]] = field(default_factory=list)

    # Analysis results
    flags: List[Dict[str, Any]] = field(default_factory=list)
    flags_severity_summary: Dict[str, int] = field(default_factory=dict)

    # Consumer info
    consumer_name: str = ""
    consumer_state: str = ""
    consumer_address: str = ""

    # Account info
    account_creditor: str = ""
    account_collector: str = ""
    account_bureau: str = ""
    account_type: str = ""

    # Dispute tracking
    disputes: List[Dict[str, Any]] = field(default_factory=list)
    outcome: Optional[str] = None
    outcome_date: Optional[str] = None
    outcome_notes: str = ""

    # Files
    uploaded_filename: str = ""
    generated_files: List[str] = field(default_factory=list)
    packet_path: Optional[str] = None

    # Metadata
    assigned_to: str = ""
    tags: List[str] = field(default_factory=list)
    notes: str = ""
    source: str = "manual"  # manual, batch, import


def ensure_cases_dir():
    """Ensure cases directory exists."""
    CASES_DIR.mkdir(parents=True, exist_ok=True)


def generate_case_id() -> str:
    """Generate a unique case ID."""
    import random
    import string
    timestamp = datetime.now().strftime('%Y%m%d')
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"DRA-{timestamp}-{random_part}"


class CaseManager:
    """Manages case persistence and history."""

    def __init__(self):
        ensure_cases_dir()
        self._load_history()

    def _load_history(self):
        """Load case history index."""
        if HISTORY_FILE.exists():
            try:
                with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                    self._history = json.load(f)
            except:
                self._history = {'cases': [], 'stats': {}}
        else:
            self._history = {'cases': [], 'stats': {}}

    def _save_history(self):
        """Save case history index."""
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(self._history, f, indent=2)

    def create_case(self, case_id: str = None) -> CaseData:
        """Create a new case."""
        if not case_id:
            case_id = generate_case_id()

        now = datetime.now().isoformat()
        case = CaseData(
            case_id=case_id,
            created_at=now,
            updated_at=now
        )

        # Add to history index
        self._history['cases'].append({
            'case_id': case_id,
            'created_at': now,
            'status': case.status,
            'creditor': '',
            'bureau': ''
        })
        self._save_history()

        return case

    def save_case(self, case: CaseData) -> str:
        """Save a case to disk."""
        case.updated_at = datetime.now().isoformat()

        case_file = CASES_DIR / f"{case.case_id}.json"
        with open(case_file, 'w', encoding='utf-8') as f:
            json.dump(asdict(case), f, indent=2)

        # Update history index
        for entry in self._history['cases']:
            if entry['case_id'] == case.case_id:
                entry['status'] = case.status
                entry['creditor'] = case.account_creditor
                entry['bureau'] = case.account_bureau
                entry['updated_at'] = case.updated_at
                break
        self._save_history()

        return str(case_file)

    def load_case(self, case_id: str) -> Optional[CaseData]:
        """Load a case from disk."""
        case_file = CASES_DIR / f"{case_id}.json"
        if not case_file.exists():
            return None

        try:
            with open(case_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Handle missing fields from older versions
            defaults = asdict(CaseData(case_id="", created_at="", updated_at=""))
            for key, value in defaults.items():
                if key not in data:
                    data[key] = value

            return CaseData(**data)
        except Exception as e:
            print(f"Error loading case {case_id}: {e}")
            return None

    def delete_case(self, case_id: str) -> bool:
        """Delete a case."""
        case_file = CASES_DIR / f"{case_id}.json"
        if case_file.exists():
            case_file.unlink()

        self._history['cases'] = [
            c for c in self._history['cases']
            if c['case_id'] != case_id
        ]
        self._save_history()
        return True

    def list_cases(self, status: str = None, limit: int = 50) -> List[Dict]:
        """List cases with optional filtering."""
        cases = self._history['cases']

        if status:
            cases = [c for c in cases if c.get('status') == status]

        # Sort by most recent
        cases = sorted(cases, key=lambda x: x.get('updated_at', x.get('created_at', '')), reverse=True)

        return cases[:limit]

    def search_cases(self, query: str) -> List[Dict]:
        """Search cases by creditor, case ID, or other fields."""
        query = query.lower()
        results = []

        for entry in self._history['cases']:
            if (query in entry.get('case_id', '').lower() or
                query in entry.get('creditor', '').lower() or
                query in entry.get('bureau', '').lower()):
                results.append(entry)

        return results

    def get_case_count_by_status(self) -> Dict[str, int]:
        """Get count of cases by status."""
        counts = {}
        for case in self._history['cases']:
            status = case.get('status', 'unknown')
            counts[status] = counts.get(status, 0) + 1
        return counts

    def get_recent_cases(self, days: int = 30) -> List[Dict]:
        """Get cases from the last N days."""
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        return [
            c for c in self._history['cases']
            if c.get('created_at', '') >= cutoff
        ]

    def add_dispute(self, case_id: str, dispute: DisputeRecord) -> bool:
        """Add a dispute record to a case."""
        case = self.load_case(case_id)
        if not case:
            return False

        case.disputes.append(asdict(dispute))
        case.status = CaseStatus.DISPUTED.value
        self.save_case(case)
        return True

    def update_dispute_outcome(self, case_id: str, dispute_id: str,
                               outcome: str, notes: str = "") -> bool:
        """Update the outcome of a specific dispute."""
        case = self.load_case(case_id)
        if not case:
            return False

        for dispute in case.disputes:
            if dispute.get('dispute_id') == dispute_id:
                dispute['outcome'] = outcome
                dispute['response_received_date'] = datetime.now().isoformat()
                dispute['notes'] = notes
                break

        self.save_case(case)
        return True

    def set_case_outcome(self, case_id: str, outcome: str, notes: str = "") -> bool:
        """Set the final outcome of a case."""
        case = self.load_case(case_id)
        if not case:
            return False

        case.outcome = outcome
        case.outcome_date = datetime.now().isoformat()
        case.outcome_notes = notes

        # Update status based on outcome
        outcome_to_status = {
            'corrected': CaseStatus.RESOLVED_SUCCESS.value,
            'partially_corrected': CaseStatus.RESOLVED_PARTIAL.value,
            'denied': CaseStatus.RESOLVED_DENIED.value,
            'closed': CaseStatus.CLOSED.value,
            'escalated': CaseStatus.ESCALATED.value
        }
        case.status = outcome_to_status.get(outcome, CaseStatus.CLOSED.value)

        self.save_case(case)
        return True

    def get_outcome_statistics(self) -> Dict[str, Any]:
        """Get statistics on case outcomes."""
        stats = {
            'total_cases': len(self._history['cases']),
            'by_status': self.get_case_count_by_status(),
            'success_rate': 0.0,
            'avg_resolution_days': 0
        }

        resolved_cases = [
            c for c in self._history['cases']
            if c.get('status', '').startswith('resolved_')
        ]

        if resolved_cases:
            successes = len([c for c in resolved_cases
                          if c.get('status') == CaseStatus.RESOLVED_SUCCESS.value])
            stats['success_rate'] = (successes / len(resolved_cases)) * 100

        return stats

    def export_case_summary(self, case_id: str) -> str:
        """Export a case summary as markdown."""
        case = self.load_case(case_id)
        if not case:
            return ""

        return f"""# Case Summary: {case.case_id}

## Status
- **Current Status:** {case.status}
- **Created:** {case.created_at[:10]}
- **Last Updated:** {case.updated_at[:10]}

## Account Information
- **Original Creditor:** {case.account_creditor or 'N/A'}
- **Collector/Furnisher:** {case.account_collector or 'N/A'}
- **Bureau:** {case.account_bureau or 'N/A'}
- **Account Type:** {case.account_type or 'N/A'}

## Consumer Information
- **Name:** {case.consumer_name or 'N/A'}
- **State:** {case.consumer_state or 'N/A'}

## Analysis Results
- **Flags Identified:** {len(case.flags)}
- **High Severity:** {case.flags_severity_summary.get('high', 0)}
- **Medium Severity:** {case.flags_severity_summary.get('medium', 0)}
- **Low Severity:** {case.flags_severity_summary.get('low', 0)}

## Disputes Filed
{self._format_disputes(case.disputes)}

## Outcome
- **Final Outcome:** {case.outcome or 'Pending'}
- **Outcome Date:** {case.outcome_date or 'N/A'}
- **Notes:** {case.outcome_notes or 'N/A'}

## Notes
{case.notes or 'No notes recorded.'}
"""

    def audit_systemic_violations(self) -> List[Dict[str, Any]]:
        """
        Institutional Feature: Systemic Behavioral Auditing.
        Analyzes entire history to find furnishers with recurring violation patterns.
        """
        furnisher_stats = {}
        
        for entry in self._history['cases']:
            case_id = entry['case_id']
            case = self.load_case(case_id)
            if not case or not case.flags:
                continue
                
            furnisher = case.account_collector or case.account_creditor or "Unknown"
            furnisher = furnisher.strip().upper()
            
            if furnisher not in furnisher_stats:
                furnisher_stats[furnisher] = {
                    'total_cases': 0,
                    'total_flags': 0,
                    'high_severity_flags': 0,
                    'common_rules': {},
                    'success_rate': 0,
                    'resolved_cases': 0
                }
            
            stats = furnisher_stats[furnisher]
            stats['total_cases'] += 1
            stats['total_flags'] += len(case.flags)
            
            for flag in case.flags:
                rule_id = flag.get('rule_id', 'Unknown')
                stats['common_rules'][rule_id] = stats['common_rules'].get(rule_id, 0) + 1
                if flag.get('severity') == 'high':
                    stats['high_severity_flags'] += 1
            
            if case.status.startswith('resolved_'):
                stats['resolved_cases'] += 1
                
        # Filter for furnishers with enough data
        systemic_issues = []
        for furnisher, stats in furnisher_stats.items():
            if stats['total_cases'] >= 3:
                # Calculate systemic score
                violation_rate = stats['total_flags'] / stats['total_cases']
                systemic_issues.append({
                    'furnisher': furnisher,
                    'violation_rate': round(violation_rate, 2),
                    'high_severity_count': stats['high_severity_flags'],
                    'most_common_violation': max(stats['common_rules'], key=stats['common_rules'].get) if stats['common_rules'] else "None",
                    'total_cases': stats['total_cases']
                })
                
        return sorted(systemic_issues, key=lambda x: x['violation_rate'], reverse=True)

    def _format_disputes(self, disputes: List[Dict]) -> str:
        """Format disputes for markdown output."""
        if not disputes:
            return "No disputes filed yet."

        lines = []
        for d in disputes:
            lines.append(f"- **{d.get('dispute_type', 'Unknown')}** to {d.get('recipient', 'Unknown')}")
            lines.append(f"  - Sent: {d.get('date_sent', 'N/A')}")
            if d.get('tracking_number'):
                lines.append(f"  - Tracking: {d['tracking_number']}")
            if d.get('outcome'):
                lines.append(f"  - Outcome: {d['outcome']}")
        return "\n".join(lines)


def save_session_to_case(st_session_state, case_id: str = None) -> CaseData:
    """Convert Streamlit session state to a saveable case."""
    manager = CaseManager()

    if case_id:
        case = manager.load_case(case_id)
        if not case:
            case = manager.create_case(case_id)
    else:
        case = manager.create_case()

    # Map session state to case
    case.current_step = st_session_state.get('current_step', 1)
    case.extracted_text = st_session_state.get('extracted_text', '')
    case.extraction_method = st_session_state.get('extraction_method', '')

    # Fields
    if st_session_state.get('parsed_fields'):
        case.original_fields = st_session_state['parsed_fields'].to_dict() if hasattr(st_session_state['parsed_fields'], 'to_dict') else {}
    case.verified_fields = st_session_state.get('editable_fields', {})

    # Flags
    case.flags = st_session_state.get('rule_flags', [])

    # Consumer info
    consumer = st_session_state.get('consumer_info', {})
    case.consumer_name = consumer.get('name', '')
    case.consumer_state = consumer.get('state', '')
    case.consumer_address = consumer.get('address', '')

    # Account info from verified fields
    fields = case.verified_fields
    case.account_creditor = fields.get('original_creditor', {}).get('value', '')
    case.account_collector = fields.get('furnisher_or_collector', {}).get('value', '')
    case.account_bureau = fields.get('bureau', {}).get('value', '')
    case.account_type = fields.get('account_type', {}).get('value', '')

    # Uploaded file
    if st_session_state.get('uploaded_file'):
        case.uploaded_filename = st_session_state['uploaded_file'].name

    # Calculate severity summary
    severity_counts = {'high': 0, 'medium': 0, 'low': 0}
    for flag in case.flags:
        sev = flag.get('severity', 'medium')
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
    case.flags_severity_summary = severity_counts

    manager.save_case(case)
    return case


def load_case_to_session(case_id: str, st_session_state) -> bool:
    """Load a saved case into Streamlit session state."""
    manager = CaseManager()
    case = manager.load_case(case_id)

    if not case:
        return False

    # Restore session state
    st_session_state['current_step'] = case.current_step
    st_session_state['extracted_text'] = case.extracted_text
    st_session_state['extraction_method'] = case.extraction_method
    st_session_state['editable_fields'] = case.verified_fields
    st_session_state['rule_flags'] = case.flags
    st_session_state['rules_checked'] = len(case.flags) > 0
    st_session_state['fields_verified'] = case.current_step > 3

    # Consumer info
    st_session_state['consumer_info'] = {
        'name': case.consumer_name,
        'state': case.consumer_state,
        'address': case.consumer_address
    }

    # Mark as loaded from save
    st_session_state['loaded_case_id'] = case_id

    return True


def render_case_manager_ui(st):
    """Render the case manager UI in Streamlit."""
    st.title("Case Manager")
    st.markdown("Save, resume, and track your cases.")

    manager = CaseManager()

    # Tabs for different views
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "My Cases", "Search", "Outcomes", "Statistics", "Institutional Audit"
    ])

    with tab1:
        st.subheader("Recent Cases")

        # Filter by status
        status_filter = st.selectbox(
            "Filter by status",
            options=["All", "draft", "disputed", "awaiting_response",
                    "resolved_success", "resolved_partial", "resolved_denied", "closed"]
        )

        cases = manager.list_cases(
            status=None if status_filter == "All" else status_filter
        )

        if not cases:
            st.info("No cases found. Start a new case to begin.")
        else:
            for case_entry in cases:
                col1, col2, col3, col4 = st.columns([3, 2, 2, 1])
                with col1:
                    st.markdown(f"**{case_entry['case_id']}**")
                    st.caption(case_entry.get('creditor', 'Unknown creditor'))
                with col2:
                    st.markdown(case_entry.get('status', 'draft'))
                with col3:
                    st.caption(case_entry.get('created_at', '')[:10])
                with col4:
                    if st.button("Open", key=f"open_{case_entry['case_id']}"):
                        st.session_state['load_case_id'] = case_entry['case_id']
                        st.rerun()

    with tab2:
        st.subheader("Search Cases")
        search_query = st.text_input("Search by case ID, creditor, or bureau")

        if search_query:
            results = manager.search_cases(search_query)
            st.write(f"Found {len(results)} results")
            for result in results:
                st.markdown(f"- **{result['case_id']}** - {result.get('creditor', 'N/A')} ({result.get('status', 'draft')})")

    with tab3:
        st.subheader("Record Outcomes")
        st.markdown("Select a case to record its outcome.")

        # List disputed cases awaiting outcome
        active_cases = manager.list_cases(status="disputed") + \
                      manager.list_cases(status="awaiting_response")

        if not active_cases:
            st.info("No active disputes awaiting outcomes.")
        else:
            case_options = {c['case_id']: f"{c['case_id']} - {c.get('creditor', 'Unknown')}"
                          for c in active_cases}

            selected_case = st.selectbox(
                "Select case",
                options=list(case_options.keys()),
                format_func=lambda x: case_options[x]
            )

            if selected_case:
                outcome = st.selectbox(
                    "Outcome",
                    options=["corrected", "partially_corrected", "denied", "closed", "escalated"]
                )

                notes = st.text_area("Notes")

                if st.button("Record Outcome"):
                    manager.set_case_outcome(selected_case, outcome, notes)
                    st.success("Outcome recorded!")
                    st.rerun()

    with tab4:
        st.subheader("Case Statistics")
        stats = manager.get_outcome_statistics()

        col1, col2, col3 = st.columns(3)
        col1.metric("Total Cases", stats['total_cases'])
        col2.metric("Success Rate", f"{stats['success_rate']:.1f}%")
        col3.metric("Active Cases",
                   stats['by_status'].get('draft', 0) +
                   stats['by_status'].get('disputed', 0))

        st.markdown("### Cases by Status")
        for status, count in stats['by_status'].items():
            st.markdown(f"- **{status}:** {count}")

    with tab5:
        st.subheader("Systemic Behavioral Audit")
        st.markdown("""
        **Unrivaled Institutional Intelligence**: This module analyzes recurring patterns across your entire case database 
        to identify furnishers with systemic reporting violations.
        """)
        
        systemic_issues = manager.audit_systemic_violations()
        
        if not systemic_issues:
            st.info("Insufficient data for systemic auditing. Process more cases to see patterns.")
        else:
            for issue in systemic_issues:
                with st.expander(f"🚩 {issue['furnisher']} - {issue['violation_rate']} flags/case"):
                    col1, col2 = st.columns(2)
                    col1.metric("Total Cases", issue['total_cases'])
                    col1.metric("High Severity Flags", issue['high_severity_count'])
                    col2.write(f"**Primary Violation Pattern**: {issue['most_common_violation']}")
                    col2.warning("Potential for Class Action or CFPB Systemic Referral")
