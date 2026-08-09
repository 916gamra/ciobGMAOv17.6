import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Machine, MachineBlueprint, StandardComponent } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageContainer, pageItemVariants, pageContainerVariants } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCompact } from '@/shared/components/StatCompact';
import { KpiCard } from '@/shared/components/KpiCard';
import { BadgePill } from '@/shared/components/BadgePill';
import { FilterBar } from '@/shared/components/FilterBar';
import { Button } from '@/shared/components/Button';
import { cn, EMPTY_ARRAY } from '@/shared/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  Radar, 
  Component as ComponentIcon, 
  Link as LinkIcon, 
  Link2Off, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  Clock, 
  Check, 
  ShieldCheck,
  LayoutList,
  Grid
} from 'lucide-react';

interface DiscoveredPair {
  key: string; // `${machineId}_${componentId}`
  machine: Machine;
  blueprint: MachineBlueprint | null;
  component: StandardComponent;
  breakdownCount: number;
  totalDowntimeMinutes: number;
  lastExecutionDate: string;
  isLinked: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

export function ComponentRadarView() {
  const { t } = useTranslation();
  // Single Consolidated Query to prevent performance lag
  const data = useLiveQuery(async () => {
    const [machines, blueprints, components, taskExecutions] = await Promise.all([
      db.machines.toArray(),
      db.machineBlueprints.toArray(),
      db.standardComponents.toArray(),
      db.taskExecutions.where('serviceType').equals('CORR').toArray(),
    ]);
    return { machines, blueprints, components, taskExecutions };
  }, []);

  const machines = data?.machines ?? EMPTY_ARRAY;
  const blueprints = data?.blueprints ?? EMPTY_ARRAY;
  const components = data?.components ?? EMPTY_ARRAY;
  const taskExecutions = data?.taskExecutions ?? EMPTY_ARRAY;

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlinked' | 'linked'>('unlinked');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Fast Lookup Maps
  const machinesMap = useMemo(() => new Map(machines.map(m => [m.id, m])), [machines]);
  const blueprintsMap = useMemo(() => new Map(blueprints.map(b => [b.id, b])), [blueprints]);
  const componentsMap = useMemo(() => new Map(components.map(c => [c.id, c])), [components]);

  // Aggregate & Analyze Discovered Component <-> Machine pairs from Corrective Executions
  const discoveredPairs = useMemo(() => {
    const pairsMap = new Map<string, DiscoveredPair>();

    taskExecutions.forEach(ex => {
      if (!ex.machineId || !ex.componentId) return;

      const machine = machinesMap.get(ex.machineId);
      const component = componentsMap.get(ex.componentId);
      if (!machine || !component) return;

      const blueprint = machine.blueprintId ? blueprintsMap.get(machine.blueprintId) || null : null;
      const key = `${ex.machineId}_${ex.componentId}`;

      // Check if component is already linked in blueprint
      const linkedComponentIds = blueprint?.componentIds || blueprint?.componentBlueprintIds || [];
      const isLinked = linkedComponentIds.includes(component.id);

      const existing = pairsMap.get(key);
      if (existing) {
        existing.breakdownCount += 1;
        existing.totalDowntimeMinutes += ex.durationMinutes || 0;
        if (new Date(ex.executedAt) > new Date(existing.lastExecutionDate)) {
          existing.lastExecutionDate = ex.executedAt;
        }
      } else {
        pairsMap.set(key, {
          key,
          machine,
          blueprint,
          component,
          breakdownCount: 1,
          totalDowntimeMinutes: ex.durationMinutes || 0,
          lastExecutionDate: ex.executedAt,
          isLinked
        });
      }
    });

    return Array.from(pairsMap.values());
  }, [taskExecutions, machinesMap, componentsMap, blueprintsMap]);

  // Filtered Pairs based on user selection
  const filteredPairs = useMemo(() => {
    return discoveredPairs.filter(pair => {
      // Status Filter
      if (filterStatus === 'unlinked' && pair.isLinked) return false;
      if (filterStatus === 'linked' && !pair.isLinked) return false;

      // Machine Filter
      if (selectedMachineId !== 'all' && pair.machine.id !== selectedMachineId) return false;

      // Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchCompName = pair.component.name.toLowerCase().includes(term);
        const matchCompId = pair.component.id.toLowerCase().includes(term);
        const matchMachineRef = pair.machine.referenceCode.toLowerCase().includes(term);
        const matchMachineSerial = pair.machine.serialNumber?.toLowerCase().includes(term) || false;
        const matchBlueprint = pair.blueprint ? (pair.blueprint.model.toLowerCase().includes(term) || pair.blueprint.brand.toLowerCase().includes(term)) : false;
        if (!matchCompName && !matchCompId && !matchMachineRef && !matchMachineSerial && !matchBlueprint) {
          return false;
        }
      }

      return true;
    });
  }, [discoveredPairs, filterStatus, selectedMachineId, searchTerm]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalPairs = discoveredPairs.length;
    const unlinkedCount = discoveredPairs.filter(p => !p.isLinked).length;
    const linkedCount = discoveredPairs.filter(p => p.isLinked).length;
    const maturityRate = totalPairs > 0 ? Math.round((linkedCount / totalPairs) * 100) : 100;

    return { totalPairs, unlinkedCount, linkedCount, maturityRate };
  }, [discoveredPairs]);

  // Handler: Bind single component to machine blueprint
  const handleBindComponent = async (pair: DiscoveredPair) => {
    if (!pair.machine.blueprintId) {
      toast.error(`Equipment (${pair.machine.referenceCode}) is not linked to a Machine Blueprint. Please assign a blueprint first.`);
      return;
    }

    try {
      const bp = pair.blueprint || (await db.machineBlueprints.get(pair.machine.blueprintId));
      if (!bp) {
        toast.error('Machine structural blueprint not found');
        return;
      }

      const existingIds = bp.componentIds || bp.componentBlueprintIds || [];
      if (existingIds.includes(pair.component.id)) {
        toast.info('Component already bound to machine blueprint');
        return;
      }

      const updatedComponentIds = [...existingIds, pair.component.id];

      await db.machineBlueprints.update(bp.id, {
        componentIds: updatedComponentIds,
        componentBlueprintIds: updatedComponentIds
      });

      toast.success(`Bound component "${pair.component.name}" to machine blueprint ${pair.machine.referenceCode}`);
    } catch (err: any) {
      toast.error('Error binding component: ' + err.message);
    }
  };

  // Handler: Unbind component from machine blueprint
  const handleUnbindComponent = async (pair: DiscoveredPair) => {
    if (!pair.machine.blueprintId || !pair.blueprint) return;

    try {
      const existingIds = pair.blueprint.componentIds || pair.blueprint.componentBlueprintIds || [];
      const updatedIds = existingIds.filter(id => id !== pair.component.id);

      await db.machineBlueprints.update(pair.blueprint.id, {
        componentIds: updatedIds,
        componentBlueprintIds: updatedIds
      });

      toast.success(`Unbound component "${pair.component.name}" from machine blueprint`);
    } catch (err: any) {
      toast.error('Error unbinding component: ' + err.message);
    }
  };

  // Handler: Bulk Bind All Unlinked
  const handleBulkBindAll = async () => {
    const unlinked = discoveredPairs.filter(p => !p.isLinked && p.machine.blueprintId);
    if (unlinked.length === 0) {
      toast.info('No unmapped B.O.M gaps at this time');
      return;
    }

    if (!confirm(`Do you want to confirm and bind all discovered components (${unlinked.length} parts) to machine blueprints?`)) {
      return;
    }

    try {
      const bpUpdatesMap = new Map<string, Set<string>>();

      unlinked.forEach(p => {
        if (!p.machine.blueprintId) return;
        const bpId = p.machine.blueprintId;
        const currentSet = bpUpdatesMap.get(bpId) || new Set<string>();
        
        const bp = blueprintsMap.get(bpId);
        if (bp) {
          (bp.componentIds || bp.componentBlueprintIds || []).forEach(id => currentSet.add(id));
        }
        currentSet.add(p.component.id);
        bpUpdatesMap.set(bpId, currentSet);
      });

      for (const [bpId, compIdsSet] of bpUpdatesMap.entries()) {
        const compIdsArray = Array.from(compIdsSet);
        await db.machineBlueprints.update(bpId, {
          componentIds: compIdsArray,
          componentBlueprintIds: compIdsArray
        });
      }

      toast.success(`Successfully bound ${unlinked.length} components to machine blueprints!`);
    } catch (err: any) {
      toast.error('Error bulk updating: ' + err.message);
    }
  };

  const filterTabs = [
    { id: 'unlinked', label: 'فجوات بوهيمية غير مرابطة', count: stats.unlinkedCount, color: 'amber' as const },
    { id: 'linked', label: 'مكونات مؤكدة بالشجرة', count: stats.linkedCount, color: 'emerald' as const },
    { id: 'all', label: 'جميع المكونات المكتشفة', count: stats.totalPairs, color: 'cyan' as const },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col gap-6 relative z-10 lg:px-8 pb-24 pt-2 font-sans"
    >
      {/* Page Header with Integrated Compact Stats */}
      <PageHeader
        title={t('corrective.componentRadar.title', 'رادار اكتشاف الشجرة الهيكلية')}
        subtitle={t('corrective.componentRadar.subtitle', 'التقاط المكونات والأجزاء المستهلكة أثناء التدخلات العلاجية وتأكيدها داخل الشجرة الفنية للآلة.')}
        icon={<Radar className="w-8 h-8 text-orange-400" />}
        badgeColor="orange"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatCompact 
              icon={<Activity className="w-4 h-4 text-purple-400" />} 
              label={t('corrective.componentRadar.totalDiscovered', 'المكونات المكتشفة')} 
              value={stats.totalPairs.toString()} 
            />
            <StatCompact 
              icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} 
              label={t('corrective.componentRadar.unlinkedGaps', 'فجوات غير مرابطة')} 
              value={stats.unlinkedCount.toString()} 
            />
            <StatCompact 
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} 
              label={t('corrective.componentRadar.confirmedComponents', 'مكونات مؤكدة')} 
              value={stats.linkedCount.toString()} 
            />
            <StatCompact 
              icon={<ShieldCheck className="w-4 h-4 text-cyan-400" />} 
              label={t('corrective.componentRadar.maturity', 'نضج الشجرة')} 
              value={`${stats.maturityRate}%`} 
            />
            <button
              onClick={handleBulkBindAll}
              disabled={stats.unlinkedCount === 0}
              className={cn(
                "font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95",
                stats.unlinkedCount > 0
                  ? "bg-white text-slate-950 hover:bg-slate-200"
                  : "bg-white/10 text-slate-500 cursor-not-allowed opacity-50 border border-white/10"
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('corrective.componentRadar.confirmGaps', 'تأكيد الفجوات')} ({stats.unlinkedCount})</span>
            </button>
          </div>
        }
      />

      {/* CORE TABLE CONTAINER (FACTORY ADMIN CRYSTAL HIGH-CONTRAST DESIGN) */}
      <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl flex-1 flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl">
        {/* Table Registry Header + FilterBar */}
        <div className="p-6 md:p-8 border-b border-white/10 bg-white/[0.02] flex flex-col gap-6 shrink-0 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Radar className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight font-sans">
                  جدول رادار اكتشاف الشجرة الهيكلية (B.O.M Discovery Radar)
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Machine Structural Blueprint & Component Discovery Registry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BadgePill color="cyan">
                {filteredPairs.length} عنصر مكتشف
              </BadgePill>
            </div>
          </div>

          {/* Unified Filter Bar */}
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="بحث عن اسم الآلة، الكود، أو اسم المكون..."
            tabs={filterTabs}
            activeTab={filterStatus}
            onTabChange={(id) => setFilterStatus(id as any)}
            extraControls={
              <div className="flex items-center gap-2">
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500/50 font-mono cursor-pointer"
                >
                  <option value="all">جميع الآلات المكتشفة</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.referenceCode} - {m.serialNumber || 'بدون سيريال'}</option>
                  ))}
                </select>

                {/* VIEW SWITCHER */}
                <div className="flex items-center bg-[#0a0a0f]/90 border border-white/10 rounded-xl p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 font-bold cursor-pointer",
                      viewMode === 'table' 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-slate-400 hover:text-white"
                    )}
                    title="عرض جدول كريستالي"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 font-bold cursor-pointer",
                      viewMode === 'cards' 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-slate-400 hover:text-white"
                    )}
                    title="عرض بطاقات"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            }
          />
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#0a0a0f]/40 p-6 md:p-8">
          {filteredPairs.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
              <Radar className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="font-semibold text-slate-400">لا توجد مكونات أو فجوات مطابقة للبحث</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {filterStatus === 'unlinked' 
                  ? 'جميع المكونات المسجلة في بونات الصيانة مرابطة ومؤكدة تماماً داخل الشجرة الفنية للآلات.'
                  : 'جرّب تغيير معايير البحث أو اختيار آلة أخرى.'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* CRYSTAL HIGH-CONTRAST TABLE VIEW */
            <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0a0f]/60 backdrop-blur-xl shadow-2xl">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider font-mono text-[11px]">
                    <th className="py-3.5 px-4">حالة الربط بالشجرة</th>
                    <th className="py-3.5 px-4">المعدة / الآلة</th>
                    <th className="py-3.5 px-4">المكون / الجزء المكتشف</th>
                    <th className="py-3.5 px-4">الأعطال وساعات التوقف</th>
                    <th className="py-3.5 px-4">تاريخ آخر تدخل</th>
                    <th className="py-3.5 px-4 text-center">إجراءات الربط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredPairs.map((pair) => {
                    const isUnlinked = !pair.isLinked;

                    return (
                      <tr 
                        key={pair.key}
                        className="hover:bg-white/[0.04] transition-colors border-b border-white/5 group"
                      >
                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <BadgePill
                            label={isUnlinked ? 'فجوة غير مرابطة' : 'مؤكد بالشجرة'}
                            color={isUnlinked ? 'amber' : 'emerald'}
                            pulse={isUnlinked}
                            icon={!isUnlinked ? <Check className="w-3 h-3 text-emerald-400" /> : undefined}
                          />
                        </td>

                        {/* Machine Info */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-white text-xs">
                              {pair.machine.referenceCode}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {pair.blueprint ? `${pair.blueprint.brand} ${pair.blueprint.model}` : 'آلة قياسية'}
                            </span>
                          </div>
                        </td>

                        {/* Component Details */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                              <ComponentIcon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-xs">
                                {pair.component.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {pair.component.id} | عائلة: <span className="text-slate-300">{pair.component.family}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Impact / Downtime */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              {pair.breakdownCount} أعطال
                            </span>
                            <span className="text-slate-300 text-xs font-bold">
                              {pair.totalDowntimeMinutes} د توقف
                            </span>
                          </div>
                        </td>

                        {/* Last Execution */}
                        <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                          {new Date(pair.lastExecutionDate).toLocaleDateString('ar-EG')}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isUnlinked ? (
                            <button
                              onClick={() => handleBindComponent(pair)}
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3.5 py-1.5 text-xs shadow-lg transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              <span>ربط بالشجرة</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnbindComponent(pair)}
                              className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 font-bold text-xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Link2Off className="w-3.5 h-3.5" />
                              <span>إلغاء الربط</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARDS VIEW */
            <motion.div
              variants={pageContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              {filteredPairs.map(pair => {
                const isUnlinked = !pair.isLinked;

                return (
                  <motion.div key={pair.key} variants={pageItemVariants}>
                    <GlassCard 
                      className={`p-5 border transition-all duration-300 relative bg-[#0a0a0f]/40 ${
                        isUnlinked 
                          ? 'border-amber-500/30 hover:border-amber-500/50 bg-amber-500/[0.02]' 
                          : 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/[0.02]'
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        
                        {/* Top Row: Status badge & Machine Info */}
                        <div className="flex items-start justify-between border-b border-white/5 pb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isUnlinked 
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            }`}>
                              {isUnlinked ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                  {pair.machine.referenceCode}
                                </span>
                                <h3 className="text-sm font-bold text-slate-200 font-sans">
                                  {pair.blueprint ? `${pair.blueprint.brand} ${pair.blueprint.model}` : `آلة (${pair.machine.referenceCode})`}
                                </h3>
                              </div>
                              {pair.blueprint && (
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  الموديل: {pair.blueprint.model} ({pair.blueprint.reference})
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <BadgePill
                            label={isUnlinked ? 'فجوة غير مرابطة' : 'مؤكد بالشجرة'}
                            color={isUnlinked ? 'amber' : 'emerald'}
                            pulse={isUnlinked}
                            icon={!isUnlinked ? <Check className="w-3 h-3 text-emerald-400" /> : undefined}
                          />
                        </div>

                        {/* Middle: Component Details */}
                        <div className="bg-[#0a0a0f]/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                              <ComponentIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-orange-400 font-bold">{pair.component.id}</span>
                                <h4 className="text-xs font-bold text-white font-sans">{pair.component.name}</h4>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                                العائلة: <span className="text-slate-300 font-mono">{pair.component.family}</span> | الأهمية: <span className="text-amber-400 font-mono">{pair.component.criticality || 'عادية'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Impact badge */}
                          <div className="text-left">
                            <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 block">
                              {pair.breakdownCount} أعطال
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {pair.totalDowntimeMinutes} دقيقة توقف
                            </span>
                          </div>
                        </div>

                        {/* Bottom Controls */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>آخر تدخل: {new Date(pair.lastExecutionDate).toLocaleDateString('ar-EG')}</span>
                          </div>

                          {isUnlinked ? (
                            <button
                              onClick={() => handleBindComponent(pair)}
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-1.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              <span>ربط بالشجرة</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnbindComponent(pair)}
                              className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Link2Off className="w-3.5 h-3.5" />
                              <span>إلغاء الربط</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </GlassCard>

    </motion.div>
  );
}
