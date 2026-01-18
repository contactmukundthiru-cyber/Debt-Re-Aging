import { calculateDamages } from '../lib/damages-calculator';
import { RuleFlag } from '../lib/rules';
import { DetectedPattern } from '../lib/pattern-engine';
import { AdvancedRuleFlag } from '../lib/rules-advanced';

describe('damages calculator', () => {
  const sampleFlags: AdvancedRuleFlag[] = [
    {
      ruleId: 'B1-ADV',
      ruleName: 'Re-aging',
      severity: 'critical',
      explanation: 'Account was re-aged.',
      whyItMatters: 'Legal limit exceeded.',
      suggestedEvidence: ['Old reports'],
      fieldValues: {},
      legalCitations: ['FCRA 605'],
      successProbability: 90,
      willfulnessScore: 95,
      statutoryDamageRange: { min: 100, max: 1000 },
      actualDamageCategories: [],
      chainOfCustodyIssue: false,
      crossBureauContradiction: false,
      forensicConfidence: 90,
      relatedRules: [],
      remediation: '',
      timeToFile: 730
    }
  ];

  const samplePatterns: DetectedPattern[] = [
    {
      pattern: {
        id: 'REAGING_CLASSIC',
        name: 'Classic Re-aging',
        description: 'Desc',
        severity: 'critical',
        requiredSignals: [],
        optionalSignals: [],
        minimumConfidence: 75,
        legalBasis: [],
        damages: {
          statutory: { min: 100, max: 1000 },
          actualCategories: ['Credit denial'],
          punitiveEligible: true,
          classActionPotential: true
        },
        recommendations: []
      },
      confidence: 90,
      matchedSignals: [],
      evidence: [],
      riskScore: 80,
      litigationValue: 5000,
      urgency: 'high',
      narrative: 'Strong pattern'
    }
  ];

  test('calculateDamages returns complete structure', () => {
    const result = calculateDamages(sampleFlags, samplePatterns, { stateCode: 'NY' });
    expect(result.total.expected).toBeGreaterThan(0);
    expect(result.statutory.violationCount).toBe(1);
    expect(result.actual.total).toBeGreaterThan(0);
    expect(result.punitive.eligible).toBe(true);
  });

  test('calculateDamages handles emotional distress', () => {
    const result = calculateDamages(sampleFlags, samplePatterns, { emotionalDistressLevel: 'severe' });
    expect(result.actual.emotionalDistress).toBeGreaterThan(0);
  });

  test('calculateDamages handles credit denials', () => {
    const result = calculateDamages(sampleFlags, samplePatterns, { creditDenials: 2 });
    expect(result.actual.creditDenials).toBeGreaterThan(0);
  });
});
