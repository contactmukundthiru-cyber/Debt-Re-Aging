import pytest
import os
import json
from pathlib import Path
from unittest.mock import patch
from app.settings import UserSettings, load_settings, save_settings, SettingsManager

@pytest.fixture
def temp_settings_dir(tmp_path):
    settings_dir = tmp_path / "settings"
    settings_dir.mkdir()
    return settings_dir

def test_user_settings_defaults():
    settings = UserSettings()
    assert settings.language == 'en'
    assert settings.date_format == 'YYYY-MM-DD'
    assert settings.show_tutorial_on_start is True

def test_save_and_load_settings(temp_settings_dir):
    settings_file = temp_settings_dir / "user_settings.json"
    with patch("app.settings.SETTINGS_DIR", temp_settings_dir), \
         patch("app.settings.SETTINGS_FILE", settings_file):
        
        settings = UserSettings(language='es', default_state='NY')
        success = save_settings(settings)
        assert success is True
        assert settings_file.exists()
        
        loaded = load_settings()
        assert loaded.language == 'es'
        assert loaded.default_state == 'NY'

def test_settings_manager_update(temp_settings_dir):
    settings_file = temp_settings_dir / "user_settings.json"
    with patch("app.settings.SETTINGS_DIR", temp_settings_dir), \
         patch("app.settings.SETTINGS_FILE", settings_file):
        
        manager = SettingsManager()
        manager.update(language='es', compact_mode=True)
        
        assert manager.settings.language == 'es'
        assert manager.settings.compact_mode is True
        
        # Verify file
        with open(settings_file, 'r') as f:
            data = json.load(f)
            assert data['language'] == 'es'
            assert data['compact_mode'] is True

def test_settings_manager_recent_files(temp_settings_dir):
    settings_file = temp_settings_dir / "user_settings.json"
    with patch("app.settings.SETTINGS_DIR", temp_settings_dir), \
         patch("app.settings.SETTINGS_FILE", settings_file):
        
        manager = SettingsManager()
        manager.add_recent_file("file1.pdf")
        manager.add_recent_file("file2.pdf")
        manager.add_recent_file("file1.pdf") # Should move to top
        
        assert manager.settings.recent_files == ["file1.pdf", "file2.pdf"]
