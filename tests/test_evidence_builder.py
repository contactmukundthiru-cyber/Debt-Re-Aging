import pytest
from app.evidence_builder import EvidenceBuilder, generate_text_export

def test_evidence_builder_init():
    builder = EvidenceBuilder()
    assert builder.exhibit_counter['A'] == 0

def test_identify_defendants():
    builder = EvidenceBuilder()
    fields = {
        'furnisher_or_collector': 'Bad Bank',
        'original_creditor': 'Good Bank'
    }
    defendants = builder.identify_defendants(fields, [])
    names = [d['name'] for d in defendants]
    assert 'Bad Bank' in names
    assert 'Good Bank' in names
    assert 'Experian' in names

def test_build_timeline():
    builder = EvidenceBuilder()
    fields = {
        'date_opened': '2020-01-01',
        'dofd': '2021-01-01'
    }
    timeline = builder.build_timeline(fields, [])
    assert len(timeline) >= 2
    assert timeline[0]['event'] == 'Account Opened'

def test_build_packet():
    builder = EvidenceBuilder()
    case_id = "EVD-123"
    consumer_info = {'name': 'John Doe', 'state': 'NY'}
    fields = {'furnisher_or_collector': 'Bank', 'dofd': '2020-01-01'}
    flags = [{'rule_id': 'B1', 'severity': 'high', 'rule_name': 'Re-aging'}]
    
    packet = builder.build_packet(case_id, consumer_info, fields, flags)
    assert packet.case_id == case_id
    assert packet.consumer_name == 'John Doe'
    assert len(packet.evidence_items) > 0
    assert len(packet.recommended_causes_of_action) > 0

def test_generate_text_export():
    builder = EvidenceBuilder()
    packet = builder.build_packet("ID", {'name': 'John'}, {}, [])
    text = generate_text_export(packet)
    assert "EVIDENCE PACKET" in text
    assert "John" in text
