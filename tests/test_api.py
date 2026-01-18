import pytest
import os
import json
import base64
from pathlib import Path
from unittest.mock import patch, MagicMock
from app.api import APIKeyManager, DebtReagingAPI, APIResponse

@pytest.fixture
def temp_settings_dir(tmp_path):
    settings_dir = tmp_path / "settings"
    settings_dir.mkdir()
    return settings_dir

def test_api_key_manager(temp_settings_dir):
    keys_file = temp_settings_dir / "api_keys.json"
    with patch("app.api.API_KEYS_FILE", keys_file):
        manager = APIKeyManager()
        assert keys_file.exists()
        
        # Generate key
        key = manager.generate_key("Test App")
        assert key.startswith("dra_")
        
        # Validate key
        metadata = manager.validate_key(key)
        assert metadata is not None
        assert metadata['name'] == "Test App"
        assert metadata['request_count'] == 1
        
        # List keys
        keys = manager.list_keys()
        assert len(keys) == 1
        assert keys[0]['name'] == "Test App"
        
        # Revoke key
        success = manager.revoke_key(key)
        assert success is True
        assert manager.validate_key(key) is None

def test_api_analyze_text():
    api = DebtReagingAPI()
    raw_text = "Account: Collection Agency\nDOFD: 2018-01-01\nBalance: $500"
    
    response = api.analyze_text(raw_text, consumer_state="NY")
    assert response.success is True
    assert response.data['case_id'].startswith("DRA-")
    assert response.data['flag_count'] > 0
    assert response.data['fields']['dofd']['value'] == "2018-01-01"

def test_api_analyze_file(tmp_path):
    api = DebtReagingAPI()
    
    # Create dummy PDF content
    dummy_pdf = b"%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    
    with patch("app.extraction.extract_text_from_bytes") as mock_extract:
        mock_extract.return_value = ("Account: Collections\nDOFD: 2019-01-01", "embedded_text")
        # Set the instance attribute since it was assigned in __init__
        api.extract_text_from_bytes = mock_extract
        
        response = api.analyze_file(dummy_pdf, "test.pdf")
        assert response.success is True
        assert response.data['extraction_method'] == "embedded_text"

def test_api_get_statistics():
    api = DebtReagingAPI()
    response = api.get_statistics()
    assert response.success is True
    assert 'total_cases' in response.data
