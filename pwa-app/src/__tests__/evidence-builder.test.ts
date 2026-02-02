import { buildEvidencePackage, formatEvidencePackage } from '../lib/evidence-builder';
import { CreditFields, RuleFlag, RiskProfile } from '../lib/rules';

describe('evidence builder', () => {
  const sampleFields: CreditFields = {
    originalCreditor: 'Target Bank',
    furnisherOrCollector: 'Bad Collection',
    currentValue: '1000',
    dofd: '2020-01-01',
    dateOpened: '2019-01-01'
  };

  const sampleFlags: RuleFlag[] = [
    {
      ruleId: 'B1',
      ruleName: 'Re-aging',
      severity: 'high',
      category: 'violation',
      confidence: 90,
      explanation: 'Account was re-aged.',
      whyItMatters: 'Legal limit exceeded.',
      suggestedEvidence: ['Old reports'],
      fieldValues: {},
      legalCitations: ['FCRA §605'],
      successProbability: 90
    }
  ];

  const sampleRisk: RiskProfile = {
    overallScore: 80,
    riskLevel: 'critical',
    disputeStrength: 'strong',
    summary: 'Test summary',
    litigationPotential: true,
    detectedPatterns: [],
    keyViolations: ['Re-aging'],
    recommendedApproach: 'Go to court.',
    scoreBreakdown: []
  };

  test('buildEvidencePackage creates complete structure', () => {
    const pkg = buildEvidencePackage(sampleFields, sampleFlags, sampleRisk, 'John Doe', 'NY');
    expect(pkg.caseId).toContain('CASE-');
    expect(pkg.consumer.name).toBe('John Doe');
    expect(pkg.account.creditor).toBe('Target Bank');
    expect(pkg.violations.length).toBe(1);
    expect(pkg.timeline.length).toBeGreaterThan(0);
    expect(pkg.legalBasis.length).toBeGreaterThan(0);
  });

  test('formatEvidencePackage returns formatted string', () => {
    const pkg = buildEvidencePackage(sampleFields, sampleFlags, sampleRisk, 'John Doe', 'NY');
    const formatted = formatEvidencePackage(pkg);
    expect(formatted).toContain('EVIDENCE PACKAGE');
    expect(formatted).toContain('John Doe');
    expect(formatted).toContain('Target Bank');
    expect(formatted).toContain('DOCUMENTED VIOLATIONS');
    expect(formatted).toContain('ACCOUNT INFORMATION');
  });
});
