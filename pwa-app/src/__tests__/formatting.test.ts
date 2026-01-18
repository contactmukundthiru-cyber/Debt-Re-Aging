/**
 * Formatting utility tests
 */

import {
  formatDate,
  formatRelativeTime,
  formatDaysRemaining,
  formatNumber,
  formatPercent,
  formatBytes,
  capitalize,
  toTitleCase,
  humanize,
  pluralize,
  truncate,
  maskString,
  formatPhoneNumber,
  getInitials,
  toOrdinal,
} from '../utils/formatting';

describe('formatDate', () => {
  test('formats date with default options', () => {
    // Use local date constructor to avoid timezone issues
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });

  test('formats string dates', () => {
    expect(formatDate('2024-06-01')).toBe('Jun 1, 2024');
  });

  test('handles invalid dates', () => {
    expect(formatDate('invalid')).toBe('Invalid date');
  });

  test('accepts custom options', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, { month: 'long', year: 'numeric' })).toBe('January 2024');
  });
});

describe('formatRelativeTime', () => {
  test('formats recent times', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  test('formats hours ago', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
  });

  test('formats days ago', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });

  test('uses singular form for 1', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
  });
});

describe('formatDaysRemaining', () => {
  test('formats negative days as past due', () => {
    expect(formatDaysRemaining(-5)).toBe('Past due');
  });

  test('formats zero days as today', () => {
    expect(formatDaysRemaining(0)).toBe('Today');
  });

  test('formats one day as tomorrow', () => {
    expect(formatDaysRemaining(1)).toBe('Tomorrow');
  });

  test('formats days less than a week', () => {
    expect(formatDaysRemaining(5)).toBe('5 days');
  });

  test('formats weeks', () => {
    expect(formatDaysRemaining(14)).toBe('2 weeks');
    expect(formatDaysRemaining(7)).toBe('1 week');
  });

  test('formats months', () => {
    expect(formatDaysRemaining(60)).toBe('2 months');
  });

  test('formats years', () => {
    expect(formatDaysRemaining(400)).toBe('1.1 years');
  });
});

describe('formatNumber', () => {
  test('formats numbers with thousands separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatPercent', () => {
  test('formats percentages', () => {
    expect(formatPercent(50)).toBe('50%');
    expect(formatPercent(33.333, 1)).toBe('33.3%');
    expect(formatPercent(100, 2)).toBe('100.00%');
  });
});

describe('formatBytes', () => {
  test('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});

describe('capitalize', () => {
  test('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('Hello');
    expect(capitalize('')).toBe('');
  });
});

describe('toTitleCase', () => {
  test('converts to title case', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
    expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
  });
});

describe('humanize', () => {
  test('converts camelCase to human readable', () => {
    expect(humanize('firstName')).toBe('First name');
    expect(humanize('dateOfBirth')).toBe('Date of birth');
  });

  test('converts snake_case to human readable', () => {
    expect(humanize('first_name')).toBe('First name');
    expect(humanize('date_of_birth')).toBe('Date of birth');
  });
});

describe('pluralize', () => {
  test('uses singular for 1', () => {
    expect(pluralize(1, 'violation')).toBe('1 violation');
    expect(pluralize(1, 'item', 'items')).toBe('1 item');
  });

  test('uses plural for other numbers', () => {
    expect(pluralize(0, 'violation')).toBe('0 violations');
    expect(pluralize(5, 'violation')).toBe('5 violations');
    expect(pluralize(2, 'child', 'children')).toBe('2 children');
  });
});

describe('truncate', () => {
  test('truncates long strings', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
    expect(truncate('Short', 10)).toBe('Short');
  });

  test('uses custom suffix', () => {
    expect(truncate('Hello World', 8, '…')).toBe('Hello W…');
  });
});

describe('maskString', () => {
  test('masks all but last characters', () => {
    expect(maskString('1234567890', 4)).toBe('******7890');
    expect(maskString('secret', 2)).toBe('****et');
  });

  test('uses custom mask character', () => {
    expect(maskString('1234567890', 4, 'X')).toBe('XXXXXX7890');
  });

  test('handles short strings', () => {
    expect(maskString('123', 4)).toBe('123');
    expect(maskString('', 4)).toBe('');
  });
});

describe('formatPhoneNumber', () => {
  test('formats 10-digit phone numbers', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
  });

  test('returns original for non-10-digit numbers', () => {
    expect(formatPhoneNumber('123')).toBe('123');
    expect(formatPhoneNumber('+15551234567')).toBe('+15551234567');
  });
});

describe('getInitials', () => {
  test('gets initials from name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('John')).toBe('J');
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  test('respects maxChars', () => {
    expect(getInitials('John Michael Doe', 3)).toBe('JMD');
  });
});

describe('toOrdinal', () => {
  test('converts numbers to ordinal', () => {
    expect(toOrdinal(1)).toBe('1st');
    expect(toOrdinal(2)).toBe('2nd');
    expect(toOrdinal(3)).toBe('3rd');
    expect(toOrdinal(4)).toBe('4th');
    expect(toOrdinal(11)).toBe('11th');
    expect(toOrdinal(12)).toBe('12th');
    expect(toOrdinal(13)).toBe('13th');
    expect(toOrdinal(21)).toBe('21st');
    expect(toOrdinal(22)).toBe('22nd');
    expect(toOrdinal(23)).toBe('23rd');
  });
});
