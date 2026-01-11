"""
Rule engine for detecting debt re-aging and timeline inconsistencies.

All rules are transparent, documented, and produce human-readable explanations.
"""

import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from app.utils import calculate_years_difference, estimate_removal_date, validate_iso_date


@dataclass
class RuleFlag:
    """Represents a single rule violation flag."""
    rule_id: str
    rule_name: str
    severity: str  # low, medium, high
    explanation: str
    why_it_matters: str
    suggested_evidence: List[str]
    field_values: Dict[str, Any]  # Relevant field values that triggered the rule

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# Rule definitions with metadata
RULE_DEFINITIONS = {
    'A1': {
        'name': 'Estimated Removal Date Exceeds 8 Years from Date Opened',
        'severity': 'high',
        'description': 'The estimated removal date is more than 8 years after the reported date opened.',
        'why_it_matters': (
            'Under the Fair Credit Reporting Act (FCRA), most negative items must be removed '
            'from your credit report after 7 years from the date of first delinquency (DOFD). '
            'If the removal date is more than 8 years from when the account was opened, '
            'this could indicate the account is being improperly aged or the dates are inaccurate.'
        ),
        'suggested_evidence': [
            'Original account opening documentation',
            'Payment history showing actual delinquency date',
            'Prior credit reports showing different dates',
            'Correspondence from original creditor'
        ]
    },
    'A2': {
        'name': 'Estimated Removal Inconsistent with DOFD + 7 Years',
        'severity': 'high',
        'description': 'The estimated removal date does not align with the Date of First Delinquency plus 7 years.',
        'why_it_matters': (
            'The credit reporting time limit is calculated from the Date of First Delinquency (DOFD), '
            'not from when a collection agency acquired the debt. If the removal date suggests '
            'a different calculation, the debt may have been illegally re-aged to extend '
            'how long it stays on your credit report.'
        ),
        'suggested_evidence': [
            'Documentation showing actual DOFD',
            'Prior credit reports with different removal dates',
            'Account statements showing payment history',
            'Letters from original creditor about account status'
        ]
    },
    'B1': {
        'name': 'Date Opened More Than 24 Months After DOFD',
        'severity': 'high',
        'description': 'The account shows a date opened that is more than 24 months after the DOFD.',
        'why_it_matters': (
            'When a collection agency reports a "date opened" that is years after the original '
            'delinquency occurred, this is a classic sign of debt re-aging. The reporting period '
            'should be based on the ORIGINAL delinquency date with the original creditor, not '
            'when a collector opened their file. This practice illegally extends the time '
            'negative information appears on your report.'
        ),
        'suggested_evidence': [
            'Original account statements',
            'Documentation from original creditor',
            'Prior credit reports showing original dates',
            'Debt purchase or assignment documents (if obtainable)'
        ]
    },
    'B2': {
        'name': 'No DOFD on Collection Account with Recent Open Date',
        'severity': 'medium',
        'description': 'A collection account shows no Date of First Delinquency but has a recent open date.',
        'why_it_matters': (
            'Collection accounts are required to report the Date of First Delinquency (DOFD) '
            'from the original account. When a collection account shows a recent "date opened" '
            'but no DOFD, it may be masking the true age of the debt. This makes it impossible '
            'to verify whether the debt should still be reported and could constitute re-aging.'
        ),
        'suggested_evidence': [
            'Request for DOFD from collector',
            'Original creditor account history',
            'Previous credit reports',
            'Validation letter from collector'
        ]
    },
    'C1': {
        'name': 'Inconsistent Removal Dates Across Bureaus',
        'severity': 'medium',
        'description': 'Different credit bureaus show materially different removal dates for the same debt.',
        'why_it_matters': (
            'The same debt should have the same removal date across all three credit bureaus, '
            'as it is based on a single Date of First Delinquency. If bureaus show different '
            'removal dates (more than a few months apart), at least one report contains '
            'inaccurate information that needs correction.'
        ),
        'suggested_evidence': [
            'Credit reports from all three bureaus',
            'Documentation showing the actual DOFD',
            'Prior correspondence with bureaus about this account',
            'Account statements from original creditor'
        ]
    },
    'D1': {
        'name': 'Account Status vs. Balance Inconsistency',
        'severity': 'high',
        'description': 'The account status indicates it is paid or closed, but a balance is still being reported.',
        'why_it_matters': (
            'Reporting a balance on a paid or settled account is a violation of the FCRA '
            'requirement to report accurate information. This negatively impacts your '
            'debt-to-income ratio and credit score unfairly.'
        ),
        'suggested_evidence': [
            'Final payment receipt',
            'Settlement agreement',
            'Canceled check or bank statement showing final payment',
            '"Paid in Full" letter from creditor'
        ]
    },
    'S1': {
        'name': 'Debt May Be Beyond Statute of Limitations',
        'severity': 'medium',
        'description': 'The debt appears to be older than the state statute of limitations for legal collection.',
        'why_it_matters': (
            'Every state has a "statute of limitations" - a time limit for how long a creditor '
            'has the legal right to sue you to collect a debt. If this time has passed, the debt '
            'is considered "time-barred." While you may still owe the debt, they cannot win a '
            'lawsuit against you to collect it if you raise the SOL as a defense.'
        ),
        'suggested_evidence': [
            'Proof of Date of First Delinquency',
            'State-specific SOL documentation',
            'Records of last payment date'
        ]
    },
    'DU1': {
        'name': 'Potential Duplicate Reporting',
        'severity': 'high',
        'description': 'The same debt appears to be reported multiple times by different furnishers.',
        'why_it_matters': (
            'The same debt should not be reported as "Active" or having a "Balance" by multiple '
            'entities simultaneously. Usually, when a debt is sold, the original creditor must '
            'report a $0 balance. Duplicate reporting artificially inflates your debt and '
            'multiplies the negative impact on your credit score.'
        ),
        'suggested_evidence': [
            'Credit report showing both entries',
            'Notice of assignment or sale of debt',
            'Account statements showing the transfer'
        ]
    },
    'E1': {
        'name': 'Future Date Violation',
        'severity': 'high',
        'description': 'A date is reported that is in the future.',
        'why_it_matters': (
            'Credit reports must contain accurate and verifiable information. Dates in the '
            'future are physically impossible and indicate a severe lack of data integrity '
            'by the furnisher. This often happens during intentional re-aging or due to '
            'software glitches, and it is a clear violation of the FCRA.'
        ),
        'suggested_evidence': [
            'Credit report highlighting the future date',
            'Current calendar date documentation'
        ]
    }
}


