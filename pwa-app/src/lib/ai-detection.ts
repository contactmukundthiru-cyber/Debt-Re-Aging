/**
 * AI-Powered Violation Detection System
 * Advanced pattern recognition and scoring for credit report analysis
 */

import { CreditFields, RuleFlag } from './rules';

/**
 * Parse a date string to Date object
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

export interface AIDetectionResult {
  confidence: number; // 0-100
  patterns: DetectedPattern[];
  riskFactors: RiskFactor[];
  recommendations: AIRecommendation[];
  overallAssessment: string;
  litigationScore: number;
}

export interface DetectedPattern {
  patternId: string;
  patternName: string;
  description: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidence: string[];
  legalBasis: string[];
}

export interface RiskFactor {
  factor: string;
  weight: number; // 0-1
  impact: 'positive' | 'negative';
  explanation: string;
}

export interface AIRecommendation {
  priority: 1 | 2 | 3;
  action: string;
  rationale: string;
  expectedOutcome: string;
}

/**
 * Pattern definitions for detection
 */
const VIOLATION_PATTERNS = {
  ZOMBIE_DEBT: {
    id: 'ZOMBIE_DEBT',
    name: 'Zombie Debt Pattern',
    description: 'Debt that should have fallen off credit report but continues to be reported',
    indicators: ['expired_sol', 'over_7_years', 'recently_updated'],
    severity: 'critical' as const,
    legalBasis: ['FCRA §605(a)', 'FCRA §605(c)'],
  },
  SYSTEMATIC_REAGING: {
    id: 'SYSTEMATIC_REAGING',
    name: 'Systematic Re-aging Pattern',
    description: 'Deliberate manipulation of dates to extend reporting period',
    indicators: ['dofd_after_open', 'shifting_dates', 'inconsistent_timeline'],
    severity: 'critical' as const,
    legalBasis: ['FCRA §605', 'FCRA §623(a)(1)', 'FDCPA §1692e'],
  },
  BALANCE_INFLATION: {
    id: 'BALANCE_INFLATION',
    name: 'Balance Inflation Pattern',
    description: 'Reported balance significantly exceeds original debt',
    indicators: ['balance_exceeds_original', 'unexplained_fees', 'interest_overcharge'],
    severity: 'high' as const,
    legalBasis: ['FCRA §607(b)', 'FDCPA §1692f(1)'],
  },
  PHANTOM_DEBT: {
    id: 'PHANTOM_DEBT',
    name: 'Phantom Debt Pattern',
    description: 'Debt reported without verifiable chain of ownership',
    indicators: ['missing_original_creditor', 'no_validation', 'multiple_collectors'],
    severity: 'high' as const,
    legalBasis: ['FDCPA §1692g', 'FCRA §623(a)(1)(A)'],
  },
  COLLECTION_STACKING: {
    id: 'COLLECTION_STACKING',
    name: 'Collection Stacking Pattern',
    description: 'Same debt reported multiple times by different collectors',
    indicators: ['duplicate_accounts', 'similar_amounts', 'same_original_creditor'],
    severity: 'high' as const,
    legalBasis: ['FCRA §611(a)', 'FDCPA §1692e(8)'],
  },
  STATUS_MANIPULATION: {
    id: 'STATUS_MANIPULATION',
    name: 'Status Manipulation Pattern',
    description: 'Account status does not match actual payment history',
    indicators: ['paid_but_delinquent', 'settled_but_open', 'status_contradiction'],
    severity: 'medium' as const,
    legalBasis: ['FCRA §607(b)', 'FCRA §623(a)(2)'],
  },
  STALE_REPORTING: {
    id: 'STALE_REPORTING',
    name: 'Stale Reporting Pattern',
    description: 'Information not updated despite changes in debt status',
    indicators: ['old_update_date', 'outdated_balance', 'no_recent_activity'],
    severity: 'medium' as const,
    legalBasis: ['FCRA §607(b)', 'FCRA §623(a)(2)'],
  },
};

