// src/core/windows/NotificationManager.ts
import { createLogger } from '@/core/logging/Logger';
import { toast } from 'sonner';

const logger = createLogger('NotificationManager');
const hasTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

export class NotificationManager {
  /**
   * إرسال إشعار Windows أو Toast
   */
  async showNotification(
    title: string,
    message: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'info',
    timeout?: number
  ): Promise<void> {
    try {
      if (hasTauri) {
        await (window as any).__TAURI__.invoke('show_notification', {
          title,
          message,
          icon,
          timeout: timeout || 5000,
        });
        logger.debug(`Notification shown (Tauri): ${title}`);
      } else {
        // Show HTML5 Notification or fallback to beautiful toast
        if (typeof window !== 'undefined') {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message });
          } else if ('Notification' in window && Notification.permission !== 'denied') {
            try {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification(title, { body: message });
                }
              });
            } catch {}
          }
          
          // Always show Toast fallback for beautiful inline UX in browser preview
          const description = `${title}: ${message}`;
          if (icon === 'success') {
            toast.success(description);
          } else if (icon === 'error') {
            toast.error(description);
          } else if (icon === 'warning') {
            toast.warning(description);
          } else {
            toast.info(description);
          }
        }
        logger.debug(`Notification shown (Toast): ${title}`);
      }
    } catch (error) {
      logger.error('Failed to show notification', error as Error);
    }
  }

  /**
   * إشعار نجاح
   */
  async success(title: string, message: string): Promise<void> {
    await this.showNotification(title, message, 'success');
  }

  /**
   * إشعار خطأ
   */
  async error(title: string, message: string): Promise<void> {
    await this.showNotification(title, message, 'error');
  }

  /**
   * إشعار تحذير
   */
  async warning(title: string, message: string): Promise<void> {
    await this.showNotification(title, message, 'warning');
  }

  /**
   * إشعار معلومات
   */
  async info(title: string, message: string): Promise<void> {
    await this.showNotification(title, message, 'info');
  }

  /**
   * إظهار رسالة في الـ System Tray
   */
  async showTrayMessage(message: string): Promise<void> {
    try {
      if (hasTauri) {
        await (window as any).__TAURI__.invoke('show_tray_message', { message });
        logger.debug('Tray message shown (Tauri)');
      } else {
        logger.debug(`Tray message (Mock): ${message}`);
        toast.info(`System Tray: ${message}`);
      }
    } catch (error) {
      logger.error('Failed to show tray message', error as Error);
    }
  }
}

export const notificationManager = new NotificationManager();
