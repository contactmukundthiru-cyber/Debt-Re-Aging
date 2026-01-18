/**
 * Statute of Limitations (SOL) Calculator
 * State-specific debt collection time limits
 */

export interface StateSOL {
  state: string;
  stateCode: string;
  writtenContract: number;
  oralContract: number;
  promissoryNote: number;
  openAccount: number; // Credit cards typically fall here
  notes?: string;
}

/**
 * Comprehensive state SOL database
 * Values in years - based on latest available statutes
 */
export const STATE_SOL_DATA: StateSOL[] = [
  { state: 'Alabama', stateCode: 'AL', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 3 },
  { state: 'Alaska', stateCode: 'AK', writtenContract: 3, oralContract: 3, promissoryNote: 3, openAccount: 3 },
  { state: 'Arizona', stateCode: 'AZ', writtenContract: 6, oralContract: 3, promissoryNote: 6, openAccount: 3 },
  { state: 'Arkansas', stateCode: 'AR', writtenContract: 5, oralContract: 3, promissoryNote: 5, openAccount: 3 },
  { state: 'California', stateCode: 'CA', writtenContract: 4, oralContract: 2, promissoryNote: 4, openAccount: 4 },
  { state: 'Colorado', stateCode: 'CO', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Connecticut', stateCode: 'CT', writtenContract: 6, oralContract: 3, promissoryNote: 6, openAccount: 6 },
  { state: 'Delaware', stateCode: 'DE', writtenContract: 3, oralContract: 3, promissoryNote: 3, openAccount: 3 },
  { state: 'District of Columbia', stateCode: 'DC', writtenContract: 3, oralContract: 3, promissoryNote: 3, openAccount: 3 },
  { state: 'Florida', stateCode: 'FL', writtenContract: 5, oralContract: 4, promissoryNote: 5, openAccount: 4 },
  { state: 'Georgia', stateCode: 'GA', writtenContract: 6, oralContract: 4, promissoryNote: 6, openAccount: 4 },
  { state: 'Hawaii', stateCode: 'HI', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Idaho', stateCode: 'ID', writtenContract: 5, oralContract: 4, promissoryNote: 5, openAccount: 4 },
  { state: 'Illinois', stateCode: 'IL', writtenContract: 5, oralContract: 5, promissoryNote: 5, openAccount: 5 },
  { state: 'Indiana', stateCode: 'IN', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Iowa', stateCode: 'IA', writtenContract: 5, oralContract: 5, promissoryNote: 5, openAccount: 5 },
  { state: 'Kansas', stateCode: 'KS', writtenContract: 5, oralContract: 3, promissoryNote: 5, openAccount: 3 },
  { state: 'Kentucky', stateCode: 'KY', writtenContract: 5, oralContract: 5, promissoryNote: 5, openAccount: 5 },
  { state: 'Louisiana', stateCode: 'LA', writtenContract: 3, oralContract: 3, promissoryNote: 3, openAccount: 3 },
  { state: 'Maine', stateCode: 'ME', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Maryland', stateCode: 'MD', writtenContract: 3, oralContract: 3, promissoryNote: 3, openAccount: 3 },
  { state: 'Massachusetts', stateCode: 'MA', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Michigan', stateCode: 'MI', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Minnesota', stateCode: 'MN', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Mississippi', stateCode: 'MS', writtenContract: 3, oralContract: 3, promissoryNote: 3, openAccount: 3 },
  { state: 'Missouri', stateCode: 'MO', writtenContract: 5, oralContract: 5, promissoryNote: 5, openAccount: 5 },
  { state: 'Montana', stateCode: 'MT', writtenContract: 5, oralContract: 5, promissoryNote: 5, openAccount: 5 },
  { state: 'Nebraska', stateCode: 'NE', writtenContract: 5, oralContract: 4, promissoryNote: 5, openAccount: 4 },
  { state: 'Nevada', stateCode: 'NV', writtenContract: 6, oralContract: 4, promissoryNote: 6, openAccount: 4 },
  { state: 'New Hampshire', stateCode: 'NH', writtenContract: 3, oralContract: 3, promissoryNote: 3, openAccount: 3 },
  { state: 'New Jersey', stateCode: 'NJ', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'New Mexico', stateCode: 'NM', writtenContract: 6, oralContract: 4, promissoryNote: 6, openAccount: 4 },
  { state: 'New York', stateCode: 'NY', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'North Carolina', stateCode: 'NC', writtenContract: 3, oralContract: 3, promissoryNote: 3, openAccount: 3 },
  { state: 'North Dakota', stateCode: 'ND', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Ohio', stateCode: 'OH', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Oklahoma', stateCode: 'OK', writtenContract: 5, oralContract: 3, promissoryNote: 5, openAccount: 3 },
  { state: 'Oregon', stateCode: 'OR', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Pennsylvania', stateCode: 'PA', writtenContract: 4, oralContract: 4, promissoryNote: 4, openAccount: 4 },
  { state: 'Rhode Island', stateCode: 'RI', writtenContract: 10, oralContract: 10, promissoryNote: 10, openAccount: 10 },
  { state: 'South Carolina', stateCode: 'SC', writtenContract: 3, oralContract: 3, promissoryNote: 3, openAccount: 3 },
  { state: 'South Dakota', stateCode: 'SD', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Tennessee', stateCode: 'TN', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Texas', stateCode: 'TX', writtenContract: 4, oralContract: 4, promissoryNote: 4, openAccount: 4 },
  { state: 'Utah', stateCode: 'UT', writtenContract: 6, oralContract: 4, promissoryNote: 6, openAccount: 4 },
  { state: 'Vermont', stateCode: 'VT', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Virginia', stateCode: 'VA', writtenContract: 5, oralContract: 3, promissoryNote: 5, openAccount: 3 },
  { state: 'Washington', stateCode: 'WA', writtenContract: 6, oralContract: 3, promissoryNote: 6, openAccount: 3 },
  { state: 'West Virginia', stateCode: 'WV', writtenContract: 10, oralContract: 5, promissoryNote: 10, openAccount: 5 },
  { state: 'Wisconsin', stateCode: 'WI', writtenContract: 6, oralContract: 6, promissoryNote: 6, openAccount: 6 },
  { state: 'Wyoming', stateCode: 'WY', writtenContract: 8, oralContract: 8, promissoryNote: 8, openAccount: 8 },
];

export type DebtType = 'creditCard' | 'medicalDebt' | 'autoLoan' | 'personalLoan' | 'mortgage' | 'studentLoan' | 'other';

export interface SOLResult {
  stateCode: string;
  stateName: string;
  debtType: DebtType;
  solYears: number;
  dofd: Date;
  solExpiration: Date;
  isExpired: boolean;
  daysRemaining: number;
  yearsRemaining: number;
  status: 'expired' | 'expiring_soon' | 'active';
  legalImplications: string[];
  recommendedActions: string[];
}

/**
 * Maps debt types to contract categories
 */
function getContractCategory(debtType: DebtType): keyof Omit<StateSOL, 'state' | 'stateCode' | 'notes'> {
  switch (debtType) {
    case 'creditCard':
    case 'medicalDebt':
      return 'openAccount';
    case 'autoLoan':
    case 'personalLoan':
    case 'mortgage':
      return 'writtenContract';
    case 'studentLoan':
      return 'promissoryNote';
    default:
      return 'writtenContract';
  }
}

/**
 * Get SOL data for a specific state
 */
export function getStateSOL(stateCode: string): StateSOL | null {
  return STATE_SOL_DATA.find(s => s.stateCode.toUpperCase() === stateCode.toUpperCase()) || null;
}

/**
 * Calculate SOL status for a debt
 */
export function calculateSOL(
  stateCode: string,
  debtType: DebtType,
  dofd: Date | string
): SOLResult | null {
  const stateData = getStateSOL(stateCode);
  if (!stateData) return null;

  const dofdDate = typeof dofd === 'string' ? new Date(dofd) : dofd;
  if (isNaN(dofdDate.getTime())) return null;

  const category = getContractCategory(debtType);
  const solYears = stateData[category];

  const solExpiration = new Date(dofdDate);
  solExpiration.setFullYear(solExpiration.getFullYear() + solYears);

  const now = new Date();
  const daysRemaining = Math.floor((solExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const yearsRemaining = daysRemaining / 365;
  const isExpired = daysRemaining <= 0;

  let status: 'expired' | 'expiring_soon' | 'active';
  if (isExpired) {
    status = 'expired';
  } else if (daysRemaining <= 180) {
    status = 'expiring_soon';
  } else {
    status = 'active';
  }

  const legalImplications = getLegalImplications(status, stateData, debtType);
  const recommendedActions = getRecommendedActions(status, stateData, debtType);

  return {
    stateCode: stateData.stateCode,
    stateName: stateData.state,
    debtType,
    solYears,
    dofd: dofdDate,
    solExpiration,
    isExpired,
    daysRemaining: Math.max(0, daysRemaining),
    yearsRemaining: Math.max(0, yearsRemaining),
    status,
    legalImplications,
    recommendedActions,
  };
}

/**
 * Get legal implications based on SOL status
 */
function getLegalImplications(
  status: 'expired' | 'expiring_soon' | 'active',
  stateData: StateSOL,
  debtType: DebtType
): string[] {
  const implications: string[] = [];

  if (status === 'expired') {
    implications.push(`The statute of limitations has expired in ${stateData.state}`);
    implications.push('Collector cannot legally sue you for this debt');
    implications.push('Any lawsuit filed would be subject to an affirmative SOL defense');
    implications.push('Making a payment or acknowledging the debt may restart the SOL clock');
    implications.push('Debt can still be reported on credit for 7 years from DOFD under FCRA');
  } else if (status === 'expiring_soon') {
    implications.push(`SOL expires within 6 months in ${stateData.state}`);
    implications.push('Collector may attempt aggressive collection before SOL expires');
    implications.push('Do NOT make any payments or written acknowledgments');
    implications.push('Any lawsuit must be filed before SOL expires to be valid');
  } else {
    implications.push(`Debt is within SOL in ${stateData.state}`);
    implications.push('Collector can legally sue for this debt');
    implications.push('You may still dispute inaccurate information under FCRA');
    if (debtType === 'creditCard' || debtType === 'medicalDebt') {
      implications.push('Credit card debts use "open account" SOL periods');
    }
  }

  return implications;
}

/**
 * Get recommended actions based on SOL status
 */
function getRecommendedActions(
  status: 'expired' | 'expiring_soon' | 'active',
  stateData: StateSOL,
  _debtType: DebtType
): string[] {
  const actions: string[] = [];

  if (status === 'expired') {
    actions.push('Send written notice that debt is time-barred');
    actions.push('If sued, assert SOL as affirmative defense immediately');
    actions.push('File FDCPA complaint if collector threatens lawsuit on time-barred debt');
    actions.push('Request debt validation but do not acknowledge owing the debt');
    actions.push(`Dispute with credit bureaus if debt is over 7 years from DOFD`);
  } else if (status === 'expiring_soon') {
    actions.push('DO NOT make any payments (may restart SOL)');
    actions.push('DO NOT acknowledge the debt in writing');
    actions.push('Document all collection communications');
    actions.push('Consult with consumer attorney about options');
    actions.push(`Wait ${Math.ceil((new Date(stateData.stateCode).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))} months for SOL to expire if viable`);
  } else {
    actions.push('Request full debt validation under FDCPA §809');
    actions.push('Verify DOFD accuracy with original creditor');
    actions.push('Consider negotiation if debt is legitimate');
    actions.push('Dispute any inaccurate reporting with credit bureaus');
    actions.push('Document all collection activities');
  }

  return actions;
}

/**
 * Get all states with shortest SOL for a debt type
 */
export function getShortestSOLStates(debtType: DebtType, limit = 5): StateSOL[] {
  const category = getContractCategory(debtType);
  return [...STATE_SOL_DATA]
    .sort((a, b) => a[category] - b[category])
    .slice(0, limit);
}

/**
 * Get all states with longest SOL for a debt type
 */
export function getLongestSOLStates(debtType: DebtType, limit = 5): StateSOL[] {
  const category = getContractCategory(debtType);
  return [...STATE_SOL_DATA]
    .sort((a, b) => b[category] - a[category])
    .slice(0, limit);
}

/**
 * Check if a state allows "tolling" (pausing) of SOL
 */
export function hasTollingProvisions(stateCode: string): {
  hasTolling: boolean;
  tollingReasons: string[];
} {
  // Common tolling provisions by state
  const tollingStates: Record<string, string[]> = {
    'CA': ['Debtor absent from state', 'Debtor in prison', 'Debtor under 18'],
    'NY': ['Debtor absent from state', 'Debtor under disability'],
    'TX': ['Debtor absent from state more than 6 months'],
    'FL': ['Debtor absent from state', 'Government-declared emergency'],
    'IL': ['Debtor under legal disability', 'Debtor absent from state'],
  };

  const tollingReasons = tollingStates[stateCode.toUpperCase()] || [];
  return {
    hasTolling: tollingReasons.length > 0,
    tollingReasons,
  };
}

/**
 * Format SOL result for display
 */
export function formatSOLResult(result: SOLResult): string {
  const lines = [
    `State: ${result.stateName} (${result.stateCode})`,
    `Debt Type: ${result.debtType}`,
    `SOL Period: ${result.solYears} years`,
    `Date of First Delinquency: ${result.dofd.toLocaleDateString()}`,
    `SOL Expiration: ${result.solExpiration.toLocaleDateString()}`,
    `Status: ${result.status.toUpperCase()}`,
  ];

  if (result.isExpired) {
    lines.push(`EXPIRED: This debt is time-barred`);
  } else {
    lines.push(`Days Remaining: ${result.daysRemaining}`);
    lines.push(`Years Remaining: ${result.yearsRemaining.toFixed(1)}`);
  }

  return lines.join('\n');
}
