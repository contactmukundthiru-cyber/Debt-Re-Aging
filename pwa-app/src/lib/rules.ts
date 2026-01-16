/**
 * FCRA/FDCPA Rule Engine - TypeScript Implementation
 * Detects debt re-aging and credit reporting violations
 */

export interface RuleFlag {
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  whyItMatters: string;
  suggestedEvidence: string[];
  fieldValues: Record<string, any>;
  legalCitations: string[];
}

export interface CreditFields {
  originalCreditor?: string;
  furnisherOrCollector?: string;
  accountType?: string;
  accountStatus?: string;
  currentBalance?: string;
  originalAmount?: string;
  dateOpened?: string;
  dateReportedOrUpdated?: string;
  dofd?: string; // Date of First Delinquency
  chargeOffDate?: string;
  dateLastPayment?: string;
  dateLastActivity?: string;
  estimatedRemovalDate?: string;
  paymentHistory?: string;
  bureau?: string;
  stateCode?: string;
}

export interface RiskProfile {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  disputeStrength: 'weak' | 'moderate' | 'strong' | 'definitive';
  litigationPotential: boolean;
  detectedPatterns: PatternScore[];
  keyViolations: string[];
  recommendedApproach: string;
}

export interface PatternScore {
  patternName: string;
  confidenceScore: number;
  legalStrength: 'weak' | 'moderate' | 'strong' | 'definitive';
  matchedRules: string[];
  description: string;
  recommendedAction: string;
}

// Rule metadata
const RULE_DEFINITIONS: Record<string, any> = {
  B1: {
    name: 'DOFD Before Account Opening',
    severity: 'high',
    whyItMatters: 'A debt cannot become delinquent before the account even existed. This is a clear sign of data manipulation.',
    suggestedEvidence: ['Original account agreement', 'First statement showing account open date'],
    legalCitations: ['FCRA_623_a1', 'FCRA_611']
  },
  B2: {
    name: 'Impossible 7-Year Timeline',
    severity: 'high',
    whyItMatters: 'The 7-year reporting period is calculated from the DOFD, not from when a collector purchased the debt.',
    suggestedEvidence: ['Prior credit reports showing original DOFD', 'Original creditor records'],
    legalCitations: ['FCRA_605_a', 'FCRA_605_c']
  },
  B3: {
    name: 'DOFD After Charge-Off',
    severity: 'high',
    whyItMatters: 'The DOFD must occur BEFORE a charge-off. If the DOFD is after the charge-off, the date has been manipulated.',
    suggestedEvidence: ['Charge-off notice', 'Account statements showing delinquency timeline'],
    legalCitations: ['FCRA_623_a5', 'FCRA_611']
  },
  K1: {
    name: 'Balance Increase After Charge-Off',
    severity: 'medium',
    whyItMatters: 'After charge-off, the balance should not increase except for documented interest/fees.',
    suggestedEvidence: ['Original charge-off statement', 'Fee disclosure documents'],
    legalCitations: ['FDCPA_807', 'FCRA_623_a1']
  },
  K6: {
    name: 'Removal Date Beyond 7 Years from DOFD',
    severity: 'high',
    whyItMatters: 'This is the classic "re-aging" violation - extending reporting beyond the legal limit.',
    suggestedEvidence: ['Prior credit reports', 'Original creditor DOFD verification'],
    legalCitations: ['FCRA_605_a', 'FCRA_605_c']
  },
  M1: {
    name: 'Missing Required DOFD',
    severity: 'medium',
    whyItMatters: 'Furnishers must report the DOFD for collection accounts under Metro 2 guidelines.',
    suggestedEvidence: ['Request DOFD verification from furnisher'],
    legalCitations: ['FCRA_623_a5', 'METRO2_GUIDE']
  },
  L1: {
    name: 'Status vs History Mismatch',
    severity: 'medium',
    whyItMatters: 'Account status contradicts payment history, indicating inaccurate reporting.',
    suggestedEvidence: ['Payment records', 'Bank statements'],
    legalCitations: ['FCRA_623_a1', 'FCRA_611']
  }
};

