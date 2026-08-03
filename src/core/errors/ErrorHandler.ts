import { AppError } from './AppError';

export class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        'INTERNAL_ERROR',
        error.message,
        500,
        { stack: error.stack }
      );
    }

    return new AppError(
      'UNKNOWN_ERROR',
      'An unknown error occurred',
      500
    );
  }

  static toResponse(error: AppError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
  }
}
