/**
 * Security utility tests
 */

import {
  encrypt,
  decrypt,
  sanitizeURL,
  generateSecureId,
  isCleanInput,
  checkRateLimit,
  debounce,
  throttle,
  isAllowedOrigin,
} from '../utils/security';

describe('encrypt/decrypt', () => {
  test('encrypts and decrypts correctly', () => {
    const original = 'Hello, World!';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  test('handles special characters', () => {
    const original = 'Special chars: @#$%^&*()_+';
    const encrypted = encrypt(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  test('handles unicode', () => {
    const original = 'Unicode: 你好世界 🎉';
    const encrypted = encrypt(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  test('handles empty string', () => {
    const encrypted = encrypt('');
    expect(decrypt(encrypted)).toBe('');
  });

  test('returns empty string for invalid decrypt input', () => {
    expect(decrypt('not-valid-base64!@#')).toBe('');
  });
});

describe('sanitizeURL', () => {
  test('allows valid https URLs', () => {
    expect(sanitizeURL('https://example.com')).toBe('https://example.com/');
  });

  test('allows valid http URLs', () => {
    expect(sanitizeURL('http://example.com')).toBe('http://example.com/');
  });

  test('rejects javascript URLs', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBeNull();
  });

  test('rejects data URLs', () => {
    expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  test('returns null for invalid URLs', () => {
    expect(sanitizeURL('not-a-url')).toBeNull();
  });
});

describe('generateSecureId', () => {
  test('generates correct length', () => {
    const id = generateSecureId(16);
    expect(id.length).toBe(32); // 16 bytes = 32 hex chars
  });

  test('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateSecureId()));
    expect(ids.size).toBe(100);
  });

  test('only contains hex characters', () => {
    const id = generateSecureId();
    expect(id).toMatch(/^[0-9a-f]+$/);
  });
});

describe('isCleanInput', () => {
  test('returns true for clean input', () => {
    expect(isCleanInput('Hello World')).toBe(true);
    expect(isCleanInput('test@example.com')).toBe(true);
    expect(isCleanInput('2024-01-15')).toBe(true);
  });

  test('returns false for script tags', () => {
    expect(isCleanInput('<script>alert(1)</script>')).toBe(false);
    expect(isCleanInput('<SCRIPT>alert(1)</SCRIPT>')).toBe(false);
  });

  test('returns false for javascript protocol', () => {
    expect(isCleanInput('javascript:alert(1)')).toBe(false);
  });

  test('returns false for event handlers', () => {
    expect(isCleanInput('onclick=alert(1)')).toBe(false);
    expect(isCleanInput('onmouseover=hack()')).toBe(false);
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('allows requests within limit', () => {
    expect(checkRateLimit('test-key-1', 3, 1000)).toBe(true);
    expect(checkRateLimit('test-key-1', 3, 1000)).toBe(true);
    expect(checkRateLimit('test-key-1', 3, 1000)).toBe(true);
  });

  test('blocks requests over limit', () => {
    expect(checkRateLimit('test-key-2', 2, 1000)).toBe(true);
    expect(checkRateLimit('test-key-2', 2, 1000)).toBe(true);
    expect(checkRateLimit('test-key-2', 2, 1000)).toBe(false);
  });

  test('allows requests after window expires', () => {
    expect(checkRateLimit('test-key-3', 1, 1000)).toBe(true);
    expect(checkRateLimit('test-key-3', 1, 1000)).toBe(false);

    jest.advanceTimersByTime(1001);
    expect(checkRateLimit('test-key-3', 1, 1000)).toBe(true);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('delays function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('resets timer on subsequent calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    jest.advanceTimersByTime(50);
    debounced();
    jest.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('executes immediately on first call', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('ignores calls within throttle period', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('allows calls after throttle period', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    jest.advanceTimersByTime(101);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('isAllowedOrigin', () => {
  test('allows exact matches', () => {
    expect(isAllowedOrigin('https://example.com', ['https://example.com'])).toBe(true);
  });

  test('rejects non-matching origins', () => {
    expect(isAllowedOrigin('https://evil.com', ['https://example.com'])).toBe(false);
  });

  test('allows wildcard', () => {
    expect(isAllowedOrigin('https://anything.com', ['*'])).toBe(true);
  });

  test('allows subdomain wildcards', () => {
    expect(isAllowedOrigin('https://api.example.com', ['*.example.com'])).toBe(true);
    expect(isAllowedOrigin('https://www.example.com', ['*.example.com'])).toBe(true);
  });
});
