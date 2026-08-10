// src/core/windows/SystemMonitor.ts
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('SystemMonitor');
const hasTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

export interface SystemInfo {
  osVersion: string;
  cpuCount: number;
  totalMemory: number;
  computerName: string;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: number;
}

export class SystemMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metrics: SystemMetrics = {
    cpu: 12.5,
    memory: 45.2,
    disk: 55.1,
    network: 2.4,
    timestamp: Date.now(),
  };

  /**
   * الحصول على معلومات النظام
   */
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      if (hasTauri) {
        const info = await (window as any).__TAURI__.invoke('get_system_info');
        logger.debug('System info retrieved from Tauri');
        return info;
      } else {
        return {
          osVersion: 'Windows 11 (Browser Fallback)',
          cpuCount: navigator.hardwareConcurrency || 8,
          totalMemory: 16 * 1024 * 1024 * 1024, // 16GB
          computerName: 'BDR-NEXUS-NODE',
        };
      }
    } catch (error) {
      logger.error('Failed to get system info', error as Error);
      return {
        osVersion: 'Unknown',
        cpuCount: 4,
        totalMemory: 8 * 1024 * 1024 * 1024,
        computerName: 'Unknown',
      };
    }
  }

  /**
   * مراقبة موارد النظام
   */
  startMonitoring(interval: number = 5000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        if (hasTauri) {
          const metrics = await (window as any).__TAURI__.invoke('get_system_metrics');
          this.metrics = metrics;
        } else {
          // Simulate realistic fluctuations in browser preview
          const cpuFluctuation = (Math.random() - 0.5) * 5;
          const memFluctuation = (Math.random() - 0.5) * 2;
          this.metrics = {
            cpu: Math.max(5, Math.min(95, this.metrics.cpu + cpuFluctuation)),
            memory: Math.max(10, Math.min(95, this.metrics.memory + memFluctuation)),
            disk: this.metrics.disk, // Disk is usually stable
            network: Math.max(0.1, this.metrics.network + (Math.random() - 0.5)),
            timestamp: Date.now(),
          };
        }

        // Alert if resources are high
        if (this.metrics.cpu > 80) {
          logger.warn('High CPU usage detected', { cpu: this.metrics.cpu });
        }

        if (this.metrics.memory > 80) {
          logger.warn('High memory usage detected', { memory: this.metrics.memory });
        }

        if (this.metrics.disk > 90) {
          logger.warn('Low disk space detected', { disk: this.metrics.disk });
        }
      } catch (error) {
        logger.error('Monitoring error', error as Error);
      }
    }, interval);
  }

  /**
   * الحصول على مقاييس النظام الحالية
   */
  getMetrics(): SystemMetrics {
    return this.metrics;
  }

  /**
   * إيقاف المراقبة
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export const systemMonitor = new SystemMonitor();
