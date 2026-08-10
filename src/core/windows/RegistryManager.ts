// src/core/windows/RegistryManager.ts
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('RegistryManager');

// Defensive check to see if Tauri is available
const hasTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

export class RegistryManager {
  private localSimulatedReg = new Map<string, any>();

  /**
   * قراءة قيمة من السجل
   */
  async readRegistry(
    hive: string,
    path: string,
    key: string
  ): Promise<any> {
    try {
      if (hasTauri) {
        const value = await (window as any).__TAURI__.invoke('read_registry', { hive, path, key });
        logger.debug(`Registry read (Tauri): ${path}\\${key}`);
        return value;
      } else {
        // Mock fallback for browser
        const mockKey = `${hive}\\${path}\\${key}`;
        const val = this.localSimulatedReg.get(mockKey) ?? localStorage.getItem(`registry_${mockKey}`);
        logger.debug(`Registry read (Mock): ${path}\\${key} = ${val}`);
        return val;
      }
    } catch (error) {
      logger.error('Registry read failed', error as Error);
      return null;
    }
  }

  /**
   * كتابة قيمة إلى السجل
   */
  async writeRegistry(
    hive: string,
    path: string,
    key: string,
    value: any,
    valueType: string = 'REG_SZ'
  ): Promise<boolean> {
    try {
      if (hasTauri) {
        await (window as any).__TAURI__.invoke('write_registry', { hive, path, key, value, valueType });
        logger.info(`Registry write (Tauri): ${path}\\${key}`);
        return true;
      } else {
        // Mock fallback for browser
        const mockKey = `${hive}\\${path}\\${key}`;
        this.localSimulatedReg.set(mockKey, value);
        localStorage.setItem(`registry_${mockKey}`, String(value));
        logger.info(`Registry write (Mock): ${path}\\${key} = ${value}`);
        return true;
      }
    } catch (error) {
      logger.error('Registry write failed', error as Error);
      return false;
    }
  }

  /**
   * حفظ إعدادات التطبيق
   */
  async saveAppSettings(settings: Record<string, any>): Promise<boolean> {
    try {
      const basePath = 'Software\\GMAO\\v17.6';

      for (const [key, value] of Object.entries(settings)) {
        await this.writeRegistry('HKEY_CURRENT_USER', basePath, key, value);
      }

      logger.info('App settings saved to registry');
      return true;
    } catch (error) {
      logger.error('Failed to save app settings to registry', error as Error);
      return false;
    }
  }

  /**
   * تحميل إعدادات التطبيق
   */
  async loadAppSettings(): Promise<Record<string, any>> {
    try {
      const basePath = 'Software\\GMAO\\v17.6';
      const settings: Record<string, any> = {};

      const keys = [
        'theme',
        'language',
        'windowSize',
        'windowPosition',
        'lastOpenedFile',
        'autoBackup',
      ];

      for (const key of keys) {
        const value = await this.readRegistry('HKEY_CURRENT_USER', basePath, key);
        if (value !== null) {
          settings[key] = value;
        }
      }

      logger.info('App settings loaded from registry');
      return settings;
    } catch (error) {
      logger.error('Failed to load app settings from registry', error as Error);
      return {};
    }
  }
}

export const registryManager = new RegistryManager();
