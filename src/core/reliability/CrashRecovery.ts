// src/core/reliability/CrashRecovery.ts
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('CrashRecovery');

export interface StateSnapshot {
  id: string;
  timestamp: number;
  state: any;
  hash: string;
}

/**
 * Crash Recovery Engine
 * 
 * استرجاع من الأعطال والأخطاء الحرجة
 * 
 * Features:
 * - State Snapshots
 * - Automatic Recovery
 * - Error Reporting
 * - Data Backup
 */
export class CrashRecoveryEngine {
  private snapshots: StateSnapshot[] = [];
  private maxSnapshots = 10;

  constructor() {
    this.setupGlobalErrorHandler();
    this.startSnapshotting();
  }

  /**
   * إعداد معالج الأخطاء العام
   */
  private setupGlobalErrorHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event: ErrorEvent) => {
      logger.error('Global error caught', event.error || event.message);
      this.handleCrash(event.error || new Error(event.message));
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', event.reason);
      this.handleCrash(event.reason || new Error('Unhandled Promise Rejection'));
    });
  }

  /**
   * بدء أخذ لقطات تلقائية دورية (محاكاة)
   */
  private startSnapshotting(): void {
    if (typeof window === 'undefined') return;
    // Periodic state preservation for session recovery
    setInterval(() => {
      // Create a dummy state snapshot for the current dashboard config
      const simulatedState = {
        path: window.location.pathname,
        timestamp: Date.now(),
        scrollPosition: window.scrollY,
      };
      this.takeSnapshot(simulatedState);
    }, 60000); // Every 1 minute
  }

  /**
   * أخذ لقطة من الحالة
   */
  takeSnapshot(state: any): void {
    const snapshot: StateSnapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)), // Deep copy
      hash: this.calculateHash(state),
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    logger.debug('Snapshot taken', { id: snapshot.id });
  }

  /**
   * معالجة الأعطال
   */
  private async handleCrash(error: any): Promise<void> {
    try {
      logger.error('Crash detected', error);

      // Save crash report
      const crashReport = {
        id: `crash-${Date.now()}`,
        timestamp: Date.now(),
        error: {
          message: error?.message || String(error),
          stack: error?.stack || '',
          name: error?.name || 'Error',
        },
        snapshots: this.snapshots,
        systemInfo: this.getSystemInfo(),
      };

      // Store crash report
      await this.storeCrashReport(crashReport);

      // Attempt recovery
      this.attemptRecovery();
    } catch (err) {
      logger.error('Crash handling failed', err as Error);
    }
  }

  /**
   * محاولة الاسترجاع
   */
  private attemptRecovery(): void {
    if (this.snapshots.length > 0) {
      const lastSnapshot = this.snapshots[this.snapshots.length - 1];
      logger.info('Attempting recovery from snapshot', {
        snapshotId: lastSnapshot.id,
      });

      // Restore snapshot to localStorage before reload
      localStorage.setItem('nexus_gmao_crash_snapshot', JSON.stringify(lastSnapshot));

      // Reload window to clean heap
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }

  /**
   * حفظ تقرير الأعطال (مع fallback آمن)
   */
  private async storeCrashReport(report: any): Promise<void> {
    try {
      // Store in standard localStorage list to be safe and schema-independent
      const existing = localStorage.getItem('nexus_gmao_crash_reports');
      const reports = existing ? JSON.parse(existing) : [];
      reports.push(report);
      if (reports.length > 20) reports.shift(); // Keep last 20
      localStorage.setItem('nexus_gmao_crash_reports', JSON.stringify(reports));

      logger.info('Crash report stored securely');
    } catch (error) {
      logger.error('Failed to store crash report', error as Error);
    }
  }

  /**
   * الحصول على معلومات النظام
   */
  private getSystemInfo(): any {
    if (typeof navigator === 'undefined') return {};
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      memory: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : 'unsupported',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * حساب بصمة الحالة
   */
  private calculateHash(state: any): string {
    const str = JSON.stringify(state);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  getCrashReports() {
    try {
      const existing = localStorage.getItem('nexus_gmao_crash_reports');
      return existing ? JSON.parse(existing) : [];
    } catch {
      return [];
    }
  }

  getSnapshots() {
    return this.snapshots;
  }
}

export const crashRecoveryEngine = new CrashRecoveryEngine();
