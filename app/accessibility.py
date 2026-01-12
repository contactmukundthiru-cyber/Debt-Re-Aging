"""
Accessibility Module
WCAG compliance helpers, keyboard navigation, screen reader support

Provides accessibility enhancements for users with disabilities.
"""

from typing import Dict, Optional
from dataclasses import dataclass


@dataclass
class AccessibilityConfig:
    """Accessibility configuration options."""
    high_contrast: bool = False
    larger_text: bool = False
    screen_reader_mode: bool = False
    keyboard_hints: bool = True
    reduced_motion: bool = False
    focus_indicators: bool = True


def get_accessibility_css(config: AccessibilityConfig) -> str:
    """Generate CSS based on accessibility settings."""
    css_parts = [BASE_ACCESSIBILITY_CSS]

    if config.high_contrast:
        css_parts.append(HIGH_CONTRAST_CSS)

    if config.larger_text:
        css_parts.append(LARGER_TEXT_CSS)

    if config.reduced_motion:
        css_parts.append(REDUCED_MOTION_CSS)

    if config.focus_indicators:
        css_parts.append(FOCUS_INDICATORS_CSS)

    if config.screen_reader_mode:
        css_parts.append(SCREEN_READER_CSS)

    return "\n".join(css_parts)


# Base accessibility CSS - always applied
BASE_ACCESSIBILITY_CSS = """
<style>
    /* Base Accessibility Improvements */

    /* Ensure sufficient color contrast for text */
    .stMarkdown p, .stMarkdown li {
        color: #1a1a1a;
        line-height: 1.6;
    }

    /* Focus visible for all interactive elements */
    button:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible,
    [role="button"]:focus-visible {
        outline: 3px solid #0066cc;
        outline-offset: 2px;
    }

    /* Skip link for keyboard users */
    .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: #0066cc;
        color: white;
        padding: 8px 16px;
        z-index: 100000;
        text-decoration: none;
        font-weight: bold;
    }

    .skip-link:focus {
        top: 0;
    }

    /* Improved form labels */
    label {
        display: block;
        margin-bottom: 4px;
        font-weight: 600;
    }

    /* Error states with icons, not just color */
    .error-field {
        border: 2px solid #dc2626 !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23dc2626'%3E%3Cpath fill-rule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 20px;
        padding-right: 36px;
    }

    /* Success states with icons */
    .success-field {
        border: 2px solid #059669 !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23059669'%3E%3Cpath fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 20px;
        padding-right: 36px;
    }

    /* Severity indicators with patterns, not just colors */
    .severity-high::before {
        content: "⚠️ HIGH: ";
        font-weight: bold;
    }

    .severity-medium::before {
        content: "⚡ MEDIUM: ";
        font-weight: bold;
    }

    .severity-low::before {
        content: "ℹ️ LOW: ";
        font-weight: bold;
    }

    /* Ensure links are distinguishable */
    a {
        color: #0066cc;
        text-decoration: underline;
    }

    a:hover {
        text-decoration: none;
        background-color: #e6f0ff;
    }

    /* Responsive text sizing */
    html {
        font-size: 16px;
    }

    @media (max-width: 768px) {
        html {
            font-size: 14px;
        }
    }

    /* Touch targets - minimum 44x44px */
    button,
    [role="button"],
    .stButton > button {
        min-height: 44px;
        min-width: 44px;
    }

    /* Improved table accessibility */
    table {
        border-collapse: collapse;
    }

    th {
        background-color: #f3f4f6;
        font-weight: bold;
        text-align: left;
    }

    th, td {
        padding: 12px;
        border: 1px solid #d1d5db;
    }

    /* Progress indicators with text */
    .progress-with-text {
        position: relative;
    }

    .progress-with-text::after {
        content: attr(data-progress);
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.875rem;
        font-weight: bold;
    }
</style>
"""


