"""
Furnisher Intelligence Module
Track dispute outcomes and furnisher patterns over time.

This module provides insights into which collectors and furnishers have
the highest rates of violations and dispute success.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict


# Storage location
INTEL_FILE = Path(__file__).parent.parent / 'output' / 'furnisher_intel' / 'intel.json'


def ensure_intel_dir():
    """Ensure the intelligence directory exists."""
    INTEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not INTEL_FILE.exists():
        with open(INTEL_FILE, 'w') as f:
            json.dump({
                'furnishers': {},
                'disputes': [],
                'outcomes': []
            }, f)


@dataclass
class FurnisherRecord:
    """Record for a furnisher/collector."""
    name: str
    normalized_name: str
    first_seen: str
    total_accounts: int = 0
    flagged_accounts: int = 0
    high_severity_flags: int = 0
    disputes_filed: int = 0
    disputes_successful: int = 0
    disputes_pending: int = 0
    common_violations: Dict[str, int] = None

    def __post_init__(self):
        if self.common_violations is None:
            self.common_violations = {}


@dataclass
class DisputeRecord:
    """Record of a dispute filed."""
    dispute_id: str
    case_id: str
    furnisher: str
    bureau: str
    date_filed: str
    rule_ids: List[str]
    status: str = "pending"  # pending, successful, denied, no_response
    date_resolved: Optional[str] = None
    notes: str = ""


class FurnisherIntelligence:
    """Track and analyze furnisher behavior patterns."""

    def __init__(self):
        ensure_intel_dir()
        self._load()

    def _load(self):
        """Load intelligence data."""
        with open(INTEL_FILE, 'r') as f:
            self._data = json.load(f)

    def _save(self):
        """Save intelligence data."""
        with open(INTEL_FILE, 'w') as f:
            json.dump(self._data, f, indent=2)

    def _normalize_name(self, name: str) -> str:
        """Normalize furnisher name for matching."""
        if not name:
            return ""
        # Remove common suffixes and normalize
        name = name.upper().strip()
        for suffix in [' LLC', ' INC', ' CORP', ' CO', ' COMPANY', ' SERVICES']:
            name = name.replace(suffix, '')
        # Remove special characters
        name = ''.join(c for c in name if c.isalnum() or c.isspace())
        return ' '.join(name.split())  # Normalize whitespace

    def record_account(self, furnisher_name: str, flags: List[Dict], case_id: str = ""):
        """Record an account analysis for intelligence gathering."""
        if not furnisher_name:
            return

        normalized = self._normalize_name(furnisher_name)
        if not normalized:
            return

        # Get or create furnisher record
        if normalized not in self._data['furnishers']:
            self._data['furnishers'][normalized] = {
                'name': furnisher_name,
                'normalized_name': normalized,
                'first_seen': datetime.now().isoformat(),
                'total_accounts': 0,
                'flagged_accounts': 0,
                'high_severity_flags': 0,
                'disputes_filed': 0,
                'disputes_successful': 0,
                'disputes_pending': 0,
                'common_violations': {}
            }

        record = self._data['furnishers'][normalized]
        record['total_accounts'] += 1

        if flags:
            record['flagged_accounts'] += 1
            for flag in flags:
                severity = flag.get('severity', 'medium')
                if severity == 'high':
                    record['high_severity_flags'] += 1

                rule_id = flag.get('rule_id', 'unknown')
                if rule_id not in record['common_violations']:
                    record['common_violations'][rule_id] = 0
                record['common_violations'][rule_id] += 1

        self._save()

    def record_dispute(
        self,
        furnisher_name: str,
        bureau: str,
        rule_ids: List[str],
        case_id: str = ""
    ) -> str:
        """Record a dispute being filed."""
        import secrets
        dispute_id = f"DSP_{secrets.token_hex(6).upper()}"

        normalized = self._normalize_name(furnisher_name)

        dispute = {
            'dispute_id': dispute_id,
            'case_id': case_id,
            'furnisher': normalized,
            'bureau': bureau,
            'date_filed': datetime.now().isoformat(),
            'rule_ids': rule_ids,
            'status': 'pending',
            'date_resolved': None,
            'notes': ''
        }

        self._data['disputes'].append(dispute)

        # Update furnisher stats
        if normalized in self._data['furnishers']:
            self._data['furnishers'][normalized]['disputes_filed'] += 1
            self._data['furnishers'][normalized]['disputes_pending'] += 1

        self._save()
        return dispute_id

    def update_dispute_outcome(
        self,
        dispute_id: str,
        status: str,
        notes: str = ""
    ):
        """Update the outcome of a dispute."""
        for dispute in self._data['disputes']:
            if dispute['dispute_id'] == dispute_id:
                old_status = dispute['status']
                dispute['status'] = status
                dispute['date_resolved'] = datetime.now().isoformat()
                dispute['notes'] = notes

                # Update furnisher stats
                furnisher = dispute['furnisher']
                if furnisher in self._data['furnishers']:
                    record = self._data['furnishers'][furnisher]
                    if old_status == 'pending':
                        record['disputes_pending'] -= 1
                    if status == 'successful':
                        record['disputes_successful'] += 1

                self._save()
                return True
        return False

    def get_furnisher_stats(self, furnisher_name: str) -> Optional[Dict]:
        """Get statistics for a specific furnisher."""
        normalized = self._normalize_name(furnisher_name)
        return self._data['furnishers'].get(normalized)

    def get_top_violators(self, limit: int = 10) -> List[Dict]:
        """Get furnishers with highest violation rates."""
        furnishers = []
        for name, data in self._data['furnishers'].items():
            if data['total_accounts'] >= 2:  # Minimum sample size
                violation_rate = data['flagged_accounts'] / data['total_accounts'] * 100
                success_rate = (
                    data['disputes_successful'] / data['disputes_filed'] * 100
                    if data['disputes_filed'] > 0 else 0
                )
                furnishers.append({
                    'name': data['name'],
                    'total_accounts': data['total_accounts'],
                    'flagged_accounts': data['flagged_accounts'],
                    'violation_rate': violation_rate,
                    'disputes_filed': data['disputes_filed'],
                    'disputes_successful': data['disputes_successful'],
                    'success_rate': success_rate,
                    'top_violations': sorted(
                        data['common_violations'].items(),
                        key=lambda x: x[1],
                        reverse=True
                    )[:3]
                })

        # Sort by violation rate
        furnishers.sort(key=lambda x: x['violation_rate'], reverse=True)
        return furnishers[:limit]

    def get_overall_stats(self) -> Dict:
        """Get overall intelligence statistics."""
        total_furnishers = len(self._data['furnishers'])
        total_accounts = sum(f['total_accounts'] for f in self._data['furnishers'].values())
        total_flagged = sum(f['flagged_accounts'] for f in self._data['furnishers'].values())
        total_disputes = len(self._data['disputes'])
        successful_disputes = len([d for d in self._data['disputes'] if d['status'] == 'successful'])

        return {
            'total_furnishers': total_furnishers,
            'total_accounts_analyzed': total_accounts,
            'total_flagged_accounts': total_flagged,
            'overall_flag_rate': (total_flagged / total_accounts * 100) if total_accounts > 0 else 0,
            'total_disputes': total_disputes,
            'successful_disputes': successful_disputes,
            'overall_success_rate': (successful_disputes / total_disputes * 100) if total_disputes > 0 else 0
        }

    def get_pending_disputes(self) -> List[Dict]:
        """Get all pending disputes."""
        return [d for d in self._data['disputes'] if d['status'] == 'pending']


def render_furnisher_intelligence(st):
    """Render the Furnisher Intelligence dashboard in Streamlit."""
    intel = FurnisherIntelligence()

    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Furnisher Intelligence</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Track which collectors have the most violations and highest dispute success rates.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.info("""
    **How this works:** As you analyze reports and file disputes, this dashboard learns which
    collectors are most likely to have violations. Over time, it helps you prioritize cases
    and predict dispute outcomes.
    """)

    # Overall stats
    stats = intel.get_overall_stats()

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Collectors Tracked", stats['total_furnishers'])
    col2.metric("Accounts Analyzed", stats['total_accounts_analyzed'])
    col3.metric("Flag Rate", f"{stats['overall_flag_rate']:.1f}%")
    col4.metric("Dispute Success", f"{stats['overall_success_rate']:.1f}%")

    st.markdown("---")

    # Top violators
    st.markdown("### Collectors with Most Issues")

    top_violators = intel.get_top_violators(10)

    if top_violators:
        import pandas as pd
        df = pd.DataFrame([
            {
                'Collector': v['name'][:30],
                'Accounts': v['total_accounts'],
                'Flagged': v['flagged_accounts'],
                'Flag Rate': f"{v['violation_rate']:.0f}%",
                'Disputes': v['disputes_filed'],
                'Won': v['disputes_successful'],
                'Success Rate': f"{v['success_rate']:.0f}%"
            }
            for v in top_violators
        ])
        st.dataframe(df, use_container_width=True, hide_index=True)

        # Visualization
        if len(top_violators) >= 3:
            chart_data = pd.DataFrame({
                'Collector': [v['name'][:15] for v in top_violators[:5]],
                'Violation Rate': [v['violation_rate'] for v in top_violators[:5]]
            })
            st.bar_chart(chart_data.set_index('Collector'))
    else:
        st.info("No collector data yet. Analyze some credit reports to start building intelligence.")

    st.markdown("---")

    # Pending disputes
    st.markdown("### Pending Disputes")

    pending = intel.get_pending_disputes()
    if pending:
        for dispute in pending:
            with st.expander(f"{dispute['furnisher']} - Filed {dispute['date_filed'][:10]}"):
                st.write(f"**Bureau:** {dispute['bureau']}")
                st.write(f"**Rules Cited:** {', '.join(dispute['rule_ids'])}")
                st.write(f"**Case ID:** {dispute['case_id']}")

                col1, col2, col3 = st.columns(3)
                with col1:
                    if st.button("Mark Successful", key=f"win_{dispute['dispute_id']}"):
                        intel.update_dispute_outcome(dispute['dispute_id'], 'successful')
                        st.success("Updated!")
                        st.rerun()
                with col2:
                    if st.button("Mark Denied", key=f"deny_{dispute['dispute_id']}"):
                        intel.update_dispute_outcome(dispute['dispute_id'], 'denied')
                        st.info("Updated")
                        st.rerun()
                with col3:
                    if st.button("No Response", key=f"nr_{dispute['dispute_id']}"):
                        intel.update_dispute_outcome(dispute['dispute_id'], 'no_response')
                        st.info("Updated")
                        st.rerun()
    else:
        st.info("No pending disputes. When you file disputes, track their outcomes here.")

    st.markdown("---")

    # Manual dispute entry
    with st.expander("Record a New Dispute"):
        col1, col2 = st.columns(2)
        with col1:
            furnisher = st.text_input("Collector/Furnisher Name", key="new_disp_furnisher")
            bureau = st.selectbox("Bureau", ["Experian", "Equifax", "TransUnion"], key="new_disp_bureau")
        with col2:
            rules = st.text_input("Rule IDs (comma-separated)", key="new_disp_rules", placeholder="A1, B2, K6")
            case_id = st.text_input("Case ID (optional)", key="new_disp_case")

        if st.button("Record Dispute", type="primary"):
            if furnisher and rules:
                rule_list = [r.strip() for r in rules.split(',')]
                dispute_id = intel.record_dispute(furnisher, bureau, rule_list, case_id)
                st.success(f"Recorded dispute {dispute_id}")
                st.rerun()
            else:
                st.error("Please enter collector name and at least one rule ID")
