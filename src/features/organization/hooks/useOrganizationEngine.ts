import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Sector, Technician, Machine, MachineFamily, MachineTemplate, MachineBlueprint } from '@/core/db';
import { db } from '@/core/db';
import { z } from 'zod';
import { validatePayload } from '@/core/logger';
import { organizationRepository } from '../repositories/OrganizationRepository';
import { INDUSTRIAL_CATALOG } from '@/core/config/industrialGenetics';

export interface EnrichedMachine extends Machine {
  name: string; // Synthesized name for UI display
  sectorName: string;
  managerName?: string;
  blueprintReference: string;
  templateName: string;
  skuBase: string;
  familyName: string;
}

export interface EnrichedTechnician extends Technician {
  sectorName: string;
}

// Validation Schemas
const sectorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  managerName: z.string().optional(),
  preventiveTechId: z.string().optional(),
  status: z.enum(['Active', 'Dormant']).optional()
});

const technicianSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  sectorId: z.string().min(1, 'Sector is required'),
  specialty: z.string().optional(),
});

const machineSchema = z.object({
  id: z.string().optional(),
  sectorId: z.string().min(1, 'Sector is required'),
  technicianId: z.string().min(1, 'Technician Owner is required'),
  blueprintId: z.string().optional().nullable(),
  templateId: z.string().min(1, 'Template is required'),
  referenceCode: z.string().min(2),
  serialNumber: z.string().min(1, 'Serial Number is required'),
  manufacturingYear: z.number().int().min(1900).max(2100),
  status: z.enum(['Active', 'Standby', 'Maintenance']).default('Active'),
});

export function useOrganizationEngine() {
  const sectors = useLiveQuery(() => organizationRepository.getAllSectors(), []);
  const technicians = useLiveQuery(() => organizationRepository.getAllTechnicians(), []);
  const machines = useLiveQuery(() => organizationRepository.getAllMachines(), []);
  
  // Master Data joins
  const blueprints = useLiveQuery(() => db.machineBlueprints.toArray(), []);
  const templates = INDUSTRIAL_CATALOG.templates;
  const families = INDUSTRIAL_CATALOG.families;

  const isLoading = sectors === undefined || technicians === undefined || machines === undefined || 
                    blueprints === undefined;

  const enrichedMachines = useMemo((): EnrichedMachine[] => {
    if (!machines || !sectors || !blueprints || !templates || !families) return [];
    
    const sectorMap = new Map<string, { name: string, managerName?: string }>();
    sectors.forEach(s => sectorMap.set(s.id, { name: s.name, managerName: s.managerName }));

    const familyMap = new Map(families.map(f => [f.id, f.name]));
    const templateMap = new Map(templates.map(t => [t.id, { name: t.name, familyId: t.familyId, skuBase: t.skuBase }]));
    const blueprintMap = new Map(blueprints.map(b => [b.id, { reference: b.reference, templateId: b.templateId }]));

    return machines.map(m => {
      const sectorInfo = sectorMap.get(m.sectorId);
      const blueprintInfo = m.blueprintId ? blueprintMap.get(m.blueprintId) : null;
      const templateId = m.templateId || (blueprintInfo ? blueprintInfo.templateId : null);
      const templateInfo = templateId ? templateMap.get(templateId) : null;
      const familyName = templateInfo ? (familyMap.get(templateInfo.familyId) || 'Unknown Family') : 'Unknown Family';
      
      return {
        ...m,
        sectorName: sectorInfo?.name || 'Unknown Sector',
        managerName: sectorInfo?.managerName,
        blueprintReference: blueprintInfo?.reference || 'Direct Asset (No Blueprint)',
        templateName: templateInfo?.name || 'Unknown Template',
        skuBase: templateInfo?.skuBase || 'UNKNOWN',
        familyName: familyName,
        name: `${templateInfo?.name || 'Unknown'} [${m.referenceCode}]`
      };
    });
  }, [machines, sectors, blueprints, templates, families]);

  const enrichedTechnicians = useMemo((): EnrichedTechnician[] => {
    if (!technicians || !sectors) return [];
    const sectorMap = new Map<string, string>();
    sectors.forEach(s => sectorMap.set(s.id, s.name));

    return technicians.map(t => ({
      ...t,
      sectorName: sectorMap.get(t.sectorId) || 'Unknown Sector'
    }));
  }, [technicians, sectors]);

  const createSector = async (name: string, description?: string, managerName?: string, preventiveTechId?: string) => {
    // We shouldn't use this. The form will just call updateSector on a dormant slot.
    throw new Error('Use updateSector to activate dormant slots.');
  };

  const updateSector = async (id: string, updates: Partial<Sector>) => {
    const validated = validatePayload(sectorSchema.partial(), updates, 'UPDATE_SECTOR');
    return organizationRepository.updateSector(id, validated);
  };

  const deleteSector = async (id: string) => {
    // Actually deactivating
    return organizationRepository.updateSector(id, { name: `Sector ${id.split('-')[1]}`, description: '', managerName: '', preventiveTechId: '', status: 'Dormant' });
  };

  const createTechnician = async (name: string, sectorId: string, specialty?: string) => {
    const validated = validatePayload(technicianSchema, { name, sectorId, specialty }, 'CREATE_TECHNICIAN');
    return organizationRepository.createTechnician(validated);
  };

  const updateTechnician = async (id: string, updates: Partial<Technician>) => {
    const validated = validatePayload(technicianSchema.partial(), updates, 'UPDATE_TECHNICIAN');
    return organizationRepository.updateTechnician(id, validated);
  };

  const deleteTechnician = async (id: string) => {
    return organizationRepository.deleteTechnician(id);
  };

  const createMachine = async (id: string, sectorId: string, technicianId: string, blueprintId: string | undefined, templateId: string, referenceCode: string, serialNumber: string, manufacturingYear: number) => {
    const payload = { id, sectorId, technicianId, blueprintId, templateId, referenceCode, serialNumber, manufacturingYear, status: 'Active' as const };
    const validated = validatePayload(machineSchema, payload, 'CREATE_MACHINE');
    return organizationRepository.createMachine(validated);
  };

  const updateMachine = async (id: string, updates: Partial<Machine>) => {
    const validated = validatePayload(machineSchema.partial(), updates, 'UPDATE_MACHINE');
    return organizationRepository.updateMachine(id, validated);
  };

  const deleteMachine = async (id: string) => {
    return organizationRepository.deleteMachine(id);
  };

  return {
    sectors: sectors || [],
    technicians: enrichedTechnicians,
    machines: enrichedMachines,
    families: families || [],
    isLoading,
    createSector,
    updateSector,
    deleteSector,
    createTechnician,
    updateTechnician,
    deleteTechnician,
    createMachine,
    updateMachine,
    deleteMachine
  };
}
