import React from 'react';
import { cn } from '@/shared/utils';

interface StatCompactProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  className?: string;
}

export function StatCompact({
  icon,
  label,
  value,
  valueColor = "text-white",
  className
}: StatCompactProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 bg-[#0a0a0f]/70 backdrop-blur-xl border border-white/10 rounded-xl hover:border-white/20 hover:bg-[#0a0a0f]/90 transition-all shadow-md group shrink-0",
        className
      )}
    >
      <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 truncate">{label}</span>
        <span className={cn("text-sm font-extrabold font-mono text-white -mt-0.5 tracking-tight", valueColor)}>{value}</span>
      </div>
    </div>
  );
}
