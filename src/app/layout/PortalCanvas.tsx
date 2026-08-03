import React from 'react';
import { useTabStore } from '../store';
import { useOsStore } from '../store/useOsStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, Box, ShieldCheck, PieChart, Factory, Network, Settings as SettingsIcon, Wrench } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { User } from '@/core/db';
import { SettingsView } from '@/features/settings/views/SettingsView';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

const PORTAL_ICONS: Record<string, React.FC<any>> = {
  PDR: Box,
  PREVENTIVE: ShieldCheck,
  CORRECTIVE: Wrench,
  ANALYTICS: PieChart,
  FACTORY: Factory,
  ORGANIZATION: Network,
  SETTINGS: SettingsIcon,
};

const PORTAL_COLORS: Record<string, { dot: string, border: string, text: string }> = {
  PDR: { dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  PREVENTIVE: { dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  CORRECTIVE: { dot: 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]', border: 'border-orange-500/30', text: 'text-orange-400' },
  ANALYTICS: { dot: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(192,38,211,0.5)]', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400' },
  FACTORY: { dot: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  ORGANIZATION: { dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]', border: 'border-amber-500/30', text: 'text-amber-400' },
  SETTINGS: { dot: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]', border: 'border-slate-500/30', text: 'text-slate-400' },
};

export function PortalCanvas({ componentMap, user, onLogout }: { componentMap: Record<string, React.FC<any>>, user: User | null, onLogout: () => void }) {
  const { tabs } = useTabStore();
  const { activePortal } = useOsStore();

  const MERGED_MAP = {
    ...componentMap,
    'settings': SettingsView
  };

  const currentTab = tabs.find(t => t.portalId === activePortal);

  return (
        <main className="flex-1 flex flex-col min-w-0 relative z-10 bg-transparent overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden flex flex-col w-full">
            <AnimatePresence mode="wait">
              {currentTab ? (() => {
                const Component = MERGED_MAP[currentTab.component] || (() => <div className="p-6 text-[var(--text-dim)]">Component '{currentTab.component}' Not Found in Portal</div>);
                return (
                  <motion.div
                    key={`${currentTab.portalId}-${currentTab.id}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex flex-col overflow-x-hidden overflow-y-auto custom-scrollbar w-full"
                  >
                    <div className="flex flex-col px-4 py-6 md:p-8 min-h-0 h-full">
                      <ErrorBoundary key={currentTab.id} portalId={currentTab.portalId} componentName={currentTab.title}>
                        <Component tabId={currentTab.id} onLogout={onLogout} user={user} />
                      </ErrorBoundary>
                    </div>
                  </motion.div>
                );
              })() : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-dim)] px-6 text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 shadow-2xl">
                      <Package className="w-10 h-10 md:w-12 md:h-12 text-white/20" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-white/50 tracking-widest uppercase mb-2">No Active Module</h2>
                  <p className="text-xs md:text-sm max-w-sm">Select operations from the sidebar to begin.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
  );
}
