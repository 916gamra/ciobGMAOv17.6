// src/core/intelligence/PredictiveAnalytics.ts
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('PredictiveAnalytics');

export interface Statistics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  variance: number;
  count: number;
}

/**
 * Predictive Analytics Engine
 * 
 * تنبؤات ذكية بناءً على البيانات التاريخية
 * 
 * Features:
 * - Trend Analysis
 * - Forecasting
 * - Anomaly Detection
 * - Pattern Recognition
 */
export class PredictiveAnalytics {
  private historicalData: Map<string, number[]> = new Map();

  constructor() {
    // Seed some initial data for 'inventory-total' so it has values out-of-the-box
    this.historicalData.set('inventory-total', [105, 110, 108, 115, 120, 118, 125]);
  }

  /**
   * إضافة بيانات تاريخية
   */
  addDataPoint(series: string, value: number): void {
    const data = this.historicalData.get(series) || [];
    data.push(value);

    // Keep only last 1000 points
    if (data.length > 1000) {
      data.shift();
    }

    this.historicalData.set(series, data);
  }

  /**
   * التنبؤ بالقيمة التالية
   */
  forecast(series: string, steps: number = 1): number[] {
    const data = this.historicalData.get(series);
    if (!data || data.length < 3) {
      return [];
    }

    const predictions: number[] = [];
    const trend = this.calculateTrend(data);
    const lastValue = data[data.length - 1];

    for (let i = 0; i < steps; i++) {
      const nextValue = lastValue + trend * (i + 1);
      predictions.push(Number(nextValue.toFixed(1)));
    }

    logger.debug(`Forecast generated for ${series}`, {
      predictions,
    });

    return predictions;
  }

  /**
   * كشف الشذوذ
   */
  detectAnomalies(series: string, threshold: number = 2): number[] {
    const data = this.historicalData.get(series);
    if (!data || data.length < 3) {
      return [];
    }

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    ) || 1;

    const anomalies: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const zScore = Math.abs((data[i] - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push(i);
      }
    }

    logger.info(`Anomalies detected for ${series}`, {
      count: anomalies.length,
    });

    return anomalies;
  }

  /**
   * حساب الاتجاه
   */
  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;

    let sumXY = 0;
    let sumX = 0;
    let sumY = 0;
    let sumX2 = 0;

    for (let i = 0; i < data.length; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }

    const n = data.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return slope;
  }

  /**
   * الحصول على الإحصائيات
   */
  getStatistics(series: string): Statistics | null {
    const data = this.historicalData.get(series);
    if (!data || data.length === 0) {
      return null;
    }

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...data);
    const max = Math.max(...data);

    return { mean, stdDev, min, max, variance, count: data.length };
  }
}

export const predictiveAnalytics = new PredictiveAnalytics();
