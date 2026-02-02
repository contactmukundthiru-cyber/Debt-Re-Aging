/**
 * Multi-Bureau Comparison Engine
 * Compares credit report data across Equifax, Experian, and TransUnion
 * to detect discrepancies and potential violations
 */

import { CreditFields } from './types';
import { runAdvancedRules } from './rules-advanced';

export type BureauName = 'Equifax' | 'Experian' | 'TransUnion';


export interface BureauData {
    bureau: BureauName;
    fields: Partial<CreditFields>;
    rawText: string;
    uploadDate: string;
}

export interface FieldDiscrepancy {
    fieldKey: keyof CreditFields;
    fieldLabel: string;
    values: Record<BureauName, string | undefined>;
    discrepancyType: 'missing' | 'conflicting' | 'inconsistent';
    severity: 'critical' | 'high' | 'medium' | 'low';
    potentialViolation: string | null;
    recommendation: string;
}

export interface BureauComparisonResult {
    bureausCompared: BureauName[];
    totalDiscrepancies: number;
    criticalDiscrepancies: number;
    fieldDiscrepancies: FieldDiscrepancy[];
    summary: string;
    violationOpportunities: string[];
    matchedFields: string[];
    timestamp: string;
}

// Field importance for discrepancy severity
const CRITICAL_FIELDS: (keyof CreditFields)[] = [
    'dofd',
    'currentValue',
    'chargeOffDate',
    'accountStatus',
    'dateOpened'
];

const HIGH_IMPORTANCE_FIELDS: (keyof CreditFields)[] = [
    'dateLastPayment',
    'paymentHistory',
    'creditLimit',
    'dateReportedOrUpdated',
    'estimatedRemovalDate',
    'initialValue'
];

const FIELD_LABELS: Record<string, string> = {
    dofd: 'Date of First Delinquency',
    currentValue: 'Current Balance',
    initialValue: 'Original Balance',
    paymentHistory: 'Payment History',
    chargeOffDate: 'Charge-Off Date',
    dateOpened: 'Date Opened',
    dateLastPayment: 'Date of Last Payment',
    accountStatus: 'Account Status',
    creditLimit: 'Credit Limit',
    dateReportedOrUpdated: 'Date Reported/Updated',
    estimatedRemovalDate: 'Estimated Removal Date',
    furnisherOrCollector: 'Furnisher/Collector',
    originalCreditor: 'Original Creditor',
    accountType: 'Account Type'
};

/**
 * Compare data across multiple bureaus
 */
