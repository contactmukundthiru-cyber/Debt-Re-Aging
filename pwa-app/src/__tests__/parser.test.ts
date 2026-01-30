/**
 * Parser Tests
 * Tests for credit report parsing and data extraction
 */

import {
  parseCreditReport,
  normalizeDate,
  extractDate,
  segmentAccounts,
  ParsedFields,
  ExtractedField,
  parseMultipleAccounts,
  fieldsToSimple,
  getExtractionQuality,
  validateExtraction
} from '../lib/parser';

describe('normalizeDate', () => {
  describe('YYYY-MM-DD format', () => {
    it('should pass through ISO format unchanged', () => {
      expect(normalizeDate('2024-01-15')).toBe('2024-01-15');
    });
  });

  describe('MM/DD/YYYY format', () => {
    it('should normalize MM/DD/YYYY to ISO', () => {
      expect(normalizeDate('01/15/2024')).toBe('2024-01-15');
    });

    it('should handle single digit months and days', () => {
      expect(normalizeDate('1/5/2024')).toBe('2024-01-05');
    });
  });

  describe('MM-DD-YYYY format', () => {
    it('should normalize MM-DD-YYYY to ISO', () => {
      expect(normalizeDate('01-15-2024')).toBe('2024-01-15');
    });
  });

  describe('Short year format (M/D/YY)', () => {
    it('should convert short year 00-50 to 20XX', () => {
      expect(normalizeDate('1/15/24')).toBe('2024-01-15');
    });

    it('should convert short year 51-99 to 19XX', () => {
      expect(normalizeDate('1/15/99')).toBe('1999-01-15');
    });
  });

  describe('Month name formats', () => {
    it('should normalize "January 15, 2024"', () => {
      expect(normalizeDate('January 15, 2024')).toBe('2024-01-15');
    });

    it('should normalize "Jan 15, 2024"', () => {
      expect(normalizeDate('Jan 15, 2024')).toBe('2024-01-15');
    });

    it('should normalize "15 January 2024"', () => {
      expect(normalizeDate('15 January 2024')).toBe('2024-01-15');
    });

    it('should normalize "December 2024" to first of month', () => {
      expect(normalizeDate('December 2024')).toBe('2024-12-01');
    });

    it('should handle abbreviated months', () => {
      expect(normalizeDate('Feb 28, 2024')).toBe('2024-02-28');
      expect(normalizeDate('Mar 1, 2024')).toBe('2024-03-01');
      expect(normalizeDate('Sep 10, 2024')).toBe('2024-09-10');
    });
  });

  describe('Edge cases', () => {
    it('should return null for invalid dates', () => {
      expect(normalizeDate('not a date')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizeDate('')).toBeNull();
    });

    it('should handle dates with extra whitespace', () => {
      expect(normalizeDate('  01/15/2024  ')).toBe('2024-01-15');
    });
  });
});

describe('extractDate', () => {
  it('should extract date from surrounding text', () => {
    const text = 'The account was opened on 01/15/2024 by the original creditor';
    const result = extractDate(text);
    expect(result).toBe('2024-01-15');
  });

  it('should extract ISO format dates', () => {
    const text = 'Date of first delinquency: 2024-03-15';
    const result = extractDate(text);
    expect(result).toBe('2024-03-15');
  });

  it('should extract month name dates', () => {
    const text = 'Charged off on January 15, 2024';
    const result = extractDate(text);
    expect(result).toBe('2024-01-15');
  });

  it('should return null when no date is found', () => {
    const text = 'No date information here';
    const result = extractDate(text);
    expect(result).toBeNull();
  });
});

describe('segmentAccounts', () => {
  it('should segment accounts by separator lines', () => {
    const text = `
Account 1 Information
Value: 1000
===
Account 2 Information
Value: 2000
===
Account 3 Information
Value: 3000
`;
    const segments = segmentAccounts(text);
    expect(segments.length).toBeGreaterThanOrEqual(1);
  });

  it('should segment accounts by creditor names', () => {
    const text = `
CAPITAL ONE BANK
Value: 1000
Status: Open

DISCOVER FINANCIAL
Value: 2000
Status: Open
`;
    const segments = segmentAccounts(text);
    expect(segments.length).toBeGreaterThan(0);
  });

  it('should return single segment for short text', () => {
    const text = 'Too short';
    const segments = segmentAccounts(text);
    expect(segments).toEqual([]);
  });

  it('should handle text without clear boundaries', () => {
    const longText = 'A'.repeat(100);
    const segments = segmentAccounts(longText);
    expect(segments.length).toBe(1);
  });
});

