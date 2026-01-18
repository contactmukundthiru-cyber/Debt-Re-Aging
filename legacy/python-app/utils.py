"""
Utility functions for the Debt Re-Aging Case Factory.
"""

import re
import os
import shutil
import time
from datetime import datetime, date
from typing import Optional, Tuple
import hashlib
import random
import uuid
from dateutil.relativedelta import relativedelta


def normalize_date(date_str: str) -> Tuple[Optional[str], str]:
    """
    Normalize a date string to ISO format (YYYY-MM-DD) with fuzzy OCR correction.
    
    Handles common OCR errors:
    - 'O' or 'o' instead of '0'
    - 'I' or 'l' instead of '1'
    - 'S' instead of '5'
    - 'B' instead of '8'
    """
    if not date_str or not isinstance(date_str, str):
        return None, "Low"

    # Stage 1: Fuzzy OCR Correction
    original_str = date_str
    # Only perform replacement if the string looks like it's trying to be a date
    # (contains slashes, dashes, or a mix of digits and suspicious letters)
    if any(c in date_str for c in '/-') or sum(c.isdigit() for c in date_str) > 2:
        # Save month names before replacement
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        # Replacement map for common OCR errors
        # Note: We don't replace 'S' -> '5' globally because of 'Sep'
        date_str = date_str.replace('O', '0').replace('o', '0')
        date_str = date_str.replace('I', '1').replace('l', '1')
        date_str = date_str.replace('|', '1')
        # Only replace S if it's not part of a month name
        if not any(m in original_str for m in months):
            date_str = date_str.replace('S', '5').replace('s', '5')

    date_str = date_str.strip()

    # Stage 2: Pattern Matching
    patterns = [
        # ISO format
        (r'^(\d{4})-(\d{2})-(\d{2})$', '%Y-%m-%d', 'High'),
        # US format with slashes
        (r'^(\d{1,2})/(\d{1,2})/(\d{4})$', '%m/%d/%Y', 'High'),
        (r'^(\d{1,2})/(\d{1,2})/(\d{2})$', '%m/%d/%y', 'Medium'),
        # US format with dashes
        (r'^(\d{1,2})-(\d{1,2})-(\d{4})$', '%m-%d-%Y', 'High'),
        (r'^(\d{1,2})-(\d{1,2})-(\d{2})$', '%m-%d-%y', 'Medium'),
        # Month name formats
        (r'^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$', '%B %d %Y', 'High'),
        (r'^([A-Za-z]+)\s+(\d{4})$', '%B %Y', 'Medium'),
        (r'^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$', '%d %B %Y', 'High'),
        # Abbreviated month
        (r'^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$', '%b %d %Y', 'High'),
        (r'^([A-Za-z]{3})\s+(\d{4})$', '%b %Y', 'Medium'),
        # Year-month only
        (r'^(\d{4})/(\d{2})$', '%Y/%m', 'Medium'),
        (r'^(\d{4})-(\d{2})$', '%Y-%m', 'Medium'),
        # MM/YYYY
        (r'^(\d{1,2})/(\d{4})$', '%m/%Y', 'Medium'),
        (r'^(\d{1,2})-(\d{4})$', '%m-%Y', 'Medium'),
    ]

    for pattern, fmt, confidence in patterns:
        match = re.match(pattern, date_str, re.IGNORECASE)
        if match:
            try:
                # Standardize the date string for strptime by removing optional comma
                # if the format doesn't have it
                clean_date = date_str.replace(',', '')
                clean_fmt = fmt.replace(',', '')
                
                # Handle formats without day
                if '%d' not in clean_fmt:
                    parsed = datetime.strptime(clean_date, clean_fmt)
                    # Default to first of month
                    return parsed.strftime('%Y-%m-01'), confidence
                else:
                    parsed = datetime.strptime(clean_date, clean_fmt)
                    return parsed.strftime('%Y-%m-%d'), confidence
            except ValueError:
                continue

    # Stage 3: Brute force digit extraction if patterns fail
    digits = re.sub(r'[^0-9]', '', date_str)
    if len(digits) == 8: # MMDDYYYY
        try:
            m, d, y = int(digits[:2]), int(digits[2:4]), int(digits[4:])
            if 1 <= m <= 12 and 1 <= d <= 31 and 1900 < y < 2100:
                return f"{y}-{m:02d}-{d:02d}", "Low"
        except (ValueError, IndexError):
            pass
    elif len(digits) == 6: # MMDDYY
        try:
            m, d, y = int(digits[:2]), int(digits[2:4]), int(digits[4:])
            year = 2000 + y if y < 50 else 1900 + y
            if 1 <= m <= 12 and 1 <= d <= 31:
                return f"{year}-{m:02d}-{d:02d}", "Low"
        except (ValueError, IndexError):
            pass

    # Try to extract any year from the string
    year_match = re.search(r'\b(19\d{2}|20\d{2})\b', date_str)
    if year_match:
        return f"{year_match.group(1)}-01-01", "Low"

    return None, "Low"


