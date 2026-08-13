import React, { ReactNode } from 'react';
import { GlassCard } from '@/shared/components/GlassCard';
import { cn } from '@/shared/utils';

interface DualPanelLabProps {
  leftTitle: string;
  leftIcon: React.ElementType;
  leftHeaderAction?: ReactNode;
  leftContent: ReactNode;
  rightContent: ReactNode;
  accentColor?: 'neutral' | 'engine';
}

export function DualPanelLab({
  leftTitle,
  leftIcon: LeftIcon,
  leftHeaderAction,
  leftContent,
  rightContent,
  accentColor = 'neutral'
}: DualPanelLabProps) {
  return (
    <div className="flex flex-col lg:flex-row-reverse gap-4 h-full min-h-0">
      
      {/* Left Panel - Master List */}
      <div className="w-full lg:w-[400px] shrink-0 flex flex-col min-h-0">
        <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl bg-slate-900/60 backdrop-blur-xl min-h-0">
          <div className="p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0 flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center border",
                accentColor === 'neutral'
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              )}>
                <LeftIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">{leftTitle}</span>
            </div>
            {leftHeaderAction}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {leftContent}
          </div>
        </GlassCard>
      </div>

      {/* Right Panel - Details/Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl bg-slate-900/60 backdrop-blur-xl min-h-0">
          {rightContent}
        </GlassCard>
      </div>
      
    </div>
  );
}
