import React, { useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, ClipboardCheck, History } from 'lucide-react';
import { useTabStore } from '@/app/store';
import { PortalCanvas } from '@/app/layout/PortalCanvas';
import { PortalSidebar } from '@/app/layout/PortalSidebar';
import { PortalSidebarItem } from '@/shared/components/PortalSidebarItem';
import type { User } from '@/core/db';
import { useTranslation } from 'react-i18next';

import { StockDashboardPage } from '../views/StockDashboardPage';
import { PartDetail } from '../views/PartDetail';
import { ProcurementView } from '@/features/procurement/views/ProcurementView';
import { RequisitionHubView } from '@/features/requisition/views/RequisitionHubView';
import { MasterPartsCatalogHub } from '@/features/organization/views/MasterPartsCatalogHub';
import { StockHistoryView } from '../views/StockHistoryView';
import { StockReconciliationView } from '../views/StockReconciliationView';
import { Activity, Wrench, Sparkles, CheckSquare } from 'lucide-react';

const PDR_COMPONENTS = {
  'pdr-dashboard': StockDashboardPage,
  'component-catalog': (props: any) => <MasterPartsCatalogHub defaultTab="pdr" {...props} />,
  'part-detail': PartDetail,
  'procurement': ProcurementView,
  'requisition-hub': RequisitionHubView,
  'pdr-history': StockHistoryView,
  'pdr-reconciliation': StockReconciliationView,
};

export function PdrLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { t } = useTranslation();
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'PDR');
  const activeTabId = currentTab?.id;

  useEffect(() => {
    // Only open default if no PDR tab exists at all
    if (!currentTab) {
      openTab({ id: 'dashboard', portalId: 'PDR', title: t('pdr.radar', 'PDR Radar'), component: 'pdr-dashboard' });
    }
  }, [currentTab, openTab, t]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName={t('pdr.title', 'PDR Engine')}
        portalIcon={<Package />}
        colorClass="bg-cyan-600/20"
        borderClass="border-cyan-500/30"
        textClass="text-cyan-400"
      >
        <PortalSidebarItem 
          icon={<LayoutDashboard />} 
          isActive={activeTabId === 'dashboard'} 
          onClick={() => openTab({ id: 'dashboard', portalId: 'PDR', title: t('pdr.radar', 'PDR Radar'), component: 'pdr-dashboard' })}
          title={t('pdr.radar', 'PDR Radar')}
        />
        <PortalSidebarItem 
          icon={<History />} 
          isActive={activeTabId === 'pdr-history'} 
          onClick={() => openTab({ id: 'pdr-history', portalId: 'PDR', title: t('pdr.history', 'Ledger & Consumption'), component: 'pdr-history' })}
          title={t('pdr.history', 'Ledger & Consumption')}
        />
        <PortalSidebarItem 
          icon={<CheckSquare />} 
          isActive={activeTabId === 'pdr-reconciliation'} 
          onClick={() => openTab({ id: 'pdr-reconciliation', portalId: 'PDR', title: t('pdr.reconciliation', 'Voucher Reconciliation'), component: 'pdr-reconciliation' })}
          title={t('pdr.reconciliation', 'Voucher Reconciliation')}
        />
        <PortalSidebarItem 
          icon={<Sparkles />} 
          isActive={activeTabId === 'component-catalog'} 
          onClick={() => openTab({ id: 'component-catalog', portalId: 'PDR', title: t('pdr.catalog', 'PDR Catalog'), component: 'component-catalog' })}
          title={t('pdr.catalog', 'PDR Catalog')}
        />
        <PortalSidebarItem 
          icon={<ShoppingCart />} 
          isActive={activeTabId === 'procurement'} 
          onClick={() => openTab({ id: 'procurement', portalId: 'PDR', title: t('pdr.procurement', 'Procurement'), component: 'procurement' })}
          title={t('pdr.procurement', 'Procurement')}
        />
        <PortalSidebarItem 
          icon={<ClipboardCheck />} 
          isActive={activeTabId === 'requisition-hub'} 
          onClick={() => openTab({ id: 'requisition-hub', portalId: 'PDR', title: t('pdr.requisition', 'Requisition Hub'), component: 'requisition-hub' })}
          title={t('pdr.requisition', 'Requisition Hub')}
        />
      </PortalSidebar>

      <PortalCanvas componentMap={PDR_COMPONENTS} user={user} onLogout={onLogout} />
    </div>
  );
}

