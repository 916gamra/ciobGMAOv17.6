// src/core/security/DataIntegrityProtection.ts
import { createLogger } from '../logging/Logger';

export interface IntegrityCheckResult {
  isValid: boolean;
  currentChecksum: string;
  storedChecksum?: string;
  timestamp: number;
}

export interface SignatureVerificationResult {
  isValid: boolean;
  signature?: string;
  expectedSignature: string;
  timestamp: number;
}

export interface IntegrityViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  description: string;
  expectedChecksum?: string;
  actualChecksum?: string;
}

export class DataIntegrityProtection {
  private logger = createLogger('DataIntegrity');
  private dataChecksums = new Map<string, string>();
  private digitalSignatures = new Map<string, string>();
  private integrityViolations: IntegrityViolation[] = [];
  private watchedData = new Set<string>();

  constructor() {
    this.setupIntegrityMonitoring();
  }

  calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return hash.toString(16);
  }

  verifyDataIntegrity(id: string, data: any): IntegrityCheckResult {
    const currentChecksum = this.calculateChecksum(data);
    const storedChecksum = this.dataChecksums.get(id);

    const result: IntegrityCheckResult = {
      isValid: currentChecksum === storedChecksum,
      currentChecksum,
      storedChecksum,
      timestamp: Date.now(),
    };

    if (!result.isValid && storedChecksum) {
      this.logger.error('Data integrity violation detected', {
        id,
        expected: storedChecksum,
        actual: currentChecksum,
      });

      this.recordIntegrityViolation({
        id,
        type: 'checksum-mismatch',
        severity: 'critical',
        timestamp: Date.now(),
        description: 'Data checksum does not match',
        expectedChecksum: storedChecksum,
        actualChecksum: currentChecksum,
      });
    }

    return result;
  }

  signData(id: string, data: any, privateKey: string): string {
    const str = JSON.stringify(data);
    const signature = this.generateSignature(str, privateKey);
    this.digitalSignatures.set(id, signature);
    return signature;
  }

  verifySignature(id: string, data: any, publicKey: string): SignatureVerificationResult {
    const signature = this.digitalSignatures.get(id);
    const str = JSON.stringify(data);
    const expectedSignature = this.generateSignature(str, publicKey);

    const result: SignatureVerificationResult = {
      isValid: signature === expectedSignature,
      signature,
      expectedSignature,
      timestamp: Date.now(),
    };

    if (!result.isValid) {
      this.logger.error('Digital signature verification failed', { id });

      this.recordIntegrityViolation({
        id,
        type: 'signature-mismatch',
        severity: 'critical',
        timestamp: Date.now(),
        description: 'Digital signature does not match',
      });
    }

    return result;
  }

  private generateSignature(data: string, key: string): string {
    const combined = data + key;
    let hash = 0;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return hash.toString(16);
  }

  watchData(id: string, data: any): void {
    this.watchedData.add(id);
    const checksum = this.calculateChecksum(data);
    this.dataChecksums.set(id, checksum);

    this.logger.info('Data watch started', { id, checksum });
  }

  unwatchData(id: string): void {
    this.watchedData.delete(id);
    this.dataChecksums.delete(id);
    this.logger.info('Data watch stopped', { id });
  }

  private recordIntegrityViolation(violation: IntegrityViolation): void {
    this.integrityViolations.push(violation);

    if (this.integrityViolations.length > 10000) {
      this.integrityViolations = this.integrityViolations.slice(-10000);
    }

    this.logger.error('INTEGRITY ALARM TRIGGERED', violation);
  }

  private setupIntegrityMonitoring(): void {
    if (typeof window === 'undefined') return;
    setInterval(() => {
      for (const id of this.watchedData) {
        this.logger.debug('Verifying data integrity', { id });
      }
    }, 30000);
  }

  getIntegrityViolations(): IntegrityViolation[] {
    return this.integrityViolations;
  }
}

export const dataIntegrityProtection = new DataIntegrityProtection();
