// src/core/validation/schemas.ts
import { z } from 'zod';
import { ValidationError, Result } from '@/core/error';

// Common Schemas
export const IdSchema = z.string().min(1, 'ID مطلوب');
export const EmailSchema = z.string().email('بريد إلكتروني غير صحيح');
export const PhoneSchema = z.string().regex(/^\+?[0-9]{10,}$/, 'رقم هاتف غير صحيح');
export const DateSchema = z.date();

// Inventory Schemas
export const InventorySchema = z.object({
  id: IdSchema,
  partId: IdSchema,
  quantity: z.number().min(0, 'الكمية يجب أن تكون موجبة'),
  location: z.string().min(1, 'الموقع مطلوب'),
  minStock: z.number().min(0, 'الحد الأدنى يجب أن يكون موجباً'),
  maxStock: z.number().min(0, 'الحد الأقصى يجب أن يكون موجباً'),
  lastUpdated: DateSchema,
});

export const CreateInventorySchema = InventorySchema.omit({
  id: true,
  lastUpdated: true,
});

export type Inventory = z.infer<typeof InventorySchema>;
export type CreateInventoryInput = z.infer<typeof CreateInventorySchema>;

// Machine Schemas
export const MachineSchema = z.object({
  id: IdSchema,
  name: z.string().min(1, 'الاسم مطلوب'),
  sectorId: IdSchema,
  status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'BROKEN']),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
});

export const CreateMachineSchema = MachineSchema.omit({ id: true });

export type Machine = z.infer<typeof MachineSchema>;
export type CreateMachineInput = z.infer<typeof CreateMachineSchema>;

// Part Schemas
export const PartSchema = z.object({
  id: IdSchema,
  code: z.string().min(1, 'الكود مطلوب'),
  name: z.string().min(1, 'الاسم مطلوب'),
  category: z.string().min(1, 'الفئة مطلوبة'),
  manufacturer: z.string().optional(),
  unit: z.enum(['PIECE', 'KG', 'LITER']).default('PIECE'),
  price: z.number().min(0, 'السعر يجب أن يكون موجباً'),
});

export const CreatePartSchema = PartSchema.omit({ id: true });

export type Part = z.infer<typeof PartSchema>;
export type CreatePartInput = z.infer<typeof CreatePartSchema>;

// Validator Class
export class Validator {
  static validate<T>(schema: z.ZodSchema, data: unknown): T {
    try {
      return schema.parse(data) as T;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new ValidationError(messages, error.issues);
      }
      throw error;
    }
  }

  static safeValidate<T>(
    schema: z.ZodSchema,
    data: unknown
  ): Result<T, ValidationError> {
    try {
      const validated = schema.parse(data) as T;
      return { ok: true, value: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return {
          ok: false,
          error: new ValidationError(messages, error.issues),
        };
      }
      return {
        ok: false,
        error: new ValidationError('Validation failed'),
      };
    }
  }
}
