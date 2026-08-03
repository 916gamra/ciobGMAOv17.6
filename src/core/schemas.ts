import { z } from 'zod';

export const userSchema = z.object({
  name: z.string()
    .min(3, 'Full name must be at least 3 characters long')
    .max(100, 'Full name cannot exceed 100 characters'),
  pin: z.string()
    .min(4, 'PIN must be at least 4 digits')
    .max(6, 'PIN cannot exceed 6 digits')
    .regex(/^[0-9]+$/, 'PIN must contain only numbers'),
  role: z.enum(['Technician', 'Engineer', 'Manager', 'Admin', 'Super Administrator']),
  color: z.string().min(1, 'Color selection is required'),
  allowedPortals: z.array(z.string()).min(1, 'At least one portal access is required')
});

export type UserInput = z.infer<typeof userSchema>;

export const machineSchema = z.object({
  name: z.string().min(2, 'Machine name must be at least 2 characters').max(100),
  code: z.string().min(3).regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and dashes'),
  sectorId: z.string().uuid('Invalid sector ID')
});
