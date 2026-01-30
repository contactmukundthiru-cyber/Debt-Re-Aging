'use strict';

/**
 * Advanced Pattern Recognition Engine v2.0
 *
 * Detects sophisticated violation patterns through:
 * - Multi-signal correlation analysis
 * - Temporal pattern matching
 * - Behavior fingerprinting
 * - Anomaly clustering
 * - Predictive risk scoring
 */

import { CreditFields, RuleFlag, parseDate } from './rules';
import { AdvancedRuleFlag } from './rules-advanced';

// ============================================================================
// PATTERN DEFINITIONS
// ============================================================================

export interface PatternDefinition {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiredSignals: string[];
  optionalSignals: string[];
  minimumConfidence: number;
  legalBasis: string[];
  impact: {
    statutory: { min: number; max: number };
    actualCategories: string[];
    punitiveEligible: boolean;
    classActionPotential: boolean;
  };
  recommendations: string[];
}

export interface DetectedPattern {
  pattern: PatternDefinition;
  confidence: number;
  matchedSignals: string[];
  evidence: PatternEvidence[];
  riskScore: number;
  litigationValue: number;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  narrative: string;
}

export interface PatternEvidence {
  type: 'document' | 'data' | 'testimony' | 'expert';
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
  source: string;
}

export interface PatternAnalysisResult {
  patterns: DetectedPattern[];
  overallRiskScore: number;
  topPatterns: string[];
  aggregateLitigationValue: { min: number; max: number };
  prioritizedActions: PrioritizedAction[];
  narrative: string;
}

export interface PrioritizedAction {
  priority: number;
  action: string;
  deadline: string;
  rationale: string;
  expectedOutcome: string;
}

// ============================================================================
// COMPREHENSIVE PATTERN LIBRARY
// ============================================================================

