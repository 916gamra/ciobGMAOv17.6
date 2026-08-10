// src/core/db.ts
import Dexie, { type Table } from 'dexie';
import { applyEncryptionHooks } from './security/DatabaseEncryption';
import 'dexie-export-import';
import type { ExcelTemplate, ExcelBackup } from './excel/types';

// --- 1. Domain Interfaces (PDR Engine) ---

export interface PdrFamily {
  id: string; // UUID
  name: string;
  description?: string;
  createdAt: string;
  group?: 'mecanique' | 'hydraulique' | 'electronique' | 'pneumatique' | 'electrique' | 'autre';
}

export interface PdrTemplate {
  id: string; // UUID
  familyId: string; // Foreign Key to PdrFamily
  name: string;
  skuBase: string; // e.g., 'RLM-6200'
  description?: string;
  createdAt: string;
}

export interface PdrBlueprint {
  id: string; // UUID
  templateId: string; // Foreign Key to PdrTemplate
  reference: string; // Exact Part Number e.g., '6205-2RS'
  unit: string; // 'Pcs', 'Kg', 'Liters'
  minThreshold: number;
  createdAt: string;
  model?: string;
  powerOrForce?: string;
  technicalSpecs?: string;
}

// --- 2. Domain Interfaces (Stock Engine) ---

export interface StockItem {
  id: string; // UUID
  blueprintId: string; // Foreign Key to PdrBlueprint
  warehouseId: string; // 'WH-MAGASIN' or 'WH-DEPOT'
  quantityCurrent: number;
  locationDetails?: string; // e.g., 'Aisle 3, Shelf B'
  updatedAt: string;
  condition?: 'NEW' | 'USED' | 'REFURBISHED' | 'LEGACY';
}

export interface StockMovement {
  id: string; // UUID
  stockId: string; // Foreign Key to StockItem
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  performedBy: string; // User ID or Name
  notes?: string;
  timestamp: string;
  machineId?: string; // Optional reference to physical Machine consumed on
}

// --- 3. Domain Interfaces (Procurement Engine) ---

export type OrderStatus = 'PENDING' | 'ORDERED' | 'FULFILLED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string; // UUID
  supplierName: string;
  status: OrderStatus;
  orderDate: string;
  expectedDelivery?: string;
  createdAt: string;
}

export interface PurchaseOrderLine {
  id: string; // UUID
  orderId: string; // Foreign Key to PurchaseOrder
  blueprintId: string; // Foreign Key to PdrBlueprint
  quantity: number;
  unitPrice?: number;
}

// --- 4. Domain Interfaces (Organization & Requisition Engine) ---

export interface Sector {
  id: string; // SEC-01 to SEC-15
  name: string;
  description?: string;
  managerName: string;
  preventiveTechId?: string; // One assigned PM technician
  status: 'Active' | 'Dormant';
}

export interface Technician {
  id: string; // UUID
  name: string;
  sectorId: string; // Foreign Key to Sector
  specialty?: string;
}

export interface MachineFamily {
  id: string; // UUID
  name: string;
  code: string; // 2 Letters e.g. ST
  description?: string;
  technicalDescription?: string; // Mechanical process details
  createdAt: string;
}

export type MachineOperationType = 'A' | 'I' | 'H' | 'P' | 'E' | 'M' | 'S';

export interface MachineTemplate {
  id: string; // UUID
  familyId: string;
  name: string;
  type: MachineOperationType; // New: Automatic, Hydraulic, Pneumatic, Electric, Manual
  skuBase: string; // e.g. STM
  description?: string;
  technicalDescription?: string; // Functional identity details
  createdAt: string;
}

export interface MachineBlueprint {
  id: string; // UUID
  templateId: string;
  reference: string; // e.g. SAT1-00
  brand: string; // e.g. Siemens
  model: string; // Manufacturer Model
  powerOrForce: string; // e.g. 15 kW, 50 Tonnes
  energySource: string; // 380v, 220v, Pneumatic, Hydraulic, Mixed
  technicalSpecs?: string;
  category?: string; // Optional metadata
  componentIds?: string[];
  partTemplateIds?: string[]; // Direct link to PdrTemplate IDs (the composing standard parts)
  componentBlueprintIds?: string[]; // Direct link to Component Assemblies / Sub-systems
  pdrBlueprintIds?: string[]; // Direct link to commercial spare parts (PdrBlueprint) from PDR Catalog
  createdAt: string;
}

