"""
Audit Logging Module
Tracks all actions and changes for compliance and transparency

Provides a complete audit trail of what was extracted, edited, and generated.
"""

import json
import os
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, asdict, field
from typing import List, Dict, Any, Optional
from enum import Enum
import hashlib


# Audit log directory
AUDIT_DIR = Path(__file__).parent.parent / 'output' / 'audit'


class AuditAction(Enum):
    """Types of auditable actions."""
    CASE_STARTED = "case_started"
    FILE_UPLOADED = "file_uploaded"
    TEXT_EXTRACTED = "text_extracted"
    TEXT_EDITED = "text_edited"
    FIELDS_PARSED = "fields_parsed"
    FIELD_EDITED = "field_edited"
    RULES_EXECUTED = "rules_executed"
    PACKET_GENERATED = "packet_generated"
    FILE_EXPORTED = "file_exported"
    CASE_COMPLETED = "case_completed"
    SETTINGS_CHANGED = "settings_changed"
    ERROR_OCCURRED = "error_occurred"


@dataclass
class AuditEntry:
    """A single audit log entry."""
    timestamp: str
    action: str
    case_id: str
    details: Dict[str, Any] = field(default_factory=dict)
    user_id: str = "local_user"  # For future multi-user support
    session_id: str = ""
    ip_address: str = "127.0.0.1"  # Always local


@dataclass
class FieldChange:
    """Record of a field value change."""
    field_name: str
    original_value: Any
    new_value: Any
    change_reason: str = "manual_edit"
    timestamp: str = ""


@dataclass
class CaseAuditLog:
    """Complete audit log for a single case."""
    case_id: str
    created_at: str
    entries: List[AuditEntry] = field(default_factory=list)
    field_changes: List[FieldChange] = field(default_factory=list)
    file_hash: str = ""  # Hash of uploaded file for integrity verification
    extraction_method: str = ""
    extraction_quality: float = 0.0
    original_fields: Dict[str, Any] = field(default_factory=dict)
    final_fields: Dict[str, Any] = field(default_factory=dict)
    flags_identified: List[str] = field(default_factory=list)
    packet_generated: bool = False
    completed_at: str = ""


def ensure_audit_dir():
    """Ensure the audit directory exists."""
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)


def compute_file_hash(file_bytes: bytes) -> str:
    """Compute SHA-256 hash of file for integrity verification."""
    return hashlib.sha256(file_bytes).hexdigest()