/**
 * Run AI-powered violation detection
 */
export function runAIDetection(
  fields: Partial<CreditFields>,
  existingFlags: RuleFlag[]
): AIDetectionResult {
  const patterns: DetectedPattern[] = [];
  const riskFactors: RiskFactor[] = [];

  // Run all pattern detectors
  const zombieResult = detectZombieDebt(fields, existingFlags);
  if (zombieResult) patterns.push(zombieResult);

  const reagingResult = detectSystematicReaging(fields, existingFlags);
  if (reagingResult) patterns.push(reagingResult);

  const balanceResult = detectBalanceInflation(fields);
  if (balanceResult) patterns.push(balanceResult);

  const phantomResult = detectPhantomDebt(fields);
  if (phantomResult) patterns.push(phantomResult);

  const stackingResult = detectCollectionStacking(fields, existingFlags);
  if (stackingResult) patterns.push(stackingResult);

  const statusResult = detectStatusManipulation(fields, existingFlags);
  if (statusResult) patterns.push(statusResult);

  const staleResult = detectStaleReporting(fields);
  if (staleResult) patterns.push(staleResult);

  // Calculate risk factors
  riskFactors.push(...calculateRiskFactors(fields, patterns, existingFlags));

  // Calculate scores
  const confidence = calculateOverallConfidence(patterns);
  const litigationScore = calculateLitigationScore(patterns, riskFactors, existingFlags);

  // Generate recommendations
  const recommendations = generateRecommendations(patterns, litigationScore);

  // Generate assessment
  const overallAssessment = generateAssessment(patterns, litigationScore);

  return {
    confidence,
    patterns,
    riskFactors,
    recommendations,
    overallAssessment,
    litigationScore,
  };
}

/**
 * Detect Zombie Debt pattern
 */
function detectZombieDebt(
  fields: Partial<CreditFields>,
  flags: RuleFlag[]
): DetectedPattern | null {
  const evidence: string[] = [];
  let score = 0;

  // Check for K6 flag (over 7 years)
  if (flags.some(f => f.ruleId === 'K6')) {
    evidence.push('Account exceeds 7-year FCRA reporting limit');
    score += 40;
  }

  // Check DOFD age
  if (fields.dofd) {
    const dofdDate = parseDate(fields.dofd);
    if (dofdDate) {
      const daysSince = daysBetween(dofdDate, new Date());
      if (daysSince > 7 * 365) {
        evidence.push(`DOFD is ${Math.floor(daysSince / 365)} years old`);
        score += 30;
      } else if (daysSince > 6 * 365) {
        evidence.push('DOFD approaching 7-year limit');
        score += 15;
      }
    }
  }

  // Check for recent updates on old debt
  if (fields.dateReportedOrUpdated && fields.dofd) {
    const reportedDate = parseDate(fields.dateReportedOrUpdated);
    const dofdDate = parseDate(fields.dofd);
    if (reportedDate && dofdDate) {
      const debtAge = daysBetween(dofdDate, new Date());
      const updateAge = daysBetween(reportedDate, new Date());
      if (debtAge > 5 * 365 && updateAge < 30) {
        evidence.push('Old debt recently updated (potential re-aging)');
        score += 20;
      }
    }
  }

  if (score < 30) return null;

  return {
    patternId: VIOLATION_PATTERNS.ZOMBIE_DEBT.id,
    patternName: VIOLATION_PATTERNS.ZOMBIE_DEBT.name,
    description: VIOLATION_PATTERNS.ZOMBIE_DEBT.description,
    confidence: Math.min(100, score),
    severity: VIOLATION_PATTERNS.ZOMBIE_DEBT.severity,
    evidence,
    legalBasis: VIOLATION_PATTERNS.ZOMBIE_DEBT.legalBasis,
  };
}

/**
 * Detect Systematic Re-aging pattern
 */
