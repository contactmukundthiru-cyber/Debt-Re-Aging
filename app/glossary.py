"""
Legal Glossary Module
Provides definitions and tooltips for legal and credit-related terms

This module helps users understand complex terminology used in credit reporting.
"""

from typing import Dict, Optional, List
from dataclasses import dataclass


@dataclass
class GlossaryTerm:
    """A glossary term with definition and related information."""
    term: str
    short_definition: str
    full_definition: str
    related_terms: List[str]
    legal_reference: Optional[str] = None
    example: Optional[str] = None
    spanish_term: Optional[str] = None
    spanish_definition: Optional[str] = None


# Comprehensive glossary of credit and debt collection terms
GLOSSARY: Dict[str, GlossaryTerm] = {
    "dofd": GlossaryTerm(
        term="Date of First Delinquency (DOFD)",
        short_definition="When you first fell behind on payments and never caught up.",
        full_definition="""The Date of First Delinquency (DOFD) is the critical date that determines
how long a negative item can remain on your credit report. It's the date when you first
became delinquent on an account and never brought it current again. Under the FCRA, most
negative items must be removed 7 years from this date, regardless of how many times the
debt is sold or transferred.""",
        related_terms=["removal_date", "fcra", "reaging", "collection"],
        legal_reference="15 U.S.C. § 1681c(c)",
        example="If you stopped paying a credit card in March 2018 and never caught up, March 2018 is your DOFD, and the account must be removed by March 2025.",
        spanish_term="Fecha de Primera Morosidad",
        spanish_definition="La fecha en que se atrasó por primera vez en los pagos y nunca se puso al día."
    ),

    "fcra": GlossaryTerm(
        term="Fair Credit Reporting Act (FCRA)",
        short_definition="Federal law protecting your credit report rights.",
        full_definition="""The Fair Credit Reporting Act (FCRA) is a federal law enacted in 1970 that
regulates the collection, dissemination, and use of consumer credit information. Key protections include:
- Right to know what's in your credit file
- Right to dispute inaccurate information
- Right to have inaccurate information corrected or deleted
- Right to have negative information removed after 7 years (10 for bankruptcies)
- Right to sue for violations""",
        related_terms=["credit_bureau", "dispute", "furnisher"],
        legal_reference="15 U.S.C. § 1681 et seq.",
        example="Under the FCRA, if you dispute an item on your credit report, the bureau must investigate within 30 days.",
        spanish_term="Ley de Informe Justo de Crédito",
        spanish_definition="Ley federal que protege sus derechos de informe de crédito."
    ),

    "fdcpa": GlossaryTerm(
        term="Fair Debt Collection Practices Act (FDCPA)",
        short_definition="Federal law limiting what debt collectors can do.",
        full_definition="""The Fair Debt Collection Practices Act (FDCPA) is a federal law that prohibits
debt collectors from using abusive, unfair, or deceptive practices. Key protections include:
- No calls before 8am or after 9pm
- No harassment or threats
- Right to request debt validation
- Right to dispute the debt
- Right to tell collectors to stop contacting you
- Prohibits false or misleading representations""",
        related_terms=["debt_validation", "collection", "collector"],
        legal_reference="15 U.S.C. § 1692 et seq.",
        example="A collector calling you 10 times a day or threatening arrest for non-payment violates the FDCPA.",
        spanish_term="Ley de Prácticas Justas de Cobro de Deudas",
        spanish_definition="Ley federal que limita lo que los cobradores de deudas pueden hacer."
    ),

    "sol": GlossaryTerm(
        term="Statute of Limitations (SOL)",
        short_definition="Time limit for a creditor to sue you for a debt.",
        full_definition="""The Statute of Limitations (SOL) is the legal time limit during which a creditor
or collector can sue you to collect a debt. Important points:
- Varies by state (typically 3-6 years, but can range from 2-15 years)
- Varies by type of debt (credit cards, medical, oral agreements, etc.)
- After SOL expires, debt becomes "time-barred"
- Making a payment or acknowledging the debt can restart the SOL in some states
- SOL is DIFFERENT from the credit reporting period (7 years)""",
        related_terms=["dofd", "debt_validation", "time_barred"],
        legal_reference="Varies by state",
        example="In California, the SOL for credit card debt is 4 years. If you haven't paid since 2019, they can't sue you after 2023.",
        spanish_term="Estatuto de Limitaciones",
        spanish_definition="Límite de tiempo para que un acreedor lo demande por una deuda."
    ),

    "furnisher": GlossaryTerm(
        term="Furnisher",
        short_definition="Any company that reports your info to credit bureaus.",
        full_definition="""A furnisher is any entity that provides information about consumers to credit
reporting agencies (bureaus). This includes:
- Original creditors (credit card companies, banks, lenders)
- Collection agencies
- Debt buyers
- Property managers/landlords
- Utility companies
Furnishers have legal obligations under the FCRA to report accurate information and investigate disputes.""",
        related_terms=["credit_bureau", "fcra", "dispute"],
        legal_reference="15 U.S.C. § 1681s-2",
        example="When Capital One reports your payment history to Experian, Capital One is acting as a furnisher.",
        spanish_term="Proveedor de Información",
        spanish_definition="Cualquier empresa que reporta su información a los burós de crédito."
    ),

    "reaging": GlossaryTerm(
        term="Debt Re-aging",
        short_definition="Illegal manipulation of dates to extend reporting time.",
        full_definition="""Debt re-aging is a deceptive and illegal practice where a debt collector
or furnisher manipulates dates on a credit report to make a debt appear more recent than it
actually is. Common re-aging tactics include:
- Reporting a new "date opened" when the debt is sold
- Changing the DOFD to a later date
- Reporting the "date of last activity" as if it were the DOFD
This extends how long the negative item stays on your credit report beyond the legal limit.""",
        related_terms=["dofd", "fcra", "collection", "removal_date"],
        legal_reference="15 U.S.C. § 1681c(c)",
        example="A collector buys your 2017 debt in 2023 and reports 2023 as the 'date opened' - this is illegal re-aging.",
        spanish_term="Re-envejecimiento de Deuda",
        spanish_definition="Manipulación ilegal de fechas para extender el tiempo de reporte."
    ),

    "credit_bureau": GlossaryTerm(
        term="Credit Bureau (CRA)",
        short_definition="Companies that compile and sell your credit information.",
        full_definition="""Credit bureaus, also called Credit Reporting Agencies (CRAs), are companies
that collect and maintain consumer credit information. The three major bureaus are:
- Experian
- Equifax
- TransUnion
They sell this information to lenders, landlords, employers, and others to help make decisions
about you. Under the FCRA, you have the right to free annual reports from each bureau.""",
        related_terms=["fcra", "furnisher", "dispute"],
        legal_reference="15 U.S.C. § 1681a(f)",
        example="When you apply for a mortgage, the lender pulls your credit report from one or more bureaus.",
        spanish_term="Buró de Crédito",
        spanish_definition="Empresas que compilan y venden su información de crédito."
    ),

    "collection": GlossaryTerm(
        term="Collection Account",
        short_definition="A debt that's been sent to a collection agency.",
        full_definition="""A collection account appears on your credit report when an original creditor
gives up on collecting a debt and sells or assigns it to a collection agency. Key points:
- Usually happens after 120-180 days of non-payment
- Creates a separate negative entry on your credit report
- The original account may also show as charged-off
- Collection accounts significantly impact credit scores
- Must be removed 7 years from the original DOFD, not from when collections started""",
        related_terms=["charge_off", "dofd", "debt_buyer"],
        legal_reference="15 U.S.C. § 1681c(a)",
        example="Your unpaid $500 medical bill from 2020 was sent to ABC Collections in 2021. Both may appear on your report.",
        spanish_term="Cuenta de Cobranza",
        spanish_definition="Una deuda que ha sido enviada a una agencia de cobranza."
    ),

    "charge_off": GlossaryTerm(
        term="Charge-Off",
        short_definition="When a creditor writes off your debt as a loss.",
        full_definition="""A charge-off occurs when a creditor determines that a debt is unlikely to be
collected and writes it off as a loss for accounting purposes. Important facts:
- Typically happens after 180 days of non-payment
- Does NOT mean you no longer owe the debt
- The creditor can still collect or sell the debt
- Shows as a serious negative item on your credit report
- Must be removed 7 years from the DOFD""",
        related_terms=["collection", "dofd", "furnisher"],
        legal_reference="15 U.S.C. § 1681c(a)",
        example="After 6 months of missed payments, your credit card company charges off your $2,000 balance.",
        spanish_term="Cancelación Contable",
        spanish_definition="Cuando un acreedor cancela su deuda como pérdida."
    ),

    "debt_validation": GlossaryTerm(
        term="Debt Validation",
        short_definition="Your right to demand proof that you owe a debt.",
        full_definition="""Debt validation is your legal right under the FDCPA to request proof that:
- The debt exists
- You owe the debt
- The amount is correct
- The collector has the right to collect it
You must request validation within 30 days of first contact. The collector must stop
collection efforts until they provide validation.""",
        related_terms=["fdcpa", "collection", "dispute"],
        legal_reference="15 U.S.C. § 1692g",
        example="A collector calls about an old debt you don't recognize. You send a debt validation letter, and they must prove you owe it.",
        spanish_term="Validación de Deuda",
        spanish_definition="Su derecho a exigir prueba de que debe una deuda."
    ),

    "dispute": GlossaryTerm(
        term="Dispute",
        short_definition="Formally challenging inaccurate credit report information.",
        full_definition="""A dispute is a formal challenge to information in your credit report that
you believe is inaccurate, incomplete, or unverifiable. The process:
1. Submit dispute to credit bureau (online, mail, or phone)
2. Bureau must investigate within 30 days (45 if you submit new info)
3. Bureau contacts the furnisher for verification
4. If unverified, item must be removed or corrected
5. You receive written results of investigation""",
        related_terms=["fcra", "credit_bureau", "furnisher"],
        legal_reference="15 U.S.C. § 1681i",
        example="You notice a collection account with the wrong DOFD. You file a dispute with all three bureaus.",
        spanish_term="Disputa",
        spanish_definition="Desafiar formalmente información inexacta del informe de crédito."
    ),

    "removal_date": GlossaryTerm(
        term="Removal Date",
        short_definition="When negative info must be deleted from your report.",
        full_definition="""The removal date (also called "purge date" or "drop-off date") is when a
negative item must be automatically removed from your credit report. For most items:
- 7 years from the DOFD for collections, charge-offs, late payments
- 7 years from filing date for Chapter 13 bankruptcy
- 10 years for Chapter 7 bankruptcy
- 7 years for tax liens (paid) - unpaid liens may report longer
The removal date should be calculated from the DOFD, not from later events.""",
        related_terms=["dofd", "fcra", "reaging"],
        legal_reference="15 U.S.C. § 1681c(a)",
        example="If your DOFD is January 2018, the removal date is January 2025 (7 years later).",
        spanish_term="Fecha de Eliminación",
        spanish_definition="Cuando la información negativa debe ser eliminada de su informe."
    ),

    "debt_buyer": GlossaryTerm(
        term="Debt Buyer",
        short_definition="Companies that purchase old debts for pennies on the dollar.",
        full_definition="""Debt buyers are companies that purchase delinquent debts from original
creditors or other debt buyers, usually for a fraction of the face value (often 1-10 cents
per dollar). Key issues:
- Often have incomplete documentation
- May not be able to validate debts properly
- Sometimes attempt to collect on debts past the SOL
- May re-age debts illegally
- Have been subject to many consumer protection lawsuits""",
        related_terms=["collection", "debt_validation", "sol"],
        legal_reference="CFPB Debt Collection Rule",
        example="Portfolio Recovery buys your old credit card debt for $50, then tries to collect the full $5,000 from you.",
        spanish_term="Comprador de Deudas",
        spanish_definition="Empresas que compran deudas antiguas por centavos de dólar."
    ),

    "time_barred": GlossaryTerm(
        term="Time-Barred Debt",
        short_definition="A debt too old to sue you for (past SOL).",
        full_definition="""A time-barred debt is one where the statute of limitations has expired,
meaning the creditor can no longer sue you to collect. However:
- The debt doesn't disappear - you may still owe it morally/ethically
- Collectors can still try to collect, just can't sue
- It can still appear on your credit report until the 7-year period ends
- Making a payment may restart the SOL in some states
- Some collectors may mislead you about your legal obligations""",
        related_terms=["sol", "collection", "debt_validation"],
        legal_reference="Varies by state",
        example="Your 2015 debt is past the 4-year SOL in your state. A collector calls but cannot sue you for it.",
        spanish_term="Deuda Prescrita",
        spanish_definition="Una deuda demasiado antigua para demandarlo (pasó el SOL)."
    ),

    "metro2": GlossaryTerm(
        term="Metro 2 Format",
        short_definition="Standard format for reporting data to credit bureaus.",
        full_definition="""Metro 2 is the standardized data format used by furnishers to report
consumer credit information to credit bureaus. It specifies exactly how account information
should be formatted, including:
- Account identification
- Payment history
- Balance information
- Account status
- Date fields (including DOFD)
Understanding Metro 2 can help identify reporting errors and discrepancies.""",
        related_terms=["furnisher", "credit_bureau", "fcra"],
        legal_reference="CDIA Standard",
        example="A furnisher incorrectly codes your account status in Metro 2 format, causing it to appear more negative.",
        spanish_term="Formato Metro 2",
        spanish_definition="Formato estándar para reportar datos a los burós de crédito."
    )
}


