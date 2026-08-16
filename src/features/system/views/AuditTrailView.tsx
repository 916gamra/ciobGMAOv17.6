import { PageHeader } from "@/shared/components/PageHeader";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { GlassCard } from '@/shared/components/GlassCard';
import { useAuditTrail } from '../hooks/useAuditTrail';
import { 
  Search, 
  Trash2, 
  Calendar, 
  Activity, 
  Info, 
  AlertTriangle, 
  AlertOctagon,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { EmptyState } from '@/shared/components/EmptyState';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function AuditTrailView() {
  const { logs, clearLogs } = useAuditTrail();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
      
      return matchesSearch && matchesSeverity;
    });
  }, [logs, searchTerm, severityFilter]);

  const exportLogsAsCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Severity', 'Details'];
    const rows = filteredLogs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.userName,
      l.action,
      l.entityType,
      l.severity,
      l.details.replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': 
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-rose-500/30 bg-rose-500/10 text-[10px] uppercase text-rose-400 font-bold tracking-wider whitespace-nowrap shadow-sm">
            <AlertOctagon className="w-3 h-3" /> Critical
          </div>
        );
      case 'WARNING': 
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-[10px] uppercase text-amber-400 font-bold tracking-wider whitespace-nowrap shadow-sm">
            <AlertTriangle className="w-3 h-3" /> Warning
          </div>
        );
      default: 
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-cyan-500/20 bg-cyan-500/5 text-[10px] uppercase text-cyan-500 font-bold tracking-wider whitespace-nowrap shadow-sm">
            <Info className="w-3 h-3" /> Info
          </div>
        );
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 w-full lg:px-8"
    >
      <PageHeader
        title="System Audit Trail"
        subtitle="Immutable cryptographic log of critical system operations and transactions."
        icon={<RefreshCw className="w-6 h-6 text-slate-400" />}
        actions={
          <>
            <button 
               onClick={exportLogsAsCSV}
               className="titan-button titan-button-outline"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button 
               onClick={clearLogs}
               className="titan-button titan-button-danger"
            >
              <Trash2 className="w-4 h-4" /> Clear Logs
            </button>
          </>
        }
      />

      {/* Stats Quick Look */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
         <motion.div variants={itemVariants}>
           <GlassCard className="h-full p-5 bg-white/[0.06] border border-white/10 flex flex-col justify-between group rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#0a0a0f]/40 border border-white/5 shadow-inner">
                   <Activity className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Events</span>
              </div>
              <div className="text-3xl font-semibold text-slate-200 tabular-nums">{logs.length}</div>
           </GlassCard>
         </motion.div>
         <motion.div variants={itemVariants}>
           <GlassCard className="h-full p-5 bg-rose-500/[0.08] border border-rose-500/30 flex flex-col justify-between group rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#0a0a0f]/40 border border-white/5 shadow-inner">
                   <AlertOctagon className="w-5 h-5 text-rose-500" />
                </div>
                <span className="text-xs font-bold text-rose-500/80 uppercase tracking-wider">Critical Alerts</span>
              </div>
              <div className="text-3xl font-semibold text-rose-500 tabular-nums">{logs.filter(l => l.severity === 'CRITICAL').length}</div>
           </GlassCard>
         </motion.div>
         <motion.div variants={itemVariants}>
           <GlassCard className="h-full p-5 bg-amber-500/[0.08] border border-amber-500/30 flex flex-col justify-between group rounded-2xl shadow-xl backdrop-blur-md">
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#0a0a0f]/40 border border-white/5 shadow-inner">
                   <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-xs font-bold text-amber-500/80 uppercase tracking-wider">Warnings</span>
              </div>
              <div className="text-3xl font-semibold text-amber-500 tabular-nums">{logs.filter(l => l.severity === 'WARNING').length}</div>
           </GlassCard>
         </motion.div>
         <motion.div variants={itemVariants}>
           <GlassCard className="h-full p-5 bg-cyan-500/[0.08] border border-cyan-500/30 flex flex-col justify-between group rounded-2xl shadow-xl backdrop-blur-md">
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#0a0a0f]/40 border border-white/5 shadow-inner">
                   <Info className="w-5 h-5 text-cyan-500" />
                </div>
                <span className="text-xs font-bold text-cyan-500/80 uppercase tracking-wider">Info Stream</span>
              </div>
              <div className="text-3xl font-semibold text-cyan-500 tabular-nums">{logs.filter(l => l.severity === 'INFO').length}</div>
           </GlassCard>
         </motion.div>
      </div>

      <motion.div variants={itemVariants} className="flex flex-col bg-[#0a0a0f]/60 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative backdrop-blur-xl">
        <div className="p-5 border-b border-white/[0.08] bg-[#0a0a0f]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shrink-0">
          <div className="flex items-center gap-3">
             <Filter className="w-4 h-4 text-slate-400" />
             <div className="flex bg-[#0a0a0f]/60 p-1 rounded-xl border border-white/20 shrink-0 shadow-inner relative z-10">
                {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      severityFilter === sev 
                       ? "bg-white/10 text-white shadow-sm" 
                       : "text-slate-500 hover:text-white/80"
                    )}
                  >
                    {sev}
                  </button>
                ))}
            </div>
          </div>
          <div className="relative group flex-1 md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-slate-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search users, operations, or entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0f]/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto bg-transparent flex-1">
          <table dir="ltr" className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
            <thead className="sticky top-0 bg-transparent/90 backdrop-blur-md z-20 border-b border-white/[0.05]">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Timestamp</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">User Identity</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Operation</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Target Entity</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-full">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              <AnimatePresence mode="popLayout">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <EmptyState 
                        icon={Activity}
                        title="No matching audit logs found"
                        description="Try adjusting your filter query or search term to view older audit trail records."
                        color="cyan"
                        className="py-16 opacity-80"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <motion.tr 
                      key={log.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.01, 0.2) }}
                      className="group hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-blue-300 transition-colors">
                          <Calendar className="w-3.5 h-3.5 opacity-50" />
                          {new Date(log.timestamp).toLocaleString([], { hour12: false, year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white bg-slate-800 border border-slate-700 shadow-inner">
                             {log.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-slate-200">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md shadow-sm">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="text-blue-400 font-medium">{log.entityType}</span>
                            <span className="text-[10px] opacity-40">[{log.entityId.substring(0,8).toUpperCase()}]</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex justify-between items-center gap-4 w-full">
                           <div className="text-xs text-slate-500 truncate max-w-lg group-hover:text-slate-300 transition-colors">
                              {log.details}
                           </div>
                           {getSeverityBadge(log.severity)}
                         </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
