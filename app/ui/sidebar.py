import streamlit as st
import json
from pathlib import Path
from app.i18n import SUPPORTED_LANGUAGES, get_translations
from app.settings import SettingsManager
from app.case_manager import CaseManager, load_case_to_session

def load_sample_case(sample_num: int, project_root: Path):
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

def render_sidebar(project_root: Path):
    """Render the sidebar with navigation and help."""
    with st.sidebar:
        # Professional header with logo placeholder
        st.markdown("""
        <div style="text-align: center; padding: 10px 0 20px 0; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 1.1rem; font-weight: 600; color: #1e40af; margin-bottom: 2px;">
                Credit Report Analyzer
            </div>
            <div style="font-size: 0.7rem; color: #64748b;">
                Dispute Documentation Tool
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("")

        # Language selector - simple and clean
        settings_mgr = SettingsManager()
        current_lang = settings_mgr.settings.language

        _, lang_col, _ = st.columns([1, 2, 1])
        with lang_col:
            lang_options = {"English": "en", "Español": "es"}
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

        # Mode selector - clean categories
        t = get_translations(current_lang)

        st.markdown("""
        <div style="font-size: 0.75rem; color: #475569; font-weight: 600; margin-bottom: 8px;">
            What would you like to do?
        </div>
        """, unsafe_allow_html=True)

        # Group modes logically
        mode_options = {
            "📄 Analyze a Report": t.nav_single_case,
            "📑 Multiple Accounts": "Multi-Account Analysis",
            "🔍 Compare Bureaus": t.nav_cross_bureau,
            "📊 View Analytics": "Analytics Dashboard",
            "📅 Track Deadlines": "Deadline Tracker",
            "💼 Manage Cases": "Case Manager",
            "👤 Client Self-Service": "Client Portal",
            "⚙️ Settings": t.nav_settings,
        }

        selected_display = st.radio(
            "Select mode:",
            list(mode_options.keys()),
            index=0,
            label_visibility="collapsed"
        )
        st.session_state['app_mode'] = mode_options[selected_display]

        st.markdown("---")

        # Progress indicator - friendly language
        st.markdown("""
        <div style="font-size: 0.75rem; color: #475569; font-weight: 600; margin-bottom: 8px;">
            Your Progress
        </div>
        """, unsafe_allow_html=True)

        steps = [
            (1, "Upload Report"),
            (2, "Review Text"),
            (3, "Verify Details"),
            (4, "Check for Issues"),
            (5, "Generate Letters")
        ]

        for idx, name in steps:
            if idx == st.session_state.current_step:
                st.markdown(f"""
                <div style="background: #dbeafe; padding: 8px 12px; border-radius: 6px; margin-bottom: 4px; border-left: 3px solid #2563eb;">
                    <span style="color: #1e40af; font-weight: 600;">Step {idx}: {name}</span>
                </div>
                """, unsafe_allow_html=True)
            elif idx < st.session_state.current_step:
                st.markdown(f"""
                <div style="padding: 8px 12px; margin-bottom: 4px; color: #16a34a;">
                    ✓ Step {idx}: {name}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="padding: 8px 12px; margin-bottom: 4px; color: #94a3b8;">
                    ○ Step {idx}: {name}
                </div>
                """, unsafe_allow_html=True)

        st.markdown("---")

        # Case actions - friendly buttons
        st.markdown("""
        <div style="font-size: 0.75rem; color: #475569; font-weight: 600; margin-bottom: 8px;">
            Case Actions
        </div>
        """, unsafe_allow_html=True)

        col1, col2 = st.columns(2)
        with col1:
            if st.button("💾 Save", use_container_width=True, help="Save your current work"):
                from app.case_manager import save_session_to_case
                try:
                    save_session_to_case(st.session_state)
                    st.success("Saved!")
                except Exception:
                    st.error("Could not save")

        with col2:
            if st.button("📂 Open", use_container_width=True, help="Open a saved case"):
                st.session_state['show_load_dialog'] = True

        # Load dialog
        if st.session_state.get('show_load_dialog'):
            case_mgr = CaseManager()
            recent = case_mgr.list_cases(limit=5)
            if recent:
                case_ids = [c['case_id'] for c in recent]
                selected = st.selectbox("Select a saved case:", case_ids)
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Open", use_container_width=True):
                        if load_case_to_session(selected, st.session_state):
                            st.session_state['show_load_dialog'] = False
                            st.success(f"Opened!")
                            st.rerun()
                with col2:
                    if st.button("Cancel", use_container_width=True):
                        st.session_state['show_load_dialog'] = False
                        st.rerun()
            else:
                st.info("No saved cases yet")
                if st.button("Cancel"):
                    st.session_state['show_load_dialog'] = False
                    st.rerun()

        st.markdown("---")

        # Try sample cases - friendly invitation
        with st.expander("🎓 Try a Sample Case", expanded=False):
            st.markdown("""
            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 10px;">
                Practice with example cases to learn how the tool works.
            </div>
            """, unsafe_allow_html=True)

            sample_options = [f"Sample Case {i}" for i in range(1, 4)]
            selected_sample = st.selectbox(
                "Choose an example:",
                options=["Select..."] + sample_options,
                label_visibility="collapsed"
            )

            if selected_sample and selected_sample != "Select...":
                sample_num = int(selected_sample.split()[-1])
                if st.button("Load Example", use_container_width=True):
                    if load_sample_case(sample_num, project_root):
                        st.success("Example loaded!")
                        st.rerun()

        st.markdown("---")

        # Help section
        st.markdown("""
        <div style="font-size: 0.75rem; color: #475569; font-weight: 600; margin-bottom: 8px;">
            Help & Resources
        </div>
        """, unsafe_allow_html=True)

        tabs = st.radio(
            "Resources:",
            ["Main Tool", "Help / About", "Rules Documentation", "Pilot Guide"],
            label_visibility="collapsed"
        )

        # Start over - subtle, at bottom
        st.markdown("---")
        if st.button("🔄 Start New Case", use_container_width=True, type="secondary"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()

        # Footer with trust indicators
        st.markdown("""
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 0.65rem; color: #94a3b8; margin-bottom: 4px;">
                Version 1.0.0
            </div>
            <div style="font-size: 0.6rem; color: #cbd5e1;">
                100% Private · Runs Locally · No Data Uploaded
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Show issues found (only if relevant)
        m_flags = [f for f in st.session_state.get('rule_flags', []) if f.get('rule_id', '').startswith('M')]
        if m_flags:
            st.markdown("---")
            st.markdown(f"""
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 10px; margin-top: 10px;">
                <div style="color: #92400e; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">
                    ⚠️ {len(m_flags)} Reporting Issue(s) Found
                </div>
                <div style="font-size: 0.75rem; color: #78350f;">
                    See Step 4 for details
                </div>
            </div>
            """, unsafe_allow_html=True)

        return tabs
