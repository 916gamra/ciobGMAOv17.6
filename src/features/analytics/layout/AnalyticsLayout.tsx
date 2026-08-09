import React, { useEffect } from 'react';
import { PieChart, LineChart, AlertOctagon, FileSpreadsheet, FileText, FileCode } from 'lucide-react';
import { useTabStore } from '@/app/store';
import { PortalCanvas } from '@/app/layout/PortalCanvas';
import { PortalSidebar } from '@/app/layout/PortalSidebar';
import { PortalSidebarItem } from '@/shared/components/PortalSidebarItem';
import type { User } from '@/core/db';
import { cn } from '@/shared/utils';

import { AnalyticsDashboardPage } from '../views/AnalyticsDashboardPage';
import { CorrectiveWardView } from '../views/CorrectiveWardView';
import { ExcelEngineView } from '../views/ExcelEngineView';
import { PdfEngineView } from '../views/PdfEngineView';
import { WordEngineView } from '../views/WordEngineView';

const ANALYTICS_COMPONENTS = {
  'analytics-dashboard': AnalyticsDashboardPage,
  'corrective-ward': CorrectiveWardView,
  'excel-engine': ExcelEngineView,
  'pdf-engine': PdfEngineView,
  'word-engine': WordEngineView,
};

export function AnalyticsLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'ANALYTICS');
  const activeTabId = currentTab?.id;

  useEffect(() => {
    if (!currentTab) {
      openTab({ id: 'analytics-dashboard', portalId: 'ANALYTICS', title: 'Executive Hub', component: 'analytics-dashboard' });
    }
  }, [currentTab, openTab]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName="Analyses & Indicateurs"
        portalIcon={<PieChart />}
        glowColor="fuchsia"
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
        
        <div className="my-2 border-t border-white/10 pt-2 px-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Document Engines</span>
        </div>

        <PortalSidebarItem 
          icon={<FileSpreadsheet />} 
          isActive={activeTabId === 'excel-engine'} 
          onClick={() => openTab({ id: 'excel-engine', portalId: 'ANALYTICS', title: 'Excel Engine (XLSX)', component: 'excel-engine' })}
          title="Excel Engine (XLSX)"
          colorClass="text-emerald-400"
        />
        <PortalSidebarItem 
          icon={<FileText />} 
          isActive={activeTabId === 'pdf-engine'} 
          onClick={() => openTab({ id: 'pdf-engine', portalId: 'ANALYTICS', title: 'PDF Engine (PDF)', component: 'pdf-engine' })}
          title="PDF Engine (PDF)"
          colorClass="text-rose-400"
        />
        <PortalSidebarItem 
          icon={<FileCode />} 
          isActive={activeTabId === 'word-engine'} 
          onClick={() => openTab({ id: 'word-engine', portalId: 'ANALYTICS', title: 'Word Engine (DOCX)', component: 'word-engine' })}
          title="Word Engine (DOCX)"
          colorClass="text-blue-400"
        />
      </PortalSidebar>

      <PortalCanvas componentMap={ANALYTICS_COMPONENTS} user={user} onLogout={onLogout} />
    </div>
  );
}

