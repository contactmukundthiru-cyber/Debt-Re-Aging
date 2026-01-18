import pytest
from unittest.mock import MagicMock, patch
from app.extraction import preprocess_image, get_extraction_quality_score, extract_text

def test_get_extraction_quality_score_empty():
    score, desc = get_extraction_quality_score("")
    assert score == 0
    assert desc == "No text extracted"

def test_get_extraction_quality_score_good():
    text = "Account balance for Experian credit report. Creditor: Bank of America. Date opened: 2020-01-01."
    score, desc = get_extraction_quality_score(text)
    assert score >= 50
    assert "High quality" in desc or "Moderate quality" in desc

def test_extract_text_unsupported():
    res, method = extract_text("test.txt", "text/plain")
    assert res == "Unsupported file type"
    assert method == "error"

@patch('app.extraction.PIL_AVAILABLE', False)
def test_preprocess_image_no_pil():
    # If PIL is not available, should return input
    img = MagicMock()
    assert preprocess_image(img) == img

@patch('app.extraction.PIL_AVAILABLE', True)
@patch('app.extraction.OPENCV_AVAILABLE', False)
def test_preprocess_image_no_opencv():
    img = MagicMock()
    preprocess_image(img)
    img.convert.assert_called_with('L')
