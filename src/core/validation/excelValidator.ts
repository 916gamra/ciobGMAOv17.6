/**
 * Excel Import Data Validator
 * Validates array of objects parsed from Excel/CSV against Zod Schemas
 */

import { z } from 'zod';

export interface RowValidationError {
  row: number;
  errors: string[];
}

export async function validateImportData<T>(
  rows: unknown[],
  schema: z.ZodSchema<T>
): Promise<{ valid: T[]; invalid: RowValidationError[] }> {
  const valid: T[] = [];
  const invalid: RowValidationError[] = [];

  rows.forEach((row, index) => {
    const result = schema.safeParse(row);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({
        row: index + 1,
        errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }
  });

  return { valid, invalid };
}
