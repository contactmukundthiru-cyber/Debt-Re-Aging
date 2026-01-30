"""
State Statute of Limitations Database

Contains statute of limitations for debt collection by state.
These are the time limits for filing lawsuits to collect debts,
separate from credit reporting time limits (which are federally regulated).

DISCLAIMER: This is for informational purposes only. Laws change frequently.
Always verify current state laws with a qualified attorney.
"""

from typing import Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class StateSol:
    """Statute of limitations and interest caps for a state."""
    state: str
    state_code: str
    written_contracts: int  # Years
    oral_contracts: int
    promissory_notes: int
    open_accounts: int  # Credit cards typically fall here
    judgment_interest_cap: float = 0.10  # Default 10%
    medical_interest_cap: float = 0.10   # Default 10%
    tolling_statute: str = ""            # Citation for SOL tolling/suspension
    notes: str = ""


# State Statute of Limitations Database
# Sources: State civil procedure codes & interest rate statutes (as of 2024)
STATE_SOL_DATABASE: Dict[str, StateSol] = {
    'AL': StateSol('Alabama', 'AL', 6, 6, 6, 6, 0.075, 0.08, "AL Code § 6-2-10"),
    'AK': StateSol('Alaska', 'AK', 3, 3, 3, 3, 0.105, 0.05, "AK Stat § 09.10.130"),
    'AZ': StateSol('Arizona', 'AZ', 6, 3, 6, 6, 0.10, 0.03, "AZ Rev Stat § 12-501"),
    'AR': StateSol('Arkansas', 'AR', 5, 5, 5, 5, 0.10, 0.06, "AR Code § 16-56-114"),
    'CA': StateSol('California', 'CA', 4, 2, 4, 4, 0.10, 0.05, "CA CCP § 351"),
    'CO': StateSol('Colorado', 'CO', 6, 6, 6, 6, 0.08, 0.08, "CO Rev Stat § 13-80-118"),
    'CT': StateSol('Connecticut', 'CT', 6, 3, 6, 6, 0.10, 0.06, "CT Gen Stat § 52-590"),
    'DE': StateSol('Delaware', 'DE', 3, 3, 3, 3, 0.10, 0.05, "DE Code Tit 10 § 8117"),
    'DC': StateSol('District of Columbia', 'DC', 3, 3, 3, 3, 0.06, 0.06, "DC Code § 12-303"),
    'FL': StateSol('Florida', 'FL', 5, 4, 5, 5, 0.09, 0.09, "FL Stat § 95.051"),
    'GA': StateSol('Georgia', 'GA', 6, 4, 6, 6, 0.07, 0.07, "GA Code § 9-3-94"),
    'HI': StateSol('Hawaii', 'HI', 6, 6, 6, 6, 0.10, 0.10, "HI Rev Stat § 657-18"),
    'ID': StateSol('Idaho', 'ID', 5, 4, 5, 5, 0.12, 0.12, "ID Code § 5-229"),
    'IL': StateSol('Illinois', 'IL', 5, 5, 5, 5, 0.09, 0.05, "IL Comp Stat 5/13-208"),
    'IN': StateSol('Indiana', 'IN', 6, 6, 6, 6, 0.08, 0.08, "IN Code § 34-11-5-1"),
    'IA': StateSol('Iowa', 'IA', 5, 5, 5, 5, 0.05, 0.05, "IA Code § 614.6"),
    'KS': StateSol('Kansas', 'KS', 5, 3, 5, 5, 0.10, 0.10, "KS Stat § 60-517"),
    'KY': StateSol('Kentucky', 'KY', 5, 5, 5, 5, 0.08, 0.08, "KY Rev Stat § 413.190"),
    'LA': StateSol('Louisiana', 'LA', 3, 3, 3, 3, 0.08, 0.08, "LA Civ Code Art 3467"),
    'ME': StateSol('Maine', 'ME', 6, 6, 6, 6, 0.08, 0.08, "ME Rev Stat Tit 14 § 853"),
    'MD': StateSol('Maryland', 'MD', 3, 3, 3, 3, 0.10, 0.06, "MD Code Cts & Jud Proc § 5-202"),
    'MA': StateSol('Massachusetts', 'MA', 6, 6, 6, 6, 0.12, 0.06, "MA Gen Laws Ch 260 § 9"),
    'MI': StateSol('Michigan', 'MI', 6, 6, 6, 6, 0.07, 0.07, "MI Comp Laws § 600.5853"),
    'MN': StateSol('Minnesota', 'MN', 6, 6, 6, 6, 0.06, 0.04, "MN Stat § 541.13"),
    'MS': StateSol('Mississippi', 'MS', 3, 3, 3, 3, 0.08, 0.08, "MS Code § 15-1-63"),
    'MO': StateSol('Missouri', 'MO', 5, 5, 5, 5, 0.09, 0.09, "MO Rev Stat § 516.200"),
    'MT': StateSol('Montana', 'MT', 5, 5, 5, 5, 0.10, 0.10, "MT Code § 27-2-402"),
    'NE': StateSol('Nebraska', 'NE', 5, 4, 5, 5, 0.06, 0.06, "NE Rev Stat § 25-214"),
    'NV': StateSol('Nevada', 'NV', 6, 4, 6, 6, 0.08, 0.0, "NV Rev Stat § 11.300"), # NV medical interest is 0%
    'NH': StateSol('New Hampshire', 'NH', 3, 3, 3, 3, 0.08, 0.08, "NH Rev Stat § 508:9"),
    'NJ': StateSol('New Jersey', 'NJ', 6, 6, 6, 6, 0.06, 0.06, "NJ Stat § 2A:14-22"),
    'NM': StateSol('New Mexico', 'NM', 6, 4, 6, 6, 0.08, 0.08, "NM Stat § 37-1-9"),
    'NY': StateSol('New York', 'NY', 3, 3, 3, 3, 0.09, 0.02, "NY CPLR § 207"), # NY CCFA 2022 reduced SOL to 3 years
    'NC': StateSol('North Carolina', 'NC', 3, 3, 3, 3, 0.08, 0.08, "NC Gen Stat § 1-21"),
    'ND': StateSol('North Dakota', 'ND', 6, 6, 6, 6, 0.06, 0.06, "ND Cent Code § 28-01-32"),
    'OH': StateSol('Ohio', 'OH', 6, 6, 6, 6, 0.05, 0.05, "OH Rev Code § 2305.15"),
    'OK': StateSol('Oklahoma', 'OK', 5, 3, 5, 5, 0.06, 0.06, "OK Stat Tit 12 § 98"),
    'OR': StateSol('Oregon', 'OR', 6, 6, 6, 6, 0.09, 0.09, "OR Rev Stat § 12.150"),
    'PA': StateSol('Pennsylvania', 'PA', 4, 4, 4, 4, 0.06, 0.06, "42 PA Cons Stat § 5532"),
    'RI': StateSol('Rhode Island', 'RI', 10, 10, 10, 10, 0.12, 0.12, "RI Gen Laws § 9-1-18"),
    'SC': StateSol('South Carolina', 'SC', 3, 3, 3, 3, 0.08, 0.08, "SC Code § 15-3-30"),
    'SD': StateSol('South Dakota', 'SD', 6, 6, 6, 6, 0.10, 0.10, "SD Codified Laws § 15-2-20"),
    'TN': StateSol('Tennessee', 'TN', 6, 6, 6, 6, 0.10, 0.10, "TN Code § 28-1-111"),
    'TX': StateSol('Texas', 'TX', 4, 4, 4, 4, 0.06, 0.06, "TX CPRC § 16.063"),
    'UT': StateSol('Utah', 'UT', 6, 4, 6, 6, 0.10, 0.10, "UT Code § 78B-2-104"),
    'VT': StateSol('Vermont', 'VT', 6, 6, 6, 6, 0.12, 0.12, "VT Stat Tit 12 § 552"),
    'VA': StateSol('Virginia', 'VA', 5, 3, 5, 5, 0.06, 0.06, "VA Code § 8.01-229"),
    'WA': StateSol('Washington', 'WA', 6, 3, 6, 6, 0.12, 0.09, "WA Rev Code § 4.16.180"),
    'WV': StateSol('West Virginia', 'WV', 6, 5, 6, 6, 0.07, 0.07, "WV Code § 55-2-17"),
    'WI': StateSol('Wisconsin', 'WI', 6, 6, 6, 6, 0.05, 0.05, "WI Stat § 893.43"),
    'WY': StateSol('Wyoming', 'WY', 8, 8, 8, 8, 0.07, 0.07, "WY Stat § 1-3-116"),
}


