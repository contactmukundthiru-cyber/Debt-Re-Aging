/**
 * Jest setup file
 * This file runs before each test file
 */

// Import jest-dom matchers
import '@testing-library/jest-dom';

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock TextEncoder and TextDecoder for tests
Object.defineProperty(global, 'TextEncoder', {
  writable: true,
  value: class TextEncoder {
    encode(text) {
      return Buffer.from(text, 'utf-8');
    }
  },
});

Object.defineProperty(global, 'TextDecoder', {
  writable: true,
  value: class TextDecoder {
    decode(buffer) {
      return Buffer.from(buffer).toString('utf-8');
    }
  },
});

// Mock crypto.subtle for tests - needs to be set up before tests run
Object.defineProperty(global, 'crypto', {
  writable: true,
  value: {
    subtle: {
      digest: jest.fn().mockImplementation(async (algorithm, data) => {
        // Return a mock hash (32 bytes for SHA-256)
        return new Uint8Array(32).buffer;
      })
    }
  },
});

// Mock structuredClone for tests (required by fake-indexeddb)
if (typeof structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock IndexedDB for tests (required by Dexie)
import 'fake-indexeddb/auto';

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Suppress React act() warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
