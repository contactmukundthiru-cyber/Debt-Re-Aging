"""
PDF export functionality for dispute packets.

Provides multiple methods for PDF generation:
1. Browser-based printing (simplest)
2. WeasyPrint (if installed)
3. Basic HTML-to-PDF fallback
"""

import os
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any
import markdown


def markdown_to_html(md_content: str, title: str = "Document") -> str:
    """
    Convert Markdown content to styled HTML.

    Args:
        md_content: Markdown text
        title: Document title

    Returns:
        HTML string
    """
    # Convert markdown to HTML
    html_body = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code', 'nl2br']
    )

    # Wrap in styled HTML document
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        @page {{
            size: letter;
            margin: 0.75in;
            @bottom-right {{
                content: "Page " counter(page) " of " counter(pages);
                font-family: 'Times New Roman', serif;
                font-size: 9pt;
            }}
            @bottom-left {{
                content: "Prepared via Debt Re-aging Case Factory";
                font-family: 'Times New Roman', serif;
                font-size: 8pt;
                color: #777;
            }}
        }}

        body {{
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #111;
            max-width: 7.5in;
            margin: 0 auto;
            padding: 0;
        }}

        .legal-header {{
            text-align: right;
            border-bottom: 2px solid #000;
            margin-bottom: 30px;
            padding-bottom: 5px;
        }}

        .certified-stamp {{
            border: 2px solid #000;
            display: inline-block;
            padding: 5px 15px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 14pt;
            margin-bottom: 10px;
        }}

        h1 {{
            font-size: 20pt;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            margin-top: 0;
        }}

        h2 {{
            font-size: 15pt;
            color: #000;
            border-bottom: 1px solid #666;
            margin-top: 25px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }}

        h3 {{
            font-size: 13pt;
            color: #222;
            margin-top: 20px;
            margin-bottom: 8px;
            font-weight: bold;
        }}

        h4 {{
            font-size: 11pt;
            color: #333;
            font-weight: bold;
        }}

        p {{
            margin-bottom: 15px;
            text-align: justify;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            page-break-inside: avoid;
        }}

        th, td {{
            border: 1px solid #444;
            padding: 10px 15px;
            text-align: left;
        }}

        th {{
            background-color: #eee;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9pt;
        }}

        tr:nth-child(even) {{
            background-color: #fcfcfc;
        }}

        ul, ol {{
            margin-bottom: 15px;
            padding-left: 30px;
        }}

        li {{
            margin-bottom: 8px;
        }}

        blockquote {{
            margin: 20px 0;
            padding: 15px 25px;
            border-left: 5px solid #000;
            background-color: #f9f9f9;
            font-style: italic;
        }}

        .case-footer {{
            margin-top: 50px;
            font-size: 9pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }}
    </style>
</head>
<body>
    <div class="legal-header">
        <div class="certified-stamp">Certified Mail - Return Receipt Requested</div>
        <div style="font-size: 9pt; color: #555;">DETERMINATION OF NON-COMPLIANCE</div>
    </div>
    {html_body}
    <div class="case-footer">
        INTERNAL CASE LOG ID: {title.replace(' ', '_').upper()} | TIMESTAMP: {tempfile.gettempprefix()}
    </div>
</body>
</html>"""

    return html


def export_to_pdf_weasyprint(
    md_content: str,
    output_path: str,
    title: str = "Document"
) -> bool:
    """
    Export Markdown to PDF using WeasyPrint.

    Args:
        md_content: Markdown content
        output_path: Output PDF path
        title: Document title

    Returns:
        True if successful, False otherwise
    """
    try:
        from weasyprint import HTML
        html = markdown_to_html(md_content, title)
        HTML(string=html).write_pdf(output_path)
        return True
    except ImportError:
        return False
    except Exception:
        return False


def export_to_html(
    md_content: str,
    output_path: str,
    title: str = "Document"
) -> bool:
    """
    Export Markdown to HTML file (for browser-based PDF printing).

    Args:
        md_content: Markdown content
        output_path: Output HTML path
        title: Document title

    Returns:
        True if successful
    """
    html = markdown_to_html(md_content, title)

    # Add print button for browser
    html = html.replace(
        '</body>',
        '''
<div class="no-print" style="text-align: center; margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
    <p style="margin-bottom: 12px;">To save as PDF, use your browser's print function (Ctrl+P / Cmd+P) and select "Save as PDF".</p>
    <button onclick="window.print()" style="padding: 12px 24px; font-size: 14px; cursor: pointer; background: #1976d2; color: white; border: none; border-radius: 4px;">
        Print / Save as PDF
    </button>
</div>
</body>'''
    )

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    return True


def export_packet_to_pdf(
    generated_files: Dict[str, str],
    output_dir: str,
    case_id: str
) -> Dict[str, str]:
    """
    Export all packet files to PDF format.

    Args:
        generated_files: Dictionary of generated file paths
        output_dir: Output directory
        case_id: Case identifier

    Returns:
        Dictionary of PDF file paths
    """
    pdf_files = {}
    output_path = Path(output_dir)

    # Try WeasyPrint first, fall back to HTML
    use_weasyprint = False
    try:
        import weasyprint
        use_weasyprint = True
    except ImportError:
        pass

    for filename, filepath in generated_files.items():
        if not filename.endswith('.md'):
            continue

        # Read the markdown file
        with open(filepath, 'r', encoding='utf-8') as f:
            md_content = f.read()

        base_name = filename.replace('.md', '')
        title = base_name.replace('_', ' ').title()

        if use_weasyprint:
            pdf_path = output_path / f"{base_name}.pdf"
            if export_to_pdf_weasyprint(md_content, str(pdf_path), title):
                pdf_files[f"{base_name}.pdf"] = str(pdf_path)
        else:
            # Fall back to HTML
            html_path = output_path / f"{base_name}.html"
            if export_to_html(md_content, str(html_path), title):
                pdf_files[f"{base_name}.html"] = str(html_path)

    return pdf_files


def get_print_instructions() -> str:
    """Get instructions for printing to PDF."""
    return """
## Saving as PDF

To save these documents as PDF:

1. Open the HTML file in your web browser
2. Press Ctrl+P (Windows) or Cmd+P (Mac)
3. Select "Save as PDF" as the destination
4. Click "Save"

Alternatively, you can use any online Markdown-to-PDF converter
or install WeasyPrint for automatic PDF generation.
"""
