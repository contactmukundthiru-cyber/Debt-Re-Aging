import pytest
from app.metro2 import Metro2BaseSegment, Metro2Validator

def test_metro2_parsing():
    # Construct a dummy 426-character line
    # Positions based on app/metro2.py mapping
    line = [" "] * 426
    line[0:4] = "BLCK"
    line[4:8] = "RECD"
    line[8:9] = "P"
    line[9:17] = "20240115"
    line[21:51] = "ACCT1234567890".ljust(30)
    line[51:52] = "P"
    line[52:54] = "01"
    line[54:62] = "01012020"
    line[102:104] = "97"
    line = "".join(line)
    
    segment = Metro2BaseSegment.from_line(line)
    assert segment.account_number == "ACCT1234567890"
    assert segment.date_opened == "01012020"
    assert segment.account_status == "97"

def test_metro2_validator_dofd_before_open():
    segment = Metro2BaseSegment(
        block_descriptor="", record_descriptor="", processing_indicator="",
        timestamp="", account_number="", portfolio_type="", account_type="",
        date_opened="01012020",
        credit_limit="", highest_credit="", terms_duration="", terms_frequency="",
        scheduled_payment="", actual_payment="", account_status="97",
        payment_rating="", payment_history_profile="", special_comment="",
        current_balance="", amount_past_due="", original_charge_off_amount="",
        date_account_information="01152024",
        date_first_delinquency="01012019", # BEFORE opened
        date_closed="", date_last_payment=""
    )
    validator = Metro2Validator()
    violations = validator.validate_segment(segment)
    assert any(v["id"] == "M2_01" for v in violations)

def test_metro2_validator_missing_dofd():
    segment = Metro2BaseSegment(
        block_descriptor="", record_descriptor="", processing_indicator="",
        timestamp="", account_number="", portfolio_type="", account_type="",
        date_opened="01012020",
        credit_limit="", highest_credit="", terms_duration="", terms_frequency="",
        scheduled_payment="", actual_payment="", account_status="97", # Collection
        payment_rating="", payment_history_profile="", special_comment="",
        current_balance="", amount_past_due="", original_charge_off_amount="",
        date_account_information="01152024",
        date_first_delinquency="", # MISSING
        date_closed="", date_last_payment=""
    )
    validator = Metro2Validator()
    violations = validator.validate_segment(segment)
    assert any(v["id"] == "M2_02" for v in violations)

def test_metro2_validator_future_date():
    segment = Metro2BaseSegment(
        block_descriptor="", record_descriptor="", processing_indicator="",
        timestamp="", account_number="", portfolio_type="", account_type="",
        date_opened="01012020",
        credit_limit="", highest_credit="", terms_duration="", terms_frequency="",
        scheduled_payment="", actual_payment="", account_status="01",
        payment_rating="", payment_history_profile="", special_comment="",
        current_balance="", amount_past_due="", original_charge_off_amount="",
        date_account_information="01012099", # FUTURE
        date_first_delinquency="", date_closed="", date_last_payment=""
    )
    validator = Metro2Validator()
    violations = validator.validate_segment(segment)
    assert any(v["id"] == "M2_03" for v in violations)
