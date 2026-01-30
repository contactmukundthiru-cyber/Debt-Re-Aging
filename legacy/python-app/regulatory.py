"""
Regulatory Reference Engine
Maps reporting errors to specific sections of FCRA, FDCPA, and CFPB Bulletins.
Provides legally potent citations for dispute documentation.
"""

from typing import Dict, List, Optional

REGULATORY_MAP = {
    "FCRA_605": {
        "title": "FCRA § 605 (15 U.S.C. § 1681c)",
        "citation": "15 U.S.C. § 1681c",
        "description": "Requirements relating to information contained in consumer reports.",
        "subsections": {
            "a": "General prohibition of reporting obsolete information (negative items > 7 years).",
            "c1": "Date of first delinquency (DOFD) must be reported within 90 days of an account being charged off or sent to collections."
        }
    },
    "FCRA_611": {
        "title": "FCRA § 611 (15 U.S.C. § 1681i)",
        "citation": "15 U.S.C. § 1681i",
        "description": "Procedure in case of disputed accuracy.",
        "subsections": {
            "a": "Duty to conduct a reasonable investigation of disputed information."
        }
    },
    "FCRA_616": {
        "title": "FCRA § 616 (15 U.S.C. § 1681n)",
        "citation": "15 U.S.C. § 1681n",
        "description": "Civil liability for willful noncompliance.",
        "detail": "Establishes liability for statutory and punitive damages, plus legal fees, for willful violations like intentional debt re-aging."
    },
    "METRO2": {
        "title": "CDIA Metro2 Reporting Standards",
        "citation": "Metro2 Technical Guide",
        "description": "Standardized industry format for consumer credit reporting.",
        "subsections": {
            "BASE": "Requirement for logical consistency in Base Segment fields (DOFD/Status).",
            "J2": "Rules for reporting associated parties and bankruptcy indicators."
        }
    },
    "FCRA_623": {
        "title": "FCRA § 623 (15 U.S.C. § 1681s-2)",
        "citation": "15 U.S.C. § 1681s-2",
        "description": "Responsibilities of furnishers of information to consumer reporting agencies.",
        "subsections": {
            "a1": "Prohibition against reporting inaccurate information.",
            "a5": "Requirement to provide notice of delinquency (DOFD) within 90 days.",
            "b": "Duty to conduct a reasonable investigation upon notice of dispute."
        }
    },
    "FDCPA_807": {
        "title": "FDCPA § 807 (15 U.S.C. § 1692e)",
        "citation": "15 U.S.C. § 1692e",
        "description": "Prohibition against false or misleading representations.",
        "subsections": {
            "2A": "False representation of the character, amount, or legal status of any debt.",
            "8": "Communicating or threatening to communicate to any person credit information which is known or which should be known to be false, including the failure to communicate that a disputed debt is disputed."
        }
    },
    "CFPB_2022_01": {
        "title": "CFPB Bulletin 2022-01",
        "citation": "CFPB Bulletin 2022-01",
        "description": "Compliance obligations of consumer reporting agencies and furnishers regarding medical debt reporting.",
        "detail": "Prohibits reporting of medical debt that is less than one year old or has been paid."
    }
}

def get_citations(citation_keys: List[str]) -> List[Dict[str, str]]:
    """Resolve a list of citation keys (e.g. ['FCRA_605_a']) into full data objects."""
    resolved = []
    for key in citation_keys:
        parts = key.split('_')
        if len(parts) < 2: continue
        
        base_key = f"{parts[0]}_{parts[1]}"
        sub_key = parts[2] if len(parts) > 2 else None
        
        if base_key in REGULATORY_MAP:
            base_data = REGULATORY_MAP[base_key]
            text = base_data['description']
            if sub_key and 'subsections' in base_data and sub_key in base_data['subsections']:
                text = base_data['subsections'][sub_key]
            
            resolved.append({
                'key': key,
                'title': base_data['title'],
                'citation': base_data['citation'],
                'text': text
            })
    return resolved
