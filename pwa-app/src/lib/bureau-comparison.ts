/**
 * Multi-Bureau Comparison Feature
 * Compares credit report data across Equifax, Experian, and TransUnion
 */

import { CreditFields } from './rules';

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

export type BureauName = 'equifax' | 'experian' | 'transunion';

export interface BureauReport {
  bureau: BureauName;
  fields: Partial<CreditFields>;
  rawText?: string;
  extractedAt: Date;
}

export interface FieldDiscrepancy {
  fieldName: keyof CreditFields;
  fieldLabel: string;
  values: Record<BureauName, string | number | undefined>;
  discrepancyType: 'missing' | 'mismatch' | 'date_variance' | 'amount_variance';
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  legalImplication: string;
  suggestedAction: string;
}

export interface BureauComparison {
  accountIdentifier: string;
  bureausCompared: BureauName[];
  totalDiscrepancies: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  discrepancies: FieldDiscrepancy[];
  consistentFields: (keyof CreditFields)[];
  missingBureaus: BureauName[];
  overallConsistencyScore: number;
  recommendation: string;
}

/**
 * Critical fields to compare across bureaus
 */
const COMPARISON_FIELDS: Array<{
  key: keyof CreditFields;
  label: string;
  type: 'date' | 'amount' | 'string';
  importance: 'critical' | 'important' | 'minor';
}> = [
  { key: 'dofd', label: 'Date of First Delinquency', type: 'date', importance: 'critical' },
  { key: 'dateOpened', label: 'Date Opened', type: 'date', importance: 'critical' },
  { key: 'chargeOffDate', label: 'Charge-Off Date', type: 'date', importance: 'critical' },
  { key: 'dateLastPayment', label: 'Last Payment Date', type: 'date', importance: 'important' },
  { key: 'dateReportedOrUpdated', label: 'Date Reported', type: 'date', importance: 'important' },
  { key: 'currentBalance', label: 'Current Balance', type: 'amount', importance: 'critical' },
  { key: 'originalAmount', label: 'Original Amount', type: 'amount', importance: 'important' },
  { key: 'accountStatus', label: 'Account Status', type: 'string', importance: 'critical' },
  { key: 'accountType', label: 'Account Type', type: 'string', importance: 'important' },
  { key: 'originalCreditor', label: 'Original Creditor', type: 'string', importance: 'important' },
  { key: 'furnisherOrCollector', label: 'Furnisher/Collector', type: 'string', importance: 'important' },
];

/**
 * Compare reports across multiple bureaus
 */
export function compareBureauReports(reports: BureauReport[]): BureauComparison {
  if (reports.length === 0) {
    return createEmptyComparison();
  }

  const bureausCompared = reports.map(r => r.bureau);
  const allBureaus: BureauName[] = ['equifax', 'experian', 'transunion'];
  const missingBureaus = allBureaus.filter(b => !bureausCompared.includes(b));

  const discrepancies: FieldDiscrepancy[] = [];
  const consistentFields: (keyof CreditFields)[] = [];

  // Compare each field
  for (const fieldConfig of COMPARISON_FIELDS) {
    const fieldValues: Record<BureauName, string | number | undefined> = {
      equifax: undefined,
      experian: undefined,
      transunion: undefined,
    };

    for (const report of reports) {
      const value = report.fields[fieldConfig.key];
      fieldValues[report.bureau] = value;
    }

    const discrepancy = analyzeFieldDiscrepancy(fieldConfig, fieldValues, bureausCompared);

    if (discrepancy) {
      discrepancies.push(discrepancy);
    } else {
      // Field is consistent across all bureaus that have it
      const presentValues = Object.values(fieldValues).filter(v => v !== undefined);
      if (presentValues.length > 1) {
        consistentFields.push(fieldConfig.key);
      }
    }
  }

  // Calculate severity counts
  const highSeverity = discrepancies.filter(d => d.severity === 'high').length;
  const mediumSeverity = discrepancies.filter(d => d.severity === 'medium').length;
  const lowSeverity = discrepancies.filter(d => d.severity === 'low').length;

  // Calculate consistency score
  const totalFields = COMPARISON_FIELDS.length;
  const discrepantFields = discrepancies.length;
  const overallConsistencyScore = Math.round(((totalFields - discrepantFields) / totalFields) * 100);

  // Generate recommendation
  const recommendation = generateRecommendation(discrepancies, overallConsistencyScore, missingBureaus);

  // Create account identifier
  const firstReport = reports[0];
  const accountIdentifier =
    firstReport.fields.furnisherOrCollector ||
    firstReport.fields.originalCreditor ||
    'Unknown Account';

  return {
    accountIdentifier,
    bureausCompared,
    totalDiscrepancies: discrepancies.length,
    highSeverity,
    mediumSeverity,
    lowSeverity,
    discrepancies,
    consistentFields,
    missingBureaus,
    overallConsistencyScore,
    recommendation,
  };
}

