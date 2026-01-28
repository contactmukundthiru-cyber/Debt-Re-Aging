import { CreditFields } from './types';
import { parseDate } from './rules';

export interface SmartRecommendation {
    id: string;
    field: keyof CreditFields;
    title: string;
    description: string;
    type: 'error' | 'warning' | 'info';
    actionLabel: string;
    suggestedValue?: string;
}

/**
 * Generates smart recommendations based on the current field values
 */
export function getSmartRecommendations(fields: Partial<CreditFields>): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    const dofd = parseDate(fields.dofd);
    const opened = parseDate(fields.dateOpened);
    const lastPayment = parseDate(fields.dateLastPayment);
    const chargeOff = parseDate(fields.chargeOffDate);
    const reported = parseDate(fields.dateReportedOrUpdated);

    // 1. DOFD after Opened Date
    if (dofd && opened && dofd < opened) {
        recommendations.push({
            id: 'dofd-pre-opened',
            field: 'dofd',
            title: 'Invalid DOFD',
            description: 'The Date of First Delinquency cannot be before the account was opened.',
            type: 'error',
            actionLabel: 'Use Opened Date',
            suggestedValue: fields.dateOpened
        });
    }

    // 2. Open status with Charge-Off date
    if (fields.accountStatus === 'Open' && fields.chargeOffDate) {
        recommendations.push({
            id: 'open-status-co-date',
            field: 'accountStatus',
            title: 'Status Inconsistency',
            description: 'Account is marked as "Open" but has a "Charge-Off Date".',
            type: 'warning',
            actionLabel: 'Set to Charge-off',
            suggestedValue: 'Charge-off'
        });
    }

    // 3. Last Payment after Reported Date
    if (lastPayment && reported && lastPayment > reported) {
        recommendations.push({
            id: 'last-pay-post-reported',
            field: 'dateLastPayment',
            title: 'Future Payment detected',
            description: 'Last payment date is after the last reported date.',
            type: 'error',
            actionLabel: 'Set to Reported Date',
            suggestedValue: fields.dateReportedOrUpdated
        });
    }

    // 4. Missing DOFD but Charge-off present
    if (!fields.dofd && fields.chargeOffDate) {
        const suggestedDofd = new Date(chargeOff!);
        suggestedDofd.setMonth(suggestedDofd.getMonth() - 6); // Rough estimate

        recommendations.push({
            id: 'missing-dofd-co',
            field: 'dofd',
            title: 'Missing DOFD',
            description: 'DOFD is required for re-aging analysis but is missing. Usually 6 months before charge-off.',
            type: 'warning',
            actionLabel: 'Estimate DOFD',
            suggestedValue: suggestedDofd.toISOString().split('T')[0]
        });
    }

    // 5. Zero balance but marked as "In Collections"
    if (fields.currentBalance === '0' && fields.accountStatus === 'In Collections') {
        recommendations.push({
            id: 'zero-bal-collections',
            field: 'accountStatus',
            title: 'Paid Collection?',
            description: 'Balance is $0 but status is "In Collections". If paid, status should be "Paid".',
            type: 'info',
            actionLabel: 'Set to Paid',
            suggestedValue: 'Paid'
        });
    }

    return recommendations;
}
