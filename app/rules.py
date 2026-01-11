"""
Rule engine for detecting debt re-aging and timeline inconsistencies.

All rules are transparent, documented, and produce human-readable explanations.
"""

import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from dateutil.relativedelta import relativedelta
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
    # ============ TIMELINE RULES (A-series) ============
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

    # ============ RE-AGING INDICATORS (B-series) ============
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

    # ============ CROSS-BUREAU RULES (C-series) ============
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

    # ============ STATUS/BALANCE RULES (D-series) ============
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

    # ============ DATA INTEGRITY RULES (E-series) ============
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
    },

    # ============ PAYMENT/BALANCE MANIPULATION (F-series) ============
    'F1': {
        'name': 'Payment Activity Without Balance Reduction',
        'severity': 'high',
        'description': 'Payment activity is recorded but balance remains unchanged or increased.',
        'why_it_matters': (
            'When a payment is made, the balance must decrease by at least the payment amount '
            '(minus any legitimate interest). If payments are being recorded but the balance '
            'is not decreasing, this could indicate misapplication of payments, phantom fees, '
            'or fraudulent accounting practices that violate the FDCPA.'
        ),
        'suggested_evidence': [
            'Payment receipts or bank statements showing payments made',
            'Account statements before and after payment',
            'Written correspondence about payment application',
            'Amortization schedule if applicable'
        ]
    },
    'F2': {
        'name': 'Suspicious Last Activity Date Refresh',
        'severity': 'high',
        'description': 'Last activity date was updated recently on an old debt.',
        'why_it_matters': (
            'Debt collectors sometimes "refresh" the last activity date by reporting minor '
            'account activity (calls, letters, account reviews) to make old debts appear more '
            'recent. This is a re-aging tactic that can reset the clock on how long debt '
            'appears on your credit report, violating FCRA provisions.'
        ),
        'suggested_evidence': [
            'Prior credit reports showing older activity dates',
            'Proof that no legitimate account activity occurred',
            'Call logs or correspondence from collector',
            'Documentation of original DOFD'
        ]
    },

    # ============ FEE/INTEREST ABUSE (G-series) ============
    'G1': {
        'name': 'Excessive Balance Growth on Collection Account',
        'severity': 'medium',
        'description': 'Current balance significantly exceeds the original debt amount.',
        'why_it_matters': (
            'The FDCPA limits what fees and interest collectors can add to a debt. If the '
            'current balance is more than 150% of the original amount, this may indicate '
            'illegal fee stacking, unauthorized interest, or fabricated charges. Many states '
            'prohibit collectors from adding any fees not explicitly authorized in the '
            'original credit agreement.'
        ),
        'suggested_evidence': [
            'Original account statements showing initial balance',
            'Itemized breakdown of current balance from collector',
            'Original credit agreement showing allowed fees/interest',
            'State laws on collection fee limits'
        ]
    },
    'G2': {
        'name': 'Balance Increased After Account Transfer',
        'severity': 'high',
        'description': 'The balance increased when the account was transferred to a new collector.',
        'why_it_matters': (
            'When debt is sold or transferred, the balance should remain the same or decrease. '
            'Debt buyers typically purchase debts for pennies on the dollar. Any increase in '
            'balance at the point of transfer indicates fabricated charges, which is a violation '
            'of the FDCPA prohibition against collecting amounts not authorized by the agreement.'
        ),
        'suggested_evidence': [
            'Credit reports before and after transfer showing balance change',
            'Notice of debt sale or assignment',
            'Account statements from original creditor',
            'Validation letter showing balance breakdown'
        ]
    },

    # ============ MEDICAL DEBT RULES (H-series) ============
    'H1': {
        'name': 'Medical Debt Reported Prematurely',
        'severity': 'high',
        'description': 'Medical collection reported less than 365 days from service date.',
        'why_it_matters': (
            'As of 2023, new CFPB rules require that medical debt cannot be reported to credit '
            'bureaus until at least one year after the date of service. This waiting period '
            'allows time for insurance processing and billing disputes. Medical debt reported '
            'before this period is a violation of current credit reporting regulations.'
        ),
        'suggested_evidence': [
            'Medical bills showing date of service',
            'Explanation of Benefits (EOB) from insurance',
            'Insurance claim processing timeline',
            'Any correspondence with medical provider about payment'
        ]
    },
    'H2': {
        'name': 'Paid Medical Debt Still Reporting',
        'severity': 'high',
        'description': 'A medical debt that has been paid is still appearing on the credit report.',
        'why_it_matters': (
            'Under current regulations, paid medical debts must be removed from credit reports. '
            'The three major credit bureaus agreed to remove all paid medical collection debt. '
            'If a paid medical account still appears, the furnisher is violating both this '
            'agreement and FCRA accuracy requirements.'
        ),
        'suggested_evidence': [
            'Payment receipt for medical debt',
            'Zero balance statement from provider or collector',
            'Insurance EOB showing claim was paid',
            'Bank statement showing payment cleared'
        ]
    },
    'H3': {
        'name': 'Medical Debt Under Reporting Threshold',
        'severity': 'medium',
        'description': 'Medical debt is below the $500 reporting threshold.',
        'why_it_matters': (
            'As of 2023, medical debts under $500 should not appear on credit reports under '
            'new credit bureau policies. If a medical collection under this threshold is being '
            'reported, it may be in violation of current reporting standards and should be '
            'removed upon dispute.'
        ),
        'suggested_evidence': [
            'Credit report showing the balance amount',
            'Original medical bill showing amount owed',
            'Documentation that this is medical debt'
        ]
    },

    # ============ CREDIT LIMIT/UTILIZATION MANIPULATION (I-series) ============
    'I1': {
        'name': 'Credit Limit Suppression',
        'severity': 'medium',
        'description': 'Credit limit reported as zero or equal to balance on revolving account.',
        'why_it_matters': (
            'When a creditor reports a $0 credit limit or sets the limit equal to the balance, '
            'it artificially inflates your credit utilization ratio to 100%. This tanks your '
            'credit score unfairly. Closed accounts should retain their historical credit limit '
            'to accurately reflect utilization history.'
        ),
        'suggested_evidence': [
            'Original account agreement showing credit limit',
            'Prior statements showing higher credit limit',
            'Prior credit reports showing correct limit',
            'Account opening documentation'
        ]
    },
    'I2': {
        'name': 'Collection Account Age Mismatch',
        'severity': 'high',
        'description': 'Collection account date opened differs significantly from original account.',
        'why_it_matters': (
            'When debt is transferred to collections, the new account should inherit the '
            'original accounts open date for credit history purposes. If the collection agency '
            'uses their own acquisition date, it can artificially shorten your credit history '
            'length and misrepresent the true age of the debt relationship.'
        ),
        'suggested_evidence': [
            'Original account statements showing open date',
            'Prior credit reports showing original creditor',
            'Documentation from original creditor',
            'Debt validation response from collector'
        ]
    },

    # ============ ZOMBIE DEBT / REVIVAL RULES (J-series) ============
    'J1': {
        'name': 'Zombie Debt Revival',
        'severity': 'high',
        'description': 'Dormant account suddenly shows new reporting activity after years of inactivity.',
        'why_it_matters': (
            'When a debt that has been inactive for years suddenly shows new reporting activity, '
            'it often indicates the debt was purchased by a new collector who is attempting to '
            '"revive" it. This re-aging tactic tries to restart the 7-year reporting clock and '
            'is a violation of FCRA. Old debts should naturally fall off, not reappear.'
        ),
        'suggested_evidence': [
            'Prior credit reports showing the account dormant or not present',
            'Documentation of original DOFD',
            'Proof that no legitimate new activity occurred',
            'Any debt sale notices received'
        ]
    },
    'J2': {
        'name': 'Multiple Collector Waterfall',
        'severity': 'high',
        'description': 'Same debt appears to have been reported by 3+ different collectors.',
        'why_it_matters': (
            'When the same debt has been handled by multiple collectors (a "waterfall"), each '
            'previous collector should have zeroed out their tradeline. If multiple collectors '
            'are reporting the same debt simultaneously, or if the debt keeps reappearing under '
            'new names, this multiplies the negative impact and may indicate improper reporting.'
        ),
        'suggested_evidence': [
            'Credit reports showing multiple entries for same original debt',
            'Original creditor account number on each entry',
            'Debt sale/assignment notices',
            'Correspondence from different collectors about same debt'
        ]
    },

    # ============ INNOVATIVE/ADVANCED RULES (K-series) ============
    'K1': {
        'name': 'Impossible Delinquency Sequence',
        'severity': 'high',
        'description': 'Payment history shows delinquency pattern that is mathematically impossible.',
        'why_it_matters': (
            'Credit reports show payment history as a sequence (e.g., current, 30, 60, 90 days late). '
            'A valid sequence must progress logically - you cannot be 90 days late without first being '
            '30 and 60 days late. Sequences that skip stages or show impossible patterns indicate '
            'data corruption or manipulation.'
        ),
        'suggested_evidence': [
            'Credit report showing payment history sequence',
            'Bank statements showing actual payment dates',
            'Creditor account statements',
            'Payment confirmation records'
        ]
    },
    'K2': {
        'name': 'Suspiciously Round Balance',
        'severity': 'low',
        'description': 'Reported balance is an exact round number suggesting estimation or fabrication.',
        'why_it_matters': (
            'Real debts rarely end in exact round numbers like $5,000.00 or $10,000.00 due to '
            'interest calculations, fees, and partial payments. While not definitive proof of '
            'problems, suspiciously round balances on collection accounts may indicate the '
            'collector is reporting estimated amounts rather than actual verified balances.'
        ),
        'suggested_evidence': [
            'Request itemized statement from collector',
            'Original account statements',
            'Validation of debt showing balance breakdown'
        ]
    },
    'K3': {
        'name': 'High Balance Exceeds Credit Limit',
        'severity': 'medium',
        'description': 'The reported high balance exceeds the credit limit significantly.',
        'why_it_matters': (
            'While some over-limit spending is possible, a high balance that dramatically exceeds '
            'the credit limit (by more than 20%) suggests either incorrect data, fee abuse, or '
            'manipulation of the account terms. This affects your utilization calculations and '
            'may indicate the creditor changed terms without proper notice.'
        ),
        'suggested_evidence': [
            'Original credit agreement showing limit',
            'Account statements showing balance history',
            'Any notices of credit limit changes',
            'Over-limit fee history'
        ]
    },
    'K4': {
        'name': 'Date of Last Payment Inconsistency',
        'severity': 'medium',
        'description': 'Date of last payment does not align with DOFD and account status timeline.',
        'why_it_matters': (
            'The date of last payment should logically precede or closely follow the DOFD. '
            'If the last payment date is years after the DOFD, or if payments appear after '
            'the account was charged off, this indicates either data errors or potential '
            'SOL manipulation (collectors sometimes falsely report payments to restart SOL).'
        ),
        'suggested_evidence': [
            'Bank statements showing actual last payment',
            'Account statements from creditor',
            'Documentation of DOFD',
            'Payment history records'
        ]
    },
    'K5': {
        'name': 'Minimum Payment Trap Indicator',
        'severity': 'low',
        'description': 'Account shows pattern of minimum payments with balance increases over time.',
        'why_it_matters': (
            'While not necessarily a reporting error, this pattern indicates the consumer may '
            'be trapped in a cycle where minimum payments do not cover interest, causing the '
            'balance to grow despite regular payments. This can be a sign of predatory lending '
            'practices that may be challengeable under state consumer protection laws.'
        ),
        'suggested_evidence': [
            'Complete payment history',
            'Account statements showing interest rates',
            'Minimum payment calculations',
            'Original credit terms and APR'
        ]
    },

    # ============ STATUTE OF LIMITATIONS (S-series) ============
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
    'S2': {
        'name': 'SOL Revival Through Partial Payment',
        'severity': 'high',
        'description': 'A partial payment may have restarted the statute of limitations on a time-barred debt.',
        'why_it_matters': (
            'In many states, making a partial payment on a time-barred debt can restart the '
            'statute of limitations, giving collectors new legal power to sue. If a payment '
            'was recorded shortly before new collection activity began on an old debt, the '
            'consumer may have unknowingly revived the debt. This payment should be verified.'
        ),
        'suggested_evidence': [
            'Records of any payments made',
            'State SOL laws regarding debt revival',
            'Timeline of collection activity',
            'Written acknowledgment requests from collector'
        ]
    },

    # ============ DUPLICATE DETECTION (DU-series) ============
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
    'DU2': {
        'name': 'Same Debt Different Account Numbers',
        'severity': 'medium',
        'description': 'Multiple accounts with different numbers appear to reference the same original debt.',
        'why_it_matters': (
            'Collectors sometimes report the same debt under different account numbers, either '
            'due to internal numbering changes or intentional obfuscation. This makes it harder '
            'for consumers to track and dispute debts, and can result in the same debt being '
            'counted multiple times in creditworthiness calculations.'
        ),
        'suggested_evidence': [
            'Credit reports showing similar balances/dates across accounts',
            'Original creditor name on each entry',
            'Debt validation requests for each account',
            'Timeline showing when accounts appeared'
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

        # Rule DU1: Duplicate Reporting by Balance
        seen_balances = {}  # balance -> [account_info]

        for i, acc in enumerate(accounts):
            balance = acc.get('current_balance')
            if balance and balance != '0' and balance != '0.00':
                try:
                    bal_float = float(str(balance).replace(',', '').replace('$', ''))
                    if bal_float > 0:
                        bal_key = f"{bal_float:.2f}"
                        if bal_key not in seen_balances:
                            seen_balances[bal_key] = []
                        seen_balances[bal_key].append({
                            'index': i,
                            'furnisher': acc.get('furnisher_or_collector', 'Unknown'),
                            'original_creditor': acc.get('original_creditor', ''),
                            'date_opened': acc.get('date_opened', '')
                        })
                except (ValueError, TypeError):
                    pass

        for balance, accounts_list in seen_balances.items():
            if len(accounts_list) >= 2:
                rule = self.rules['DU1']
                furnishers = [a['furnisher'] for a in accounts_list]

                flags.append({
                    'rule_id': 'DU1',
                    'rule_name': rule['name'],
                    'severity': rule['severity'],
                    'explanation': (
                        f"Potential duplicate: Balance ${balance} reported by multiple furnishers: "
                        f"{', '.join(furnishers)}. If this is the same debt, only one should report a balance."
                    ),
                    'why_it_matters': rule['why_it_matters'],
                    'suggested_evidence': rule['suggested_evidence'],
                    'involved_indices': [a['index'] for a in accounts_list]
                })

        # Rule J2: Multiple Collector Waterfall
        original_creditor_map = {}  # original_creditor -> [collectors]

        for i, acc in enumerate(accounts):
            orig = acc.get('original_creditor', '').strip().lower()
            collector = acc.get('furnisher_or_collector', '')
            acc_type = acc.get('account_type', '').lower()

            if orig and acc_type == 'collection':
                if orig not in original_creditor_map:
                    original_creditor_map[orig] = []
                original_creditor_map[orig].append({
                    'index': i,
                    'collector': collector,
                    'balance': acc.get('current_balance', '0')
                })

        for orig_creditor, collectors in original_creditor_map.items():
            if len(collectors) >= 3:
                rule = self.rules['J2']
                collector_names = [c['collector'] for c in collectors]

                flags.append({
                    'rule_id': 'J2',
                    'rule_name': rule['name'],
                    'severity': rule['severity'],
                    'explanation': (
                        f"Debt from '{orig_creditor}' appears with {len(collectors)} different collectors: "
                        f"{', '.join(collector_names)}. This waterfall pattern may indicate improper reporting."
                    ),
                    'why_it_matters': rule['why_it_matters'],
                    'suggested_evidence': rule['suggested_evidence'],
                    'involved_indices': [c['index'] for c in collectors]
                })

        # Rule DU2: Same Debt Different Account Numbers
        # Group by similar characteristics (original creditor + similar balance + similar dates)
        potential_dupes = {}
        for i, acc in enumerate(accounts):
            orig = acc.get('original_creditor', '').strip().lower()
            balance = acc.get('current_balance', '0')
            try:
                bal_float = float(str(balance).replace(',', '').replace('$', ''))
                # Round to nearest $100 for grouping
                bal_bucket = round(bal_float / 100) * 100
            except:
                bal_bucket = 0

            if orig and bal_bucket > 0:
                key = f"{orig}|{bal_bucket}"
                if key not in potential_dupes:
                    potential_dupes[key] = []
                potential_dupes[key].append({
                    'index': i,
                    'furnisher': acc.get('furnisher_or_collector', ''),
                    'account_number': acc.get('account_number', ''),
                    'balance': balance
                })

        for key, accts in potential_dupes.items():
            if len(accts) >= 2:
                # Check if account numbers are different
                acct_nums = set(a['account_number'] for a in accts if a['account_number'])
                if len(acct_nums) >= 2:
                    rule = self.rules['DU2']
                    flags.append({
                        'rule_id': 'DU2',
                        'rule_name': rule['name'],
                        'severity': rule['severity'],
                        'explanation': (
                            f"Multiple accounts with different numbers ({', '.join(acct_nums)}) appear to "
                            f"reference the same original debt. Balances: {', '.join(a['balance'] for a in accts)}."
                        ),
                        'why_it_matters': rule['why_it_matters'],
                        'suggested_evidence': rule['suggested_evidence'],
                        'involved_indices': [a['index'] for a in accts]
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

        # Timeline rules (A-series)
        for check in [self._check_rule_a1, self._check_rule_a2]:
            flag = check(fields)
            if flag:
                flags.append(flag)

        # Re-aging indicators (B-series)
        for check in [self._check_rule_b1, self._check_rule_b2]:
            flag = check(fields)
            if flag:
                flags.append(flag)

        # Status/Balance rules (D-series)
        flag = self._check_rule_d1(fields)
        if flag:
            flags.append(flag)

        # Data integrity (E-series)
        flag = self._check_rule_e1(fields)
        if flag:
            flags.append(flag)

        # Payment/Balance manipulation (F-series)
        for check in [self._check_rule_f1, self._check_rule_f2]:
            flag = check(fields)
            if flag:
                flags.append(flag)

        # Fee/Interest abuse (G-series)
        for check in [self._check_rule_g1, self._check_rule_g2]:
            flag = check(fields)
            if flag:
                flags.append(flag)

        # Medical debt rules (H-series)
        for check in [self._check_rule_h1, self._check_rule_h2, self._check_rule_h3]:
            flag = check(fields)
            if flag:
                flags.append(flag)

        # Credit limit manipulation (I-series)
        for check in [self._check_rule_i1, self._check_rule_i2]:
            flag = check(fields)
            if flag:
                flags.append(flag)

        # Zombie debt (J-series)
        flag = self._check_rule_j1(fields)
        if flag:
            flags.append(flag)

        # Innovative rules (K-series)
        for check in [self._check_rule_k1, self._check_rule_k2, self._check_rule_k3,
                      self._check_rule_k4, self._check_rule_k5]:
            flag = check(fields)
            if flag:
                flags.append(flag)

        # SOL rules (S-series)
        for check in [self._check_rule_s1, self._check_rule_s2]:
            flag = check(fields)
            if flag:
                flags.append(flag)

        return flags

    def check_cross_bureau(self, bureau_data: List[Dict[str, Any]]) -> List[RuleFlag]:
        """
        Check rules that require data from multiple bureaus.
        """
        flags = []

        flag = self._check_rule_c1(bureau_data)
        if flag:
            flags.append(flag)

        return flags

    # ============ TIMELINE RULES (A-series) ============

    def _check_rule_a1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """A1: Estimated removal > 8 years after reported date_opened"""
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
        """A2: Estimated removal inconsistent with (DOFD + ~7 years)"""
        dofd = fields.get('dofd')
        removal_date = fields.get('estimated_removal_date')

        if not dofd or not removal_date:
            return None

        if not validate_iso_date(dofd) or not validate_iso_date(removal_date):
            return None

        expected_removal = estimate_removal_date(dofd)
        if not expected_removal:
            return None

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

    # ============ RE-AGING INDICATORS (B-series) ============

    def _check_rule_b1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """B1: date_opened > 24 months after DOFD"""
        dofd = fields.get('dofd')
        date_opened = fields.get('date_opened')

        if not dofd or not date_opened:
            return None

        if not validate_iso_date(dofd) or not validate_iso_date(date_opened):
            return None

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
        """B2: No DOFD shown + recent date_opened on a collection account"""
        dofd = fields.get('dofd')
        date_opened = fields.get('date_opened')
        account_type = fields.get('account_type', '').lower()

        if account_type != 'collection':
            return None

        if dofd and validate_iso_date(dofd):
            return None

        if not date_opened or not validate_iso_date(date_opened):
            return None

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

    # ============ CROSS-BUREAU RULES (C-series) ============

    def _check_rule_c1(self, bureau_data: List[Dict[str, Any]]) -> Optional[RuleFlag]:
        """C1: Multiple bureaus with materially different removal timelines"""
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

    # ============ STATUS/BALANCE RULES (D-series) ============

    def _check_rule_d1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """D1: Account status 'paid'/'settled' but balance > 0"""
        status = fields.get('account_status', '').lower() if fields.get('account_status') else ''
        balance_str = fields.get('current_balance', '0')

        if not status or not balance_str:
            return None

        try:
            balance = float(str(balance_str).replace(',', '').replace('$', ''))
            if status in ['paid', 'settled', 'closed', 'paid in full', 'settled in full'] and balance > 0:
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

    # ============ DATA INTEGRITY RULES (E-series) ============

    def _check_rule_e1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """E1: Future date detection"""
        date_fields = ['date_opened', 'date_reported_or_updated', 'dofd', 'estimated_removal_date',
                       'date_last_activity', 'date_last_payment', 'charge_off_date']
        now = datetime.now()

        for field in date_fields:
            val = fields.get(field)
            if val and validate_iso_date(val):
                try:
                    dt = datetime.strptime(val, '%Y-%m-%d')
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

    # ============ PAYMENT/BALANCE MANIPULATION (F-series) ============

    def _check_rule_f1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """F1: Payment recorded but balance not reduced"""
        last_payment = fields.get('last_payment_amount')
        balance_before = fields.get('previous_balance')
        balance_after = fields.get('current_balance')

        if not last_payment or not balance_before or not balance_after:
            return None

        try:
            payment = float(str(last_payment).replace(',', '').replace('$', ''))
            prev_bal = float(str(balance_before).replace(',', '').replace('$', ''))
            curr_bal = float(str(balance_after).replace(',', '').replace('$', ''))

            if payment > 0 and curr_bal >= prev_bal:
                rule = self.rules['F1']
                return RuleFlag(
                    rule_id='F1',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"A payment of ${payment:,.2f} was recorded, but the balance did not decrease "
                        f"(was ${prev_bal:,.2f}, now ${curr_bal:,.2f}). Payments should reduce the balance."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'last_payment_amount': payment,
                        'previous_balance': prev_bal,
                        'current_balance': curr_bal
                    }
                )
        except (ValueError, TypeError):
            pass

        return None

    def _check_rule_f2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """F2: Suspicious last activity date refresh on old debt"""
        date_last_activity = fields.get('date_last_activity')
        dofd = fields.get('dofd')

        if not date_last_activity or not dofd:
            return None

        if not validate_iso_date(date_last_activity) or not validate_iso_date(dofd):
            return None

        try:
            activity_dt = datetime.strptime(date_last_activity, '%Y-%m-%d')
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            now = datetime.now()

            debt_age_years = (now - dofd_dt).days / 365.25
            activity_age_months = (now - activity_dt).days / 30

            # Flag if debt is > 5 years old but activity is < 6 months old
            if debt_age_years > 5 and activity_age_months < 6:
                rule = self.rules['F2']
                return RuleFlag(
                    rule_id='F2',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"This debt is {debt_age_years:.1f} years old (DOFD: {dofd}), but shows "
                        f"recent activity on {date_last_activity}. This pattern may indicate "
                        f"artificial activity date refreshing to re-age the debt."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'dofd': dofd,
                        'date_last_activity': date_last_activity,
                        'debt_age_years': round(debt_age_years, 1),
                        'activity_age_months': round(activity_age_months, 1)
                    }
                )
        except ValueError:
            pass

        return None

    # ============ FEE/INTEREST ABUSE (G-series) ============

    def _check_rule_g1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """G1: Balance significantly exceeds original amount (fee stacking)"""
        current_balance = fields.get('current_balance')
        original_balance = fields.get('original_balance') or fields.get('original_amount')
        account_type = fields.get('account_type', '').lower()

        if not current_balance or not original_balance:
            return None

        if account_type != 'collection':
            return None

        try:
            current = float(str(current_balance).replace(',', '').replace('$', ''))
            original = float(str(original_balance).replace(',', '').replace('$', ''))

            if original > 0 and current > original * 1.5:
                growth_pct = ((current - original) / original) * 100
                rule = self.rules['G1']
                return RuleFlag(
                    rule_id='G1',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"The current balance (${current:,.2f}) is {growth_pct:.0f}% higher than the "
                        f"original debt amount (${original:,.2f}). This excessive growth may indicate "
                        f"unauthorized fees or interest charges."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'current_balance': current,
                        'original_balance': original,
                        'growth_percentage': round(growth_pct, 1)
                    }
                )
        except (ValueError, TypeError):
            pass

        return None

    def _check_rule_g2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """G2: Balance increased when transferred to new collector"""
        current_balance = fields.get('current_balance')
        balance_at_transfer = fields.get('balance_at_transfer') or fields.get('original_balance')
        account_type = fields.get('account_type', '').lower()

        if not current_balance or not balance_at_transfer:
            return None

        if account_type != 'collection':
            return None

        try:
            current = float(str(current_balance).replace(',', '').replace('$', ''))
            transfer = float(str(balance_at_transfer).replace(',', '').replace('$', ''))

            # Balance increased by more than 5% (allowing for minor rounding)
            if transfer > 0 and current > transfer * 1.05:
                increase = current - transfer
                rule = self.rules['G2']
                return RuleFlag(
                    rule_id='G2',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"The balance increased by ${increase:,.2f} after transfer to this collector "
                        f"(from ${transfer:,.2f} to ${current:,.2f}). Debt balances should not increase "
                        f"when transferred."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'current_balance': current,
                        'balance_at_transfer': transfer,
                        'increase_amount': round(increase, 2)
                    }
                )
        except (ValueError, TypeError):
            pass

        return None

    # ============ MEDICAL DEBT RULES (H-series) ============

    def _check_rule_h1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """H1: Medical debt reported before 365-day waiting period"""
        account_type = fields.get('account_type', '').lower()
        industry_code = fields.get('industry_code', '').lower()
        date_of_service = fields.get('date_of_service')
        date_reported = fields.get('date_reported_or_updated') or fields.get('date_opened')

        # Check if this is medical debt
        is_medical = ('medical' in account_type or 'medical' in industry_code or
                      'healthcare' in account_type or 'hospital' in industry_code)

        if not is_medical:
            return None

        if not date_of_service or not date_reported:
            return None

        if not validate_iso_date(date_of_service) or not validate_iso_date(date_reported):
            return None

        try:
            service_dt = datetime.strptime(date_of_service, '%Y-%m-%d')
            reported_dt = datetime.strptime(date_reported, '%Y-%m-%d')

            days_diff = (reported_dt - service_dt).days

            if days_diff < 365:
                rule = self.rules['H1']
                return RuleFlag(
                    rule_id='H1',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"This medical debt was reported {days_diff} days after the date of service "
                        f"({date_of_service}). Under current regulations, medical debt cannot be "
                        f"reported until at least 365 days after service."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'date_of_service': date_of_service,
                        'date_reported': date_reported,
                        'days_before_eligible': 365 - days_diff
                    }
                )
        except ValueError:
            pass

        return None

    def _check_rule_h2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """H2: Paid medical debt still appearing on report"""
        account_type = fields.get('account_type', '').lower()
        industry_code = fields.get('industry_code', '').lower()
        account_status = fields.get('account_status', '').lower()

        is_medical = ('medical' in account_type or 'medical' in industry_code or
                      'healthcare' in account_type or 'hospital' in industry_code)

        if not is_medical:
            return None

        is_paid = account_status in ['paid', 'paid in full', 'settled', 'settled in full', 'zero balance']

        if is_paid:
            rule = self.rules['H2']
            return RuleFlag(
                rule_id='H2',
                rule_name=rule['name'],
                severity=rule['severity'],
                explanation=(
                    f"This medical debt shows a status of '{account_status}' but is still appearing "
                    f"on the credit report. Under current policies, paid medical debts should be "
                    f"removed from credit reports."
                ),
                why_it_matters=rule['why_it_matters'],
                suggested_evidence=rule['suggested_evidence'],
                field_values={
                    'account_type': account_type,
                    'account_status': account_status
                }
            )

        return None

    def _check_rule_h3(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """H3: Medical debt under $500 threshold"""
        account_type = fields.get('account_type', '').lower()
        industry_code = fields.get('industry_code', '').lower()
        current_balance = fields.get('current_balance')

        is_medical = ('medical' in account_type or 'medical' in industry_code or
                      'healthcare' in account_type or 'hospital' in industry_code)

        if not is_medical or not current_balance:
            return None

        try:
            balance = float(str(current_balance).replace(',', '').replace('$', ''))

            if 0 < balance < 500:
                rule = self.rules['H3']
                return RuleFlag(
                    rule_id='H3',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"This medical debt has a balance of ${balance:,.2f}, which is under the "
                        f"$500 threshold. Under current credit bureau policies, medical debts under "
                        f"$500 should not appear on credit reports."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'current_balance': balance,
                        'threshold': 500
                    }
                )
        except (ValueError, TypeError):
            pass

        return None

    # ============ CREDIT LIMIT MANIPULATION (I-series) ============

    def _check_rule_i1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """I1: Credit limit reported as zero or equal to balance"""
        account_type = fields.get('account_type', '').lower()
        credit_limit = fields.get('credit_limit')
        current_balance = fields.get('current_balance')
        high_balance = fields.get('high_balance')

        # Only applies to revolving accounts
        if 'revolving' not in account_type and 'credit card' not in account_type:
            return None

        if not current_balance:
            return None

        try:
            balance = float(str(current_balance).replace(',', '').replace('$', ''))
            limit = float(str(credit_limit).replace(',', '').replace('$', '')) if credit_limit else 0

            if balance > 0 and (limit == 0 or abs(limit - balance) < 1):
                rule = self.rules['I1']
                return RuleFlag(
                    rule_id='I1',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"This revolving account shows a balance of ${balance:,.2f} but the credit limit "
                        f"is reported as ${limit:,.2f}. This makes utilization appear as 100%, which "
                        f"unfairly damages credit scores."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'current_balance': balance,
                        'credit_limit': limit,
                        'implied_utilization': '100%'
                    }
                )
        except (ValueError, TypeError):
            pass

        return None

    def _check_rule_i2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """I2: Collection account date differs from original account"""
        account_type = fields.get('account_type', '').lower()
        date_opened = fields.get('date_opened')
        original_open_date = fields.get('original_open_date') or fields.get('original_account_date')

        if account_type != 'collection':
            return None

        if not date_opened or not original_open_date:
            return None

        if not validate_iso_date(date_opened) or not validate_iso_date(original_open_date):
            return None

        try:
            opened_dt = datetime.strptime(date_opened, '%Y-%m-%d')
            original_dt = datetime.strptime(original_open_date, '%Y-%m-%d')

            diff_months = abs((opened_dt.year - original_dt.year) * 12 +
                             (opened_dt.month - original_dt.month))

            if diff_months > 6:
                rule = self.rules['I2']
                return RuleFlag(
                    rule_id='I2',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"The collection account open date ({date_opened}) differs from the original "
                        f"account date ({original_open_date}) by {diff_months} months. Collection "
                        f"accounts should preserve the original account's open date."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'date_opened': date_opened,
                        'original_open_date': original_open_date,
                        'difference_months': diff_months
                    }
                )
        except ValueError:
            pass

        return None

    # ============ ZOMBIE DEBT RULES (J-series) ============

    def _check_rule_j1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """J1: Dormant account suddenly shows new activity"""
        date_last_activity = fields.get('date_last_activity')
        previous_activity_date = fields.get('previous_activity_date')
        date_reported = fields.get('date_reported_or_updated')
        dofd = fields.get('dofd')

        if not date_reported or not dofd:
            return None

        if not validate_iso_date(date_reported) or not validate_iso_date(dofd):
            return None

        try:
            reported_dt = datetime.strptime(date_reported, '%Y-%m-%d')
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            now = datetime.now()

            debt_age_years = (now - dofd_dt).days / 365.25
            reporting_age_months = (now - reported_dt).days / 30

            # Debt is > 5 years old but was reported/updated recently (< 6 months)
            if debt_age_years > 5 and reporting_age_months < 6:
                rule = self.rules['J1']
                return RuleFlag(
                    rule_id='J1',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"This debt is {debt_age_years:.1f} years old (DOFD: {dofd}), but was recently "
                        f"reported/updated on {date_reported}. This pattern suggests a 'zombie debt' "
                        f"that may have been purchased and revived by a new collector."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'dofd': dofd,
                        'date_reported': date_reported,
                        'debt_age_years': round(debt_age_years, 1)
                    }
                )
        except ValueError:
            pass

        return None

    # ============ INNOVATIVE RULES (K-series) ============

    def _check_rule_k1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K1: Impossible delinquency sequence"""
        payment_history = fields.get('payment_history', '')

        if not payment_history or len(payment_history) < 3:
            return None

        # Payment history is often encoded as string like "CCCC30306090" or similar
        # Look for impossible jumps (e.g., 0 to 90 without 30, 60)
        history = str(payment_history).upper()

        # Check for skipped delinquency stages
        impossible_patterns = [
            ('C90', 'Current directly to 90 days late'),
            ('C60', 'Current directly to 60 days late'),
            ('0090', 'On-time directly to 90 days'),
            ('0060', 'On-time directly to 60 days'),
            ('30090', '30 days directly to 90 days (skipped 60)'),
        ]

        for pattern, desc in impossible_patterns:
            if pattern in history.replace(' ', '').replace('-', ''):
                rule = self.rules['K1']
                return RuleFlag(
                    rule_id='K1',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"The payment history shows an impossible sequence: {desc}. "
                        f"Delinquency must progress through each stage (30, 60, 90 days). "
                        f"This indicates data corruption or manipulation."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'payment_history': payment_history,
                        'impossible_pattern': desc
                    }
                )

        return None

    def _check_rule_k2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K2: Suspiciously round balance"""
        current_balance = fields.get('current_balance')
        account_type = fields.get('account_type', '').lower()

        if not current_balance or account_type != 'collection':
            return None

        try:
            balance = float(str(current_balance).replace(',', '').replace('$', ''))

            # Check if balance is a round thousand
            if balance >= 1000 and balance % 1000 == 0:
                rule = self.rules['K2']
                return RuleFlag(
                    rule_id='K2',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"The reported balance (${balance:,.2f}) is an exact round number. "
                        f"Real debt balances with interest and fees rarely end in exact thousands. "
                        f"Consider requesting an itemized statement to verify accuracy."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'current_balance': balance
                    }
                )
        except (ValueError, TypeError):
            pass

        return None

    def _check_rule_k3(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K3: High balance exceeds credit limit significantly"""
        high_balance = fields.get('high_balance')
        credit_limit = fields.get('credit_limit')

        if not high_balance or not credit_limit:
            return None

        try:
            high = float(str(high_balance).replace(',', '').replace('$', ''))
            limit = float(str(credit_limit).replace(',', '').replace('$', ''))

            if limit > 0 and high > limit * 1.2:  # More than 20% over limit
                overage_pct = ((high - limit) / limit) * 100
                rule = self.rules['K3']
                return RuleFlag(
                    rule_id='K3',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"The high balance (${high:,.2f}) exceeds the credit limit "
                        f"(${limit:,.2f}) by {overage_pct:.0f}%. While some over-limit activity "
                        f"is possible, this significant difference may indicate incorrect data."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'high_balance': high,
                        'credit_limit': limit,
                        'overage_percentage': round(overage_pct, 1)
                    }
                )
        except (ValueError, TypeError):
            pass

        return None

    def _check_rule_k4(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K4: Date of last payment inconsistency"""
        date_last_payment = fields.get('date_last_payment')
        dofd = fields.get('dofd')
        charge_off_date = fields.get('charge_off_date')

        if not date_last_payment or not dofd:
            return None

        if not validate_iso_date(date_last_payment) or not validate_iso_date(dofd):
            return None

        try:
            payment_dt = datetime.strptime(date_last_payment, '%Y-%m-%d')
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')

            # Last payment should be before or around DOFD, not years after
            if payment_dt > dofd_dt:
                years_after = (payment_dt - dofd_dt).days / 365.25

                if years_after > 2:
                    rule = self.rules['K4']
                    return RuleFlag(
                        rule_id='K4',
                        rule_name=rule['name'],
                        severity=rule['severity'],
                        explanation=(
                            f"The date of last payment ({date_last_payment}) is {years_after:.1f} years "
                            f"after the DOFD ({dofd}). Payments should typically precede or closely follow "
                            f"the delinquency date. This may indicate data errors or SOL manipulation."
                        ),
                        why_it_matters=rule['why_it_matters'],
                        suggested_evidence=rule['suggested_evidence'],
                        field_values={
                            'date_last_payment': date_last_payment,
                            'dofd': dofd,
                            'years_after_dofd': round(years_after, 1)
                        }
                    )
        except ValueError:
            pass

        return None

    def _check_rule_k5(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K5: Minimum payment trap indicator"""
        current_balance = fields.get('current_balance')
        original_balance = fields.get('original_balance')
        months_reviewed = fields.get('months_reviewed')
        total_payments = fields.get('total_payments')

        if not current_balance or not original_balance or not months_reviewed:
            return None

        try:
            current = float(str(current_balance).replace(',', '').replace('$', ''))
            original = float(str(original_balance).replace(',', '').replace('$', ''))
            months = int(months_reviewed)
            payments = float(str(total_payments).replace(',', '').replace('$', '')) if total_payments else 0

            # If they've paid significant amounts over many months but balance grew
            if months > 24 and payments > original * 0.5 and current > original:
                rule = self.rules['K5']
                return RuleFlag(
                    rule_id='K5',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"Over {months} months, payments of ${payments:,.2f} were made but the balance "
                        f"increased from ${original:,.2f} to ${current:,.2f}. This pattern indicates "
                        f"a minimum payment trap where payments don't cover interest."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'current_balance': current,
                        'original_balance': original,
                        'total_payments': payments,
                        'months_reviewed': months
                    }
                )
        except (ValueError, TypeError):
            pass

        return None

    # ============ SOL RULES (S-series) ============

    def _check_rule_s1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """S1: Check if debt is beyond state SOL"""
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

    def _check_rule_s2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """S2: Check for potential SOL revival through payment"""
        from app.state_sol import check_sol_expired

        state_code = fields.get('state_code')
        dofd = fields.get('dofd')
        date_last_payment = fields.get('date_last_payment')

        if not state_code or not dofd or not date_last_payment:
            return None

        if not validate_iso_date(date_last_payment) or not validate_iso_date(dofd):
            return None

        is_expired, sol_years, _ = check_sol_expired(state_code, dofd)

        if not is_expired:
            return None  # Only relevant for debts that would otherwise be expired

        try:
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            payment_dt = datetime.strptime(date_last_payment, '%Y-%m-%d')
            sol_expiry = dofd_dt + relativedelta(years=sol_years)

            # Check if payment was made after original SOL would have expired
            if payment_dt > sol_expiry:
                rule = self.rules['S2']
                return RuleFlag(
                    rule_id='S2',
                    rule_name=rule['name'],
                    severity=rule['severity'],
                    explanation=(
                        f"A payment on {date_last_payment} was made after the original SOL expiry "
                        f"(DOFD {dofd} + {sol_years} years = {sol_expiry.strftime('%Y-%m-%d')}). "
                        f"In some states, this payment may have restarted the statute of limitations."
                    ),
                    why_it_matters=rule['why_it_matters'],
                    suggested_evidence=rule['suggested_evidence'],
                    field_values={
                        'state': state_code,
                        'dofd': dofd,
                        'date_last_payment': date_last_payment,
                        'original_sol_expiry': sol_expiry.strftime('%Y-%m-%d'),
                        'sol_years': sol_years
                    }
                )
        except ValueError:
            pass

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
    doc += f"**Total Rules:** {len(RULE_DEFINITIONS)}\n\n"

    # Group by series
    series = {}
    for rule_id, rule in RULE_DEFINITIONS.items():
        prefix = rule_id[0]
        if prefix not in series:
            series[prefix] = []
        series[prefix].append((rule_id, rule))

    series_names = {
        'A': 'Timeline Rules',
        'B': 'Re-Aging Indicators',
        'C': 'Cross-Bureau Rules',
        'D': 'Status/Balance Rules',
        'E': 'Data Integrity Rules',
        'F': 'Payment/Balance Manipulation',
        'G': 'Fee/Interest Abuse',
        'H': 'Medical Debt Rules',
        'I': 'Credit Limit Manipulation',
        'J': 'Zombie Debt / Revival Rules',
        'K': 'Innovative/Advanced Rules',
        'S': 'Statute of Limitations',
        'DU': 'Duplicate Detection'
    }

    for prefix in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'S', 'DU']:
        if prefix in series:
            doc += f"## {series_names.get(prefix, prefix + '-Series')}\n\n"
            for rule_id, rule in series[prefix]:
                doc += f"### Rule {rule_id}: {rule['name']}\n\n"
                doc += f"**Severity:** {rule['severity'].upper()}\n\n"
                doc += f"**Description:** {rule['description']}\n\n"
                doc += f"**Why This Matters:**\n{rule['why_it_matters']}\n\n"
                doc += "**Suggested Evidence to Gather:**\n"
                for evidence in rule['suggested_evidence']:
                    doc += f"- {evidence}\n"
                doc += "\n---\n\n"

    return doc


def get_rule_summary() -> Dict[str, Any]:
    """
    Get a summary of all rules for UI display.
    """
    summary = {
        'total_rules': len(RULE_DEFINITIONS),
        'by_severity': {'high': 0, 'medium': 0, 'low': 0},
        'by_category': {}
    }

    category_map = {
        'A': 'Timeline',
        'B': 'Re-Aging',
        'C': 'Cross-Bureau',
        'D': 'Status/Balance',
        'E': 'Data Integrity',
        'F': 'Payment Manipulation',
        'G': 'Fee Abuse',
        'H': 'Medical Debt',
        'I': 'Credit Limit',
        'J': 'Zombie Debt',
        'K': 'Advanced',
        'S': 'SOL',
        'DU': 'Duplicates'
    }

    for rule_id, rule in RULE_DEFINITIONS.items():
        severity = rule['severity']
        summary['by_severity'][severity] = summary['by_severity'].get(severity, 0) + 1

        prefix = rule_id[:2] if rule_id.startswith('DU') else rule_id[0]
        category = category_map.get(prefix, 'Other')
        summary['by_category'][category] = summary['by_category'].get(category, 0) + 1

    return summary
