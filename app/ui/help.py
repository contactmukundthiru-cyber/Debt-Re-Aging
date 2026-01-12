import streamlit as st
import sys
from app.rules import RULE_DEFINITIONS

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

    Process a handful of real cases to evaluate:
    - Extraction accuracy
    - Usefulness of automated flags
    - Time saved in letter generation

    ### Step 4: Feedback & Integration

    If the tool provides value, consider:
    - Integrating it into your client intake process
    - Customizing the dispute letter templates
    - Sharing feedback with the developers
    """)
