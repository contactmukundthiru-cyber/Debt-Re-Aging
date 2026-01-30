/**
 * Bureau Comparison Tool
 * Compare accounts across Experian, Equifax, and TransUnion
 */

import { CreditFields, RuleFlag, runRules } from './rules';

export interface BureauReport {
  bureau: 'experian' | 'equifax' | 'transunion';
  reportDate: string;
  accounts: BureauAccount[];
}

export interface BureauAccount {
  id: string;
  creditorName: string;
  accountNumber?: string;
  fields: CreditFields;
  rawText?: string;
}

export interface ComparisonResult {
  accountId: string;
  creditorName: string;
  bureaus: {
    experian?: BureauAccount;
    equifax?: BureauAccount;
    transunion?: BureauAccount;
  };
  discrepancies: Discrepancy[];
  flags: {
    experian?: RuleFlag[];
    equifax?: RuleFlag[];
    transunion?: RuleFlag[];
  };
  overallRisk: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface Discrepancy {
  field: string;
  fieldLabel: string;
  values: {
    experian?: string;
    equifax?: string;
    transunion?: string;
  };
  severity: 'critical' | 'significant' | 'minor';
  explanation: string;
  disputeRecommendation: string;
}

export interface BureauSummary {
  accountsMatched: number;
  accountsOnlyOnOne: number;
  totalDiscrepancies: number;
  criticalDiscrepancies: number;
  worstBureau: 'experian' | 'equifax' | 'transunion' | null;
  bestBureau: 'experian' | 'equifax' | 'transunion' | null;
  recommendations: string[];
}

const FIELD_LABELS: Record<string, string> = {
  dofd: 'Date of First Delinquency',
  dateOpened: 'Date Opened',
  chargeOffDate: 'Charge-Off Date',
  currentValue: 'Current Balance',
  originalAmount: 'Original Amount',
  accountStatus: 'Account Status',
  paymentHistory: 'Payment History',
  estimatedRemovalDate: 'Estimated Removal Date',
  dateLastPayment: 'Last Payment Date',
  furnisherOrCollector: 'Current Furnisher'
};

/**
 * Compare accounts across bureaus
 */
export function compareAccounts(
  experianAccounts: BureauAccount[],
  equifaxAccounts: BureauAccount[],
  transunionAccounts: BureauAccount[]
): ComparisonResult[] {
  const results: ComparisonResult[] = [];

  // Create a map of all unique accounts by creditor name
  const accountMap = new Map<string, ComparisonResult>();

  // Helper function to get or create a comparison result
  const getOrCreateComparison = (key: string, creditorName: string): ComparisonResult => {
    let result = accountMap.get(key);
    if (!result) {
      result = createEmptyComparison(creditorName);
      accountMap.set(key, result);
    }
    return result;
  };

  // Process Experian accounts
  experianAccounts.forEach(acc => {
    const key = normalizeCreditorName(acc.creditorName);
    const result = getOrCreateComparison(key, acc.creditorName);
    result.bureaus.experian = acc;
    result.flags.experian = runRules(acc.fields);
  });

  // Process Equifax accounts
  equifaxAccounts.forEach(acc => {
    const key = normalizeCreditorName(acc.creditorName);
    const result = getOrCreateComparison(key, acc.creditorName);
    result.bureaus.equifax = acc;
    result.flags.equifax = runRules(acc.fields);
  });

  // Process TransUnion accounts
  transunionAccounts.forEach(acc => {
    const key = normalizeCreditorName(acc.creditorName);
    const result = getOrCreateComparison(key, acc.creditorName);
    result.bureaus.transunion = acc;
    result.flags.transunion = runRules(acc.fields);
  });

  // Analyze discrepancies for each account
  accountMap.forEach((result, key) => {
    result.discrepancies = findDiscrepancies(result.bureaus);
    result.overallRisk = calculateOverallRisk(result);
    result.recommendation = generateRecommendation(result);
    result.accountId = key;
    results.push(result);
  });

  return results.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return riskOrder[a.overallRisk] - riskOrder[b.overallRisk];
  });
}

