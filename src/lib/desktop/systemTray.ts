import { WindowsBridge } from './windowsBridge';

export class SystemTrayManager {
  private static isMinimizedToTray = false;

  static async initialize(): Promise<void> {
    if (!WindowsBridge.isNative()) {
      console.log('[SystemTrayManager] Web mode: System tray simulated via background notifications');
      return;
    }

    try {
      const invoke = (window as any).__TAURI__.invoke;
      await invoke('init_system_tray');
      console.log('[SystemTrayManager] Native Windows System Tray initialized');
    } catch (e) {
      console.warn('[SystemTrayManager] Tray initialization fallback', e);
    }
  }

  static async toggleWindowVisibility(): Promise<void> {
    if (WindowsBridge.isNative()) {
      try {
        const invoke = (window as any).__TAURI__.invoke;
        this.isMinimizedToTray = !this.isMinimizedToTray;
        await invoke(this.isMinimizedToTray ? 'hide_window' : 'show_window');
        return;
      } catch (e) {
        console.warn('[SystemTrayManager] Visibility toggle failed', e);
      }
    }

    console.log('[SystemTrayManager] Web mode visibility toggle triggered');
  }
}
