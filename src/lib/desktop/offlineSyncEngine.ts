import { localDesktopDB, OfflineSyncQueueItem } from './localDatabase';
import { WindowsBridge } from './windowsBridge';

export class OfflineSyncEngine {
  private static isSyncing = false;

  /**
   * Enqueues an offline change into the local database queue
   */
  static async enqueueChange(
    entityType: OfflineSyncQueueItem['entityType'],
    entityId: string,
    action: OfflineSyncQueueItem['action'],
    payload: Record<string, any>
  ): Promise<string> {
    const queueId = `SYNC_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const item: OfflineSyncQueueItem = {
      id: queueId,
      entityType,
      entityId,
      action,
      payload,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0
    };

    await localDesktopDB.syncQueue.put(item);
    console.log(`[OfflineSyncEngine] Enqueued ${action} on ${entityType}:${entityId}`);

    // Trigger immediate background flush if online
    if (navigator.onLine) {
      this.flushQueue().catch(err => console.error('[OfflineSyncEngine] Flush failed:', err));
    }

    return queueId;
  }

  /**
   * Flushes pending items from sync queue to central server
   */
  static async flushQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    this.isSyncing = true;

    let synced = 0;
    let failed = 0;

    try {
      const pendingItems = await localDesktopDB.syncQueue
        .where('status')
        .equals('PENDING')
        .toArray();

      for (const item of pendingItems) {
        try {
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });

          if (res.ok) {
            await localDesktopDB.syncQueue.update(item.id, { status: 'SYNCED' });
            synced++;
          } else {
            await localDesktopDB.syncQueue.update(item.id, { retryCount: item.retryCount + 1 });
            failed++;
          }
        } catch (e) {
          await localDesktopDB.syncQueue.update(item.id, { retryCount: item.retryCount + 1 });
          failed++;
        }
      }

      if (synced > 0) {
        await WindowsBridge.showNotification(
          'مزامنة BDR Nexus',
          `تمت مزامنة ${synced} حركات مع خادم المصنع بنجاح`
        );
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  /**
   * Starts periodic sync background worker
   */
  static startPeriodicSync(intervalMs: number = 60000): void {
    window.addEventListener('online', () => {
      console.log('[OfflineSyncEngine] Internet connection restored, flushing sync queue...');
      this.flushQueue();
    });

    setInterval(() => {
      if (navigator.onLine) {
        this.flushQueue();
      }
    }, intervalMs);
  }
}
