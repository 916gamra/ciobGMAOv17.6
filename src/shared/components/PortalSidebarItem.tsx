import React from 'react';
import { cn } from '@/shared/utils';

interface PortalSidebarItemProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  title?: string;
  colorClass?: string;
}

/**
 * Shared sidebar item component for all portals.
 * Windows 11 Fluent Design style.
 */
export function PortalSidebarItem({ icon, isActive, onClick, title, colorClass }: PortalSidebarItemProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "w-12 h-12 relative flex items-center justify-center transition-all duration-300 group rounded-xl active:scale-95 font-sans z-10 overflow-hidden",
        isActive 
          ? `bg-white/[0.04] ${colorClass || 'text-current'} border border-white/10` 
          : `bg-transparent text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/10`
      )}
    >
      {isActive && (
        <div className={cn("absolute inset-0 bg-gradient-to-r from-current/5 to-transparent pointer-events-none")} />
      )}
      
      {/* Fluent Active Indicator Pill */}
      <div 
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-current transition-all duration-500 ease-out shadow-[0_0_8px_currentColor]",
          isActive ? "h-6 opacity-100" : "h-0 opacity-0 group-hover:h-3 group-hover:opacity-30 group-hover:shadow-none dark:group-hover:bg-white/50"
        )} 
      />

      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
        className: cn(
          "w-5 h-5 transition-all duration-300 relative z-10", 
          isActive ? "scale-110 drop-shadow-[0_0_8px_currentColor]" : "group-hover:scale-110 opacity-80 group-hover:opacity-100"
        ) 
      })}
    </button>
  );
}