/**
 * Analyze discrepancy for a single field
 */
function analyzeFieldDiscrepancy(
  fieldConfig: typeof COMPARISON_FIELDS[number],
  values: Record<BureauName, string | number | undefined>,
  bureausCompared: BureauName[]
): FieldDiscrepancy | null {
  const presentValues = bureausCompared
    .map(b => ({ bureau: b, value: values[b] }))
    .filter(v => v.value !== undefined);

  // If only one or zero values, no discrepancy to detect
  if (presentValues.length <= 1) {
    return null;
  }

  // Check for discrepancy based on field type
  if (fieldConfig.type === 'date') {
    return analyzeDateDiscrepancy(fieldConfig, values, presentValues);
  } else if (fieldConfig.type === 'amount') {
    return analyzeAmountDiscrepancy(fieldConfig, values, presentValues);
  } else {
    return analyzeStringDiscrepancy(fieldConfig, values, presentValues);
  }
}

/**
 * Analyze date field discrepancies
 */
function analyzeDateDiscrepancy(
  fieldConfig: typeof COMPARISON_FIELDS[number],
  values: Record<BureauName, string | number | undefined>,
  presentValues: Array<{ bureau: BureauName; value: string | number | undefined }>
): FieldDiscrepancy | null {
  const dates = presentValues.map(v => ({
    bureau: v.bureau,
    date: parseDate(String(v.value)),
  })).filter(d => d.date !== null);

  if (dates.length <= 1) return null;

  // Find max variance in days
  let maxVariance = 0;
  for (let i = 0; i < dates.length; i++) {
    for (let j = i + 1; j < dates.length; j++) {
      const variance = Math.abs(daysBetween(dates[i].date!, dates[j].date!));
      if (variance > maxVariance) {
        maxVariance = variance;
      }
    }
  }

  // Determine if variance is significant
  if (maxVariance <= 1) return null; // 1 day variance is acceptable

  const severity = getSeverityForDateVariance(maxVariance, fieldConfig.importance);

  return {
    fieldName: fieldConfig.key,
    fieldLabel: fieldConfig.label,
    values,
    discrepancyType: 'date_variance',
    severity,
    explanation: `Date differs by ${maxVariance} days across bureaus`,
    legalImplication: getLegalImplication(fieldConfig.key, 'date_variance', maxVariance),
    suggestedAction: getSuggestedAction(fieldConfig.key, 'date_variance'),
  };
}

/**
 * Analyze amount field discrepancies
 */
function analyzeAmountDiscrepancy(
  fieldConfig: typeof COMPARISON_FIELDS[number],
  values: Record<BureauName, string | number | undefined>,
  presentValues: Array<{ bureau: BureauName; value: string | number | undefined }>
): FieldDiscrepancy | null {
  const amounts = presentValues.map(v => ({
    bureau: v.bureau,
    amount: parseFloat(String(v.value).replace(/[^0-9.-]/g, '')) || 0,
  }));

  if (amounts.length <= 1) return null;

  const maxAmount = Math.max(...amounts.map(a => a.amount));
  const minAmount = Math.min(...amounts.map(a => a.amount));
  const variance = maxAmount - minAmount;
  const variancePercent = maxAmount > 0 ? (variance / maxAmount) * 100 : 0;

  // Allow 1% variance for rounding
  if (variancePercent <= 1 && variance < 1) return null;

  const severity = getSeverityForAmountVariance(variancePercent, fieldConfig.importance);

  return {
    fieldName: fieldConfig.key,
    fieldLabel: fieldConfig.label,
    values,
    discrepancyType: 'amount_variance',
    severity,
    explanation: `Amount differs by $${variance.toFixed(2)} (${variancePercent.toFixed(1)}%) across bureaus`,
    legalImplication: getLegalImplication(fieldConfig.key, 'amount_variance', variance),
    suggestedAction: getSuggestedAction(fieldConfig.key, 'amount_variance'),
  };
}

/**
 * Analyze string field discrepancies
 */