class AuditLogger:
    """Manages audit logging for a case."""

    def __init__(self, case_id: str):
        self.case_id = case_id
        self.log = CaseAuditLog(
            case_id=case_id,
            created_at=datetime.now().isoformat()
        )
        self._session_id = hashlib.md5(
            f"{case_id}_{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

    def _add_entry(self, action: AuditAction, details: Dict[str, Any] = None):
        """Add an entry to the audit log."""
        entry = AuditEntry(
            timestamp=datetime.now().isoformat(),
            action=action.value,
            case_id=self.case_id,
            details=details or {},
            session_id=self._session_id
        )
        self.log.entries.append(entry)

    def log_case_started(self):
        """Log case initiation."""
        self._add_entry(AuditAction.CASE_STARTED)

    def log_file_uploaded(self, filename: str, file_bytes: bytes, file_type: str):
        """Log file upload with hash for integrity."""
        file_hash = compute_file_hash(file_bytes)
        self.log.file_hash = file_hash
        self._add_entry(AuditAction.FILE_UPLOADED, {
            'filename': filename,
            'file_type': file_type,
            'file_size_bytes': len(file_bytes),
            'file_hash': file_hash
        })

    def log_extraction(self, method: str, quality_score: float, text_preview: str):
        """Log text extraction results."""
        self.log.extraction_method = method
        self.log.extraction_quality = quality_score
        self._add_entry(AuditAction.TEXT_EXTRACTED, {
            'method': method,
            'quality_score': quality_score,
            'text_length': len(text_preview),
            'text_preview': text_preview[:200] + "..." if len(text_preview) > 200 else text_preview
        })

    def log_text_edited(self, original_length: int, new_length: int):
        """Log when user edits extracted text."""
        self._add_entry(AuditAction.TEXT_EDITED, {
            'original_length': original_length,
            'new_length': new_length,
            'change_delta': new_length - original_length
        })

    def log_fields_parsed(self, fields: Dict[str, Any]):
        """Log initial field parsing results."""
        self.log.original_fields = fields.copy()
        field_summary = {
            k: {'value': v.get('value'), 'confidence': v.get('confidence')}
            for k, v in fields.items()
        }
        self._add_entry(AuditAction.FIELDS_PARSED, {
            'fields_extracted': list(fields.keys()),
            'field_summary': field_summary
        })

    def log_field_edited(self, field_name: str, original_value: Any,
                        new_value: Any, reason: str = "manual_edit"):
        """Log when a field value is manually changed."""
        change = FieldChange(
            field_name=field_name,
            original_value=original_value,
            new_value=new_value,
            change_reason=reason,
            timestamp=datetime.now().isoformat()
        )
        self.log.field_changes.append(change)
        self._add_entry(AuditAction.FIELD_EDITED, {
            'field_name': field_name,
            'original_value': str(original_value),
            'new_value': str(new_value),
            'reason': reason
        })

    def log_rules_executed(self, flags: List[Dict[str, Any]]):
        """Log rule execution and flags found."""
        self.log.flags_identified = [f.get('rule_id', 'unknown') for f in flags]
        self._add_entry(AuditAction.RULES_EXECUTED, {
            'flags_count': len(flags),
            'flag_ids': self.log.flags_identified,
            'flag_severities': [f.get('severity', 'unknown') for f in flags]
        })

    def log_packet_generated(self, output_dir: str, files_generated: List[str]):
        """Log packet generation."""
        self.log.packet_generated = True
        self._add_entry(AuditAction.PACKET_GENERATED, {
            'output_directory': output_dir,
            'files_generated': files_generated,
            'files_count': len(files_generated)
        })

    def log_file_exported(self, filename: str, export_format: str):
        """Log individual file export."""
        self._add_entry(AuditAction.FILE_EXPORTED, {
            'filename': filename,
            'format': export_format
        })

    def log_error(self, error_type: str, error_message: str, context: Dict = None):
        """Log an error occurrence."""
        self._add_entry(AuditAction.ERROR_OCCURRED, {
            'error_type': error_type,
            'error_message': error_message,
            'context': context or {}
        })

    def complete_case(self, final_fields: Dict[str, Any]):
        """Mark case as complete and finalize audit log."""
        self.log.final_fields = final_fields
        self.log.completed_at = datetime.now().isoformat()
        self._add_entry(AuditAction.CASE_COMPLETED, {
            'total_field_changes': len(self.log.field_changes),
            'total_flags': len(self.log.flags_identified),
            'packet_generated': self.log.packet_generated
        })

    def save(self) -> str:
        """Save the audit log to disk."""
        ensure_audit_dir()
        log_file = AUDIT_DIR / f"{self.case_id}_audit.json"

        # Convert to serializable format
        log_data = {
            'case_id': self.log.case_id,
            'created_at': self.log.created_at,
            'completed_at': self.log.completed_at,
            'file_hash': self.log.file_hash,
            'extraction_method': self.log.extraction_method,
            'extraction_quality': self.log.extraction_quality,
            'original_fields': self.log.original_fields,
            'final_fields': self.log.final_fields,
            'flags_identified': self.log.flags_identified,
            'packet_generated': self.log.packet_generated,
            'entries': [asdict(e) for e in self.log.entries],
            'field_changes': [asdict(c) for c in self.log.field_changes]
        }

        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2)

        return str(log_file)

    def get_summary(self) -> Dict[str, Any]:
        """Get a summary of the audit log for display."""
        return {
            'case_id': self.case_id,
            'total_actions': len(self.log.entries),
            'field_changes': len(self.log.field_changes),
            'flags_identified': len(self.log.flags_identified),
            'extraction_quality': self.log.extraction_quality,
            'packet_generated': self.log.packet_generated,
            'duration_minutes': self._calculate_duration()
        }

    def _calculate_duration(self) -> float:
        """Calculate total processing duration in minutes."""
        if not self.log.entries:
            return 0.0
        try:
            start = datetime.fromisoformat(self.log.entries[0].timestamp)
            end = datetime.fromisoformat(self.log.entries[-1].timestamp)
            return (end - start).total_seconds() / 60
        except:
            return 0.0

    def get_field_change_report(self) -> str:
        """Generate a readable report of field changes."""
        if not self.log.field_changes:
            return "No fields were manually edited."

        lines = ["## Field Change Report", ""]
        for change in self.log.field_changes:
            lines.append(f"### {change.field_name}")
            lines.append(f"- **Original:** {change.original_value or '(empty)'}")
            lines.append(f"- **Changed to:** {change.new_value or '(empty)'}")
            lines.append(f"- **Reason:** {change.change_reason}")
            lines.append(f"- **Time:** {change.timestamp}")
            lines.append("")

        return "\n".join(lines)


