import type { Machine, MachineBlueprint, MachineTemplate } from '@/core/db';

export interface MachinesRepository {
  getAll(): Promise<Machine[]>;
  getById(id: string): Promise<Machine | undefined>;
  getBySector(sectorId: string): Promise<Machine[]>;
  save(machine: Machine): Promise<string>;
  delete(id: string): Promise<void>;
  getBlueprint(blueprintId: string): Promise<MachineBlueprint | undefined>;
  getTemplate(templateId: string): Promise<MachineTemplate | undefined>;
}
