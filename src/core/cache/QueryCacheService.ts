/**
 * High-Performance Client-Side Cache Engine
 * Provides instant in-memory retrieval for frequent Dexie queries with smart TTL and tag-based invalidation.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
  tags: string[];
}

class QueryCacheEngine {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
  };

  /**
   * Fetch data from cache or execute fallback promise if expired/missing
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 30000,
    tags: string[] = []
  ): Promise<T> {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry && now - entry.timestamp < entry.ttlMs) {
      this.stats.hits++;
      return entry.data as T;
    }

    this.stats.misses++;
    const freshData = await fetcher();

    this.cache.set(key, {
      data: freshData,
      timestamp: now,
      ttlMs,
      tags,
    });

    return freshData;
  }

  /**
   * Directly write data to cache
   */
  set<T>(key: string, data: T, ttlMs: number = 30000, tags: string[] = []): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
      tags,
    });
  }

  /**
   * Invalidate entries matching a key prefix or tag
   */
  invalidateByTag(tag: string): void {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag) || key.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.invalidations += count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retrieve performance cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '100.0';
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
    };
  }
}

export const QueryCache = new QueryCacheEngine();
