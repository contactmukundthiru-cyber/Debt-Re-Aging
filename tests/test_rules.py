"""
Comprehensive unit tests for all 24 detection rules.
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime
from dateutil.relativedelta import relativedelta

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rules import RuleEngine, run_rules, RULE_DEFINITIONS, get_rule_summary


@pytest.fixture
def engine():
    """Shared RuleEngine instance."""
    return RuleEngine()


# =============================================================================
# TIMELINE RULES (A-series)
# =============================================================================

class TestRuleA1:
    """Tests for Rule A1: Removal date > 8 years from date opened."""

    def test_triggers_when_over_8_years(self, engine):
        """Rule triggers when removal is > 8 years from opened."""
        fields = {
            'date_opened': '2020-01-01',
            'estimated_removal_date': '2029-01-01'  # 9 years
        }
        flag = engine._check_rule_a1(fields)
        assert flag is not None
        assert flag.rule_id == 'A1'
        assert flag.severity == 'high'

    def test_no_trigger_within_8_years(self, engine):
        """Rule does not trigger within 8 years."""
        fields = {
            'date_opened': '2020-01-01',
            'estimated_removal_date': '2027-01-01'  # 7 years
        }
        flag = engine._check_rule_a1(fields)
        assert flag is None

    def test_no_trigger_missing_dates(self, engine):
        """No trigger when dates are missing."""
        fields = {'date_opened': '2020-01-01', 'estimated_removal_date': None}
        assert engine._check_rule_a1(fields) is None

    def test_no_trigger_invalid_dates(self, engine):
        """No trigger with invalid date format."""
        fields = {'date_opened': 'invalid', 'estimated_removal_date': '2029-01-01'}
        assert engine._check_rule_a1(fields) is None


class TestRuleA2:
    """Tests for Rule A2: Removal inconsistent with DOFD + 7 years."""

    def test_triggers_when_inconsistent(self, engine):
        """Rule triggers when removal doesn't match DOFD + 7."""
        fields = {
            'dofd': '2019-01-01',
            'estimated_removal_date': '2030-01-01'  # Should be ~2026-07
        }
        flag = engine._check_rule_a2(fields)
        assert flag is not None
        assert flag.rule_id == 'A2'

    def test_no_trigger_when_consistent(self, engine):
        """No trigger when removal matches DOFD + 7 years + 180 days."""
        fields = {
            'dofd': '2019-01-01',
            'estimated_removal_date': '2026-07-01'  # Within tolerance
        }
        flag = engine._check_rule_a2(fields)
        assert flag is None

    def test_no_trigger_missing_dates(self, engine):
        """No trigger when dates are missing."""
        fields = {'dofd': None, 'estimated_removal_date': '2026-01-01'}
        assert engine._check_rule_a2(fields) is None


# =============================================================================
# RE-AGING INDICATORS (B-series)
# =============================================================================

class TestRuleB1:
    """Tests for Rule B1: Date opened > 24 months after DOFD."""

    def test_triggers_when_opened_after_dofd(self, engine):
        """Rule triggers when opened > 24 months after DOFD."""
        fields = {
            'dofd': '2019-01-01',
            'date_opened': '2022-01-01'  # 36 months later
        }
        flag = engine._check_rule_b1(fields)
        assert flag is not None
        assert flag.rule_id == 'B1'
        assert flag.severity == 'high'
        assert flag.field_values['months_after_dofd'] == 36

    def test_no_trigger_within_24_months(self, engine):
        """No trigger when opened within 24 months of DOFD."""
        fields = {
            'dofd': '2019-01-01',
            'date_opened': '2020-06-01'  # 17 months later
        }
        assert engine._check_rule_b1(fields) is None

    def test_no_trigger_opened_before_dofd(self, engine):
        """No trigger when opened before DOFD."""
        fields = {'dofd': '2020-01-01', 'date_opened': '2019-01-01'}
        assert engine._check_rule_b1(fields) is None