def get_term(key: str) -> Optional[GlossaryTerm]:
    """Get a glossary term by its key."""
    return GLOSSARY.get(key.lower())


def get_all_terms() -> Dict[str, GlossaryTerm]:
    """Get all glossary terms."""
    return GLOSSARY.copy()


def get_tooltip(key: str) -> str:
    """Get just the short definition for tooltip use."""
    term = GLOSSARY.get(key.lower())
    if term:
        return term.short_definition
    return ""


def search_terms(query: str) -> List[GlossaryTerm]:
    """Search glossary terms by keyword."""
    query = query.lower()
    results = []
    for key, term in GLOSSARY.items():
        if (query in key.lower() or
            query in term.term.lower() or
            query in term.short_definition.lower() or
            query in term.full_definition.lower()):
            results.append(term)
    return results


def render_tooltip_html(key: str) -> str:
    """Generate HTML for a tooltip-enabled term."""
    term = GLOSSARY.get(key.lower())
    if not term:
        return key

    return f'''<span class="glossary-term" title="{term.short_definition}"
               style="border-bottom: 1px dotted #0066cc; cursor: help;">
               {term.term}</span>'''


def get_terms_for_field(field_name: str) -> List[str]:
    """Get relevant glossary keys for a specific field."""
    field_term_map = {
        'dofd': ['dofd', 'fcra', 'removal_date', 'reaging'],
        'date_of_first_delinquency': ['dofd', 'fcra', 'removal_date', 'reaging'],
        'estimated_removal_date': ['removal_date', 'dofd', 'fcra'],
        'removal_date': ['removal_date', 'dofd', 'fcra'],
        'furnisher': ['furnisher', 'fcra', 'credit_bureau'],
        'furnisher_or_collector': ['furnisher', 'collection', 'debt_buyer'],
        'account_type': ['collection', 'charge_off'],
        'bureau': ['credit_bureau', 'fcra'],
        'original_creditor': ['furnisher', 'charge_off', 'collection'],
    }
    return field_term_map.get(field_name.lower(), [])
