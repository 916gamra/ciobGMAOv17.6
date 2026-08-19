import { db, AuditLog } from '@/core/db';
import { AuditTrailRepository } from '../../ports/AuditTrailRepository';

export class DexieAuditTrailRepository implements AuditTrailRepository {
  async getAll(): Promise<AuditLog[]> {
    return db.auditLogs.reverse().sortBy('timestamp');
  }

  async getLastLog(): Promise<AuditLog | undefined> {
    return db.auditLogs.orderBy('timestamp').last();
  }

  async addLog(log: AuditLog): Promise<string> {
    await db.auditLogs.add(log);
    return log.id;
  }

  async clearAll(): Promise<void> {
    await db.auditLogs.clear();
  }

  async count(): Promise<number> {
    return db.auditLogs.count();
  }
}
