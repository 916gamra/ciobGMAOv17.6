// src/core/monitoring/ErrorTracking.ts
import { AppError } from '@/core/error';
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('ErrorTracker');

export interface TrackedError {
  id: string;
  timestamp: string;
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private errorLog: TrackedError[] = [];
  private readonly MAX_LOGS = 100;

  constructor() {
    this.setupGlobalListeners();
  }

  private setupGlobalListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.track(event.error || new Error(event.message), {
        source: 'uncaught_exception',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, 'CRITICAL');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.track(event.reason || new Error('Unhandled Promise Rejection'), {
        source: 'unhandled_promise',
      }, 'CRITICAL');
    });
  }

  /**
   * Main track method
   */
  track(error: unknown, metadata?: Record<string, any>, severity: TrackedError['severity'] = 'ERROR'): void {
    try {
      const errObj = error instanceof Error ? error : new Error(String(error));
      const code = error instanceof AppError ? error.code : 'UNKNOWN_ERROR';
      const statusCode = error instanceof AppError ? error.statusCode : 500;

      const tracked: TrackedError = {
        id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        name: errObj.name,
        message: errObj.message,
        stack: errObj.stack,
        code,
        statusCode,
        severity,
        metadata: {
          ...metadata,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      };

      this.errorLog.push(tracked);
      if (this.errorLog.length > this.MAX_LOGS) {
        this.errorLog.shift();
      }

      // Log to database & console via logger
      if (severity === 'CRITICAL') {
        logger.fatal(`CRITICAL crash tracked: ${errObj.message}`, errObj, tracked);
      } else {
        logger.error(`Error tracked: ${errObj.message}`, errObj, tracked);
      }
    } catch (e) {
      console.error('Failed to log error in ErrorTracker', e);
    }
  }

  getErrorHistory(): TrackedError[] {
    return [...this.errorLog].reverse();
  }

  clearHistory(): void {
    this.errorLog = [];
  }
}

export const errorTracker = new ErrorTracker();
