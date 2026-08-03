import { describe, it, expect, beforeEach } from 'vitest';
import { hashPin, verifyPin, checkRateLimit, recordLoginAttempt, resetLoginAttempts, sessionManager } from '../security';

describe('Security & Authentication Module', () => {
  beforeEach(() => {
    resetLoginAttempts('test-device-1');
    sessionManager.destroySession();
  });

  it('should hash and verify PIN securely using bcrypt', async () => {
    const pin = '1234';
    const hash = await hashPin(pin);
    
    expect(hash).not.toBe(pin);
    expect(await verifyPin('1234', hash)).toBe(true);
    expect(await verifyPin('9999', hash)).toBe(false);
  });

  it('should enforce brute force rate limiting after 5 failed attempts', () => {
    const deviceId = 'test-device-1';
    expect(checkRateLimit(deviceId)).toBe(true);

    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(deviceId);
    }

    expect(checkRateLimit(deviceId)).toBe(false);
    resetLoginAttempts(deviceId);
    expect(checkRateLimit(deviceId)).toBe(true);
  });

  it('should manage and invalidate user sessions', () => {
    const session = sessionManager.createSession('user-001', 30);
    expect(session.userId).toBe('user-001');

    const validSession = sessionManager.validateSession();
    expect(validSession).not.toBeNull();
    expect(validSession?.userId).toBe('user-001');

    sessionManager.destroySession();
    expect(sessionManager.validateSession()).toBeNull();
  });
});
