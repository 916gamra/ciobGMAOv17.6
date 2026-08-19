import { db, Machine, MachineBlueprint, MachineTemplate } from '@/core/db';
import { MachinesRepository } from '../../ports/MachinesRepository';

export class DexieMachinesRepository implements MachinesRepository {
  async getAll(): Promise<Machine[]> {
    return db.machines.toArray();
  }

  async getById(id: string): Promise<Machine | undefined> {
    return db.machines.get(id);
  }

  async getBySector(sectorId: string): Promise<Machine[]> {
    return db.machines.where('sectorId').equals(sectorId).toArray();
  }

  async save(machine: Machine): Promise<string> {
    await db.machines.put(machine);
    return machine.id;
  }

  async delete(id: string): Promise<void> {
    await db.machines.delete(id);
  }

  async getBlueprint(blueprintId: string): Promise<MachineBlueprint | undefined> {
    return db.machineBlueprints.get(blueprintId);
  }

  async getTemplate(templateId: string): Promise<MachineTemplate | undefined> {
    return db.machineTemplates.get(templateId);
  }
}
