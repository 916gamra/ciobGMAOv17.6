/**
 * In-Memory Security Session Store
 * Handles session secret retention and memory wiping on lock
 */

type SessionState = {
  unlocked: boolean;
  sessionSecret: Uint8Array | null;
  unlockedAt: number | null;
};

let state: SessionState = {
  unlocked: false,
  sessionSecret: null,
  unlockedAt: null
};

// Fallback default secret derived from system seed when no user PIN session active
const defaultSystemSecret = new TextEncoder().encode('bdr-nexus-gmao-v17-system-fallback-secret-2026');

export const securitySession = {
  getState(): SessionState {
    return state;
  },

  getActiveSecret(): Uint8Array {
    if (state.unlocked && state.sessionSecret) {
      return state.sessionSecret;
    }
    return defaultSystemSecret;
  },

  setSessionSecret(secret: Uint8Array): void {
    // Clear old secret if present
    if (state.sessionSecret) {
      state.sessionSecret.fill(0);
    }
    state = {
      unlocked: true,
      sessionSecret: new Uint8Array(secret),
      unlockedAt: Date.now()
    };
  },

  lock(): void {
    if (state.sessionSecret) {
      state.sessionSecret.fill(0); // Secure zeroize memory
    }
    state = {
      unlocked: false,
      sessionSecret: null,
      unlockedAt: null
    };
  }
};
