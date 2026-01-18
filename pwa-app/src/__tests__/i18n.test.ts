import { getLanguage, setLanguage, t, translate, getAvailableLanguages, formatDate, formatCurrency } from '../lib/i18n';

describe('i18n system', () => {
  test('getLanguage and setLanguage', () => {
    expect(getLanguage()).toBe('en');
    setLanguage('es');
    expect(getLanguage()).toBe('es');
    setLanguage('en');
  });

  test('t() returns strings for current language', () => {
    setLanguage('en');
    expect(t().nav.home).toBe('Home');
    setLanguage('es');
    expect(t().nav.home).toBe('Inicio');
  });

  test('translate() fetches nested keys', () => {
    setLanguage('en');
    expect(translate('nav.home')).toBe('Home');
    expect(translate('common.save')).toBe('Save');
    expect(translate('invalid.key')).toBe('invalid.key');
  });

  test('getAvailableLanguages', () => {
    const langs = getAvailableLanguages();
    expect(langs).toContainEqual({ code: 'en', name: 'English' });
    expect(langs).toContainEqual({ code: 'es', name: 'Español' });
  });

  test('formatDate uses correct locale', () => {
    const date = new Date(2024, 0, 15);
    setLanguage('en');
    expect(formatDate(date)).toContain('January');
    setLanguage('es');
    expect(formatDate(date)).toContain('enero');
  });

  test('formatCurrency uses correct locale', () => {
    const amount = 1234.56;
    setLanguage('en');
    expect(formatCurrency(amount)).toContain('$1,234.56');
    setLanguage('es');
    // In Spanish US it might still be $1,234.56 but the locale is set to es-US in the code
    expect(formatCurrency(amount)).toContain('$1,234.56');
  });
});
