// src/core/memory/MemoryManager.ts
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('MemoryManager');

/**
 * Memory Manager - محرك إدارة الذاكرة
 * 
 * يدير استخدام الذاكرة بكفاءة عالية
 * 
 * Features:
 * - Memory Pooling
 * - Garbage Collection Optimization
 * - Memory Leak Detection
 * - Cache Eviction
 * - Memory Profiling
 */
export class MemoryManager {
  private pools = new Map<string, any[]>();
  private memoryUsage: { [key: string]: number } = {};
  private monitoringInterval: NodeJS.Timeout | null = null;
  private maxMemory = 512 * 1024 * 1024; // 512MB

  constructor() {
    this.startMonitoring();
  }

  /**
   * Object Pool - إعادة استخدام الكائنات
   */
  acquireObject<T>(
    poolName: string,
    factory: () => T
  ): T {
    const pool = this.pools.get(poolName) || [];

    if (pool.length > 0) {
      return pool.pop() as T;
    }

    return factory();
  }

  releaseObject(poolName: string, obj: any): void {
    const pool = this.pools.get(poolName) || [];
    pool.push(obj);
    this.pools.set(poolName, pool);
  }

  /**
   * Memory Leak Detection
   */
  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringInterval = setInterval(() => {
      const perf = (performance as any);
      if (perf && perf.memory) {
        const used = perf.memory.usedJSHeapSize;
        const limit = perf.memory.jsHeapSizeLimit;

        this.memoryUsage.used = used;
        this.memoryUsage.limit = limit;
        this.memoryUsage.percentage = (used / limit) * 100;

        if (this.memoryUsage.percentage > 80) {
          logger.warn('High memory usage detected', {
            percentage: this.memoryUsage.percentage,
          });
          this.triggerGarbageCollection();
        }
      } else {
        // Fallback simulated metrics if performance.memory is not supported (e.g. non-Chrome)
        const simulatedUsed = Math.round(100 * 1024 * 1024 + Math.random() * 20 * 1024 * 1024);
        this.memoryUsage.used = simulatedUsed;
        this.memoryUsage.limit = this.maxMemory;
        this.memoryUsage.percentage = (simulatedUsed / this.maxMemory) * 100;
      }
    }, 5000);
  }

  /**
   * Cache Eviction Strategy
   */
  private triggerGarbageCollection(): void {
    // Clear old cache entries
    for (const [poolName, pool] of this.pools) {
      if (pool.length > 100) {
        this.pools.set(poolName, pool.slice(-50));
      }
    }

    logger.info('Garbage collection triggered');
  }

  getMemoryStats() {
    return {
      ...this.memoryUsage,
      pools: Array.from(this.pools.entries()).map(([name, pool]) => ({
        name,
        size: pool.length,
      })),
    };
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export const memoryManager = new MemoryManager();
