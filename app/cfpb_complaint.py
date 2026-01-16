"""
CFPB Complaint Generator
Generate properly formatted complaints for the Consumer Financial Protection Bureau.

The CFPB accepts complaints about credit reporting issues and requires specific information.
This module generates complaint text optimized for CFPB submission.
"""

import streamlit as st
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class CFPBComplaint:
    """Structured CFPB complaint data."""
    product: str  # "Credit reporting, credit repair services, or other personal consumer reports"
    sub_product: str  # "Credit reporting"
    issue: str  # e.g., "Incorrect information on your report"
    sub_issue: str  # e.g., "Account status incorrect"
    company_name: str
    complaint_narrative: str
    desired_resolution: str
    consumer_consent: bool = True


# CFPB complaint categories for credit reporting
CFPB_ISSUES = {
    "Incorrect information on your report": [
        "Account status incorrect",
        "Account information incorrect",
        "Personal information incorrect",
        "Public record information inaccurate",
        "Information belongs to someone else",
        "Old information reappears or never goes away"
    ],
    "Problem with a credit reporting company's investigation": [
        "Their investigation did not fix an error on your report",
        "Investigation took more than 30 days",
        "Was not notified of investigation status or results",
        "Difficulty submitting a dispute or getting information about a dispute"
    ],
    "Improper use of your report": [
        "Reporting company used your report improperly",
        "Credit inquiries on your report that you don't recognize"
    ],
    "Problem with a company's investigation into an existing problem": [
        "Their investigation did not fix an error on your report",
        "Investigation took more than 30 days",
        "Was not notified of investigation status or results"
    ],
    "Unable to get your credit report or credit score": [
        "Problem getting your free annual credit report",
        "Other problem getting your credit report or credit score"
    ]
}


def generate_complaint_narrative(
    flags: List[Dict],
    fields: Dict[str, Any],
    consumer_info: Dict[str, str],
    timeline_data: List[Dict] = None
) -> str:
    """Generate a compelling complaint narrative from detected issues."""

    creditor = str(fields.get('creditor_name') or fields.get('furnisher_or_collector') or 'the furnisher')
    account_type = str(fields.get('account_type') or 'account')
    dofd = str(fields.get('dofd') or 'unknown')
    removal_date = str(fields.get('estimated_removal_date') or 'unknown')

    narrative = []

    # Opening
    narrative.append(f"I am filing this complaint regarding inaccurate information being reported on my credit report by {creditor}.")
    narrative.append("")

    # Account identification
    narrative.append("ACCOUNT INFORMATION:")
    narrative.append(f"- Creditor/Furnisher: {creditor}")
    if fields.get('account_number'):
        # Mask account number for privacy
        acct = fields.get('account_number', '')
        masked = 'XXXX' + acct[-4:] if len(acct) > 4 else acct
        narrative.append(f"- Account Number (last 4): {masked}")
    narrative.append(f"- Account Type: {account_type}")
    narrative.append("")

    # Specific violations found
    narrative.append("SPECIFIC ISSUES IDENTIFIED:")
    narrative.append("")

    high_flags = [f for f in flags if f.get('severity') == 'high']
    medium_flags = [f for f in flags if f.get('severity') == 'medium']

    for i, flag in enumerate(high_flags + medium_flags, 1):
        narrative.append(f"{i}. {flag.get('rule_name', 'Issue')}")
        narrative.append(f"   {flag.get('explanation', '')}")
        if flag.get('why_it_matters'):
            narrative.append(f"   Impact: {flag.get('why_it_matters', '')}")
        narrative.append("")

    # Timeline evidence if available
    if timeline_data and len(timeline_data) >= 2:
        narrative.append("TIMELINE EVIDENCE OF MANIPULATION:")
        narrative.append("")
        for entry in sorted(timeline_data, key=lambda x: x.get('report_date', '')):
            narrative.append(f"- Report dated {entry.get('report_date')}:")
            if entry.get('dofd'):
                narrative.append(f"  DOFD shown: {entry.get('dofd')}")
            if entry.get('date_opened'):
                narrative.append(f"  Date Opened: {entry.get('date_opened')}")
            if entry.get('removal_date'):
                narrative.append(f"  Removal Date: {entry.get('removal_date')}")
        narrative.append("")
        narrative.append("The dates changed between reports, which is evidence of illegal re-aging under the FCRA.")
        narrative.append("")

    # Legal basis
    narrative.append("LEGAL BASIS:")
    narrative.append("")
    narrative.append("Under the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681:")
    narrative.append("- Section 1681e(b) requires credit reporting agencies to follow reasonable procedures to assure maximum possible accuracy")
    narrative.append("- Section 1681s-2(a) requires furnishers to report accurate information")
    narrative.append("- Section 1681c(a) limits reporting of most negative items to 7 years from the date of first delinquency")
    narrative.append("")

    if any('re-ag' in str(f.get('explanation', '')).lower() for f in flags):
        narrative.append("The practice of 're-aging' debt by manipulating dates is a violation of these provisions and constitutes willful non-compliance with the FCRA.")
        narrative.append("")

    # Previous dispute attempts
    narrative.append("PREVIOUS ATTEMPTS TO RESOLVE:")
    narrative.append("")
    narrative.append("I have attempted to resolve this matter directly with the credit bureaus and/or the furnisher through the standard dispute process. However, the inaccurate information continues to appear on my credit report.")
    narrative.append("")

    # Harm suffered
    narrative.append("HARM SUFFERED:")
    narrative.append("")
    narrative.append("This inaccurate information has negatively impacted my credit score and my ability to obtain credit, housing, and/or employment. The continued reporting of this inaccurate information causes ongoing harm to my financial well-being.")
    narrative.append("")

    return "\n".join(narrative)


