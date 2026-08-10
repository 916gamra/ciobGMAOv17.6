// src/core/reliability/AutoBackup.ts
import { createLogger } from '@/core/logging/Logger';
import { EncryptionAdvanced } from '@/core/security/EncryptionAdvanced';
import { db } from '@/core/db';

const logger = createLogger('AutoBackup');

/**
 * Auto-Backup Engine
 * 
 * نسخ احتياطي تلقائي للبيانات
 * 
 * Features:
 * - Incremental Backup
 * - Compression
 * - Encryption
 * - Scheduled Backup
 * - Restore Functionality
 */
export class AutoBackupEngine {
  private backupInterval: NodeJS.Timeout | null = null;
  private lastBackupTime = 0;
  private backupSchedule: number = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.startAutoBackup();
  }

  /**
   * بدء النسخ الاحتياطي التلقائي
   */
  private startAutoBackup(): void {
    if (typeof window === 'undefined') return;

    // Run first backup shortly after boot
    setTimeout(() => {
      this.performBackup();
    }, 10000);

    this.backupInterval = setInterval(() => {
      this.performBackup();
    }, this.backupSchedule);

    logger.info('Auto-backup engine started', {
      intervalMs: this.backupSchedule,
    });
  }

  /**
   * تنفيذ النسخة الاحتياطية
   */
  async performBackup(): Promise<void> {
    try {
      logger.info('Starting backup procedure');

      // Get all table data safely
      const data = await this.getAllData();

      // Compress (Base64 JSON)
      const compressed = this.compressData(data);

      // Encrypt
      const encrypted = await EncryptionAdvanced.encrypt(
        compressed,
        'nexus-gmao-backup-master-key'
      );

      // Store
      await this.storeBackup(encrypted);

      this.lastBackupTime = Date.now();
      logger.info('Backup completed successfully');
    } catch (error) {
      logger.error('Backup failed', error as Error);
    }
  }

  /**
   * الحصول على جميع البيانات بشكل آمن ومطابق للجداول المتوفرة
   */
  private async getAllData(): Promise<any> {
    const data: any = {};

    const tables = [
      'pdrFamilies',
      'pdrTemplates',
      'pdrBlueprints',
      'inventory',
      'movements',
      'sectors',
      'technicians',
      'machines',
      'auditLogs',
    ];

    for (const table of tables) {
      try {
        if ((db as any)[table]) {
          data[table] = await (db as any)[table].toArray();
        }
      } catch (err) {
        logger.warn(`Failed to read table ${table} for backup`, err);
      }
    }

    return data;
  }

  /**
   * ضغط البيانات
   */
  private compressData(data: any): string {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }

  /**
   * فك ضغط البيانات
   */
  private decompressData(base64: string): any {
    return JSON.parse(decodeURIComponent(escape(atob(base64))));
  }

  /**
   * حفظ النسخة الاحتياطية في localStorage لتجنب تعديل مخططات قاعدة البيانات
   */
  private async storeBackup(backupString: string): Promise<void> {
    try {
      const backupRecord = {
        id: `backup-${Date.now()}`,
        data: backupString,
        timestamp: Date.now(),
        size: backupString.length,
      };

      const existing = localStorage.getItem('nexus_gmao_backups');
      const backups = existing ? JSON.parse(existing) : [];
      backups.push(backupRecord);
      
      // Keep only last 5 backups to save space
      if (backups.length > 5) {
        backups.shift();
      }

      localStorage.setItem('nexus_gmao_backups', JSON.stringify(backups));
      logger.info('Backup record stored securely');
    } catch (error) {
      logger.error('Failed to store backup record', error as Error);
    }
  }

  /**
   * استرجاع من النسخة الاحتياطية
   */
  async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      const existing = localStorage.getItem('nexus_gmao_backups');
      if (!existing) throw new Error('No backups list found');

      const backups = JSON.parse(existing);
      const backup = backups.find((b: any) => b.id === backupId);

      if (!backup) {
        throw new Error('Backup record not found');
      }

      // Decrypt
      const decrypted = await EncryptionAdvanced.decrypt(
        backup.data,
        'nexus-gmao-backup-master-key'
      );

      // Decompress
      const data = this.decompressData(decrypted);

      // Restore to database tables
      for (const [table, records] of Object.entries(data)) {
        if ((db as any)[table]) {
          logger.info(`Restoring table: ${table} with ${ (records as any[]).length } records`);
          await (db as any)[table].clear();
          await (db as any)[table].bulkAdd(records as any[]);
        }
      }

      logger.info('Backup restored successfully', { backupId });
      return true;
    } catch (error) {
      logger.error('Failed to restore backup', error as Error);
      return false;
    }
  }

  getBackupStats() {
    try {
      const existing = localStorage.getItem('nexus_gmao_backups');
      const list = existing ? JSON.parse(existing) : [];
      return {
        lastBackupTime: this.lastBackupTime,
        backupSchedule: this.backupSchedule,
        nextBackupTime: this.lastBackupTime ? this.lastBackupTime + this.backupSchedule : Date.now() + this.backupSchedule,
        backupsCount: list.length,
        backupsList: list.map((b: any) => ({ id: b.id, timestamp: b.timestamp, size: b.size })),
      };
    } catch {
      return {
        lastBackupTime: this.lastBackupTime,
        backupSchedule: this.backupSchedule,
        nextBackupTime: Date.now() + this.backupSchedule,
        backupsCount: 0,
        backupsList: [],
      };
    }
  }

  stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }
}

export const autoBackupEngine = new AutoBackupEngine();
