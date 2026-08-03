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
  badgeColor?: 'cyan' | 'indigo' | 'fuchsia' | 'emerald' | 'amber' | 'rose' | 'orange' | 'purple';
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  badgeText,
  badgeColor = 'cyan',
  actions,
  className
}: PageHeaderProps) {
  const badgeStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    fuchsia: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <motion.header 
      variants={pageItemVariants} 
      className={cn(
        "flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 shrink-0 relative z-10", 
        "p-6 bg-[#0f0f12] border border-[#1a1a1f] rounded-2xl shadow-2xl",
        className
      )}
    >
      <div>
        <h1 className="text-[32px] font-bold text-slate-100 tracking-tight mb-2 flex items-center gap-4 uppercase">
          {icon && (
            <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
              {icon}
            </div>
          )}
          {title}
          {badgeText && (
            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ml-1", badgeStyles[badgeColor])}>
              {badgeText}
            </span>
          )}
        </h1>
        {subtitle && (
          <p className="text-slate-400 text-lg font-medium opacity-80 font-sans max-w-2xl mt-2">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0 mt-2 md:mt-0 [&_.titan-button]:!p-3">
          {actions}
        </div>
      )}
    </motion.header>
  );
}
