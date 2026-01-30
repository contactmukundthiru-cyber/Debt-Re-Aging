import { runRules, calculateRiskProfile } from '../lib/rules';

describe('rule engine', () => {
  test('B1: DOFD before account opening', () => {
    const fields = {
      dateOpened: '2020-01-01',
      dofd: '2019-01-01'
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'B1')).toBe(true);
  });

  test('B2: Impossible 7-year timeline', () => {
    const fields = {
      dofd: '2010-01-01',
      estimatedRemovalDate: '2020-01-01'
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'B2')).toBe(true);
  });

  test('D1: Paid status with balance', () => {
    const fields = {
      accountStatus: 'Paid',
      currentBalance: '100'
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'D1')).toBe(true);
  });

  test('calculateRiskProfile handles multiple flags', () => {
    const fields = {
      dofd: '2010-01-01',
      estimatedRemovalDate: '2020-01-01',
      dateOpened: '2020-01-01' // Trigger B1 too
    };
    const flags = runRules(fields);
    const profile = calculateRiskProfile(flags, fields);
    
    expect(profile.overallScore).toBeGreaterThan(0);
    expect(profile.riskLevel).toBeDefined();
    expect(profile.detectedPatterns.length).toBeGreaterThan(0);
  });

  test('E1: Future date', () => {
    const fields = {
      dateOpened: '2099-01-01'
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'E1')).toBe(true);
  });

  test('B3: DOFD after charge-off', () => {
    const fields = {
      dofd: '2020-01-01',
      chargeOffDate: '2019-01-01'
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'B3')).toBe(true);
  });

  test('M2: Transferred with balance', () => {
    const fields = {
      accountStatus: 'Sold/Transferred',
      currentBalance: '500'
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'M2')).toBe(true);
  });

  test('K7: Interest Rate Violation', () => {
    const fields = {
      stateCode: 'CA',
      currentBalance: '2000',
      originalAmount: '1000',
      dofd: '2023-01-01' // ~1 year ago, 100% interest > 10% cap
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'K7')).toBe(true);
  });

  test('K1: Balance increase after charge-off', () => {
    const fields = {
      currentBalance: '3000',
      originalAmount: '1000'
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'K1')).toBe(true);
  });

  test('K6: Should have fallen off', () => {
    const fields = {
      dofd: '2010-01-01' // over 7.5 years ago
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'K6')).toBe(true);
  });

  test('M1: Missing DOFD for collection', () => {
    const fields = {
      accountType: 'collection'
      // missing dofd
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'M1')).toBe(true);
  });

  test('L1: Status vs Payment History mismatch', () => {
    const fields = {
      accountStatus: 'Current',
      paymentHistory: '30 60 90'
    };
    const flags = runRules(fields);
    expect(flags.some(f => f.ruleId === 'L1')).toBe(true);
  });

  test('Zombie Debt Pattern in calculateRiskProfile', () => {
    const fields = {
      accountType: 'collection',
      dateOpened: '2023-01-01',
      dofd: '2018-01-01', // 5 year gap
      dateReportedOrUpdated: '2020-01-01' // Trigger F1 (stale data)
    };
    const flags = runRules(fields);
    const profile = calculateRiskProfile(flags, fields);
    expect(profile.detectedPatterns.some(p => p.patternName === 'Zombie Debt Resuscitation')).toBe(true);
  });
});
