/**
 * Credit Score Impact Simulator
 * Predicts how removing negative items will affect credit scores
 * Uses industry-standard FICO scoring factor weights
 */

import { CreditFields, RuleFlag, RiskProfile } from './rules';

export interface ScoreFactorWeight {
    category: string;
    weight: number;
    description: string;
}

export interface RemovalSimulation {
    itemDescription: string;
    currentImpact: number;
    projectedScoreIncrease: {
        low: number;
        mid: number;
        high: number;
    };
    confidence: 'high' | 'medium' | 'low';
    timeToReflect: string;
    factors: string[];
}

export interface ScoreSimulationResult {
    currentEstimatedScore: number;
    currentScoreRange: string;
    projectedScoreAfterDisputes: {
        optimistic: number;
        realistic: number;
        conservative: number;
    };
    projectedScoreRange: string;
    totalPotentialIncrease: number;
    removalSimulations: RemovalSimulation[];
    categoryImpacts: CategoryImpact[];
    financialBenefits: FinancialBenefit[];
    timeline: ScoreTimeline[];
}

export interface CategoryImpact {
    category: string;
    currentStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'very poor';
    projectedStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'very poor';
    improvementPotential: number;
    recommendations: string[];
}

export interface FinancialBenefit {
    product: string;
    currentRate: string;
    projectedRate: string;
    monthlySavings: number;
    annualSavings: number;
    lifetimeSavings: number;
}

export interface ScoreTimeline {
    month: number;
    projectedScore: number;
    milestone: string | null;
}

// FICO Score Factor Weights (industry standard)
const FICO_WEIGHTS: ScoreFactorWeight[] = [
    { category: 'Payment History', weight: 0.35, description: '35% of score - Most important factor' },
    { category: 'Amounts Owed', weight: 0.30, description: '30% of score - Credit utilization ratio' },
    { category: 'Length of Credit History', weight: 0.15, description: '15% of score - Average age of accounts' },
    { category: 'Credit Mix', weight: 0.10, description: '10% of score - Variety of credit types' },
    { category: 'New Credit', weight: 0.10, description: '10% of score - Recent inquiries and new accounts' }
];

// Score ranges
const SCORE_RANGES = {
    exceptional: { min: 800, max: 850, label: 'Exceptional' },
    veryGood: { min: 740, max: 799, label: 'Very Good' },
    good: { min: 670, max: 739, label: 'Good' },
    fair: { min: 580, max: 669, label: 'Fair' },
    poor: { min: 300, max: 579, label: 'Poor' }
};

// Typical interest rate differences by score range
const RATE_IMPACTS = {
    mortgage: { poor: 7.5, fair: 6.8, good: 6.2, veryGood: 5.8, exceptional: 5.5 },
    autoLoan: { poor: 14.0, fair: 10.0, good: 6.5, veryGood: 5.0, exceptional: 4.0 },
    creditCard: { poor: 26.0, fair: 22.0, good: 18.0, veryGood: 15.0, exceptional: 12.0 },
    personalLoan: { poor: 18.0, fair: 14.0, good: 10.0, veryGood: 8.0, exceptional: 6.0 }
};

/**
 * Simulate the impact of removing negative items
 */
export function simulateScoreImpact(
    flags: RuleFlag[],
    fields: Partial<CreditFields>,
    riskProfile: RiskProfile
): ScoreSimulationResult {
    // Estimate current score based on violation severity
    const currentScore = estimateCurrentScore(flags, riskProfile);
    const currentRange = getScoreRangeLabel(currentScore);

    // Calculate removal simulations for each high-impact flag
    const removalSimulations = flags
        .filter(f => f.severity === 'high' || f.severity === 'medium')
        .map(flag => calculateRemovalImpact(flag, currentScore));

    // Calculate total potential increase
    const totalPotential = removalSimulations.reduce(
        (sum, sim) => sum + sim.projectedScoreIncrease.mid,
        0
    );

    // Project new scores
    const projectedOptimistic = Math.min(850, currentScore + totalPotential * 1.2);
    const projectedRealistic = Math.min(850, currentScore + totalPotential * 0.8);
    const projectedConservative = Math.min(850, currentScore + totalPotential * 0.5);

    // Calculate category impacts
    const categoryImpacts = calculateCategoryImpacts(flags, currentScore, projectedRealistic);

    // Calculate financial benefits
    const financialBenefits = calculateFinancialBenefits(currentScore, projectedRealistic);

    // Generate timeline
    const timeline = generateScoreTimeline(currentScore, projectedRealistic);

    return {
        currentEstimatedScore: currentScore,
        currentScoreRange: currentRange,
        projectedScoreAfterDisputes: {
            optimistic: Math.round(projectedOptimistic),
            realistic: Math.round(projectedRealistic),
            conservative: Math.round(projectedConservative)
        },
        projectedScoreRange: getScoreRangeLabel(projectedRealistic),
        totalPotentialIncrease: Math.round(totalPotential),
        removalSimulations,
        categoryImpacts,
        financialBenefits,
        timeline
    };
}