export function compareMultipleBureaus(bureauData: BureauData[]): BureauComparisonResult {
    const bureausCompared = bureauData.map(b => b.bureau);
    const discrepancies: FieldDiscrepancy[] = [];
    const matchedFields: string[] = [];
    const violationOpportunities: string[] = [];

    // Get all unique field keys across all bureaus
    const allFieldKeys = new Set<keyof CreditFields>();
    bureauData.forEach(b => {
        Object.keys(b.fields).forEach(key => allFieldKeys.add(key as keyof CreditFields));
    });

    // Compare each field across bureaus
    allFieldKeys.forEach(fieldKey => {
        const values: Record<BureauName, string | undefined> = {
            'Equifax': undefined,
            'Experian': undefined,
            'TransUnion': undefined
        };

        bureauData.forEach(b => {
            values[b.bureau] = b.fields[fieldKey] as string | undefined;
        });

        const definedValues = Object.values(values).filter(v => v !== undefined && v !== '');
        const uniqueValues = new Set(definedValues);

        // Check for discrepancies
        if (bureausCompared.length > 1) {
            const presentBureaus = bureausCompared.filter(b => values[b] !== undefined && values[b] !== '');
            const missingBureaus = bureausCompared.filter(b => values[b] === undefined || values[b] === '');

            if (missingBureaus.length > 0 && presentBureaus.length > 0) {
                // Field is missing from some bureaus
                const discrepancy = createDiscrepancy(fieldKey, values, 'missing', missingBureaus);
                discrepancies.push(discrepancy);
                
                // Selective Reporting Violation detection
                if (missingBureaus.length > 0 && presentBureaus.length > 0) {
                    const opportunity = `Selective Reporting: ${FIELD_LABELS[fieldKey] || fieldKey} is reported to ${presentBureaus.join(' & ')} but withheld from ${missingBureaus.join(' & ')}. This may indicate a failure to maintain accurate records across all CRAs.`;
                    if (!violationOpportunities.includes(opportunity)) {
                        violationOpportunities.push(opportunity);
                    }
                }
            } else if (uniqueValues.size > 1) {
                // Conflicting values across bureaus
                const discrepancy = createDiscrepancy(fieldKey, values, 'conflicting', []);
                discrepancies.push(discrepancy);
                
                // Integrate with Advanced Rules for per-se violations
                if (discrepancy.severity === 'critical' || discrepancy.severity === 'high') {
                    const bureauComparison = bureauData.map(bd => ({
                        bureau: bd.bureau,
                        fields: bd.fields as CreditFields
                    }));

                    const xbFlags = runAdvancedRules(bureauComparison[0].fields, {
                        crossBureauData: bureauComparison
                    }).filter(f => f.ruleId.startsWith('XB') || f.ruleId === 'ZD3');

                    xbFlags.forEach(f => {
                        const opportunity = `${f.ruleName}: ${f.explanation}`;
                        if (!violationOpportunities.includes(opportunity)) {
                            violationOpportunities.push(opportunity);
                        }
                    });
                }
            } else if (uniqueValues.size === 1 && definedValues.length === bureausCompared.length) {

                // All bureaus match
                matchedFields.push(FIELD_LABELS[fieldKey as string] || fieldKey as string);
            }
        }
    });

    // Generate violation opportunities based on discrepancies
    discrepancies.forEach(d => {
        if (d.potentialViolation) {
            violationOpportunities.push(d.potentialViolation);
        }
    });

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    discrepancies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;

    return {
        bureausCompared,
        totalDiscrepancies: discrepancies.length,
        criticalDiscrepancies: criticalCount,
        fieldDiscrepancies: discrepancies,
        summary: generateComparisonSummary(discrepancies, bureausCompared),
        violationOpportunities,
        matchedFields,
        timestamp: new Date().toISOString()
    };
}

function createDiscrepancy(
    fieldKey: keyof CreditFields,
    values: Record<BureauName, string | undefined>,
    type: 'missing' | 'conflicting' | 'inconsistent',
    missingBureaus: BureauName[]
): FieldDiscrepancy {
    const isCritical = CRITICAL_FIELDS.includes(fieldKey);
    const isHighImportance = HIGH_IMPORTANCE_FIELDS.includes(fieldKey);

    let severity: FieldDiscrepancy['severity'] = 'low';
    if (isCritical) severity = type === 'conflicting' ? 'critical' : 'high';
    else if (isHighImportance) severity = 'medium';

    let potentialViolation: string | null = null;
    let recommendation = '';

    if (fieldKey === 'dofd' && type === 'conflicting') {
        potentialViolation = 'FCRA § 605(c) - Conflicting DOFD dates suggest potential re-aging';
        recommendation = 'Request Method of Verification from all bureaus. The oldest DOFD should apply.';
    } else if (fieldKey === 'currentValue' && type === 'conflicting') {
        potentialViolation = 'FCRA § 623(a)(1) - Inaccurate value reporting across bureaus';
        recommendation = 'Dispute the higher balance as inaccurate. Request debt validation.';
    } else if (fieldKey === 'chargeOffDate' && type === 'conflicting') {
        potentialViolation = 'FCRA § 623(a)(2) - Inconsistent charge-off dates indicate data integrity issues';
        recommendation = 'The correct charge-off date should be the earliest. Dispute later dates.';
    } else if (fieldKey === 'accountStatus' && type === 'conflicting') {
        potentialViolation = 'Metro 2 Format Violation - Account status must be consistent across all CRAs';
        recommendation = 'Request the furnisher update all bureaus to the most favorable status.';
    } else if (type === 'missing') {
        recommendation = `Field is reported to ${missingBureaus.join(', ')} but not all bureaus. This inconsistency can be disputed.`;
    } else {
        recommendation = 'Dispute the discrepancy citing FCRA accuracy requirements.';
    }

    return {
        fieldKey,
        fieldLabel: FIELD_LABELS[fieldKey as string] || fieldKey as string,
        values,
        discrepancyType: type,
        severity,
        potentialViolation,
        recommendation
    };
}