# High contrast mode CSS
HIGH_CONTRAST_CSS = """
<style>
    /* High Contrast Mode */

    body, .main {
        background-color: #ffffff !important;
        color: #000000 !important;
    }

    /* Increase all text contrast */
    .stMarkdown p, .stMarkdown li, .stMarkdown span {
        color: #000000 !important;
    }

    /* Stronger borders */
    input, select, textarea {
        border: 2px solid #000000 !important;
    }

    /* High contrast buttons */
    .stButton > button {
        background-color: #000000 !important;
        color: #ffffff !important;
        border: 3px solid #000000 !important;
    }

    .stButton > button:hover {
        background-color: #333333 !important;
    }

    /* Primary buttons */
    .stButton > button[kind="primary"] {
        background-color: #0000cc !important;
        border-color: #0000cc !important;
    }

    /* Severity colors with higher contrast */
    .severity-high {
        background-color: #ffcccc !important;
        border-left: 8px solid #cc0000 !important;
        color: #000000 !important;
    }

    .severity-medium {
        background-color: #fff3cc !important;
        border-left: 8px solid #cc7700 !important;
        color: #000000 !important;
    }

    .severity-low {
        background-color: #cce5ff !important;
        border-left: 8px solid #0066cc !important;
        color: #000000 !important;
    }

    /* Links */
    a {
        color: #0000cc !important;
        text-decoration: underline !important;
    }

    /* Focus indicators */
    *:focus {
        outline: 4px solid #ffcc00 !important;
        outline-offset: 2px !important;
    }

    /* Sidebar high contrast */
    section[data-testid="stSidebar"] {
        background-color: #000000 !important;
    }

    section[data-testid="stSidebar"] * {
        color: #ffffff !important;
    }

    /* Confidence indicators */
    .confidence-high {
        color: #006600 !important;
        font-weight: bold !important;
    }

    .confidence-medium {
        color: #996600 !important;
        font-weight: bold !important;
    }

    .confidence-low {
        color: #cc0000 !important;
        font-weight: bold !important;
    }
</style>
"""


# Larger text CSS
LARGER_TEXT_CSS = """
<style>
    /* Larger Text Mode */

    html {
        font-size: 20px !important;
    }

    .stMarkdown p, .stMarkdown li {
        font-size: 1.1rem !important;
        line-height: 1.8 !important;
    }

    h1 {
        font-size: 2.5rem !important;
    }

    h2 {
        font-size: 2rem !important;
    }

    h3 {
        font-size: 1.75rem !important;
    }

    button, input, select, textarea {
        font-size: 1.1rem !important;
    }

    .stButton > button {
        font-size: 1.1rem !important;
        padding: 12px 24px !important;
    }

    /* Increase icon sizes */
    .nav-step {
        font-size: 1.1rem !important;
        padding: 14px 18px !important;
    }

    /* Larger tooltips */
    [title] {
        font-size: 1rem !important;
    }
</style>
"""


# Reduced motion CSS
REDUCED_MOTION_CSS = """
<style>
    /* Reduced Motion Mode */

    *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
    }

    /* Disable smooth scrolling */
    html {
        scroll-behavior: auto !important;
    }
</style>
"""


# Enhanced focus indicators
FOCUS_INDICATORS_CSS = """
<style>
    /* Enhanced Focus Indicators */

    *:focus {
        outline: 3px solid #0066cc !important;
        outline-offset: 3px !important;
    }

    *:focus:not(:focus-visible) {
        outline: none !important;
    }

    *:focus-visible {
        outline: 3px solid #0066cc !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 6px rgba(0, 102, 204, 0.3) !important;
    }

    /* Visible focus for buttons */
    button:focus-visible {
        background-color: #e6f0ff !important;
    }
</style>
"""


# Screen reader optimizations
SCREEN_READER_CSS = """
<style>
    /* Screen Reader Optimizations */

    /* Ensure all images have alt text placeholder */
    img:not([alt]) {
        outline: 3px solid red !important;
    }

    /* Hide decorative elements from screen readers */
    .decorative {
        aria-hidden: true;
    }

    /* Ensure sufficient spacing for screen reader navigation */
    section, article, main, nav {
        margin-bottom: 24px;
    }

    /* Make skip links visible */
    .skip-link {
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        height: 1px;
        overflow: hidden;
        position: absolute;
        white-space: nowrap;
        width: 1px;
    }

    .skip-link:focus {
        clip: auto;
        clip-path: none;
        height: auto;
        overflow: visible;
        position: fixed;
        top: 0;
        left: 0;
        width: auto;
        z-index: 100000;
        background: #0066cc;
        color: white;
        padding: 16px 32px;
        font-size: 1.1rem;
    }
</style>
"""