/**
 * Create empty comparison result
 */
function createEmptyComparison(creditorName: string): ComparisonResult {
  return {
    accountId: '',
    creditorName,
    bureaus: {},
    discrepancies: [],
    flags: {},
    overallRisk: 'low',
    recommendation: ''
  };
}

/**
 * Normalize creditor name for matching
 */
function normalizeCreditorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/llc|inc|corp|ltd|collection|collections|assoc|associates/g, '')
    .trim();
}

/**
 * Find discrepancies between bureau reports
 */
function findDiscrepancies(bureaus: ComparisonResult['bureaus']): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];
  const fieldsToCompare: (keyof CreditFields)[] = [
    'dofd', 'dateOpened', 'chargeOffDate', 'currentValue',
    'originalAmount', 'accountStatus', 'estimatedRemovalDate',
    'dateLastPayment'
  ];

  fieldsToCompare.forEach(field => {
    const values: Discrepancy['values'] = {};
    let hasValue = false;

    if (bureaus.experian?.fields[field]) {
      values.experian = String(bureaus.experian.fields[field]);
      hasValue = true;
    }
    if (bureaus.equifax?.fields[field]) {
      values.equifax = String(bureaus.equifax.fields[field]);
      hasValue = true;
    }
    if (bureaus.transunion?.fields[field]) {
      values.transunion = String(bureaus.transunion.fields[field]);
      hasValue = true;
    }

    if (!hasValue) return;

    // Check for discrepancies
    const uniqueValues = new Set(Object.values(values).filter(v => v));
    if (uniqueValues.size > 1) {
      discrepancies.push(createDiscrepancy(field, values));
    }
  });

  return discrepancies;
}

/**
 * Create discrepancy record
 */
function createDiscrepancy(field: string, values: Discrepancy['values']): Discrepancy {
  const fieldLabel = FIELD_LABELS[field] || field;
  let severity: Discrepancy['severity'] = 'minor';
  let explanation = '';
  let recommendation = '';

  // DOFD discrepancies are critical
  if (field === 'dofd') {
    severity = 'critical';
    explanation = 'Different DOFD across bureaus indicates potential re-aging or data corruption. The 7-year clock should be consistent.';
    recommendation = 'Dispute with all bureaus requesting correction to the earliest DOFD. This is a serious violation if intentional.';
  }
  // Removal date discrepancies
  else if (field === 'estimatedRemovalDate') {
    severity = 'critical';
    explanation = 'Inconsistent removal dates suggest incorrect DOFD calculations or improper reporting practices.';
    recommendation = 'Dispute to ensure removal date is 7 years + 180 days from the earliest DOFD across all bureaus.';
  }
  // Balance discrepancies
  else if (field === 'currentValue') {
    const amounts = Object.values(values).filter(v => v).map(v => parseFloat(v!.replace(/[$,]/g, '')));
    const diff = Math.max(...amounts) - Math.min(...amounts);
    if (diff > 500) {
      severity = 'significant';
      explanation = `Balance differs by $${diff.toFixed(2)} across bureaus. This could indicate unauthorized fees or interest.`;
      recommendation = 'Demand itemized accounting from furnisher. Dispute higher balances as inaccurate.';
    } else {
      severity = 'minor';
      explanation = 'Minor value discrepancy, possibly due to different reporting dates.';
      recommendation = 'Document for completeness; may not require immediate action.';
    }
  }
  // Status discrepancies
  else if (field === 'accountStatus') {
    severity = 'significant';
    explanation = 'Account shows different status across bureaus. Status should be consistent.';
    recommendation = 'Dispute incorrect statuses. If paid/closed, all bureaus should reflect that.';
  }
  // Date discrepancies
  else if (field.toLowerCase().includes('date')) {
    severity = 'significant';
    explanation = `${fieldLabel} varies across bureaus, which may affect reporting accuracy.`;
    recommendation = 'Request furnisher verify and correct dates on all bureau reports.';
  }
  else {
    explanation = `${fieldLabel} shows inconsistent values across credit bureaus.`;
    recommendation = 'Include in dispute letter requesting consistency across all bureaus.';
  }

  return {
    field,
    fieldLabel,
    values,
    severity,
    explanation,
    disputeRecommendation: recommendation
  };
}

