import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Machine, MachineBlueprint, StandardComponent } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageContainer, pageItemVariants, pageContainerVariants } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KpiCard } from '@/shared/components/KpiCard';
import { BadgePill } from '@/shared/components/BadgePill';
import { FilterBar } from '@/shared/components/FilterBar';
import { Button } from '@/shared/components/Button';
import { EMPTY_ARRAY } from '@/shared/utils';
import { toast } from 'sonner';
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
  ShieldCheck
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
    { id: 'unlinked', label: 'B.O.M Gaps', count: stats.unlinkedCount, color: 'amber' as const },
    { id: 'linked', label: 'Bound & Confirmed', count: stats.linkedCount, color: 'emerald' as const },
    { id: 'all', label: 'All Discovered', count: stats.totalPairs, color: 'cyan' as const },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col gap-6 relative z-10 lg:px-8 pb-24 pt-2"
    >
      {/* Page Header */}
      <PageHeader
        title="B.O.M Discovery Radar"
        subtitle="Capture sub-systems consumed during corrective interventions and confirm them into the Evolutionary Machine B.O.M."
        icon={<Radar className="w-8 h-8 text-orange-400" />}
        badgeColor="orange"
        actions={
          <Button
            onClick={handleBulkBindAll}
            disabled={stats.unlinkedCount === 0}
            variant={stats.unlinkedCount > 0 ? 'secondary' : 'ghost'}
            className={stats.unlinkedCount === 0 ? "border border-white/5 opacity-50" : ""}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Confirm All Gaps ({stats.unlinkedCount})
          </Button>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <KpiCard
          label="DISCOVERED PARTS"
          value={stats.totalPairs}
          unit="pairs"
          icon={<Activity className="w-6 h-6" />}
          color="purple"
        />

        <KpiCard
          label="UNMAPPED GAPS"
          value={stats.unlinkedCount}
          unit="gaps"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="amber"
        />

        <KpiCard
          label="BLUEPRINT CONFIRMED"
          value={stats.linkedCount}
          unit="parts"
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="emerald"
        />

        <KpiCard
          label="B.O.M MATURITY INDEX"
          value={`${stats.maturityRate}%`}
          icon={<ShieldCheck className="w-6 h-6" />}
          color="cyan"
        />
      </div>

      {/* Unified Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search machine name or component..."
        tabs={filterTabs}
        activeTab={filterStatus}
        onTabChange={(id) => setFilterStatus(id as any)}
        extraControls={
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500/50 font-mono cursor-pointer"
          >
            <option value="all">All Discovered Machines</option>
            {machines.map(m => (
              <option key={m.id} value={m.id}>{m.referenceCode} - {m.serialNumber || 'No Serial'}</option>
            ))}
          </select>
        }
      />

      {/* Main List */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {filteredPairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-3xl bg-black/20 text-center p-8">
            <Radar className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest font-mono">No Matching Gaps or Components</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {filterStatus === 'unlinked' 
                ? 'All components logged in breakdowns are confirmed and bound to machine structural blueprints.'
                : 'No results match your selected search criteria.'}
            </p>
          </div>
        ) : (
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
                    className={`p-5 border transition-all duration-300 relative bg-black/40 ${
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
                                {pair.blueprint ? `${pair.blueprint.brand} ${pair.blueprint.model}` : `Machine (${pair.machine.referenceCode})`}
                              </h3>
                            </div>
                            {pair.blueprint && (
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Model: {pair.blueprint.model} ({pair.blueprint.reference})
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <BadgePill
                          label={isUnlinked ? 'UNMAPPED B.O.M GAP' : 'CONFIRMED IN BLUEPRINT'}
                          color={isUnlinked ? 'amber' : 'emerald'}
                          pulse={isUnlinked}
                          icon={!isUnlinked ? <Check className="w-3 h-3 text-emerald-400" /> : undefined}
                        />
                      </div>

                      {/* Middle: Component Details */}
                      <div className="bg-black/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
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
                              Family: <span className="text-slate-300 font-mono">{pair.component.family}</span> | Criticality: <span className="text-amber-400 font-mono">{pair.component.criticality || 'Normal'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Impact badge */}
                        <div className="text-left">
                          <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 block">
                            {pair.breakdownCount} breakdowns
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {pair.totalDowntimeMinutes} min downtime
                          </span>
                        </div>
                      </div>

                      {/* Bottom Controls */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Last execution: {new Date(pair.lastExecutionDate).toLocaleDateString('en-US')}</span>
                        </div>

                        {isUnlinked ? (
                          <button
                            onClick={() => handleBindComponent(pair)}
                            className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>BIND TO BLUEPRINT</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnbindComponent(pair)}
                            className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                          >
                            <Link2Off className="w-3.5 h-3.5" />
                            <span>UNBIND</span>
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

    </motion.div>
  );
}
