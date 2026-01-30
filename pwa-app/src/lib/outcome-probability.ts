import { RuleFlag, RiskProfile } from './types';

export interface OutcomeProbability {
  score: number;
  label: 'low' | 'moderate' | 'strong' | 'very_strong';
  factors: string[];
}

export interface BureauWeights {
  experian: number;
  equifax: number;
  transunion: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function estimateOutcomeProbability(
  flags: RuleFlag[],
  riskProfile: RiskProfile,
  readiness: number,
  bureau?: string,
  weights?: BureauWeights
): OutcomeProbability {
  if (flags.length === 0) {
    return {
      score: 15,
      label: 'low',
      factors: ['No violations detected yet. Add evidence or re-run analysis.']
    };
  }

  const weights: Record<RuleFlag['severity'], number> = {
    critical: 1.25,
    high: 1.15,
    medium: 1,
    low: 0.9
  };

  const weighted = flags.reduce((sum, flag) => sum + flag.successProbability * weights[flag.severity], 0);
  const base = weighted / flags.length;
  const highCount = flags.filter(f => f.severity === 'high' || f.severity === 'critical').length;
  const severityBoost = Math.min(12, highCount * 3);
  const readinessBoost = Math.round(readiness * 0.2);
  const litigationBoost = riskProfile.litigationPotential ? 6 : 0;

  const bureauKey = (bureau || '').toLowerCase();
  const weight = weights && (bureauKey.includes('experian') ? weights.experian :
    bureauKey.includes('equifax') ? weights.equifax :
    bureauKey.includes('transunion') ? weights.transunion : 1);
  const score = clamp(Math.round((base + severityBoost + readinessBoost + litigationBoost - 5) * (weight || 1)), 5, 95);
  const label = score >= 80 ? 'very_strong' : score >= 65 ? 'strong' : score >= 45 ? 'moderate' : 'low';

  const factors: string[] = [];
  if (highCount > 0) {
    factors.push(`${highCount} high-severity violations increase leverage.`);
  }
  if (readiness < 50) {
    factors.push('Evidence readiness is low. Complete the checklist to boost outcomes.');
  } else {
    factors.push(`Evidence readiness at ${readiness}% supports stronger outcomes.`);
  }
  if (riskProfile.litigationPotential) {
    factors.push('Litigation potential flagged; escalation leverage improved.');
  }
  if (weight && weight !== 1) {
    factors.push(`Applied bureau weight ${weight.toFixed(2)} for ${bureau || 'bureau'}.`);
  }
  factors.push(`Average rule success probability ~${Math.round(base)}%.`);

  return { score, label, factors };
}
