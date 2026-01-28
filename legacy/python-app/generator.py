"""
Packet generator for creating dispute letters and case documentation.
Uses Jinja2 templates for consistent, professional output.
"""

import os
import json
import yaml
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.utils import generate_case_id


class PacketGenerator:
    """
    Generates dispute packets including letters, checklists, and case summaries.
    """

    def __init__(self, templates_dir: str = None):
        """
        Initialize the packet generator.

        Args:
            templates_dir: Path to templates directory. Defaults to ./templates
        """
        if templates_dir is None:
            # Default to templates directory relative to repository root
            # legacy/python-app/<this file> -> repo root is 2 levels up
            repo_root = Path(__file__).resolve().parents[2]
            templates_dir = repo_root / 'templates'

        self.templates_dir = Path(templates_dir)

        # Initialize Jinja environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=False, # Markdown doesn't need HTML autoescaping
            trim_blocks=True,
            lstrip_blocks=True
        )

        # Add custom filters
        self.env.filters['format_date'] = self._format_date
        self.env.filters['severity_indicator'] = self._severity_indicator
        
        from app.utils import estimate_removal_date
        self.env.filters['estimate_removal_date'] = lambda d: self._format_date(estimate_removal_date(d))


    def _format_date(self, date_str: str) -> str:
        """Format ISO date to readable format."""
        if not date_str:
            return "Not Available"
        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            return dt.strftime('%B %d, %Y')
        except ValueError:
            return date_str

    def _severity_indicator(self, severity: str) -> str:
        """Convert severity to text indicator."""
        indicators = {
            'high': 'HIGH PRIORITY',
            'medium': 'MEDIUM PRIORITY',
            'low': 'LOW PRIORITY'
        }
        return indicators.get(severity.lower(), 'UNKNOWN')

    def generate_packet(
        self,
        case_id: str,
        verified_fields: Dict[str, Any],
        flags: List[Dict[str, Any]],
        consumer_info: Optional[Dict[str, str]] = None,
        output_dir: str = None
    ) -> Dict[str, str]:
        """
        Generate a complete dispute packet.

        Args:
            case_id: Unique case identifier
            verified_fields: Dictionary of verified field values
            flags: List of rule violation flags
            consumer_info: Optional dict with name, address, etc.
            output_dir: Output directory path

        Returns:
            Dictionary mapping file names to their full paths
        """
        if output_dir is None:
            repo_root = Path(__file__).resolve().parents[2]
            output_dir = repo_root / 'output' / case_id
        else:
            output_dir = Path(output_dir) / case_id

        output_dir.mkdir(parents=True, exist_ok=True)

        generated_files = {}

        # Industry-Disruptive: Resolve Legal Citations for Documentation
        from app.regulatory import get_citations as resolve_citations
        for flag in flags:
            cites = flag.get('legal_citations', [])
            if cites:
                flag['resolved_citations'] = resolve_citations(cites)

        # Prepare template context
        context = {
            'case_id': case_id,
            'generated_date': datetime.now().strftime('%Y-%m-%d'),
            'generated_datetime': datetime.now().isoformat(),
            'fields': verified_fields,
            'flags': flags,
            'consumer': consumer_info or {},
            'has_high_severity': any(f.get('severity') == 'high' for f in flags),
            'has_flags': len(flags) > 0,
            'flag_count': len(flags),
            'high_severity_count': sum(1 for f in flags if f.get('severity') == 'high'),
            'medium_severity_count': sum(1 for f in flags if f.get('severity') == 'medium'),
            'low_severity_count': sum(1 for f in flags if f.get('severity') == 'low'),
        }

        # Generate case.yaml
        case_yaml_path = output_dir / 'case.yaml'
        case_data = {
            'case_id': case_id,
            'generated': context['generated_datetime'],
            'verified_fields': verified_fields,
            'consumer_info': consumer_info or {},
            'summary': {
                'total_flags': len(flags),
                'high_severity': context['high_severity_count'],
                'medium_severity': context['medium_severity_count'],
                'low_severity': context['low_severity_count']
            }
        }
        with open(case_yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(case_data, f, default_flow_style=False, allow_unicode=True)
        generated_files['case.yaml'] = str(case_yaml_path)

        # Generate flags.json
        flags_json_path = output_dir / 'flags.json'
        with open(flags_json_path, 'w', encoding='utf-8') as f:
            json.dump({
                'case_id': case_id,
                'generated': context['generated_datetime'],
                'flags': flags
            }, f, indent=2)
        generated_files['flags.json'] = str(flags_json_path)

        # Generate packet_summary.md
        summary_path = output_dir / 'packet_summary.md'
        summary_template = self.env.get_template('packet_summary.md.j2')
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary_template.render(context))
        generated_files['packet_summary.md'] = str(summary_path)

        # Generate bureau dispute letter
        bureau_letter_path = output_dir / 'bureau_dispute_letter.md'
        bureau_template = self.env.get_template('bureau_dispute_letter.md.j2')
        with open(bureau_letter_path, 'w', encoding='utf-8') as f:
            f.write(bureau_template.render(context))
        generated_files['bureau_dispute_letter.md'] = str(bureau_letter_path)

        # Generate furnisher dispute letter
        furnisher_letter_path = output_dir / 'furnisher_dispute_letter.md'
        furnisher_template = self.env.get_template('furnisher_dispute_letter.md.j2')
        with open(furnisher_letter_path, 'w', encoding='utf-8') as f:
            f.write(furnisher_template.render(context))
        generated_files['furnisher_dispute_letter.md'] = str(furnisher_letter_path)

        # Generate attachments checklist
        checklist_path = output_dir / 'attachments_checklist.md'
        checklist_template = self.env.get_template('attachments_checklist.md.j2')
        with open(checklist_path, 'w', encoding='utf-8') as f:
            f.write(checklist_template.render(context))
        generated_files['attachments_checklist.md'] = str(checklist_path)

        # Generate timeline forensic report
        timeline_report_path = output_dir / 'forensic_timeline_report.md'
        timeline_template = self.env.get_template('timeline_report.md.j2')
        
        # Calculate variance for the report
        if verified_fields.get('dofd') and verified_fields.get('estimated_removal_date'):
            from app.utils import estimate_removal_date as est_rem
            calc_rem = est_rem(verified_fields['dofd'])
            if calc_rem:
                try:
                    d1 = datetime.strptime(calc_rem, '%Y-%m-%d')
                    d2 = datetime.strptime(verified_fields['estimated_removal_date'], '%Y-%m-%d')
                    context['variance_days'] = (d2 - d1).days
                except:
                    context['variance_days'] = None
        
        with open(timeline_report_path, 'w', encoding='utf-8') as f:
            f.write(timeline_template.render(context))
        generated_files['forensic_timeline_report.md'] = str(timeline_report_path)

        # Generate debt validation letter (only for collections)

        if verified_fields.get('account_type') == 'collection':
            val_letter_path = output_dir / 'debt_validation_letter.md'
            val_template = self.env.get_template('debt_validation_letter.md.j2')
            with open(val_letter_path, 'w', encoding='utf-8') as f:
                f.write(val_template.render(context))
            generated_files['debt_validation_letter.md'] = str(val_letter_path)

        return generated_files

    def create_zip(
        self,
        case_id: str,
        generated_files: Dict[str, str],
        output_dir: str = None
    ) -> str:
        """
        Create a ZIP archive of all generated files.

        Args:
            case_id: Case identifier
            generated_files: Dictionary of generated file paths
            output_dir: Output directory for ZIP file

        Returns:
            Path to the created ZIP file
        """
        if output_dir is None:
            repo_root = Path(__file__).resolve().parents[2]
            output_dir = repo_root / 'output'
        else:
            output_dir = Path(output_dir)

        zip_filename = f"{case_id}_packet.zip"
        zip_path = output_dir / zip_filename

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for filename, filepath in generated_files.items():
                # Add file to ZIP with just the filename (no path)
                zipf.write(filepath, arcname=f"{case_id}/{filename}")

        return str(zip_path)


