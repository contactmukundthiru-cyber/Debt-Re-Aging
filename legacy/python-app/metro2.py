"""
Metro2 Format Parser and Validator
Specifically for Credit Card Companies (Furnishers) to verify pre-reporting accuracy.

This module handles the fixed-width Metro2 Base Segment (426 characters)
and identifies logical inconsistencies prior to CRA submission.
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class Metro2BaseSegment:
    """Fixed-width Metro2 Base Segment Fields (Partial Mapping for Validation)."""
    block_descriptor: str
    record_descriptor: str
    processing_indicator: str
    timestamp: str
    account_number: str
    portfolio_type: str
    account_type: str
    date_opened: str
    credit_limit: str
    highest_credit: str
    terms_duration: str
    terms_frequency: str
    scheduled_payment: str
    actual_payment: str
    account_status: str
    payment_rating: str
    payment_history_profile: str
    special_comment: str
    current_balance: str
    amount_past_due: str
    original_charge_off_amount: str
    date_account_information: str
    date_first_delinquency: str
    date_closed: str
    date_last_payment: str
    
    @classmethod
    def from_line(cls, line: str):
        """Parse a 426-character Metro2 line into a structured object."""
        if len(line) < 426:
            # Padding for short lines
            line = line.ljust(426)
            
        return cls(
            block_descriptor=line[0:4].strip(),
            record_descriptor=line[4:8].strip(),
            processing_indicator=line[8:9].strip(),
            timestamp=line[9:17].strip(),
            account_number=line[21:51].strip(),
            portfolio_type=line[51:52].strip(),
            account_type=line[52:54].strip(),
            date_opened=line[54:62].strip(),
            credit_limit=line[62:71].strip(),
            highest_credit=line[71:80].strip(),
            terms_duration=line[80:83].strip(),
            terms_frequency=line[83:84].strip(),
            scheduled_payment=line[84:93].strip(),
            actual_payment=line[93:102].strip(),
            account_status=line[102:104].strip(),
            payment_rating=line[104:105].strip(),
            payment_history_profile=line[105:129].strip(),
            special_comment=line[129:131].strip(),
            current_balance=line[131:140].strip(),
            amount_past_due=line[140:149].strip(),
            original_charge_off_amount=line[149:158].strip(),
            date_account_information=line[158:166].strip(),
            date_first_delinquency=line[166:174].strip(),
            date_closed=line[174:182].strip(),
            date_last_payment=line[182:190].strip()
        )

class Metro2Validator:
    """Validator for Metro2 compliance and re-aging prevention."""
    
    def validate_segment(self, segment: Metro2BaseSegment) -> List[Dict[str, Any]]:
        """Run logical consistency checks on a Metro2 segment."""
        violations = []
        
        # Check 1: DOFD vs Date Opened
        if segment.date_first_delinquency and segment.date_opened:
            dofd = self._parse_m2_date(segment.date_first_delinquency)
            opened = self._parse_m2_date(segment.date_opened)
            if dofd and opened and dofd < opened:
                violations.append({
                    "id": "M2_01",
                    "severity": "High",
                    "field": "Date of First Delinquency",
                    "message": "DOFD cannot be before Account Opening date.",
                    "impact": "Logical impossibility. Indicates data corruption in core ledger."
                })
                
        # Check 2: DOFD vs Account Status (Compliance Check)
        # Status 97 = Unpaid Collection, 62 = Charged off
        if segment.account_status in ['62', '97'] and not segment.date_first_delinquency:
            violations.append({
                "id": "M2_02",
                "severity": "Critical",
                "field": "Date of First Delinquency",
                "message": "Negative status accounts MUST report a DOFD.",
                "impact": "Violation of FCRA § 623(a)(5)."
            })

        # Check 3: Future Dating (Pre-reporting QC)
        now = datetime.now()
        inf_date = self._parse_m2_date(segment.date_account_information)
        if inf_date and inf_date > now:
            violations.append({
                "id": "M2_03",
                "severity": "High",
                "field": "Date of Account Information",
                "message": "Reporting date cannot be in the future.",
                "impact": "CRA file rejection likely."
            })
            
        return violations

    def _parse_m2_date(self, date_str: str) -> Optional[datetime]:
        """Convert MMDDYYYY Metro2 date to datetime object."""
        if not date_str or date_str in ['00000000', '99999999']:
            return None
        try:
            return datetime.strptime(date_str, "%m%d%Y")
        except ValueError:
            return None
