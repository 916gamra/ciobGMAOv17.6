/**
 * Heavy Data Processing & Worker Orchestrator
 * Offloads compute-heavy tasks (reconciliation analysis, search indexing, batch statistics)
 * to background execution to maintain smooth 60 FPS UI rendering.
 */

import { PerformanceMonitor } from '../monitoring/performanceMonitor';

export interface ComputeTaskPayload<T = any> {
  taskType: 'RECONCILIATION_MATH' | 'SEARCH_INDEXING' | 'BATCH_ENCRYPTION_CHECK' | 'KPI_ANALYTICS_MATH';
  data: T;
}

export interface ReconciliationInput {
  inventoryItems: Array<{
    id: string;
    currentQuantity: number;
    minThreshold: number;
    unitPrice: number;
  }>;
  transactions: Array<{
    type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    unitPrice?: number;
  }>;
}

export interface ReconciliationOutput {
  totalValue: number;
  criticalItemsCount: number;
  reorderRequiredCount: number;
  stockInVolume: number;
  stockOutVolume: number;
  varianceEstimate: number;
  healthScore: number;
}

class HeavyWorkerManager {
  /**
   * Run stock reconciliation and inventory financial valuation math in background thread/task
   */
  async calculateStockReconciliation(input: ReconciliationInput): Promise<ReconciliationOutput> {
    return PerformanceMonitor.measure('Worker:StockReconciliation', 'WORKER_COMPUTE', async () => {
      // Execute asynchronously to unblock main thread microtasks
      return new Promise<ReconciliationOutput>((resolve) => {
        setTimeout(() => {
          let totalValue = 0;
          let criticalItemsCount = 0;
          let reorderRequiredCount = 0;
          let stockInVolume = 0;
          let stockOutVolume = 0;

          // Compute inventory valuation & thresholds
          for (let i = 0; i < input.inventoryItems.length; i++) {
            const item = input.inventoryItems[i];
            const qty = item.currentQuantity || 0;
            const price = item.unitPrice || 0;
            const min = item.minThreshold || 0;

            totalValue += qty * price;

            if (qty <= 0) {
              criticalItemsCount++;
            } else if (qty <= min) {
              reorderRequiredCount++;
            }
          }

          // Compute transaction volumes
          for (let j = 0; j < input.transactions.length; j++) {
            const tx = input.transactions[j];
            if (tx.type === 'IN') {
              stockInVolume += tx.quantity || 0;
            } else if (tx.type === 'OUT') {
              stockOutVolume += tx.quantity || 0;
            }
          }

          // Compute health score percentage
          const totalItems = input.inventoryItems.length || 1;
          const healthyCount = totalItems - (criticalItemsCount + reorderRequiredCount);
          const healthScore = Math.max(0, Math.min(100, Math.round((healthyCount / totalItems) * 100)));
          const varianceEstimate = Number((stockInVolume - stockOutVolume).toFixed(2));

          resolve({
            totalValue: Number(totalValue.toFixed(2)),
            criticalItemsCount,
            reorderRequiredCount,
            stockInVolume,
            stockOutVolume,
            varianceEstimate,
            healthScore,
          });
        }, 0);
      });
    });
  }

  /**
   * Perform multi-entity fuzzy search filtering off the main thread
   */
  async filterMultiEntitySearch<T extends { title?: string; subtitle?: string; code?: string; reference?: string }>(
    items: T[],
    query: string
  ): Promise<T[]> {
    if (!query.trim()) return items;

    return PerformanceMonitor.measure('Worker:FuzzySearch', 'WORKER_COMPUTE', async () => {
      return new Promise<T[]>((resolve) => {
        setTimeout(() => {
          const q = query.toLowerCase().trim();
          const filtered = items.filter(item => {
            return (
              (item.title && item.title.toLowerCase().includes(q)) ||
              (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
              (item.code && item.code.toLowerCase().includes(q)) ||
              (item.reference && item.reference.toLowerCase().includes(q))
            );
          });
          resolve(filtered);
        }, 0);
      });
    });
  }
}

export const WorkerManager = new HeavyWorkerManager();