function detectSystematicReaging(
  fields: Partial<CreditFields>,
  flags: RuleFlag[]
): DetectedPattern | null {
  const evidence: string[] = [];
  let score = 0;

  // Check for B1, B2, B3 flags
  const reagingFlags = flags.filter(f => ['B1', 'B2', 'B3'].includes(f.ruleId));
  if (reagingFlags.length > 0) {
    evidence.push(`${reagingFlags.length} date-related violations detected`);
    score += reagingFlags.length * 25;
  }

  // Check timeline consistency
  if (fields.dateOpened && fields.dofd) {
    const openDate = parseDate(fields.dateOpened);
    const dofdDate = parseDate(fields.dofd);
    if (openDate && dofdDate && dofdDate < openDate) {
      evidence.push('DOFD predates account opening (impossible)');
      score += 40;
    }
  }

  // Check for K7 flag
  if (flags.some(f => f.ruleId === 'K7')) {
    evidence.push('Estimated removal date calculation error detected');
    score += 20;
  }

  if (score < 25) return null;

  return {
    patternId: VIOLATION_PATTERNS.SYSTEMATIC_REAGING.id,
    patternName: VIOLATION_PATTERNS.SYSTEMATIC_REAGING.name,
    description: VIOLATION_PATTERNS.SYSTEMATIC_REAGING.description,
    confidence: Math.min(100, score),
    severity: VIOLATION_PATTERNS.SYSTEMATIC_REAGING.severity,
    evidence,
    legalBasis: VIOLATION_PATTERNS.SYSTEMATIC_REAGING.legalBasis,
  };
}

/**
 * Detect Balance Inflation pattern
 */
function detectBalanceInflation(fields: Partial<CreditFields>): DetectedPattern | null {
  const evidence: string[] = [];
  let score = 0;

  const currentBalance = parseFloat(String(fields.currentBalance).replace(/[^0-9.-]/g, '')) || 0;
  const originalAmount = parseFloat(String(fields.originalAmount).replace(/[^0-9.-]/g, '')) || 0;

  if (currentBalance > 0 && originalAmount > 0) {
    const inflation = ((currentBalance - originalAmount) / originalAmount) * 100;

    if (inflation > 100) {
      evidence.push(`Balance is ${inflation.toFixed(0)}% higher than original amount`);
      score += 40;
    } else if (inflation > 50) {
      evidence.push(`Balance is ${inflation.toFixed(0)}% higher than original amount`);
      score += 25;
    } else if (inflation > 25) {
      evidence.push(`Balance exceeds original by ${inflation.toFixed(0)}%`);
      score += 15;
    }
  }

  if (score < 25) return null;

  return {
    patternId: VIOLATION_PATTERNS.BALANCE_INFLATION.id,
    patternName: VIOLATION_PATTERNS.BALANCE_INFLATION.name,
    description: VIOLATION_PATTERNS.BALANCE_INFLATION.description,
    confidence: Math.min(100, score),
    severity: VIOLATION_PATTERNS.BALANCE_INFLATION.severity,
    evidence,
    legalBasis: VIOLATION_PATTERNS.BALANCE_INFLATION.legalBasis,
  };
}

/**
 * Detect Phantom Debt pattern
 */
function detectPhantomDebt(fields: Partial<CreditFields>): DetectedPattern | null {
  const evidence: string[] = [];
  let score = 0;

  // Check for missing original creditor with collection account
  if (fields.furnisherOrCollector && !fields.originalCreditor) {
    evidence.push('Collection account with no original creditor identified');
    score += 30;
  }

  // Check for vague account descriptions
  const accountType = (fields.accountType || '').toLowerCase();
  if (accountType.includes('collection') || accountType.includes('purchased')) {
    if (!fields.originalCreditor || fields.originalCreditor === 'Unknown') {
      evidence.push('Purchased debt without clear chain of title');
      score += 25;
    }
  }

  // Check for missing key dates
  if (!fields.dateOpened && !fields.dofd) {
    evidence.push('No account origination dates provided');
    score += 20;
  }

  if (score < 30) return null;

  return {
    patternId: VIOLATION_PATTERNS.PHANTOM_DEBT.id,
    patternName: VIOLATION_PATTERNS.PHANTOM_DEBT.name,
    description: VIOLATION_PATTERNS.PHANTOM_DEBT.description,
    confidence: Math.min(100, score),
    severity: VIOLATION_PATTERNS.PHANTOM_DEBT.severity,
    evidence,
    legalBasis: VIOLATION_PATTERNS.PHANTOM_DEBT.legalBasis,
  };
}

