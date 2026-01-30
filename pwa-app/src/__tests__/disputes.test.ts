import { generateDisputeLetter, generateValidationLetter, generateCeaseDesistLetter, getLetterRecommendations } from '../lib/disputes';
import { RuleFlag } from '../lib/rules';

describe('dispute letter generator', () => {
  const sampleFields = {
    originalCreditor: 'Target Bank',
    furnisherOrCollector: 'Bad Collection',
    currentBalance: '1,000'
  };

  const sampleFlags: RuleFlag[] = [
    {
      ruleId: 'B1',
      ruleName: 'Re-aging',
      severity: 'high',
      explanation: 'Account was re-aged.',
      whyItMatters: 'Legal limit exceeded.',
      suggestedEvidence: ['Old reports'],
      fieldValues: {},
      legalCitations: ['FCRA 605'],
      successProbability: 90
    }
  ];

  const sampleConsumer = {
    name: 'John Doe',
    address: '123 Main St',
    city: 'Anytown',
    state: 'NY',
    zip: '12345'
  };

  test('generateDisputeLetter creates valid bureau letter', () => {
    const config = {
      type: 'bureau' as const,
      bureau: 'experian' as const,
      tone: 'firm' as const,
      includeEvidence: true,
      requestMethod: true,
      demandDeletion: true,
      mentionLitigation: true,
      includeStateLaw: true,
      language: 'en' as const
    };
    const letter = generateDisputeLetter(sampleFields, sampleFlags, sampleConsumer, config);
    expect(letter).toContain('John Doe');
    expect(letter).toContain('Experian');
    expect(letter).toContain('Fair Credit Reporting Act');
    expect(letter).toContain('Re-aging');
    expect(letter).toContain('SUPPORTING EVIDENCE');
  });

  test('generateValidationLetter creates valid request', () => {
    const letter = generateValidationLetter(sampleFields, sampleConsumer, { tone: 'legal' });
    expect(letter).toContain('DEBT VALIDATION REQUEST');
    expect(letter).toContain('Bad Collection');
    expect(letter).toContain('15 U.S.C. § 1692g');
  });

  test('generateCeaseDesistLetter creates valid notice', () => {
    const letter = generateCeaseDesistLetter(sampleFields, sampleConsumer, ['HARASSMENT', 'SOL EXPIRED']);
    expect(letter).toContain('CEASE AND DESIST');
    expect(letter).toContain('HARASSMENT');
  });

  test('getLetterRecommendations returns appropriate types', () => {
    const recommendations = getLetterRecommendations(sampleFlags);
    expect(recommendations.some(r => r.type === 'bureau')).toBe(true);
  });
});