export interface Machine {
  id: string; // UUID
  blueprintId?: string; // Foreign Key to MachineBlueprint (Optional in Lite mode)
  templateId?: string; // Foreign Key to MachineTemplate (Required in Lite mode)
  referenceCode: string; // e.g. SAT1-01
  serialNumber: string; // Physical serial number
  manufacturingYear: number;
  sectorId: string; // Foreign Key to Sector
  technicianId?: string; // Foreign Key to Technician for monthly sweep
  status: 'Active' | 'Standby' | 'Maintenance';
}

export interface MachinePartMapping {
  id: string; // UUID
  machineId: string; // Foreign Key to Machine
  blueprintId: string; // Foreign Key to PdrBlueprint
  addedAt: string;
  quantity?: number; // Crucial: how many of this part the machine originally contains/uses
}

export type RequisitionStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED';

export interface PartRequisition {
  id: string; // UUID
  technicianId: string; // Foreign Key to Technician
  machineId: string; // Foreign Key to Machine
  status: RequisitionStatus;
  requestDate: string;
}

export interface PartRequisitionLine {
  id: string; // UUID
  requisitionId: string; // Foreign Key to PartRequisition
  blueprintId: string; // Foreign Key to PdrBlueprint
  quantity: number;
}

// --- 5. Domain Interfaces (Preventive Maintenance Engine - Inheritance Pattern) ---

export type TaskFamily = 'MEC' | 'ELE' | 'HYD' | 'PNU' | 'ELN';
export type TaskFrequencyType = 'TIME' | 'COUNTER';

// The "Knowledge Base" Task Definition
export interface PreventiveTask {
  id: string; // UUID
  title: string;
  actionId?: string; // Link to StandardAction
  description?: string;
  pdrFamilyId: string;
  pdrTemplateId?: string; // Optional link to a PdrTemplate
  frequencyType: TaskFrequencyType;
  frequencyValue: number; // e.g. 30 (days) or 10000 (cycles)
  createdAt: string;
}

export interface ComponentTemplate {
  id: string; // UUID
  name: string; // e.g. "Electric Motor"
  family: string; // e.g. MEC, ELE, HYD, PNU, ELN
  description?: string;
  criticality?: string;
  linkedPartTemplateIds?: string[]; // PDR Templates
  taskIds?: string[];
}

export interface ComponentBlueprint {
  id: string; // [Family]-[001]
  templateId: string;
  reference: string; // e.g. "Siemens 5.5kW"
  brand?: string;
  specs?: string;
}

// Deprecated, use ComponentTemplate
export interface StandardComponent {
  id: string;
  name: string;
  family: string;
  description?: string;
  criticality?: string;
  linkedPartTemplateIds?: string[];
  taskIds?: string[];
}

export interface StandardAction {
  id: string;
  name: string;
  code?: string;
  type: string;
  description?: string;
}

// Tasks assigned to a Machine Blueprint (Model Inheritance)
export interface BlueprintTask {
  id: string; // UUID
  machineBlueprintId: string; // Foreign Key to MachineBlueprint
  taskId: string; // Foreign Key to PreventiveTask
  isEnabled: boolean; // default true
  addedAt: string;
}

export interface PreventiveCard {
  id: string; // UUID
  templateId: string; // Foreign Key to MachineTemplate
  name: string;
  taskIds: string[]; // List of PreventiveTask IDs in this card
  createdAt: string;
}

// Tasks assigned or overridden on a specific Machine Instance
export interface MachineTask {
  id: string; // UUID
  machineId: string; // Foreign Key to Machine
  taskId: string; // Foreign Key to PreventiveTask
  isInherited: boolean; // true if it cascaded from BlueprintTask
  isEnabled: boolean; // allow toggling inherited tasks for a specific unit
  addedAt: string;
  technicianId?: string; // Specific technician for this task on this machine
  scheduledTime?: string; // specific time of day e.g. "10:00"
}

export type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';

export interface ConsumedPartClaim {
  id?: string;
  isNew: boolean;
  stockId?: string; // Foreign Key to StockItem if NEW
  blueprintId?: string; // Foreign Key to PdrBlueprint if USED/NEW
  quantity: number;
  reconciled?: boolean; // True if matched/reconciled by storekeeper
  reconciledAt?: string;
  reconciledBy?: string;
  deductedStock?: boolean; // True if physical stock deduction was triggered
}

