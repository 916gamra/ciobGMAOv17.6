import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Bell, AlertCircle, AlertTriangle, Info, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotificationsContext, Notification } from '@/shared/context/NotificationContext';
import { cn } from '@/shared/utils';

export const NotificationHub = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotificationsContext();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-cyan-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
        case 'critical': return 'border-l-rose-500/60';
        case 'warning': return 'border-l-amber-500/60';
        default: return 'border-l-cyan-500/60';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '110%', opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '110%', opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-6 top-[8%] bottom-[8%] w-[320px] bg-black/45 backdrop-blur-[40px] border border-white/10 z-[101] flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] rounded-[2.5rem] overflow-hidden font-sans"
          >
            {/* Glossy Overlay Reflect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
            
            {/* Bottom Atmospheric Glow */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="p-5 pb-4 border-b border-white/[0.08] flex items-center justify-between relative bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_10px_20px_-5px_rgba(245,158,11,0.2)] group">
                  <Bell className="w-4 h-4 text-amber-500 group-hover:rotate-[15deg] transition-transform duration-500" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-[0.25em] leading-none mb-0.5 font-sans">Signal</h2>
                  <p className="text-[8px] font-bold text-amber-500/60 uppercase tracking-widest font-sans">Active nodes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={onClose} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all transform hover:rotate-90 border border-white/5"
                >
                  <X className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{notifications.length} Logs Detected</span>
                <button onClick={markAllAsRead} className="text-[8px] font-bold text-slate-400 hover:text-amber-500 transition-colors uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg border border-white/5">Flush</button>
              </div>

              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-20">
                  <div className="w-16 h-16 rounded-full border border-dashed border-white/30 flex items-center justify-center mb-4 text-slate-400">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.4em] uppercase">Void Stream</p>
                </div>
              ) : (
                notifications.map((n, idx) => {
                  const isExpanded = expandedId === n.id;
                  return (
                    <motion.div 
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: idx * 0.03 } }}
                      onClick={() => {
                        setExpandedId(isExpanded ? null : n.id);
                        if (!n.isRead) markAsRead(n.id);
                      }}
                      className={cn(
                          "px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 border-l-4 flex flex-col gap-2 transition-all hover:bg-white/[0.05] relative overflow-hidden group cursor-pointer",
                          getBorderColor(n.type),
                          n.isRead && "opacity-40 grayscale-[0.2]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">{getIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-[11px] text-white tracking-tight leading-tight block truncate group-hover:text-amber-500/80 transition-colors italic">
                            {n.title}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-white/5 mt-1">
                              {n.message}
                            </p>
                            <div className="flex justify-between items-center pt-3 mt-1">
                              <span className="text-[8px] uppercase font-black text-slate-600 tracking-[0.2em]">{n.source}</span>
                              <div className="flex gap-2 items-center">
                                {n.action && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); n.action?.onClick(); }} 
                                    className="text-[9px] font-bold text-amber-500 hover:text-white bg-amber-500/10 hover:bg-amber-600 px-3 py-1 rounded-lg transition-all uppercase tracking-tight border border-amber-500/20"
                                  >
                                    {n.action.label}
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }} 
                                  className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors bg-white/5 rounded-lg"
                                  title="Dismiss"
                                >
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
            
            <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.3em]">Titanic Sec Core</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
