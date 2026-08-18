import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOsStore } from '../store/useOsStore';
import { useTabStore, type PortalType } from '../store';
import { Home, Settings as SettingsIcon, LogOut, User as UserIcon, Bell, Box, ShieldCheck, PieChart, Network, Factory, Wrench } from 'lucide-react';
import type { User } from '@/core/db';
import { cn } from '@/shared/utils';
import { hasPortalAccess } from '@/core/permissions';
import { useNotificationsContext } from '@/shared/context/NotificationContext';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/app/store/useLanguageStore';
import { Languages } from 'lucide-react';

// --- PORTAL NAVIGATION CONFIGURATION ---
const PORTALS = [
  { id: 'PDR' as PortalType, title: 'PDR Engine', icon: Box, color: 'text-cyan-400', bgHover: 'hover:bg-cyan-500/10' },
  { id: 'PREVENTIVE' as PortalType, title: 'Maintenance', icon: ShieldCheck, color: 'text-emerald-400', bgHover: 'hover:bg-emerald-500/10' },
  { id: 'CORRECTIVE' as PortalType, title: 'Corrective Ops', icon: Wrench, color: 'text-orange-400', bgHover: 'hover:bg-orange-500/10' },
  { id: 'ORGANIZATION' as PortalType, title: 'Part Catalog', icon: Network, color: 'text-amber-400', bgHover: 'hover:bg-amber-500/10' },
  { id: 'FACTORY' as PortalType, title: 'Factory Admin', icon: Factory, color: 'text-indigo-400', bgHover: 'hover:bg-indigo-500/10' },
  { id: 'ANALYTICS' as PortalType, title: 'Analytics Hub', icon: PieChart, color: 'text-fuchsia-400', bgHover: 'hover:bg-fuchsia-500/10' },
  { id: 'SETTINGS' as PortalType, title: 'System Config', icon: SettingsIcon, color: 'text-slate-300', bgHover: 'hover:bg-slate-500/10' }
];

export function GlobalDock({ user, onLogout, onToggleNotifications }: { user: User | null, onLogout: () => void, onToggleNotifications: () => void }) {
  const { t } = useTranslation();
  const { language, cycleLanguage } = useLanguageStore();
  const { activePortal, setPortal } = useOsStore();
  const { clearTabs } = useTabStore();
  const { notifications, unreadCount, getUnreadCountByPortal } = useNotificationsContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Find the highest severity for badge coloring
  const dominantSeverity = React.useMemo(() => {
    if (notifications.some(n => !n.isRead && n.type === 'critical')) return 'critical';
    if (notifications.some(n => !n.isRead && n.type === 'warning')) return 'warning';
    return 'info';
  }, [notifications]);

  const getBadgeStyles = () => {
    switch (dominantSeverity) {
      case 'critical': return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse';
      case 'warning': return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
      default: return 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]';
    }
  };

  const workspaceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWorkspaceEnter = () => {
    if (workspaceTimeout.current) clearTimeout(workspaceTimeout.current);
    setIsWorkspaceMenuOpen(true);
  };

  const handleWorkspaceLeave = () => {
    workspaceTimeout.current = setTimeout(() => {
      setIsWorkspaceMenuOpen(false);
    }, 150);
  };

  // Close on Escape or Click Outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Return to launchpad action
  const handleGoHome = () => {
    setPortal('HOME');
    setIsWorkspaceMenuOpen(false);
  };

  const handleOpenSettings = () => {
    setPortal('SETTINGS');
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  return (
    <div ref={menuRef} className="absolute top-[2px] right-2 md:top-[4px] md:right-4 z-[9999] flex flex-col items-end gap-2">
      {/* The Dock Core Action Bar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex items-center gap-2 p-1 md:p-1.5 rounded-[1.25rem] glass-panel-heavy"
      >
        {activePortal !== 'HOME' && (
          <div 
            className="relative group"
            onMouseEnter={handleWorkspaceEnter}
            onMouseLeave={handleWorkspaceLeave}
          >
            <button 
              onClick={handleGoHome}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider h-[32px] md:h-[36px]"
              title={t('general.welcome')}
            >
              <Home className="w-4 h-4 md:w-4 md:h-4" />
              <span className="max-w-0 overflow-hidden sm:max-w-[120px] transition-all duration-300 whitespace-nowrap">{t('dock.quickActions', 'Workspace')}</span>
            </button>
            
            <AnimatePresence>
              {isWorkspaceMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-10 right-0 w-64 glass-panel-heavy rounded-2xl p-2 flex flex-col shadow-2xl z-[1000] border border-white/5"
                >
                  <div className="px-3 py-2 mb-1 border-b border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Active Portals</span>
                  </div>
                  {PORTALS.filter(p => p.id !== activePortal && hasPortalAccess(user, p.id)).map(portal => (
                    <button
                      key={portal.id}
                      onClick={() => {
                        setPortal(portal.id);
                        setIsWorkspaceMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 group/item",
                        portal.bgHover
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <portal.icon className={cn("w-4 h-4 transition-transform group-hover/item:scale-110", portal.color)} />
                        <span className="text-sm font-medium text-white/80 group-hover/item:text-white transition-colors">
                          {t(`portals.${portal.id.toLowerCase()}`, portal.title)}
                        </span>
                      </div>
                      {getUnreadCountByPortal(portal.id) > 0 && (
                        <span className={cn(
                          "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shadow-[0_0_10px_rgba(currentColor,0.3)] bg-white/10 border border-white/20",
                          portal.color
                        )}>
                          {getUnreadCountByPortal(portal.id)}
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Separator if not home */}
        {activePortal !== 'HOME' && <div className="w-px h-5 bg-white/10 mx-1 md:mx-2" />}

        {/* Notification Bell */}
        <button 
          onClick={onToggleNotifications}
          className="relative p-2 md:p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all group"
          title="Notifications"
        >
          <Bell className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black text-white border border-black/20",
                getBadgeStyles()
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </button>

        {/* User Bubble */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            "relative w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-xl flex items-center justify-center text-xs md:text-sm font-bold shadow-lg ring-2 ring-transparent transition-all duration-300", 
            user?.color ? user.color : 'bg-gray-700',
            isMenuOpen ? 'ring-white/50 scale-95' : 'hover:ring-white/20 hover:scale-105'
          )}
          title={user?.name}
        >
          {user?.initials || <UserIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />}
          {user?.isPrimary && (
            <div className="absolute -top-1 -right-1 w-3 h-3 md:w-3.5 md:h-3.5 bg-amber-400 rounded-full border-2 border-[#121216]"></div>
          )}
        </button>
      </motion.div>

      {/* Floating Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-64 glass-panel-heavy rounded-2xl p-2 flex flex-col mt-1 origin-top-right shadow-2xl"
          >
            <div className="p-4 border-b border-white/10 mb-2 bg-white/5 rounded-xl">
              <h3 className="text-white font-bold text-sm truncate">{user?.name || 'Guest'}</h3>
              <p className="text-white/50 text-[10px] uppercase tracking-widest mt-1">{user?.role || 'No Role'}</p>
            </div>

            <button 
              onClick={cycleLanguage}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <Languages className="w-4 h-4 text-cyan-400" />
              {t('dock.language', 'Language')} ({language})
            </button>
            
            {hasPortalAccess(user, 'SETTINGS') && (
              <button 
                onClick={handleOpenSettings}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <SettingsIcon className="w-4 h-4" />
                {t('portals.system')}
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 mt-1 text-left text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              {t('action.logout')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
