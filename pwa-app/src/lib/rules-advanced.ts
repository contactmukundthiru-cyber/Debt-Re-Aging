'use strict';

/**
 * Advanced FCRA/FDCPA Rule Engine v2.0
 *
 * This enhanced engine provides:
 * - 80+ violation detection rules
 * - Forensic date manipulation detection
 * - Cross-bureau contradiction analysis
 * - Chain-of-title validation
 * - Balance change forensics
 * - Willfulness scoring for statutory damages
 * - Jurisdiction-specific analysis
 * - Pattern fingerprinting
 */

import {
  CreditFields,
  RuleFlag,
  RiskProfile,
  PatternScore,
  ScoreImpact
} from './types';
import { parseDate, RULE_DEFINITIONS, STATE_SOL } from './rules';

// ============================================================================
// EXTENDED INTERFACES
// ============================================================================

export interface AdvancedRuleFlag extends Omit<RuleFlag, 'severity'> {
  severity: 'low' | 'medium' | 'high' | 'critical'; // Extended to include critical
  willfulnessScore: number; // 0-100, higher = more likely willful
  statutoryDamageRange: { min: number; max: number };
  actualDamageCategories: string[];
  chainOfCustodyIssue: boolean;
  crossBureauContradiction: boolean;
  forensicConfidence: number; // 0-100
  relatedRules: string[];
  remediation: string;
  timeToFile: number; // days remaining under SOL for private action
}

export interface ForensicAnalysis {
  dateManipulationScore: number; // 0-100
  balanceForensicsScore: number; // 0-100
  chainOfTitleScore: number; // 0-100
  furnisherBehaviorScore: number; // 0-100
  overallForensicRisk: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
  anomalies: ForensicAnomaly[];
  recommendations: ForensicRecommendation[];
}

export interface ForensicAnomaly {
  type: 'date' | 'balance' | 'status' | 'transfer' | 'identity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  legalImplication: string;
}

export interface ForensicRecommendation {
  priority: 'immediate' | 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  deadline?: string;
  legalBasis: string;
}

export interface CrossBureauAnalysis {
  bureauCount: number;
  contradictions: BureauContradiction[];
  consistencyScore: number; // 0-100
  maxPossibleAccuracyViolation: boolean;
}

export interface BureauContradiction {
  field: string;
  bureauA: { name: string; value: string };
  bureauB: { name: string; value: string };
  significance: 'material' | 'minor';
  legalImplication: string;
}

// ============================================================================
// ADVANCED RULE DEFINITIONS - 80+ RULES
// ============================================================================

