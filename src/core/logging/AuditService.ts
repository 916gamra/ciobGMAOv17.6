import { db, AuditLog, AuditLogSeverity } from '../db';
import { createLogger } from './Logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('AuditService');

export class AuditService {
  static async log(
    action: string,
    entityType: string,
    entityId: string,
    details: any,
    userId: string | number = 'SYSTEM',
    userName: string = 'System',
    severity: AuditLogSeverity = 'INFO'
  ): Promise<void> {
    try {
      const entry: AuditLog = {
        id: uuidv4(),
        userId,
        userName,
        action,
        entityType,
        entityId,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        timestamp: new Date().toISOString(),
        severity,
        deviceInfo: navigator.userAgent
      };

      await db.auditLogs.add(entry);
      
      // Also log to the console via AppLogger
      if (severity === 'CRITICAL') {
        logger.fatal(`AUDIT CRITICAL: ${action} on ${entityType} ${entityId}`, null, entry);
      } else if (severity === 'WARNING') {
        logger.warn(`AUDIT WARNING: ${action} on ${entityType} ${entityId}`, entry);
      } else {
        logger.info(`AUDIT: ${action} on ${entityType} ${entityId}`, entry);
      }
    } catch (err) {
      logger.error('Failed to write audit log', err, { action, entityType, entityId });
    }
  }

  static async getLogs(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    try {
      return await db.auditLogs
        .orderBy('timestamp')
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();
    } catch (err) {
      logger.error('Failed to retrieve audit logs', err);
      return [];
    }
  }

  static async clearLogsBefore(date: Date): Promise<number> {
    try {
      const timestamp = date.toISOString();
      const logsToDelete = await db.auditLogs
        .where('timestamp')
        .below(timestamp)
        .primaryKeys();
        
      await db.auditLogs.bulkDelete(logsToDelete);
      logger.info(`Cleared ${logsToDelete.length} audit logs before ${timestamp}`);
      return logsToDelete.length;
    } catch (err) {
      logger.error('Failed to clear audit logs', err);
      return 0;
    }
  }
}
