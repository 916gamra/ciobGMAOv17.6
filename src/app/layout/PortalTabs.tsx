import React from 'react';
import { useTabStore } from '@/app/store';
import { useOsStore } from '@/app/store/useOsStore';
import { 
  PortalHeaderChassis, 
  ActivePrimaryTab, 
  SecondarySlantedTab,
  HEADER_THEMES,
  SVG_PATHS,
} from './portal-tabs';
import type { PortalType } from '@/app/store';

export function PortalTabs() {
  const { tabs, closeTab, setActiveTab } = useTabStore();
  const { activePortal, setPortal } = useOsStore();

  if (tabs.length === 0) return null;

  // Active Tab & Secondary Tabs Separation
  const currentActiveTab = tabs.find(t => t.portalId === activePortal) || tabs[0];
  const otherTabs = tabs.filter(t => t.portalId !== currentActiveTab.portalId);

  // Theme for current active portal
  const activeHeaderTheme = HEADER_THEMES[currentActiveTab.portalId] || HEADER_THEMES.SETTINGS;

  // Mathematical Geometry for the wrapping chassis border & slant:
  // Card starts at LEFT_PADDING (8px), width = PRIMARY_WIDTH (172px), slant width = PRIMARY_SLANT_W (34px)
  const LEFT_PADDING = 8;
  const cardTopSlantX = LEFT_PADDING + (SVG_PATHS.PRIMARY_WIDTH - SVG_PATHS.PRIMARY_SLANT_W); // 8 + (172 - 34) = 146px
  
  // Generous, soothing clearance between the card's outer slant and the container's slant wall (increased for visual comfort)
  const COMFORT_SLANT_SPACING = 24; 
  
  // Outer slant parameters (clean 45° angle descending 40px down to shelf line):
  const slantStart = cardTopSlantX + COMFORT_SLANT_SPACING; // 146 + 24 = 170px
  const slantEnd = slantStart + 40; // 210px

  const handleActivate = (portalId: PortalType) => {
    setActiveTab(portalId);
    setPortal(portalId);
  };

  return (
    <PortalHeaderChassis
      activePortal={currentActiveTab.portalId}
      headerTheme={activeHeaderTheme}
      slantStart={slantStart}
      slantEnd={slantEnd}
    >
      <div className="flex items-center h-[48px] pl-2 pr-2 z-10 shrink-0">
        {/* 1. Primary Active Encapsulated Tab (Wrapped comfortably with generous clearance) */}
        <ActivePrimaryTab
          tab={currentActiveTab}
          onClose={closeTab}
        />

        {/* 2. Secondary Slanted Floating Tabs (Spaced naturally after the slant wall) */}
        <div className="flex items-center h-full gap-0 ml-7">
          {otherTabs.map((tab, index) => (
            <SecondarySlantedTab
              key={tab.portalId}
              tab={tab}
              index={index}
              isFirst={index === 0}
              onActivate={handleActivate}
              onClose={closeTab}
            />
          ))}
        </div>
      </div>
    </PortalHeaderChassis>
  );
}

