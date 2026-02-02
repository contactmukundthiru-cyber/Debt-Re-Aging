/**
 * Adversarial Decision-Tree Simulator
 * 
 * Simulates the internal risk-assessment logic used by debt collectors and bureaus.
 * Helps users identify the "Path of Least Resistance" to a deletion.
 */

import { RuleFlag, RiskProfile } from './rules';

export interface DecisionNode {
    id: string;
    label: string;
    probability: number; // 0-100
    outcome: 'delete' | 'verify' | 'ignore' | 'human_review';
    reasoning: string;
    counterTactic?: string;
}

export interface RejectionCounter {
    rejectionType: string;
    bureauReason: string;
    statutoryRebuttal: string;
    escalationAction: string;
}

export interface SimulationResult {
    pathOfLeastResistance: DecisionNode[];
    internalRiskMitigationScore: number; 
    institutionalCompliancePressure: number;
    tactic: 'technical_fault' | 'administrative_burden' | 'legal_risk';
    estimatedComplianceCost: number;
    settlementThreshold: number;
    predictedRejections: RejectionCounter[];
}

/**
 * Predicts and provides counters for common bureau rejections
 */
function predictRejections(flags: RuleFlag[]): RejectionCounter[] {
    const counters: RejectionCounter[] = [];
    
    // 1. Frivolous/Irrelevant Flag
    counters.push({
        rejectionType: 'Frivolous Dispute',
        bureauReason: 'Dispute lacks sufficient information to conduct an investigation.',
        statutoryRebuttal: 'Pursuant to 15 U.S.C. § 1681i(a)(3), a dispute is only frivolous if the consumer fails to provide specific inaccuracies. This dispute includes forensic identifiers and specific FCRA § 623 violations.',
        escalationAction: 'File immediate CFPB complaint for failure to investigate under § 611.'
    });

    // 2. Verified as Accurate
    if (flags.some(f => f.severity === 'high')) {
        counters.push({
            rejectionType: 'Verified Accurate',
            bureauReason: 'The furnisher has verified the information as being reported correctly.',
            statutoryRebuttal: 'A mere "verification" by the furnisher does not satisfy the CRA duty to conduct a reasonable reinvestigation. If the logical impossibility of the dates remains, the investigation was per-se unreasonable.',
            escalationAction: 'Demand the Method of Verification (MOV) under § 611(a)(7).'
        });
    }

    return counters;
}

/**
 * Simulates how a bureau or collector will likely respond to the current data
 */
export function simulateAdversarialLogic(
    flags: RuleFlag[],
    risk: RiskProfile
): SimulationResult {
    const nodes: DecisionNode[] = [];
    let compliancePressure = 15; 

    // Logic 1: The "Auto-Verification" Filter (e-OSCAR)
    const technicalViolations = flags.filter(f => f.ruleId.startsWith('B') || f.ruleId.startsWith('E'));

    if (technicalViolations.length > 0) {
        nodes.push({
            id: 'step-1',
            label: 'Batch e-OSCAR Filtering',
            probability: 85,
            outcome: 'verify',
            reasoning: 'Standard automated verification usually ignores high-level logic. This is their primary algorithmic gate.',
            counterTactic: 'Utilize specialized delivery protocols to bypass automated sorting clusters.'
        });
        compliancePressure += technicalViolations.length * 10;
    }

    // Logic 2: Risk Management Escalation
    if (risk.overallScore > 70) {
        nodes.push({
            id: 'step-2',
            label: 'Institutional Forensic Audit',
            probability: 40,
            outcome: 'human_review',
            reasoning: 'High-fidelity forensic markers often trigger a manual audit to assess corporate exposure.',
            counterTactic: 'Initiate communication with the Chief Compliance Officer or Registered Agent.'
        });
        compliancePressure += 85; 
    }

    // Logic 3: The Deletion Decision
    const deleteProb = Math.min(95, (risk.overallScore / 1.5) + (technicalViolations.length * 10));
    nodes.push({
        id: 'step-3',
        label: 'Risk-Based Deletion',
        probability: deleteProb,
        outcome: 'delete',
        reasoning: `When institutional compliance pressure (${compliancePressure} points) exceeds the threshold of profitable verification, data removal becomes the logical outcome.`,
    });

    const estimatedComplianceCost = compliancePressure * 12; 
    const settlementThreshold = Math.max(200, 800 - risk.overallScore * 4);

    return {
        pathOfLeastResistance: nodes,
        internalRiskMitigationScore: risk.overallScore * 2,
        institutionalCompliancePressure: compliancePressure,
        tactic: technicalViolations.length > 2 ? 'technical_fault' : 'legal_risk',
        estimatedComplianceCost,
        settlementThreshold,
        predictedRejections: predictRejections(flags)
    };
}
