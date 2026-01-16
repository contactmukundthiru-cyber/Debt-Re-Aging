import { CreditFields, RuleFlag, RiskProfile } from './rules';

/**
 * Timeline event for visualization
 */
export interface TimelineEvent {
  date: Date;
  label: string;
  type: 'account' | 'delinquency' | 'chargeoff' | 'payment' | 'removal' | 'violation';
  description: string;
  flagged?: boolean;
}

/**
 * Score breakdown for detailed analysis
 */
export interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  factors: string[];
}

/**
 * Pattern analysis result
 */
export interface PatternInsight {
  pattern: string;
  significance: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

/**
 * Build a timeline from credit report fields
 */
export function buildTimeline(fields: CreditFields, flags: RuleFlag[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const violationDates = new Set(flags.map(f => f.fieldValues.dofd || f.fieldValues.dateOpened));

  const parseDate = (str: string | undefined): Date | null => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const dateOpened = parseDate(fields.dateOpened);
  const dofd = parseDate(fields.dofd);
  const chargeOff = parseDate(fields.chargeOffDate);
  const lastPayment = parseDate(fields.dateLastPayment);
  const removal = parseDate(fields.estimatedRemovalDate);

  if (dateOpened) {
    events.push({
      date: dateOpened,
      label: 'Account Opened',
      type: 'account',
      description: `Account opened with ${fields.originalCreditor || 'creditor'}`,
      flagged: flags.some(f => f.ruleId === 'E1' && f.fieldValues.field === 'dateOpened')
    });
  }

  if (lastPayment) {
    events.push({
      date: lastPayment,
      label: 'Last Payment',
      type: 'payment',
      description: 'Last recorded payment on account',
      flagged: false
    });
  }

  if (dofd) {
    events.push({
      date: dofd,
      label: 'Date of First Delinquency',
      type: 'delinquency',
      description: 'Account became 30+ days delinquent',
      flagged: flags.some(f => ['B1', 'B2', 'B3', 'E1'].includes(f.ruleId) && f.fieldValues.dofd)
    });
  }

  if (chargeOff) {
    events.push({
      date: chargeOff,
      label: 'Charge-Off',
      type: 'chargeoff',
      description: 'Account charged off by creditor',
      flagged: flags.some(f => f.ruleId === 'B3')
    });
  }

  if (removal) {
    events.push({
      date: removal,
      label: 'Est. Removal Date',
      type: 'removal',
      description: 'Expected removal from credit report',
      flagged: flags.some(f => f.ruleId === 'B2' || f.ruleId === 'K6')
    });
  }

  // Add violation markers
  flags.forEach(flag => {
    if (flag.severity === 'high') {
      events.push({
        date: new Date(),
        label: `Violation: ${flag.ruleId}`,
        type: 'violation',
        description: flag.explanation.substring(0, 80) + '...',
        flagged: true
      });
    }
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate detailed score breakdown
 */
export function calculateScoreBreakdown(flags: RuleFlag[], fields: CreditFields): ScoreBreakdown[] {
  const breakdown: ScoreBreakdown[] = [];

  // Timeline Integrity
  const timelineViolations = flags.filter(f => ['B1', 'B2', 'B3', 'E1'].includes(f.ruleId));
  const timelineScore = Math.max(0, 25 - (timelineViolations.length * 8));
  breakdown.push({
    category: 'Timeline Integrity',
    score: timelineScore,
    maxScore: 25,
    factors: timelineViolations.length > 0
      ? timelineViolations.map(f => f.ruleName)
      : ['No timeline inconsistencies detected']
  });

  // Data Accuracy
  const dataViolations = flags.filter(f => ['D1', 'L1', 'M1', 'M2'].includes(f.ruleId));
  const dataScore = Math.max(0, 25 - (dataViolations.length * 6));
  breakdown.push({
    category: 'Data Accuracy',
    score: dataScore,
    maxScore: 25,
    factors: dataViolations.length > 0
      ? dataViolations.map(f => f.ruleName)
      : ['No data inconsistencies detected']
  });

  // Financial Compliance
  const financialViolations = flags.filter(f => ['K1', 'K6', 'K7'].includes(f.ruleId));
  const financialScore = Math.max(0, 25 - (financialViolations.length * 7));
  breakdown.push({
    category: 'Financial Compliance',
    score: financialScore,
    maxScore: 25,
    factors: financialViolations.length > 0
      ? financialViolations.map(f => f.ruleName)
      : ['No financial violations detected']
  });

  // Regulatory Compliance
  const regulatoryViolations = flags.filter(f => ['H1', 'H2', 'H3', 'S1'].includes(f.ruleId));
  const regulatoryScore = Math.max(0, 25 - (regulatoryViolations.length * 5));
  breakdown.push({
    category: 'Regulatory Compliance',
    score: regulatoryScore,
    maxScore: 25,
    factors: regulatoryViolations.length > 0
      ? regulatoryViolations.map(f => f.ruleName)
      : ['No regulatory issues detected']
  });

  return breakdown;
}

/**
 * Detect patterns and generate insights
 */
export function detectPatterns(flags: RuleFlag[], fields: CreditFields): PatternInsight[] {
  const insights: PatternInsight[] = [];

  // Multiple high-severity violations
  const highSeverity = flags.filter(f => f.severity === 'high');
  if (highSeverity.length >= 2) {
    insights.push({
      pattern: 'Multiple High-Severity Violations',
      significance: 'high',
      description: `${highSeverity.length} high-severity violations detected indicate systemic reporting issues.`,
      recommendation: 'Consider filing a CFPB complaint in addition to direct disputes.'
    });
  }

  // Re-aging pattern
  const reagingFlags = flags.filter(f => ['B1', 'B2', 'B3', 'K6'].includes(f.ruleId));
  if (reagingFlags.length >= 2) {
    insights.push({
      pattern: 'Potential Debt Re-Aging',
      significance: 'high',
      description: 'Multiple timeline violations suggest intentional date manipulation to extend reporting period.',
      recommendation: 'Document all original dates and request complete account history from furnisher.'
    });
  }

  // Zombie debt pattern
  if (flags.some(f => f.ruleId === 'K6') && flags.some(f => f.ruleId === 'S1')) {
    insights.push({
      pattern: 'Zombie Debt Collection',
      significance: 'high',
      description: 'Account appears to be time-barred and beyond reporting period but still being reported.',
      recommendation: 'Send cease and desist letter. This debt cannot legally be collected or reported.'
    });
  }

  // Collector misconduct
  if (flags.some(f => ['D1', 'M2'].includes(f.ruleId)) && fields.furnisherOrCollector?.toLowerCase().includes('collection')) {
    insights.push({
      pattern: 'Collection Agency Misconduct',
      significance: 'high',
      description: 'Debt collector is reporting inaccurate status or balance information.',
      recommendation: 'Send debt validation letter. Consider FDCPA lawsuit for willful violations.'
    });
  }

  // Interest/fee padding
  const current = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
  const original = parseFloat((fields.originalAmount || '0').replace(/[$,]/g, ''));
  if (current > original * 1.5 && flags.some(f => f.ruleId === 'K7')) {
    insights.push({
      pattern: 'Excessive Interest/Fee Accumulation',
      significance: 'medium',
      description: `Balance has grown ${((current/original - 1) * 100).toFixed(0)}% beyond original amount.`,
      recommendation: 'Demand itemized breakdown of all fees and interest. Challenge any unauthorized charges.'
    });
  }

  // Medical debt protections
  if ((fields.accountType || '').toLowerCase().includes('medical')) {
    insights.push({
      pattern: 'Medical Debt Protections Apply',
      significance: 'medium',
      description: 'Medical debts have enhanced protections under FCRA and many state laws.',
      recommendation: 'Verify insurance was properly billed. Request itemized medical bills. Check for billing errors.'
    });
  }

  // Missing critical information
  if (!fields.dofd && (fields.accountType || '').toLowerCase().includes('collection')) {
    insights.push({
      pattern: 'Missing Required Information',
      significance: 'medium',
      description: 'DOFD is required for all negative accounts but is not reported.',
      recommendation: 'Dispute for incomplete information. Furnisher must provide or delete the account.'
    });
  }

  return insights;
}

/**
 * Generate action items based on analysis
 */
export function generateActionItems(
  flags: RuleFlag[],
  riskProfile: RiskProfile,
  fields: CreditFields
): { priority: 'immediate' | 'standard' | 'optional'; action: string; reason: string }[] {
  const items: { priority: 'immediate' | 'standard' | 'optional'; action: string; reason: string }[] = [];

  if (flags.some(f => f.severity === 'high')) {
    items.push({
      priority: 'immediate',
      action: 'Send dispute letter to all three credit bureaus',
      reason: 'High-severity violations require immediate action within 30 days'
    });
  }

  if (flags.some(f => ['D1', 'M2', 'K1'].includes(f.ruleId))) {
    items.push({
      priority: 'immediate',
      action: 'Send debt validation letter to furnisher',
      reason: 'Demand verification of reported balance and account status'
    });
  }

  if (riskProfile.litigationPotential) {
    items.push({
      priority: 'standard',
      action: 'Consult with FCRA/FDCPA attorney',
      reason: 'Violations may support lawsuit for actual and statutory damages'
    });
  }

  if (flags.some(f => f.ruleId === 'S1')) {
    items.push({
      priority: 'standard',
      action: 'Research state statute of limitations',
      reason: 'Debt may be legally unenforceable in your state'
    });
  }

  if (flags.length >= 3) {
    items.push({
      priority: 'standard',
      action: 'File CFPB complaint',
      reason: 'Multiple violations warrant regulatory attention'
    });
  }

  items.push({
    priority: 'optional',
    action: 'Request complete account history from original creditor',
    reason: 'Original records may reveal additional discrepancies'
  });

  items.push({
    priority: 'optional',
    action: 'Monitor credit reports monthly for 90 days',
    reason: 'Ensure disputed items are corrected and not re-reported'
  });

  return items;
}

/**
 * Calculate forensic metrics
 */
export function calculateForensicMetrics(fields: CreditFields, flags: RuleFlag[]) {
  const metrics: Record<string, { value: string | number; status: 'normal' | 'warning' | 'critical' }> = {};

  // Balance-to-original ratio
  const current = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
  const original = parseFloat((fields.originalAmount || '0').replace(/[$,]/g, ''));
  if (original > 0) {
    const ratio = current / original;
    metrics['Balance Ratio'] = {
      value: `${(ratio * 100).toFixed(0)}%`,
      status: ratio > 2 ? 'critical' : ratio > 1.5 ? 'warning' : 'normal'
    };
  }

  // Days since DOFD
  if (fields.dofd) {
    const dofd = new Date(fields.dofd);
    const days = Math.floor((Date.now() - dofd.getTime()) / (1000 * 60 * 60 * 24));
    const years = (days / 365).toFixed(1);
    metrics['Time Since Delinquency'] = {
      value: `${years} years`,
      status: days > 2555 ? 'critical' : days > 2190 ? 'warning' : 'normal' // 7 years, 6 years
    };
  }

  // Violation density
  const violationDensity = flags.length;
  metrics['Violation Count'] = {
    value: violationDensity,
    status: violationDensity >= 3 ? 'critical' : violationDensity >= 1 ? 'warning' : 'normal'
  };

  // High severity count
  const highCount = flags.filter(f => f.severity === 'high').length;
  metrics['High Severity Issues'] = {
    value: highCount,
    status: highCount >= 2 ? 'critical' : highCount === 1 ? 'warning' : 'normal'
  };

  return metrics;
}
