/**
 * Credit Score Impact Estimator
 * Estimates potential credit score improvement from removing violations
 */

import { CreditFields, RuleFlag } from './types';

export interface ScoreFactors {
  paymentHistory: number;      // 35%
  amountsOwed: number;         // 30%
  creditLength: number;        // 15%
  newCredit: number;           // 10%
  creditMix: number;           // 10%
}

export interface ScoreImpactEstimate {
  currentEstimatedRange: { low: number; high: number };
  potentialRange: { low: number; high: number };
  improvement: { min: number; max: number };
  factors: ImpactFactor[];
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
  disclaimer: string;
  simulationResults?: SimulationResult[];
}

export interface SimulationResult {
  action: string;
  pointsGain: number;
  newRange: { low: number; high: number };
}

/**
 * Simulate the impact of specific actions
 */
export function simulateActions(
  impact: ScoreImpactEstimate,
  actions: string[]
): SimulationResult[] {
  const baseScore = impact.currentEstimatedRange.low;
  return actions.map(action => {
    let gain = 0;
    if (action.includes('Delete Collection')) gain = 45;
    else if (action.includes('Correct DOFD')) gain = 25;
    else if (action.includes('Remove Late Payment')) gain = 15;
    else gain = 10;

    return {
      action,
      pointsGain: gain,
      newRange: {
        low: Math.min(850, baseScore + gain),
        high: Math.min(850, impact.currentEstimatedRange.high + gain + 10)
      }
    };
  });
}

export interface ImpactFactor {
  factor: string;
  currentImpact: 'severe' | 'moderate' | 'minimal';
  potentialImprovement: number;
  explanation: string;
}

export interface ScoreRange {
  min: number;
  max: number;
  category: 'poor' | 'fair' | 'good' | 'very_good' | 'excellent';
  description: string;
}

const SCORE_CATEGORIES: ScoreRange[] = [
  { min: 300, max: 579, category: 'poor', description: 'Poor - High risk, limited credit options' },
  { min: 580, max: 669, category: 'fair', description: 'Fair - Below average, subprime rates' },
  { min: 670, max: 739, category: 'good', description: 'Good - Near or slightly above average' },
  { min: 740, max: 799, category: 'very_good', description: 'Very Good - Above average, better rates' },
  { min: 800, max: 850, category: 'excellent', description: 'Excellent - Top tier, best rates' },
];

/**
 * Estimate credit score impact from removing negative tradeline
 */
export function estimateScoreImpact(
  fields: CreditFields,
  flags: RuleFlag[],
  currentScoreEstimate?: number
): ScoreImpactEstimate {
  const factors: ImpactFactor[] = [];

  // Estimate current impact of this tradeline
  const currentImpact = estimateCurrentImpact(fields, flags);

  // Calculate potential improvement per factor
  const paymentHistoryGain = calculatePaymentHistoryGain(fields, flags);
  const amountsOwedGain = calculateAmountsOwedGain(fields);
  const lengthGain = calculateLengthGain(fields);

  factors.push({
    factor: 'Payment History (35% of score)',
    currentImpact: paymentHistoryGain > 30 ? 'severe' : paymentHistoryGain > 15 ? 'moderate' : 'minimal',
    potentialImprovement: paymentHistoryGain,
    explanation: getPaymentHistoryExplanation(fields, flags)
  });

  factors.push({
    factor: 'Amounts Owed (30% of score)',
    currentImpact: amountsOwedGain > 20 ? 'severe' : amountsOwedGain > 10 ? 'moderate' : 'minimal',
    potentialImprovement: amountsOwedGain,
    explanation: getAmountsOwedExplanation(fields)
  });

  factors.push({
    factor: 'Length of Credit History (15%)',
    currentImpact: lengthGain > 10 ? 'moderate' : 'minimal',
    potentialImprovement: lengthGain,
    explanation: getLengthExplanation(fields)
  });

  // Calculate total potential improvement
  const totalMinImprovement = Math.round(
    (paymentHistoryGain * 0.6) + (amountsOwedGain * 0.5) + (lengthGain * 0.3)
  );
  const totalMaxImprovement = Math.round(
    paymentHistoryGain + amountsOwedGain + lengthGain
  );

  // Estimate ranges
  const baseEstimate = currentScoreEstimate || estimateBaseScore(fields, flags);

  return {
    currentEstimatedRange: {
      low: Math.max(300, baseEstimate - 30),
      high: Math.min(850, baseEstimate + 30)
    },
    potentialRange: {
      low: Math.max(300, baseEstimate + totalMinImprovement - 15),
      high: Math.min(850, baseEstimate + totalMaxImprovement + 15)
    },
    improvement: {
      min: totalMinImprovement,
      max: totalMaxImprovement
    },
    factors,
    confidence: calculateConfidence(fields, flags),
    methodology: METHODOLOGY,
    disclaimer: DISCLAIMER
  };
}