function estimateCurrentScore(flags: RuleFlag[], riskProfile: RiskProfile): number {
    // Base score estimation using risk profile
    let baseScore = 650; // Average starting point

    // Adjust based on risk level
    switch (riskProfile.riskLevel) {
        case 'critical': baseScore = 520; break;
        case 'high': baseScore = 580; break;
        case 'medium': baseScore = 620; break;
        case 'low': baseScore = 680; break;
    }

    // Further adjust based on violation count
    const highSeverityCount = flags.filter(f => f.severity === 'high').length;
    const mediumSeverityCount = flags.filter(f => f.severity === 'medium').length;

    baseScore -= highSeverityCount * 15;
    baseScore -= mediumSeverityCount * 5;

    return Math.max(300, Math.min(850, baseScore));
}

function calculateRemovalImpact(flag: RuleFlag, currentScore: number): RemovalSimulation {
    // Base impact calculation
    let baseImpact = 0;
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    // Determine impact based on violation type
    if (flag.ruleId.startsWith('B') || flag.ruleId.startsWith('K')) {
        // Re-aging violations have high impact
        baseImpact = 45;
        confidence = 'high';
    } else if (flag.severity === 'high') {
        baseImpact = 35;
        confidence = 'high';
    } else if (flag.severity === 'medium') {
        baseImpact = 20;
        confidence = 'medium';
    } else {
        baseImpact = 10;
        confidence = 'low';
    }

    // Adjust based on current score (lower scores see bigger jumps)
    const scoreMultiplier = currentScore < 600 ? 1.3 : currentScore < 700 ? 1.0 : 0.7;
    const adjustedImpact = baseImpact * scoreMultiplier;

    return {
        itemDescription: flag.ruleName,
        currentImpact: -Math.round(adjustedImpact),
        projectedScoreIncrease: {
            low: Math.round(adjustedImpact * 0.5),
            mid: Math.round(adjustedImpact * 0.8),
            high: Math.round(adjustedImpact * 1.2)
        },
        confidence,
        timeToReflect: flag.severity === 'high' ? '30-45 days' : '45-60 days',
        factors: [
            `${flag.severity.toUpperCase()} severity violation`,
            `Success probability: ${flag.successProbability}%`,
            confidence === 'high' ? 'Strong legal basis for removal' : 'Moderate removal likelihood'
        ]
    };
}

function getScoreRangeLabel(score: number): string {
    if (score >= 800) return 'Exceptional (800-850)';
    if (score >= 740) return 'Very Good (740-799)';
    if (score >= 670) return 'Good (670-739)';
    if (score >= 580) return 'Fair (580-669)';
    return 'Poor (300-579)';
}

function calculateCategoryImpacts(
    flags: RuleFlag[],
    currentScore: number,
    projectedScore: number
): CategoryImpact[] {
    const getStatus = (score: number): CategoryImpact['currentStatus'] => {
        if (score >= 800) return 'excellent';
        if (score >= 740) return 'good';
        if (score >= 670) return 'fair';
        if (score >= 580) return 'poor';
        return 'very poor';
    };

    return [
        {
            category: 'Payment History',
            currentStatus: getStatus(currentScore - 20),
            projectedStatus: getStatus(projectedScore),
            improvementPotential: 35,
            recommendations: [
                'Dispute inaccurate late payment records',
                'Request goodwill adjustments for isolated incidents',
                'Verify all delinquency dates are accurate'
            ]
        },
        {
            category: 'Amounts Owed',
            currentStatus: getStatus(currentScore),
            projectedStatus: getStatus(projectedScore + 10),
            improvementPotential: 25,
            recommendations: [
                'Dispute incorrect balance amounts',
                'Challenge accounts reporting wrong credit limits',
                'Remove duplicate collection accounts'
            ]
        },
        {
            category: 'Credit History Length',
            currentStatus: getStatus(currentScore + 10),
            projectedStatus: getStatus(projectedScore + 10),
            improvementPotential: 10,
            recommendations: [
                'Keep oldest accounts open',
                'Dispute incorrectly reported account ages'
            ]
        },
        {
            category: 'Credit Mix',
            currentStatus: 'fair',
            projectedStatus: 'good',
            improvementPotential: 5,
            recommendations: [
                'Maintain diverse credit types after disputes resolve'
            ]
        }
    ];
}

