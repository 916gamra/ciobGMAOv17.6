import React from 'react';
import { cn } from '@/shared/utils';

interface BadgePillProps {
  label?: string;
  children?: React.ReactNode;
  color?: 'cyan' | 'indigo' | 'fuchsia' | 'emerald' | 'amber' | 'rose' | 'orange' | 'purple' | 'slate';
  pulse?: boolean;
  icon?: React.ReactNode;
  mono?: boolean;
  className?: string;
}

export function BadgePill({
  label,
  children,
  color = 'cyan',
  pulse = false,
  icon,
  mono = true,
  className
}: BadgePillProps) {
  const colorStyles = {
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    slate: 'bg-white/5 border-white/10 text-slate-300',
  };

  const dotColors = {
    cyan: 'bg-cyan-400',
    indigo: 'bg-indigo-400',
    fuchsia: 'bg-fuchsia-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    orange: 'bg-orange-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-400',
  };

  return (
    <span className={cn(
      "text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 uppercase tracking-wider",
      mono && "font-mono",
      colorStyles[color],
      className
    )}>
      {pulse && <span className={cn("w-1.5 h-1.5 rounded-full animate-ping", dotColors[color])} />}
      {icon}
      <span>{children || label}</span>
    </span>
  );
}