# Mobile responsive CSS
MOBILE_RESPONSIVE_CSS = """
<style>
    /* Mobile Responsive Design */

    @media (max-width: 768px) {
        /* Stack columns vertically */
        .row-widget.stHorizontalBlock {
            flex-direction: column !important;
        }

        .row-widget.stHorizontalBlock > div {
            width: 100% !important;
            margin-bottom: 16px;
        }

        /* Full width buttons */
        .stButton > button {
            width: 100% !important;
        }

        /* Larger touch targets */
        button, input, select, textarea {
            min-height: 48px !important;
            font-size: 16px !important; /* Prevents zoom on iOS */
        }

        /* Simplified sidebar */
        section[data-testid="stSidebar"] {
            width: 100% !important;
            position: relative !important;
        }

        /* Better spacing */
        .main .block-container {
            padding: 1rem !important;
        }

        /* Smaller headers */
        h1 {
            font-size: 1.75rem !important;
        }

        h2 {
            font-size: 1.5rem !important;
        }

        /* Scrollable tables */
        .stDataFrame {
            overflow-x: auto !important;
        }

        /* Stack form fields */
        .stTextInput, .stSelectbox, .stTextArea {
            width: 100% !important;
        }

        /* Hide non-essential elements */
        .hide-mobile {
            display: none !important;
        }
    }

    @media (max-width: 480px) {
        /* Even smaller screens */
        .main .block-container {
            padding: 0.5rem !important;
        }

        h1 {
            font-size: 1.5rem !important;
        }

        .nav-step {
            font-size: 0.85rem !important;
            padding: 8px 12px !important;
        }
    }

    /* Tablet adjustments */
    @media (min-width: 769px) and (max-width: 1024px) {
        .main .block-container {
            padding: 1.5rem !important;
        }
    }

    /* Print styles */
    @media print {
        section[data-testid="stSidebar"] {
            display: none !important;
        }

        .no-print {
            display: none !important;
        }

        .main {
            margin: 0 !important;
            padding: 0 !important;
        }

        a {
            text-decoration: none !important;
        }

        a[href]::after {
            content: " (" attr(href) ")";
            font-size: 0.8em;
            color: #666;
        }
    }
</style>
"""


def get_skip_link_html() -> str:
    """Generate skip link HTML for keyboard users."""
    return """
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div id="main-content"></div>
    """


def get_aria_live_region() -> str:
    """Generate ARIA live region for dynamic updates."""
    return """
    <div aria-live="polite" aria-atomic="true" class="sr-only" id="status-announcer">
    </div>
    """


def get_keyboard_shortcuts_help() -> Dict[str, str]:
    """Get keyboard shortcut documentation."""
    return {
        "Tab": "Move to next interactive element",
        "Shift + Tab": "Move to previous interactive element",
        "Enter": "Activate buttons and links",
        "Space": "Toggle checkboxes, activate buttons",
        "Arrow keys": "Navigate within dropdowns and radio buttons",
        "Escape": "Close modals and menus",
        "Ctrl + S": "Save current case (when available)",
        "Ctrl + P": "Print current view",
    }


def render_keyboard_shortcuts(st):
    """Render keyboard shortcuts help in Streamlit."""
    shortcuts = get_keyboard_shortcuts_help()

    st.subheader("Keyboard Shortcuts")
    st.markdown("Use these shortcuts for faster navigation:")

    for key, description in shortcuts.items():
        st.markdown(f"- **{key}**: {description}")


def get_aria_labels() -> Dict[str, str]:
    """Get ARIA labels for common elements."""
    return {
        "upload_button": "Upload credit report document",
        "continue_button": "Continue to next step",
        "back_button": "Go back to previous step",
        "run_checks_button": "Run automated checks on extracted data",
        "generate_button": "Generate dispute documentation packet",
        "download_button": "Download generated files",
        "reset_button": "Reset and start over",
        "field_confidence_high": "High confidence - likely accurate",
        "field_confidence_medium": "Medium confidence - please verify",
        "field_confidence_low": "Low confidence - manual verification required",
        "severity_high": "High severity issue - strong indicator of a problem",
        "severity_medium": "Medium severity - possible issue",
        "severity_low": "Low severity - minor concern",
    }


def create_accessible_button(label: str, aria_label: str, key: str = None) -> Dict:
    """Create button parameters with accessibility attributes."""
    return {
        "label": label,
        "key": key,
        "help": aria_label,  # Streamlit uses help for tooltip/accessibility
    }


def format_for_screen_reader(text: str, context: str = "") -> str:
    """Format text for better screen reader comprehension."""
    # Add context for abbreviations
    replacements = {
        "DOFD": "Date of First Delinquency (DOFD)",
        "FCRA": "Fair Credit Reporting Act (FCRA)",
        "FDCPA": "Fair Debt Collection Practices Act (FDCPA)",
        "SOL": "Statute of Limitations (SOL)",
        "CRA": "Credit Reporting Agency (CRA)",
    }

    for abbrev, full in replacements.items():
        # Only replace first occurrence to avoid repetition
        if abbrev in text and full not in text:
            text = text.replace(abbrev, full, 1)

    return text
