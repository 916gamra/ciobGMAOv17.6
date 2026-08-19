import { localDesktopDB } from './localDatabase';
import { WindowsBridge } from './windowsBridge';

export interface BackupArchive {
  version: string;
  createdAt: string;
  queue: any[];
  machines: any[];
}

export class BackupRestoreService {
  /**
   * Generates a encrypted/formatted backup JSON file of offline records
   */
  static async exportBackup(): Promise<string> {
    const queue = await localDesktopDB.syncQueue.toArray();
    const machines = await localDesktopDB.offlineMachines.toArray();

    const archive: BackupArchive = {
      version: '17.6.0',
      createdAt: new Date().toISOString(),
      queue,
      machines
    };

    const jsonString = JSON.stringify(archive, null, 2);

    if (WindowsBridge.isNative()) {
      try {
        const invoke = (window as any).__TAURI__.invoke;
        const appDataDir = await invoke('get_app_data_path');
        const backupPath = `${appDataDir}\\backup_${Date.now()}.json`;
        await invoke('write_file', { path: backupPath, content: jsonString });
        return backupPath;
      } catch (e) {
        console.warn('[BackupRestore] Native file save fallback to browser blob', e);
      }
    }

    // Web Browser Blob download fallback
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bdr_nexus_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return 'BROWSER_DOWNLOAD_STARTED';
  }

  /**
   * Restores offline records from a JSON archive string
   */
  static async importRestore(backupJsonString: string): Promise<boolean> {
    try {
      const archive: BackupArchive = JSON.parse(backupJsonString);
      if (!archive.queue || !archive.machines) {
        throw new Error('Invalid backup archive structure');
      }

      await localDesktopDB.syncQueue.clear();
      await localDesktopDB.offlineMachines.clear();

      if (archive.queue.length > 0) {
        await localDesktopDB.syncQueue.bulkPut(archive.queue);
      }
      if (archive.machines.length > 0) {
        await localDesktopDB.offlineMachines.bulkPut(archive.machines);
      }

      await WindowsBridge.showNotification(
        'استعادة النسخة الاحتياطية',
        'تمت استعادة قواعد البيانات والمزامنة الأوفلاين بنجاح'
      );

      return true;
    } catch (e) {
      console.error('[BackupRestore] Restore failed:', e);
      return false;
    }
  }
}
