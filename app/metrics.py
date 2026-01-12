"""
Local metrics tracking for the Debt Re-Aging Case Factory.

All metrics are stored locally and never transmitted.
This helps organizations track tool effectiveness.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import hashlib


@dataclass
class CaseMetric:
    """Metrics for a single case."""
    case_id: str
    timestamp: str
    processing_time_seconds: float
    fields_extracted: int
    fields_corrected: int
    flags_identified: int
    flag_types: List[str]
    high_severity_flags: int
    medium_severity_flags: int
    low_severity_flags: int
    bureau: str
    account_type: str
    extraction_method: str
    extraction_quality: int


class MetricsTracker:
    """
    Tracks usage metrics locally for analysis.

    All data is stored in a local JSON file and never transmitted.
    """

    def __init__(self, metrics_dir: str = None):
        """
        Initialize the metrics tracker.

        Args:
            metrics_dir: Directory for metrics storage. Defaults to output/metrics
        """
        if metrics_dir is None:
            metrics_dir = Path(__file__).parent.parent / 'output' / 'metrics'

        self.metrics_dir = Path(metrics_dir)
        self.metrics_dir.mkdir(parents=True, exist_ok=True)

        self.metrics_file = self.metrics_dir / 'metrics.json'
        self._load_metrics()

    def _load_metrics(self):
        """Load existing metrics from file."""
        if self.metrics_file.exists():
            try:
                with open(self.metrics_file, 'r') as f:
                    self.metrics = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.metrics = {'cases': [], 'summary': {}}
        else:
            self.metrics = {'cases': [], 'summary': {}}

    def _save_metrics(self):
        """Save metrics to file."""
        with open(self.metrics_file, 'w') as f:
            json.dump(self.metrics, f, indent=2)

    def record_case(self, case_metric: CaseMetric):
        """
        Record metrics for a completed case.

        Args:
            case_metric: CaseMetric object with case data
        """
        self.metrics['cases'].append(asdict(case_metric))
        self._update_summary()
        self._save_metrics()

    def _update_summary(self):
        """Update aggregate summary statistics."""
        cases = self.metrics['cases']
        if not cases:
            self.metrics['summary'] = {}
            return

        total_cases = len(cases)
        total_flags = sum(c['flags_identified'] for c in cases)
        total_time = sum(c['processing_time_seconds'] for c in cases)

        # Flag type distribution
        flag_distribution = {}
        bureau_distribution = {}
        account_type_distribution = {}
        for case in cases:
            for flag_type in case['flag_types']:
                flag_distribution[flag_type] = flag_distribution.get(flag_type, 0) + 1
            
            b_name = case.get('bureau') or 'Unknown'
            bureau_distribution[b_name] = bureau_distribution.get(b_name, 0) + 1
            
            acc_type = case.get('account_type') or 'Unknown'
            account_type_distribution[acc_type] = account_type_distribution.get(acc_type, 0) + 1

        # Severity distribution
        severity_dist = {
            'high': sum(c['high_severity_flags'] for c in cases),
            'medium': sum(c['medium_severity_flags'] for c in cases),
            'low': sum(c['low_severity_flags'] for c in cases)
        }

        # Extraction quality average
        avg_quality = sum(c['extraction_quality'] for c in cases) / total_cases

        # Cases with flags
        cases_with_flags = sum(1 for c in cases if c['flags_identified'] > 0)

        self.metrics['summary'] = {
            'total_cases': total_cases,
            'total_flags': total_flags,
            'total_processing_time_seconds': total_time,
            'avg_processing_time_seconds': total_time / total_cases,
            'avg_flags_per_case': total_flags / total_cases,
            'cases_with_flags': cases_with_flags,
            'flag_rate_percent': (cases_with_flags / total_cases) * 100,
            'flag_distribution': flag_distribution,
            'bureau_distribution': bureau_distribution,
            'account_type_distribution': account_type_distribution,
            'severity_distribution': severity_dist,
            'avg_extraction_quality': avg_quality,
            'last_updated': datetime.now().isoformat()
        }


    def get_summary(self) -> Dict[str, Any]:
        """Get summary statistics."""
        return self.metrics.get('summary', {})

    def get_all_cases(self) -> List[Dict[str, Any]]:
        """Get all case metrics."""
        return self.metrics.get('cases', [])

    def get_recent_cases(self, n: int = 10) -> List[Dict[str, Any]]:
        """Get the n most recent cases."""
        cases = self.metrics.get('cases', [])
        return cases[-n:] if cases else []

    def export_csv(self, filepath: str = None) -> str:
        """
        Export metrics to CSV format.

        Args:
            filepath: Output path. Defaults to metrics/export.csv

        Returns:
            Path to the exported file
        """
        import csv

        if filepath is None:
            filepath = self.metrics_dir / 'metrics_export.csv'

        cases = self.metrics.get('cases', [])
        if not cases:
            return str(filepath)

        # Get all field names
        fieldnames = list(cases[0].keys())
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for case in cases:
                # Create a copy to avoid modifying the original data
                case_copy = case.copy()
                if isinstance(case_copy.get('flag_types'), list):
                    case_copy['flag_types'] = ','.join(case_copy['flag_types'])
                writer.writerow(case_copy)

        return str(filepath)

    def clear_metrics(self):
        """Clear all metrics (use with caution)."""
        self.metrics = {'cases': [], 'summary': {}}
        self._save_metrics()


def create_case_metric(
    case_id: str,
    start_time: datetime,
    end_time: datetime,
    original_fields: Dict[str, Any],
    edited_fields: Dict[str, Any],
    flags: List[Dict[str, Any]],
    extraction_method: str,
    extraction_quality: int
) -> CaseMetric:
    """
    Create a CaseMetric from case processing data.

    Args:
        case_id: Unique case identifier
        start_time: When processing started
        end_time: When processing completed
        original_fields: Fields as originally extracted
        edited_fields: Fields after user edits
        flags: List of flag dictionaries
        extraction_method: 'ocr', 'embedded_text', or 'sample'
        extraction_quality: Quality score 0-100

    Returns:
        CaseMetric object
    """
    # Calculate processing time
    processing_time = (end_time - start_time).total_seconds()

    # Count extracted and corrected fields
    fields_extracted = sum(1 for v in original_fields.values()
                          if v and v.get('value'))
    fields_corrected = 0
    for key in original_fields:
        orig_val = original_fields.get(key, {}).get('value', '')
        edit_val = edited_fields.get(key, {}).get('value', '')
        if orig_val != edit_val:
            fields_corrected += 1

    # Analyze flags
    flag_types = [f.get('rule_id', 'unknown') for f in flags]
    high_severity = sum(1 for f in flags if f.get('severity') == 'high')
    medium_severity = sum(1 for f in flags if f.get('severity') == 'medium')
    low_severity = sum(1 for f in flags if f.get('severity') == 'low')

    # Get account info
    bureau = edited_fields.get('bureau', {}).get('value', 'Unknown')
    account_type = edited_fields.get('account_type', {}).get('value', 'Unknown')

    return CaseMetric(
        case_id=case_id,
        timestamp=datetime.now().isoformat(),
        processing_time_seconds=processing_time,
        fields_extracted=fields_extracted,
        fields_corrected=fields_corrected,
        flags_identified=len(flags),
        flag_types=flag_types,
        high_severity_flags=high_severity,
        medium_severity_flags=medium_severity,
        low_severity_flags=low_severity,
        bureau=bureau if isinstance(bureau, str) else 'Unknown',
        account_type=account_type if isinstance(account_type, str) else 'Unknown',
        extraction_method=extraction_method,
        extraction_quality=extraction_quality
    )
