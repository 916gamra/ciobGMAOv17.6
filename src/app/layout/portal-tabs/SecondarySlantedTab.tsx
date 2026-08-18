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

  // Correct forward parallel 45° slant (\ \) matching the primary tab & chassis
  const secondaryTabPath = `M 7 1 L ${W - S - 3} 1 Q ${W - S + 1} 1 ${W - S + 3} 4 L ${W - 3} ${H - 4} Q ${W - 1} ${H - 1} ${W - 5} ${H - 1} L ${S + 5} ${H - 1} Q ${S + 1} ${H - 1} ${S - 1} ${H - 4} L 3 4 Q 1 1 7 1 Z`;

  return (
    <div
      className={cn(
        "group relative flex items-center cursor-pointer select-none shrink-0 transition-all duration-300",
        "h-[30px] z-0 hover:z-10",
        index > 0 ? "-ml-1.5" : isFirst ? "ml-0.5" : "ml-0"
      )}
      style={{ width: `${W}px` }}
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
            fill="rgba(10, 12, 18, 0.88)" 
            className="transition-all duration-300" 
          />
          <path 
            d={secondaryTabPath} 
            className={cn("transition-all duration-300", tabTheme.inactiveBg)} 
            fill="currentColor" 
          />
          <path 
            d={secondaryTabPath} 
            className={cn("transition-all duration-300", tabTheme.inactiveBorder)} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.2" 
            vectorEffect="non-scaling-stroke" 
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Content for Secondary Slanted Tab */}
      <div className="relative z-10 flex items-center gap-1.5 pl-6 pr-4 w-full h-full text-[11px]">
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