class TestRuleB2:
    """Tests for Rule B2: No DOFD on collection with recent open date."""

    def test_triggers_collection_no_dofd(self, engine):
        """Rule triggers for recent collection without DOFD."""
        # Use a date within last 3 years
        recent_date = (datetime.now() - relativedelta(years=1)).strftime('%Y-%m-%d')
        fields = {
            'dofd': None,
            'date_opened': recent_date,
            'account_type': 'collection'
        }
        flag = engine._check_rule_b2(fields)
        assert flag is not None
        assert flag.rule_id == 'B2'
        assert flag.severity == 'medium'

    def test_no_trigger_with_dofd(self, engine):
        """No trigger when DOFD is present."""
        fields = {
            'dofd': '2020-01-01',
            'date_opened': '2024-01-01',
            'account_type': 'collection'
        }
        assert engine._check_rule_b2(fields) is None

    def test_no_trigger_not_collection(self, engine):
        """No trigger for non-collection accounts."""
        fields = {
            'dofd': None,
            'date_opened': '2024-01-01',
            'account_type': 'charge_off'
        }
        assert engine._check_rule_b2(fields) is None

    def test_no_trigger_old_collection(self, engine):
        """No trigger for old collection (> 3 years)."""
        old_date = (datetime.now() - relativedelta(years=5)).strftime('%Y-%m-%d')
        fields = {
            'dofd': None,
            'date_opened': old_date,
            'account_type': 'collection'
        }
        assert engine._check_rule_b2(fields) is None


# =============================================================================
# CROSS-BUREAU RULES (C-series)
# =============================================================================

class TestRuleC1:
    """Tests for Rule C1: Inconsistent removal dates across bureaus."""

    def test_triggers_inconsistent_bureaus(self, engine):
        """Rule triggers when bureaus have different removal dates."""
        bureau_data = [
            {'bureau': 'Experian', 'estimated_removal_date': '2026-01-01'},
            {'bureau': 'Equifax', 'estimated_removal_date': '2027-06-01'}  # 18 months diff
        ]
        flag = engine._check_rule_c1(bureau_data)
        assert flag is not None
        assert flag.rule_id == 'C1'

    def test_no_trigger_consistent_bureaus(self, engine):
        """No trigger when bureaus are consistent (< 6 months diff)."""
        bureau_data = [
            {'bureau': 'Experian', 'estimated_removal_date': '2026-01-01'},
            {'bureau': 'Equifax', 'estimated_removal_date': '2026-03-01'}
        ]
        assert engine._check_rule_c1(bureau_data) is None

    def test_no_trigger_single_bureau(self, engine):
        """No trigger with only one bureau."""
        bureau_data = [{'bureau': 'Experian', 'estimated_removal_date': '2026-01-01'}]
        assert engine._check_rule_c1(bureau_data) is None


# =============================================================================
# STATUS/BALANCE RULES (D-series)
# =============================================================================

class TestRuleD1:
    """Tests for Rule D1: Account status vs balance inconsistency."""

    def test_triggers_paid_with_balance(self, engine):
        """Rule triggers when paid account has balance > 0."""
        fields = {'account_status': 'paid', 'current_balance': '500.00'}
        flag = engine._check_rule_d1(fields)
        assert flag is not None
        assert flag.rule_id == 'D1'
        assert flag.severity == 'high'

    def test_triggers_settled_with_balance(self, engine):
        """Rule triggers when settled account has balance."""
        fields = {'account_status': 'settled', 'current_balance': '1000'}
        flag = engine._check_rule_d1(fields)
        assert flag is not None

    def test_no_trigger_paid_zero_balance(self, engine):
        """No trigger when paid account has zero balance."""
        fields = {'account_status': 'paid', 'current_balance': '0'}
        assert engine._check_rule_d1(fields) is None

    def test_no_trigger_open_with_balance(self, engine):
        """No trigger for open account with balance."""
        fields = {'account_status': 'open', 'current_balance': '500'}
        assert engine._check_rule_d1(fields) is None


