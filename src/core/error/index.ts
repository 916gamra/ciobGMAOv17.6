// src/core/error/index.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super('INTERNAL_SERVER_ERROR', message, 500);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export type Result<T, E = AppError> =
  | { ok: true; value: T; error?: undefined }
  | { ok: false; error: E; value?: undefined };

export async function asyncHandler<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<Result<T>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, error };
    }

    if (error instanceof Error) {
      return {
        ok: false,
        error: new AppError(
          'INTERNAL_ERROR',
          error.message,
          500,
          { originalError: error.message, context }
        ),
      };
    }

    return {
      ok: false,
      error: new AppError(
        'UNKNOWN_ERROR',
        String(error),
        500,
        { context }
      ),
    };
  }
}

export function syncHandler<T>(
  fn: () => T,
  context?: string
): Result<T> {
  try {
    const value = fn();
    return { ok: true, value };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, error };
    }

    if (error instanceof Error) {
      return {
        ok: false,
        error: new AppError(
          'INTERNAL_ERROR',
          error.message,
          500,
          { originalError: error.message, context }
        ),
      };
    }

    return {
      ok: false,
      error: new AppError(
        'UNKNOWN_ERROR',
        String(error),
        500,
        { context }
      ),
    };
  }
}
