import { CreditFields, RuleFlag, RiskProfile } from './rules';
import { buildDeadlineTracker } from './countdown';

export interface CaseHealth {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  readiness: number;
  riskLevel: 'low' | 'medium' | 'high';
  keyRisks: string[];
  recommendations: string[];
  summary: string;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function computeCaseHealth(
  fields: Partial<CreditFields>,
  flags: RuleFlag[],
  discoveryAnswers: Record<string, string>,
  riskProfile?: RiskProfile
): CaseHealth {
  const severityPenalty = flags.reduce((sum, flag) => {
    if (flag.severity === 'high') return sum + 15;
    if (flag.severity === 'medium') return sum + 8;
    return sum + 3;
  }, 0);

  const totalEvidence = Array.from(new Set(flags.flatMap(flag => flag.suggestedEvidence))).length;
  const checkedEvidence = Object.keys(discoveryAnswers).filter(key => key.startsWith('ev-') && discoveryAnswers[key] === 'checked').length;
  const readiness = totalEvidence > 0 ? Math.round((checkedEvidence / totalEvidence) * 100) : 0;

  let deadlinePenalty = 0;
  try {
    const tracker = buildDeadlineTracker(fields as CreditFields);
    deadlinePenalty = tracker.countdowns.reduce((sum, item) => {
      if (item.urgency === 'expired') return sum + 12;
      if (item.urgency === 'critical') return sum + 8;
      if (item.urgency === 'warning') return sum + 4;
      return sum;
    }, 0);
  } catch {
    deadlinePenalty = 6;
  }

  const missingKeyFields = ['dofd', 'dateLastPayment', 'stateCode'].filter(key => !fields[key as keyof CreditFields]);
  const missingPenalty = missingKeyFields.length * 6;

  const baseScore = 100 - severityPenalty - deadlinePenalty - missingPenalty;
  const score = clamp(Math.round(baseScore + readiness * 0.2), 15, 100);

  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  const riskLevel = score >= 80 ? 'low' : score >= 65 ? 'medium' : 'high';

  const keyRisks = [
    ...missingKeyFields.map(field => `Missing required field: ${field}`),
    ...flags.filter(flag => flag.severity === 'high').slice(0, 3).map(flag => `High severity: ${flag.ruleName}`)
  ].slice(0, 5);

  const recommendations = [
    readiness < 60 ? 'Complete evidence checklist to raise litigation readiness.' : 'Evidence readiness is strong. Continue documenting responses.',
    missingKeyFields.length > 0 ? 'Fill in missing dates/state to harden legal timing.' : 'Dates and jurisdiction look complete.',
    riskProfile?.litigationPotential ? 'Consider legal escalation planning and attorney handoff.' : 'Monitor dispute responses before escalation.'
  ];

  const summary = `Case health score is ${score}/100 (${grade}). Evidence readiness at ${readiness}%. Risk level: ${riskLevel}.`;

  return {
    score,
    grade,
    readiness,
    riskLevel,
    keyRisks,
    recommendations,
    summary
  };
}

export function formatExecutiveBrief(caseHealth: CaseHealth, fields: Partial<CreditFields>, flags: RuleFlag[]): string {
  const lines: string[] = [];

  lines.push('═'.repeat(70));
  lines.push('        EXECUTIVE CASE HEALTH BRIEF');
  lines.push('═'.repeat(70));
  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Account: ${fields.originalCreditor || fields.furnisherOrCollector || 'Unknown'}`);
  lines.push('');
  lines.push(`Score: ${caseHealth.score}/100`);
  lines.push(`Grade: ${caseHealth.grade}`);
  lines.push(`Risk Level: ${caseHealth.riskLevel.toUpperCase()}`);
  lines.push(`Evidence Readiness: ${caseHealth.readiness}%`);
  lines.push('');
  lines.push('SUMMARY');
  lines.push(caseHealth.summary);
  lines.push('');
  lines.push('KEY RISKS');
  caseHealth.keyRisks.forEach(item => lines.push(`- ${item}`));
  lines.push('');
  lines.push('RECOMMENDATIONS');
  caseHealth.recommendations.forEach(item => lines.push(`- ${item}`));
  lines.push('');
  lines.push('TOP VIOLATIONS');
  flags.slice(0, 5).forEach(flag => lines.push(`- ${flag.ruleName} (${flag.ruleId})`));

  return lines.join('\n');
}
