import { db, type Sector, type Technician, type Machine } from '@/core/db';
import { logger, PerformanceMonitor } from '@/core/logger';

export interface IOrganizationRepository {
  getAllSectors(): Promise<Sector[]>;
  createSector(sector: Omit<Sector, 'id'>): Promise<string>;
  updateSector(id: string, updates: Partial<Sector>): Promise<void>;
  deleteSector(id: string): Promise<void>;

  getAllTechnicians(): Promise<Technician[]>;
  createTechnician(technician: Omit<Technician, 'id'>): Promise<string>;
  updateTechnician(id: string, updates: Partial<Technician>): Promise<void>;
  deleteTechnician(id: string): Promise<void>;

  getAllMachines(): Promise<Machine[]>;
  createMachine(machine: Omit<Machine, 'id'> | Machine): Promise<string>;
  updateMachine(id: string, updates: Partial<Machine>): Promise<void>;
  deleteMachine(id: string): Promise<void>;
}

export class OrganizationRepository implements IOrganizationRepository {
  async getAllSectors(): Promise<Sector[]> {
    return PerformanceMonitor.measure('OrganizationRepo.getAllSectors', () => db.sectors.toArray());
  }

  async createSector(sector: Omit<Sector, 'id'>): Promise<string> {
    return PerformanceMonitor.measure('OrganizationRepo.createSector', async () => {
      const id = crypto.randomUUID();
      await db.transaction('rw', [db.sectors, db.auditLogs], async () => {
        await db.sectors.add({ id, ...sector });
        logger.info({ action: 'CREATE_SECTOR', entityType: 'SECTOR', entityId: id, details: sector });
      });
      return id;
    });
  }

  async updateSector(id: string, updates: Partial<Sector>): Promise<void> {
    return PerformanceMonitor.measure('OrganizationRepo.updateSector', async () => {
      await db.transaction('rw', [db.sectors, db.auditLogs], async () => {
        await db.sectors.update(id, updates);
        logger.info({ action: 'UPDATE_SECTOR', entityType: 'SECTOR', entityId: id, details: updates });
      });
    });
  }

  async deleteSector(id: string): Promise<void> {
    return PerformanceMonitor.measure('OrganizationRepo.deleteSector', async () => {
      await db.transaction('rw', [db.sectors, db.machines, db.technicians, db.auditLogs], async () => {
        const machinesCount = await db.machines.where('sectorId').equals(id).count();
        const techsCount = await db.technicians.where('sectorId').equals(id).count();
        
        if (machinesCount > 0 || techsCount > 0) {
          throw new Error(`Cannot delete sector: It contains ${machinesCount} machines and ${techsCount} technicians.`);
        }
        
        await db.sectors.delete(id);
        logger.info({ action: 'DELETE_SECTOR', entityType: 'SECTOR', entityId: id });
      });
    });
  }

  async getAllTechnicians(): Promise<Technician[]> {
    return PerformanceMonitor.measure('OrganizationRepo.getAllTechnicians', () => db.technicians.toArray());
  }

  async createTechnician(technician: Omit<Technician, 'id'>): Promise<string> {
    return PerformanceMonitor.measure('OrganizationRepo.createTechnician', async () => {
      const id = crypto.randomUUID();
      await db.transaction('rw', [db.technicians, db.sectors, db.auditLogs], async () => {
        const sector = await db.sectors.get(technician.sectorId);
        if (!sector) throw new Error('Sector not found.');

        await db.technicians.add({ id, ...technician });
        logger.info({ action: 'CREATE_TECHNICIAN', entityType: 'TECHNICIAN', entityId: id, details: technician });
      });
      return id;
    });
  }

  async updateTechnician(id: string, updates: Partial<Technician>): Promise<void> {
    return PerformanceMonitor.measure('OrganizationRepo.updateTechnician', async () => {
      await db.transaction('rw', [db.technicians, db.sectors, db.auditLogs], async () => {
        if (updates.sectorId) {
          const sector = await db.sectors.get(updates.sectorId);
          if (!sector) throw new Error('Sector not found.');
        }
        await db.technicians.update(id, updates);
        logger.info({ action: 'UPDATE_TECHNICIAN', entityType: 'TECHNICIAN', entityId: id, details: updates });
      });
    });
  }

  async deleteTechnician(id: string): Promise<void> {
    return PerformanceMonitor.measure('OrganizationRepo.deleteTechnician', async () => {
      await db.transaction('rw', [db.technicians, db.auditLogs], async () => {
        await db.technicians.delete(id);
        logger.info({ action: 'DELETE_TECHNICIAN', entityType: 'TECHNICIAN', entityId: id });
      });
    });
  }

  async getAllMachines(): Promise<Machine[]> {
    return PerformanceMonitor.measure('OrganizationRepo.getAllMachines', () => db.machines.toArray());
  }

  async createMachine(machine: Omit<Machine, 'id'> | Machine): Promise<string> {
    return PerformanceMonitor.measure('OrganizationRepo.createMachine', async () => {
      const id = 'id' in machine && machine.id ? machine.id : crypto.randomUUID();
      await db.transaction('rw', [db.machines, db.sectors, db.auditLogs], async () => {
        const sector = await db.sectors.get(machine.sectorId);
        if (!sector) throw new Error('Sector not found.');

        const existingCode = await db.machines.where('referenceCode').equals(machine.referenceCode).first();
        if (existingCode) throw new Error('Machine Code already exists.');

        await db.machines.add({ ...machine, id });
        logger.info({ action: 'CREATE_MACHINE', entityType: 'MACHINE', entityId: id, details: machine });
      });
      return id;
    });
  }

  async updateMachine(id: string, updates: Partial<Machine>): Promise<void> {
    return PerformanceMonitor.measure('OrganizationRepo.updateMachine', async () => {
      await db.transaction('rw', [db.machines, db.sectors, db.auditLogs], async () => {
        if (updates.sectorId) {
          const sector = await db.sectors.get(updates.sectorId);
          if (!sector) throw new Error('Sector not found.');
        }
        if (updates.referenceCode) {
          const existing = await db.machines.where('referenceCode').equals(updates.referenceCode).first();
          if (existing && existing.id !== id) {
            throw new Error('Machine Code already exists.');
          }
        }
        await db.machines.update(id, updates);
        logger.info({ action: 'UPDATE_MACHINE', entityType: 'MACHINE', entityId: id, details: updates });
      });
    });
  }

  async deleteMachine(id: string): Promise<void> {
    return PerformanceMonitor.measure('OrganizationRepo.deleteMachine', async () => {
      await db.transaction('rw', [db.machines, db.auditLogs], async () => {
        await db.machines.delete(id);
        logger.info({ action: 'DELETE_MACHINE', entityType: 'MACHINE', entityId: id });
      });
    });
  }
}

export const organizationRepository = new OrganizationRepository();
