"""
Unit tests for credit report parser.
"""

import pytest
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.parser import (
    CreditReportParser,
    parse_credit_report,
    fields_to_editable_dict
)


class TestCreditReportParser:
    """Tests for CreditReportParser class."""

    @pytest.fixture
    def parser(self):
        """Create parser instance."""
        return CreditReportParser()

    def test_extract_bureau_experian(self, parser):
        """Test Experian detection."""
        text = "This report is from Experian Credit Bureau"
        result = parser._extract_bureau(text)
        assert result.value == "Experian"
        assert result.confidence == "High"

    def test_extract_bureau_equifax(self, parser):
        """Test Equifax detection."""
        text = "Equifax Credit Report"
        result = parser._extract_bureau(text)
        assert result.value == "Equifax"
        assert result.confidence == "High"

    def test_extract_bureau_transunion(self, parser):
        """Test TransUnion detection."""
        text = "TransUnion Consumer Report"
        result = parser._extract_bureau(text)
        assert result.value == "TransUnion"
        assert result.confidence == "High"

    def test_extract_bureau_transunion_space(self, parser):
        """Test Trans Union with space."""
        text = "Trans Union Credit File"
        result = parser._extract_bureau(text)
        assert result.value == "TransUnion"

    def test_extract_bureau_unknown(self, parser):
        """Test unknown bureau."""
        text = "Some credit report text"
        result = parser._extract_bureau(text)
        assert result.value == "Unknown"
        assert result.confidence == "Low"

    def test_extract_account_type_collection(self, parser):
        """Test collection account detection."""
        text = "Account Type: Collection"
        result = parser._extract_account_type(text)
        assert result.value == "collection"
        assert result.confidence == "High"

    def test_extract_account_type_charge_off(self, parser):
        """Test charge-off detection."""
        text = "Status: Charge-Off"
        result = parser._extract_account_type(text)
        assert result.value == "charge_off"
        assert result.confidence == "High"

    def test_extract_date_opened(self, parser):
        """Test date opened extraction."""
        text = "Date Opened: 01/15/2020"
        patterns = parser.date_field_patterns['date_opened']
        result = parser._extract_date_field(text, patterns)
        assert result.value == "2020-01-15"

    def test_extract_dofd(self, parser):
        """Test DOFD extraction."""
        text = "Date of First Delinquency: 03/20/2019"
        patterns = parser.date_field_patterns['dofd']
        result = parser._extract_date_field(text, patterns)
        assert result.value == "2019-03-20"

    def test_extract_dofd_alternate_format(self, parser):
        """Test DOFD with alternate wording."""
        text = "First Delinquent: March 20, 2019"
        patterns = parser.date_field_patterns['dofd']
        result = parser._extract_date_field(text, patterns)
        assert result.value == "2019-03-20"

    def test_extract_removal_date(self, parser):
        """Test removal date extraction."""
        text = "Estimated Removal: 01/2027"
        patterns = parser.date_field_patterns['estimated_removal_date']
        result = parser._extract_date_field(text, patterns)
        assert result.value is not None
        assert "2027" in result.value

    def test_extract_creditor(self, parser):
        """Test original creditor extraction."""
        text = "Original Creditor: BANK OF AMERICA NA"
        result = parser._extract_creditor(text)
        assert result.value == "BANK OF AMERICA NA"

    def test_extract_furnisher(self, parser):
        """Test furnisher extraction."""
        text = "Creditor: ABC COLLECTIONS INC"
        result = parser._extract_furnisher(text)
        assert result.value == "ABC COLLECTIONS INC"


class TestParseFullReport:
    """Tests for full report parsing."""

    def test_parse_complete_report(self):
        """Test parsing a complete report snippet."""
        text = """
        COLLECTION ACCOUNT

        Creditor: ABC COLLECTIONS
        Original Creditor: EXAMPLE BANK
        Account Type: Collection
        Date Opened: 03/15/2023
        Date of First Delinquency: 01/20/2019
        Estimated Removal: 03/2026

        Reported by: Experian
        """

        result = parse_credit_report(text)

        assert result.bureau.value == "Experian"
        assert result.account_type.value == "collection"
        assert result.date_opened.value == "2023-03-15"
        assert result.dofd.value == "2019-01-20"
        assert result.furnisher_or_collector.value == "ABC COLLECTIONS"
        assert result.original_creditor.value == "EXAMPLE BANK"

    def test_parse_minimal_report(self):
        """Test parsing with minimal information."""
        text = "Some account with balance $500"
        result = parse_credit_report(text)

        # Should still return a result with empty/low-confidence fields
        assert result is not None
        assert result.bureau.confidence == "Low"


class TestFieldsToEditableDict:
    """Tests for converting parsed fields to editable format."""

    def test_conversion(self):
        """Test conversion to editable dict."""
        text = "Date Opened: 01/15/2020\nExperian"
        parsed = parse_credit_report(text)
        editable = fields_to_editable_dict(parsed)

        assert 'date_opened' in editable
        assert 'bureau' in editable
        assert 'value' in editable['date_opened']
        assert 'confidence' in editable['date_opened']
        assert 'source_text' in editable['date_opened']

from app.parser import ParsedFields, ExtractedField, CreditReportParser, dict_to_verified_fields

def test_to_verified_dict():
    parsed = ParsedFields(raw_text="Test")
    parsed.original_creditor = ExtractedField(value="Bank", confidence="High", source_text="Bank", start_pos=0, end_pos=4)
    result = parsed.to_verified_dict()
    assert result['original_creditor'] == "Bank"
    assert result['date_opened'] is None

def test_dict_to_verified_fields():
    input_dict = {"name": " John ", "empty": "", "none": None}
    result = dict_to_verified_fields(input_dict)
    assert result["name"] == "John"
    assert result["empty"] is None
    assert result["none"] is None

def test_extract_bureau_fuzzy():
    parser = CreditReportParser()
    # "Expenan" should match "Experian"
    res = parser._extract_bureau("Report from Expenan")
    assert res.value == "Experian"
    assert res.confidence == "Medium"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
