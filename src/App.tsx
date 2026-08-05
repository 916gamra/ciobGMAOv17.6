/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SplashScreen } from '@/app/SplashScreen';
import { DesktopLayout } from '@/app/DesktopLayout';
import { LoginScreen } from '@/features/auth/views/LoginScreen';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useSystemCognition } from '@/core/useSystemCognition';
import { runDatabaseSeed } from '@/core/db/useDatabaseSeeder';

const queryClient = new QueryClient();

import { NotificationProvider } from '@/shared/context/NotificationContext';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

function SystemLifecycle() {
  useSystemCognition();
  return null;
}

export default function App() {
  const [isSplashScreenDone, setIsSplashScreenDone] = useState(false);
  const [isSessionVerified, setIsSessionVerified] = useState(false);
  const { isAuthenticated, currentUser, logout, checkSession } = useAuthStore();
  
  useEffect(() => {
    // Check if there is an active session before removing the splash screen
    const verify = async () => {
       try {
         await runDatabaseSeed(true)(); // Inject/sync master data always
         await checkSession();
       } finally {
         setIsSessionVerified(true);
       }
    };
    verify();
  }, [checkSession]);

  const isBooting = !isSplashScreenDone || !isSessionVerified;

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <ErrorBoundary componentName="AppRoot">
          <SystemLifecycle />
          {/* Global Toast Notifications */}
          <Toaster 
            position="bottom-right" 
            expand={true}
            richColors
            visibleToasts={3}
            closeButton
            theme="dark" 
            toastOptions={{
              className: 'titanic-toast group',
              style: {
                background: 'transparent',
                border: 'none',
              },
              duration: 4000,
            }}
          />

          {isBooting && (
            <SplashScreen onComplete={() => setIsSplashScreenDone(true)} />
          )}
          
          {!isBooting && !isAuthenticated && <LoginScreen />}
          
          {!isBooting && isAuthenticated && <DesktopLayout user={currentUser} onLogout={logout} />}
        </ErrorBoundary>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

