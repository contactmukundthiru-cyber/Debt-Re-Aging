"""
Debt Re-Aging Case Factory
Timeline Inconsistency Detection + Dispute Packet Generator

Built by Mukund Thiru — student-led research & systems project.
"""

import streamlit as st
import sys
from pathlib import Path
from datetime import datetime

# Add project root to path
# Path(__file__).parent.parent is c:\Debt Re-aging
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from app.utils import cleanup_old_cases
from app.ui import (
    inject_custom_css, show_disclaimer_banner, show_credit_banner,
    render_sidebar, render_step_1_upload, render_step_2_review,
    render_step_3_verify, render_step_4_checks, render_step_5_generate,
    render_cross_bureau_analysis, render_batch_mode, render_historical_delta_analysis,
    render_metrics_dashboard, render_help_about, render_rules_documentation,
    render_pilot_guide, render_about_website, render_timeline_visualization
)
from app.settings import render_settings_page
from app.case_manager import render_case_manager_ui
from app.i18n import get_translations
from app.settings import SettingsManager
from app.deadlines import render_deadline_dashboard
from app.analytics import render_analytics_dashboard
from app.multi_account import render_multi_account_ui
from app.client_portal import render_client_portal, inject_portal_css
from app.error_handler import ErrorBoundary
from app.cfpb_complaint import render_cfpb_generator
from app.evidence_builder import render_evidence_builder
from app.accessibility import render_accessibility_settings

# Page configuration
st.set_page_config(
    page_title="Credit Report Analyzer",
    page_icon="📋",
    layout="wide",
    initial_sidebar_state="expanded"
)

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
        'privacy_mode': False,
        'consumer_info': {'name': '', 'address': '', 'state': ''},
        'processing_start_time': None
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

def main():
    """Main application entry point."""
    initialize_session_state()
    inject_custom_css()

    # Handle Case Loading from Case Manager
    if 'load_case_id' in st.session_state and st.session_state.load_case_id:
        from app.case_manager import CaseManager, load_case_to_session
        manager = CaseManager()
        case_data = manager.get_case(st.session_state.load_case_id)
        if case_data:
            load_case_to_session(case_data)
            st.session_state.load_case_id = None
            st.success(f"Successfully loaded case {st.session_state.get('case_id')}")
            st.rerun()

    # Cleanup old cases periodically (24h retention)

    output_dir = project_root / 'output'
    cleanup_old_cases(str(output_dir))

    # Render sidebar and get selected tab
    selected_tab = render_sidebar(project_root)
    
    app_mode = st.session_state.get('app_mode', 'Single Case')

    # Main content area
    show_credit_banner()
    show_disclaimer_banner()

    # Get translations
    settings_mgr = SettingsManager()
    t = get_translations(settings_mgr.settings.language)

    if selected_tab == "About & Website":
        render_about_website()
    elif selected_tab == "Help / About":
        render_help_about()
    elif selected_tab == "Rules Documentation":
        render_rules_documentation()
    elif selected_tab == "Pilot Guide":
        render_pilot_guide()
    elif app_mode == t.nav_batch_mode or app_mode == "Batch Mode (Alpha)":
        render_batch_mode()
    elif app_mode == t.nav_cross_bureau or app_mode == "Cross-Bureau Analysis":
        render_cross_bureau_analysis()
    elif app_mode == "Historical Delta Analysis":
        render_historical_delta_analysis()
    elif app_mode == "Timeline Visualization":
        render_timeline_visualization()
    elif app_mode == t.nav_metrics or app_mode == "Metrics Dashboard":
        render_metrics_dashboard()
    elif app_mode == t.nav_settings or app_mode == "Settings":
        render_settings_page(st)
    elif app_mode == "Case Manager":
        render_case_manager_ui(st)
    elif app_mode == "Deadline Tracker":
        render_deadline_dashboard(st)
    elif app_mode == "Analytics Dashboard":
        render_analytics_dashboard(st)
    elif app_mode == "Furnisher Intelligence":
        from app.furnisher_intel import render_furnisher_intelligence
        render_furnisher_intelligence(st)
    elif app_mode == "CFPB Complaint Generator":
        render_cfpb_generator(st)
    elif app_mode == "Evidence Packet Builder":
        render_evidence_builder(st)
    elif app_mode == "Accessibility":
        render_accessibility_settings(st)
    elif app_mode == "Multi-Account Analysis":
        render_multi_account_ui(st)
    elif app_mode == "Furnisher Compliance":
        from app.ui.furnisher import render_furnisher_mode
        render_furnisher_mode()
    elif app_mode == "Client Portal":
        inject_portal_css()
        render_client_portal(project_root)
    else:
        # Main tool flow
        st.markdown("""
        <div style="margin-bottom: 25px;">
            <h1 style="color: #1e40af; margin-bottom: 5px;">Credit Report Analysis</h1>
            <p style="color: #64748b; font-size: 1rem; margin: 0;">
                Find errors and generate dispute letters
            </p>
        </div>
        """, unsafe_allow_html=True)

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
