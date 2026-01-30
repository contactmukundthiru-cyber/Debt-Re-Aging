import { compareReports } from '../lib/delta';
import { CreditFields } from '../lib/rules';

describe('delta analysis', () => {
  test('compareReports identifies DOFD change', () => {
    const oldReport: CreditFields = { dofd: '2018-01-01' };
    const newReport: CreditFields = { dofd: '2019-01-01' };
    const results = compareReports(oldReport, newReport);
    expect(results.length).toBe(1);
    expect(results[0].field).toBe('Dofd');
    expect(results[0].impact).toBe('negative');
    expect(results[0].description).toContain('re-aging');
  });

  test('compareReports identifies value changes', () => {
    const oldReport: CreditFields = { currentValue: '500' };
    const newReport: CreditFields = { currentValue: '1000' };
    const results = compareReports(oldReport, newReport);
    expect(results[0].impact).toBe('negative');
    expect(results[0].description).toContain('Value increased');
  });

  test('compareReports identifies removal date extension', () => {
    const oldReport: CreditFields = { estimatedRemovalDate: '2025-01-01' };
    const newReport: CreditFields = { estimatedRemovalDate: '2026-01-01' };
    const results = compareReports(oldReport, newReport);
    expect(results[0].impact).toBe('negative');
    expect(results[0].description).toContain('extended');
  });
});
