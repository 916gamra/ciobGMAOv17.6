import { WindowsBridge } from './windowsBridge';

export interface UpdateManifest {
  version: string;
  notes: string;
  pubDate: string;
  url: string;
}

export class AutoUpdateManager {
  private static readonly UPDATE_MANIFEST_URL = 'https://updates.bdr-nexus.com/latest.json';

  static async checkForUpdates(): Promise<{ available: boolean; manifest?: UpdateManifest }> {
    if (WindowsBridge.isNative()) {
      try {
        const invoke = (window as any).__TAURI__.invoke;
        const res = await invoke('check_for_updates');
        return { available: res.shouldUpdate, manifest: res.manifest };
      } catch (e) {
        console.warn('[AutoUpdate] Native Tauri updater check fallback to REST manifest', e);
      }
    }

    // REST Manifest Check
    try {
      const res = await fetch(this.UPDATE_MANIFEST_URL);
      if (res.ok) {
        const manifest: UpdateManifest = await res.json();
        const currentVersion = '17.6.0';
        if (manifest.version !== currentVersion) {
          return { available: true, manifest };
        }
      }
    } catch (e) {
      console.warn('[AutoUpdate] Update manifest check skipped or offline');
    }

    return { available: false };
  }

  static async startPeriodicCheck(intervalHours: number = 24): Promise<void> {
    const check = async () => {
      const result = await this.checkForUpdates();
      if (result.available && result.manifest) {
        await WindowsBridge.showNotification(
          'تحديث جديد متوفر!',
          `الإصدار ${result.manifest.version} متوفر الآن مع تحسينات أداء جديدة.`
        );
      }
    };

    // Check on launch
    check();

    // Check periodically
    setInterval(check, intervalHours * 60 * 60 * 1000);
  }
}
