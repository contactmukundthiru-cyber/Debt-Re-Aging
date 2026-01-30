/**
 * Validation utility tests
 */

import {
  isValidDateString,
  sanitizeNumericInput,
  formatNumericValue,
  isValidEmail,
  isValidPhoneNumber,
  isValidStateCode,
  isValidAccountNumber,
  validateDateField,
  validateNumericField,
  validateFields,
} from '../utils/validation';

describe('isValidDateString', () => {
  test('returns true for valid YYYY-MM-DD format', () => {
    expect(isValidDateString('2024-01-15')).toBe(true);
    expect(isValidDateString('2020-12-31')).toBe(true);
    expect(isValidDateString('1999-06-01')).toBe(true);
  });

  test('returns false for invalid date formats', () => {
    expect(isValidDateString('01-15-2024')).toBe(false);
    expect(isValidDateString('2024/01/15')).toBe(false);
    expect(isValidDateString('Jan 15, 2024')).toBe(false);
    expect(isValidDateString('2024-1-15')).toBe(false);
  });

  test('returns false for invalid dates', () => {
    expect(isValidDateString('2024-02-31')).toBe(false); // Feb 31 doesn't exist
    expect(isValidDateString('2024-13-01')).toBe(false); // Month 13
    expect(isValidDateString('2024-00-01')).toBe(false); // Month 0
  });

  test('returns false for empty or null values', () => {
    expect(isValidDateString('')).toBe(false);
  });
});

describe('sanitizeNumericInput', () => {
  test('removes non-numeric characters except decimal', () => {
    expect(sanitizeNumericInput('1,234.56')).toBe('1234.56');
    expect(sanitizeNumericInput('Value 100.00')).toBe('100.00');
    expect(sanitizeNumericInput('1,000,000')).toBe('1000000');
  });

  test('handles multiple decimal points', () => {
    expect(sanitizeNumericInput('1.2.3')).toBe('1.23');
  });

  test('limits to 2 decimal places', () => {
    expect(sanitizeNumericInput('123.456')).toBe('123.45');
  });

  test('handles empty strings', () => {
    expect(sanitizeNumericInput('')).toBe('');
  });
});

describe('formatNumericValue', () => {
  test('formats numbers with 2 decimal places', () => {
    expect(formatNumericValue(1234.56)).toBe('1,234.56');
    expect(formatNumericValue(0)).toBe('0.00');
    expect(formatNumericValue(1000000)).toBe('1,000,000.00');
  });

  test('handles string input', () => {
    expect(formatNumericValue('1234.56')).toBe('1,234.56');
    expect(formatNumericValue('5,000')).toBe('5,000.00');
  });

  test('handles invalid input', () => {
    expect(formatNumericValue('invalid')).toBe('0.00');
    expect(formatNumericValue(NaN)).toBe('0.00');
  });
});

describe('isValidEmail', () => {
  test('returns true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@gmail.com')).toBe(true);
  });

  test('returns false for invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('isValidPhoneNumber', () => {
  test('returns true for valid US phone numbers', () => {
    expect(isValidPhoneNumber('(555) 123-4567')).toBe(true);
    expect(isValidPhoneNumber('555-123-4567')).toBe(true);
    expect(isValidPhoneNumber('555.123.4567')).toBe(true);
    expect(isValidPhoneNumber('5551234567')).toBe(true);
  });

  test('returns false for invalid phone numbers', () => {
    expect(isValidPhoneNumber('123')).toBe(false);
    expect(isValidPhoneNumber('12345678901')).toBe(false);
    expect(isValidPhoneNumber('abc-def-ghij')).toBe(false);
  });
});

describe('isValidStateCode', () => {
  test('returns true for valid state codes', () => {
    expect(isValidStateCode('CA')).toBe(true);
    expect(isValidStateCode('NY')).toBe(true);
    expect(isValidStateCode('TX')).toBe(true);
    expect(isValidStateCode('DC')).toBe(true);
  });

  test('handles lowercase', () => {
    expect(isValidStateCode('ca')).toBe(true);
    expect(isValidStateCode('ny')).toBe(true);
  });

  test('returns false for invalid codes', () => {
    expect(isValidStateCode('XX')).toBe(false);
    expect(isValidStateCode('USA')).toBe(false);
    expect(isValidStateCode('')).toBe(false);
  });
});

describe('isValidAccountNumber', () => {
  test('returns true for valid account numbers', () => {
    expect(isValidAccountNumber('1234567890')).toBe(true);
    expect(isValidAccountNumber('XXXX1234')).toBe(true);
    expect(isValidAccountNumber('****5678')).toBe(true);
  });

  test('returns false for invalid account numbers', () => {
    expect(isValidAccountNumber('123')).toBe(false); // Too short
    expect(isValidAccountNumber('abc@#$%')).toBe(false); // Invalid chars
  });
});

describe('validateDateField', () => {
  test('validates required date field', () => {
    expect(validateDateField(undefined, true, 'DOFD')).toEqual({
      valid: false,
      message: 'DOFD is required',
    });

    expect(validateDateField('2024-01-15', true, 'DOFD')).toEqual({
      valid: true,
      message: '',
    });
  });

  test('validates optional date field', () => {
    expect(validateDateField(undefined, false)).toEqual({
      valid: true,
      message: '',
    });

    expect(validateDateField('invalid', false)).toEqual({
      valid: false,
      message: 'Use YYYY-MM-DD format',
    });
  });
});

describe('validateNumericField', () => {
  test('validates required numeric field', () => {
    expect(validateNumericField(undefined, true, 'Value')).toEqual({
      valid: false,
      message: 'Value is required',
    });

    expect(validateNumericField('1,234.56', true)).toEqual({
      valid: true,
      message: '',
    });
  });

  test('rejects negative values', () => {
    expect(validateNumericField('-100', false)).toEqual({
      valid: false,
      message: 'Value cannot be negative',
    });
  });

  test('rejects invalid values', () => {
    expect(validateNumericField('abc', false)).toEqual({
      valid: false,
      message: 'Enter a valid value',
    });
  });
});

describe('validateFields', () => {
  test('returns valid when all fields pass', () => {
    const result = validateFields([
      () => ({ valid: true, message: '' }),
      () => ({ valid: true, message: '' }),
    ]);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('returns invalid with errors when fields fail', () => {
    const result = validateFields([
      () => ({ valid: true, message: '' }),
      () => ({ valid: false, message: 'Error 1' }),
      () => ({ valid: false, message: 'Error 2' }),
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].message).toBe('Error 1');
    expect(result.errors[1].message).toBe('Error 2');
  });
});
