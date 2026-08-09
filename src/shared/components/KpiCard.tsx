import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { pageItemVariants } from './PageContainer';
import { cn } from '@/shared/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color?: 'cyan' | 'indigo' | 'fuchsia' | 'emerald' | 'amber' | 'rose' | 'orange' | 'purple';
  subText?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
  className?: string;
}

export function KpiCard({
  label,
  value,
  unit,
  icon,
  color = 'cyan',
  subText,
  trend,
  trendType = 'positive',
  onClick,
  className
}: KpiCardProps) {
  const colorMap = {
    cyan: {
      borderHover: 'hover:border-cyan-500/30',
      gradient: 'from-cyan-500/0 via-cyan-500/50 to-cyan-500/0',
      iconBox: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] from-cyan-500/20',
      text: 'text-cyan-400'
    },
    indigo: {
      borderHover: 'hover:border-indigo-500/30',
      gradient: 'from-indigo-500/0 via-indigo-500/50 to-indigo-500/0',
      iconBox: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] from-indigo-500/20',
      text: 'text-indigo-400'
    },
    fuchsia: {
      borderHover: 'hover:border-fuchsia-500/30',
      gradient: 'from-fuchsia-500/0 via-fuchsia-500/50 to-fuchsia-500/0',
      iconBox: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.15)] from-fuchsia-500/20',
      text: 'text-fuchsia-400'
    },
    emerald: {
      borderHover: 'hover:border-emerald-500/30',
      gradient: 'from-emerald-500/0 via-emerald-500/50 to-emerald-500/0',
      iconBox: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] from-emerald-500/20',
      text: 'text-emerald-400'
    },
    amber: {
      borderHover: 'hover:border-amber-500/30',
      gradient: 'from-amber-500/0 via-amber-500/50 to-amber-500/0',
      iconBox: 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] from-amber-500/20',
      text: 'text-amber-400'
    },
    rose: {
      borderHover: 'hover:border-rose-500/30',
      gradient: 'from-rose-500/0 via-rose-500/50 to-rose-500/0',
      iconBox: 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)] from-rose-500/20',
      text: 'text-rose-400'
    },
    orange: {
      borderHover: 'hover:border-orange-500/30',
      gradient: 'from-orange-500/0 via-orange-500/50 to-orange-500/0',
      iconBox: 'bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] from-orange-500/20',
      text: 'text-orange-400'
    },
    purple: {
      borderHover: 'hover:border-purple-500/30',
      gradient: 'from-purple-500/0 via-purple-500/50 to-purple-500/0',
      iconBox: 'bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] from-purple-500/20',
      text: 'text-purple-400'
    },
  };

  const style = colorMap[color];

  return (
    <motion.div variants={pageItemVariants} onClick={onClick} className={cn(onClick && "cursor-pointer")}>
      <GlassCard className={cn(
        "relative overflow-hidden group transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] !p-5 border-white/5 bg-[#0a0a0f]/40 backdrop-blur-xl rounded-2xl",
        style.borderHover,
        className
      )}>
        {/* Bottom Accent Glow Line */}
        <div className={cn("absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity", style.gradient)} />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br to-transparent",
            style.iconBox
          )}>
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5 truncate">
              {label}
            </h3>

            <div className="text-2xl md:text-3xl font-black font-mono text-white flex items-baseline gap-2 tracking-tight">
              {value}
              {unit && <span className="text-xs font-sans text-slate-500 font-bold uppercase tracking-widest">{unit}</span>}
            </div>

            {(subText || trend) && (
              <div className="flex items-center gap-2 mt-1">
                {trend && (
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border",
                    trendType === 'positive' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                    trendType === 'negative' && "bg-rose-500/10 border-rose-500/20 text-rose-400",
                    trendType === 'neutral' && "bg-white/10 border-white/20 text-slate-300"
                  )}>
                    {trend}
                  </span>
                )}
                {subText && <span className="text-[10px] text-slate-400 truncate">{subText}</span>}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
