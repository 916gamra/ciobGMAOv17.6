import React from 'react';
import { cn } from '@/shared/utils';
import { LogOut, Sun, Moon, Languages } from 'lucide-react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useThemeStore } from '@/app/store/useThemeStore';
import { useLanguageStore } from '@/app/store/useLanguageStore';

interface PortalSidebarProps {
  portalName: string;
  portalIcon: React.ReactNode;
  colorClass?: string;
  borderClass?: string;
  textClass?: string;
  glowColor?: 'cyan' | 'indigo' | 'fuchsia' | 'emerald' | 'amber' | 'rose' | 'orange' | 'purple' | 'blue';
  children: React.ReactNode;
  className?: string;
}

export function PortalSidebar({ 
  portalName, 
  portalIcon, 
  colorClass = "bg-cyan-500/20", 
  borderClass = "border-cyan-500/30", 
  textClass = "text-cyan-400",
  glowColor = 'cyan',
  children, 
  className 
}: PortalSidebarProps) {
  const logout = useAuthStore(state => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  const { language, cycleLanguage } = useLanguageStore();

  const themeMap = {
    cyan: {
      border: 'border-cyan-500/30 group-hover/sidebar:border-cyan-400/50',
      shadow: 'shadow-[0_10px_30px_rgba(6,182,212,0.15)]',
      glow: 'bg-cyan-500/20',
      brandBadge: 'bg-gradient-to-br from-cyan-500/20 to-cyan-700/30 border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-950/50',
      bgGradient: 'from-cyan-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/95',
    },
    indigo: {
      border: 'border-indigo-500/30 group-hover/sidebar:border-indigo-400/50',
      shadow: 'shadow-[0_10px_30px_rgba(99,102,241,0.15)]',
      glow: 'bg-indigo-500/20',
      brandBadge: 'bg-gradient-to-br from-indigo-500/20 to-indigo-700/30 border-indigo-400/40 text-indigo-300 shadow-lg shadow-indigo-950/50',
      bgGradient: 'from-indigo-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/95',
    },
    fuchsia: {
      border: 'border-fuchsia-500/30 group-hover/sidebar:border-fuchsia-400/50',
      shadow: 'shadow-[0_10px_30px_rgba(217,70,239,0.15)]',
      glow: 'bg-fuchsia-500/20',
      brandBadge: 'bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-700/30 border-fuchsia-400/40 text-fuchsia-300 shadow-lg shadow-fuchsia-950/50',
      bgGradient: 'from-fuchsia-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/95',
    },
    emerald: {
      border: 'border-emerald-500/30 group-hover/sidebar:border-emerald-400/50',
      shadow: 'shadow-[0_10px_30px_rgba(16,185,129,0.15)]',
      glow: 'bg-emerald-500/20',
      brandBadge: 'bg-gradient-to-br from-emerald-500/20 to-emerald-700/30 border-emerald-400/40 text-emerald-300 shadow-lg shadow-emerald-950/50',
      bgGradient: 'from-emerald-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/95',
    },
    amber: {
      border: 'border-amber-500/30 group-hover/sidebar:border-amber-400/50',
      shadow: 'shadow-[0_10px_30px_rgba(245,158,11,0.15)]',
      glow: 'bg-amber-500/20',
      brandBadge: 'bg-gradient-to-br from-amber-500/20 to-amber-700/30 border-amber-400/40 text-amber-300 shadow-lg shadow-amber-950/50',
      bgGradient: 'from-amber-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/95',
    },
    rose: {
      border: 'border-rose-500/30 group-hover/sidebar:border-rose-400/50',
      shadow: 'shadow-[0_10px_30px_rgba(244,63,94,0.15)]',
      glow: 'bg-rose-500/20',
      brandBadge: 'bg-gradient-to-br from-rose-500/20 to-rose-700/30 border-rose-400/40 text-rose-300 shadow-lg shadow-rose-950/50',
      bgGradient: 'from-rose-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/95',
    },
    orange: {
      border: 'border-orange-500/30 group-hover/sidebar:border-orange-400/50',
      shadow: 'shadow-[0_10px_30px_rgba(249,115,22,0.15)]',
      glow: 'bg-orange-500/20',
      brandBadge: 'bg-gradient-to-br from-orange-500/20 to-orange-700/30 border-orange-400/40 text-orange-300 shadow-lg shadow-orange-950/50',
      bgGradient: 'from-orange-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/95',
    },
    purple: {
      border: 'border-purple-500/30 group-hover/sidebar:border-purple-400/50',
      shadow: 'shadow-[0_10px_30px_rgba(168,85,247,0.15)]',
      glow: 'bg-purple-500/20',
      brandBadge: 'bg-gradient-to-br from-purple-500/20 to-purple-700/30 border-purple-400/40 text-purple-300 shadow-lg shadow-purple-950/50',
      bgGradient: 'from-purple-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/95',
    },
    blue: {
      border: 'border-blue-500/30 group-hover/sidebar:border-blue-400/50',
      shadow: 'shadow-[0_10px_30px_rgba(59,130,246,0.15)]',
      glow: 'bg-blue-500/20',
      brandBadge: 'bg-gradient-to-br from-blue-500/20 to-blue-700/30 border-blue-400/40 text-blue-300 shadow-lg shadow-blue-950/50',
      bgGradient: 'from-blue-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/95',
    },
  };

  const activeTheme = themeMap[glowColor] || themeMap.cyan;

  return (
    <aside className={cn(
      "fixed top-0 left-0 bottom-0 w-[72px] md:w-[76px] z-50",
      "bg-gradient-to-b backdrop-blur-3xl border-r border-y-0 border-l-0 border-white/10 overflow-hidden",
      "flex flex-col items-center pt-8 pb-4 gap-2 shrink-0 transition-all duration-500 group/sidebar",
      activeTheme.bgGradient,
      activeTheme.border,
      activeTheme.shadow,
      className
    )}>
      {/* AMBIENT BACKGROUND GLOW LIGHT (PageHeader Material) */}
      <div className={cn("absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60 group-hover/sidebar:opacity-90", activeTheme.glow)} />
      <div className="absolute -bottom-20 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      {/* App Icon / Hub Indicator */}
      <div className="flex flex-col items-center shrink-0 mt-1 mb-2 group/brand cursor-pointer relative z-10 w-full" title={portalName}>
        <div className={cn(
          "w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-500 group-hover/brand:scale-105",
          activeTheme.brandBadge
        )}>
          <div className="scale-110 text-white transition-transform duration-500">
            {portalIcon}
          </div>
        </div>
      </div>

      <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent shrink-0 my-1 relative z-10" />

      {/* Portal Content (Nav Items) */}
      <div className={cn("flex flex-col gap-2.5 shrink-0 items-center w-full px-2 flex-grow mt-1 relative z-10", textClass)}>
        {children}
      </div>

      <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent shrink-0 my-1 relative z-10 mt-auto" />
      
      {/* Bottom Actions - Strategic High-Contrast White Buttons */}
      <div className="flex flex-col gap-2.5 w-full px-2 items-center mt-1 mb-1 relative z-10">
        <button 
          onClick={cycleLanguage}
          className="w-11 h-11 flex flex-col items-center justify-center bg-white hover:bg-slate-100 border border-white/30 transition-all shrink-0 rounded-xl active:scale-95 group shadow-md shadow-black/20"
          title="Cycle Language (EN/FR/AR)"
        >
          <Languages className="w-4 h-4 text-slate-900 group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-mono font-black tracking-widest uppercase text-slate-900 -mt-0.5">{language}</span>
        </button>

        <button 
          onClick={toggleTheme}
          className="w-11 h-11 flex items-center justify-center bg-white hover:bg-slate-100 border border-white/30 transition-all shrink-0 rounded-xl active:scale-95 group shadow-md shadow-black/20"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-45 transition-all duration-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700 group-hover:-rotate-12 transition-all duration-500" />
          )}
        </button>

        <button 
          onClick={() => logout()}
          className="w-11 h-11 flex items-center justify-center bg-white hover:bg-rose-50 border border-white/30 transition-all shrink-0 rounded-xl group active:scale-95 shadow-md shadow-black/20"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-rose-600 group-hover:text-rose-700 group-hover:-translate-x-0.5 transition-all" />
        </button>
      </div>

    </aside>
  );
}