/**
 * Estimate current impact of tradeline
 */
function estimateCurrentImpact(fields: CreditFields, flags: RuleFlag[]): number {
  let impact = 0;

  // Collection/Charge-off base impact
  const accountType = (fields.accountType || '').toLowerCase();
  if (accountType.includes('collection')) {
    impact += 50;
  } else if (accountType.includes('charge')) {
    impact += 40;
  }

  // Recency factor
  if (fields.dofd) {
    const dofd = new Date(fields.dofd);
    const monthsAgo = (Date.now() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 12) {
      impact += 30; // Recent negative has severe impact
    } else if (monthsAgo < 24) {
      impact += 20;
    } else if (monthsAgo < 48) {
      impact += 10;
    }
    // Older negatives have diminishing impact
  }

  // Balance factor
  const balance = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
  if (balance > 5000) {
    impact += 15;
  } else if (balance > 1000) {
    impact += 10;
  } else if (balance > 0) {
    impact += 5;
  }

  return impact;
}

/**
 * Calculate payment history improvement
 */
function calculatePaymentHistoryGain(fields: CreditFields, flags: RuleFlag[]): number {
  let gain = 0;

  const accountType = (fields.accountType || '').toLowerCase();
  const status = (fields.accountStatus || '').toLowerCase();
  const history = (fields.paymentHistory || '').toUpperCase();

  // Collection account removal
  if (accountType.includes('collection')) {
    gain += 40;
  }

  // Charge-off removal
  if (accountType.includes('charge') || status.includes('charged off')) {
    gain += 35;
  }

  // Late payment history
  if (history.includes('30') || history.includes('60') || history.includes('90') || history.includes('CO')) {
    gain += 20;
  }

  // Re-aging detection adds extra impact (shows longer delinquency period)
  if (flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId))) {
    gain += 10;
  }

  // Recency adjustment
  if (fields.dofd) {
    const dofd = new Date(fields.dofd);
    const monthsAgo = (Date.now() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 24) {
      gain = Math.round(gain * 1.3); // Recent items have more impact when removed
    } else if (monthsAgo > 60) {
      gain = Math.round(gain * 0.7); // Older items have less impact
    }
  }

  return Math.min(gain, 80); // Cap at 80 points
}

/**
 * Calculate amounts owed improvement
 */
function calculateAmountsOwedGain(fields: CreditFields): number {
  let gain = 0;

  const balance = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));
  const original = parseFloat((fields.originalAmount || '0').replace(/[$,]/g, ''));

  if (balance > 0) {
    // Removing reported balance improves debt-to-credit ratio
    if (balance > 10000) {
      gain += 25;
    } else if (balance > 5000) {
      gain += 20;
    } else if (balance > 2000) {
      gain += 15;
    } else if (balance > 500) {
      gain += 10;
    } else {
      gain += 5;
    }
  }

  // Collection accounts always hurt amounts owed category
  if ((fields.accountType || '').toLowerCase().includes('collection')) {
    gain += 10;
  }

  return Math.min(gain, 40); // Cap at 40 points
}

