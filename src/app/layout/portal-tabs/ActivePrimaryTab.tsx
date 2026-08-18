import React, { forwardRef } from 'react';
import { X, Package } from 'lucide-react';
import { cn } from '@/shared/utils';
import { PORTAL_ICONS, PORTAL_COLORS, TAB_SVG_THEMES, SVG_PATHS } from './types';
import type { Tab, PortalType } from '@/app/store';

interface ActivePrimaryTabProps {
  tab: Tab;
  onClose: (portalId: PortalType) => void;
}

export const ActivePrimaryTab = forwardRef<HTMLDivElement, ActivePrimaryTabProps>(
  ({ tab, onClose }, ref) => {
    const colors = PORTAL_COLORS[tab.portalId] || { dot: 'bg-white/40', border: 'border-white/10', text: 'text-white' };
    const Icon = PORTAL_ICONS[tab.portalId] || Package;
    const tabTheme = TAB_SVG_THEMES[tab.portalId] || TAB_SVG_THEMES.SETTINGS;

    const W = SVG_PATHS.PRIMARY_WIDTH;
    const H = SVG_PATHS.PRIMARY_HEIGHT;
    const S = SVG_PATHS.PRIMARY_SLANT_W;

    // Pixel-accurate path for the primary active tab: [ \
    const primaryTabPath = `M 6 1 L ${W - S - 2} 1 Q ${W - S + 2} 1 ${W - S + 5} 4 L ${W - 3} ${H - 4} Q ${W - 1} ${H - 1} ${W - 6} ${H - 1} L 6 ${H - 1} Q 1 ${H - 1} 1 ${H - 6} L 1 6 Q 1 1 6 1 Z`;

    return (
      <div 
        ref={ref}
        className="group relative flex items-center cursor-pointer select-none shrink-0 h-[38px] transition-all duration-300 z-10"
        style={{ width: `${W}px` }}
      >
        {/* Refined Glass Material without distracting glow */}
        <div className="absolute inset-0 z-0">
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox={`0 0 ${W} ${H}`}
          >
            {/* Glass Base - Dark & High Contrast */}
            <path 
              d={primaryTabPath} 
              fill="rgba(10, 12, 18, 0.92)" 
              className="transition-all duration-300" 
            />
            
            {/* Glass Engine Tint */}
            <path 
              d={primaryTabPath} 
              className={cn("transition-all duration-300", tabTheme.activeBg)} 
              fill="currentColor" 
            />
            
            {/* Subtle Glass Shine Gradient for realistic physical depth */}
            <path 
              d={primaryTabPath} 
              fill="url(#primaryGlassShine)" 
              opacity="0.08" 
            />
            
            {/* Elegant and Precise Glass Border */}
            <path 
              d={primaryTabPath} 
              className={cn("transition-all duration-300", tabTheme.activeBorder)} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.4" 
              vectorEffect="non-scaling-stroke" 
              opacity="0.65"
            />

            <defs>
              <linearGradient id="primaryGlassShine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.15" />
                <stop offset="50%" stopColor="white" stopOpacity="0" />
                <stop offset="100%" stopColor="white" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Content for Primary Tab */}
        <div className="relative z-10 flex items-center gap-2 w-full h-full pl-3.5 pr-3 text-[12px]">
          <Icon className={cn(
            "w-3.5 h-3.5 shrink-0 transition-all duration-300",
            colors.text
          )} />
          
          <span className="truncate flex-1 tracking-tight text-white font-black text-[12.5px]">
            {tab.title}
          </span>

          {/* ① Pure Minimal Close Action - no background, no border, clean text transition */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onClose(tab.portalId); 
            }}
            className="shrink-0 transition-all duration-200 text-white/40 hover:text-rose-400 hover:scale-110 active:scale-95 focus:outline-none focus:ring-0 opacity-0 group-hover:opacity-100 ml-1"
            title="Close Tab"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
);

ActivePrimaryTab.displayName = 'ActivePrimaryTab';

