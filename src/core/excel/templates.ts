import { ExcelTemplate } from './types';

export const PDR_FAMILIES_TEMPLATE: ExcelTemplate = {
  id: 'pdr-families',
  name: 'Part Families',
  description: 'Template for managing primary part families',
  portalId: 'PDR',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  sheets: [
    {
      name: 'Families',
      tableName: 'pdrFamilies',
      columns: [
        { header: 'Family ID', key: 'id', type: 'string', required: true, width: 15, validation: { pattern: '^[A-Za-z0-9-]+$' } },
        { header: 'Family Name', key: 'name', type: 'string', required: true, width: 25 },
        { header: 'Description', key: 'description', type: 'string', required: false, width: 40 },
        { header: 'Date Created', key: 'createdAt', type: 'date', required: false, width: 15, format: 'yyyy-mm-dd' }
      ]
    }
  ]
};

export const PDR_BLUEPRINTS_TEMPLATE: ExcelTemplate = {
  id: 'pdr-blueprints',
  name: 'Part Blueprints',
  description: 'Manage detailed part specification blueprints',
  portalId: 'PDR',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  sheets: [
    {
      name: 'Blueprints',
      tableName: 'pdrBlueprints',
      columns: [
        { header: 'Blueprint ID', key: 'id', type: 'string', required: true, width: 15 },
        { header: 'Template ID', key: 'templateId', type: 'string', required: true, width: 15 },
        { header: 'Reference Code', key: 'reference', type: 'string', required: true, width: 20 },
        { header: 'Unit', key: 'unit', type: 'enum', required: true, width: 10, enum: ['Pcs', 'Kg', 'L', 'M', 'Box', 'Set'] },
        { header: 'Min Threshold', key: 'minThreshold', type: 'number', required: true, width: 15, validation: { min: 0 } },
        { header: 'Unit Price', key: 'unitPrice', type: 'number', required: false, width: 12, format: '#,##0.00', validation: { min: 0 } },
        { header: 'Description', key: 'description', type: 'string', required: false, width: 40 }
      ]
    }
  ]
};

export const INVENTORY_TEMPLATE: ExcelTemplate = {
  id: 'inventory',
  name: 'Inventory Stock',
  description: 'Template for managing inventory quantities',
  portalId: 'PDR',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  sheets: [
    {
      name: 'Inventory',
      tableName: 'inventory',
      columns: [
        { header: 'Stock ID', key: 'id', type: 'string', required: true, width: 15 },
        { header: 'Blueprint ID', key: 'blueprintId', type: 'string', required: true, width: 15 },
        { header: 'Warehouse ID', key: 'warehouseId', type: 'string', required: true, width: 15 },
        { header: 'Current Quantity', key: 'quantityCurrent', type: 'number', required: true, width: 15, validation: { min: 0 } },
        { header: 'Location Details', key: 'locationDetails', type: 'string', required: false, width: 25 },
        { header: 'Last Updated', key: 'updatedAt', type: 'date', required: false, width: 15, format: 'yyyy-mm-dd' }
      ]
    }
  ]
};

export const MOVEMENTS_TEMPLATE: ExcelTemplate = {
  id: 'movements',
  name: 'Stock Movements',
  description: 'Log and review IN/OUT stock transactions',
  portalId: 'PDR',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  sheets: [
    {
      name: 'Movements',
      tableName: 'movements',
      columns: [
        { header: 'Movement ID', key: 'id', type: 'string', required: true, width: 15 },
        { header: 'Stock ID', key: 'stockId', type: 'string', required: true, width: 15 },
        { header: 'Type', key: 'type', type: 'enum', required: true, width: 12, enum: ['IN', 'OUT', 'ADJUST'] },
        { header: 'Quantity', key: 'quantity', type: 'number', required: true, width: 10, validation: { min: 0 } },
        { header: 'Performed By', key: 'performedBy', type: 'string', required: true, width: 20 },
        { header: 'Timestamp', key: 'timestamp', type: 'string', required: true, width: 20 },
        { header: 'Notes', key: 'notes', type: 'string', required: false, width: 40 }
      ]
    }
  ]
};

export const MACHINES_TEMPLATE: ExcelTemplate = {
  id: 'machines',
  name: 'Machines & Equipment',
  description: 'Manage factory production lines and machines',
  portalId: 'FACTORY',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  sheets: [
    {
      name: 'Machines',
      tableName: 'machines',
      columns: [
        { header: 'Machine ID', key: 'id', type: 'string', required: true, width: 15 },
        { header: 'Name', key: 'name', type: 'string', required: true, width: 25 },
        { header: 'Sector ID', key: 'sectorId', type: 'string', required: true, width: 15 },
        { header: 'Family', key: 'family', type: 'string', required: false, width: 20 },
        { header: 'Reference', key: 'referenceCode', type: 'string', required: false, width: 20 },
        { header: 'Status', key: 'status', type: 'enum', required: true, width: 12, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED'] }
      ]
    }
  ]
};

export const TECHNICIANS_TEMPLATE: ExcelTemplate = {
  id: 'technicians',
  name: 'Staff & Technicians',
  description: 'Manage maintenance staff and roles',
  portalId: 'FACTORY',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  sheets: [
    {
      name: 'Technicians',
      tableName: 'technicians',
      columns: [
        { header: 'Staff ID', key: 'id', type: 'string', required: true, width: 15 },
        { header: 'Full Name', key: 'name', type: 'string', required: true, width: 25 },
        { header: 'Sector ID', key: 'sectorId', type: 'string', required: true, width: 15 },
        { header: 'Specialty', key: 'specialty', type: 'string', required: false, width: 20 }
      ]
    }
  ]
};

export const PM_SCHEDULES_TEMPLATE: ExcelTemplate = {
  id: 'pm-schedules',
  name: 'Maintenance Schedules',
  description: 'Manage preventive maintenance schedules',
  portalId: 'PREVENTIVE',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  sheets: [
    {
      name: 'Schedules',
      tableName: 'pmSchedules',
      columns: [
        { header: 'Schedule ID', key: 'id', type: 'string', required: true, width: 15 },
        { header: 'Machine ID', key: 'machineId', type: 'string', required: true, width: 15 },
        { header: 'Checklist ID', key: 'checklistId', type: 'string', required: true, width: 15 },
        { header: 'Frequency (Days)', key: 'frequencyDays', type: 'number', required: true, width: 15, validation: { min: 1 } },
        { header: 'Next Due Date', key: 'nextDueDate', type: 'date', required: true, width: 15, format: 'yyyy-mm-dd' },
        { header: 'Last Performed', key: 'lastPerformedAt', type: 'date', required: false, width: 15, format: 'yyyy-mm-dd' }
      ]
    }
  ]
};

export const ALL_TEMPLATES: Record<string, ExcelTemplate> = {
  'pdr-families': PDR_FAMILIES_TEMPLATE,
  'pdr-blueprints': PDR_BLUEPRINTS_TEMPLATE,
  'inventory': INVENTORY_TEMPLATE,
  'movements': MOVEMENTS_TEMPLATE,
  'machines': MACHINES_TEMPLATE,
  'technicians': TECHNICIANS_TEMPLATE,
  'pm-schedules': PM_SCHEDULES_TEMPLATE
};

export function getTemplatesByPortal(portalId: string): ExcelTemplate[] {
  return Object.values(ALL_TEMPLATES).filter(t => t.portalId === portalId);
}

export function getTemplate(templateId: string): ExcelTemplate | undefined {
  return ALL_TEMPLATES[templateId];
}
