/**
 * Session Manager
 * Manages active user security session tokens, expiry, revocation, and security state
 */

import { securitySession } from './session/securitySessionStore';

export interface SessionToken {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
}

export class SessionManager {
  private static activeSessions = new Map<string, SessionToken>();

  /**
   * Creates a new cryptographically signed session token
   */
  static createSession(userId: string, ttlMs = 8 * 60 * 60 * 1000): SessionToken {
    const now = Date.now();
    const token: SessionToken = {
      id: crypto.randomUUID(),
      userId,
      createdAt: now,
      expiresAt: now + ttlMs,
      revoked: false
    };

    this.activeSessions.set(token.id, token);
    return token;
  }

  /**
   * Validates if a session token is active and not expired
   */
  static validateSession(tokenId: string): boolean {
    const token = this.activeSessions.get(tokenId);
    if (!token) return false;
    if (token.revoked) return false;
    if (Date.now() > token.expiresAt) {
      this.revokeSession(tokenId);
      return false;
    }
    return true;
  }

  /**
   * Revokes a session token and wipes in-memory session secrets
   */
  static revokeSession(tokenId: string): void {
    const token = this.activeSessions.get(tokenId);
    if (token) {
      token.revoked = true;
      this.activeSessions.delete(tokenId);
    }
    securitySession.lock();
  }

  /**
   * Revokes all active sessions
   */
  static revokeAllSessions(): void {
    this.activeSessions.clear();
    securitySession.lock();
  }
}