def get_state_sol(state_code: str) -> Optional[StateSol]:
    """
    Get statute of limitations for a state.

    Args:
        state_code: Two-letter state code (e.g., 'CA', 'NY')

    Returns:
        StateSol object or None if state not found
    """
    return STATE_SOL_DATABASE.get(state_code.upper())


def check_sol_expired(
    state_code: str,
    dofd: str,
    debt_type: str = 'open_accounts'
) -> Tuple[bool, Optional[int], str]:
    """
    Check if statute of limitations has expired.

    Args:
        state_code: Two-letter state code
        dofd: Date of first delinquency (ISO format)
        debt_type: Type of debt (written_contracts, oral_contracts,
                   promissory_notes, open_accounts)

    Returns:
        Tuple of (is_expired, years_limit, explanation)
    """
    from datetime import datetime
    from app.utils import validate_iso_date

    state_sol = get_state_sol(state_code)
    if not state_sol:
        return False, None, f"State code '{state_code}' not found in database"

    if not validate_iso_date(dofd):
        return False, None, "Invalid date format"

    # Get the appropriate SOL years
    sol_years = getattr(state_sol, debt_type, None)
    if sol_years is None:
        sol_years = state_sol.open_accounts

    try:
        dofd_dt = datetime.strptime(dofd, '%Y-%m-%d')
        now = datetime.now()
        years_elapsed = (now - dofd_dt).days / 365.25

        # Check for potential tolling factors
        tolling_info = f" (Note: Period may be extended under {state_sol.tolling_statute} if certain conditions apply)" if state_sol.tolling_statute else ""

        if years_elapsed > sol_years:
            return True, sol_years, (
                f"The statute of limitations in {state_sol.state} for {debt_type.replace('_', ' ')} "
                f"is {sol_years} years. Based on the DOFD of {dofd}, approximately "
                f"{years_elapsed:.1f} years have elapsed. The SOL may have expired.{tolling_info}"
            )
        else:
            return False, sol_years, (
                f"The statute of limitations in {state_sol.state} is {sol_years} years. "
                f"Approximately {years_elapsed:.1f} years have elapsed since DOFD.{tolling_info}"
            )

    except ValueError:
        return False, None, "Error parsing date"


def get_all_states() -> Dict[str, str]:
    """
    Get all states and their codes.

    Returns:
        Dictionary mapping state codes to state names
    """
    return {code: sol.state for code, sol in STATE_SOL_DATABASE.items()}


def get_sol_summary(state_code: str) -> Optional[str]:
    """
    Get a human-readable summary of SOL for a state.

    Args:
        state_code: Two-letter state code

    Returns:
        Formatted string with SOL information
    """
    sol = get_state_sol(state_code)
    if not sol:
        return None

    return f"""
Statute of Limitations for {sol.state} ({sol.state_code}):
- Written Contracts: {sol.written_contracts} years
- Oral Contracts: {sol.oral_contracts} years
- Promissory Notes: {sol.promissory_notes} years
- Open Accounts (Credit Cards): {sol.open_accounts} years

Note: This is for informational purposes only. SOL starts from the date of
last activity or default, depending on state law. Consult an attorney for
specific legal advice.
"""
