'use strict';

/**
 * Advanced Damages Calculation Engine
 *
 * Calculates potential FCRA/FDCPA damages with:
 * - Statutory damages per violation
 * - Actual damages estimation
 * - Punitive damages assessment
 * - Attorney fees projection
 * - Jurisdiction-specific adjustments
 * - Class action potential
 */

import { RuleFlag } from './rules';
import { AdvancedRuleFlag } from './rules-advanced';
import { DetectedPattern } from './pattern-engine';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DamagesCalculation {
  statutory: StatutoryDamages;
  actual: ActualDamages;
  punitive: PunitiveDamages;
  attorneyFees: AttorneyFees;
  costs: LitigationCosts;
  total: TotalDamages;
  multipliers: DamageMultipliers;
  classActionAssessment: ClassActionAssessment;
  settlementProjection: SettlementProjection;
  riskAssessment: DamageRiskAssessment;
}

export interface StatutoryDamages {
  perViolation: { min: number; max: number };
  violationCount: number;
  fcraStatutory: { min: number; max: number };
  fdcpaStatutory: { min: number; max: number };
  total: { min: number; max: number };
  notes: string[];
}

export interface ActualDamages {
  creditDenials: number;
  higherInterestRates: number;
  emotionalDistress: number;
  lostEmployment: number;
  lostHousing: number;
  outOfPocket: number;
  timeSpent: number;
  total: number;
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  documentationNeeded: string[];
}

export interface PunitiveDamages {
  eligible: boolean;
  willfulnessScore: number;
  estimatedRange: { min: number; max: number };
  multiplier: number;
  supportingFactors: string[];
  riskFactors: string[];
}

export interface AttorneyFees {
  estimatedHours: number;
  hourlyRate: { min: number; max: number };
  totalEstimate: { min: number; max: number };
  contingencyAvailable: boolean;
  feeShiftingAvailable: boolean;
}

export interface LitigationCosts {
  filingFees: number;
  serviceCosts: number;
  expertWitness: number;
  depositions: number;
  otherCosts: number;
  total: number;
}

