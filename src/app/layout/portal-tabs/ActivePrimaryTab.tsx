import React, { forwardRef } from 'react';
import { X, Package } from 'lucide-react';
import { cn } from '@/shared/utils';
import { PORTAL_ICONS, PORTAL_COLORS, PORTAL_UNDERGLOW, TAB_SVG_THEMES, SVG_PATHS } from './types';
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
    const underglowGradient = PORTAL_UNDERGLOW[tab.portalId] || 'from-cyan-500/30 to-transparent';

    const W = SVG_PATHS.PRIMARY_WIDTH;
    const H = SVG_PATHS.PRIMARY_HEIGHT;
    const S = SVG_PATHS.PRIMARY_SLANT_W;

    // Pixel-accurate path for the primary active tab: [ \
    const primaryTabPath = `M 6 1 L ${W - S - 2} 1 Q ${W - S + 2} 1 ${W - S + 5} 4 L ${W - 3} ${H - 4} Q ${W - 1} ${H - 1} ${W - 6} ${H - 1} L 6 ${H - 1} Q 1 ${H - 1} 1 ${H - 6} L 1 6 Q 1 1 6 1 Z`;

    return (
      <div 
        ref={ref}
        className="group relative flex items-center cursor-pointer select-none shrink-0 transition-all duration-300 z-10"
        style={{ width: `${W}px`, height: `${H}px` }}
      >
        {/* 1. Engine Ambient Underglow - glowing from underneath the floating card */}
        <div 
          className={cn(
            "absolute -inset-1 rounded-2xl opacity-75 blur-md pointer-events-none transition-all duration-500 bg-gradient-to-r",
            underglowGradient
          )} 
        />

        {/* 2. Frosted Floating Glass Shell with realistic layered depth */}
        <div className="absolute inset-0 z-0">
          <svg 
            className="absolute inset-0 w-full h-full filter drop-shadow-[0_8px_18px_rgba(0,0,0,0.7)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
            viewBox={`0 0 ${W} ${H}`}
          >
            {/* Base Dark Glass Substrate */}
            <path 
              d={primaryTabPath} 
              fill="rgba(11, 13, 20, 0.82)" 
              className="transition-all duration-300" 
            />

            {/* Frosted Specular Glass Surface (Misty & Deep) */}
            <path 
              d={primaryTabPath} 
              fill="url(#primaryFrostedSurface)" 
              className="transition-all duration-300" 
            />

            {/* Soft Ambient Engine Color Diffusion from within */}
            <path 
              d={primaryTabPath} 
              className={cn("transition-all duration-300 opacity-20", tabTheme.activeBg)} 
              fill="currentColor" 
            />
            
            {/* Soft, Delicate Frosted Hairline Border (Softened, non-glaring) */}
            <path 
              d={primaryTabPath} 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.12)" 
              strokeWidth="1" 
              vectorEffect="non-scaling-stroke" 
            />

            {/* Soft Engine Accent Stroke (Subtle & Refined) */}
            <path 
              d={primaryTabPath} 
              className={cn("transition-all duration-300", tabTheme.activeBorder)} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1" 
              vectorEffect="non-scaling-stroke" 
              opacity="0.25"
            />

            {/* Top Light Catching Specular Edge */}
            <path 
              d={primaryTabPath} 
              fill="none" 
              stroke="url(#primaryTopHighlight)" 
              strokeWidth="1" 
              vectorEffect="non-scaling-stroke" 
            />

            <defs>
              {/* Frosted Glass Internal Gradient */}
              <linearGradient id="primaryFrostedSurface" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.02)" />
                <stop offset="100%" stopColor="rgba(0, 0, 0, 0.3)" />
              </linearGradient>

              {/* Top Specular Edge Highlight */}
              <linearGradient id="primaryTopHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
                <stop offset="40%" stopColor="rgba(255, 255, 255, 0.05)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.0)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Content for Primary Tab */}
        <div className="relative z-10 flex items-center gap-2 w-full h-full pl-3.5 pr-3 text-[12px]">
          <Icon className={cn(
            "w-3.5 h-3.5 shrink-0 transition-all duration-300 drop-shadow-[0_0_8px_currentColor]",
            colors.text
          )} />
          
          <span className="truncate flex-1 tracking-tight text-white font-extrabold text-[12.5px] drop-shadow-sm">
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

