import React, { useEffect } from 'react';
import { Settings, Shield, Users, HardDriveDownload, ShieldAlert, DatabaseZap, ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { SecurityDashboardView } from '../views/SecurityDashboardView';

const SETTINGS_COMPONENTS = {
  'user-management': UserManagementView,
  'data-exchange': DataExchangeView,
  'data-core': DataCoreView,
  'security-policies': SecurityPoliciesView,
  'audit-trail': AuditTrailView,
  'system-dev-tools': SystemSettingsView,
  'security-dashboard': SecurityDashboardView,
};

export function SystemSettingsLayout({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { tabs, openTab } = useTabStore();

  const currentTab = tabs.find(t => t.portalId === 'SETTINGS');
  const activeTabId = currentTab?.id;

  useEffect(() => {
    if (!currentTab) {
      openTab({ 
        id: 'user-management', 
        portalId: 'SETTINGS', 
        title: isAr ? 'إدارة المستخدمين' : 'User Management', 
        component: 'user-management' 
      });
    }
  }, [currentTab, openTab, isAr]);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <PortalSidebar 
        portalName={isAr ? 'إعدادات النظام' : 'System Config'}
        portalIcon={<Settings />}
        glowColor="slate"
        colorClass="text-slate-300 bg-slate-500/20"
        borderClass="border-slate-500/30"
        textClass="text-slate-300"
      >
        <PortalSidebarItem 
          icon={<Users />} 
          isActive={activeTabId === 'user-management'} 
          onClick={() => openTab({ 
            id: 'user-management', 
            portalId: 'SETTINGS', 
            title: isAr ? 'إدارة المستخدمين' : 'User Management', 
            component: 'user-management' 
          })}
          title={isAr ? 'إدارة المستخدمين' : 'User Management'}
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<ArrowRightLeft />} 
          isActive={activeTabId === 'data-exchange'} 
          onClick={() => openTab({ 
            id: 'data-exchange', 
            portalId: 'SETTINGS', 
            title: isAr ? 'مركز تبادل البيانات' : 'Data Exchange Hub', 
            component: 'data-exchange' 
          })}
          title={isAr ? 'مركز تبادل البيانات' : 'Data Exchange Hub'}
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<HardDriveDownload />} 
          isActive={activeTabId === 'data-core'} 
          onClick={() => openTab({ 
            id: 'data-core', 
            portalId: 'SETTINGS', 
            title: isAr ? 'النسخ الاحتياطي' : 'Database Backup', 
            component: 'data-core' 
          })}
          title={isAr ? 'النسخ الاحتياطي' : 'Database Backup'}
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<Shield />} 
          isActive={activeTabId === 'security-policies'} 
          onClick={() => openTab({ 
            id: 'security-policies', 
            portalId: 'SETTINGS', 
            title: isAr ? 'سياسات الأمان' : 'Security Policies', 
            component: 'security-policies' 
          })}
          title={isAr ? 'سياسات الأمان' : 'Security Policies'}
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<ShieldAlert />} 
          isActive={activeTabId === 'audit-trail'} 
          onClick={() => openTab({ 
            id: 'audit-trail', 
            portalId: 'SETTINGS', 
            title: isAr ? 'سجل التدقيق الرقمي' : 'System Audit Trail', 
            component: 'audit-trail' 
          })}
          title={isAr ? 'سجل التدقيق الرقمي' : 'System Audit Trail'}
          colorClass="text-slate-400"
        />
        <PortalSidebarItem 
          icon={<Shield />} 
          isActive={activeTabId === 'security-dashboard'} 
          onClick={() => openTab({ 
            id: 'security-dashboard', 
            portalId: 'SETTINGS', 
            title: isAr ? 'منظومة الحماية الشاملة' : 'Military Security Suite', 
            component: 'security-dashboard' 
          })}
          title={isAr ? 'منظومة الحماية الشاملة' : 'Military Security Suite'}
          colorClass="text-cyan-400"
        />
        <PortalSidebarItem 
          icon={<DatabaseZap />} 
          isActive={activeTabId === 'system-dev-tools'} 
          onClick={() => openTab({ 
            id: 'system-dev-tools', 
            portalId: 'SETTINGS', 
            title: isAr ? 'إدارة البيانات الرئيسية' : 'Master Data Admin', 
            component: 'system-dev-tools' 
          })}
          title={isAr ? 'إدارة البيانات الرئيسية' : 'Master Data Admin'}
          colorClass="text-slate-400"
        />
      </PortalSidebar>

      <PortalCanvas componentMap={SETTINGS_COMPONENTS} user={user} onLogout={onLogout} />
    </div>
  );
}

