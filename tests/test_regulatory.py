import pytest
from app.regulatory import get_citations, REGULATORY_MAP

def test_get_citations_valid():
    keys = ["FCRA_605_a", "FDCPA_807_8"]
    resolved = get_citations(keys)
    assert len(resolved) == 2
    assert resolved[0]["title"] == "FCRA § 605 (15 U.S.C. § 1681c)"
    assert "General prohibition" in resolved[0]["text"]
    assert resolved[1]["citation"] == "15 U.S.C. § 1692e"

def test_get_citations_base_only():
    keys = ["FCRA_616"]
    resolved = get_citations(keys)
    assert len(resolved) == 1
    assert resolved[0]["text"] == "Civil liability for willful noncompliance."

def test_get_citations_invalid():
    keys = ["INVALID_KEY", "FCRA_999"]
    resolved = get_citations(keys)
    assert len(resolved) == 0

def test_regulatory_map_structure():
    for key, data in REGULATORY_MAP.items():
        assert "title" in data
        assert "citation" in data
        assert "description" in data
