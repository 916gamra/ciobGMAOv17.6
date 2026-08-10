// src/core/security/SessionProtection.ts
import { createLogger } from '../logging/Logger';

export interface DeviceInfo {
  ipAddress: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  deviceId: string;
}

export interface SessionBinding {
  userId: string;
  deviceId: string;
  ipAddress: string;
  createdAt: number;
  lastVerified: number;
}

export interface SessionData {
  id: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  fingerprint: string;
  binding: SessionBinding;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface SessionValidationResult {
  isValid: boolean;
  reason: string;
  threats: string[];
}

export interface SessionActivity {
  sessionId: string;
  type: string;
  timestamp: number;
}

export class SessionProtection {
  private logger = createLogger('SessionProtection');
  private activeSessions = new Map<string, SessionData>();
  private sessionBindings = new Map<string, SessionBinding>();
  private deviceFingerprints = new Map<string, string>();
  private suspiciousSessionActivities: SessionActivity[] = [];

  createProtectedSession(userId: string, deviceInfo: DeviceInfo): SessionData {
    const sessionId = this.generateSecureSessionId();
    const fingerprint = this.generateDeviceFingerprint(deviceInfo);
    const binding = this.createSessionBinding(userId, deviceInfo);

    const session: SessionData = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      fingerprint,
      binding,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      isActive: true,
    };

    this.activeSessions.set(sessionId, session);
    this.deviceFingerprints.set(sessionId, fingerprint);
    this.sessionBindings.set(sessionId, binding);

    this.logger.info('Protected session created', { sessionId, userId });

    return session;
  }

  validateSession(sessionId: string, deviceInfo: DeviceInfo): SessionValidationResult {
    const session = this.activeSessions.get(sessionId);

    const result: SessionValidationResult = {
      isValid: false,
      reason: 'Unknown',
      threats: [],
    };

    if (!session) {
      result.reason = 'Session not found';
      return result;
    }

    if (Date.now() > session.expiresAt) {
      result.reason = 'Session expired';
      this.terminateSession(sessionId);
      return result;
    }

    const currentFingerprint = this.generateDeviceFingerprint(deviceInfo);
    if (currentFingerprint !== session.fingerprint) {
      result.reason = 'Device fingerprint mismatch';
      result.threats.push('Possible session hijacking');
      this.recordSuspiciousActivity(sessionId, 'fingerprint-mismatch');
      this.terminateSession(sessionId);
      return result;
    }

    if (deviceInfo.ipAddress !== session.ipAddress) {
      result.reason = 'IP address mismatch';
      result.threats.push('Possible session hijacking from different IP');
      this.recordSuspiciousActivity(sessionId, 'ip-mismatch');
      return result;
    }

    if (deviceInfo.userAgent !== session.userAgent) {
      result.reason = 'User agent mismatch';
      result.threats.push('Possible session hijacking with different browser');
      this.recordSuspiciousActivity(sessionId, 'user-agent-mismatch');
    }

    const anomalyScore = this.detectSessionAnomalies(sessionId);
    if (anomalyScore > 70) {
      result.threats.push('Unusual session activity detected');
      this.recordSuspiciousActivity(sessionId, 'anomaly-detected');
    }

    session.lastActivity = Date.now();
    result.isValid = result.threats.length === 0;

    if (!result.isValid) {
      this.logger.warn('Session validation failed', { sessionId, reason: result.reason });
    }

    return result;
  }

  private generateSecureSessionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
    const fingerprint = `${deviceInfo.userAgent}|${deviceInfo.screenResolution}|${deviceInfo.timezone}|${deviceInfo.language}`;
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private createSessionBinding(userId: string, deviceInfo: DeviceInfo): SessionBinding {
    return {
      userId,
      deviceId: deviceInfo.deviceId,
      ipAddress: deviceInfo.ipAddress,
      createdAt: Date.now(),
      lastVerified: Date.now(),
    };
  }

  private detectSessionAnomalies(sessionId: string): number {
    const activities = this.suspiciousSessionActivities.filter(
      a => a.sessionId === sessionId && Date.now() - a.timestamp < 60000
    );
    return Math.min(activities.length * 10, 100);
  }

  private recordSuspiciousActivity(sessionId: string, type: string): void {
    this.suspiciousSessionActivities.push({
      sessionId,
      type,
      timestamp: Date.now(),
    });
    if (this.suspiciousSessionActivities.length > 10000) {
      this.suspiciousSessionActivities = this.suspiciousSessionActivities.slice(-10000);
    }
  }

  terminateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    this.deviceFingerprints.delete(sessionId);
    this.sessionBindings.delete(sessionId);
    this.logger.info('Session terminated', { sessionId });
  }

  rotateSession(oldSessionId: string, deviceInfo: DeviceInfo): SessionData | null {
    const oldSession = this.activeSessions.get(oldSessionId);
    if (!oldSession) return null;

    const newSession = this.createProtectedSession(oldSession.userId, deviceInfo);
    this.terminateSession(oldSessionId);
    this.logger.info('Session rotated', { oldSessionId, newSessionId: newSession.id });
    return newSession;
  }

  getActiveSessions(): SessionData[] {
    return Array.from(this.activeSessions.values());
  }
}

export const sessionProtection = new SessionProtection();
