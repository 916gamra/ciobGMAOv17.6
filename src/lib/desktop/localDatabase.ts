import Dexie, { Table } from 'dexie';

export interface OfflineSyncQueueItem {
  id: string;
  entityType: 'MACHINE' | 'WORK_ORDER' | 'STOCK_ITEM' | 'AUDIT_LOG';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  createdAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}

export interface MachineOfflineRecord {
  id: string;
  referenceCode: string;
  serialNumber: string;
  sectorId: string;
  lifecycleState: string;
  updatedAt: string;
}

class BDRNexusOfflineDB extends Dexie {
  syncQueue!: Table<OfflineSyncQueueItem, string>;
  offlineMachines!: Table<MachineOfflineRecord, string>;

  constructor() {
    super('BDRNexus_Desktop_Offline_DB');
    this.version(1).stores({
      syncQueue: 'id, entityType, entityId, status, createdAt',
      offlineMachines: 'id, referenceCode, sectorId, lifecycleState'
    });
  }
}

export const localDesktopDB = new BDRNexusOfflineDB();