// Log of task executions
export interface TaskExecution {
  id: string; // UUID
  machineId: string;
  taskId: string;
  status: WorkOrderStatus;
  scheduledDate: string;
  executedAt?: string;
  doneBy?: string; // Technician ID
  notes?: string;
  durationMinutes?: number;
  overriddenByAdmin?: boolean;
  adminUserId?: string;
  adminUserName?: string;
  componentCondition?: 'EXCELLENT' | 'WATCHFUL' | 'CRITICAL';
  componentId?: string; // Standard Component / ComponentTemplate ID
  actionId?: string;    // Standard Action ID
  serviceType?: "PREV" | "CORR";

  // --- CORRECTIVE WIZARD & STOREKEEPER RECONCILIATION FIELDS ---
  bonId?: string; // رقم بون الإصلاح (Voucher / Ticket ID)
  sectorId?: string; // القطاع المعني
  downTimeStart?: string; // تاريخ ووقت توقف الآلة
  interventionStart?: string; // بداية التشخيص والتدخل
  interventionEnd?: string; // نهاية التدخل
  operatorSymptom?: string; // الأعراض الأولية المسجلة في البون
  domainFamily?: 'MEC' | 'ELE' | 'HYD' | 'PNU' | 'ELN'; // المجال / العائلة
  rootCause?: string; // السبب الرئيسي الفعلي
  actionType?: 'REPAIR' | 'REPLACE' | 'ADJUST' | 'REMOVE' | 'CLEAN'; // نوع الإجراء
  outcomeStatus?: 'COMPLETED' | 'PENDING_PARTS' | 'WORKSHOP_FABRICATION'; // نتيجة التدخل
  claimedParts?: ConsumedPartClaim[]; // القطع المسجلة في التدخل
  reconciliationStatus?: 'PENDING_MATCH' | 'RECONCILED' | 'STOCK_DEDUCTED'; // حالة المطابقة مع مسؤول المخزن
}

export interface FailureCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface FailureTemplate {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserOverride {
  id: string; // The fixed slot ID (e.g. SY-ADMIN, OP-00001)
  name?: string;
  pin?: string;
  color?: string;
  isActive?: boolean;
  realBadgeId?: string;
  allowedPortals?: string[];
  lastActiveAt?: string;
}

// Users (Preserving your existing User schema)
export interface User {
  id: string; // Changed from number to string for slot ID
  name: string;
  role: string;
  initials: string;
  color: string;
  pin: string;
  isPrimary?: boolean;
  isSystemRoot?: boolean;
  allowedPortals?: string[];
  lastActiveAt?: string;
  realBadgeId?: string; // Physical factory badge number
  isActive?: boolean;
}

export type AuditLogSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditLog {
  id: string; // UUID
  userId: string | number;
  userName: string;
  action: string; // 'CREATE', 'DELETE', 'UPDATE', 'LOGIN', 'EXPORT', 'BACKUP'
  entityType: string; // 'PDR_BLUEPRINT', 'STOCK_ITEM', 'USER', etc.
  entityId: string;
  details: string; // JSON string or plain text
  timestamp: string;
  severity: AuditLogSeverity;
  deviceInfo?: string;
}

// --- 3. The Database Engine ---

export class GmaoDatabase extends Dexie {
  // PDR Library Tables
  pdrFamilies!: Table<PdrFamily, string>;
  pdrTemplates!: Table<PdrTemplate, string>;
  pdrBlueprints!: Table<PdrBlueprint, string>;
  
  // Machine Master Data Tables
  machineFamilies!: Table<MachineFamily, string>;
  machineTemplates!: Table<MachineTemplate, string>;
  machineBlueprints!: Table<MachineBlueprint, string>;
  
  // Stock Engine Tables
  inventory!: Table<StockItem, string>;
  movements!: Table<StockMovement, string>;
  
  // Procurement Engine Tables
  purchaseOrders!: Table<PurchaseOrder, string>;
  purchaseOrderLines!: Table<PurchaseOrderLine, string>;
  
  // Organization & Requisition Engine Tables
  sectors!: Table<Sector, string>;
  technicians!: Table<Technician, string>;
  machines!: Table<Machine, string>;
  machinePartMappings!: Table<MachinePartMapping, string>;
  partRequisitions!: Table<PartRequisition, string>;
  partRequisitionLines!: Table<PartRequisitionLine, string>;

  // Preventive Maintenance Tables
  preventiveTasks!: Table<PreventiveTask, string>;
  blueprintTasks!: Table<BlueprintTask, string>;
  machineTasks!: Table<MachineTask, string>;
  taskExecutions!: Table<TaskExecution, string>;
  
