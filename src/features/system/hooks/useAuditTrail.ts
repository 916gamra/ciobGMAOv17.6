import { db, AuditLog, AuditLogSeverity } from '@/core/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function useAuditTrail() {
  const logs = useLiveQuery(() => 
    db.auditLogs.reverse().sortBy('timestamp'),
    []
  ) || [];

  const logEvent = async (params: {
    userId: string | number;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    severity?: AuditLogSeverity;
  }) => {
    try {
      const newLog: AuditLog = {
        id: crypto.randomUUID(),
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: typeof params.details === 'string' ? params.details : JSON.stringify(params.details),
        timestamp: new Date().toISOString(),
        severity: params.severity || 'INFO',
        deviceInfo: navigator.userAgent
      };
      
      await db.auditLogs.add(newLog);
      
      // Also update user last activity if applicable
      if (params.userId && params.userId !== 'GUEST' && params.userId !== 'SY-ROOT') {
        const userIdStr = String(params.userId);
        const override = await db.userOverrides.get(userIdStr);
        if (override) {
          await db.userOverrides.update(userIdStr, { lastActiveAt: new Date().toISOString() });
        } else {
          await db.userOverrides.put({ id: userIdStr, lastActiveAt: new Date().toISOString() });
        }
      }
      
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const clearLogs = async () => {
    if (window.confirm('Are you sure you want to purge all security logs? This action is irreversible.')) {
      await db.auditLogs.clear();
    }
  };

  return {
    logs,
    logEvent,
    clearLogs
  };
}