def calculate_years_difference(date1: str, date2: str) -> Optional[float]:
    """
    Calculate the difference in years between two ISO dates.
    """
    try:
        d1 = datetime.strptime(date1, '%Y-%m-%d')
        d2 = datetime.strptime(date2, '%Y-%m-%d')
        delta = abs((d2 - d1).days)
        return round(delta / 365.25, 2)
    except (ValueError, TypeError):
        return None


def generate_case_id() -> str:
    """
    Generate a unique case ID with sufficient entropy.
    Format: DR-XXXXXX-XXXX (14 characters)
    """
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    # Use part of a UUID for better uniqueness than just a hash of the timestamp
    # Test expects total length 14: "DR-" (3) + 6 digits + "-" (1) + 4 hex = 14
    unique_suffix = uuid.uuid4().hex[:4].upper()
    return f"DR-{timestamp[-6:]}-{unique_suffix}"


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename by removing invalid characters.
    """
    # Remove invalid characters for Windows/Unix
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    sanitized = re.sub(r'\s+', '_', sanitized)
    return sanitized[:100]  # Limit length


def mask_pii(text: str) -> str:
    """
    Mask potential PII in text for logging purposes.
    """
    # Mask SSN patterns
    text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', 'XXX-XX-XXXX', text)
    text = re.sub(r'\b\d{9}\b', 'XXXXXXXXX', text)

    # Mask account numbers (sequences of 10+ digits)
    text = re.sub(r'\b\d{10,}\b', lambda m: 'X' * len(m.group()), text)

    # Mask phone numbers
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', 'XXX-XXX-XXXX', text)

    return text


def confidence_to_color(confidence: str) -> str:
    """
    Map confidence level to a display color.
    """
    colors = {
        'High': '#28a745',    # Green
        'Medium': '#ffc107',  # Yellow
        'Low': '#dc3545'      # Red
    }
    return colors.get(confidence, '#6c757d')


def severity_to_emoji(severity: str) -> str:
    """
    Map severity level to an indicator (no emoji per guidelines).
    """
    indicators = {
        'high': '[!!!]',
        'medium': '[!!]',
        'low': '[!]'
    }
    return indicators.get(severity.lower(), '[?]')


def validate_iso_date(date_str: str) -> bool:
    """
    Validate that a string is a valid ISO date.
    """
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except (ValueError, TypeError):
        return False


def get_statute_of_limitations_years() -> int:
    """
    Return the standard credit reporting time limit (7 years).
    Note: Some items like bankruptcies can remain longer (10 years).
    """
    return 7


def cleanup_old_cases(output_dir: str, max_age_hours: int = 24):
    """
    Clean up old case files from the output directory.

    Args:
        output_dir: Directory containing case output files
        max_age_hours: Maximum age in hours before files are deleted
    """
    if not os.path.exists(output_dir):
        return

    now = time.time()
    max_age_seconds = max_age_hours * 3600

    for item in os.listdir(output_dir):
        if item == 'metrics':
            continue
            
        item_path = os.path.join(output_dir, item)
        try:
            if os.path.isfile(item_path):
                if now - os.path.getmtime(item_path) > max_age_seconds:
                    os.remove(item_path)
            elif os.path.isdir(item_path):
                if now - os.path.getmtime(item_path) > max_age_seconds:
                    shutil.rmtree(item_path)
        except (OSError, IOError):
            pass  # Skip files that can't be accessed


def estimate_removal_date(dofd: str) -> Optional[str]:
    """
    Estimate when an item should be removed based on DOFD.
    Standard is 7 years + 180 days from DOFD.
    Uses relativedelta for robust date arithmetic.
    """
    try:
        dofd_date = datetime.strptime(dofd, '%Y-%m-%d')
        # 7 years + 180 days (standard industry practice)
        removal_date = dofd_date + relativedelta(years=7, days=180)
        return removal_date.strftime('%Y-%m-%d')
    except (ValueError, TypeError):
        return None

def list_historical_cases(output_dir: str) -> list:
    """
    List all generated cases in the output directory.
    Returns a list of dicts with case info.
    """
    if not os.path.exists(output_dir):
        return []

    import yaml
    cases = []
    for item in os.listdir(output_dir):
        case_dir = os.path.join(output_dir, item)
        if os.path.isdir(case_dir) and item != 'metrics':
            case_file = os.path.join(case_dir, 'case.yaml')
            if os.path.exists(case_file):
                try:
                    with open(case_file, 'r', encoding='utf-8') as f:
                        data = yaml.safe_load(f)
                        cases.append({
                            'id': data.get('case_id', item),
                            'date': data.get('generated', 'Unknown'),
                            'consumer': data.get('consumer_info', {}).get('name', 'N/A'),
                            'flags': data.get('summary', {}).get('total_flags', 0),
                            'path': case_dir
                        })
                except Exception:
                    continue
    
    # Sort by date descending
    cases.sort(key=lambda x: x['date'], reverse=True)
    return cases

