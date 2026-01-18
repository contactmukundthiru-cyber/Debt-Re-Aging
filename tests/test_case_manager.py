import pytest
import os
import json
from pathlib import Path
from unittest.mock import patch
from app.case_manager import (
    CaseManager, CaseData, CaseStatus, generate_case_id,
    save_session_to_case, load_case_to_session
)

@pytest.fixture
def temp_cases_dir(tmp_path):
    cases_dir = tmp_path / "cases"
    cases_dir.mkdir()
    return cases_dir

def test_case_manager_init(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        manager = CaseManager()
        # history_file isn't created until first save
        assert manager._history == {'cases': [], 'stats': {}}

def test_create_and_save_case(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        manager = CaseManager()
        case = manager.create_case(case_id="TEST-001")
        assert case.case_id == "TEST-001"
        assert len(manager._history['cases']) == 1
        
        manager.save_case(case)
        case_file = temp_cases_dir / "TEST-001.json"
        assert case_file.exists()

def test_load_case(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        manager = CaseManager()
        case = manager.create_case(case_id="TEST-002")
        manager.save_case(case)
        
        loaded = manager.load_case("TEST-002")
        assert loaded.case_id == "TEST-002"

def test_list_cases(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        manager = CaseManager()
        manager.create_case(case_id="TEST-1")
        manager.create_case(case_id="TEST-2")
        
        cases = manager.list_cases()
        assert len(cases) == 2

def test_set_case_outcome(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        manager = CaseManager()
        case = manager.create_case(case_id="TEST-3")
        manager.save_case(case)
        
        manager.set_case_outcome("TEST-3", "corrected", "Fixed everything")
        loaded = manager.load_case("TEST-3")
        assert loaded.outcome == "corrected"
        assert loaded.status == CaseStatus.RESOLVED_SUCCESS.value

def test_save_session_to_case(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        
        session = {
            'current_step': 3,
            'extracted_text': 'some text',
            'editable_fields': {'original_creditor': {'value': 'Bank'}},
            'consumer_info': {'name': 'John'}
        }
        case = save_session_to_case(session)
        assert case.consumer_name == 'John'
        assert case.account_creditor == 'Bank'

def test_load_case_to_session(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        manager = CaseManager()
        case = manager.create_case(case_id="LOAD-1")
        case.consumer_name = "Jane"
        manager.save_case(case)
        
        session = {}
        success = load_case_to_session("LOAD-1", session)
        assert success is True
        assert session['consumer_info']['name'] == "Jane"

def test_delete_case(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        manager = CaseManager()
        case = manager.create_case(case_id="TEST-DEL")
        manager.save_case(case)
        
        assert (temp_cases_dir / "TEST-DEL.json").exists()
        manager.delete_case("TEST-DEL")
        assert not (temp_cases_dir / "TEST-DEL.json").exists()
        assert len(manager._history['cases']) == 0

def test_search_cases(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        manager = CaseManager()
        case1 = manager.create_case(case_id="SEARCH-1")
        case1.account_creditor = "Target Bank"
        manager.save_case(case1)
        
        results = manager.search_cases("Target")
        assert len(results) == 1
        assert results[0]['case_id'] == "SEARCH-1"

def test_audit_systemic_violations(temp_cases_dir):
    history_file = temp_cases_dir / "case_history.json"
    with patch("app.case_manager.CASES_DIR", temp_cases_dir), \
         patch("app.case_manager.HISTORY_FILE", history_file):
        manager = CaseManager()
        
        # Need 3 cases for same furnisher to trigger systemic audit
        for i in range(3):
            case = manager.create_case(case_id=f"SYS-{i}")
            case.account_collector = "Bad Collector"
            case.flags = [{"rule_id": "A1", "severity": "high"}]
            manager.save_case(case)
            
        systemic = manager.audit_systemic_violations()
        assert len(systemic) == 1
        assert systemic[0]['furnisher'] == "BAD COLLECTOR"
        assert systemic[0]['total_cases'] == 3
