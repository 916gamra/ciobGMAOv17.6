import React from 'react';
import { Cpu, Box, Factory, Layers, ShieldCheck, Wrench, PieChart, Sparkles } from 'lucide-react';
import { cn } from '@/shared/utils';

export type NexusThemeColor = 'indigo' | 'cyan' | 'emerald' | 'orange' | 'fuchsia' | 'amber' | 'blue' | 'rose';

interface NexusIconLoaderProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  subtitle?: string;
  themeColor?: NexusThemeColor;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  className?: string;
}

const THEME_STYLES: Record<NexusThemeColor, {
  glow: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  ringColor: string;
  badgeBg: string;
}> = {
  indigo: {
    glow: 'bg-indigo-500/25',
    iconBg: 'bg-gradient-to-br from-indigo-500/20 via-indigo-950/40 to-[#0a0a0f]',
    iconBorder: 'border-indigo-500/30',
    iconColor: 'text-indigo-300',
    ringColor: 'border-indigo-400/30',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  },
  cyan: {
    glow: 'bg-cyan-500/25',
    iconBg: 'bg-gradient-to-br from-cyan-500/20 via-cyan-950/40 to-[#0a0a0f]',
    iconBorder: 'border-cyan-500/30',
    iconColor: 'text-cyan-300',
    ringColor: 'border-cyan-400/30',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  },
  emerald: {
    glow: 'bg-emerald-500/25',
    iconBg: 'bg-gradient-to-br from-emerald-500/20 via-emerald-950/40 to-[#0a0a0f]',
    iconBorder: 'border-emerald-500/30',
    iconColor: 'text-emerald-300',
    ringColor: 'border-emerald-400/30',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  },
  orange: {
    glow: 'bg-orange-500/25',
    iconBg: 'bg-gradient-to-br from-orange-500/20 via-orange-950/40 to-[#0a0a0f]',
    iconBorder: 'border-orange-500/30',
    iconColor: 'text-orange-300',
    ringColor: 'border-orange-400/30',
    badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  },
  fuchsia: {
    glow: 'bg-fuchsia-500/25',
    iconBg: 'bg-gradient-to-br from-fuchsia-500/20 via-fuchsia-950/40 to-[#0a0a0f]',
    iconBorder: 'border-fuchsia-500/30',
    iconColor: 'text-fuchsia-300',
    ringColor: 'border-fuchsia-400/30',
    badgeBg: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
  },
  amber: {
    glow: 'bg-amber-500/25',
    iconBg: 'bg-gradient-to-br from-amber-500/20 via-amber-950/40 to-[#0a0a0f]',
    iconBorder: 'border-amber-500/30',
    iconColor: 'text-amber-300',
    ringColor: 'border-amber-400/30',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  },
  blue: {
    glow: 'bg-blue-500/25',
    iconBg: 'bg-gradient-to-br from-blue-500/20 via-blue-950/40 to-[#0a0a0f]',
    iconBorder: 'border-blue-500/30',
    iconColor: 'text-blue-300',
    ringColor: 'border-blue-400/30',
    badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  },
  rose: {
    glow: 'bg-rose-500/25',
    iconBg: 'bg-gradient-to-br from-rose-500/20 via-rose-950/40 to-[#0a0a0f]',
    iconBorder: 'border-rose-500/30',
    iconColor: 'text-rose-300',
    ringColor: 'border-rose-400/30',
    badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  },
};

export function NexusIconLoader({
  icon: Icon = Cpu,
  title,
  subtitle,
  themeColor = 'indigo',
  size = 'md',
  className,
}: NexusIconLoaderProps) {
  const theme = THEME_STYLES[themeColor] || THEME_STYLES.indigo;

  if (size === 'sm') {
    return (
      <div className={cn("inline-flex items-center gap-2.5", className)}>
        <div className="relative flex items-center justify-center">
          <div className={cn("absolute inset-0 rounded-lg blur-md", theme.glow)} />
          <div className={cn("relative p-1.5 rounded-lg border backdrop-blur-md animate-pulse", theme.iconBg, theme.iconBorder, theme.iconColor)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        {title && (
          <span className="text-xs font-mono font-medium text-slate-300 tracking-wider">
            {title}
          </span>
        )}
      </div>
    );
  }

  const isFullscreen = size === 'fullscreen';

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 select-none animate-in fade-in duration-300",
        isFullscreen ? "fixed inset-0 z-50 bg-[#060609]/90 backdrop-blur-2xl" : "w-full min-h-[360px] flex-1",
        className
      )}
    >
      {/* Iconic Glass Capsule */}
      <div className="relative mb-5 group">
        {/* Soft Ambient Glow */}
        <div className={cn("absolute -inset-4 rounded-full blur-2xl opacity-70 animate-pulse pointer-events-none transition-all duration-700", theme.glow)} />
        
        {/* Subtle Pulse Radar Ring */}
        <div className={cn("absolute -inset-2 rounded-3xl border opacity-30 animate-ping pointer-events-none", theme.ringColor)} />

        {/* Central Icon Pod */}
        <div className={cn(
          "relative flex items-center justify-center rounded-3xl border shadow-2xl backdrop-blur-xl transition-transform duration-500",
          size === 'lg' ? "w-20 h-20 p-5" : "w-16 h-16 p-4",
          theme.iconBg,
          theme.iconBorder,
          theme.iconColor
        )}>
          <Icon className={cn(
            "transition-all duration-700 animate-pulse",
            size === 'lg' ? "w-10 h-10" : "w-8 h-8"
          )} />
        </div>
      </div>

      {/* Title & Monospace Status Text */}
      <div className="space-y-1.5 max-w-sm">
        <h4 className="text-sm font-extrabold text-white tracking-wide">
          {title || 'جاري معالجة البيانات الصناعية...'}
        </h4>
        {subtitle && (
          <p className="text-xs font-mono text-slate-400 tracking-wider">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
