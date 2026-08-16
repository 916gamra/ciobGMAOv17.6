import React, { useTransition } from 'react';
import { useTabStore } from '@/app/store';
import { useOsStore } from '@/app/store/useOsStore';
import { X, Package, Shield, Settings, Factory, BarChart3, Users, Wrench } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Reorder, motion } from 'framer-motion';
import type { PortalType } from '@/app/store';

const PORTAL_ICONS: Record<PortalType, React.ElementType> = {
  HOME: Package,
  PDR: Package,
  PREVENTIVE: Shield,
  CORRECTIVE: Wrench,
  ANALYTICS: BarChart3,
  FACTORY: Factory,
  ORGANIZATION: Users,
  SETTINGS: Settings,
};

const PORTAL_COLORS: Record<string, { dot: string, border: string, text: string }> = {
  PDR: { dot: 'bg-cyan-400', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  PREVENTIVE: { dot: 'bg-emerald-400', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  CORRECTIVE: { dot: 'bg-orange-400', border: 'border-orange-500/30', text: 'text-orange-400' },
  ANALYTICS: { dot: 'bg-fuchsia-400', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400' },
  FACTORY: { dot: 'bg-indigo-400', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  ORGANIZATION: { dot: 'bg-amber-400', border: 'border-amber-500/30', text: 'text-amber-400' },
  SETTINGS: { dot: 'bg-slate-400', border: 'border-slate-500/30', text: 'text-slate-400' },
};

export function PortalTabs() {
  const { tabs, closeTab, setActiveTab, reorderTabs } = useTabStore();
  const { activePortal, setPortal } = useOsStore();

  if (tabs.length === 0) return null;

  const HEADER_THEMES: Record<string, { bg: string, bottomBorderLine: string, tint: string, stroke: string }> = {
    PDR: { bg: 'bg-cyan-950/20 to-[#0a0a0f]/95 bg-gradient-to-r from-cyan-950/80', bottomBorderLine: 'bg-cyan-500/30', tint: 'text-cyan-500/10', stroke: 'text-cyan-500/40' },
    PREVENTIVE: { bg: 'bg-emerald-950/20 to-[#0a0a0f]/95 bg-gradient-to-r from-emerald-950/80', bottomBorderLine: 'bg-emerald-500/30', tint: 'text-emerald-500/10', stroke: 'text-emerald-500/40' },
    CORRECTIVE: { bg: 'bg-orange-950/20 to-[#0a0a0f]/95 bg-gradient-to-r from-orange-950/80', bottomBorderLine: 'bg-orange-500/30', tint: 'text-orange-500/10', stroke: 'text-orange-500/40' },
    ANALYTICS: { bg: 'bg-fuchsia-950/20 to-[#0a0a0f]/95 bg-gradient-to-r from-fuchsia-950/80', bottomBorderLine: 'bg-fuchsia-500/30', tint: 'text-fuchsia-500/10', stroke: 'text-fuchsia-500/40' },
    FACTORY: { bg: 'bg-indigo-950/20 to-[#0a0a0f]/95 bg-gradient-to-r from-indigo-950/80', bottomBorderLine: 'bg-indigo-500/30', tint: 'text-indigo-500/10', stroke: 'text-indigo-500/40' },
    ORGANIZATION: { bg: 'bg-amber-950/20 to-[#0a0a0f]/95 bg-gradient-to-r from-amber-950/80', bottomBorderLine: 'bg-amber-500/30', tint: 'text-amber-500/10', stroke: 'text-amber-500/40' },
    SETTINGS: { bg: 'bg-slate-900/20 to-[#0a0a0f]/95 bg-gradient-to-r from-slate-900/80', bottomBorderLine: 'bg-white/10', tint: 'text-white/5', stroke: 'text-white/20' },
  };

  const TAB_SVG_THEMES: Record<string, { activeBg: string, inactiveBg: string, activeBorder: string, inactiveBorder: string, dropShadow: string }> = {
    PDR: { activeBg: 'text-cyan-500/25', inactiveBg: 'text-cyan-950/40 group-hover:text-cyan-900/50', activeBorder: 'text-cyan-400', inactiveBorder: 'text-cyan-500/35 group-hover:text-cyan-400/60', dropShadow: 'drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]' },
    PREVENTIVE: { activeBg: 'text-emerald-500/25', inactiveBg: 'text-emerald-950/40 group-hover:text-emerald-900/50', activeBorder: 'text-emerald-400', inactiveBorder: 'text-emerald-500/35 group-hover:text-emerald-400/60', dropShadow: 'drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
    CORRECTIVE: { activeBg: 'text-orange-500/25', inactiveBg: 'text-orange-950/40 group-hover:text-orange-900/50', activeBorder: 'text-orange-400', inactiveBorder: 'text-orange-500/35 group-hover:text-orange-400/60', dropShadow: 'drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]' },
    ANALYTICS: { activeBg: 'text-fuchsia-500/25', inactiveBg: 'text-fuchsia-950/40 group-hover:text-fuchsia-900/50', activeBorder: 'text-fuchsia-400', inactiveBorder: 'text-fuchsia-500/35 group-hover:text-fuchsia-400/60', dropShadow: 'drop-shadow-[0_0_10px_rgba(217,70,239,0.3)]' },
    FACTORY: { activeBg: 'text-indigo-500/25', inactiveBg: 'text-indigo-950/40 group-hover:text-indigo-900/50', activeBorder: 'text-indigo-400', inactiveBorder: 'text-indigo-500/35 group-hover:text-indigo-400/60', dropShadow: 'drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]' },
    ORGANIZATION: { activeBg: 'text-amber-500/25', inactiveBg: 'text-amber-950/40 group-hover:text-amber-900/50', activeBorder: 'text-amber-400', inactiveBorder: 'text-amber-500/35 group-hover:text-amber-400/60', dropShadow: 'drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
    SETTINGS: { activeBg: 'text-slate-500/25', inactiveBg: 'text-slate-900/40 group-hover:text-slate-800/50', activeBorder: 'text-slate-300', inactiveBorder: 'text-white/20 group-hover:text-white/40', dropShadow: 'drop-shadow-[0_0_10px_rgba(148,163,184,0.3)]' },
  };

  const activeHeaderTheme = HEADER_THEMES[activePortal] || { bg: 'bg-[#0a0a0f]/60', bottomBorderLine: 'bg-white/10', tint: 'text-white/5', stroke: 'text-white/20' };

  return (
    <div className="relative w-full">
      <header className={cn(
        "relative h-[80px] backdrop-blur-3xl flex items-center pl-3 md:pl-4 pr-36 md:pr-56 shrink-0 w-full overflow-x-auto custom-scrollbar z-[40] shadow-md",
        activeHeaderTheme.bg
      )}>
        {/* Soft Ambient Inner Glow to fully illuminate the left header junction */}
        <div className={cn(
          "absolute -left-10 top-0 bottom-0 w-64 opacity-40 blur-2xl pointer-events-none transition-colors duration-500",
          activePortal === 'CORRECTIVE' && "bg-orange-500/30",
          activePortal === 'PDR' && "bg-cyan-500/30",
          activePortal === 'PREVENTIVE' && "bg-emerald-500/30",
          activePortal === 'FACTORY' && "bg-indigo-500/30",
          activePortal === 'ANALYTICS' && "bg-fuchsia-500/30",
          activePortal === 'ORGANIZATION' && "bg-amber-500/30",
          activePortal === 'SETTINGS' && "bg-slate-500/30"
        )} />

        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none z-20 transition-colors duration-300",
          activeHeaderTheme.bottomBorderLine
        )} />

        <Reorder.Group 
          axis="x" 
          values={tabs} 
          onReorder={reorderTabs} 
          className="flex items-center gap-1.5 md:gap-2 h-full p-0 m-0 relative z-10"
        >
          {tabs.map((tab, index) => {
            const colors = PORTAL_COLORS[tab.portalId] || { dot: 'bg-white/40', border: 'border-white/10', text: 'text-white' };
            const Icon = PORTAL_ICONS[tab.portalId] || Package;
            const isCurrentPortal = tab.portalId === activePortal;
            const isFirst = index === 0;
            const tabTheme = TAB_SVG_THEMES[tab.portalId] || TAB_SVG_THEMES.SETTINGS;
            
            // [ \ shape for the first docked tab (Straight left [, Slanted \ right) matching reference image
            const pathFirst = "M 6 1 L 72 1 Q 75 1 77 4 L 94 34 Q 96 39 90 39 L 6 39 Q 1 39 1 34 L 1 6 Q 1 1 6 1 Z";
            // \ \ shape for secondary tabs (Slanted \ left, Slanted \ right)
            const pathSecondary = "M 12 1 L 73 1 Q 76 1 78 4 L 95 34 Q 97 39 91 39 L 30 39 Q 27 39 25 35 L 8 5 Q 10 1 12 1 Z";
            const dPath = isFirst ? pathFirst : pathSecondary;
            
            return (
              <Reorder.Item
                key={tab.portalId}
                value={tab}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                onPointerDown={() => {
                  if (!isCurrentPortal) {
                    setActiveTab(tab.portalId);
                    setPortal(tab.portalId);
                  }
                }}
                className={cn(
                  "group relative flex items-center cursor-pointer select-none shrink-0 w-[205px] md:w-[230px] h-[44px] md:h-[46px] transition-all duration-300",
                  isCurrentPortal ? "z-10" : "z-0 hover:z-10"
                )}
              >
                {/* PERFECT SVG SHAPE FOR GLASS & BORDERS */}
                <div className={cn("absolute inset-0 z-0 transition-all duration-300", isCurrentPortal && tabTheme.dropShadow)}>
                  <svg 
                    className="absolute inset-0 w-full h-full drop-shadow-sm" 
                    preserveAspectRatio="none" 
                    viewBox="0 0 100 40" 
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  >
                      {/* Base Dark Glass */}
                      <path d={dPath} fill="rgba(11, 16, 28, 0.9)" className="transition-all duration-300" />
                      {/* Engine Tint */}
                      <path d={dPath} className={cn("transition-all duration-300", isCurrentPortal ? tabTheme.activeBg : tabTheme.inactiveBg)} fill="currentColor" />
                      {/* Crisp High-Contrast Border */}
                      <path d={dPath} className={cn("transition-all duration-300", isCurrentPortal ? tabTheme.activeBorder : tabTheme.inactiveBorder)} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
                
                {/* CONTENT FOR TAB */}
                <div className={cn(
                  "relative z-10 flex items-center gap-3 w-full h-full pr-10",
                  isFirst ? "pl-5" : "pl-12 md:pl-14"
                )}>
                  <Icon className={cn(
                    "w-4 h-4 shrink-0 transition-all duration-300",
                    isCurrentPortal 
                      ? cn(colors.text, "scale-110 drop-shadow-[0_0_8px_currentColor]")
                      : cn(colors.text, "opacity-60 group-hover:opacity-100")
                  )} />
                  
                  <span className={cn(
                    "truncate flex-1 tracking-tight flex items-center gap-2 text-[12px] md:text-sm transition-colors",
                    isCurrentPortal ? "text-white font-black" : "text-slate-300 font-bold group-hover:text-white"
                  )}>
                    <span className="truncate">{tab.title}</span>
                  </span>

                  <button 
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.portalId); }}
                    className={cn(
                      "p-1 rounded-md transition-all hover:bg-white/20 shrink-0",
                      isCurrentPortal ? "text-white/70 hover:text-white" : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"
                    )}
                    title="Close Tab"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </header>

      {/* CURVED JUNCTION FILLET */}
      <div className="absolute top-full left-0 w-7 h-7 md:w-8 md:h-8 pointer-events-none z-[120] -mt-[1px]">
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          <path d="M 0 0 L 32 0 A 32 32 0 0 0 0 32 Z" fill="rgba(10, 10, 15, 0.95)" className="transition-colors duration-300" />
          <path d="M 0 0 L 32 0 A 32 32 0 0 0 0 32 Z" className={cn("transition-colors duration-300", activeHeaderTheme.tint)} fill="currentColor" />
          <path d="M 32 0 A 32 32 0 0 0 0 32" fill="none" className={cn("transition-colors duration-300", activeHeaderTheme.stroke)} stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}
