// src/core/security/InputSanitizer.ts
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('InputSanitizer');

export class InputSanitizer {
  /**
   * Sanitizes basic HTML elements and JavaScript snippets.
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    let cleaned = input;
    // Strip script tags
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Strip dangerous attributes (onload, onerror, onclick, etc)
    cleaned = cleaned.replace(/on\w+\s*=\s*".*?"/gi, '');
    cleaned = cleaned.replace(/on\w+\s*=\s*'.*?'/gi, '');
    // Escape standard tags
    cleaned = cleaned.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    if (cleaned !== input) {
      logger.warn('Sanitizer detected and cleaned malicious script tags or attributes.');
    }
    
    return cleaned;
  }

  /**
   * Escapes characters to prevent basic SQLite/SQL style syntax issues inside inputs
   */
  static sanitizeSql(input: string): string {
    if (typeof input !== 'string') return '';
    return input.replace(/['"\\#]/g, (char) => {
      switch (char) {
        case "'": return "''";
        case '"': return '""';
        case '\\': return '\\\\';
        default: return '';
      }
    });
  }

  /**
   * Cleans an entire object by recursively applying sanitization
   */
  static sanitizeObject<T>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;

    const copy = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in copy) {
      const val = (copy as any)[key];
      if (typeof val === 'string') {
        (copy as any)[key] = this.sanitizeHtml(val);
      } else if (typeof val === 'object' && val !== null) {
        (copy as any)[key] = this.sanitizeObject(val);
      }
    }

    return copy as T;
  }
}