# =============================================================================
# DATA INTEGRITY RULES (E-series)
# =============================================================================

class TestRuleE1:
    """Tests for Rule E1: Future date violation."""

    def test_triggers_future_date_opened(self, engine):
        """Rule triggers when date_opened is in the future."""
        future_date = (datetime.now() + relativedelta(months=6)).strftime('%Y-%m-%d')
        fields = {'date_opened': future_date}
        flag = engine._check_rule_e1(fields)
        assert flag is not None
        assert flag.rule_id == 'E1'
        assert flag.severity == 'high'

    def test_triggers_future_dofd(self, engine):
        """Rule triggers when DOFD is in the future."""
        future_date = (datetime.now() + relativedelta(years=1)).strftime('%Y-%m-%d')
        fields = {'dofd': future_date}
        flag = engine._check_rule_e1(fields)
        assert flag is not None

    def test_no_trigger_past_dates(self, engine):
        """No trigger for valid past dates."""
        fields = {
            'date_opened': '2020-01-01',
            'dofd': '2021-01-01',
            'estimated_removal_date': '2028-01-01'
        }
        assert engine._check_rule_e1(fields) is None


# =============================================================================
# PAYMENT/BALANCE MANIPULATION (F-series)
# =============================================================================

class TestRuleF1:
    """Tests for Rule F1: Payment without balance reduction."""

    def test_triggers_payment_no_reduction(self, engine):
        """Rule triggers when payment made but balance unchanged."""
        fields = {
            'last_payment_amount': '500',
            'previous_balance': '5000',
            'current_balance': '5000'  # Same as before
        }
        flag = engine._check_rule_f1(fields)
        assert flag is not None
        assert flag.rule_id == 'F1'
        assert flag.severity == 'high'

    def test_triggers_payment_balance_increased(self, engine):
        """Rule triggers when payment made but balance increased."""
        fields = {
            'last_payment_amount': '500',
            'previous_balance': '5000',
            'current_balance': '5500'  # Increased!
        }
        flag = engine._check_rule_f1(fields)
        assert flag is not None

    def test_no_trigger_balance_reduced(self, engine):
        """No trigger when balance properly reduced after payment."""
        fields = {
            'last_payment_amount': '500',
            'previous_balance': '5000',
            'current_balance': '4500'
        }
        assert engine._check_rule_f1(fields) is None

    def test_no_trigger_missing_data(self, engine):
        """No trigger when payment data is missing."""
        fields = {'last_payment_amount': '500', 'current_balance': '4500'}
        assert engine._check_rule_f1(fields) is None


class TestRuleF2:
    """Tests for Rule F2: Suspicious activity date refresh."""

    def test_triggers_old_debt_recent_activity(self, engine):
        """Rule triggers when old debt shows recent activity."""
        old_dofd = (datetime.now() - relativedelta(years=6)).strftime('%Y-%m-%d')
        recent_activity = (datetime.now() - relativedelta(months=2)).strftime('%Y-%m-%d')
        fields = {
            'dofd': old_dofd,
            'date_last_activity': recent_activity
        }
        flag = engine._check_rule_f2(fields)
        assert flag is not None
        assert flag.rule_id == 'F2'
        assert flag.severity == 'high'

    def test_no_trigger_recent_debt(self, engine):
        """No trigger for recent debt with recent activity."""
        recent_dofd = (datetime.now() - relativedelta(years=2)).strftime('%Y-%m-%d')
        recent_activity = (datetime.now() - relativedelta(months=1)).strftime('%Y-%m-%d')
        fields = {
            'dofd': recent_dofd,
            'date_last_activity': recent_activity
        }
        assert engine._check_rule_f2(fields) is None


# =============================================================================
# FEE/INTEREST ABUSE (G-series)
# =============================================================================

