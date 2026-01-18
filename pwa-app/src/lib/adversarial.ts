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

export interface SimulationResult {
    pathOfLeastResistance: DecisionNode[];
    estimatedComplianceCost: number; // Estimated cost for them to respond
    settlementThreshold: number; // Price at which they usually give up
    tactic: 'technical_fault' | 'administrative_burden' | 'legal_risk';
}

/**
 * Simulates how a bureau or collector will likely respond to the current data
 */
export function simulateAdversarialLogic(
    flags: RuleFlag[],
    risk: RiskProfile
): SimulationResult {
    const nodes: DecisionNode[] = [];
    let complianceCost = 150; // Base cost of processing a dispute (clerk time, mail, etc.)

    // Logic 1: The "Auto-Verification" Filter (e-OSCAR)
    const technicalViolations = flags.filter(f => f.ruleId.startsWith('B') || f.ruleId.startsWith('E'));

    if (technicalViolations.length > 0) {
        nodes.push({
            id: 'step-1',
            label: 'Batch e-OSCAR Processing',
            probability: 85,
            outcome: 'verify',
            reasoning: 'Standard automated verification usually ignores high-level logic. This is their first line of defense.',
            counterTactic: 'Use certified mail with "Restricted Delivery" to bypass automated sorting.'
        });
        complianceCost += technicalViolations.length * 45;
    }

    // Logic 2: Risk Management Escalation
    if (risk.overallScore > 70) {
        nodes.push({
            id: 'step-2',
            label: 'Manual Legal Review',
            probability: 40,
            outcome: 'human_review',
            reasoning: 'High forensic strength scores often trigger a secondary review to avoid statutory liability.',
            counterTactic: 'Escalate directly to the registered agent of the corporation.'
        });
        complianceCost += 500; // Legal review is expensive
    }

    // Logic 3: The Deletion Decision
    const deleteProb = Math.min(95, (risk.overallScore / 1.5) + (technicalViolations.length * 10));
    nodes.push({
        id: 'step-3',
        label: 'Cost-Benefit Deletion',
        probability: deleteProb,
        outcome: 'delete',
        reasoning: `If compliance cost ($${complianceCost}) exceeds projected collection value, deletion is the standard business decision.`,
    });

    return {
        pathOfLeastResistance: nodes,
        estimatedComplianceCost: complianceCost,
        settlementThreshold: risk.overallScore * 25,
        tactic: technicalViolations.length > 2 ? 'technical_fault' : 'legal_risk'
    };
}
