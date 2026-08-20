import React from 'react';
import { cn } from '@/shared/utils';
import type { HeaderTheme } from './types';
import type { PortalType } from '@/app/store';

interface PortalHeaderChassisProps {
  activePortal: PortalType;
  headerTheme: HeaderTheme;
  slantStart: number;
  slantEnd: number;
  children: React.ReactNode;
}

export function PortalHeaderChassis({
  activePortal,
  headerTheme,
  slantStart,
  slantEnd,
  children,
}: PortalHeaderChassisProps) {
  return (
    <div className="relative w-full">
      <header className="relative h-[54px] flex items-center pr-4 shrink-0 w-full overflow-x-auto custom-scrollbar z-[40]">
        {/* Soft Ambient Inner Glow to fully illuminate the left header junction */}
        <div 
          className={cn(
            "absolute -left-10 top-0 bottom-0 w-64 opacity-40 blur-2xl pointer-events-none transition-colors duration-500 z-10",
            activePortal === 'CORRECTIVE' && "bg-orange-500/30",
            activePortal === 'PDR' && "bg-cyan-500/30",
            activePortal === 'PREVENTIVE' && "bg-emerald-500/30",
            activePortal === 'FACTORY' && "bg-indigo-500/30",
            activePortal === 'ANALYTICS' && "bg-fuchsia-500/30",
            activePortal === 'ORGANIZATION' && "bg-amber-500/30",
            activePortal === 'SETTINGS' && "bg-slate-500/30"
          )} 
        />

        {/* Seamlessly Molded Glass Background utilizing CSS Clip-Path */}
        <div 
          className={cn("absolute inset-0 z-0 transition-all duration-300 backdrop-blur-2xl", headerTheme.bg)}
          style={{
            clipPath: `polygon(0px 0px, ${slantStart}px 0px, ${slantEnd}px 46px, 100% 46px, 100% 54px, 0px 54px)`,
            minWidth: '100%',
            height: '54px'
          }}
        />

        {/* Flat Bottom Border Line */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none z-20 transition-colors duration-300",
            headerTheme.bottomBorderLine
          )} 
        />

        {/* Inner Tabs Content */}
        {children}
      </header>

      {/* Curved Junction Fillet connecting the top header to the left sidebar seamlessly */}
      <div className="absolute top-full left-0 w-7 h-7 md:w-8 md:h-8 pointer-events-none z-[120] -mt-[1px]">
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          <path d="M 0 0 L 32 0 A 32 32 0 0 0 0 32 Z" fill="rgba(10, 10, 15, 0.95)" className="transition-colors duration-300" />
          <path d="M 0 0 L 32 0 A 32 32 0 0 0 0 32 Z" className={cn("transition-colors duration-300", headerTheme.tint)} fill="currentColor" />
          <path d="M 32 0 A 32 32 0 0 0 0 32" fill="none" className={cn("transition-colors duration-300", headerTheme.stroke)} stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}