export const ADVANCED_RULE_DEFINITIONS: Record<string, {
  name: string;
  category: 'fcra' | 'fdcpa' | 'metro2' | 'state' | 'medical' | 'student' | 'procedural';
  severity: 'low' | 'medium' | 'high' | 'critical';
  successProbability: number;
  willfulnessIndicator: number; // 0-100
  statutoryMin: number;
  statutoryMax: number;
  whyItMatters: string;
  suggestedEvidence: string[];
  legalCitations: string[];
  remediation: string;
}> = {
  // ====== TIMELINE/RE-AGING VIOLATIONS (B/K Series Enhanced) ======
  'B1-ADV': {
    name: 'DOFD Predates Account Existence',
    category: 'fcra',
    severity: 'critical',
    successProbability: 98,
    willfulnessIndicator: 95,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Physical impossibility proves intentional data fabrication.',
    suggestedEvidence: ['Original account opening documents', 'First statement'],
    legalCitations: ['15 USC § 1681e(b)', '15 USC § 1681s-2(a)(1)', 'Cushman v. Trans Union, 115 F.3d 220'],
    remediation: 'Immediate deletion required. No verification possible.'
  },
  'B4': {
    name: 'DOFD Modified After Initial Reporting',
    category: 'fcra',
    severity: 'critical',
    successProbability: 92,
    willfulnessIndicator: 90,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'DOFD must remain constant. Changes indicate illegal re-aging.',
    suggestedEvidence: ['Historical credit reports', 'Original creditor records'],
    legalCitations: ['15 USC § 1681s-2(a)(5)', 'FCRA § 623(a)(5)', 'Seamans v. Temple Univ., 744 F.3d 853'],
    remediation: 'Restore original DOFD or delete tradeline.'
  },

  'B5': {
    name: 'Collector Created New DOFD',
    category: 'fcra',
    severity: 'critical',
    successProbability: 95,
    willfulnessIndicator: 92,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Debt collectors cannot establish a new DOFD when purchasing debt.',
    suggestedEvidence: ['Original creditor DOFD', 'Purchase agreement date', 'Chain of title'],
    legalCitations: ['15 USC 1681s-2(a)(5)', 'FTC Commentary'],
    remediation: 'Must use original creditor DOFD.'
  },
  'B6': {
    name: 'DOFD Reset by Partial Payment',
    category: 'fcra',
    severity: 'critical',
    successProbability: 96,
    willfulnessIndicator: 88,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'The 7-year FCRA clock cannot be reset by payment activity.',
    suggestedEvidence: ['Payment receipt', 'Historical credit reports showing DOFD change'],
    legalCitations: ['15 USC 1681c(c)(1)', 'Grigoryan v. Experian'],
    remediation: 'Restore pre-payment DOFD immediately.'
  },
  'B7': {
    name: 'Removal Date Calculated from Wrong Base',
    category: 'fcra',
    severity: 'high',
    successProbability: 88,
    willfulnessIndicator: 75,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Removal must be 7 years + 180 days from DOFD, not other dates.',
    suggestedEvidence: ['DOFD documentation', 'Removal date shown on report'],
    legalCitations: ['15 USC 1681c(a)(4)', '15 USC 1681c(c)'],
    remediation: 'Recalculate removal from proper DOFD.'
  },

  // ====== BALANCE FORENSICS (K Series Enhanced) ======
  'K8': {
    name: 'Balance Increased After Sale/Transfer',
    category: 'fdcpa',
    severity: 'high',
    successProbability: 85,
    willfulnessIndicator: 80,
    statutoryMin: 0,
    statutoryMax: 1000,
    whyItMatters: 'New owners cannot add fees beyond purchase price without disclosure.',
    suggestedEvidence: ['Original balance at transfer', 'Current reported balance', 'Fee disclosures'],
    legalCitations: ['15 USC 1692e', '15 USC 1692f'],
    remediation: 'Itemize all charges. Remove unauthorized fees.'
  },
  'K9': {
    name: 'Interest Accrued on Charged-Off Balance',
    category: 'state',
    severity: 'high',
    successProbability: 78,
    willfulnessIndicator: 70,
    statutoryMin: 0,
    statutoryMax: 0,
    whyItMatters: 'Many states prohibit post-charge-off interest accrual.',
    suggestedEvidence: ['Charge-off statement', 'Current balance statement'],
    legalCitations: ['State usury statutes', 'UCC provisions'],
    remediation: 'Remove post-charge-off interest.'
  },
  'K10': {
    name: 'Collection Fees Exceed Statutory Maximum',
    category: 'fdcpa',
    severity: 'high',
    successProbability: 82,
    willfulnessIndicator: 75,
    statutoryMin: 0,
    statutoryMax: 1000,
    whyItMatters: 'Collection fees must be authorized by contract or law.',
    suggestedEvidence: ['Original contract', 'Fee itemization'],
    legalCitations: ['15 USC 1692f(1)', 'State fee statutes'],
    remediation: 'Remove unauthorized collection fees.'
  },
  'K11': {
    name: 'Balance Mysteriously Decreased Then Increased',
    category: 'fcra',
    severity: 'high',
    successProbability: 75,
    willfulnessIndicator: 85,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Yo-yo balance patterns suggest manipulation or data corruption.',
    suggestedEvidence: ['Historical credit reports', 'Payment records'],
    legalCitations: ['15 USC 1681e(b)', '15 USC 1681s-2(a)(1)'],
    remediation: 'Verify accurate balance. Explain all changes.'
  },

  // ====== MEDICAL DEBT ENHANCED (H Series) ======
  'H3': {
    name: 'Paid Medical Debt Still Reporting',
    category: 'medical',
    severity: 'critical',
    successProbability: 99,
    willfulnessIndicator: 70,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Paid medical debts must be removed under CFPB rule.',
    suggestedEvidence: ['Payment receipt', 'Insurance EOB', 'Zero balance statement'],
    legalCitations: ['CFPB Medical Debt Rule 2023', '12 CFR 1022'],
    remediation: 'Immediate deletion required.'
  },
  'H4': {
    name: 'Medical Debt Reported During Insurance Processing',
    category: 'medical',
    severity: 'high',
    successProbability: 92,
    willfulnessIndicator: 60,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Medical debt cannot be reported while insurance claim is pending.',
    suggestedEvidence: ['Insurance claim submission', 'Claim processing timeline'],
    legalCitations: ['CFPB Medical Debt Rule', '15 USC 1681c(a)(6)'],
    remediation: 'Remove until insurance adjudication complete.'
  },
  'H5': {
    name: 'Veterans Medical Debt Reporting Violation',
    category: 'medical',
    severity: 'critical',
    successProbability: 98,
    willfulnessIndicator: 85,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'VA medical debt has special reporting restrictions.',
    suggestedEvidence: ['VA treatment records', 'VA payment status'],
    legalCitations: ['38 USC 5301', 'VA Debt Collection Act'],
    remediation: 'Delete VA medical debt immediately.'
  },
  'H6': {
    name: 'Medical Debt Balance Includes Billing Errors',
    category: 'medical',
    severity: 'high',
    successProbability: 80,
    willfulnessIndicator: 55,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Medical billing errors are common and affect accuracy.',
    suggestedEvidence: ['Itemized medical bill', 'Procedure codes', 'EOB comparison'],
    legalCitations: ['15 USC 1681e(b)', 'State medical billing laws'],
    remediation: 'Correct billing errors. Adjust balance accordingly.'
  },

  // ====== VERIFICATION PROCEDURE FAILURES ======
  'V1': {
    name: 'Verification Relied on Parroting',
    category: 'procedural',
    severity: 'high',
    successProbability: 85,
    willfulnessIndicator: 80,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Bureaus cannot simply repeat furnisher data as verification.',
    suggestedEvidence: ['Dispute response', 'Verification letter content'],
    legalCitations: ['15 USC § 1681i(a)(1)(A)', 'Cushman v. Trans Union, 115 F.3d 220', 'Stevenson v. TRW, Inc., 987 F.2d 288'],
    remediation: 'Conduct meaningful reinvestigation.'
  },
  'V2': {
    name: 'No Reinvestigation Conducted',
    category: 'procedural',
    severity: 'critical',
    successProbability: 90,
    willfulnessIndicator: 85,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Bureau must investigate disputes within 30 days.',
    suggestedEvidence: ['Dispute letter', 'Response timeline', 'Investigation records'],
    legalCitations: ['15 USC § 1681i(a)(1)', 'Dennis v. BEH-1, LLC, 520 F.3d 1066'],
    remediation: 'Conduct proper reinvestigation.'
  },
  'V3': {
    name: 'Verification Response Missing Required Information',
    category: 'procedural',
    severity: 'medium',
    successProbability: 75,
    willfulnessIndicator: 60,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Verification must include method and furnisher contact.',
    suggestedEvidence: ['Verification letter', 'Missing elements list'],
    legalCitations: ['15 USC § 1681i(a)(6)', '15 USC § 1681i(a)(7)'],
    remediation: 'Provide complete verification information.'
  },
  'V4': {
    name: 'Failed to Forward Dispute Materials to Furnisher',
    category: 'procedural',
    severity: 'high',
    successProbability: 82,
    willfulnessIndicator: 75,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Bureau must forward all relevant dispute information.',
    suggestedEvidence: ['Dispute letter with attachments', 'Furnisher response'],
    legalCitations: ['15 USC § 1681i(a)(2)', 'Gorman v. Wolpoff & Abramson, LLP, 584 F.3d 1147'],
    remediation: 'Forward complete dispute file to furnisher.'
  },


  // ====== FURNISHER DUTIES ======
  'FD1': {
    name: 'Continued Reporting After Direct Dispute',
    category: 'fcra',
    severity: 'high',
    successProbability: 88,
    willfulnessIndicator: 82,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Furnisher must investigate direct disputes under 623(a)(8).',
    suggestedEvidence: ['Direct dispute letter', 'Continued reporting evidence'],
    legalCitations: ['15 USC § 1681s-2(a)(8)', 'Chiang v. Verizon New England Inc., 595 F.3d 26'],
    remediation: 'Investigate and correct or delete.'
  },
  'FD2': {
    name: 'No Policies to Ensure Accuracy',
    category: 'fcra',
    severity: 'high',
    successProbability: 70,
    willfulnessIndicator: 75,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Furnishers must have reasonable procedures for accuracy.',
    suggestedEvidence: ['Pattern of errors', 'Lack of correction'],
    legalCitations: ['15 USC § 1681s-2(a)(1)', 'Johnson v. MBNA Am. Bank, NA, 357 F.3d 426'],
    remediation: 'Implement accuracy procedures.'
  },
  'FD3': {
    name: 'Failed to Report Dispute Status',
    category: 'fcra',
    severity: 'medium',
    successProbability: 80,
    willfulnessIndicator: 65,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Disputed accounts must be marked as disputed.',
    suggestedEvidence: ['Dispute confirmation', 'Credit report without dispute notation'],
    legalCitations: ['15 USC § 1681s-2(a)(3)', '15 USC § 1681i(a)(4)', 'Saunders v. Branch Banking & Trust Co. of Va., 526 F.3d 142'],
    remediation: 'Add disputed status to account.'
  },


  // ====== COLLECTION PRACTICES ======
  'CP1': {
    name: 'Collection on Discharged Bankruptcy Debt',
    category: 'fdcpa',
    severity: 'critical',
    successProbability: 97,
    willfulnessIndicator: 95,
    statutoryMin: 0,
    statutoryMax: 1000,
    whyItMatters: 'Discharged debts cannot be collected or reported with balance.',
    suggestedEvidence: ['Bankruptcy discharge order', 'Schedule of debts'],
    legalCitations: ['11 USC 524(a)(2)', '15 USC 1692e'],
    remediation: 'Cease collection. Report $0 balance or delete.'
  },
  'CP2': {
    name: 'Collection on Identity Theft Debt',
    category: 'fcra',
    severity: 'critical',
    successProbability: 95,
    willfulnessIndicator: 80,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Identity theft debts must be blocked upon proper notice.',
    suggestedEvidence: ['Identity theft report', 'FTC affidavit', 'Police report'],
    legalCitations: ['15 USC 1681c-2', '15 USC 1681g(e)'],
    remediation: 'Block and delete fraudulent account.'
  },
  'SL1': {
    name: 'Rehabilitated Student Loan Inaccuracy',
    category: 'student',
    severity: 'high',
    successProbability: 95,
    willfulnessIndicator: 70,
    statutoryMin: 0,
    statutoryMax: 1000,
    whyItMatters: 'After student loan rehabilitation, the default status MUST be removed from the credit report.',
    suggestedEvidence: ['Rehabilitation completion letter', 'Payment history showing 9 on-time payments'],
    legalCitations: ['34 CFR 682.405', 'Higher Education Act'],
    remediation: 'Remove default marker and report as Current.'
  },
  'CP3': {
    name: 'Suing on Time-Barred Debt',
    category: 'fdcpa',
    severity: 'critical',
    successProbability: 90,
    willfulnessIndicator: 90,
    statutoryMin: 0,
    statutoryMax: 1000,
    whyItMatters: 'Filing suit on time-barred debt is unconscionable.',
    suggestedEvidence: ['Lawsuit filing', 'SOL calculation', 'Last payment date'],
    legalCitations: ['15 USC 1692e', '15 USC 1692f', 'Huertas v. Galaxy'],
    remediation: 'Dismiss lawsuit. Cease collection.'
  },
  'CP4': {
    name: 'Threatening Suit Without Intent',
    category: 'fdcpa',
    severity: 'high',
    successProbability: 75,
    willfulnessIndicator: 85,
    statutoryMin: 0,
    statutoryMax: 1000,
    whyItMatters: 'Threatening action not intended is deceptive.',
    suggestedEvidence: ['Collection letters', 'No lawsuit filed'],
    legalCitations: ['15 USC 1692e(5)', 'Bentley v. Great Lakes'],
    remediation: 'Cease false threats.'
  },

  // ====== CHAIN OF TITLE ======
  'COT1': {
    name: 'Missing Chain of Title Documentation',
    category: 'fdcpa',
    severity: 'high',
    successProbability: 82,
    willfulnessIndicator: 70,
    statutoryMin: 0,
    statutoryMax: 1000,
    whyItMatters: 'Collector must prove ownership to collect or report.',
    suggestedEvidence: ['Validation response', 'Bill of sale', 'Assignment documents'],
    legalCitations: ['15 USC 1692g', 'State UCC provisions'],
    remediation: 'Provide complete chain of title or delete.'
  },
  'COT2': {
    name: 'Account Data Changed in Transfer',
    category: 'fcra',
    severity: 'high',
    successProbability: 78,
    willfulnessIndicator: 75,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Core account data should remain consistent through transfers.',
    suggestedEvidence: ['Original creditor records', 'Current report data'],
    legalCitations: ['15 USC 1681e(b)', '15 USC 1681s-2(a)(1)'],
    remediation: 'Reconcile with original creditor data.'
  },
  'COT3': {
    name: 'Multiple Active Tradelines for Same Debt',
    category: 'fcra',
    severity: 'critical',
    successProbability: 92,
    willfulnessIndicator: 85,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Same debt cannot have multiple active balances.',
    suggestedEvidence: ['Credit report showing duplicates', 'Account numbers'],
    legalCitations: ['15 USC 1681e(b)', 'CDIA Metro 2 Guidelines'],
    remediation: 'Delete duplicate. Original must show $0 if sold.'
  },

  // ====== STATUS INCONSISTENCIES ======
  'SI1': {
    name: 'Open Status on Closed/Charged-Off Account',
    category: 'metro2',
    severity: 'high',
    successProbability: 88,
    willfulnessIndicator: 70,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Status must accurately reflect account condition.',
    suggestedEvidence: ['Credit report', 'Account statements'],
    legalCitations: ['15 USC 1681e(b)', 'Metro 2 Format Guide'],
    remediation: 'Correct status code.'
  },
  'SI2': {
    name: 'Current Status Despite Delinquency History',
    category: 'metro2',
    severity: 'medium',
    successProbability: 72,
    willfulnessIndicator: 60,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Payment status must match payment history.',
    suggestedEvidence: ['Payment history string', 'Status code'],
    legalCitations: ['15 USC 1681e(b)', 'Metro 2 Format Guide'],
    remediation: 'Reconcile status with history.'
  },

  // ====== STUDENT LOAN SPECIFIC ======
  'SL1': {
    name: 'Reporting During Administrative Forbearance',
    category: 'student',
    severity: 'high',
    successProbability: 90,
    willfulnessIndicator: 65,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Federal student loans in forbearance should not report delinquency.',
    suggestedEvidence: ['Forbearance approval', 'Delinquency reported dates'],
    legalCitations: ['20 USC 1078-6', 'ED Guidance'],
    remediation: 'Remove delinquency during forbearance.'
  },
  'SL2': {
    name: 'Incorrect Loan Servicer Reporting',
    category: 'student',
    severity: 'medium',
    successProbability: 78,
    willfulnessIndicator: 55,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Servicer transfers often cause reporting errors.',
    suggestedEvidence: ['NSLDS history', 'Servicer records'],
    legalCitations: ['15 USC 1681e(b)', '20 USC 1078'],
    remediation: 'Reconcile servicer data.'
  },
  'SL3': {
    name: 'Rehabilitated Loan Still Showing Default',
    category: 'student',
    severity: 'critical',
    successProbability: 95,
    willfulnessIndicator: 80,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Rehabilitation should remove default status.',
    suggestedEvidence: ['Rehabilitation completion', 'Current report'],
    legalCitations: ['20 USC 1078-6(a)(1)(F)', '34 CFR 682.405'],
    remediation: 'Remove default history per rehabilitation terms.'
  },

  // ====== TIMING VIOLATIONS ======
  'TV1': {
    name: 'Reporting Before 30-Day Validation Period',
    category: 'fdcpa',
    severity: 'high',
    successProbability: 75,
    willfulnessIndicator: 70,
    statutoryMin: 0,
    statutoryMax: 1000,
    whyItMatters: 'First communication should allow validation before reporting.',
    suggestedEvidence: ['First collection letter', 'Report date', 'Timeline'],
    legalCitations: ['15 USC 1692g', 'State laws'],
    remediation: 'Allow validation period before reporting.'
  },
  'TV2': {
    name: 'Delayed Investigation Beyond 30 Days',
    category: 'procedural',
    severity: 'high',
    successProbability: 88,
    willfulnessIndicator: 75,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Investigations must be completed within 30 days.',
    suggestedEvidence: ['Dispute date', 'Response date', 'Timeline'],
    legalCitations: ['15 USC 1681i(a)(1)(A)', 'Stevenson v. TRW'],
    remediation: 'Complete investigation or delete.'
  },
  'TV3': {
    name: 'Failed to Correct Within 5 Days of Determination',
    category: 'procedural',
    severity: 'medium',
    successProbability: 72,
    willfulnessIndicator: 60,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Corrections must be made promptly after determination.',
    suggestedEvidence: ['Investigation completion', 'Correction date'],
    legalCitations: ['15 USC 1681i(a)(5)(A)', 'Metro 2 timing'],
    remediation: 'Correct immediately.'
  },

  // ====== ACCOUNT TYPE MISCLASSIFICATION ======
  'AT1': {
    name: 'Revolving Reported as Installment',
    category: 'metro2',
    severity: 'medium',
    successProbability: 78,
    willfulnessIndicator: 55,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Account type affects credit score calculations.',
    suggestedEvidence: ['Original account terms', 'Current reporting'],
    legalCitations: ['15 USC 1681e(b)', 'Metro 2 Format Guide'],
    remediation: 'Correct account type code.'
  },
  'AT2': {
    name: 'Collection Account Missing Original Type',
    category: 'metro2',
    severity: 'medium',
    successProbability: 72,
    willfulnessIndicator: 50,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Original account type should be preserved.',
    suggestedEvidence: ['Original creditor records', 'Collection report'],
    legalCitations: ['15 USC 1681e(b)', 'Metro 2 Format Guide'],
    remediation: 'Report original account type.'
  },

  // ====== CROSS-BUREAU CONTRADICTIONS ======
  'XB1': {
    name: 'Different DOFD Across Bureaus',
    category: 'fcra',
    severity: 'critical',
    successProbability: 90,
    willfulnessIndicator: 85,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'DOFD must be identical across all bureaus.',
    suggestedEvidence: ['All three bureau reports', 'Date comparison'],
    legalCitations: ['15 USC 1681s-2(a)(5)', 'Saunders v. Branch Banking'],
    remediation: 'Report consistent DOFD to all bureaus.'
  },
  'XB2': {
    name: 'Different Balance Across Bureaus',
    category: 'fcra',
    severity: 'high',
    successProbability: 82,
    willfulnessIndicator: 70,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Balance should be consistent unless recently updated.',
    suggestedEvidence: ['All three bureau reports', 'Balance comparison'],
    legalCitations: ['15 USC 1681e(b)', '15 USC 1681s-2(a)(1)'],
    remediation: 'Report consistent balance to all bureaus.'
  },
  'XB3': {
    name: 'Account Missing From One Bureau',
    category: 'fcra',
    severity: 'medium',
    successProbability: 65,
    willfulnessIndicator: 50,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Selective reporting may indicate data quality issues.',
    suggestedEvidence: ['All three bureau reports'],
    legalCitations: ['15 USC 1681s-2(a)(1)', 'CDIA Guidelines'],
    remediation: 'Ensure consistent reporting or explain variance.'
  },

  // ====== ZOMBIE DEBT ENHANCED ======
  'ZD1': {
    name: 'Debt Older Than Reporting Period Re-Reported',
    category: 'fcra',
    severity: 'critical',
    successProbability: 98,
    willfulnessIndicator: 95,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Per-se violation of 7-year limit.',
    suggestedEvidence: ['Historical reports', 'DOFD proof', 'Current report'],
    legalCitations: ['15 USC 1681c(a)(4)', '15 USC 1681c(c)'],
    remediation: 'Immediate and permanent deletion.'
  },
  'ZD2': {
    name: 'Debt Reappeared After Previous Deletion',
    category: 'fcra',
    severity: 'critical',
    successProbability: 95,
    willfulnessIndicator: 92,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Deleted items should not reappear without new basis.',
    suggestedEvidence: ['Previous deletion confirmation', 'Current report'],
    legalCitations: ['15 USC 1681i(a)(5)(C)', 'Cushman v. Trans Union'],
    remediation: 'Delete and prevent re-insertion.'
  },
  'ZD3': {
    name: 'Collector Purchased Debt After Reporting Expiration',
    category: 'fcra',
    severity: 'critical',
    successProbability: 92,
    willfulnessIndicator: 90,
    statutoryMin: 100,
    statutoryMax: 1000,
    whyItMatters: 'Cannot report debt that was already time-expired.',
    suggestedEvidence: ['Purchase date', 'DOFD', '7-year calculation'],
    legalCitations: ['15 USC 1681c(a)(4)', '15 USC 1681c(c)'],
    remediation: 'Delete. Debt is unreportable.'
  },

  // ====== LATEST 2024-2025 REGULATORY UPDATES ======
  'MD1': {
    name: 'Medical Debt: Financial Assistance Eligibility',
    category: 'medical',
    severity: 'high',
    successProbability: 85,
    willfulnessIndicator: 40,
    statutoryMin: 0,
    statutoryMax: 0,
    whyItMatters: 'Many states (e.g., CA, WA, NY) require providers to screen for financial assistance eligibility BEFORE reporting to collections.',
    suggestedEvidence: ['Hospital financial assistance policy', 'Income documentation', 'Denial letter'],
    legalCitations: ['CA Health & Safety Code § 127400', 'WA RCW 70.170'],
    remediation: 'Remove from credit if screening was not performed.'
  },
  'UC1': {
    name: 'Usury Clock Drift: Illegal Interest Accumulation',
    category: 'state',
    severity: 'critical',
    successProbability: 80,
    willfulnessIndicator: 90,
    statutoryMin: 500,
    statutoryMax: 5000,
    whyItMatters: 'Applying interest rates above state usury caps on defaulted consumer debt is a per-se violation of the FDCPA.',
    suggestedEvidence: ['Historical balance statements', 'State interest rate cap citations'],
    legalCitations: ['15 USC 1692e(2)', 'State Usury Statutes'],
    remediation: 'Refund overcharged interest and correct balance.'
  },
  'ZR1': {
    name: 'Zombie Debt: Post-SOL Resuscitation Attempt',
    category: 'fdcpa',
    severity: 'high',
    successProbability: 95,
    willfulnessIndicator: 95,
    statutoryMin: 1000,
    statutoryMax: 1000,
    whyItMatters: 'Attempting to collect or report a debt that is beyond both the SOL and FCRA reporting period is deceptive.',
    suggestedEvidence: ['Original creditor DOFD records', 'Notification of assignment'],
    legalCitations: ['15 USC 1692e', 'Huertas v. Galaxy Asset Services'],
    remediation: 'Permanent deletion and cease-and-desist.'
  }
};

