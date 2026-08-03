import React, { useEffect } from 'react';
import { ClipboardCheck, KanbanSquare, CalendarClock, HardHat, LayoutDashboard } from 'lucide-react';
import { useTabStore } from '@/app/store';
import { PortalCanvas } from '@/app/layout/PortalCanvas';
import { PortalSidebar } from '@/app/layout/PortalSidebar';
import { PortalSidebarItem } from '@/shared/components/PortalSidebarItem';
import type { User } from '@/core/db';

import { PreventiveRadarView } from '../views/PreventiveRadarView';
import { TaskCatalogView } from '../views/TaskCatalogView';
import { MachineRegistryView } from '../views/MachineRegistryView';

const PREVENTIVE_COMPONENTS = {
  'pm-radar': PreventiveRadarView,
  'pm-task-catalog': TaskCatalogView,
  'pm-machine-registry': MachineRegistryView,
};

export function PreventiveLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'PREVENTIVE');
  const activeTabId = currentTab?.id;

  useEffect(() => {
    if (!currentTab) {
      openTab({ id: 'pm-radar', portalId: 'PREVENTIVE', title: 'Preventive Radar', component: 'pm-radar' });
    }
  }, [currentTab, openTab]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName="Maintenance Ops"
        portalIcon={<ClipboardCheck />}
        colorClass="bg-emerald-500/10 text-emerald-500"
        borderClass="border-emerald-500/30"
        textClass="text-emerald-400"
      >
        <PortalSidebarItem 
          icon={<LayoutDashboard />} 
          isActive={activeTabId === 'pm-radar'} 
          onClick={() => openTab({ id: 'pm-radar', portalId: 'PREVENTIVE', title: 'Preventive Radar', component: 'pm-radar' })}
          title="Preventive Radar"
          colorClass="text-emerald-400"
        />
        <PortalSidebarItem 
          icon={<KanbanSquare />} 
          isActive={activeTabId === 'pm-task-catalog'} 
          onClick={() => openTab({ id: 'pm-task-catalog', portalId: 'PREVENTIVE', title: 'Tasks Catalog', component: 'pm-task-catalog' })}
          title="Tasks Catalog"
          colorClass="text-emerald-400"
        />
        <PortalSidebarItem 
          icon={<CalendarClock />} 
          isActive={activeTabId === 'pm-machine-registry'} 
          onClick={() => openTab({ id: 'pm-machine-registry', portalId: 'PREVENTIVE', title: 'Preventive Plans', component: 'pm-machine-registry' })}
          title="Preventive Plans"
          colorClass="text-emerald-400"
        />
      </PortalSidebar>

      <PortalCanvas componentMap={PREVENTIVE_COMPONENTS} user={user} onLogout={onLogout} />
    </div>
  );
}


