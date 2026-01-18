"""
Help, documentation, and about pages UI.
"""
import streamlit as st
import streamlit.components.v1 as components
import sys
from app.rules import RULE_DEFINITIONS


def render_about_website():
    """
    Render the About & Website page with GitHub Pages link.
    
    This page serves as the landing information for the project, linking
    to the public GitHub repository and portfolio of the developer.
    """
    st.markdown("""
    <div style="margin-bottom: 20px;">
        <h1 style="color: #1e40af; margin-bottom: 8px;">Credit Report Analyzer</h1>
        <p style="color: #64748b; font-size: 1.1rem;">
            Free, open-source tool to find errors in credit reports and generate dispute letters
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Quick stats
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Rules", "24+", help="Automated checks for credit report errors")
    col2.metric("States", "50", help="State-specific statute of limitations data")
    col3.metric("Price", "Free", help="100% free and open source")
    col4.metric("Privacy", "100%", help="All data stays on your computer")

    st.markdown("---")

    # Mission statement
    st.markdown("""
    ## The Problem We're Solving

    **Millions of Americans have errors on their credit reports.** These errors can:
    - Lower credit scores by 100+ points
    - Result in denied loans, apartments, and jobs
    - Cost families thousands in higher interest rates

    One of the most insidious practices is **debt re-aging** - when collectors illegally
    manipulate dates to keep negative items on reports longer than the 7 years allowed by law.

    **The challenge:** Identifying these errors requires careful analysis of dates and timelines.
    Legal aid attorneys often don't have time to do this detective work for every client.

    ## Our Solution

    This tool **automates the analysis**. Upload a credit report snippet, and in minutes:

    1. **Extract** all text using OCR (optical character recognition)
    2. **Parse** key dates, balances, and account information
    3. **Analyze** against 24+ rules checking for FCRA violations
    4. **Generate** professional dispute letters ready to send

    ### What Makes This Different

    | Feature | This Tool | Typical Services |
    |---------|-----------|------------------|
    | **Cost** | Free forever | $50-500/month |
    | **Privacy** | 100% local | Upload to cloud |
    | **Transparency** | Open source rules | Black box |
    | **Speed** | Minutes | Days to weeks |
    | **Control** | You own everything | Vendor lock-in |
    """)

    st.markdown("---")

    # Website preview
    st.markdown("## Visit Our Website")

    st.markdown("""
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
            <div style="background: #2563eb; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
                <a href="https://contactmukundthiru-cyber.github.io/Debt-Re-Aging/" target="_blank" style="color: white; text-decoration: none;">
                    Open Website in New Tab
                </a>
            </div>
            <div style="color: #64748b; font-size: 0.9rem;">
                Full documentation, installation guides, and more
            </div>
        </div>
        <div style="color: #1e293b; font-size: 0.95rem;">
            <strong>Website includes:</strong>
            <ul style="margin-top: 8px; padding-left: 20px;">
                <li>Step-by-step installation guide</li>
                <li>How the tool works (with examples)</li>
                <li>All 24 rules explained</li>
                <li>FAQ and troubleshooting</li>
                <li>Organization pilot program info</li>
            </ul>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Embed the website
    st.markdown("### Website Preview")
    try:
        components.iframe(
            "https://contactmukundthiru-cyber.github.io/Debt-Re-Aging/",
            height=600,
            scrolling=True
        )
    except Exception:
        st.info("Website preview unavailable. Click the link above to visit the full site.")

    st.markdown("---")

    # Who built this
    st.markdown("""
    ## About the Developer

    This tool was built by **[Mukund Thiru](https://contactmukundthiru-cyber.github.io/Personal-Portfolio/)**,
    a student researcher focused on using technology to protect consumers from credit reporting abuses.

    ### Why I Built This

    > "I started researching credit reporting after learning that **1 in 5 consumers** have errors
    > on their credit reports, yet the dispute process is so complex that most people give up.
    > Legal aid organizations want to help, but they're overwhelmed.
    >
    > This tool is my attempt to democratize access to credit report analysis. If a computer
    > can check dates and flag inconsistencies, attorneys can focus on what they do best -
    > advocating for their clients."

    ### Get Involved

    - **Report bugs:** [GitHub Issues](https://github.com/contactmukundthiru-cyber/Debt-Re-Aging/issues)
    - **Suggest features:** Same link above
    - **Pilot the tool:** Email contactmukundthiru1@gmail.com
    - **Contribute code:** Pull requests welcome!

    ### Contact

    - **Email:** contactmukundthiru1@gmail.com
    - **GitHub:** [github.com/contactmukundthiru-cyber](https://github.com/contactmukundthiru-cyber)
    - **Portfolio:** [contactmukundthiru-cyber.github.io/Personal-Portfolio](https://contactmukundthiru-cyber.github.io/Personal-Portfolio/)
    """)

    st.markdown("---")

    # Technical details
    with st.expander("Technical Details"):
        st.markdown("""
        ### Technology Stack

        - **Frontend:** Streamlit (Python web framework)
        - **OCR:** Tesseract OCR with OpenCV preprocessing
        - **PDF Parsing:** PyMuPDF (fitz)
        - **Rules Engine:** Custom Python with 24+ rule definitions
        - **Templates:** Jinja2 for dispute letter generation

        ### Data Flow

        ```
        Credit Report (PDF/Image)
               ↓
        OCR Text Extraction
               ↓
        Field Parsing (dates, balances, creditors)
               ↓
        Rules Engine (24+ automated checks)
               ↓
        Flag Generation (with severity levels)
               ↓
        Dispute Letter Templates
               ↓
        Exportable Packet (PDF, DOCX, Markdown)
        ```

        ### Privacy Architecture

        - **Zero network calls** after installation
        - **No telemetry or analytics**
        - **All processing happens locally**
        - **Files only saved when you click Export**
        - **No accounts or login required**
        """)


def render_help_about():
    """
    Render the Help/About page.
    
    Provides an educational overview of debt re-aging, the tool's
    functionality, the privacy model, a glossary, and system health checks.
    """
    st.title("Help & About")
    
    help_tab1, help_tab2, help_tab3 = st.tabs(["Overview", "Glossary", "System Health"])
    
    with help_tab1:
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
        """)
        
    with help_tab2:
        from app.glossary import get_glossary_markdown
        st.markdown(get_glossary_markdown())
        
    with help_tab3:
        # System Check
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


def render_rules_documentation():
    """
    Render the rules documentation page.
    
    Dynamically generates documentation for all 24+ rules defined in the
    RuleEngine, showing severity, description, and suggested evidence.
    """
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
    """
    Render the pilot guide page.
    
    Provides instructions for organizations to run a pilot program using
    the tool, including setup, testing with samples, and evaluation.
    """
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
