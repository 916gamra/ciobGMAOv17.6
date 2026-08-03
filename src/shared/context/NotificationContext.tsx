import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getUnreadCountByPortal = (portal: string) => {
    return notifications.filter(n => !n.isRead && n.portal === portal).length;
  };

  const addNotification = (n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    setNotifications(prev => [
      { ...n, id: crypto.randomUUID(), isRead: false, createdAt: Date.now() },
      ...prev
    ]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, getUnreadCountByPortal, addNotification, markAsRead, markAllAsRead, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationsContext must be used within NotificationProvider');
  return context;
};
