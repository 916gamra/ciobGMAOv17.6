import React from 'react';
import { cn } from '@/shared/utils';
import { LucideIcon, Boxes } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  color?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = Boxes,
  title,
  description,
  color = 'slate',
  className,
  action
}: EmptyStateProps) {
  const colorMap = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  };

  return (
    <div className={cn("p-8 md:p-12 flex flex-col items-center justify-center text-center w-full h-full my-auto", className)}>
      <div className={cn(
        "w-16 h-16 rounded-3xl border flex items-center justify-center mb-4 shadow-lg transition-all duration-500 animate-pulse",
        colorMap[color]
      )}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-400 max-w-md leading-relaxed font-mono">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6 flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
