import React, { useEffect } from 'react';
import { Database, Package, Component, Layers } from 'lucide-react';
import { useTabStore } from '@/app/store';
import { PortalCanvas } from '@/app/layout/PortalCanvas';
import { PortalSidebar } from '@/app/layout/PortalSidebar';
import { PortalSidebarItem } from '@/shared/components/PortalSidebarItem';
import type { User } from '@/core/db';
import { cn } from '@/shared/utils';

import { MasterPartsCatalogHub } from '../views/MasterPartsCatalogHub';

const MASTER_COMPONENTS = {
  'part-master': (props: any) => <MasterPartsCatalogHub defaultTab="spec-lab" {...props} />,
  'master-pdr-catalog': (props: any) => <MasterPartsCatalogHub defaultTab="pdr" {...props} />,
  'master-components-catalog': (props: any) => <MasterPartsCatalogHub defaultTab="components" {...props} />,
};

export function MasterDataLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'ORGANIZATION');
  const activeTabId = currentTab?.id;

  useEffect(() => {
    if (!currentTab) {
      openTab({ id: 'master-pdr-catalog', portalId: 'ORGANIZATION', title: 'كتالوج قطع الغيار والجرائم', component: 'master-pdr-catalog' });
    }
  }, [currentTab, openTab]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName="Parts Catalogue"
        portalIcon={<Database />}
        colorClass="bg-amber-500/10 text-amber-500"
        borderClass="border-amber-500/30"
        textClass="text-amber-400"
      >
        <PortalSidebarItem 
          icon={<Package />} 
          isActive={activeTabId === 'master-pdr-catalog'} 
          onClick={() => openTab({ id: 'master-pdr-catalog', portalId: 'ORGANIZATION', title: 'كتالوج قطع الغيار', component: 'master-pdr-catalog' })}
          title="كتالوج قطع الغيار (PDR)"
          colorClass="text-cyan-400"
        />

        <PortalSidebarItem 
          icon={<Component />} 
          isActive={activeTabId === 'master-components-catalog'} 
          onClick={() => openTab({ id: 'master-components-catalog', portalId: 'ORGANIZATION', title: 'كتالوج المكونات والأنظمة', component: 'master-components-catalog' })}
          title="المكونات والأنظمة المجمعة"
          colorClass="text-orange-400"
        />

        <PortalSidebarItem 
          icon={<Database />} 
          isActive={activeTabId === 'part-master'} 
          onClick={() => openTab({ id: 'part-master', portalId: 'ORGANIZATION', title: 'مختبر المواصفات والترقيم', component: 'part-master' })}
          title="مختبر الترقيم (Spec Lab)"
          colorClass="text-amber-400"
        />
      </PortalSidebar>

      <PortalCanvas componentMap={MASTER_COMPONENTS} user={user} onLogout={onLogout} />
    </div>
  );
}
