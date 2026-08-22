import React from 'react';
import { LucideIcon, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/utils';

import { FrostCard } from '@/shared/components/FrostCard';

export type EngineTheme = 'amber' | 'cyan' | 'emerald' | 'indigo' | 'orange' | 'violet' | 'rose';

export interface CardMetric {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  highlight?: boolean;
}

export interface CardAction {
  label?: string;
  icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'ghost' | 'danger';
  title?: string;
  disabled?: boolean;
  id?: string;
}

export interface LabEntityCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  code?: string;
  icon?: LucideIcon;
  discipline?: 'mechanical' | 'hydraulic' | 'electrical' | 'electronic' | 'pneumatic' | 'general';
  engineTheme?: EngineTheme;
  statusBadge?: {
    label: string;
    variant?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';
  };
  metrics?: CardMetric[];
  tag?: string;
  footerInfo?: React.ReactNode;
  actions?: CardAction[];
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  className?: string;
  dir?: 'rtl' | 'ltr';
}

const themeColorMap: Record<EngineTheme, {
  iconBg: string;
  iconBorder: string;
  iconText: string;
  hoverBorder: string;
  ambientGlow: string;
}> = {
  amber: {
    iconBg: 'bg-amber-500/10',
    iconBorder: 'border-amber-500/20',
    iconText: 'text-amber-400',
    hoverBorder: 'hover:border-amber-500/40',
    ambientGlow: 'group-hover:bg-amber-500/10',
  },
  cyan: {
    iconBg: 'bg-cyan-500/10',
    iconBorder: 'border-cyan-500/20',
    iconText: 'text-cyan-400',
    hoverBorder: 'hover:border-cyan-500/40',
    ambientGlow: 'group-hover:bg-cyan-500/10',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/20',
    iconText: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/40',
    ambientGlow: 'group-hover:bg-emerald-500/10',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10',
    iconBorder: 'border-indigo-500/20',
    iconText: 'text-indigo-400',
    hoverBorder: 'hover:border-indigo-500/40',
    ambientGlow: 'group-hover:bg-indigo-500/10',
  },
  orange: {
    iconBg: 'bg-orange-500/10',
    iconBorder: 'border-orange-500/20',
    iconText: 'text-orange-400',
    hoverBorder: 'hover:border-orange-500/40',
    ambientGlow: 'group-hover:bg-orange-500/10',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    iconBorder: 'border-violet-500/20',
    iconText: 'text-violet-400',
    hoverBorder: 'hover:border-violet-500/40',
    ambientGlow: 'group-hover:bg-violet-500/10',
  },
  rose: {
    iconBg: 'bg-rose-500/10',
    iconBorder: 'border-rose-500/20',
    iconText: 'text-rose-400',
    hoverBorder: 'hover:border-rose-500/40',
    ambientGlow: 'group-hover:bg-rose-500/10',
  },
};

const statusBadgeStyles = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  slate: 'bg-slate-800 text-slate-300 border-white/10',
};

export function LabEntityCard({
  id,
  title,
  subtitle,
  code,
  icon: Icon,
  engineTheme = 'amber',
  statusBadge,
  metrics = [],
  tag,
  footerInfo,
  actions,
  onEdit,
  onDelete,
  onClick,
  isSelected = false,
  className,
}: LabEntityCardProps) {
  const theme = themeColorMap[engineTheme] || themeColorMap.amber;

  return (
    <FrostCard
      id={id}
      interactive={!!onClick}
      hoverEffect={!isSelected}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between text-start overflow-hidden p-0",
        isSelected 
          ? "border-white/40 bg-white/[0.08] shadow-[0_0_25px_rgba(255,255,255,0.06)]"
          : "",
        className
      )}
    >
      {/* Ambient background glow on subtle hover */}
      <div 
        className={cn(
          "absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-16 rounded-full blur-2xl pointer-events-none transition-all duration-300",
          theme.ambientGlow
        )} 
      />

      {/* Main Content Area */}
      <div className="p-5 relative z-10 flex flex-col flex-1 space-y-4">
        
        {/* Top Header Row: Icon + Code / Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={cn(
                "p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105",
                theme.iconBg,
                theme.iconBorder,
                theme.iconText
              )}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-sm font-extrabold text-white group-hover:text-white transition-colors truncate">
                {title}
              </h4>
              {subtitle && (
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {code && (
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-white tracking-wider">
                {code}
              </span>
            )}
            {statusBadge && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wide uppercase",
                statusBadgeStyles[statusBadge.variant || 'slate']
              )}>
                {statusBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Tag / Category strip if provided */}
        {tag && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-slate-300 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="font-medium">{tag}</span>
          </div>
        )}

        {/* Key-Value Metrics Grid */}
        {metrics.length > 0 && (
          <div className={cn(
            "grid gap-2 pt-1",
            metrics.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}>
            {metrics.map((metric, idx) => {
              const MetricIcon = metric.icon;
              return (
                <div 
                  key={idx}
                  className={cn(
                    "flex flex-col justify-center p-2.5 rounded-xl border transition-colors",
                    metric.highlight 
                      ? "bg-white/[0.05] border-white/15 text-white" 
                      : "bg-white/[0.02] border-white/5 text-slate-300"
                  )}
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    {MetricIcon && <MetricIcon className="w-3 h-3 text-slate-400" />}
                    {metric.label}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-white mt-1 truncate">
                    {metric.value}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions & Info Row */}
      {(footerInfo || actions?.length || onEdit || onDelete) && (
        <div className="relative z-10 px-5 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-2 mt-auto">
          {/* Left Footer Info / Metadata */}
          <div className="text-[11px] text-slate-400 font-medium truncate flex-1">
            {footerInfo}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
            {actions?.map((act, idx) => {
              const ActionIcon = act.icon;
              return (
                <button
                  key={idx}
                  id={act.id}
                  type="button"
                  onClick={act.onClick}
                  disabled={act.disabled}
                  title={act.title || act.label}
                  className={cn(
                    "p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                    act.variant === 'primary' && "bg-white text-slate-950 hover:bg-slate-200 shadow-md font-extrabold px-3",
                    act.variant === 'danger' && "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 px-2.5",
                    (!act.variant || act.variant === 'ghost') && "bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 px-2.5"
                  )}
                >
                  <ActionIcon className="w-3.5 h-3.5" />
                  {act.label && <span>{act.label}</span>}
                </button>
              );
            })}

            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                title="تعديل"
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                title="حذف"
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onClick && !actions?.length && !onEdit && !onDelete && (
              <div className="p-1 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all">
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </div>
            )}
          </div>
        </div>
      )}
    </FrostCard>
  );
}
