"""
Simplified Client Portal Mode
A streamlined interface for consumers to analyze their credit reports

Designed for ease of use with guided steps and plain-language explanations.
"""

import streamlit as st
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path


def render_client_portal(project_root: Path):
    """Render the simplified client portal interface."""

    # Simple header
    st.markdown("""
    <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #3b82f6; margin-bottom: 5px;">Credit Report Analyzer</h1>
        <p style="color: #94a3b8; font-size: 1.1rem;">Find errors on your credit report in minutes</p>
    </div>
    """, unsafe_allow_html=True)

    # Progress indicator
    step = st.session_state.get('portal_step', 1)
    total_steps = 4

    st.progress(step / total_steps)
    st.markdown(f"**Step {step} of {total_steps}**")

    if step == 1:
        render_portal_step_1_upload()
    elif step == 2:
        render_portal_step_2_review()
    elif step == 3:
        render_portal_step_3_results()
    elif step == 4:
        render_portal_step_4_letters()


def render_portal_step_1_upload():
    """Step 1: Upload credit report."""
    st.markdown("### Upload Your Credit Report")

    st.info("""
    **What you need:**
    - A PDF or image of your credit report from Experian, Equifax, or TransUnion
    - You can get free reports at AnnualCreditReport.com
    """)

    uploaded_file = st.file_uploader(
        "Drop your credit report here",
        type=['pdf', 'png', 'jpg', 'jpeg'],
        help="We accept PDF files and images (PNG, JPG)"
    )

    # Alternative: paste text
    with st.expander("Don't have a file? Paste the text instead"):
        pasted_text = st.text_area(
            "Copy and paste your credit report text here",
            height=200,
            placeholder="Paste the text from your credit report..."
        )

    if uploaded_file or pasted_text:
        if st.button("Analyze My Report", type="primary", use_container_width=True):
            with st.spinner("Reading your credit report..."):
                if uploaded_file:
                    from app.extraction import extract_text_from_bytes
                    file_bytes = uploaded_file.read()
                    text, method = extract_text_from_bytes(file_bytes, uploaded_file.name)
                else:
                    text = pasted_text
                    method = "paste"

                if text and len(text) > 50:
                    st.session_state.portal_text = text
                    st.session_state.portal_method = method
                    st.session_state.portal_step = 2
                    st.rerun()
                else:
                    st.error("Could not read your report. Please try a clearer image or PDF.")


def render_portal_step_2_review():
    """Step 2: Review detected account."""
    st.markdown("### We Found an Account")

    text = st.session_state.get('portal_text', '')

    # Parse the report
    from app.parser import parse_credit_report, fields_to_editable_dict

    with st.spinner("Analyzing account details..."):
        parsed = parse_credit_report(text)
        fields = fields_to_editable_dict(parsed)

    st.session_state.portal_fields = fields

    # Show key fields in plain language
    st.markdown("#### Account Information")

    col1, col2 = st.columns(2)

    with col1:
        creditor = fields.get('creditor_name', {}).get('value', 'Unknown')
        st.markdown(f"**Who reported this:** {creditor}")

        balance = fields.get('balance', {}).get('value', 'Not found')
        st.markdown(f"**Balance shown:** {balance}")

        status = fields.get('account_status', {}).get('value', 'Unknown')
        st.markdown(f"**Account status:** {status}")

    with col2:
        dofd = fields.get('date_of_first_delinquency', {}).get('value', 'Not found')
        st.markdown(f"**First missed payment date:** {dofd}")

        dola = fields.get('date_of_last_activity', {}).get('value', 'Not found')
        st.markdown(f"**Last activity date:** {dola}")

        opened = fields.get('date_opened', {}).get('value', 'Not found')
        st.markdown(f"**Account opened:** {opened}")

    st.markdown("---")

    # Quick verification questions
    st.markdown("#### Quick Questions")
    st.markdown("*Help us understand if there are errors*")

    recognize = st.radio(
        "Do you recognize this account?",
        ["Yes, it's mine", "Not sure", "No, I don't recognize it"],
        index=1
    )

    if recognize == "No, I don't recognize it":
        st.warning("This could be an error or identity theft. We'll flag this for dispute.")
        st.session_state.portal_flags = st.session_state.get('portal_flags', [])
        st.session_state.portal_flags.append({
            'type': 'not_recognized',
            'severity': 'high',
            'message': 'Consumer does not recognize this account'
        })

    balance_correct = st.radio(
        "Is the balance amount correct?",
        ["Yes", "Not sure", "No, it's wrong"],
        index=1
    )

    if balance_correct == "No, it's wrong":
        correct_balance = st.text_input("What should the balance be?", placeholder="$0.00")
        st.session_state.portal_flags = st.session_state.get('portal_flags', [])
        st.session_state.portal_flags.append({
            'type': 'wrong_balance',
            'severity': 'medium',
            'message': f'Balance disputed. Consumer states correct amount is {correct_balance}'
        })

    st.markdown("---")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("Back", use_container_width=True):
            st.session_state.portal_step = 1
            st.rerun()
    with col2:
        if st.button("Check for Errors", type="primary", use_container_width=True):
            st.session_state.portal_step = 3
            st.rerun()


