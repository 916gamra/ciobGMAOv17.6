// src/core/cqrs/QueryBus.ts
import { Query } from './Query';
import { Result, AppError } from '@/core/error';
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('QueryBus');

interface CacheEntry {
  data: any;
  expiresAt: number;
}

export class QueryBus {
  private handlers = new Map<string, (query: any) => Promise<any>>();
  private cache = new Map<string, CacheEntry>();

  register<T extends Query<any>>(
    queryType: new (...args: any[]) => T,
    handler: (query: T) => Promise<any>
  ): void {
    this.handlers.set(queryType.name, handler);
    logger.debug(`Registered query handler for: ${queryType.name}`);
  }

  async execute<T>(query: Query<T>): Promise<Result<T>> {
    const queryName = query.constructor.name;
    const startTime = performance.now();

    try {
      logger.debug(`Executing query: ${queryName}`);

      // Check cache first if applicable
      if (query.cache()) {
        const cached = this.cache.get(queryName);
        if (cached && cached.expiresAt > Date.now()) {
          logger.debug(`Cache HIT for: ${queryName}`);
          return { ok: true, value: cached.data as T };
        }
      }

      // Find hander
      const handler = this.handlers.get(queryName);
      if (!handler) {
        throw new AppError('QUERY_HANDLER_NOT_FOUND', `No handler registered for query: ${queryName}`, 500);
      }

      // Execute query logic
      const result = await handler(query);

      // Save to cache if applicable
      if (query.cache()) {
        this.cache.set(queryName, {
          data: result,
          expiresAt: Date.now() + query.cacheDuration(),
        });
        logger.debug(`Cached result for: ${queryName}`);
      }

      const duration = performance.now() - startTime;
      logger.debug(`Query completed successfully: ${queryName}`, {
        durationMs: duration.toFixed(2),
      });

      return { ok: true, value: result };
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Query failed: ${queryName}`, error, {
        durationMs: duration.toFixed(2),
      });

      if (error instanceof AppError) {
        return { ok: false, error };
      }

      const err = error instanceof Error ? error : new Error(String(error));
      return {
        ok: false,
        error: new AppError(
          'QUERY_EXECUTION_FAILED',
          err.message || 'Query execution failed',
          500,
          { originalError: err.message, queryName }
        ),
      };
    }
  }

  invalidateCache(queryName: string): void {
    if (this.cache.delete(queryName)) {
      logger.info(`Cache invalidated for: ${queryName}`);
    }
  }

  clearAllCache(): void {
    this.cache.clear();
    logger.info('All query caches cleared successfully.');
  }
}
