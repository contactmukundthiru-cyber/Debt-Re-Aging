/**
 * Validation utilities for form inputs and data sanitization
 */

/**
 * Validates a date string in YYYY-MM-DD format
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  // Ensure the date parses back to the same string (catches invalid dates like 2024-02-31)
  return date.toISOString().slice(0, 10) === dateStr;
}

/**
 * Validates and sanitizes a currency amount string
 */
export function sanitizeCurrency(value: string): string {
  // Remove all non-numeric characters except decimal point
  const sanitized = value.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    return parts[0] + '.' + parts[1].slice(0, 2);
  }

  return sanitized;
}

/**
 * Formats a number as USD currency
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a phone number (US format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Sanitizes HTML to prevent XSS
 */
export function sanitizeHTML(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Validates a US state code
 */
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]);

export function isValidStateCode(code: string): boolean {
  return US_STATES.has(code.toUpperCase());
}

/**
 * Validates account number format (basic validation)
 */
export function isValidAccountNumber(accountNum: string): boolean {
  // Account numbers are typically alphanumeric, 4-20 characters
  const accountRegex = /^[A-Za-z0-9*X]{4,20}$/;
  return accountRegex.test(accountNum);
}

/**
 * Field validation result
 */
export interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Validates a date field with custom message
 */
export function validateDateField(
  value: string | undefined,
  required: boolean = false,
  fieldName: string = 'Date'
): ValidationResult {
  if (!value && required) {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (!value) {
    return { valid: true, message: '' };
  }

  if (!isValidDateString(value)) {
    return { valid: false, message: 'Use YYYY-MM-DD format' };
  }

  return { valid: true, message: '' };
}

/**
 * Validates a currency field
 */
export function validateCurrencyField(
  value: string | undefined,
  required: boolean = false,
  fieldName: string = 'Amount'
): ValidationResult {
  if (!value && required) {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (!value) {
    return { valid: true, message: '' };
  }

  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));

  if (isNaN(num)) {
    return { valid: false, message: 'Enter a valid amount' };
  }

  if (num < 0) {
    return { valid: false, message: 'Amount cannot be negative' };
  }

  return { valid: true, message: '' };
}

/**
 * Batch validate multiple fields
 */
export function validateFields(
  validators: Array<() => ValidationResult>
): { valid: boolean; errors: ValidationResult[] } {
  const results = validators.map(v => v());
  const errors = results.filter(r => !r.valid);

  return {
    valid: errors.length === 0,
    errors,
  };
}