export interface TotalDamages {
  conservative: number;
  moderate: number;
  aggressive: number;
  expected: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface DamageMultipliers {
  willfulness: number;
  patternOfConduct: number;
  vulnerableConsumer: number;
  financialHarm: number;
  recidivism: number;
}

export interface ClassActionAssessment {
  potential: boolean;
  estimatedClassSize: string;
  commonalityScore: number;
  typicalityScore: number;
  adequacyScore: number;
  superiority: boolean;
  estimatedClassRecovery: { min: number; max: number };
  namedPlaintiffRecovery: { min: number; max: number };
}

export interface SettlementProjection {
  preDiscovery: { min: number; max: number };
  postDiscovery: { min: number; max: number };
  preTrial: { min: number; max: number };
  settlementLikelihood: number;
  medianSettlement: number;
}

export interface DamageRiskAssessment {
  strengthScore: number;
  weaknesses: string[];
  strengths: string[];
  recommendations: string[];
}

// ============================================================================
// JURISDICTION-SPECIFIC DATA
// ============================================================================

interface JurisdictionData {
  avgStatutoryAward: number;
  avgActualDamages: number;
  punitiveMultiplier: number;
  attorneyHourlyRate: { min: number; max: number };
  filingFee: number;
  consumerFriendly: boolean;
}

const JURISDICTION_DATA: Record<string, JurisdictionData> = {
  '1st': { avgStatutoryAward: 750, avgActualDamages: 15000, punitiveMultiplier: 1.5, attorneyHourlyRate: { min: 350, max: 550 }, filingFee: 402, consumerFriendly: true },
  '2nd': { avgStatutoryAward: 800, avgActualDamages: 20000, punitiveMultiplier: 1.8, attorneyHourlyRate: { min: 400, max: 650 }, filingFee: 402, consumerFriendly: true },
  '3rd': { avgStatutoryAward: 850, avgActualDamages: 25000, punitiveMultiplier: 2.0, attorneyHourlyRate: { min: 375, max: 575 }, filingFee: 402, consumerFriendly: true },
  '4th': { avgStatutoryAward: 700, avgActualDamages: 18000, punitiveMultiplier: 1.5, attorneyHourlyRate: { min: 300, max: 500 }, filingFee: 402, consumerFriendly: true },
  '5th': { avgStatutoryAward: 600, avgActualDamages: 12000, punitiveMultiplier: 1.2, attorneyHourlyRate: { min: 275, max: 450 }, filingFee: 402, consumerFriendly: false },
  '6th': { avgStatutoryAward: 700, avgActualDamages: 16000, punitiveMultiplier: 1.5, attorneyHourlyRate: { min: 300, max: 500 }, filingFee: 402, consumerFriendly: true },
  '7th': { avgStatutoryAward: 750, avgActualDamages: 18000, punitiveMultiplier: 1.6, attorneyHourlyRate: { min: 325, max: 525 }, filingFee: 402, consumerFriendly: true },
  '8th': { avgStatutoryAward: 650, avgActualDamages: 14000, punitiveMultiplier: 1.3, attorneyHourlyRate: { min: 275, max: 450 }, filingFee: 402, consumerFriendly: false },
  '9th': { avgStatutoryAward: 900, avgActualDamages: 22000, punitiveMultiplier: 2.0, attorneyHourlyRate: { min: 400, max: 650 }, filingFee: 402, consumerFriendly: true },
  '10th': { avgStatutoryAward: 650, avgActualDamages: 14000, punitiveMultiplier: 1.3, attorneyHourlyRate: { min: 275, max: 450 }, filingFee: 402, consumerFriendly: false },
  '11th': { avgStatutoryAward: 700, avgActualDamages: 16000, punitiveMultiplier: 1.5, attorneyHourlyRate: { min: 300, max: 500 }, filingFee: 402, consumerFriendly: true },
  'DC': { avgStatutoryAward: 800, avgActualDamages: 20000, punitiveMultiplier: 1.8, attorneyHourlyRate: { min: 450, max: 700 }, filingFee: 402, consumerFriendly: true },
  'default': { avgStatutoryAward: 700, avgActualDamages: 15000, punitiveMultiplier: 1.5, attorneyHourlyRate: { min: 300, max: 500 }, filingFee: 402, consumerFriendly: true }
};

// State to Circuit mapping
const STATE_TO_CIRCUIT: Record<string, string> = {
  'ME': '1st', 'MA': '1st', 'NH': '1st', 'RI': '1st', 'PR': '1st',
  'CT': '2nd', 'NY': '2nd', 'VT': '2nd',
  'DE': '3rd', 'NJ': '3rd', 'PA': '3rd', 'VI': '3rd',
  'MD': '4th', 'NC': '4th', 'SC': '4th', 'VA': '4th', 'WV': '4th',
  'LA': '5th', 'MS': '5th', 'TX': '5th',
  'KY': '6th', 'MI': '6th', 'OH': '6th', 'TN': '6th',
  'IL': '7th', 'IN': '7th', 'WI': '7th',
  'AR': '8th', 'IA': '8th', 'MN': '8th', 'MO': '8th', 'NE': '8th', 'ND': '8th', 'SD': '8th',
  'AK': '9th', 'AZ': '9th', 'CA': '9th', 'GU': '9th', 'HI': '9th', 'ID': '9th', 'MT': '9th', 'NV': '9th', 'OR': '9th', 'WA': '9th',
  'CO': '10th', 'KS': '10th', 'NM': '10th', 'OK': '10th', 'UT': '10th', 'WY': '10th',
  'AL': '11th', 'FL': '11th', 'GA': '11th',
  'DC': 'DC'
};

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate comprehensive damages estimate
 */
export function calculateDamages(
  flags: (RuleFlag | AdvancedRuleFlag)[],
  patterns: DetectedPattern[],
  options: {
    stateCode?: string;
    creditDenials?: number;
    employmentImpact?: boolean;
    housingImpact?: boolean;
    emotionalDistressLevel?: 'mild' | 'moderate' | 'severe';
    monthsOfHarm?: number;
    outOfPocketExpenses?: number;
    hoursSpentDisputing?: number;
    vulnerableConsumer?: boolean;
    priorViolations?: boolean;
  } = {}
): DamagesCalculation {
  const circuit = options.stateCode ? STATE_TO_CIRCUIT[options.stateCode.toUpperCase()] || 'default' : 'default';
  const jurisdictionData = JURISDICTION_DATA[circuit] || JURISDICTION_DATA['default'];

  // Calculate each component
  const statutory = calculateStatutoryDamages(flags, jurisdictionData);
  const actual = calculateActualDamages(flags, options, jurisdictionData);
  const multipliers = calculateMultipliers(flags, patterns, options);
  const punitive = calculatePunitiveDamages(flags, statutory, actual, multipliers, jurisdictionData);
  const attorneyFees = calculateAttorneyFees(flags, statutory, actual, punitive, jurisdictionData);
  const costs = calculateLitigationCosts(jurisdictionData);
  const total = calculateTotalDamages(statutory, actual, punitive, attorneyFees, costs, multipliers);
  const classAction = assessClassActionPotential(flags, patterns);
  const settlement = projectSettlement(total, flags, patterns);
  const risk = assessDamageRisk(flags, patterns, actual);

  return {
    statutory,
    actual,
    punitive,
    attorneyFees,
    costs,
    total,
    multipliers,
    classActionAssessment: classAction,
    settlementProjection: settlement,
    riskAssessment: risk
  };
}

// ============================================================================
// COMPONENT CALCULATIONS
// ============================================================================

function calculateStatutoryDamages(
  flags: (RuleFlag | AdvancedRuleFlag)[],
  jurisdictionData: JurisdictionData
): StatutoryDamages {
  const notes: string[] = [];

  // Count FCRA and FDCPA violations separately
  const fcraViolations = flags.filter(f =>
    !f.ruleId.startsWith('CP') &&
    !['K7', 'K8', 'K9', 'K10'].some(id => f.ruleId === id && f.legalCitations.some(c => c.includes('1692')))
  );
  const fdcpaViolations = flags.filter(f =>
    f.ruleId.startsWith('CP') ||
    f.legalCitations.some(c => c.includes('1692'))
  );

  // FCRA statutory: $100-$1,000 per violation for negligent, up to $1,000 for willful
  const fcraMin = 100 * fcraViolations.length;
  const fcraMax = 1000 * fcraViolations.length;

  // FDCPA statutory: up to $1,000 total (not per violation) plus actual
  const fdcpaMin = fdcpaViolations.length > 0 ? 500 : 0;
  const fdcpaMax = fdcpaViolations.length > 0 ? 1000 : 0;

  if (fcraViolations.length > 0) {
    notes.push(`${fcraViolations.length} FCRA violation(s) - statutory range $100-$1,000 per violation`);
  }
  if (fdcpaViolations.length > 0) {
    notes.push(`FDCPA violations - statutory damages up to $1,000 (aggregate, not per violation)`);
  }

  return {
    perViolation: { min: 100, max: 1000 },
    violationCount: flags.length,
    fcraStatutory: { min: fcraMin, max: fcraMax },
    fdcpaStatutory: { min: fdcpaMin, max: fdcpaMax },
    total: { min: fcraMin + fdcpaMin, max: fcraMax + fdcpaMax },
    notes
  };
}

function calculateActualDamages(
  flags: (RuleFlag | AdvancedRuleFlag)[],
  options: {
    creditDenials?: number;
    employmentImpact?: boolean;
    housingImpact?: boolean;
    emotionalDistressLevel?: 'mild' | 'moderate' | 'severe';
    monthsOfHarm?: number;
    outOfPocketExpenses?: number;
    hoursSpentDisputing?: number;
  },
  jurisdictionData: JurisdictionData
): ActualDamages {
  const documentationNeeded: string[] = [];

  // Credit denials - each denial can be $500-$5,000 depending on impact
  const creditDenials = (options.creditDenials || 0) * 2000;
  if (options.creditDenials) {
    documentationNeeded.push('Credit denial letters');
    documentationNeeded.push('Applications submitted');
  }

  // Higher interest rates - calculate additional interest paid
  // Assume $200/month additional for each month of harm
  const higherInterestRates = (options.monthsOfHarm || 0) * 200;
  if (higherInterestRates > 0) {
    documentationNeeded.push('Loan documents showing rate');
    documentationNeeded.push('Market rate comparison');
  }

  // Emotional distress
  const distressValues = { mild: 2500, moderate: 7500, severe: 25000 };
  const emotionalDistress = distressValues[options.emotionalDistressLevel || 'mild'];
  documentationNeeded.push('Declaration describing emotional impact');

  // Lost employment
  const lostEmployment = options.employmentImpact ? 15000 : 0;
  if (options.employmentImpact) {
    documentationNeeded.push('Job offer or denial letter');
    documentationNeeded.push('Evidence of credit check requirement');
  }

  // Lost housing
  const lostHousing = options.housingImpact ? 10000 : 0;
  if (options.housingImpact) {
    documentationNeeded.push('Rental application denial');
    documentationNeeded.push('Alternative housing costs');
  }

  // Out of pocket expenses
  const outOfPocket = options.outOfPocketExpenses || 0;
  if (outOfPocket > 0) {
    documentationNeeded.push('Receipts for credit monitoring');
    documentationNeeded.push('Mailing costs for disputes');
  }

  // Time spent - typically $25-50/hour
  const timeSpent = (options.hoursSpentDisputing || 0) * 35;
  if (options.hoursSpentDisputing) {
    documentationNeeded.push('Log of time spent on disputes');
  }

  const total = creditDenials + higherInterestRates + emotionalDistress +
                lostEmployment + lostHousing + outOfPocket + timeSpent;

  // Determine evidence strength based on what's documented
  let evidenceStrength: 'strong' | 'moderate' | 'weak' = 'weak';
  if (options.creditDenials || options.employmentImpact || options.housingImpact) {
    evidenceStrength = 'strong';
  } else if (options.emotionalDistressLevel === 'severe' || options.monthsOfHarm) {
    evidenceStrength = 'moderate';
  }

  return {
    creditDenials,
    higherInterestRates,
    emotionalDistress,
    lostEmployment,
    lostHousing,
    outOfPocket,
    timeSpent,
    total,
    evidenceStrength,
    documentationNeeded
  };
}

function calculateMultipliers(
  flags: (RuleFlag | AdvancedRuleFlag)[],
  patterns: DetectedPattern[],
  options: {
    vulnerableConsumer?: boolean;
    priorViolations?: boolean;
  }
): DamageMultipliers {
  // Willfulness multiplier based on advanced flags
  const avgWillfulness = flags.reduce((sum, f) => {
    const advancedFlag = f as AdvancedRuleFlag;
    return sum + (advancedFlag.willfulnessScore || 50);
  }, 0) / flags.length;
  const willfulness = 1 + (avgWillfulness / 100);

  // Pattern of conduct multiplier
  const highSeverityPatterns = patterns.filter(p =>
    p.pattern.severity === 'critical' || p.pattern.severity === 'high'
  ).length;
  const patternOfConduct = 1 + (highSeverityPatterns * 0.2);

  // Vulnerable consumer multiplier
  const vulnerableConsumer = options.vulnerableConsumer ? 1.3 : 1.0;

  // Financial harm multiplier (critical is from AdvancedRuleFlag)
  const financialHarm = flags.some(f => (f.severity as string) === 'critical') ? 1.25 : 1.0;

  // Recidivism multiplier (defendant has prior violations)
  const recidivism = options.priorViolations ? 1.5 : 1.0;

  return {
    willfulness,
    patternOfConduct,
    vulnerableConsumer,
    financialHarm,
    recidivism
  };
}

function calculatePunitiveDamages(
  flags: (RuleFlag | AdvancedRuleFlag)[],
  statutory: StatutoryDamages,
  actual: ActualDamages,
  multipliers: DamageMultipliers,
  jurisdictionData: JurisdictionData
): PunitiveDamages {
  const supportingFactors: string[] = [];
  const riskFactors: string[] = [];

  // Calculate willfulness score
  const avgWillfulness = flags.reduce((sum, f) => {
    const advancedFlag = f as AdvancedRuleFlag;
    return sum + (advancedFlag.willfulnessScore || 50);
  }, 0) / flags.length;

  // Determine eligibility
  const eligible = avgWillfulness >= 60;

  if (avgWillfulness >= 80) {
    supportingFactors.push('High willfulness score indicates knowing or reckless violation');
  }
  if (flags.some(f => (f.severity as string) === 'critical')) {
    supportingFactors.push('Critical severity violations present');
  }
  if (flags.filter(f => f.severity === 'high').length >= 3) {
    supportingFactors.push('Multiple high-severity violations suggest pattern');
  }

  // Risk factors
  if (avgWillfulness < 70) {
    riskFactors.push('Willfulness may be difficult to prove');
  }
  if (actual.total < 5000) {
    riskFactors.push('Limited actual damages may reduce punitive award');
  }

  // Calculate range
  const base = statutory.total.max + actual.total;
  const multiplier = jurisdictionData.punitiveMultiplier * multipliers.willfulness;

  return {
    eligible,
    willfulnessScore: avgWillfulness,
    estimatedRange: {
      min: eligible ? Math.round(base * 0.5) : 0,
      max: eligible ? Math.round(base * multiplier) : 0
    },
    multiplier,
    supportingFactors,
    riskFactors
  };
}

function calculateAttorneyFees(
  flags: (RuleFlag | AdvancedRuleFlag)[],
  statutory: StatutoryDamages,
  actual: ActualDamages,
  punitive: PunitiveDamages,
  jurisdictionData: JurisdictionData
): AttorneyFees {
  // Estimate hours based on complexity
  const baseHours = 20; // Simple case
  const complexityAddition = flags.length * 2 + (punitive.eligible ? 20 : 0);
  const estimatedHours = Math.min(baseHours + complexityAddition, 150);

  const minFees = estimatedHours * jurisdictionData.attorneyHourlyRate.min;
  const maxFees = estimatedHours * jurisdictionData.attorneyHourlyRate.max;

  return {
    estimatedHours,
    hourlyRate: jurisdictionData.attorneyHourlyRate,
    totalEstimate: { min: minFees, max: maxFees },
    contingencyAvailable: true, // FCRA cases often taken on contingency
    feeShiftingAvailable: true  // FCRA provides for fee shifting
  };
}

function calculateLitigationCosts(jurisdictionData: JurisdictionData): LitigationCosts {
  return {
    filingFees: jurisdictionData.filingFee,
    serviceCosts: 150,
    expertWitness: 5000,
    depositions: 3000,
    otherCosts: 500,
    total: jurisdictionData.filingFee + 150 + 5000 + 3000 + 500
  };
}

function calculateTotalDamages(
  statutory: StatutoryDamages,
  actual: ActualDamages,
  punitive: PunitiveDamages,
  attorneyFees: AttorneyFees,
  costs: LitigationCosts,
  multipliers: DamageMultipliers
): TotalDamages {
  // Conservative: minimum statutory + limited actual
  const conservative = statutory.total.min + Math.round(actual.total * 0.5);

  // Moderate: average statutory + actual + some punitive
  const moderate = Math.round((statutory.total.min + statutory.total.max) / 2) +
                   actual.total +
                   Math.round(punitive.estimatedRange.min * 0.5);

  // Aggressive: maximum statutory + actual + punitive + fees
  const aggressive = statutory.total.max +
                     actual.total +
                     punitive.estimatedRange.max +
                     attorneyFees.totalEstimate.max +
                     costs.total;

  // Expected: weighted average (30% conservative, 50% moderate, 20% aggressive)
  const expected = Math.round(conservative * 0.3 + moderate * 0.5 + aggressive * 0.2);

  // Confidence based on evidence strength
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  if (actual.evidenceStrength === 'strong' && punitive.willfulnessScore >= 70) {
    confidenceLevel = 'high';
  } else if (actual.evidenceStrength === 'weak') {
    confidenceLevel = 'low';
  }

  return {
    conservative,
    moderate,
    aggressive,
    expected,
    confidenceLevel
  };
}

function assessClassActionPotential(
  flags: (RuleFlag | AdvancedRuleFlag)[],
  patterns: DetectedPattern[]
): ClassActionAssessment {
  // Commonality - are the violations systematic?
  const systematicPatterns = patterns.filter(p =>
    p.pattern.damages.classActionPotential
  );
  const commonalityScore = Math.min(100, systematicPatterns.length * 25);

  // Typicality - are named plaintiff's claims typical?
  const typicalityScore = flags.length >= 3 ? 80 : flags.length >= 2 ? 60 : 40;

  // Adequacy - can named plaintiff adequately represent class?
  const adequacyScore = 70; // Assume adequate unless contrary evidence

  // Superiority - is class action superior to individual actions?
  const superiority = systematicPatterns.length >= 2;

  const potential = commonalityScore >= 50 && typicalityScore >= 60 && superiority;

  return {
    potential,
    estimatedClassSize: potential ? '1,000-10,000 consumers' : 'N/A',
    commonalityScore,
    typicalityScore,
    adequacyScore,
    superiority,
    estimatedClassRecovery: potential ? { min: 500000, max: 5000000 } : { min: 0, max: 0 },
    namedPlaintiffRecovery: potential ? { min: 10000, max: 50000 } : { min: 0, max: 0 }
  };
}

function projectSettlement(
  total: TotalDamages,
  flags: (RuleFlag | AdvancedRuleFlag)[],
  patterns: DetectedPattern[]
): SettlementProjection {
  // Pre-discovery: 20-40% of conservative estimate
  const preDiscovery = {
    min: Math.round(total.conservative * 0.2),
    max: Math.round(total.conservative * 0.4)
  };

  // Post-discovery: 40-70% of moderate estimate
  const postDiscovery = {
    min: Math.round(total.moderate * 0.4),
    max: Math.round(total.moderate * 0.7)
  };

  // Pre-trial: 60-90% of expected
  const preTrial = {
    min: Math.round(total.expected * 0.6),
    max: Math.round(total.expected * 0.9)
  };

  // Settlement likelihood
  const highSeverityCount = flags.filter(f => f.severity === 'high' || (f.severity as string) === 'critical').length;
  const settlementLikelihood = Math.min(95, 60 + highSeverityCount * 5);

  const medianSettlement = Math.round((postDiscovery.min + postDiscovery.max) / 2);

  return {
    preDiscovery,
    postDiscovery,
    preTrial,
    settlementLikelihood,
    medianSettlement
  };
}

function assessDamageRisk(
  flags: (RuleFlag | AdvancedRuleFlag)[],
  patterns: DetectedPattern[],
  actual: ActualDamages
): DamageRiskAssessment {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Calculate strength score
  let strengthScore = 50;

  // Strengths
  if (flags.filter(f => (f.severity as string) === 'critical').length > 0) {
    strengths.push('Critical severity violations present');
    strengthScore += 15;
  }
  if (patterns.length >= 2) {
    strengths.push('Multiple violation patterns detected');
    strengthScore += 10;
  }
  if (actual.evidenceStrength === 'strong') {
    strengths.push('Strong evidence of actual damages');
    strengthScore += 15;
  }
  if (flags.some(f => f.successProbability >= 90)) {
    strengths.push('High success probability violations');
    strengthScore += 10;
  }

  // Weaknesses
  if (actual.total < 1000) {
    weaknesses.push('Limited documented actual damages');
    strengthScore -= 10;
    recommendations.push('Document specific credit denials or financial harm');
  }
  if (flags.length < 2) {
    weaknesses.push('Single violation may limit recovery');
    strengthScore -= 5;
    recommendations.push('Review for additional violations');
  }
  if (actual.evidenceStrength === 'weak') {
    weaknesses.push('Weak evidentiary support');
    strengthScore -= 15;
    recommendations.push('Gather supporting documentation before proceeding');
  }

  // General recommendations
  if (strengthScore >= 70) {
    recommendations.push('Strong case - consider litigation');
  } else if (strengthScore >= 50) {
    recommendations.push('Moderate case - dispute process first, then evaluate');
  } else {
    recommendations.push('Weaker case - focus on dispute resolution');
  }

  return {
    strengthScore: Math.max(0, Math.min(100, strengthScore)),
    weaknesses,
    strengths,
    recommendations
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format damages for display
 */
export function formatDamagesReport(calc: DamagesCalculation): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('         DAMAGES CALCULATION REPORT');
  lines.push('═'.repeat(60));
  lines.push('');

  lines.push('─'.repeat(60));
  lines.push('STATUTORY DAMAGES');
  lines.push('─'.repeat(60));
  lines.push(`Violations: ${calc.statutory.violationCount}`);
  lines.push(`FCRA Statutory: $${calc.statutory.fcraStatutory.min.toLocaleString()} - $${calc.statutory.fcraStatutory.max.toLocaleString()}`);
  lines.push(`FDCPA Statutory: $${calc.statutory.fdcpaStatutory.min.toLocaleString()} - $${calc.statutory.fdcpaStatutory.max.toLocaleString()}`);
  lines.push(`Total Statutory: $${calc.statutory.total.min.toLocaleString()} - $${calc.statutory.total.max.toLocaleString()}`);
  lines.push('');

  lines.push('─'.repeat(60));
  lines.push('ACTUAL DAMAGES');
  lines.push('─'.repeat(60));
  lines.push(`Credit Denials: $${calc.actual.creditDenials.toLocaleString()}`);
  lines.push(`Higher Interest: $${calc.actual.higherInterestRates.toLocaleString()}`);
  lines.push(`Emotional Distress: $${calc.actual.emotionalDistress.toLocaleString()}`);
  lines.push(`Lost Employment: $${calc.actual.lostEmployment.toLocaleString()}`);
  lines.push(`Lost Housing: $${calc.actual.lostHousing.toLocaleString()}`);
  lines.push(`Out of Pocket: $${calc.actual.outOfPocket.toLocaleString()}`);
  lines.push(`Time Spent: $${calc.actual.timeSpent.toLocaleString()}`);
  lines.push(`TOTAL ACTUAL: $${calc.actual.total.toLocaleString()}`);
  lines.push(`Evidence Strength: ${calc.actual.evidenceStrength.toUpperCase()}`);
  lines.push('');

  if (calc.punitive.eligible) {
    lines.push('─'.repeat(60));
    lines.push('PUNITIVE DAMAGES');
    lines.push('─'.repeat(60));
    lines.push(`Eligible: YES`);
    lines.push(`Willfulness Score: ${calc.punitive.willfulnessScore.toFixed(0)}/100`);
    lines.push(`Estimated Range: $${calc.punitive.estimatedRange.min.toLocaleString()} - $${calc.punitive.estimatedRange.max.toLocaleString()}`);
    lines.push('');
  }

  lines.push('─'.repeat(60));
  lines.push('TOTAL DAMAGES ESTIMATE');
  lines.push('─'.repeat(60));
  lines.push(`Conservative: $${calc.total.conservative.toLocaleString()}`);
  lines.push(`Moderate: $${calc.total.moderate.toLocaleString()}`);
  lines.push(`Aggressive: $${calc.total.aggressive.toLocaleString()}`);
  lines.push(`EXPECTED: $${calc.total.expected.toLocaleString()}`);
  lines.push(`Confidence: ${calc.total.confidenceLevel.toUpperCase()}`);
  lines.push('');

  lines.push('─'.repeat(60));
  lines.push('SETTLEMENT PROJECTION');
  lines.push('─'.repeat(60));
  lines.push(`Pre-Discovery: $${calc.settlementProjection.preDiscovery.min.toLocaleString()} - $${calc.settlementProjection.preDiscovery.max.toLocaleString()}`);
  lines.push(`Post-Discovery: $${calc.settlementProjection.postDiscovery.min.toLocaleString()} - $${calc.settlementProjection.postDiscovery.max.toLocaleString()}`);
  lines.push(`Pre-Trial: $${calc.settlementProjection.preTrial.min.toLocaleString()} - $${calc.settlementProjection.preTrial.max.toLocaleString()}`);
  lines.push(`Settlement Likelihood: ${calc.settlementProjection.settlementLikelihood}%`);
  lines.push('');

  lines.push('─'.repeat(60));
  lines.push('RISK ASSESSMENT');
  lines.push('─'.repeat(60));
  lines.push(`Strength Score: ${calc.riskAssessment.strengthScore}/100`);
  lines.push('');
  lines.push('Strengths:');
  calc.riskAssessment.strengths.forEach(s => lines.push(`  + ${s}`));
  lines.push('');
  lines.push('Weaknesses:');
  calc.riskAssessment.weaknesses.forEach(w => lines.push(`  - ${w}`));
  lines.push('');
  lines.push('Recommendations:');
  calc.riskAssessment.recommendations.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));

  return lines.join('\n');
}

