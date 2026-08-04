import React from 'react';
import { cn } from '@/shared/utils';
import { LogOut, Sun, Moon, Languages } from 'lucide-react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useThemeStore } from '@/app/store/useThemeStore';
import { useLanguageStore } from '@/app/store/useLanguageStore';

interface PortalSidebarProps {
  portalName: string;
  portalIcon: React.ReactNode;
  colorClass: string;
  borderClass: string;
  textClass: string;
  children: React.ReactNode;
  className?: string; // Add className
}

export function PortalSidebar({ portalName, portalIcon, colorClass, borderClass, textClass, children, className }: PortalSidebarProps) {
  const logout = useAuthStore(state => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  const { language, cycleLanguage } = useLanguageStore();

  return (
    <aside className={cn("fixed top-3 left-3 bottom-3 w-[72px] md:w-[76px] my-auto bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col items-center py-5 gap-2 shrink-0 z-40 overflow-y-auto custom-scrollbar transition-all duration-300", className)}>
      
      {/* App Icon / Hub Indicator */}
      <div className="flex flex-col items-center shrink-0 mt-1 mb-4 group cursor-pointer relative z-10 w-full" title={portalName}>
         <div className={cn("w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-500 shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] group-hover:scale-105", colorClass, borderClass)}>
            <div className="scale-110 text-white/90 group-hover:scale-125 transition-transform duration-500">
               {portalIcon}
            </div>
         </div>
      </div>

      <div className="w-8 h-[1px] bg-white/10 shrink-0 my-1 relative z-10" />

      {/* Portal Content (Nav Items) */}
      <div className={cn("flex flex-col gap-3 shrink-0 items-center w-full px-2 flex-grow mt-2", textClass)}>
         {children}
      </div>

      <div className="w-8 h-[1px] bg-white/10 shrink-0 my-1 relative z-10 mt-auto" />
      
      {/* Bottom Actions */}
      <div className="flex flex-col gap-2 w-full px-2 items-center mt-2 mb-1 relative z-10">
        <button 
          onClick={cycleLanguage}
          className="w-11 h-11 flex flex-col items-center justify-center text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all shrink-0 rounded-2xl active:scale-95 group"
          title="Cycle Language (EN/FR/AR)"
        >
          <Languages className="w-4 h-4 mb-0.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          <span className="text-[8px] font-mono font-bold tracking-widest uppercase text-cyan-400">{language}</span>
        </button>

        <button 
          onClick={toggleTheme}
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all shrink-0 rounded-2xl active:scale-95 group"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-500" /> : <Moon className="w-4 h-4 text-indigo-400 group-hover:-rotate-12 transition-transform duration-500" />}
        </button>

        <button 
          onClick={() => logout()}
          className="w-11 h-11 mt-1 flex items-center justify-center text-rose-400/70 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all shrink-0 rounded-2xl group active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
          title="Logout"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

    </aside>
  );
}

