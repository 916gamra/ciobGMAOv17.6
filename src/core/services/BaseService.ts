// src/core/services/BaseService.ts
import { createLogger } from '../logging/Logger';
import { asyncHandler, Result, AppError } from '../error';

export abstract class BaseService {
  protected logger = createLogger(this.constructor.name);

  protected async executeAsync<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<Result<T>> {
    try {
      this.logger.info(`Starting: ${operationName}`);
      const result = await operation();
      this.logger.info(`Completed: ${operationName}`);
      return { ok: true, value: result };
    } catch (error) {
      this.logger.error(`Failed: ${operationName}`, error as Error);
      return {
        ok: false,
        error: error instanceof AppError
          ? error
          : new AppError('OPERATION_FAILED', String(error), 500),
      };
    }
  }

  protected executeSync<T>(
    operation: () => T,
    operationName: string
  ): Result<T> {
    try {
      this.logger.info(`Starting: ${operationName}`);
      const result = operation();
      this.logger.info(`Completed: ${operationName}`);
      return { ok: true, value: result };
    } catch (error) {
      this.logger.error(`Failed: ${operationName}`, error as Error);
      return {
        ok: false,
        error: error instanceof AppError
          ? error
          : new AppError('OPERATION_FAILED', String(error), 500),
      };
    }
  }
}
