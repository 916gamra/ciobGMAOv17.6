/**
 * Cryptographic Audit Trail Engine
 * Computes SHA-256 event hash chain and HMAC-SHA256 signatures using WebCrypto
 */

const cryptoObj = (globalThis.crypto ?? (window as any).crypto) as Crypto;

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface AuditEventPayload {
  id: string;
  userId: string | number;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
  severity: string;
  prevHash: string | null;
  eventHash?: string;
  signature?: string;
}

export class AuditIntegrityEngine {
  constructor(private readonly sessionSecret: Uint8Array) {}

  /**
   * Computes deterministic SHA-256 hash for audit log event
   */
  async computeEventHash(payload: AuditEventPayload): Promise<string> {
    const canonical = JSON.stringify({
      action: payload.action,
      details: payload.details,
      entityId: payload.entityId,
      entityType: payload.entityType,
      id: payload.id,
      prevHash: payload.prevHash || 'GENESIS',
      severity: payload.severity,
      timestamp: payload.timestamp,
      userId: String(payload.userId),
      userName: payload.userName
    });

    const digest = await cryptoObj.subtle.digest('SHA-256', utf8Encode(canonical));
    return bufferToBase64(digest);
  }

  /**
   * Signs event hash using HMAC-SHA256 with session secret
   */
  async sign(eventHashBase64: string): Promise<string> {
    const key = await cryptoObj.subtle.importKey(
      'raw',
      this.sessionSecret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await cryptoObj.subtle.sign('HMAC', key, utf8Encode(eventHashBase64));
    return bufferToBase64(sig);
  }

  /**
   * Verifies signature of given event hash
   */
  async verifySignature(eventHashBase64: string, expectedSignature: string): Promise<boolean> {
    try {
      const computed = await this.sign(eventHashBase64);
      return computed === expectedSignature;
    } catch {
      return false;
    }
  }

  /**
   * Verifies the cryptographic chain integrity across an array of sequential audit events
   */
  async verifyChain(events: AuditEventPayload[]): Promise<{ isValid: boolean; tamperedLogIds: string[] }> {
    const tamperedLogIds: string[] = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      // 1. Recompute hash
      const expectedHash = await this.computeEventHash(event);
      if (event.eventHash && event.eventHash !== expectedHash) {
        tamperedLogIds.push(event.id);
        continue;
      }

      // 2. Check prevHash link in chain
      if (i > 0) {
        const prevEvent = events[i - 1];
        if (event.prevHash && prevEvent.eventHash && event.prevHash !== prevEvent.eventHash) {
          tamperedLogIds.push(event.id);
        }
      }
    }

    return {
      isValid: tamperedLogIds.length === 0,
      tamperedLogIds
    };
  }
}