function analyzeStringDiscrepancy(
  fieldConfig: typeof COMPARISON_FIELDS[number],
  values: Record<BureauName, string | number | undefined>,
  presentValues: Array<{ bureau: BureauName; value: string | number | undefined }>
): FieldDiscrepancy | null {
  const normalizedValues = presentValues.map(v => ({
    bureau: v.bureau,
    value: normalizeString(String(v.value)),
  }));

  const uniqueValues = new Set(normalizedValues.map(v => v.value));

  if (uniqueValues.size <= 1) return null;

  const severity = fieldConfig.importance === 'critical' ? 'high' :
                   fieldConfig.importance === 'important' ? 'medium' : 'low';

  return {
    fieldName: fieldConfig.key,
    fieldLabel: fieldConfig.label,
    values,
    discrepancyType: 'mismatch',
    severity,
    explanation: `Value differs across bureaus: ${Array.from(uniqueValues).join(' vs ')}`,
    legalImplication: getLegalImplication(fieldConfig.key, 'mismatch', null),
    suggestedAction: getSuggestedAction(fieldConfig.key, 'mismatch'),
  };
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Get severity for date variance
 */
function getSeverityForDateVariance(
  days: number,
  importance: 'critical' | 'important' | 'minor'
): 'high' | 'medium' | 'low' {
  if (importance === 'critical') {
    if (days >= 30) return 'high';
    if (days >= 7) return 'medium';
    return 'low';
  } else if (importance === 'important') {
    if (days >= 90) return 'high';
    if (days >= 30) return 'medium';
    return 'low';
  }
  return days >= 180 ? 'medium' : 'low';
}

/**
 * Get severity for amount variance
 */
function getSeverityForAmountVariance(
  percent: number,
  importance: 'critical' | 'important' | 'minor'
): 'high' | 'medium' | 'low' {
  if (importance === 'critical') {
    if (percent >= 10) return 'high';
    if (percent >= 5) return 'medium';
    return 'low';
  } else if (importance === 'important') {
    if (percent >= 25) return 'high';
    if (percent >= 10) return 'medium';
    return 'low';
  }
  return percent >= 50 ? 'medium' : 'low';
}

/**
 * Get legal implication for discrepancy
 */
function getLegalImplication(
  fieldName: keyof CreditFields,
  discrepancyType: string,
  value: number | null
): string {
  const implications: Record<string, string> = {
    dofd: 'DOFD discrepancy may indicate illegal debt re-aging (FCRA §605 violation). All bureaus must report the same DOFD.',
    dateOpened: 'Date opened variance suggests furnisher is providing inconsistent data to bureaus.',
    chargeOffDate: 'Charge-off date discrepancy affects 7-year reporting period calculation.',
    currentBalance: 'Balance discrepancy indicates potential FCRA §607 accuracy violation.',
    paymentStatus: 'Payment status mismatch is a reportable inaccuracy under FCRA.',
    accountStatus: 'Account status discrepancy requires investigation and correction.',
    originalCreditor: 'Original creditor mismatch may indicate improper debt assignment.',
  };

  return implications[fieldName] ||
    `Discrepancy in ${fieldName} may indicate FCRA accuracy violation requiring investigation.`;
}

/**
 * Get suggested action for discrepancy
 */
function getSuggestedAction(
  fieldName: keyof CreditFields,
  _discrepancyType: string
): string {
  const actions: Record<string, string> = {
    dofd: 'Dispute with all bureaus citing DOFD discrepancy. Request furnisher provide original creditor records.',
    dateOpened: 'Request account opening documentation from furnisher.',
    chargeOffDate: 'Dispute charge-off date with all bureaus. Request charge-off notice.',
    currentBalance: 'Dispute balance discrepancy. Request itemized statement.',
    paymentStatus: 'Dispute status code with all bureaus showing different values.',
    accountStatus: 'Dispute account status inconsistency across bureaus.',
    originalCreditor: 'Request chain of title documentation.',
  };

  return actions[fieldName] ||
    `File dispute with bureaus showing incorrect ${fieldName}. Request documentation.`;
}

/**
 * Generate overall recommendation
 */
function generateRecommendation(
  discrepancies: FieldDiscrepancy[],
  consistencyScore: number,
  missingBureaus: BureauName[]
): string {
  const highSeverity = discrepancies.filter(d => d.severity === 'high').length;

  if (missingBureaus.length > 0) {
    return `Missing data from ${missingBureaus.join(', ')}. Obtain full tri-merge report for complete comparison.`;
  }

  if (highSeverity >= 3) {
    return 'CRITICAL: Multiple high-severity discrepancies detected. File disputes with all three bureaus immediately citing inconsistent reporting as evidence of inaccuracy.';
  }

  if (highSeverity >= 1) {
    return `High-severity discrepancies found. Prioritize disputing ${discrepancies.filter(d => d.severity === 'high').map(d => d.fieldLabel).join(', ')}.`;
  }

  if (consistencyScore >= 90) {
    return 'Reports are largely consistent. Focus disputes on any identified discrepancies.';
  }

  if (consistencyScore >= 70) {
    return 'Moderate discrepancies detected. File coordinated disputes with all bureaus.';
  }

  return 'Significant reporting inconsistencies. Consider sending debt validation to furnisher.';
}

/**
 * Create empty comparison result
 */
function createEmptyComparison(): BureauComparison {
  return {
    accountIdentifier: 'No Data',
    bureausCompared: [],
    totalDiscrepancies: 0,
    highSeverity: 0,
    mediumSeverity: 0,
    lowSeverity: 0,
    discrepancies: [],
    consistentFields: [],
    missingBureaus: ['equifax', 'experian', 'transunion'],
    overallConsistencyScore: 0,
    recommendation: 'No bureau reports provided for comparison.',
  };
}

/**
 * Format comparison for display
 */
export function formatBureauComparison(comparison: BureauComparison): string {
  const lines = [
    `=== Bureau Comparison Report ===`,
    `Account: ${comparison.accountIdentifier}`,
    `Bureaus Compared: ${comparison.bureausCompared.join(', ')}`,
    `Consistency Score: ${comparison.overallConsistencyScore}%`,
    ``,
    `Discrepancies: ${comparison.totalDiscrepancies}`,
    `  High Severity: ${comparison.highSeverity}`,
    `  Medium Severity: ${comparison.mediumSeverity}`,
    `  Low Severity: ${comparison.lowSeverity}`,
    ``,
    `Recommendation: ${comparison.recommendation}`,
  ];

  if (comparison.discrepancies.length > 0) {
    lines.push('', '--- Discrepancy Details ---');
    for (const d of comparison.discrepancies) {
      lines.push(`[${d.severity.toUpperCase()}] ${d.fieldLabel}: ${d.explanation}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate dispute letter for bureau discrepancies
 */
export function generateDiscrepancyDisputeLetter(
  comparison: BureauComparison,
  targetBureau: BureauName,
  consumerName: string,
  consumerAddress: string
): string {
  const today = new Date().toISOString().split('T')[0];

  const bureauAddresses: Record<BureauName, string> = {
    equifax: 'Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374',
    experian: 'Experian\nP.O. Box 4500\nAllen, TX 75013',
    transunion: 'TransUnion LLC\nP.O. Box 2000\nChester, PA 19016',
  };

  const discrepancyList = comparison.discrepancies
    .map(d => `• ${d.fieldLabel}: ${d.explanation}\n  Legal Basis: ${d.legalImplication}`)
    .join('\n\n');

  return `${consumerName}
${consumerAddress}

${today}

${bureauAddresses[targetBureau]}

RE: DISPUTE OF INACCURATE INFORMATION - MULTI-BUREAU DISCREPANCY
Account: ${comparison.accountIdentifier}

SENT VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED

Dear Sir/Madam:

I am writing to dispute inaccurate information on my credit report pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681i.

Upon obtaining my credit reports from all three major bureaus, I discovered significant DISCREPANCIES in how the above-referenced account is being reported. These inconsistencies prove that the information is inaccurate and must be corrected or deleted.

DOCUMENTED DISCREPANCIES:

${discrepancyList}

LEGAL BASIS:

Under FCRA § 607(b), consumer reporting agencies must follow reasonable procedures to assure maximum possible accuracy. The fact that this same account is reported differently across bureaus is prima facie evidence of inaccuracy.

Under FCRA § 611(a), you must conduct a reasonable investigation within 30 days and modify or delete information that cannot be verified.

I DEMAND THE FOLLOWING:

1. Conduct a thorough investigation of these discrepancies
2. Contact the furnisher to reconcile the inconsistent reporting
3. Correct all inaccurate information to match verifiable records
4. If accuracy cannot be verified, DELETE the entire tradeline
5. Provide me with written results and updated credit report

Enclosed please find copies of my credit reports from other bureaus showing the discrepancies.

Failure to comply within 30 days will result in complaints to the CFPB and potential litigation.

Sincerely,

${consumerName}

Enclosures: Comparative credit report excerpts
`;
}
