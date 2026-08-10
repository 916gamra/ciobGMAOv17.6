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

// --- Industrial Kernel Phase 1 Schemas ---

export const plantSchema = z.object({
  id: z.string().min(1, 'Plant ID is required'),
  code: z.string().min(2, 'Plant code must be at least 2 characters'),
  name: z.string().min(2, 'Plant name must be at least 2 characters'),
  description: z.string().optional(),
  location: z.string().optional(),
  createdAt: z.string()
});
export type PlantInput = z.infer<typeof plantSchema>;

export const functionalLocationSchema = z.object({
  id: z.string().min(1, 'Location ID is required'),
  plantId: z.string().min(1, 'Plant reference is required'),
  sectorId: z.string().min(1, 'Sector reference is required'),
  code: z.string().min(2, 'Functional code must be at least 2 characters'),
  name: z.string().min(2, 'Location name is required'),
  parentLocationId: z.string().optional(),
  criticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  createdAt: z.string()
});
export type FunctionalLocationInput = z.infer<typeof functionalLocationSchema>;

export const assetDigitalTwinSchema = z.object({
  id: z.string().min(1, 'Asset ID is required'),
  referenceCode: z.string().min(2, 'Reference code is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  manufacturingYear: z.number().int().min(1900).max(2100),
  sectorId: z.string().min(1, 'Sector ID is required'),
  technicianId: z.string().optional(),
  status: z.enum(['Active', 'Standby', 'Maintenance']),
  functionalLocationId: z.string().optional(),
  lifecycleState: z.enum([
    'DESIGN', 'PROCURED', 'INSTALLED', 'COMMISSIONED', 
    'OPERATING', 'STANDBY', 'MAINTENANCE', 'DECOMMISSIONED', 'DISPOSED'
  ]).optional(),
  criticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  runningHours: z.number().min(0).optional(),
  healthIndex: z.number().min(0).max(100).optional(),
  installDate: z.string().optional()
});
export type AssetDigitalTwinInput = z.infer<typeof assetDigitalTwinSchema>;

export const installedComponentSchema = z.object({
  id: z.string().min(1, 'Component ID is required'),
  machineId: z.string().min(1, 'Machine ID is required'),
  componentBlueprintId: z.string().optional(),
  parentComponentId: z.string().optional(),
  serialNumber: z.string().optional(),
  name: z.string().min(2, 'Component name is required'),
  family: z.enum(['MEC', 'ELE', 'HYD', 'PNU', 'ELN']),
  installedAt: z.string(),
  healthIndex: z.number().min(0).max(100),
  condition: z.enum(['EXCELLENT', 'WATCHFUL', 'CRITICAL'])
});
export type InstalledComponentInput = z.infer<typeof installedComponentSchema>;

export const meterSchema = z.object({
  id: z.string().min(1, 'Meter ID is required'),
  assetId: z.string().min(1, 'Asset ID is required'),
  name: z.string().min(2, 'Meter name is required'),
  meterType: z.enum(['RUNNING_HOURS', 'CYCLES', 'PRESSURE', 'TEMPERATURE', 'VIBRATION', 'CUSTOM']),
  unit: z.string().min(1, 'Measurement unit is required'),
  currentReading: z.number().min(0),
  lastReadingAt: z.string(),
  warningThresholdHigh: z.number().optional(),
  criticalThresholdHigh: z.number().optional(),
  warningThresholdLow: z.number().optional(),
  criticalThresholdLow: z.number().optional(),
  resetPolicy: z.enum(['MANUAL', 'ROLLOVER']).optional(),
  rolloverValue: z.number().positive().optional(),
  createdAt: z.string()
});
export type MeterInput = z.infer<typeof meterSchema>;

export const meterReadingSchema = z.object({
  id: z.string().min(1, 'Reading ID is required'),
  meterId: z.string().min(1, 'Meter ID is required'),
  assetId: z.string().min(1, 'Asset ID is required'),
  readingValue: z.number().min(0),
  recordedAt: z.string(),
  recordedBy: z.string().min(1, 'Recorded by user is required'),
  source: z.enum(['MANUAL', 'IOT', 'WORK_ORDER']),
  notes: z.string().optional()
});
export type MeterReadingInput = z.infer<typeof meterReadingSchema>;

export const failureTaxonomySchema = z.object({
  id: z.string().min(1, 'Record ID is required'),
  workOrderId: z.string().optional(),
  assetId: z.string().min(1, 'Asset ID is required'),
  symptom: z.string().min(2, 'Symptom description is required'),
  failureMode: z.string().min(2, 'Failure mode is required'),
  failureMechanism: z.string().min(2, 'Failure mechanism is required'),
  causeCategory: z.string().min(2, 'Cause category is required'),
  consequenceCategory: z.string().min(2, 'Consequence category is required'),
  actionTaken: z.string().min(2, 'Action taken is required'),
  verificationResult: z.enum(['PASSED', 'FAILED', 'PENDING']),
  recordedAt: z.string()
});
export type FailureTaxonomyInput = z.infer<typeof failureTaxonomySchema>;

export const workRequestSchema = z.object({
  id: z.string().min(1, 'Request ID is required'),
  requestCode: z.string().min(3, 'Request code is required'),
  assetId: z.string().min(1, 'Asset ID is required'),
  sectorId: z.string().min(1, 'Sector ID is required'),
  symptom: z.string().min(3, 'Symptom description is required'),
  requestedBy: z.string().min(1, 'Requester name/ID is required'),
  priority: z.enum(['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  createdAt: z.string()
});
export type WorkRequestInput = z.infer<typeof workRequestSchema>;

export const workOrderSchema = z.object({
  id: z.string().min(1, 'Work Order ID is required'),
  code: z.string().min(3, 'Work Order code is required'),
  workRequestId: z.string().optional(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'INSPECTION', 'EMERGENCY']),
  priority: z.enum(['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW']),
  status: z.enum(['DRAFT', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  assetId: z.string().min(1, 'Asset ID is required'),
  functionalLocationId: z.string().optional(),
  sectorId: z.string().min(1, 'Sector ID is required'),
  assignedTechnicianId: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  actualStart: z.string().optional(),
  actualEnd: z.string().optional(),
  totalLaborHours: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type WorkOrderInput = z.infer<typeof workOrderSchema>;

export const downtimeEventSchema = z.object({
  id: z.string().min(1, 'Downtime Event ID is required'),
  workOrderId: z.string().optional(),
  assetId: z.string().min(1, 'Asset ID is required'),
  detectedAt: z.string(),
  acknowledgedAt: z.string().optional(),
  dispatchedAt: z.string().optional(),
  interventionStartedAt: z.string().optional(),
  repairCompletedAt: z.string().optional(),
  returnedToServiceAt: z.string().optional(),
  responseMinutes: z.number().min(0).optional(),
  diagnosticMinutes: z.number().min(0).optional(),
  trueRepairMinutes: z.number().min(0).optional(),
  totalDowntimeMinutes: z.number().min(0).optional(),
  reason: z.string().optional()
});
export type DowntimeEventInput = z.infer<typeof downtimeEventSchema>;

export const stockReservationSchema = z.object({
  id: z.string().min(1, 'Reservation ID is required'),
  stockItemId: z.string().min(1, 'Stock Item ID is required'),
  blueprintId: z.string().min(1, 'Blueprint ID is required'),
  workOrderId: z.string().min(1, 'Work Order ID is required'),
  quantityReserved: z.number().positive('Quantity reserved must be positive'),
  reservedBy: z.string().min(1, 'Reserved by user is required'),
  status: z.enum(['ACTIVE', 'FULFILLED', 'CANCELLED']),
  reservedAt: z.string()
});
export type StockReservationInput = z.infer<typeof stockReservationSchema>;

export const stockTransactionLedgerSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
  transactionType: z.enum([
    'RECEIPT', 'ISSUE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 
    'RESERVATION', 'UNRESERVATION', 'SCRAP', 'CONSUMPTION'
  ]),
  stockItemId: z.string().min(1, 'Stock Item ID is required'),
  blueprintId: z.string().min(1, 'Blueprint ID is required'),
  sourceWarehouseId: z.string().optional(),
  destWarehouseId: z.string().optional(),
  workOrderId: z.string().optional(),
  assetId: z.string().optional(),
  quantity: z.number().refine((val) => val !== 0, { message: 'Quantity cannot be zero' }),
  unitCost: z.number().min(0).optional(),
  totalValue: z.number().min(0).optional(),
  performedBy: z.string().min(1, 'User performing transaction is required'),
  reason: z.string().optional(),
  timestamp: z.string()
});
export type StockTransactionLedgerInput = z.infer<typeof stockTransactionLedgerSchema>;

// --- Industrial Kernel Phase 2 Schemas (Preventive Maintenance & Dynamic Scheduler) ---

export const pmChecklistItemSchema = z.object({
  taskIndex: z.number().int().min(0),
  description: z.string().min(2, 'Task description is required'),
  criticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  estimatedMinutes: z.number().min(1)
});

export const pmPlanPartRequirementSchema = z.object({
  blueprintId: z.string().min(1, 'Blueprint ID is required'),
  quantity: z.number().positive('Quantity must be greater than zero')
});

export const pmPlanSchema = z.object({
  id: z.string().min(1, 'PM Plan ID is required'),
  code: z.string().min(2, 'Plan code is required'),
  title: z.string().min(3, 'Plan title is required'),
  assetId: z.string().optional(),
  functionalLocationId: z.string().optional(),
  machineTemplateId: z.string().optional(),
  strategyType: z.enum(['CALENDAR_BASED', 'USAGE_BASED', 'METER_BASED', 'HYBRID']),
  frequencyDays: z.number().positive().optional(),
  frequencyHours: z.number().positive().optional(),
  meterId: z.string().optional(),
  thresholdValue: z.number().positive().optional(),
  priority: z.enum(['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW']),
  estimatedDurationMinutes: z.number().min(1),
  assignedTechnicianId: z.string().optional(),
  checklist: z.array(pmChecklistItemSchema),
  partsRequired: z.array(pmPlanPartRequirementSchema),
  isActive: z.boolean(),
  lastGeneratedAt: z.string().optional(),
  nextDueAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PmPlanInput = z.infer<typeof pmPlanSchema>;

// --- Industrial Kernel Phase 4 Schemas (RAMS Analytics, RCM & Cost Ledger) ---

export const maintenanceCostLedgerSchema = z.object({
  id: z.string().min(1, 'Cost Ledger ID is required'),
  workOrderId: z.string().optional(),
  assetId: z.string().min(1, 'Asset ID is required'),
  sectorId: z.string().min(1, 'Sector ID is required'),
  laborCost: z.number().min(0),
  materialCost: z.number().min(0),
  externalServiceCost: z.number().min(0),
  downtimeLossCost: z.number().min(0),
  totalCost: z.number().min(0),
  currency: z.string().default('MAD'),
  recordedAt: z.string()
});
export type MaintenanceCostLedgerInput = z.infer<typeof maintenanceCostLedgerSchema>;

export const rcmAnalysisSchema = z.object({
  id: z.string().min(1, 'RCM Analysis ID is required'),
  assetId: z.string().min(1, 'Asset ID is required'),
  functionDescription: z.string().min(3, 'Function description is required'),
  functionalFailure: z.string().min(3, 'Functional failure description is required'),
  failureMode: z.string().min(2, 'Failure mode is required'),
  failureEffect: z.string().min(3, 'Failure effect is required'),
  severityScore: z.number().int().min(1).max(10),
  occurrenceScore: z.number().int().min(1).max(10),
  detectionScore: z.number().int().min(1).max(10),
  rpn: z.number().int().min(1).max(1000),
  mitigationStrategy: z.enum(['PREVENTIVE', 'PREDICTIVE', 'RUN_TO_FAILURE', 'REDESIGN']),
  createdAt: z.string()
});
export type RcmAnalysisInput = z.infer<typeof rcmAnalysisSchema>;


