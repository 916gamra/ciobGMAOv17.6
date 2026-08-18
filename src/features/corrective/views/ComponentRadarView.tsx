import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Machine, MachineBlueprint, StandardComponent } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
import { pageItemVariants, pageContainerVariants } from '@/shared/components/PageContainer';
import { RegistryGuidanceState } from '@/core/ui/RegistryGuidanceState';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
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
  Eye,
  LayoutGrid,
  Binary,
  Layers,
  Cpu,
  RotateCcw
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
  const [filterStatus, setFilterStatus] = useState<string>('unlinked');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('ALL');
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

  // Stats calculation
  const stats = useMemo(() => {
    const totalPairs = discoveredPairs.length;
    const unlinkedCount = discoveredPairs.filter(p => !p.isLinked).length;
    const linkedCount = discoveredPairs.filter(p => p.isLinked).length;
    const maturityRate = totalPairs > 0 ? Math.round((linkedCount / totalPairs) * 100) : 100;

    return { totalPairs, unlinkedCount, linkedCount, maturityRate };
  }, [discoveredPairs]);

  // Filter Groups for UnifiedSearchFilter
  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'status',
      label: t('corrective.componentRadar.statusFilter', 'حالة الربط بالشجرة'),
      value: filterStatus,
      onChange: setFilterStatus,
      allLabel: t('corrective.componentRadar.allGaps', 'كافة العناصر المكتشفة'),
      type: 'chips',
      options: [
        { value: 'unlinked', label: t('corrective.componentRadar.unlinked', 'فجوات غير مرابطة'), count: stats.unlinkedCount },
        { value: 'linked', label: t('corrective.componentRadar.linked', 'مؤكدة بالشجرة'), count: stats.linkedCount }
      ]
    },
    {
      id: 'machine',
      label: t('corrective.componentRadar.machineFilter', 'المعدة / الآلة'),
      value: selectedMachineId,
      onChange: setSelectedMachineId,
      allLabel: t('corrective.componentRadar.allMachines', 'جميع الآلات'),
      type: 'select',
      options: machines.map(m => ({
        value: m.id,
        label: `${m.referenceCode} - ${m.serialNumber || 'آلة'}`
      }))
    }
  ], [filterStatus, selectedMachineId, stats.unlinkedCount, stats.linkedCount, machines, t]);

  // Filtered Pairs based on user selection
  const filteredPairs = useMemo(() => {
    return discoveredPairs.filter(pair => {
      // Status Filter
      if (filterStatus === 'unlinked' && pair.isLinked) return false;
      if (filterStatus === 'linked' && !pair.isLinked) return false;

      // Machine Filter
      if (selectedMachineId !== 'ALL' && pair.machine.id !== selectedMachineId) return false;

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

  return (
    <div 
      className="flex flex-col h-full bg-white dark:bg-[#0a0a0f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-slate-800 dark:text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr"
      dir="ltr"
    >
      {/* Page Header Cockpit */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('corrective.componentRadar.title', 'Structural B.O.M Discovery Radar')}
          subtitle={t('corrective.componentRadar.subtitle', 'Live telemetry & dynamic capture of consumed machine organs during field interventions.')}
          icon={<Radar className="w-7 h-7 text-amber-400" />}
          badgeText={t('corrective.componentRadar.badge', 'B.O.M Discovery Radar')}
          badgeColor="amber"
          actions={
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
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{t('corrective.componentRadar.confirmGaps', 'Confirm Discovered Gaps')} ({stats.unlinkedCount})</span>
            </button>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('corrective.componentRadar.totalDiscovered', 'Discovered Organs')}
              subtitle="DISCOVERED PARTS"
              value={stats.totalPairs}
              icon={<Activity className="w-3.5 h-3.5" />}
              color="blue"
            />
            <HeaderBentoCard
              title={t('corrective.componentRadar.unlinkedGaps', 'Unlinked B.O.M Gaps')}
              subtitle="UNLINKED GAPS"
              value={stats.unlinkedCount}
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('corrective.componentRadar.confirmedComponents', 'Confirmed B.O.M')}
              subtitle="CONFIRMED B.O.M"
              value={stats.linkedCount}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('corrective.componentRadar.maturity', 'Tree Maturity')}
              subtitle="TREE MATURITY"
              value={stats.maturityRate}
              valueUnit="%"
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              color="cyan"
            />
          </div>
        </PageHeader>
      </div>

      {/* CORE TABLE CONTAINER (MATCHING FACTORY ADMIN CRYSTAL HIGH-CONTRAST DESIGN) */}
      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 gap-6 min-h-0">
        <motion.div variants={pageItemVariants} className="flex-1 min-h-0 flex flex-col">
          <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-full flex flex-col bg-[#0a0b10]/95 backdrop-blur-xl relative">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />

            {/* Universal Crystal Command Bar */}
            <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
              {/* Context Title & Badge */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Radar className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-white uppercase tracking-tight font-sans">
                      {t('corrective.componentRadar.discoveryTitle', 'Structural B.O.M Discovery Radar')}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      {filteredPairs.length} {t('corrective.componentRadar.pairsCount', 'Elements')}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    {t('corrective.componentRadar.discoverySubtitle', 'Machine Structural Blueprint & Component Discovery Registry')}
                  </p>
                </div>
              </div>

              {/* Center & Left: Unified Search & Filter with View Switcher */}
              <div className="flex-1 max-w-2xl w-full">
                <UnifiedSearchFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  searchPlaceholder={t('corrective.componentRadar.searchPlaceholder', 'Search by equipment, code, model, or component organ...')}
                  filterGroups={filterGroups}
                  themeColor="amber"
                  extraControls={
                    <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={cn(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          viewMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                        )}
                        title={t('common.tableView', 'Crystal Table View')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('cards')}
                        className={cn(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                        )}
                        title={t('common.cardsView', 'Cards Grid View')}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Content Area - Full Bleed Table / Cards Container */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-transparent relative">
              {filteredPairs.length === 0 ? (
                <div className="p-6 md:p-8 flex-1 flex items-center justify-center">
                  <RegistryGuidanceState
                    id="bom-radar-guidance"
                    icon={Radar}
                    title={
                      searchTerm || filterStatus !== 'ALL' || selectedMachineId !== 'ALL'
                        ? t('corrective.componentRadar.noResultsTitle', 'No Discovered Components Matching Filters')
                        : t('corrective.componentRadar.welcomeTitle', 'Structural B.O.M Discovery Radar')
                    }
                    subtitle={
                      searchTerm || filterStatus !== 'ALL' || selectedMachineId !== 'ALL'
                        ? t('corrective.componentRadar.noResultsDesc', 'No component-to-equipment pairs match your active search terms or filters. Try clearing the filter or checking all machines.')
                        : t('corrective.componentRadar.welcomeDesc', 'All corrective maintenance operations organically discover machine organs and help build the machine Bill of Materials (B.O.M) dynamically.')
                    }
                    isSearchActive={Boolean(searchTerm || filterStatus !== 'ALL' || selectedMachineId !== 'ALL')}
                    onClearSearch={() => {
                      setSearchTerm('');
                      setFilterStatus('ALL');
                      setSelectedMachineId('ALL');
                    }}
                    secondaryAction={{
                      label: t('corrective.componentRadar.showAll', 'Show All Elements'),
                      icon: RotateCcw,
                      onClick: () => {
                        setFilterStatus('ALL');
                        setSelectedMachineId('ALL');
                        setSearchTerm('');
                      }
                    }}
                    guidanceCards={[
                      {
                        icon: Binary,
                        title: 'التقاط البيانات العضوي (Evolutionary B.O.M)',
                        description: 'كل تدخل علاجي يتم فيه استهلاك أو فحص جزء يعتبر بصمة تسهم في تجميع الشجرة الهيكلية الشاملة للآلة.'
                      },
                      {
                        icon: Layers,
                        title: 'التدرج الهيكلي الصناعي الخماسي',
                        description: 'ربط المكونات (Components) بالبصمات (Blueprints) يعزز جاهزية المصنع ودقة طلبات قطع الغيار (PDR).'
                      }
                    ]}
                    themeColor="amber"
                  />
                </div>
              ) : viewMode === 'table' ? (
                /* CRYSTAL HIGH-CONTRAST FULL TABLE VIEW */
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-0">
                  <table className="w-full text-start border-collapse">
                    <thead className="bg-[#12141d] border-b-2 border-white/15 text-slate-200 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
                      <tr>
                        <th className="py-4 px-6 text-start font-extrabold">{t('corrective.componentRadar.thStatus', 'B.O.M Status')}</th>
                        <th className="py-4 px-6 text-start font-extrabold">{t('corrective.componentRadar.thMachine', 'Equipment / Machine')}</th>
                        <th className="py-4 px-6 text-start font-extrabold">{t('corrective.componentRadar.thComponent', 'Discovered Component Organ')}</th>
                        <th className="py-4 px-6 text-start font-extrabold">{t('corrective.componentRadar.thImpact', 'Interventions & Downtime')}</th>
                        <th className="py-4 px-6 text-start font-extrabold">{t('corrective.componentRadar.thLastEvent', 'Last Surgery Date')}</th>
                        <th className="py-4 px-6 text-center font-extrabold">{t('corrective.componentRadar.thActions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-sans">
                      {filteredPairs.map((pair, idx) => {
                        const isUnlinked = !pair.isLinked;

                        return (
                          <tr 
                            key={pair.key}
                            className={cn(
                              "transition-colors duration-150 group text-start cursor-pointer",
                              idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                              isUnlinked ? "hover:bg-amber-500/15" : "hover:bg-emerald-500/15",
                              "hover:text-white"
                            )}
                          >
                            {/* B.O.M Status */}
                            <td className="py-3.5 px-6 font-mono font-extrabold whitespace-nowrap">
                              {isUnlinked ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  {t('corrective.componentRadar.unlinkedBadge', 'Unlinked B.O.M Gap')}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  {t('corrective.componentRadar.confirmedBadge', 'Confirmed in B.O.M')}
                                </span>
                              )}
                            </td>

                            {/* Equipment / Machine */}
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-mono font-extrabold text-[11px]">
                                    {pair.machine.referenceCode}
                                  </span>
                                  <span className="font-extrabold text-white text-xs tracking-tight uppercase group-hover:text-amber-200 transition-colors">
                                    {pair.blueprint ? `${pair.blueprint.brand} ${pair.blueprint.model}` : `Machine (${pair.machine.referenceCode})`}
                                  </span>
                                </div>
                                {pair.blueprint && (
                                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 ml-1">
                                    Model: {pair.blueprint.model} ({pair.blueprint.reference})
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Component Organ */}
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
                                  <ComponentIcon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-white text-xs tracking-tight uppercase">
                                    {pair.component.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Code: <span className="text-amber-300 font-bold">{pair.component.id}</span> | Family: {pair.component.family}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Interventions & Downtime */}
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-2 font-mono">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  {pair.breakdownCount} events
                                </span>
                                <span className="text-slate-300 text-xs font-bold">
                                  {pair.totalDowntimeMinutes} min downtime
                                </span>
                              </div>
                            </td>

                            {/* Last Surgery Date */}
                            <td className="py-3.5 px-6 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>{new Date(pair.lastExecutionDate).toLocaleDateString('en-GB')}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-6 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {isUnlinked ? (
                                <button
                                  onClick={() => handleBindComponent(pair)}
                                  className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3.5 py-1.5 text-xs shadow-lg transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                  title={t('corrective.componentRadar.bindTooltip', 'Bind to Structural B.O.M')}
                                >
                                  <LinkIcon className="w-3.5 h-3.5 text-slate-950" />
                                  <span>{t('corrective.componentRadar.bindBtn', 'Bind to B.O.M')}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnbindComponent(pair)}
                                  className="bg-white/[0.04] text-slate-400 hover:text-rose-400 hover:border-rose-500/30 border border-white/10 font-bold rounded-xl px-3.5 py-1.5 text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                  title={t('corrective.componentRadar.unbindTooltip', 'Unbind from Blueprint')}
                                >
                                  <Link2Off className="w-3.5 h-3.5" />
                                  <span>{t('corrective.componentRadar.unbindBtn', 'Unbind')}</span>
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
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                      {filteredPairs.map(pair => {
                        const isUnlinked = !pair.isLinked;

                        return (
                          <motion.div
                            key={pair.key}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "rounded-2xl border p-5 transition-all flex flex-col justify-between group relative overflow-hidden backdrop-blur-xl",
                              isUnlinked
                                ? "bg-amber-500/[0.03] border-amber-500/20 hover:border-amber-500/40"
                                : "bg-white/[0.02] border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.04]"
                            )}
                          >
                            <div className="flex flex-col gap-4">
                              {/* Card Header: Machine Reference & Status */}
                              <div className="flex items-start justify-between border-b border-white/5 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                                    isUnlinked
                                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                  )}>
                                    {isUnlinked ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-black text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                        {pair.machine.referenceCode}
                                      </span>
                                    </div>
                                    <h3 className="text-xs font-bold text-slate-200 mt-1 uppercase truncate max-w-[180px]">
                                      {pair.blueprint ? `${pair.blueprint.brand} ${pair.blueprint.model}` : `Machine (${pair.machine.referenceCode})`}
                                    </h3>
                                  </div>
                                </div>

                                {isUnlinked ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                                    Gap
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                    Linked
                                  </span>
                                )}
                              </div>

                              {/* Card Body: Component Organ Details */}
                              <div className="bg-[#0a0a0f]/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                    <ComponentIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-mono text-amber-400 font-bold block">{pair.component.id}</span>
                                    <h4 className="text-xs font-extrabold text-white uppercase">{pair.component.name}</h4>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Family: {pair.component.family}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-end">
                                  <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 block">
                                    {pair.breakdownCount} events
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 block mt-1">
                                    {pair.totalDowntimeMinutes} min
                                  </span>
                                </div>
                              </div>

                              {/* Card Footer: Last Event & Primary Action */}
                              <div className="flex items-center justify-between pt-1">
                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{new Date(pair.lastExecutionDate).toLocaleDateString('en-GB')}</span>
                                </div>

                                {isUnlinked ? (
                                  <button
                                    onClick={() => handleBindComponent(pair)}
                                    className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-1.5 text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5 text-slate-950" />
                                    <span>{t('corrective.componentRadar.bindBtn', 'Bind')}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUnbindComponent(pair)}
                                    className="bg-white/[0.04] text-slate-400 hover:text-rose-400 hover:border-rose-500/30 border border-white/10 font-bold rounded-xl px-3 py-1.5 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Link2Off className="w-3.5 h-3.5" />
                                    <span>{t('corrective.componentRadar.unbindBtn', 'Unbind')}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