/**
 * Detect Collection Stacking pattern
 */
function detectCollectionStacking(
  fields: Partial<CreditFields>,
  flags: RuleFlag[]
): DetectedPattern | null {
  const evidence: string[] = [];
  let score = 0;

  // Check for duplicate account indicators
  if (flags.some(f => f.ruleId === 'E1')) {
    evidence.push('Account reported by multiple collectors');
    score += 35;
  }

  // Check account type
  const accountType = (fields.accountType || '').toLowerCase();
  if (accountType.includes('collection') && fields.originalCreditor) {
    evidence.push('Collection account - verify no duplicates on full report');
    score += 15;
  }

  if (score < 30) return null;

  return {
    patternId: VIOLATION_PATTERNS.COLLECTION_STACKING.id,
    patternName: VIOLATION_PATTERNS.COLLECTION_STACKING.name,
    description: VIOLATION_PATTERNS.COLLECTION_STACKING.description,
    confidence: Math.min(100, score),
    severity: VIOLATION_PATTERNS.COLLECTION_STACKING.severity,
    evidence,
    legalBasis: VIOLATION_PATTERNS.COLLECTION_STACKING.legalBasis,
  };
}

/**
 * Detect Status Manipulation pattern
 */
function detectStatusManipulation(
  fields: Partial<CreditFields>,
  flags: RuleFlag[]
): DetectedPattern | null {
  const evidence: string[] = [];
  let score = 0;

  // Check D1 flag
  if (flags.some(f => f.ruleId === 'D1')) {
    evidence.push('Balance reported on paid/closed account');
    score += 35;
  }

  // Check status vs balance
  const status = (fields.accountStatus || '').toLowerCase();
  const currentBalance = parseFloat(String(fields.currentBalance).replace(/[^0-9.-]/g, '')) || 0;

  if ((status.includes('paid') || status.includes('closed')) && currentBalance > 0) {
    evidence.push('Closed/paid status but balance still reported');
    score += 25;
  }

  if (score < 25) return null;

  return {
    patternId: VIOLATION_PATTERNS.STATUS_MANIPULATION.id,
    patternName: VIOLATION_PATTERNS.STATUS_MANIPULATION.name,
    description: VIOLATION_PATTERNS.STATUS_MANIPULATION.description,
    confidence: Math.min(100, score),
    severity: VIOLATION_PATTERNS.STATUS_MANIPULATION.severity,
    evidence,
    legalBasis: VIOLATION_PATTERNS.STATUS_MANIPULATION.legalBasis,
  };
}

/**
 * Detect Stale Reporting pattern
 */
