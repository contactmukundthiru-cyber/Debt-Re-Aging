import pytest
import os
import json
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch
from app.deadlines import DeadlineManager, DeadlineType, DeadlineStatus

@pytest.fixture
def temp_deadlines_dir(tmp_path):
    deadlines_file = tmp_path / "deadlines" / "deadlines.json"
    deadlines_file.parent.mkdir(parents=True)
    with open(deadlines_file, 'w') as f:
        json.dump({'deadlines': []}, f)
    return deadlines_file

def test_deadline_manager_init(temp_deadlines_dir):
    with patch("app.deadlines.DEADLINES_FILE", temp_deadlines_dir):
        manager = DeadlineManager()
        assert manager._data == {'deadlines': []}

def test_create_deadline(temp_deadlines_dir):
    with patch("app.deadlines.DEADLINES_FILE", temp_deadlines_dir):
        manager = DeadlineManager()
        due = datetime.now() + timedelta(days=30)
        dl = manager.create_deadline(
            case_id="C1",
            deadline_type=DeadlineType.BUREAU_RESPONSE,
            title="Test DL",
            due_date=due
        )
        assert dl.case_id == "C1"
        assert dl.status == DeadlineStatus.PENDING.value
        assert len(manager._data['deadlines']) == 1

def test_complete_deadline(temp_deadlines_dir):
    with patch("app.deadlines.DEADLINES_FILE", temp_deadlines_dir):
        manager = DeadlineManager()
        due = datetime.now() + timedelta(days=30)
        dl = manager.create_deadline("C1", DeadlineType.BUREAU_RESPONSE, "Test", due)
        
        success = manager.complete_deadline(dl.deadline_id, notes="Done")
        assert success is True
        
        updated = manager.get_deadline(dl.deadline_id)
        assert updated['status'] == DeadlineStatus.COMPLETED.value
        assert updated['notes'] == "Done"

def test_get_upcoming_deadlines(temp_deadlines_dir):
    with patch("app.deadlines.DEADLINES_FILE", temp_deadlines_dir):
        manager = DeadlineManager()
        # Due in 2 days (upcoming)
        manager.create_deadline("C1", DeadlineType.BUREAU_RESPONSE, "Soon", datetime.now() + timedelta(days=2))
        # Due in 20 days (not upcoming within 7 days)
        manager.create_deadline("C1", DeadlineType.BUREAU_RESPONSE, "Far", datetime.now() + timedelta(days=20))
        
        upcoming = manager.get_upcoming_deadlines(days=7)
        assert len(upcoming) == 1
        assert upcoming[0]['title'] == "Soon"

def test_get_overdue_deadlines(temp_deadlines_dir):
    with patch("app.deadlines.DEADLINES_FILE", temp_deadlines_dir):
        manager = DeadlineManager()
        # Past due
        manager.create_deadline("C1", DeadlineType.BUREAU_RESPONSE, "Old", datetime.now() - timedelta(days=5))
        
        overdue = manager.get_overdue_deadlines()
        assert len(overdue) == 1
        assert overdue[0]['title'] == "Old"

def test_create_bureau_dispute_deadline(temp_deadlines_dir):
    with patch("app.deadlines.DEADLINES_FILE", temp_deadlines_dir):
        manager = DeadlineManager()
        dl = manager.create_bureau_dispute_deadline("C1", "Experian")
        assert "Experian" in dl.title
        due_date = datetime.fromisoformat(dl.due_date)
        assert (due_date - datetime.now()).days >= 29

def test_get_reminders(temp_deadlines_dir):
    with patch("app.deadlines.DEADLINES_FILE", temp_deadlines_dir):
        manager = DeadlineManager()
        # Due today (0 days until)
        manager.create_deadline("C1", DeadlineType.FOLLOW_UP, "Due Today", datetime.now())
        
        reminders = manager.get_reminders()
        assert len(reminders) == 1
        assert reminders[0].urgency == 'critical'

def test_get_statistics(temp_deadlines_dir):
    with patch("app.deadlines.DEADLINES_FILE", temp_deadlines_dir):
        manager = DeadlineManager()
        manager.create_deadline("C1", DeadlineType.FOLLOW_UP, "T1", datetime.now() + timedelta(days=1))
        
        stats = manager.get_statistics()
        assert stats['total'] == 1
        assert stats['pending'] == 1
