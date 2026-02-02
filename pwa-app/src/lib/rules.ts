/**
 * FCRA/FDCPA Rule Engine - TypeScript Implementation
 * Detects debt re-aging and credit reporting violations
 */

import {
  CreditFields,
  RuleFlag,
  RiskProfile,
  PatternScore,
  ScoreImpact,
  RuleDefinition,
  FieldValue,
  BureauTactics
} from './types';

// State Statute of Limitations data
export interface StateSolData {
  writtenContracts: number;
  oralContracts: number;
  promissoryNotes: number;
  openAccounts: number;
  judgmentInterestCap: number;
  medicalInterestCap: number;
}


// Rule metadata with strict typing
const RULE_DEFINITIONS: Record<string, RuleDefinition> = {
  B1: {
    name: 'DOFD Before Account Opening',
    severity: 'high',
    successProbability: 95,
    whyItMatters: 'A debt cannot become delinquent before the account even existed. This is a clear sign of data manipulation.',
    suggestedEvidence: ['Original account agreement', 'First statement showing account open date'],
    legalCitations: ['FCRA_623_a1', 'FCRA_611'],
    nextStep: 'Demand immediate deletion from the bureau citing "Physical Impossibility".',
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
    nextStep: 'Calculate the 7yr+180day limit from the original DOFD and demand removal.',
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
    legalCitations: ['FCRA_623_a5', 'FCRA_611'],
    nextStep: 'The dates are logically impossible. Demand a full audit of the reporting timeline.'
  },
  K1: {
    name: 'Value Increase After Charge-Off',
    severity: 'medium',
    successProbability: 65,
    whyItMatters: 'After charge-off, the value should not increase except for documented adjustments.',
    suggestedEvidence: ['Original charge-off statement', 'Adjustment disclosure documents'],
    legalCitations: ['FDCPA_807', 'FCRA_623_a1'],
    nextStep: 'Request an itemized breakdown of post-charge-off additions.'
  },
  K6: {
    name: 'Removal Date Beyond 7 Years from DOFD',
    severity: 'high',
    successProbability: 98,
    whyItMatters: 'This is the classic "re-aging" violation - extending reporting beyond the legal limit.',
    suggestedEvidence: ['Prior credit reports', 'Original creditor DOFD verification'],
    legalCitations: ['FCRA_605_a', 'FCRA_605_c'],
    nextStep: 'This account is past the legal reporting limit. File a CFPB complaint immediately for "obsolescence" violation.',
    discoveryQuestions: [
      'Has this account fallen off your credit report and then reappeared later?',
      'Did you make any partial payments recently that might have triggered a date refresh?'
    ],
    bureauTactics: {
      all: 'This is a per-se violation. Demand immediate deletion. If they "verify" it, they are likely ignoring the actual DOFD field in the Metro 2 record.'
    }
  },
  K7: {
    name: 'Excessive Threshold (State Law Violation)',
    severity: 'high',
    successProbability: 75,
    whyItMatters: 'State laws cap the total value increase that can be applied to reported accounts.',
    suggestedEvidence: ['Itemized statement of interest and fees'],
    legalCitations: ['STATE_INTEREST_STATUTE'],
    nextStep: 'Check state-specific interest caps and file a cross-state collector complaint.',
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
    legalCitations: ['FCRA_623_a5', 'METRO2_GUIDE'],
    nextStep: 'Force the furnisher to supply the missing DOFD to determine if the account is obsolete.'
  },
  M2: {
    name: 'Metro2: Transferred with Value',
    severity: 'high',
    successProbability: 90,
    whyItMatters: 'If an account is transferred or sold, the value MUST be reported as 0.00.',
    suggestedEvidence: ['Transfer notice', 'New collector statement'],
    legalCitations: ['METRO2_GUIDE', 'FCRA_623_a1'],
    nextStep: 'The original creditor is double-counting the debt. Demand they update balance to $0.00.'
  },
  H1: {
    name: 'Medical Debt: < 365 Days',
    severity: 'high',
    successProbability: 99,
    whyItMatters: 'Medical debt cannot be reported until 365 days after the date of service.',
    suggestedEvidence: ['Medical bill showing date of service'],
    legalCitations: ['CFPB_MEDICAL_RULE'],
    nextStep: 'File a specialized medical debt violation complaint with the CFPB.'
  },
  H2: {
    name: 'Medical Case: Value Under 500',
    severity: 'high',
    successProbability: 99,
    whyItMatters: 'Certain medical notations under 500 should not appear on credit records.',
    suggestedEvidence: ['Proof of stated value'],
    legalCitations: ['CFPB_MEDICAL_RULE'],
    nextStep: 'All medical debt under $500 is non-reportable. Demand immediate exclusion.'
  },
  E1: {
    name: 'Future Date Reported',
    severity: 'high',
    successProbability: 95,
    whyItMatters: 'Dates in the future indicate systemic data corruption.',
    suggestedEvidence: ['N/A - Logical error'],
    legalCitations: ['FCRA_623_a1'],
    nextStep: 'Cite logical impossibility in the dispute and request deletion for high inaccuracy.'
  },
  D1: {
    name: 'Settled Status with Value',
    severity: 'high',
    successProbability: 94,
    whyItMatters: 'If status is paid or settled, the value must be 0.00.',
    suggestedEvidence: ['Settlement letter', 'Payment receipt'],
    legalCitations: ['FCRA_623_a1'],
    nextStep: 'A "Settled" account cannot have a balance. Demand the furnisher balance the book to $0.00.'
  },
  L1: {
    name: 'Status vs History Mismatch',
    severity: 'medium',
    successProbability: 70,
    whyItMatters: 'Account status contradicts payment history, indicating inaccurate reporting.',
    suggestedEvidence: ['Payment records', 'Bank statements'],
    legalCitations: ['FCRA_623_a1', 'FCRA_611'],
    nextStep: 'Request a manual review of the payment ledger vs the reported status string.'
  },
  S1: {
    name: 'Statute of Limitations Expired',
    severity: 'medium',
    successProbability: 60,
    whyItMatters: 'While the debt may still be reported, it cannot be legally collected if the SOL has expired.',
    suggestedEvidence: ['Proof of last payment date', 'State SOL reference'],
    legalCitations: ['STATE_SOL_STATUTE', 'FDCPA_807_2'],
    nextStep: 'The SOL has expired. Use this as leverage to negotiate a "Pay for Delete" or permanent removal.'
  },
  S2: {
    name: 'Judgment Age Violation',
    severity: 'high',
    successProbability: 85,
    whyItMatters: 'Judgments can only be reported for 7 years from the date the judgment was filed.',
    suggestedEvidence: ['Court records', 'Judgment filing date documentation'],
    legalCitations: ['FCRA_605_a3', 'FCRA_611'],
    nextStep: 'Judgments over 7 years must be deleted regardless of satisfied status.'
  },
  C1: {
    name: 'Disputed Status Not Shown',
    severity: 'medium',
    successProbability: 75,
    whyItMatters: 'If you disputed this account, it must be marked as disputed on your credit report.',
    suggestedEvidence: ['Dispute confirmation', 'Certified mail receipt'],
    legalCitations: ['FCRA_611_a3', 'FCRA_623_b'],
    nextStep: 'Failure to mark an account as disputed is a serious FCRA 623(b) violation. Demand immediate update.'
  },
  C2: {
    name: 'Value Inconsistency',
    severity: 'medium',
    successProbability: 55,
    whyItMatters: 'Significant variations in stated value without explanation suggest inaccurate reporting.',
    suggestedEvidence: ['Account statements', 'Payment records'],
    legalCitations: ['FCRA_623_a1'],
    nextStep: 'Request an itemized account history to resolve the numerical discrepancies.'
  },
  F1: {
    name: 'Stale Data (90+ Days)',
    severity: 'low',
    successProbability: 45,
    whyItMatters: 'Accounts should be updated at least monthly. Stale data may indicate the furnisher is no longer verifying accuracy.',
    suggestedEvidence: ['Request current account statement'],
    legalCitations: ['FCRA_623_a2', 'METRO2_GUIDE'],
    nextStep: 'Challenge the furnisher\'s ability to verify the data if they have not updated in 90+ days.'
  },
  F2: {
    name: 'Duplicate Reporting',
    severity: 'high',
    successProbability: 88,
    whyItMatters: 'The same instance cannot be reported by multiple entities simultaneously with values.',
    suggestedEvidence: ['Credit report showing both entries', 'Transfer/sale documentation'],
    legalCitations: ['FCRA_623_a1', 'FCRA_611'],
    nextStep: 'Double-entry reporting is illegal. Demand the duplicate entry be deleted immediately.'
  },
  R1: {
    name: 'Reporting After Bankruptcy Discharged',
    severity: 'high',
    successProbability: 96,
    whyItMatters: 'Accounts discharged in bankruptcy must show 0.00 value and are no longer subject to active reporting.',
    suggestedEvidence: ['Bankruptcy discharge order', 'Schedule listing the debt'],
    legalCitations: ['FCRA_605_a1', '11USC524'],
    nextStep: 'Cite the permanent discharge injunction and demand immediate deletion of the balance.'
  },
  A1: {
    name: 'Account Number Mismatch',
    severity: 'medium',
    successProbability: 60,
    whyItMatters: 'If the account number reported doesn\'t match your records, it may be mixed credit file.',
    suggestedEvidence: ['Original account documents', 'Statements'],
    legalCitations: ['FCRA_611', 'FCRA_623_a1'],
    nextStep: 'This may be a "Mixed File" or identity error. Demand identity verification for this node.'
  },
  P1: {
    name: 'Payment History Gap',
    severity: 'low',
    successProbability: 40,
    whyItMatters: 'Missing months in payment history can mask on-time payments.',
    suggestedEvidence: ['Bank statements', 'Payment confirmations'],
    legalCitations: ['FCRA_623_a2'],
    nextStep: 'Demand the missing months be populated or the entire record be deleted for incompleteness.'
  },
  T1: {
    name: 'Incorrect Account Type',
    severity: 'medium',
    successProbability: 65,
    whyItMatters: 'Reporting a credit card as a collection when it was closed normally affects your score differently.',
    suggestedEvidence: ['Original account terms', 'Closure documentation'],
    legalCitations: ['FCRA_623_a1', 'METRO2_GUIDE'],
    nextStep: 'The account classification is incorrect. Request correction to the truthful account type.'
  },
  Z1: {
    name: 'Zombie Debt: Suspected Re-aging',
    severity: 'high',
    successProbability: 82,
    whyItMatters: 'An account opened years after the original default often indicates a "Zombie Debt" buyer trying to restart the reporting clock.',
    suggestedEvidence: ['Original creditor records', 'Historical credit reports'],
    legalCitations: ['FCRA_605_c', 'FDCPA_807'],
    nextStep: 'File a FDCPA complaint against the collector for deceptive re-aging practices.',
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
    legalCitations: ['METRO2_GUIDE', 'FCRA_607_b'],
    nextStep: 'The status code combo is invalid under Metro 2 rules. Demand correction for maximum accuracy.'
  },
  R2: {
    name: 'Post-Payment Re-aging Violation',
    severity: 'high',
    successProbability: 95,
    whyItMatters: 'Partial payments do NOT reset the 7-year reporting clock for credit reporting, though they might for state SOL.',
    suggestedEvidence: ['Payment history', 'Proof of original DOFD'],
    legalCitations: ['FCRA_605_c_1'],
    nextStep: 'Cite FCRA §605(c)(1) stating that partial payments do not reset the obsolescence clock.',
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
  'NY': { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3, judgmentInterestCap: 0.09, medicalInterestCap: 0.02 },
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
 * Robust implementation handling multiple US and ISO formats with fuzzy OCR correction
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  
  // OCR Correction: 'O'->'0', 'I'->'1', 'S'->'5', 'B'->'8'
  let cleaned = dateStr.trim().toLowerCase()
    .replace(/[ol]/g, (m) => (m === 'o' ? '0' : '1'))
    .replace(/[|i]/g, '1')
    .replace(/s/g, '5')
    .replace(/b/g, '8')
    .replace(/[^a-z0-9\/ \-]/g, '');

  if (cleaned.length < 4) return null;

  // 1. ISO Format (YYYY-MM-DD or YYYY-MM) - Handle spaces after OCR
  const isoSearch = cleaned.replace(/\s/g, '').match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (isoSearch) {
    const year = parseInt(isoSearch[1]);
    const month = parseInt(isoSearch[2]) - 1;
    const day = isoSearch[3] ? parseInt(isoSearch[3]) : 1;
    return new Date(year, month, day);
  }

  // 2. US Slashing (MM/DD/YYYY or MM-DD-YYYY or M M/ D D/ YYYY)
  const usCleaned = cleaned.replace(/\s/g, '');
  const usMatch = usCleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (usMatch) {
    let year = parseInt(usMatch[3]);
    if (year < 100) year += year > 50 ? 1900 : 2000;
    return new Date(year, parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
  }

  // 3. Month Name Formats
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  const monthNames = Object.keys(months).join('|');
  
  // Format: Month DD, YYYY
  const mdyPattern = new RegExp(`^(${monthNames})[a-z]*\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})$`, 'i');
  const mdyMatch = cleaned.match(mdyPattern);
  if (mdyMatch) {
    return new Date(parseInt(mdyMatch[3]), months[mdyMatch[1].toLowerCase().substring(0, 3)], parseInt(mdyMatch[2]));
  }

  // Format: DD Month YYYY
  const dmyPattern = new RegExp(`^(\\d{1,2})\\s+(${monthNames})[a-z]*\\.?\\s+(\\d{4})$`, 'i');
  const dmyMatch = cleaned.match(dmyPattern);
  if (dmyMatch) {
    return new Date(parseInt(dmyMatch[3]), months[dmyMatch[2].toLowerCase().substring(0, 3)], parseInt(dmyMatch[1]));
  }

  // Format: Month YYYY
  const myPattern = new RegExp(`^(${monthNames})[a-z]*\\.?\\s+(\\d{4})$`, 'i');
  const myMatch = cleaned.match(myPattern);
  if (myMatch) {
    return new Date(parseInt(myMatch[2]), months[myMatch[1].toLowerCase().substring(0, 3)], 1);
  }

  // 4. Native Fallback
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
  fieldValues: Record<string, any>,
  confidence: number = 100
): RuleFlag {
  const rule = RULE_DEFINITIONS[ruleId] || {
    name: 'Unknown Rule',
    severity: 'medium',
    whyItMatters: '',
    suggestedEvidence: [],
    legalCitations: []
  };

  const severity = rule.severity || 'medium';

  return {
    ruleId,
    ruleName: rule.name,
    severity: severity as any,
    category: severity === 'low' ? 'anomaly' : 'violation',
    confidence,
    explanation,
    whyItMatters: rule.whyItMatters,
    suggestedEvidence: rule.suggestedEvidence,
    fieldValues,
    legalCitations: rule.legalCitations,
    nextStep: (rule as any).nextStep,
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
  
  // Normalize originalAmount to initialValue for compatibility
  const initialValue = fields.initialValue || fields.originalAmount;
  
  // Check if this is a medical debt account (used in multiple rule checks)
  const isMedical = (fields.accountType || '').toLowerCase().includes('medical') ||
    (fields.originalCreditor || '').toLowerCase().includes('hospital') ||
    (fields.originalCreditor || '').toLowerCase().includes('clinic') ||
    (fields.originalCreditor || '').toLowerCase().includes('medical') ||
    (fields.furnisherOrCollector || '').toLowerCase().includes('medical');

  // B1: DOFD before account opening
  if (dofd && dateOpened) {
    if (dofd < dateOpened) {
      flags.push(createFlag('B1',
        `The Date of First Delinquency (${fields.dofd}) is BEFORE the account was opened (${fields.dateOpened}). This is physically impossible and indicates data manipulation.`,
        { dofd: fields.dofd, dateOpened: fields.dateOpened },
        98 // High confidence because both dates are present and contradictory
      ));
    }
  }

  // B2: Impossible 7-year timeline
  if (dofd && removalDate) {
    const yearsToRemoval = yearsBetween(dofd, removalDate);
    if (yearsToRemoval > 7.5) {
      flags.push(createFlag('B2',
        `The estimated removal date (${fields.estimatedRemovalDate}) is ${yearsToRemoval.toFixed(1)} years after the DOFD (${fields.dofd}). The maximum allowed is 7 years plus 180 days.`,
        { dofd: fields.dofd, estimatedRemovalDate: fields.estimatedRemovalDate, yearsCalculated: yearsToRemoval.toFixed(1) },
        95
      ));
    }
  } else if (!dofd && removalDate) {
      // If we have removal date but no DOFD, we can't be sure, but it's an anomaly if the account is old
      // We don't flag here to avoid user confusion, M1 handles missing DOFD
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

  // D1: Paid status with value
  if (status && fields.currentValue) {
    const isPaid = ['paid', 'settled', 'zero value'].some(s => status.includes(s));
    const val = parseFloat(fields.currentValue.replace(/[$,]/g, ''));
    if (isPaid && val > 0) {
      flags.push(createFlag('D1',
        `Account status is "${fields.accountStatus}" but shows a value of ${val.toFixed(2)}. Paid/settled accounts must show 0.00 value.`,
        { status: fields.accountStatus, value: fields.currentValue }
      ));
    }
  }

  // R1: Reporting After Bankruptcy Discharged
  if (status.includes('bankruptcy') || status.includes('discharged')) {
    const val = parseFloat((fields.currentValue || '0').replace(/[$,]/g, ''));
    if (val > 0) {
      flags.push(createFlag('R1',
        `Account marked as "${fields.accountStatus}" but shows a persistent value of ${val.toFixed(2)}. Discharged debts must show 0.00 value.`,
        { status: fields.accountStatus, value: fields.currentValue }
      ));
    }
  }

  // C1: Disputed Status Not Shown
  const remarks = (fields.remarks || '').toLowerCase();
  const hasDisputeMarker = remarks.includes('dispute') || remarks.includes('subscriber disagrees') || remarks.includes('fcra');
  // This rule is harder to automate without knowing if the user DID dispute, 
  // but we can flag it as a "Verification Point"
  if (!hasDisputeMarker && (status.includes('collect') || status.includes('delinquent'))) {
    // We only add this if we have some evidence of a prior dispute, 
    // for now let's keep it as an "Audit Note" or leave it for manual trigger
  }

  // M2: Transferred with value
  if (status && (status.includes('transfer') || status.includes('sold'))) {
    const val = parseFloat((fields.currentValue || '0').replace(/[$,]/g, ''));
    if (val > 0) {
      flags.push(createFlag('M2',
        `Account is marked as "${fields.accountStatus}" but still shows a value. Transferred or sold accounts must be reported with 0.00 value.`,
        { status: fields.accountStatus, value: fields.currentValue }
      ));
    }
  }

  // K7: Adjustment Deviation (formerly Interest Rate Violation)
  if (fields.stateCode && fields.currentValue && initialValue && dofd) {
    const sol = STATE_SOL[fields.stateCode.toUpperCase()];
    if (sol) {
      const curr = parseFloat(fields.currentValue.replace(/[$,]/g, ''));
      const init = parseFloat(initialValue.replace(/[$,]/g, ''));
      const yearsPassed = (today.getTime() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      if (init > 0 && curr > init && yearsPassed > 0.5) {
        const annualRate = ((curr - init) / init) / yearsPassed;
        const cap = isMedical ? sol.medicalInterestCap : sol.judgmentInterestCap;

        if (annualRate > cap) {
          flags.push(createFlag('K7',
            `Forensic Audit: Implied annual deviation of ${(annualRate * 100).toFixed(1)}% exceeds the ${fields.stateCode} expected cap of ${(cap * 100).toFixed(1)}%.`,
            { annualRate: (annualRate * 100).toFixed(1), legalCap: (cap * 100).toFixed(1) }
          ));
        }
      }
    }
  }

  // K1: Value increase after charge-off
  if (fields.currentValue && initialValue) {
    const current = parseFloat(fields.currentValue.replace(/[$,]/g, ''));
    const initial = parseFloat(initialValue.replace(/[$,]/g, ''));

    if (!isNaN(current) && !isNaN(initial) && current > initial * 1.5) {
      flags.push(createFlag('K1',
        `Current value (${current.toFixed(2)}) is ${((current / initial - 1) * 100).toFixed(0)}% higher than the initial value (${initial.toFixed(2)}). Significant unexplained increase.`,
        { currentValue: fields.currentValue, initialValue: initialValue }
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

  // S1: Statute of Limitations check with granular account type matching
  if (fields.stateCode && lastPayment) {
    const sol = STATE_SOL[fields.stateCode.toUpperCase()];
    if (sol) {
      let limit = sol.writtenContracts; // Default
      let typeLabel = 'written contract';

      if (accountType.includes('revolving') || accountType.includes('card')) {
        limit = sol.openAccounts;
        typeLabel = 'open/revolving account';
      } else if (accountType.includes('installment') || accountType.includes('loan')) {
        limit = sol.promissoryNotes || sol.writtenContracts;
        typeLabel = 'promissory note/contract';
      }

      const solExpiry = new Date(lastPayment);
      solExpiry.setFullYear(solExpiry.getFullYear() + limit);

      if (today > solExpiry) {
        flags.push(createFlag('S1',
          `Forensic Audit: This debt exceeds the ${limit}-year ${fields.stateCode} SOL for ${typeLabel}s. The legal collection window likely expired on ${solExpiry.toISOString().split('T')[0]}.`,
          { stateCode: fields.stateCode, dateLastPayment: fields.dateLastPayment, solYears: limit, accountType: fields.accountType }
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

  // K6: Removal Date Logic (Direct Re-aging Detection)
  // removalDate already declared at top of function
  if (removalDate && dofd) {
    const maxRemoval = new Date(dofd);
    // 7 years + 180 days per FCRA 605(c)
    maxRemoval.setMonth(maxRemoval.getMonth() + (7 * 12) + 7); 

    if (removalDate > maxRemoval) {
      flags.push(createFlag('K6',
        `Forensic marker detected: The removal date (${fields.estimatedRemovalDate}) is beyond the statutory 7-year+180-day limit based on the reported DOFD (${fields.dofd}).`,
        { estimatedRemovalDate: fields.estimatedRemovalDate, dofd: fields.dofd }
      ));
    }
  }

  // Z1: Zombie Debt / Account Resuscitation logic
  // dateOpened already declared at top of function
  if (dateOpened && dofd && (accountType.toLowerCase().includes('collect') || accountType.toLowerCase().includes('factor'))) {
    const yearsDiff = (dateOpened.getTime() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (yearsDiff > 3) {
      flags.push(createFlag('Z1',
        `Suspected "Zombie Debt" pattern: This collection account was activated ${yearsDiff.toFixed(1)} years after the original delinquency. This is often proof of debt refreshing.`,
        { dateOpened: fields.dateOpened, dofd: fields.dofd }
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

  // Additional value reasonableness check
  const current = parseFloat((fields.currentValue || '0').replace(/[$,]/g, ''));
  const original = parseFloat((fields.initialValue || '0').replace(/[$,]/g, ''));

  // C2: Major value discrepancy (if value is way higher than reasonable)
  if (original > 0 && current > original * 3) {
    flags.push(createFlag('C2',
      `The current value (${current.toFixed(2)}) is ${((current / original) * 100).toFixed(0)}% of the initial value (${original.toFixed(2)}), suggesting significant quantitative deviations.`,
      { currentValue: fields.currentValue, initialValue: fields.initialValue }
    ));
  }

  // H1 & H2: Medical Debt Check (isMedical already defined at top of function)
  if (isMedical) {
    const value = parseFloat((fields.currentValue || '0').replace(/[^0-9.]/g, ''));
    
    // H2: Under $500
    if (value > 0 && value < 500) {
      flags.push(createFlag('H2',
        `Medical debt of $${value.toFixed(2)} is being reported despite being under the $500 non-reportable threshold.`,
        { value: value }
      ));
    }

    // H1: Waiting period check (if dateOpened is within 365 days of delinquency)
    if (dateOpened && dofd) {
       const timeDiff = (dateOpened.getTime() - dofd.getTime()) / (1000 * 60 * 60 * 24);
       if (timeDiff < 365) {
         flags.push(createFlag('H1',
           `Medical debt reported within the 365-day statutory waiting period. Date Opened: ${fields.dateOpened}, DOFD: ${fields.dofd}.`,
           { dateOpened: fields.dateOpened, dofd: fields.dofd }
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

  // Generate tactical summary
  const summary = flags.length > 0
    ? `Detected ${flags.length} violations including ${keyViolations.slice(0, 2).join(' and ')}. Total forensic strength is ${disputeStrength} with a ${riskLevel} litigation risk level.`
    : "No major reporting violations detected in current scan.";

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
      description: 'Logical inconsistencies and value reporting errors.'
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
    summary,
    scoreBreakdown
  };
}

/**
 * Export everything needed
 */
export { RULE_DEFINITIONS, STATE_SOL, parseDate };
export type { CreditFields, RuleFlag, RiskProfile } from './types';
