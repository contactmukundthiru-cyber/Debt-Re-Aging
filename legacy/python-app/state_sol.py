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
    notes: str = ""


# State Statute of Limitations Database
# Sources: State civil procedure codes & interest rate statutes (as of 2024)
STATE_SOL_DATABASE: Dict[str, StateSol] = {
    'AL': StateSol('Alabama', 'AL', 6, 6, 6, 6, 0.075, 0.08),
    'AK': StateSol('Alaska', 'AK', 3, 3, 3, 3, 0.105, 0.05),
    'AZ': StateSol('Arizona', 'AZ', 6, 3, 6, 6, 0.10, 0.03),
    'AR': StateSol('Arkansas', 'AR', 5, 5, 5, 5, 0.10, 0.06),
    'CA': StateSol('California', 'CA', 4, 2, 4, 4, 0.10, 0.05),
    'CO': StateSol('Colorado', 'CO', 6, 6, 6, 6, 0.08, 0.08),
    'CT': StateSol('Connecticut', 'CT', 6, 3, 6, 6, 0.10, 0.06),
    'DE': StateSol('Delaware', 'DE', 3, 3, 3, 3, 0.10, 0.05),
    'DC': StateSol('District of Columbia', 'DC', 3, 3, 3, 3, 0.06, 0.06),
    'FL': StateSol('Florida', 'FL', 5, 4, 5, 5, 0.09, 0.09),
    'GA': StateSol('Georgia', 'GA', 6, 4, 6, 6, 0.07, 0.07),
    'HI': StateSol('Hawaii', 'HI', 6, 6, 6, 6, 0.10, 0.10),
    'ID': StateSol('Idaho', 'ID', 5, 4, 5, 5, 0.12, 0.12),
    'IL': StateSol('Illinois', 'IL', 5, 5, 5, 5, 0.09, 0.05),
    'IN': StateSol('Indiana', 'IN', 6, 6, 6, 6, 0.08, 0.08),
    'IA': StateSol('Iowa', 'IA', 5, 5, 5, 5, 0.05, 0.05),
    'KS': StateSol('Kansas', 'KS', 5, 3, 5, 5, 0.10, 0.10),
    'KY': StateSol('Kentucky', 'KY', 5, 5, 5, 5, 0.08, 0.08),
    'LA': StateSol('Louisiana', 'LA', 3, 3, 3, 3, 0.08, 0.08),
    'ME': StateSol('Maine', 'ME', 6, 6, 6, 6, 0.08, 0.08),
    'MD': StateSol('Maryland', 'MD', 3, 3, 3, 3, 0.10, 0.06),
    'MA': StateSol('Massachusetts', 'MA', 6, 6, 6, 6, 0.12, 0.06),
    'MI': StateSol('Michigan', 'MI', 6, 6, 6, 6, 0.07, 0.07),
    'MN': StateSol('Minnesota', 'MN', 6, 6, 6, 6, 0.06, 0.04),
    'MS': StateSol('Mississippi', 'MS', 3, 3, 3, 3, 0.08, 0.08),
    'MO': StateSol('Missouri', 'MO', 5, 5, 5, 5, 0.09, 0.09),
    'MT': StateSol('Montana', 'MT', 5, 5, 5, 5, 0.10, 0.10),
    'NE': StateSol('Nebraska', 'NE', 5, 4, 5, 5, 0.06, 0.06),
    'NV': StateSol('Nevada', 'NV', 6, 4, 6, 6, 0.08, 0.0), # NV medical interest is 0%
    'NH': StateSol('New Hampshire', 'NH', 3, 3, 3, 3, 0.08, 0.08),
    'NJ': StateSol('New Jersey', 'NJ', 6, 6, 6, 6, 0.06, 0.06),
    'NM': StateSol('New Mexico', 'NM', 6, 4, 6, 6, 0.08, 0.08),
    'NY': StateSol('New York', 'NY', 3, 3, 3, 3, 0.09, 0.02), # NY CCFA 2022 reduced SOL to 3 years
    'NC': StateSol('North Carolina', 'NC', 3, 3, 3, 3, 0.08, 0.08),
    'ND': StateSol('North Dakota', 'ND', 6, 6, 6, 6, 0.06, 0.06),
    'OH': StateSol('Ohio', 'OH', 6, 6, 6, 6, 0.05, 0.05),
    'OK': StateSol('Oklahoma', 'OK', 5, 3, 5, 5, 0.06, 0.06),
    'OR': StateSol('Oregon', 'OR', 6, 6, 6, 6, 0.09, 0.09),
    'PA': StateSol('Pennsylvania', 'PA', 4, 4, 4, 4, 0.06, 0.06),
    'RI': StateSol('Rhode Island', 'RI', 10, 10, 10, 10, 0.12, 0.12),
    'SC': StateSol('South Carolina', 'SC', 3, 3, 3, 3, 0.08, 0.08),
    'SD': StateSol('South Dakota', 'SD', 6, 6, 6, 6, 0.10, 0.10),
    'TN': StateSol('Tennessee', 'TN', 6, 6, 6, 6, 0.10, 0.10),
    'TX': StateSol('Texas', 'TX', 4, 4, 4, 4, 0.06, 0.06),
    'UT': StateSol('Utah', 'UT', 6, 4, 6, 6, 0.10, 0.10),
    'VT': StateSol('Vermont', 'VT', 6, 6, 6, 6, 0.12, 0.12),
    'VA': StateSol('Virginia', 'VA', 5, 3, 5, 5, 0.06, 0.06),
    'WA': StateSol('Washington', 'WA', 6, 3, 6, 6, 0.12, 0.09),
    'WV': StateSol('West Virginia', 'WV', 6, 5, 6, 6, 0.07, 0.07),
    'WI': StateSol('Wisconsin', 'WI', 6, 6, 6, 6, 0.05, 0.05),
    'WY': StateSol('Wyoming', 'WY', 8, 8, 8, 8, 0.07, 0.07),
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

        if years_elapsed > sol_years:
            return True, sol_years, (
                f"The statute of limitations in {state_sol.state} for {debt_type.replace('_', ' ')} "
                f"is {sol_years} years. Based on the DOFD of {dofd}, approximately "
                f"{years_elapsed:.1f} years have elapsed. The SOL may have expired."
            )
        else:
            return False, sol_years, (
                f"The statute of limitations in {state_sol.state} is {sol_years} years. "
                f"Approximately {years_elapsed:.1f} years have elapsed since DOFD."
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
