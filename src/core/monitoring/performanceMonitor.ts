/**
 * Real-Time Performance & Telemetry Monitor
 * Tracks DB Query Latencies, Component Render Cycles, FPS, and Heap Usage
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  category: 'RENDER' | 'DB_QUERY' | 'WORKER_COMPUTE' | 'NETWORK';
  durationMs: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitorEngine {
  private metrics: PerformanceMetric[] = [];
  private maxLogs = 200;
  private fpsHistory: number[] = [];
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private currentFps = 60;
  private isMonitoringFps = false;

  constructor() {
    this.startFpsTracker();
  }

  private startFpsTracker() {
    if (typeof window === 'undefined') return;

    const calcFps = (now: number) => {
      this.frameCount++;
      if (now - this.lastFrameTime >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.fpsHistory.push(this.currentFps);
        if (this.fpsHistory.length > 30) this.fpsHistory.shift();
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      if (this.isMonitoringFps) {
        requestAnimationFrame(calcFps);
      }
    };

    this.isMonitoringFps = true;
    requestAnimationFrame(calcFps);
  }

  /**
   * Record a performance benchmark
   */
  logMetric(name: string, category: PerformanceMetric['category'], durationMs: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      category,
      durationMs: Number(durationMs.toFixed(2)),
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.maxLogs) {
      this.metrics.shift();
    }
  }

  /**
   * Helper to measure async execution time automatically
   */
  async measure<T>(name: string, category: PerformanceMetric['category'], fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.logMetric(name, category, duration, metadata);
    }
  }

  /**
   * Get current telemetry overview
   */
  getTelemetrySummary() {
    const totalMetrics = this.metrics.length;
    const avgDbLatency = this.calculateAverage('DB_QUERY');
    const avgRenderTime = this.calculateAverage('RENDER');
    const avgWorkerTime = this.calculateAverage('WORKER_COMPUTE');

    const memory = (performance as any).memory
      ? {
          usedHeapMb: Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024)),
          totalHeapMb: Math.round((performance as any).memory.totalJSHeapSize / (1024 * 1024)),
        }
      : null;

    return {
      fps: this.currentFps,
      avgFps: this.fpsHistory.length > 0 ? Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length) : 60,
      avgDbLatencyMs: avgDbLatency,
      avgRenderTimeMs: avgRenderTime,
      avgWorkerTimeMs: avgWorkerTime,
      memory,
      recentMetrics: [...this.metrics].reverse().slice(0, 20),
    };
  }

  private calculateAverage(category: PerformanceMetric['category']): number {
    const filtered = this.metrics.filter(m => m.category === category);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, curr) => acc + curr.durationMs, 0);
    return Number((sum / filtered.length).toFixed(2));
  }

  /**
   * Clear recorded telemetry metrics
   */
  clear() {
    this.metrics = [];
  }
}

export const PerformanceMonitor = new PerformanceMonitorEngine();