function calculateFinancialBenefits(currentScore: number, projectedScore: number): FinancialBenefit[] {
    const getCurrentRange = (score: number) => {
        if (score >= 800) return 'exceptional';
        if (score >= 740) return 'veryGood';
        if (score >= 670) return 'good';
        if (score >= 580) return 'fair';
        return 'poor';
    };

    const currentRange = getCurrentRange(currentScore);
    const projectedRange = getCurrentRange(projectedScore);

    const benefits: FinancialBenefit[] = [];

    // Mortgage calculation (30-year, 300,000 units loan)
    const mortgageAmount = 300000;
    const currentMortgageRate = RATE_IMPACTS.mortgage[currentRange as keyof typeof RATE_IMPACTS.mortgage];
    const projectedMortgageRate = RATE_IMPACTS.mortgage[projectedRange as keyof typeof RATE_IMPACTS.mortgage];
    const currentMortgagePayment = calculateMonthlyPayment(mortgageAmount, currentMortgageRate, 360);
    const projectedMortgagePayment = calculateMonthlyPayment(mortgageAmount, projectedMortgageRate, 360);

    benefits.push({
        product: '30-Year Mortgage (300K units)',
        currentRate: `${currentMortgageRate}%`,
        projectedRate: `${projectedMortgageRate}%`,
        monthlySavings: Math.round(currentMortgagePayment - projectedMortgagePayment),
        annualSavings: Math.round((currentMortgagePayment - projectedMortgagePayment) * 12),
        lifetimeSavings: Math.round((currentMortgagePayment - projectedMortgagePayment) * 360)
    });

    // Auto loan calculation (5-year, 35,000 units loan)
    const autoAmount = 35000;
    const currentAutoRate = RATE_IMPACTS.autoLoan[currentRange as keyof typeof RATE_IMPACTS.autoLoan];
    const projectedAutoRate = RATE_IMPACTS.autoLoan[projectedRange as keyof typeof RATE_IMPACTS.autoLoan];
    const currentAutoPayment = calculateMonthlyPayment(autoAmount, currentAutoRate, 60);
    const projectedAutoPayment = calculateMonthlyPayment(autoAmount, projectedAutoRate, 60);

    benefits.push({
        product: '5-Year Auto Loan (35K units)',
        currentRate: `${currentAutoRate}%`,
        projectedRate: `${projectedAutoRate}%`,
        monthlySavings: Math.round(currentAutoPayment - projectedAutoPayment),
        annualSavings: Math.round((currentAutoPayment - projectedAutoPayment) * 12),
        lifetimeSavings: Math.round((currentAutoPayment - projectedAutoPayment) * 60)
    });

    // Credit card calculation (average 5,000 units balance)
    const ccBalance = 5000;
    const currentCCRate = RATE_IMPACTS.creditCard[currentRange as keyof typeof RATE_IMPACTS.creditCard];
    const projectedCCRate = RATE_IMPACTS.creditCard[projectedRange as keyof typeof RATE_IMPACTS.creditCard];
    const currentCCInterest = (ccBalance * currentCCRate) / 100 / 12;
    const projectedCCInterest = (ccBalance * projectedCCRate) / 100 / 12;

    benefits.push({
        product: 'Credit Card (5K value Balance)',
        currentRate: `${currentCCRate}% APR`,
        projectedRate: `${projectedCCRate}% APR`,
        monthlySavings: Math.round(currentCCInterest - projectedCCInterest),
        annualSavings: Math.round((currentCCInterest - projectedCCInterest) * 12),
        lifetimeSavings: Math.round((currentCCInterest - projectedCCInterest) * 36)
    });

    return benefits;
}

function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function generateScoreTimeline(currentScore: number, targetScore: number): ScoreTimeline[] {
    const timeline: ScoreTimeline[] = [];
    const totalMonths = 12;
    const scoreIncrease = targetScore - currentScore;

    for (let month = 0; month <= totalMonths; month++) {
        // Score improvement follows a logarithmic curve (faster early gains)
        const progressRatio = Math.log(month + 1) / Math.log(totalMonths + 1);
        const projectedScore = Math.round(currentScore + scoreIncrease * progressRatio);

        let milestone: string | null = null;
        if (month === 0) milestone = 'Current Score';
        else if (month === 1) milestone = 'Disputes Initiated';
        else if (month === 2) milestone = 'First Responses Expected';
        else if (month === 3) milestone = 'Initial Removals Reflected';
        else if (month === 6) milestone = 'Mid-Term Review';
        else if (month === 12) milestone = 'Full Score Recovery Potential';

        timeline.push({ month, projectedScore, milestone });
    }

    return timeline;
}

/**
 * Get FICO factor weights for display
 */
export function getFICOWeights(): ScoreFactorWeight[] {
    return FICO_WEIGHTS;
}

/**
 * Calculate the score category jump (e.g., "Fair" to "Good")
 */
export function calculateCategoryJump(currentScore: number, projectedScore: number): {
    currentCategory: string;
    projectedCategory: string;
    categoriesJumped: number;
} {
    const categories = ['Poor', 'Fair', 'Good', 'Very Good', 'Exceptional'];
    const thresholds = [580, 670, 740, 800];

    const getCategory = (score: number) => {
        if (score >= 800) return 4;
        if (score >= 740) return 3;
        if (score >= 670) return 2;
        if (score >= 580) return 1;
        return 0;
    };

    const currentIdx = getCategory(currentScore);
    const projectedIdx = getCategory(projectedScore);

    return {
        currentCategory: categories[currentIdx],
        projectedCategory: categories[projectedIdx],
        categoriesJumped: projectedIdx - currentIdx
    };
}
