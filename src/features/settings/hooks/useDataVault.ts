import { useState } from 'react';
import { db } from '@/core/db';

export function useDataVault() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const exportBackup = async () => {
    setIsExporting(true);
    try {
      const allData: Record<string, any[]> = {};
      
      // Dexie dynamically exposes all tables
      for (const table of db.tables) {
        allData[table.name] = await table.toArray();
      }

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GMAO_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const importBackup = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      // Perform a massive ACID transaction to wipe and rewrite everything safely
      await db.transaction('rw', db.tables, async () => {
        for (const table of db.tables) {
          if (parsedData[table.name]) {
            await table.clear();
            await table.bulkAdd(parsedData[table.name]);
          }
        }
      });
      return true;
    } catch (error) {
      console.error("Import failed:", error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    exportBackup,
    importBackup,
    isExporting,
    isImporting
  };
}
