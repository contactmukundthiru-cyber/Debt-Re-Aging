/**
 * AI-Powered Analysis Engine
 * Provides intelligent violation detection, narrative generation,
 * and strategic recommendations using pattern matching and NLP techniques
 */

import { CreditFields, RuleFlag, RiskProfile } from './rules';
import { PatternInsight, TimelineEvent } from './analytics';

export interface AIAnalysisResult {
    overallAssessment: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    keyFindings: AIFinding[];
    strategicRecommendations: StrategicRecommendation[];
    narrativeBlocks: NarrativeBlock[];
    riskFactors: RiskFactor[];
    successPrediction: SuccessPrediction;
}

export interface AIFinding {
    id: string;
    category: 'violation' | 'pattern' | 'anomaly' | 'opportunity';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    explanation: string;
    evidence: string[];
    legalBasis: string[];
    actionRequired: boolean;
}

export interface StrategicRecommendation {
    priority: number;
    action: string;
    reasoning: string;
    expectedOutcome: string;
    timeframe: string;
    difficulty: 'easy' | 'moderate' | 'complex';
}

export interface NarrativeBlock {
    type: 'introduction' | 'violation_summary' | 'evidence' | 'legal_argument' | 'demand' | 'conclusion';
    content: string;
    citations: string[];
}

export interface RiskFactor {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
}

export interface SuccessPrediction {
    overallProbability: number;
    byDispute: DisputeSuccessPrediction[];
    factors: string[];
    caveats: string[];
}

export interface DisputeSuccessPrediction {
    targetEntity: string;
    successProbability: number;
    reasoning: string;
    bestApproach: string;
}

// Pattern templates for intelligent analysis
const VIOLATION_PATTERNS = {
    reaging: {
        indicators: ['dofd changed', 'date manipulation', '7-year reset', 'zombie debt'],
        severity: 'critical' as const,
        legalBasis: ['FCRA § 605(c)', 'FTC Opinion Letter'],
        successRate: 0.85
    },
    dataMismatches: {
        indicators: ['value discrepancy', 'status conflict', 'date inconsistency'],
        severity: 'high' as const,
        legalBasis: ['FCRA § 623(a)(1)', 'Metro 2 Guidelines'],
        successRate: 0.75
    },
    proceduralViolations: {
        indicators: ['no investigation', 'boilerplate response', 'stale data'],
        severity: 'high' as const,
        legalBasis: ['FCRA § 611', 'FCRA § 623(b)'],
        successRate: 0.80
    },
    collectionMisconduct: {
        indicators: ['unauthorized collection', 'time-barred debt', 'wrong amount'],
        severity: 'high' as const,
        legalBasis: ['FDCPA § 807', 'FDCPA § 809'],
        successRate: 0.70
    }
};

