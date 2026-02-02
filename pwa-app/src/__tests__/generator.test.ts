import { generateBureauLetter, generateValidationLetter, generateCaseSummary, generateCFPBNarrative, generateForensicReport, generatePDFLetter } from '../lib/generator';
import { CreditFields, RuleFlag, RiskProfile } from '../lib/rules';

// Mock jsPDF
const mockJsPDF = {
  setFont: jest.fn().mockReturnThis(),
  setFontSize: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis(),
  splitTextToSize: jest.fn().mockReturnValue(['line1', 'line2']),
  setFillColor: jest.fn().mockReturnThis(),
  setTextColor: jest.fn().mockReturnThis(),
  setDrawColor: jest.fn().mockReturnThis(),
  setLineWidth: jest.fn().mockReturnThis(),
  line: jest.fn().mockReturnThis(),
  rect: jest.fn().mockReturnThis(),
  addPage: jest.fn().mockReturnThis(),
  setPage: jest.fn().mockReturnThis(),
  autoTable: jest.fn().mockReturnThis(),
  lastAutoTable: { finalY: 100 },
  internal: {
    getNumberOfPages: jest.fn().mockReturnValue(1),
    pageSize: {
      getWidth: jest.fn().mockReturnValue(210),
      getHeight: jest.fn().mockReturnValue(297)
    }
  },
  output: jest.fn().mockReturnValue('blob')
};

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => mockJsPDF)
}));

describe('dispute letter generator (PWA)', () => {
  const sampleFields: CreditFields = {
    originalCreditor: 'Target Bank',
    furnisherOrCollector: 'Bad Collection',
    currentValue: '1000'
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
      successProbability: 90,
      category: 'violation',
      confidence: 90
    }
  ];

  const sampleConsumer = {
    name: 'John Doe',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001'
  };

  const sampleRisk: RiskProfile = {
    overallScore: 80,
    riskLevel: 'critical',
    disputeStrength: 'definitive',
    litigationPotential: true,
    detectedPatterns: [],
    keyViolations: ['Re-aging'],
    recommendedApproach: 'Go to court.',
    scoreBreakdown: [],
    summary: 'Critical violations detected with high confidence. Re-aging pattern identified with strong evidence supporting litigation.'
  };

  test('generatePDFLetter calls jsPDF methods', () => {
    generatePDFLetter('Test content', 'test.pdf');
    expect(mockJsPDF.save).toHaveBeenCalledWith('test.pdf');
  });

  test('generateForensicReport calls jsPDF methods', () => {
    const discoveryAnswers = { 'B1-0': 'Yes', 'ev-0': 'checked' };
    generateForensicReport(sampleFields, sampleFlags, sampleRisk, [], sampleConsumer, discoveryAnswers);
    expect(mockJsPDF.save).toHaveBeenCalled();
  });

  test('generateBureauLetter creates valid text', () => {
    const letter = generateBureauLetter(sampleFields, sampleFlags, sampleConsumer);
    expect(letter).toContain('John Doe');
    expect(letter).toContain('Fair Credit Reporting Act');
    expect(letter).toContain('Re-aging');
  });

  test('generateValidationLetter creates valid text', () => {
    const letter = generateValidationLetter(sampleFields, sampleFlags, sampleConsumer);
    expect(letter).toContain('DEBT VALIDATION REQUEST');
    expect(letter).toContain('Bad Collection');
  });

  test('generateCaseSummary creates markdown', async () => {
    const summary = await generateCaseSummary(sampleFields, sampleFlags, sampleRisk, sampleConsumer);
    expect(summary).toContain('# FORENSIC CASE SUMMARY');
    expect(summary).toContain('80/100');
    expect(summary).toContain('critical');
  });

  test('generateCFPBNarrative creates text', () => {
    const narrative = generateCFPBNarrative(sampleFields, sampleFlags, sampleConsumer);
    expect(narrative).toContain('COMPLAINT NARRATIVE');
    expect(narrative).toContain('Bad Collection');
    expect(narrative).toContain('John Doe');
  });
});
