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
        "w-11 h-11 relative flex items-center justify-center transition-all duration-300 group rounded-xl active:scale-95 font-sans z-10 overflow-hidden",
        isActive 
          ? `bg-white/10 text-white border border-white/20 shadow-lg shadow-black/50 backdrop-blur-xl` 
          : `bg-transparent text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10`
      )}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none" />
      )}

      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
        className: cn(
          "w-5 h-5 transition-all duration-300 relative z-10", 
          isActive ? `scale-110 ${colorClass || 'text-cyan-400'}` : "group-hover:scale-110 opacity-75 group-hover:opacity-100"
        ) 
      })}
    </button>
  );
}