class RuleEngine:
    """
    Rule engine for detecting debt re-aging and timeline inconsistencies.

    All rules are transparent and produce human-readable outputs.
    """

    def __init__(self):
        self.rules = RULE_DEFINITIONS.copy()
        self.tolerance_days = 180  # 6 month tolerance for date comparisons

    def check_batch_rules(self, accounts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Run rules that compare multiple accounts (e.g., duplicates).
        """
        flags = []
        
        # Rule DU1: Duplicate Reporting
        # Look for same balance/dates across different furnishers
        seen_balances = {} # balance -> [account_ids]
        
        for i, acc in enumerate(accounts):
            balance = acc.get('current_balance')
            if balance and balance != '0' and balance != '0.00':
                if balance not in seen_balances:
                    seen_balances[balance] = []
                seen_balances[balance].append(i)
                
        for balance, indices in seen_balances.items():
            if len(indices) >= 2:
                rule = self.rules['DU1']
                # Collect account identifiers
                account_names = [accounts[idx].get('furnisher_or_collector', 'Unknown') for idx in indices]
                
                # We flag this for all involved accounts
                flags.append({
                    'rule_id': 'DU1',
                    'rule_name': rule['name'],
                    'severity': rule['severity'],
                    'explanation': (
                        f"Potential duplicate reporting found. The balance ${balance} is being "
                        f"reported by multiple accounts: {', '.join(account_names)}. This may "
                        "be a violation if the original creditor hasn't zeroed out the balance."
                    ),
                    'why_it_matters': rule['why_it_matters'],
                    'suggested_evidence': rule['suggested_evidence'],
                    'involved_indices': indices
                })
                
        return flags

    def check_all_rules(self, fields: Dict[str, Any]) -> List[RuleFlag]:
        """
        Run all rules against the provided fields.

        Args:
            fields: Dictionary of verified field values

        Returns:
            List of RuleFlag objects for any violations found
        """
        flags = []

        # Run each rule check
        flag = self._check_rule_a1(fields)
        if flag:
            flags.append(flag)

        flag = self._check_rule_a2(fields)
        if flag:
            flags.append(flag)

        flag = self._check_rule_b1(fields)
        if flag:
            flags.append(flag)

        flag = self._check_rule_b2(fields)
        if flag:
            flags.append(flag)

        flag = self._check_rule_s1(fields)
        if flag:
            flags.append(flag)

        flag = self._check_rule_d1(fields)
        if flag:
            flags.append(flag)
            
        flag = self._check_rule_e1(fields)
        if flag:
            flags.append(flag)

        # Note: C1 requires multiple bureau data - handled separately

        return flags

    def check_cross_bureau(self, bureau_data: List[Dict[str, Any]]) -> List[RuleFlag]:
        """
        Check rules that require data from multiple bureaus.

        Args:
            bureau_data: List of field dictionaries, one per bureau

        Returns:
            List of RuleFlag objects for violations
        """
        flags = []

        flag = self._check_rule_c1(bureau_data)
        if flag:
            flags.append(flag)

        return flags

    def _check_rule_a1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """
        A1: Estimated removal > 8 years after reported date_opened
        """
        date_opened = fields.get('date_opened')
        removal_date = fields.get('estimated_removal_date')

        if not date_opened or not removal_date:
            return None

        if not validate_iso_date(date_opened) or not validate_iso_date(removal_date):
            return None

        years_diff = calculate_years_difference(date_opened, removal_date)

        if years_diff and years_diff > 8.0:
            rule = self.rules['A1']
            return RuleFlag(
                rule_id='A1',
                rule_name=rule['name'],
                severity=rule['severity'],
                explanation=(
                    f"The estimated removal date ({removal_date}) is {years_diff:.1f} years "
                    f"after the date opened ({date_opened}). This exceeds the typical "
                    f"7-year reporting period by more than 1 year."
                ),
                why_it_matters=rule['why_it_matters'],
                suggested_evidence=rule['suggested_evidence'],
                field_values={
                    'date_opened': date_opened,
                    'estimated_removal_date': removal_date,
                    'years_difference': years_diff
                }
            )

        return None

    def _check_rule_a2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """
        A2: Estimated removal inconsistent with (DOFD + ~7 years)
        """
        dofd = fields.get('dofd')
        removal_date = fields.get('estimated_removal_date')

        if not dofd or not removal_date:
            return None

        if not validate_iso_date(dofd) or not validate_iso_date(removal_date):
            return None

        # Calculate expected removal date (DOFD + 7 years + 180 days)
        expected_removal = estimate_removal_date(dofd)

        if not expected_removal:
            return None

        # Check if reported removal date differs significantly
        try:
            expected_dt = datetime.strptime(expected_removal, '%Y-%m-%d')
            reported_dt = datetime.strptime(removal_date, '%Y-%m-%d')
            diff_days = abs((reported_dt - expected_dt).days)

            if diff_days > self.tolerance_days:
                rule = self.rules['A2']
                diff_months = diff_days // 30

                return RuleFlag(
                    rule_id='A2',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"The estimated removal date ({removal_date}) does not align with "
                        f"the expected removal date based on DOFD ({dofd}). Expected removal "
                        f"around {expected_removal}, but reported removal is {diff_months} "
                        f"months different."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'dofd': dofd,
                        'estimated_removal_date': removal_date,
                        'expected_removal_date': expected_removal,
                        'difference_days': diff_days
                    }
                )
        except ValueError:
            pass

        return None

    def _check_rule_b1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """
        B1: date_opened > 24 months after DOFD
        """
        dofd = fields.get('dofd')
        date_opened = fields.get('date_opened')

        if not dofd or not date_opened:
            return None

        if not validate_iso_date(dofd) or not validate_iso_date(date_opened):
            return None

        years_diff = calculate_years_difference(dofd, date_opened)

        # Check if date_opened is after DOFD
        try:
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            opened_dt = datetime.strptime(date_opened, '%Y-%m-%d')

            if opened_dt > dofd_dt:
                months_diff = ((opened_dt.year - dofd_dt.year) * 12 +
                              (opened_dt.month - dofd_dt.month))

                if months_diff > 24:
                    rule = self.rules['B1']
                    return RuleFlag(
                        rule_id='B1',
                        rule_name=rule['name'],
                        severity=rule['severity'],
                        explanation=(
                            f"The date opened ({date_opened}) is {months_diff} months "
                            f"after the Date of First Delinquency ({dofd}). This suggests "
                            f"the account may have been re-aged when transferred to a "
                            f"collection agency."
                        ),
                        why_it_matters=rule['why_it_matters'],
                        suggested_evidence=rule['suggested_evidence'],
                        field_values={
                            'dofd': dofd,
                            'date_opened': date_opened,
                            'months_after_dofd': months_diff
                        }
                    )
        except ValueError:
            pass

        return None

    def _check_rule_b2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """
        B2: No DOFD shown + recent date_opened on a collection account
        """
        dofd = fields.get('dofd')
        date_opened = fields.get('date_opened')
        account_type = fields.get('account_type', '').lower()

        # Only applies to collection accounts
        if account_type != 'collection':
            return None

        # Check if DOFD is missing
        if dofd and validate_iso_date(dofd):
            return None  # DOFD is present, rule does not apply

        if not date_opened or not validate_iso_date(date_opened):
            return None

        # Check if date_opened is within last 3 years
        try:
            opened_dt = datetime.strptime(date_opened, '%Y-%m-%d')
            now = datetime.now()
            years_ago = (now - opened_dt).days / 365.25

            if years_ago < 3:
                rule = self.rules['B2']
                return RuleFlag(
                    rule_id='B2',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"This collection account shows a date opened of {date_opened} "
                        f"(within the last {years_ago:.1f} years) but does not display "
                        f"a Date of First Delinquency (DOFD). The missing DOFD makes it "
                        f"impossible to verify the proper removal date."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'date_opened': date_opened,
                        'dofd': 'NOT REPORTED',
                        'account_type': account_type,
                        'years_since_opened': round(years_ago, 1)
                    }
                )
        except ValueError:
            pass

        return None

    def _check_rule_e1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """
        E1: Future date detection
        """
        date_fields = ['date_opened', 'date_reported_or_updated', 'dofd', 'estimated_removal_date']
        now = datetime.now()
        
        for field in date_fields:
            val = fields.get(field)
            if val and validate_iso_date(val):
                try:
                    dt = datetime.strptime(val, '%Y-%m-%d')
                    # Give a 1-day buffer for timezone differences
                    if dt > now + relativedelta(days=1):
                        rule = self.rules['E1']
                        return RuleFlag(
                            rule_id='E1',
                            rule_name=rule['name'],
                            severity=rule['severity'],
                            explanation=(
                                f"The {field.replace('_', ' ')} is reported as {val}, which is in "
                                f"the future. This is a clear data integrity violation."
                            ),
                            why_it_matters=rule['why_it_matters'],
                            suggested_evidence=rule['suggested_evidence'],
                            field_values={
                                'field': field,
                                'reported_date': val,
                                'current_date': now.strftime('%Y-%m-%d')
                            }
                        )
                except ValueError:
                    pass
        return None

    def _check_rule_d1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """
        D1: Account status 'paid'/'settled' but balance > 0
        """
        status = fields.get('account_status', '').lower() if fields.get('account_status') else ''
        balance_str = fields.get('current_balance', '0')
        
        if not status or not balance_str:
            return None
            
        try:
            balance = float(str(balance_str).replace(',', ''))
            if status in ['paid', 'settled', 'closed'] and balance > 0:
                rule = self.rules['D1']
                return RuleFlag(
                    rule_id='D1',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"The account status is '{status.upper()}', but a balance of ${balance:,.2f} "
                        f"is still being reported. If an account is paid or settled, the reported "
                        f"balance should be $0."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'account_status': status,
                        'current_balance': balance
                    }
                )
        except ValueError:
            pass
            
        return None

    def _check_rule_s1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """
        S1: Check if debt is beyond state SOL
        """
        from app.state_sol import check_sol_expired
        
        state_code = fields.get('state_code')
        dofd = fields.get('dofd')
        
        if not state_code or not dofd:
            return None
            
        is_expired, sol_years, explanation = check_sol_expired(state_code, dofd)
        
        if is_expired:
            rule = self.rules['S1']
            return RuleFlag(
                rule_id='S1',
                rule_name=rule['name'],
                severity=rule['severity'],
                explanation=explanation,
                why_it_matters=rule['why_it_matters'],
                suggested_evidence=rule['suggested_evidence'],
                field_values={
                    'state': state_code,
                    'dofd': dofd,
                    'sol_limit_years': sol_years
                }
            )
            
        return None

    def _check_rule_c1(self, bureau_data: List[Dict[str, Any]]) -> Optional[RuleFlag]:
        """
        C1: Multiple bureaus with materially different removal timelines
        """
        if len(bureau_data) < 2:
            return None

        removal_dates = []
        for data in bureau_data:
            removal = data.get('estimated_removal_date')
            bureau = data.get('bureau', 'Unknown')
            if removal and validate_iso_date(removal):
                removal_dates.append((bureau, removal))

        if len(removal_dates) < 2:
            return None

        # Compare all pairs of removal dates
        max_diff_days = 0
        bureau_pair = None

        for i in range(len(removal_dates)):
            for j in range(i + 1, len(removal_dates)):
                try:
                    dt1 = datetime.strptime(removal_dates[i][1], '%Y-%m-%d')
                    dt2 = datetime.strptime(removal_dates[j][1], '%Y-%m-%d')
                    diff = abs((dt2 - dt1).days)

                    if diff > max_diff_days:
                        max_diff_days = diff
                        bureau_pair = (removal_dates[i], removal_dates[j])
                except ValueError:
                    continue

        # Flag if difference is more than 6 months
        if max_diff_days > 180 and bureau_pair:
            rule = self.rules['C1']
            return RuleFlag(
                rule_id='C1',
                rule_name=rule['name'],
                severity=rule['severity'],
                explanation=(
                    f"The removal dates differ significantly between bureaus: "
                    f"{bureau_pair[0][0]} shows {bureau_pair[0][1]}, while "
                    f"{bureau_pair[1][0]} shows {bureau_pair[1][1]}. "
                    f"This is a difference of {max_diff_days} days "
                    f"({max_diff_days // 30} months)."
                ),
                why_it_matters=rule['why_it_matters'],
                suggested_evidence=rule['suggested_evidence'],
                field_values={
                    'bureau_1': bureau_pair[0][0],
                    'removal_1': bureau_pair[0][1],
                    'bureau_2': bureau_pair[1][0],
                    'removal_2': bureau_pair[1][1],
                    'difference_days': max_diff_days
                }
            )

        return None


def run_rules(fields: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Convenience function to run all rules.

    Args:
        fields: Dictionary of verified field values

    Returns:
        List of flag dictionaries
    """
    engine = RuleEngine()
    flags = engine.check_all_rules(fields)
    return [flag.to_dict() for flag in flags]


def get_rule_documentation() -> str:
    """
    Generate human-readable documentation of all rules.

    Returns:
        Markdown-formatted string documenting all rules
    """
    doc = "# Debt Re-Aging Detection Rules\n\n"
    doc += "This document describes the rules used to detect potential debt re-aging "
    doc += "and timeline inconsistencies in credit reports.\n\n"

    for rule_id, rule in RULE_DEFINITIONS.items():
        doc += f"## Rule {rule_id}: {rule['name']}\n\n"
        doc += f"**Severity:** {rule['severity'].upper()}\n\n"
        doc += f"**Description:** {rule['description']}\n\n"
        doc += f"**Why This Matters:**\n{rule['why_it_matters']}\n\n"
        doc += "**Suggested Evidence to Gather:**\n"
        for evidence in rule['suggested_evidence']:
            doc += f"- {evidence}\n"
        doc += "\n---\n\n"

    return doc