def render_portal_step_3_results():
    """Step 3: Show analysis results."""
    st.markdown("### Analysis Results")

    fields = st.session_state.get('portal_fields', {})
    user_flags = st.session_state.get('portal_flags', [])

    # Run the rule engine
    from app.rules import run_rules

    verified_fields = {k: v.get('value') for k, v in fields.items()}
    system_flags = run_rules(verified_fields)

    # Convert flags to list format
    all_flags = user_flags.copy()
    for flag in system_flags:
        if hasattr(flag, 'to_dict'):
            all_flags.append(flag.to_dict())
        else:
            all_flags.append(flag)

    st.session_state.portal_all_flags = all_flags

    if all_flags:
        st.error(f"We found {len(all_flags)} potential issue(s) with this account!")

        st.markdown("#### Issues Found")

        for i, flag in enumerate(all_flags, 1):
            severity = flag.get('severity', 'medium')

            if severity == 'high':
                icon = "🔴"
                color = "#fee2e2"
            elif severity == 'medium':
                icon = "🟡"
                color = "#fef3c7"
            else:
                icon = "🟢"
                color = "#d1fae5"

            # Plain language explanation
            rule_name = flag.get('rule_name', flag.get('type', 'Issue'))
            explanation = flag.get('explanation', flag.get('message', ''))

            # Simplify technical terms
            simple_explanation = simplify_explanation(rule_name, explanation)

            st.markdown(f"""
            <div style="background: {color}; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                <p style="margin: 0; font-weight: bold;">{icon} Issue #{i}: {simple_explanation['title']}</p>
                <p style="margin: 5px 0 0 0; color: #374151;">{simple_explanation['description']}</p>
            </div>
            """, unsafe_allow_html=True)

        st.success("Good news: These issues can likely be disputed!")

    else:
        st.success("No obvious errors detected!")
        st.markdown("""
        While our automated check didn't find issues, you may still want to:
        - Verify all dates are accurate
        - Confirm the balance is correct
        - Check that this is actually your account
        """)

    st.markdown("---")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("Back", use_container_width=True):
            st.session_state.portal_step = 2
            st.rerun()
    with col2:
        if all_flags:
            if st.button("Create Dispute Letters", type="primary", use_container_width=True):
                st.session_state.portal_step = 4
                st.rerun()


