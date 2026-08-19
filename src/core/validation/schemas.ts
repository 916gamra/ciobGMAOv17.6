/**
 * Comprehensive Zod Schemas for BDR Nexus Domain Models & ISO 14224 Compliance
 */

import { z } from 'zod';
import { ValidationError } from '@/core/error';

export class Validator {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const res = schema.safeParse(data);
    if (!res.success) {
      const msg = res.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ValidationError(msg);
    }
    return res.data;
  }

  static safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): { ok: boolean; data?: T; errors?: string[] } {
    const res = schema.safeParse(data);
    if (res.success) {
      return { ok: true, data: res.data };
    }
    return {
      ok: false,
      errors: res.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    };
  }
}

export const CreateInventorySchema = z.object({
  partId: z.string().min(1, 'Part ID is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  location: z.string().min(1, 'Location is required'),
  minStock: z.number().min(0, 'Minimum stock must be non-negative'),
  maxStock: z.number().min(0, 'Maximum stock must be non-negative'),
});

export type CreateInventoryInput = z.infer<typeof CreateInventorySchema>;

export interface Inventory {
  id: string;
  partId: string;
  quantity: number;
  location: string;
  minStock: number;
  maxStock: number;
  lastUpdated: Date;
}

export const MachineTemplateSchema = z.object({
  id: z.string().min(1),
  familyId: z.string().min(1),
  name: z.string().min(1).max(255),
  type: z.enum(['Automatic', 'Hydraulic', 'Pneumatic', 'Electric', 'Mechanical', 'General']),
  skuBase: z.string().regex(/^[A-Z0-9]{2,6}$/),
  description: z.string().optional()
});

export const MachineBlueprintSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
  reference: z.string().regex(/^[A-Z0-9]{2,6}-\d{3}$/), // e.g. ROB-001
  brand: z.string().min(1),
  model: z.string().min(1),
  powerOrForce: z.string().optional(),
  energySource: z.string().optional(),
  partTemplateIds: z.array(z.string()).optional()
});

export const StockItemSchema = z.object({
  id: z.string().min(1),
  blueprintId: z.string().min(1),
  warehouseId: z.string().min(1),
  location: z.string().min(1), // e.g. A-01/B-02/03
  quantity: z.number().int().min(0),
  minThreshold: z.number().int().min(0)
});

export const MachineSchema = z.object({
  id: z.string().min(1),
  blueprintId: z.string().optional(),
  templateId: z.string().optional(),
  referenceCode: z.string().min(1), // e.g. SAT1-01
  serialNumber: z.string().min(1),
  sectorId: z.string().min(1),
  functionalLocationId: z.string().optional(),
  lifecycleState: z.enum(['OPERATING', 'MAINTENANCE', 'STANDBY', 'STOPPED']).optional()
});

export const ISO14224FailureRecordSchema = z.object({
  equipmentId: z.string().min(1),
  subunitId: z.string().min(1),
  componentId: z.string().min(1),
  maintainableItemId: z.string().min(1),

  symptom: z.string().min(1),
  failureMode: z.string().min(1),
  failureMechanism: z.string().min(1),
  causeCategory: z.string().min(1),
  consequenceCategory: z.string().min(1),

  actionTaken: z.string().min(1),
  timestamp: z.number().int().positive()
});

export async function validateAndSave<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  saveFunction: (validated: T) => Promise<void>
): Promise<{ success: boolean; errors?: string[] }> {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
    };
  }

  await saveFunction(result.data);
  return { success: true };
}
