import { DexieMachinesRepository } from './adapters/dexie/DexieMachinesRepository';
import { DexieAuditTrailRepository } from './adapters/dexie/DexieAuditTrailRepository';
import type { MachinesRepository } from './ports/MachinesRepository';
import type { AuditTrailRepository } from './ports/AuditTrailRepository';

export const machinesRepository: MachinesRepository = new DexieMachinesRepository();
export const auditTrailRepository: AuditTrailRepository = new DexieAuditTrailRepository();

export * from './ports/MachinesRepository';
export * from './ports/AuditTrailRepository';
