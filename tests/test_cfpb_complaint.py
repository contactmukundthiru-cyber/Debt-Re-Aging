import pytest
from app.cfpb_complaint import generate_complaint_narrative, generate_desired_resolution, determine_cfpb_issue

def test_generate_complaint_narrative():
    flags = [
        {'rule_name': 'Re-aging', 'explanation': 'Date manipulated', 'severity': 'high'}
    ]
    fields = {'creditor_name': 'Bank A', 'account_number': '1234567890'}
    consumer = {'name': 'John Doe', 'state': 'NY'}
    
    narrative = generate_complaint_narrative(flags, fields, consumer)
    assert "Bank A" in narrative
    assert "John Doe" in narrative
    assert "re-aging" in narrative.lower()
    assert "XXXX7890" in narrative # masked acct

def test_generate_desired_resolution():
    flags = [{'explanation': 'Re-aging detected'}]
    fields = {}
    res = generate_desired_resolution(flags, fields)
    assert "IMMEDIATE DELETION" in res
    assert "systematic re-aging" in res

def test_determine_cfpb_issue():
    # Date issue
    flags = [{'rule_id': 'B1'}]
    issue, sub = determine_cfpb_issue(flags)
    assert "Incorrect information" in issue
    assert "Old information reappears" in sub
    
    # Status issue
    flags = [{'rule_id': 'D1'}]
    issue, sub = determine_cfpb_issue(flags)
    assert "Account status incorrect" in sub