  componentTemplates!: Table<ComponentTemplate, string>;
  componentBlueprints!: Table<ComponentBlueprint, string>;
  standardComponents!: Table<StandardComponent, string>;
  standardActions!: Table<StandardAction, string>;
  preventiveCards!: Table<PreventiveCard, string>;

  failureCategories!: Table<FailureCategory, string>;
  failureTemplates!: Table<FailureTemplate, string>;

  // System Tables
  userOverrides!: Table<UserOverride, string>;
  auditLogs!: Table<AuditLog, string>;
  
  // Excel Integration Tables
  excelTemplates!: Table<ExcelTemplate, string>;
  excelBackups!: Table<ExcelBackup, string>;

  // User Ready-to-Use compatibility tables
  parts!: Table<any, string>;
  transactions!: Table<any, string>;
  logs!: Table<any, string>;

  constructor(name: string = 'CIOB_GMAO_DB') {
    super(name);
    
    // Schema Version 14 (Preventive Maintenance Inheritance Update)
    this.version(14).stores({
      pdrFamilies: 'id, name',
      pdrTemplates: 'id, familyId, name, skuBase',
      pdrBlueprints: 'id, templateId, reference',
      machineFamilies: 'id, name',
      machineTemplates: 'id, familyId, name, skuBase',
      machineBlueprints: 'id, templateId, reference',
      inventory: 'id, blueprintId, warehouseId',
      movements: 'id, stockId, type, timestamp',
      purchaseOrders: 'id, supplierName, status, orderDate',
      purchaseOrderLines: 'id, orderId, blueprintId',
      sectors: 'id, name',
      technicians: 'id, name, sectorId',
      machines: 'id, blueprintId, sectorId, technicianId',
      machinePartMappings: 'id, machineId, blueprintId',
      partRequisitions: 'id, technicianId, machineId, status, requestDate',
      partRequisitionLines: 'id, requisitionId, blueprintId',
      preventiveTasks: 'id, pdrFamilyId, pdrTemplateId, actionId',
      blueprintTasks: 'id, machineBlueprintId, taskId',
      machineTasks: 'id, machineId, taskId',
      taskExecutions: 'id, machineId, taskId, status, scheduledDate',
      userOverrides: 'id, isActive, realBadgeId',
      auditLogs: 'id, userId, action, entityType, timestamp, severity',
      excelTemplates: 'id, portalId, name',
      excelBackups: 'id, portalId, timestamp'
    });

    // Schema Version 15 (Standard Modular Component Assembly)
    this.version(15).stores({
      standardComponents: 'id, name, family'
    });

    // Schema Version 16 (Component Anatomy & Action Taxonomy v17.4)
    this.version(16).stores({
      standardComponents: 'id, name, family, criticality',
      standardActions: 'id, name, type'
    });

    // Schema Version 17 (Unified Service Entry Links tracking)
    this.version(17).stores({
      taskExecutions: 'id, machineId, taskId, status, scheduledDate, componentId, actionId, serviceType'
    });

    // Schema Version 18 (Allow direct Template association for lite registered machines)
    this.version(18).stores({
      machines: 'id, blueprintId, templateId, sectorId, technicianId'
    });

    // Schema Version 19 (Mechanisms / Architecture & Schematics Integration)
    this.version(19).stores({
      standardComponents: 'id, name, family, criticality',
      standardActions: 'id, name, type'
    });

    // Schema Version 20 (Unified Master Schema containing all system tables)
    this.version(20).stores({
      pdrFamilies: 'id, name',
      pdrTemplates: 'id, familyId, name, skuBase',
      pdrBlueprints: 'id, templateId, reference',
      machineFamilies: 'id, name',
      machineTemplates: 'id, familyId, name, skuBase',
      machineBlueprints: 'id, templateId, reference',
      inventory: 'id, blueprintId, warehouseId',
      movements: 'id, stockId, type, timestamp',
      purchaseOrders: 'id, supplierName, status, orderDate',
      purchaseOrderLines: 'id, orderId, blueprintId',
      sectors: 'id, name',
      technicians: 'id, name, sectorId',
      machines: 'id, blueprintId, templateId, sectorId, technicianId',
      machinePartMappings: 'id, machineId, blueprintId',
      partRequisitions: 'id, technicianId, machineId, status, requestDate',
      partRequisitionLines: 'id, requisitionId, blueprintId',
      preventiveTasks: 'id, pdrFamilyId, pdrTemplateId, actionId',
      blueprintTasks: 'id, machineBlueprintId, taskId',
      machineTasks: 'id, machineId, taskId',
      taskExecutions: 'id, machineId, taskId, status, scheduledDate, componentId, actionId, serviceType',
      standardComponents: 'id, name, family, criticality',
      standardActions: 'id, name, type',
      userOverrides: 'id, isActive, realBadgeId',
      auditLogs: 'id, userId, action, entityType, timestamp, severity',
      excelTemplates: 'id, portalId, name',
      excelBackups: 'id, portalId, timestamp'
    });

    // Schema Version 21 (Action Codes)
    this.version(21).stores({
      standardActions: 'id, code, name, type'
    });

    // Schema Version 22 (Preventive Cards for templates)
    this.version(22).stores({
      pdrFamilies: 'id, name',
      pdrTemplates: 'id, familyId, name, skuBase',
      pdrBlueprints: 'id, templateId, reference',
      machineFamilies: 'id, name',
      machineTemplates: 'id, familyId, name, skuBase',
      machineBlueprints: 'id, templateId, reference',
      inventory: 'id, blueprintId, warehouseId',
      movements: 'id, stockId, type, timestamp',
      purchaseOrders: 'id, supplierName, status, orderDate',
      purchaseOrderLines: 'id, orderId, blueprintId',
      sectors: 'id, name',
      technicians: 'id, name, sectorId',
      machines: 'id, blueprintId, templateId, sectorId, technicianId',
      machinePartMappings: 'id, machineId, blueprintId',
      partRequisitions: 'id, technicianId, machineId, status, requestDate',
      partRequisitionLines: 'id, requisitionId, blueprintId',
      preventiveTasks: 'id, pdrFamilyId, pdrTemplateId, actionId',
      blueprintTasks: 'id, machineBlueprintId, taskId',
      machineTasks: 'id, machineId, taskId',
      taskExecutions: 'id, machineId, taskId, status, scheduledDate, componentId, actionId, serviceType',
      standardComponents: 'id, name, family, criticality',
      standardActions: 'id, code, name, type',
      userOverrides: 'id, isActive, realBadgeId',
      auditLogs: 'id, userId, action, entityType, timestamp, severity',
      excelTemplates: 'id, portalId, name',
      excelBackups: 'id, portalId, timestamp',
      preventiveCards: 'id, templateId, name'
    });

    // Schema Version 24 (Corrective Wizard & Reconciliation indexes)
    this.version(24).stores({
      pdrFamilies: 'id, name',
      pdrTemplates: 'id, familyId, name, skuBase',
      pdrBlueprints: 'id, templateId, reference',
      machineFamilies: 'id, name',
      machineTemplates: 'id, familyId, name, skuBase',
      machineBlueprints: 'id, templateId, reference',
      inventory: 'id, blueprintId, warehouseId',
      movements: 'id, stockId, type, timestamp',
      purchaseOrders: 'id, supplierName, status, orderDate',
      purchaseOrderLines: 'id, orderId, blueprintId',
      sectors: 'id, name',
      technicians: 'id, name, sectorId',
      machines: 'id, blueprintId, templateId, sectorId, technicianId',
      machinePartMappings: 'id, machineId, blueprintId',
      partRequisitions: 'id, technicianId, machineId, status, requestDate',
      partRequisitionLines: 'id, requisitionId, blueprintId',
      preventiveTasks: 'id, pdrFamilyId, pdrTemplateId, actionId',
      blueprintTasks: 'id, machineBlueprintId, taskId',
      machineTasks: 'id, machineId, taskId',
      taskExecutions: 'id, machineId, taskId, status, scheduledDate, componentId, actionId, serviceType, bonId, reconciliationStatus',
      componentTemplates: 'id, family, name',
      componentBlueprints: 'id, templateId, reference',
      standardComponents: 'id, name, family, criticality',
      standardActions: 'id, code, name, type',
      userOverrides: 'id, isActive, realBadgeId',
      auditLogs: 'id, userId, action, entityType, timestamp, severity',
      excelTemplates: 'id, portalId, name',
      excelBackups: 'id, portalId, timestamp',
      preventiveCards: 'id, templateId, name'
    });

    // Schema Version 25 (Failure Catalog for Corrective Ops)
    this.version(25).stores({
      pdrFamilies: 'id, name',
      pdrTemplates: 'id, familyId, name, skuBase',
      pdrBlueprints: 'id, templateId, reference',
      machineFamilies: 'id, name',
      machineTemplates: 'id, familyId, name, skuBase',
      machineBlueprints: 'id, templateId, reference',
      inventory: 'id, blueprintId, warehouseId',
      movements: 'id, stockId, type, timestamp',
      purchaseOrders: 'id, supplierName, status, orderDate',
      purchaseOrderLines: 'id, orderId, blueprintId',
      sectors: 'id, name',
      technicians: 'id, name, sectorId',
      machines: 'id, blueprintId, templateId, sectorId, technicianId',
      machinePartMappings: 'id, machineId, blueprintId',
      partRequisitions: 'id, technicianId, machineId, status, requestDate',
      partRequisitionLines: 'id, requisitionId, blueprintId',
      preventiveTasks: 'id, pdrFamilyId, pdrTemplateId, actionId',
      blueprintTasks: 'id, machineBlueprintId, taskId',
      machineTasks: 'id, machineId, taskId',
      taskExecutions: 'id, machineId, taskId, status, scheduledDate, componentId, actionId, serviceType, bonId, reconciliationStatus',
      componentTemplates: 'id, family, name',
      componentBlueprints: 'id, templateId, reference',
      standardComponents: 'id, name, family, criticality',
      standardActions: 'id, code, name, type',
      userOverrides: 'id, isActive, realBadgeId',
      auditLogs: 'id, userId, action, entityType, timestamp, severity',
      excelTemplates: 'id, portalId, name',
      excelBackups: 'id, portalId, timestamp',
      preventiveCards: 'id, templateId, name',
      failureCategories: 'id, name',
      failureTemplates: 'id, categoryId, name'
    });

    // Schema Version 26 (User Ready-to-Use compatibility integration)
    this.version(26).stores({
      pdrFamilies: 'id, name',
      pdrTemplates: 'id, familyId, name, skuBase',
      pdrBlueprints: 'id, templateId, reference',
      machineFamilies: 'id, name',
      machineTemplates: 'id, familyId, name, skuBase',
      machineBlueprints: 'id, templateId, reference',
      inventory: 'id, blueprintId, warehouseId, partId, location',
      movements: 'id, stockId, type, timestamp',
      purchaseOrders: 'id, supplierName, status, orderDate',
      purchaseOrderLines: 'id, orderId, blueprintId',
      sectors: 'id, name',
      technicians: 'id, name, sectorId',
      machines: 'id, blueprintId, templateId, sectorId, technicianId',
      machinePartMappings: 'id, machineId, blueprintId',
      partRequisitions: 'id, technicianId, machineId, status, requestDate',
      partRequisitionLines: 'id, requisitionId, blueprintId',
      preventiveTasks: 'id, pdrFamilyId, pdrTemplateId, actionId',
      blueprintTasks: 'id, machineBlueprintId, taskId',
      machineTasks: 'id, machineId, taskId',
      taskExecutions: 'id, machineId, taskId, status, scheduledDate, componentId, actionId, serviceType, bonId, reconciliationStatus',
      componentTemplates: 'id, family, name',
      componentBlueprints: 'id, templateId, reference',
      standardComponents: 'id, name, family, criticality',
      standardActions: 'id, code, name, type',
      userOverrides: 'id, isActive, realBadgeId',
      auditLogs: 'id, userId, action, entityType, timestamp, severity',
      excelTemplates: 'id, portalId, name',
      excelBackups: 'id, portalId, timestamp',
      preventiveCards: 'id, templateId, name',
      failureCategories: 'id, name',
      failureTemplates: 'id, categoryId, name',
      // Ready-to-Use Tables:
      parts: 'id, code, category',
      transactions: 'id, inventoryId, type, timestamp',
      logs: '++id, timestamp, level, context'
    });
  }
}

const mainDb = new GmaoDatabase('CIOB_GMAO_DB');
const sandboxDb = new GmaoDatabase('CIOB_GMAO_SANDBOX_DB');

applyEncryptionHooks(mainDb);
applyEncryptionHooks(sandboxDb);

const getIsSandbox = () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('BDR_NEXUS_SANDBOX_MODE') === 'true';
};

export const db = new Proxy(mainDb, {
  get(target, prop, receiver) {
    const isSandbox = getIsSandbox();
    const activeDb = isSandbox ? sandboxDb : mainDb;
    const value = Reflect.get(activeDb, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(activeDb);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const isSandbox = getIsSandbox();
    const activeDb = isSandbox ? sandboxDb : mainDb;
    return Reflect.set(activeDb, prop, value, activeDb);
  }
}) as any as GmaoDatabase;
