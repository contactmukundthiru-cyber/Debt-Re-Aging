"""
Sidebar navigation and global app state controls.
"""
import streamlit as st
import json
from pathlib import Path
from app.i18n import SUPPORTED_LANGUAGES, get_translations
from app.settings import SettingsManager
from app.case_manager import CaseManager, load_case_to_session

def load_sample_case(sample_num: int, project_root: Path):
    """
    Load a sample case for demonstration.
    
    Reads a JSON file from the samples directory and populates the
    session state with extracted text and fields to showcase the tool.
    """
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

def render_sidebar(project_root: Path):
    """
    Render the sidebar with navigation and help.
    
    Provides global controls including language selection, application mode
    switching (Single Case, Batch, etc.), and access to legal action tools.
    """
    with st.sidebar:
        # Clean header
        st.markdown("""
        <div style="text-align: center; padding: 15px 0 20px 0; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 1.2rem; font-weight: 700; color: #1e40af; margin-bottom: 4px;">
                Credit Report Analyzer
            </div>
            <div style="font-size: 0.75rem; color: #64748b;">
                Find errors. Generate dispute letters.
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("")

        # Language selector
        settings_mgr = SettingsManager()
        current_lang = settings_mgr.settings.language

        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            lang_options = {"English": "en", "Espanol": "es"}
            selected_lang = st.selectbox(
                "Language",
                options=list(lang_options.keys()),
                index=0 if current_lang == "en" else 1,
                label_visibility="collapsed"
            )
            if lang_options[selected_lang] != current_lang:
                settings_mgr.update(language=lang_options[selected_lang])
                st.rerun()

        st.markdown("---")

        # Main mode selector
        t = get_translations(current_lang)

        st.markdown("""
        <div style="font-size: 0.85rem; color: #1e293b; font-weight: 600; margin-bottom: 12px;">
            What do you need to do?
        </div>
        """, unsafe_allow_html=True)

        # Primary actions - clearer options
        mode_options = {
            "Check One Report": t.nav_single_case,
            "Compare Reports Over Time": "Historical Delta Analysis",
            "Build a Timeline (3+ Reports)": "Timeline Visualization",
            "Compare Different Bureaus": t.nav_cross_bureau,
            "Analyze Full Report (All Accounts)": "Multi-Account Analysis",
        }

        selected_display = st.radio(
            "Select what to do:",
            list(mode_options.keys()),
            index=0,
            label_visibility="collapsed",
            key="main_mode_selector"
        )
        st.session_state['app_mode'] = mode_options[selected_display]

        # Info box for "Compare Over Time" option
        if "Over Time" in selected_display:
            st.markdown("""
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-top: 10px; font-size: 0.8rem;">
                <div style="color: #1e40af; font-weight: 600; margin-bottom: 6px;">
                    What to upload:
                </div>
                <div style="color: #334155; line-height: 1.5;">
                    Upload the <strong>same account</strong> from credit reports pulled at different times.
                    <br><br>
                    <strong>Example:</strong>
                    <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                        <li>Report from 6 months ago</li>
                        <li>Report from today</li>
                    </ul>
                    <div style="margin-top: 8px; color: #64748b; font-size: 0.75rem;">
                        If dates changed between reports, that's evidence of manipulation.
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)

        # Info box for "Build a Timeline" option
        if "Timeline" in selected_display:
            st.markdown("""
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 10px; font-size: 0.8rem;">
                <div style="color: #166534; font-weight: 600; margin-bottom: 6px;">
                    Build visual proof of re-aging:
                </div>
                <div style="color: #334155; line-height: 1.5;">
                    Enter dates from <strong>3 or more reports</strong> over time to create a visual timeline.
                    <br><br>
                    <strong>Perfect for:</strong>
                    <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                        <li>Showing how DOFD changed</li>
                        <li>Documenting for attorneys</li>
                        <li>CFPB complaint evidence</li>
                    </ul>
                </div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")

        # Legal Action Tools - Most important for users
        with st.expander("Legal Action Tools", expanded=False):
            st.markdown("""
            <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 8px;">
                Generate official documents
            </div>
            """, unsafe_allow_html=True)

            legal_tools = [
                ("CFPB Complaint Generator", "File complaint with CFPB"),
                ("Evidence Packet Builder", "Package for attorneys"),
            ]
            for mode, desc in legal_tools:
                if st.button(mode, key=f"legal_{mode}", use_container_width=True, help=desc):
                    st.session_state['app_mode'] = mode
                    st.rerun()

        # Analytics & Tracking
        with st.expander("Analytics & Tracking", expanded=False):
            st.markdown("""
            <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 8px;">
                Monitor progress and patterns
            </div>
            """, unsafe_allow_html=True)

            analytics_tools = [
                ("Analytics Dashboard", "Dispute outcomes"),
                ("Furnisher Intelligence", "Violation patterns"),
                ("Deadline Tracker", "30-day windows"),
            ]
            for mode, desc in analytics_tools:
                if st.button(mode, key=f"analytics_{mode}", use_container_width=True, help=desc):
                    st.session_state['app_mode'] = mode
                    st.rerun()

        # Settings & Accessibility
        with st.expander("Settings", expanded=False):
            settings_tools = [
                ("Case Manager", "Saved cases"),
                ("Client Portal", "Simple mode"),
                ("Accessibility", "Voice & display"),
                (t.nav_settings, "Preferences"),
            ]
            for mode, desc in settings_tools:
                if st.button(mode, key=f"settings_{mode}", use_container_width=True, help=desc):
                    st.session_state['app_mode'] = mode
                    st.rerun()

        st.markdown("---")

        # Progress indicator - only show for single case analysis
        current_mode = st.session_state.get('app_mode', t.nav_single_case)
        if current_mode == t.nav_single_case:
            st.markdown("""
            <div style="font-size: 0.85rem; color: #1e293b; font-weight: 600; margin-bottom: 10px;">
                Your Progress
            </div>
            """, unsafe_allow_html=True)

            steps = [
                (1, "Upload", "Add your report"),
                (2, "Review", "Check the text"),
                (3, "Verify", "Confirm details"),
                (4, "Check", "Find issues"),
                (5, "Generate", "Get letters")
            ]

            current_step = st.session_state.get('current_step', 1)

            for idx, name, desc in steps:
                if idx == current_step:
                    st.markdown(f"""
                    <div style="background: #dbeafe; padding: 10px 12px; border-radius: 8px; margin-bottom: 6px; border-left: 4px solid #2563eb;">
                        <div style="color: #1e40af; font-weight: 600; font-size: 0.9rem;">Step {idx}: {name}</div>
                        <div style="color: #3b82f6; font-size: 0.75rem;">{desc}</div>
                    </div>
                    """, unsafe_allow_html=True)
                elif idx < current_step:
                    st.markdown(f"""
                    <div style="padding: 6px 12px; margin-bottom: 4px; color: #16a34a; font-size: 0.85rem;">
                        Done: {name}
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown(f"""
                    <div style="padding: 6px 12px; margin-bottom: 4px; color: #94a3b8; font-size: 0.85rem;">
                        {name}
                    </div>
                    """, unsafe_allow_html=True)

            st.markdown("---")

        # Case actions
        st.markdown("""
        <div style="font-size: 0.85rem; color: #1e293b; font-weight: 600; margin-bottom: 10px;">
            Your Cases
        </div>
        """, unsafe_allow_html=True)

        col1, col2 = st.columns(2)
        with col1:
            if st.button("Save", use_container_width=True, help="Save current work"):
                from app.case_manager import save_session_to_case
                try:
                    save_session_to_case(st.session_state)
                    st.success("Saved!")
                except Exception:
                    st.error("Could not save")

        with col2:
            if st.button("Open", use_container_width=True, help="Open saved case"):
                st.session_state['show_load_dialog'] = True

        # Load dialog
        if st.session_state.get('show_load_dialog'):
            case_mgr = CaseManager()
            recent = case_mgr.list_cases(limit=5)
            if recent:
                case_ids = [c['case_id'] for c in recent]
                selected = st.selectbox("Select a case:", case_ids, key="load_case_select")
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Open Case", key="open_case_btn", use_container_width=True):
                        if load_case_to_session(selected, st.session_state):
                            st.session_state['show_load_dialog'] = False
                            st.success("Opened!")
                            st.rerun()
                with col2:
                    if st.button("Cancel", key="cancel_load_btn", use_container_width=True):
                        st.session_state['show_load_dialog'] = False
                        st.rerun()
            else:
                st.info("No saved cases yet")
                if st.button("Close", key="close_empty_btn"):
                    st.session_state['show_load_dialog'] = False
                    st.rerun()

        st.markdown("---")

        # Try samples - compact
        with st.expander("Try Sample Cases", expanded=False):
            st.markdown("""
            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 10px;">
                Practice with examples to learn how it works.
            </div>
            """, unsafe_allow_html=True)

            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("1", key="sample1", help="Re-aging example"):
                    if load_sample_case(1, project_root):
                        st.rerun()
            with col2:
                if st.button("2", key="sample2", help="SOL example"):
                    if load_sample_case(2, project_root):
                        st.rerun()
            with col3:
                if st.button("3", key="sample3", help="Clean example"):
                    if load_sample_case(3, project_root):
                        st.rerun()

        # Mode selector tabs for info
        st.markdown(f"""
        <div style="margin-top: 20px; margin-bottom: 5px;">
            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Resources</div>
        </div>
        """, unsafe_allow_html=True)
        
        tabs = st.selectbox(
            "View Documentation:",
            ["Main Tool", "About & Website", "Help / About", "Rules Documentation", "Pilot Guide"],
            label_visibility="collapsed",
            key="help_tabs_select"
        )

        st.markdown('<div style="margin-top: 10px;"></div>', unsafe_allow_html=True)
        
        # Start over
        if st.button("Initialize New Session", use_container_width=True, type="secondary"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()

        # Footer
        st.markdown("""
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
        </div>
        """, unsafe_allow_html=True)

        with st.expander("🩺 Institutional Health"):
            import shutil
            tesseract_path = shutil.which("tesseract")
            if tesseract_path:
                st.success("OCR Engine: Active")
            else:
                st.warning("OCR Engine: Offline (Install Tesseract)")
            
            st.info("Logic Engine: v2.1.0-Forensic")
            st.caption("Environment: Isolated / Air-Gapped Ready")

        st.markdown("""
        <div style="text-align: center; margin-top: 10px;">
            <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px;">
                v2.1.0 - 100% Private
            </div>
            <div style="font-size: 0.65rem; color: #cbd5e1;">
                Institutional Forensic Suite
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Issues found indicator
        high_flags = [f for f in st.session_state.get('rule_flags', []) if f.get('severity') == 'high']
        medium_flags = [f for f in st.session_state.get('rule_flags', []) if f.get('severity') == 'medium']

        if high_flags:
            st.markdown(f"""
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 15px;">
                <div style="color: #dc2626; font-size: 0.9rem; font-weight: 600;">
                    {len(high_flags)} Serious Issue(s) Found
                </div>
                <div style="font-size: 0.75rem; color: #991b1b; margin-top: 4px;">
                    See Step 4 for details
                </div>
            </div>
            """, unsafe_allow_html=True)
        elif medium_flags:
            st.markdown(f"""
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-top: 15px;">
                <div style="color: #92400e; font-size: 0.9rem; font-weight: 600;">
                    {len(medium_flags)} Potential Issue(s)
                </div>
                <div style="font-size: 0.75rem; color: #78350f; margin-top: 4px;">
                    Review in Step 4
                </div>
            </div>
            """, unsafe_allow_html=True)

        return tabs