// ============================================================================
// FORENSIC ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Perform comprehensive forensic analysis of credit data
 */
export function performForensicAnalysis(
  fields: CreditFields,
  historicalData?: CreditFields[]
): ForensicAnalysis {
  const anomalies: ForensicAnomaly[] = [];
  const recommendations: ForensicRecommendation[] = [];

  // Date manipulation scoring
  const dateScore = analyzeDateManipulation(fields, historicalData);
  if (dateScore.anomalies.length > 0) {
    anomalies.push(...dateScore.anomalies);
  }

  // Balance forensics
  const balanceScore = analyzeBalanceForensics(fields);
  if (balanceScore.anomalies.length > 0) {
    anomalies.push(...balanceScore.anomalies);
  }

  // Chain of title analysis
  const cotScore = analyzeChainOfTitle(fields);
  if (cotScore.anomalies.length > 0) {
    anomalies.push(...cotScore.anomalies);
  }

  // Furnisher behavior
  const furnisherScore = analyzeFurnisherBehavior(fields);

  // Generate recommendations based on findings
  if (dateScore.score > 50) {
    recommendations.push({
      priority: 'immediate',
      action: 'Request complete Metro 2 data from all bureaus',
      rationale: 'Date manipulation indicators require raw data verification',
      legalBasis: '15 USC 1681g(a)(1)'
    });
  }

  if (balanceScore.score > 40) {
    recommendations.push({
      priority: 'high',
      action: 'Send debt validation letter requesting itemized statement',
      rationale: 'Balance anomalies require fee breakdown verification',
      legalBasis: '15 USC 1692g'
    });
  }

  // Calculate overall risk
  const avgScore = (dateScore.score + balanceScore.score + cotScore.score + furnisherScore.score) / 4;
  let overallRisk: ForensicAnalysis['overallForensicRisk'] = 'minimal';
  if (avgScore >= 80) overallRisk = 'critical';
  else if (avgScore >= 60) overallRisk = 'high';
  else if (avgScore >= 40) overallRisk = 'moderate';
  else if (avgScore >= 20) overallRisk = 'low';

  return {
    dateManipulationScore: dateScore.score,
    balanceForensicsScore: balanceScore.score,
    chainOfTitleScore: cotScore.score,
    furnisherBehaviorScore: furnisherScore.score,
    overallForensicRisk: overallRisk,
    anomalies,
    recommendations
  };
}

