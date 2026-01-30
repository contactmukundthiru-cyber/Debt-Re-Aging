"""
Field parser for extracting and normalizing credit report fields.
Uses regex patterns and heuristics to identify key timeline data.
"""

import re
import difflib
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
from app.utils import normalize_date, validate_iso_date
from app.constants import METRO2_STATUS_MAP, ENTITY_RESOLUTION_MAP

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class ExtractedField:
    """Represents an extracted field with metadata."""
    value: Optional[str]
    confidence: str  # High, Medium, Low
    source_text: str  # Original text that was matched
    start_pos: int  # Position in source text
    end_pos: int


@dataclass
class ParsedFields:
    """Container for all parsed fields from a credit report snippet."""
    original_creditor: ExtractedField = None
    furnisher_or_collector: ExtractedField = None
    normalized_furnisher: str = None  # New: Normalized entity name
    account_type: ExtractedField = None
    account_status: ExtractedField = None
    metro2_status_code: ExtractedField = None # New: Detected Metro2 numeric code
    current_balance: ExtractedField = None
    original_amount: ExtractedField = None
    date_opened: ExtractedField = None
    date_reported_or_updated: ExtractedField = None
    dofd: ExtractedField = None
    charge_off_date: ExtractedField = None
    date_last_payment: ExtractedField = None
    date_last_activity: ExtractedField = None
    estimated_removal_date: ExtractedField = None
    payment_history: ExtractedField = None
    remarks: ExtractedField = None  # New: Remarks/Comments section
    bureau: ExtractedField = None
    raw_text: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        result = {}
        all_fields = [
            'original_creditor', 'furnisher_or_collector', 'account_type',
            'account_status', 'metro2_status_code', 'current_balance', 'original_amount',
            'date_opened', 'date_reported_or_updated', 'dofd',
            'charge_off_date', 'date_last_payment', 'date_last_activity',
            'estimated_removal_date', 'payment_history', 'remarks', 'bureau'
        ]
        for key in all_fields:
            field_obj = getattr(self, key)
            if field_obj:
                result[key] = {
                    'value': field_obj.value,
                    'confidence': field_obj.confidence,
                    'source_text': field_obj.source_text
                }
            else:
                result[key] = {'value': None, 'confidence': 'Low', 'source_text': ''}
        
        result['normalized_furnisher'] = self.normalized_furnisher
        return result

    def to_verified_dict(self) -> Dict[str, str]:
        """Convert to simple key-value dict of verified values."""
        result = {}
        all_fields = [
            'original_creditor', 'furnisher_or_collector', 'account_type',
            'account_status', 'metro2_status_code', 'current_balance', 'original_amount',
            'date_opened', 'date_reported_or_updated', 'dofd',
            'charge_off_date', 'date_last_payment', 'date_last_activity',
            'estimated_removal_date', 'payment_history', 'remarks', 'bureau'
        ]
        for key in all_fields:
            field_obj = getattr(self, key)
            result[key] = field_obj.value if field_obj else None
        
        result['normalized_furnisher'] = self.normalized_furnisher
        return result


# Date pattern for matching various date formats
DATE_PATTERN = r'''
    (?:
        \d{1,2}[/-]\d{1,2}[/-]\d{2,4}  |  # MM/DD/YYYY or similar
        \d{4}[/-]\d{1,2}[/-]\d{1,2}  |     # YYYY-MM-DD
        \d{1,2}/\d{4}  |                  # MM/YYYY
        (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}  |  # Month DD, YYYY
        \d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}  |  # DD Month YYYY
        (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}  # Month YYYY
    )
'''


