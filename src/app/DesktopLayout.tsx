import React, { Suspense, useState, useEffect } from 'react';
import { useOsStore } from './store/useOsStore';
import { LaunchpadView } from './layout/LaunchpadView';
import { GlobalDock } from './layout/GlobalDock';
import type { User } from '@/core/db';
import { Loader2, Plus, Settings, Factory, Box } from 'lucide-react';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { hasPortalAccess } from '@/core/permissions';
import { Skeleton } from '@/shared/components/Skeleton';
import { PdrPageSkeleton } from '@/features/pdr-engine/components/PdrPageSkeleton';
import { SystemBackground } from '@/shared/components/SystemBackground';
import { NotificationHub } from '@/components/notifications/NotificationHub';
import { useNotificationsContext } from '@/shared/context/NotificationContext';
import { PortalTabs } from './layout/PortalTabs';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const PdrLayout = React.lazy(() => import('@/features/pdr-engine/layout/PdrLayout').then(m => ({ default: m.PdrLayout })));
const MasterDataLayout = React.lazy(() => import('@/features/organization/layout/MasterDataLayout').then(m => ({ default: m.MasterDataLayout })));
const AnalyticsLayout = React.lazy(() => import('@/features/analytics/layout/AnalyticsLayout').then(m => ({ default: m.AnalyticsLayout })));
const PreventiveLayout = React.lazy(() => import('@/features/preventive/layout/PreventiveLayout').then(m => ({ default: m.PreventiveLayout })));
const CorrectiveLayout = React.lazy(() => import('@/features/corrective/layout/CorrectiveLayout').then(m => ({ default: m.CorrectiveLayout })));
const SystemSettingsLayout = React.lazy(() => import('@/features/system/layout/SystemSettingsLayout').then(m => ({ default: m.SystemSettingsLayout })));
const FactoryLayout = React.lazy(() => import('@/features/factory/layout/FactoryLayout').then(m => ({ default: m.FactoryLayout })));

// Loading Fallback
function PortalFallback() {
  return (
    <div className="flex-1 flex flex-col w-full h-full p-4 md:p-6 overflow-hidden bg-transparent">
      <PdrPageSkeleton />
    </div>
  );
}

export function DesktopLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { activePortal, setPortal } = useOsStore();
  const { addNotification } = useNotificationsContext();
  const [isHubOpen, setIsHubOpen] = useState(false);

  // System Initialization Signal (with session check to prevent duplicates)
  useEffect(() => {
    const sessionInitialized = sessionStorage.getItem('os_signal_init');
    const isSandboxMode = localStorage.getItem('BDR_NEXUS_SANDBOX_MODE') === 'true';
    if (!sessionInitialized && user) {
      if (isSandboxMode) {
        addNotification({
          type: 'warning',
          title: 'System Sandbox Core Active 🧠',
          message: 'Welcome to the deep simulation environment. Ciob Maroc factory mutations, active technician squad, and critical inventory alerts are live & isolated.',
          source: 'Sandbox',
          portal: 'SYSTEM'
        });
      } else {
        addNotification({
          type: 'info',
          title: 'System Interface Active',
          message: `Welcome to Titanic OS. All secure protocols are now operational for ${user.name}.`,
          source: 'Kernel',
          portal: 'SYSTEM'
        });
      }
      sessionStorage.setItem('os_signal_init', 'true');
    }
  }, [user, addNotification]);

  // Security Guard: Prevent unauthorized portal access
  useEffect(() => {
    if (activePortal !== 'HOME' && !hasPortalAccess(user, activePortal)) {
      console.warn(`SECURITY: Unauthorized access attempt to portal [${activePortal}] by user [${user?.name}]`);
      setPortal('HOME');
    }
  }, [activePortal, user, setPortal]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans selection:bg-blue-500/30 relative">
      <SystemBackground />
      <NotificationHub isOpen={isHubOpen} onClose={() => setIsHubOpen(false)} />
      
      {/* The Unified Global Dock - Fixed position, highest z-index */}
      <GlobalDock user={user} onLogout={onLogout} onToggleNotifications={() => setIsHubOpen(!isHubOpen)} />

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Persistent Tab Bar */}
        {activePortal !== 'HOME' && (
          <div className="w-full pl-[84px] md:pl-[96px] pr-36 md:pr-56 pt-2 shrink-0">
            <PortalTabs />
          </div>
        )}
        
        <div className={`flex-1 flex overflow-hidden relative ${activePortal !== 'HOME' ? 'pl-[84px] md:pl-[96px] pt-1' : ''}`}>
          <ErrorBoundary>
            {activePortal === 'HOME' ? (
              <LaunchpadView user={user} />
            ) : (
              <Suspense fallback={<PortalFallback />}>
                <div className="flex flex-col w-full h-full relative">
                   <div className="flex flex-1 overflow-hidden">
                     <ErrorBoundary key={activePortal} portalId={activePortal}>
                       {activePortal === 'PDR' && <PdrLayout user={user} onLogout={onLogout} />}
                       {activePortal === 'ORGANIZATION' && <MasterDataLayout user={user} onLogout={onLogout} />}
                       {activePortal === 'FACTORY' && <FactoryLayout user={user} onLogout={onLogout} />}
                       {activePortal === 'ANALYTICS' && <AnalyticsLayout user={user} onLogout={onLogout} />}
                       {activePortal === 'PREVENTIVE' && <PreventiveLayout user={user} onLogout={onLogout} />}
                       {activePortal === 'CORRECTIVE' && <CorrectiveLayout user={user} onLogout={onLogout} />}
                       {activePortal === 'SETTINGS' && <SystemSettingsLayout user={user} onLogout={onLogout} />}
                     </ErrorBoundary>
                   </div>
                </div>
              </Suspense>
            )}
          </ErrorBoundary>
        </div>
      </div>
      
      {/* GLOBAL QUICK ACTION FAB */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="fixed bottom-12 right-6 w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(99,102,241,0.8)] flex items-center justify-center transition-all z-50 group border border-indigo-400/50">
             <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
           <DropdownMenu.Content align="end" sideOffset={10} className="z-50 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 min-w-[220px] shadow-2xl animate-in fade-in slide-in-from-bottom-5">
              <DropdownMenu.Label className="px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Quick Inject</DropdownMenu.Label>
              <DropdownMenu.Separator className="h-px bg-white/10 my-1" />
              <DropdownMenu.Item 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/30 cursor-pointer outline-none border border-transparent transition-all"
                onClick={() => { setPortal('FACTORY'); setTimeout(() => document.dispatchEvent(new CustomEvent('open-add-machine')), 100); }}
              >
                 <Factory className="w-4 h-4 text-indigo-400" /> Register Machine
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-500/30 cursor-pointer outline-none border border-transparent transition-all"
                onClick={() => { setPortal('PDR'); setTimeout(() => document.dispatchEvent(new CustomEvent('open-add-pdr-blueprint')), 100); }}
              >
                 <Box className="w-4 h-4 text-cyan-400" /> Link Spare Part
              </DropdownMenu.Item>
           </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
