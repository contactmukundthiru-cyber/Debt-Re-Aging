"""
Settings Module
User configuration and preferences management

Provides persistent settings storage using local JSON files.
"""

import json
import os
from pathlib import Path
from dataclasses import dataclass, asdict, field
from typing import Optional, Dict, Any, List
from datetime import datetime


# Default settings file location
SETTINGS_DIR = Path(__file__).parent.parent / 'output' / 'settings'
SETTINGS_FILE = SETTINGS_DIR / 'user_settings.json'


@dataclass
class UserSettings:
    """User configuration settings."""

    # Language and localization
    language: str = 'en'
    date_format: str = 'YYYY-MM-DD'  # Options: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY

    # Default state for SOL calculations
    default_state: str = ''

    # Privacy settings
    privacy_mode_default: bool = False
    auto_mask_pii: bool = True

    # File management
    output_directory: str = ''
    auto_cleanup_enabled: bool = True
    auto_cleanup_hours: int = 24

    # UI preferences
    show_tutorial_on_start: bool = True
    tutorial_completed: bool = False
    compact_mode: bool = False
    high_contrast_mode: bool = False

    # Accessibility
    screen_reader_mode: bool = False
    keyboard_navigation_hints: bool = True
    larger_text: bool = False

    # Organization info (for letter templates)
    organization_name: str = ''
    organization_address: str = ''
    organization_contact: str = ''

    # Advanced settings
    ocr_language: str = 'eng'  # Tesseract language code
    extraction_confidence_threshold: float = 0.6
    show_debug_info: bool = False

    # Metrics
    enable_local_metrics: bool = True
    metrics_retention_days: int = 90

    # Last used values
    last_case_id: str = ''
    recent_files: List[str] = field(default_factory=list)

    # Timestamps
    created_at: str = ''
    updated_at: str = ''


def ensure_settings_dir():
    """Ensure the settings directory exists."""
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)


def load_settings() -> UserSettings:
    """Load settings from file, or return defaults if not found."""
    ensure_settings_dir()

    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            # Handle missing fields by merging with defaults
            defaults = asdict(UserSettings())
            defaults.update(data)
            return UserSettings(**{k: v for k, v in defaults.items()
                                 if k in UserSettings.__dataclass_fields__})
        except (json.JSONDecodeError, TypeError) as e:
            print(f"Error loading settings: {e}")
            return UserSettings(created_at=datetime.now().isoformat())

    return UserSettings(created_at=datetime.now().isoformat())


