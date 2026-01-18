import pytest
from app.state_sol import get_state_sol, check_sol_expired, get_all_states, get_sol_summary

def test_get_state_sol_valid():
    sol = get_state_sol("NY")
    assert sol.state == "New York"
    assert sol.written_contracts == 6

def test_get_state_sol_invalid():
    assert get_state_sol("ZZ") is None

def test_check_sol_expired_expired():
    # 10 years ago should be expired in NY (6 years limit)
    is_expired, years, explanation = check_sol_expired("NY", "2010-01-01")
    assert is_expired is True
    assert years == 6
    assert "may have expired" in explanation

def test_check_sol_expired_not_expired():
    # 1 year ago should NOT be expired
    is_expired, years, explanation = check_sol_expired("NY", "2023-01-01")
    assert is_expired is False
    assert years == 6

def test_check_sol_expired_invalid_state():
    is_expired, years, explanation = check_sol_expired("ZZ", "2020-01-01")
    assert is_expired is False
    assert years is None
    assert "not found" in explanation

def test_check_sol_expired_invalid_date():
    is_expired, years, explanation = check_sol_expired("NY", "invalid-date")
    assert is_expired is False
    assert years is None
    assert "Invalid date" in explanation

def test_get_all_states():
    states = get_all_states()
    assert "NY" in states
    assert states["NY"] == "New York"
    assert len(states) >= 50

def test_get_sol_summary():
    summary = get_sol_summary("CA")
    assert "California" in summary
    assert "Written Contracts: 4 years" in summary
    assert get_sol_summary("ZZ") is None