def generate_dispute_packet(
    verified_fields: Dict[str, Any],
    flags: List[Dict[str, Any]],
    consumer_info: Optional[Dict[str, str]] = None,
    case_id: Optional[str] = None,
    output_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience function to generate a complete dispute packet.

    Args:
        verified_fields: Dictionary of verified field values
        flags: List of rule violation flags
        consumer_info: Optional consumer information
        case_id: Optional case ID (generated if not provided)
        output_dir: Optional output directory

    Returns:
        Dictionary with case_id, generated_files, and zip_path
    """
    if case_id is None:
        case_id = generate_case_id()

    generator = PacketGenerator()

    # Generate all files
    generated_files = generator.generate_packet(
        case_id=case_id,
        verified_fields=verified_fields,
        flags=flags,
        consumer_info=consumer_info,
        output_dir=output_dir
    )

    # Create ZIP
    # Get the parent directory of the case folder for the ZIP
    if output_dir:
        zip_output_dir = output_dir
    else:
        repo_root = Path(__file__).resolve().parents[2]
        zip_output_dir = repo_root / 'output'

    zip_path = generator.create_zip(
        case_id=case_id,
        generated_files=generated_files,
        output_dir=zip_output_dir
    )

    return {
        'case_id': case_id,
        'generated_files': generated_files,
        'zip_path': zip_path,
        'output_directory': str(Path(list(generated_files.values())[0]).parent)
    }