class CreditReportParser:
    """Parser for extracting fields from credit report text."""

    def __init__(self):
        # Compile regex patterns
        self.date_regex = re.compile(DATE_PATTERN, re.VERBOSE | re.IGNORECASE)

        # Bureau detection patterns
        self.bureau_patterns = {
            'Experian': re.compile(r'\bExperian\b', re.IGNORECASE),
            'Equifax': re.compile(r'\bEquifax\b', re.IGNORECASE),
            'TransUnion': re.compile(r'\bTransUnion\b|Trans\s*Union', re.IGNORECASE),
        }

        # Account type patterns
        self.account_type_patterns = [
            (re.compile(r'\b(?:collection|collections|coll(?:ection)?[\s_]?(?:account|acct)?)\b', re.IGNORECASE), 'collection'),
            (re.compile(r'\bcharge[\s\-_]?off\b', re.IGNORECASE), 'charge_off'),
            (re.compile(r'\b(?:closed|paid|settled)\b', re.IGNORECASE), 'closed'),
            (re.compile(r'\b(?:open|current|active)\b', re.IGNORECASE), 'open'),
        ]

        # Account status patterns
        self.status_patterns = [
            (re.compile(r'status[:\s]+(paid|settled|closed|delinquent|default|late|current)', re.IGNORECASE), 'status'),
            (re.compile(r'account\s*status[:\s]+(paid|settled|closed|delinquent|default|late|current)', re.IGNORECASE), 'status'),
        ]

        # Balance patterns
        self.balance_patterns = [
            re.compile(r'(?:current\s*)?balance[:\s]+\$?([\d,]+\.?\d*)', re.IGNORECASE),
            re.compile(r'amount\s*(?:due|owed)[:\s]+\$?([\d,]+\.?\d*)', re.IGNORECASE),
        ]

        # Original amount patterns
        self.original_amount_patterns = [
            re.compile(r'original\s*amount[:\s]+\$?([\d,]+\.?\d*)', re.IGNORECASE),
            re.compile(r'amount\s*placed\s*for\s*collection[:\s]+\$?([\d,]+\.?\d*)', re.IGNORECASE),
            re.compile(r'high\s*credit[:\s]+\$?([\d,]+\.?\d*)', re.IGNORECASE),
        ]

        # Field label patterns with associated date extraction
        self.date_field_patterns = {
            'date_opened': [
                re.compile(r'(?:date\s*)?open(?:ed)?[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'open\s*date[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'account\s*opened[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
            ],
            'date_reported_or_updated': [
                re.compile(r'(?:date\s*)?report(?:ed)?[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'(?:last\s*)?updat(?:ed)?[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'as\s*of[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
            ],
            'dofd': [
                re.compile(r'(?:date\s*of\s*)?(?:first\s*)?delinquen(?:cy|t)[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'DOFD[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'first\s*delinquent[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'delinquent\s*since[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
            ],
            'charge_off_date': [
                re.compile(r'charge[\s\-_]?off\s*date[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'date\s*charged\s*off[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
            ],
            'date_last_payment': [
                re.compile(r'date\s*(?:of\s*)?last\s*payment[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'last\s*payment\s*date[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
            ],
            'date_last_activity': [
                re.compile(r'date\s*(?:of\s*)?last\s*activity[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'last\s*activity\s*date[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
            ],
            'estimated_removal_date': [
                re.compile(r'(?:estimated\s*)?remov(?:al|e)[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'drop(?:s)?\s*(?:off)?[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'(?:will\s*)?(?:be\s*)?remov(?:ed)?[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
                re.compile(r'on\s*record\s*until[:\s]+(' + DATE_PATTERN + ')', re.VERBOSE | re.IGNORECASE),
            ],
        }

        # Creditor/furnisher patterns
        self.creditor_patterns = [
            re.compile(r'original\s*creditor[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!]+?)(?:\n|$|account)', re.IGNORECASE),
            re.compile(r'original\s*(?:account|acct)[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!]+?)(?:\n|$)', re.IGNORECASE),
        ]

        self.furnisher_patterns = [
            re.compile(r'(?:creditor|furnisher|collector|agency)[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!]+?)(?:\n|$|account)', re.IGNORECASE),
            re.compile(r'(?:reported\s*by|subscriber)[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!]+?)(?:\n|$)', re.IGNORECASE),
            re.compile(r'(?:company|business)\s*name[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!]+?)(?:\n|$)', re.IGNORECASE),
        ]

    def parse(self, text: str) -> ParsedFields:
        """
        Parse credit report text and extract all fields.

        Args:
            text: Raw text extracted from credit report

        Returns:
            ParsedFields object with all extracted fields
        """
        result = ParsedFields(raw_text=text)

        # Extract bureau
        result.bureau = self._extract_bureau(text)

        # Extract account type
        result.account_type = self._extract_account_type(text)

        # Extract account status
        result.account_status = self._extract_status(text)

        # Extract current balance
        result.current_balance = self._extract_balance(text)

        # Extract original amount
        result.original_amount = self._extract_original_amount(text)

        # Extract date fields
        for field_name, patterns in self.date_field_patterns.items():
            extracted = self._extract_date_field(text, patterns)
            setattr(result, field_name, extracted)

        # Extract payment history
        result.payment_history = self._extract_payment_history(text)

        # Extract creditor/furnisher
        result.original_creditor = self._extract_creditor(text)
        result.furnisher_or_collector = self._extract_furnisher(text)
        
        # Normalize furnisher for entity resolution
        if result.furnisher_or_collector and result.furnisher_or_collector.value:
            furn_val = result.furnisher_or_collector.value.upper()
            result.normalized_furnisher = furn_val
            for alias, canonical in ENTITY_RESOLUTION_MAP.items():
                if alias in furn_val:
                    result.normalized_furnisher = canonical
                    break

        # Extract Metro2 Status Code
        result.metro2_status_code = self._extract_metro2_code(text)

        # Extract remarks
        result.remarks = self._extract_remarks(text)

        return result

    def _extract_metro2_code(self, text: str) -> ExtractedField:
        """Extract numeric Metro2 status codes (e.g., 'Status Code: 97')."""
        patterns = [
            re.compile(r'status\s*code[:\s]+(\d{2})', re.IGNORECASE),
            re.compile(r'metro2\s*(?:status)?[:\s]+(\d{2})', re.IGNORECASE),
            re.compile(r'comment\s*code[:\s]+([A-Z0-9]{2})', re.IGNORECASE),
        ]
        
        for pattern in patterns:
            match = pattern.search(text)
            if match:
                code = match.group(1).upper()
                return ExtractedField(
                    value=code,
                    confidence='High',
                    source_text=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end()
                )
        return ExtractedField(value=None, confidence='Low', source_text='', start_pos=0, end_pos=0)

    def _extract_remarks(self, text: str) -> ExtractedField:
        """Extract remarks/comments section where bankruptcy markers often appear."""
        remarks_patterns = [
            re.compile(r'(?:remarks|comments|notes)[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!/]+?)(?:\n|$)', re.IGNORECASE),
            re.compile(r'consumer\s*statement[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!/]+?)(?:\n|$)', re.IGNORECASE),
        ]
        
        for pattern in remarks_patterns:
            match = pattern.search(text)
            if match:
                return ExtractedField(
                    value=match.group(1).strip(),
                    confidence='High',
                    source_text=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end()
                )
        return ExtractedField(value=None, confidence='Low', source_text='', start_pos=0, end_pos=0)

    def _extract_bureau(self, text: str) -> ExtractedField:
        """Extract credit bureau name with fuzzy matching."""
        # First try exact/regex
        for bureau_name, pattern in self.bureau_patterns.items():
            match = pattern.search(text)
            if match:
                return ExtractedField(
                    value=bureau_name,
                    confidence='High',
                    source_text=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end()
                )

        # Fuzzy matching for OCR errors (e.g., "Expenan" -> "Experian")
        words = text.split()
        for bureau_name in self.bureau_patterns.keys():
            matches = difflib.get_close_matches(bureau_name, words, n=1, cutoff=0.7)
            if matches:
                # Find position of the fuzzy match
                found_word = matches[0]
                start_pos = text.find(found_word)
                return ExtractedField(
                    value=bureau_name,
                    confidence='Medium',
                    source_text=found_word,
                    start_pos=start_pos,
                    end_pos=start_pos + len(found_word)
                )

        return ExtractedField(
            value='Unknown',
            confidence='Low',
            source_text='',
            start_pos=0,
            end_pos=0
        )

    def _extract_account_type(self, text: str) -> ExtractedField:
        """Extract account type (collection, charge_off, etc.)."""
        for pattern, account_type in self.account_type_patterns:
            match = pattern.search(text)
            if match:
                return ExtractedField(
                    value=account_type,
                    confidence='High' if account_type in ['collection', 'charge_off'] else 'Medium',
                    source_text=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end()
                )

        return ExtractedField(
            value='other',
            confidence='Low',
            source_text='',
            start_pos=0,
            end_pos=0
        )

    def _extract_status(self, text: str) -> ExtractedField:
        """Extract account status with lexical fuzzy matching."""
        status_keywords = {
            'paid': ['paid', 'paid in full', 'zero balance', 'settled'],
            'delinquent': ['delinquent', 'past due', 'late', '30 days', '60 days', '90 days'],
            'collection': ['collection', 'placed for collection', 'transfer', 'sold'],
            'charge_off': ['charge-off', 'charged off', 'profit and loss'],
            'bankruptcy': ['bankruptcy', 'discharged', 'ch7', 'ch13', 'chapter 7', 'chapter 13'],
            'rehabilitated': ['rehabilitated', 'rehab', 'default cured'],
            'current': ['current', 'on time', 'active']
        }
        
        for canonical, variants in status_keywords.items():
            for variant in variants:
                if variant in text.lower():
                    # Find exact match position
                    idx = text.lower().find(variant)
                    return ExtractedField(
                        value=canonical,
                        confidence='High',
                        source_text=text[idx:idx+len(variant)],
                        start_pos=idx,
                        end_pos=idx+len(variant)
                    )
        
        return ExtractedField(value=None, confidence='Low', source_text='', start_pos=0, end_pos=0)

    def _extract_balance(self, text: str) -> ExtractedField:
        """Extract current balance."""
        for pattern in self.balance_patterns:
            match = pattern.search(text)
            if match:
                balance_str = match.group(1).replace(',', '')
                return ExtractedField(
                    value=balance_str,
                    confidence='High',
                    source_text=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end()
                )
        return ExtractedField(value=None, confidence='Low', source_text='', start_pos=0, end_pos=0)

    def _extract_original_amount(self, text: str) -> ExtractedField:
        """Extract original amount."""
        for pattern in self.original_amount_patterns:
            match = pattern.search(text)
            if match:
                amount_str = match.group(1).replace(',', '')
                return ExtractedField(
                    value=amount_str,
                    confidence='High',
                    source_text=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end()
                )
        return ExtractedField(value=None, confidence='Low', source_text='', start_pos=0, end_pos=0)

    def _extract_payment_history(self, text: str) -> ExtractedField:
        """Extract payment history string."""
        # Look for sequences like 30 60 90 C C C or similar
        history_pattern = re.compile(r'(?:payment\s*history|history)[:\s]+([C0-9\s\-]{5,})', re.IGNORECASE)
        match = history_pattern.search(text)
        if match:
            history = match.group(1).strip()
            return ExtractedField(
                value=history,
                confidence='Medium',
                source_text=match.group(),
                start_pos=match.start(),
                end_pos=match.end()
            )
        return ExtractedField(value=None, confidence='Low', source_text='', start_pos=0, end_pos=0)

    def _extract_date_field(self, text: str, patterns: List[re.Pattern]) -> ExtractedField:
        """Extract a date field using regex + fuzzy anchor matching."""
        # Method 1: Regex
        for pattern in patterns:
            match = pattern.search(text)
            if match:
                date_str = match.group(1) if match.lastindex else match.group()
                normalized, confidence = normalize_date(date_str)
                return ExtractedField(
                    value=normalized,
                    confidence=confidence,
                    source_text=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end()
                )

        # Method 2: Fuzzy Anchor Word Matching
        # This helps when the colon or whitespace is garbled
        anchor_words = {
            'date_opened': ['opened', 'open date', 'dt open'],
            'date_reported_or_updated': ['reported', 'updated', 'as of', 'last report'],
            'dofd': ['delinquency', 'dofd', 'first delinquent', 'delq'],
            'estimated_removal_date': ['removal', 'drops off', 'on record', 'remove']
        }
        
        # We need to know which field we are currently extracting
        # This is a bit of a hack since patterns doesn't tell us the name
        current_field = None
        for name, p_list in self.date_field_patterns.items():
            if patterns == p_list:
                current_field = name
                break
        
        if current_field:
            for anchor in anchor_words.get(current_field, []):
                idx = text.lower().find(anchor)
                if idx != -1:
                    # Look for a date in the 50 characters following the anchor
                    window = text[idx:idx+50]
                    date_match = self.date_regex.search(window)
                    if date_match:
                        normalized, confidence = normalize_date(date_match.group())
                        return ExtractedField(
                            value=normalized,
                            confidence='Medium', # Lower because it's a fuzzy window
                            source_text=f"{anchor}...{date_match.group()}",
                            start_pos=idx,
                            end_pos=idx + date_match.end()
                        )

        return ExtractedField(value=None, confidence='Low', source_text='', start_pos=0, end_pos=0)

    def _extract_creditor(self, text: str) -> ExtractedField:
        """Extract original creditor name."""
        for pattern in self.creditor_patterns:
            match = pattern.search(text)
            if match:
                creditor = match.group(1).strip()
                # Clean up the extracted name
                creditor = re.sub(r'\s+', ' ', creditor)
                creditor = creditor.strip('.,')

                if len(creditor) > 2:
                    return ExtractedField(
                        value=creditor,
                        confidence='Medium',
                        source_text=match.group(),
                        start_pos=match.start(),
                        end_pos=match.end()
                    )

        return ExtractedField(
            value=None,
            confidence='Low',
            source_text='',
            start_pos=0,
            end_pos=0
        )

    def _extract_furnisher(self, text: str) -> ExtractedField:
        """Extract furnisher/collector name."""
        for pattern in self.furnisher_patterns:
            match = pattern.search(text)
            if match:
                furnisher = match.group(1).strip()
                # Clean up the extracted name
                furnisher = re.sub(r'\s+', ' ', furnisher)
                furnisher = furnisher.strip('.,')

                if len(furnisher) > 2:
                    return ExtractedField(
                        value=furnisher,
                        confidence='Medium',
                        source_text=match.group(),
                        start_pos=match.start(),
                        end_pos=match.end()
                    )

        return ExtractedField(
            value=None,
            confidence='Low',
            source_text='',
            start_pos=0,
            end_pos=0
        )


def parse_credit_report(text: str) -> ParsedFields:
    """
    Convenience function to parse credit report text.

    Args:
        text: Raw text from credit report

    Returns:
        ParsedFields object
    """
    logger.info(f"Starting field parsing for text of length {len(text)}")
    parser = CreditReportParser()
    result = parser.parse(text)
    
    high_conf = 0
    for f_name in ['original_creditor', 'furnisher_or_collector', 'account_type', 
                  'account_status', 'current_balance', 'date_opened', 
                  'date_reported_or_updated', 'dofd', 'estimated_removal_date', 'bureau']:
        f_obj = getattr(result, f_name)
        if f_obj and f_obj.confidence == 'High':
            high_conf += 1
            
    logger.info(f"Parsing complete. Found {high_conf} high-confidence fields.")
    return result


def fields_to_editable_dict(parsed: ParsedFields) -> Dict[str, Dict[str, Any]]:
    """
    Convert ParsedFields to a format suitable for UI editing.

    Returns dict with field names as keys and dicts containing
    value, confidence, source_text for each field.
    """
    result = {}
    field_names = [
        'original_creditor', 'furnisher_or_collector', 'account_type',
        'account_status', 'current_balance', 'original_amount',
        'date_opened', 'date_reported_or_updated', 'dofd',
        'charge_off_date', 'date_last_payment', 'date_last_activity',
        'estimated_removal_date', 'payment_history', 'bureau'
    ]

    for name in field_names:
        field_obj = getattr(parsed, name, None)
        if field_obj:
            result[name] = {
                'value': field_obj.value or '',
                'confidence': field_obj.confidence,
                'source_text': field_obj.source_text
            }
        else:
            result[name] = {
                'value': '',
                'confidence': 'Low',
                'source_text': ''
            }

    return result


def dict_to_verified_fields(field_dict: Dict[str, str]) -> Dict[str, str]:
    """
    Convert user-edited field dictionary to verified fields format.

    Args:
        field_dict: Dictionary with field names and their verified values

    Returns:
        Cleaned dictionary ready for rule checking
    """
    verified = {}
    for key, value in field_dict.items():
        if value and str(value).strip():
            verified[key] = str(value).strip()
        else:
            verified[key] = None
    return verified
