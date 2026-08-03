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
    <aside className={cn("w-[84px] bg-[#050505] border-r border-white/10 flex flex-col items-center py-6 gap-2 shrink-0 z-40 overflow-y-auto custom-scrollbar shadow-[20px_0_40px_rgba(0,0,0,0.5)] fixed top-0 left-0 bottom-0", className)}>
      
      {/* App Icon / Hub Indicator */}
      <div className="flex flex-col items-center shrink-0 mt-2 mb-6 group cursor-pointer relative z-10 w-full" title={portalName}>
         <div className={cn("w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-500 shadow-lg", colorClass, borderClass)}>
            <div className="scale-125 text-white/90 group-hover:scale-150 transition-transform duration-500">
               {portalIcon}
            </div>
         </div>
      </div>

      <div className="w-8 h-[1px] bg-white/10 shrink-0 my-2 relative z-10" />

      {/* Portal Content (Nav Items) */}
      <div className={cn("flex flex-col gap-3 shrink-0 items-center w-full px-3 flex-grow mt-2", textClass)}>
         {children}
      </div>

      <div className="w-8 h-[1px] bg-white/10 shrink-0 my-2 relative z-10 mt-auto" />
      
      {/* Bottom Actions */}
      <div className="flex flex-col gap-3 w-full px-3 items-center mt-2 mb-2 relative z-10">
        <button 
          onClick={cycleLanguage}
          className="w-12 h-12 flex flex-col items-center justify-center text-slate-500 hover:text-white bg-transparent hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all shrink-0 rounded-xl active:scale-95 group"
          title="Cycle Language (EN/FR/AR)"
        >
          <Languages className="w-4 h-4 mb-1 text-slate-400 group-hover:text-white transition-colors" />
          <span className="text-[8px] font-mono tracking-widest uppercase">{language}</span>
        </button>

        <button 
          onClick={toggleTheme}
          className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white bg-transparent hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all shrink-0 rounded-xl active:scale-95 group"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-500" />}
        </button>

        <button 
          onClick={() => logout()}
          className="w-12 h-12 mt-4 flex items-center justify-center text-rose-500/50 hover:text-rose-400 bg-transparent hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shrink-0 rounded-xl group active:scale-95"
          title="Logout"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

    </aside>
  );
}

