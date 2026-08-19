import { db, AuditLog, AuditLogSeverity } from '@/core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { AuditIntegrityEngine } from '@/core/security/audit/AuditIntegrityEngine';
import { securitySession } from '@/core/security/session/securitySessionStore';

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
      const activeSecret = securitySession.getActiveSecret();
      const integrityEngine = new AuditIntegrityEngine(activeSecret);

      // Fetch last recorded audit log to obtain its eventHash for chaining
      const lastLog = await db.auditLogs.orderBy('timestamp').last();
      const prevHash = lastLog?.eventHash || 'GENESIS_BLOCK_NEXUS_V17';

      const logId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const detailsStr = typeof params.details === 'string' ? params.details : JSON.stringify(params.details);
      const severityVal = params.severity || 'INFO';

      const logPayload = {
        id: logId,
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: detailsStr,
        timestamp,
        severity: severityVal,
        prevHash
      };

      const eventHash = await integrityEngine.computeEventHash(logPayload);
      const signature = await integrityEngine.sign(eventHash);

      const newLog: AuditLog = {
        ...logPayload,
        deviceInfo: navigator.userAgent,
        eventHash,
        signature,
        publicKeyId: 'SESSION_HMAC_V17'
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

  const verifyAuditIntegrity = async (): Promise<{
    isValid: boolean;
    tamperedLogIds: string[];
    totalChecked: number;
  }> => {
    const activeSecret = securitySession.getActiveSecret();
    const integrityEngine = new AuditIntegrityEngine(activeSecret);
    const allLogs = await db.auditLogs.orderBy('timestamp').toArray();
    
    const tamperedLogIds: string[] = [];
    let expectedPrevHash = 'GENESIS_BLOCK_NEXUS_V17';

    for (const log of allLogs) {
      if (log.prevHash && log.prevHash !== expectedPrevHash) {
        tamperedLogIds.push(log.id);
      }

      if (log.eventHash) {
        const recalculatedHash = await integrityEngine.computeEventHash({
          id: log.id,
          userId: log.userId,
          userName: log.userName,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          details: log.details,
          timestamp: log.timestamp,
          severity: log.severity,
          prevHash: log.prevHash || 'GENESIS_BLOCK_NEXUS_V17'
        });

        if (recalculatedHash !== log.eventHash) {
          tamperedLogIds.push(log.id);
        } else {
          expectedPrevHash = log.eventHash;
        }

        if (log.signature) {
          const isSigValid = await integrityEngine.verifySignature(log.eventHash, log.signature);
          if (!isSigValid) {
            tamperedLogIds.push(log.id);
          }
        }
      }
    }

    return {
      isValid: tamperedLogIds.length === 0,
      tamperedLogIds,
      totalChecked: allLogs.length
    };
  };

  const clearLogs = async () => {
    if (window.confirm('Are you sure you want to purge all security logs? This action is irreversible.')) {
      await db.auditLogs.clear();
    }
  };

  return {
    logs,
    logEvent,
    verifyAuditIntegrity,
    clearLogs
  };
}