class TestRuleG1:
    """Tests for Rule G1: Excessive balance growth."""

    def test_triggers_excessive_growth(self, engine):
        """Rule triggers when balance > 150% of original."""
        fields = {
            'current_balance': '8000',
            'original_balance': '5000',  # 60% growth
            'account_type': 'collection'
        }
        flag = engine._check_rule_g1(fields)
        assert flag is not None
        assert flag.rule_id == 'G1'

    def test_no_trigger_reasonable_growth(self, engine):
        """No trigger for reasonable balance growth."""
        fields = {
            'current_balance': '5500',
            'original_balance': '5000',  # 10% growth
            'account_type': 'collection'
        }
        assert engine._check_rule_g1(fields) is None

    def test_no_trigger_non_collection(self, engine):
        """No trigger for non-collection accounts."""
        fields = {
            'current_balance': '8000',
            'original_balance': '5000',
            'account_type': 'credit_card'
        }
        assert engine._check_rule_g1(fields) is None


class TestRuleG2:
    """Tests for Rule G2: Balance increased after transfer."""

    def test_triggers_balance_increase(self, engine):
        """Rule triggers when balance increased at transfer."""
        fields = {
            'current_balance': '5500',
            'balance_at_transfer': '5000',
            'account_type': 'collection'
        }
        flag = engine._check_rule_g2(fields)
        assert flag is not None
        assert flag.rule_id == 'G2'

    def test_no_trigger_balance_same(self, engine):
        """No trigger when balance unchanged (within 5%)."""
        fields = {
            'current_balance': '5000',
            'balance_at_transfer': '5000',
            'account_type': 'collection'
        }
        assert engine._check_rule_g2(fields) is None


# =============================================================================
# MEDICAL DEBT RULES (H-series)
# =============================================================================

class TestRuleH1:
    """Tests for Rule H1: Medical debt reported prematurely."""

    def test_triggers_premature_reporting(self, engine):
        """Rule triggers when medical debt reported < 365 days."""
        service_date = (datetime.now() - relativedelta(months=6)).strftime('%Y-%m-%d')
        report_date = datetime.now().strftime('%Y-%m-%d')
        fields = {
            'account_type': 'medical collection',
            'date_of_service': service_date,
            'date_reported_or_updated': report_date
        }
        flag = engine._check_rule_h1(fields)
        assert flag is not None
        assert flag.rule_id == 'H1'
        assert flag.severity == 'high'

    def test_no_trigger_after_waiting_period(self, engine):
        """No trigger when medical debt reported after 365 days."""
        service_date = (datetime.now() - relativedelta(years=2)).strftime('%Y-%m-%d')
        report_date = datetime.now().strftime('%Y-%m-%d')
        fields = {
            'account_type': 'medical collection',
            'date_of_service': service_date,
            'date_reported_or_updated': report_date
        }
        assert engine._check_rule_h1(fields) is None

    def test_no_trigger_non_medical(self, engine):
        """No trigger for non-medical debt."""
        fields = {
            'account_type': 'credit card',
            'date_of_service': '2024-01-01',
            'date_reported_or_updated': '2024-06-01'
        }
        assert engine._check_rule_h1(fields) is None


class TestRuleH2:
    """Tests for Rule H2: Paid medical debt still reporting."""

    def test_triggers_paid_medical(self, engine):
        """Rule triggers when paid medical debt is still on report."""
        fields = {
            'account_type': 'medical collection',
            'account_status': 'paid'
        }
        flag = engine._check_rule_h2(fields)
        assert flag is not None
        assert flag.rule_id == 'H2'
        assert flag.severity == 'high'

    def test_no_trigger_unpaid_medical(self, engine):
        """No trigger for unpaid medical debt."""
        fields = {
            'account_type': 'medical collection',
            'account_status': 'open'
        }
        assert engine._check_rule_h2(fields) is None


