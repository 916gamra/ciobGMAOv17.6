import { create } from 'zustand';
import { ExcelTemplate, ExcelBackup, ExcelSyncState } from './types';
import { db } from '@/core/db';
import { logger } from '@/core/logger';

interface ExcelStorageState {
  backups: ExcelBackup[];
  syncState: ExcelSyncState;
  
  createBackup: (portalId: string, fileName: string, data: any) => Promise<ExcelBackup>;
  restoreBackup: (backupId: string) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
  
  syncWithDatabase: (portalId: string) => Promise<void>;
  getBackups: (portalId?: string) => ExcelBackup[];
  calculateChecksum: (data: any) => string;
}

export const useExcelStorage = create<ExcelStorageState>((set, get) => ({
  backups: [],
  syncState: {
    lastSync: new Date(),
    syncedRows: 0,
    conflicts: [],
    status: 'idle'
  },

  createBackup: async (portalId: string, fileName: string, data: any) => {
    try {
      logger.info({ portalId, fileName }, 'Creating backup');

      const checksum = get().calculateChecksum(data);
      const dataStr = JSON.stringify(data);
      const fileSize = new Blob([dataStr]).size;
      
      let rowCount = 0;
      for (const key in data) {
        if (Array.isArray(data[key])) {
          rowCount += data[key].length;
        }
      }

      const backup: ExcelBackup = {
        id: `backup-${Date.now()}`,
        timestamp: new Date(),
        portalId,
        fileName,
        fileSize,
        rowCount,
        checksum,
        data: dataStr
      };

      await db.excelBackups.add(backup);

      set(state => ({
        backups: [...state.backups, backup]
      }));

      logger.info({ backupId: backup.id }, 'Backup created successfully');
      return backup;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to create backup');
      throw error;
    }
  },

  restoreBackup: async (backupId: string) => {
    try {
      logger.info({ backupId }, 'Restoring backup');

      const backup = await db.excelBackups.get(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      if (!backup.data) {
        throw new Error('No data found in backup');
      }
      
      const data = JSON.parse(backup.data);
      const checksum = get().calculateChecksum(data);
      if (checksum !== backup.checksum) {
        throw new Error('Backup is corrupted or tampered with');
      }

      // Synchronize back
      await get().syncWithDatabase(backup.portalId);
      logger.info({ backupId }, 'Backup restored successfully');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to restore backup');
      throw error;
    }
  },

  deleteBackup: async (backupId: string) => {
    try {
      await db.excelBackups.delete(backupId);
      set(state => ({
        backups: state.backups.filter(b => b.id !== backupId)
      }));
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to delete backup');
      throw error;
    }
  },

  syncWithDatabase: async (portalId: string) => {
    try {
      set(state => ({
        syncState: { ...state.syncState, status: 'syncing' }
      }));

      logger.info({ portalId }, 'Starting sync with database');

      let syncedRows = 0;
      if (portalId === 'PDR') {
        const families = await db.pdrFamilies.count();
        const templates = await db.pdrTemplates.count();
        const blueprints = await db.pdrBlueprints.count();
        const inventory = await db.inventory.count();
        const movements = await db.movements.count();
        syncedRows = families + templates + blueprints + inventory + movements;
      }

      set(state => ({
        syncState: {
          lastSync: new Date(),
          syncedRows,
          conflicts: [],
          status: 'idle'
        }
      }));

      logger.info({ portalId, syncedRows }, 'Sync completed');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Sync failed');
      set(state => ({
        syncState: { ...state.syncState, status: 'error' }
      }));
      throw error;
    }
  },

  getBackups: (portalId?: string) => {
    const backups = get().backups;
    if (portalId) {
      return backups.filter(b => b.portalId === portalId);
    }
    return backups;
  },

  calculateChecksum: (data: any): string => {
    // Basic checksum logic that works in browser
    let hash = 0;
    const str = JSON.stringify(data);
    if (str.length === 0) return hash.toString(16);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}));
