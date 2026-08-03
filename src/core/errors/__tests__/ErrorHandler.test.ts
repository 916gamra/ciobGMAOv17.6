import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../AppError';
import { ErrorHandler } from '../ErrorHandler';

describe('Error Handling System', () => {
  describe('AppError & Subclasses', () => {
    it('should create a standard AppError', () => {
      const err = new AppError('UNKNOWN', 'Something went wrong', 500, { data: 123 });
      expect(err.code).toBe('UNKNOWN');
      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.details).toEqual({ data: 123 });
      expect(err).toBeInstanceOf(Error);
    });

    it('should create specialized errors', () => {
      const validationErr = new ValidationError('Invalid field', { field: 'email' });
      expect(validationErr.code).toBe('VALIDATION_ERROR');
      expect(validationErr.statusCode).toBe(400);

      const notFoundErr = new NotFoundError('User');
      expect(notFoundErr.message).toBe('User not found');
      expect(notFoundErr.statusCode).toBe(404);

      const authErr = new UnauthorizedError();
      expect(authErr.statusCode).toBe(401);

      const forbiddenErr = new ForbiddenError();
      expect(forbiddenErr.statusCode).toBe(403);
    });
  });

  describe('ErrorHandler', () => {
    it('should return the AppError if input is already AppError', () => {
      const original = new ValidationError('Bad Input');
      const handled = ErrorHandler.handle(original);
      expect(handled).toBe(original);
    });

    it('should convert standard Error to AppError', () => {
      const standardErr = new Error('Database disconnected');
      const handled = ErrorHandler.handle(standardErr);
      
      expect(handled).toBeInstanceOf(AppError);
      expect(handled.code).toBe('INTERNAL_ERROR');
      expect(handled.message).toBe('Database disconnected');
      expect(handled.statusCode).toBe(500);
      expect(handled.details?.stack).toBeDefined();
    });

    it('should convert unknown string or object to UNKNOWN_ERROR', () => {
      const handled = ErrorHandler.handle('Just a string error');
      
      expect(handled).toBeInstanceOf(AppError);
      expect(handled.code).toBe('UNKNOWN_ERROR');
      expect(handled.statusCode).toBe(500);
    });

    it('should format to response object correctly', () => {
      const err = new ValidationError('Bad Input', { field: 'name' });
      const response = ErrorHandler.toResponse(err);
      
      expect(response).toEqual({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Bad Input',
          details: { field: 'name' }
        }
      });
    });
  });
});
