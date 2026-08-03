import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { catalogRepository } from '../repositories/CatalogRepository';
import { z } from 'zod';
import { logger, validatePayload } from '@/core/logger';

// Schemas (Keeping them for validation layer before calling repository)
const familySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  group: z.enum(['mecanique', 'hydraulique', 'electronique', 'pneumatique', 'electrique', 'autre']).optional(),
});

const templateSchema = z.object({
  familyId: z.string().min(1),
  name: z.string().min(2).max(100),
  skuBase: z.string().min(2),
});

const blueprintSchema = z.object({
  id: z.string().optional(),
  templateId: z.string().uuid().or(z.string()), // or z.string() because templates are deterministic now too (e.g. temp-CO-A)
  reference: z.string().min(1),
  unit: z.enum(['Pcs', 'Liters', 'Kg', 'Meters']),
  minThreshold: z.number().min(0),
});

export function useMasterCatalogEngine() {
  const families = useLiveQuery(() => db.pdrFamilies.toArray(), []);
  const templates = useLiveQuery(() => db.pdrTemplates.toArray(), []);
  const blueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);

  const isLoading = families === undefined || templates === undefined || blueprints === undefined;

  const createFamily = async (payload: { name: string; description?: string; group?: 'mecanique' | 'hydraulique' | 'electronique' | 'pneumatique' | 'electrique' | 'autre' }) => {
    const validated = validatePayload(familySchema, payload, 'CREATE_FAMILY');
    return catalogRepository.createFamily(validated);
  };

  const createTemplate = async (payload: { familyId: string; name: string; skuBase: string }) => {
    const validated = validatePayload(templateSchema, payload, 'CREATE_TEMPLATE');
    return catalogRepository.createTemplate(validated);
  };

  const createBlueprint = async (payload: { id?: string; templateId: string; reference: string; unit: string; minThreshold: number }) => {
    const validated = validatePayload(blueprintSchema, payload, 'CREATE_BLUEPRINT');
    
    const blueprintData = {
      templateId: validated.templateId as string,
      reference: validated.reference.toUpperCase(),
      unit: validated.unit,
      minThreshold: validated.minThreshold
    };
    
    return catalogRepository.createBlueprint(
      validated.id ? { ...blueprintData, id: validated.id } : blueprintData
    );
  };

  return {
    families: families || [],
    templates: templates || [],
    blueprints: blueprints || [],
    isLoading,
    createFamily,
    createTemplate,
    createBlueprint
  };
}
