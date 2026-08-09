import { ErrorHandler } from '../errors/ErrorHandler';
import { AppError } from '../errors/AppError';
import { createLogger } from '../logging/Logger';

const logger = createLogger('AsyncHandler');

export const asyncHandler = <T, Args extends any[]>(
  operationName: string,
  fn: (...args: Args) => Promise<T>,
  fallbackValue?: T
) => {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      const structuredError = ErrorHandler.handle(error);
      logger.error(`Operation failed: ${operationName}`, structuredError, { args });
      
      if (fallbackValue !== undefined) {
        logger.warn(`Returning fallback value for ${operationName}`);
        return fallbackValue;
      }
      
      throw structuredError;
    }
  };
};
