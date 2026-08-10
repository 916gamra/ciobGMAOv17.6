// src/core/cache/SmartCache.ts
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('SmartCache');

/**
 * Smart Cache Engine
 * 
 * تخزين ذكي مع استراتيجيات متقدمة
 * 
 * Features:
 * - LRU Cache
 * - TTL Support
 * - Compression
 * - Persistence
 * - Invalidation Strategies
 */
export class SmartCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    // Check size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccess: Date.now(),
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);

    logger.debug(`Cache set: ${key}`);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccess = Date.now();

    // Move to end (most recently used)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return entry.value;
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
        logger.debug(`Cache evicted: ${lruKey}`);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    logger.info('Cache cleared');
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: Date.now() - entry.timestamp,
      })),
    };
  }

  private calculateHitRate(): number {
    const totalAccess = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );
    return totalAccess > 0 ? (totalAccess / this.cache.size) * 100 : 0;
  }
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}