class TestRuleH3:
    """Tests for Rule H3: Medical debt under $500."""

    def test_triggers_under_500(self, engine):
        """Rule triggers when medical debt < $500."""
        fields = {
            'account_type': 'medical collection',
            'current_balance': '350'
        }
        flag = engine._check_rule_h3(fields)
        assert flag is not None
        assert flag.rule_id == 'H3'

    def test_no_trigger_over_500(self, engine):
        """No trigger when medical debt >= $500."""
        fields = {
            'account_type': 'medical collection',
            'current_balance': '750'
        }
        assert engine._check_rule_h3(fields) is None


# =============================================================================
# CREDIT LIMIT MANIPULATION (I-series)
# =============================================================================

class TestRuleI1:
    """Tests for Rule I1: Credit limit suppression."""

    def test_triggers_zero_limit(self, engine):
        """Rule triggers when revolving account has $0 limit with balance."""
        fields = {
            'account_type': 'revolving',
            'current_balance': '5000',
            'credit_limit': '0'
        }
        flag = engine._check_rule_i1(fields)
        assert flag is not None
        assert flag.rule_id == 'I1'

    def test_triggers_limit_equals_balance(self, engine):
        """Rule triggers when limit equals balance exactly."""
        fields = {
            'account_type': 'credit card',
            'current_balance': '5000',
            'credit_limit': '5000'
        }
        flag = engine._check_rule_i1(fields)
        assert flag is not None

    def test_no_trigger_proper_limit(self, engine):
        """No trigger when credit limit is properly reported."""
        fields = {
            'account_type': 'revolving',
            'current_balance': '2000',
            'credit_limit': '10000'
        }
        assert engine._check_rule_i1(fields) is None


class TestRuleI2:
    """Tests for Rule I2: Collection account age mismatch."""

    def test_triggers_date_mismatch(self, engine):
        """Rule triggers when collection date differs from original."""
        fields = {
            'account_type': 'collection',
            'date_opened': '2023-01-01',
            'original_open_date': '2020-01-01'  # 36 months difference
        }
        flag = engine._check_rule_i2(fields)
        assert flag is not None
        assert flag.rule_id == 'I2'

    def test_no_trigger_dates_match(self, engine):
        """No trigger when dates are similar."""
        fields = {
            'account_type': 'collection',
            'date_opened': '2020-03-01',
            'original_open_date': '2020-01-01'  # 2 months difference
        }
        assert engine._check_rule_i2(fields) is None


# =============================================================================
# ZOMBIE DEBT RULES (J-series)
# =============================================================================

class TestRuleJ1:
    """Tests for Rule J1: Zombie debt revival."""

    def test_triggers_zombie_debt(self, engine):
        """Rule triggers when old debt is recently reported."""
        old_dofd = (datetime.now() - relativedelta(years=6)).strftime('%Y-%m-%d')
        recent_report = (datetime.now() - relativedelta(months=2)).strftime('%Y-%m-%d')
        fields = {
            'dofd': old_dofd,
            'date_reported_or_updated': recent_report
        }
        flag = engine._check_rule_j1(fields)
        assert flag is not None
        assert flag.rule_id == 'J1'
        assert flag.severity == 'high'

    def test_no_trigger_recent_debt(self, engine):
        """No trigger for recent debt with recent reporting."""
        recent_dofd = (datetime.now() - relativedelta(years=2)).strftime('%Y-%m-%d')
        recent_report = (datetime.now() - relativedelta(months=1)).strftime('%Y-%m-%d')
        fields = {
            'dofd': recent_dofd,
            'date_reported_or_updated': recent_report
        }
        assert engine._check_rule_j1(fields) is None