function detectStaleReporting(fields: Partial<CreditFields>): DetectedPattern | null {
  const evidence: string[] = [];
  let score = 0;

  if (fields.dateReportedOrUpdated) {
    const reportedDate = parseDate(fields.dateReportedOrUpdated);
    if (reportedDate) {
      const daysSinceUpdate = daysBetween(reportedDate, new Date());
      if (daysSinceUpdate > 180) {
        evidence.push(`Account not updated in ${Math.floor(daysSinceUpdate / 30)} months`);
        score += 25;
      }
    }
  }

  if (fields.dateLastActivity) {
    const lastActivity = parseDate(fields.dateLastActivity);
    if (lastActivity) {
      const daysSinceActivity = daysBetween(lastActivity, new Date());
      if (daysSinceActivity > 365) {
        evidence.push('No account activity in over a year');
        score += 15;
      }
    }
  }

  if (score < 25) return null;

  return {
    patternId: VIOLATION_PATTERNS.STALE_REPORTING.id,
    patternName: VIOLATION_PATTERNS.STALE_REPORTING.name,
    description: VIOLATION_PATTERNS.STALE_REPORTING.description,
    confidence: Math.min(100, score),
    severity: VIOLATION_PATTERNS.STALE_REPORTING.severity,
    evidence,
    legalBasis: VIOLATION_PATTERNS.STALE_REPORTING.legalBasis,
  };
}

/**
 * Calculate risk factors
 */
function calculateRiskFactors(
  fields: Partial<CreditFields>,
  patterns: DetectedPattern[],
  flags: RuleFlag[]
): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Pattern count
  if (patterns.length >= 3) {
    factors.push({
      factor: 'Multiple violation patterns detected',
      weight: 0.9,
      impact: 'positive',
      explanation: `${patterns.length} distinct patterns increase case strength`,
    });
  }

  // Critical patterns
  const criticalPatterns = patterns.filter(p => p.severity === 'critical');
  if (criticalPatterns.length > 0) {
    factors.push({
      factor: 'Critical severity patterns',
      weight: 0.85,
      impact: 'positive',
      explanation: 'Critical violations support willful noncompliance claims',
    });
  }

  // High confidence findings
  const highConfidence = patterns.filter(p => p.confidence >= 70);
  if (highConfidence.length > 0) {
    factors.push({
      factor: 'High-confidence findings',
      weight: 0.8,
      impact: 'positive',
      explanation: `${highConfidence.length} findings with >70% confidence`,
    });
  }

  // Documentation quality
  if (fields.dofd && fields.dateOpened && fields.chargeOffDate) {
    factors.push({
      factor: 'Complete date documentation',
      weight: 0.7,
      impact: 'positive',
      explanation: 'All key dates available for timeline analysis',
    });
  } else {
    factors.push({
      factor: 'Incomplete documentation',
      weight: 0.3,
      impact: 'negative',
      explanation: 'Missing dates may weaken timeline arguments',
    });
  }

  // FCRA + FDCPA violations
  const hasFCRA = flags.some(f => f.legalCitations.some(c => c.includes('FCRA')));
  const hasFDCPA = flags.some(f => f.legalCitations.some(c => c.includes('FDCPA')));
  if (hasFCRA && hasFDCPA) {
    factors.push({
      factor: 'Multiple statute violations',
      weight: 0.75,
      impact: 'positive',
      explanation: 'Both FCRA and FDCPA claims available',
    });
  }

  return factors;
}

/**
 * Calculate overall confidence
 */
function calculateOverallConfidence(patterns: DetectedPattern[]): number {
  if (patterns.length === 0) return 0;

  const weights = patterns.map(p => {
    switch (p.severity) {
      case 'critical': return p.confidence * 1.5;
      case 'high': return p.confidence * 1.2;
      case 'medium': return p.confidence;
      case 'low': return p.confidence * 0.7;
    }
  });

  const weightedSum = weights.reduce((a, b) => a + b, 0);
  const maxPossible = patterns.length * 150; // max confidence with critical weight

  return Math.min(100, Math.round((weightedSum / maxPossible) * 100));
}

/**
 * Calculate litigation score
 */
