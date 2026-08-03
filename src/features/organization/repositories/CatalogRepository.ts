import { db, type PdrFamily, type PdrTemplate, type PdrBlueprint } from '@/core/db';
import { logger, PerformanceMonitor } from '@/core/logger';

export interface ICatalogRepository {
  getAllFamilies(): Promise<PdrFamily[]>;
  createFamily(family: Omit<PdrFamily, 'id' | 'createdAt'>): Promise<string>;
  
  getAllTemplates(): Promise<PdrTemplate[]>;
  createTemplate(template: Omit<PdrTemplate, 'id' | 'createdAt'>): Promise<string>;
  
  getAllBlueprints(): Promise<PdrBlueprint[]>;
  createBlueprint(blueprint: Omit<PdrBlueprint, 'id' | 'createdAt'> | PdrBlueprint): Promise<string>;
}

export class CatalogRepository implements ICatalogRepository {
  async getAllFamilies(): Promise<PdrFamily[]> {
    return PerformanceMonitor.measure('CatalogRepo.getAllFamilies', () => db.pdrFamilies.toArray());
  }

  async createFamily(family: Omit<PdrFamily, 'id' | 'createdAt'>): Promise<string> {
    return PerformanceMonitor.measure('CatalogRepo.createFamily', async () => {
      const id = crypto.randomUUID();
      await db.transaction('rw', [db.pdrFamilies, db.auditLogs], async () => {
        await db.pdrFamilies.add({
          id,
          ...family,
          createdAt: new Date().toISOString()
        });
        logger.info({ action: 'CREATE_FAMILY', entityType: 'FAMILY', entityId: id });
      });
      return id;
    });
  }

  async getAllTemplates(): Promise<PdrTemplate[]> {
    return PerformanceMonitor.measure('CatalogRepo.getAllTemplates', () => db.pdrTemplates.toArray());
  }

  async createTemplate(template: Omit<PdrTemplate, 'id' | 'createdAt'>): Promise<string> {
    return PerformanceMonitor.measure('CatalogRepo.createTemplate', async () => {
      const id = crypto.randomUUID();
      await db.transaction('rw', [db.pdrTemplates, db.auditLogs], async () => {
        await db.pdrTemplates.add({
          id,
          ...template,
          createdAt: new Date().toISOString()
        });
        logger.info({ action: 'CREATE_TEMPLATE', entityType: 'TEMPLATE', entityId: id });
      });
      return id;
    });
  }

  async getAllBlueprints(): Promise<PdrBlueprint[]> {
    return PerformanceMonitor.measure('CatalogRepo.getAllBlueprints', () => db.pdrBlueprints.toArray());
  }

  async createBlueprint(blueprint: Omit<PdrBlueprint, 'id' | 'createdAt'> | PdrBlueprint): Promise<string> {
    return PerformanceMonitor.measure('CatalogRepo.createBlueprint', async () => {
      const id = 'id' in blueprint && blueprint.id ? blueprint.id : crypto.randomUUID();
      await db.transaction('rw', [db.pdrBlueprints, db.auditLogs], async () => {
        await db.pdrBlueprints.add({
          ...blueprint,
          id,
          createdAt: new Date().toISOString()
        });
        logger.info({ action: 'CREATE_BLUEPRINT', entityType: 'BLUEPRINT', entityId: id });
      });
      return id;
    });
  }
}

export const catalogRepository = new CatalogRepository();