/**
 * Calculate credit length improvement
 */
function calculateLengthGain(fields: CreditFields): number {
  // Removing a derogatory account might not help credit length much
  // unless it's one of your oldest accounts
  return 5; // Minimal impact on average age of accounts
}

/**
 * Get payment history explanation
 */
function getPaymentHistoryExplanation(fields: CreditFields, flags: RuleFlag[]): string {
  const accountType = (fields.accountType || '').toLowerCase();

  if (accountType.includes('collection')) {
    return 'Collection accounts severely impact payment history. Removal could significantly improve this factor.';
  } else if (accountType.includes('charge')) {
    return 'Charge-offs are one of the most damaging items. Removal would provide substantial improvement.';
  } else {
    return 'Late payments negatively affect payment history. Removing this tradeline improves your record.';
  }
}

/**
 * Get amounts owed explanation
 */
function getAmountsOwedExplanation(fields: CreditFields): string {
  const balance = parseFloat((fields.currentBalance || '0').replace(/[$,]/g, ''));

  if (balance > 5000) {
    return `The $${balance.toLocaleString()} reported balance significantly impacts your debt burden calculation.`;
  } else if (balance > 0) {
    return 'Even small collection balances count against your amounts owed category.';
  } else {
    return 'Zero balance tradelines have minimal impact on amounts owed.';
  }
}

/**
 * Get length explanation
 */
function getLengthExplanation(fields: CreditFields): string {
  return 'Impact on average account age depends on your other accounts. Typically minimal effect.';
}

/**
 * Estimate base score from available data
 */
export function estimateBaseScore(fields: CreditFields, flags: RuleFlag[]): number {
  // Start at median
  let estimate = 650;

  // Collection/charge-off presence suggests lower score
  const accountType = (fields.accountType || '').toLowerCase();
  if (accountType.includes('collection')) {
    estimate -= 80;
  } else if (accountType.includes('charge')) {
    estimate -= 60;
  }

  // Multiple high-severity violations suggest worse situation
  const highCount = flags.filter(f => f.severity === 'high').length;
  estimate -= highCount * 15;

  // Recent delinquency
  if (fields.dofd) {
    const dofd = new Date(fields.dofd);
    const monthsAgo = (Date.now() - dofd.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 12) {
      estimate -= 30;
    } else if (monthsAgo < 24) {
      estimate -= 15;
    }
  }

  // Bound the estimate
  return Math.max(350, Math.min(700, estimate));
}

/**
 * Calculate confidence level
 */
function calculateConfidence(fields: CreditFields, flags: RuleFlag[]): 'high' | 'medium' | 'low' {
  let confidence = 0;

  // More data = higher confidence
  if (fields.dofd) confidence++;
  if (fields.currentBalance) confidence++;
  if (fields.accountType) confidence++;
  if (fields.accountStatus) confidence++;
  if (fields.chargeOffDate) confidence++;
  if (fields.paymentHistory) confidence++;

  if (confidence >= 5) return 'high';
  if (confidence >= 3) return 'medium';
  return 'low';
}

/**
 * Get score category
 */
export function getScoreCategory(score: number): ScoreRange {
  return SCORE_CATEGORIES.find(cat => score >= cat.min && score <= cat.max) || SCORE_CATEGORIES[0];
}

/**
 * Calculate improvement category jump
 */
export function calculateCategoryJump(
  currentLow: number,
  potentialHigh: number
): { categories: number; fromCategory: string; toCategory: string } {
  const fromCat = getScoreCategory(currentLow);
  const toCat = getScoreCategory(potentialHigh);

  const catOrder = ['poor', 'fair', 'good', 'very_good', 'excellent'];
  const fromIndex = catOrder.indexOf(fromCat.category);
  const toIndex = catOrder.indexOf(toCat.category);

  return {
    categories: toIndex - fromIndex,
    fromCategory: fromCat.description,
    toCategory: toCat.description
  };
}