def save_settings(settings: UserSettings) -> bool:
    """Save settings to file."""
    ensure_settings_dir()

    try:
        settings.updated_at = datetime.now().isoformat()
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(asdict(settings), f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving settings: {e}")
        return False


def update_setting(key: str, value: Any) -> bool:
    """Update a single setting."""
    settings = load_settings()
    if hasattr(settings, key):
        setattr(settings, key, value)
        return save_settings(settings)
    return False


def reset_settings() -> UserSettings:
    """Reset all settings to defaults."""
    settings = UserSettings(created_at=datetime.now().isoformat())
    save_settings(settings)
    return settings


class SettingsManager:
    """Manager class for handling settings in Streamlit."""

    def __init__(self):
        self._settings = load_settings()

    @property
    def settings(self) -> UserSettings:
        """Get current settings."""
        return self._settings

    def reload(self):
        """Reload settings from file."""
        self._settings = load_settings()

    def save(self) -> bool:
        """Save current settings."""
        return save_settings(self._settings)

    def update(self, **kwargs) -> bool:
        """Update multiple settings at once."""
        for key, value in kwargs.items():
            if hasattr(self._settings, key):
                setattr(self._settings, key, value)
        return self.save()

    def reset(self) -> UserSettings:
        """Reset to defaults."""
        self._settings = reset_settings()
        return self._settings

    def add_recent_file(self, filepath: str, max_recent: int = 10):
        """Add a file to the recent files list."""
        if filepath in self._settings.recent_files:
            self._settings.recent_files.remove(filepath)
        self._settings.recent_files.insert(0, filepath)
        self._settings.recent_files = self._settings.recent_files[:max_recent]
        self.save()

    def get_date_format_display(self) -> str:
        """Get the display format for dates."""
        formats = {
            'YYYY-MM-DD': '%Y-%m-%d',
            'MM/DD/YYYY': '%m/%d/%Y',
            'DD/MM/YYYY': '%d/%m/%Y'
        }
        return formats.get(self._settings.date_format, '%Y-%m-%d')


def render_settings_page(st):
    """Render the settings page in Streamlit."""
    st.title("Settings")
    st.markdown("Configure your preferences for the Debt Re-Aging Case Factory.")

    manager = SettingsManager()
    settings = manager.settings

    # Create tabs for different settings categories
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "General", "Privacy", "Accessibility", "Organization", "Advanced"
    ])

    with tab1:
        st.header("General Settings")

        # Language
        language_options = {'en': 'English', 'es': 'Español'}
        selected_lang = st.selectbox(
            "Language / Idioma",
            options=list(language_options.keys()),
            format_func=lambda x: language_options[x],
            index=list(language_options.keys()).index(settings.language)
        )

        # Date format
        date_formats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY']
        selected_date_format = st.selectbox(
            "Date Format",
            options=date_formats,
            index=date_formats.index(settings.date_format) if settings.date_format in date_formats else 0
        )

        # Default state
        from app.state_sol import get_all_states
        states = get_all_states()
        state_options = [''] + sorted(list(states.keys()))
        selected_state = st.selectbox(
            "Default State (for SOL calculations)",
            options=state_options,
            index=state_options.index(settings.default_state) if settings.default_state in state_options else 0,
            help="Your state's Statute of Limitations will be used by default"
        )

        # Tutorial
        show_tutorial = st.checkbox(
            "Show tutorial on startup",
            value=settings.show_tutorial_on_start
        )

    with tab2:
        st.header("Privacy Settings")

        privacy_mode = st.checkbox(
            "Enable Privacy Mode by default",
            value=settings.privacy_mode_default,
            help="Masks sensitive information (SSN, account numbers) in the display"
        )

        auto_mask = st.checkbox(
            "Automatically mask PII in exports",
            value=settings.auto_mask_pii,
            help="Automatically redact personal information in generated documents"
        )

        st.subheader("Data Retention")

        auto_cleanup = st.checkbox(
            "Enable automatic cleanup of old cases",
            value=settings.auto_cleanup_enabled
        )

        cleanup_hours = st.slider(
            "Delete cases older than (hours)",
            min_value=1,
            max_value=168,  # 1 week
            value=settings.auto_cleanup_hours,
            disabled=not auto_cleanup
        )

        enable_metrics = st.checkbox(
            "Enable local usage metrics",
            value=settings.enable_local_metrics,
            help="Track aggregate statistics locally (no data sent anywhere)"
        )

    with tab3:
        st.header("Accessibility Settings")

        screen_reader = st.checkbox(
            "Screen reader mode",
            value=settings.screen_reader_mode,
            help="Optimizes the interface for screen readers"
        )

        keyboard_hints = st.checkbox(
            "Show keyboard navigation hints",
            value=settings.keyboard_navigation_hints,
            help="Display keyboard shortcuts and navigation tips"
        )

        high_contrast = st.checkbox(
            "High contrast mode",
            value=settings.high_contrast_mode,
            help="Increases color contrast for better visibility"
        )

        larger_text = st.checkbox(
            "Larger text",
            value=settings.larger_text,
            help="Increases font size throughout the application"
        )

        compact_mode = st.checkbox(
            "Compact mode",
            value=settings.compact_mode,
            help="Reduces spacing for more content on screen"
        )

    with tab4:
        st.header("Organization Settings")
        st.markdown("*For legal aid organizations and pro bono clinics*")

        org_name = st.text_input(
            "Organization Name",
            value=settings.organization_name,
            help="Will appear in generated dispute letters"
        )

        org_address = st.text_area(
            "Organization Address",
            value=settings.organization_address,
            height=100
        )

        org_contact = st.text_input(
            "Contact Information",
            value=settings.organization_contact,
            help="Email or phone for the organization"
        )

    with tab5:
        st.header("Advanced Settings")
        st.warning("These settings are for advanced users. Incorrect values may affect tool accuracy.")

        confidence_threshold = st.slider(
            "OCR Confidence Threshold",
            min_value=0.0,
            max_value=1.0,
            value=settings.extraction_confidence_threshold,
            step=0.1,
            help="Minimum confidence level for extracted fields"
        )

        ocr_lang = st.selectbox(
            "OCR Language",
            options=['eng', 'spa', 'eng+spa'],
            index=['eng', 'spa', 'eng+spa'].index(settings.ocr_language) if settings.ocr_language in ['eng', 'spa', 'eng+spa'] else 0,
            help="Language for OCR text extraction"
        )

        show_debug = st.checkbox(
            "Show debug information",
            value=settings.show_debug_info
        )

        metrics_retention = st.number_input(
            "Metrics retention (days)",
            min_value=7,
            max_value=365,
            value=settings.metrics_retention_days
        )

        st.markdown("---")

        col1, col2 = st.columns(2)
        with col1:
            if st.button("Export Settings", use_container_width=True):
                settings_json = json.dumps(asdict(settings), indent=2)
                st.download_button(
                    "Download Settings JSON",
                    settings_json,
                    file_name="debt_reaging_settings.json",
                    mime="application/json"
                )

        with col2:
            if st.button("Reset to Defaults", type="secondary", use_container_width=True):
                manager.reset()
                st.success("Settings reset to defaults!")
                st.rerun()

    # Save button
    st.markdown("---")
    if st.button("Save Settings", type="primary", use_container_width=True):
        manager.update(
            language=selected_lang,
            date_format=selected_date_format,
            default_state=selected_state,
            show_tutorial_on_start=show_tutorial,
            privacy_mode_default=privacy_mode,
            auto_mask_pii=auto_mask,
            auto_cleanup_enabled=auto_cleanup,
            auto_cleanup_hours=cleanup_hours,
            enable_local_metrics=enable_metrics,
            screen_reader_mode=screen_reader,
            keyboard_navigation_hints=keyboard_hints,
            high_contrast_mode=high_contrast,
            larger_text=larger_text,
            compact_mode=compact_mode,
            organization_name=org_name,
            organization_address=org_address,
            organization_contact=org_contact,
            extraction_confidence_threshold=confidence_threshold,
            ocr_language=ocr_lang,
            show_debug_info=show_debug,
            metrics_retention_days=metrics_retention
        )
        st.success("Settings saved successfully!")
