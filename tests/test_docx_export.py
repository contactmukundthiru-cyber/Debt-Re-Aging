import pytest
import os
from pathlib import Path
from app.docx_export import export_to_docx, export_packet_to_docx

def test_export_to_docx(tmp_path):
    md = "# Heading 1\n## Heading 2\nThis is a paragraph.\n- Item 1\n- Item 2"
    output_path = tmp_path / "test.docx"
    success = export_to_docx(md, str(output_path))
    assert success is True
    assert output_path.exists()
    assert output_path.stat().st_size > 0

def test_export_packet_to_docx(tmp_path):
    md_file = tmp_path / "letter.md"
    md_file.write_text("# Letter Title\nParagraph text.")
    
    generated_files = {"letter.md": str(md_file)}
    output_dir = tmp_path / "output"
    output_dir.mkdir()
    
    result = export_packet_to_docx(generated_files, str(output_dir))
    assert "letter.docx" in result
    assert os.path.exists(result["letter.docx"])
