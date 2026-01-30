import { runAdvancedRules } from '../lib/rules-advanced';
import { CreditFields } from '../lib/rules';

describe('advanced rule engine', () => {
  const sampleFields: CreditFields = {
    dofd: '2020-01-01',
    dateOpened: '2021-01-01' // B1-ADV: dofd before opened
  };

  test('runAdvancedRules identifies critical violations', () => {
    const flags = runAdvancedRules(sampleFields);
    expect(flags.length).toBeGreaterThan(0);
    expect(flags.some(f => f.ruleId === 'B1-ADV')).toBe(true);
    expect(flags[0].severity).toBe('critical');
  });

  test('runAdvancedRules handles medical debt', () => {
    const medicalFields: CreditFields = {
      accountType: 'medical',
      currentValue: '250'
    };
    const flags = runAdvancedRules(medicalFields);
    expect(flags.some(f => f.ruleId === 'H2')).toBe(true);
  });

  test('runAdvancedRules handles state-specific rules', () => {
    const fields = {
      dateLastPayment: '2010-01-01'
    };
    const flags = runAdvancedRules(fields, { includeStateSpecific: true, stateCode: 'NY' });
    expect(flags.some(f => f.ruleId === 'S1-STATE')).toBe(true);
  });

  test('runAdvancedRules handles cross-bureau data', () => {
    const bureauData = [
      { bureau: 'Experian', fields: { dofd: '2020-01-01' } },
      { bureau: 'Equifax', fields: { dofd: '2021-01-01' } }
    ];
    const flags = runAdvancedRules({}, { crossBureauData: bureauData });
    expect(flags.some(f => f.ruleId === 'XB1')).toBe(true);
  });
});