class TestRuleJ2:
    """Tests for Rule J2: Multiple collector waterfall (batch rule)."""

    def test_triggers_waterfall(self, engine):
        """Rule triggers when same debt has 3+ collectors."""
        accounts = [
            {'original_creditor': 'BigBank', 'furnisher_or_collector': 'Collector A',
             'account_type': 'collection', 'current_balance': '1000'},
            {'original_creditor': 'BigBank', 'furnisher_or_collector': 'Collector B',
             'account_type': 'collection', 'current_balance': '1000'},
            {'original_creditor': 'BigBank', 'furnisher_or_collector': 'Collector C',
             'account_type': 'collection', 'current_balance': '1000'}
        ]
        flags = engine.check_batch_rules(accounts)
        j2_flags = [f for f in flags if f['rule_id'] == 'J2']
        assert len(j2_flags) >= 1

    def test_no_trigger_few_collectors(self, engine):
        """No trigger for only 2 collectors."""
        accounts = [
            {'original_creditor': 'BigBank', 'furnisher_or_collector': 'Collector A',
             'account_type': 'collection', 'current_balance': '1000'},
            {'original_creditor': 'BigBank', 'furnisher_or_collector': 'Collector B',
             'account_type': 'collection', 'current_balance': '1000'}
        ]
        flags = engine.check_batch_rules(accounts)
        j2_flags = [f for f in flags if f['rule_id'] == 'J2']
        assert len(j2_flags) == 0


# =============================================================================
# INNOVATIVE/ADVANCED RULES (K-series)
# =============================================================================

class TestRuleK1:
    """Tests for Rule K1: Impossible delinquency sequence."""

    def test_triggers_impossible_sequence(self, engine):
        """Rule triggers when delinquency sequence is impossible."""
        fields = {'payment_history': 'CCCC0090CCC'}  # Skipped 30 and 60
        flag = engine._check_rule_k1(fields)
        assert flag is not None
        assert flag.rule_id == 'K1'

    def test_no_trigger_valid_sequence(self, engine):
        """No trigger for valid delinquency progression."""
        fields = {'payment_history': 'CCCC30306090CCC'}
        assert engine._check_rule_k1(fields) is None


class TestRuleK2:
    """Tests for Rule K2: Suspiciously round balance."""

    def test_triggers_round_balance(self, engine):
        """Rule triggers for exact round thousand balance on collection."""
        fields = {
            'current_balance': '5000',
            'account_type': 'collection'
        }
        flag = engine._check_rule_k2(fields)
        assert flag is not None
        assert flag.rule_id == 'K2'
        assert flag.severity == 'low'

    def test_no_trigger_irregular_balance(self, engine):
        """No trigger for irregular balance."""
        fields = {
            'current_balance': '5,234.67',
            'account_type': 'collection'
        }
        assert engine._check_rule_k2(fields) is None


class TestRuleK3:
    """Tests for Rule K3: High balance exceeds credit limit."""

    def test_triggers_high_balance(self, engine):
        """Rule triggers when high balance > 120% of limit."""
        fields = {
            'high_balance': '15000',
            'credit_limit': '10000'  # 50% over
        }
        flag = engine._check_rule_k3(fields)
        assert flag is not None
        assert flag.rule_id == 'K3'

    def test_no_trigger_within_limit(self, engine):
        """No trigger when high balance is reasonable."""
        fields = {
            'high_balance': '11000',
            'credit_limit': '10000'  # 10% over is ok
        }
        assert engine._check_rule_k3(fields) is None


class TestRuleK4:
    """Tests for Rule K4: Last payment date inconsistency."""

    def test_triggers_payment_after_dofd(self, engine):
        """Rule triggers when last payment is years after DOFD."""
        fields = {
            'date_last_payment': '2023-01-01',
            'dofd': '2019-01-01'  # 4 years after DOFD
        }
        flag = engine._check_rule_k4(fields)
        assert flag is not None
        assert flag.rule_id == 'K4'

    def test_no_trigger_payment_near_dofd(self, engine):
        """No trigger when payment is near DOFD."""
        fields = {
            'date_last_payment': '2019-06-01',
            'dofd': '2019-01-01'  # 5 months after DOFD
        }
        assert engine._check_rule_k4(fields) is None


