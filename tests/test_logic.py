import pytest
from app.utils import estimate_removal_date, validate_iso_date, normalize_date
from app.rules import RuleEngine

def test_estimate_removal_date():
    # Regular date
    assert estimate_removal_date("2016-01-01") == "2023-06-30"
    # Leap year / Month end robustness
    assert estimate_removal_date("2016-08-31") == "2024-02-27"
    # End of year
    assert estimate_removal_date("2016-12-31") == "2024-06-28"

def test_fuzzy_bureau_extraction():
    from app.parser import CreditReportParser
    parser = CreditReportParser()
    
    # Test OCR error "Expenan" for "Experian"
    text = "Report from Expenan Credit Bureau"
    parsed = parser.parse(text)
    assert parsed.bureau.value == "Experian"
    assert parsed.bureau.confidence == "Medium"

def test_rule_b1_reaging():
    engine = RuleEngine()
    fields = {
        'dofd': '2015-01-01',
        'date_opened': '2018-01-01'  # 36 months later (> 24 months)
    }
    flags = engine.check_all_rules(fields)
    flag_ids = [f.rule_id for f in flags]
    assert 'B1' in flag_ids

def test_rule_a1_long_timeline():
    engine = RuleEngine()
    fields = {
        'date_opened': '2010-01-01',
        'estimated_removal_date': '2020-01-01'  # 10 years later (> 8 years)
    }
    flags = engine.check_all_rules(fields)
    flag_ids = [f.rule_id for f in flags]
    assert 'A1' in flag_ids

def test_rule_e1_future_date():
    engine = RuleEngine()
    fields = {
        'date_opened': '2099-01-01'
    }
    flags = engine.check_all_rules(fields)
    flag_ids = [f.rule_id for f in flags]
    assert 'E1' in flag_ids

def test_rule_d1_balance_inconsistency():
    engine = RuleEngine()
    fields = {
        'account_status': 'paid',
        'current_balance': '500.00'
    }
    flags = engine.check_all_rules(fields)
    flag_ids = [f.rule_id for f in flags]
    assert 'D1' in flag_ids

def test_rule_s1_sol_expired():
    engine = RuleEngine()
    # California SOL for open accounts is 4 years
    fields = {
        'state_code': 'CA',
        'dofd': '2015-01-01' # 9+ years ago
    }
    flags = engine.check_all_rules(fields)
    flag_ids = [f.rule_id for f in flags]
    assert 'S1' in flag_ids

def test_rule_s1_sol_not_expired():
    engine = RuleEngine()
    # New York SOL is 6 years
    fields = {
        'state_code': 'NY',
        'dofd': '2023-01-01' # ~1 year ago
    }
    flags = engine.check_all_rules(fields)
    flag_ids = [f.rule_id for f in flags]
    assert 'S1' not in flag_ids
