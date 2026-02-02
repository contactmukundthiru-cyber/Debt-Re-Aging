import { CreditFields } from './types';
import { parseDate } from './rules';
import { maskSensitiveInText } from './utils';

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
export function getSmartRecommendations(fields: Partial<CreditFields>, isPrivacyMode: boolean = false): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    const dofd = parseDate(fields.dofd);
    const opened = parseDate(fields.dateOpened);
    const lastPayment = parseDate(fields.dateLastPayment);
    const chargeOff = parseDate(fields.chargeOffDate);
    const reported = parseDate(fields.dateReportedOrUpdated);

    // Helper to mask if needed
    const mask = (val: string | undefined) => (isPrivacyMode && val ? maskSensitiveInText(val, true) : val);
    const maskDesc = (desc: string) => (isPrivacyMode ? maskSensitiveInText(desc, true) : desc);

    // 1. DOFD after Opened Date
    if (dofd && opened && dofd < opened) {
        recommendations.push({
            id: 'dofd-pre-opened',
            field: 'dofd',
            title: 'Invalid DOFD',
            description: maskDesc(`The Date of First Delinquency cannot be before the account was opened.`),
            type: 'error',
            actionLabel: 'Use Opened Date',
            suggestedValue: mask(fields.dateOpened)
        });
    }

    // 2. Open status with Charge-Off date
    if (fields.accountStatus === 'Open' && fields.chargeOffDate) {
        recommendations.push({
            id: 'open-status-co-date',
            field: 'accountStatus',
            title: 'Status Inconsistency',
            description: maskDesc(`Account is marked as "Open" but has a "Charge-Off Date" of ${fields.chargeOffDate}.`),
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
            description: maskDesc(`Last payment date (${fields.dateLastPayment}) is after the last reported date.`),
            type: 'error',
            actionLabel: 'Set to Reported Date',
            suggestedValue: mask(fields.dateReportedOrUpdated)
        });
    }

    // 4. Missing DOFD but Charge-off present
    if (!fields.dofd && fields.chargeOffDate) {
        const suggestedDofdDate = new Date(chargeOff!);
        suggestedDofdDate.setMonth(suggestedDofdDate.getMonth() - 6); // Rough estimate
        const suggestedDofd = suggestedDofdDate.toISOString().split('T')[0];

        recommendations.push({
            id: 'missing-dofd-co',
            field: 'dofd',
            title: 'Missing DOFD',
            description: maskDesc(`DOFD is required for re-aging analysis but is missing. A common estimate is 180 days before the charge-off on ${fields.chargeOffDate}.`),
            type: 'warning',
            actionLabel: 'Estimate DOFD',
            suggestedValue: mask(suggestedDofd)
        });
    }

    // 5. Zero balance but marked as "In Collections"
    if (fields.currentValue === '0' && (fields.accountStatus === 'In Collections' || fields.accountStatus === 'Collection')) {
        recommendations.push({
            id: 'zero-bal-collections',
            field: 'accountStatus',
            title: 'Paid Collection?',
            description: 'Balance is zero value but status is "In Collections". If paid, status should be "Paid".',
            type: 'info',
            actionLabel: 'Set to Paid',
            suggestedValue: 'Paid'
        });
    }

    return recommendations;
}
