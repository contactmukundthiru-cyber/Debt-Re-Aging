import pytest
from app.validation import FieldValidator, ValidationResult, validate_fields, get_validation_summary

def test_validate_date_valid():
    validator = FieldValidator()
    res = validator.validate_date("2023-01-01", "date_opened")
    assert res.is_valid is True
    assert res.severity == "info"

def test_validate_date_invalid_format():
    validator = FieldValidator()
    res = validator.validate_date("01/01/2023", "date_opened")
    assert res.is_valid is False
    assert "format" in res.message

def test_validate_date_future():
    validator = FieldValidator()
    res = validator.validate_date("2099-01-01", "date_opened")
    assert res.is_valid is False
    assert "future" in res.message

def test_validate_account_type():
    validator = FieldValidator()
    assert validator.validate_account_type("collection").is_valid is True
    res = validator.validate_account_type("custom_type")
    assert res.is_valid is True
    assert res.severity == "warning"

def test_validate_bureau():
    validator = FieldValidator()
    assert validator.validate_bureau("Experian").is_valid is True
    assert validator.validate_bureau("Unknown").is_valid is True
    assert validator.validate_bureau("Invalid").is_valid is False

def test_validate_creditor_name():
    validator = FieldValidator()
    assert validator.validate_creditor_name("Bank of America", "creditor").is_valid is True
    assert validator.validate_creditor_name("A", "creditor").is_valid is False # too short
    assert validator.validate_creditor_name("1234567890", "creditor").severity == "warning" # looks like number

def test_validate_date_logic():
    validator = FieldValidator()
    fields = {
        "dofd": "2020-01-01",
        "estimated_removal_date": "2019-01-01" # invalid logic
    }
    results = validator.validate_date_logic(fields)
    assert any(not r.is_valid for r in results)

def test_validate_fields_convenience():
    fields = {
        "date_opened": "2020-01-01",
        "account_type": "collection",
        "bureau": "Experian"
    }
    all_valid, results = validate_fields(fields)
    assert all_valid is True
    assert len(results) > 0

def test_get_validation_summary():
    results = [
        ValidationResult(is_valid=False, message="err", severity="error"),
        ValidationResult(is_valid=True, message="warn", severity="warning"),
        ValidationResult(is_valid=True, message="info", severity="info")
    ]
    summary = get_validation_summary(results)
    assert summary['errors'] == 1
    assert summary['warnings'] == 1
    assert summary['info'] == 1
