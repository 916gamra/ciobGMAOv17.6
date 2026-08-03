import { db } from '@/core/db';
import { z } from 'zod';

export type LogLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface BaseLogContext {
  userId?: string | number;
  userName?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  [key: string]: any; // fallback
}

class SystemLogger {
  private async persist(
    level: LogLevel, 
    context: BaseLogContext, 
    error?: Error | unknown
  ) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : error;

    const fullDetails = {
      ...context.details,
      ...(error && { error: errorDetails })
    };

    try {
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        userId: context.userId || 'SYSTEM',
        userName: context.userName || 'System Auto',
        action: context.action || 'GENERAL_LOG',
        entityType: context.entityType || 'SYSTEM',
        entityId: context.entityId || 'N/A',
        details: JSON.stringify(fullDetails),
        timestamp: new Date().toISOString(),
        severity: level,
        deviceInfo: navigator.userAgent
      });
    } catch (e) {
      console.error('CRITICAL: Failed to write to audit log', e);
    }
  }

  private normalizeContext(contextOrMessage: string | BaseLogContext | Record<string, any>): BaseLogContext {
    if (typeof contextOrMessage === 'string') {
      return { action: contextOrMessage, entityType: 'GENERAL' };
    }
    return contextOrMessage as BaseLogContext;
  }

  info(contextOrMessage: string | BaseLogContext | Record<string, any>, details?: any) {
    const context = this.normalizeContext(contextOrMessage);
    if (details) context.details = { ...context.details, ...details };
    console.info(`[${context.action}]`, context);
    this.persist('INFO', context);
  }

  warn(contextOrMessage: string | BaseLogContext | Record<string, any>, details?: any) {
    const context = this.normalizeContext(contextOrMessage);
    if (details) context.details = { ...context.details, ...details };
    console.warn(`[${context.action}]`, context);
    this.persist('WARNING', context);
  }

  error(contextOrMessage: string | BaseLogContext | Record<string, any>, error?: Error | unknown) {
    const context = this.normalizeContext(contextOrMessage);
    // Remove the error object from context if accidentally passed inside to match old API usage
    const actualError = error || context.error;
    if (context.error) delete context.error;
    
    console.error(`[${context.action}]`, context, actualError);
    this.persist('CRITICAL', context, actualError);
  }
}

export const logger = new SystemLogger();

export class PerformanceMonitor {
  static async measure<T>(name: string, operation: () => Promise<T>): Promise<T> {
    return measureOperation(name, operation);
  }
}

export async function measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;
    // DO NOT invoke `logger.info` here to prevent db.auditLogs.add inside readonly liveQueries
    console.debug(`[PERFORMANCE] ${name} took ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error({ action: 'PERFORMANCE_FAILED', entityType: 'MEASURE', details: { operation: name, durationMs: duration } }, error);
    throw error;
  }
}

// Zod validation helper
export function validatePayload<T>(schema: z.Schema<T>, payload: unknown, contextAction: string): T {
  try {
    return schema.parse(payload);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.error({
        action: `${contextAction}_VALIDATION_FAILED`,
        entityType: 'PAYLOAD',
        details: { issues: err.issues, payload }
      }, err);
    }
    throw err;
  }
}
