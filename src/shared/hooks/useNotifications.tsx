import React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotificationsContext, NotificationType } from '@/shared/context/NotificationContext';
import { cn } from '@/shared/utils';

export const useNotifications = () => {
  const { addNotification } = useNotificationsContext();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-cyan-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
  };

  const notify = (
    type: NotificationType, 
    title: string, 
    description?: string, 
    portal?: string, 
    source: string = 'System', 
    action?: { label: string; onClick: () => void }
  ) => {
    
    // Add to Global Notification Hub
    addNotification({
        type,
        title,
        message: description || '',
        source,
        portal,
        action
    });

    // Create Toast
    const icon = getIcon(type);
    const borderLeft = type === 'critical' ? '4px solid #f43f5e' 
                     : type === 'warning' ? '4px solid #f59e0b'
                     : '4px solid #06b6d4'; // default info
                     
    const sonnerFn = type === 'critical' ? toast.error : type === 'warning' ? toast.warning : toast.info;

    sonnerFn(title, {
      description,
      duration: type === 'critical' ? 8000 : 4000,
      icon,
      style: { borderLeft },
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined
    });
  };

  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      style: { borderLeft: '4px solid #10b981' },
    });
  };
  
  const showError = (message: string, description?: string) => {
    notify('critical', message, description);
  };
  
  const showWarning = (message: string, description?: string) => {
    notify('warning', message, description);
  };

  const showInfo = (message: string, description?: string) => {
    notify('info', message, description);
  };
  
  return { showSuccess, showError, showWarning, showInfo, notify };
};
