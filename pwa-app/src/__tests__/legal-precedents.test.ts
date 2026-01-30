import { findRelevantPrecedents, searchPrecedents, calculateAverageImpact, formatForDispute } from '../lib/legal-precedents';

describe('legal precedents', () => {
  test('findRelevantPrecedents returns matches', () => {
    const matched = findRelevantPrecedents(['B1']);
    expect(matched.length).toBeGreaterThan(0);
    // Sorts by significance, Safeco is landmark
    expect(matched[0].significance).toBe('landmark');
  });

  test('searchPrecedents filters by query', () => {
    const results = searchPrecedents('willful');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.name.includes('Safeco'))).toBe(true);
  });

  test('calculateAverageImpact computes correctly', () => {
    const impact = calculateAverageImpact(['B1']);
    expect(impact.averageSeverity).toBeDefined();
    expect(impact.sampleSize).toBeGreaterThan(0);
  });

  test('formatForDispute returns formatted string', () => {
    const matched = findRelevantPrecedents(['B1']);
    const formatted = formatForDispute(matched[0]);
    expect(formatted).toContain('See');
    expect(formatted).toContain('holding that');
  });
});
