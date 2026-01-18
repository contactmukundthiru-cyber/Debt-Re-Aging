"""
Creditor/Collector Database Module
Known debt collectors, name variations, and CFPB complaint data

Provides fuzzy matching and enrichment for collector identification.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from difflib import SequenceMatcher


@dataclass
class CollectorInfo:
    """Information about a known debt collector."""
    canonical_name: str
    aliases: List[str]
    address: str
    phone: str
    website: str
    cfpb_complaint_count: int
    cfpb_complaint_url: str
    known_violations: List[str]
    notes: str
    last_updated: str


# Known debt collectors database
# This would ideally be loaded from a regularly updated external file
KNOWN_COLLECTORS: Dict[str, CollectorInfo] = {
    "PORTFOLIO_RECOVERY": CollectorInfo(
        canonical_name="Portfolio Recovery Associates, LLC",
        aliases=[
            "portfolio recovery", "pra", "portfolio recovery associates",
            "pra group", "pra llc", "portfolio recovery assoc"
        ],
        address="120 Corporate Blvd, Norfolk, VA 23502",
        phone="1-800-772-1413",
        website="https://www.portfoliorecovery.com",
        cfpb_complaint_count=15420,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=PORTFOLIO%20RECOVERY%20ASSOCIATES",
        known_violations=["Re-aging", "Failure to validate", "Inaccurate reporting"],
        notes="One of the largest debt buyers in the US",
        last_updated="2024-01-01"
    ),

    "MIDLAND_CREDIT": CollectorInfo(
        canonical_name="Midland Credit Management, Inc.",
        aliases=[
            "midland credit", "mcm", "midland credit management",
            "midland funding", "midland funding llc", "mcm inc"
        ],
        address="350 Camino De La Reina, San Diego, CA 92108",
        phone="1-800-296-2657",
        website="https://www.midlandcredit.com",
        cfpb_complaint_count=12350,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=MIDLAND%20CREDIT%20MANAGEMENT",
        known_violations=["Re-aging", "Suing on time-barred debt", "Robo-signing"],
        notes="Subsidiary of Encore Capital Group",
        last_updated="2024-01-01"
    ),

    "LVNV_FUNDING": CollectorInfo(
        canonical_name="LVNV Funding LLC",
        aliases=[
            "lvnv", "lvnv funding", "lvnv funding llc",
            "resurgent capital services"
        ],
        address="2021 Midway Road, Suite 200, Carrollton, TX 75006",
        phone="1-866-771-3005",
        website="",
        cfpb_complaint_count=8920,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=LVNV%20FUNDING",
        known_violations=["Re-aging", "Lack of documentation", "Inaccurate balances"],
        notes="Uses Resurgent Capital Services for collection",
        last_updated="2024-01-01"
    ),

    "CAVALRY_SPV": CollectorInfo(
        canonical_name="Cavalry SPV I, LLC",
        aliases=[
            "cavalry", "cavalry spv", "cavalry portfolio services",
            "cavalry spv i", "cavalry investments"
        ],
        address="500 Summit Lake Drive, Valhalla, NY 10595",
        phone="1-800-930-5844",
        website="",
        cfpb_complaint_count=5670,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=CAVALRY%20SPV",
        known_violations=["Re-aging", "TCPA violations"],
        notes="",
        last_updated="2024-01-01"
    ),

    "CONVERGENT": CollectorInfo(
        canonical_name="Convergent Outsourcing, Inc.",
        aliases=[
            "convergent", "convergent outsourcing", "convergent revenue cycle",
            "convergent healthcare"
        ],
        address="19111 Dallas Pkwy, Dallas, TX 75287",
        phone="1-800-444-8485",
        website="https://www.convergentusa.com",
        cfpb_complaint_count=3240,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=CONVERGENT",
        known_violations=["Medical debt issues", "HIPAA concerns"],
        notes="Specializes in medical debt collection",
        last_updated="2024-01-01"
    ),

    "ENHANCED_RECOVERY": CollectorInfo(
        canonical_name="Enhanced Recovery Company, LLC",
        aliases=[
            "erc", "enhanced recovery", "enhanced recovery company",
            "erc llc"
        ],
        address="8014 Bayberry Road, Jacksonville, FL 32256",
        phone="1-800-790-2444",
        website="https://www.ercbpo.com",
        cfpb_complaint_count=4120,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=ENHANCED%20RECOVERY",
        known_violations=["Telecommunications debt", "Failure to validate"],
        notes="Common collector for telecom debts",
        last_updated="2024-01-01"
    ),

    "IC_SYSTEM": CollectorInfo(
        canonical_name="I.C. System, Inc.",
        aliases=[
            "ic system", "i.c. system", "ics", "i c system"
        ],
        address="444 Highway 96 E, St Paul, MN 55164",
        phone="1-800-279-3511",
        website="https://www.icsystem.com",
        cfpb_complaint_count=2890,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=IC%20SYSTEM",
        known_violations=["Medical debt", "Utility debt"],
        notes="Often collects medical and utility debts",
        last_updated="2024-01-01"
    ),

    "TRANSWORLD": CollectorInfo(
        canonical_name="Transworld Systems Inc.",
        aliases=[
            "transworld", "tsi", "transworld systems", "transworld systems inc"
        ],
        address="2 Bethesda Metro Center, Bethesda, MD 20814",
        phone="1-800-261-9734",
        website="https://www.transworldsystems.com",
        cfpb_complaint_count=3560,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=TRANSWORLD%20SYSTEMS",
        known_violations=["Student loan debt", "Medical debt"],
        notes="Large student loan and medical debt collector",
        last_updated="2024-01-01"
    ),

    "CAPITAL_ONE": CollectorInfo(
        canonical_name="Capital One",
        aliases=[
            "capital one", "cap one", "capital one bank", "capital one na",
            "capital one financial", "cofs"
        ],
        address="1680 Capital One Dr, McLean, VA 22102",
        phone="1-800-955-7070",
        website="https://www.capitalone.com",
        cfpb_complaint_count=18900,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=CAPITAL%20ONE",
        known_violations=[],
        notes="Major credit card issuer - often original creditor",
        last_updated="2024-01-01"
    ),

    "SYNCHRONY": CollectorInfo(
        canonical_name="Synchrony Bank",
        aliases=[
            "synchrony", "synchrony bank", "synchrony financial",
            "ge capital", "ge money bank"
        ],
        address="170 Election Road, Draper, UT 84020",
        phone="1-866-419-4096",
        website="https://www.synchrony.com",
        cfpb_complaint_count=12400,
        cfpb_complaint_url="https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=SYNCHRONY",
        known_violations=[],
        notes="Store credit card issuer (Amazon, Walmart, etc.) - often original creditor",
        last_updated="2024-01-01"
    )
}


def normalize_name(name: str) -> str:
    """Normalize a collector name for matching."""
    if not name:
        return ""

    # Convert to lowercase
    name = name.lower()

    # Remove common suffixes
    suffixes = [
        r'\s*,?\s*(llc|inc|corp|corporation|company|co|ltd|lp|llp|na|n\.a\.)\.?$',
        r'\s*,?\s*(incorporated|limited)$'
    ]
    for suffix in suffixes:
        name = re.sub(suffix, '', name, flags=re.IGNORECASE)

    # Remove punctuation
    name = re.sub(r'[^\w\s]', '', name)

    # Remove extra whitespace
    name = ' '.join(name.split())

    return name.strip()


def fuzzy_match(name1: str, name2: str) -> float:
    """Calculate similarity ratio between two names."""
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)
    return SequenceMatcher(None, n1, n2).ratio()


def identify_collector(name: str, threshold: float = 0.7) -> Optional[Tuple[str, CollectorInfo, float]]:
    """
    Identify a collector from the database using fuzzy matching.

    Args:
        name: The collector name to look up
        threshold: Minimum similarity score (0-1)

    Returns:
        Tuple of (collector_key, CollectorInfo, confidence) or None
    """
    if not name:
        return None

    normalized = normalize_name(name)
    best_match = None
    best_score = 0

    for key, info in KNOWN_COLLECTORS.items():
        # Check canonical name
        score = fuzzy_match(normalized, info.canonical_name)
        if score > best_score:
            best_score = score
            best_match = (key, info)

        # Check aliases
        for alias in info.aliases:
            score = fuzzy_match(normalized, alias)
            if score > best_score:
                best_score = score
                best_match = (key, info)

    if best_match and best_score >= threshold:
        return (best_match[0], best_match[1], best_score)

    return None


def get_collector_info(name: str) -> Optional[Dict]:
    """
    Get enriched information about a collector.

    Returns a dictionary with collector details or None if not found.
    """
    result = identify_collector(name)
    if not result:
        return None

    key, info, confidence = result
    return {
        'canonical_name': info.canonical_name,
        'match_confidence': confidence,
        'address': info.address,
        'phone': info.phone,
        'website': info.website,
        'cfpb_complaints': info.cfpb_complaint_count,
        'cfpb_url': info.cfpb_complaint_url,
        'known_violations': info.known_violations,
        'notes': info.notes
    }


def get_known_violations(name: str) -> List[str]:
    """Get known violation patterns for a collector."""
    result = identify_collector(name)
    if result:
        return result[1].known_violations
    return []


def enrich_case_with_collector_info(fields: Dict) -> Dict:
    """
    Enrich case fields with collector database information.

    Adds collector_info to the fields if a match is found.
    """
    collector_name = fields.get('furnisher_or_collector', {})
    if isinstance(collector_name, dict):
        collector_name = collector_name.get('value', '')

    if collector_name:
        info = get_collector_info(collector_name)
        if info:
            fields['collector_database_match'] = info

    return fields


def search_collectors(query: str, limit: int = 10) -> List[Dict]:
    """
    Search the collector database.

    Returns a list of matching collectors with scores.
    """
    results = []
    normalized_query = normalize_name(query)

    for key, info in KNOWN_COLLECTORS.items():
        best_score = fuzzy_match(normalized_query, info.canonical_name)

        for alias in info.aliases:
            score = fuzzy_match(normalized_query, alias)
            if score > best_score:
                best_score = score

        if best_score > 0.3:  # Minimum threshold for search
            results.append({
                'key': key,
                'name': info.canonical_name,
                'score': best_score,
                'cfpb_complaints': info.cfpb_complaint_count
            })

    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:limit]


def get_collector_address(name: str) -> Optional[str]:
    """Get the mailing address for a collector."""
    result = identify_collector(name)
    if result and result[1].address:
        return result[1].address
    return None


def get_all_collectors() -> List[Dict]:
    """Get all collectors in the database."""
    return [
        {
            'key': key,
            'name': info.canonical_name,
            'aliases': info.aliases,
            'cfpb_complaints': info.cfpb_complaint_count
        }
        for key, info in KNOWN_COLLECTORS.items()
    ]


# Bureau addresses (for dispute letters)
BUREAU_ADDRESSES = {
    'Experian': {
        'name': 'Experian',
        'dispute_address': 'Experian\nP.O. Box 4500\nAllen, TX 75013',
        'phone': '1-888-397-3742',
        'website': 'https://www.experian.com/disputes',
        'online_dispute': 'https://www.experian.com/disputes/main.html'
    },
    'Equifax': {
        'name': 'Equifax Information Services LLC',
        'dispute_address': 'Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374',
        'phone': '1-866-349-5191',
        'website': 'https://www.equifax.com/personal/disputes/',
        'online_dispute': 'https://my.equifax.com/consumer-registration/UCSC/#/personal-info'
    },
    'TransUnion': {
        'name': 'TransUnion LLC',
        'dispute_address': 'TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016',
        'phone': '1-800-916-8800',
        'website': 'https://www.transunion.com/credit-disputes',
        'online_dispute': 'https://www.transunion.com/credit-disputes/dispute-your-credit'
    }
}


def get_bureau_info(bureau_name: str) -> Optional[Dict]:
    """Get bureau contact information."""
    # Normalize the bureau name
    bureau_name = bureau_name.strip().title()

    if bureau_name in BUREAU_ADDRESSES:
        return BUREAU_ADDRESSES[bureau_name]

    # Try fuzzy match
    for key in BUREAU_ADDRESSES:
        if key.lower() in bureau_name.lower() or bureau_name.lower() in key.lower():
            return BUREAU_ADDRESSES[key]

    return None
