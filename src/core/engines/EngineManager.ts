// src/core/engines/EngineManager.ts
import { WorkerPool } from '@/core/workers/WorkerPool';
import { memoryManager, MemoryManager } from '@/core/memory/MemoryManager';
import { SmartCache } from '@/core/cache/SmartCache';
import { registryManager, RegistryManager } from '@/core/windows/RegistryManager';
import { systemMonitor, SystemMonitor } from '@/core/windows/SystemMonitor';
import { notificationManager, NotificationManager } from '@/core/windows/NotificationManager';
import { predictiveAnalytics, PredictiveAnalytics } from '@/core/intelligence/PredictiveAnalytics';
import { smartScheduler, SmartScheduler } from '@/core/intelligence/SmartScheduler';
import { adaptiveUIEngine, AdaptiveUIEngine } from '@/core/intelligence/AdaptiveUI';
import { hardwareSecurity, HardwareSecurity } from '@/core/security/HardwareSecurity';
import { secureSyncEngine, SecureSyncEngine } from '@/core/sync/SecureSync';
import { crashRecoveryEngine, CrashRecoveryEngine } from '@/core/reliability/CrashRecovery';
import { autoBackupEngine, AutoBackupEngine } from '@/core/reliability/AutoBackup';
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('EngineManager');

/**
 * EngineManager - المحرك المنسق الرئيسي والأعلى لكافة الأنظمة والمحركات المتقدمة
 *
 * Coordinates performance, native capabilities, predictive intelligence, security, and reliability.
 */
export class EngineManager {
  public workerPool: WorkerPool;
  public memoryManager: MemoryManager;
  public cache: SmartCache<any>;
  public registryManager: RegistryManager;
  public systemMonitor: SystemMonitor;
  public notificationManager: NotificationManager;
  public predictiveAnalytics: PredictiveAnalytics;
  public smartScheduler: SmartScheduler;
  public adaptiveUIEngine: AdaptiveUIEngine;
  public hardwareSecurity: HardwareSecurity;
  public secureSyncEngine: SecureSyncEngine;
  public autoBackupEngine: AutoBackupEngine;
  public crashRecoveryEngine: CrashRecoveryEngine;

  constructor() {
    logger.info('Initializing grand master EngineManager coordination...');
    this.workerPool = new WorkerPool(navigator.hardwareConcurrency || 4, 30000);
    this.memoryManager = memoryManager;
    this.cache = new SmartCache<any>(1000, 5 * 60 * 1000);
    this.registryManager = registryManager;
    this.systemMonitor = systemMonitor;
    this.notificationManager = notificationManager;
    this.predictiveAnalytics = predictiveAnalytics;
    this.smartScheduler = smartScheduler;
    this.adaptiveUIEngine = adaptiveUIEngine;
    this.hardwareSecurity = hardwareSecurity;
    this.secureSyncEngine = secureSyncEngine;
    this.autoBackupEngine = autoBackupEngine;
    this.crashRecoveryEngine = crashRecoveryEngine;
    logger.info('All advanced engines loaded and synchronized successfully! ⭐');
  }

  /**
   * Shutdown all background intervals and timers
   */
  public shutdown(): void {
    logger.info('Shutting down EngineManager intervals...');
    this.workerPool.terminate();
    this.memoryManager.stopMonitoring();
    this.systemMonitor.stopMonitoring();
    this.smartScheduler.shutdown();
    this.autoBackupEngine.stopAutoBackup();
  }

  /**
   * Generates a comprehensive performance, reliability, and security audit report of all engines
   */
  public getComprehensiveReport() {
    return {
      timestamp: new Date().toISOString(),
      engines: {
        workerPool: this.workerPool.getMetrics(),
        memory: this.memoryManager.getMemoryStats(),
        cache: this.cache.getStats(),
        systemMetrics: this.systemMonitor.getMetrics(),
        scheduler: this.smartScheduler.getQueueStats(),
        adaptiveUI: {
          behavior: this.adaptiveUIEngine.getUserBehaviorStats(),
          currentConfig: this.adaptiveUIEngine.adaptUI()
        },
        sync: this.secureSyncEngine.getSyncStatus(),
        backup: this.autoBackupEngine.getBackupStats(),
        recovery: {
          crashReportsCount: this.crashRecoveryEngine.getCrashReports().length,
          activeSnapshotsCount: this.crashRecoveryEngine.getSnapshots().length
        }
      }
    };
  }
}

export const engineManager = new EngineManager();
export default engineManager;
