import pytest
import os
import shutil
from pathlib import Path
from app.generator import PacketGenerator, generate_dispute_packet

@pytest.fixture
def temp_output_dir(tmp_path):
    output_dir = tmp_path / "output"
    output_dir.mkdir()
    return str(output_dir)

@pytest.fixture
def sample_data():
    return {
        "verified_fields": {
            "original_creditor": "Test Bank",
            "furnisher_or_collector": "Collection Co",
            "account_type": "collection",
            "current_balance": "1000",
            "dofd": "2020-01-01",
            "estimated_removal_date": "2027-01-01"
        },
        "flags": [
            {
                "rule_id": "A1",
                "rule_name": "Test Rule",
                "severity": "high",
                "explanation": "Test explanation",
                "why_it_matters": "Test why",
                "suggested_evidence": ["Evidence 1"],
                "field_values": {"dofd": "2020-01-01"}
            }
        ],
        "consumer_info": {
            "name": "John Doe",
            "address": "123 Main St"
        }
    }

def test_packet_generator_init():
    generator = PacketGenerator()
    assert generator.templates_dir.exists()
    assert (generator.templates_dir / "packet_summary.md.j2").exists()

def test_format_date(sample_data):
    generator = PacketGenerator()
    assert generator._format_date("2023-05-15") == "May 15, 2023"
    assert generator._format_date("invalid") == "invalid"

def test_generate_packet(temp_output_dir, sample_data):
    case_id = "TEST-123"
    generator = PacketGenerator()
    files = generator.generate_packet(
        case_id=case_id,
        verified_fields=sample_data["verified_fields"],
        flags=sample_data["flags"],
        consumer_info=sample_data["consumer_info"],
        output_dir=temp_output_dir
    )
    
    assert "case.yaml" in files
    assert "flags.json" in files
    assert "packet_summary.md" in files
    assert "bureau_dispute_letter.md" in files
    assert "debt_validation_letter.md" in files # only for collections
    
    for path in files.values():
        assert os.path.exists(path)

def test_generate_dispute_packet_convenience(temp_output_dir, sample_data):
    result = generate_dispute_packet(
        verified_fields=sample_data["verified_fields"],
        flags=sample_data["flags"],
        consumer_info=sample_data["consumer_info"],
        output_dir=temp_output_dir
    )
    
    assert "case_id" in result
    assert "generated_files" in result
    assert "zip_path" in result
    assert os.path.exists(result["zip_path"])
