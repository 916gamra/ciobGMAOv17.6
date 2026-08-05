import { describe, it, expect, beforeEach } from 'vitest';
import { QueryCache } from '../cache/QueryCacheService';
import { RateLimiter } from '../security/rateLimiter';
import { CsrfShield } from '../security/csrfShield';
import { WorkerManager } from '../workers/workerManager';

describe('QueryCache Engine', () => {
  beforeEach(() => {
    QueryCache.clear();
  });

  it('should cache data on first fetch and hit cache on subsequent call', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { id: 1, name: 'Spare Motor' };
    };

    const first = await QueryCache.getOrFetch('test_key', fetcher, 5000, ['pdr']);
    expect(first.name).toBe('Spare Motor');
    expect(callCount).toBe(1);

    const second = await QueryCache.getOrFetch('test_key', fetcher, 5000, ['pdr']);
    expect(second.name).toBe('Spare Motor');
    expect(callCount).toBe(1); // fetched from cache

    const stats = QueryCache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it('should invalidate cache entries by tag', async () => {
    QueryCache.set('key_1', 'val1', 5000, ['tag_pdr']);
    QueryCache.set('key_2', 'val2', 5000, ['tag_pdr']);
    QueryCache.set('key_3', 'val3', 5000, ['tag_other']);

    QueryCache.invalidateByTag('tag_pdr');

    let count = 0;
    const fetcher = async () => {
      count++;
      return 'new_val';
    };

    const res = await QueryCache.getOrFetch('key_1', fetcher);
    expect(res).toBe('new_val');
    expect(count).toBe(1);
  });
});

describe('RateLimiter Engine', () => {
  beforeEach(() => {
    RateLimiter.clearAll();
  });

  it('should allow requests under the maximum limit', () => {
    const config = { maxRequests: 3, windowMs: 10000 };
    const res1 = RateLimiter.checkAndConsume('action_stock', config);
    expect(res1.allowed).toBe(true);

    const res2 = RateLimiter.checkAndConsume('action_stock', config);
    expect(res2.allowed).toBe(true);

    const res3 = RateLimiter.checkAndConsume('action_stock', config);
    expect(res3.allowed).toBe(true);

    const res4 = RateLimiter.checkAndConsume('action_stock', config);
    expect(res4.allowed).toBe(false);
    expect(res4.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe('CsrfShield Engine', () => {
  it('should initialize and verify CSRF token correctly', () => {
    const token = CsrfShield.initializeToken();
    expect(token).toBeTruthy();
    expect(token.length).toBe(64);

    expect(CsrfShield.verifyToken(token)).toBe(true);
    expect(CsrfShield.verifyToken('invalid_token')).toBe(false);
  });
});

describe('WorkerManager Engine', () => {
  it('should calculate stock reconciliation correctly', async () => {
    const result = await WorkerManager.calculateStockReconciliation({
      inventoryItems: [
        { id: '1', currentQuantity: 10, minThreshold: 2, unitPrice: 100 },
        { id: '2', currentQuantity: 0, minThreshold: 5, unitPrice: 50 },
      ],
      transactions: [
        { type: 'IN', quantity: 20 },
        { type: 'OUT', quantity: 5 },
      ],
    });

    expect(result.totalValue).toBe(1000);
    expect(result.criticalItemsCount).toBe(1);
    expect(result.stockInVolume).toBe(20);
    expect(result.stockOutVolume).toBe(5);
    expect(result.varianceEstimate).toBe(15);
  });
});
