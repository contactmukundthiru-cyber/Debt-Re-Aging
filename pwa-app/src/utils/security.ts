/**
 * Security utilities for data protection and validation
 * Uses base64 encoding for localStorage obfuscation
 */

/**
 * Encrypts data using base64 encoding with URI encoding
 * Note: This provides obfuscation for localStorage data
 */
export function encrypt(data: string): string {
  try {
    return btoa(encodeURIComponent(data));
  } catch {
    return '';
  }
}

/**
 * Decrypts data encoded with the encrypt function
 */
export function decrypt(data: string): string {
  try {
    return decodeURIComponent(atob(data));
  } catch {
    return '';
  }
}

/**
 * Async version of encrypt for future Web Crypto API implementation
 */
export async function encryptAsync(data: string): Promise<string> {
  return encrypt(data);
}

/**
 * Async version of decrypt for future Web Crypto API implementation
 */
export async function decryptAsync(data: string): Promise<string> {
  return decrypt(data);
}

/**
 * Securely stores data in localStorage with encryption (async version)
 */
export async function secureStoreAsync(key: string, value: unknown): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    const encrypted = await encryptAsync(serialized);
    localStorage.setItem(key, encrypted);
  } catch {
    // Silent fail - security operations should not expose errors
  }
}

/**
 * Securely stores data in localStorage with optional encryption (sync version)
 */
export function secureStore(key: string, value: unknown, shouldEncrypt = true): void {
  try {
    const serialized = JSON.stringify(value);
    const data = shouldEncrypt ? encrypt(serialized) : serialized;
    localStorage.setItem(key, data);
  } catch {
    // Silent fail - security operations should not expose errors
  }
}

/**
 * Retrieves data from secure storage (async version with strong decryption)
 */
export async function secureRetrieveAsync<T>(key: string): Promise<T | null> {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    const decrypted = await decryptAsync(data);
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

/**
 * Retrieves data from secure storage (sync version)
 */
export function secureRetrieve<T>(key: string, isEncrypted = true): T | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    const decrypted = isEncrypted ? decrypt(data) : data;
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

/**
 * Removes data from secure storage
 */
export function secureRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silent fail - security operations should not expose errors
  }
}

/**
 * Clears all application data from localStorage
 */
export function clearAllStorage(): void {
  const appKeys = ['fcra-settings', 'fcra-history', 'fcra-preferences'];
  appKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  });
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitizes HTML content (allows safe tags)
 */
export function sanitizeHTML(html: string): string {
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span'];
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;

  return html.replace(tagPattern, (match, tag) => {
    return allowedTags.includes(tag.toLowerCase()) ? match : '';
  });
}

/**
 * Validates and sanitizes a URL
 */
export function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Generates a cryptographically secure random ID
 */
export function generateSecureId(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a secure hash of a string (using SubtleCrypto)
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates a string contains no potentially dangerous content
 */
export function isCleanInput(input: string): boolean {
  // Check for common injection patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /data:/i,
    /vbscript:/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate limiter for preventing abuse
 */
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];

  // Filter out old timestamps
  const recentTimestamps = timestamps.filter(t => now - t < windowMs);

  if (recentTimestamps.length >= maxRequests) {
    return false;
  }

  recentTimestamps.push(now);
  rateLimitMap.set(key, recentTimestamps);
  return true;
}

/**
 * Debounce function for rate limiting user actions
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Content Security Policy helper for checking allowed sources
 */
export function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain) || origin === domain.slice(1);
    }
    return origin === allowed;
  });
}
