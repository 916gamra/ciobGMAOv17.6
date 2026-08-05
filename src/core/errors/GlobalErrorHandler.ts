/**
 * Global Exception Listener & Unhandled Error Handler
 * Captures window.onerror, unhandledrejection events, formats them into structured AppError,
 * logs them to logger and prevents white-screen app crashes.
 */

import { AppLogger, LogLevel } from '../logging/Logger';
import { ErrorHandler } from './ErrorHandler';

const logger = new AppLogger('GlobalErrorHandler');

class GlobalExceptionManager {
  private isInitialized = false;

  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Capture global uncaught JavaScript runtime errors
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message || 'Uncaught Window Error');
      const structuredError = ErrorHandler.handle(error);

      logger.fatal(`Uncaught Window Error [${event.filename}:${event.lineno}]`, structuredError, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });

      // Prevent crash if handled
      event.preventDefault();
    });

    // Capture unhandled Promise rejections (async faults)
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason || 'Unhandled Promise Rejection';
      const structuredError = ErrorHandler.handle(reason);

      logger.error('Unhandled Async Promise Rejection', structuredError, {
        reason: String(reason),
      });

      event.preventDefault();
    });

    this.isInitialized = true;
    logger.info('Global Error & Promise Listener initialized successfully');
  }

  /**
   * Safe Async execution wrapper for component & service handlers
   */
  public async safeAsync<T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
    errorContextName: string = 'AsyncAction'
  ): Promise<{ data: T | undefined; error: Error | null }> {
    try {
      const data = await operation();
      return { data, error: null };
    } catch (err) {
      const appErr = ErrorHandler.handle(err);
      logger.error(`SafeAsync fault in [${errorContextName}]`, appErr);
      return { data: fallbackValue, error: appErr };
    }
  }
}

export const GlobalErrorHandler = new GlobalExceptionManager();
