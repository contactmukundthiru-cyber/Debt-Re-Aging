"""
Rule engine for detecting debt re-aging and timeline inconsistencies.

All rules are transparent, documented, and produce human-readable explanations.
"""

import json
import logging
import inspect
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable, Type
from pathlib import Path
from dataclasses import dataclass, asdict, field, fields as dc_fields
from difflib import SequenceMatcher
from dateutil.relativedelta import relativedelta
from rapidfuzz import fuzz, process
from app.utils import calculate_years_difference, estimate_removal_date, validate_iso_date
from app.regulatory import REGULATORY_MAP

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Known parent/subsidiary relationships for entity resolution
SUBSIDIARY_MAP = {
    'MIDLAND FUNDING': 'MIDLAND CREDIT MANAGEMENT',
    'MIDLAND FUNDING LLC': 'MIDLAND CREDIT MANAGEMENT',
    'MCM': 'MIDLAND CREDIT MANAGEMENT',
    'MIDLAND CREDIT': 'MIDLAND CREDIT MANAGEMENT',
    'ENCORE CAPITAL': 'MIDLAND CREDIT MANAGEMENT',
    'ENCORE CAPITAL GROUP': 'MIDLAND CREDIT MANAGEMENT',
    'PORTFOLIO RECOVERY': 'PRA GROUP',
    'PORTFOLIO RECOVERY ASSOCIATES': 'PRA GROUP',
    'PRA': 'PRA GROUP',
    'LVNV': 'RESURGENT CAPITAL SERVICES',
    'LVNV FUNDING': 'RESURGENT CAPITAL SERVICES',
    'LVNV FUNDING LLC': 'RESURGENT CAPITAL SERVICES',
    'SHERMAN FINANCIAL': 'RESURGENT CAPITAL SERVICES',
    'SHERMAN STRATEGIC INVESTMENTS': 'RESURGENT CAPITAL SERVICES',
    'CAVALRY SPV': 'CAVALRY PORTFOLIO SERVICES',
    'JEFFERSON CAPITAL SYSTEMS': 'JEFFERSON CAPITAL',
    'JCAP': 'JEFFERSON CAPITAL',
    'ASSET ACCEPTANCE': 'MIDLAND CREDIT MANAGEMENT',
    'CAVALRY SPV I': 'CAVALRY PORTFOLIO SERVICES',
    'CAVALRY SPV II': 'CAVALRY PORTFOLIO SERVICES'
}


@dataclass(frozen=True)
class TradelineModel:
    """Standardized model for credit tradeline data to ensure forensic integrity."""
    furnisher_or_collector: str = "Unknown"
    original_creditor: str = "Unknown"
    account_number: str = "Unknown"
    account_type: str = "Unknown"
    account_status: str = "Unknown"
    current_balance: str = "0"
    original_balance: str = "0"
    credit_limit: str = "0"
    date_opened: str = ""
    date_reported: str = ""
    date_last_payment: str = ""
    dofd: str = ""  # Date of First Delinquency
    estimated_removal_date: str = ""
    state_code: str = ""
    payment_profile: str = ""
    report_source: str = "Unknown"
    normalized_furnisher: str = "Unknown"
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TradelineModel':
        """Create a model from a raw dictionary, handling missing fields gracefully."""
        # Use only fields defined in the dataclass
        field_names = {f.name for f in dc_fields(cls)}
        filtered_data = {k: v for k, v in data.items() if k in field_names}
        return cls(**filtered_data)

    def get_float(self, field_name: str) -> float:
        """Safely parse a currency/numeric string to float."""
        val = getattr(self, field_name, "0")
        if not val or val == "Unknown": return 0.0
        try:
            return float(str(val).replace(',', '').replace('$', ''))
        except (ValueError, TypeError):
            return 0.0

    def get_date(self, field_name: str) -> Optional[datetime]:
        """Safely parse an ISO date string."""
        val = getattr(self, field_name, "")
        if not val or not validate_iso_date(val): return None
        try:
            return datetime.strptime(val, '%Y-%m-%d')
        except ValueError:
            return None


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
    legal_citations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# Rule definitions with metadata
