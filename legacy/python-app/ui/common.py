"""
Common UI styling and utility components.
Defines the visual theme and shared layout elements like banners and cards.
"""
import streamlit as st

def inject_custom_css():
    """Inject custom CSS for a premium, minimalist legal-tech aesthetic."""
    from app.accessibility import get_accessibility_css, AccessibilityConfig
    
    # Get accessibility config from session state
    config = st.session_state.get('accessibility_config', AccessibilityConfig())
    acc_css = get_accessibility_css(config)
    
    st.markdown(acc_css, unsafe_allow_html=True)
    
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

    /* ========== PURPOSEFUL MICRO-INTERACTIONS ========== */

    /* Smooth page transitions */
    .main .block-container {
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Card hover lift effect - subtle depth change */
    .premium-card, .forensic-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .premium-card:hover, .forensic-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* Severity cards pulse animation for attention */
    .severity-high {
        animation: subtlePulse 2s ease-in-out infinite;
    }

    @keyframes subtlePulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        50% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1); }
    }

    /* Progress indicator transitions */
    [data-testid="stProgress"] > div > div {
        transition: width 0.4s ease-out;
    }

    /* Expander smooth open/close */
    [data-testid="stExpander"] {
        transition: all 0.2s ease;
    }

    [data-testid="stExpander"]:hover {
        background-color: #f8fafc;
        border-radius: 8px;
    }

    /* Radio button selection feedback */
    [data-testid="stRadio"] label {
        transition: background-color 0.15s ease, border-color 0.15s ease;
        border-radius: 6px;
        padding: 4px 8px;
        margin: 2px 0;
    }

    [data-testid="stRadio"] label:hover {
        background-color: #f1f5f9;
    }

    /* Download button special styling */
    .stDownloadButton > button {
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%) !important;
        color: white !important;
        border: none !important;
        transition: all 0.2s ease !important;
    }

    .stDownloadButton > button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
    }

    /* Success message animation */
    .stSuccess {
        animation: slideInRight 0.3s ease-out;
    }

    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
    }

    /* Loading spinner enhancement */
    .stSpinner > div {
        border-color: #3b82f6 transparent transparent transparent !important;
    }

    /* Tab selection indicator */
    .stTabs [data-baseweb="tab"] {
        transition: all 0.15s ease;
    }

    .stTabs [data-baseweb="tab"]:hover {
        background-color: #f1f5f9;
    }

    .stTabs [aria-selected="true"] {
        border-bottom: 2px solid #2563eb !important;
    }

    /* File uploader drop zone */
    [data-testid="stFileUploader"] {
        transition: border-color 0.2s ease, background-color 0.2s ease;
    }

    [data-testid="stFileUploader"]:hover {
        border-color: #3b82f6 !important;
        background-color: #eff6ff !important;
    }

    /* Selectbox dropdown animation */
    [data-baseweb="select"] {
        transition: border-color 0.15s ease;
    }

    [data-baseweb="select"]:focus-within {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }

    /* Risk score number animation */
    .risk-score-value {
        transition: transform 0.3s ease;
    }

    .risk-score-value:hover {
        transform: scale(1.05);
    }

    /* Reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
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
    """Display the forensic lab/attribution header with high-end typography."""
    st.markdown("""
    <div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #2563eb; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.1em; text-transform: uppercase;">
                Forensic Analysis System
            </div>
            <h1 style="margin: 0; font-size: 1.75rem; letter-spacing: -0.03em;">Credit Report Analyzer</h1>
        </div>
        <div style="text-align: right;">
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: #94a3b8; margin-bottom: 2px;">
                STABLE_BUILD: v2.5.1
            </div>
            <div style="font-size: 0.75rem; color: #475569; font-weight: 500;">
                <a href="https://contactmukundthiru-cyber.github.io/Personal-Portfolio/" target="_blank" style="color: inherit; text-decoration: none;">Developed by Mukund Thiru</a>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
