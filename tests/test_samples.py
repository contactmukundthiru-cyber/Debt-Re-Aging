import pytest
import json
from pathlib import Path
from app.parser import parse_credit_report

def test_sample_case_parsing():
    project_root = Path(__file__).parent.parent
    samples_dir = project_root / 'samples'
    
    for i in [1, 2]:
        sample_file = samples_dir / f'sample_case_{i}.json'
        if not sample_file.exists():
            continue
            
        with open(sample_file, 'r') as f:
            sample_data = json.load(f)
            
        raw_text = sample_data.get('raw_text', '')
        if not raw_text:
            continue
            
        parsed = parse_credit_report(raw_text)
        # Verify we extracted at least some fields with confidence
        fields = parsed.to_dict()
        confident_fields = [k for k, v in fields.items() if v['confidence'] in ['High', 'Medium']]
        
        assert len(confident_fields) > 0, f"Sample case {i} failed to parse any confident fields"
