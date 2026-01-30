/**
 * Statutory Liability & Impact Calculator
 * 
 * Maps violations to specific legal penalties under FCRA and FDCPA.
 */

import { RuleFlag } from './rules';

export interface DamageAssessment {
    statute: 'FCRA' | 'FDCPA' | 'TILA' | 'STATE_LAW';
    section: string;
    violationType: string;
    forensicSeverity: number;
    impactPotential: 'low' | 'medium' | 'high';
}

export interface LiabilityReport {
    overallSeverityScore: number;
    assessments: DamageAssessment[];
    riskMultiplier: number;
    litigationReady: boolean;
}

const SEVERITY_WEIGHTS = {
    HIGH: 100,
    MEDIUM: 50,
    LOW: 10
};

export function calculateLiability(flags: RuleFlag[]): LiabilityReport {
    const assessments: DamageAssessment[] = [];
    let totalScore = 0;

    flags.forEach(flag => {
        // FCRA Violations
        if (flag.legalCitations.some(c => c.includes('FCRA'))) {
            const isHigh = flag.severity === 'high';
            const score = isHigh ? SEVERITY_WEIGHTS.HIGH : SEVERITY_WEIGHTS.MEDIUM;

            assessments.push({
                statute: 'FCRA',
                section: flag.legalCitations.find(c => c.includes('FCRA')) || '15 U.S.C. § 1681',
                violationType: flag.ruleName,
                forensicSeverity: score,
                impactPotential: isHigh ? 'high' : 'medium'
            });
            totalScore += score;
        }

        // FDCPA Violations
        if (flag.legalCitations.some(c => c.includes('FDCPA'))) {
            assessments.push({
                statute: 'FDCPA',
                section: flag.legalCitations.find(c => c.includes('FDCPA')) || '15 U.S.C. § 1692',
                violationType: flag.ruleName,
                forensicSeverity: SEVERITY_WEIGHTS.HIGH,
                impactPotential: 'high'
            });
            totalScore += SEVERITY_WEIGHTS.HIGH;
        }
    });

    return {
        overallSeverityScore: totalScore,
        assessments,
        riskMultiplier: totalScore > 300 ? 2 : 1,
        litigationReady: assets_meet_threshold(totalScore, flags)
    };
}

function assets_meet_threshold(score: number, flags: RuleFlag[]): boolean {
    return score >= 200 || flags.some(f => f.severity === 'high');
}
