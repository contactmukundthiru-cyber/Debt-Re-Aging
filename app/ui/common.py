import streamlit as st

def inject_custom_css():
    """Inject custom CSS for a premium, minimalist legal-tech aesthetic."""
    st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    /* Global Foundation */
    .main {
        background-color: #ffffff;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #1e293b;
    }
    
    h1, h2, h3 {
        font-family: 'Inter', sans-serif;
        color: #0f172a;
        letter-spacing: -0.02em;
    }
    
    h1 { font-weight: 800; font-size: 2.25rem; margin-bottom: 0.5rem; }
    h2 { font-weight: 700; font-size: 1.5rem; margin-top: 2rem; }
    h3 { font-weight: 600; font-size: 1.1rem; margin-top: 1.5rem; }

    p { color: #475569; line-height: 1.6; }

    /* Sidebar - Purposeful Minimalism */
    section[data-testid="stSidebar"] {
        background-color: #f8fafc;
        border-right: 1px solid #e2e8f0;
    }
    
    section[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p {
        font-size: 0.9rem;
        color: #475569;
    }

    /* Premium Containers */
    .premium-card {
        background: #ffffff;
        padding: 2rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;
    }

    /* Purposeful Interaction: Buttons */
    .stButton > button {
        border-radius: 6px !important;
        font-weight: 600 !important;
        padding: 0.6rem 1.2rem !important;
        border: 1px solid #e2e8f0 !important;
        background-color: #ffffff !important;
        color: #0f172a !important;
        transition: all 0.2s ease !important;
        text-transform: none !important;
        letter-spacing: normal !important;
    }
    
    .stButton > button:hover {
        border-color: #cbd5e1 !important;
        background-color: #f8fafc !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    }
    
    .stButton > button[kind="primary"] {
        background-color: #0f172a !important;
        color: #ffffff !important;
        border: 1px solid #0f172a !important;
    }
    
    .stButton > button[kind="primary"]:hover {
        background-color: #1e293b !important;
        border-color: #1e293b !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    }

    /* Inputs - Focus & Consistency */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea {
        border-radius: 8px !important;
        border: 1px solid #e2e8f0 !important;
        padding: 0.75rem !important;
        background-color: #ffffff !important;
    }

    .stTextInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
    }

    /* Metric System Styling */
    [data-testid="stMetricValue"] {
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        font-size: 1.8rem !important;
        color: #0f172a;
    }
    
    [data-testid="stMetricLabel"] {
        font-weight: 500;
        text-transform: uppercase;
        font-size: 0.75rem !important;
        letter-spacing: 0.05em;
        color: #64748b;
    }

    /* Severity Indicators */
    .severity-high {
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-left: 4px solid #dc2626;
        padding: 1.5rem;
        margin: 1rem 0;
        border-radius: 8px;
    }
    .severity-medium {
        background-color: #fffbeb;
        border: 1px solid #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 1.5rem;
        margin: 1rem 0;
        border-radius: 8px;
    }
    .severity-low {
        background-color: #f0fdf4;
        border: 1px solid #dcfce7;
        border-left: 4px solid #22c55e;
        padding: 1.5rem;
        margin: 1rem 0;
        border-radius: 8px;
    }

    /* Step Navigation Pills */
    .nav-step {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background-color 0.2s;
    }
    .nav-step-active {
        background-color: #eff6ff;
        color: #2563eb;
        font-weight: 600;
        border: 1px solid #dbeafe;
    }
    .nav-step-pending { color: #64748b; }
    .nav-step-complete { color: #059669; }

    /* Timeline Visualization */
    .timeline-container {
        padding: 40px 20px;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px dashed #cbd5e1;
        margin: 24px 0;
    }

    /* Additional Premium Classes */
    .section-header {
        font-size: 0.75rem;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.1em;
        margin-bottom: 0.5rem;
    }

    .notice-banner {
        background: #f1f5f9;
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        font-size: 0.85rem;
        color: #475569;
    }

    .forensic-card {
        background: #ffffff;
        padding: 1.5rem;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        margin-bottom: 1rem;
    }

    /* Disclaimer Banner */
    .disclaimer-banner {
        background-color: #fefce8;
        border: 1px solid #fef08a;
        color: #854d0e;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
        border-left: 4px solid #eab308;
    }

    /* Credit Header Banner */
    .credit-banner {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        h1 { font-size: 1.75rem; }
        h2 { font-size: 1.25rem; }
        .premium-card, .forensic-card { padding: 1rem; }
        .stButton > button { width: 100% !important; }
    }

    /* Print Styles */
    @media print {
        section[data-testid="stSidebar"] { display: none !important; }
        .no-print { display: none !important; }
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
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
