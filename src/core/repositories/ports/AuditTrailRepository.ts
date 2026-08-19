import type { AuditLog } from '@/core/db';

export interface AuditTrailRepository {
  getAll(): Promise<AuditLog[]>;
  getLastLog(): Promise<AuditLog | undefined>;
  addLog(log: AuditLog): Promise<string>;
  clearAll(): Promise<void>;
  count(): Promise<number>;
}
