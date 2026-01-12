"""
Dispute Outcome Analytics Module
Track and visualize dispute success rates, patterns, and organizational metrics

Provides insights for institutional reporting and performance tracking.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
from collections import defaultdict
import statistics


# Storage
ANALYTICS_FILE = Path(__file__).parent.parent / 'output' / 'analytics' / 'outcomes.json'


class DisputeOutcome(Enum):
    """Possible outcomes of a dispute."""
    PENDING = "pending"
    DELETED = "deleted"  # Account removed from report
    CORRECTED = "corrected"  # Information corrected
    VERIFIED = "verified"  # Creditor verified (no change)
    NO_RESPONSE = "no_response"  # No response within 30 days
    PARTIAL = "partial"  # Partial correction
    ESCALATED = "escalated"  # Escalated to CFPB/attorney


class DisputeReason(Enum):
    """Categories of dispute reasons."""
    REAGING = "reaging"  # Date of first delinquency manipulation
    INACCURATE_BALANCE = "inaccurate_balance"
    NOT_MY_ACCOUNT = "not_my_account"
    DUPLICATE = "duplicate"
    PAID_ACCOUNT = "paid_account"
    SOL_EXPIRED = "sol_expired"  # Statute of limitations
    REPORTING_PERIOD = "reporting_period"  # Past 7-year limit
    IDENTITY_THEFT = "identity_theft"
    MISSING_VALIDATION = "missing_validation"
    OTHER = "other"


@dataclass
class OutcomeRecord:
    """Record of a dispute outcome."""
    record_id: str
    case_id: str
    bureau: str
    creditor: str
    dispute_reason: str
    outcome: str
    dispute_date: str
    resolution_date: Optional[str] = None
    days_to_resolve: Optional[int] = None
    amount: float = 0.0
    notes: str = ""
    flags_triggered: List[str] = field(default_factory=list)
    created_by: str = ""  # Organization/user


@dataclass
class AnalyticsSummary:
    """Summary statistics for analytics."""
    total_disputes: int
    success_rate: float
    avg_resolution_days: float
    by_bureau: Dict[str, Dict]
    by_reason: Dict[str, Dict]
    by_outcome: Dict[str, int]
    monthly_trends: List[Dict]
    top_creditors: List[Dict]
    amount_recovered: float


def ensure_analytics_dir():
    """Ensure the analytics directory exists."""
    ANALYTICS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not ANALYTICS_FILE.exists():
        with open(ANALYTICS_FILE, 'w') as f:
            json.dump({'outcomes': [], 'metadata': {'created': datetime.now().isoformat()}}, f)


class AnalyticsManager:
    """Manages dispute outcome tracking and analytics."""

    def __init__(self):
        ensure_analytics_dir()
        self._load()

    def _load(self):
        """Load analytics data from file."""
        with open(ANALYTICS_FILE, 'r') as f:
            self._data = json.load(f)

    def _save(self):
        """Save analytics data to file."""
        with open(ANALYTICS_FILE, 'w') as f:
            json.dump(self._data, f, indent=2)

    def _generate_id(self) -> str:
        """Generate a unique record ID."""
        import secrets
        return f"OUT_{secrets.token_hex(6).upper()}"

    def record_outcome(
        self,
        case_id: str,
        bureau: str,
        creditor: str,
        dispute_reason: DisputeReason,
        outcome: DisputeOutcome,
        dispute_date: datetime,
        resolution_date: datetime = None,
        amount: float = 0.0,
        notes: str = "",
        flags_triggered: List[str] = None,
        created_by: str = ""
    ) -> OutcomeRecord:
        """Record a dispute outcome."""
        days_to_resolve = None
        if resolution_date:
            days_to_resolve = (resolution_date - dispute_date).days

        record = OutcomeRecord(
            record_id=self._generate_id(),
            case_id=case_id,
            bureau=bureau,
            creditor=creditor,
            dispute_reason=dispute_reason.value,
            outcome=outcome.value,
            dispute_date=dispute_date.isoformat(),
            resolution_date=resolution_date.isoformat() if resolution_date else None,
            days_to_resolve=days_to_resolve,
            amount=amount,
            notes=notes,
            flags_triggered=flags_triggered or [],
            created_by=created_by
        )

        self._data['outcomes'].append(asdict(record))
        self._save()
        return record

    def update_outcome(
        self,
        record_id: str,
        outcome: DisputeOutcome,
        resolution_date: datetime = None,
        notes: str = ""
    ) -> bool:
        """Update an existing outcome record."""
        for rec in self._data['outcomes']:
            if rec['record_id'] == record_id:
                rec['outcome'] = outcome.value
                if resolution_date:
                    rec['resolution_date'] = resolution_date.isoformat()
                    dispute_date = datetime.fromisoformat(rec['dispute_date'])
                    rec['days_to_resolve'] = (resolution_date - dispute_date).days
                if notes:
                    rec['notes'] = notes
                self._save()
                return True
        return False

    def get_all_outcomes(self) -> List[Dict]:
        """Get all outcome records."""
        return self._data['outcomes']

    def get_case_outcomes(self, case_id: str) -> List[Dict]:
        """Get outcomes for a specific case."""
        return [r for r in self._data['outcomes'] if r['case_id'] == case_id]

    def calculate_success_rate(self, outcomes: List[Dict] = None) -> float:
        """Calculate dispute success rate."""
        if outcomes is None:
            outcomes = self._data['outcomes']

        if not outcomes:
            return 0.0

        resolved = [o for o in outcomes if o['outcome'] != DisputeOutcome.PENDING.value]
        if not resolved:
            return 0.0

        successful = [o for o in resolved if o['outcome'] in [
            DisputeOutcome.DELETED.value,
            DisputeOutcome.CORRECTED.value,
            DisputeOutcome.NO_RESPONSE.value,  # No response = presumed deletion
            DisputeOutcome.PARTIAL.value
        ]]

        return (len(successful) / len(resolved)) * 100

    def get_summary(self, date_from: datetime = None, date_to: datetime = None) -> AnalyticsSummary:
        """Get comprehensive analytics summary."""
        outcomes = self._data['outcomes']

        # Filter by date if specified
        if date_from:
            outcomes = [o for o in outcomes
                       if datetime.fromisoformat(o['dispute_date']) >= date_from]
        if date_to:
            outcomes = [o for o in outcomes
                       if datetime.fromisoformat(o['dispute_date']) <= date_to]

        # Success rate
        success_rate = self.calculate_success_rate(outcomes)

        # Average resolution time
        resolution_days = [o['days_to_resolve'] for o in outcomes
                          if o['days_to_resolve'] is not None]
        avg_resolution = statistics.mean(resolution_days) if resolution_days else 0

        # By bureau
        by_bureau = defaultdict(lambda: {'total': 0, 'success': 0, 'avg_days': []})
        for o in outcomes:
            bureau = o['bureau']
            by_bureau[bureau]['total'] += 1
            if o['outcome'] in [DisputeOutcome.DELETED.value, DisputeOutcome.CORRECTED.value]:
                by_bureau[bureau]['success'] += 1
            if o['days_to_resolve']:
                by_bureau[bureau]['avg_days'].append(o['days_to_resolve'])

        bureau_stats = {}
        for bureau, data in by_bureau.items():
            bureau_stats[bureau] = {
                'total': data['total'],
                'success_rate': (data['success'] / data['total'] * 100) if data['total'] > 0 else 0,
                'avg_resolution_days': statistics.mean(data['avg_days']) if data['avg_days'] else 0
            }

        # By reason
        by_reason = defaultdict(lambda: {'total': 0, 'success': 0})
        for o in outcomes:
            reason = o['dispute_reason']
            by_reason[reason]['total'] += 1
            if o['outcome'] in [DisputeOutcome.DELETED.value, DisputeOutcome.CORRECTED.value]:
                by_reason[reason]['success'] += 1

        reason_stats = {}
        for reason, data in by_reason.items():
            reason_stats[reason] = {
                'total': data['total'],
                'success_rate': (data['success'] / data['total'] * 100) if data['total'] > 0 else 0
            }

        # By outcome
        by_outcome = defaultdict(int)
        for o in outcomes:
            by_outcome[o['outcome']] += 1

        # Monthly trends
        monthly = defaultdict(lambda: {'total': 0, 'success': 0})
        for o in outcomes:
            month_key = datetime.fromisoformat(o['dispute_date']).strftime('%Y-%m')
            monthly[month_key]['total'] += 1
            if o['outcome'] in [DisputeOutcome.DELETED.value, DisputeOutcome.CORRECTED.value]:
                monthly[month_key]['success'] += 1

        monthly_trends = [
            {
                'month': month,
                'total': data['total'],
                'success_rate': (data['success'] / data['total'] * 100) if data['total'] > 0 else 0
            }
            for month, data in sorted(monthly.items())
        ]

        # Top creditors (most disputed)
        creditor_counts = defaultdict(int)
        for o in outcomes:
            creditor_counts[o['creditor']] += 1

        top_creditors = [
            {'creditor': c, 'count': count}
            for c, count in sorted(creditor_counts.items(), key=lambda x: -x[1])[:10]
        ]

        # Amount recovered (from deleted/corrected accounts)
        successful_outcomes = [o for o in outcomes if o['outcome'] in [
            DisputeOutcome.DELETED.value,
            DisputeOutcome.CORRECTED.value
        ]]
        amount_recovered = sum(o.get('amount', 0) for o in successful_outcomes)

        return AnalyticsSummary(
            total_disputes=len(outcomes),
            success_rate=success_rate,
            avg_resolution_days=avg_resolution,
            by_bureau=bureau_stats,
            by_reason=reason_stats,
            by_outcome=dict(by_outcome),
            monthly_trends=monthly_trends,
            top_creditors=top_creditors,
            amount_recovered=amount_recovered
        )

    def get_flag_effectiveness(self) -> Dict[str, Dict]:
        """Analyze which flags are most effective for successful disputes."""
        flag_stats = defaultdict(lambda: {'total': 0, 'success': 0})

        for o in self._data['outcomes']:
            for flag in o.get('flags_triggered', []):
                flag_stats[flag]['total'] += 1
                if o['outcome'] in [DisputeOutcome.DELETED.value, DisputeOutcome.CORRECTED.value]:
                    flag_stats[flag]['success'] += 1

        return {
            flag: {
                'total': data['total'],
                'success_rate': (data['success'] / data['total'] * 100) if data['total'] > 0 else 0
            }
            for flag, data in flag_stats.items()
        }

    def export_report(self, format: str = 'json') -> str:
        """Export analytics report."""
        summary = self.get_summary()

        if format == 'json':
            return json.dumps(asdict(summary), indent=2)
        elif format == 'csv':
            lines = [
                "Metric,Value",
                f"Total Disputes,{summary.total_disputes}",
                f"Success Rate,{summary.success_rate:.1f}%",
                f"Avg Resolution Days,{summary.avg_resolution_days:.1f}",
                f"Amount Recovered,${summary.amount_recovered:,.2f}",
                "",
                "Bureau,Total,Success Rate,Avg Days"
            ]
            for bureau, stats in summary.by_bureau.items():
                lines.append(f"{bureau},{stats['total']},{stats['success_rate']:.1f}%,{stats['avg_resolution_days']:.1f}")
            return '\n'.join(lines)

        return ""


def render_analytics_dashboard(st):
    """Render the analytics dashboard in Streamlit."""
    manager = AnalyticsManager()

    st.title("Dispute Outcome Analytics")
    st.markdown("Track dispute success rates and identify patterns for improved outcomes.")

    # Date filters
    col1, col2 = st.columns(2)
    with col1:
        date_from = st.date_input("From Date", value=datetime.now() - timedelta(days=365))
    with col2:
        date_to = st.date_input("To Date", value=datetime.now())

    summary = manager.get_summary(
        date_from=datetime.combine(date_from, datetime.min.time()),
        date_to=datetime.combine(date_to, datetime.max.time())
    )

    # Key metrics
    st.markdown("### Key Performance Indicators")
    col1, col2, col3, col4 = st.columns(4)

    col1.metric(
        "Total Disputes",
        summary.total_disputes
    )
    col2.metric(
        "Success Rate",
        f"{summary.success_rate:.1f}%",
        delta=f"+{summary.success_rate - 50:.1f}%" if summary.success_rate > 50 else None
    )
    col3.metric(
        "Avg Resolution",
        f"{summary.avg_resolution_days:.0f} days"
    )
    col4.metric(
        "Amount Recovered",
        f"${summary.amount_recovered:,.0f}"
    )

    # Tabs for different views
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "Bureau Analysis", "Reason Analysis", "Trends", "Top Creditors", "Record Outcome"
    ])

    with tab1:
        st.subheader("Success Rate by Bureau")
        if summary.by_bureau:
            for bureau, stats in summary.by_bureau.items():
                col1, col2, col3 = st.columns([2, 1, 1])
                with col1:
                    st.markdown(f"**{bureau}**")
                with col2:
                    color = "green" if stats['success_rate'] >= 60 else "orange" if stats['success_rate'] >= 40 else "red"
                    st.markdown(f":{color}[{stats['success_rate']:.1f}% success]")
                with col3:
                    st.markdown(f"{stats['total']} disputes")

                st.progress(stats['success_rate'] / 100)
        else:
            st.info("No bureau data available yet.")

    with tab2:
        st.subheader("Success Rate by Dispute Reason")
        if summary.by_reason:
            # Sort by success rate
            sorted_reasons = sorted(
                summary.by_reason.items(),
                key=lambda x: x[1]['success_rate'],
                reverse=True
            )

            for reason, stats in sorted_reasons:
                display_reason = reason.replace('_', ' ').title()
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.markdown(f"**{display_reason}**")
                    st.progress(stats['success_rate'] / 100)
                with col2:
                    st.markdown(f"{stats['success_rate']:.1f}%")
                    st.caption(f"({stats['total']} cases)")
        else:
            st.info("No reason data available yet.")

    with tab3:
        st.subheader("Monthly Trends")
        if summary.monthly_trends:
            # Simple text-based chart
            st.markdown("**Disputes per Month**")
            for trend in summary.monthly_trends[-12:]:  # Last 12 months
                bar_length = int(trend['total'] / max(t['total'] for t in summary.monthly_trends) * 20) if summary.monthly_trends else 0
                bar = "█" * bar_length
                st.markdown(f"`{trend['month']}` {bar} {trend['total']} ({trend['success_rate']:.0f}% success)")
        else:
            st.info("No trend data available yet.")

    with tab4:
        st.subheader("Most Disputed Creditors")
        if summary.top_creditors:
            for i, cred in enumerate(summary.top_creditors, 1):
                st.markdown(f"{i}. **{cred['creditor']}** - {cred['count']} disputes")
        else:
            st.info("No creditor data available yet.")

    with tab5:
        st.subheader("Record New Outcome")

        with st.form("record_outcome_form"):
            case_id = st.text_input("Case ID", placeholder="DRA-20240115-ABC123")

            col1, col2 = st.columns(2)
            with col1:
                bureau = st.selectbox("Bureau", ["Experian", "Equifax", "TransUnion"])
                dispute_date = st.date_input("Dispute Sent Date")
            with col2:
                creditor = st.text_input("Creditor/Collector Name")
                resolution_date = st.date_input("Resolution Date (if resolved)")

            dispute_reason = st.selectbox(
                "Dispute Reason",
                [r.value for r in DisputeReason],
                format_func=lambda x: x.replace('_', ' ').title()
            )

            outcome = st.selectbox(
                "Outcome",
                [o.value for o in DisputeOutcome],
                format_func=lambda x: x.replace('_', ' ').title()
            )

            amount = st.number_input("Account Amount ($)", min_value=0.0, step=100.0)
            notes = st.text_area("Notes")

            submitted = st.form_submit_button("Record Outcome", type="primary")

            if submitted and case_id and creditor:
                manager.record_outcome(
                    case_id=case_id,
                    bureau=bureau,
                    creditor=creditor,
                    dispute_reason=DisputeReason(dispute_reason),
                    outcome=DisputeOutcome(outcome),
                    dispute_date=datetime.combine(dispute_date, datetime.min.time()),
                    resolution_date=datetime.combine(resolution_date, datetime.min.time()) if resolution_date else None,
                    amount=amount,
                    notes=notes
                )
                st.success("Outcome recorded successfully!")
                st.rerun()

    # Export options
    st.markdown("---")
    st.subheader("Export Report")
    col1, col2 = st.columns(2)

    with col1:
        if st.button("Export as JSON"):
            report = manager.export_report('json')
            st.download_button(
                "Download JSON Report",
                data=report,
                file_name=f"analytics_report_{datetime.now().strftime('%Y%m%d')}.json",
                mime="application/json"
            )

    with col2:
        if st.button("Export as CSV"):
            report = manager.export_report('csv')
            st.download_button(
                "Download CSV Report",
                data=report,
                file_name=f"analytics_report_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv"
            )

    # Flag effectiveness (for advanced users)
    with st.expander("Advanced: Flag Effectiveness Analysis"):
        flag_stats = manager.get_flag_effectiveness()
        if flag_stats:
            st.markdown("**Which detection flags lead to successful disputes?**")
            sorted_flags = sorted(
                flag_stats.items(),
                key=lambda x: x[1]['success_rate'],
                reverse=True
            )
            for flag, stats in sorted_flags:
                st.markdown(f"- **{flag}**: {stats['success_rate']:.1f}% success rate ({stats['total']} cases)")
        else:
            st.info("No flag data available yet. Record outcomes with associated flags to see this analysis.")