def load_audit_log(case_id: str) -> Optional[CaseAuditLog]:
    """Load an existing audit log by case ID."""
    log_file = AUDIT_DIR / f"{case_id}_audit.json"
    if not log_file.exists():
        return None

    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        log = CaseAuditLog(
            case_id=data['case_id'],
            created_at=data['created_at'],
            completed_at=data.get('completed_at', ''),
            file_hash=data.get('file_hash', ''),
            extraction_method=data.get('extraction_method', ''),
            extraction_quality=data.get('extraction_quality', 0.0),
            original_fields=data.get('original_fields', {}),
            final_fields=data.get('final_fields', {}),
            flags_identified=data.get('flags_identified', []),
            packet_generated=data.get('packet_generated', False)
        )

        for entry_data in data.get('entries', []):
            log.entries.append(AuditEntry(**entry_data))

        for change_data in data.get('field_changes', []):
            log.field_changes.append(FieldChange(**change_data))

        return log
    except Exception as e:
        print(f"Error loading audit log: {e}")
        return None


def get_recent_audit_logs(limit: int = 10) -> List[Dict[str, Any]]:
    """Get summaries of recent audit logs."""
    ensure_audit_dir()
    logs = []

    audit_files = sorted(
        AUDIT_DIR.glob("*_audit.json"),
        key=lambda x: x.stat().st_mtime,
        reverse=True
    )[:limit]

    for log_file in audit_files:
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logs.append({
                'case_id': data['case_id'],
                'created_at': data['created_at'],
                'completed_at': data.get('completed_at', ''),
                'flags_count': len(data.get('flags_identified', [])),
                'changes_count': len(data.get('field_changes', []))
            })
        except:
            continue

    return logs


def render_audit_viewer(st, case_id: str):
    """Render the audit log viewer in Streamlit."""
    log = load_audit_log(case_id)

    if not log:
        st.warning(f"No audit log found for case {case_id}")
        return

    st.subheader(f"Audit Log: {case_id}")

    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Actions Logged", len(log.entries))
    col2.metric("Field Changes", len(log.field_changes))
    col3.metric("Flags Found", len(log.flags_identified))
    col4.metric("Quality Score", f"{log.extraction_quality:.0f}/100")

    # Tabs for different views
    tab1, tab2, tab3 = st.tabs(["Timeline", "Field Changes", "Raw Data"])

    with tab1:
        st.markdown("### Action Timeline")
        for entry in log.entries:
            with st.expander(f"{entry.timestamp[:19]} - {entry.action}"):
                st.json(entry.details)

    with tab2:
        st.markdown("### Field Change History")
        if log.field_changes:
            for change in log.field_changes:
                st.markdown(f"""
                **{change.field_name}**
                - Original: `{change.original_value or '(empty)'}`
                - New: `{change.new_value or '(empty)'}`
                - Changed at: {change.timestamp[:19]}
                """)
        else:
            st.info("No fields were manually edited in this case.")

    with tab3:
        st.markdown("### Original vs Final Fields")
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Original (Extracted)**")
            st.json(log.original_fields)
        with col2:
            st.markdown("**Final (User-Verified)**")
            st.json(log.final_fields)