/**
 * Estimate financial impact of score improvement
 */
export function estimateFinancialImpact(
  scoreImprovement: number,
  loanType: 'mortgage' | 'auto' | 'credit_card' | 'personal'
): {
  interestSavings: string;
  monthlyPaymentReduction: string;
  totalSavings: string;
  explanation: string;
} {
  // Approximate interest rate improvements per 20 points
  const rateImprovementPer20Points: Record<string, number> = {
    mortgage: 0.125, // 0.125% per 20 points
    auto: 0.5,       // 0.5% per 20 points
    credit_card: 2,  // 2% per 20 points
    personal: 1.5    // 1.5% per 20 points
  };

  const averageLoanAmounts: Record<string, number> = {
    mortgage: 300000,
    auto: 35000,
    credit_card: 5000,
    personal: 15000
  };

  const loanTermsMonths: Record<string, number> = {
    mortgage: 360, // 30 years
    auto: 60,      // 5 years
    credit_card: 36, // 3 years payoff
    personal: 48    // 4 years
  };

  const rateImprovement = (scoreImprovement / 20) * rateImprovementPer20Points[loanType];
  const loanAmount = averageLoanAmounts[loanType];
  const termMonths = loanTermsMonths[loanType];

  // Simplified interest calculation
  const interestSavings = (loanAmount * (rateImprovement / 100) * (termMonths / 12));
  const monthlySavings = interestSavings / termMonths;

  return {
    interestSavings: `${rateImprovement.toFixed(2)}% lower rate`,
    monthlyPaymentReduction: `$${monthlySavings.toFixed(0)}/month`,
    totalSavings: `$${interestSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} over loan term`,
    explanation: `A ${scoreImprovement}-point score increase could save approximately ${rateImprovement.toFixed(2)}% on ${loanType} interest rates.`
  };
}

/**
 * Generate score impact report
 */
export function generateScoreImpactReport(impact: ScoreImpactEstimate): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('      CREDIT SCORE IMPACT ANALYSIS');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push('CURRENT ESTIMATED SCORE RANGE:');
  lines.push(`  ${impact.currentEstimatedRange.low} - ${impact.currentEstimatedRange.high}`);
  lines.push(`  Category: ${getScoreCategory(impact.currentEstimatedRange.low).description}`);
  lines.push('');
  lines.push('POTENTIAL SCORE AFTER REMOVAL:');
  lines.push(`  ${impact.potentialRange.low} - ${impact.potentialRange.high}`);
  lines.push(`  Category: ${getScoreCategory(impact.potentialRange.high).description}`);
  lines.push('');
  lines.push(`ESTIMATED IMPROVEMENT: ${impact.improvement.min} - ${impact.improvement.max} points`);
  lines.push(`Analysis Confidence: ${impact.confidence.toUpperCase()}`);
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('FACTOR ANALYSIS:');
  lines.push('─'.repeat(60));
  impact.factors.forEach(f => {
    lines.push(`\n${f.factor}`);
    lines.push(`  Current Impact: ${f.currentImpact.toUpperCase()}`);
    lines.push(`  Potential Improvement: ${f.potentialImprovement} points`);
    lines.push(`  ${f.explanation}`);
  });
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('DISCLAIMER:');
  lines.push('─'.repeat(60));
  lines.push(impact.disclaimer);

  return lines.join('\n');
}

const METHODOLOGY = `
Score impact estimates are based on publicly available FICO scoring
factor weights: Payment History (35%), Amounts Owed (30%), Length of
Credit History (15%), New Credit (10%), Credit Mix (10%). Individual
results vary significantly based on complete credit profile.
`.trim();

const DISCLAIMER = `
This is an ESTIMATE only. Actual credit score impacts depend on your
complete credit profile, which is not available to this tool. Credit
scoring models are proprietary and results may differ. This analysis
is for educational purposes only and does not guarantee any specific
score change. Consult a credit professional for personalized advice.
`.trim();
