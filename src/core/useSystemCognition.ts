import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useTabStore } from '@/app/store';
import { toast } from 'sonner';
import { runBackgroundHealthCheck } from '@/core/health';

import { useNotificationsContext } from '@/shared/context/NotificationContext';

/**
 * Cognition Engine (The Self-Awareness Module)
 * Gives the application "consciousness" of its state across tabs, user presence, and terminal lifecycle.
 */
export function useSystemCognition() {
  const { isAuthenticated, logout, checkSession } = useAuthStore();
  const { clearTabs } = useTabStore();
  const notifications = useNotificationsContext();
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // --- 1. HEALTH AND VITALITY CHECKS ---
  useEffect(() => {
    // Run an initial health check 5 seconds after boot to let React settle
    const initialHealthTimer = setTimeout(() => {
      runBackgroundHealthCheck();
    }, 5000);

    // Continue checking every 30 minutes
    healthCheckTimerRef.current = setInterval(() => {
      runBackgroundHealthCheck();
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialHealthTimer);
      if (healthCheckTimerRef.current) clearInterval(healthCheckTimerRef.current);
    };
  }, []);

  // --- 2. IDLE DETECTION (Auto-Lock) ---
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    // If not authenticated, don't run the timer
    if (!useAuthStore.getState().isAuthenticated) return;

    // 15 Minutes Idle Timeout
    idleTimerRef.current = setTimeout(() => {
      logout();
      clearTabs();
      notifications.addNotification({
        type: 'warning',
        title: 'Terminal Auto-Lock',
        message: 'Identity session suspended due to inactivity.',
        source: 'Security Core',
        portal: 'SYSTEM'
      });
      toast.error('Terminal Locked', {
        description: 'You have been logged out due to inactivity (15 minutes).',
        duration: 5000,
        icon: '🔒'
      });
      // Tell other tabs to lock down too
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'IDLE_TIMEOUT' });
      }
    }, 15 * 60 * 1000); 
  };

  useEffect(() => {
    // --- 3. MULTI-TERMINAL HIVE MIND (Cross-Tab Sync) ---
    broadcastChannelRef.current = new BroadcastChannel('ciob-os-consciousness');

    broadcastChannelRef.current.onmessage = (event) => {
      const { type } = event.data;

      if (type === 'LOGOUT') {
        // Someone clicked logout in another tab
        useAuthStore.getState().logout();
        useTabStore.getState().clearTabs();
        notifications.addNotification({
          type: 'info',
          title: 'Remote Logout',
          message: 'Secure session terminated via secondary terminal.',
          source: 'Kernel',
          portal: 'SYSTEM'
        });
        toast.info('Terminal Synchronized', {
          description: 'Session terminated from another terminal.',
          icon: '🔄'
        });
      } else if (type === 'LOGIN') {
        // Someone logged in from another tab
        checkSession().then((isValid) => {
          if (isValid) {
            notifications.addNotification({
              type: 'info',
              title: 'Remote Login',
              message: 'Authentication state synchronized from secondary terminal.',
              source: 'Kernel',
              portal: 'SYSTEM'
            });
            toast.success('Terminal Synchronized', {
              description: 'Authentication propagated from another terminal.',
              icon: '🔄'
            });
          }
        });
      } else if (type === 'IDLE_TIMEOUT') {
        useAuthStore.getState().logout();
        useTabStore.getState().clearTabs();
      }
    };

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [checkSession]);

  useEffect(() => {
    // Tell other tabs we logged in or out
    if (broadcastChannelRef.current) {
      if (isAuthenticated) {
        broadcastChannelRef.current.postMessage({ type: 'LOGIN' });
        resetIdleTimer(); // Start tracking presence
      } else {
        broadcastChannelRef.current.postMessage({ type: 'LOGOUT' });
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Detect human presence
    const userActivityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      resetIdleTimer();
    };

    userActivityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      userActivityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // --- 4. NETWORK AWARENESS (Environment Consciousness) ---
  useEffect(() => {
    const handleOffline = () => {
      notifications.addNotification({
        type: 'critical',
        title: 'Signal Degradation',
        message: 'Primary data uplink lost. Integrity Shield active in offline mode.',
        source: 'Network Core',
        portal: 'SYSTEM'
      });
      toast.warning('Signal Lost: Entering Offline Mode', {
        description: 'You can continue working. Data is safely stored locally and will sync when connection returns.',
        icon: '📡',
        duration: Infinity, // Stays until closed or online
        id: 'network-status'
      });
    };

    const handleOnline = () => {
      notifications.addNotification({
        type: 'info',
        title: 'Signal Restored',
        message: 'Communication link re-established. Synchronizing local node...',
        source: 'Network Core',
        portal: 'SYSTEM'
      });
      toast.success('Connection Restored', {
        description: 'You are back online. Synchronizing data...',
        icon: '🌐',
        id: 'network-status', // Overwrites the offline toast
        duration: 3000
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}
