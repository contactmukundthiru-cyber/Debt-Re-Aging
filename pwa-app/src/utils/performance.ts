/**
 * Performance optimization utilities
 */

import { logger } from './logger';

/**
 * Memoization cache with LRU eviction
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Creates a memoized version of a function with LRU cache
 */
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  options: { maxSize?: number; keyFn?: (...args: Args) => string } = {}
): (...args: Args) => Result {
  const { maxSize = 100, keyFn = (...args) => JSON.stringify(args) } = options;
  const cache = new LRUCache<string, Result>(maxSize);

  return (...args: Args): Result => {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Creates a memoized async function
 */
export function memoizeAsync<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: { maxSize?: number; keyFn?: (...args: Args) => string; ttl?: number } = {}
): (...args: Args) => Promise<Result> {
  const { maxSize = 100, keyFn = (...args) => JSON.stringify(args), ttl } = options;
  const cache = new LRUCache<string, { value: Result; timestamp: number }>(maxSize);

  return async (...args: Args): Promise<Result> => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached) {
      if (!ttl || Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }
    }

    const result = await fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  };
}

/**
 * Request Animation Frame batching for DOM updates
 */
const rafCallbacks: Array<() => void> = [];
let rafPending = false;

export function batchUpdate(callback: () => void): void {
  rafCallbacks.push(callback);
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      const callbacks = [...rafCallbacks];
      rafCallbacks.length = 0;
      rafPending = false;
      callbacks.forEach(cb => cb());
    });
  }
}

/**
 * Measures execution time of a function
 */
export function measureTime<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  if (label) {
    logger.debug(`[${label}] Execution time: ${(end - start).toFixed(2)}ms`, undefined, 'Performance');
  }
  return result;
}

/**
 * Async version of measureTime
 */
export async function measureTimeAsync<T>(fn: () => Promise<T>, label?: string): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  if (label) {
    logger.debug(`[${label}] Execution time: ${(end - start).toFixed(2)}ms`, undefined, 'Performance');
  }
  return result;
}

/**
 * Creates a chunked processor for large arrays
 * Processes items in chunks to avoid blocking the main thread
 */
export function processInChunks<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  chunkSize = 100
): Promise<R[]> {
  return new Promise(resolve => {
    const results: R[] = [];
    let index = 0;

    function processChunk(): void {
      const chunkEnd = Math.min(index + chunkSize, items.length);

      while (index < chunkEnd) {
        results.push(processor(items[index], index));
        index++;
      }

      if (index < items.length) {
        // Schedule next chunk
        setTimeout(processChunk, 0);
      } else {
        resolve(results);
      }
    }

    processChunk();
  });
}

/**
 * Creates a lazy-loaded value
 */
export function lazy<T>(factory: () => T): () => T {
  let value: T | undefined;
  let initialized = false;

  return (): T => {
    if (!initialized) {
      value = factory();
      initialized = true;
    }
    return value!;
  };
}

/**
 * Creates a once-only function
 */
export function once<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  let called = false;
  let result: ReturnType<T>;

  return (...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      result = fn(...args);
      called = true;
    }
    return result;
  };
}

/**
 * Idle callback wrapper with fallback
 */
export function whenIdle(callback: () => void, timeout = 2000): void {
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Intersection Observer helper for lazy loading
 */
export function createLazyLoader(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, defaultOptions);
}

/**
 * Virtual scroll helper - calculates visible items
 */
export function getVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);
  return { start, end };
}

/**
 * Creates a signal for cancellable operations
 */
export function createCancellable(): {
  signal: AbortSignal;
  cancel: () => void;
  isCancelled: () => boolean;
} {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
    isCancelled: () => controller.signal.aborted,
  };
}

/**
 * Pool for reusing objects to reduce GC pressure
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (obj: T) => void;
  private readonly maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void = () => {},
    maxSize = 50
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }
}

/**
 * Simple profiler for development
 */
export class Profiler {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (start === undefined) {
      logger.warn(`Mark "${startMark}" not found`, undefined, 'Profiler');
      return 0;
    }
    const duration = performance.now() - start;
    logger.debug(`[Profiler] ${name}: ${duration.toFixed(2)}ms`, undefined, 'Performance');
    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}

/**
 * Exports a singleton profiler instance
 */
export const profiler = new Profiler();
