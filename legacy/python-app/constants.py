"""
Centralized constants, mappings, and configuration for the forensic auditing engine.
"""

# Metro2 Status Code Decoder
# Source: Metro2 Industry Standards for Credit Reporting
METRO2_STATUS_MAP = {
    '11': 'Current',
    '13': 'Paid',
    '62': 'Charge-off',
    '64': 'Collection',
    '71': 'Account Involved in Bankruptcy Chapter 7',
    '78': 'Account Involved in Bankruptcy Chapter 11',
    '80': 'Account Involved in Bankruptcy Chapter 13',
    '82': 'Account Involved in Bankruptcy Chapter 12',
    '83': 'Account Involved in Bankruptcy Chapter 13',
    '84': 'Account Involved in Bankruptcy Chapter 13',
    '93': 'Account involved in litigation',
    '97': 'Unpaid collection',
    'DA': 'Delete account (Metro2 error code)',
    'DF': 'Deceased',
}

# Creditor/Furnisher Alias Map for Entity Resolution
# Helps identify if multiple names belong to the same parent entity
ENTITY_RESOLUTION_MAP = {
    'MIDLAND FUNDING': 'MIDLAND CREDIT MANAGEMENT',
    'MIDLAND FUNDING LLC': 'MIDLAND CREDIT MANAGEMENT',
    'MCM': 'MIDLAND CREDIT MANAGEMENT',
    'MIDLAND CREDIT': 'MIDLAND CREDIT MANAGEMENT',
    'ENCORE CAPITAL': 'MIDLAND CREDIT MANAGEMENT',
    'ENCORE CAPITAL GROUP': 'MIDLAND CREDIT MANAGEMENT',
    'PORTFOLIO RECOVERY': 'PRA GROUP',
    'PORTFOLIO RECOVERY ASSOCIATES': 'PRA GROUP',
    'PRA': 'PRA GROUP',
    'LVNV': 'RESURGENT CAPITAL SERVICES',
    'LVNV FUNDING': 'RESURGENT CAPITAL SERVICES',
    'LVNV FUNDING LLC': 'RESURGENT CAPITAL SERVICES',
    'RESURGENT': 'RESURGENT CAPITAL SERVICES',
    'PYOD': 'RESURGENT CAPITAL SERVICES',
    'PINNACLE CREDIT SERVICES': 'RESURGENT CAPITAL SERVICES',
    'SHERMAN FINANCIAL': 'RESURGENT CAPITAL SERVICES',
    'SHERMAN STRATEGIC INVESTMENTS': 'RESURGENT CAPITAL SERVICES',
    'CAVALRY': 'CAVALRY PORTFOLIO SERVICES',
    'CAVALRY SPV': 'CAVALRY PORTFOLIO SERVICES',
    'CAVALRY SPV I': 'CAVALRY PORTFOLIO SERVICES',
    'CAVALRY SPV II': 'CAVALRY PORTFOLIO SERVICES',
    'JEFFERSON CAPITAL SYSTEMS': 'JEFFERSON CAPITAL',
    'JEFFERSON CAPITAL': 'JEFFERSON CAPITAL',
    'JCAP': 'JEFFERSON CAPITAL',
    'ASSET ACCEPTANCE': 'MIDLAND CREDIT MANAGEMENT',
}
