import React from 'react';
import { X, Package } from 'lucide-react';
import { cn } from '@/shared/utils';
import { PORTAL_ICONS, PORTAL_COLORS, TAB_SVG_THEMES, SVG_PATHS } from './types';
import type { Tab, PortalType } from '@/app/store';

interface SecondarySlantedTabProps {
  tab: Tab;
  index: number;
  isFirst?: boolean;
  onActivate: (portalId: PortalType) => void;
  onClose: (portalId: PortalType) => void;
}

export function SecondarySlantedTab({
  tab,
  index,
  isFirst = false,
  onActivate,
  onClose,
}: SecondarySlantedTabProps) {
  const colors = PORTAL_COLORS[tab.portalId] || { dot: 'bg-white/40', border: 'border-white/10', text: 'text-white' };
  const Icon = PORTAL_ICONS[tab.portalId] || Package;
  const tabTheme = TAB_SVG_THEMES[tab.portalId] || TAB_SVG_THEMES.SETTINGS;

  const W = SVG_PATHS.SECONDARY_WIDTH;
  const H = SVG_PATHS.SECONDARY_HEIGHT;
  const S = SVG_PATHS.SECONDARY_SLANT_W;

  // Correct forward parallel 45° slant (\ \) with equal isometric slope and rounded vertices
  const secondaryTabPath = `M 6 1 L ${W - S - 3} 1 Q ${W - S + 1} 1 ${W - S + 4} 4 L ${W - 3} ${H - 4} Q ${W - 1} ${H - 1} ${W - 5} ${H - 1} L ${S + 4} ${H - 1} Q ${S + 1} ${H - 1} ${S - 1} ${H - 4} L 2 4 Q 1 1 6 1 Z`;

  return (
    <div
      className={cn(
        "group relative flex items-center cursor-pointer select-none shrink-0 transition-all duration-300",
        "z-0 hover:z-10",
        index > 0 ? "-ml-2.5" : isFirst ? "ml-0" : "ml-0"
      )}
      style={{ width: `${W}px`, height: `${H}px` }}
      onPointerDown={() => onActivate(tab.portalId)}
    >
      {/* Secondary Slanted SVG Shape (\ \) floating over dark canvas */}
      <div className="absolute inset-0 z-0 transition-all duration-300">
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox={`0 0 ${W} ${H}`}
        >
          <path 
            d={secondaryTabPath} 
            fill="rgba(10, 12, 18, 0.85)" 
            className="transition-all duration-300" 
          />
          <path 
            d={secondaryTabPath} 
            className={cn("transition-all duration-300 opacity-25", tabTheme.inactiveBg)} 
            fill="currentColor" 
          />
          {/* Crystal Base Border */}
          <path 
            d={secondaryTabPath} 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.12)" 
            strokeWidth="1" 
            vectorEffect="non-scaling-stroke" 
          />
          {/* Subtle Engine Accent Border */}
          <path 
            d={secondaryTabPath} 
            className={cn("transition-all duration-300", tabTheme.inactiveBorder)} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
            vectorEffect="non-scaling-stroke" 
            opacity="0.2" 
          />
        </svg>
      </div>

      {/* Content for Secondary Slanted Tab */}
      <div className="relative z-10 flex items-center gap-2 pl-7 pr-3.5 w-full h-full text-[11.5px]">
        <Icon className={cn("w-3.5 h-3.5 shrink-0 transition-opacity opacity-70 group-hover:opacity-100", colors.text)} />
        <span className="truncate flex-1 tracking-tight font-bold text-slate-300 group-hover:text-white transition-colors">
          {tab.title}
        </span>
        
        {/* ① Pure Minimal Close Action for secondary tabs */}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onClose(tab.portalId); 
          }}
          className="shrink-0 transition-all duration-200 text-white/30 hover:text-rose-400 hover:scale-110 active:scale-95 focus:outline-none focus:ring-0 opacity-0 group-hover:opacity-100"
          title="Close Tab"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

