/**
 * Session Timeout Manager
 * Enforces automatic inactivity timeouts (e.g. 30 mins) and zeroizes memory buffers on expiry
 */

import { securitySession } from './session/securitySessionStore';

export class SessionTimeoutManager {
  private static timeoutId: ReturnType<typeof setTimeout> | null = null;
  private static readonly DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 mins

  /**
   * Starts or resets the session inactivity timeout
   */
  static startTimeout(onTimeout?: () => void, timeoutMs = this.DEFAULT_TIMEOUT_MS): void {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      this.handleTimeout(onTimeout);
    }, timeoutMs);
  }

  /**
   * Resets the inactivity timer on user interaction
   */
  static resetTimeout(onTimeout?: () => void, timeoutMs = this.DEFAULT_TIMEOUT_MS): void {
    this.startTimeout(onTimeout, timeoutMs);
  }

  /**
   * Clears active timer
   */
  static clearTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Handles session expiration by clearing memory and invoking callback
   */
  private static handleTimeout(onTimeout?: () => void): void {
    securitySession.lock();
    if (onTimeout) {
      onTimeout();
    }
  }
}
