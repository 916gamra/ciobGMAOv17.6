import React from 'react';
import { useTabStore, type PortalType } from '../store';
import { useOsStore } from '../store/useOsStore';
import { motion } from 'motion/react';
import { X, Package, Box, ShieldCheck, PieChart, Factory, Network, Settings as SettingsIcon, Wrench } from 'lucide-react';
import { cn } from '@/shared/utils';

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

export function PortalTabs() {
  const { tabs, setActiveTab, closeTab } = useTabStore();
  const { setPortal, activePortal } = useOsStore();

  if (tabs.length === 0) return null;

  return (
    <header className="h-[44px] md:h-[50px] bg-black/60 backdrop-blur-xl border-b border-white/10 flex items-end px-4 md:px-6 gap-1 shrink-0 w-full overflow-x-auto custom-scrollbar lg:pr-64 z-[60]">
      <div className="flex gap-px">
        {tabs.map((tab) => {
          const colors = PORTAL_COLORS[tab.portalId] || { dot: 'bg-white/40', border: 'border-white/10', text: 'text-white' };
          const Icon = PORTAL_ICONS[tab.portalId] || Package;
          const isCurrentPortal = tab.portalId === activePortal;

          return (
            <div
              key={tab.portalId}
              onClick={() => {
                setActiveTab(tab.portalId);
                setPortal(tab.portalId);
              }}
              className={cn(
                "group relative flex items-center h-[36px] md:h-[40px] px-4 md:px-5 min-w-[140px] max-w-[200px] md:min-w-[180px] md:max-w-[260px] rounded-t-xl cursor-pointer transition-all select-none border border-b-0 text-[11px] md:text-xs gap-3 shrink-0",
                isCurrentPortal
                  ? "bg-white/[0.08] text-white border-white/20 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.3)]" 
                  : "bg-white/[0.02] text-white/40 border-white/5 hover:bg-white/5 hover:text-white/70"
              )}
            >
              {/* Engine Icon - Colored */}
              <Icon className={cn(
                "w-4 h-4 shrink-0 transition-all duration-300",
                isCurrentPortal 
                  ? colors.text 
                  : cn(colors.text, "opacity-40")
              )} />
              
              <span className="truncate flex-1 font-medium flex items-center gap-2">
                <span className="truncate">{tab.title}</span>
              </span>

              <button 
                onClick={(e) => { e.stopPropagation(); closeTab(tab.portalId); }}
                className={cn(
                  "ml-1 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-white/40 hover:text-white",
                  isCurrentPortal && "opacity-40"
                )}
              >
                <X className="w-3 h-3" />
              </button>

              {/* Bottom active indicator */}
              {isCurrentPortal && (
                <motion.div 
                  layoutId="tab-underline"
                  className={cn("absolute bottom-0 left-0 right-0 h-[2px]", colors.dot.split(' ')[0])} 
                />
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}
