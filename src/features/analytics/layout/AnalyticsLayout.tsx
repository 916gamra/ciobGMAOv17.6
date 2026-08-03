import React, { useEffect } from 'react';
import { PieChart, LineChart, AlertOctagon } from 'lucide-react';
import { useTabStore } from '@/app/store';
import { PortalCanvas } from '@/app/layout/PortalCanvas';
import { PortalSidebar } from '@/app/layout/PortalSidebar';
import { PortalSidebarItem } from '@/shared/components/PortalSidebarItem';
import type { User } from '@/core/db';
import { cn } from '@/shared/utils';

import { AnalyticsDashboardPage } from '../views/AnalyticsDashboardPage';
import { CorrectiveWardView } from '../views/CorrectiveWardView';

const ANALYTICS_COMPONENTS = {
  'analytics-dashboard': AnalyticsDashboardPage,
  'corrective-ward': CorrectiveWardView,
};

export function AnalyticsLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'ANALYTICS');
  const activeTabId = currentTab?.id;

  useEffect(() => {
    if (!currentTab) {
      openTab({ id: 'analytics-dashboard', portalId: 'ANALYTICS', title: 'The Oracle', component: 'analytics-dashboard' });
    }
  }, [currentTab, openTab]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName="The Oracle"
        portalIcon={<PieChart />}
        colorClass="bg-fuchsia-500/20"
        borderClass="border-fuchsia-500/30"
        textClass="text-fuchsia-400"
      >
        <PortalSidebarItem 
          icon={<LineChart />} 
          isActive={activeTabId === 'analytics-dashboard'} 
          onClick={() => openTab({ id: 'analytics-dashboard', portalId: 'ANALYTICS', title: 'Executive Hub', component: 'analytics-dashboard' })}
          title="Executive Hub"
          colorClass="text-fuchsia-400"
        />
        <PortalSidebarItem 
          icon={<AlertOctagon />} 
          isActive={activeTabId === 'corrective-ward'} 
          onClick={() => openTab({ id: 'corrective-ward', portalId: 'ANALYTICS', title: 'Corrective Ward', component: 'corrective-ward' })}
          title="Corrective Ward"
          colorClass="text-red-500"
        />
      </PortalSidebar>

      <PortalCanvas componentMap={ANALYTICS_COMPONENTS} user={user} onLogout={onLogout} />
    </div>
  );
}
