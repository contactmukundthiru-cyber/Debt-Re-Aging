"""
Deadline Tracking Module
Track dispute deadlines and generate reminders

Manages the 30-day investigation period and follow-up tasks.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict, field
from enum import Enum
import calendar


# Storage
DEADLINES_FILE = Path(__file__).parent.parent / 'output' / 'deadlines' / 'deadlines.json'


class DeadlineType(Enum):
    """Types of deadlines."""
    BUREAU_RESPONSE = "bureau_response"  # 30 days for bureau to investigate
    FURNISHER_RESPONSE = "furnisher_response"  # 30 days for furnisher
    DEBT_VALIDATION = "debt_validation"  # 30 days to send validation request
    FOLLOW_UP = "follow_up"  # User-defined follow-up
    SOL_EXPIRY = "sol_expiry"  # Statute of limitations
    REMOVAL_DATE = "removal_date"  # Credit report removal date
    CUSTOM = "custom"


class DeadlineStatus(Enum):
    """Status of a deadline."""
    PENDING = "pending"
    UPCOMING = "upcoming"  # Within 7 days
    OVERDUE = "overdue"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class Deadline:
    """A single deadline entry."""
    deadline_id: str
    case_id: str
    deadline_type: str
    title: str
    description: str
    due_date: str  # ISO format
    created_at: str
    status: str = DeadlineStatus.PENDING.value
    completed_at: Optional[str] = None
    reminder_days: List[int] = field(default_factory=lambda: [7, 3, 1])
    notes: str = ""
    recipient: str = ""  # Bureau or collector name


@dataclass
class Reminder:
    """A reminder notification."""
    deadline_id: str
    case_id: str
    title: str
    due_date: str
    days_until: int
    urgency: str  # low, medium, high, critical


def ensure_deadlines_dir():
    """Ensure the deadlines directory exists."""
    DEADLINES_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DEADLINES_FILE.exists():
        with open(DEADLINES_FILE, 'w') as f:
            json.dump({'deadlines': []}, f)


class DeadlineManager:
    """Manages deadline tracking and reminders."""

    def __init__(self):
        ensure_deadlines_dir()
        self._load()

    def _load(self):
        """Load deadlines from file."""
        with open(DEADLINES_FILE, 'r') as f:
            self._data = json.load(f)

    def _save(self):
        """Save deadlines to file."""
        with open(DEADLINES_FILE, 'w') as f:
            json.dump(self._data, f, indent=2)

    def _generate_id(self) -> str:
        """Generate a unique deadline ID."""
        import secrets
        return f"DL_{secrets.token_hex(6).upper()}"

    def create_deadline(
        self,
        case_id: str,
        deadline_type: DeadlineType,
        title: str,
        due_date: datetime,
        description: str = "",
        recipient: str = "",
        reminder_days: List[int] = None
    ) -> Deadline:
        """Create a new deadline."""
        deadline = Deadline(
            deadline_id=self._generate_id(),
            case_id=case_id,
            deadline_type=deadline_type.value,
            title=title,
            description=description,
            due_date=due_date.isoformat(),
            created_at=datetime.now().isoformat(),
            reminder_days=reminder_days or [7, 3, 1],
            recipient=recipient
        )

        self._data['deadlines'].append(asdict(deadline))
        self._save()
        return deadline

    def create_bureau_dispute_deadline(
        self,
        case_id: str,
        bureau: str,
        dispute_sent_date: datetime = None
    ) -> Deadline:
        """Create a 30-day bureau response deadline."""
        if not dispute_sent_date:
            dispute_sent_date = datetime.now()

        due_date = dispute_sent_date + timedelta(days=30)

        return self.create_deadline(
            case_id=case_id,
            deadline_type=DeadlineType.BUREAU_RESPONSE,
            title=f"{bureau} Investigation Deadline",
            due_date=due_date,
            description=f"Under FCRA, {bureau} must complete their investigation within 30 days of receiving your dispute.",
            recipient=bureau,
            reminder_days=[7, 3, 1, 0]  # Also remind on the day
        )

    def create_debt_validation_deadline(
        self,
        case_id: str,
        collector: str,
        first_contact_date: datetime = None
    ) -> Deadline:
        """Create a 30-day debt validation request deadline."""
        if not first_contact_date:
            first_contact_date = datetime.now()

        due_date = first_contact_date + timedelta(days=30)

        return self.create_deadline(
            case_id=case_id,
            deadline_type=DeadlineType.DEBT_VALIDATION,
            title=f"Debt Validation Deadline - {collector}",
            due_date=due_date,
            description="You have 30 days from first contact to request debt validation. After this period, you can still request validation but the collector doesn't have to stop collection activities.",
            recipient=collector,
            reminder_days=[14, 7, 3, 1]
        )

    def create_follow_up_reminder(
        self,
        case_id: str,
        title: str,
        days_from_now: int,
        description: str = ""
    ) -> Deadline:
        """Create a custom follow-up reminder."""
        due_date = datetime.now() + timedelta(days=days_from_now)

        return self.create_deadline(
            case_id=case_id,
            deadline_type=DeadlineType.FOLLOW_UP,
            title=title,
            due_date=due_date,
            description=description,
            reminder_days=[3, 1, 0]
        )

    def get_deadline(self, deadline_id: str) -> Optional[Dict]:
        """Get a deadline by ID."""
        for dl in self._data['deadlines']:
            if dl['deadline_id'] == deadline_id:
                return dl
        return None

    def get_case_deadlines(self, case_id: str) -> List[Dict]:
        """Get all deadlines for a case."""
        return [dl for dl in self._data['deadlines'] if dl['case_id'] == case_id]

    def get_upcoming_deadlines(self, days: int = 7) -> List[Dict]:
        """Get deadlines due within N days."""
        cutoff = (datetime.now() + timedelta(days=days)).isoformat()
        now = datetime.now().isoformat()

        return [
            dl for dl in self._data['deadlines']
            if dl['status'] == DeadlineStatus.PENDING.value
            and dl['due_date'] <= cutoff
            and dl['due_date'] >= now
        ]

    def get_overdue_deadlines(self) -> List[Dict]:
        """Get all overdue deadlines."""
        now = datetime.now().isoformat()
        return [
            dl for dl in self._data['deadlines']
            if dl['status'] == DeadlineStatus.PENDING.value
            and dl['due_date'] < now
        ]

    def complete_deadline(self, deadline_id: str, notes: str = "") -> bool:
        """Mark a deadline as completed."""
        for dl in self._data['deadlines']:
            if dl['deadline_id'] == deadline_id:
                dl['status'] = DeadlineStatus.COMPLETED.value
                dl['completed_at'] = datetime.now().isoformat()
                dl['notes'] = notes
                self._save()
                return True
        return False

    def cancel_deadline(self, deadline_id: str, reason: str = "") -> bool:
        """Cancel a deadline."""
        for dl in self._data['deadlines']:
            if dl['deadline_id'] == deadline_id:
                dl['status'] = DeadlineStatus.CANCELLED.value
                dl['notes'] = reason
                self._save()
                return True
        return False

    def update_status(self, deadline_id: str, status: DeadlineStatus) -> bool:
        """Update deadline status."""
        for dl in self._data['deadlines']:
            if dl['deadline_id'] == deadline_id:
                dl['status'] = status.value
                self._save()
                return True
        return False

    def get_reminders(self) -> List[Reminder]:
        """Get all active reminders that should be shown."""
        reminders = []
        now = datetime.now()

        for dl in self._data['deadlines']:
            if dl['status'] != DeadlineStatus.PENDING.value:
                continue

            due_date = datetime.fromisoformat(dl['due_date'])
            days_until = (due_date - now).days

            # Check if we should show a reminder
            if days_until in dl.get('reminder_days', [7, 3, 1]) or days_until <= 0:
                # Determine urgency
                if days_until < 0:
                    urgency = 'critical'
                elif days_until == 0:
                    urgency = 'critical'
                elif days_until <= 3:
                    urgency = 'high'
                elif days_until <= 7:
                    urgency = 'medium'
                else:
                    urgency = 'low'

                reminders.append(Reminder(
                    deadline_id=dl['deadline_id'],
                    case_id=dl['case_id'],
                    title=dl['title'],
                    due_date=dl['due_date'],
                    days_until=days_until,
                    urgency=urgency
                ))

        return reminders

    def get_calendar_events(self, month: int = None, year: int = None) -> List[Dict]:
        """Get deadlines formatted as calendar events."""
        if month is None:
            month = datetime.now().month
        if year is None:
            year = datetime.now().year

        events = []
        for dl in self._data['deadlines']:
            due_date = datetime.fromisoformat(dl['due_date'])
            if due_date.month == month and due_date.year == year:
                events.append({
                    'day': due_date.day,
                    'title': dl['title'],
                    'type': dl['deadline_type'],
                    'status': dl['status'],
                    'case_id': dl['case_id']
                })

        return events

    def get_statistics(self) -> Dict[str, Any]:
        """Get deadline statistics."""
        total = len(self._data['deadlines'])
        pending = len([d for d in self._data['deadlines'] if d['status'] == DeadlineStatus.PENDING.value])
        completed = len([d for d in self._data['deadlines'] if d['status'] == DeadlineStatus.COMPLETED.value])
        overdue = len(self.get_overdue_deadlines())

        return {
            'total': total,
            'pending': pending,
            'completed': completed,
            'overdue': overdue,
            'upcoming_7_days': len(self.get_upcoming_deadlines(7)),
            'completion_rate': (completed / total * 100) if total > 0 else 0
        }


def render_deadline_dashboard(st):
    """Render the deadline tracking dashboard in Streamlit."""
    manager = DeadlineManager()

    st.title("Deadline Tracker")
    st.markdown("Track dispute response deadlines and follow-up tasks.")

    # Reminders banner
    reminders = manager.get_reminders()
    critical_reminders = [r for r in reminders if r.urgency in ['critical', 'high']]

    if critical_reminders:
        st.error(f"⚠️ You have {len(critical_reminders)} urgent deadline(s)!")
        for r in critical_reminders:
            if r.days_until < 0:
                st.markdown(f"- **OVERDUE ({abs(r.days_until)} days)**: {r.title}")
            elif r.days_until == 0:
                st.markdown(f"- **DUE TODAY**: {r.title}")
            else:
                st.markdown(f"- **{r.days_until} day(s)**: {r.title}")

    # Statistics
    stats = manager.get_statistics()
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Deadlines", stats['total'])
    col2.metric("Pending", stats['pending'])
    col3.metric("Overdue", stats['overdue'], delta=-stats['overdue'] if stats['overdue'] > 0 else None)
    col4.metric("Completion Rate", f"{stats['completion_rate']:.0f}%")

    # Tabs
    tab1, tab2, tab3 = st.tabs(["Upcoming", "All Deadlines", "Add New"])

    with tab1:
        st.subheader("Upcoming Deadlines (Next 30 Days)")
        upcoming = manager.get_upcoming_deadlines(30)

        if not upcoming:
            st.info("No upcoming deadlines.")
        else:
            for dl in sorted(upcoming, key=lambda x: x['due_date']):
                due_date = datetime.fromisoformat(dl['due_date'])
                days_until = (due_date - datetime.now()).days

                if days_until <= 3:
                    icon = "🔴"
                elif days_until <= 7:
                    icon = "🟡"
                else:
                    icon = "🟢"

                with st.expander(f"{icon} {dl['title']} - Due {due_date.strftime('%b %d, %Y')} ({days_until} days)"):
                    st.markdown(f"**Case:** {dl['case_id']}")
                    st.markdown(f"**Type:** {dl['deadline_type']}")
                    if dl['recipient']:
                        st.markdown(f"**Recipient:** {dl['recipient']}")
                    st.markdown(f"**Description:** {dl['description']}")

                    if st.button("Mark Complete", key=f"complete_{dl['deadline_id']}"):
                        manager.complete_deadline(dl['deadline_id'])
                        st.success("Marked complete!")
                        st.rerun()

    with tab2:
        st.subheader("All Deadlines")
        status_filter = st.selectbox(
            "Filter by status",
            ["All", "pending", "completed", "overdue", "cancelled"]
        )

        deadlines = manager._data['deadlines']
        if status_filter == "overdue":
            deadlines = manager.get_overdue_deadlines()
        elif status_filter != "All":
            deadlines = [d for d in deadlines if d['status'] == status_filter]

        for dl in sorted(deadlines, key=lambda x: x['due_date'], reverse=True):
            due_date = datetime.fromisoformat(dl['due_date'])
            status_icon = {
                'pending': '⏳',
                'completed': '✅',
                'cancelled': '❌',
                'upcoming': '📅'
            }.get(dl['status'], '❓')

            st.markdown(f"{status_icon} **{dl['title']}** - {due_date.strftime('%b %d, %Y')} ({dl['status']})")

    with tab3:
        st.subheader("Create New Deadline")

        case_id = st.text_input("Case ID", placeholder="e.g., DRA-20240115-ABC123")

        deadline_type = st.selectbox(
            "Deadline Type",
            [t.value for t in DeadlineType]
        )

        title = st.text_input("Title", placeholder="e.g., Experian Investigation Deadline")

        col1, col2 = st.columns(2)
        with col1:
            due_date = st.date_input("Due Date", min_value=datetime.now().date())
        with col2:
            recipient = st.text_input("Recipient (optional)", placeholder="e.g., Experian")

        description = st.text_area("Description", placeholder="Details about this deadline...")

        if st.button("Create Deadline", type="primary"):
            if case_id and title:
                manager.create_deadline(
                    case_id=case_id,
                    deadline_type=DeadlineType(deadline_type),
                    title=title,
                    due_date=datetime.combine(due_date, datetime.min.time()),
                    description=description,
                    recipient=recipient
                )
                st.success("Deadline created!")
                st.rerun()
            else:
                st.error("Please enter Case ID and Title")


def auto_create_dispute_deadlines(case_id: str, bureaus: List[str] = None, collectors: List[str] = None):
    """Automatically create deadlines when a dispute is filed."""
    manager = DeadlineManager()

    if bureaus:
        for bureau in bureaus:
            manager.create_bureau_dispute_deadline(case_id, bureau)

    if collectors:
        for collector in collectors:
            manager.create_debt_validation_deadline(case_id, collector)

    # Add a follow-up reminder for 35 days (5 days after deadline)
    manager.create_follow_up_reminder(
        case_id=case_id,
        title=f"Follow up on dispute - {case_id}",
        days_from_now=35,
        description="If you haven't received a response, consider sending a follow-up letter or filing a CFPB complaint."
    )