class TestRuleK5:
    """Tests for Rule K5: Minimum payment trap."""

    def test_triggers_payment_trap(self, engine):
        """Rule triggers when payments made but balance grew."""
        fields = {
            'current_balance': '6000',
            'original_balance': '5000',
            'total_payments': '3000',  # Paid 60% of original
            'months_reviewed': '36'  # 3 years
        }
        flag = engine._check_rule_k5(fields)
        assert flag is not None
        assert flag.rule_id == 'K5'

    def test_no_trigger_balance_reduced(self, engine):
        """No trigger when balance properly reduced."""
        fields = {
            'current_balance': '2000',
            'original_balance': '5000',
            'total_payments': '3000',
            'months_reviewed': '36'
        }
        assert engine._check_rule_k5(fields) is None


# =============================================================================
# STATUTE OF LIMITATIONS RULES (S-series)
# =============================================================================

class TestRuleS1:
    """Tests for Rule S1: Debt beyond SOL."""

    def test_triggers_expired_sol(self, engine):
        """Rule triggers when debt is past state SOL."""
        old_dofd = (datetime.now() - relativedelta(years=8)).strftime('%Y-%m-%d')
        fields = {
            'dofd': old_dofd,
            'state_code': 'CA'  # California has 4-year SOL
        }
        flag = engine._check_rule_s1(fields)
        assert flag is not None
        assert flag.rule_id == 'S1'

    def test_no_trigger_within_sol(self, engine):
        """No trigger when debt is within SOL."""
        recent_dofd = (datetime.now() - relativedelta(years=2)).strftime('%Y-%m-%d')
        fields = {
            'dofd': recent_dofd,
            'state_code': 'CA'
        }
        assert engine._check_rule_s1(fields) is None


class TestRuleS2:
    """Tests for Rule S2: SOL revival through payment."""

    def test_triggers_sol_revival(self, engine):
        """Rule triggers when payment made after SOL expiry."""
        old_dofd = (datetime.now() - relativedelta(years=8)).strftime('%Y-%m-%d')
        recent_payment = (datetime.now() - relativedelta(months=6)).strftime('%Y-%m-%d')
        fields = {
            'dofd': old_dofd,
            'date_last_payment': recent_payment,
            'state_code': 'CA'
        }
        flag = engine._check_rule_s2(fields)
        assert flag is not None
        assert flag.rule_id == 'S2'
        assert flag.severity == 'high'


# =============================================================================
# DUPLICATE DETECTION (DU-series)
# =============================================================================

class TestRuleDU1:
    """Tests for Rule DU1: Duplicate reporting."""

    def test_triggers_duplicate_balance(self, engine):
        """Rule triggers when same balance from multiple furnishers."""
        accounts = [
            {'current_balance': '5000', 'furnisher_or_collector': 'Collector A'},
            {'current_balance': '5000', 'furnisher_or_collector': 'Collector B'}
        ]
        flags = engine.check_batch_rules(accounts)
        du1_flags = [f for f in flags if f['rule_id'] == 'DU1']
        assert len(du1_flags) >= 1

    def test_no_trigger_different_balances(self, engine):
        """No trigger for different balances."""
        accounts = [
            {'current_balance': '5000', 'furnisher_or_collector': 'Collector A'},
            {'current_balance': '3000', 'furnisher_or_collector': 'Collector B'}
        ]
        flags = engine.check_batch_rules(accounts)
        du1_flags = [f for f in flags if f['rule_id'] == 'DU1']
        assert len(du1_flags) == 0


