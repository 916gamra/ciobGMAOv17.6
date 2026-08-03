import bcrypt from 'bcryptjs';

// --- PIN HASHING ---
export const hashPin = async (pin: string): Promise<string> => {
  // Uses 10 salt rounds which is standard and performant enough for client-side
  return await bcrypt.hash(pin, 10);
};

export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  if (!pin || !hash) return false;
  
  try {
    // If it looks like a bcrypt hash, compare it
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return await bcrypt.compare(pin, hash);
    }
    // Fallback for plain text (failsafe)
    return pin === hash;
  } catch (e) {
    console.error('Cryptographic verification failed, falling back to basic compare');
    return pin === hash; 
  }
};

// --- RATE LIMITING (Brute Force Protection) ---
const loginAttempts = new Map<string, { count: number; timestamp: number }>();

export const checkRateLimit = (deviceId: string = 'local-device'): boolean => {
  const attempt = loginAttempts.get(deviceId);
  
  if (!attempt) return true;
  
  const now = Date.now();
  const timePassed = now - attempt.timestamp;
  
  // Reset after 15 minutes
  if (timePassed > 15 * 60 * 1000) {
    loginAttempts.delete(deviceId);
    return true;
  }
  
  // Allow max 5 attempts
  if (attempt.count >= 5) {
    return false;
  }
  
  return true;
};

export const recordLoginAttempt = (deviceId: string = 'local-device') => {
  const attempt = loginAttempts.get(deviceId);
  
  if (!attempt) {
    loginAttempts.set(deviceId, { count: 1, timestamp: Date.now() });
  } else {
    attempt.count++;
    attempt.timestamp = Date.now(); // update time to prolong lock if they keep hammering
  }
};

export const resetLoginAttempts = (deviceId: string = 'local-device') => {
  loginAttempts.delete(deviceId);
};

// --- SESSION MANAGEMENT ---
export interface Session {
  sessionId: string;
  userId: string | number;
  expiresAt: number;
  createdAt: number;
  lastActivity: number;
}

// In memory only, to strictly enforce logout on page reload.
// By avoiding sessionStorage/localStorage entirely, a page reload perfectly flushes the session.
let activeSessionInMemory: Session | null = null;

export const sessionManager = {
  createSession(userId: string | number, customTimeoutMinutes?: number): Session {
    // Default 30 min, or fetch from security policies
    const prefsStr = localStorage.getItem('ciob_security_prefs');
    let timeoutMinutes = 30;
    if (prefsStr) {
      try {
        const prefs = JSON.parse(prefsStr);
        if (prefs.autoLogoutMinutes) timeoutMinutes = prefs.autoLogoutMinutes;
      } catch(e) {}
    }
    
    if (customTimeoutMinutes) timeoutMinutes = customTimeoutMinutes;

    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + timeoutMinutes * 60 * 1000;
    
    const session: Session = {
      sessionId,
      userId,
      expiresAt,
      createdAt: now,
      lastActivity: now
    };
    
    if (typeof window !== 'undefined') {
      (window as any)._currentUserId = userId;
    }
    
    activeSessionInMemory = session;
    return session;
  },

  validateSession(): Session | null {
    if (!activeSessionInMemory) {
      if (typeof window !== 'undefined') {
        (window as any)._currentUserId = undefined;
      }
      return null;
    }

    try {
      const session = activeSessionInMemory;
      const now = Date.now();

      // Check if expired
      if (now > session.expiresAt) {
        if (typeof window !== 'undefined') {
          (window as any)._currentUserId = undefined;
        }
        activeSessionInMemory = null;
        return null;
      }

      // Update last activity and slide expiration
      const prefsStr = localStorage.getItem('ciob_security_prefs');
      let timeoutMinutes = 30;
      if (prefsStr) {
        const prefs = JSON.parse(prefsStr);
        if (prefs.autoLogoutMinutes) timeoutMinutes = prefs.autoLogoutMinutes;
      }
      
      session.lastActivity = now;
      session.expiresAt = now + timeoutMinutes * 60 * 1000;
      activeSessionInMemory = session;
      
      if (typeof window !== 'undefined') {
        (window as any)._currentUserId = session.userId;
      }
      
      return session;
    } catch (e) {
      return null;
    }
  },

  destroySession() {
    activeSessionInMemory = null;
    if (typeof window !== 'undefined') {
      (window as any)._currentUserId = undefined;
    }
  }
};
