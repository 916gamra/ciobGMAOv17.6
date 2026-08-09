import React, { useEffect } from 'react';
import { Wrench, LayoutDashboard, Component, BarChart3, Radar } from 'lucide-react';
import { useTabStore } from '@/app/store';
import { PortalCanvas } from '@/app/layout/PortalCanvas';
import { PortalSidebar } from '@/app/layout/PortalSidebar';
import { PortalSidebarItem } from '@/shared/components/PortalSidebarItem';
import type { User } from '@/core/db';

import { BreakdownLogView } from '../views/BreakdownLogView';
import { MasterPartsCatalogHub } from '@/features/organization/views/MasterPartsCatalogHub';
import { ComponentRadarView } from '../views/ComponentRadarView';
import { FailureCatalogView } from '../views/FailureCatalogView';

const CORRECTIVE_COMPONENTS = {
  'breakdown-log': BreakdownLogView,
  'components-catalog': (props: any) => <MasterPartsCatalogHub defaultTab="components" {...props} />,
  'component-radar': ComponentRadarView,
  'failure-catalog': FailureCatalogView,
};

export function CorrectiveLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'CORRECTIVE');
  const activeTabId = currentTab?.id;

  useEffect(() => {
    if (!currentTab) {
      openTab({ id: 'breakdown-log', portalId: 'CORRECTIVE', title: 'Corrective Cockpit', component: 'breakdown-log' });
    }
  }, [currentTab, openTab]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName="Corrective Operations"
        portalIcon={<Wrench />}
        glowColor="orange"
        colorClass="bg-orange-500/10 text-orange-500"
        borderClass="border-orange-500/30"
        textClass="text-orange-400"
      >
        <PortalSidebarItem 
          icon={<LayoutDashboard />} 
          isActive={activeTabId === 'breakdown-log'} 
          onClick={() => openTab({ id: 'breakdown-log', portalId: 'CORRECTIVE', title: 'Corrective Cockpit', component: 'breakdown-log' })}
          title="غرفة عمليات الأعطال"
          colorClass="text-orange-400"
        />

        <PortalSidebarItem 
          icon={<Component />} 
          isActive={activeTabId === 'components-catalog'} 
          onClick={() => openTab({ id: 'components-catalog', portalId: 'CORRECTIVE', title: 'كتالوج المكونات', component: 'components-catalog' })}
          title="كتالوج المكونات والأنظمة"
          colorClass="text-orange-400"
        />

        <PortalSidebarItem 
          icon={<Wrench />} 
          isActive={activeTabId === 'failure-catalog'} 
          onClick={() => openTab({ id: 'failure-catalog', portalId: 'CORRECTIVE', title: 'كتالوج الأعطال', component: 'failure-catalog' })}
          title="كتالوج الأعطال (Symptom/Problem)"
          colorClass="text-orange-400"
        />

        <PortalSidebarItem 
          icon={<Radar />} 
          isActive={activeTabId === 'component-radar'} 
          onClick={() => openTab({ id: 'component-radar', portalId: 'CORRECTIVE', title: 'رادار ربط B.O.M', component: 'component-radar' })}
          title="رادار ربط المكونات والآلات"
          colorClass="text-orange-400"
        />
      </PortalSidebar>

      <PortalCanvas componentMap={CORRECTIVE_COMPONENTS} user={user} onLogout={onLogout} />
    </div>
  );
}


