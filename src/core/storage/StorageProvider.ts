export type StorageMode = 'BROWSER_INDEXEDDB' | 'DESKTOP_SQLITE' | 'NETWORK_POSTGRES';

export interface StorageConfig {
  mode: StorageMode;
  path?: string; // Used for SQLite on Desktop (e.g. D:\CIOB_GMAO_Data\)
  host?: string; // Used for Postgres
  username?: string;
  password?: string;
  database?: string;
}

/**
 * Strategy pattern interface for Database Operations.
 * Currently implemented by Dexie (IndexedDB), but this abstraction
 * allows seamless migration to SQLite/Postgres in the Electron environment.
 */
export interface StorageProvider {
  mode: StorageMode;
  
  initialize(config: StorageConfig): Promise<void>;
  
  // Example generic proxy methods that the Electron bridge will implement
  execute<T>(table: string, operation: 'GET' | 'PUT' | 'DELETE' | 'LIST', payload?: any): Promise<T>;
  
  // Snapshots
  createSnapshot(targetPath?: string): Promise<string>;
  restoreSnapshot(sourcePath: string): Promise<void>;
}

export class HybridStorageEngine {
  private static instance: StorageProvider | null = null;
  
  static getProvider(): StorageProvider {
    if (!this.instance) {
      // For now, in the browser React app, we simulate the interface
      // while delegating actual calls to Dexie.
      // Once compiled in Electron, this will swap to SqliteProvider.
      throw new Error("StorageProvider not initialized. Boot sequence must configure engine type.");
    }
    return this.instance;
  }
}
