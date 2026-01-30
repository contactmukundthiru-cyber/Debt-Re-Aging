/**
 * Forensic Analysis Engine - Zenith V5 Orchestrator
 * Consolidates standard and advanced rule engines into a single, high-confidence output.
 */

import { CreditFields, RuleFlag, RiskProfile } from './types';
import { runRules, calculateRiskProfile } from './rules';
import { runAdvancedRules, AdvancedRuleFlag } from './rules-advanced';

export interface ComprehensiveAnalysis {
    flags: RuleFlag[];
    advancedFlags: AdvancedRuleFlag[];
    riskProfile: RiskProfile;
    forensicSummary: string;
}

/**
 * Executes a full forensic audit across all detection layers.
 */
export function runComprehensiveAnalysis(
    fields: CreditFields,
    options: {
        stateCode?: string;
        historicalData?: CreditFields[];
        crossBureauData?: { bureau: string; fields: CreditFields }[];
    } = {}
): ComprehensiveAnalysis {
    // 1. Run Standard Rule Engine
    const standardFlags = runRules(fields);

    // 2. Run Advanced Forensic Engine
    const advancedFlags = runAdvancedRules(fields, {
        includeStateSpecific: !!options.stateCode,
        stateCode: options.stateCode,
        historicalData: options.historicalData,
        crossBureauData: options.crossBureauData
    });

    // 3. Deduplicate and Merge
    // We keep standard flags but prioritize advanced versions if they exist
    const finalFlags: RuleFlag[] = [...standardFlags];

    // Merge advanced flags into the main list if they aren't duplicates
    // (In practice, advanced rules often cover different ground or provide deeper detail)
    advancedFlags.forEach(adv => {
        const isDuplicate = finalFlags.some(f => f.ruleId === adv.ruleId.split('-')[0]);
        if (!isDuplicate) {
            // Map AdvancedRuleFlag back to RuleFlag for UI compatibility if needed, 
            // but most components can handle the extended fields.
            finalFlags.push(adv as unknown as RuleFlag);
        }
    });

    // 4. Calculate Final Risk Profile
    // We use the standard calculator as a base but can enhance it with forensic scores
    const profile = calculateRiskProfile(finalFlags, fields);

    // 5. Intelligent Summary Generation
    const forensicSummary = generateForensicSummary(finalFlags, profile);

    return {
        flags: finalFlags,
        advancedFlags,
        riskProfile: profile,
        forensicSummary
    };
}

/**
 * Runs a batch analysis across multiple accounts to detect cross-account patterns
 * such as duplicate reporting or chain-of-title shifts.
 */
export function runBatchAnalysis(accounts: { id: string; fields: CreditFields }[]): { 
    analyses: Record<string, ComprehensiveAnalysis>,
    globalFlags: RuleFlag[] 
} {
    const analyses: Record<string, ComprehensiveAnalysis> = {};
    const globalFlags: RuleFlag[] = [];

    // 1. Individual analysis
    accounts.forEach(acc => {
        analyses[acc.id] = runComprehensiveAnalysis(acc.fields);
    });

    // 2. Duplicate Detection (DU1)
    const groups: Record<string, string[]> = {};
    accounts.forEach(acc => {
        const balance = (acc.fields.currentValue || '0').replace(/[$,]/g, '').trim();
        const creditor = (acc.fields.originalCreditor || acc.fields.furnisherOrCollector || '')
            .toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
        
        if (balance !== '0' && creditor.length > 3) {
            const key = `${balance}-${creditor}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(acc.id);
        }
    });

    for (const [key, ids] of Object.entries(groups)) {
        if (ids.length > 1) {
            const flag: RuleFlag = {
                ruleId: 'DU1',
                ruleName: 'Duplicate Account Reporting',
                severity: 'high',
                explanation: `Detected ${ids.length} accounts reporting the same balance for similar creditors. This artificially inflates your debt-to-income ratio.`,
                whyItMatters: 'Credit bureaus are required by the FCRA to maintain "maximum possible accuracy." Duplicate entries violate this standard.',
                suggestedEvidence: ['Highlighted credit report showing matching balances'],
                fieldValues: { duplicateCount: ids.length },
                legalCitations: ['15 USC 1681e(b)', '15 USC 1681s-2(a)(1)'],
                successProbability: 95
            };
            globalFlags.push(flag);
            
            // Add to individual account flags as well
            ids.forEach(id => {
                if (analyses[id]) analyses[id].flags.push(flag);
            });
        }
    }

    return { analyses, globalFlags };
}

function generateForensicSummary(flags: RuleFlag[], profile: RiskProfile): string {
    if (flags.length === 0) return "No forensic anomalies detected in current data stream.";

    const highImpact = flags.filter(f => f.severity === 'high' || (f as any).severity === 'critical').length;
    const categories = Array.from(new Set(flags.map(f => f.ruleId.substring(0, 1))));

    return `Forensic audit identified ${flags.length} total anomalies across ${categories.length} vectors. ` +
        `${highImpact} items are classified as high-impact violations. ` +
        `Current litigation readiness: ${profile.disputeStrength.toUpperCase()}.`;
}
