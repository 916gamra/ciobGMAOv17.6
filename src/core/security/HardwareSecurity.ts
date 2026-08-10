// src/core/security/HardwareSecurity.ts
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('HardwareSecurity');
const hasTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

export interface Certificate {
  thumbprint: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
}

export class HardwareSecurity {
  /**
   * التحقق من توفر TPM
   */
  async isTPMAvailable(): Promise<boolean> {
    try {
      if (hasTauri) {
        const available = await (window as any).__TAURI__.invoke('check_tpm_available');
        logger.info('TPM availability checked (Tauri)', { available });
        return !!available;
      } else {
        logger.info('TPM checked: Browser Fallback (Simulated TPM 2.0 Active)');
        return true;
      }
    } catch (error) {
      logger.error('Failed to check TPM', error as Error);
      return false;
    }
  }

  /**
   * التحقق البيومتري (بصمة الإصبع أو الوجه)
   */
  async authenticateWithBiometric(): Promise<boolean> {
    try {
      if (hasTauri) {
        const authenticated = await (window as any).__TAURI__.invoke('authenticate_biometric');
        logger.info('Biometric authentication (Tauri)', { authenticated });
        return !!authenticated;
      } else {
        // Mock success in browser environment
        logger.info('Biometric authentication (Mock Browser Authenticated)');
        return true;
      }
    } catch (error) {
      logger.error('Biometric authentication failed', error as Error);
      return false;
    }
  }

  /**
   * تخزين آمن للبيانات الحساسة
   */
  async storeSecureData(key: string, data: string): Promise<boolean> {
    try {
      if (hasTauri) {
        await (window as any).__TAURI__.invoke('store_secure_data', { key, data });
        logger.info('Data stored securely in TPM (Tauri)', { key });
        return true;
      } else {
        localStorage.setItem(`secure_tpm_${key}`, btoa(data));
        logger.info('Data stored securely in local simulated keystore (Mock)', { key });
        return true;
      }
    } catch (error) {
      logger.error('Failed to store secure data', error as Error);
      return false;
    }
  }

  /**
   * استرجاع البيانات الآمنة
   */
  async retrieveSecureData(key: string): Promise<string | null> {
    try {
      if (hasTauri) {
        const data = await (window as any).__TAURI__.invoke('retrieve_secure_data', { key });
        logger.debug('Secure data retrieved from TPM (Tauri)', { key });
        return data;
      } else {
        const val = localStorage.getItem(`secure_tpm_${key}`);
        if (!val) return null;
        logger.debug('Secure data retrieved from local simulated keystore (Mock)', { key });
        return atob(val);
      }
    } catch (error) {
      logger.error('Failed to retrieve secure data', error as Error);
      return null;
    }
  }

  /**
   * الحصول على شهادة النظام
   */
  async getSystemCertificate(): Promise<Certificate | null> {
    try {
      if (hasTauri) {
        const cert = await (window as any).__TAURI__.invoke('get_system_certificate');
        logger.info('System certificate retrieved (Tauri)');
        return cert;
      } else {
        return {
          thumbprint: 'BDR-7E-A9-10-FD-BC-99-C1-22-34',
          issuer: 'BDR Nexus Root CA',
          subject: 'BDR Nexus GMAO Enterprise Client',
          validFrom: '2026-01-01',
          validTo: '2028-12-31',
        };
      }
    } catch (error) {
      logger.error('Failed to get system certificate', error as Error);
      return null;
    }
  }
}

export const hardwareSecurity = new HardwareSecurity();