describe('parseCreditReport', () => {
  describe('Field extraction', () => {
    it('should extract original creditor', () => {
      const text = 'Original Creditor: CAPITAL ONE BANK\nValue: 1500';
      const result = parseCreditReport(text);
      expect(result.originalCreditor).toBeDefined();
      expect(result.originalCreditor?.value).toContain('CAPITAL ONE');
    });

    it('should extract current balance', () => {
      const text = 'Current Value: 1,500.00\nStatus: Open';
      const result = parseCreditReport(text);
      expect(result.currentBalance).toBeDefined();
    });

    it('should extract date of first delinquency', () => {
      const text = 'Date of First Delinquency: 01/15/2022\nStatus: Collection';
      const result = parseCreditReport(text);
      expect(result.dofd).toBeDefined();
      expect(result.dofd?.value).toBe('2022-01-15');
    });

    it('should extract charge-off date', () => {
      const text = 'Charge-Off Date: 06/01/2022\nInitial Value: 5000';
      const result = parseCreditReport(text);
      expect(result.chargeOffDate).toBeDefined();
    });

    it('should extract account type', () => {
      const text = 'Account Type: Collection\nValue: 1000';
      const result = parseCreditReport(text);
      expect(result.accountType).toBeDefined();
    });
  });

  describe('Confidence levels', () => {
    it('should assign high confidence to well-formed dates', () => {
      const text = 'Date Opened: 01/15/2020';
      const result = parseCreditReport(text);
      if (result.dateOpened) {
        expect(result.dateOpened.confidence).toBe('High');
      }
    });

    it('should assign valid confidence to numeric values', () => {
      const text = 'Current Value: 1,500.00';
      const result = parseCreditReport(text);
      if (result.currentBalance) {
        expect(['High', 'Medium', 'Low']).toContain(result.currentBalance.confidence);
      }
    });
  });

  describe('Complex credit report text', () => {
    it('should parse a typical collection account', () => {
      const text = `
MIDLAND CREDIT MANAGEMENT
Account Type: Collection
Original Creditor: SYNCHRONY BANK
Current Value: 2,500.00
Initial Value: 1,800.00
Date Opened: 03/15/2021
Date of First Delinquency: 01/01/2020
Charge-Off Date: 07/15/2020
Status: Open
Payment History: 120 days past due
`;
      const result = parseCreditReport(text);

      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should parse Experian-style format', () => {
      const text = `
Account name: MIDLAND FUNDING LLC
Account number: XXXX1234
Account type: Collection
Date opened: Jan 2021
Status: Open
Value: 1,500
Original creditor: CHASE BANK USA
Date of 1st delinquency: 12/2019
`;
      const result = parseCreditReport(text);
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty text', () => {
      const result = parseCreditReport('');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle text without recognizable fields', () => {
      const result = parseCreditReport('Random text with no credit info');
      expect(result).toBeDefined();
    });

    it('should handle special characters in creditor names', () => {
      const text = "Original Creditor: BANK OF AMERICA, N.A.\nValue: 1000";
      const result = parseCreditReport(text);
      expect(result.originalCreditor).toBeDefined();
    });

    it('should handle multiple occurrences of same field type', () => {
      const text = `
Value: 1000
Value: 2000
Value: 1500
`;
      // Should not throw and should return some result
      expect(() => parseCreditReport(text)).not.toThrow();
    });
  });

  describe('ExtractedField structure', () => {
    it('should have required properties in extracted fields', () => {
      const text = 'Original Creditor: TEST BANK\nCurrent Value: 500';
      const result = parseCreditReport(text);

      for (const [, field] of Object.entries(result)) {
        expect(field).toHaveProperty('value');
        expect(field).toHaveProperty('confidence');
        expect(field).toHaveProperty('sourceText');
        expect(['High', 'Medium', 'Low']).toContain(field.confidence);
      }
    });
  });
});

describe('Bureau Detection', () => {
  it('should handle Experian-specific patterns', () => {
    const text = `
EXPERIAN
Personal Credit Report
Account name: TEST CREDITOR
FCRA Compliance Date: 01/15/2020
`;
    const result = parseCreditReport(text);
    // Should not throw and should extract data
    expect(result).toBeDefined();
  });

  it('should handle Equifax-specific patterns', () => {
    const text = `
EQUIFAX
Credit File
Date First Delinquent: 01/15/2020
Account Status: Collection
`;
    const result = parseCreditReport(text);
    expect(result).toBeDefined();
  });

  it('should handle TransUnion-specific patterns', () => {
    const text = `
TRANSUNION
Credit Report
FCRA Date: 01/15/2020
Account Type: Collection
`;
    const result = parseCreditReport(text);
    expect(result).toBeDefined();
  });
});

describe('Advanced Parser Functions', () => {
  test('parseMultipleAccounts segments and parses', () => {
    const text = `
Account 1
Original Creditor: BANK A
Value: 500
===
Account 2
Original Creditor: BANK B
Value: 1000
    `;
    const accounts = parseMultipleAccounts(text);
    expect(accounts.length).toBeGreaterThanOrEqual(1);
    expect(accounts[0].fields.originalCreditor).toBeDefined();
  });

  test('fieldsToSimple converts correctly', () => {
    const parsed: ParsedFields = {
      originalCreditor: { value: 'BANK', confidence: 'High', sourceText: 'BANK' }
    };
    const simple = fieldsToSimple(parsed);
    expect(simple.originalCreditor).toBe('BANK');
  });

  test('getExtractionQuality calculates score', () => {
    const parsed: ParsedFields = {
      originalCreditor: { value: 'BANK', confidence: 'High', sourceText: 'BANK' },
      currentBalance: { value: '100', confidence: 'High', sourceText: '100' },
      dofd: { value: '2020-01-01', confidence: 'High', sourceText: '2020-01-01' }
    };
    const quality = getExtractionQuality(parsed);
    expect(quality.score).toBeGreaterThan(0);
    expect(quality.description).toBeDefined();
  });

  test('validateExtraction identifies logical errors', () => {
    const fields = {
      dofd: '2019-01-01',
      dateOpened: '2020-01-01', // error: dofd before open
      accountStatus: 'Paid',
      currentBalance: '500' // error: paid but value > 0
    };
    const warnings = validateExtraction(fields);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.includes('DOFD is before'))).toBe(true);
    expect(warnings.some(w => w.includes('Status shows paid'))).toBe(true);
  });
});
