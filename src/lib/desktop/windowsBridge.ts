/**
 * Windows Native Bridge & Web Fallback Adapter
 * Bridges BDR Nexus with Tauri native Windows APIs when running as Desktop app,
 * with zero-breakage web polyfills for browser runtime.
 */

export interface SystemInfo {
  os: string;
  arch: string;
  isNativeDesktop: boolean;
  platform: string;
  memoryUsageMb?: number;
}

export class WindowsBridge {
  /**
   * Detects if app is running inside Tauri Desktop container
   */
  static isNative(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
  }

  /**
   * Retrieves host system information
   */
  static async getSystemInfo(): Promise<SystemInfo> {
    if (this.isNative()) {
      try {
        const invoke = (window as any).__TAURI__.invoke;
        const info = await invoke('get_system_info');
        return {
          os: info.os || 'windows',
          arch: info.arch || 'x64',
          isNativeDesktop: true,
          platform: 'Windows Desktop (Tauri)',
          memoryUsageMb: info.memory?.used ? Math.round(info.memory.used / 1024 / 1024) : undefined
        };
      } catch (e) {
        console.warn('[WindowsBridge] Native invoke failed, falling back to browser API', e);
      }
    }

    return {
      os: navigator.platform.includes('Win') ? 'windows' : 'web',
      arch: 'x64',
      isNativeDesktop: false,
      platform: 'Web Application (PWA / Browser)',
    };
  }

  /**
   * Sends a native Windows OS toast notification or Web Notification
   */
  static async showNotification(title: string, body: string): Promise<void> {
    if (this.isNative()) {
      try {
        const invoke = (window as any).__TAURI__.invoke;
        await invoke('create_notification', { title, body });
        return;
      } catch (e) {
        console.warn('[WindowsBridge] Native notification failed', e);
      }
    }

    // Web Notification API fallback
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon.png' });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/icon.png' });
        }
      }
    }
  }

  /**
   * Reads setting value from Windows Registry or LocalStorage fallback
   */
  static async readRegistrySetting(key: string): Promise<string | null> {
    if (this.isNative()) {
      try {
        const invoke = (window as any).__TAURI__.invoke;
        return await invoke('read_registry', {
          key: 'Software\\BDR Systems\\BDR Nexus',
          value: key
        });
      } catch (e) {
        console.warn('[WindowsBridge] Registry read fallback to LocalStorage', e);
      }
    }

    return localStorage.getItem(`bdr_reg_${key}`);
  }

  /**
   * Writes setting value to Windows Registry or LocalStorage fallback
   */
  static async writeRegistrySetting(key: string, value: string): Promise<void> {
    if (this.isNative()) {
      try {
        const invoke = (window as any).__TAURI__.invoke;
        await invoke('write_registry', {
          key: 'Software\\BDR Systems\\BDR Nexus',
          value: key,
          data: value
        });
        return;
      } catch (e) {
        console.warn('[WindowsBridge] Registry write fallback to LocalStorage', e);
      }
    }

    localStorage.setItem(`bdr_reg_${key}`, value);
  }
}
