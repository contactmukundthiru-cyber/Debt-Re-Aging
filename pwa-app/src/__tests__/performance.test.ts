/**
 * Performance utility tests
 */

import {
  memoize,
  processInChunks,
  lazy,
  once,
  getVisibleRange,
  createCancellable,
  ObjectPool,
} from '../utils/performance';

describe('memoize', () => {
  test('caches function results', () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return x * 2;
    };
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(callCount).toBe(1);
  });

  test('uses different cache keys for different args', () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return x * 2;
    };
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(10)).toBe(20);
    expect(callCount).toBe(2);
  });

  test('supports custom key function', () => {
    let callCount = 0;
    const fn = (obj: { id: number; name: string }) => {
      callCount++;
      return obj.name.toUpperCase();
    };
    const memoized = memoize(fn, { keyFn: (obj) => String(obj.id) });

    expect(memoized({ id: 1, name: 'test' })).toBe('TEST');
    expect(memoized({ id: 1, name: 'different' })).toBe('TEST'); // Same id, cached
    expect(callCount).toBe(1);
  });

  test('respects maxSize option', () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return x * 2;
    };
    const memoized = memoize(fn, { maxSize: 2 });

    memoized(1);
    memoized(2);
    memoized(3); // Should evict cache entry for 1

    expect(callCount).toBe(3);

    memoized(3); // Should be cached
    expect(callCount).toBe(3);

    memoized(1); // Should need to recompute (was evicted)
    expect(callCount).toBe(4);
  });
});

describe('processInChunks', () => {
  test('processes all items', async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await processInChunks(items, (x) => x * 2, 2);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  test('passes index to processor', async () => {
    const items = ['a', 'b', 'c'];
    const results = await processInChunks(items, (item, index) => `${item}-${index}`, 10);
    expect(results).toEqual(['a-0', 'b-1', 'c-2']);
  });

  test('handles empty array', async () => {
    const results = await processInChunks([], (x: number) => x * 2, 10);
    expect(results).toEqual([]);
  });
});

describe('lazy', () => {
  test('defers initialization until first access', () => {
    let initialized = false;
    const getValue = lazy(() => {
      initialized = true;
      return 'value';
    });

    expect(initialized).toBe(false);
    expect(getValue()).toBe('value');
    expect(initialized).toBe(true);
  });

  test('only initializes once', () => {
    let count = 0;
    const getValue = lazy(() => {
      count++;
      return 'value';
    });

    getValue();
    getValue();
    getValue();

    expect(count).toBe(1);
  });
});

describe('once', () => {
  test('only calls function once', () => {
    let count = 0;
    const fn = once(() => {
      count++;
      return 'result';
    });

    expect(fn()).toBe('result');
    expect(fn()).toBe('result');
    expect(fn()).toBe('result');
    expect(count).toBe(1);
  });

  test('passes arguments to first call only', () => {
    const fn = once((x: number) => x * 2);

    expect(fn(5)).toBe(10);
    expect(fn(10)).toBe(10); // Still returns first result
    expect(fn(100)).toBe(10);
  });
});

describe('getVisibleRange', () => {
  test('calculates visible range', () => {
    const range = getVisibleRange(0, 500, 50, 100, 0);
    expect(range.start).toBe(0);
    expect(range.end).toBe(10); // 500/50 = 10 visible items
  });

  test('applies overscan', () => {
    const range = getVisibleRange(0, 500, 50, 100, 3);
    expect(range.start).toBe(0);
    expect(range.end).toBe(16); // 10 visible + 6 overscan (3 each side, but start clamped)
  });

  test('handles scroll offset', () => {
    const range = getVisibleRange(250, 500, 50, 100, 0);
    expect(range.start).toBe(5); // 250/50 = 5
    expect(range.end).toBe(15);
  });

  test('clamps to array bounds', () => {
    const range = getVisibleRange(4500, 500, 50, 100, 3);
    expect(range.start).toBeLessThanOrEqual(100);
    expect(range.end).toBe(100);
  });
});

describe('createCancellable', () => {
  test('creates a valid signal', () => {
    const { signal, isCancelled } = createCancellable();
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(isCancelled()).toBe(false);
  });

  test('cancel updates state', () => {
    const { cancel, isCancelled } = createCancellable();
    expect(isCancelled()).toBe(false);
    cancel();
    expect(isCancelled()).toBe(true);
  });

  test('signal is aborted after cancel', () => {
    const { signal, cancel } = createCancellable();
    expect(signal.aborted).toBe(false);
    cancel();
    expect(signal.aborted).toBe(true);
  });
});

describe('ObjectPool', () => {
  test('creates new objects when pool is empty', () => {
    let created = 0;
    const pool = new ObjectPool(() => {
      created++;
      return { value: 0 };
    });

    pool.acquire();
    pool.acquire();

    expect(created).toBe(2);
  });

  test('reuses objects from pool', () => {
    let created = 0;
    const pool = new ObjectPool(() => {
      created++;
      return { value: 0 };
    });

    const obj = pool.acquire();
    pool.release(obj);
    pool.acquire();

    expect(created).toBe(1);
  });

  test('resets objects on release', () => {
    const pool = new ObjectPool(
      () => ({ value: 0 }),
      (obj) => { obj.value = 0; }
    );

    const obj = pool.acquire();
    obj.value = 42;
    pool.release(obj);

    const reused = pool.acquire();
    expect(reused.value).toBe(0);
  });

  test('respects maxSize', () => {
    const pool = new ObjectPool(
      () => ({ value: 0 }),
      () => {},
      2
    );

    const obj1 = pool.acquire();
    const obj2 = pool.acquire();
    const obj3 = pool.acquire();

    pool.release(obj1);
    pool.release(obj2);
    pool.release(obj3); // This one should be dropped

    // Pool should only have 2 objects
    expect(pool.acquire()).toBeDefined();
    expect(pool.acquire()).toBeDefined();
    // Third acquire should create new
    let created = false;
    const testPool = new ObjectPool(() => {
      created = true;
      return {};
    }, () => {}, 0);
    testPool.acquire();
    expect(created).toBe(true);
  });
});