function calculateLitigationScore(
  patterns: DetectedPattern[],
  riskFactors: RiskFactor[],
  flags: RuleFlag[]
): number {
  let score = 0;

  // Pattern contribution
  for (const pattern of patterns) {
    switch (pattern.severity) {
      case 'critical': score += 25; break;
      case 'high': score += 15; break;
      case 'medium': score += 8; break;
      case 'low': score += 3; break;
    }
  }

  // Risk factor contribution
  for (const factor of riskFactors) {
    if (factor.impact === 'positive') {
      score += factor.weight * 10;
    } else {
      score -= factor.weight * 5;
    }
  }

  // High-severity flag contribution
  const highFlags = flags.filter(f => f.severity === 'high');
  score += highFlags.length * 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  patterns: DetectedPattern[],
  litigationScore: number
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // Critical patterns need immediate action
  const criticalPatterns = patterns.filter(p => p.severity === 'critical');
  if (criticalPatterns.length > 0) {
    recommendations.push({
      priority: 1,
      action: 'File disputes with all three credit bureaus immediately',
      rationale: `Critical violations detected: ${criticalPatterns.map(p => p.patternName).join(', ')}`,
      expectedOutcome: 'Deletion or correction within 30-45 days',
    });
  }

  // High litigation score
  if (litigationScore >= 70) {
    recommendations.push({
      priority: 1,
      action: 'Consult with FCRA attorney for potential lawsuit',
      rationale: `Strong case with ${litigationScore}/100 litigation score`,
      expectedOutcome: 'Statutory damages $1000+ per violation possible',
    });
  }

  // Zombie debt
  if (patterns.some(p => p.patternId === 'ZOMBIE_DEBT')) {
    recommendations.push({
      priority: 1,
      action: 'Demand immediate deletion citing FCRA §605 violation',
      rationale: 'Debt exceeds legal reporting period',
      expectedOutcome: 'Complete removal from all credit reports',
    });
  }

  // Re-aging
  if (patterns.some(p => p.patternId === 'SYSTEMATIC_REAGING')) {
    recommendations.push({
      priority: 1,
      action: 'File CFPB complaint for willful re-aging',
      rationale: 'Systematic date manipulation detected',
      expectedOutcome: 'CFPB investigation and enforcement action',
    });
  }

  // General recommendations
  if (patterns.length > 0) {
    recommendations.push({
      priority: 2,
      action: 'Request full debt validation from furnisher',
      rationale: 'Establish paper trail for all claims',
      expectedOutcome: 'Documentation of furnisher violations',
    });

    recommendations.push({
      priority: 3,
      action: 'Document all findings in forensic report',
      rationale: 'Preserve evidence for potential litigation',
      expectedOutcome: 'Complete case file ready for legal action',
    });
  }

  return recommendations;
}

/**
 * Generate overall assessment
 */
function generateAssessment(patterns: DetectedPattern[], litigationScore: number): string {
  if (patterns.length === 0) {
    return 'No significant violation patterns detected. Continue monitoring for potential issues.';
  }

  const criticalCount = patterns.filter(p => p.severity === 'critical').length;
  const highCount = patterns.filter(p => p.severity === 'high').length;

  if (criticalCount >= 2 || litigationScore >= 80) {
    return `CRITICAL: ${criticalCount + highCount} serious violation patterns detected. Strong case for legal action with ${litigationScore}% litigation potential. Immediate dispute recommended.`;
  }

  if (criticalCount >= 1 || highCount >= 2) {
    return `HIGH PRIORITY: Significant violations detected including ${patterns.map(p => p.patternName).slice(0, 2).join(', ')}. Strong dispute potential with ${litigationScore}% case strength.`;
  }

  if (patterns.length >= 2) {
    return `MODERATE: Multiple patterns detected requiring attention. Dispute recommended with ${litigationScore}% estimated success rate.`;
  }

  return `${patterns[0].patternName} detected with ${patterns[0].confidence}% confidence. Further investigation recommended.`;
}

/**
 * Get pattern descriptions for UI
 */
export function getPatternDescriptions(): Record<string, { name: string; description: string }> {
  return Object.fromEntries(
    Object.entries(VIOLATION_PATTERNS).map(([id, pattern]) => [
      id,
      { name: pattern.name, description: pattern.description },
    ])
  );
}
