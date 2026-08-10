// src/core/intelligence/SmartScheduler.ts
import { createLogger } from '@/core/logging/Logger';
import { systemMonitor, SystemMonitor } from '@/core/windows/SystemMonitor';

const logger = createLogger('SmartScheduler');

export interface ScheduledTask {
  id?: string;
  name: string;
  execute: () => Promise<void>;
  priority?: number;
  scheduledAt?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * Smart Scheduler
 * 
 * جدولة ذكية للعمليات بناءً على الموارد المتاحة
 * 
 * Features:
 * - Priority Queue
 * - Resource Aware Scheduling
 * - Adaptive Scheduling
 * - Load Balancing
 */
export class SmartScheduler {
  private taskQueue: ScheduledTask[] = [];
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private sysMonitor: SystemMonitor) {
    this.startScheduler();
  }

  /**
   * جدولة مهمة
   */
  scheduleTask(
    task: ScheduledTask,
    priority: number = 5,
    delay: number = 0
  ): string {
    const taskId = `task-${Date.now()}-${Math.random()}`;

    const scheduledTask: ScheduledTask = {
      ...task,
      id: taskId,
      priority,
      scheduledAt: Date.now() + delay,
      status: 'pending',
    };

    this.taskQueue.push(scheduledTask);
    this.taskQueue.sort((a, b) => (b.priority || 5) - (a.priority || 5));

    logger.debug(`Task scheduled: ${taskId}`, { priority, delay });

    return taskId;
  }

  /**
   * بدء معالج الجدولة
   */
  private startScheduler(): void {
    if (typeof window === 'undefined') return;
    this.intervalId = setInterval(() => {
      this.processTasks();
    }, 1000);
  }

  /**
   * معالجة المهام
   */
  private async processTasks(): Promise<void> {
    if (this.isProcessing) return;

    const metrics = this.sysMonitor.getMetrics();

    // Only process if resources are available
    if (metrics.cpu > 70 || metrics.memory > 75) {
      logger.debug('Skipping task processing due to high resource usage');
      return;
    }

    this.isProcessing = true;

    try {
      const now = Date.now();
      const tasksToProcess = this.taskQueue.filter(
        t => (t.scheduledAt || 0) <= now && t.status === 'pending'
      );

      for (const task of tasksToProcess) {
        try {
          task.status = 'running';
          await task.execute();
          task.status = 'completed';

          logger.info(`Task completed: ${task.id}`);
        } catch (error) {
          task.status = 'failed';
          logger.error(`Task failed: ${task.id}`, error as Error);
        }
      }

      // Remove completed/failed tasks
      this.taskQueue = this.taskQueue.filter(
        t => t.status === 'pending' || t.status === 'running'
      );
    } finally {
      this.isProcessing = false;
    }
  }

  getQueueStats() {
    return {
      total: this.taskQueue.length,
      pending: this.taskQueue.filter(t => t.status === 'pending').length,
      running: this.taskQueue.filter(t => t.status === 'running').length,
    };
  }

  shutdown(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const smartScheduler = new SmartScheduler(systemMonitor);