class TestRuleDU2:
    """Tests for Rule DU2: Same debt different account numbers."""

    def test_triggers_same_debt_diff_numbers(self, engine):
        """Rule triggers when same debt has different account numbers."""
        accounts = [
            {'original_creditor': 'BigBank', 'account_number': '12345',
             'current_balance': '5000', 'furnisher_or_collector': 'A'},
            {'original_creditor': 'BigBank', 'account_number': '67890',
             'current_balance': '5050', 'furnisher_or_collector': 'B'}  # Similar balance
        ]
        flags = engine.check_batch_rules(accounts)
        du2_flags = [f for f in flags if f['rule_id'] == 'DU2']
        assert len(du2_flags) >= 1


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestRunRules:
    """Integration tests for run_rules function."""

    def test_returns_list(self):
        """run_rules returns a list."""
        fields = {'date_opened': '2020-01-01'}
        result = run_rules(fields)
        assert isinstance(result, list)

    def test_detects_multiple_issues(self):
        """Detects multiple rule violations."""
        fields = {
            'date_opened': '2023-01-01',
            'dofd': '2019-01-01',
            'estimated_removal_date': '2031-01-01',
            'account_type': 'collection'
        }
        result = run_rules(fields)
        assert len(result) >= 2

    def test_all_flags_have_required_fields(self):
        """All returned flags have required fields."""
        fields = {
            'date_opened': '2023-01-01',
            'dofd': '2019-01-01',
            'estimated_removal_date': '2031-01-01'
        }
        result = run_rules(fields)
        required = ['rule_id', 'rule_name', 'severity', 'explanation',
                    'why_it_matters', 'suggested_evidence', 'field_values']
        for flag in result:
            for field in required:
                assert field in flag, f"Flag missing {field}"


class TestRuleDefinitions:
    """Tests for rule definitions structure."""

    def test_all_rules_have_required_fields(self):
        """All rules have required metadata fields."""
        required_fields = ['name', 'severity', 'description',
                          'why_it_matters', 'suggested_evidence']
        for rule_id, rule in RULE_DEFINITIONS.items():
            for field in required_fields:
                assert field in rule, f"Rule {rule_id} missing {field}"

    def test_severity_values_valid(self):
        """All severity values are valid."""
        valid_severities = ['low', 'medium', 'high']
        for rule_id, rule in RULE_DEFINITIONS.items():
            assert rule['severity'] in valid_severities, f"Rule {rule_id} has invalid severity"

    def test_rule_count(self):
        """Verify we have 24 rules defined."""
        assert len(RULE_DEFINITIONS) == 24

    def test_get_rule_summary(self):
        """Test rule summary function."""
        summary = get_rule_summary()
        assert summary['total_rules'] == 24
        assert 'by_severity' in summary
        assert 'by_category' in summary


class TestCheckAllRules:
    """Tests for check_all_rules method."""

    def test_clean_account_no_flags(self, engine):
        """Clean account should produce no flags."""
        fields = {
            'date_opened': '2020-01-01',
            'dofd': '2020-06-01',
            'estimated_removal_date': '2027-12-01',
            'account_status': 'open',
            'current_balance': '1000',
            'account_type': 'charge_off'
        }
        flags = engine.check_all_rules(fields)
        # Should have few or no flags for a normally reported account
        assert len(flags) <= 2  # Allow for edge cases

    def test_problematic_account_multiple_flags(self, engine):
        """Problematic account should produce multiple flags."""
        old_dofd = (datetime.now() - relativedelta(years=6)).strftime('%Y-%m-%d')
        recent_date = (datetime.now() - relativedelta(months=2)).strftime('%Y-%m-%d')

        fields = {
            'date_opened': recent_date,  # B1: opened way after DOFD
            'dofd': old_dofd,
            'estimated_removal_date': '2035-01-01',  # A1, A2: too far out
            'date_last_activity': recent_date,  # F2: zombie activity
            'date_reported_or_updated': recent_date,  # J1: zombie reporting
            'account_status': 'paid',
            'current_balance': '5000',  # D1: paid but has balance
            'account_type': 'collection'
        }
        flags = engine.check_all_rules(fields)
        assert len(flags) >= 3  # Should catch multiple issues


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