export const PATTERN_LIBRARY: PatternDefinition[] = [
  // ====== RE-AGING PATTERNS ======
  {
    id: 'REAGING_CLASSIC',
    name: 'Classic Debt Re-Aging',
    description: 'Intentional manipulation of DOFD to extend the 7-year reporting period',
    severity: 'critical',
    requiredSignals: ['DOFD_MISMATCH', 'REMOVAL_DATE_EXTENDED'],
    optionalSignals: ['COLLECTOR_CHANGE', 'BALANCE_EXCEEDS_ORIGINAL_SIGNIFICANTLY', 'LATE_PURCHASE'],
    minimumConfidence: 75,
    legalBasis: ['15 USC 1681c(c)', '15 USC 1681s-2(a)(5)', 'Grigoryan v. Experian'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Credit denial', 'Higher interest rates', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Request Metro 2 data showing DOFD history',
      'Obtain historical credit reports as evidence',
      'File CFPB complaint citing systematic re-aging',
      'Consult FCRA attorney for litigation'
    ]
  },
  {
    id: 'REAGING_PAYMENT_RESET',
    name: 'Payment-Triggered Re-Aging',
    description: 'Illegal reset of reporting period after partial payment',
    severity: 'critical',
    requiredSignals: ['DOFD_CHANGED_AFTER_PAYMENT', 'REMOVAL_DATE_SHIFTED'],
    optionalSignals: ['SMALL_PAYMENT_RECORDED', 'COLLECTOR_CONTACTED_BEFORE_PAYMENT'],
    minimumConfidence: 80,
    legalBasis: ['15 USC 1681c(c)(1)', 'FCRA Commentary', 'State consumer protection laws'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Credit denial', 'Deceptive practices', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Document payment date and amount',
      'Compare pre/post payment DOFD',
      'Report to state AG for deceptive practices',
      'This is often willful - impact may be higher'
    ]
  },
  {
    id: 'REAGING_SALE_TRANSFER',
    name: 'Sale/Transfer Re-Aging',
    description: 'New collector creates fresh DOFD upon debt acquisition',
    severity: 'critical',
    requiredSignals: ['NEW_COLLECTOR_NEW_DOFD', 'ACCOUNT_SOLD'],
    optionalSignals: ['ORIGINAL_CREDITOR_DOFD_DIFFERS', 'GAP_IN_REPORTING'],
    minimumConfidence: 85,
    legalBasis: ['15 USC 1681s-2(a)(5)', 'FTC Staff Opinion Letters', 'CFPB Guidance'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Credit denial', 'Wrongful collection', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Request chain of title documentation',
      'Demand original creditor DOFD verification',
      'Compare across all credit bureaus',
      'Document the sale date vs new DOFD'
    ]
  },

  // ====== ZOMBIE DEBT PATTERNS ======
  {
    id: 'ZOMBIE_RESURRECTED',
    name: 'Zombie Debt Resurrection',
    description: 'Debt reported beyond 7-year limit or after previous deletion',
    severity: 'critical',
    requiredSignals: ['BEYOND_7_YEARS', 'STILL_REPORTING'],
    optionalSignals: ['PREVIOUS_DELETION', 'NEW_COLLECTOR', 'AGED_DEBT_PURCHASE'],
    minimumConfidence: 90,
    legalBasis: ['15 USC 1681c(a)(4)', '15 USC 1681i(a)(5)(C)', 'Cushman v. Trans Union'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Credit damage', 'Harassment', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Calculate exact date of expiration',
      'Document re-appearance date',
      'File immediate dispute for deletion',
      'This is per-se violation - strong litigation case'
    ]
  },
  {
    id: 'ZOMBIE_SOL_EXPIRED',
    name: 'Time-Barred Debt Collection',
    description: 'Collection or lawsuit on debt beyond statute of limitations',
    severity: 'critical',
    requiredSignals: ['SOL_EXPIRED', 'ACTIVE_COLLECTION'],
    optionalSignals: ['LAWSUIT_FILED', 'THREATS_TO_SUE', 'CREDIT_REPORTING_CONTINUES'],
    minimumConfidence: 85,
    legalBasis: ['15 USC 1692e', '15 USC 1692f', 'Huertas v. Galaxy Asset', 'State SOL statutes'],
    impact: {
      statutory: { min: 0, max: 1000 },
      actualCategories: ['Wrongful collection', 'Emotional distress', 'Legal fees'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Verify SOL expiration date',
      'Send cease and desist letter',
      'Assert SOL defense if sued',
      'File FDCPA lawsuit for violations'
    ]
  },

  // ====== BALANCE MANIPULATION PATTERNS ======
  {
    id: 'BALANCE_INFLATION',
    name: 'Systematic Balance Inflation',
    description: 'Unauthorized fees, interest, or charges added to debt',
    severity: 'high',
    requiredSignals: ['BALANCE_EXCEEDS_ORIGINAL_SIGNIFICANTLY', 'NO_FEE_DISCLOSURE'],
    optionalSignals: ['COLLECTION_FEES_ADDED', 'INTEREST_ABOVE_CAP', 'MULTIPLE_INCREASES'],
    minimumConfidence: 70,
    legalBasis: ['15 USC 1692f(1)', 'State usury laws', 'Contract terms'],
    impact: {
      statutory: { min: 0, max: 1000 },
      actualCategories: ['Overcharges', 'Emotional distress'],
      punitiveEligible: false,
      classActionPotential: true
    },
    recommendations: [
      'Demand itemized statement of all charges',
      'Compare to original contract terms',
      'Calculate implied interest rate',
      'Challenge unauthorized fees'
    ]
  },
  {
    id: 'BALANCE_YOYO',
    name: 'Balance Yo-Yo Pattern',
    description: 'Balance fluctuates without payments or legitimate adjustments',
    severity: 'high',
    requiredSignals: ['BALANCE_DECREASED_THEN_INCREASED', 'NO_PAYMENT_RECORDED'],
    optionalSignals: ['MULTIPLE_FLUCTUATIONS', 'BUREAU_DISCREPANCIES'],
    minimumConfidence: 65,
    legalBasis: ['15 USC 1681e(b)', '15 USC 1681s-2(a)(1)'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Data integrity', 'Credit damage'],
      punitiveEligible: false,
      classActionPotential: false
    },
    recommendations: [
      'Request historical balance documentation',
      'Dispute inaccuracy',
      'Document all balance changes with dates'
    ]
  },

  // ====== VERIFICATION FAILURE PATTERNS ======
  {
    id: 'VERIFICATION_PARROTING',
    name: 'Verification by Parroting',
    description: 'Bureau verifies by simply repeating furnisher data without investigation',
    severity: 'high',
    requiredSignals: ['DISPUTE_SUBMITTED', 'VERIFIED_WITHOUT_CHANGE', 'OBVIOUS_ERROR_PERSISTS'],
    optionalSignals: ['QUICK_VERIFICATION', 'NO_DOCUMENTATION_REQUESTED'],
    minimumConfidence: 70,
    legalBasis: ['15 USC 1681i(a)(1)(A)', 'Cushman v. Trans Union', 'Dennis v. BEH-1'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Credit denial', 'Time spent', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Document dispute and response',
      'Note lack of meaningful investigation',
      'File method-of-verification request',
      'Consider lawsuit for negligent reinvestigation'
    ]
  },
  {
    id: 'VERIFICATION_IGNORED',
    name: 'Dispute Ignored or Delayed',
    description: 'Bureau fails to investigate or respond within 30 days',
    severity: 'critical',
    requiredSignals: ['DISPUTE_SUBMITTED', 'NO_RESPONSE_30_DAYS'],
    optionalSignals: ['CERTIFIED_MAIL_PROOF', 'MULTIPLE_DISPUTES_IGNORED'],
    minimumConfidence: 90,
    legalBasis: ['15 USC 1681i(a)(1)', '15 USC 1681i(a)(5)'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Per-se violation', 'Credit damage'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Document dispute date and method',
      'Calculate days since dispute',
      'File CFPB complaint immediately',
      'Strong litigation case for willful violation'
    ]
  },

  // ====== COLLECTION PRACTICE PATTERNS ======
  {
    id: 'COLLECTION_HARASSMENT',
    name: 'Collection Harassment Campaign',
    description: 'Pattern of harassing calls, threats, or communications',
    severity: 'high',
    requiredSignals: ['EXCESSIVE_CALLS', 'THREATENING_LANGUAGE'],
    optionalSignals: ['CALLS_TO_WORK', 'THIRD_PARTY_CONTACT', 'FALSE_STATEMENTS'],
    minimumConfidence: 70,
    legalBasis: ['15 USC 1692d', '15 USC 1692c', '15 USC 1692e'],
    impact: {
      statutory: { min: 0, max: 1000 },
      actualCategories: ['Emotional distress', 'Time lost', 'Work impact'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Document all calls with dates/times',
      'Record calls if legal in your state',
      'Send cease communication letter',
      'Strong FDCPA lawsuit potential'
    ]
  },
  {
    id: 'COLLECTION_DECEPTION',
    name: 'Deceptive Collection Practices',
    description: 'False or misleading representations about debt',
    severity: 'high',
    requiredSignals: ['FALSE_AMOUNT_CLAIMED', 'MISREPRESENTED_STATUS'],
    optionalSignals: ['FALSE_CREDITOR_IDENTITY', 'WRONG_CONSUMER', 'FAKE_LEGAL_THREATS'],
    minimumConfidence: 75,
    legalBasis: ['15 USC 1692e', '15 USC 1692f'],
    impact: {
      statutory: { min: 0, max: 1000 },
      actualCategories: ['Actual impact', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Document all false statements',
      'Compare claimed amount to actual debt',
      'Verify collector identity and authority',
      'Strong FDCPA case for misrepresentation'
    ]
  },

  // ====== MEDICAL DEBT PATTERNS ======
  {
    id: 'MEDICAL_IMPROPER_REPORTING',
    name: 'Medical Debt Reporting Violation',
    description: 'Medical debt reported in violation of CFPB rules or state laws',
    severity: 'critical',
    requiredSignals: ['MEDICAL_DEBT', 'UNDER_500_OR_PAID_OR_INSURANCE_PENDING'],
    optionalSignals: ['LESS_THAN_365_DAYS', 'BILLING_ERROR', 'VA_DEBT'],
    minimumConfidence: 80,
    legalBasis: ['CFPB Medical Debt Rule 2023', '15 USC 1681c(a)(6)', 'State medical debt laws'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Credit denial', 'Medical care impact', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Verify debt amount and payment status',
      'Check insurance processing timeline',
      'Cite CFPB medical debt rule in dispute',
      'Request immediate deletion'
    ]
  },

  // ====== IDENTITY PATTERNS ======
  {
    id: 'MIXED_FILE',
    name: 'Mixed Credit File',
    description: 'Another person\'s information mixed into your file',
    severity: 'critical',
    requiredSignals: ['WRONG_NAME', 'WRONG_SSN', 'WRONG_ADDRESS'],
    optionalSignals: ['ACCOUNTS_NOT_YOURS', 'SIMILAR_NAME_PERSON'],
    minimumConfidence: 85,
    legalBasis: ['15 USC 1681e(b)', 'Williams v. First Advantage'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Credit denial', 'Employment denial', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: true
    },
    recommendations: [
      'Identify all mixed accounts',
      'Provide identity documentation',
      'Request complete file separation',
      'Strong case if bureau fails to separate'
    ]
  },
  {
    id: 'IDENTITY_THEFT',
    name: 'Identity Theft Reporting',
    description: 'Fraudulent accounts continue reporting after ID theft notice',
    severity: 'critical',
    requiredSignals: ['ID_THEFT_REPORTED', 'FRAUDULENT_ACCOUNT_CONTINUES'],
    optionalSignals: ['POLICE_REPORT_FILED', 'FTC_AFFIDAVIT_SUBMITTED'],
    minimumConfidence: 90,
    legalBasis: ['15 USC 1681c-2', '15 USC 1681g(e)', 'FACTA provisions'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Credit damage', 'Time spent', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: false
    },
    recommendations: [
      'Submit identity theft affidavit',
      'File police report',
      'Request fraud block',
      'Demand immediate removal of fraudulent accounts'
    ]
  },

  // ====== BANKRUPTCY PATTERNS ======
  {
    id: 'BANKRUPTCY_VIOLATION',
    name: 'Bankruptcy Discharge Violation',
    description: 'Collection or reporting on discharged debt',
    severity: 'critical',
    requiredSignals: ['BANKRUPTCY_DISCHARGE', 'DEBT_INCLUDED', 'COLLECTION_CONTINUES'],
    optionalSignals: ['BALANCE_NOT_ZERO', 'NEGATIVE_STATUS_REPORTED'],
    minimumConfidence: 95,
    legalBasis: ['11 USC 524(a)(2)', '15 USC 1681c(a)(1)', 'In re Denby-Peterson'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Bankruptcy contempt', 'Credit damage', 'Emotional distress'],
      punitiveEligible: true,
      classActionPotential: false
    },
    recommendations: [
      'Provide bankruptcy discharge order',
      'Cite 11 USC 524 violation',
      'Request zero value value reporting',
      'Can seek sanctions in bankruptcy court'
    ]
  },

  // ====== CROSS-BUREAU PATTERNS ======
  {
    id: 'CROSS_BUREAU_DISCREPANCY',
    name: 'Material Cross-Bureau Discrepancy',
    description: 'Significant differences in data across credit bureaus',
    severity: 'high',
    requiredSignals: ['DOFD_DIFFERS_BUREAUS', 'BALANCE_DIFFERS_BUREAUS'],
    optionalSignals: ['STATUS_DIFFERS', 'MISSING_FROM_BUREAU', 'DIFFERENT_CREDITOR_NAME'],
    minimumConfidence: 75,
    legalBasis: ['15 USC 1681s-2(a)(1)', '15 USC 1681e(b)', 'Saunders v. Branch Banking'],
    impact: {
      statutory: { min: 100, max: 1000 },
      actualCategories: ['Credit damage', 'Confusion', 'Time spent'],
      punitiveEligible: false,
      classActionPotential: true
    },
    recommendations: [
      'Document differences across all bureaus',
      'Dispute to each bureau citing discrepancies',
      'Request furnisher correct to all bureaus',
      'Inconsistency itself is evidence of inaccuracy'
    ]
  }
];

// ============================================================================
// PATTERN DETECTION ENGINE
// ============================================================================

/**
 * Analyze credit data for patterns
 */
export function detectPatterns(
  fields: CreditFields,
  flags: (RuleFlag | AdvancedRuleFlag)[],
  options: {
    historicalData?: CreditFields[];
    crossBureauData?: { bureau: string; fields: CreditFields }[];
    disputeHistory?: { date: string; result: string; disputed: string }[];
  } = {}
): PatternAnalysisResult {
  const detectedPatterns: DetectedPattern[] = [];
  const signalsDetected = extractSignals(fields, flags, options);

  // Check each pattern in the library
  for (const pattern of PATTERN_LIBRARY) {
    const matchResult = matchPattern(pattern, signalsDetected, fields, options);
    if (matchResult.confidence >= pattern.minimumConfidence) {
      detectedPatterns.push({
        pattern,
        confidence: matchResult.confidence,
        matchedSignals: matchResult.matchedSignals,
        evidence: generatePatternEvidence(pattern, fields, matchResult.matchedSignals),
        riskScore: calculatePatternRiskScore(pattern, matchResult.confidence),
        litigationValue: calculateLitigationValue(pattern, matchResult.confidence, flags),
        urgency: determineUrgency(pattern, fields),
        narrative: generatePatternNarrative(pattern, fields, matchResult)
      });
    }
  }

  // Sort by risk score
  detectedPatterns.sort((a, b) => b.riskScore - a.riskScore);

  // Calculate aggregate values
  const overallRiskScore = calculateOverallRiskScore(detectedPatterns);
  const aggregateLitigationValue = calculateAggregateLitigationValue(detectedPatterns);
  const prioritizedActions = generatePrioritizedActions(detectedPatterns, fields);

  return {
    patterns: detectedPatterns,
    overallRiskScore,
    topPatterns: detectedPatterns.slice(0, 3).map(p => p.pattern.name),
    aggregateLitigationValue,
    prioritizedActions,
    narrative: generateOverallNarrative(detectedPatterns, flags)
  };
}

/**
 * Extract signals from data for pattern matching
 */
function extractSignals(
  fields: CreditFields,
  flags: (RuleFlag | AdvancedRuleFlag)[],
  options: {
    historicalData?: CreditFields[];
    crossBureauData?: { bureau: string; fields: CreditFields }[];
    disputeHistory?: { date: string; result: string; disputed: string }[];
  }
): Set<string> {
  const signals = new Set<string>();

  const dofd = parseDate(fields.dofd);
  const opened = parseDate(fields.dateOpened);
  const chargeOff = parseDate(fields.chargeOffDate);
  const lastPayment = parseDate(fields.dateLastPayment);
  const removal = parseDate(fields.estimatedRemovalDate);
  const today = new Date();

  const current = parseFloat((fields.currentValue || '0').replace(/[$,]/g, ''));
  const original = parseFloat((fields.originalAmount || '0').replace(/[$,]/g, ''));
  const status = (fields.accountStatus || '').toLowerCase();
  const accountType = (fields.accountType || '').toLowerCase();

  // ====== Timeline Signals ======
  if (dofd && opened && dofd < opened) {
    signals.add('DOFD_BEFORE_OPENED');
    signals.add('DOFD_MISMATCH');
  }

  if (dofd) {
    const expectedRemoval = new Date(dofd);
    expectedRemoval.setFullYear(expectedRemoval.getFullYear() + 7);
    expectedRemoval.setDate(expectedRemoval.getDate() + 180);

    if (today > expectedRemoval) {
      signals.add('BEYOND_7_YEARS');
      signals.add('STILL_REPORTING');
    }

    if (removal && removal > expectedRemoval) {
      signals.add('REMOVAL_DATE_EXTENDED');
    }
  }

  // ====== Balance Signals ======
  if ((status.includes('paid') || status.includes('settled')) && current > 0) {
    signals.add('PAID_BUT_BALANCE');
  }

  if (original > 0 && current > original * 1.5) {
    signals.add('BALANCE_EXCEEDS_ORIGINAL_SIGNIFICANTLY');
    if (current > original * 2) {
      signals.add('NO_FEE_DISCLOSURE');
    }
  }

  // ====== Account Type Signals ======
  if (accountType.includes('collection')) {
    signals.add('COLLECTION_ACCOUNT');
    if (!fields.originalCreditor) {
      signals.add('MISSING_ORIGINAL_CREDITOR');
    }
  }

  if (accountType.includes('medical') ||
      (fields.furnisherOrCollector || '').toLowerCase().includes('medical') ||
      (fields.furnisherOrCollector || '').toLowerCase().includes('health')) {
    signals.add('MEDICAL_DEBT');
    if (current < 500 && current > 0) {
      signals.add('UNDER_500_OR_PAID_OR_INSURANCE_PENDING');
    }
    if (status.includes('paid')) {
      signals.add('UNDER_500_OR_PAID_OR_INSURANCE_PENDING');
    }
  }

  // ====== Status Signals ======
  if (status.includes('sold') || status.includes('transfer')) {
    signals.add('ACCOUNT_SOLD');
  }

  // ====== Cross-Bureau Signals ======
  if (options.crossBureauData && options.crossBureauData.length > 1) {
    const dofds = options.crossBureauData.map(b => b.fields.dofd).filter(Boolean);
    if (new Set(dofds).size > 1) {
      signals.add('DOFD_DIFFERS_BUREAUS');
    }

    const balances = options.crossBureauData.map(b =>
      parseFloat((b.fields.currentValue || '0').replace(/[$,]/g, ''))
    );
    const balanceMax = Math.max(...balances);
    const balanceMin = Math.min(...balances);
    if (balanceMax - balanceMin > 100) {
      signals.add('BALANCE_DIFFERS_BUREAUS');
    }
  }

  // ====== Add signals from flags ======
  for (const flag of flags) {
    if (['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B1-ADV'].includes(flag.ruleId)) {
      signals.add('DOFD_MISMATCH');
    }
    if (['K6', 'ZD1', 'ZD2', 'ZD3'].includes(flag.ruleId)) {
      signals.add('BEYOND_7_YEARS');
      signals.add('STILL_REPORTING');
    }
    if (['K1', 'K7', 'K8', 'K9', 'K10'].includes(flag.ruleId)) {
      signals.add('BALANCE_EXCEEDS_ORIGINAL_SIGNIFICANTLY');
    }
    if (['S1', 'S1-STATE'].includes(flag.ruleId)) {
      signals.add('SOL_EXPIRED');
      signals.add('ACTIVE_COLLECTION');
    }
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(flag.ruleId)) {
      signals.add('MEDICAL_DEBT');
      if (flag.ruleId === 'H1') signals.add('LESS_THAN_365_DAYS');
      if (['H2', 'H3'].includes(flag.ruleId)) signals.add('UNDER_500_OR_PAID_OR_INSURANCE_PENDING');
    }
    if (['R1', 'CP1'].includes(flag.ruleId)) {
      signals.add('BANKRUPTCY_DISCHARGE');
      signals.add('DEBT_INCLUDED');
      signals.add('COLLECTION_CONTINUES');
    }
  }

  // ====== Dispute History Signals ======
  if (options.disputeHistory && options.disputeHistory.length > 0) {
    signals.add('DISPUTE_SUBMITTED');
    const recentDisputes = options.disputeHistory.filter(d => {
      const disputeDate = new Date(d.date);
      const daysSince = (today.getTime() - disputeDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 45;
    });

    if (recentDisputes.length > 0 && recentDisputes.every(d => d.result === 'verified')) {
      signals.add('VERIFIED_WITHOUT_CHANGE');
      // Check if error persists (simplified)
      if (flags.length > 0) {
        signals.add('OBVIOUS_ERROR_PERSISTS');
      }
    }

    const oldDisputes = options.disputeHistory.filter(d => {
      const disputeDate = new Date(d.date);
      const daysSince = (today.getTime() - disputeDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 30;
    });
    const noResponseDisputes = oldDisputes.filter(d => d.result === 'no_response');
    if (noResponseDisputes.length > 0) {
      signals.add('NO_RESPONSE_30_DAYS');
    }
  }

  return signals;
}

/**
 * Match a pattern against detected signals
 */
function matchPattern(
  pattern: PatternDefinition,
  signals: Set<string>,
  _fields: CreditFields,
  _options: {
    historicalData?: CreditFields[];
    crossBureauData?: { bureau: string; fields: CreditFields }[];
    disputeHistory?: { date: string; result: string; disputed: string }[];
  }
): { confidence: number; matchedSignals: string[] } {
  const matchedSignals: string[] = [];

  // Check required signals
  let requiredMatched = 0;
  for (const required of pattern.requiredSignals) {
    if (signals.has(required)) {
      matchedSignals.push(required);
      requiredMatched++;
    }
  }

  // If not all required signals present, confidence is lower
  const requiredRatio = requiredMatched / pattern.requiredSignals.length;
  if (requiredRatio < 0.5) {
    return { confidence: 0, matchedSignals };
  }

  // Check optional signals
  let optionalMatched = 0;
  for (const optional of pattern.optionalSignals) {
    if (signals.has(optional)) {
      matchedSignals.push(optional);
      optionalMatched++;
    }
  }

  // Calculate confidence
  const optionalRatio = pattern.optionalSignals.length > 0
    ? optionalMatched / pattern.optionalSignals.length
    : 0;

  const confidence = Math.round((requiredRatio * 70) + (optionalRatio * 30));

  return { confidence, matchedSignals };
}

/**
 * Generate evidence items for a pattern
 */
function generatePatternEvidence(
  pattern: PatternDefinition,
  fields: CreditFields,
  matchedSignals: string[]
): PatternEvidence[] {
  const evidence: PatternEvidence[] = [];

  // Add document-based evidence
  if (matchedSignals.includes('DOFD_MISMATCH') || matchedSignals.includes('DOFD_DIFFERS_BUREAUS')) {
    evidence.push({
      type: 'document',
      description: 'Credit reports showing DOFD discrepancy',
      strength: 'strong',
      source: 'Credit bureau reports'
    });
  }

  if (matchedSignals.includes('BEYOND_7_YEARS')) {
    evidence.push({
      type: 'data',
      description: `DOFD of ${fields.dofd} places account beyond 7-year reporting limit`,
      strength: 'strong',
      source: 'Calculation from DOFD'
    });
  }

  if (matchedSignals.includes('BALANCE_EXCEEDS_ORIGINAL_SIGNIFICANTLY')) {
    const current = parseFloat((fields.currentValue || '0').replace(/[$,]/g, ''));
    const original = parseFloat((fields.originalAmount || '0').replace(/[$,]/g, ''));
    evidence.push({
      type: 'data',
      description: `Balance increased from $${original.toLocaleString()} to $${current.toLocaleString()}`,
      strength: 'moderate',
      source: 'Balance comparison'
    });
  }

  // Add testimony-based evidence recommendations
  evidence.push({
    type: 'testimony',
    description: 'Consumer declaration about credit denials or impacts',
    strength: 'moderate',
    source: 'Consumer testimony'
  });

  return evidence;
}

/**
 * Calculate risk score for a pattern
 */
function calculatePatternRiskScore(
  pattern: PatternDefinition,
  confidence: number
): number {
  const severityMultiplier = {
    critical: 1.0,
    high: 0.8,
    medium: 0.6,
    low: 0.4
  };

  const baseScore = confidence * severityMultiplier[pattern.severity];
  const punitiveBonus = pattern.impact.punitiveEligible ? 10 : 0;
  const classActionBonus = pattern.impact.classActionPotential ? 5 : 0;

  return Math.min(100, Math.round(baseScore + punitiveBonus + classActionBonus));
}

/**
 * Calculate litigation value for a pattern
 */
function calculateLitigationValue(
  pattern: PatternDefinition,
  confidence: number,
  flags: (RuleFlag | AdvancedRuleFlag)[]
): number {
  const confidenceMultiplier = confidence / 100;

  // Statutory liability
  const statutoryMid = (pattern.impact.statutory.min + pattern.impact.statutory.max) / 2;
  const statutoryValue = statutoryMid * confidenceMultiplier;

  // Actual impact estimate (simplified)
  const actualEstimate = pattern.impact.actualCategories.length * 500 * confidenceMultiplier;

  // Accountability if eligible
  const punitiveEstimate = pattern.impact.punitiveEligible
    ? (statutoryValue + actualEstimate) * 0.5
    : 0;

  // Attorney fees (typically 1/3 of recovery)
  const estimatedAttorneyFees = (statutoryValue + actualEstimate + punitiveEstimate) * 0.33;

  // Add per-violation statutory liability
  const violationCount = flags.filter(f => f.severity === 'high' || (f.severity as string) === 'critical').length;
  const perViolationImpact = violationCount * 500;

  return Math.round(statutoryValue + actualEstimate + punitiveEstimate + estimatedAttorneyFees + perViolationImpact);
}

/**
 * Determine urgency of a pattern
 */
function determineUrgency(
  pattern: PatternDefinition,
  fields: CreditFields
): 'immediate' | 'high' | 'medium' | 'low' {
  // Time-sensitive patterns
  if (pattern.id.includes('ZOMBIE') || pattern.id.includes('SOL')) {
    return 'immediate';
  }

  if (pattern.severity === 'critical') {
    return 'immediate';
  }

  if (pattern.severity === 'high') {
    return 'high';
  }

  // Check if near reporting expiration
  const dofd = parseDate(fields.dofd);
  if (dofd) {
    const removalDate = new Date(dofd);
    removalDate.setFullYear(removalDate.getFullYear() + 7);
    const daysUntilRemoval = (removalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilRemoval < 90 && daysUntilRemoval > 0) {
      return 'high';
    }
  }

  return pattern.severity === 'medium' ? 'medium' : 'low';
}

/**
 * Generate narrative for a pattern
 */
function generatePatternNarrative(
  pattern: PatternDefinition,
  fields: CreditFields,
  matchResult: { confidence: number; matchedSignals: string[] }
): string {
  const furnisher = fields.furnisherOrCollector || 'the furnisher';
  const confidence = matchResult.confidence >= 90 ? 'strong evidence of' :
                     matchResult.confidence >= 75 ? 'likely' :
                     'potential';

  let narrative = `Analysis reveals ${confidence} ${pattern.name}. `;
  narrative += pattern.description + '. ';

  if (pattern.impact.punitiveEligible) {
    narrative += 'This violation pattern may support accountability impact due to potential willfulness. ';
  }

  if (pattern.impact.classActionPotential) {
    narrative += 'Similar violations against other consumers may support class action certification. ';
  }

  narrative += `Key legal authorities: ${pattern.legalBasis.slice(0, 2).join(', ')}.`;

  return narrative;
}

/**
 * Calculate overall risk score
 */
function calculateOverallRiskScore(patterns: DetectedPattern[]): number {
  if (patterns.length === 0) return 0;

  // Weighted average with diminishing returns for multiple patterns
  let totalScore = 0;
  let weight = 1.0;

  for (const pattern of patterns) {
    totalScore += pattern.riskScore * weight;
    weight *= 0.7; // Diminishing weight for additional patterns
  }

  return Math.min(100, Math.round(totalScore));
}

/**
 * Calculate aggregate litigation value
 */
function calculateAggregateLitigationValue(
  patterns: DetectedPattern[]
): { min: number; max: number } {
  let minTotal = 0;
  let maxTotal = 0;

  for (const pattern of patterns) {
    minTotal += pattern.pattern.impact.statutory.min;
    maxTotal += pattern.litigationValue;
  }

  // Add potential actual impact and attorney fees
  maxTotal *= 1.5;

  return { min: minTotal, max: Math.round(maxTotal) };
}

/**
 * Generate prioritized actions
 */
function generatePrioritizedActions(
  patterns: DetectedPattern[],
  fields: CreditFields
): PrioritizedAction[] {
  const actions: PrioritizedAction[] = [];
  const addedActions = new Set<string>();

  let priority = 1;

  for (const detected of patterns) {
    for (const rec of detected.pattern.recommendations) {
      if (!addedActions.has(rec)) {
        addedActions.add(rec);
        actions.push({
          priority: priority++,
          action: rec,
          deadline: detected.urgency === 'immediate' ? '7 days' :
                   detected.urgency === 'high' ? '14 days' :
                   detected.urgency === 'medium' ? '30 days' : '60 days',
          rationale: `Required for ${detected.pattern.name} (${detected.confidence}% confidence)`,
          expectedOutcome: getExpectedOutcome(rec)
        });
      }
    }
  }

  return actions.slice(0, 10); // Top 10 actions
}

/**
 * Get expected outcome for an action
 */
function getExpectedOutcome(action: string): string {
  if (action.includes('deletion') || action.includes('delete')) {
    return 'Account removal from credit report';
  }
  if (action.includes('dispute')) {
    return 'Bureau investigation and potential correction';
  }
  if (action.includes('validation') || action.includes('verify')) {
    return 'Documentation supporting dispute or evidence of violation';
  }
  if (action.includes('CFPB')) {
    return 'Regulatory attention and potential enforcement';
  }
  if (action.includes('attorney') || action.includes('litigation')) {
    return 'Legal action for impact recovery';
  }
  return 'Evidence preservation and case building';
}

/**
 * Generate overall narrative
 */
function generateOverallNarrative(
  patterns: DetectedPattern[],
  flags: (RuleFlag | AdvancedRuleFlag)[]
): string {
  if (patterns.length === 0) {
    return 'No significant violation patterns detected. Individual issues may still warrant dispute.';
  }

  const topPattern = patterns[0];
  const highSeverityCount = patterns.filter(p => p.pattern.severity === 'critical' || p.pattern.severity === 'high').length;
  const violationCount = flags.length;

  let narrative = `Forensic analysis identified ${patterns.length} violation pattern(s) with ${violationCount} individual flags. `;

  if (highSeverityCount > 0) {
    narrative += `${highSeverityCount} pattern(s) are high or critical severity, indicating potential willful noncompliance. `;
  }

  narrative += `The primary pattern is "${topPattern.pattern.name}" with ${topPattern.confidence}% confidence. `;

  const maxValue = patterns.reduce((sum, p) => sum + p.litigationValue, 0);
  if (maxValue > 5000) {
    narrative += `Estimated litigation value ranges from $${patterns.reduce((sum, p) => sum + p.pattern.impact.statutory.min, 0).toLocaleString()} to $${maxValue.toLocaleString()}. `;
    narrative += 'Consultation with an FCRA attorney is strongly recommended.';
  } else {
    narrative += 'Standard dispute procedures are recommended as the first step.';
  }

  return narrative;
}

