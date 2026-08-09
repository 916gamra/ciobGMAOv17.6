import React from 'react';
import { ComponentCatalogView } from '@/features/pdr-engine/views/ComponentCatalogView';
import { ComponentsCatalogView } from '@/features/corrective/views/ComponentsCatalogView';
import { ComponentsLabView } from '@/features/organization/views/ComponentsLabView';

interface MasterPartsCatalogHubProps {
  defaultTab?: 'pdr' | 'components' | 'components-lab';
  tabId?: string;
  user?: any;
  onLogout?: () => void;
}

export function MasterPartsCatalogHub({ defaultTab = 'pdr', tabId, user, onLogout }: MasterPartsCatalogHubProps) {
  // Infer active tab from tabId if provided, or fallback to defaultTab
  const activeTab = (() => {
    if (tabId === 'components-catalog' || tabId === 'master-components-catalog') return 'components';
    if (tabId === 'part-master' || tabId === 'spec-lab' || tabId === 'eng-master' || tabId === 'components-lab') return 'components-lab';
    if (tabId === 'component-catalog' || tabId === 'master-pdr-catalog') return 'pdr';
    return defaultTab;
  })();

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0f] text-slate-200 overflow-hidden">
      {/* Main Tab View Canvas */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'components-lab' && <ComponentsLabView tabId={tabId || ''} user={user} />}
        {activeTab === 'pdr' && <ComponentCatalogView />}
        {activeTab === 'components' && <ComponentsCatalogView />}
      </div>
    </div>
  );
}
