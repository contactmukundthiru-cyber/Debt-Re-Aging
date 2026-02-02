import { detectPatterns } from '../lib/pattern-engine';
import { CreditFields, RuleFlag } from '../lib/rules';

describe('pattern engine', () => {
  const sampleFields: CreditFields = {
    dofd: '2015-01-01',
    dateOpened: '2016-01-01',
    estimatedRemovalDate: '2025-01-01'
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
      legalCitations: ['FCRA 605'],
      successProbability: 90
    }
  ];

  test('detectPatterns identifies re-aging', () => {
    // B1 flag adds DOFD_MISMATCH
    // fields.estimatedRemovalDate > dofd + 7.5y adds REMOVAL_DATE_EXTENDED
    // currentValue > originalAmount * 1.5 adds BALANCE_EXCEEDS_ORIGINAL_SIGNIFICANTLY
    const fieldsWithBalance = {
      ...sampleFields,
      currentValue: '3000',
      originalAmount: '1000'
    };
    const result = detectPatterns(fieldsWithBalance, sampleFlags);
    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.patterns.some(p => p.pattern.id === 'REAGING_CLASSIC')).toBe(true);
  });

  test('detectPatterns handles medical debt', () => {
    const medicalFields: CreditFields = {
      accountType: 'medical',
      currentValue: '250' // < 500
    };
    const medicalFlags: RuleFlag[] = [
      {
        ruleId: 'H1',
        ruleName: 'Premature',
        severity: 'high',
        category: 'violation',
        confidence: 90,
        explanation: '< 365 days.',
        whyItMatters: 'Policy.',
        suggestedEvidence: [],
        fieldValues: {},
        legalCitations: [],
        successProbability: 99
      },
      {
        ruleId: 'H2',
        ruleName: 'Under 500',
        severity: 'high',
        category: 'violation',
        confidence: 90,
        explanation: 'Under 500.',
        whyItMatters: 'Policy.',
        suggestedEvidence: [],
        fieldValues: {},
        legalCitations: [],
        successProbability: 99
      }
    ];
    const result = detectPatterns(medicalFields, medicalFlags);
    expect(result.patterns.some(p => p.pattern.id === 'MEDICAL_IMPROPER_REPORTING')).toBe(true);
  });

  test('detectPatterns with no patterns', () => {
    const cleanFields = { dofd: '2023-01-01' };
    const result = detectPatterns(cleanFields, []);
    expect(result.patterns.length).toBe(0);
    expect(result.narrative).toContain('No significant violation patterns');
  });
});