// Narrative templates
const NARRATIVE_TEMPLATES = {
    introduction: (consumerName: string, furnisher: string) =>
        `This formal dispute is submitted on behalf of ${consumerName || 'the consumer'} regarding inaccurate information being reported by ${furnisher || 'the furnisher'} to the major credit bureaus. The following analysis demonstrates clear violations of the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681 et seq.`,

    violationSummary: (count: number, critical: number) =>
        `A comprehensive forensic analysis has identified ${count} distinct reporting violations, including ${critical} critical issues that constitute prima facie FCRA violations. These discrepancies materially harm the consumer's creditworthiness and require immediate correction.`,

    evidence: (evidence: string[]) =>
        `The following documentary evidence supports this dispute:\n${evidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}`,

    legalArgument: (citations: string[]) =>
        `Under ${citations.join(', ')}, the furnisher and credit reporting agencies are obligated to ensure maximum possible accuracy in credit reporting. The documented violations demonstrate a clear failure to meet this statutory requirement.`,

    demand: (actions: string[]) =>
        `DEMAND: Pursuant to FCRA § 611 and § 623, the consumer demands the following corrective actions within 30 days:\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,

    conclusion: () =>
        `Failure to comply with these demands within the statutory timeframe will result in the consumer exercising all available legal remedies, including but not limited to filing a complaint with the Consumer Financial Protection Bureau (CFPB) and pursuing private right of action under FCRA § 616 and § 617.`
};

/**
 * Perform AI-powered analysis of credit report violations
 */
export function performAIAnalysis(
    flags: RuleFlag[],
    fields: Partial<CreditFields>,
    patterns: PatternInsight[],
    timeline: TimelineEvent[],
    riskProfile: RiskProfile
): AIAnalysisResult {
    // Analyze patterns and generate findings
    const keyFindings = generateKeyFindings(flags, patterns);

    // Generate strategic recommendations
    const strategicRecommendations = generateStrategicRecommendations(flags, riskProfile);

    // Build narrative blocks
    const narrativeBlocks = buildNarrativeBlocks(flags, fields, keyFindings);

    // Assess risk factors
    const riskFactors = assessRiskFactors(flags, fields, riskProfile);

    // Predict success
    const successPrediction = predictSuccess(flags, riskProfile, fields);

    // Generate overall assessment
    const overallAssessment = generateOverallAssessment(flags, riskProfile, successPrediction);

    // Determine confidence level
    const confidenceLevel = determineConfidenceLevel(flags, keyFindings);

    return {
        overallAssessment,
        confidenceLevel,
        keyFindings,
        strategicRecommendations,
        narrativeBlocks,
        riskFactors,
        successPrediction
    };
}

function generateKeyFindings(flags: RuleFlag[], patterns: PatternInsight[]): AIFinding[] {
    const findings: AIFinding[] = [];
    let findingId = 1;

    // Analyze violation patterns
    const highSeverityFlags = flags.filter(f => f.severity === 'high');

    if (highSeverityFlags.length > 0) {
        findings.push({
            id: `F${findingId++}`,
            category: 'violation',
            severity: 'critical',
            title: 'Critical FCRA Violations Detected',
            explanation: `${highSeverityFlags.length} high-severity violations identified that constitute clear breaches of federal credit reporting law.`,
            evidence: highSeverityFlags.map(f => f.explanation),
            legalBasis: [...new Set(highSeverityFlags.flatMap(f => f.legalCitations))],
            actionRequired: true
        });
    }

    // Look for re-aging patterns
    const reagingFlags = flags.filter(f =>
        f.ruleId.startsWith('B') ||
        f.ruleId.startsWith('K') ||
        f.explanation.toLowerCase().includes('re-aging') ||
        f.explanation.toLowerCase().includes('dofd')
    );

    if (reagingFlags.length > 0) {
        findings.push({
            id: `F${findingId++}`,
            category: 'pattern',
            severity: 'critical',
            title: 'Debt Re-Aging Pattern Identified',
            explanation: 'Evidence suggests manipulation of the Date of First Delinquency (DOFD) to artificially extend the reporting period. This is a per se violation of FCRA § 605(c).',
            evidence: reagingFlags.map(f => f.explanation),
            legalBasis: ['FCRA § 605(c)', 'FTC Opinion Letter (1998)', 'CDIA Metro 2 Guidelines'],
            actionRequired: true
        });
    }

    // Pattern-based findings
    patterns.filter(p => p.significance === 'high').forEach(pattern => {
        findings.push({
            id: `F${findingId++}`,
            category: 'pattern',
            severity: 'high',
            title: pattern.pattern,
            explanation: pattern.description,
            evidence: [],
            legalBasis: [],
            actionRequired: true
        });
    });

    // Look for anomalies
    const balanceIssues = flags.filter(f =>
        f.explanation.toLowerCase().includes('balance') ||
        f.explanation.toLowerCase().includes('amount')
    );

    if (balanceIssues.length > 0) {
        findings.push({
            id: `F${findingId++}`,
            category: 'anomaly',
            severity: 'high',
            title: 'Value Reporting Anomalies',
            explanation: 'Inconsistent or inaccurate balance information detected, which may indicate improper data handling or intentional inflation.',
            evidence: balanceIssues.map(f => f.explanation),
            legalBasis: ['FCRA § 623(a)(1)', 'FCRA § 607(b)'],
            actionRequired: true
        });
    }

    return findings;
}

function generateStrategicRecommendations(flags: RuleFlag[], riskProfile: RiskProfile): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = [];
    let priority = 1;

    // Always recommend direct dispute first for high-severity cases
    if (flags.some(f => f.severity === 'high')) {
        recommendations.push({
            priority: priority++,
            action: 'Send Direct Dispute Letters to All Three Bureaus',
            reasoning: 'High-severity violations require immediate attention. Direct disputes trigger the 30-day investigation requirement under FCRA § 611.',
            expectedOutcome: 'Removal or correction of inaccurate items within 30-45 days',
            timeframe: 'Immediate',
            difficulty: 'easy'
        });
    }

    // Recommend debt validation for collection accounts
    if (flags.some(f => f.explanation.includes('collection') || f.explanation.includes('collector'))) {
        recommendations.push({
            priority: priority++,
            action: 'Send Debt Validation Request to Collector',
            reasoning: 'FDCPA § 809 requires collectors to validate debts upon request. Many cannot provide proper documentation.',
            expectedOutcome: '30-40% of collection accounts are removed due to validation failure',
            timeframe: 'Within 30 days of first contact',
            difficulty: 'easy'
        });
    }

    // Recommend CFPB complaint for procedural violations
    if (riskProfile.riskLevel === 'critical' || riskProfile.riskLevel === 'high') {
        recommendations.push({
            priority: priority++,
            action: 'File CFPB Complaint',
            reasoning: 'The CFPB has enforcement authority over both bureaus and furnishers. Complaints receive mandatory response.',
            expectedOutcome: 'Expedited investigation and higher removal rate',
            timeframe: 'After initial dispute if unsatisfied',
            difficulty: 'moderate'
        });
    }

    // Attorney consultation for complex cases
    if (flags.filter(f => f.severity === 'high').length >= 3) {
        recommendations.push({
            priority: priority++,
            action: 'Consult FCRA Attorney',
            reasoning: 'Multiple violations may warrant legal action. FCRA provides for statutory liability of 100 points-1,000 points per violation plus attorney fees.',
            expectedOutcome: 'Potential settlement or impact score recovery',
            timeframe: 'If disputes are not resolved',
            difficulty: 'complex'
        });
    }

    // Method of Verification request
    recommendations.push({
        priority: priority++,
        action: 'Request Method of Verification (MOV)',
        reasoning: 'Under FCRA § 611(a)(7), bureaus must disclose how they verified disputed information upon consumer request.',
        expectedOutcome: 'Exposes deficient investigation procedures, creates additional violation evidence',
        timeframe: 'After dispute response received',
        difficulty: 'easy'
    });

    return recommendations;
}

function buildNarrativeBlocks(
    flags: RuleFlag[],
    fields: Partial<CreditFields>,
    findings: AIFinding[]
): NarrativeBlock[] {
    const blocks: NarrativeBlock[] = [];
    const furnisher = fields.furnisherOrCollector || fields.originalCreditor || 'the furnisher';
    const criticalCount = flags.filter(f => f.severity === 'high').length;
    const allCitations = [...new Set(flags.flatMap(f => f.legalCitations))];
    const allEvidence = [...new Set(flags.flatMap(f => f.suggestedEvidence))];

    blocks.push({
        type: 'introduction',
        content: NARRATIVE_TEMPLATES.introduction('', furnisher),
        citations: ['FCRA 15 U.S.C. § 1681']
    });

    blocks.push({
        type: 'violation_summary',
        content: NARRATIVE_TEMPLATES.violationSummary(flags.length, criticalCount),
        citations: []
    });

    if (allEvidence.length > 0) {
        blocks.push({
            type: 'evidence',
            content: NARRATIVE_TEMPLATES.evidence(allEvidence.slice(0, 5)),
            citations: []
        });
    }

    blocks.push({
        type: 'legal_argument',
        content: NARRATIVE_TEMPLATES.legalArgument(allCitations.slice(0, 4)),
        citations: allCitations
    });

    blocks.push({
        type: 'demand',
        content: NARRATIVE_TEMPLATES.demand([
            'Immediate deletion of the inaccurate trade line',
            'Provide the Method of Verification used',
            'Cease reporting until accuracy is verified',
            'Submit corrected data to all credit bureaus'
        ]),
        citations: ['FCRA § 611', 'FCRA § 623']
    });

    blocks.push({
        type: 'conclusion',
        content: NARRATIVE_TEMPLATES.conclusion(),
        citations: ['FCRA § 616', 'FCRA § 617']
    });

    return blocks;
}

function assessRiskFactors(
    flags: RuleFlag[],
    fields: Partial<CreditFields>,
    riskProfile: RiskProfile
): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Positive factors
    if (flags.some(f => f.successProbability > 80)) {
        factors.push({
            factor: 'High Success Probability Violations',
            impact: 'positive',
            weight: 0.3,
            description: 'Some violations have >80% historical success rate in disputes'
        });
    }

    if (flags.some(f => f.legalCitations.length > 2)) {
        factors.push({
            factor: 'Strong Legal Citations',
            impact: 'positive',
            weight: 0.2,
            description: 'Multiple federal statutes support the dispute'
        });
    }

    // Negative factors
    if (fields.accountStatus?.toLowerCase().includes('open')) {
        factors.push({
            factor: 'Active Account Status',
            impact: 'negative',
            weight: 0.1,
            description: 'Open accounts are harder to dispute than closed accounts'
        });
    }

    if (riskProfile.riskLevel === 'low') {
        factors.push({
            factor: 'Low Overall Risk Level',
            impact: 'neutral',
            weight: 0.1,
            description: 'Limited violations may result in lower priority for bureaus'
        });
    }

    return factors;
}

function predictSuccess(
    flags: RuleFlag[],
    riskProfile: RiskProfile,
    fields: Partial<CreditFields>
): SuccessPrediction {
    // Calculate weighted average success probability
    const weightedSum = flags.reduce((sum, f) => sum + f.successProbability, 0);
    const overallProbability = flags.length > 0 ? Math.round(weightedSum / flags.length) : 0;

    // Predict by dispute target
    const byDispute: DisputeSuccessPrediction[] = [
        {
            targetEntity: 'Credit Bureaus (Equifax, Experian, TransUnion)',
            successProbability: Math.min(85, overallProbability + 10),
            reasoning: 'Bureaus must investigate within 30 days. Well-documented disputes have high success rates.',
            bestApproach: 'Submit detailed dispute with evidence to all three bureaus simultaneously'
        },
        {
            targetEntity: fields.furnisherOrCollector || 'Furnisher',
            successProbability: Math.max(40, overallProbability - 15),
            reasoning: 'Furnishers have FCRA § 623 duties to investigate and correct inaccurate data.',
            bestApproach: 'Direct dispute letter citing specific inaccuracies with supporting documentation'
        }
    ];

    return {
        overallProbability,
        byDispute,
        factors: [
            `${flags.filter(f => f.severity === 'high').length} high-severity violations identified`,
            `Average success probability: ${overallProbability}%`,
            `Risk level: ${riskProfile.riskLevel}`
        ],
        caveats: [
            'Actual results may vary based on individual circumstances',
            'Bureau investigation quality varies',
            'Furnisher responsiveness affects timeline'
        ]
    };
}

function generateOverallAssessment(
    flags: RuleFlag[],
    riskProfile: RiskProfile,
    prediction: SuccessPrediction
): string {
    const highCount = flags.filter(f => f.severity === 'high').length;

    if (highCount >= 3 && prediction.overallProbability >= 70) {
        return `STRONG CASE: Multiple critical violations detected with ${prediction.overallProbability}% overall success probability. Immediate action recommended via multi-channel dispute strategy.`;
    } else if (highCount >= 1 && prediction.overallProbability >= 50) {
        return `MODERATE CASE: Significant violations identified with reasonable success probability. Standard dispute process should yield positive results within 45-60 days.`;
    } else if (flags.length > 0) {
        return `LIMITED CASE: Minor violations detected. While disputes may succeed, the credit impact of resolution is likely modest.`;
    }

    return `CLEAN REPORT: No significant violations detected. Continue monitoring for future discrepancies.`;
}

function determineConfidenceLevel(flags: RuleFlag[], findings: AIFinding[]): 'high' | 'medium' | 'low' {
    const avgSuccessProb = flags.reduce((sum, f) => sum + f.successProbability, 0) / flags.length;
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;

    if (avgSuccessProb >= 75 && criticalFindings >= 2) return 'high';
    if (avgSuccessProb >= 50 || criticalFindings >= 1) return 'medium';
    return 'low';
}

/**
 * Generate a CFPB-optimized complaint narrative
 */
export function generateCFPBNarrative(
    flags: RuleFlag[],
    fields: Partial<CreditFields>,
    consumerName: string
): string {
    const furnisher = fields.furnisherOrCollector || fields.originalCreditor || 'the company';
    const violations = flags.filter(f => f.severity === 'high' || f.severity === 'medium');

    let narrative = `I am filing this complaint against ${furnisher} for violations of the Fair Credit Reporting Act.\n\n`;

    narrative += `WHAT HAPPENED:\n`;
    narrative += `On reviewing my credit reports, I discovered that ${furnisher} is reporting inaccurate information that is damaging my credit score. Specifically:\n\n`;

    violations.forEach((v, i) => {
        narrative += `${i + 1}. ${v.ruleName}: ${v.explanation}\n`;
    });

    narrative += `\nWHAT I WANT:\n`;
    narrative += `1. Complete deletion of this inaccurate tradeline from all credit bureaus\n`;
    narrative += `2. Written confirmation of the correction\n`;
    narrative += `3. An updated credit report reflecting the changes\n\n`;

    narrative += `STEPS ALREADY TAKEN:\n`;
    narrative += `I have attempted to resolve this matter directly but have not received satisfactory resolution. `;
    narrative += `The continued reporting of this inaccurate information is causing me ongoing financial harm.\n\n`;

    narrative += `This complaint is submitted in good faith and all information provided is accurate to the best of my knowledge.`;

    return narrative;
}
