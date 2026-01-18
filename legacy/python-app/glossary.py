"""
Glossary of credit reporting and debt collection terms.
"""

from typing import Dict

GLOSSARY: Dict[str, Dict[str, str]] = {
    "DOFD": {
        "term": "Date of First Delinquency",
        "definition": "The date the account first became delinquent and was never again brought current. This is the 'anchor date' that starts the 7-year credit reporting clock."
    },
    "Re-Aging": {
        "term": "Illegal Debt Re-Aging",
        "definition": "The illegal practice of changing the DOFD to a more recent date to keep a negative item on a credit report longer than the 7-year legal limit."
    },
    "Metro2": {
        "term": "Metro2 Reporting Standard",
        "definition": "The industry-standard data format used by creditors to report consumer credit information to the bureaus. It has strict rules for data integrity."
    },
    "SOL": {
        "term": "Statute of Limitations",
        "definition": "The state-defined time limit for how long a creditor has the legal right to sue you to collect a debt. This is different from the 7-year credit reporting limit."
    },
    "Waterfall": {
        "term": "Multiple Collector Waterfall",
        "definition": "A pattern where a single debt is sold or transferred to multiple different collection agencies over time, often resulting in multiple negative entries."
    },
    "Charge-Off": {
        "term": "Charge-Off",
        "definition": "When a creditor writes off a debt as a loss after approximately 180 days of non-payment. This is a negative status but does not mean the debt is forgiven."
    },
    "Furnisher": {
        "term": "Data Furnisher",
        "definition": "The company (bank, collector, utility) that 'furnishes' or sends your account information to the credit bureaus."
    },
    "Zombie Debt": {
        "term": "Zombie Debt",
        "definition": "Old debt that has been purchased by a debt buyer for pennies on the dollar, often after the statute of limitations has expired, in an attempt to revive collection."
    }
}

def get_glossary_markdown() -> str:
    """Generate markdown for the glossary."""
    md = "# Credit Analysis Glossary\n\n"
    for key in sorted(GLOSSARY.keys()):
        item = GLOSSARY[key]
        md += f"### {item['term']}\n"
        md += f"{item['definition']}\n\n"
    return md