// State Statute of Limitations data
const STATE_SOL: Record<string, { writtenContracts: number; openAccounts: number }> = {
  'AL': { writtenContracts: 6, openAccounts: 6 },
  'AK': { writtenContracts: 3, openAccounts: 3 },
  'AZ': { writtenContracts: 6, openAccounts: 6 },
  'AR': { writtenContracts: 5, openAccounts: 5 },
  'CA': { writtenContracts: 4, openAccounts: 4 },
  'CO': { writtenContracts: 6, openAccounts: 6 },
  'CT': { writtenContracts: 6, openAccounts: 6 },
  'DE': { writtenContracts: 3, openAccounts: 3 },
  'FL': { writtenContracts: 5, openAccounts: 4 },
  'GA': { writtenContracts: 6, openAccounts: 4 },
  'HI': { writtenContracts: 6, openAccounts: 6 },
  'ID': { writtenContracts: 5, openAccounts: 4 },
  'IL': { writtenContracts: 5, openAccounts: 5 },
  'IN': { writtenContracts: 6, openAccounts: 6 },
  'IA': { writtenContracts: 5, openAccounts: 5 },
  'KS': { writtenContracts: 5, openAccounts: 3 },
  'KY': { writtenContracts: 5, openAccounts: 5 },
  'LA': { writtenContracts: 3, openAccounts: 3 },
  'ME': { writtenContracts: 6, openAccounts: 6 },
  'MD': { writtenContracts: 3, openAccounts: 3 },
  'MA': { writtenContracts: 6, openAccounts: 6 },
  'MI': { writtenContracts: 6, openAccounts: 6 },
  'MN': { writtenContracts: 6, openAccounts: 6 },
  'MS': { writtenContracts: 3, openAccounts: 3 },
  'MO': { writtenContracts: 5, openAccounts: 5 },
  'MT': { writtenContracts: 5, openAccounts: 5 },
  'NE': { writtenContracts: 5, openAccounts: 4 },
  'NV': { writtenContracts: 6, openAccounts: 4 },
  'NH': { writtenContracts: 3, openAccounts: 3 },
  'NJ': { writtenContracts: 6, openAccounts: 6 },
  'NM': { writtenContracts: 6, openAccounts: 4 },
  'NY': { writtenContracts: 6, openAccounts: 6 },
  'NC': { writtenContracts: 3, openAccounts: 3 },
  'ND': { writtenContracts: 6, openAccounts: 6 },
  'OH': { writtenContracts: 6, openAccounts: 6 },
  'OK': { writtenContracts: 5, openAccounts: 3 },
  'OR': { writtenContracts: 6, openAccounts: 6 },
  'PA': { writtenContracts: 4, openAccounts: 4 },
  'RI': { writtenContracts: 10, openAccounts: 10 },
  'SC': { writtenContracts: 3, openAccounts: 3 },
  'SD': { writtenContracts: 6, openAccounts: 6 },
  'TN': { writtenContracts: 6, openAccounts: 6 },
  'TX': { writtenContracts: 4, openAccounts: 4 },
  'UT': { writtenContracts: 6, openAccounts: 4 },
  'VT': { writtenContracts: 6, openAccounts: 6 },
  'VA': { writtenContracts: 5, openAccounts: 3 },
  'WA': { writtenContracts: 6, openAccounts: 3 },
  'WV': { writtenContracts: 10, openAccounts: 5 },
  'WI': { writtenContracts: 6, openAccounts: 6 },
  'WY': { writtenContracts: 8, openAccounts: 8 },
  'DC': { writtenContracts: 3, openAccounts: 3 }
};

/**
 * Parse a date string into a Date object
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  // Try various formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // MM-DD-YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else {
        return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
      }
    }
  }

  // Try native parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calculate years between two dates
 */
function yearsBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return diffTime / (1000 * 60 * 60 * 24 * 365.25);
}

/**
 * Create a rule flag with metadata
 */
function createFlag(
  ruleId: string,
  explanation: string,
  fieldValues: Record<string, any>
): RuleFlag {
  const rule = RULE_DEFINITIONS[ruleId] || {
    name: 'Unknown Rule',
    severity: 'medium',
    whyItMatters: '',
    suggestedEvidence: [],
    legalCitations: []
  };

  return {
    ruleId,
    ruleName: rule.name,
    severity: rule.severity,
    explanation,
    whyItMatters: rule.whyItMatters,
    suggestedEvidence: rule.suggestedEvidence,
    fieldValues,
    legalCitations: rule.legalCitations
  };
}