def load_rule_definitions() -> dict:
    """Load rule definitions from JSON file."""
    metadata_path = Path(__file__).parent / 'rules_metadata.json'
    try:
        if metadata_path.exists():
            with open(metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            logger.warning(f"Metadata file not found at {metadata_path}")
            return {}
    except Exception as e:
        logger.error(f"Error loading rule definitions from {metadata_path}: {e}")
        return {}

RULE_DEFINITIONS = load_rule_definitions()


class RuleEngine:
    """
    Advanced Rule Engine for detecting debt re-aging and forensic inconsistencies.
    
    Uses an automated registry pattern for rule discovery and Pydantic-style data models.
    """

    def __init__(self):
        self.rules = load_rule_definitions()
        self.tolerance_days = 180  # 6 month tolerance for date comparisons
        self._registry: List[Callable] = self._discover_rules()

    def _discover_rules(self) -> List[Callable]:
        """Automatically find and register all rule methods using introspection."""
        methods = [
            method_name for method_name in dir(self)
            if method_name.startswith('_check_rule_') and callable(getattr(self, method_name))
        ]
        return [getattr(self, name) for name in methods]

    def _fuzzy_match(self, s1: str, s2: str, threshold: float = 85.0) -> bool:
        """
        High-fidelity forensic string matching.
        Uses RapidFuzz Token Set Ratio for robustness against word reordering and subsidiary aliasing.
        """
        if not s1 or not s2: return False
        
        s1_clean = s1.upper().strip()
        s2_clean = s2.upper().strip()
        
        # Check direct subsidiary map
        p1 = SUBSIDIARY_MAP.get(s1_clean, s1_clean)
        p2 = SUBSIDIARY_MAP.get(s2_clean, s2_clean)
        
        if p1 == p2:
            return True
        
        # RapidFuzz Token Set Ratio handles common OCR errors and partial name matches
        # Note: RapidFuzz uses 0-100 scale, while difflib used 0.0-1.0
        return fuzz.token_set_ratio(s1_clean, s2_clean) >= threshold

    def _create_flag(self, rule_id: str, explanation: str, field_values: Dict[str, Any]) -> RuleFlag:
        """Helper to create a RuleFlag from metadata."""
        rule = self.rules.get(rule_id, {
            'name': 'Unknown Rule',
            'severity': 'medium',
            'why_it_matters': '',
            'suggested_evidence': [],
            'legal_citations': []
        })
        
        return RuleFlag(
            rule_id=rule_id,
            rule_name=rule['name'],
            severity=rule['severity'],
            explanation=explanation,
            why_it_matters=rule['why_it_matters'],
            suggested_evidence=rule['suggested_evidence'],
            field_values=field_values,
            legal_citations=rule.get('legal_citations', [])
        )

    def audit_furnisher_behavior(self, accounts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Industry-Disruptive: Forensic Behavioral Auditing.
        Detects systemic patterns across multiple tradelines from the same furnisher.
        """
        behavioral_flags = []
        
        # New: Cross-Bureau Discrepancy (Rule C1 logic)
        acct_source_map = {} # acct_num -> {source1: data, source2: data}
        for i, acc in enumerate(accounts):
            num = acc.get('account_number')
            source = acc.get('report_source', 'Unknown')
            if num and num != 'Unknown' and len(num) > 4:
                if num not in acct_source_map: acct_source_map[num] = {}
                acct_source_map[num][source] = acc

        for num, sources in acct_source_map.items():
            if len(sources) >= 2:
                dates = {s: acc.get('dofd') for s, acc in sources.items() if acc.get('dofd')}
                if len(set(dates.values())) > 1:
                    behavioral_flags.append({
                        'rule_id': 'C1',
                        'rule_name': 'Cross-Source Date Discrepancy',
                        'severity': 'high',
                        'explanation': f"Critical Discrepancy: Account {num} shows different 'Date of First Delinquency' (DOFD) values across different bureaus ({', '.join([f'{k}: {v}' for k,v in dates.items()])}). This proves reporting inaccuracy.",
                        'involved_indices': [i for i, acc in enumerate(accounts) if acc.get('account_number') == num]
                    })

        furnisher_map = {}
        for acc in accounts:
            furnisher = str(acc.get('furnisher_or_collector') or 'Unknown').strip().upper()
            if furnisher not in furnisher_map:
                furnisher_map[furnisher] = []
            furnisher_map[furnisher].append(acc)
            
        for furnisher, f_accounts in furnisher_map.items():
            if len(f_accounts) < 2:
                continue
                
            # Pattern 1: Systematic DOFD Alignment (Synthetic Aging)
            dofds = [a.get('dofd') for a in f_accounts if a.get('dofd')]
            if len(set(dofds)) == 1 and len(dofds) >= 3:
                behavioral_flags.append({
                    'rule_id': 'BEH_01',
                    'rule_name': 'Systemic DOFD Alignment',
                    'severity': 'high',
                    'explanation': f"Furnisher '{furnisher}' is reporting the EXACT SAME DOFD ({dofds[0]}) for {len(dofds)} different accounts. This statistically suggests synthetic aging or improper 'batch' reporting.",
                    'why_it_matters': "Individual accounts rarely default on the same day. Batch reporting DOFDs is a violation of the requirement to report the actual date of delinquency.",
                    'suggested_evidence': ["Original creditor records for all accounts"],
                    'legal_citations': ["FCRA_623_a5"]
                })
                
            # Pattern 2: "Clock Drift" Cluster
            drifts = 0
            for a in f_accounts:
                flag = self._check_rule_k6(a)
                if flag: drifts += 1
            
            if drifts >= 2:
                behavioral_flags.append({
                    'rule_id': 'BEH_02',
                    'rule_name': 'Systemic Clock Drift Pattern',
                    'severity': 'high',
                    'explanation': f"Furnisher '{furnisher}' shows systemic 'Clock Drift' across {drifts} accounts. This suggests a programmed algorithm used by the furnisher to illegally extend reporting periods.",
                    'why_it_matters': "When multiple accounts show the same logic error, it proves the re-aging is intentional and systemic, not a clerical error.",
                    'suggested_evidence': ["Prior credit reports", "DOFD verification letters"],
                    'legal_citations': ["FCRA_623_a1", "FDCPA_807_8"]
                })
                
        return behavioral_flags

    def check_batch_rules(self, accounts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Run rules that compare multiple accounts (e.g., duplicates).
        """
        flags = []

        # Rule DU1: Duplicate Reporting by Balance and Creditor (Enhanced Fuzzy)
        bal_groups = {} # balance_str -> [accounts]

        for i, acc in enumerate(accounts):
            balance = acc.get('current_balance')
            if not balance or balance in ['0', '0.00', '$0', '$0.00']: continue
            
            try:
                bal_float = float(str(balance).replace(',', '').replace('$', ''))
                if bal_float > 0:
                    bal_key = f"{bal_float:.2f}"
                    if bal_key not in bal_groups: bal_groups[bal_key] = []
                    bal_groups[bal_key].append({
                        'index': i,
                        'furnisher': acc.get('furnisher_or_collector', 'Unknown'),
                        'original_creditor': str(acc.get('original_creditor') or '').strip(),
                        'date_opened': acc.get('date_opened', '')
                    })
            except (ValueError, TypeError): pass

        for bal, group in bal_groups.items():
            if len(group) < 2: continue
            
            # Fuzzy match creditors within the same balance group
            matched_indices = set()
            for i in range(len(group)):
                if i in matched_indices: continue
                current_cluster = [group[i]]
                for j in range(i + 1, len(group)):
                    if j in matched_indices: continue
                    if self._fuzzy_match(group[i]['original_creditor'], group[j]['original_creditor']):
                        current_cluster.append(group[j])
                        matched_indices.add(j)
                
                if len(current_cluster) >= 2:
                    furnishers = [a['furnisher'] for a in current_cluster]
                    rule = self.rules.get('DU1', {})
                    flags.append({
                        'rule_id': 'DU1',
                        'rule_name': rule.get('name', 'Duplicate Reporting'),
                        'severity': rule.get('severity', 'high'),
                        'explanation': (
                            f"Highly probable duplicate: Balance ${bal} for creditor '{current_cluster[0]['original_creditor']}' "
                            f"reported by {len(current_cluster)} furnishers: {', '.join(furnishers)}."
                        ),
                        'why_it_matters': rule.get('why_it_matters', ''),
                        'suggested_evidence': rule.get('suggested_evidence', []),
                        'involved_indices': [a['index'] for a in current_cluster],
                        'legal_citations': rule.get('legal_citations', [])
                    })

        # Rule J2: Multiple Collector Waterfall
        original_creditor_map = {}  # original_creditor -> [collectors]

        for i, acc in enumerate(accounts):
            orig = str(acc.get('original_creditor') or '').strip().lower()
            collector = acc.get('furnisher_or_collector', '')
            acc_type = str(acc.get('account_type') or '').lower()

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
                rule = self.rules.get('J2', {})
                collector_names = [c['collector'] for c in collectors]

                flags.append({
                    'rule_id': 'J2',
                    'rule_name': rule.get('name', 'Multiple Collector Waterfall'),
                    'severity': rule.get('severity', 'high'),
                    'explanation': (
                        f"Debt from '{orig_creditor}' appears with {len(collectors)} different collectors: "
                        f"{', '.join(collector_names)}. This waterfall pattern may indicate improper reporting."
                    ),
                    'why_it_matters': rule.get('why_it_matters', ''),
                    'suggested_evidence': rule.get('suggested_evidence', []),
                    'involved_indices': [c['index'] for c in collectors],
                    'legal_citations': rule.get('legal_citations', [])
                })

        # Rule DU2: Same Debt Different Account Numbers (Enhanced Fuzzy)
        acct_clusters = [] # List of [ {index, creditor, balance, ...} ]

        for i, acc in enumerate(accounts):
            orig = str(acc.get('original_creditor') or '').strip()
            balance = acc.get('current_balance', '0')
            try:
                bal_float = float(str(balance).replace(',', '').replace('$', ''))
                bal_bucket = round(bal_float / 100) * 100
            except (ValueError, TypeError):
                bal_bucket = 0
            
            if not orig or bal_bucket == 0: continue

            # Find matching cluster
            found = False
            for cluster in acct_clusters:
                # Same bucket and fuzzy matching creditor
                if cluster[0]['bal_bucket'] == bal_bucket and self._fuzzy_match(cluster[0]['orig'], orig):
                    cluster.append({
                        'index': i,
                        'furnisher': acc.get('furnisher_or_collector', ''),
                        'account_number': acc.get('account_number', ''),
                        'balance': balance,
                        'orig': orig,
                        'bal_bucket': bal_bucket
                    })
                    found = True
                    break
            
            if not found:
                acct_clusters.append([{
                    'index': i,
                    'furnisher': acc.get('furnisher_or_collector', ''),
                    'account_number': acc.get('account_number', ''),
                    'balance': balance,
                    'orig': orig,
                    'bal_bucket': bal_bucket
                }])

        for cluster in acct_clusters:
            if len(cluster) >= 2:
                acct_nums = set(a['account_number'] for a in cluster if a['account_number'] and a['account_number'] != 'Unknown')
                if len(acct_nums) >= 2:
                    rule = self.rules.get('DU2', {})
                    flags.append({
                        'rule_id': 'DU2',
                        'rule_name': rule.get('name', 'Different Account Numbers'),
                        'severity': rule.get('severity', 'medium'),
                        'explanation': (
                            f"Identified {len(cluster)} accounts with different numbers ({', '.join(acct_nums)}) that "
                            f"reference the same underlying debt for '{cluster[0]['orig']}'. Balances are within the same range."
                        ),
                        'why_it_matters': rule.get('why_it_matters', ''),
                        'suggested_evidence': rule.get('suggested_evidence', []),
                        'involved_indices': [a['index'] for a in cluster],
                        'legal_citations': rule.get('legal_citations', [])
                    })

        # Rule DU3: Subsidiary/Alias Duplicate Reporting (Institutional Forensic)
        # Catches duplicates reported by different legal entities owned by the same parent (e.g. Midland vs MCM)
        normalized_map = {} # normalized_name -> [indices]
        for i, acc in enumerate(accounts):
            norm = acc.get('normalized_furnisher')
            if norm and norm != 'Unknown':
                if norm not in normalized_map:
                    normalized_map[norm] = []
                normalized_map[norm].append(i)
        
        for norm_name, indices in normalized_map.items():
            if len(indices) >= 2:
                # Check if they look like the same debt (similar balance or original creditor)
                # Group indices by original creditor snippet
                creditor_groups = {}
                for idx in indices:
                    acc = accounts[idx]
                    orig = str(acc.get('original_creditor') or '').strip().lower()[:10]
                    if orig not in creditor_groups:
                        creditor_groups[orig] = []
                    creditor_groups[orig].append(idx)
                
                for orig_prefix, group_indices in creditor_groups.items():
                    if len(group_indices) >= 2:
                        furnishers = [accounts[idx].get('furnisher_or_collector', 'Unknown') for idx in group_indices]
                        # Only flag if the actual names reported are different (otherwise DU1 handles it)
                        if len(set(furnishers)) > 1:
                            rule = self.rules.get('DU3', {})
                            flags.append({
                                'rule_id': 'DU3',
                                'rule_name': rule.get('name', 'Subsidiary Duplicate Reporting'),
                                'severity': rule.get('severity', 'high'),
                                'explanation': (
                                    f"Institutional Duplicate detected: The same debt for '{accounts[group_indices[0]]['original_creditor']}' "
                                    f"is being reported by different subsidiaries of the same parent company ({norm_name.upper()}): "
                                    f"{', '.join(furnishers)}. This often masks double-counting of the same liability."
                                ),
                                'why_it_matters': rule.get('why_it_matters', ''),
                                'suggested_evidence': rule.get('suggested_evidence', []),
                                'involved_indices': group_indices,
                                'legal_citations': rule.get('legal_citations', [])
                            })

        return flags

    def check_all_rules(self, fields: Dict[str, Any]) -> List[RuleFlag]:
        """
        Run all registered rules against the provided fields.
        Uses automatic discovery to ensure zero maintenance when adding new rules.
        """
        flags = []
        
        # Pre-process for forensic integrity
        model = TradelineModel.from_dict(fields)
        
        # Execute registered rules
        for rule_func in self._registry:
            try:
                # Most rules currently expect Dict[str, Any], we pass fields
                # but we could eventually migrate them to use TradelineModel
                flag = rule_func(fields)
                if flag:
                    flags.append(flag)
            except Exception as e:
                logger.error(f"Error executing rule {rule_func.__name__}: {e}")
        
        return flags

    def check_cross_bureau(self, bureau_data: List[Dict[str, Any]]) -> List[RuleFlag]:
        """
        Check rules that require data from multiple bureaus.
        """
        flags = []
        flag = self._check_rule_c1(bureau_data)
        if flag: flags.append(flag)
        return flags

    # ============ TIMELINE RULES (A-series) ============

    def _check_rule_a1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """A1: Estimated removal > 8 years after reported date_opened"""
        date_opened = fields.get('date_opened')
        removal_date = fields.get('estimated_removal_date')

        if not date_opened or not removal_date: return None
        if not validate_iso_date(date_opened) or not validate_iso_date(removal_date): return None

        years_diff = calculate_years_difference(date_opened, removal_date)
        if years_diff and years_diff > 8.0:
            return self._create_flag('A1', 
                f"The estimated removal date ({removal_date}) is {years_diff:.1f} years after the date opened ({date_opened}). This exceeds the typical 7-year reporting period by more than 1 year.",
                {'date_opened': date_opened, 'estimated_removal_date': removal_date, 'years_difference': years_diff})
        return None

    def _check_rule_a2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """A2: Estimated removal inconsistent with (DOFD + ~7 years)"""
        dofd = fields.get('dofd')
        removal_date = fields.get('estimated_removal_date')

        if not dofd or not removal_date: return None
        if not validate_iso_date(dofd) or not validate_iso_date(removal_date): return None

        expected_removal = estimate_removal_date(dofd)
        if not expected_removal: return None

        try:
            expected_dt = datetime.strptime(expected_removal, '%Y-%m-%d')
            reported_dt = datetime.strptime(removal_date, '%Y-%m-%d')
            diff_days = abs((reported_dt - expected_dt).days)

            if diff_days > self.tolerance_days:
                diff_months = diff_days // 30
                return self._create_flag('A2',
                    f"The estimated removal date ({removal_date}) does not align with the expected removal date based on DOFD ({dofd}). Expected removal around {expected_removal}, but reported removal is {diff_months} months different.",
                    {'dofd': dofd, 'estimated_removal_date': removal_date, 'expected_removal_date': expected_removal, 'difference_days': diff_days})
        except ValueError:
            logger.debug(f"Invalid date format encountered in A2 check: expected={expected_removal}, reported={removal_date}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_a2: {e}")
        return None

    # ============ RE-AGING INDICATORS (B-series) ============

    def _check_rule_b1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """B1: date_opened > 24 months after DOFD"""
        dofd = fields.get('dofd')
        date_opened = fields.get('date_opened')

        if not dofd or not date_opened: return None
        if not validate_iso_date(dofd) or not validate_iso_date(date_opened): return None

        try:
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            opened_dt = datetime.strptime(date_opened, '%Y-%m-%d')

            if opened_dt > dofd_dt:
                months_diff = ((opened_dt.year - dofd_dt.year) * 12 + (opened_dt.month - dofd_dt.month))
                if months_diff > 24:
                    return self._create_flag('B1',
                        f"The date opened ({date_opened}) is {months_diff} months after the Date of First Delinquency ({dofd}). This suggests the account may have been re-aged when transferred to a collection agency.",
                        {'dofd': dofd, 'date_opened': date_opened, 'months_after_dofd': months_diff})
        except ValueError:
            logger.debug(f"Invalid date format in B1 check: dofd={dofd}, opened={date_opened}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_b1: {e}")
        return None

    def _check_rule_b2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """B2: No DOFD shown + recent date_opened on a collection account"""
        dofd = fields.get('dofd')
        date_opened = fields.get('date_opened')
        account_type = str(fields.get('account_type') or '').lower()

        if account_type != 'collection': return None
        if dofd and validate_iso_date(dofd): return None
        if not date_opened or not validate_iso_date(date_opened): return None

        try:
            opened_dt = datetime.strptime(date_opened, '%Y-%m-%d')
            now = datetime.now()
            years_ago = (now - opened_dt).days / 365.25

            if years_ago < 3:
                return self._create_flag('B2',
                    f"This collection account shows a date opened of {date_opened} (within the last {years_ago:.1f} years) but does not display a Date of First Delinquency (DOFD). The missing DOFD makes it impossible to verify the proper removal date.",
                    {'date_opened': date_opened, 'dofd': 'NOT REPORTED', 'account_type': account_type, 'years_since_opened': round(years_ago, 1)})
        except ValueError:
            logger.debug(f"Invalid date format in B2 check: opened={date_opened}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_b2: {e}")
        return None

    # ============ CROSS-BUREAU RULES (C-series) ============

    def _check_rule_c1(self, bureau_data: List[Dict[str, Any]]) -> Optional[RuleFlag]:
        """C1: Multiple bureaus with materially different removal timelines"""
        if len(bureau_data) < 2: return None

        removal_dates = []
        for data in bureau_data:
            removal = data.get('estimated_removal_date')
            bureau = data.get('bureau', 'Unknown')
            if removal and validate_iso_date(removal):
                removal_dates.append((bureau, removal))

        if len(removal_dates) < 2: return None

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
                    logger.debug(f"Invalid date format in C1 comparison: {removal_dates[i][1]} vs {removal_dates[j][1]}")
                except Exception as e:
                    logger.error(f"Unexpected error in _check_rule_c1 loop: {e}")

        if max_diff_days > 180 and bureau_pair:
            return self._create_flag('C1',
                f"The removal dates differ significantly between bureaus: {bureau_pair[0][0]} shows {bureau_pair[0][1]}, while {bureau_pair[1][0]} shows {bureau_pair[1][1]}. This is a difference of {max_diff_days} days ({max_diff_days // 30} months).",
                {'bureau_1': bureau_pair[0][0], 'removal_1': bureau_pair[0][1], 'bureau_2': bureau_pair[1][0], 'removal_2': bureau_pair[1][1], 'difference_days': max_diff_days})
        return None

    # ============ STATUS/BALANCE RULES (D-series) ============

    def _check_rule_d1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """D1: Account status 'paid'/'settled' but balance > 0"""
        status = str(fields.get('account_status') or '').lower()
        balance_str = fields.get('current_balance', '0')

        if not status or not balance_str: return None

        try:
            balance = float(str(balance_str).replace(',', '').replace('$', ''))
            if status in ['paid', 'settled', 'closed', 'paid in full', 'settled in full'] and balance > 0:
                return self._create_flag('D1',
                    f"The account status is '{status.upper()}', but a balance of ${balance:,.2f} is still being reported. If an account is paid or settled, the reported balance should be $0.",
                    {'account_status': status, 'current_balance': balance})
        except (ValueError, TypeError):
            logger.debug(f"Could not parse balance in D1 check: {balance_str}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_d1: {e}")
        return None

    # ============ DATA INTEGRITY RULES (E-series) ============

    def _check_rule_e1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """E1: Future date detection"""
        date_fields = ['date_opened', 'date_reported_or_updated', 'dofd',
                       'date_last_activity', 'date_last_payment', 'charge_off_date']
        now = datetime.now()

        for field in date_fields:
            val = fields.get(field)
            if val and validate_iso_date(val):
                try:
                    dt = datetime.strptime(val, '%Y-%m-%d')
                    if dt > now + relativedelta(days=1):
                        return self._create_flag('E1',
                            f"The {field.replace('_', ' ')} is reported as {val}, which is in the future. This is a clear data integrity violation.",
                            {'field': field, 'reported_date': val, 'current_date': now.strftime('%Y-%m-%d')})
                except ValueError:
                    logger.debug(f"Invalid date format in E1 check for field {field}: {val}")
                except Exception as e:
                    logger.error(f"Unexpected error in _check_rule_e1 for field {field}: {e}")
        return None

    def _check_rule_e2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """E2: Impossible Reporting Timeline (Reported < DOFD)"""
        dofd = fields.get('dofd')
        reported = fields.get('date_reported_or_updated')
        
        if not dofd or not reported: return None
        if not validate_iso_date(dofd) or not validate_iso_date(reported): return None
        
        try:
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            reported_dt = datetime.strptime(reported, '%Y-%m-%d')
            
            if reported_dt < dofd_dt:
                return self._create_flag('E2',
                    f"Impossible Timeline: The account was reported as updated on {reported}, which is BEFORE the Date of First Delinquency ({dofd}). Information cannot be reported before the delinquency occurred.",
                    {'date_reported': reported, 'dofd': dofd})
        except ValueError:
            pass
        return None

    # ============ PAYMENT/BALANCE MANIPULATION (F-series) ============

    def _check_rule_f1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """F1: Payment recorded but balance not reduced"""
        last_payment = fields.get('last_payment_amount')
        balance_before = fields.get('previous_balance')
        balance_after = fields.get('current_balance')

        if not last_payment or not balance_before or not balance_after: return None

        try:
            payment = float(str(last_payment).replace(',', '').replace('$', ''))
            prev_bal = float(str(balance_before).replace(',', '').replace('$', ''))
            curr_bal = float(str(balance_after).replace(',', '').replace('$', ''))

            if payment > 0 and curr_bal >= prev_bal:
                return self._create_flag('F1',
                    f"A payment of ${payment:,.2f} was recorded, but the balance did not decrease (was ${prev_bal:,.2f}, now ${curr_bal:,.2f}). Payments should reduce the balance.",
                    {'last_payment_amount': payment, 'previous_balance': prev_bal, 'current_balance': curr_bal})
        except (ValueError, TypeError): pass
        return None

    def _check_rule_f2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """F2: Suspicious last activity date refresh on old debt"""
        date_last_activity = fields.get('date_last_activity')
        dofd = fields.get('dofd')

        if not date_last_activity or not dofd: return None
        if not validate_iso_date(date_last_activity) or not validate_iso_date(dofd): return None

        try:
            activity_dt = datetime.strptime(date_last_activity, '%Y-%m-%d')
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            now = datetime.now()

            debt_age_years = (now - dofd_dt).days / 365.25
            activity_age_months = (now - activity_dt).days / 30

            if debt_age_years > 5 and activity_age_months < 6:
                return self._create_flag('F2',
                    f"This debt is {debt_age_years:.1f} years old (DOFD: {dofd}), but shows recent activity on {date_last_activity}. This pattern may indicate artificial activity date refreshing to re-age the debt.",
                    {'dofd': dofd, 'date_last_activity': date_last_activity, 'debt_age_years': round(debt_age_years, 1), 'activity_age_months': round(activity_age_months, 1)})
        except ValueError:
            logger.debug(f"Invalid date format in F2 check: dofd={dofd}, activity={date_last_activity}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_f2: {e}")
        return None

    def _check_rule_f3(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """F3: Payment-to-Balance Ratio Anomaly"""
        current_balance = fields.get('current_balance')
        past_due_amount = fields.get('past_due_amount')
        monthly_payment = fields.get('monthly_payment_amount')
        
        if not current_balance or not past_due_amount: return None
        
        try:
            curr = float(str(current_balance).replace(',', '').replace('$', ''))
            pdue = float(str(past_due_amount).replace(',', '').replace('$', ''))
            
            # If past due is greater than 50% of total balance on a standard tradeline
            # This often indicates high-interest accumulation that outweighs any payments made
            if curr > 0 and (pdue / curr) > 0.5:
                return self._create_flag('F3',
                    f"Payment-to-Balance Anomaly: The past due amount (${pdue:,.2f}) accounts for { (pdue/curr)*100:.1f}% of the total balance (${curr:,.2f}). This suggests the debt is spiraling due to predatory interest or fees, making it impossible to satisfy under FDCPA guidelines.",
                    {'current_balance': curr, 'past_due': pdue, 'ratio': round(pdue/curr, 2)})
        except (ValueError, TypeError, ZeroDivisionError): pass
        return None

    # ============ FEE/INTEREST ABUSE (G-series) ============

    def _check_rule_g1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """G1: Balance significantly exceeds original amount (fee stacking)"""
        current_balance = fields.get('current_balance')
        original_balance = fields.get('original_balance') or fields.get('original_amount')
        account_type = str(fields.get('account_type') or '').lower()

        if not current_balance or not original_balance: return None
        if account_type != 'collection': return None

        try:
            current = float(str(current_balance).replace(',', '').replace('$', ''))
            original = float(str(original_balance).replace(',', '').replace('$', ''))

            if original > 0 and current > original * 1.5:
                growth_pct = ((current - original) / original) * 100
                return self._create_flag('G1',
                    f"The current balance (${current:,.2f}) is {growth_pct:.0f}% higher than the original debt amount (${original:,.2f}). This excessive growth may indicate unauthorized fees or interest charges.",
                    {'current_balance': current, 'original_balance': original, 'growth_percentage': round(growth_pct, 1)})
        except (ValueError, TypeError): pass
        return None

    def _check_rule_g2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """G2: Balance increased when transferred to new collector"""
        current_balance = fields.get('current_balance')
        balance_at_transfer = fields.get('balance_at_transfer') or fields.get('original_balance')
        account_type = str(fields.get('account_type') or '').lower()

        if not current_balance or not balance_at_transfer: return None
        if account_type != 'collection': return None

        try:
            current = float(str(current_balance).replace(',', '').replace('$', ''))
            transfer = float(str(balance_at_transfer).replace(',', '').replace('$', ''))

            if transfer > 0 and current > transfer * 1.05:
                increase = current - transfer
                return self._create_flag('G2',
                    f"The balance increased by ${increase:,.2f} after transfer to this collector (from ${transfer:,.2f} to ${current:,.2f}). Debt balances should not increase when transferred.",
                    {'current_balance': current, 'balance_at_transfer': transfer, 'increase_amount': round(increase, 2)})
        except (ValueError, TypeError): pass
        return None

    # ============ MEDICAL DEBT RULES (H-series) ============

    def _check_rule_h1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """H1: Medical debt reported before 365-day waiting period"""
        account_type = str(fields.get('account_type') or '').lower()
        industry_code = str(fields.get('industry_code') or '').lower()
        date_of_service = fields.get('date_of_service')
        date_reported = fields.get('date_reported_or_updated') or fields.get('date_opened')

        is_medical = ('medical' in account_type or 'medical' in industry_code or
                      'healthcare' in account_type or 'hospital' in industry_code)

        if not is_medical: return None
        if not date_of_service or not date_reported: return None
        if not validate_iso_date(date_of_service) or not validate_iso_date(date_reported): return None

        try:
            service_dt = datetime.strptime(date_of_service, '%Y-%m-%d')
            reported_dt = datetime.strptime(date_reported, '%Y-%m-%d')
            days_diff = (reported_dt - service_dt).days

            if days_diff < 365:
                return self._create_flag('H1',
                    f"This medical debt was reported {days_diff} days after the date of service ({date_of_service}). Under current regulations, medical debt cannot be reported until at least 365 days after service.",
                    {'date_of_service': date_of_service, 'date_reported': date_reported, 'days_before_eligible': 365 - days_diff})
        except ValueError:
            logger.debug(f"Invalid date format in H1 check: service={date_of_service}, reported={date_reported}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_h1: {e}")
        return None

    def _check_rule_h2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """H2: Paid medical debt still appearing on report"""
        account_type = str(fields.get('account_type') or '').lower()
        industry_code = str(fields.get('industry_code') or '').lower()
        account_status = str(fields.get('account_status') or '').lower()

        is_medical = ('medical' in account_type or 'medical' in industry_code or
                      'healthcare' in account_type or 'hospital' in industry_code)

        if not is_medical: return None
        is_paid = any(s in account_status for s in ['paid', 'settled', 'zero balance'])

        if is_paid:
            return self._create_flag('H2',
                f"This medical debt shows a status of '{account_status}' but is still appearing on the credit report. Under current policies, paid medical debts should be removed from credit reports.",
                {'account_type': account_type, 'account_status': account_status})
        return None

    def _check_rule_h3(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """H3: Medical debt under $500 threshold"""
        account_type = str(fields.get('account_type') or '').lower()
        industry_code = str(fields.get('industry_code') or '').lower()
        current_balance = fields.get('current_balance')

        is_medical = ('medical' in account_type or 'medical' in industry_code or
                      'healthcare' in account_type or 'hospital' in industry_code)

        if not is_medical or not current_balance: return None

        try:
            balance = float(str(current_balance).replace(',', '').replace('$', ''))
            if 0 < balance < 500:
                return self._create_flag('H3',
                    f"This medical debt has a balance of ${balance:,.2f}, which is under the $500 threshold. Under current credit bureau policies, medical debts under $500 should not appear on credit reports.",
                    {'current_balance': balance, 'threshold': 500})
        except (ValueError, TypeError): pass
        return None

    # ============ CREDIT LIMIT MANIPULATION (I-series) ============

    def _check_rule_i1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """I1: Credit limit reported as zero or equal to balance"""
        account_type = str(fields.get('account_type') or '').lower()
        credit_limit = fields.get('credit_limit')
        current_balance = fields.get('current_balance')

        if 'revolving' not in account_type and 'credit card' not in account_type: return None
        if not current_balance: return None

        try:
            balance = float(str(current_balance).replace(',', '').replace('$', ''))
            limit = float(str(credit_limit).replace(',', '').replace('$', '')) if credit_limit else 0

            if balance > 0 and (limit == 0 or abs(limit - balance) < 1):
                return self._create_flag('I1',
                    f"This revolving account shows a balance of ${balance:,.2f} but the credit limit is reported as ${limit:,.2f}. This makes utilization appear as 100%, which unfairly damages credit scores.",
                    {'current_balance': balance, 'credit_limit': limit, 'implied_utilization': '100%'})
        except (ValueError, TypeError): pass
        return None

    def _check_rule_i2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """I2: Collection account date differs from original account"""
        account_type = str(fields.get('account_type') or '').lower()
        date_opened = fields.get('date_opened')
        original_open_date = fields.get('original_open_date') or fields.get('original_account_date')

        if account_type != 'collection': return None
        if not date_opened or not original_open_date: return None
        if not validate_iso_date(date_opened) or not validate_iso_date(original_open_date): return None

        try:
            opened_dt = datetime.strptime(date_opened, '%Y-%m-%d')
            original_dt = datetime.strptime(original_open_date, '%Y-%m-%d')
            diff_months = abs((opened_dt.year - original_dt.year) * 12 + (opened_dt.month - original_dt.month))

            if diff_months > 6:
                return self._create_flag('I2',
                    f"The collection account open date ({date_opened}) differs from the original account date ({original_open_date}) by {diff_months} months. Collection accounts should preserve the original account's open date.",
                    {'date_opened': date_opened, 'original_open_date': original_open_date, 'difference_months': diff_months})
        except ValueError:
            logger.debug(f"Invalid date format in I2 check: opened={date_opened}, original={original_open_date}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_i2: {e}")
        return None

    # ============ ZOMBIE DEBT RULES (J-series) ============

    def _check_rule_j1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """J1: Dormant account suddenly shows new activity"""
        date_reported = fields.get('date_reported_or_updated')
        dofd = fields.get('dofd')

        if not date_reported or not dofd: return None
        if not validate_iso_date(date_reported) or not validate_iso_date(dofd): return None

        try:
            reported_dt = datetime.strptime(date_reported, '%Y-%m-%d')
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            now = datetime.now()

            debt_age_years = (now - dofd_dt).days / 365.25
            reporting_age_months = (now - reported_dt).days / 30

            if debt_age_years > 5 and reporting_age_months < 6:
                return self._create_flag('J1',
                    f"This debt is {debt_age_years:.1f} years old (DOFD: {dofd}), but was recently reported/updated on {date_reported}. This pattern suggests a 'zombie debt' that may have been purchased and revived by a new collector.",
                    {'dofd': dofd, 'date_reported': date_reported, 'debt_age_years': round(debt_age_years, 1)})
        except ValueError:
            logger.debug(f"Invalid date format in J1 check: dofd={dofd}, reported={date_reported}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_j1: {e}")
        return None

    def _check_rule_bk1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """BK1: Post-bankruptcy balance reporting"""
        status = str(fields.get('account_status') or '').lower()
        remarks = str(fields.get('remarks') or '').lower()
        balance_str = fields.get('current_balance', '0')
        
        is_bankruptcy = 'bankruptcy' in status or 'discharged' in status or 'bankruptcy' in remarks or 'discharged' in remarks
        
        if not is_bankruptcy: return None
        
        try:
            balance = float(str(balance_str).replace(',', '').replace('$', ''))
            if balance > 0:
                return self._create_flag('BK1',
                    f"This account is marked as involved in bankruptcy (Status/Remarks: {status or remarks}), but still reports a balance of ${balance:,.2f}. Once discharged, the balance must be reported as $0.",
                    {'account_status': status, 'remarks': remarks, 'current_balance': balance})
        except (ValueError, TypeError): pass
        return None

    def _check_rule_sl1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """SL1: Student Loan Rehabilitation Inaccuracy"""
        remarks = str(fields.get('remarks') or '').lower()
        status = str(fields.get('account_status') or '').lower()
        
        is_rehab = 'rehabilitat' in remarks or 'rehab' in remarks
        # If successfully rehabilitated, it shouldn't be in collection or default
        is_negative = any(s in status for s in ['collection', 'default', 'delinquent', 'late'])
        
        if is_rehab and is_negative:
            return self._create_flag('SL1',
                f"Student loan shows 'Rehabilitated' in remarks but still reports a negative status of '{status.upper()}'. Per the Higher Education Act, successful rehabilitation requires the removal of the default marker.",
                {'remarks': remarks, 'account_status': status})
        return None

    def _check_rule_uc1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """UC1: Usury Clock Drift Audit (State Cap)"""
        from app.state_sol import get_state_sol
        state_code = fields.get('state_code')
        curr_bal = fields.get('current_balance')
        orig_bal = fields.get('original_balance') or fields.get('original_amount')
        dofd = fields.get('dofd')

        if not all([state_code, curr_bal, orig_bal, dofd]): return None

        state_data = get_state_sol(state_code)
        if not state_data: return None

        try:
            curr = float(str(curr_bal).replace(',', '').replace('$', ''))
            orig = float(str(orig_bal).replace(',', '').replace('$', ''))
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            years_since_dofd = max((datetime.now() - dofd_dt).days / 365.25, 0.5)

            if orig > 0 and curr > orig:
                implied_annual_rate = ((curr - orig) / orig) / years_since_dofd
                
                # Use judgment_interest_cap as a general usury proxy if more specific caps aren't available
                cap = state_data.judgment_interest_cap
                
                if implied_annual_rate > (cap + 0.02):  # 2% buffer for one-time legal fees
                    return self._create_flag('UC1',
                        f"Forensic Audit detected Usury Clock Drift: The balance grew from ${orig:,.2f} to ${curr:,.2f} over {years_since_dofd:.1f} years, implying an annual interest rate of {implied_annual_rate*100:.1f}%. This exceeds the {state_data.state} legal cap of {cap*100:.1f}%.",
                        {'original': orig, 'current': curr, 'implied_rate': f"{implied_annual_rate*100:.1f}%", 'cap': f"{cap*100:.1f}%"})
        except (ValueError, TypeError): pass
        return None

    def _check_rule_zr1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """ZR1: Zombie Debt Resuscitation (Post-SOL First Reporting)"""
        from app.state_sol import check_sol_expired
        state_code = fields.get('state_code')
        dofd = fields.get('dofd')
        date_opened = fields.get('date_opened')

        if not all([state_code, dofd, date_opened]): return None
        if not all(validate_iso_date(d) for d in [dofd, date_opened]): return None

        is_expired, sol_years, _ = check_sol_expired(state_code, dofd)
        if not is_expired: return None

        try:
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            opened_dt = datetime.strptime(date_opened, '%Y-%m-%d')
            sol_expiry = dofd_dt + relativedelta(years=sol_years)

            # If the collection account was opened AFTER the SOL expired
            if opened_dt > sol_expiry:
                months_after = (opened_dt.year - sol_expiry.year) * 12 + (opened_dt.month - sol_expiry.month)
                
                # Add tolling info if available
                from app.state_sol import get_state_sol
                state_sol = get_state_sol(state_code)
                tolling_info = f" (Subject to tolling/clock-pausing rules defined in {state_sol.tolling_statute})" if state_sol and state_sol.tolling_statute else ""

                if months_after > 3: # 3 month buffer
                    return self._create_flag('ZR1',
                        f"Zombie Debt Detected: This account was opened/reported on {date_opened}, which is {months_after} months AFTER the legal statute of limitations for this debt expired ({sol_expiry.strftime('%Y-%m-%d')}).{tolling_info} This is a characteristic of uncollectible debt resuscitation.",
                        {'dofd': dofd, 'sol_years': sol_years, 'sol_expiry': sol_expiry.strftime('%Y-%m-%d'), 'opened': date_opened})
        except ValueError: pass
        return None

    def _check_rule_j3(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """J3: Missing Original Creditor (Chain of Title)"""
        account_type = str(fields.get('account_type') or '').lower()
        orig_creditor = str(fields.get('original_creditor') or '').lower()
        
        if 'collection' in account_type:
            if not orig_creditor or any(term in orig_creditor for term in ['unknown', 'none', 'n/a']):
                return self._create_flag('J3',
                    f"Chain of Title Defect: This account is listed as a collection, but the 'Original Creditor' is missing or marked as unknown. Reporting a collection without the original debt source is a violation of the FCRA's requirement for clarity.",
                    {'account_type': account_type, 'original_creditor': orig_creditor})
        return None

    def _check_rule_md1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """MD1: Medical Financial Assistance Screening"""
        account_type = str(fields.get('account_type') or '').lower()
        industry_code = str(fields.get('industry_code') or '').lower()
        state_code = fields.get('state_code')

        is_medical = ('medical' in account_type or 'medical' in industry_code or
                      'healthcare' in account_type or 'hospital' in industry_code)

        if not is_medical or not state_code: return None

        # States with strong "Charity Care" or financial assistance screening laws
        restricted_states = ['CA', 'WA', 'NY', 'NJ', 'MD', 'CO', 'IL']
        
        if state_code in restricted_states:
            return self._create_flag('MD1',
                f"Medical Debt Screening Violation: This debt was reported in {state_code}, which requires healthcare providers to screen patients for financial assistance eligibility BEFORE collection. If you were not screened or have low income, this reporting may be illegal.",
                {'state': state_code, 'account_type': account_type})
        return None

    # ============ INNOVATIVE RULES (K-series) ============

    def _check_rule_k1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K1: Impossible delinquency sequence"""
        payment_history = fields.get('payment_history', '')
        if not payment_history or len(payment_history) < 3: return None

        history = str(payment_history).upper()
        impossible_patterns = [
            ('C90', 'Current directly to 90 days late'),
            ('C60', 'Current directly to 60 days late'),
            ('0090', 'On-time directly to 90 days'),
            ('0060', 'On-time directly to 60 days'),
            ('30090', '30 days directly to 90 days (skipped 60)'),
        ]

        for pattern, desc in impossible_patterns:
            if pattern in history.replace(' ', '').replace('-', ''):
                return self._create_flag('K1',
                    f"The payment history shows an impossible sequence: {desc}. Delinquency must progress through each stage (30, 60, 90 days). This indicates data corruption or manipulation.",
                    {'payment_history': payment_history, 'impossible_pattern': desc})
        return None

    def _check_rule_k2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K2: Suspiciously round balance"""
        current_balance = fields.get('current_balance')
        account_type = str(fields.get('account_type') or '').lower()

        if not current_balance or account_type != 'collection': return None

        try:
            balance = float(str(current_balance).replace(',', '').replace('$', ''))
            if balance >= 1000 and balance % 1000 == 0:
                return self._create_flag('K2',
                    f"The reported balance (${balance:,.2f}) is an exact round number. Real debt balances with interest and fees rarely end in exact thousands. Consider requesting an itemized statement to verify accuracy.",
                    {'current_balance': balance})
        except (ValueError, TypeError): pass
        return None

    def _check_rule_k3(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K3: High balance exceeds credit limit significantly"""
        high_balance = fields.get('high_balance')
        credit_limit = fields.get('credit_limit')

        if not high_balance or not credit_limit: return None

        try:
            high = float(str(high_balance).replace(',', '').replace('$', ''))
            limit = float(str(credit_limit).replace(',', '').replace('$', ''))

            if limit > 0 and high > limit * 1.2:
                overage_pct = ((high - limit) / limit) * 100
                return self._create_flag('K3',
                    f"The high balance (${high:,.2f}) exceeds the credit limit (${limit:,.2f}) by {overage_pct:.0f}%. While some over-limit activity is possible, this significant difference may indicate incorrect data.",
                    {'high_balance': high, 'credit_limit': limit, 'overage_percentage': round(overage_pct, 1)})
        except (ValueError, TypeError): pass
        return None

    def _check_rule_k4(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K4: Date of last payment inconsistency"""
        date_last_payment = fields.get('date_last_payment')
        dofd = fields.get('dofd')

        if not date_last_payment or not dofd: return None
        if not validate_iso_date(date_last_payment) or not validate_iso_date(dofd): return None

        try:
            payment_dt = datetime.strptime(date_last_payment, '%Y-%m-%d')
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')

            if payment_dt > dofd_dt:
                years_after = (payment_dt - dofd_dt).days / 365.25
                if years_after > 2:
                    return self._create_flag('K4',
                        f"The date of last payment ({date_last_payment}) is {years_after:.1f} years after the DOFD ({dofd}). Payments should typically precede or closely follow the delinquency date. This may indicate data errors or SOL manipulation.",
                        {'date_last_payment': date_last_payment, 'dofd': dofd, 'years_after_dofd': round(years_after, 1)})
        except ValueError:
            logger.debug(f"Invalid date format in K4 check: payment={date_last_payment}, dofd={dofd}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_k4: {e}")
        return None

    def _check_rule_k5(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K5: Minimum payment trap indicator"""
        current_balance = fields.get('current_balance')
        original_balance = fields.get('original_balance')
        months_reviewed = fields.get('months_reviewed')
        total_payments = fields.get('total_payments')

        if not current_balance or not original_balance or not months_reviewed: return None

        try:
            current = float(str(current_balance).replace(',', '').replace('$', ''))
            original = float(str(original_balance).replace(',', '').replace('$', ''))
            months = int(months_reviewed)
            payments = float(str(total_payments).replace(',', '').replace('$', '')) if total_payments else 0

            if months > 24 and payments > original * 0.5 and current > original:
                return self._create_flag('K5',
                    f"Over {months} months, payments of ${payments:,.2f} were made but the balance increased from ${original:,.2f} to ${current:,.2f}. This pattern indicates a minimum payment trap where payments don't cover interest.",
                    {'current_balance': current, 'original_balance': original, 'total_payments': payments, 'months_reviewed': months})
        except (ValueError, TypeError): pass
        return None

    def _check_rule_k6(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K6: Clock Drift Detection (Removal based on Open instead of DOFD)"""
        dofd = fields.get('dofd')
        date_opened = fields.get('date_opened')
        removal_date = fields.get('estimated_removal_date')

        if not all([dofd, date_opened, removal_date]): return None
        if not all(validate_iso_date(d) for d in [dofd, date_opened, removal_date]): return None

        try:
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            opened_dt = datetime.strptime(date_opened, '%Y-%m-%d')
            removal_dt = datetime.strptime(removal_date, '%Y-%m-%d')

            expected_from_dofd = dofd_dt + relativedelta(years=7, months=6)
            expected_from_opened = opened_dt + relativedelta(years=7, months=6)

            drift_from_dofd = abs((removal_dt - expected_from_dofd).days)
            drift_from_opened = abs((removal_dt - expected_from_opened).days)

            if drift_from_opened < 60 and drift_from_dofd > 180:
                return self._create_flag('K6',
                    f"The removal date ({removal_date}) aligns with the Date Opened ({date_opened}) rather than the DOFD ({dofd}). The reporting clock has likely 'drifted' by {abs((opened_dt - dofd_dt).days // 30)} months.",
                    {'dofd': dofd, 'date_opened': date_opened, 'removal_date': removal_date})
        except ValueError:
            logger.debug(f"Invalid date format in K6 check: dofd={dofd}, opened={date_opened}, removal={removal_date}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_k6: {e}")
        return None

    def _check_rule_k7(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """K7: Interest Rate Violation (State-Specific Cap)"""
        from app.state_sol import get_state_sol
        
        account_type = str(fields.get('account_type') or '').lower()
        state_code = fields.get('state_code')
        current_balance = fields.get('current_balance')
        original_balance = fields.get('original_balance')
        dofd = fields.get('dofd')

        if not all([state_code, current_balance, original_balance, dofd]): return None
        
        state_data = get_state_sol(state_code)
        if not state_data: return None

        try:
            curr = float(str(current_balance).replace(',', '').replace('$', ''))
            orig = float(str(original_balance).replace(',', '').replace('$', ''))
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            years_passed = (datetime.now() - dofd_dt).days / 365.25

            if orig > 0 and curr > orig:
                annual_rate = ((curr - orig) / orig) / max(years_passed, 0.5)
                
                # Determine applicable cap
                is_medical = 'medical' in account_type
                cap = state_data.medical_interest_cap if is_medical else state_data.judgment_interest_cap
                
                if annual_rate > cap:
                    rule_name = 'Excessive Medical Interest' if is_medical else 'Excessive Collection Interest'
                    return self._create_flag('K7',
                        f"Forensic Interest Audit: Implied annual rate of {annual_rate*100:.1f}% exceeds the {state_data.state} legal cap of {cap*100:.1f}%. Balance grew from ${orig:,.2f} to ${curr:,.2f}.",
                        {'annual_interest_rate': f"{annual_rate*100:.1f}%", 'legal_cap': f"{cap*100:.1f}%"})
        except (ValueError, TypeError):
            logger.debug(f"Could not parse balances or date in K7 check: curr={current_balance}, orig={original_balance}, dofd={dofd}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_k7: {e}")
        return None

    def _check_rule_mil1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """MIL1: SCRA Interest Rate Violation"""
        is_military = fields.get('is_military', False)
        remarks = str(fields.get('remarks') or '').lower()
        
        # Auto-detect military status from remarks if not explicitly provided
        if not is_military:
            if any(term in remarks for term in ['active duty', 'scra', 'defense.gov', 'military']):
                is_military = True
        
        if not is_military: return None

        curr_bal = fields.get('current_balance')
        orig_bal = fields.get('original_balance') or fields.get('original_amount')
        dofd = fields.get('dofd')

        if not all([curr_bal, orig_bal, dofd]): return None

        try:
            curr = float(str(curr_bal).replace(',', '').replace('$', ''))
            orig = float(str(orig_bal).replace(',', '').replace('$', ''))
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            years = max((datetime.now() - dofd_dt).days / 365.25, 0.5)

            if orig > 0 and curr > orig:
                annual_rate = ((curr - orig) / orig) / years
                if annual_rate > 0.061: # 6% cap with small rounding tolerance
                    return self._create_flag('MIL1',
                        f"SCRA Violation: Implied interest rate of {annual_rate*100:.1f}% exceeds the 6% federal cap for servicemembers. servicemembers are protected from interest rates above 6% on pre-service debt.",
                        {'implied_rate': f"{annual_rate*100:.1f}%", 'federal_cap': '6.0%', 'is_military_detected': True})
        except Exception: pass
        return None

    def _check_rule_cot1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """COT1: Systematic Re-assignment Pattern"""
        remarks = str(fields.get('remarks') or '').lower()
        furnisher = str(fields.get('furnisher_or_collector') or '').lower()
        
        # Look for keywords indicating multiple transfers
        transfer_keywords = ['transferred from', 'purchased from', 'formerly known as', 'assigned to']
        match_count = sum(1 for kw in transfer_keywords if kw in remarks)
        
        if match_count >= 2 or 'multiple' in remarks:
            return self._create_flag('COT1',
                f"High-Risk Transfer Pattern: This debt shows evidence of multiple ownership transfers in the remarks ('{remarks[:50]}...'). Rapid transfers are a high-confidence indicator of data corruption or intentional re-aging.",
                {'remarks': remarks, 'furnisher': furnisher})
        return None

    def _check_rule_tb1_no_op(self, fields: Dict[str, Any]) -> None:
        return None

    def _check_rule_tb1(self, fields: Dict[str, Any], current_flags: List[RuleFlag]) -> Optional[RuleFlag]:
        """TB1: High-Confidence Systematic Violation"""
        high_severity_count = len([f for f in current_flags if f.severity == 'high' or f.severity == 'critical'])
        
        if high_severity_count >= 3:
            return self._create_flag('TB1',
                f"Systematic Audit Failure: This tradeline contains {high_severity_count} independent high-severity violations. This concentration of errors indicates a systemic reporting failure by the furnisher, providing strong evidentiary leverage for a full deletion request.",
                {'violation_count': high_severity_count})
        return None

    # ============ METRO2 COMPLIANCE RULES (M-series) ============

    def _check_rule_m1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """M1: Metro2 Integrity: DOFD vs Charge-Off Date"""
        dofd = fields.get('dofd')
        charge_off_date = fields.get('charge_off_date')
        
        if not dofd or not charge_off_date: return None
        if not validate_iso_date(dofd) or not validate_iso_date(charge_off_date): return None
        
        try:
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            co_dt = datetime.strptime(charge_off_date, '%Y-%m-%d')
            
            # Metro2 requires Charge-Off to happen ~180 days after DOFD
            # If CO is before DOFD or > 365 days after without explanation, it's a Metro2 integrity error
            days_diff = (co_dt - dofd_dt).days
            
            if days_diff < 0 or days_diff > 365:
                return self._create_flag('M1',
                    f"Metro2 Integrity Error: Charge-Off Date ({charge_off_date}) is {days_diff} days from DOFD ({dofd}). Industry standard (Metro2) requires charge-off reporting to align with the 180-day delinquency cycle.",
                    {'dofd': dofd, 'charge_off_date': charge_off_date, 'integrity_gap_days': days_diff})
        except ValueError:
            logger.debug(f"Invalid date format in M1 check: dofd={dofd}, charge_off={charge_off_date}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_m1: {e}")
        return None

    def _check_rule_m2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """M2: Metro2 integrity: Balance vs Status for Closed Accounts"""
        status = str(fields.get('account_status') or '').lower()
        balance_str = fields.get('current_balance', '0')
        
        # If status is "transfer" or "sold", balance MUST be 0 in Metro2
        if any(s in status for s in ['transfer', 'sold', 'purchased']):
            try:
                balance = float(str(balance_str).replace(',', '').replace('$', ''))
                if balance > 0:
                    return self._create_flag('M2',
                        f"Metro2 Compliance Violation: Account status '{status.upper()}' requires a $0 balance reporting. Furnisher is incorrectly reporting a balance of ${balance:,.2f} on a transferred/sold tradeline.",
                        {'status': status, 'reported_balance': balance})
            except (ValueError, TypeError):
                logger.debug(f"Could not parse balance in M2 check: {balance_str}")
            except Exception as e:
                logger.error(f"Unexpected error in _check_rule_m2: {e}")
        return None

    def _check_rule_m3(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """M3: Metro2 Internal Status Code Conflict"""
        m2_code = fields.get('metro2_status_code')
        status_text = str(fields.get('account_status') or '').lower()

        if not m2_code:
            return None

        # Standard Metro2 Status Interpretations
        m2_definitions = {
            "11": "current",
            "13": "paid",
            "62": "charge-off",
            "64": "collection",
            "71": "30 days past due",
            "78": "60 days past due",
            "80": "90 days past due",
            "82": "120 days past due",
            "83": "150 days past due",
            "84": "180 days past due",
            "97": "unpaid collection"
        }

        m2_desc = m2_definitions.get(str(m2_code))
        if not m2_desc:
            return None

        # Check for significant conflicts
        conflict = False
        if m2_code in ["64", "97"] and any(s in status_text for s in ["current", "paid", "zero balance"]):
            conflict = True
        elif m2_code in ["11", "13"] and any(s in status_text for s in ["collection", "charge-off", "delinquent", "default"]):
            conflict = True
        elif m2_code == "62" and "charge-off" not in status_text and "collection" not in status_text:
            # If code is 62 (CO) but text says something else like "Active"
            if "current" in status_text or "paid" in status_text:
                conflict = True

        if conflict:
            return self._create_flag('M3',
                f"Metro2 Internal Conflict: The internal status code '{m2_code}' ({m2_desc.upper()}) contradicts the displayed status text '{status_text.upper()}'. This internal data mismatch is a common indicator of deceptive or negligent reporting practices.",
                {'metro2_code': m2_code, 'status_text': status_text, 'interpreted_meaning': m2_desc})

        return None

    def _check_rule_m4(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """M4: Account Status/Payment Profile Discordance"""
        status = str(fields.get('account_status') or '').upper()
        profile = str(fields.get('payment_profile') or str(fields.get('payment_history') or '')).upper()
        
        if not profile or len(profile) < 1: return None
        
        # Check if latest month in profile (usually first char) is 'C' (Charge-off) but status is 'Current'
        latest = profile[0]
        if latest == 'C' and ('CURRENT' in status or 'PAYS AS AGREED' in status):
            return self._create_flag('M4', 
                f"Data Integrity Failure: The Payment Profile shows a 'Charge-off' (C) for the most recent month, but the Account Status is reported as '{status}'. These values are logically incompatible under Metro2 standards.",
                {'status': status, 'latest_profile_char': latest})
        
        return None

    def _check_rule_l1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """L1: Lexical Consistency: Status vs History"""
        status = str(fields.get('account_status') or '').lower()
        history = str(fields.get('payment_history') or '').upper()
        
        if not status or not history: return None
        
        # If status is "current" or "paid", history shouldn't have recent lates
        is_clean_status = any(s in status for s in ['current', 'paid', 'on time'])
        has_recent_lates = any(late in history[:5] for late in ['30', '60', '90', '120', '150', '180'])
        
        if is_clean_status and has_recent_lates:
            return self._create_flag('L1',
                f"Lexical Inconsistency: Account status is '{status.upper()}', but recent payment history shows delinquency markers ({history[:10]}...). This contradictory reporting violates the FCRA accuracy requirement.",
                {'status': status, 'payment_history': history})
        return None

    def _check_rule_st1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """ST1: Stale Status Update Anomaly"""
        status = str(fields.get('account_status') or '').lower()
        date_reported = fields.get('date_reported_or_updated')
        date_closed = fields.get('date_closed')

        if not date_reported or not date_closed: return None
        if 'closed' not in status and 'paid' not in status: return None

        try:
            reported_dt = datetime.strptime(date_reported, '%Y-%m-%d')
            closed_dt = datetime.strptime(date_closed, '%Y-%m-%d')
            
            # If a closed account is being refreshed more than 2 years after closing
            if (reported_dt - closed_dt).days > 730:
                return self._create_flag('ST1',
                    f"Stale Update Anomaly: This account was closed on {date_closed} but received a status update on {date_reported} (over 2 years later). Frequent updates on old, closed debt are often used to artificially influence credit scores.",
                    {'date_closed': date_closed, 'date_reported': date_reported})
        except Exception: pass
        return None

    def _check_rule_sr1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """SR1: State-Specific Regulatory Flag"""
        state = fields.get('state_code')
        if not state: return None
        
        state = state.upper()
        if state == 'CA':
            # Mention Rosenthal Act for furnishers
            return self._create_flag('SR1', 
                "California Regulatory Flag: Under the Rosenthal Fair Debt Collection Practices Act (RFDCPA), both creditors and collectors must maintain rigorous standards for accuracy. The identified reporting failures are potentially actionable under CA Civil Code § 1788.",
                {'state': 'CA'})
        
        if state == 'MA':
            # Strong consumer protection
            return self._create_flag('SR1',
                "Massachusetts Regulatory Flag: Massachusetts provides expansive consumer protections under M.G.L. c. 93A. Inaccuracies in financial reporting are considered unfair or deceptive practices in this jurisdiction.",
                {'state': 'MA'})

        if state == 'NY':
            # Mention CCFA
            return self._create_flag('SR1',
                "New York Regulatory Flag: The New York Consumer Credit Fairness Act (CCFA) has significantly tightened reporting and collection requirements. Inaccuracies on older debt may trigger enhanced liability under NY laws.",
                {'state': 'NY'})
        
        return None
        return None

    def _check_rule_pb1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """PB1: Partial Payment Deception / SOL Baiting"""
        last_pay = fields.get('date_last_payment')
        removal_date = fields.get('estimated_removal_date')

        if not last_pay or not removal_date: return None
        if not validate_iso_date(last_pay) or not validate_iso_date(removal_date): return None

        try:
            pay_dt = datetime.strptime(last_pay, '%Y-%m-%d')
            rem_dt = datetime.strptime(removal_date, '%Y-%m-%d')

            # If a payment was made within 6 months of the expected removal date
            days_until_removal = (rem_dt - pay_dt).days
            if 0 < days_until_removal < 180:
                return self._create_flag('PB1',
                    f"Suspicious Payment Activity: A payment was recorded on {last_pay}, which is only {days_until_removal} days before this account was scheduled for removal ({removal_date}). This may indicate a 'reset' of the statute of limitations through targeted solicitation of a partial payment right before credit expiration.",
                    {'date_last_payment': last_pay, 'removal_date': removal_date, 'days_before_removal': days_until_removal})
        except Exception: pass
        return None

    def _check_rule_s1(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """S1: Check if debt is beyond state SOL"""
        from app.state_sol import check_sol_expired
        state_code = fields.get('state_code')
        dofd = fields.get('dofd')

        if not state_code or not dofd: return None
        is_expired, sol_years, explanation = check_sol_expired(state_code, dofd)

        if is_expired:
            return self._create_flag('S1', explanation, {'state': state_code, 'dofd': dofd, 'sol_limit_years': sol_years})
        return None

    def _check_rule_s2(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """S2: Check for potential SOL revival through payment"""
        from app.state_sol import check_sol_expired
        state_code = fields.get('state_code')
        dofd = fields.get('dofd')
        date_last_payment = fields.get('date_last_payment')

        if not state_code or not dofd or not date_last_payment: return None
        if not validate_iso_date(date_last_payment) or not validate_iso_date(dofd): return None

        is_expired, sol_years, _ = check_sol_expired(state_code, dofd)
        if not is_expired: return None

        try:
            dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
            payment_dt = datetime.strptime(date_last_payment, '%Y-%m-%d')
            sol_expiry = dofd_dt + relativedelta(years=sol_years)

            if payment_dt > sol_expiry:
                return self._create_flag('S2',
                    f"A payment on {date_last_payment} was made after the original SOL expiry (DOFD {dofd} + {sol_years} years = {sol_expiry.strftime('%Y-%m-%d')}). In some states, this payment may have restarted the statute of limitations.",
                    {'state': state_code, 'dofd': dofd, 'date_last_payment': date_last_payment, 'original_sol_expiry': sol_expiry.strftime('%Y-%m-%d'), 'sol_years': sol_years})
        except ValueError:
            logger.debug(f"Invalid date format in S2 check: dofd={dofd}, payment={date_last_payment}")
        except Exception as e:
            logger.error(f"Unexpected error in _check_rule_s2: {e}")
        return None

    def _check_rule_s3(self, fields: Dict[str, Any]) -> Optional[RuleFlag]:
        """S3: Excessive Balance Growth (Negative Amortization)"""
        curr_str = fields.get('current_balance')
        orig_str = fields.get('original_balance') or fields.get('credit_limit')
        
        if not curr_str or not orig_str: return None
        
        try:
            curr = float(str(curr_str).replace(',', '').replace('$', ''))
            orig = float(str(orig_str).replace(',', '').replace('$', ''))
            
            if orig > 0 and curr > (orig * 1.5):
                growth_pct = ((curr - orig) / orig) * 100
                return self._create_flag('S3',
                    f"Excessive Balance Growth: The reported balance (${curr:,.2f}) is {growth_pct:.1f}% higher than the original amount (${orig:,.2f}). This indicates extreme interest/fee accumulation which may be challengeable as unauthorized under the FDCPA.",
                    {'current': curr, 'original': orig, 'growth_pct': growth_pct})
        except ValueError:
            pass
            
        return None


def run_rules(fields: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Convenience function to run all rules.
    """
    engine = RuleEngine()
    flags = engine.check_all_rules(fields)
    return [flag.to_dict() for flag in flags]


def get_rule_documentation() -> str:
    """
    Generate human-readable documentation of all rules.
    """
    doc = "# Debt Re-Aging Detection Rules\n\n"
    doc += "This document describes the rules used to detect potential debt re-aging and timeline inconsistencies.\n\n"
    doc += f"**Total Rules:** {len(RULE_DEFINITIONS)}\n\n"

    series = {}
    for rule_id, rule in RULE_DEFINITIONS.items():
        prefix = rule_id[0]
        if prefix not in series: series[prefix] = []
        series[prefix].append((rule_id, rule))

    series_names = {
        'A': 'Timeline Rules', 'B': 'Re-Aging Indicators', 'C': 'Cross-Bureau Rules',
        'D': 'Status/Balance Rules', 'E': 'Data Integrity Rules', 'F': 'Payment Manipulation',
        'G': 'Fee/Interest Abuse', 'H': 'Medical Debt Rules', 'I': 'Credit Limit Manipulation',
        'J': 'Zombie Debt / Revival Rules', 'K': 'Innovative/Advanced Rules', 'S': 'Statute of Limitations',
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
                doc += "**Legal Citations:**\n"
                for cite in rule.get('legal_citations', []):
                    citation_data = REGULATORY_MAP.get("_".join(cite.split("_")[:2]), {})
                    doc += f"- {citation_data.get('title', cite)}\n"
                doc += "\n**Suggested Evidence to Gather:**\n"
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
        'A': 'Timeline', 'B': 'Re-Aging', 'C': 'Cross-Bureau', 'D': 'Status/Balance',
        'E': 'Data Integrity', 'F': 'Payment Manipulation', 'G': 'Fee Abuse',
        'H': 'Medical Debt', 'I': 'Credit Limit', 'J': 'Zombie Debt', 'K': 'Advanced',
        'S': 'SOL', 'DU': 'Duplicates'
    }

    for rule_id, rule in RULE_DEFINITIONS.items():
        severity = rule['severity']
        summary['by_severity'][severity] = summary['by_severity'].get(severity, 0) + 1
        prefix = rule_id[:2] if rule_id.startswith('DU') else rule_id[0]
        category = category_map.get(prefix, 'Other')
        summary['by_category'][category] = summary['by_category'].get(category, 0) + 1

    return summary


# ============ PATTERN SCORING SYSTEM ============

# Corroborating pattern definitions - when rules fire together, they strengthen the case
PATTERN_COMBOS = {
    'DEFINITIVE_REAGING': {
        'name': 'Definitive Re-Aging Evidence',
        'required_rules': ['A2', 'B1'],  # Both timeline mismatch and DOFD after open
        'optional_rules': ['K6', 'F2'],  # Clock drift, activity refresh
        'min_required': 2,
        'confidence_boost': 30,
        'description': 'Multiple independent indicators confirm deliberate date manipulation'
    },
    'ZOMBIE_DEBT_REVIVAL': {
        'name': 'Zombie Debt Revival Pattern',
        'required_rules': ['J1'],
        'optional_rules': ['S1', 'S2', 'F2'],  # SOL expired, SOL revival, activity refresh
        'min_required': 1,
        'confidence_boost': 25,
        'description': 'Old debt showing signs of artificial revival'
    },
    'SYSTEMATIC_MANIPULATION': {
        'name': 'Systematic Furnisher Manipulation',
        'required_rules': [],
        'optional_rules': ['BEH_01', 'BEH_02', 'DU1', 'J2'],  # Behavioral patterns
        'min_required': 2,
        'confidence_boost': 35,
        'description': 'Evidence of programmatic/systematic reporting violations'
    },
    'FEE_STACKING_ABUSE': {
        'name': 'Illegal Fee Stacking',
        'required_rules': ['G1'],
        'optional_rules': ['G2', 'K5', 'K7'],  # Transfer increase, minimum trap, interest violation
        'min_required': 1,
        'confidence_boost': 20,
        'description': 'Excessive fees or interest charges beyond legal limits'
    },
    'MEDICAL_DEBT_VIOLATION': {
        'name': 'Medical Debt Reporting Violation',
        'required_rules': [],
        'optional_rules': ['H1', 'H2', 'H3'],  # 365-day, paid still showing, under threshold
        'min_required': 1,
        'confidence_boost': 25,
        'description': 'Violation of medical debt reporting regulations'
    },
    'DATA_INTEGRITY_FAILURE': {
        'name': 'Data Integrity Failure',
        'required_rules': [],
        'optional_rules': ['E1', 'M1', 'M2', 'K1'],  # Future date, Metro2 errors, impossible sequence
        'min_required': 2,
        'confidence_boost': 20,
        'description': 'Multiple data quality issues indicating systemic problems'
    }
}


@dataclass
class PatternScore:
    """Represents a pattern detection score with confidence level."""
    pattern_id: str
    pattern_name: str
    confidence_score: int  # 0-100
    matched_rules: List[str]
    description: str
    legal_strength: str  # 'weak', 'moderate', 'strong', 'definitive'
    recommended_action: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RiskProfile:
    """Aggregate risk profile for an account."""
    overall_score: int  # 0-100 risk score
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    detected_patterns: List[PatternScore]
    all_flags: List[Dict[str, Any]]
    dispute_strength: str  # 'weak', 'moderate', 'strong', 'compelling'
    key_violations: List[str]
    recommended_approach: str
    litigation_potential: bool

    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result['detected_patterns'] = [p.to_dict() for p in self.detected_patterns]
        return result


class PatternScorer:
    """
    Advanced pattern scoring system that evaluates the strength of detected violations.
    Calculates confidence scores based on corroborating evidence.
    """

    def __init__(self):
        self.severity_weights = {'high': 25, 'medium': 15, 'low': 5}
        self.category_weights = {
            're-aging': 1.5,  # Core issue - weight more
            'timeline': 1.4,
            'sol': 1.3,
            'medical': 1.2,
            'fee_abuse': 1.1,
            'default': 1.0
        }

    def calculate_base_score(self, flags: List[Dict[str, Any]]) -> int:
        """Calculate base score from individual flags."""
        if not flags:
            return 0

        score = 0
        for flag in flags:
            severity = flag.get('severity', 'medium')
            rule_id = flag.get('rule_id', '')

            # Base severity score
            base = self.severity_weights.get(severity, 10)

            # Apply category weight
            category = self._get_rule_category(rule_id)
            weight = self.category_weights.get(category, 1.0)

            score += int(base * weight)

        # Normalize to 0-100
        return min(100, score)

    def _get_rule_category(self, rule_id: str) -> str:
        """Determine category from rule ID."""
        if rule_id.startswith('A') or rule_id.startswith('K6'):
            return 'timeline'
        elif rule_id.startswith('B'):
            return 're-aging'
        elif rule_id.startswith('S'):
            return 'sol'
        elif rule_id.startswith('H'):
            return 'medical'
        elif rule_id.startswith('G'):
            return 'fee_abuse'
        return 'default'

    def detect_patterns(self, flags: List[Dict[str, Any]]) -> List[PatternScore]:
        """Detect corroborating patterns from fired rules."""
        detected = []
        flag_rule_ids = {f.get('rule_id') for f in flags}

        for pattern_id, pattern in PATTERN_COMBOS.items():
            # Check required rules
            required_matched = all(r in flag_rule_ids for r in pattern['required_rules'])
            if not required_matched and pattern['required_rules']:
                continue

            # Count optional matches
            optional_matched = [r for r in pattern['optional_rules'] if r in flag_rule_ids]
            total_matched = len(pattern['required_rules']) + len(optional_matched)

            if total_matched >= pattern['min_required']:
                # Calculate confidence
                all_possible = len(pattern['required_rules']) + len(pattern['optional_rules'])
                match_ratio = total_matched / max(all_possible, 1)
                confidence = int(50 + (match_ratio * 40) + (pattern['confidence_boost'] * match_ratio))
                confidence = min(100, confidence)

                # Determine legal strength
                if confidence >= 85:
                    strength = 'definitive'
                    action = 'File disputes immediately with all evidence. Consider CFPB complaint and attorney consultation.'
                elif confidence >= 70:
                    strength = 'strong'
                    action = 'File formal disputes citing specific violations. Document everything.'
                elif confidence >= 50:
                    strength = 'moderate'
                    action = 'File dispute with documentation. Request verification of all dates.'
                else:
                    strength = 'weak'
                    action = 'Request validation and additional documentation before formal dispute.'

                matched_rules = list(pattern['required_rules']) + optional_matched

                detected.append(PatternScore(
                    pattern_id=pattern_id,
                    pattern_name=pattern['name'],
                    confidence_score=confidence,
                    matched_rules=matched_rules,
                    description=pattern['description'],
                    legal_strength=strength,
                    recommended_action=action
                ))

        return sorted(detected, key=lambda x: x.confidence_score, reverse=True)

    def generate_risk_profile(self, flags: List[Dict[str, Any]], fields: Dict[str, Any] = None) -> RiskProfile:
        """Generate comprehensive risk profile for an account."""
        base_score = self.calculate_base_score(flags)
        patterns = self.detect_patterns(flags)

        # Check for TB1 (Systematic Violation) if multiple critical violations exist
        high_severity_rules = [f.get('rule_id') for f in flags if f.get('severity') in ['high', 'critical']]
        if len(high_severity_rules) >= 3:
            # Inject TB1 if not present
            if 'TB1' not in [f.get('rule_id') for f in flags]:
                engine = RuleEngine()
                tb1_flag = engine._create_flag('TB1', 
                    f"Aggregate Risk: {len(high_severity_rules)} high/critical violations detected on a single tradeline. This concentration of errors suggests a high probability of successful dispute due to systemic reporting failure.",
                    {'violation_count': len(high_severity_rules)})
                flags.append(tb1_flag.to_dict())

        # Boost score based on patterns
        pattern_boost = sum(p.confidence_score * 0.1 for p in patterns)
        overall_score = min(100, base_score + int(pattern_boost))

        # Determine risk level
        if overall_score >= 80:
            risk_level = 'critical'
        elif overall_score >= 60:
            risk_level = 'high'
        elif overall_score >= 35:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        # Determine dispute strength
        high_severity_count = len([f for f in flags if f.get('severity') == 'high'])
        if high_severity_count >= 3 or (patterns and patterns[0].legal_strength == 'definitive'):
            dispute_strength = 'compelling'
            approach = 'This case shows clear violations. File comprehensive disputes with all bureaus and the furnisher. Consider CFPB complaint and attorney consultation for potential FCRA lawsuit.'
        elif high_severity_count >= 1 or (patterns and patterns[0].legal_strength in ['strong', 'definitive']):
            dispute_strength = 'strong'
            approach = 'Significant violations detected. File formal disputes citing specific rule violations. Document all evidence carefully.'
        elif len(flags) >= 2:
            dispute_strength = 'moderate'
            approach = 'Multiple issues found. File disputes with bureaus requesting verification of dates and amounts.'
        else:
            dispute_strength = 'weak'
            approach = 'Some concerns identified. Request debt validation before formal dispute. Gather additional documentation.'

        # Identify key violations
        key_violations = [f.get('rule_name', 'Unknown') for f in flags if f.get('severity') == 'high'][:3]

        # Determine litigation potential
        litigation_potential = (
            high_severity_count >= 2 or
            any(p.legal_strength in ['definitive', 'strong'] for p in patterns) or
            any('willful' in str(f.get('explanation', '')).lower() for f in flags)
        )

        return RiskProfile(
            overall_score=overall_score,
            risk_level=risk_level,
            detected_patterns=patterns,
            all_flags=flags,
            dispute_strength=dispute_strength,
            key_violations=key_violations,
            recommended_approach=approach,
            litigation_potential=litigation_potential
        )


def calculate_pattern_score(flags: List[Dict[str, Any]], fields: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Convenience function to calculate pattern scores and risk profile.
    """
    scorer = PatternScorer()
    profile = scorer.generate_risk_profile(flags, fields)
    return profile.to_dict()
