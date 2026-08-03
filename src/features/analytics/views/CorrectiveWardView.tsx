import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, TrendingDown, Clock, AlertOctagon, Wrench, Component as ComponentIcon, Activity, AlertTriangle, ShieldCheck, History, X } from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { cn, EMPTY_ARRAY } from '@/shared/utils';
import { useTabStore } from '@/app/store';
import { useOsStore } from '@/app/store/useOsStore';

export function CorrectiveWardView() {
  const data = useLiveQuery(async () => {
    const [allExecutions, machines, standardComponents, standardActions] = await Promise.all([
      db.taskExecutions.toArray(),
      db.machines.toArray(),
      db.standardComponents.toArray(),
      db.standardActions.toArray(),
    ]);
    return { allExecutions, machines, standardComponents, standardActions };
  }, []);

  const allExecutions = data?.allExecutions ?? EMPTY_ARRAY;
  const machines = data?.machines ?? EMPTY_ARRAY;
  const standardComponents = data?.standardComponents ?? EMPTY_ARRAY;
  const standardActions = data?.standardActions ?? EMPTY_ARRAY;
  
  const setPortal = useOsStore(state => state.setPortal);
  const openTab = useTabStore(state => state.openTab);

  const handleStrengthenPlan = () => {
    openTab({ id: 'engineering-lab', portalId: 'FACTORY', title: 'Engineering Lab', component: 'engineering-lab' });
    setPortal('FACTORY');
  };

  const [lifeHistoryComponentId, setLifeHistoryComponentId] = useState<string | null>(null);

  // Time scope: current month (simplified for now, ideally parameterized)
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Filter to CORR actions in the current timeframe
  const correctiveExecutions = useMemo(() => {
    return allExecutions.filter(ex => {
      if (ex.serviceType !== 'CORR' && ex.status === 'COMPLETED') return false; 
      // some might not have serviceType but ARE corrective if it's a repair... let's rely on serviceType from unified entry
      if (ex.serviceType !== 'CORR') return false;
      const exDate = new Date(ex.executedAt || ex.scheduledDate).getTime();
      return exDate >= currentMonthStart;
    });
  }, [allExecutions, currentMonthStart]);

  // KPIs
  const totalBreakdowns = correctiveExecutions.length;
  
  const totalDowntimeMinutes = correctiveExecutions.reduce((acc, ex) => acc + (ex.durationMinutes || 0), 0);
  const mttrMinutes = totalBreakdowns > 0 ? Math.round(totalDowntimeMinutes / totalBreakdowns) : 0;

  // By family analysis
  const familyStats = useMemo((): Record<string, {count: number, totalTime: number}> => {
    const stats: Record<string, { count: number, totalTime: number }> = {};
    correctiveExecutions.forEach(ex => {
      const comp = standardComponents.find(c => c.id === ex.componentId);
      const fam = comp?.family || 'UNKNOWN';
      if (!stats[fam]) stats[fam] = { count: 0, totalTime: 0 };
      stats[fam].count += 1;
      stats[fam].totalTime += (ex.durationMinutes || 0);
    });
    return stats;
  }, [correctiveExecutions, standardComponents]);

  // Bad Actors (Top 5 Offenders)
  const badActors = useMemo(() => {
    const counts: Record<string, { count: number, totalTime: number, id: string }> = {};
    correctiveExecutions.forEach(ex => {
      if (!ex.componentId) return;
      if (!counts[ex.componentId]) counts[ex.componentId] = { count: 0, totalTime: 0, id: ex.componentId };
      counts[ex.componentId].count += 1;
      counts[ex.componentId].totalTime += (ex.durationMinutes || 0);
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count || b.totalTime - a.totalTime)
      .slice(0, 5);
  }, [correctiveExecutions]);

  return (
    <div className="flex flex-col h-full bg-[#050505] p-6 text-slate-200 relative overflow-hidden custom-scrollbar">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
         <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] bg-red-900/10 blur-[120px] mix-blend-screen rounded-full" />
         <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-amber-900/10 blur-[120px] mix-blend-screen rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-10">
        
        {/* Header */}
        <PageHeader
          title="Corrective Ward"
          subtitle="Sovereign Diagnostics & Emergency Analytics"
          icon={<AlertOctagon className="w-8 h-8 text-rose-500" />}
          badgeColor="rose"
          actions={
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl relative overflow-hidden group shadow-lg">
              <div className="absolute inset-0 bg-rose-500/20 animate-pulse pointer-events-none" />
              <Activity className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-rose-100 uppercase tracking-widest">Live Monitoring</span>
            </div>
          }
        />

        {/* High-Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="bg-black/60 border-red-500/20 p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
               <AlertOctagon className="w-4 h-4 text-red-500" /> Total Breakdowns
             </h3>
             <p className="text-5xl font-black text-white">{totalBreakdowns}</p>
             <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">Current Month Active Interventions</p>
          </GlassCard>

          <GlassCard className="bg-black/60 border-amber-500/20 p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
               <Activity className="w-4 h-4 text-amber-500" /> M.T.T.R (Global)
             </h3>
             <p className="text-5xl font-black text-white">
               {mttrMinutes > 60 ? (mttrMinutes / 60).toFixed(1) : mttrMinutes}
               <span className="text-2xl text-amber-500/50 ml-2">{mttrMinutes > 60 ? 'hrs' : 'min'}</span>
             </p>
             <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">Mean Time To Repair</p>
          </GlassCard>

          <GlassCard className="bg-black/60 border-purple-500/20 p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
               <TrendingDown className="w-4 h-4 text-purple-500" /> Total Downtime
             </h3>
             <p className="text-5xl font-black text-white">
               {Math.floor(totalDowntimeMinutes / 60)}
               <span className="text-2xl text-purple-500/50 ml-2">hrs</span>
             </p>
             <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">Production Hours Lost</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List: Bad Actors */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4" /> The Bad-Actors Radar (Top 5 Offenders)
            </h2>
            
            <div className="flex flex-col gap-3">
              {badActors.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic bg-white/[0.01] border border-white/5 rounded-2xl">
                   No significant breakdowns recorded this period. Plant is operational.
                </div>
              ) : (
                badActors.map((actor, idx) => {
                  const comp = standardComponents.find(c => c.id === actor.id);
                  const isTop = idx === 0;
                  return (
                    <motion.div 
                      key={actor.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all",
                        isTop ? "bg-red-950/20 border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.1)]" : "bg-black/40 border-white/5 hover:border-white/10"
                      )}
                    >
                      {/* Crimson Pulse for Top Offender */}
                      {isTop && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 rounded-l-2xl animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                      )}

                      <div className="flex-1 flex gap-4 items-center pl-2">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                          isTop ? "bg-red-500/20 border-red-500/40" : "bg-white/5 border-white/10"
                        )}>
                          <AlertOctagon className={cn("w-6 h-6", isTop ? "text-red-500" : "text-amber-500/80")} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white uppercase tracking-wide">{comp?.name || 'Unknown Component'}</h3>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase">{comp?.family || 'UNKN'}</span>
                             <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                               <Wrench className="w-3 h-3" /> {actor.count} Failures
                             </span>
                             <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                               <Clock className="w-3 h-3" /> {Math.round(actor.totalTime / actor.count)} min avg MTTR
                             </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
                        <button 
                          onClick={() => setLifeHistoryComponentId(actor.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-widest border border-indigo-500/20 transition-colors whitespace-nowrap"
                        >
                          <History className="w-4 h-4" /> Sovereign Audit
                        </button>
                        <button 
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all whitespace-nowrap group"
                          onClick={() => handleStrengthenPlan()}
                        >
                          <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" /> Strengthen Preventive Plan
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side: MTTR per family breakdown */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2 font-mono flex items-center gap-2">
              <Activity className="w-4 h-4" /> MTTR By Family
            </h2>
            <div className="flex flex-col gap-3">
               {Object.entries(familyStats).map(([fam, st]: [string, any]) => {
                 const avg = st.count > 0 ? Math.round(st.totalTime / st.count) : 0;
                 return (
                   <div key={fam} className="bg-black/40 border border-white/5 rounded-xl p-4">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{fam}</span>
                       <span className="text-[10px] font-mono text-slate-500">{st.count} incidents</span>
                     </div>
                     <div className="flex items-end gap-2">
                       <span className="text-2xl font-black text-amber-400">{avg}</span>
                       <span className="text-[10px] text-amber-400/50 uppercase tracking-widest font-mono mb-1">min/repair</span>
                     </div>
                   </div>
                 )
               })}
               {Object.keys(familyStats).length === 0 && (
                 <p className="text-[11px] text-slate-500 italic p-4 text-center">No data available</p>
               )}
            </div>
          </div>
        </div>

      </div>

      {/* Sovereign Life History Modal */}
      <AnimatePresence>
        {lifeHistoryComponentId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLifeHistoryComponentId(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative bg-[#0a0a0f] border border-red-500/20 p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest font-mono flex items-center gap-2">
                    <History className="w-6 h-6 text-red-500" /> Component Sovereign Timeline
                  </h2>
                  <p className="text-xs text-red-400/60 mt-1 uppercase tracking-wider font-mono">Cross-Factory Audit History</p>
                </div>
                <button onClick={() => setLifeHistoryComponentId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const comp = standardComponents.find(c => c.id === lifeHistoryComponentId);
                const execs = allExecutions.filter(e => e.componentId === lifeHistoryComponentId).sort((a,b) => new Date(b.executedAt || b.scheduledDate).getTime() - new Date(a.executedAt || a.scheduledDate).getTime());
                return (
                  <div className="space-y-6">
                    <div className="p-5 bg-gradient-to-r from-red-950/30 to-amber-950/30 border border-red-500/20 rounded-2xl flex justify-between items-center shadow-[inset_0_0_20px_rgba(220,38,38,0.05)]">
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-widest">{comp?.name || 'Unknown Component'}</h3>
                        <p className="text-[11px] text-red-200/50 uppercase font-mono mt-1 tracking-widest">Total Interventions Recorded: {execs.length}</p>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                        <Activity className="w-7 h-7 text-red-400" />
                      </div>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                      {execs.length === 0 ? (
                        <p className="text-sm text-slate-500 italic text-center py-10 relative z-10">No service records found across the industrial floor for this Component.</p>
                      ) : (
                        execs.map(ex => {
                          const machine = machines.find(m => m.id === ex.machineId);
                          const action = standardActions.find(a => a.id === ex.actionId);
                          const isCorr = ex.serviceType === 'CORR';
                          return (
                            <div key={ex.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              {/* Central Node */}
                              <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-[#0a0a0f] absolute left-0 md:left-1/2 -translate-x-1/2 -translate-y-4 md:translate-y-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                                isCorr ? "bg-red-500" : "bg-emerald-500"
                              )}>
                                {isCorr ? <AlertOctagon className="w-3 h-3 text-white" /> : <ShieldCheck className="w-3 h-3 text-emerald-950" />}
                              </div>
                              
                              <div className="w-full md:w-[calc(50%-2rem)] p-5 rounded-2xl bg-black/60 border border-white/5 ml-8 md:ml-0 group-hover:border-white/20 transition-all hover:bg-black/80">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={cn(
                                    "text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest border",
                                    isCorr ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  )}>
                                    {isCorr ? 'Corrective Surgery' : 'Preventive Care'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono tracking-widest">{ex.executedAt ? new Date(ex.executedAt).toLocaleString() : 'Pending'}</span>
                                </div>
                                <h4 className="text-base font-bold text-white mt-1 uppercase tracking-wide">
                                  <span className={isCorr ? 'text-red-400' : 'text-emerald-400'}>{action?.name || ex.taskId}</span>
                                </h4>
                                <div className="mt-2 text-xs text-slate-400 font-mono border-l-2 border-white/10 pl-3 leading-relaxed">
                                  "{ex.notes || 'No extensive notes provided.'}"
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-end">
                                  <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">Target Host</span>
                                    <span className="block text-xs font-mono font-black text-indigo-400">{machine?.referenceCode || 'System Unlinked'}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">Downtime</span>
                                    <span className="block text-xs font-mono font-black text-slate-300">{ex.durationMinutes} min</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
