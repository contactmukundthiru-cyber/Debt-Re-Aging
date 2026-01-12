"""
Multi-Account Parser Module
Extract and analyze multiple accounts from a single credit report

Handles full credit report parsing with account segmentation.
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class AccountSegment:
    """A single account segment from a credit report."""
    account_id: str
    raw_text: str
    start_line: int
    end_line: int
    account_type: str = ""
    creditor_name: str = ""
    is_collection: bool = False
    is_negative: bool = False


@dataclass
class MultiAccountResult:
    """Result of multi-account parsing."""
    total_accounts: int
    collection_accounts: int
    negative_accounts: int
    accounts: List[AccountSegment]
    raw_text: str
    bureau_detected: str = ""
    report_date: str = ""


# Patterns that indicate account boundaries
ACCOUNT_BOUNDARY_PATTERNS = [
    # Tradeline headers
    r'^={3,}$',  # Line of equals signs
    r'^-{3,}$',  # Line of dashes
    r'^\*{3,}$',  # Line of asterisks

    # Account type indicators at start of line
    r'^(?:COLLECTION|COLLECTIONS)\s',
    r'^(?:CHARGE[\-\s]?OFF|CHARGEOFF)\s',
    r'^(?:INSTALLMENT|REVOLVING|MORTGAGE|STUDENT\s+LOAN)\s',
    r'^(?:ACCOUNT|TRADELINE)\s*(?:NAME|#|NUMBER)?:',

    # Creditor name patterns
    r'^[A-Z][A-Z\s&\-\.]+(?:BANK|CREDIT|FINANCIAL|FUNDING|RECOVERY|COLLECTION)',

    # Bureau-specific patterns
    r'^Account\s+(?:Name|Number|Type):',
    r'^Creditor:',
    r'^Original\s+Creditor:',
]

# Patterns that indicate collection accounts
COLLECTION_INDICATORS = [
    r'collection',
    r'collections',
    r'purchased\s+(?:from|by)',
    r'sold\s+to',
    r'assigned\s+to',
    r'transferred\s+to',
    r'original\s+creditor',
    r'debt\s+buyer',
]

# Patterns that indicate negative accounts
NEGATIVE_INDICATORS = [
    r'charge[\-\s]?off',
    r'collection',
    r'past\s+due',
    r'delinquent',
    r'late\s+payment',
    r'30\s*days?\s*late',
    r'60\s*days?\s*late',
    r'90\s*days?\s*late',
    r'120\s*days?\s*late',
    r'default',
    r'repossession',
    r'foreclosure',
    r'bankruptcy',
    r'judgment',
    r'lien',
    r'seriously\s+past\s+due',
]


def detect_bureau(text: str) -> str:
    """Detect which credit bureau the report is from."""
    text_lower = text.lower()

    if 'experian' in text_lower:
        return 'Experian'
    elif 'equifax' in text_lower:
        return 'Equifax'
    elif 'transunion' in text_lower or 'trans union' in text_lower:
        return 'TransUnion'

    return 'Unknown'


def detect_report_date(text: str) -> str:
    """Try to detect the report date."""
    patterns = [
        r'report\s+date[:\s]+(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
        r'as\s+of[:\s]+(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
        r'date\s+generated[:\s]+(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
        r'report\s+pulled[:\s]+(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)

    return ""


def is_account_boundary(line: str) -> bool:
    """Check if a line represents an account boundary."""
    line = line.strip()

    for pattern in ACCOUNT_BOUNDARY_PATTERNS:
        if re.match(pattern, line, re.IGNORECASE):
            return True

    return False


def is_collection_account(text: str) -> bool:
    """Check if text indicates a collection account."""
    text_lower = text.lower()
    for pattern in COLLECTION_INDICATORS:
        if re.search(pattern, text_lower):
            return True
    return False


def is_negative_account(text: str) -> bool:
    """Check if text indicates a negative account."""
    text_lower = text.lower()
    for pattern in NEGATIVE_INDICATORS:
        if re.search(pattern, text_lower):
            return True
    return False


def extract_creditor_name(text: str) -> str:
    """Extract the creditor/account name from segment text."""
    patterns = [
        r'(?:account\s+name|creditor|furnisher)[:\s]+([^\n]+)',
        r'^([A-Z][A-Z\s&\-\.]{2,}(?:BANK|CREDIT|FINANCIAL|FUNDING|RECOVERY|COLLECTION|LLC|INC))',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            name = match.group(1).strip()
            # Clean up the name
            name = re.sub(r'\s+', ' ', name)
            return name[:100]  # Limit length

    # Fallback: first line that looks like a company name
    lines = text.split('\n')
    for line in lines[:5]:
        line = line.strip()
        if len(line) > 3 and line[0].isupper() and not re.match(r'^(date|balance|status|account)', line, re.I):
            return line[:100]

    return ""


def segment_accounts(text: str) -> List[AccountSegment]:
    """
    Segment a credit report into individual accounts.

    Uses heuristics to identify account boundaries and extract
    each account as a separate segment.
    """
    lines = text.split('\n')
    segments = []
    current_segment_lines = []
    current_start = 0
    account_counter = 0

    for i, line in enumerate(lines):
        # Check for account boundary
        if is_account_boundary(line) and current_segment_lines:
            # Save current segment
            segment_text = '\n'.join(current_segment_lines)
            if len(segment_text.strip()) > 50:  # Minimum content threshold
                account_counter += 1
                segments.append(AccountSegment(
                    account_id=f"ACC_{account_counter:03d}",
                    raw_text=segment_text,
                    start_line=current_start,
                    end_line=i - 1,
                    creditor_name=extract_creditor_name(segment_text),
                    is_collection=is_collection_account(segment_text),
                    is_negative=is_negative_account(segment_text)
                ))

            # Start new segment
            current_segment_lines = [line]
            current_start = i
        else:
            current_segment_lines.append(line)

    # Don't forget the last segment
    if current_segment_lines:
        segment_text = '\n'.join(current_segment_lines)
        if len(segment_text.strip()) > 50:
            account_counter += 1
            segments.append(AccountSegment(
                account_id=f"ACC_{account_counter:03d}",
                raw_text=segment_text,
                start_line=current_start,
                end_line=len(lines) - 1,
                creditor_name=extract_creditor_name(segment_text),
                is_collection=is_collection_account(segment_text),
                is_negative=is_negative_account(segment_text)
            ))

    # If no segments found by boundaries, try to find collection accounts specifically
    if len(segments) <= 1:
        segments = find_collection_accounts_in_text(text)

    return segments


def find_collection_accounts_in_text(text: str) -> List[AccountSegment]:
    """
    Alternative segmentation focused on finding collection accounts.

    Used when boundary detection fails.
    """
    segments = []
    account_counter = 0

    # Look for patterns that indicate collection accounts
    collection_patterns = [
        r'((?:collection|collections)[^\n]*\n(?:[^\n]+\n){0,20})',
        r'(original\s+creditor[^\n]*\n(?:[^\n]+\n){0,15})',
        r'(purchased\s+(?:from|by)[^\n]*\n(?:[^\n]+\n){0,15})',
    ]

    for pattern in collection_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            segment_text = match.group(1)
            start_pos = match.start()
            start_line = text[:start_pos].count('\n')

            account_counter += 1
            segments.append(AccountSegment(
                account_id=f"COLL_{account_counter:03d}",
                raw_text=segment_text,
                start_line=start_line,
                end_line=start_line + segment_text.count('\n'),
                creditor_name=extract_creditor_name(segment_text),
                is_collection=True,
                is_negative=True
            ))

    # Remove duplicates based on similar content
    unique_segments = []
    for seg in segments:
        is_duplicate = False
        for existing in unique_segments:
            if len(set(seg.raw_text.split()) & set(existing.raw_text.split())) > 10:
                is_duplicate = True
                break
        if not is_duplicate:
            unique_segments.append(seg)

    return unique_segments


def parse_multi_account_report(text: str) -> MultiAccountResult:
    """
    Parse a full credit report with multiple accounts.

    Returns:
        MultiAccountResult with segmented accounts and metadata
    """
    bureau = detect_bureau(text)
    report_date = detect_report_date(text)
    segments = segment_accounts(text)

    collection_count = sum(1 for s in segments if s.is_collection)
    negative_count = sum(1 for s in segments if s.is_negative)

    return MultiAccountResult(
        total_accounts=len(segments),
        collection_accounts=collection_count,
        negative_accounts=negative_count,
        accounts=segments,
        raw_text=text,
        bureau_detected=bureau,
        report_date=report_date
    )


def analyze_all_accounts(text: str) -> Dict[str, Any]:
    """
    Analyze all accounts in a credit report.

    Returns a comprehensive analysis with all accounts parsed and flagged.
    """
    from app.parser import parse_credit_report, fields_to_editable_dict
    from app.rules import run_rules

    result = parse_multi_account_report(text)
    analyzed_accounts = []

    for segment in result.accounts:
        # Parse this account segment
        parsed = parse_credit_report(segment.raw_text)
        fields = fields_to_editable_dict(parsed)

        # Run rules on this account
        verified_fields = {k: v.get('value') for k, v in fields.items()}
        flags = run_rules(verified_fields)

        analyzed_accounts.append({
            'account_id': segment.account_id,
            'creditor': segment.creditor_name,
            'is_collection': segment.is_collection,
            'is_negative': segment.is_negative,
            'fields': fields,
            'flags': [f.to_dict() if hasattr(f, 'to_dict') else f for f in flags],
            'flag_count': len(flags),
            'high_severity_flags': len([f for f in flags
                                       if (f.get('severity') if isinstance(f, dict) else f.severity) == 'high'])
        })

    # Summary statistics
    total_flags = sum(a['flag_count'] for a in analyzed_accounts)
    accounts_with_flags = len([a for a in analyzed_accounts if a['flag_count'] > 0])
    high_priority_accounts = [a for a in analyzed_accounts if a['high_severity_flags'] > 0]

    return {
        'summary': {
            'bureau': result.bureau_detected,
            'report_date': result.report_date,
            'total_accounts': result.total_accounts,
            'collection_accounts': result.collection_accounts,
            'negative_accounts': result.negative_accounts,
            'total_flags': total_flags,
            'accounts_with_flags': accounts_with_flags,
            'high_priority_accounts': len(high_priority_accounts)
        },
        'accounts': analyzed_accounts,
        'high_priority': high_priority_accounts,
        'recommendations': generate_recommendations(analyzed_accounts)
    }


def generate_recommendations(accounts: List[Dict]) -> List[str]:
    """Generate recommendations based on account analysis."""
    recommendations = []

    high_severity_accounts = [a for a in accounts if a['high_severity_flags'] > 0]
    collection_with_flags = [a for a in accounts if a['is_collection'] and a['flag_count'] > 0]

    if high_severity_accounts:
        recommendations.append(
            f"PRIORITY: {len(high_severity_accounts)} account(s) have high-severity issues. "
            "Focus on these first as they likely represent clear FCRA violations."
        )

    if collection_with_flags:
        recommendations.append(
            f"Found {len(collection_with_flags)} collection account(s) with potential issues. "
            "Consider sending debt validation letters to collectors."
        )

    # Check for multiple collectors with same original creditor
    original_creditors = {}
    for a in accounts:
        oc = a['fields'].get('original_creditor', {}).get('value', '')
        if oc:
            if oc not in original_creditors:
                original_creditors[oc] = []
            original_creditors[oc].append(a['account_id'])

    for oc, account_ids in original_creditors.items():
        if len(account_ids) > 1:
            recommendations.append(
                f"Multiple accounts ({len(account_ids)}) share original creditor '{oc}'. "
                "This may indicate duplicate reporting or sold debt chains. Investigate further."
            )

    if not recommendations:
        recommendations.append(
            "No high-priority issues detected. Review individual accounts for any discrepancies."
        )

    return recommendations


def render_multi_account_ui(st):
    """Render the multi-account analysis UI in Streamlit."""
    st.title("Multi-Account Report Analysis")
    st.markdown("""
    Upload a complete credit report to analyze all accounts at once.
    The system will automatically segment individual accounts and flag issues.
    """)

    uploaded_file = st.file_uploader(
        "Upload Full Credit Report",
        type=['pdf', 'png', 'jpg', 'jpeg', 'txt'],
        help="Upload your complete credit report (all pages)"
    )

    # Or paste text
    with st.expander("Or paste report text"):
        pasted_text = st.text_area(
            "Paste full credit report text",
            height=300,
            placeholder="Paste your entire credit report here..."
        )

    if uploaded_file:
        from app.extraction import extract_text_from_bytes
        file_bytes = uploaded_file.read()
        text, method = extract_text_from_bytes(file_bytes, uploaded_file.name)
    elif pasted_text:
        text = pasted_text
        method = "paste"
    else:
        text = None

    if text and st.button("Analyze All Accounts", type="primary"):
        with st.spinner("Analyzing accounts..."):
            result = analyze_all_accounts(text)

        # Summary
        st.markdown("### Summary")
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Accounts", result['summary']['total_accounts'])
        col2.metric("Collections", result['summary']['collection_accounts'])
        col3.metric("Accounts with Issues", result['summary']['accounts_with_flags'])
        col4.metric("High Priority", result['summary']['high_priority_accounts'])

        if result['summary']['bureau']:
            st.info(f"Bureau detected: **{result['summary']['bureau']}**")

        # Recommendations
        st.markdown("### Recommendations")
        for rec in result['recommendations']:
            st.markdown(f"- {rec}")

        # Account details
        st.markdown("### Account Details")

        # Show high priority first
        if result['high_priority']:
            st.markdown("#### High Priority Accounts")
            for acc in result['high_priority']:
                with st.expander(f"⚠️ {acc['creditor'] or acc['account_id']} - {acc['high_severity_flags']} high severity flags"):
                    st.markdown(f"**Flags:** {acc['flag_count']}")
                    for flag in acc['flags']:
                        severity = flag.get('severity', 'medium')
                        st.markdown(f"- **{severity.upper()}**: {flag.get('rule_name', 'Unknown')} - {flag.get('explanation', '')}")

        # All accounts
        st.markdown("#### All Accounts")
        for acc in result['accounts']:
            status = "⚠️" if acc['flag_count'] > 0 else "✅"
            with st.expander(f"{status} {acc['creditor'] or acc['account_id']}"):
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown(f"**Type:** {'Collection' if acc['is_collection'] else 'Regular'}")
                    st.markdown(f"**Flags:** {acc['flag_count']}")
                with col2:
                    if acc['is_negative']:
                        st.markdown("**Status:** Negative")
                    if acc['high_severity_flags']:
                        st.markdown(f"**High Severity:** {acc['high_severity_flags']}")

                if acc['flags']:
                    st.markdown("**Issues Found:**")
                    for flag in acc['flags']:
                        st.markdown(f"- {flag.get('rule_name', 'Unknown')}: {flag.get('explanation', '')}")
