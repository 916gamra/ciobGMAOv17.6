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
    <header className="h-[46px] md:h-[52px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center px-3 gap-2 shrink-0 w-full overflow-x-auto custom-scrollbar lg:pr-64 z-[60] shadow-xl my-1">
      <div className="flex items-center gap-1.5 w-full">
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
                "group relative flex items-center h-[34px] md:h-[38px] px-3.5 md:px-4 min-w-[130px] max-w-[200px] md:min-w-[170px] md:max-w-[240px] rounded-xl cursor-pointer transition-all duration-300 select-none border text-[11px] md:text-xs gap-2.5 shrink-0",
                isCurrentPortal
                  ? "bg-white/10 text-white border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.08)]" 
                  : "bg-white/[0.02] text-white/50 border-white/5 hover:bg-white/[0.06] hover:text-white/80"
              )}
            >
              {/* Engine Icon - Colored */}
              <Icon className={cn(
                "w-4 h-4 shrink-0 transition-all duration-300",
                isCurrentPortal 
                  ? cn(colors.text, "scale-110 drop-shadow-[0_0_8px_currentColor]")
                  : cn(colors.text, "opacity-50 group-hover:opacity-80")
              )} />
              
              <span className="truncate flex-1 font-semibold tracking-tight flex items-center gap-2">
                <span className="truncate">{tab.title}</span>
              </span>

              <button 
                onClick={(e) => { e.stopPropagation(); closeTab(tab.portalId); }}
                className={cn(
                  "ml-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all text-white/50 hover:text-white",
                  isCurrentPortal && "opacity-60"
                )}
              >
                <X className="w-3 h-3" />
              </button>

              {/* Pill active indicator */}
              {isCurrentPortal && (
                <motion.div 
                  layoutId="tab-pill"
                  className={cn("absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full", colors.dot.split(' ')[0])} 
                />
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}
