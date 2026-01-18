/**
 * Statutory Liability & Damages Calculator
 * 
 * Maps violations to specific legal penalties under FCRA and FDCPA.
 */

import { RuleFlag } from './rules';

export interface DamageAssessment {
    statute: 'FCRA' | 'FDCPA' | 'TILA' | 'STATE_LAW';
    section: string;
    violationType: string;
    statutoryLimit: number;
    actualDamagesPotential: 'low' | 'medium' | 'high';
    estimatedValue: number;
}

export interface LiabilityReport {
    totalEstimatedLiability: number;
    assessments: DamageAssessment[];
    punitiveMultipliers: number;
    litigationReady: boolean;
}

const STATUTORY_RATES = {
    FCRA_WILLFUL: 1000,
    FCRA_NEGLIGENT: 500,
    FDCPA_PER_ACTION: 1000,
    STATE_TREBLE: 3 // Multiplier
};

export function calculateLiability(flags: RuleFlag[]): LiabilityReport {
    const assessments: DamageAssessment[] = [];
    let totalValue = 0;

    flags.forEach(flag => {
        // FCRA Violations
        if (flag.legalCitations.some(c => c.includes('FCRA'))) {
            const isWillful = flag.severity === 'high';
            const value = isWillful ? STATUTORY_RATES.FCRA_WILLFUL : STATUTORY_RATES.FCRA_NEGLIGENT;

            assessments.push({
                statute: 'FCRA',
                section: flag.legalCitations.find(c => c.includes('FCRA')) || '15 U.S.C. § 1681',
                violationType: flag.ruleName,
                statutoryLimit: 1000,
                actualDamagesPotential: isWillful ? 'high' : 'medium',
                estimatedValue: value
            });
            totalValue += value;
        }

        // FDCPA Violations
        if (flag.legalCitations.some(c => c.includes('FDCPA'))) {
            assessments.push({
                statute: 'FDCPA',
                section: flag.legalCitations.find(c => c.includes('FDCPA')) || '15 U.S.C. § 1692',
                violationType: flag.ruleName,
                statutoryLimit: 1000,
                actualDamagesPotential: 'medium',
                estimatedValue: STATUTORY_RATES.FDCPA_PER_ACTION
            });
            totalValue += STATUTORY_RATES.FDCPA_PER_ACTION;
        }
    });

    return {
        totalEstimatedLiability: totalValue,
        assessments,
        punitiveMultipliers: totalValue > 5000 ? 2 : 1,
        litigationReady: assets_meet_threshold(totalValue, flags)
    };
}

function assets_meet_threshold(value: number, flags: RuleFlag[]): boolean {
    return value >= 2000 || flags.some(f => f.severity === 'high');
}