/**
 * Calculate overall risk for account
 */
function calculateOverallRisk(result: ComparisonResult): 'high' | 'medium' | 'low' {
  // Critical discrepancies = high risk
  if (result.discrepancies.some(d => d.severity === 'critical')) {
    return 'high';
  }

  // Multiple significant discrepancies = high risk
  const significantCount = result.discrepancies.filter(d => d.severity === 'significant').length;
  if (significantCount >= 2) {
    return 'high';
  }

  // High severity violations on any bureau = high risk
  const allFlags = [
    ...(result.flags.experian || []),
    ...(result.flags.equifax || []),
    ...(result.flags.transunion || [])
  ];
  if (allFlags.some(f => f.severity === 'high')) {
    return 'high';
  }

  // Any significant discrepancy or medium violations = medium risk
  if (significantCount >= 1 || allFlags.some(f => f.severity === 'medium')) {
    return 'medium';
  }

  return 'low';
}

/**
 * Generate recommendation based on comparison
 */
function generateRecommendation(result: ComparisonResult): string {
  const bureauCount = Object.keys(result.bureaus).length;
  const criticalDiscrepancies = result.discrepancies.filter(d => d.severity === 'critical');

  if (bureauCount === 1) {
    return 'Account only appears on one bureau. Verify if it should appear on others or request deletion from reporting bureau.';
  }

  if (criticalDiscrepancies.length > 0) {
    return `URGENT: ${criticalDiscrepancies.length} critical discrepancy(ies) found. ` +
           `File disputes with all bureaus immediately citing inconsistent reporting. ` +
           `This pattern may indicate willful FCRA violations.`;
  }

  if (result.overallRisk === 'high') {
    return 'Multiple issues detected. Send comprehensive dispute to all three bureaus. ' +
           'Consider CFPB complaint if discrepancies are not resolved within 30 days.';
  }

  if (result.overallRisk === 'medium') {
    return 'Discrepancies found that should be addressed. Send dispute letters requesting ' +
           'consistency across all bureaus. Document all differences for your records.';
  }

  return 'Account appears consistent across bureaus with no significant discrepancies.';
}

/**
 * Generate bureau summary
 */
export function generateBureauSummary(comparisons: ComparisonResult[]): BureauSummary {
  const matchedAccounts = comparisons.filter(c =>
    Object.keys(c.bureaus).length >= 2
  ).length;

  const singleBureauAccounts = comparisons.filter(c =>
    Object.keys(c.bureaus).length === 1
  ).length;

  const totalDiscrepancies = comparisons.reduce((sum, c) =>
    sum + c.discrepancies.length, 0
  );

  const criticalDiscrepancies = comparisons.reduce((sum, c) =>
    sum + c.discrepancies.filter(d => d.severity === 'critical').length, 0
  );

  // Find worst and best bureaus
  const bureauViolations = {
    experian: 0,
    equifax: 0,
    transunion: 0
  };

  comparisons.forEach(c => {
    if (c.flags.experian) bureauViolations.experian += c.flags.experian.filter(f => f.severity === 'high').length;
    if (c.flags.equifax) bureauViolations.equifax += c.flags.equifax.filter(f => f.severity === 'high').length;
    if (c.flags.transunion) bureauViolations.transunion += c.flags.transunion.filter(f => f.severity === 'high').length;
  });

  const maxViolations = Math.max(...Object.values(bureauViolations));
  const minViolations = Math.min(...Object.values(bureauViolations));

  let worstBureau: 'experian' | 'equifax' | 'transunion' | null = null;
  let bestBureau: 'experian' | 'equifax' | 'transunion' | null = null;

  if (maxViolations > 0) {
    worstBureau = Object.entries(bureauViolations).find(([, v]) => v === maxViolations)?.[0] as any;
  }
  if (maxViolations !== minViolations) {
    bestBureau = Object.entries(bureauViolations).find(([, v]) => v === minViolations)?.[0] as any;
  }

  const recommendations: string[] = [];

  if (criticalDiscrepancies > 0) {
    recommendations.push(`URGENT: ${criticalDiscrepancies} critical discrepancy(ies) require immediate dispute action.`);
  }

  if (singleBureauAccounts > 0) {
    recommendations.push(`${singleBureauAccounts} account(s) appear on only one bureau - investigate if they should be on others.`);
  }

  if (worstBureau && maxViolations > 2) {
    recommendations.push(`${worstBureau.charAt(0).toUpperCase() + worstBureau.slice(1)} shows the most violations - prioritize disputes there.`);
  }

  if (totalDiscrepancies > 5) {
    recommendations.push('High number of discrepancies suggests systemic reporting issues. Consider CFPB complaint.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Bureau reports appear relatively consistent. Continue monitoring for changes.');
  }

  return {
    accountsMatched: matchedAccounts,
    accountsOnlyOnOne: singleBureauAccounts,
    totalDiscrepancies,
    criticalDiscrepancies,
    worstBureau,
    bestBureau,
    recommendations
  };
}

