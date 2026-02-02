import { CreditFields, RuleFlag, RiskProfile } from './rules';

/**
 * Summary of multiple accounts for executive dashboard
 */
export interface ForensicSummary {
  totalAccounts: number;
  totalViolations: number;
  criticalAccounts: number;
  overallSeverityIndex: number;
  furnisherConcentration: Record<string, number>;
  violationBreakdown: Record<string, number>;
  discrepancies: MaterialDiscrepancy[];
  evidenceReadiness: number; // 0-100
}

/**
 * Discrepancy between accounts or bureaus
 */
export interface MaterialDiscrepancy {
  field: string;
  accounts: string[];
  values: string[];
  impact: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Timeline event for visualization
 */
export interface TimelineEvent {
  date: Date;
  label: string;
  type: 'account' | 'delinquency' | 'chargeoff' | 'payment' | 'removal' | 'violation';
  description: string;
  flagged?: boolean;
  tag?: string;
  evidenceSnippets?: string[];
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
 * Detailed forensic story of a violation for legal pleadings/disputes.
 */
export interface ForensicNarrative {
  overview: string;
  chronology: {
    event: string;
    date: string;
    evidence: string;
    implication: string;
  }[];
  statutoryConclusion: string;
  damagesTheory: string;
}

/**
 * Generate a forensic narrative for a specific account and its flags.
 */
export function generateForensicNarrative(fields: CreditFields, flags: RuleFlag[]): ForensicNarrative {
  const accountName = fields.originalCreditor || fields.furnisherOrCollector || 'this account';
  const dofd = fields.dofd || 'Unknown';
  const removal = fields.estimatedRemovalDate || 'Unknown';
  
  const highFlags = flags.filter(f => f.severity === 'high');
  const reagingFlags = flags.filter(f => ['B1', 'B2', 'B3', 'K6', 'Z1', 'R2'].includes(f.ruleId));

  const chronology: ForensicNarrative['chronology'] = [];

  // 1. Establish the Baseline
  if (fields.dofd) {
    chronology.push({
      date: fields.dofd,
      event: 'Commencement of Reporting Period (DOFD)',
      evidence: 'FCRA 605(c)',
      implication: `Pursuant to 15 U.S.C. § 1681c(c), this date anchors the 7-year clock.`
    });
  }

  // 2. Identify the Violation Point
  reagingFlags.forEach(flag => {
    chronology.push({
      date: 'DETECTED',
      event: `Pattern: ${flag.ruleName}`,
      evidence: flag.legalCitations.join(', '),
      implication: flag.whyItMatters
    });
  });

  // 3. The Result
  if (fields.estimatedRemovalDate) {
    chronology.push({
      date: fields.estimatedRemovalDate,
      event: 'Projected Illegal Reporting Limit',
      evidence: 'Forensic Audit Result',
      implication: `This date extends ${reagingFlags.length > 0 ? 'illegally' : 'potentially'} beyond the statutory limit.`
    });
  }

  const overview = `Forensic analysis of ${accountName} reveals a systemic violation of the Fair Credit Reporting Act. By manipulating core reporting dates, the furnisher has extended the legal visibility of this debt, causing ongoing consumer harm.`;

  const statutoryConclusion = `The reporting of this tradeline constitutes a ${highFlags.length > 0 ? 'willful' : 'negligent'} noncompliance with 15 U.S.C. § 1681i and § 1681s-2.`;

  const damagesTheory = `The illegal re-aging of this debt causes concrete injury in the form of depressed credit scoring, increased insurance premiums, and lost credit opportunities.`;

  return {
    overview,
    chronology,
    statutoryConclusion,
    damagesTheory
  };
}

/**
 * Generate an executive summary across all analyzed accounts
 */
export function generateExecutiveSummary(accounts: { fields: CreditFields; flags: RuleFlag[]; risk: RiskProfile }[]): ForensicSummary {
  const summary: ForensicSummary = {
    totalAccounts: accounts.length,
    totalViolations: accounts.reduce((sum, acc) => sum + acc.flags.length, 0),
    criticalAccounts: accounts.filter(acc => acc.risk.riskLevel === 'critical' || acc.risk.riskLevel === 'high').length,
    overallSeverityIndex: accounts.reduce((sum, acc) => sum + acc.flags.reduce((count, f) => count + (f.severity === 'high' ? 100 : f.severity === 'medium' ? 50 : 10), 0), 0),
    furnisherConcentration: {},
    violationBreakdown: {},
    discrepancies: [],
    evidenceReadiness: 0
  };

  accounts.forEach(acc => {
    const furnisher = acc.fields.furnisherOrCollector || 'Unknown';
    summary.furnisherConcentration[furnisher] = (summary.furnisherConcentration[furnisher] || 0) + 1;

    acc.flags.forEach(flag => {
      summary.violationBreakdown[flag.ruleName] = (summary.violationBreakdown[flag.ruleName] || 0) + 1;
    });
  });

  // Material Discrepancy Detection (Self-Reconciliation)
  const fieldsToCompare: (keyof CreditFields)[] = ['dofd', 'originalAmount', 'currentValue'];
  fieldsToCompare.forEach(field => {
    const valueMap: Record<string, string[]> = {};
    accounts.forEach(acc => {
      const val = acc.fields[field];
      if (val) {
        const key = acc.fields.originalCreditor || acc.fields.furnisherOrCollector || 'shared';
        if (!valueMap[key]) valueMap[key] = [];
        valueMap[key].push(val as string);
      }
    });

    Object.entries(valueMap).forEach(([key, values]) => {
      const uniqueValues = Array.from(new Set(values));
      if (uniqueValues.length > 1) {
        summary.discrepancies.push({
          field: field.toString(),
          accounts: [key],
          values: uniqueValues,
          impact: 'high',
          description: `Conflicting ${field} reported for account ${key}: values ${uniqueValues.join(', ')}. Violates the "Maximum Possible Accuracy" requirement of FCRA §607(b).`
        });
      }
    });
  });

  // Evidence readiness: higher when violations have evidence, fields are complete, and discrepancies are documented
  const totalFlags = summary.totalViolations;
  const withEvidence = accounts.reduce((sum, acc) => sum + acc.flags.filter(f => (f.fieldValues?.dofd || f.fieldValues?.currentValue || f.fieldValues?.dateOpened)).length, 0);
  const fieldCompleteness = accounts.reduce((s, acc) => {
    const f = acc.fields;
    const filled = [f.dofd, f.dateOpened, f.originalCreditor, f.furnisherOrCollector, f.currentValue, f.accountStatus].filter(Boolean).length;
    return s + (filled / 6) * 100;
  }, 0) / Math.max(1, accounts.length);
  summary.evidenceReadiness = totalFlags === 0
    ? Math.round(Math.min(100, fieldCompleteness * 0.5))
    : Math.round(Math.min(100, (withEvidence / Math.max(1, totalFlags)) * 45 + (fieldCompleteness / 100) * 35 + (summary.discrepancies.length > 0 ? 20 : 0)));
  return summary;
}

/**
 * Build a timeline from credit report fields
 */
export function buildTimeline(fields: CreditFields, flags: RuleFlag[], rawText?: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const violationDates = new Set(flags.map(f => f.fieldValues.dofd || f.fieldValues.dateOpened));

  const parseDate = (str: string | undefined): Date | null => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const extractSnippet = (value?: string) => {
    if (!rawText || !value) return null;
    const haystack = rawText.toLowerCase();
    const needle = value.toLowerCase();
    const idx = haystack.indexOf(needle);
    if (idx === -1) return null;
    const start = Math.max(0, idx - 40);
    const end = Math.min(rawText.length, idx + needle.length + 40);
    return rawText.slice(start, end).replace(/\s+/g, ' ').trim();
  };

  const dateOpened = parseDate(fields.dateOpened);
  const dofd = parseDate(fields.dofd);
  const chargeOff = parseDate(fields.chargeOffDate);
  const lastPayment = parseDate(fields.dateLastPayment);
  const removal = parseDate(fields.estimatedRemovalDate);

  if (dateOpened) {
    const isCollection = (fields.accountType || '').toLowerCase().includes('collection') || 
                       (fields.accountStatus || '').toLowerCase().includes('collection');
    
    events.push({
      date: dateOpened,
      label: isCollection ? 'Collector Assignment' : 'Account Opened',
      type: 'account',
      description: isCollection 
        ? `Account assigned to ${fields.furnisherOrCollector || 'collector'} (from ${fields.originalCreditor || 'original creditor'})`
        : `Account opened with ${fields.originalCreditor || 'creditor'}`,
      flagged: flags.some(f => (f.ruleId === 'E1' || f.ruleId === 'Z1') && f.fieldValues.field === 'dateOpened'),
      evidenceSnippets: flags
        .filter(f => f.fieldValues.field === 'dateOpened')
        .map(f => f.explanation)
        .slice(0, 2)
        .concat(extractSnippet(fields.dateOpened) ? [extractSnippet(fields.dateOpened)!] : [])
    });
  }

  if (lastPayment) {
    events.push({
      date: lastPayment,
      label: 'Last Payment',
      type: 'payment',
      description: 'Last recorded payment on account',
      flagged: flags.some(f => f.fieldValues.field === 'dateLastPayment'),
      evidenceSnippets: flags
        .filter(f => f.fieldValues.field === 'dateLastPayment')
        .map(f => f.explanation)
        .slice(0, 2)
        .concat(extractSnippet(fields.dateLastPayment) ? [extractSnippet(fields.dateLastPayment)!] : [])
    });
  }

  if (dofd) {
    events.push({
      date: dofd,
      label: 'Date of First Delinquency',
      type: 'delinquency',
      description: 'Account became 30+ days delinquent',
      flagged: flags.some(f => ['B1', 'B2', 'B3', 'E1'].includes(f.ruleId) && f.fieldValues.dofd),
      evidenceSnippets: flags
        .filter(f => ['B1', 'B2', 'B3', 'E1'].includes(f.ruleId))
        .map(f => f.explanation)
        .slice(0, 3)
        .concat(extractSnippet(fields.dofd) ? [extractSnippet(fields.dofd)!] : [])
    });
  }

  if (chargeOff) {
    events.push({
      date: chargeOff,
      label: 'Charge-Off',
      type: 'chargeoff',
      description: 'Account charged off by creditor',
      flagged: flags.some(f => f.ruleId === 'B3'),
      evidenceSnippets: flags
        .filter(f => f.ruleId === 'B3')
        .map(f => f.explanation)
        .slice(0, 2)
        .concat(extractSnippet(fields.chargeOffDate) ? [extractSnippet(fields.chargeOffDate)!] : [])
    });
  }

  if (removal) {
    events.push({
      date: removal,
      label: 'Est. Removal Date',
      type: 'removal',
      description: 'Expected removal from credit report',
      flagged: flags.some(f => f.ruleId === 'B2' || f.ruleId === 'K6'),
      evidenceSnippets: flags
        .filter(f => f.ruleId === 'B2' || f.ruleId === 'K6')
        .map(f => f.explanation)
        .slice(0, 2)
        .concat(extractSnippet(fields.estimatedRemovalDate) ? [extractSnippet(fields.estimatedRemovalDate)!] : [])
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
  const timelineViolations = flags.filter(f => ['B1', 'B2', 'B3', 'E1', 'K6', 'Z1', 'R2'].includes(f.ruleId));
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
  const dataViolations = flags.filter(f => ['D1', 'L1', 'M1', 'M2', 'M3', 'A1', 'C2'].includes(f.ruleId));
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
  const financialViolations = flags.filter(f => ['K1', 'K7', 'DU1', 'CB1', 'CB2'].includes(f.ruleId));
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
  const regulatoryViolations = flags.filter(f => ['H1', 'H2', 'H3', 'S1', 'S2', 'R1', 'C1'].includes(f.ruleId));
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
  const current = parseFloat((fields.currentValue || '0').replace(/[$,]/g, ''));
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

  // When no patterns match, provide a baseline recommendation
  if (insights.length === 0 && flags.length > 0) {
    insights.push({
      pattern: 'Violations Require Documentation',
      significance: 'medium',
      description: `${flags.length} violation(s) detected. Document dates, balances, and correspondence for each.`,
      recommendation: 'Request a copy of your full file from each bureau. Send targeted dispute letters citing specific FCRA sections.'
    });
  }
  if (insights.length === 0 && flags.length === 0 && (fields.dofd || fields.dateOpened)) {
    insights.push({
      pattern: 'No Violations Detected',
      significance: 'low',
      description: 'No rule violations were flagged for this account based on the data provided.',
      recommendation: 'Keep copies of all reports and correspondence. Re-run analysis if you receive updated data or additional accounts.'
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
      reason: 'Violations may support lawsuit for actual and statutory liability'
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
  const current = parseFloat((fields.currentValue || '0').replace(/[$,]/g, ''));
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
