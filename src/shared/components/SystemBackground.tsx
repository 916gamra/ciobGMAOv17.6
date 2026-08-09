import React from 'react';
import { useOsStore } from '@/app/store/useOsStore';
import { PortalType } from '@/app/store';

interface SystemBackgroundProps {
  portalId?: PortalType;
}

const PORTAL_SPOTLIGHTS: Record<PortalType, { primaryRgb: string; secondaryRgb: string }> = {
  HOME: {
    primaryRgb: '30, 64, 175',   // Gemini Royal Blue
    secondaryRgb: '37, 99, 235',
  },
  PDR: {
    primaryRgb: '6, 182, 212',   // Cyan Engine
    secondaryRgb: '14, 116, 144',
  },
  PREVENTIVE: {
    primaryRgb: '16, 185, 129',  // Emerald Maintenance Engine
    secondaryRgb: '4, 120, 87',
  },
  CORRECTIVE: {
    primaryRgb: '249, 115, 22',  // Orange Work Orders Engine
    secondaryRgb: '194, 65, 12',
  },
  ANALYTICS: {
    primaryRgb: '192, 38, 211',  // Fuchsia BI & KPI Engine
    secondaryRgb: '126, 34, 206',
  },
  FACTORY: {
    primaryRgb: '99, 102, 241',  // Indigo Equipment Engine
    secondaryRgb: '67, 56, 202',
  },
  ORGANIZATION: {
    primaryRgb: '245, 158, 11',  // Amber Blueprint Engine
    secondaryRgb: '180, 83, 9',
  },
  SETTINGS: {
    primaryRgb: '100, 116, 139', // Slate Enclave System
    secondaryRgb: '71, 85, 105',
  },
};

export function SystemBackground({ portalId }: SystemBackgroundProps) {
  const { activePortal } = useOsStore();
  const currentPortal = portalId || activePortal || 'HOME';
  const spotlight = PORTAL_SPOTLIGHTS[currentPortal] || PORTAL_SPOTLIGHTS.HOME;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none bg-[#0a0a0f]">
      {/* Gemini-Style Dynamic Central Soft Radial Spotlight Glow */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 50%, rgba(${spotlight.primaryRgb}, 0.25) 0%, rgba(10, 10, 15, 0.5) 50%, rgba(9, 10, 15, 0) 80%)`
        }}
      />
      
      {/* Secondary Soft Ambient Light Core */}
      <div 
        className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] blur-[150px] rounded-full pointer-events-none transition-all duration-1000 ease-in-out"
        style={{
          backgroundColor: `rgba(${spotlight.secondaryRgb}, 0.16)`
        }}
      />

      {/* Subtle Noise Texture for Organic Finish */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
    </div>
  );
}


