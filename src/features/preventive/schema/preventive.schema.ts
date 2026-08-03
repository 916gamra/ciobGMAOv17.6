import { z } from 'zod';

// Zod schema for strict input validation before Dexie storage
// Ensuring our offline-first data remains pure and pristine.

export const PmChecklistSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, "Checklist name must be at least 3 characters").max(100),
  description: z.string().optional(),
  targetMachineFamily: z.string().optional(),
  createdAt: z.string()
});

export const PmTaskSchema = z.object({
  id: z.string().uuid(),
  checklistId: z.string().uuid(),
  order: z.number().int().nonnegative(),
  taskDescription: z.string().min(5, "Task description must be clear and descriptive"),
  isCritical: z.boolean(),
  requiredPartTemplateId: z.string().uuid().optional()
});

export const PmScheduleSchema = z.object({
  id: z.string().uuid(),
  machineId: z.string().uuid("Invalid Machine ID"),
  checklistId: z.string().uuid("Invalid Checklist ID"),
  frequencyDays: z.number().min(1, "Frequency must be at least 1 day").max(3650, "Max frequency is 10 years"),
  lastPerformedAt: z.string().optional(),
  nextDueDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid ISO date string" }),
  isActive: z.boolean().default(true)
});

export const PmWorkOrderSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid().optional(),
  machineId: z.string().uuid(),
  checklistId: z.string().uuid(),
  technicianId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED']),
  scheduledDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid ISO date string" }),
  completedDate: z.string().optional(),
  notes: z.string().optional()
});

// Infer TypeScript types
export type ValidatedPmChecklist = z.infer<typeof PmChecklistSchema>;
export type ValidatedPmTask = z.infer<typeof PmTaskSchema>;
export type ValidatedPmSchedule = z.infer<typeof PmScheduleSchema>;
export type ValidatedPmWorkOrder = z.infer<typeof PmWorkOrderSchema>;