/**
 * Main rule checking function
 */
export function runRules(fields: CreditFields): RuleFlag[] {
  const flags: RuleFlag[] = [];

  const dateOpened = parseDate(fields.dateOpened);
  const dofd = parseDate(fields.dofd);
  const chargeOff = parseDate(fields.chargeOffDate);
  const removalDate = parseDate(fields.estimatedRemovalDate);
  const lastPayment = parseDate(fields.dateLastPayment);
  const today = new Date();

  // B1: DOFD before account opening
  if (dofd && dateOpened && dofd < dateOpened) {
    flags.push(createFlag('B1',
      `The Date of First Delinquency (${fields.dofd}) is BEFORE the account was opened (${fields.dateOpened}). This is physically impossible and indicates data manipulation.`,
      { dofd: fields.dofd, dateOpened: fields.dateOpened }
    ));
  }

  // B2: Impossible 7-year timeline
  if (dofd && removalDate) {
    const yearsToRemoval = yearsBetween(dofd, removalDate);
    if (yearsToRemoval > 7.5) {
      flags.push(createFlag('B2',
        `The estimated removal date (${fields.estimatedRemovalDate}) is ${yearsToRemoval.toFixed(1)} years after the DOFD (${fields.dofd}). The maximum allowed is 7 years plus 180 days.`,
        { dofd: fields.dofd, estimatedRemovalDate: fields.estimatedRemovalDate, yearsCalculated: yearsToRemoval.toFixed(1) }
      ));
    }
  }

  // B3: DOFD after charge-off
  if (dofd && chargeOff && dofd > chargeOff) {
    flags.push(createFlag('B3',
      `The DOFD (${fields.dofd}) is AFTER the charge-off date (${fields.chargeOffDate}). Delinquency must occur before charge-off.`,
      { dofd: fields.dofd, chargeOffDate: fields.chargeOffDate }
    ));
  }

  // K1: Balance increase after charge-off
  if (fields.currentBalance && fields.originalAmount) {
    const current = parseFloat(fields.currentBalance.replace(/[$,]/g, ''));
    const original = parseFloat(fields.originalAmount.replace(/[$,]/g, ''));

    if (!isNaN(current) && !isNaN(original) && current > original * 1.5) {
      flags.push(createFlag('K1',
        `Current balance ($${current.toFixed(2)}) is ${((current/original - 1) * 100).toFixed(0)}% higher than the original amount ($${original.toFixed(2)}). Significant unexplained increase.`,
        { currentBalance: fields.currentBalance, originalAmount: fields.originalAmount }
      ));
    }
  }

  // K6: Should have fallen off already
  if (dofd) {
    const expectedRemoval = new Date(dofd);
    expectedRemoval.setFullYear(expectedRemoval.getFullYear() + 7);
    expectedRemoval.setDate(expectedRemoval.getDate() + 180); // Plus 180 days grace

    if (today > expectedRemoval) {
      flags.push(createFlag('K6',
        `Based on the DOFD (${fields.dofd}), this account should have been removed by ${expectedRemoval.toISOString().split('T')[0]}. It is being reported beyond the legal limit.`,
        { dofd: fields.dofd, expectedRemoval: expectedRemoval.toISOString().split('T')[0], today: today.toISOString().split('T')[0] }
      ));
    }
  }

  // M1: Missing DOFD for collection
  const accountType = (fields.accountType || '').toLowerCase();
  if ((accountType === 'collection' || accountType === 'charge_off') && !fields.dofd) {
    flags.push(createFlag('M1',
      'This collection/charge-off account is missing the required Date of First Delinquency (DOFD). Furnishers must report this date.',
      { accountType: fields.accountType }
    ));
  }

  // L1: Status vs Payment History mismatch
  const status = (fields.accountStatus || '').toLowerCase();
  const history = (fields.paymentHistory || '').toUpperCase();

  if (status && history) {
    const isCleanStatus = ['current', 'paid', 'on time'].some(s => status.includes(s));
    const hasRecentLates = ['30', '60', '90', '120', '150', '180'].some(late =>
      history.substring(0, 10).includes(late)
    );

    if (isCleanStatus && hasRecentLates) {
      flags.push(createFlag('L1',
        `Account status shows "${status}" but recent payment history shows delinquency markers. This is contradictory reporting.`,
        { accountStatus: fields.accountStatus, paymentHistory: fields.paymentHistory?.substring(0, 20) }
      ));
    }
  }

  // S1: Statute of Limitations check
  if (fields.stateCode && lastPayment) {
    const sol = STATE_SOL[fields.stateCode.toUpperCase()];
    if (sol) {
      const solExpiry = new Date(lastPayment);
      solExpiry.setFullYear(solExpiry.getFullYear() + sol.writtenContracts);

      if (today > solExpiry) {
        flags.push(createFlag('S1',
          `This debt may be beyond the Statute of Limitations for ${fields.stateCode} (${sol.writtenContracts} years). The SOL likely expired on ${solExpiry.toISOString().split('T')[0]}.`,
          { stateCode: fields.stateCode, dateLastPayment: fields.dateLastPayment, solYears: sol.writtenContracts }
        ));
      }
    }
  }

  return flags;
}

