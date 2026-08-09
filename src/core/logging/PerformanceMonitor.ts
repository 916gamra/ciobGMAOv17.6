import { createLogger } from './Logger';

const logger = createLogger('PerformanceMonitor');

interface Metric {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: any;
}

class PerformanceMonitorImpl {
  private metrics: Metric[] = [];
  private readonly MAX_METRICS = 1000;
  private thresholds = {
    render: 16, // Aim for 60fps (1000/60)
    apiCall: 500, // 500ms max for API
    dbQuery: 100 // 100ms max for DB
  };

  startMark(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  endMark(name: string, type: 'render' | 'apiCall' | 'dbQuery' = 'render', metadata?: any) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const entries = performance.getEntriesByName(name);
        const latestEntry = entries[entries.length - 1];
        
        const metric: Metric = {
          name,
          duration: latestEntry.duration,
          startTime: latestEntry.startTime,
          endTime: latestEntry.startTime + latestEntry.duration,
          metadata
        };

        this.recordMetric(metric, type);
        
        // Cleanup marks
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
        
        return metric.duration;
      } catch (err) {
        logger.warn(`Failed to measure performance for ${name}`, err);
        return 0;
      }
    }
    return 0;
  }

  private recordMetric(metric: Metric, type: keyof typeof this.thresholds) {
    this.metrics.push(metric);
    
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift(); // Keep bounded memory
    }

    const threshold = this.thresholds[type];
    if (metric.duration > threshold) {
      logger.warn(`Performance degradation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms (Threshold: ${threshold}ms)`, metric);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const PerformanceMonitor = new PerformanceMonitorImpl();
