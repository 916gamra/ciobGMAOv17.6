import React from 'react';
import { cn } from '@/shared/utils';

export interface HeaderBentoCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  valueUnit?: string;
  icon?: React.ReactNode;
  color?: 'amber' | 'cyan' | 'blue' | 'yellow' | 'emerald' | 'orange' | 'purple' | 'rose' | 'slate';
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

const COLOR_MAPS = {
  amber: {
    bgIcon: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    activeBg: 'bg-amber-500/15 border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.25)]',
    valueColor: 'text-amber-400',
  },
  cyan: {
    bgIcon: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    activeBg: 'bg-cyan-500/15 border-cyan-500/40 shadow-[0_4px_20px_rgba(6,182,212,0.25)]',
    valueColor: 'text-cyan-400',
  },
  blue: {
    bgIcon: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    activeBg: 'bg-blue-500/15 border-blue-500/40 shadow-[0_4px_20px_rgba(59,130,246,0.25)]',
    valueColor: 'text-blue-400',
  },
  yellow: {
    bgIcon: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    activeBg: 'bg-yellow-500/15 border-yellow-500/40 shadow-[0_4px_20px_rgba(234,179,8,0.25)]',
    valueColor: 'text-yellow-400',
  },
  emerald: {
    bgIcon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    activeBg: 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.25)]',
    valueColor: 'text-emerald-400',
  },
  orange: {
    bgIcon: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    activeBg: 'bg-orange-500/15 border-orange-500/40 shadow-[0_4px_20px_rgba(249,115,22,0.25)]',
    valueColor: 'text-orange-400',
  },
  purple: {
    bgIcon: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    activeBg: 'bg-purple-500/15 border-purple-500/40 shadow-[0_4px_20px_rgba(168,85,247,0.25)]',
    valueColor: 'text-purple-400',
  },
  rose: {
    bgIcon: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    activeBg: 'bg-rose-500/15 border-rose-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.25)]',
    valueColor: 'text-rose-400',
  },
  slate: {
    bgIcon: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
    activeBg: 'bg-white/10 border-white/30 shadow-[0_4px_20px_rgba(255,255,255,0.1)]',
    valueColor: 'text-slate-200',
  },
};

export function HeaderBentoCard({
  title,
  subtitle,
  value,
  valueUnit,
  icon,
  color = 'cyan',
  isActive = false,
  onClick,
  className,
}: HeaderBentoCardProps) {
  const theme = COLOR_MAPS[color] || COLOR_MAPS.cyan;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3.5 rounded-2xl border transition-all duration-300 relative group overflow-hidden select-none backdrop-blur-md flex flex-col justify-between",
        onClick ? "cursor-pointer" : "cursor-default",
        isActive
          ? `${theme.activeBg} scale-[1.02]`
          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        {icon && (
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border", theme.bgIcon)}>
            {icon}
          </div>
        )}
        <div className="text-end min-w-0">
          <span className="text-xs font-mono font-extrabold text-white tracking-wider block truncate">
            {value}
            {valueUnit && (
              <span className="text-[10px] text-slate-400 font-sans font-normal ms-1">
                {valueUnit}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col text-start min-w-0">
        <span className="text-xs font-bold text-white leading-tight truncate">{title}</span>
        {subtitle && (
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
