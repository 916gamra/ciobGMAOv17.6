import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingDown, Clock, AlertOctagon, Wrench, Activity, AlertTriangle, ShieldCheck, History, X, Sparkles } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCompact } from '@/shared/components/StatCompact';
import { cn, EMPTY_ARRAY } from '@/shared/utils';
import { useTabStore } from '@/app/store';
import { useOsStore } from '@/app/store/useOsStore';
import { useTranslation } from 'react-i18next';

export function CorrectiveWardView() {
  const { t } = useTranslation();
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
    openTab({ id: 'engineering-lab', portalId: 'FACTORY', title: 'المختبر الهندسي', component: 'engineering-lab' });
    setPortal('FACTORY');
  };

  const [lifeHistoryComponentId, setLifeHistoryComponentId] = useState<string | null>(null);

  // Time scope: current month (simplified for now)
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Filter to CORR actions in the current timeframe
  const correctiveExecutions = useMemo(() => {
    return allExecutions.filter(ex => {
      if (ex.serviceType !== 'CORR' && ex.status === 'COMPLETED') return false; 
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
      const fam = comp?.family || 'عام';
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
    <div className="flex flex-col h-full bg-[#050505] p-6 text-slate-200 relative overflow-hidden custom-scrollbar font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
         <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] bg-red-900/10 blur-[120px] mix-blend-screen rounded-full" />
         <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-amber-900/10 blur-[120px] mix-blend-screen rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-10">
        
        {/* Header Cockpit with Integrated Compact Stats */}
        <PageHeader
          title={t('corrective.ward.title', 'جناح التحليل العلاجي والتشخيص الطارئ')}
          subtitle={t('corrective.ward.subtitle', 'تحليل الأعطال وتحديد المكونات الأكثر تسبباً في توقف خطوط الإنتاج لبناء الشجرة الفنية الوقائية.')}
          icon={<AlertOctagon className="w-8 h-8 text-rose-500" />}
          badgeColor="rose"
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <StatCompact 
                icon={<AlertOctagon className="w-4 h-4 text-rose-400" />} 
                label={t('corrective.ward.totalBreakdowns', 'إجمالي الأعطال')} 
                value={totalBreakdowns.toString()} 
              />
              <StatCompact 
                icon={<Clock className="w-4 h-4 text-amber-400" />} 
                label={t('corrective.ward.avgMttr', 'متوسط زمن الإصلاح')} 
                value={mttrMinutes > 60 ? `${(mttrMinutes / 60).toFixed(1)} س` : `${mttrMinutes} د`} 
              />
              <StatCompact 
                icon={<TrendingDown className="w-4 h-4 text-purple-400" />} 
                label={t('corrective.ward.totalDowntime', 'إجمالي ساعات التوقف')} 
                value={`${Math.floor(totalDowntimeMinutes / 60)} س`} 
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl relative overflow-hidden shadow-md">
                <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">{t('corrective.ward.liveMonitoring', 'مراقبة حية')}</span>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List: Bad Actors */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-rose-400 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4" /> رادار المكونات الأكثر تسبباً بالأعطال
            </h2>
            
            <div className="flex flex-col gap-3">
              {badActors.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-[#0a0a0f]/40 border border-white/10 rounded-2xl backdrop-blur-xl">
                  لا توجد أعطال متكررة مسجلة خلال هذه الفترة. جميع المعدات تعمل بكفاءة.
                </div>
              ) : (
                badActors.map((actor, idx) => {
                  const comp = standardComponents.find(c => c.id === actor.id);
                  const isTop = idx === 0;
                  return (
                    <motion.div 
                      key={actor.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={cn(
                        "relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all backdrop-blur-xl",
                        isTop ? "bg-rose-950/20 border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.1)]" : "bg-[#0a0a0f]/60 border-white/10 hover:border-white/20"
                      )}
                    >
                      {/* Pulse line for top offender */}
                      {isTop && (
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500 rounded-r-2xl shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
                      )}

                      <div className="flex-1 flex gap-4 items-center pr-2">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                          isTop ? "bg-rose-500/20 border-rose-500/40" : "bg-white/5 border-white/10"
                        )}>
                          <AlertOctagon className={cn("w-6 h-6", isTop ? "text-rose-500" : "text-amber-500/80")} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white tracking-wide">{comp?.name || 'مكون غير معرف'}</h3>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="text-[10px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">{comp?.family || 'عام'}</span>
                             <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1 font-bold">
                               <Wrench className="w-3 h-3" /> {actor.count} أعطال
                             </span>
                             <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 font-bold">
                               <Clock className="w-3 h-3" /> {Math.round(actor.totalTime / actor.count)} دقيقة متوسط الإصلاح
                             </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-r border-white/5 pt-3 sm:pt-0 sm:pr-4">
                        <button 
                          onClick={() => setLifeHistoryComponentId(actor.id)}
                          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-95"
                        >
                          <History className="w-4 h-4 text-cyan-400" />
                          <span>السجل التاريخي للمكون</span>
                        </button>
                        <button 
                          onClick={() => handleStrengthenPlan()}
                          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl text-xs shadow-lg transition-all cursor-pointer active:scale-95"
                        >
                          <ShieldCheck className="w-4 h-4 text-slate-950" />
                          <span>تعزيز الخطة الوقائية</span>
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
              <Activity className="w-4 h-4" /> متوسط زمن الإصلاح حسب العائلة
            </h2>
            <div className="flex flex-col gap-3">
               {Object.entries(familyStats).map(([fam, st]: [string, any]) => {
                 const avg = st.count > 0 ? Math.round(st.totalTime / st.count) : 0;
                 return (
                   <div key={fam} className="bg-[#0a0a0f]/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-slate-200">{fam}</span>
                       <span className="text-[10px] font-mono text-slate-400">{st.count} حوادث</span>
                     </div>
                     <div className="flex items-end gap-2">
                       <span className="text-2xl font-mono font-black text-amber-400">{avg}</span>
                       <span className="text-[10px] text-amber-400/70 font-mono mb-1">دقيقة / إصلاح</span>
                     </div>
                   </div>
                 )
               })}
               {Object.keys(familyStats).length === 0 && (
                 <p className="text-xs text-slate-500 italic p-4 text-center bg-[#0a0a0f]/40 rounded-2xl border border-white/10">لا توجد بيانات متاحة</p>
               )}
            </div>
          </div>
        </div>

      </div>

      {/* Sovereign Life History Modal */}
      <AnimatePresence>
        {lifeHistoryComponentId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLifeHistoryComponentId(null)} className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative bg-[#0a0a0f] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar font-sans" dir="rtl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <History className="w-6 h-6 text-rose-400" /> السجل التاريخي الشامل للمكون
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">تتبع كافة حركات وتدخلات الصيانة الوقائية والعلاجية المتعلقة بهذا المكون عبر الآلات.</p>
                </div>
                <button onClick={() => setLifeHistoryComponentId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const comp = standardComponents.find(c => c.id === lifeHistoryComponentId);
                const execs = allExecutions.filter(e => e.componentId === lifeHistoryComponentId).sort((a,b) => new Date(b.executedAt || b.scheduledDate).getTime() - new Date(a.executedAt || a.scheduledDate).getTime());
                return (
                  <div className="space-y-6">
                    <div className="p-5 bg-[#0a0a0f]/80 border border-white/10 rounded-2xl flex justify-between items-center shadow-xl">
                      <div>
                        <h3 className="text-xl font-black text-white">{comp?.name || 'مكون غير معرف'}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-1">إجمالي التدخلات المسجلة: {execs.length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                        <Activity className="w-6 h-6 text-rose-400" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {execs.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-8">لا توجد سجلا تدخلات حالية لهذا المكون.</p>
                      ) : (
                        execs.map(ex => {
                          const machine = machines.find(m => m.id === ex.machineId);
                          const action = standardActions.find(a => a.id === ex.actionId);
                          const isCorr = ex.serviceType === 'CORR';
                          return (
                            <div key={ex.id} className="p-4 rounded-2xl bg-[#0a0a0f]/60 border border-white/10 hover:border-white/20 transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border",
                                    isCorr ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  )}>
                                    {isCorr ? 'تدخل إصلاحي علاجي' : 'صيانة وقائية'}
                                  </span>
                                  <span className="text-xs text-slate-400 font-mono">{ex.executedAt ? new Date(ex.executedAt).toLocaleString('ar-SA') : 'معلق'}</span>
                                </div>
                                <span className="text-xs font-mono text-amber-300 font-bold">{ex.durationMinutes} دقيقة</span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1">
                                {action?.name || ex.taskId || 'إجراء صيانة'}
                              </h4>
                              {ex.notes && (
                                <p className="mt-2 text-xs text-slate-300 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                  "{ex.notes}"
                                </p>
                              )}
                              <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                                <span className="text-slate-400">المعدة / الآلة: <strong className="text-cyan-400 font-mono">{machine?.referenceCode || 'غير مرابطة'}</strong></span>
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