def render_portal_step_4_letters():
    """Step 4: Generate dispute letters."""
    st.markdown("### Your Dispute Letters")

    st.info("""
    **What happens next:**
    1. Download your dispute letters below
    2. Print and sign them
    3. Mail them via certified mail (keep the receipt!)
    4. The bureaus have 30 days to investigate
    """)

    fields = st.session_state.get('portal_fields', {})
    flags = st.session_state.get('portal_all_flags', [])

    # Collect user info for letters
    st.markdown("#### Your Information")
    st.markdown("*We need this to fill out your letters*")

    col1, col2 = st.columns(2)
    with col1:
        name = st.text_input("Your Full Name", placeholder="John Smith")
        address = st.text_input("Street Address", placeholder="123 Main St")
    with col2:
        city_state_zip = st.text_input("City, State ZIP", placeholder="New York, NY 10001")
        ssn_last4 = st.text_input("Last 4 of SSN (optional)", placeholder="1234", max_chars=4)

    # Bureau selection
    st.markdown("#### Which bureau reported this?")
    bureaus = st.multiselect(
        "Select all that apply",
        ["Experian", "Equifax", "TransUnion"],
        default=["Experian", "Equifax", "TransUnion"]
    )

    if name and address and city_state_zip and bureaus:
        if st.button("Generate My Letters", type="primary", use_container_width=True):
            with st.spinner("Creating your letters..."):
                # Generate letters
                from app.generator import generate_dispute_packet

                consumer_info = {
                    'name': name,
                    'address': f"{address}\n{city_state_zip}",
                    'ssn_last4': ssn_last4
                }

                # Store in session for generator
                st.session_state.consumer_info = consumer_info

                # Create simple flag structure for generator
                verified_fields = {k: v.get('value') for k, v in fields.items()}

                try:
                    result = generate_dispute_packet(
                        verified_fields=verified_fields,
                        flags=flags,
                        consumer_info=consumer_info
                    )

                    st.success("Your letters are ready!")

                    # Download buttons
                    st.markdown("#### Download Your Letters")

                    if result.get('generated_files'):
                        for filename, filepath in result['generated_files'].items():
                            file_path = Path(filepath)
                            if file_path.exists():
                                with open(file_path, 'r') as f:
                                    content = f.read()
                                st.download_button(
                                    f"Download: {filename}",
                                    data=content,
                                    file_name=filename,
                                    mime="text/markdown",
                                    use_container_width=True
                                )

                    # Instructions
                    st.markdown("---")
                    st.markdown("#### Next Steps")
                    st.markdown("""
                    1. **Download** all letters above
                    2. **Open** them in Word or Google Docs
                    3. **Review** and make any needed changes
                    4. **Print** and sign each letter
                    5. **Mail** via certified mail (USPS) to each bureau
                    6. **Keep** copies and certified mail receipts

                    **Important:** The bureaus have 30 days to respond. If they don't,
                    the item must be removed from your report.
                    """)

                except Exception as e:
                    st.error(f"Error generating letters: {str(e)}")
                    st.markdown("Please try again or contact support.")

    st.markdown("---")
    if st.button("Start Over", use_container_width=True):
        # Clear portal session state
        for key in list(st.session_state.keys()):
            if key.startswith('portal_'):
                del st.session_state[key]
        st.session_state.portal_step = 1
        st.rerun()


def simplify_explanation(rule_name: str, explanation: str) -> Dict[str, str]:
    """Convert technical explanations to plain language."""

    simplifications = {
        'date_reaging': {
            'title': 'Date Manipulation Detected',
            'description': 'The dates on this account appear to have been changed to keep it on your report longer. This is illegal under federal law.'
        },
        'sol_violation': {
            'title': 'Too Old to Collect',
            'description': 'This debt may be past the legal time limit for collection in your state. Collectors may not be able to sue you for this debt.'
        },
        'reporting_period': {
            'title': 'Should Be Removed',
            'description': 'This account has been on your report for more than 7 years and should be removed automatically.'
        },
        'balance_inconsistency': {
            'title': 'Balance Doesn\'t Add Up',
            'description': 'The numbers on this account don\'t match up correctly. The balance or payment history may be wrong.'
        },
        'missing_info': {
            'title': 'Missing Required Information',
            'description': 'This account is missing information that is required by law. The creditor may not have properly validated this debt.'
        },
        'duplicate': {
            'title': 'Possible Duplicate Account',
            'description': 'This debt may be reported more than once, which is unfair to you and against the rules.'
        },
        'not_recognized': {
            'title': 'Unrecognized Account',
            'description': 'You indicated you don\'t recognize this account. This could be an error or a sign of identity theft.'
        },
        'wrong_balance': {
            'title': 'Disputed Balance Amount',
            'description': 'You indicated the balance shown is incorrect.'
        }
    }

    # Try to match rule name
    rule_lower = rule_name.lower().replace(' ', '_').replace('-', '_')

    for key, value in simplifications.items():
        if key in rule_lower:
            return value

    # Default
    return {
        'title': rule_name.replace('_', ' ').title(),
        'description': explanation or 'This item may contain an error that can be disputed.'
    }


def inject_portal_css():
    """Inject simplified CSS for client portal."""
    st.markdown("""
    <style>
    /* Simplified, friendly styling for client portal */

    .stApp {
        max-width: 800px;
        margin: 0 auto;
    }

    /* Larger, friendlier text */
    .stMarkdown p {
        font-size: 1.1rem;
        line-height: 1.6;
    }

    /* Bigger buttons */
    .stButton > button {
        padding: 15px 30px;
        font-size: 1.1rem;
        border-radius: 8px;
    }

    /* Friendly info boxes */
    .stInfo, .stSuccess, .stWarning, .stError {
        border-radius: 10px;
        padding: 20px;
    }

    /* Hide technical elements */
    .stDeployButton, footer, #MainMenu {
        display: none;
    }

    /* Friendly file uploader */
    .stFileUploader > div {
        border: 2px dashed #3b82f6;
        border-radius: 12px;
        padding: 30px;
        text-align: center;
    }

    </style>
    """, unsafe_allow_html=True)
