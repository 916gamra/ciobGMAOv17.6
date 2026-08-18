import React from 'react';
import { Package, Shield, Settings, Factory, BarChart3, Users, Wrench } from 'lucide-react';
import type { PortalType } from '@/app/store';

export interface HeaderTheme {
  bg: string;
  bottomBorderLine: string;
  tint: string;
  stroke: string;
}

export interface TabSvgTheme {
  activeBg: string;
  inactiveBg: string;
  activeBorder: string;
  inactiveBorder: string;
  dropShadow: string;
}

export interface PortalColor {
  dot: string;
  border: string;
  text: string;
}

export const PORTAL_ICONS: Record<PortalType, React.ElementType> = {
  HOME: Package,
  PDR: Package,
  PREVENTIVE: Shield,
  CORRECTIVE: Wrench,
  ANALYTICS: BarChart3,
  FACTORY: Factory,
  ORGANIZATION: Users,
  SETTINGS: Settings,
};

export const PORTAL_COLORS: Record<string, PortalColor> = {
  PDR: { dot: 'bg-cyan-400', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  PREVENTIVE: { dot: 'bg-emerald-400', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  CORRECTIVE: { dot: 'bg-orange-400', border: 'border-orange-500/30', text: 'text-orange-400' },
  ANALYTICS: { dot: 'bg-fuchsia-400', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400' },
  FACTORY: { dot: 'bg-indigo-400', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  ORGANIZATION: { dot: 'bg-amber-400', border: 'border-amber-500/30', text: 'text-amber-400' },
  SETTINGS: { dot: 'bg-slate-400', border: 'border-slate-500/30', text: 'text-slate-400' },
};

export const HEADER_THEMES: Record<string, HeaderTheme> = {
  PDR: { 
    bg: 'bg-[#0a0a0f]/40 to-[#0a0a0f]/95 bg-gradient-to-r from-cyan-950/80', 
    bottomBorderLine: 'bg-cyan-500/30', 
    tint: 'text-cyan-500/10', 
    stroke: 'text-cyan-500/40' 
  },
  PREVENTIVE: { 
    bg: 'bg-[#0a0a0f]/40 to-[#0a0a0f]/95 bg-gradient-to-r from-emerald-950/80', 
    bottomBorderLine: 'bg-emerald-500/30', 
    tint: 'text-emerald-500/10', 
    stroke: 'text-emerald-500/40' 
  },
  CORRECTIVE: { 
    bg: 'bg-[#0a0a0f]/40 to-[#0a0a0f]/95 bg-gradient-to-r from-orange-950/80', 
    bottomBorderLine: 'bg-orange-500/30', 
    tint: 'text-orange-500/10', 
    stroke: 'text-orange-500/40' 
  },
  ANALYTICS: { 
    bg: 'bg-[#0a0a0f]/40 to-[#0a0a0f]/95 bg-gradient-to-r from-fuchsia-950/80', 
    bottomBorderLine: 'bg-fuchsia-500/30', 
    tint: 'text-fuchsia-500/10', 
    stroke: 'text-fuchsia-500/40' 
  },
  FACTORY: { 
    bg: 'bg-[#0a0a0f]/40 to-[#0a0a0f]/95 bg-gradient-to-r from-indigo-950/80', 
    bottomBorderLine: 'bg-indigo-500/30', 
    tint: 'text-indigo-500/10', 
    stroke: 'text-indigo-500/40' 
  },
  ORGANIZATION: { 
    bg: 'bg-[#0a0a0f]/40 to-[#0a0a0f]/95 bg-gradient-to-r from-amber-950/80', 
    bottomBorderLine: 'bg-amber-500/30', 
    tint: 'text-amber-500/10', 
    stroke: 'text-amber-500/40' 
  },
  SETTINGS: { 
    bg: 'bg-[#0a0a0f]/40 to-[#0a0a0f]/95 bg-gradient-to-r from-slate-900/80', 
    bottomBorderLine: 'bg-white/10', 
    tint: 'text-white/5', 
    stroke: 'text-white/20' 
  },
};

export const TAB_SVG_THEMES: Record<string, TabSvgTheme> = {
  PDR: { 
    activeBg: 'text-cyan-500/25', 
    inactiveBg: 'text-cyan-950/40 group-hover:text-cyan-900/50', 
    activeBorder: 'text-cyan-400', 
    inactiveBorder: 'text-cyan-500/35 group-hover:text-cyan-400/60', 
    dropShadow: '' 
  },
  PREVENTIVE: { 
    activeBg: 'text-emerald-500/25', 
    inactiveBg: 'text-emerald-950/40 group-hover:text-emerald-900/50', 
    activeBorder: 'text-emerald-400', 
    inactiveBorder: 'text-emerald-500/35 group-hover:text-emerald-400/60', 
    dropShadow: '' 
  },
  CORRECTIVE: { 
    activeBg: 'text-orange-500/25', 
    inactiveBg: 'text-orange-950/40 group-hover:text-orange-900/50', 
    activeBorder: 'text-orange-400', 
    inactiveBorder: 'text-orange-500/35 group-hover:text-orange-400/60', 
    dropShadow: '' 
  },
  ANALYTICS: { 
    activeBg: 'text-fuchsia-500/25', 
    inactiveBg: 'text-fuchsia-950/40 group-hover:text-fuchsia-900/50', 
    activeBorder: 'text-fuchsia-400', 
    inactiveBorder: 'text-fuchsia-500/35 group-hover:text-fuchsia-400/60', 
    dropShadow: '' 
  },
  FACTORY: { 
    activeBg: 'text-indigo-500/25', 
    inactiveBg: 'text-indigo-950/40 group-hover:text-indigo-900/50', 
    activeBorder: 'text-indigo-400', 
    inactiveBorder: 'text-indigo-500/35 group-hover:text-indigo-400/60', 
    dropShadow: '' 
  },
  ORGANIZATION: { 
    activeBg: 'text-amber-500/25', 
    inactiveBg: 'text-amber-950/40 group-hover:text-amber-900/50', 
    activeBorder: 'text-amber-400', 
    inactiveBorder: 'text-amber-500/35 group-hover:text-amber-400/60', 
    dropShadow: '' 
  },
  SETTINGS: { 
    activeBg: 'text-slate-500/25', 
    inactiveBg: 'text-slate-900/40 group-hover:text-slate-800/50', 
    activeBorder: 'text-slate-300', 
    inactiveBorder: 'text-white/20 group-hover:text-white/40', 
    dropShadow: '' 
  },
};

export const SVG_PATHS = {
  // Primary tab width and slant constants
  PRIMARY_WIDTH: 172,
  PRIMARY_HEIGHT: 38,
  PRIMARY_SLANT_W: 34,

  // Secondary tab width and slant constants
  SECONDARY_WIDTH: 165,
  SECONDARY_HEIGHT: 30,
  SECONDARY_SLANT_W: 27,
};