def generate_desired_resolution(flags: List[Dict], fields: Dict) -> str:
    """Generate appropriate resolution request."""

    resolutions = []

    # Always request deletion or correction
    resolutions.append("1. IMMEDIATE DELETION of the inaccurate tradeline from all three credit bureaus (Experian, Equifax, TransUnion)")

    # If re-aging detected
    if any('re-ag' in str(f.get('explanation', '')).lower() for f in flags):
        resolutions.append("2. Investigation into the furnisher's reporting practices for evidence of systematic re-aging")

    # Request investigation
    resolutions.append("3. A thorough investigation into the accuracy of the reported information")

    # Request documentation
    resolutions.append("4. Copies of any documentation the furnisher claims supports the accuracy of this information")

    # Statutory damages mention
    if any(f.get('severity') == 'high' for f in flags):
        resolutions.append("5. If willful non-compliance is determined, I reserve my right to pursue statutory damages under 15 U.S.C. § 1681n")

    return "\n".join(resolutions)


def determine_cfpb_issue(flags: List[Dict]) -> tuple:
    """Determine the best CFPB issue category based on flags."""

    # Check for date manipulation (re-aging)
    date_issues = ['A1', 'A2', 'B1', 'B2', 'K6']
    has_date_issue = any(f.get('rule_id') in date_issues for f in flags)

    # Check for status issues
    status_issues = ['D1', 'D2', 'D3', 'E1', 'E2']
    has_status_issue = any(f.get('rule_id') in status_issues for f in flags)

    # Check for balance issues
    balance_issues = ['F1', 'F2', 'F3']
    has_balance_issue = any(f.get('rule_id') in balance_issues for f in flags)

    if has_date_issue:
        return ("Incorrect information on your report", "Old information reappears or never goes away")
    elif has_status_issue:
        return ("Incorrect information on your report", "Account status incorrect")
    elif has_balance_issue:
        return ("Incorrect information on your report", "Account information incorrect")
    else:
        return ("Incorrect information on your report", "Account information incorrect")