/**
 * Analyze date manipulation patterns
 */
function analyzeDateManipulation(
  fields: CreditFields,
  history?: CreditFields[]
): { score: number; anomalies: ForensicAnomaly[] } {
  let score = 0;
  const anomalies: ForensicAnomaly[] = [];

  const dofd = parseDate(fields.dofd);
  const opened = parseDate(fields.dateOpened);
  const chargeOff = parseDate(fields.chargeOffDate);
  const lastPayment = parseDate(fields.dateLastPayment);
  const removal = parseDate(fields.estimatedRemovalDate);
  const today = new Date();

  // Chronological impossibilities
  if (dofd && opened && dofd < opened) {
    score += 40;
    anomalies.push({
      type: 'date',
      severity: 'critical',
      description: 'DOFD predates account opening - physically impossible',
      evidence: `DOFD: ${fields.dofd}, Opened: ${fields.dateOpened}`,
      legalImplication: 'Strong evidence of data fabrication (15 USC 1681e(b))'
    });
  }

  if (dofd && chargeOff && dofd > chargeOff) {
    score += 35;
    anomalies.push({
      type: 'date',
      severity: 'critical',
      description: 'DOFD after charge-off date - impossible sequence',
      evidence: `DOFD: ${fields.dofd}, Charge-off: ${fields.chargeOffDate}`,
      legalImplication: 'Delinquency must precede charge-off'
    });
  }

  // 7-year calculation anomaly
  if (dofd && removal) {
    const expectedRemoval = new Date(dofd);
    expectedRemoval.setFullYear(expectedRemoval.getFullYear() + 7);
    expectedRemoval.setDate(expectedRemoval.getDate() + 180);

    const diffDays = Math.round((removal.getTime() - expectedRemoval.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      score += 30;
      anomalies.push({
        type: 'date',
        severity: 'high',
        description: `Removal date extended ${diffDays} days beyond legal limit`,
        evidence: `Expected: ${expectedRemoval.toISOString().split('T')[0]}, Reported: ${fields.estimatedRemovalDate}`,
        legalImplication: 'Classic re-aging pattern (15 USC 1681c(c))'
      });
    }
  }

  // Should have fallen off already
  if (dofd && !removal) {
    const expectedRemoval = new Date(dofd);
    expectedRemoval.setFullYear(expectedRemoval.getFullYear() + 7);
    expectedRemoval.setDate(expectedRemoval.getDate() + 180);

    if (today > expectedRemoval) {
      score += 40;
      anomalies.push({
        type: 'date',
        severity: 'critical',
        description: 'Account reported beyond 7-year statutory limit',
        evidence: `DOFD: ${fields.dofd}, Should have been removed: ${expectedRemoval.toISOString().split('T')[0]}`,
        legalImplication: 'Per-se FCRA violation (15 USC 1681c(a)(4))'
      });
    }
  }

  // Suspicious date patterns (all dates same or very close)
  const dates = [dofd, opened, chargeOff, lastPayment].filter(Boolean) as Date[];
  if (dates.length >= 3) {
    const uniqueDates = new Set(dates.map(d => d.toISOString().split('T')[0]));
    if (uniqueDates.size === 1) {
      score += 20;
      anomalies.push({
        type: 'date',
        severity: 'high',
        description: 'All dates identical - suggests fabricated data',
        evidence: `Multiple critical dates all set to same date`,
        legalImplication: 'Pattern indicates data manipulation'
      });
    }
  }

  return { score: Math.min(100, score), anomalies };
}

/**
 * Analyze balance patterns for forensic issues
 */
function analyzeBalanceForensics(fields: CreditFields): { score: number; anomalies: ForensicAnomaly[] } {
  let score = 0;
  const anomalies: ForensicAnomaly[] = [];

  const current = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
  const original = parseFloat((fields.originalAmount || '0').replace(/[$,]/g, ''));
  const status = (fields.accountStatus || '').toLowerCase();
  const dofd = parseDate(fields.dofd);

  // Paid status with balance
  if ((status.includes('paid') || status.includes('settled') || status.includes('closed')) && current > 0) {
    score += 35;
    anomalies.push({
      type: 'balance',
      severity: 'critical',
      description: `Paid/settled account shows balance of $${current.toLocaleString()}`,
      evidence: `Status: ${fields.accountStatus}, Balance: ${fields.currentBalance}`,
      legalImplication: 'Direct Metro 2 violation. Must report $0 balance.'
    });
  }

  // Extreme balance growth
  if (original > 0 && current > original * 2) {
    const growth = ((current / original) - 1) * 100;
    score += 25;
    anomalies.push({
      type: 'balance',
      severity: 'high',
      description: `Balance grew ${growth.toFixed(0)}% from original amount`,
      evidence: `Original: $${original.toLocaleString()}, Current: $${current.toLocaleString()}`,
      legalImplication: 'May include unauthorized fees (15 USC 1692f(1))'
    });

    // Check for excessive interest if we have dates
    if (dofd) {
      const years = (new Date().getTime() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (years > 0.5) {
        const impliedRate = ((current / original) - 1) / years;
        if (impliedRate > 0.25) { // >25% annual
          score += 15;
          anomalies.push({
            type: 'balance',
            severity: 'high',
            description: `Implied interest rate of ${(impliedRate * 100).toFixed(1)}% per year`,
            evidence: `${years.toFixed(1)} years elapsed with ${growth.toFixed(0)}% growth`,
            legalImplication: 'Likely exceeds state usury caps'
          });
        }
      }
    }
  }

  // Transfer with balance (sold accounts should show $0)
  if ((status.includes('transfer') || status.includes('sold')) && current > 0) {
    score += 30;
    anomalies.push({
      type: 'balance',
      severity: 'critical',
      description: 'Transferred/sold account shows active balance',
      evidence: `Status: ${fields.accountStatus}, Balance: ${fields.currentBalance}`,
      legalImplication: 'Original creditor must report $0 after transfer'
    });
  }

  return { score: Math.min(100, score), anomalies };
}

/**
 * Analyze chain of title issues
 */
function analyzeChainOfTitle(fields: CreditFields): { score: number; anomalies: ForensicAnomaly[] } {
  let score = 0;
  const anomalies: ForensicAnomaly[] = [];

  const accountType = (fields.accountType || '').toLowerCase();
  const furnisher = (fields.furnisherOrCollector || '').toLowerCase();
  const original = (fields.originalCreditor || '').toLowerCase();
  const opened = parseDate(fields.dateOpened);
  const dofd = parseDate(fields.dofd);

  // Collection account opened years after DOFD (zombie debt indicator)
  if (accountType.includes('collection') && opened && dofd) {
    const yearsAfter = (opened.getTime() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (yearsAfter > 3) {
      score += 30;
      anomalies.push({
        type: 'transfer',
        severity: 'high',
        description: `Collection opened ${yearsAfter.toFixed(1)} years after original delinquency`,
        evidence: `DOFD: ${fields.dofd}, Collection opened: ${fields.dateOpened}`,
        legalImplication: 'Zombie debt pattern - verify DOFD was properly transferred'
      });
    }
  }

  // Collection without original creditor info
  if (accountType.includes('collection') && !original) {
    score += 20;
    anomalies.push({
      type: 'transfer',
      severity: 'medium',
      description: 'Collection account missing original creditor information',
      evidence: 'No original creditor reported',
      legalImplication: 'Required for Metro 2 J2 segment compliance'
    });
  }

  // Furnisher name suggests debt buyer
  const debtBuyerIndicators = ['portfolio', 'midland', 'lvnv', 'cavalry', 'encore', 'resurgent', 'sherman'];
  if (debtBuyerIndicators.some(indicator => furnisher.includes(indicator))) {
    score += 15;
    anomalies.push({
      type: 'transfer',
      severity: 'medium',
      description: 'Identified as debt buyer - chain of title documentation critical',
      evidence: `Furnisher: ${fields.furnisherOrCollector}`,
      legalImplication: 'Request bill of sale and assignment documents'
    });
  }

  return { score: Math.min(100, score), anomalies };
}

/**
 * Analyze furnisher behavior patterns
 */
function analyzeFurnisherBehavior(fields: CreditFields): { score: number; anomalies: ForensicAnomaly[] } {
  let score = 0;
  const anomalies: ForensicAnomaly[] = [];

  const lastReported = parseDate(fields.dateReportedOrUpdated);
  const today = new Date();

  // Stale reporting (>90 days)
  if (lastReported) {
    const daysSince = Math.floor((today.getTime() - lastReported.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 90) {
      score += 15;
      anomalies.push({
        type: 'status',
        severity: 'medium',
        description: `Account not updated in ${daysSince} days`,
        evidence: `Last reported: ${fields.dateReportedOrUpdated}`,
        legalImplication: 'May indicate abandoned furnishing or verification issues'
      });
    }
  }

  return { score: Math.min(100, score), anomalies };
}

// ============================================================================
// ENHANCED RULE RUNNING
// ============================================================================

/**
 * Run advanced rules against credit fields
 */
export function runAdvancedRules(
  fields: CreditFields,
  options: {
    includeStateSpecific?: boolean;
    stateCode?: string;
    historicalData?: CreditFields[];
    crossBureauData?: { bureau: string; fields: CreditFields }[];
  } = {}
): AdvancedRuleFlag[] {
  const flags: AdvancedRuleFlag[] = [];

  // Run forensic analysis first
  const forensics = performForensicAnalysis(fields, options.historicalData);

  // Convert forensic anomalies to rule flags
  for (const anomaly of forensics.anomalies) {
    const ruleId = mapAnomalyToRule(anomaly);
    if (ruleId && ADVANCED_RULE_DEFINITIONS[ruleId]) {
      const rule = ADVANCED_RULE_DEFINITIONS[ruleId];
      flags.push(createAdvancedFlag(
        ruleId,
        rule,
        anomaly.description,
        { anomalyType: anomaly.type, evidence: anomaly.evidence },
        anomaly.severity === 'critical' ? 90 : anomaly.severity === 'high' ? 75 : 50
      ));
    }
  }

  // Run specific rule checks
  runTimelineRules(fields, flags);
  runBalanceRules(fields, flags);
  runStatusRules(fields, flags);
  runMedicalDebtRules(fields, flags);
  runStudentLoanRules(fields, flags);
  runChainOfTitleRules(fields, flags);
  runVerificationRules(fields, flags);

  // Cross-bureau analysis if data provided
  if (options.crossBureauData && options.crossBureauData.length > 1) {
    runCrossBureauRules(options.crossBureauData, flags);
  }

  // State-specific rules
  if (options.includeStateSpecific && options.stateCode) {
    runStateSpecificRules(fields, options.stateCode, flags);
  }

  // Sort by severity and forensic confidence
  flags.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aSev = severityOrder[a.severity as keyof typeof severityOrder] ?? 3;
    const bSev = severityOrder[b.severity as keyof typeof severityOrder] ?? 3;
    if (aSev !== bSev) return aSev - bSev;
    return b.forensicConfidence - a.forensicConfidence;
  });

  return flags;
}

/**
 * Map forensic anomaly to rule ID
 */
function mapAnomalyToRule(anomaly: ForensicAnomaly): string | null {
  if (anomaly.type === 'date') {
    if (anomaly.description.includes('predates')) return 'B1-ADV';
    if (anomaly.description.includes('extended')) return 'B7';
    if (anomaly.description.includes('beyond')) return 'ZD1';
    if (anomaly.description.includes('impossible')) return 'B3';
  }
  if (anomaly.type === 'balance') {
    if (anomaly.description.includes('Paid') || anomaly.description.includes('settled')) return 'SI1';
    if (anomaly.description.includes('grew')) return 'K8';
    if (anomaly.description.includes('Transfer')) return 'COT2';
  }
  if (anomaly.type === 'transfer') {
    if (anomaly.description.includes('Zombie')) return 'ZD3';
    if (anomaly.description.includes('missing')) return 'COT1';
  }
  return null;
}

/**
 * Create an advanced rule flag
 */
function createAdvancedFlag(
  ruleId: string,
  rule: typeof ADVANCED_RULE_DEFINITIONS[string],
  explanation: string,
  fieldValues: Record<string, unknown>,
  forensicConfidence: number
): AdvancedRuleFlag {
  return {
    ruleId,
    ruleName: rule.name,
    severity: rule.severity,
    explanation,
    whyItMatters: rule.whyItMatters,
    suggestedEvidence: rule.suggestedEvidence,
    fieldValues: fieldValues as Record<string, string | number | boolean | Date | null | undefined>,
    legalCitations: rule.legalCitations,
    successProbability: rule.successProbability,
    willfulnessScore: rule.willfulnessIndicator,
    statutoryDamageRange: { min: rule.statutoryMin, max: rule.statutoryMax },
    actualDamageCategories: getActualDamageCategories(rule.category),
    chainOfCustodyIssue: rule.category === 'fdcpa' || ruleId.startsWith('COT'),
    crossBureauContradiction: ruleId.startsWith('XB'),
    forensicConfidence,
    relatedRules: findRelatedRules(ruleId),
    remediation: rule.remediation,
    timeToFile: 730 // Default 2 years for FCRA private actions
  };
}

/**
 * Get actual damage categories for a violation type
 */
function getActualDamageCategories(category: string): string[] {
  const categories: Record<string, string[]> = {
    fcra: ['Credit denial', 'Higher interest rates', 'Employment denial', 'Insurance denial', 'Emotional distress'],
    fdcpa: ['Harassment', 'Time spent', 'Emotional distress', 'Attorney fees'],
    medical: ['Credit denial', 'Medical care denial', 'Insurance issues'],
    student: ['Loan eligibility', 'Higher rates', 'Employment'],
    procedural: ['Credit monitoring costs', 'Time spent', 'Emotional distress']
  };
  return categories[category] || categories.fcra;
}

/**
 * Find related rules for cross-referencing
 */
function findRelatedRules(ruleId: string): string[] {
  const relationships: Record<string, string[]> = {
    'B1-ADV': ['B4', 'B5', 'ZD1'],
    'B4': ['B1-ADV', 'B6', 'R2'],
    'B5': ['COT1', 'COT2', 'ZD3'],
    'B6': ['R2', 'B4'],
    'K8': ['K9', 'K10', 'COT2'],
    'ZD1': ['ZD2', 'ZD3', 'B7'],
    'COT1': ['COT2', 'COT3', 'FD1'],
    'XB1': ['XB2', 'XB3', 'B4']
  };
  return relationships[ruleId] || [];
}

// ============================================================================
// SPECIFIC RULE CATEGORY RUNNERS
// ============================================================================

function runTimelineRules(fields: CreditFields, flags: AdvancedRuleFlag[]): void {
  const dofd = parseDate(fields.dofd);
  const opened = parseDate(fields.dateOpened);
  const chargeOff = parseDate(fields.chargeOffDate);
  const removal = parseDate(fields.estimatedRemovalDate);
  const lastPayment = parseDate(fields.dateLastPayment);
  const today = new Date();

  // B1-ADV: DOFD before account opening
  if (dofd && opened && dofd < opened) {
    const rule = ADVANCED_RULE_DEFINITIONS['B1-ADV'];
    flags.push(createAdvancedFlag('B1-ADV', rule,
      `DOFD (${fields.dofd}) predates account opening (${fields.dateOpened}). This is physically impossible.`,
      { dofd: fields.dofd, dateOpened: fields.dateOpened },
      98
    ));
  }

  // B7: Removal date calculated wrong
  if (dofd && removal) {
    const expectedRemoval = new Date(dofd);
    expectedRemoval.setFullYear(expectedRemoval.getFullYear() + 7);
    expectedRemoval.setDate(expectedRemoval.getDate() + 180);

    if (removal > expectedRemoval) {
      const diffDays = Math.round((removal.getTime() - expectedRemoval.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        const rule = ADVANCED_RULE_DEFINITIONS['B7'];
        flags.push(createAdvancedFlag('B7', rule,
          `Removal date (${fields.estimatedRemovalDate}) is ${diffDays} days beyond the legal limit based on DOFD (${fields.dofd}).`,
          { dofd: fields.dofd, removal: fields.estimatedRemovalDate, diff: diffDays },
          88
        ));
      }
    }
  }

  // ZD1: Already expired but still reporting
  if (dofd) {
    const expectedRemoval = new Date(dofd);
    expectedRemoval.setFullYear(expectedRemoval.getFullYear() + 7);
    expectedRemoval.setDate(expectedRemoval.getDate() + 180);

    if (today > expectedRemoval) {
      const rule = ADVANCED_RULE_DEFINITIONS['ZD1'];
      flags.push(createAdvancedFlag('ZD1', rule,
        `Account should have been removed by ${expectedRemoval.toISOString().split('T')[0]} based on DOFD (${fields.dofd}).`,
        { dofd: fields.dofd, expectedRemoval: expectedRemoval.toISOString().split('T')[0] },
        98
      ));
    }
  }
}

function runBalanceRules(fields: CreditFields, flags: AdvancedRuleFlag[]): void {
  const current = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
  const original = parseFloat((fields.originalAmount || '0').replace(/[$,]/g, ''));
  const status = (fields.accountStatus || '').toLowerCase();

  // K8: Balance increased after transfer
  if ((status.includes('sold') || status.includes('transfer')) && current > 0) {
    const rule = ADVANCED_RULE_DEFINITIONS['K8'];
    flags.push(createAdvancedFlag('K8', rule,
      `Sold/transferred account shows active balance of $${current.toLocaleString()}.`,
      { status: fields.accountStatus, balance: current },
      85
    ));
  }

  // K10: Collection fees exceed reasonable amount
  if (original > 0 && current > original * 1.5) {
    const excessAmount = current - original;
    const excessPercent = ((current / original) - 1) * 100;
    const rule = ADVANCED_RULE_DEFINITIONS['K10'];
    flags.push(createAdvancedFlag('K10', rule,
      `Balance includes $${excessAmount.toLocaleString()} (${excessPercent.toFixed(0)}%) in fees/interest beyond original debt.`,
      { original, current, excess: excessAmount },
      75
    ));
  }

  // UC1: Usury Clock Drift
  if (fields.stateCode && fields.dofd && original > 0 && current > original) {
    const dofd = parseDate(fields.dofd);
    if (dofd) {
      const yearsElapsed = (new Date().getTime() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (yearsElapsed > 0.5) {
        const sol = STATE_SOL[fields.stateCode.toUpperCase()];
        const appliedRate = ((current - original) / original) / yearsElapsed;
        const cap = sol ? sol.judgmentInterestCap : 0.10; // Default to 10%

        if (appliedRate > cap + 0.05) { // 5% buffer for legitimate fees
          const rule = ADVANCED_RULE_DEFINITIONS['UC1'];
          flags.push(createAdvancedFlag('UC1', rule,
            `Implied annual rate of ${(appliedRate * 100).toFixed(1)}% exceeds ${fields.stateCode} cap of ${(cap * 100).toFixed(1)}%.`,
            { state: fields.stateCode, rate: (appliedRate * 100).toFixed(1), cap: (cap * 100).toFixed(1) },
            90
          ));
        }
      }
    }
  }
}

function runStatusRules(fields: CreditFields, flags: AdvancedRuleFlag[]): void {
  const status = (fields.accountStatus || '').toLowerCase();
  const current = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
  const remarks = (fields.remarks || '').toLowerCase();

  // SI1: Paid but showing balance
  if ((status.includes('paid') || status.includes('settled') || status.includes('closed')) && current > 0) {
    const rule = ADVANCED_RULE_DEFINITIONS['SI1'];
    flags.push(createAdvancedFlag('SI1', rule,
      `Account status "${fields.accountStatus}" but balance is $${current.toLocaleString()}.`,
      { status: fields.accountStatus, balance: current },
      90
    ));
  }

  // CP1: Bankruptcy discharged but shows balance
  const isBK = status.includes('bankruptcy') || 
               remarks.includes('bankruptcy') || 
               remarks.includes('discharged') || 
               remarks.includes('ch 7') || 
               remarks.includes('ch 13') || 
               remarks.includes('chapter');

  if (isBK && current > 0) {
    const rule = ADVANCED_RULE_DEFINITIONS['CP1'];
    flags.push(createAdvancedFlag('CP1', rule,
      `Account shows bankruptcy indicators but reports a balance of $${current.toLocaleString()}.`,
      { status: fields.accountStatus, remarks, balance: current },
      97
    ));
  }
}

function runMedicalDebtRules(fields: CreditFields, flags: AdvancedRuleFlag[]): void {
  const accountType = (fields.accountType || '').toLowerCase();
  const furnisher = (fields.furnisherOrCollector || '').toLowerCase();
  const isMedical = accountType.includes('medical') ||
    furnisher.includes('health') ||
    furnisher.includes('hospital') ||
    furnisher.includes('medical');

  if (!isMedical) return;

  const current = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
  const status = (fields.accountStatus || '').toLowerCase();

  // H3: Paid medical debt still reporting
  if (status.includes('paid') && current === 0) {
    const rule = ADVANCED_RULE_DEFINITIONS['H3'];
    flags.push(createAdvancedFlag('H3', rule,
      'Paid medical debt should be removed from credit reports under CFPB rule.',
      { accountType: fields.accountType },
      99
    ));
  }

  // H2 (from original): Medical debt under $500
  if (current > 0 && current < 500) {
    const rule = ADVANCED_RULE_DEFINITIONS['H2'] || {
      name: 'Medical Debt Under $500',
      category: 'medical',
      severity: 'critical',
      successProbability: 99,
      willfulnessIndicator: 70,
      statutoryMin: 100,
      statutoryMax: 1000,
      whyItMatters: 'Medical debts under $500 should not be on credit reports.',
      suggestedEvidence: ['Balance documentation'],
      legalCitations: ['CFPB Medical Debt Rule'],
      remediation: 'Delete medical debt under $500.'
    };
    flags.push(createAdvancedFlag('H2', rule,
      `Medical debt of $${current.toLocaleString()} is under the $500 reporting threshold.`,
      { balance: current },
      99
    ));
  }

  // MD1: Financial Assistance screening
  if (['CA', 'WA', 'NY', 'NJ', 'MD'].includes(fields.stateCode || '')) {
    const rule = ADVANCED_RULE_DEFINITIONS['MD1'];
    flags.push(createAdvancedFlag('MD1', rule,
      `This medical debt was reported in ${fields.stateCode}, which requires pre-reporting financial assistance screening.`,
      { state: fields.stateCode, accountType: fields.accountType },
      85
    ));
  }
}

function runStudentLoanRules(fields: CreditFields, flags: AdvancedRuleFlag[]): void {
  const accountType = (fields.accountType || '').toLowerCase();
  const status = (fields.accountStatus || '').toLowerCase();
  const isStudentLoan = accountType.includes('student') || accountType.includes('education');

  if (!isStudentLoan) return;

  // SL1: Rehabilitated but still showing default/collection
  const remarks = (fields.remarks || '').toLowerCase();
  if (remarks.includes('rehabilitated') && (status.includes('collection') || status.includes('default'))) {
    const rule = ADVANCED_RULE_DEFINITIONS['SL1'];
    flags.push(createAdvancedFlag('SL1', rule,
      'Account is marked "Rehabilitated" but still shows collection/default status.',
      { remarks, status: fields.accountStatus },
      95
    ));
  }
}

function runChainOfTitleRules(fields: CreditFields, flags: AdvancedRuleFlag[]): void {
  const accountType = (fields.accountType || '').toLowerCase();
  const original = fields.originalCreditor || '';
  const furnisher = fields.furnisherOrCollector || '';

  // COT1: Collection without original creditor
  if (accountType.includes('collection') && !original) {
    const rule = ADVANCED_RULE_DEFINITIONS['COT1'];
    flags.push(createAdvancedFlag('COT1', rule,
      'Collection account is missing original creditor information.',
      { furnisher, accountType: fields.accountType },
      82
    ));
  }

  // ZR1: Zombie Debt Resuscitation
  const opened = parseDate(fields.dateOpened);
  const dofd = parseDate(fields.dofd);
  if (opened && dofd && fields.stateCode) {
    const yearsDiff = (opened.getTime() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const sol = STATE_SOL[fields.stateCode.toUpperCase()];
    const solLimit = sol ? sol.writtenContracts : 4;

    if (yearsDiff > solLimit + 1) { // 1 year grace after SOL
      const rule = ADVANCED_RULE_DEFINITIONS['ZR1'];
      flags.push(createAdvancedFlag('ZR1', rule,
        `This collection was opened ${yearsDiff.toFixed(1)} years after the DOFD, which is beyond the ${fields.stateCode} SOL of ${solLimit} years.`,
        { opened: fields.dateOpened, dofd: fields.dofd, sol: solLimit },
        95
      ));
    }
  }
}

function runVerificationRules(fields: CreditFields, _flags: AdvancedRuleFlag[]): void {
  // Verification rules typically require dispute history context
  // These would be triggered by dispute response analysis
}

function runCrossBureauRules(
  bureauData: { bureau: string; fields: CreditFields }[],
  flags: AdvancedRuleFlag[]
): void {
  if (bureauData.length < 2) return;

  // Compare DOFDs across bureaus
  const dofds = bureauData.map(b => ({ bureau: b.bureau, dofd: b.fields.dofd })).filter(b => b.dofd);
  const uniqueDofds = new Set(dofds.map(d => d.dofd));

  if (uniqueDofds.size > 1) {
    const rule = ADVANCED_RULE_DEFINITIONS['XB1'];
    flags.push(createAdvancedFlag('XB1', rule,
      `Different DOFDs reported: ${dofds.map(d => `${d.bureau}: ${d.dofd}`).join(', ')}`,
      { bureauDofds: dofds },
      90
    ));
  }

  // Compare balances
  const balances = bureauData.map(b => ({
    bureau: b.bureau,
    balance: parseFloat((b.fields.currentBalance || '0').replace(/[$,]/g, ''))
  }));
  const uniqueBalances = new Set(balances.map(b => b.balance));

  if (uniqueBalances.size > 1) {
    const maxDiff = Math.max(...balances.map(b => b.balance)) - Math.min(...balances.map(b => b.balance));
    if (maxDiff > 100) { // Only flag if difference is material
      const rule = ADVANCED_RULE_DEFINITIONS['XB2'];
      flags.push(createAdvancedFlag('XB2', rule,
        `Different balances reported: ${balances.map(b => `${b.bureau}: $${b.balance}`).join(', ')}`,
        { bureauBalances: balances },
        82
      ));
    }
  }
}

function runStateSpecificRules(
  fields: CreditFields,
  stateCode: string,
  flags: AdvancedRuleFlag[]
): void {
  const sol = STATE_SOL[stateCode.toUpperCase()];
  if (!sol) return;

  const lastPayment = parseDate(fields.dateLastPayment);
  if (!lastPayment) return;

  const today = new Date();
  const solExpiry = new Date(lastPayment);
  solExpiry.setFullYear(solExpiry.getFullYear() + sol.writtenContracts);

  if (today > solExpiry) {
    // Create a synthetic rule for state SOL
    flags.push({
      ruleId: 'S1-STATE',
      ruleName: `${stateCode} Statute of Limitations Expired`,
      severity: 'high',
      explanation: `Debt is beyond the ${sol.writtenContracts}-year SOL for ${stateCode}. SOL expired on ${solExpiry.toISOString().split('T')[0]}.`,
      whyItMatters: 'Time-barred debts cannot be legally collected through lawsuit.',
      suggestedEvidence: ['Last payment documentation', 'State SOL reference'],
      fieldValues: { stateCode, lastPayment: fields.dateLastPayment, solYears: sol.writtenContracts },
      legalCitations: [`${stateCode} Statute of Limitations`, '15 USC 1692e'],
      successProbability: 85,
      willfulnessScore: 70,
      statutoryDamageRange: { min: 0, max: 1000 },
      actualDamageCategories: ['Time-barred debt defense', 'Emotional distress'],
      chainOfCustodyIssue: false,
      crossBureauContradiction: false,
      forensicConfidence: 80,
      relatedRules: ['CP3'],
      remediation: 'Assert SOL defense. Send cease and desist.',
      timeToFile: 365
    });
  }
}