function generateComparisonSummary(discrepancies: FieldDiscrepancy[], bureaus: BureauName[]): string {
    if (discrepancies.length === 0) {
        return `All compared fields are consistent across ${bureaus.join(', ')}. No discrepancies detected.`;
    }

    const critical = discrepancies.filter(d => d.severity === 'critical').length;
    const high = discrepancies.filter(d => d.severity === 'high').length;

    let summary = `Found ${discrepancies.length} discrepancies across ${bureaus.join(', ')}. `;

    if (critical > 0) {
        summary += `${critical} critical discrepancies detected that may indicate FCRA violations. `;
    }
    if (high > 0) {
        summary += `${high} high-priority inconsistencies require immediate attention. `;
    }

    return summary;
}

/**
 * Generate a formatted comparison report
 */
export function generateComparisonReport(result: BureauComparisonResult): string {
    let report = `MULTI-BUREAU COMPARISON REPORT\n`;
    report += `Generated: ${new Date(result.timestamp).toLocaleDateString()}\n`;
    report += `Bureaus Compared: ${result.bureausCompared.join(', ')}\n`;
    report += `${'='.repeat(60)}\n\n`;

    report += `EXECUTIVE SUMMARY\n`;
    report += `${'-'.repeat(40)}\n`;
    report += `${result.summary}\n\n`;

    report += `Total Discrepancies: ${result.totalDiscrepancies}\n`;
    report += `Critical Issues: ${result.criticalDiscrepancies}\n\n`;

    if (result.fieldDiscrepancies.length > 0) {
        report += `DETAILED DISCREPANCIES\n`;
        report += `${'-'.repeat(40)}\n\n`;

        result.fieldDiscrepancies.forEach((d, i) => {
            report += `${i + 1}. ${d.fieldLabel} [${d.severity.toUpperCase()}]\n`;
            report += `   Type: ${d.discrepancyType}\n`;
            result.bureausCompared.forEach(bureau => {
                report += `   ${bureau}: ${d.values[bureau] || 'Not reported'}\n`;
            });
            if (d.potentialViolation) {
                report += `   ⚠️ Potential Violation: ${d.potentialViolation}\n`;
            }
            report += `   Recommendation: ${d.recommendation}\n\n`;
        });
    }

    if (result.violationOpportunities.length > 0) {
        report += `VIOLATION OPPORTUNITIES\n`;
        report += `${'-'.repeat(40)}\n`;
        result.violationOpportunities.forEach((v, i) => {
            report += `${i + 1}. ${v}\n`;
        });
    }

    return report;
}

/**
 * Calculate dispute priority based on discrepancies
 */
export function calculateDisputePriority(result: BureauComparisonResult): {
    priority: 'immediate' | 'high' | 'standard' | 'low';
    score: number;
    reasoning: string;
} {
    let score = 0;

    // Weight critical discrepancies heavily
    score += result.criticalDiscrepancies * 30;
    score += result.fieldDiscrepancies.filter(d => d.severity === 'high').length * 15;
    score += result.fieldDiscrepancies.filter(d => d.severity === 'medium').length * 5;
    score += result.violationOpportunities.length * 10;

    let priority: 'immediate' | 'high' | 'standard' | 'low';
    let reasoning: string;

    if (score >= 60) {
        priority = 'immediate';
        reasoning = 'Multiple critical discrepancies detected. Immediate dispute action recommended.';
    } else if (score >= 30) {
        priority = 'high';
        reasoning = 'Significant inconsistencies found that could impact credit score. Prompt action advised.';
    } else if (score >= 10) {
        priority = 'standard';
        reasoning = 'Minor discrepancies detected. Standard dispute process recommended.';
    } else {
        priority = 'low';
        reasoning = 'Few or no significant discrepancies. Reports appear consistent.';
    }

    return { priority, score, reasoning };
}
