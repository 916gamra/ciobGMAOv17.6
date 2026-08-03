import React, { useEffect } from 'react';
import { Settings, Shield, Users, HardDriveDownload, ShieldAlert, DatabaseZap } from 'lucide-react';
import { useTabStore } from '@/app/store';
import { PortalCanvas } from '@/app/layout/PortalCanvas';
import { PortalSidebar } from '@/app/layout/PortalSidebar';
import { PortalSidebarItem } from '@/shared/components/PortalSidebarItem';
import type { User } from '@/core/db';

import { UserManagementView } from '../views/UserManagementView';
import { DataExchangeView } from '../views/DataExchangeView';
import { DataCoreView } from '../views/DataCoreView';
import { SecurityPoliciesView } from '../views/SecurityPoliciesView';
import { AuditTrailView } from '../views/AuditTrailView';
import { SystemSettingsView } from '../views/SystemSettingsView';
import { ArrowRightLeft } from 'lucide-react';

const SETTINGS_COMPONENTS = {
  'user-management': UserManagementView,
  'data-exchange': DataExchangeView,
  'data-core': DataCoreView,
  'security-policies': SecurityPoliciesView,
  'audit-trail': AuditTrailView,
  'system-dev-tools': SystemSettingsView,
};

export function SystemSettingsLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'SETTINGS');
  const activeTabId = currentTab?.id;

  useEffect(() => {
    if (!currentTab) {
      openTab({ id: 'user-management', portalId: 'SETTINGS', title: 'User Management', component: 'user-management' });
    }
  }, [currentTab, openTab]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName="System Config"
        portalIcon={<Settings />}
        colorClass="text-slate-400 bg-slate-500/20"
        borderClass="border-slate-500/30"
        textClass="text-slate-400"
      >
        <PortalSidebarItem 
          icon={<Users />} 
          isActive={activeTabId === 'user-management'} 
          onClick={() => openTab({ id: 'user-management', portalId: 'SETTINGS', title: 'User Management', component: 'user-management' })}
          title="User Management"
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<ArrowRightLeft />} 
          isActive={activeTabId === 'data-exchange'} 
          onClick={() => openTab({ id: 'data-exchange', portalId: 'SETTINGS', title: 'Data Exchange Hub', component: 'data-exchange' })}
          title="Data Exchange Hub"
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<HardDriveDownload />} 
          isActive={activeTabId === 'data-core'} 
          onClick={() => openTab({ id: 'data-core', portalId: 'SETTINGS', title: 'Database Backup', component: 'data-core' })}
          title="Database Backup"
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<Shield />} 
          isActive={activeTabId === 'security-policies'} 
          onClick={() => openTab({ id: 'security-policies', portalId: 'SETTINGS', title: 'Security Policies', component: 'security-policies' })}
          title="Security Policies"
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<ShieldAlert />} 
          isActive={activeTabId === 'audit-trail'} 
          onClick={() => openTab({ id: 'audit-trail', portalId: 'SETTINGS', title: 'Audit Trail', component: 'audit-trail' })}
          title="System Audit Trail"
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<DatabaseZap />} 
          isActive={activeTabId === 'system-dev-tools'} 
          onClick={() => openTab({ id: 'system-dev-tools', portalId: 'SETTINGS', title: 'Master Data Admin', component: 'system-dev-tools' })}
          title="Master Data Admin"
          colorClass="text-slate-400"
        />
      </PortalSidebar>

      <PortalCanvas componentMap={SETTINGS_COMPONENTS} user={user} onLogout={onLogout} />
    </div>
  );
}

