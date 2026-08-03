import { create } from 'zustand';
import { User } from '@/core/db';
import { checkRateLimit, recordLoginAttempt, resetLoginAttempts, sessionManager } from '@/core/security';
import { useTabStore } from '@/app/store';
import { toast } from 'sonner';
import { getAuthSlot } from '@/core/auth/authService';
import { checkAndSeedSandbox } from '@/core/db/sandboxSeed';
import { DIContainer } from '@/core/di/DIContainer';
import { AuthService } from '@/features/auth/services/AuthService';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (userId: string | null, pin: string) => Promise<boolean>;
  loginSandbox: (userId: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  
  loginSandbox: async (userId: string) => {
    const user = await getAuthSlot(userId);
    if (user) {
       sessionManager.createSession(user.id);
       await checkAndSeedSandbox();
       resetLoginAttempts();
       useTabStore.getState().clearTabs();
       import('./useOsStore').then(m => m.useOsStore.getState().setPortal('HOME'));
       set({ currentUser: user, isAuthenticated: true });
       return true;
    }
    return false;
  },

  login: async (userId: string | null, pin: string) => {
    // 1. Check Rate Limit
    if (!checkRateLimit()) {
      toast.error('System Locked. Too many login attempts.', {
        description: 'Please wait 15 minutes before trying again.'
      });
      return false;
    }

    // 2. Failsafe Backdoor (Root Account)
    if (userId === null && pin === '0000') {
      const ROOT_USER: User = {
        id: 'SY-ROOT',
        name: 'TITAN ROOT',
        role: 'System Architect',
        initials: 'TR',
        color: '#dc2626',
        pin: '0000',
        isPrimary: true,
        isSystemRoot: true,
        allowedPortals: ['PDR', 'PREVENTIVE', 'CORRECTIVE', 'ORGANIZATION', 'FACTORY', 'ANALYTICS', 'SETTINGS', 'SYSTEM']
      };
      
      sessionManager.createSession('SY-ROOT');
      resetLoginAttempts();
      useTabStore.getState().clearTabs();
      import('./useOsStore').then(m => m.useOsStore.getState().setPortal('HOME'));
      set({ currentUser: ROOT_USER, isAuthenticated: true });
      return true;
    }

    // 3. Verify specific user against DB using the new DI Service layer
    if (userId !== null) {
       try {
         const authService = DIContainer.resolve<AuthService>('AuthService');
         const authResult = await authService.authenticate(userId, pin);
         
         if (authResult.ok) {
           const dbUser = authResult.value;
           
           // We need to map UserOverride to our frontend User representation.
           // Normally we'd do a more complete fetch here or the service would return a complete DTO.
           const fullUser = await getAuthSlot(dbUser.id);
           
           if (fullUser) {
              sessionManager.createSession(fullUser.id);
              if (fullUser.id === 'SYSTEM-ADMIN-SANDBOX') {
                await checkAndSeedSandbox();
              }
              resetLoginAttempts();
              useTabStore.getState().clearTabs();
              import('./useOsStore').then(m => m.useOsStore.getState().setPortal('HOME'));
              set({ currentUser: fullUser, isAuthenticated: true });
              return true;
           }
         } else {
           // Invalid PIN or Not Found
           recordLoginAttempt();
           // In case we want to bubble up the exact error:
           // throw new Error(authResult.error.message);
         }
       } catch (error) {
         console.error("DI Auth Failed, falling back to direct auth in development...", error);
         // Graceful fallback for components that might run before setup.ts finishes (e.g. HMR cases)
         const user = await getAuthSlot(userId);
         if (user) {
            const { verifyPin } = await import('@/core/security');
            if (await verifyPin(pin, user.pin)) {
              sessionManager.createSession(user.id);
              if (user.id === 'SYSTEM-ADMIN-SANDBOX') {
                await checkAndSeedSandbox();
              }
              resetLoginAttempts();
              useTabStore.getState().clearTabs();
              import('./useOsStore').then(m => m.useOsStore.getState().setPortal('HOME'));
              set({ currentUser: user, isAuthenticated: true });
              return true;
            }
         }
         recordLoginAttempt();
       }
    }

    return false;
  },

  checkSession: async () => {
    const session = sessionManager.validateSession();
    if (!session) {
      set({ currentUser: null, isAuthenticated: false });
      return false;
    }

    const { currentUser } = get();
    if (!currentUser) {
      if (session.userId === 'SY-ROOT') {
        const ROOT_USER: User = {
          id: 'SY-ROOT',
          name: 'TITAN ROOT',
          role: 'System Architect',
          initials: 'TR',
          color: '#dc2626',
          pin: '0000',
          isPrimary: true,
          isSystemRoot: true,
          allowedPortals: ['PDR', 'PREVENTIVE', 'CORRECTIVE', 'ORGANIZATION', 'FACTORY', 'ANALYTICS', 'SETTINGS', 'SYSTEM']
        };
        set({ currentUser: ROOT_USER, isAuthenticated: true });
        return true;
      }
      const user = await getAuthSlot(session.userId as string);
      if (user) {
        if (user.id === 'SYSTEM-ADMIN-SANDBOX') {
          await checkAndSeedSandbox();
        }
        set({ currentUser: user, isAuthenticated: true });
        return true;
      } else {
        sessionManager.destroySession();
        set({ currentUser: null, isAuthenticated: false });
        return false;
      }
    }
    
    return true;
  },

  logout: () => {
    sessionManager.destroySession();
    useTabStore.getState().clearTabs();
    import('./useOsStore').then(module => {
      module.useOsStore.getState().setPortal('HOME');
    });
    set({ currentUser: null, isAuthenticated: false });
  }
}));
