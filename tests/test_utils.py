"""
Unit tests for utility functions.
"""

import pytest
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils import (
    normalize_date,
    calculate_years_difference,
    generate_case_id,
    sanitize_filename,
    validate_iso_date,
    estimate_removal_date,
    mask_pii
)


class TestNormalizeDate:
    """Tests for date normalization."""

    def test_iso_format(self):
        """Test ISO format dates."""
        result, confidence = normalize_date("2023-01-15")
        assert result == "2023-01-15"
        assert confidence == "High"

    def test_us_format_slashes(self):
        """Test US format with slashes."""
        result, confidence = normalize_date("01/15/2023")
        assert result == "2023-01-15"
        assert confidence == "High"

    def test_us_format_two_digit_year(self):
        """Test US format with 2-digit year."""
        result, confidence = normalize_date("01/15/23")
        assert result == "2023-01-15"
        assert confidence == "Medium"

    def test_month_name_format(self):
        """Test month name format."""
        result, confidence = normalize_date("January 15, 2023")
        assert result == "2023-01-15"
        assert confidence == "High"

    def test_abbreviated_month(self):
        """Test abbreviated month format."""
        result, confidence = normalize_date("Jan 15, 2023")
        assert result == "2023-01-15"
        assert confidence == "High"

    def test_month_year_only(self):
        """Test month and year only."""
        result, confidence = normalize_date("January 2023")
        assert result == "2023-01-01"
        assert confidence == "Medium"

    def test_invalid_date(self):
        """Test invalid date string."""
        result, confidence = normalize_date("not a date")
        assert result is None
        assert confidence == "Low"

    def test_empty_string(self):
        """Test empty string."""
        result, confidence = normalize_date("")
        assert result is None
        assert confidence == "Low"

    def test_none_input(self):
        """Test None input."""
        result, confidence = normalize_date(None)
        assert result is None
        assert confidence == "Low"

    def test_year_extraction_fallback(self):
        """Test year extraction as fallback."""
        result, confidence = normalize_date("sometime in 2023")
        assert result == "2023-01-01"
        assert confidence == "Low"


class TestCalculateYearsDifference:
    """Tests for years difference calculation."""

    def test_one_year(self):
        """Test one year difference."""
        result = calculate_years_difference("2022-01-01", "2023-01-01")
        assert result == 1.0

    def test_partial_year(self):
        """Test partial year difference."""
        result = calculate_years_difference("2023-01-01", "2023-07-01")
        assert 0.4 < result < 0.6

    def test_seven_years(self):
        """Test seven year difference."""
        result = calculate_years_difference("2016-01-01", "2023-01-01")
        assert 6.9 < result < 7.1

    def test_invalid_date(self):
        """Test invalid date input."""
        result = calculate_years_difference("invalid", "2023-01-01")
        assert result is None


class TestGenerateCaseId:
    """Tests for case ID generation."""

    def test_format(self):
        """Test case ID format."""
        case_id = generate_case_id()
        assert case_id.startswith("DR-")
        assert len(case_id) == 14  # DR-XXXXXX-XXXX

    def test_uniqueness(self):
        """Test that IDs are unique."""
        ids = [generate_case_id() for _ in range(100)]
        # Most should be unique (timing dependent)
        assert len(set(ids)) > 50


class TestSanitizeFilename:
    """Tests for filename sanitization."""

    def test_removes_invalid_chars(self):
        """Test removal of invalid characters."""
        result = sanitize_filename('file<>:"/\\|?*name.txt')
        assert '<' not in result
        assert '>' not in result
        assert ':' not in result

    def test_replaces_spaces(self):
        """Test space replacement."""
        result = sanitize_filename("file with spaces.txt")
        assert " " not in result

    def test_length_limit(self):
        """Test length limiting."""
        long_name = "a" * 200 + ".txt"
        result = sanitize_filename(long_name)
        assert len(result) <= 100


class TestValidateIsoDate:
    """Tests for ISO date validation."""

    def test_valid_date(self):
        """Test valid ISO date."""
        assert validate_iso_date("2023-01-15") is True

    def test_invalid_format(self):
        """Test invalid format."""
        assert validate_iso_date("01/15/2023") is False

    def test_invalid_date(self):
        """Test invalid date values."""
        assert validate_iso_date("2023-13-01") is False
        assert validate_iso_date("2023-01-32") is False

    def test_none_input(self):
        """Test None input."""
        assert validate_iso_date(None) is False


class TestEstimateRemovalDate:
    """Tests for removal date estimation."""

    def test_standard_case(self):
        """Test standard 7-year estimation."""
        result = estimate_removal_date("2016-01-15")
        # Should be approximately 7.5 years later
        assert result is not None
        assert result.startswith("2023")

    def test_invalid_date(self):
        """Test invalid date input."""
        result = estimate_removal_date("invalid")
        assert result is None


class TestMaskPii:
    """Tests for PII masking."""

    def test_mask_ssn_dashes(self):
        """Test SSN masking with dashes."""
        result = mask_pii("SSN: 123-45-6789")
        assert "123-45-6789" not in result
        assert "XXX-XX-XXXX" in result

    def test_mask_phone(self):
        """Test phone number masking."""
        result = mask_pii("Call 555-123-4567")
        assert "555-123-4567" not in result
        assert "XXX-XXX-XXXX" in result

    def test_mask_account_number(self):
        """Test account number masking."""
        result = mask_pii("Account: 1234567890123")
        assert "1234567890123" not in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
