"""
Field parser for extracting and normalizing credit report fields.
Uses regex patterns and heuristics to identify key timeline data.
"""

import re
import difflib
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
from app.utils import normalize_date, validate_iso_date


@dataclass
class ExtractedField:
    """Represents an extracted field with metadata."""
    value: Optional[str]
    confidence: str  # High, Medium, Low
    source_text: str  # Original text that was matched
    start_pos: int  # Position in source text
    end_pos: int


@dataclass
    23|class ParsedFields:
    24|    """Container for all parsed fields from a credit report snippet."""
    25|    original_creditor: ExtractedField = None
    26|    furnisher_or_collector: ExtractedField = None
    27|    account_type: ExtractedField = None
    28|    account_status: ExtractedField = None
    29|    current_balance: ExtractedField = None
    30|    date_opened: ExtractedField = None
    31|    date_reported_or_updated: ExtractedField = None
    32|    dofd: ExtractedField = None
    33|    estimated_removal_date: ExtractedField = None
    34|    bureau: ExtractedField = None
    35|    raw_text: str = ""

    36|    def to_dict(self) -> Dict[str, Any]:
    37|        """Convert to dictionary for serialization."""
    38|        result = {}
    39|        for key in ['original_creditor', 'furnisher_or_collector', 'account_type',
    40|                    'account_status', 'current_balance',
    41|                    'date_opened', 'date_reported_or_updated', 'dofd',
    42|                    'estimated_removal_date', 'bureau']:
            field_obj = getattr(self, key)
            if field_obj:
                result[key] = {
                    'value': field_obj.value,
                    'confidence': field_obj.confidence,
                    'source_text': field_obj.source_text
                }
            else:
                result[key] = {'value': None, 'confidence': 'Low', 'source_text': ''}
        return result

    def to_verified_dict(self) -> Dict[str, str]:
        """Convert to simple key-value dict of verified values."""
        result = {}
        for key in ['original_creditor', 'furnisher_or_collector', 'account_type',
                    'account_status', 'current_balance',
                    'date_opened', 'date_reported_or_updated', 'dofd',
                    'estimated_removal_date', 'bureau']:
            field_obj = getattr(self, key)
            result[key] = field_obj.value if field_obj else None
        return result


# Date pattern for matching various date formats
DATE_PATTERN = r'''
    (?:
        \d{1,2}[/-]\d{1,2}[/-]\d{2,4}  |  # MM/DD/YYYY or similar
        \d{4}[/-]\d{1,2}[/-]\d{1,2}  |     # YYYY-MM-DD
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

        # Extract date fields
        for field_name, patterns in self.date_field_patterns.items():
            extracted = self._extract_date_field(text, patterns)
            setattr(result, field_name, extracted)

        # Extract creditor/furnisher
        result.original_creditor = self._extract_creditor(text)
        result.furnisher_or_collector = self._extract_furnisher(text)

        return result

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

    def _extract_account_type(self, text: str) -> ExtractedField:
        # ... existing _extract_account_type ...

    def _extract_status(self, text: str) -> ExtractedField:
        """Extract account status (paid, settled, etc.)."""
        for pattern, _ in self.status_patterns:
            match = pattern.search(text)
            if match:
                status = match.group(1).lower()
                return ExtractedField(
                    value=status,
                    confidence='High',
                    source_text=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end()
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

    def _extract_date_field(self, text: str, patterns: List[re.Pattern]) -> ExtractedField:
        """Extract a date field using multiple patterns."""
        for pattern in patterns:
            match = pattern.search(text)
            if match:
                # Get the captured date group
                date_str = match.group(1) if match.lastindex else match.group()
                normalized, confidence = normalize_date(date_str)

                return ExtractedField(
                    value=normalized,
                    confidence=confidence,
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
    parser = CreditReportParser()
    return parser.parse(text)


def fields_to_editable_dict(parsed: ParsedFields) -> Dict[str, Dict[str, Any]]:
    """
    Convert ParsedFields to a format suitable for UI editing.

    Returns dict with field names as keys and dicts containing
    value, confidence, source_text for each field.
    """
    result = {}
    field_names = [
        'original_creditor', 'furnisher_or_collector', 'account_type',
        'account_status', 'current_balance',
        'date_opened', 'date_reported_or_updated', 'dofd',
        'estimated_removal_date', 'bureau'
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
