"""
Unit tests for rule engine.
"""

import pytest
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rules import RuleEngine, run_rules, RULE_DEFINITIONS


class TestRuleA1:
    """Tests for Rule A1: Removal date > 8 years from date opened."""

    @pytest.fixture
    def engine(self):
        return RuleEngine()

    def test_triggers_when_over_8_years(self, engine):
        """Test that rule triggers when removal is > 8 years from opened."""
        fields = {
            'date_opened': '2020-01-01',
            'estimated_removal_date': '2029-01-01'  # 9 years
        }
        flag = engine._check_rule_a1(fields)
        assert flag is not None
        assert flag.rule_id == 'A1'
        assert flag.severity == 'high'

    def test_no_trigger_within_8_years(self, engine):
        """Test that rule does not trigger within 8 years."""
        fields = {
            'date_opened': '2020-01-01',
            'estimated_removal_date': '2027-01-01'  # 7 years
        }
        flag = engine._check_rule_a1(fields)
        assert flag is None

    def test_no_trigger_missing_dates(self, engine):
        """Test no trigger when dates are missing."""
        fields = {
            'date_opened': '2020-01-01',
            'estimated_removal_date': None
        }
        flag = engine._check_rule_a1(fields)
        assert flag is None


class TestRuleA2:
    """Tests for Rule A2: Removal inconsistent with DOFD + 7 years."""

    @pytest.fixture
    def engine(self):
        return RuleEngine()

    def test_triggers_when_inconsistent(self, engine):
        """Test that rule triggers when removal doesn't match DOFD + 7."""
        fields = {
            'dofd': '2019-01-01',
            'estimated_removal_date': '2030-01-01'  # Should be ~2026
        }
        flag = engine._check_rule_a2(fields)
        assert flag is not None
        assert flag.rule_id == 'A2'

    def test_no_trigger_when_consistent(self, engine):
        """Test no trigger when removal matches DOFD + 7."""
        fields = {
            'dofd': '2019-01-01',
            'estimated_removal_date': '2026-07-01'  # Approximately correct
        }
        flag = engine._check_rule_a2(fields)
        assert flag is None

    def test_no_trigger_missing_dates(self, engine):
        """Test no trigger when dates are missing."""
        fields = {
            'dofd': None,
            'estimated_removal_date': '2026-01-01'
        }
        flag = engine._check_rule_a2(fields)
        assert flag is None


class TestRuleB1:
    """Tests for Rule B1: Date opened > 24 months after DOFD."""

    @pytest.fixture
    def engine(self):
        return RuleEngine()

    def test_triggers_when_opened_after_dofd(self, engine):
        """Test that rule triggers when opened > 24 months after DOFD."""
        fields = {
            'dofd': '2019-01-01',
            'date_opened': '2022-01-01'  # 3 years later
        }
        flag = engine._check_rule_b1(fields)
        assert flag is not None
        assert flag.rule_id == 'B1'
        assert flag.severity == 'high'

    def test_no_trigger_within_24_months(self, engine):
        """Test no trigger when opened within 24 months of DOFD."""
        fields = {
            'dofd': '2019-01-01',
            'date_opened': '2020-06-01'  # 18 months later
        }
        flag = engine._check_rule_b1(fields)
        assert flag is None

    def test_no_trigger_opened_before_dofd(self, engine):
        """Test no trigger when opened before DOFD."""
        fields = {
            'dofd': '2020-01-01',
            'date_opened': '2019-01-01'  # Before DOFD
        }
        flag = engine._check_rule_b1(fields)
        assert flag is None


class TestRuleB2:
    """Tests for Rule B2: No DOFD on collection with recent open date."""

    @pytest.fixture
    def engine(self):
        return RuleEngine()

    def test_triggers_collection_no_dofd(self, engine):
        """Test that rule triggers for recent collection without DOFD."""
        fields = {
            'dofd': None,
            'date_opened': '2024-01-01',
            'account_type': 'collection'
        }
        flag = engine._check_rule_b2(fields)
        assert flag is not None
        assert flag.rule_id == 'B2'
        assert flag.severity == 'medium'

    def test_no_trigger_with_dofd(self, engine):
        """Test no trigger when DOFD is present."""
        fields = {
            'dofd': '2020-01-01',
            'date_opened': '2024-01-01',
            'account_type': 'collection'
        }
        flag = engine._check_rule_b2(fields)
        assert flag is None

    def test_no_trigger_not_collection(self, engine):
        """Test no trigger for non-collection accounts."""
        fields = {
            'dofd': None,
            'date_opened': '2024-01-01',
            'account_type': 'charge_off'
        }
        flag = engine._check_rule_b2(fields)
        assert flag is None


class TestRuleC1:
    """Tests for Rule C1: Inconsistent removal dates across bureaus."""

    @pytest.fixture
    def engine(self):
        return RuleEngine()

    def test_triggers_inconsistent_bureaus(self, engine):
        """Test that rule triggers when bureaus have different removal dates."""
        bureau_data = [
            {'bureau': 'Experian', 'estimated_removal_date': '2026-01-01'},
            {'bureau': 'Equifax', 'estimated_removal_date': '2027-06-01'}  # 18 months different
        ]
        flag = engine._check_rule_c1(bureau_data)
        assert flag is not None
        assert flag.rule_id == 'C1'

    def test_no_trigger_consistent_bureaus(self, engine):
        """Test no trigger when bureaus are consistent."""
        bureau_data = [
            {'bureau': 'Experian', 'estimated_removal_date': '2026-01-01'},
            {'bureau': 'Equifax', 'estimated_removal_date': '2026-03-01'}  # 2 months different
        ]
        flag = engine._check_rule_c1(bureau_data)
        assert flag is None

    def test_no_trigger_single_bureau(self, engine):
        """Test no trigger with only one bureau."""
        bureau_data = [
            {'bureau': 'Experian', 'estimated_removal_date': '2026-01-01'}
        ]
        flag = engine._check_rule_c1(bureau_data)
        assert flag is None


class TestRunRules:
    """Tests for the run_rules convenience function."""

    def test_returns_list(self):
        """Test that run_rules returns a list."""
        fields = {'date_opened': '2020-01-01'}
        result = run_rules(fields)
        assert isinstance(result, list)

    def test_detects_multiple_issues(self):
        """Test detection of multiple issues."""
        fields = {
            'date_opened': '2023-01-01',
            'dofd': '2019-01-01',
            'estimated_removal_date': '2031-01-01',
            'account_type': 'collection'
        }
        result = run_rules(fields)
        # Should trigger A1, A2, and B1
        assert len(result) >= 2


class TestRuleDefinitions:
    """Tests for rule definitions."""

    def test_all_rules_have_required_fields(self):
        """Test that all rules have required fields."""
        required_fields = ['name', 'severity', 'description',
                          'why_it_matters', 'suggested_evidence']

        for rule_id, rule in RULE_DEFINITIONS.items():
            for field in required_fields:
                assert field in rule, f"Rule {rule_id} missing {field}"

    def test_severity_values_valid(self):
        """Test that all severity values are valid."""
        valid_severities = ['low', 'medium', 'high']

        for rule_id, rule in RULE_DEFINITIONS.items():
            assert rule['severity'] in valid_severities


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