/**
 * Format comparison report
 */
export function formatComparisonReport(
  comparisons: ComparisonResult[],
  summary: BureauSummary
): string {
  const lines: string[] = [];

  lines.push('═'.repeat(70));
  lines.push('        CROSS-BUREAU COMPARISON REPORT');
  lines.push('═'.repeat(70));
  lines.push('');
  lines.push('SUMMARY:');
  lines.push(`  Accounts matched across bureaus: ${summary.accountsMatched}`);
  lines.push(`  Accounts on single bureau only: ${summary.accountsOnlyOnOne}`);
  lines.push(`  Total discrepancies found: ${summary.totalDiscrepancies}`);
  lines.push(`  Critical discrepancies: ${summary.criticalDiscrepancies}`);
  if (summary.worstBureau) {
    lines.push(`  Bureau with most issues: ${summary.worstBureau.toUpperCase()}`);
  }
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('RECOMMENDATIONS:');
  lines.push('─'.repeat(70));
  summary.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });
  lines.push('');

  comparisons.forEach((comp, index) => {
    lines.push('─'.repeat(70));
    lines.push(`ACCOUNT ${index + 1}: ${comp.creditorName}`);
    lines.push(`Risk Level: ${comp.overallRisk.toUpperCase()}`);
    lines.push(`Appears on: ${Object.keys(comp.bureaus).map(b => b.toUpperCase()).join(', ')}`);
    lines.push('─'.repeat(70));

    if (comp.discrepancies.length > 0) {
      lines.push('\nDISCREPANCIES:');
      comp.discrepancies.forEach(d => {
        lines.push(`\n  ${d.fieldLabel} [${d.severity.toUpperCase()}]`);
        if (d.values.experian) lines.push(`    Experian: ${d.values.experian}`);
        if (d.values.equifax) lines.push(`    Equifax: ${d.values.equifax}`);
        if (d.values.transunion) lines.push(`    TransUnion: ${d.values.transunion}`);
        lines.push(`    → ${d.disputeRecommendation}`);
      });
    } else {
      lines.push('\n  No discrepancies found for this account.');
    }

    lines.push(`\nRECOMMENDATION: ${comp.recommendation}`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Export comparison data as CSV
 */
export function exportComparisonCSV(comparisons: ComparisonResult[]): string {
  const headers = [
    'Account', 'Field', 'Experian', 'Equifax', 'TransUnion',
    'Discrepancy Severity', 'Recommendation'
  ];

  const rows: string[][] = [headers];

  comparisons.forEach(comp => {
    comp.discrepancies.forEach(d => {
      rows.push([
        comp.creditorName,
        d.fieldLabel,
        d.values.experian || 'N/A',
        d.values.equifax || 'N/A',
        d.values.transunion || 'N/A',
        d.severity,
        d.disputeRecommendation.substring(0, 100)
      ]);
    });
  });

  return rows.map(row =>
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}
