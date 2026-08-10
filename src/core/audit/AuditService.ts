// src/core/audit/AuditService.ts
import { BaseService } from '../services/BaseService';
import { db, AuditLog } from '../db';
import { Result } from '../error';

export class AuditService extends BaseService {
  async log(
    action: string,
    entityType: string,
    entityId: string,
    changes: Record<string, any>,
    userId: string
  ): Promise<Result<string>> {
    return this.executeAsync(
      async () => {
        const auditLog: AuditLog = {
          id: `audit-${Date.now()}`,
          userId,
          userName: userId, // fallback to user identifier
          action,
          entityType,
          entityId,
          details: JSON.stringify(changes),
          timestamp: new Date().toISOString(),
          severity: 'INFO',
        };

        await db.auditLogs.add(auditLog);
        return auditLog.id;
      },
      'log'
    );
  }

  async getAuditTrail(
    entityType: string,
    entityId: string
  ): Promise<Result<AuditLog[]>> {
    return this.executeAsync(
      async () => {
        const logs = await db.auditLogs
          .where('entityType')
          .equals(entityType)
          .and(log => log.entityId === entityId)
          .toArray();
        return logs;
      },
      'getAuditTrail'
    );
  }

  async getUserActivity(
    userId: string,
    days: number = 30
  ): Promise<Result<AuditLog[]>> {
    return this.executeAsync(
      async () => {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const logs = await db.auditLogs
          .where('userId')
          .equals(userId)
          .and(log => {
            const date = new Date(log.timestamp);
            return date >= since;
          })
          .toArray();
        return logs;
      },
      'getUserActivity'
    );
  }

  async getActionHistory(
    action: string,
    days: number = 30
  ): Promise<Result<AuditLog[]>> {
    return this.executeAsync(
      async () => {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const logs = await db.auditLogs
          .where('action')
          .equals(action)
          .and(log => {
            const date = new Date(log.timestamp);
            return date >= since;
          })
          .toArray();
        return logs;
      },
      'getActionHistory'
    );
  }

  async exportAuditLog(
    startDate: Date,
    endDate: Date
  ): Promise<Result<AuditLog[]>> {
    return this.executeAsync(
      async () => {
        const logs = await db.auditLogs
          .where('timestamp')
          .between(startDate.toISOString(), endDate.toISOString())
          .toArray();
        return logs;
      },
      'exportAuditLog'
    );
  }
}

export const auditService = new AuditService();