/**
 * Calculate pattern scores and risk profile
 */
export function calculateRiskProfile(flags: RuleFlag[], fields: CreditFields): RiskProfile {
  let baseScore = 0;
  const patterns: PatternScore[] = [];
  const keyViolations: string[] = [];

  // Score by severity
  for (const flag of flags) {
    if (flag.severity === 'high') {
      baseScore += 25;
      keyViolations.push(flag.ruleName);
    } else if (flag.severity === 'medium') {
      baseScore += 15;
    } else {
      baseScore += 5;
    }
  }

  // Cap at 100
  const overallScore = Math.min(100, baseScore);

  // Determine risk level
  let riskLevel: RiskProfile['riskLevel'] = 'low';
  if (overallScore >= 75) riskLevel = 'critical';
  else if (overallScore >= 50) riskLevel = 'high';
  else if (overallScore >= 25) riskLevel = 'medium';

  // Determine dispute strength
  let disputeStrength: RiskProfile['disputeStrength'] = 'weak';
  if (overallScore >= 75) disputeStrength = 'definitive';
  else if (overallScore >= 50) disputeStrength = 'strong';
  else if (overallScore >= 25) disputeStrength = 'moderate';

  // Check for re-aging pattern
  const reAgingRules = flags.filter(f => ['B1', 'B2', 'B3', 'K6'].includes(f.ruleId));
  if (reAgingRules.length >= 2) {
    patterns.push({
      patternName: 'Debt Re-Aging',
      confidenceScore: Math.min(95, 60 + reAgingRules.length * 15),
      legalStrength: 'strong',
      matchedRules: reAgingRules.map(r => r.ruleId),
      description: 'Multiple timeline violations indicate intentional manipulation of reporting dates.',
      recommendedAction: 'File dispute citing FCRA §605 violations. Consider CFPB complaint.'
    });
  }

  // Litigation potential
  const litigationPotential = overallScore >= 50 || reAgingRules.length >= 2;

  // Recommended approach
  let recommendedApproach = '';
  if (overallScore >= 75) {
    recommendedApproach = 'Strong case for formal dispute and potential litigation. Document everything and consider consulting a consumer rights attorney.';
  } else if (overallScore >= 50) {
    recommendedApproach = 'File dispute with credit bureaus citing specific violations. Follow up with CFPB complaint if not resolved.';
  } else if (overallScore >= 25) {
    recommendedApproach = 'Request validation of debt and dispute any inaccuracies through standard bureau process.';
  } else {
    recommendedApproach = 'Minor issues detected. Standard dispute process should resolve. Keep records of all communication.';
  }

  return {
    overallScore,
    riskLevel,
    disputeStrength,
    litigationPotential,
    detectedPatterns: patterns,
    keyViolations,
    recommendedApproach
  };
}

/**
 * Export everything needed
 */
export { RULE_DEFINITIONS, STATE_SOL, parseDate };
