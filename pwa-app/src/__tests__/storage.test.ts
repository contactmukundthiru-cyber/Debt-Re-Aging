import { saveAnalysis, getHistory, getAnalysis, deleteAnalysis, clearHistory, formatTimestamp } from '../lib/storage';
import { CreditFields, RuleFlag, RiskProfile } from '../lib/rules';

describe('storage utils', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const sampleFields: CreditFields = { originalCreditor: 'Test' };
  const sampleFlags: RuleFlag[] = [];
  const sampleRisk: RiskProfile = {
    overallScore: 0,
    riskLevel: 'low',
    disputeStrength: 'weak',
    litigationPotential: false,
    detectedPatterns: [],
    keyViolations: [],
    recommendedApproach: '',
    scoreBreakdown: []
  };

  test('saveAnalysis and getHistory', () => {
    const id = saveAnalysis(sampleFields, sampleFlags, sampleRisk, 'test.pdf');
    expect(id).toBeDefined();
    
    const history = getHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe(id);
    expect(history[0].fileName).toBe('test.pdf');
  });

  test('getAnalysis finds correct record', () => {
    const id = saveAnalysis(sampleFields, sampleFlags, sampleRisk);
    const record = getAnalysis(id);
    expect(record).not.toBeNull();
    expect(record?.id).toBe(id);
  });

  test('deleteAnalysis removes record', () => {
    const id = saveAnalysis(sampleFields, sampleFlags, sampleRisk);
    const success = deleteAnalysis(id);
    expect(success).toBe(true);
    expect(getHistory().length).toBe(0);
  });

  test('clearHistory wipes everything', () => {
    saveAnalysis(sampleFields, sampleFlags, sampleRisk);
    saveAnalysis(sampleFields, sampleFlags, sampleRisk);
    clearHistory();
    expect(getHistory().length).toBe(0);
  });

  test('formatTimestamp returns friendly strings', () => {
    const now = Date.now();
    expect(formatTimestamp(now)).toBe('Just now');
    
    const tenMinsAgo = now - (10 * 60 * 1000);
    expect(formatTimestamp(tenMinsAgo)).toBe('10 minutes ago');
    
    const yesterday = now - (24 * 60 * 60 * 1000 + 1000);
    expect(formatTimestamp(yesterday)).toBe('Yesterday');
  });
});
