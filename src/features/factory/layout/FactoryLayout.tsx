import React, { useEffect } from 'react';
import { Factory, Cpu, Network, Users } from 'lucide-react';
import { useTabStore } from '@/app/store';
import { PortalCanvas } from '@/app/layout/PortalCanvas';
import { PortalSidebar } from '@/app/layout/PortalSidebar';
import { PortalSidebarItem } from '@/shared/components/PortalSidebarItem';
import type { User } from '@/core/db';
import { cn } from '@/shared/utils';

import { SectorRegistryView } from '../../organization/views/SectorRegistryView';
import { StaffRegistryView } from '../../organization/views/StaffRegistryView';
import { MachineRegistryView } from '../../organization/views/MachineRegistryView';
import { MachineDetailsView } from '../../organization/views/MachineDetailsView';
import { EngineeringLabView } from '../../organization/views/EngineeringLabView';
import { Wrench } from 'lucide-react';

const FACTORY_COMPONENTS = {
  'sectors': SectorRegistryView,
  'staff': StaffRegistryView,
  'engineering-lab': EngineeringLabView,
  'machine-registry': MachineRegistryView,
};

export function FactoryLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'FACTORY');
  const activeTabId = currentTab?.id;

  // We inject the components map dynamically to support active/closable tabs
  const componentMap = {
    ...FACTORY_COMPONENTS,
    ...(currentTab?.id.startsWith('machine-detail:') ? {
      [currentTab.id]: MachineDetailsView
    } : {})
  };

  useEffect(() => {
    if (!currentTab) {
      openTab({ id: 'sectors', portalId: 'FACTORY', title: 'Production Zones', component: 'sectors' });
    }
  }, [currentTab, openTab]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName="Factory Admin"
        portalIcon={<Factory />}
        colorClass="bg-indigo-500/20"
        borderClass="border-indigo-500/30"
        textClass="text-indigo-400"
      >
        <PortalSidebarItem 
          icon={<Network />} 
          isActive={activeTabId === 'sectors'} 
          onClick={() => openTab({ id: 'sectors', portalId: 'FACTORY', title: 'Production Zones', component: 'sectors' })}
          title="Production Zones"
          colorClass="text-indigo-400"
        />
        <PortalSidebarItem 
          icon={<Users />} 
          isActive={activeTabId === 'staff'} 
          onClick={() => openTab({ id: 'staff', portalId: 'FACTORY', title: 'Operational Staff', component: 'staff' })}
          title="Operational Staff"
          colorClass="text-indigo-400"
        />
        <PortalSidebarItem 
          icon={<Wrench />} 
          isActive={activeTabId === 'engineering-lab'} 
          onClick={() => openTab({ id: 'engineering-lab', portalId: 'FACTORY', title: 'Engineering Lab', component: 'engineering-lab' })}
          title="Engineering Lab"
          colorClass="text-indigo-400"
        />
        <PortalSidebarItem 
          icon={<Cpu />} 
          isActive={activeTabId === 'machine-registry'} 
          onClick={() => openTab({ id: 'machine-registry', portalId: 'FACTORY', title: 'Machine Registry', component: 'machine-registry' })}
          title="Machine Registry"
          colorClass="text-indigo-400"
        />
      </PortalSidebar>

      <PortalCanvas componentMap={componentMap as any} user={user} onLogout={onLogout} />
    </div>
  );
}
