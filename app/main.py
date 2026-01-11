"""
Debt Re-Aging Case Factory
Timeline Inconsistency Detection + Dispute Packet Generator

A Streamlit application for detecting potential debt re-aging in credit reports
and generating dispute documentation.

Built by Mukund Thiru — student-led research & systems project.
This tool is NOT legal advice.
"""

import streamlit as st
import json
import os
import sys
import html
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.extraction import extract_text_from_bytes, get_extraction_quality_score
from app.parser import parse_credit_report, fields_to_editable_dict
from app.rules import run_rules, get_rule_documentation, RULE_DEFINITIONS
from app.generator import generate_dispute_packet
from app.state_sol import get_all_states
from app.pdf_export import export_packet_to_pdf
from app.metrics import MetricsTracker, create_case_metric
from app.utils import (
    normalize_date, validate_iso_date, confidence_to_color,
    severity_to_emoji, generate_case_id, mask_pii, cleanup_old_cases
)

# Page configuration
st.set_page_config(
    page_title="Debt Re-Aging Case Factory",
    page_icon="📋",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .disclaimer-banner {
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 5px;
        padding: 10px 15px;
        margin-bottom: 20px;
    }
    .credit-banner {
        background-color: #e7f3ff;
        border: 1px solid #0066cc;
        border-radius: 5px;
        padding: 10px 15px;
        margin-bottom: 20px;
        text-align: center;
    }
    .severity-high {
        background-color: #f8d7da;
        border-left: 4px solid #dc3545;
        padding: 10px;
        margin: 10px 0;
    }
    .severity-medium {
        background-color: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 10px;
        margin: 10px 0;
    }
    .severity-low {
        background-color: #d1ecf1;
        border-left: 4px solid #17a2b8;
        padding: 10px;
        margin: 10px 0;
    }
    .step-header {
        background-color: #f8f9fa;
        padding: 10px 15px;
        border-radius: 5px;
        margin-bottom: 15px;
    }
    .confidence-high { color: #28a745; font-weight: bold; }
    .confidence-medium { color: #ffc107; font-weight: bold; }
    .confidence-low { color: #dc3545; font-weight: bold; }
</style>
""", unsafe_allow_html=True)


def show_disclaimer_banner():
    """Display the disclaimer banner."""
    st.markdown("""
    <div class="disclaimer-banner">
        <strong>Important:</strong> This tool is NOT legal advice. It is designed to help
        identify potential timeline inconsistencies in credit reports for informational
        purposes only. Always consult with a qualified attorney for legal matters.
    </div>
    """, unsafe_allow_html=True)


def show_credit_banner():
    """Display the credit/attribution banner."""
    st.markdown("""
    <div class="credit-banner">
        <strong>Built by Mukund Thiru</strong> — student-led research & systems project.<br>
        <small>Independent research on enforcement gaps in credit reporting.</small>
    </div>
    """, unsafe_allow_html=True)


def initialize_session_state():
    """Initialize session state variables."""
    defaults = {
        'current_step': 1,
        'uploaded_file': None,
        'extracted_text': '',
        'extraction_method': '',
        'parsed_fields': None,
        'editable_fields': {},
        'fields_verified': False,
        'rule_flags': [],
        'rules_checked': False,
        'packet_generated': False,
        'packet_result': None,
        'sample_mode': False,
        'consumer_info': {'name': '', 'address': '', 'state': ''},
        'privacy_mode': False,
        'processing_start_time': None
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def load_sample_case(sample_num: int):
    """Load a sample case for demonstration."""
    samples_dir = project_root / 'samples'

    sample_file = samples_dir / f'sample_case_{sample_num}.json'

    if sample_file.exists():
        with open(sample_file, 'r') as f:
            sample_data = json.load(f)

        st.session_state.extracted_text = sample_data.get('raw_text', '')
        st.session_state.extraction_method = 'sample'
        st.session_state.editable_fields = sample_data.get('fields', {})
        st.session_state.current_step = 3
        st.session_state.sample_mode = True

        return True
    return False


def render_sidebar():
    """Render the sidebar with navigation and help."""
    with st.sidebar:
        st.title("Navigation")
        
        # Mode selector
        app_mode = st.radio("Tool Mode:", ["Single Case", "Cross-Bureau Analysis", "Batch Mode (Alpha)", "Metrics Dashboard"], index=0)
        st.session_state['app_mode'] = app_mode
        st.markdown("---")

        # Step indicator
        steps = [
            "1. Upload Document",
            "2. Review Extracted Text",
            "3. Verify Fields",
            "4. Run Checks",
            "5. Generate Packet"
        ]

        for i, step in enumerate(steps, 1):
            if i == st.session_state.current_step:
                st.markdown(f"**→ {step}**")
            elif i < st.session_state.current_step:
                st.markdown(f"✓ {step}")
            else:
                st.markdown(f"○ {step}")

        st.markdown("---")

        # Sample Mode
        st.subheader("Sample Mode")
        st.write("Try with de-identified example cases:")

        col1, col2 = st.columns(2)
        with col1:
            if st.button("Sample 1", use_container_width=True):
                if load_sample_case(1):
                    st.success("Sample 1 loaded!")
                    st.rerun()
        with col2:
            if st.button("Sample 2", use_container_width=True):
                if load_sample_case(2):
                    st.success("Sample 2 loaded!")
                    st.rerun()

        st.markdown("---")

        # Reset button
        if st.button("Start Over", type="secondary", use_container_width=True):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()

        st.markdown("---")

        # Session Persistence
        st.subheader("Case Management")
        
        # Export Case
        if st.session_state.current_step > 1:
            session_data = {
                'extracted_text': st.session_state.extracted_text,
                'editable_fields': st.session_state.editable_fields,
                'consumer_info': st.session_state.consumer_info,
                'current_step': st.session_state.current_step,
                'case_id': st.session_state.packet_result.get('case_id') if st.session_state.packet_result else None
            }
            st.download_button(
                "💾 Export Case (.json)",
                data=json.dumps(session_data, indent=2),
                file_name=f"case_export_{generate_case_id()}.json",
                mime="application/json",
                use_container_width=True
            )
            
        # Import Case
        uploaded_case = st.file_uploader("📂 Import Case", type=['json'], label_visibility="collapsed")
        if uploaded_case:
            try:
                imported_data = json.load(uploaded_case)
                st.session_state.extracted_text = imported_data.get('extracted_text', '')
                st.session_state.editable_fields = imported_data.get('editable_fields', {})
                st.session_state.consumer_info = imported_data.get('consumer_info', {})
                st.session_state.current_step = imported_data.get('current_step', 1)
                st.success("Case imported successfully!")
                st.rerun()
            except Exception as e:
                st.error(f"Error importing case: {e}")

        st.markdown("---")

        # Privacy Settings
        st.subheader("Privacy Settings")
        privacy_on = st.toggle(
            "Privacy Mode",
            value=st.session_state.privacy_mode,
            help="Masks potential PII (Account #, SSN) in the UI preview"
        )
        st.session_state.privacy_mode = privacy_on

        st.markdown("---")

        # Quick links
        st.subheader("Resources")
        tabs = st.radio(
            "View:",
            ["Main Tool", "Help / About", "Rules Documentation", "Pilot Guide"],
            label_visibility="collapsed"
        )

        return tabs


def render_help_about():
    """Render the Help/About page."""
    st.title("Help & About")
    
    # System Check
    with st.expander("🔍 System Health Check"):
        import pytesseract
        import cv2
        import fitz
        
        try:
            pytesseract.get_tesseract_version()
            st.success("Tesseract OCR: Installed")
        except Exception:
            st.error("Tesseract OCR: NOT FOUND (Extraction will fail)")
            
        st.success(f"OpenCV: {cv2.__version__}")
        st.success(f"PyMuPDF: {fitz.version[0]}")
        st.info(f"Python: {sys.version.split()[0]}")

    st.markdown("""
    ## What is Debt Re-Aging?

    **Debt re-aging** is a deceptive practice where the age of a debt is manipulated
    to make it appear more recent than it actually is. This can illegally extend how
    long negative information stays on your credit report.

    ### How It Works

    Under the Fair Credit Reporting Act (FCRA), most negative items must be removed
    from your credit report **7 years from the Date of First Delinquency (DOFD)** -
    the date you first fell behind on payments and never caught up.

    When a debt is sold or transferred to a collection agency, some furnishers
    report a new "date opened" as if the account is new, rather than preserving
    the original DOFD. This "re-ages" the debt, potentially keeping it on your
    report longer than legally allowed.

    ---

    ## What This Tool Does

    This tool helps identify potential debt re-aging by:

    1. **Extracting text** from credit report snippets (PDF or image)
    2. **Parsing key dates** and account information
    3. **Running automated checks** for timeline inconsistencies
    4. **Generating dispute documentation** if issues are found

    ### What This Tool Does NOT Do

    - Provide legal advice
    - Guarantee accuracy of extracted information
    - Submit disputes on your behalf
    - Store or transmit your data anywhere
    - Replace professional legal counsel

    ---

    ## Privacy Model

    This tool is designed to be **completely local and offline**:

    - **No data is sent anywhere** - all processing happens on your computer
    - **No analytics or tracking** - we don't collect any usage data
    - **No storage** - nothing is saved unless you explicitly export
    - **No network calls** - the tool works entirely offline

    Your credit report data stays on your machine at all times.

    ---

    ## How Organizations Can Pilot This Tool

    1. **Download** the tool and run it locally
    2. **Test** with the provided sample cases first
    3. **Process** 5-10 real cases (de-identified if needed)
    4. **Track** time savings and outcomes
    5. **Provide feedback** to help improve the tool

    See the Pilot Guide for detailed instructions.

    ---

    ## Limitations & Disclaimers

    - OCR extraction may not be 100% accurate
    - Automated parsing relies on common patterns and may miss unusual formats
    - Rules are based on general FCRA principles and may not cover all situations
    - State laws may provide additional protections
    - Always verify extracted information before submitting disputes
    - This tool is NOT legal advice

    ---

    ## Credits & Attribution

    This tool was built by **Mukund Thiru**, a high school student, as part of
    an independent research project on enforcement gaps in credit reporting.

    If you use this tool in your work, please cite it appropriately.
    See the README for citation information.
    """)


def render_rules_documentation():
    """Render the rules documentation page."""
    st.title("Rules Documentation")

    st.markdown("""
    This page documents all the automated checks performed by the tool.
    Each rule is designed to detect a specific type of potential timeline
    inconsistency or debt re-aging pattern.
    """)

    for rule_id, rule in RULE_DEFINITIONS.items():
        severity_class = f"severity-{rule['severity']}"
        st.markdown(f"""
        <div class="{severity_class}">
            <h3>Rule {rule_id}: {rule['name']}</h3>
            <p><strong>Severity:</strong> {rule['severity'].upper()}</p>
            <p><strong>Description:</strong> {rule['description']}</p>
            <p><strong>Why This Matters:</strong></p>
            <p>{rule['why_it_matters']}</p>
            <p><strong>Suggested Evidence:</strong></p>
            <ul>
            {"".join(f"<li>{e}</li>" for e in rule['suggested_evidence'])}
            </ul>
        </div>
        """, unsafe_allow_html=True)


def render_pilot_guide():
    """Render the pilot guide page."""
    st.title("Pilot Guide for Organizations")

    st.markdown("""
    ## Getting Started

    This guide helps organizations run a pilot program with the Debt Re-Aging
    Case Factory tool.

    ### Prerequisites

    - Computer with Python 3.8+ OR Docker installed
    - Credit report snippets (PDF or image format)
    - Basic familiarity with credit reports

    ---

    ## Running the Pilot

    ### Step 1: Setup (15-30 minutes)

    Choose your installation method:

    **Option A: Docker (Recommended)**
    ```bash
    docker-compose up
    ```

    **Option B: Python**
    ```bash
    pip install -r requirements.txt
    streamlit run app/main.py
    ```

    ### Step 2: Test with Samples (10 minutes)

    Use the sample cases in the sidebar to familiarize yourself with the tool:
    - Click "Sample 1" or "Sample 2"
    - Walk through each step
    - Generate a test packet

    ### Step 3: Process Real Cases (5-10 cases)
    
    ...
    
    ---

    ## Developer Testing

    If you are a developer or technical user, you can run the automated test suite to verify the tool's logic:

    ```bash
    # Run the test script
    ./run_tests.sh
    ```

    This will run:
    1. **Logic Tests**: Verifies date arithmetic and rule triggering.
    2. **Sample Tests**: Ensures the parser can still handle the built-in sample cases.
    3. **Coverage Report**: Shows which parts of the rule engine are covered by tests.

    ---

    ## Providing Feedback

    After your pilot, please share:

    1. **What worked well?**
    2. **What was confusing or difficult?**
    3. **What features would help your workflow?**
    4. **Any bugs or errors encountered?**
    5. **Would you recommend this tool to peers?**

    Send feedback to: contactmukundthiru1@gmail.com

    ---

    ## Common Issues

    ### OCR Quality Issues
    - Ensure images are clear and well-lit
    - Higher resolution images work better
    - Try different preprocessing if text is garbled

    ### Parsing Misses
    - Credit report formats vary widely
    - Manual field entry is always available
    - Let us know about formats we should support

    ### Rule False Positives
    - Some legitimate scenarios may trigger flags
    - Use judgment when reviewing results
    - Document edge cases for tool improvement

    ---

    ## Support

    - Check the Help/About section for guidance
    - Review the Rules Documentation for flag explanations
    - Contact contactmukundthiru1@gmail.com for assistance
    """)


def render_step_1_upload():
    """Render Step 1: Document Upload."""
    st.markdown('<div class="step-header"><h2>Step 1: Upload Credit Report Snippet</h2></div>',
                unsafe_allow_html=True)

    st.markdown("""
    Upload a PDF or image (PNG, JPG) of the credit report section you want to analyze.

    **Tips for best results:**
    - Upload just the relevant section, not the entire report
    - Ensure the image/PDF is clear and readable
    - Higher resolution images produce better OCR results
    """)

    uploaded_file = st.file_uploader(
        "Choose a file",
        type=['pdf', 'png', 'jpg', 'jpeg'],
        help="Upload a credit report snippet (PDF or image)"
    )

    if uploaded_file is not None:
        st.session_state.uploaded_file = uploaded_file
        st.session_state.processing_start_time = datetime.now()

        with st.spinner("Extracting text from document..."):
            file_bytes = uploaded_file.read()
            extracted_text, method = extract_text_from_bytes(file_bytes, uploaded_file.name)

            if method != "error":
                st.session_state.extracted_text = extracted_text
                st.session_state.extraction_method = method

                quality_score, quality_desc = get_extraction_quality_score(extracted_text)

                st.success(f"Text extracted successfully using {method}!")
                st.info(f"Quality: {quality_score}/100 - {quality_desc}")

                if st.button("Continue to Review", type="primary"):
                    st.session_state.current_step = 2
                    st.rerun()
            else:
                st.error(f"Error extracting text: {extracted_text}")


def render_step_2_review():
    """Render Step 2: Review Extracted Text."""
    st.markdown('<div class="step-header"><h2>Step 2: Review Extracted Text</h2></div>',
                unsafe_allow_html=True)

    st.markdown("""
    Review the text extracted from your document. This is what the parser will use
    to identify key fields.
    """)

    st.info(f"Extraction method: {st.session_state.extraction_method}")

    # Show extracted text in editable area
    display_text = st.session_state.extracted_text
    if st.session_state.privacy_mode:
        display_text = mask_pii(display_text)

    edited_text = st.text_area(
        "Extracted Text (editable)",
        value=display_text,
        height=300,
        help="You can edit this text if the extraction missed or garbled anything"
    )

    if not st.session_state.privacy_mode:
        st.session_state.extracted_text = edited_text
    else:
        st.warning("Note: Edits made in Privacy Mode are not saved to prevent masking errors.")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("← Back to Upload"):
            st.session_state.current_step = 1
            st.rerun()

    with col2:
        if st.button("Continue to Field Extraction →", type="primary"):
            # Parse the text
            with st.spinner("Parsing fields..."):
                parsed = parse_credit_report(st.session_state.extracted_text)
                st.session_state.parsed_fields = parsed
                st.session_state.editable_fields = fields_to_editable_dict(parsed)

            st.session_state.current_step = 3
            st.rerun()


def render_step_3_verify():
    """Render Step 3: Verify & Edit Fields."""
    st.markdown('<div class="step-header"><h2>Step 3: Verify & Edit Extracted Fields</h2></div>',
                unsafe_allow_html=True)

    st.markdown("""
    Review and correct the extracted fields below. All fields must be verified before
    generating a dispute packet.

    **Confidence levels:**
    - <span class="confidence-high">High</span>: Likely accurate
    - <span class="confidence-medium">Medium</span>: Review recommended
    - <span class="confidence-low">Low</span>: Manual entry likely needed
    """, unsafe_allow_html=True)

    fields = st.session_state.editable_fields

    # Field definitions for display
    field_info = {
        'original_creditor': ('Original Creditor', 'The original company you had the account with'),
        'furnisher_or_collector': ('Furnisher/Collector', 'The company reporting this to the credit bureau'),
        'account_type': ('Account Type', 'e.g., collection, charge_off, other'),
        'account_status': ('Account Status', 'e.g., Paid, Settled, Late, Default'),
        'current_balance': ('Current Balance', 'The current balance reported ($)'),
        'date_opened': ('Date Opened', 'Date the account was opened (YYYY-MM-DD)'),
        'date_reported_or_updated': ('Date Reported/Updated', 'When this was last reported (YYYY-MM-DD)'),
        'dofd': ('Date of First Delinquency', 'When you first fell behind (YYYY-MM-DD)'),
        'estimated_removal_date': ('Estimated Removal Date', 'When this should drop off (YYYY-MM-DD)'),
        'bureau': ('Credit Bureau', 'Experian, Equifax, TransUnion, or Unknown')
    }

    # Create two columns for fields
    col1, col2 = st.columns(2)

    field_list = list(field_info.keys())
    for i, field_name in enumerate(field_list):
        label, help_text = field_info[field_name]
        field_data = fields.get(field_name, {'value': '', 'confidence': 'Low', 'source_text': ''})

        # Alternate columns
        with col1 if i % 2 == 0 else col2:
            confidence = field_data.get('confidence', 'Low')
            conf_color = confidence_to_color(confidence)

            st.markdown(f"**{label}** <span style='color:{conf_color}'>({confidence})</span>",
                       unsafe_allow_html=True)

            # Special handling for account type and bureau (dropdowns)
            if field_name == 'account_type':
                options = ['', 'collection', 'charge_off', 'closed', 'open', 'other']
                current = field_data.get('value', '') or ''
                if current not in options:
                    options.append(current)
                new_value = st.selectbox(
                    f"Select {label}",
                    options=options,
                    index=options.index(current) if current in options else 0,
                    label_visibility="collapsed",
                    key=f"field_{field_name}"
                )
            elif field_name == 'bureau':
                options = ['Unknown', 'Experian', 'Equifax', 'TransUnion']
                current = field_data.get('value', 'Unknown') or 'Unknown'
                if current not in options:
                    options.append(current)
                new_value = st.selectbox(
                    f"Select {label}",
                    options=options,
                    index=options.index(current) if current in options else 0,
                    label_visibility="collapsed",
                    key=f"field_{field_name}"
                )
            else:
                new_value = st.text_input(
                    label,
                    value=field_data.get('value', '') or '',
                    help=help_text,
                    label_visibility="collapsed",
                    key=f"field_{field_name}"
                )

            # Show source text if available
            source = field_data.get('source_text', '')
            if source:
                with st.expander("Source text"):
                    st.code(source)

            # Update the field value
            fields[field_name]['value'] = new_value

    st.session_state.editable_fields = fields

    st.markdown("---")

    # Optional consumer info
    st.subheader("Optional: Your Information")
    st.markdown("*Including your state allows for checking the Statute of Limitations.*")

    col1, col2 = st.columns(2)
    with col1:
        st.session_state.consumer_info['name'] = st.text_input(
            "Your Name (optional)",
            value=st.session_state.consumer_info.get('name', '')
        )
        
        states = get_all_states()
        state_options = [""] + sorted(list(states.keys()))
        state_names = {code: f"{code} - {name}" for code, name in states.items()}
        state_names[""] = "Select a State"
        
        selected_state = st.selectbox(
            "Your State (for SOL check)",
            options=state_options,
            format_func=lambda x: state_names[x],
            index=state_options.index(st.session_state.consumer_info.get('state', '')) if st.session_state.consumer_info.get('state', '') in state_options else 0
        )
        st.session_state.consumer_info['state'] = selected_state

    with col2:
        st.session_state.consumer_info['address'] = st.text_area(
            "Your Address (optional)",
            value=st.session_state.consumer_info.get('address', ''),
            height=100
        )

    st.markdown("---")

    # Verification checkbox
    verified = st.checkbox(
        "I have reviewed and verified all fields above",
        value=st.session_state.fields_verified
    )
    st.session_state.fields_verified = verified

    col1, col2 = st.columns(2)

    with col1:
        if st.button("← Back to Review"):
            st.session_state.current_step = 2
            st.rerun()

    with col2:
        if st.button("Run Checks →", type="primary", disabled=not verified):
            st.session_state.current_step = 4
            st.rerun()


def render_step_4_checks():
    """Render Step 4: Run Checks."""
    st.markdown('<div class="step-header"><h2>Step 4: Timeline Consistency Checks</h2></div>',
                unsafe_allow_html=True)

    st.markdown("""
    The tool will now check for potential timeline inconsistencies that may indicate
    debt re-aging or reporting errors.
    """)

    # Prepare fields for rule checking
    verified_fields = {}
    for field_name, field_data in st.session_state.editable_fields.items():
        verified_fields[field_name] = field_data.get('value') or None
    
    # Add state for SOL check
    if st.session_state.consumer_info.get('state'):
        verified_fields['state_code'] = st.session_state.consumer_info['state']

    # Run the checks
    if not st.session_state.rules_checked:
        with st.spinner("Running checks..."):
            flags = run_rules(verified_fields)
            st.session_state.rule_flags = flags
            st.session_state.rules_checked = True

    flags = st.session_state.rule_flags

    # Display results
    if flags:
        st.warning(f"Found {len(flags)} potential issue(s)")

        for flag in flags:
            severity = flag.get('severity', 'medium')
            severity_class = f"severity-{severity}"

            st.markdown(f"""
            <div class="{severity_class}">
                <h4>{severity_to_emoji(severity)} {html.escape(flag.get('rule_name', 'Unknown Rule'))}</h4>
                <p><strong>Rule ID:</strong> {html.escape(flag.get('rule_id', 'N/A'))}</p>
                <p><strong>Finding:</strong> {html.escape(flag.get('explanation', 'No explanation available'))}</p>
            </div>
            """, unsafe_allow_html=True)

            with st.expander("Why this matters & suggested evidence"):
                st.markdown(f"**Why This Matters:**\n\n{flag.get('why_it_matters', '')}")
                st.markdown("**Suggested Evidence:**")
                for evidence in flag.get('suggested_evidence', []):
                    st.markdown(f"- {evidence}")

                st.markdown("**Relevant Field Values:**")
                for k, v in flag.get('field_values', {}).items():
                    st.markdown(f"- {k}: {v}")
    else:
        st.success("No obvious timeline inconsistencies detected!")
        st.info("""
        This does not necessarily mean everything is accurate. The automated checks
        only look for specific patterns. Manual review is always recommended.
        """)

    st.markdown("---")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("← Back to Verify"):
            st.session_state.rules_checked = False
            st.session_state.current_step = 3
            st.rerun()

    with col2:
        if st.button("Generate Dispute Packet →", type="primary"):
            st.session_state.current_step = 5
            st.rerun()


def render_step_5_generate():
    """Render Step 5: Generate & Export Packet."""
    st.markdown('<div class="step-header"><h2>Step 5: Generate & Export Dispute Packet</h2></div>',
                unsafe_allow_html=True)

    st.markdown("""
    Ready to generate your dispute packet. This will create:
    - Case summary file
    - Bureau dispute letter
    - Furnisher dispute letter
    - Attachments checklist
    - Machine-readable data files
    """)

    # Prepare verified fields
    verified_fields = {}
    for field_name, field_data in st.session_state.editable_fields.items():
        verified_fields[field_name] = field_data.get('value') or None

    # Consumer info
    consumer_info = st.session_state.consumer_info
    if not consumer_info.get('name'):
        consumer_info = None

    if not st.session_state.packet_generated:
        if st.button("Generate Packet", type="primary"):
            with st.spinner("Generating dispute packet..."):
                try:
                    result = generate_dispute_packet(
                        verified_fields=verified_fields,
                        flags=st.session_state.rule_flags,
                        consumer_info=consumer_info
                    )

                    st.session_state.packet_result = result
                    st.session_state.packet_generated = True
                    
                    # Generate PDFs if possible
                    try:
                        pdf_results = export_packet_to_pdf(
                            result['generated_files'],
                            result['output_directory'],
                            result['case_id']
                        )
                        result['generated_files'].update(pdf_results)
                    except Exception as e:
                        st.warning(f"Note: PDF generation skipped: {e}")

                    # Record metrics
                    try:
                        tracker = MetricsTracker()
                        quality_score, _ = get_extraction_quality_score(st.session_state.extracted_text)
                        
                        metric = create_case_metric(
                            case_id=result['case_id'],
                            start_time=st.session_state.processing_start_time or datetime.now(),
                            end_time=datetime.now(),
                            original_fields=st.session_state.parsed_fields.to_dict() if st.session_state.parsed_fields else {},
                            edited_fields=st.session_state.editable_fields,
                            flags=st.session_state.rule_flags,
                            extraction_method=st.session_state.extraction_method,
                            extraction_quality=quality_score
                        )
                        tracker.record_case(metric)
                    except Exception as e:
                        st.error(f"Error recording metrics: {e}")

                    st.rerun()
                except Exception as e:
                    st.error(f"Error generating packet: {str(e)}")
    else:
        result = st.session_state.packet_result

        st.success(f"Packet generated successfully! Case ID: {result['case_id']}")

        st.markdown("### Generated Files")

        # Show generated files
        for filename, filepath in result['generated_files'].items():
            icon = "📄"
            if filename.endswith('.pdf'): icon = "📕"
            elif filename.endswith('.html'): icon = "🌐"
            elif filename.endswith('.json'): icon = "🔢"
            elif filename.endswith('.yaml'): icon = "⚙️"
            
            with st.expander(f"{icon} {filename}"):
                try:
                    if filename.endswith('.pdf'):
                        st.info("PDF file generated. Download the full packet to view.")
                    else:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                        st.code(content, language='markdown' if filename.endswith('.md') else 'yaml')
                except Exception as e:
                    st.error(f"Could not read file: {e}")

        st.markdown("### Download")

        # Provide ZIP download
        zip_path = result['zip_path']
        if os.path.exists(zip_path):
            with open(zip_path, 'rb') as f:
                zip_bytes = f.read()

            st.download_button(
                label=f"Download Complete Packet ({result['case_id']}_packet.zip)",
                data=zip_bytes,
                file_name=f"{result['case_id']}_packet.zip",
                mime="application/zip"
            )

        st.info(f"Files also saved to: {result['output_directory']}")

    st.markdown("---")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("← Back to Checks"):
            st.session_state.current_step = 4
            st.rerun()

    with col2:
        if st.button("Start New Case"):
            # Reset for new case
            for key in ['uploaded_file', 'extracted_text', 'extraction_method',
                       'parsed_fields', 'editable_fields', 'fields_verified',
                       'rule_flags', 'rules_checked', 'packet_generated',
                       'packet_result', 'sample_mode']:
                if key in st.session_state:
                    if key == 'editable_fields':
                        st.session_state[key] = {}
                    elif key == 'rule_flags':
                        st.session_state[key] = []
                    elif key in ['fields_verified', 'rules_checked', 'packet_generated', 'sample_mode']:
                        st.session_state[key] = False
                    else:
                        st.session_state[key] = None if key != 'extracted_text' else ''

            st.session_state.current_step = 1
            st.rerun()


def render_cross_bureau_analysis():
    """Render the Cross-Bureau Analysis UI."""
    st.title("Cross-Bureau Comparison")
    st.markdown("""
    Use this tool to compare how the **same account** is reported across different credit bureaus.
    Inconsistencies in removal dates or DOFD across bureaus often indicate reporting errors.
    """)
    
    from app.rules import RuleEngine
    engine = RuleEngine()
    
    col1, col2, col3 = st.columns(3)
    bureaus = ['Experian', 'Equifax', 'TransUnion']
    bureau_data = []
    
    for i, bureau in enumerate(bureaus):
        with [col1, col2, col3][i]:
            st.subheader(bureau)
            removal = st.text_input(f"Removal Date ({bureau})", key=f"cb_rem_{bureau}", placeholder="YYYY-MM-DD")
            dofd = st.text_input(f"DOFD ({bureau})", key=f"cb_dofd_{bureau}", placeholder="YYYY-MM-DD")
            
            if removal:
                bureau_data.append({
                    'bureau': bureau,
                    'estimated_removal_date': removal,
                    'dofd': dofd
                })
                
    if len(bureau_data) >= 2:
        if st.button("Analyze Discrepancies", type="primary"):
            flags = engine.check_cross_bureau(bureau_data)
            
            if flags:
                st.warning(f"Found {len(flags)} cross-bureau inconsistency!")
                for flag in flags:
                    st.error(f"**{flag.rule_name}**")
                    st.write(flag.explanation)
            else:
                st.success("No material discrepancies found between the provided bureau dates.")

def render_metrics_dashboard():
    """Render the Metrics Dashboard UI."""
    st.title("Usage Metrics Dashboard")
    st.info("Aggregate statistics from locally processed cases. No data is sent to any server.")
    
    tracker = MetricsTracker()
    summary = tracker.get_summary()
    
    if not summary:
        st.warning("No cases recorded yet. Process some cases to see metrics here.")
        return
        
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Cases", summary['total_cases'])
    col2.metric("Flag Rate", f"{summary['flag_rate_percent']:.1f}%")
    col3.metric("Avg Quality", f"{summary['avg_extraction_quality']:.1f}/100")
    
    # Flags distribution
    st.subheader("Flags by Rule ID")
    dist = summary['flag_distribution']
    if dist:
        import pandas as pd
        df = pd.DataFrame(list(dist.items()), columns=['Rule ID', 'Count'])
        st.bar_chart(df.set_index('Rule ID'))
    
    # Recent cases table
    st.subheader("Recent Cases")
    recent = tracker.get_recent_cases(10)
    if recent:
        import pandas as pd
        df_recent = pd.DataFrame(recent)
        # Select and reorder columns for display
        cols = ['case_id', 'timestamp', 'bureau', 'account_type', 'flags_identified', 'extraction_quality']
        st.dataframe(df_recent[cols])
        
        if st.button("Export to CSV"):
            csv_path = tracker.export_csv()
            with open(csv_path, 'rb') as f:
                st.download_button(
                    "Download CSV",
                    f,
                    file_name="debt_reaging_metrics.csv",
                    mime="text/csv"
                )

def render_batch_mode():
    """Render the experimental Batch Mode UI."""
    st.title("Batch Processing Mode (Alpha)")
    st.info("This mode allows processing multiple accounts or documents simultaneously.")
    
    from app.batch import process_multiple_files
    
    uploaded_files = st.file_uploader(
        "Upload one or more credit report snippets",
        type=['pdf', 'png', 'jpg', 'jpeg'],
        accept_multiple_files=True
    )
    
    if uploaded_files:
        if st.button("Process Batch", type="primary"):
            file_data = []
            for f in uploaded_files:
                file_data.append((f.name, f.read()))
                
            with st.spinner("Processing batch..."):
                results = process_multiple_files(file_data)
                
            st.success(f"Processed {results.total_accounts} accounts!")
            
            # Show summary
            col1, col2, col3 = st.columns(3)
            col1.metric("Total Accounts", results.total_accounts)
            col2.metric("Flagged Accounts", results.accounts_with_flags)
            col3.metric("Total Flags", results.total_flags)
            
            # Show detailed findings
            for acc in results.accounts:
                with st.expander(f"Account: {acc.account_id} - {len(acc.flags)} flags"):
                    if acc.flags:
                        for flag in acc.flags:
                            st.warning(f"{flag['rule_name']} ({flag['severity']})")
                    else:
                        st.success("No issues detected.")
            
            st.warning("Note: Full packet generation for Batch Mode is under development.")

def main():
    """Main application entry point."""
    initialize_session_state()

    # Cleanup old cases periodically (24h retention)
    output_dir = project_root / 'output'
    cleanup_old_cases(str(output_dir))

    # Render sidebar and get selected tab
    selected_tab = render_sidebar()
    
    app_mode = st.session_state.get('app_mode', 'Single Case')

    # Main content area
    show_credit_banner()
    show_disclaimer_banner()

    if selected_tab == "Help / About":
        render_help_about()
    elif selected_tab == "Rules Documentation":
        render_rules_documentation()
    elif selected_tab == "Pilot Guide":
        render_pilot_guide()
    elif app_mode == "Batch Mode (Alpha)":
        render_batch_mode()
    elif app_mode == "Cross-Bureau Analysis":
        render_cross_bureau_analysis()
    elif app_mode == "Metrics Dashboard":
        render_metrics_dashboard()
    else:
        # Main tool flow
        st.title("Debt Re-Aging Case Factory")
        st.markdown("*Timeline Inconsistency Detection + Dispute Packet Generator*")

        # Render current step
        step = st.session_state.current_step

        if step == 1:
            render_step_1_upload()
        elif step == 2:
            render_step_2_review()
        elif step == 3:
            render_step_3_verify()
        elif step == 4:
            render_step_4_checks()
        elif step == 5:
            render_step_5_generate()


if __name__ == "__main__":
    main()
