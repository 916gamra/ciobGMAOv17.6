import { PdrFamily, PdrTemplate, PdrBlueprint, Sector, Machine, MachineFamily, MachineTemplate, MachineBlueprint, Technician, User } from '../db';
import { PDR_FAMILIES, PDR_TEMPLATES } from '../config/pdrMatrix';

const now = new Date().toISOString();

// PDR Master Data
export const SEED_PDR_FAMILIES: PdrFamily[] = PDR_FAMILIES.map(fam => ({
  id: fam.id,
  name: fam.name,
  description: `${fam.name} - ${fam.code} Spare Parts Category`,
  createdAt: now,
  group: fam.group
}));

export const SEED_SECTORS: Sector[] = Array.from({ length: 15 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  return {
    id: `SEC-${num}`,
    name: `Sector ${num}`,
    managerName: '',
    description: '',
    status: 'Dormant' as const
  };
});

export const SEED_TECHNICIANS: Technician[] = [];

export const SEED_USERS: User[] = [
];

export const SEED_MACHINES: Machine[] = [];

export const SEED_TEMPLATES: PdrTemplate[] = PDR_TEMPLATES.map(tmpl => ({
  id: tmpl.id,
  familyId: tmpl.familyId,
  name: tmpl.name,
  skuBase: tmpl.code,
  description: `${tmpl.name} Technical Specification Template`,
  createdAt: now
}));

export const SEED_BLUEPRINTS: PdrBlueprint[] = [
  // Keeping this empty as instructed: "Do not link any spare parts or preventive schedules yet."
];

// Machine Genetic Data
export const SEED_MACHINE_FAMILIES: MachineFamily[] = [];
export const SEED_MACHINE_TEMPLATES: MachineTemplate[] = [];

export const SEED_MACHINE_BLUEPRINTS: MachineBlueprint[] = [];

export const INITIAL_DATA = {
  pdrFamilies: SEED_PDR_FAMILIES,
  sectors: SEED_SECTORS,
  machines: SEED_MACHINES,
  pdrTemplates: SEED_TEMPLATES,
  pdrBlueprints: SEED_BLUEPRINTS,
  machineFamilies: SEED_MACHINE_FAMILIES,
  machineTemplates: SEED_MACHINE_TEMPLATES,
  machineBlueprints: SEED_MACHINE_BLUEPRINTS,
  technicians: SEED_TECHNICIANS,
  users: SEED_USERS,
};
