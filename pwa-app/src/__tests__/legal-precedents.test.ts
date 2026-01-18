import { findRelevantPrecedents, searchPrecedents, calculateAverageDamages, formatForDispute } from '../lib/legal-precedents';

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

  test('calculateAverageDamages computes correctly', () => {
    const damages = calculateAverageDamages(['B1']);
    expect(damages.averageStatutory).toBeDefined();
    expect(damages.sampleSize).toBeGreaterThan(0);
  });

  test('formatForDispute returns formatted string', () => {
    const matched = findRelevantPrecedents(['B1']);
    const formatted = formatForDispute(matched[0]);
    expect(formatted).toContain('See');
    expect(formatted).toContain('holding that');
  });
});
