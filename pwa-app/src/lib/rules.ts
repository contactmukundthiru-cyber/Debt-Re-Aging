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
  successProbability: number; // 0-100%
  discoveryQuestions?: string[]; // Questions to ask the consumer to find more proof
  bureauTactics?: Record<string, string>; // Specific advice for each bureau
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

export interface ScoreImpact {
  category: string;
  impact: number; // 0 to 100
  description: string;
}

export interface RiskProfile {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  disputeStrength: 'weak' | 'moderate' | 'strong' | 'definitive';
  litigationPotential: boolean;
  detectedPatterns: PatternScore[];
  keyViolations: string[];
  recommendedApproach: string;
  scoreBreakdown: ScoreImpact[];
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
    successProbability: 95,
    whyItMatters: 'A debt cannot become delinquent before the account even existed. This is a clear sign of data manipulation.',
    suggestedEvidence: ['Original account agreement', 'First statement showing account open date'],
    legalCitations: ['FCRA_623_a1', 'FCRA_611'],
    discoveryQuestions: [
      'Do you have the original welcome letter or first statement for this account?',
      'Was this account a result of identity theft (someone opening it in your name)?'
    ],
    bureauTactics: {
      experian: 'Experian usually corrects this quickly if the open date is verified. Demand they "reconcile internal date conflicts".',
      equifax: 'Equifax may require a copy of the original contract. Highlight the physical impossibility in the letter.',
      transunion: 'TransUnion often deletes "impossible" tradelines entirely rather than correcting them.'
    }
  },
  B2: {
    name: 'Impossible 7-Year Timeline',
    severity: 'high',
    successProbability: 88,
    whyItMatters: 'The 7-year reporting period is calculated from the DOFD, not from when a collector purchased the debt.',
    suggestedEvidence: ['Prior credit reports showing original DOFD', 'Original creditor records'],
    legalCitations: ['FCRA_605_a', 'FCRA_605_c'],
    discoveryQuestions: [
      'When was the very first time you missed a payment and never caught up?',
      'Do you have an old credit report from 2-3 years ago?'
    ],
    bureauTactics: {
      all: 'Cite FCRA §605(c) which strictly defines the commencement of the reporting period. Bureau "standard procedures" often fail to verify the original DOFD.'
    }
  },
  B3: {
    name: 'DOFD After Charge-Off',
    severity: 'high',
    successProbability: 92,
    whyItMatters: 'The DOFD must occur BEFORE a charge-off. If the DOFD is after the charge-off, the date has been manipulated.',
    suggestedEvidence: ['Charge-off notice', 'Account statements showing delinquency timeline'],
    legalCitations: ['FCRA_623_a5', 'FCRA_611']
  },
  K1: {
    name: 'Balance Increase After Charge-Off',
    severity: 'medium',
    successProbability: 65,
    whyItMatters: 'After charge-off, the balance should not increase except for documented interest/fees.',
    suggestedEvidence: ['Original charge-off statement', 'Fee disclosure documents'],
    legalCitations: ['FDCPA_807', 'FCRA_623_a1']
  },
  K6: {
    name: 'Removal Date Beyond 7 Years from DOFD',
    severity: 'high',
    successProbability: 98,
    whyItMatters: 'This is the classic "re-aging" violation - extending reporting beyond the legal limit.',
    suggestedEvidence: ['Prior credit reports', 'Original creditor DOFD verification'],
    legalCitations: ['FCRA_605_a', 'FCRA_605_c'],
    discoveryQuestions: [
      'Has this account fallen off your credit report and then reappeared later?',
      'Did you make any partial payments recently that might have triggered a date refresh?'
    ],
    bureauTactics: {
      all: 'This is a per-se violation. Demand immediate deletion. If they "verify" it, they are likely ignoring the actual DOFD field in the Metro 2 record.'
    }
  },
  K7: {
    name: 'Excessive Interest (State Law Violation)',
    severity: 'high',
    successProbability: 75,
    whyItMatters: 'State laws cap the amount of interest that can be charged on delinquent debt.',
    suggestedEvidence: ['Itemized statement of interest and fees'],
    legalCitations: ['STATE_INTEREST_STATUTE'],
    discoveryQuestions: [
      'Have you received a notice from the collector showing a breakdown of principal vs. interest?',
      'Was this a medical debt? (Many states have lower interest caps for medical debt).'
    ]
  },
  M1: {
    name: 'Missing Required DOFD',
    severity: 'medium',
    successProbability: 80,
    whyItMatters: 'Furnishers must report the DOFD for collection accounts under Metro 2 guidelines.',
    suggestedEvidence: ['Request DOFD verification from furnisher'],
    legalCitations: ['FCRA_623_a5', 'METRO2_GUIDE']
  },
  M2: {
    name: 'Metro2: Transferred with Balance',
    severity: 'high',
    successProbability: 90,
    whyItMatters: 'If an account is transferred or sold, the balance MUST be reported as $0.',
    suggestedEvidence: ['Transfer notice', 'New collector statement'],
    legalCitations: ['METRO2_GUIDE', 'FCRA_623_a1']
  },
  H1: {
    name: 'Medical Debt: < 365 Days',
    severity: 'high',
    successProbability: 99,
    whyItMatters: 'Medical debt cannot be reported until 365 days after the date of service.',
    suggestedEvidence: ['Medical bill showing date of service'],
    legalCitations: ['CFPB_MEDICAL_RULE']
  },
  H2: {
    name: 'Medical Debt: < $500',
    severity: 'high',
    successProbability: 99,
    whyItMatters: 'Medical debts under $500 should not appear on credit reports.',
    suggestedEvidence: ['Proof of balance amount'],
    legalCitations: ['CFPB_MEDICAL_RULE']
  },
  E1: {
    name: 'Future Date Reported',
    severity: 'high',
    successProbability: 95,
    whyItMatters: 'Dates in the future indicate systemic data corruption.',
    suggestedEvidence: ['N/A - Logical error'],
    legalCitations: ['FCRA_623_a1']
  },
  D1: {
    name: 'Paid Status with Balance',
    severity: 'high',
    successProbability: 94,
    whyItMatters: 'If status is paid or settled, the balance must be $0.',
    suggestedEvidence: ['Settlement letter', 'Payment receipt'],
    legalCitations: ['FCRA_623_a1']
  },
  L1: {
    name: 'Status vs History Mismatch',
    severity: 'medium',
    successProbability: 70,
    whyItMatters: 'Account status contradicts payment history, indicating inaccurate reporting.',
    suggestedEvidence: ['Payment records', 'Bank statements'],
    legalCitations: ['FCRA_623_a1', 'FCRA_611']
  },
  S1: {
    name: 'Statute of Limitations Expired',
    severity: 'medium',
    successProbability: 60,
    whyItMatters: 'While the debt may still be reported, it cannot be legally collected if the SOL has expired.',
    suggestedEvidence: ['Proof of last payment date', 'State SOL reference'],
    legalCitations: ['STATE_SOL_STATUTE', 'FDCPA_807_2']
  },
  S2: {
    name: 'Judgment Age Violation',
    severity: 'high',
    successProbability: 85,
    whyItMatters: 'Judgments can only be reported for 7 years from the date the judgment was filed.',
    suggestedEvidence: ['Court records', 'Judgment filing date documentation'],
    legalCitations: ['FCRA_605_a3', 'FCRA_611']
  },
  C1: {
    name: 'Disputed Status Not Shown',
    severity: 'medium',
    successProbability: 75,
    whyItMatters: 'If you disputed this account, it must be marked as disputed on your credit report.',
    suggestedEvidence: ['Dispute confirmation', 'Certified mail receipt'],
    legalCitations: ['FCRA_611_a3', 'FCRA_623_b']
  },
  C2: {
    name: 'Balance Inconsistency',
    severity: 'medium',
    successProbability: 55,
    whyItMatters: 'Significant balance variations without explanation suggest inaccurate reporting.',
    suggestedEvidence: ['Account statements', 'Payment records'],
    legalCitations: ['FCRA_623_a1']
  },
  F1: {
    name: 'Stale Data (90+ Days)',
    severity: 'low',
    successProbability: 45,
    whyItMatters: 'Accounts should be updated at least monthly. Stale data may indicate the furnisher is no longer verifying accuracy.',
    suggestedEvidence: ['Request current account statement'],
    legalCitations: ['FCRA_623_a2', 'METRO2_GUIDE']
  },
  F2: {
    name: 'Duplicate Reporting',
    severity: 'high',
    successProbability: 88,
    whyItMatters: 'The same debt cannot be reported by multiple entities simultaneously with balances.',
    suggestedEvidence: ['Credit report showing both entries', 'Transfer/sale documentation'],
    legalCitations: ['FCRA_623_a1', 'FCRA_611']
  },
  R1: {
    name: 'Reporting After Bankruptcy',
    severity: 'high',
    successProbability: 96,
    whyItMatters: 'Debts discharged in bankruptcy must show $0 balance and cannot be collected.',
    suggestedEvidence: ['Bankruptcy discharge order', 'Schedule listing the debt'],
    legalCitations: ['FCRA_605_a1', '11USC524']
  },
  A1: {
    name: 'Account Number Mismatch',
    severity: 'medium',
    successProbability: 60,
    whyItMatters: 'If the account number reported doesn\'t match your records, it may be mixed credit file.',
    suggestedEvidence: ['Original account documents', 'Statements'],
    legalCitations: ['FCRA_611', 'FCRA_623_a1']
  },
  P1: {
    name: 'Payment History Gap',
    severity: 'low',
    successProbability: 40,
    whyItMatters: 'Missing months in payment history can mask on-time payments.',
    suggestedEvidence: ['Bank statements', 'Payment confirmations'],
    legalCitations: ['FCRA_623_a2']
  },
  T1: {
    name: 'Incorrect Account Type',
    severity: 'medium',
    successProbability: 65,
    whyItMatters: 'Reporting a credit card as a collection when it was closed normally affects your score differently.',
    suggestedEvidence: ['Original account terms', 'Closure documentation'],
    legalCitations: ['FCRA_623_a1', 'METRO2_GUIDE']
  },
  Z1: {
    name: 'Zombie Debt: Suspected Re-aging',
    severity: 'high',
    successProbability: 82,
    whyItMatters: 'An account opened years after the original default often indicates a "Zombie Debt" buyer trying to restart the reporting clock.',
    suggestedEvidence: ['Original creditor records', 'Historical credit reports'],
    legalCitations: ['FCRA_605_c', 'FDCPA_807'],
    discoveryQuestions: [
      'Did you ever receive a notice from this specific collector when the debt was originally defaulted?',
      'Have you been sued on this debt before?'
    ]
  },
  M3: {
    name: 'Metro2: Invalid Account Type/Status Combo',
    severity: 'medium',
    successProbability: 75,
    whyItMatters: 'Metro 2 standards require specific status codes for collection accounts. Mismatched codes lead to scoring errors.',
    suggestedEvidence: ['Metro 2 Data Format Guide', 'Bureau data printout'],
    legalCitations: ['METRO2_GUIDE', 'FCRA_607_b']
  },
  R2: {
    name: 'Post-Payment Re-aging Violation',
    severity: 'high',
    successProbability: 95,
    whyItMatters: 'Partial payments do NOT reset the 7-year reporting clock for credit reporting, though they might for state SOL.',
    suggestedEvidence: ['Payment history', 'Proof of original DOFD'],
    legalCitations: ['FCRA_605_c_1'],
    discoveryQuestions: [
      'Did a collector tell you that making a small payment would "help your credit" or "update the date"?',
      'Have you made any "good faith" payments recently?'
    ],
    bureauTactics: {
      all: 'Clearly distinguish between state SOL (which can reset) and the FCRA 7-year clock (which cannot). This is a common point of collector deception.'
    }
  }
};

