import streamlit as st

def inject_custom_css():
    """Inject custom CSS for a clean, professional look."""
    st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* Global Typography & Background */
    .main {
        background-color: #f8fafc;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    h1, h2, h3 {
        color: #1e293b;
        font-weight: 600;
    }

    p {
        color: #475569;
    }

    /* Sidebar - Clean Professional */
    section[data-testid="stSidebar"] {
        background-color: #ffffff;
        border-right: 1px solid #e2e8f0;
    }

    section[data-testid="stSidebar"] .stMarkdown h1,
    section[data-testid="stSidebar"] .stMarkdown h2,
    section[data-testid="stSidebar"] .stMarkdown h3 {
        color: #1e293b;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
    }

    /* Cards */
    .forensic-card {
        background: white;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        margin-bottom: 20px;
    }

    /* Metrics */
    [data-testid="stMetricValue"] {
        font-weight: 600;
        color: #1e40af;
    }

    /* Disclaimer Banner */
    .disclaimer-banner {
        background-color: #fefce8;
        border: 1px solid #fef08a;
        color: #854d0e;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
        font-size: 0.9rem;
        border-left: 4px solid #eab308;
    }

    /* Header Banner */
    .credit-banner {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        border-left: 4px solid #2563eb;
    }

    /* Severity Indicators */
    .severity-high {
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-left: 4px solid #dc2626;
        padding: 16px;
        margin: 12px 0;
        border-radius: 8px;
    }
    .severity-medium {
        background-color: #fffbeb;
        border: 1px solid #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 16px;
        margin: 12px 0;
        border-radius: 8px;
    }
    .severity-low {
        background-color: #f0fdf4;
        border: 1px solid #dcfce7;
        border-left: 4px solid #22c55e;
        padding: 16px;
        margin: 12px 0;
        border-radius: 8px;
    }

    /* Step Headers */
    .step-header {
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 12px;
        margin-bottom: 24px;
    }
    .step-header h2 {
        color: #1e293b;
        font-weight: 600;
        font-size: 1.25rem;
        margin: 0;
    }

    /* Buttons */
    .stButton > button {
        border-radius: 8px !important;
        font-weight: 500 !important;
        padding: 0.5rem 1rem !important;
        transition: all 0.2s ease !important;
    }

    .stButton > button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    /* Primary button */
    .stButton > button[kind="primary"] {
        background-color: #2563eb !important;
        border-color: #2563eb !important;
    }

    .stButton > button[kind="primary"]:hover {
        background-color: #1d4ed8 !important;
    }

    /* Input fields */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea,
    .stSelectbox > div > div {
        border-radius: 8px !important;
        border-color: #e2e8f0 !important;
    }

    .stTextInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1) !important;
    }

    /* File uploader */
    .stFileUploader > div {
        border-radius: 12px;
    }

    /* Expanders */
    .streamlit-expanderHeader {
        font-weight: 500;
        color: #1e293b;
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

def show_disclaimer_banner():
    """Display the disclaimer banner."""
    st.markdown("""
    <div class="disclaimer-banner">
        <strong>Important:</strong> This tool provides information only and is not legal advice.
        Always consult with a qualified attorney for legal matters.
    </div>
    """, unsafe_allow_html=True)

def show_credit_banner():
    """Display the professional header."""
    st.markdown("""
    <div class="credit-banner">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">
                    Credit Report Analysis Tool
                </div>
                <div style="font-size: 0.85rem; color: #1e293b;">
                    Developed by <a href="https://contactmukundthiru-cyber.github.io/Personal-Portfolio/" target="_blank" style="color: #2563eb; text-decoration: none;"><strong>Mukund Thiru</strong></a> · Helping consumers fight credit report errors
                </div>
            </div>
            <div>
                <span style="font-size: 0.7rem; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; color: #64748b;">
                    v1.0.0
                </span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