def render_cfpb_generator(st):
    """Render the CFPB Complaint Generator UI."""

    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">CFPB Complaint Generator</h2>
        <p style="color: #64748b; font-size: 0.95rem;">
            Generate a properly formatted complaint for the Consumer Financial Protection Bureau.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.info("""
    **About CFPB Complaints:** The Consumer Financial Protection Bureau (CFPB) accepts complaints
    about credit reporting issues. Companies must respond within 15 days, and the CFPB tracks
    complaint patterns to identify bad actors. Filing a CFPB complaint creates an official record
    and often gets faster results than disputing directly with bureaus.
    """)

    # Check if we have case data
    flags = st.session_state.get('rule_flags', [])
    fields = st.session_state.get('editable_fields', {})

    if not flags:
        st.warning("""
        **No issues detected yet.**

        To generate a CFPB complaint, first analyze a credit report using "Check One Report" mode.
        Once issues are detected, return here to generate your complaint.
        """)

        # Manual entry option
        st.markdown("---")
        st.markdown("### Or Enter Information Manually")

        manual_creditor = st.text_input("Creditor/Collector Name", key="cfpb_creditor")
        manual_issue = st.text_area("Describe the issue", key="cfpb_issue", height=150,
                                    placeholder="Describe what's wrong with your credit report...")

        if manual_creditor and manual_issue:
            if st.button("Generate Basic Complaint", type="primary"):
                basic_complaint = f"""I am filing this complaint regarding inaccurate information being reported by {manual_creditor}.

ISSUE:
{manual_issue}

LEGAL BASIS:
Under the Fair Credit Reporting Act (FCRA), credit reporting agencies must follow reasonable procedures to assure maximum possible accuracy (15 U.S.C. § 1681e(b)), and furnishers must report accurate information (15 U.S.C. § 1681s-2(a)).

DESIRED RESOLUTION:
1. Immediate deletion or correction of the inaccurate information
2. Investigation into the accuracy of the reported information
3. Written confirmation of any changes made

I have attempted to resolve this matter through the standard dispute process without success."""

                st.markdown("### Your Complaint")
                st.text_area("Copy this text:", basic_complaint, height=400)

                st.markdown("""
                **Next Steps:**
                1. Go to [consumerfinance.gov/complaint](https://www.consumerfinance.gov/complaint/)
                2. Select "Credit reporting or other personal consumer reports"
                3. Follow the prompts and paste your complaint narrative
                """)
        return

    # We have flags - generate comprehensive complaint
    st.success(f"Found {len(flags)} issue(s) to include in your complaint.")

    # Get verified fields
    verified_fields = {k: v.get('value') if isinstance(v, dict) else v
                       for k, v in fields.items()}

    # Consumer info
    st.markdown("### Your Information")
    col1, col2 = st.columns(2)
    with col1:
        consumer_name = st.text_input("Your Name",
                                       value=st.session_state.get('consumer_info', {}).get('name', ''))
    with col2:
        consumer_state = st.text_input("Your State",
                                        value=st.session_state.get('consumer_info', {}).get('state', ''))

    # Timeline data if available
    timeline_data = st.session_state.get('timeline_entries', [])

    # Generate complaint
    issue, sub_issue = determine_cfpb_issue(flags)
    narrative = generate_complaint_narrative(flags, verified_fields,
                                              {'name': consumer_name, 'state': consumer_state},
                                              timeline_data if len(timeline_data) >= 2 else None)
    resolution = generate_desired_resolution(flags, verified_fields)

    st.markdown("---")
    st.markdown("### Generated Complaint")

    # Issue category
    st.markdown(f"**CFPB Category:** {issue}")
    st.markdown(f"**Sub-category:** {sub_issue}")

    # Narrative
    st.markdown("**Complaint Narrative:**")
    complaint_text = st.text_area("Your complaint (edit as needed):", narrative, height=500, key="cfpb_narrative")

    # Resolution
    st.markdown("**Desired Resolution:**")
    resolution_text = st.text_area("Desired outcome:", resolution, height=200, key="cfpb_resolution")

    # Download options
    st.markdown("---")
    st.markdown("### Save Your Complaint")

    col1, col2 = st.columns(2)
    with col1:
        full_complaint = f"""CFPB COMPLAINT
Generated: {datetime.now().strftime('%Y-%m-%d')}

CATEGORY: {issue}
SUB-CATEGORY: {sub_issue}

{'='*50}
COMPLAINT NARRATIVE:
{'='*50}

{complaint_text}

{'='*50}
DESIRED RESOLUTION:
{'='*50}

{resolution_text}
"""
        st.download_button(
            "Download as Text File",
            full_complaint,
            file_name=f"cfpb_complaint_{datetime.now().strftime('%Y%m%d')}.txt",
            mime="text/plain",
            use_container_width=True
        )

    with col2:
        if st.button("Copy to Clipboard", use_container_width=True):
            st.info("Use Ctrl+A then Ctrl+C in the text boxes above to copy")

    # Instructions
    st.markdown("---")
    st.markdown("### How to File Your CFPB Complaint")

    st.markdown("""
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 10px 0;">
        <h4 style="color: #166534; margin-top: 0;">Step-by-Step Instructions</h4>
        <ol style="color: #334155; line-height: 1.8;">
            <li>Go to <a href="https://www.consumerfinance.gov/complaint/" target="_blank"><strong>consumerfinance.gov/complaint</strong></a></li>
            <li>Select <strong>"Credit reporting or other personal consumer reports"</strong></li>
            <li>Select <strong>"Credit reporting"</strong></li>
            <li>Choose the issue category shown above</li>
            <li>Enter the company name (credit bureau or furnisher)</li>
            <li>Paste your complaint narrative in the description field</li>
            <li>Attach any supporting documents (credit report screenshots, dispute letters)</li>
            <li>Review and submit</li>
        </ol>
        <p style="color: #166534; font-weight: 600; margin-bottom: 0;">
            The company must respond within 15 days. You'll receive updates by email.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Tips
    with st.expander("Tips for Effective CFPB Complaints"):
        st.markdown("""
        **Do:**
        - Be specific about dates and account numbers
        - Include all rule violations detected by this tool
        - Attach copies of your credit report showing the errors
        - Mention any previous dispute attempts
        - State the specific harm you've suffered

        **Don't:**
        - Use emotional language or make threats
        - Include your full Social Security Number
        - Submit duplicate complaints about the same issue
        - Exaggerate or include unverified claims

        **Pro Tips:**
        - File separate complaints for each credit bureau if the same error appears on multiple reports
        - Keep records of all complaint reference numbers
        - Follow up if you don't hear back within 15 days
        - If the response is unsatisfactory, you can dispute it through the CFPB portal
        """)
