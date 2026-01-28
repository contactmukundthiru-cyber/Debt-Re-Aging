/**
 * Metro 2® Forensic Reconstruction Library
 * 
 * Reconstructs the internal backend record segments used by CRAs (Credit Reporting Agencies).
 * Identifying errors at the Metro 2 level is the "Nuclear Option" for disputes.
 */

import { CreditFields } from './rules';

export interface Metro2Segment {
    segmentIdentifier: string;
    fields: {
        position: number;
        length: number;
        label: string;
        value: string;
        description: string;
        standard: string;
        isValid: boolean;
    }[];
}

export interface Metro2Audit {
    reconstructedRecord: string;
    segments: Metro2Segment[];
    integrityScore: number; // 0-100
    structuralViolations: string[];
}

/**
 * Maps human-readable fields back to suspected Metro 2 Base Segment values
 */
export function reconstructMetro2Base(fields: Partial<CreditFields>): Metro2Segment {
    const segments: Metro2Segment['fields'] = [];

    // Field 1: Record Descriptor Word (Simplified)
    segments.push({
        position: 1, length: 4, label: 'RDW', value: '0426',
        description: 'Record length indicator', standard: 'Fixed 0426', isValid: true
    });

    // Field 7: Account Number
    const accNum = (fields.originalCreditor?.substring(0, 10) || 'UNKNOWN').padEnd(20, '0');
    segments.push({
        position: 14, length: 20, label: 'Account Number', value: accNum,
        description: 'Unique identifier for the consumer account', standard: 'Alphanumeric, Left Justified', isValid: true
    });

    // Field 17: Date of First Delinquency (The most important field)
    const dofdRaw = fields.dofd?.replace(/[-/]/g, '') || '00000000';
    const isDofdValid = /^\d{8}$/.test(dofdRaw) && dofdRaw !== '00000000';
    segments.push({
        position: 146, length: 8, label: 'DOFD', value: dofdRaw,
        description: 'Date of First Delinquency (MMDDYYYY)', standard: 'Required for Collections/Charge-offs',
        isValid: isDofdValid
    });

    // Field 18: Date Opened
    const openedRaw = fields.dateOpened?.replace(/[-/]/g, '') || '00000000';
    segments.push({
        position: 154, length: 8, label: 'Date Opened', value: openedRaw,
        description: 'Date the account was established', standard: 'MMDDYYYY', isValid: true
    });

    // Field 21: Current Balance
    const balance = fields.currentBalance?.replace(/[$,.]/g, '') || '0';
    segments.push({
        position: 178, length: 9, label: 'Current Balance', value: balance.padStart(9, '0'),
        description: 'Total amount owed as of the date of report', standard: 'Numeric, no decimals', isValid: true
    });

    return {
        segmentIdentifier: 'BASE',
        fields: segments
    };
}

import { ConsumerInfo } from './types';

/**
 * J2 Segment: Associated Names (Used for Mixed Files)
 */
export function reconstructJ2Segment(consumer: ConsumerInfo): Metro2Segment {
    const nameParts = consumer.name.split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : consumer.name;

    return {
        segmentIdentifier: 'J2',
        fields: [
            { position: 1, length: 2, label: 'Segment ID', value: 'J2', description: 'Associated Name', standard: 'J2', isValid: true },
            { position: 3, length: 30, label: 'Last Name', value: lastName.padEnd(30), description: 'Secondary Name', standard: 'Alphanumeric', isValid: true }
        ]
    };
}

/**
 * Runs a deep structural audit on the reconstructed data
 */
export function performMetro2Audit(fields: Partial<CreditFields>): Metro2Audit {
    const base = reconstructMetro2Base(fields);
    const structuralViolations: string[] = [];
    let integrityScore = 100;

    // Check for logical impossibilities in the segments
    const dofdField = base.fields.find(f => f.label === 'DOFD');
    const openedField = base.fields.find(f => f.label === 'Date Opened');

    if (dofdField && openedField && dofdField.value !== '00000000') {
        if (parseInt(dofdField.value) < parseInt(openedField.value)) {
            structuralViolations.push('METRO2_LOGIC_ERR: DOFD occurs before Date Opened in Base Segment.');
            integrityScore -= 40;
        }
    }

    if (fields.accountType === 'Collection' && (!fields.dofd || fields.dofd === '')) {
        structuralViolations.push('METRO2_COMPLIANCE: Field 17 (DOFD) is mandatory for Portfolio Type C (Collections).');
        integrityScore -= 30;
    }

    return {
        reconstructedRecord: base.fields.map(f => f.value).join(''),
        segments: [base],
        integrityScore: Math.max(0, integrityScore),
        structuralViolations
    };
}
