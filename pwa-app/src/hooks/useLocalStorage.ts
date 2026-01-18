'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Simple encryption/decryption for localStorage
 * Note: This is NOT cryptographically secure - for true security, use Web Crypto API
 * This provides basic obfuscation to prevent casual inspection
 */
const ENCRYPTION_KEY = 'credit-analyzer-v1';

function simpleEncrypt(text: string): string {
  try {
    const encoded = btoa(encodeURIComponent(text));
    return encoded.split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    ).join('');
  } catch {
    return text;
  }
}

function simpleDecrypt(text: string): string {
  try {
    const decoded = text.split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    ).join('');
    return decodeURIComponent(atob(decoded));
  } catch {
    return text;
  }
}

export interface UseLocalStorageOptions<T> {
  /** Serialize function for custom types */
  serialize?: (value: T) => string;
  /** Deserialize function for custom types */
  deserialize?: (value: string) => T;
  /** Enable basic encryption for sensitive data */
  encrypt?: boolean;
  /** Sync across browser tabs */
  syncTabs?: boolean;
}

/**
 * Custom hook for localStorage with SSR safety, encryption, and cross-tab sync
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    encrypt = false,
    syncTabs = false,
  } = options;

  // Get initial value from localStorage or use provided initial value
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      const decrypted = encrypt ? simpleDecrypt(item) : item;
      return deserialize(decrypted);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize, encrypt]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn(`Tried to set localStorage key "${key}" during SSR`);
        return;
      }

      try {
        // Allow value to be a function (same API as useState)
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        const serialized = serialize(valueToStore);
        const encrypted = encrypt ? simpleEncrypt(serialized) : serialized;
        localStorage.setItem(key, encrypted);

        // Dispatch storage event for cross-tab sync
        if (syncTabs) {
          window.dispatchEvent(new StorageEvent('storage', {
            key,
            newValue: encrypted,
          }));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serialize, encrypt, syncTabs]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs
  useEffect(() => {
    if (!syncTabs || typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const decrypted = encrypt ? simpleDecrypt(event.newValue) : event.newValue;
          setStoredValue(deserialize(decrypted));
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize, encrypt, syncTabs]);

  // Read value on mount (handles SSR hydration)
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook specifically for encrypted sensitive data storage
 */
export function useSecureStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useLocalStorage(key, initialValue, { encrypt: true, syncTabs: true });
}

export default useLocalStorage;
