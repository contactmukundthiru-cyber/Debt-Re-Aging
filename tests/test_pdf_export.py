import pytest
import os
from pathlib import Path
from app.pdf_export import markdown_to_html, export_to_html, export_packet_to_pdf

def test_markdown_to_html():
    md = "# Test Title\nThis is a test."
    html = markdown_to_html(md, title="Test Doc")
    assert "<title>Test Doc</title>" in html
    assert "<h1>Test Title</h1>" in html
    assert "Certified Mail" in html

def test_export_to_html(tmp_path):
    md = "# Test Title"
    output_path = tmp_path / "test.html"
    success = export_to_html(md, str(output_path), title="Test Doc")
    assert success is True
    assert output_path.exists()
    with open(output_path, 'r') as f:
        content = f.read()
        assert "window.print()" in content

def test_export_packet_to_pdf_fallback_to_html(tmp_path):
    # Mocking generated files
    md_file = tmp_path / "letter.md"
    md_file.write_text("# Letter content")
    
    generated_files = {"letter.md": str(md_file)}
    output_dir = tmp_path / "output"
    output_dir.mkdir()
    
    result = export_packet_to_pdf(generated_files, str(output_dir), "CASE-1")
    
    # Since weasyprint is not installed, it should generate .html
    assert "letter.html" in result
    assert os.path.exists(result["letter.html"])
