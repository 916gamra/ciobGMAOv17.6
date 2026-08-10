import React from 'react';
import { motion, Variants } from 'motion/react';
import { cn } from '@/shared/utils';

export const pageItemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badgeText?: string;
  badgeColor?: 'cyan' | 'indigo' | 'fuchsia' | 'emerald' | 'amber' | 'rose' | 'orange' | 'purple' | 'blue';
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  badgeText,
  badgeColor = 'cyan',
  actions,
  children,
  className
}: PageHeaderProps) {
  const colorMap = {
    cyan: {
      bg: 'bg-gradient-to-r from-cyan-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/80',
      border: 'border-cyan-500/30',
      glow: 'bg-cyan-500/15',
      shadow: 'shadow-[0_10px_30px_rgba(6,182,212,0.12)]',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      iconContainer: 'bg-gradient-to-br from-cyan-500/20 to-cyan-700/30 border-cyan-400/40 shadow-cyan-900/30',
    },
    indigo: {
      bg: 'bg-gradient-to-r from-indigo-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/80',
      border: 'border-indigo-500/30',
      glow: 'bg-indigo-500/15',
      shadow: 'shadow-[0_10px_30px_rgba(99,102,241,0.12)]',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      iconContainer: 'bg-gradient-to-br from-indigo-500/20 to-indigo-700/30 border-indigo-400/40 shadow-indigo-900/30',
    },
    fuchsia: {
      bg: 'bg-gradient-to-r from-fuchsia-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/80',
      border: 'border-fuchsia-500/30',
      glow: 'bg-fuchsia-500/15',
      shadow: 'shadow-[0_10px_30px_rgba(217,70,239,0.12)]',
      badge: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
      iconContainer: 'bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-700/30 border-fuchsia-400/40 shadow-fuchsia-900/30',
    },
    emerald: {
      bg: 'bg-gradient-to-r from-emerald-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/80',
      border: 'border-emerald-500/30',
      glow: 'bg-emerald-500/15',
      shadow: 'shadow-[0_10px_30px_rgba(16,185,129,0.12)]',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      iconContainer: 'bg-gradient-to-br from-emerald-500/20 to-emerald-700/30 border-emerald-400/40 shadow-emerald-900/30',
    },
    amber: {
      bg: 'bg-gradient-to-r from-amber-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/80',
      border: 'border-amber-500/30',
      glow: 'bg-amber-500/15',
      shadow: 'shadow-[0_10px_30px_rgba(245,158,11,0.12)]',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      iconContainer: 'bg-gradient-to-br from-amber-500/20 to-amber-700/30 border-amber-400/40 shadow-amber-900/30',
    },
    rose: {
      bg: 'bg-gradient-to-r from-rose-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/80',
      border: 'border-rose-500/30',
      glow: 'bg-rose-500/15',
      shadow: 'shadow-[0_10px_30px_rgba(244,63,94,0.12)]',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      iconContainer: 'bg-gradient-to-br from-rose-500/20 to-rose-700/30 border-rose-400/40 shadow-rose-900/30',
    },
    orange: {
      bg: 'bg-gradient-to-r from-orange-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/80',
      border: 'border-orange-500/30',
      glow: 'bg-orange-500/15',
      shadow: 'shadow-[0_10px_30px_rgba(249,115,22,0.12)]',
      badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      iconContainer: 'bg-gradient-to-br from-orange-500/20 to-orange-700/30 border-orange-400/40 shadow-orange-900/30',
    },
    purple: {
      bg: 'bg-gradient-to-r from-purple-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/80',
      border: 'border-purple-500/30',
      glow: 'bg-purple-500/15',
      shadow: 'shadow-[0_10px_30px_rgba(168,85,247,0.12)]',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      iconContainer: 'bg-gradient-to-br from-purple-500/20 to-purple-700/30 border-purple-400/40 shadow-purple-900/30',
    },
    blue: {
      bg: 'bg-gradient-to-r from-blue-950/60 via-[#0a0a0f]/90 to-[#0a0a0f]/80',
      border: 'border-blue-500/30',
      glow: 'bg-blue-500/15',
      shadow: 'shadow-[0_10px_30px_rgba(59,130,246,0.12)]',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      iconContainer: 'bg-gradient-to-br from-blue-500/20 to-blue-700/30 border-blue-400/40 shadow-blue-900/30',
    },
  };

  const activeTheme = colorMap[badgeColor] || colorMap.cyan;

  return (
    <motion.header 
      variants={pageItemVariants} 
      className={cn(
        "relative overflow-hidden flex flex-col mb-6 shrink-0 z-10", 
        "p-6 md:p-7 backdrop-blur-xl rounded-3xl border shadow-xl transition-all duration-300",
        activeTheme.bg,
        activeTheme.border,
        activeTheme.shadow,
        className
      )}
    >
      {/* AMBIENT BACKGROUND GLOW LIGHT */}
      <div className={cn("absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-500", activeTheme.glow)} />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-start md:items-center gap-3.5 relative z-10 text-start">
          {icon && (
            <div className="shrink-0 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="text-start min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight text-start">
                {title}
              </h1>
              {badgeText && (
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm", activeTheme.badge)}>
                  {badgeText}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-slate-300/80 text-xs md:text-sm font-medium mt-1.5 max-w-2xl leading-relaxed text-start">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10 mt-2 md:mt-0">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
          {children}
        </div>
      )}
    </motion.header>
  );
}
