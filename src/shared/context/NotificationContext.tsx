import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type NotificationType = 'critical' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  source: string; // e.g., 'PDR Engine', 'Procurement'
  portal?: string; // The ID of the portal this relates to, e.g., 'PDR', 'PROCUREMENT', 'PREVENTIVE'
  action?: {
    label: string;
    onClick: () => void;
  };
  isRead: boolean;
  createdAt: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  getUnreadCountByPortal: (portal: string) => number;
  addNotification: (n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const getUnreadCountByPortal = useCallback((portal: string) => {
    return notifications.filter(n => !n.isRead && n.portal === portal).length;
  }, [notifications]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    setNotifications(prev => [
      { ...n, id: crypto.randomUUID(), isRead: false, createdAt: Date.now() },
      ...prev
    ]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    getUnreadCountByPortal,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification
  }), [notifications, unreadCount, getUnreadCountByPortal, addNotification, markAsRead, markAllAsRead, removeNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationsContext must be used within NotificationProvider');
  return context;
};
