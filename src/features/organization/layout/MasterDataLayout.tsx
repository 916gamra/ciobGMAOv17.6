import React, { useEffect } from 'react';
import { Database, DraftingCompass } from 'lucide-react';
import { useTabStore } from '@/app/store';
import { PortalCanvas } from '@/app/layout/PortalCanvas';
import { PortalSidebar } from '@/app/layout/PortalSidebar';
import { PortalSidebarItem } from '@/shared/components/PortalSidebarItem';
import type { User } from '@/core/db';

import { ComponentsLabView } from '../views/ComponentsLabView';

const MASTER_COMPONENTS = {
  'components-lab': (props: any) => <ComponentsLabView {...props} />,
};

export function MasterDataLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'ORGANIZATION');
  const activeTabId = currentTab?.id;

  useEffect(() => {
    if (!currentTab) {
      openTab({ id: 'components-lab', portalId: 'ORGANIZATION', title: 'مختبر المكونات والقوالب', component: 'components-lab' });
    }
  }, [currentTab, openTab]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName="Master Catalog"
        portalIcon={<Database />}
        glowColor="amber"
        colorClass="bg-amber-500/10 text-amber-500"
        borderClass="border-amber-500/30"
        textClass="text-amber-400"
      >
        <PortalSidebarItem 
          icon={<DraftingCompass />} 
          isActive={activeTabId === 'components-lab' || activeTabId === 'part-master'} 
          onClick={() => openTab({ id: 'components-lab', portalId: 'ORGANIZATION', title: 'مختبر المكونات والقوالب', component: 'components-lab' })}
          title="مختبر المكونات والقوالب"
          colorClass="text-amber-400"
        />
      </PortalSidebar>

      <PortalCanvas componentMap={MASTER_COMPONENTS} user={user} onLogout={onLogout} />
    </div>
  );
}
