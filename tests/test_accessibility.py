import pytest
from app.accessibility import AccessibilityConfig, get_accessibility_css, get_voice_guidance_script, format_for_screen_reader, get_aria_labels

def test_accessibility_config_defaults():
    config = AccessibilityConfig()
    assert config.high_contrast is False
    assert config.larger_text is False
    assert config.screen_reader_mode is False
    assert config.keyboard_hints is True
    assert config.reduced_motion is False
    assert config.focus_indicators is True

def test_get_accessibility_css_base():
    config = AccessibilityConfig()
    css = get_accessibility_css(config)
    assert "/* Base Accessibility Improvements */" in css
    assert "/* High Contrast Mode */" not in css
    assert "/* Mobile Responsive Design */" in css

def test_get_accessibility_css_high_contrast():
    config = AccessibilityConfig(high_contrast=True)
    css = get_accessibility_css(config)
    assert "/* High Contrast Mode */" in css

def test_get_accessibility_css_larger_text():
    config = AccessibilityConfig(larger_text=True)
    css = get_accessibility_css(config)
    assert "/* Larger Text Mode */" in css

def test_get_voice_guidance_script_valid():
    script = get_voice_guidance_script(1)
    assert "Step 1: Upload Your Credit Report" in script
    assert "Welcome to the Credit Report Analyzer" in script

def test_get_voice_guidance_script_invalid():
    script = get_voice_guidance_script(99)
    assert script == ""

def test_format_for_screen_reader():
    text = "The DOFD is important for FCRA compliance."
    formatted = format_for_screen_reader(text)
    assert "Date of First Delinquency (DOFD)" in formatted
    assert "Fair Credit Reporting Act (FCRA)" in formatted
    # Check that it only replaces once
    text2 = "DOFD and DOFD."
    formatted2 = format_for_screen_reader(text2)
    assert formatted2.count("Date of First Delinquency (DOFD)") == 1

def test_get_aria_labels():
    labels = get_aria_labels()
    assert "upload_button" in labels
    assert labels["upload_button"] == "Upload credit report document"
