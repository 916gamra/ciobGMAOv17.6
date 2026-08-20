import { DPAPIEncryptionService } from './dpapiEncryption';

export interface AuditEventRecord {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  prevHash: string | null;
  eventHash: string;
  signature: string;
}

export class AuditTrailService {
  private static lastHash: string | null = null;

  /**
   * Generates a SHA-256 hash for an event payload
   */
  private static async calculateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Appends an audit event with hash-chaining verification
   */
  static async logEvent(
    userId: string,
    action: string,
    entityType: string,
    entityId: string
  ): Promise<AuditEventRecord> {
    const id = `AUDIT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    const prevHash = this.lastHash;

    const payloadRaw = `${id}:${userId}:${action}:${entityType}:${entityId}:${timestamp}:${prevHash || 'ROOT'}`;
    const eventHash = await this.calculateHash(payloadRaw);

    // Sign the hash using DPAPI or WebCrypto
    const signature = await DPAPIEncryptionService.encrypt(`SIG_${eventHash}`);

    this.lastHash = eventHash;

    const record: AuditEventRecord = {
      id,
      userId,
      action,
      entityType,
      entityId,
      timestamp,
      prevHash,
      eventHash,
      signature
    };

    console.log('[AuditTrailService] Event Chained:', record);
    return record;
  }

  /**
   * Verifies the cryptographic chain integrity of a sequence of audit events
   */
  static async verifyChainIntegrity(events: AuditEventRecord[]): Promise<boolean> {
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const prevHash = i === 0 ? null : events[i - 1].eventHash;

      if (event.prevHash !== prevHash) {
        console.error(`[AuditTrailService] Chain broken at index ${i}: prevHash mismatch`);
        return false;
      }

      const payloadRaw = `${event.id}:${event.userId}:${event.action}:${event.entityType}:${event.entityId}:${event.timestamp}:${prevHash || 'ROOT'}`;
      const expectedHash = await this.calculateHash(payloadRaw);

      if (event.eventHash !== expectedHash) {
        console.error(`[AuditTrailService] Hash mismatch at index ${i}`);
        return false;
      }
    }

    return true;
  }
}
