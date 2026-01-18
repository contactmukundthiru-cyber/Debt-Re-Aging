import pytest
import os
import json
from datetime import datetime, timedelta
from app.metrics import MetricsTracker, CaseMetric, create_case_metric

@pytest.fixture
def temp_metrics_dir(tmp_path):
    metrics_dir = tmp_path / "metrics"
    metrics_dir.mkdir()
    return str(metrics_dir)

def test_metrics_tracker_init(temp_metrics_dir):
    tracker = MetricsTracker(metrics_dir=temp_metrics_dir)
    assert tracker.metrics_file.name == "metrics.json"
    assert tracker.metrics == {'cases': [], 'summary': {}}

def test_record_case(temp_metrics_dir):
    tracker = MetricsTracker(metrics_dir=temp_metrics_dir)
    metric = CaseMetric(
        case_id="TEST-1",
        timestamp=datetime.now().isoformat(),
        processing_time_seconds=10.5,
        fields_extracted=5,
        fields_corrected=1,
        flags_identified=2,
        flag_types=["A1", "B1"],
        high_severity_flags=1,
        medium_severity_flags=1,
        low_severity_flags=0,
        bureau="Experian",
        account_type="collection",
        extraction_method="ocr",
        extraction_quality=85
    )
    tracker.record_case(metric)
    
    assert len(tracker.metrics['cases']) == 1
    assert tracker.metrics['summary']['total_cases'] == 1
    assert tracker.metrics['summary']['total_flags'] == 2
    assert tracker.metrics['summary']['avg_extraction_quality'] == 85

def test_create_case_metric():
    start = datetime.now() - timedelta(seconds=30)
    end = datetime.now()
    original = {"creditor": {"value": "Bank A"}, "balance": {"value": "100"}}
    edited = {"creditor": {"value": "Bank B"}, "balance": {"value": "100"}}
    flags = [{"rule_id": "A1", "severity": "high"}]
    
    metric = create_case_metric(
        case_id="TEST-2",
        start_time=start,
        end_time=end,
        original_fields=original,
        edited_fields=edited,
        flags=flags,
        extraction_method="pasted",
        extraction_quality=100
    )
    
    assert metric.case_id == "TEST-2"
    assert metric.processing_time_seconds >= 30
    assert metric.fields_extracted == 2
    assert metric.fields_corrected == 1
    assert metric.flags_identified == 1
    assert metric.high_severity_flags == 1

def test_export_csv(temp_metrics_dir):
    tracker = MetricsTracker(metrics_dir=temp_metrics_dir)
    metric = CaseMetric(
        case_id="TEST-1",
        timestamp=datetime.now().isoformat(),
        processing_time_seconds=10.5,
        fields_extracted=5,
        fields_corrected=1,
        flags_identified=2,
        flag_types=["A1", "B1"],
        high_severity_flags=1,
        medium_severity_flags=1,
        low_severity_flags=0,
        bureau="Experian",
        account_type="collection",
        extraction_method="ocr",
        extraction_quality=85
    )
    tracker.record_case(metric)
    csv_path = tracker.export_csv()
    assert os.path.exists(csv_path)
    with open(csv_path, 'r') as f:
        content = f.read()
        assert "TEST-1" in content
        assert "Experian" in content
