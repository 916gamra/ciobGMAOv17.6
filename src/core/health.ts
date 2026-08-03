import { db } from '@/core/db';
import { logger } from '@/core/logger';
import { toast } from 'sonner';

// Type extension for Chrome-specific performance API
interface V8Performance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
  };
}

export type HealthStatusLevel = 'ok' | 'warning' | 'error';

export interface HealthCheck {
  status: HealthStatusLevel;
  message: string;
  details?: unknown;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheck;
    storage: HealthCheck;
    memory: HealthCheck;
    sync: HealthCheck;
  };
}

export class HealthChecker {
  static async check(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      storage: await this.checkStorage(),
      memory: await this.checkMemory(),
      sync: await this.checkSync()
    };

    const hasError = Object.values(checks).some(c => c.status === 'error');
    const hasWarning = Object.values(checks).some(c => c.status === 'warning');

    const statusObj: HealthStatus = {
      status: hasError ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      checks
    };

    // Log degraded/unhealthy status appropriately
    if (statusObj.status !== 'healthy') {
      logger.warn({
        action: 'SYSTEM_HEALTH_POOR',
        entityType: 'SYSTEM',
        details: statusObj
      });
    }

    return statusObj;
  }

  private static async checkDatabase(): Promise<HealthCheck> {
    try {
      if (!db.isOpen()) {
        await db.open();
      }
      const count = await db.auditLogs.count();
      return {
        status: 'ok',
        message: `Database OK (Audit Logs count: ${count})`
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private static async checkStorage(): Promise<HealthCheck> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const usage = await navigator.storage.estimate();
        
        // Firefox may return undefined for usage/quota
        if (usage.usage !== undefined && usage.quota !== undefined) {
          // If quota is 0, we can't calculate a percentage (avoid division by zero)
          if (usage.quota === 0) {
            return { status: 'warning', message: 'Storage quota is 0 or unavailable.' };
          }
          
          const percentUsed = (usage.usage / usage.quota) * 100;

          if (percentUsed > 90) {
            return {
              status: 'error',
              message: `Storage almost full (${percentUsed.toFixed(1)}% used)`
            };
          }

          if (percentUsed > 70) {
            return {
              status: 'warning',
              message: `Storage usage high (${percentUsed.toFixed(1)}% used)`
            };
          }

          return {
            status: 'ok',
            message: `Storage OK (${percentUsed.toFixed(1)}% used)`
          };
        }
      }
      return {
        status: 'ok',
        message: 'Storage API not available, assuming OK'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Storage check failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private static async checkMemory(): Promise<HealthCheck> {
    try {
      const perf = performance as V8Performance;
      if (perf.memory) {
        const percentUsed = (perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100;

        if (percentUsed > 90) {
          return {
            status: 'error',
            message: `Memory usage critical (${percentUsed.toFixed(1)}%)`
          };
        }

        if (percentUsed > 75) {
          return {
            status: 'warning',
            message: `Memory usage high (${percentUsed.toFixed(1)}%)`
          };
        }

        return {
          status: 'ok',
          message: `Memory OK (${percentUsed.toFixed(1)}% used)`
        };
      }

      return {
        status: 'ok',
        message: 'Memory API not available (Non-Chromium browser)'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Memory check failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private static async checkSync(): Promise<HealthCheck> {
    try {
      const lastSync = localStorage.getItem('lastCloudSyncDate');
      const lastSyncTime = lastSync ? new Date(lastSync) : null;
      const now = new Date();

      if (!lastSyncTime) {
        // If system hasn't ever synced, it might be fully offline mode
        return {
          status: 'ok', // Or warning if your app mandates cloud sync
          message: 'Never synced (Offline Mode or New Install)'
        };
      }

      const minutesAgo = (now.getTime() - lastSyncTime.getTime()) / 1000 / 60;

      if (minutesAgo > 60 * 24) { // Warning if not synced in 24 hours
        return {
          status: 'warning',
          message: `Last sync was over a day ago (${minutesAgo.toFixed(0)} minutes)`
        };
      }

      return {
        status: 'ok',
        message: `Last sync ${minutesAgo.toFixed(0)} minutes ago`
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Sync check failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export function runBackgroundHealthCheck() {
  HealthChecker.check().then((status) => {
    // Only alert the user if things are critical (unhealthy) to avoid annoying them with warnings
    if (status.status === 'unhealthy') {
      const issues = Object.entries(status.checks)
        .filter(([_, check]) => check.status === 'error')
        .map(([domain, check]) => `${domain.toUpperCase()}: ${check.message}`)
        .join(' | ');

      toast.error('System Health Critical', {
        description: `Issues detected: ${issues}. Please free up storage or restart the app.`,
        duration: 10000,
        icon: '⚠️'
      });
    } else if (status.status === 'degraded') {
       // Debugging info in console, user doesn't need aggressive interruption for warnings
       console.warn('System Health Degraded:', status);
    }
  }).catch((e) => {
    console.error('Failed to run complete health check', e);
  });
}
