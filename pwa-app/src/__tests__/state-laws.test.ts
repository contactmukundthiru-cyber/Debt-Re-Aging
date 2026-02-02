import { getStateLaws, generateStateGuidance, getStatesWithEnhancedProtections } from '../lib/state-laws';

describe('state laws', () => {
  test('getStateLaws returns valid profile', () => {
    const ny = getStateLaws('NY');
    expect(ny.name).toBe('New York');
    expect(ny.sol.writtenContracts).toBe(3); // Updated: NY SOL reduced to 3 years by CCFA in 2022
  });

  test('getStateLaws returns default for unknown state', () => {
    const unknown = getStateLaws('ZZ');
    expect(unknown.code).toBe('ZZ');
    expect(unknown.sol.writtenContracts).toBe(5);
  });

  test('generateStateGuidance handles expired SOL', () => {
    const lastPayment = '2010-01-01'; // way back
    const guidance = generateStateGuidance('NY', lastPayment);
    expect(guidance.solStatus).toBe('expired');
    expect(guidance.protections.length).toBeGreaterThan(0);
    expect(guidance.recommendations.some(r => r.includes('cease and desist'))).toBe(true);
  });

  test('generateStateGuidance handles medical debt protections', () => {
    const guidance = generateStateGuidance('CA', undefined, 'medical');
    expect(guidance.protections.some(p => p.includes('medical'))).toBe(true);
  });

  test('getStatesWithEnhancedProtections returns list', () => {
    const states = getStatesWithEnhancedProtections();
    expect(states).toContain('CA');
    expect(states).toContain('NY');
  });
});