// State Statute of Limitations data
interface StateSolData {
  writtenContracts: number;
  oralContracts: number;
  promissoryNotes: number;
  openAccounts: number;
  judgmentInterestCap: number;
  medicalInterestCap: number;
}

const STATE_SOL: Record<string, StateSolData> = {
  'AL': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.075, medicalInterestCap: 0.08 },
  'AK': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.105, medicalInterestCap: 0.05 },
  'AZ': { writtenContracts: 6, oralContracts: 3, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.10, medicalInterestCap: 0.03 },
  'AR': { writtenContracts: 5, oralContracts: 5, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.10, medicalInterestCap: 0.06 },
  'CA': { writtenContracts: 4, oralContracts: 2, promissoryNotes: 4, openAccounts: 4, judgmentInterestCap: 0.10, medicalInterestCap: 0.05 },
  'CO': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'CT': { writtenContracts: 6, oralContracts: 3, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.10, medicalInterestCap: 0.06 },
  'DE': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.10, medicalInterestCap: 0.05 },
  'FL': { writtenContracts: 5, oralContracts: 4, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.09, medicalInterestCap: 0.09 },
  'GA': { writtenContracts: 6, oralContracts: 4, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.07, medicalInterestCap: 0.07 },
  'HI': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.10, medicalInterestCap: 0.10 },
  'ID': { writtenContracts: 5, oralContracts: 4, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.12, medicalInterestCap: 0.12 },
  'IL': { writtenContracts: 5, oralContracts: 5, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.09, medicalInterestCap: 0.05 },
  'IN': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'IA': { writtenContracts: 5, oralContracts: 5, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.05, medicalInterestCap: 0.05 },
  'KS': { writtenContracts: 5, oralContracts: 3, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.10, medicalInterestCap: 0.10 },
  'KY': { writtenContracts: 5, oralContracts: 5, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'LA': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'ME': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'MD': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.10, medicalInterestCap: 0.06 },
  'MA': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.12, medicalInterestCap: 0.06 },
  'MI': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.07, medicalInterestCap: 0.07 },
  'MN': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.06, medicalInterestCap: 0.04 },
  'MS': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'MO': { writtenContracts: 5, oralContracts: 5, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.09, medicalInterestCap: 0.09 },
  'MT': { writtenContracts: 5, oralContracts: 5, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.10, medicalInterestCap: 0.10 },
  'NE': { writtenContracts: 5, oralContracts: 4, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.06, medicalInterestCap: 0.06 },
  'NV': { writtenContracts: 6, oralContracts: 4, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.08, medicalInterestCap: 0.00 },
  'NH': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'NJ': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.06, medicalInterestCap: 0.06 },
  'NM': { writtenContracts: 6, oralContracts: 4, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'NY': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.09, medicalInterestCap: 0.02 },
  'NC': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'ND': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.06, medicalInterestCap: 0.06 },
  'OH': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.05, medicalInterestCap: 0.05 },
  'OK': { writtenContracts: 5, oralContracts: 3, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.06, medicalInterestCap: 0.06 },
  'OR': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.09, medicalInterestCap: 0.09 },
  'PA': { writtenContracts: 4, oralContracts: 4, promissoryNotes: 4, openAccounts: 4, judgmentInterestCap: 0.06, medicalInterestCap: 0.06 },
  'RI': { writtenContracts: 10, oralContracts: 10, promissoryNotes: 10, openAccounts: 10, judgmentInterestCap: 0.12, medicalInterestCap: 0.12 },
  'SC': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.08, medicalInterestCap: 0.08 },
  'SD': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.10, medicalInterestCap: 0.10 },
  'TN': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.10, medicalInterestCap: 0.10 },
  'TX': { writtenContracts: 4, oralContracts: 4, promissoryNotes: 4, openAccounts: 4, judgmentInterestCap: 0.06, medicalInterestCap: 0.06 },
  'UT': { writtenContracts: 6, oralContracts: 4, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.10, medicalInterestCap: 0.10 },
  'VT': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.12, medicalInterestCap: 0.12 },
  'VA': { writtenContracts: 5, oralContracts: 3, promissoryNotes: 5, openAccounts: 5, judgmentInterestCap: 0.06, medicalInterestCap: 0.06 },
  'WA': { writtenContracts: 6, oralContracts: 3, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.12, medicalInterestCap: 0.09 },
  'WV': { writtenContracts: 6, oralContracts: 5, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.07, medicalInterestCap: 0.07 },
  'WI': { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6, judgmentInterestCap: 0.05, medicalInterestCap: 0.05 },
  'WY': { writtenContracts: 8, oralContracts: 8, promissoryNotes: 8, openAccounts: 8, judgmentInterestCap: 0.07, medicalInterestCap: 0.07 },
  'DC': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.06, medicalInterestCap: 0.06 }
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
    legalCitations: rule.legalCitations,
    successProbability: rule.successProbability || 50,
    discoveryQuestions: rule.discoveryQuestions || [],
    bureauTactics: rule.bureauTactics || {}
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
  const status = (fields.accountStatus || '').toLowerCase();
  const history = (fields.paymentHistory || '').toUpperCase();

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

  // E1: Future dates
  const dateFields: (keyof CreditFields)[] = ['dateOpened', 'dateReportedOrUpdated', 'dofd', 'chargeOffDate', 'dateLastPayment'];
  for (const f of dateFields) {
    const d = parseDate(fields[f] as string);
    if (d && d > new Date(today.getTime() + 86400000)) {
      flags.push(createFlag('E1',
        `The ${f} is reported as ${fields[f]}, which is in the future. This is a clear data integrity violation.`,
        { field: f, value: fields[f] }
      ));
    }
  }

  // D1: Paid status with balance
  if (status && fields.currentBalance) {
    const isPaid = ['paid', 'settled', 'zero balance'].some(s => status.includes(s));
    const bal = parseFloat(fields.currentBalance.replace(/[$,]/g, ''));
    if (isPaid && bal > 0) {
      flags.push(createFlag('D1',
        `Account status is "${fields.accountStatus}" but shows a balance of $${bal.toFixed(2)}. Paid/settled accounts must show $0 balance.`,
        { status: fields.accountStatus, balance: fields.currentBalance }
      ));
    }
  }

  // H1/H2/H3: Medical Debt
  const isMedical = (fields.accountType || '').toLowerCase().includes('medical') || 
                    (fields.furnisherOrCollector || '').toLowerCase().includes('health') ||
                    (fields.furnisherOrCollector || '').toLowerCase().includes('hospital');
  
  if (isMedical && fields.currentBalance) {
    const bal = parseFloat(fields.currentBalance.replace(/[$,]/g, ''));
    if (!isNaN(bal) && bal > 0 && bal < 500) {
      flags.push(createFlag('H2',
        `This medical debt has a balance of $${bal.toFixed(2)}, which is under the $500 threshold for credit reporting.`,
        { balance: fields.currentBalance }
      ));
    }
  }

  // M2: Transferred with balance
  if (status && (status.includes('transfer') || status.includes('sold'))) {
    const bal = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
    if (bal > 0) {
      flags.push(createFlag('M2',
        `Account is marked as "${fields.accountStatus}" but still shows a balance. Transferred or sold accounts must be reported with $0 balance.`,
        { status: fields.accountStatus, balance: fields.currentBalance }
      ));
    }
  }

  // K7: Interest Rate Violation
  if (fields.stateCode && fields.currentBalance && fields.originalAmount && dofd) {
    const sol = STATE_SOL[fields.stateCode.toUpperCase()];
    if (sol) {
      const curr = parseFloat(fields.currentBalance.replace(/[$,]/g, ''));
      const orig = parseFloat(fields.originalAmount.replace(/[$,]/g, ''));
      const yearsPassed = (today.getTime() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      
      if (orig > 0 && curr > orig && yearsPassed > 0.5) {
        const annualRate = ((curr - orig) / orig) / yearsPassed;
        const cap = isMedical ? sol.medicalInterestCap : sol.judgmentInterestCap;
        
        if (annualRate > cap) {
          flags.push(createFlag('K7',
            `Forensic Interest Audit: Implied annual rate of ${(annualRate*100).toFixed(1)}% exceeds the ${fields.stateCode} legal cap of ${(cap*100).toFixed(1)}%.`,
            { annualRate: (annualRate*100).toFixed(1), legalCap: (cap*100).toFixed(1) }
          ));
        }
      }
    }
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

  // S2: Judgment age check (if account type is judgment)
  if (accountType.includes('judgment') && dofd) {
    const judgmentExpiry = new Date(dofd);
    judgmentExpiry.setFullYear(judgmentExpiry.getFullYear() + 7);

    if (today > judgmentExpiry) {
      flags.push(createFlag('S2',
        `This judgment appears to be older than 7 years from the filing date and should be removed from your credit report.`,
        { accountType: fields.accountType, dofd: fields.dofd }
      ));
    }
  }

  // F1: Stale data check (last reported > 90 days ago)
  const lastReported = parseDate(fields.dateReportedOrUpdated);
  if (lastReported) {
    const daysSinceUpdate = Math.floor((today.getTime() - lastReported.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 90) {
      flags.push(createFlag('F1',
        `This account hasn't been updated in ${daysSinceUpdate} days. Furnishers should update at least monthly.`,
        { dateReportedOrUpdated: fields.dateReportedOrUpdated, daysSinceUpdate }
      ));
    }
  }

  // P1: Payment history gaps
  if (history && history.length > 12) {
    const hasGaps = /[^COXR0123456789\s]{3,}/.test(history);
    if (hasGaps) {
      flags.push(createFlag('P1',
        'Payment history appears to have gaps or missing data, which may not accurately reflect your payment behavior.',
        { paymentHistory: history.substring(0, 24) }
      ));
    }
  }

  // T1: Account type misclassification check
  if (accountType === 'collection' && status.includes('current')) {
    flags.push(createFlag('T1',
      'Account is classified as a collection but shows "current" status. This may be a misclassified account.',
      { accountType: fields.accountType, accountStatus: fields.accountStatus }
    ));
  }

  // Z1: Zombie Debt / Re-aging suspected by opening date
  if (accountType === 'collection' && dateOpened && dofd) {
    const yearsToCollection = (dateOpened.getTime() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (yearsToCollection > 3) {
      flags.push(createFlag('Z1',
        `This collection account was opened ${yearsToCollection.toFixed(1)} years after the DOFD. This "Zombie Debt" pattern often masks illegal re-aging of the reporting period.`,
        { dofd: fields.dofd, dateOpened: fields.dateOpened, gap: yearsToCollection.toFixed(1) }
      ));
    }
  }

  // M3: Metro2 Integrity - Collection must have specific account types
  if (accountType === 'collection' && fields.accountType && 
     !['collection', 'factoring company', 'debt buyer'].includes(fields.accountType.toLowerCase())) {
    flags.push(createFlag('M3',
      `Account is being reported as "${fields.accountType}" but has a collection status. Metro 2 requires consistent account types for collection items.`,
      { accountType: fields.accountType, status: fields.accountStatus }
    ));
  }

  // R2: Post-Payment Re-aging Check
  if (lastPayment && dofd && removalDate) {
    const expectedRemoval = new Date(dofd);
    expectedRemoval.setFullYear(expectedRemoval.getFullYear() + 7);
    expectedRemoval.setDate(expectedRemoval.getDate() + 180);

    if (removalDate > expectedRemoval && lastPayment > dofd) {
      flags.push(createFlag('R2',
        `Illegal Re-aging Detected: The removal date (${fields.estimatedRemovalDate}) appears to have been reset based on a payment made on ${fields.dateLastPayment}. The 7-year clock cannot be reset by payment.`,
        { dofd: fields.dofd, dateLastPayment: fields.dateLastPayment, removalDate: fields.estimatedRemovalDate }
      ));
    }
  }

  // Additional balance reasonableness check
  const current = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
  const original = parseFloat((fields.originalAmount || '0').replace(/[$,]/g, ''));

  // C2: Major balance discrepancy (if balance is way higher than reasonable)
  if (original > 0 && current > original * 3) {
    flags.push(createFlag('C2',
      `The current balance ($${current.toFixed(2)}) is ${((current / original) * 100).toFixed(0)}% of the original amount ($${original.toFixed(2)}), suggesting excessive fees or interest accumulation.`,
      { currentBalance: fields.currentBalance, originalAmount: fields.originalAmount }
    ));
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
  const reAgingRules = flags.filter(f => ['B1', 'B2', 'B3', 'K6', 'Z1', 'R2'].includes(f.ruleId));
  if (reAgingRules.length >= 2) {
    patterns.push({
      patternName: 'Systemic Debt Re-Aging',
      confidenceScore: Math.min(98, 65 + reAgingRules.length * 10),
      legalStrength: 'definitive',
      matchedRules: reAgingRules.map(r => r.ruleId),
      description: 'Multiple forensic markers indicate an intentional attempt to illegally extend the reporting period beyond the FCRA 7-year limit.',
      recommendedAction: 'Immediate litigation or formal CFPB complaint required. This pattern is often willful noncompliance.'
    });
  }

  // Zombie Debt Pattern
  const zombieRules = flags.filter(f => ['Z1', 'S1', 'F1'].includes(f.ruleId));
  if (zombieRules.length >= 2) {
    patterns.push({
      patternName: 'Zombie Debt Resuscitation',
      confidenceScore: 85,
      legalStrength: 'strong',
      matchedRules: zombieRules.map(r => r.ruleId),
      description: 'Pattern indicates an attempt to collect on old, possibly time-barred debt by refreshing the reporting dates.',
      recommendedAction: 'Send Cease and Desist letter. Dispute based on DOFD integrity. Check state SOL for affirmative defense.'
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

  // score breakdown
  const scoreBreakdown: ScoreImpact[] = [
    { 
      category: 'Timeline Integrity', 
      impact: flags.filter(f => f.ruleId.startsWith('B') || f.ruleId === 'K6').length * 20,
      description: 'Date manipulation and reporting period violations.'
    },
    { 
      category: 'Data Accuracy', 
      impact: flags.filter(f => f.ruleId.startsWith('D') || f.ruleId.startsWith('E') || f.ruleId.startsWith('M')).length * 15,
      description: 'Logical inconsistencies and balance reporting errors.'
    },
    { 
      category: 'Legal Compliance', 
      impact: flags.filter(f => f.ruleId.startsWith('S') || f.ruleId.startsWith('H') || f.ruleId.startsWith('R')).length * 25,
      description: 'Violations of state SOL, medical debt rules, or bankruptcy law.'
    },
    { 
      category: 'Procedural Errors', 
      impact: flags.filter(f => f.ruleId.startsWith('F') || f.ruleId.startsWith('C') || f.ruleId.startsWith('P')).length * 10,
      description: 'Stale data, missing dispute markers, or incomplete history.'
    }
  ].map(s => ({ ...s, impact: Math.min(100, s.impact) }));

  return {
    overallScore,
    riskLevel,
    disputeStrength,
    litigationPotential,
    detectedPatterns: patterns,
    keyViolations,
    recommendedApproach,
    scoreBreakdown
  };
}

/**
 * Export everything needed
 */
export { RULE_DEFINITIONS, STATE_SOL, parseDate };
