import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TaskExecution, type ConsumedPartClaim } from '@/core/db';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertOctagon, 
  Clock, 
  User, 
  Settings, 
  Cpu, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Search, 
  Filter, 
  Layers, 
  Activity,
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  ShieldAlert,
  Zap,
  Droplets,
  Wind,
  WrenchIcon,
  CheckCircle2,
  Package,
  Layers3,
  Hammer,
  HelpCircle,
  Sparkles,
  LayoutList,
  Grid,
  Eye,
  X,
  ShieldCheck,
  CheckCircle as CheckCircleIcon
} from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { KpiCard } from '@/shared/components/KpiCard';
import { BadgePill } from '@/shared/components/BadgePill';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
import { Button } from '@/shared/components/Button';
import { cn, EMPTY_ARRAY } from '@/shared/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

export function BreakdownLogView({ user }: { user: any }) {
  const { t } = useTranslation();
  // Live Data Query
  const data = useLiveQuery(async () => {
    const [
      machines, 
      sectors,
      componentTemplates,
      componentBlueprints,
      standardActions, 
      technicians, 
      inventory, 
      pdrBlueprints, 
      pdrTemplates, 
      taskExecutions
    ] = await Promise.all([
      db.machines.toArray(),
      db.sectors.toArray(),
      db.componentTemplates.toArray(),
      db.componentBlueprints.toArray(),
      db.standardActions.toArray(),
      db.technicians.toArray(),
      db.inventory.toArray(),
      db.pdrBlueprints.toArray(),
      db.pdrTemplates.toArray(),
      db.taskExecutions
        .where('serviceType')
        .equals('CORR')
        .reverse()
        .sortBy('executedAt')
    ]);
    return { machines, sectors, componentTemplates, componentBlueprints, standardActions, technicians, inventory, pdrBlueprints, pdrTemplates, taskExecutions };
  }, []);

  const machines = data?.machines ?? EMPTY_ARRAY;
  const sectors = data?.sectors ?? EMPTY_ARRAY;
  const componentTemplates = data?.componentTemplates ?? EMPTY_ARRAY;
  const componentBlueprints = data?.componentBlueprints ?? EMPTY_ARRAY;
  const standardActions = data?.standardActions ?? EMPTY_ARRAY;
  const technicians = data?.technicians ?? EMPTY_ARRAY;
  const inventory = data?.inventory ?? EMPTY_ARRAY;
  const pdrBlueprints = data?.pdrBlueprints ?? EMPTY_ARRAY;
  const pdrTemplates = data?.pdrTemplates ?? EMPTY_ARRAY;
  const taskExecutions = data?.taskExecutions ?? EMPTY_ARRAY;

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMachine, setFilterMachine] = useState('ALL');
  const [filterDomain, setFilterDomain] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterReconcile, setFilterReconcile] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedInspectExecution, setSelectedInspectExecution] = useState<TaskExecution | null>(null);

  // Filter Groups for UnifiedSearchFilter
  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'domain',
      label: 'المجال الفني (Domain)',
      value: filterDomain,
      onChange: setFilterDomain,
      allLabel: 'جميع المجالات الفنية',
      type: 'chips',
      options: [
        { value: 'MEC', label: 'ميكانيك (MEC)' },
        { value: 'ELE', label: 'كهرباء (ELE)' },
        { value: 'HYD', label: 'هيدروليك (HYD)' },
        { value: 'PNU', label: 'بنيوماتيك (PNU)' },
        { value: 'ELN', label: 'إلكترونيك (ELN)' }
      ]
    },
    {
      id: 'machine',
      label: 'الآلة / خط الإنتاج',
      value: filterMachine,
      onChange: setFilterMachine,
      allLabel: 'جميع الآلات والمعدات',
      type: 'select',
      options: machines.map(m => ({
        value: m.id,
        label: `${m.referenceCode} - ${m.name}`
      }))
    },
    {
      id: 'status',
      label: 'حالة التدخل (Outcome)',
      value: filterStatus,
      onChange: setFilterStatus,
      allLabel: 'جميع حالات التدخل',
      type: 'chips',
      options: [
        { value: 'COMPLETED', label: 'منجز بالكامل (Completed)' },
        { value: 'PENDING_PARTS', label: 'مؤجل لقطعة غيار (Pending)' },
        { value: 'WORKSHOP_FABRICATION', label: 'ورشة التصنيع (Workshop)' }
      ]
    },
    {
      id: 'reconcile',
      label: 'مطابقة قطع المخزن',
      value: filterReconcile,
      onChange: setFilterReconcile,
      allLabel: 'جميع حالات المطابقة',
      type: 'chips',
      options: [
        { value: 'RECONCILED', label: 'مطابق ومسوى' },
        { value: 'PENDING_MATCH', label: 'في انتظار المخزن' }
      ]
    }
  ], [filterDomain, filterMachine, filterStatus, filterReconcile, machines]);

  // WIZARD MODAL STATE
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State: Voucher & Machine
  const [bonId, setBonId] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [downTimeStart, setDownTimeStart] = useState('');
  const [operatorSymptom, setOperatorSymptom] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');

  // Step 2 State: Diagnosis & Cause
  const [interventionStart, setInterventionStart] = useState('');
  const [domainFamily, setDomainFamily] = useState<'MEC' | 'ELE' | 'HYD' | 'PNU' | 'ELN'>('MEC');
  const [selectedComponentTemplateId, setSelectedComponentTemplateId] = useState('');
  const [rootCause, setRootCause] = useState('');

  // Step 3 State: Action & Parts
  const [actionType, setActionType] = useState<'REPAIR' | 'REPLACE' | 'ADJUST' | 'REMOVE' | 'CLEAN'>('REPAIR');
  const [notes, setNotes] = useState('');
  const [consumedParts, setConsumedParts] = useState<ConsumedPartClaim[]>([]);
  
  // Part selector state inside Step 3
  const [partIsNew, setPartIsNew] = useState<boolean>(true);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState('');
  const [partQty, setPartQty] = useState<number>(1);

  // Step 4 State: Timestamps & Outcome Status
  const [interventionEnd, setInterventionEnd] = useState('');
  const [outcomeStatus, setOutcomeStatus] = useState<'COMPLETED' | 'PENDING_PARTS' | 'WORKSHOP_FABRICATION'>('COMPLETED');
  const [condition, setCondition] = useState<'EXCELLENT' | 'WATCHFUL' | 'CRITICAL'>('WATCHFUL');

  // Lookup Maps
  const machinesMap = useMemo(() => new Map(machines.map(m => [m.id, m])), [machines]);
  const sectorsMap = useMemo(() => new Map(sectors.map(s => [s.id, s])), [sectors]);
  const compTemplatesMap = useMemo(() => new Map(componentTemplates.map(c => [c.id, c])), [componentTemplates]);
  const techsMap = useMemo(() => new Map(technicians.map(t => [t.id, t])), [technicians]);
  const blueMap = useMemo(() => new Map(pdrBlueprints.map(b => [b.id, b])), [pdrBlueprints]);
  const tempMap = useMemo(() => new Map(pdrTemplates.map(t => [t.id, t])), [pdrTemplates]);

  // Filtered Machines based on Sector selection in Step 1
  const availableMachines = useMemo(() => {
    if (!selectedSectorId) return machines;
    return machines.filter(m => m.sectorId === selectedSectorId);
  }, [machines, selectedSectorId]);

  // Filtered Component Templates based on Domain in Step 2
  const availableComponentTemplates = useMemo(() => {
    if (!domainFamily) return componentTemplates;
    return componentTemplates.filter(ct => ct.family === domainFamily);
  }, [componentTemplates, domainFamily]);

  // Available stock items for Part selector
  const stockOptions = useMemo(() => {
    return inventory.map(item => {
      const blueprint = blueMap.get(item.blueprintId);
      const template = blueprint ? tempMap.get(blueprint.templateId) : null;
      return {
        id: item.id,
        name: template ? `${template.name} (${blueprint?.reference})` : 'Unknown Part',
        stockQty: item.quantityCurrent,
        warehouse: item.warehouseId === 'WH-MAGASIN' ? 'Main Store' : 'Depot',
        blueprintId: item.blueprintId
      };
    }).filter(opt => opt.stockQty > 0);
  }, [inventory, blueMap, tempMap]);

  // Open Wizard Helper
  const handleOpenWizard = () => {
    const now = new Date();
    const formattedNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    const oneHourAgo = new Date(now.getTime() - (60 * 60000 - now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    setBonId(`BDC-${Math.floor(1000 + Math.random() * 9000)}`);
    setSelectedSectorId('');
    setSelectedMachineId('');
    setDownTimeStart(oneHourAgo);
    setOperatorSymptom('');
    setSelectedTechnicianId(user?.id || '');

    setInterventionStart(formattedNow);
    setDomainFamily('MEC');
    setSelectedComponentTemplateId('');
    setRootCause('');

    setActionType('REPAIR');
    setNotes('');
    setConsumedParts([]);

    setInterventionEnd(formattedNow);
    setOutcomeStatus('COMPLETED');
    setCondition('WATCHFUL');

    setWizardStep(1);
    setIsWizardOpen(true);
  };

  // Add Part Claim into Step 3
  const handleAddPartClaim = () => {
    if (partQty <= 0) return;

    if (partIsNew) {
      if (!selectedStockId) return;
      const stockItem = inventory.find(i => i.id === selectedStockId);
      if (!stockItem) return;

      setConsumedParts(prev => [...prev, {
        isNew: true,
        stockId: selectedStockId,
        blueprintId: stockItem.blueprintId,
        quantity: partQty,
        reconciled: false,
        deductedStock: false
      }]);
      setSelectedStockId('');
    } else {
      if (!selectedBlueprintId) return;
      setConsumedParts(prev => [...prev, {
        isNew: false,
        blueprintId: selectedBlueprintId,
        quantity: partQty,
        reconciled: true,
        deductedStock: false
      }]);
      setSelectedBlueprintId('');
    }

    setPartQty(1);
  };

  // Remove Part Claim
  const handleRemovePartClaim = (index: number) => {
    setConsumedParts(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Corrective Wizard
  const handleSubmitWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId || !selectedTechnicianId || !rootCause.trim()) {
      toast.error('⚠️ يرجى ملء كافة البيانات المطلوبة للتدخل الاصلاحي');
      return;
    }

    try {
      const executionId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      // Calculate durations
      const dtStart = new Date(downTimeStart).getTime();
      const intEnd = new Date(interventionEnd).getTime();
      const totalDowntimeMinutes = Math.max(1, Math.round((intEnd - dtStart) / (1000 * 60))) || 30;

      const compTemplate = compTemplatesMap.get(selectedComponentTemplateId);

      // Create new TaskExecution
      const newExecution: TaskExecution = {
        id: executionId,
        machineId: selectedMachineId,
        taskId: `corr-${crypto.randomUUID().slice(0, 8)}`,
        status: outcomeStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        scheduledDate: downTimeStart ? downTimeStart.split('T')[0] : timestamp.split('T')[0],
        executedAt: timestamp,
        doneBy: selectedTechnicianId,
        notes: notes || `تدخل إصلاحي برقم البون ${bonId}: ${rootCause}`,
        durationMinutes: totalDowntimeMinutes,
        componentCondition: condition,
        componentId: selectedComponentTemplateId,
        serviceType: 'CORR',
        
        // Corrective Wizard specifics
        bonId,
        sectorId: selectedSectorId,
        downTimeStart,
        interventionStart,
        interventionEnd,
        operatorSymptom,
        domainFamily,
        rootCause,
        actionType,
        outcomeStatus,
        claimedParts: consumedParts,
        reconciliationStatus: consumedParts.some(p => p.isNew) ? 'PENDING_MATCH' : 'RECONCILED'
      };

      await db.taskExecutions.add(newExecution);

      setIsWizardOpen(false);
      toast.success(`تم تسجيل بون التدخل الإصلاحي ${bonId} بنجاح! 🛠️`);
    } catch (err: any) {
      console.error(err);
      toast.error('فشل حفظ التدخل الإصلاحي: ' + err.message);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const totalRepairs = taskExecutions.length;
    const totalDowntime = taskExecutions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const criticalIncidents = taskExecutions.filter(ex => ex.componentCondition === 'CRITICAL').length;
    const pendingReconciliations = taskExecutions.filter(ex => ex.reconciliationStatus === 'PENDING_MATCH').length;
    return { totalRepairs, totalDowntime, criticalIncidents, pendingReconciliations };
  }, [taskExecutions]);

  // Filtered List
  const filteredExecutions = useMemo(() => {
    return taskExecutions.filter(ex => {
      const machine = machinesMap.get(ex.machineId);
      
      const matchesSearch = !searchTerm || (
        (ex.bonId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (machine?.referenceCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (machine?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ex.rootCause || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ex.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ex.operatorSymptom || '').toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesMachine = filterMachine === 'ALL' || ex.machineId === filterMachine;
      const matchesDomain = filterDomain === 'ALL' || ex.domainFamily === filterDomain;
      const matchesStatus = filterStatus === 'ALL' || ex.outcomeStatus === filterStatus;
      const matchesReconcile = filterReconcile === 'ALL' || 
        (filterReconcile === 'RECONCILED' && ex.reconciliationStatus === 'RECONCILED') ||
        (filterReconcile === 'PENDING_MATCH' && ex.reconciliationStatus === 'PENDING_MATCH');

      return matchesSearch && matchesMachine && matchesDomain && matchesStatus && matchesReconcile;
    });
  }, [taskExecutions, searchTerm, filterMachine, filterDomain, filterStatus, filterReconcile, machinesMap]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden"
    >
      
      {/* HEADER COCKPIT WITH INTEGRATED COMPACT STATS */}
      <div className="p-6 md:p-8 pb-0">
        <PageHeader
          title={t('corrective.breakdownLog.title', 'سجل التدخلات والأعطال الطارئة')}
          subtitle={t('corrective.breakdownLog.subtitle', 'التوثيق اللحظي للتدخلات العلاجية ومتابعة حالة إصلاح الأصول والقطع المستهلكة')}
          icon={<Wrench className="w-7 h-7 text-white" />}
          badgeText={t('corrective.breakdownLog.badge', 'العمليات العلاجية')}
          badgeColor="orange"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('corrective.breakdownLog.totalRepairs', 'إجمالي التدخلات')}
              subtitle="TOTAL REPAIRS"
              value={stats.totalRepairs}
              icon={<Wrench className="w-3.5 h-3.5" />}
              color="orange"
            />
            <HeaderBentoCard
              title={t('corrective.breakdownLog.downtimeMetric', 'ساعات التوقف')}
              subtitle="DOWNTIME METRIC"
              value={Math.round(stats.totalDowntime / 60)}
              valueUnit={t('unit.hour', 'ساعة')}
              icon={<Clock className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('corrective.breakdownLog.criticalIncidents', 'أعطال حرجة')}
              subtitle="CRITICAL INCIDENTS"
              value={stats.criticalIncidents}
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              color="rose"
            />
            <HeaderBentoCard
              title={t('corrective.breakdownLog.pendingReconcile', 'في انتظار المطابقة')}
              subtitle="PENDING RECONCILE"
              value={stats.pendingReconciliations}
              icon={<Package className="w-3.5 h-3.5" />}
              color="cyan"
            />
          </div>
        </PageHeader>
      </div>

      {/* CORE TABLE CONTAINER (FACTORY ADMIN CRYSTAL HIGH-CONTRAST DESIGN) */}
      <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl flex-1 flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl mx-6 md:mx-8 mb-6 mt-6">
        {/* Table Registry Header + UnifiedSearchFilter */}
        <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
          {/* Right Side (RTL): Context Count */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white uppercase tracking-tight font-sans">
                  سجل التدخلات الإصلاحية
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/15 border border-orange-500/30 text-orange-300">
                  {filteredExecutions.length} تدخل
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Interventions & Breakdown Registry
              </p>
            </div>
          </div>

          {/* Center & Left: Unified Search, Filters & View Switcher */}
          <div className="flex-1 max-w-3xl w-full">
            <UnifiedSearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="بحث برقم البون، كود الآلة، الفني، أو تشخيص العطل..."
              filterGroups={filterGroups}
              themeColor="orange"
              extraControls={
                <div className="flex items-center gap-2 shrink-0">
                  {/* VIEW SWITCHER */}
                  <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer",
                        viewMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                      )}
                      title="عرض الجدول الكريستالي"
                    >
                      <LayoutList className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer",
                        viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                      )}
                      title="عرض البطاقات"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ACTION BUTTON */}
                  <button 
                    onClick={handleOpenWizard} 
                    className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>تسجيل تدخل طارئ</span>
                  </button>
                </div>
              }
            />
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#0a0a0f]/40 p-4 md:p-6">
          {viewMode === 'table' ? (
            /* CRYSTAL HIGH-CONTRAST TABLE VIEW */
            <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0a0f]/60 backdrop-blur-xl shadow-2xl">
              <table dir="rtl" className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider font-mono text-[11px]">
                    <th className="py-3.5 px-4 text-right">رقم البون</th>
                    <th className="py-3.5 px-4 text-right">الآلة والمنطقة</th>
                    <th className="py-3.5 px-4 text-right">المجال والإجراء</th>
                    <th className="py-3.5 px-4 text-right">تشخيص العطل والسبب</th>
                    <th className="py-3.5 px-4 text-right">الفني المكلف</th>
                    <th className="py-3.5 px-4 text-right">مدة التوقف</th>
                    <th className="py-3.5 px-4 text-center">الحالة والمطابقة</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredExecutions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Wrench className="w-16 h-16 text-slate-500 mb-4 opacity-50" />
                          <p className="font-semibold text-slate-300">لا توجد تدخلات إصلاحية مطابقة لمعايير البحث</p>
                          <p className="text-xs text-slate-500 mt-1">يمكنك تعديل خيارات الفلترة أو تسجيل تدخل جديد.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredExecutions.map((ex) => {
                    const machine = machinesMap.get(ex.machineId);
                    const sector = machine ? sectorsMap.get(machine.sectorId) : null;
                    const tech = techsMap.get(ex.doneBy || '');

                    return (
                      <tr 
                        key={ex.id}
                        className="hover:bg-white/[0.04] transition-colors border-b border-white/5 group"
                      >
                        {/* Bon ID */}
                        <td className="py-3.5 px-4 font-mono font-black text-cyan-400 whitespace-nowrap">
                          {ex.bonId || `BDC-${ex.id.slice(0, 6)}`}
                        </td>

                        {/* Machine & Sector */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-white text-xs">
                              {machine?.referenceCode || 'M-REG'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {sector?.name || machine?.name || 'عام'}
                            </span>
                          </div>
                        </td>

                        {/* Domain & Action */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase">
                              {ex.domainFamily || 'MEC'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                              {ex.actionType || 'REPAIR'}
                            </span>
                          </div>
                        </td>

                        {/* Root Cause */}
                        <td className="py-3.5 px-4 text-slate-100 font-semibold max-w-xs truncate">
                          <div className="truncate">{ex.rootCause || ex.notes}</div>
                          {ex.operatorSymptom && (
                            <span className="block text-[10px] text-slate-400 italic font-normal truncate">
                              "{ex.operatorSymptom}"
                            </span>
                          )}
                        </td>

                        {/* Technician */}
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{tech?.name || ex.doneBy || 'فني الصيانة'}</span>
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 font-mono text-amber-300 font-bold whitespace-nowrap">
                          {ex.durationMinutes} دقيقة
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                              "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                              ex.outcomeStatus === 'COMPLETED'
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : ex.outcomeStatus === 'PENDING_PARTS'
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            )}>
                              {ex.outcomeStatus === 'COMPLETED' ? 'منجز بالكامل' : ex.outcomeStatus === 'PENDING_PARTS' ? 'مؤجل لقطعة' : 'ورشة التصنيع'}
                            </span>
                            {ex.reconciliationStatus === 'PENDING_MATCH' && (
                              <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                في انتظار المخزن
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Details Action Button */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedInspectExecution(ex)}
                            className="p-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                            title="معاينة تفاصيل البون"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span>معاينة</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARDS VIEW */
            filteredExecutions.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <Wrench className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="font-semibold text-slate-400">لا توجد تدخلات إصلاحية مسجلة</p>
                <p className="text-xs text-slate-500 mt-1">انقر فوق "تسجيل تدخل طارئ" لبدء إدخال بون جديد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExecutions.map((ex, idx) => {
                const machine = machinesMap.get(ex.machineId);
                const sector = machine ? sectorsMap.get(machine.sectorId) : null;
                const tech = techsMap.get(ex.doneBy || '');

                return (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-5 bg-[#0a0a0f]/60 hover:bg-[#0a0a0f]/90 border border-white/10 hover:border-white/20 rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-xl backdrop-blur-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border font-mono font-bold text-xs",
                        ex.componentCondition === 'CRITICAL' 
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                          : "bg-white/10 border-white/20 text-white"
                      )}>
                        {ex.domainFamily || 'MEC'}
                      </div>
                      
                      <div className="space-y-1.5 flex-1 text-right">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                            {ex.bonId || `BDC-${ex.id.slice(0, 6)}`}
                          </span>
                          
                          <span className="text-sm font-bold text-white font-mono">
                            {machine?.referenceCode || 'M-REG'}
                          </span>

                          {sector && (
                            <span className="text-[10px] text-slate-400 bg-white/10 px-2 py-0.5 rounded font-mono">
                              {sector.name}
                            </span>
                          )}

                          <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase font-black">
                            {ex.actionType || 'REPAIR'}
                          </span>
                        </div>

                        <div className="text-xs text-white font-bold flex items-center gap-2 pt-1">
                          <span className="text-slate-400 font-mono">السبب:</span>
                          <span className="text-slate-200">{ex.rootCause || ex.notes}</span>
                        </div>

                        {ex.operatorSymptom && (
                          <div className="text-[11px] text-slate-400 italic">
                            عرض المشكل: "{ex.operatorSymptom}"
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono pt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" /> {tech?.name || ex.doneBy || 'فني الصيانة'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {ex.durationMinutes} دقيقة
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                      <span className={cn(
                        "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                        ex.outcomeStatus === 'COMPLETED'
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : ex.outcomeStatus === 'PENDING_PARTS'
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      )}>
                        {ex.outcomeStatus === 'COMPLETED' ? 'منجز بالكامل' : ex.outcomeStatus === 'PENDING_PARTS' ? 'مؤجل لقطعة' : 'ورشة التصنيع'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedInspectExecution(ex)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>التفاصيل</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            )
          )}
        </div>
      </GlassCard>

      {/* 4-STEP CORRECTIVE WIZARD MODAL */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 dir-rtl" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWizardOpen(false)}
              className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-[#0a0a0f] border border-orange-500/30 p-6 md:p-8 rounded-3xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar text-right font-sans"
            >
              {/* MODAL HEADER */}
              <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 font-sans">
                    <Wrench className="w-6 h-6 text-orange-400" />
                    معالج تسجيل التدخل الإصلاحي (Corrective Wizard)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">تتبع الأعطال وتوثيق التشخيص وتسجيل قطع الغيار برقم البون.</p>
                </div>
                <button
                  onClick={() => setIsWizardOpen(false)}
                  className="p-2 bg-[#0a0a0f] hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  &times;
                </button>
              </div>

              {/* STEP PROGRESS BAR */}
              <div className="grid grid-cols-4 gap-2 mb-8">
                {[
                  { num: 1, label: '1. بون الإصلاح والآلة' },
                  { num: 2, label: '2. التشخيص والعطل' },
                  { num: 3, label: '3. الإجراء والقطع' },
                  { num: 4, label: '4. الحالة الإجمالية' }
                ].map(s => (
                  <div 
                    key={s.num}
                    onClick={() => setWizardStep(s.num as any)}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      wizardStep === s.num 
                        ? 'bg-orange-500/20 border-orange-500/60 text-orange-300 font-bold shadow-lg shadow-orange-500/10'
                        : wizardStep > s.num
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
                          : 'bg-[#0a0a0f] border-white/10 text-slate-500'
                    }`}
                  >
                    <div className="text-[11px] font-mono">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* WIZARD FORM CONTENT */}
              <form onSubmit={handleSubmitWizard} className="space-y-6">

                {/* ================= STEP 1: VOUCHER & MACHINE ================= */}
                {wizardStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4" /> المرحلة الأولى: بيانات بون الإصلاح والآلة المتوقفة
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Voucher ID */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">رقم بون الإصلاح (Bon ID / Voucher)</label>
                        <input
                          type="text"
                          required
                          value={bonId}
                          onChange={(e) => setBonId(e.target.value)}
                          placeholder="مثال: BDC-2026-084"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white font-mono font-bold text-sm focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* Sector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">القطاع الصناعي (Sector)</label>
                        <select
                          value={selectedSectorId}
                          onChange={(e) => setSelectedSectorId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="">جميع القطاعات</option>
                          {sectors.map(sec => (
                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Target Machine */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">الآلة المعنية (Equipment / Machine) *</label>
                        <select
                          required
                          value={selectedMachineId}
                          onChange={(e) => setSelectedMachineId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs focus:outline-none focus:border-orange-500 cursor-pointer font-mono font-bold"
                        >
                          <option value="" disabled>اختر الآلة المتوقفة...</option>
                          {availableMachines.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.referenceCode} — Serial: {m.serialNumber}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Technician Assigned */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">الفني الميداني المسند له البون *</label>
                        <select
                          required
                          value={selectedTechnicianId}
                          onChange={(e) => setSelectedTechnicianId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="" disabled>اختر الفني المكلف...</option>
                          {technicians.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Downtime Start */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">تاريخ ووقت توقف الآلة (Downtime Start) *</label>
                        <input
                          type="datetime-local"
                          required
                          value={downTimeStart}
                          onChange={(e) => setDownTimeStart(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* Operator Symptom */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">الأعراض الأولية في البون (Operator Symptom)</label>
                        <input
                          type="text"
                          value={operatorSymptom}
                          onChange={(e) => setOperatorSymptom(e.target.value)}
                          placeholder="مثال: Problème de démarrage moteur"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/10">
                      <Button
                        type="button"
                        onClick={() => {
                          if (!selectedMachineId || !selectedTechnicianId) {
                            toast.error('يرجى اختيار الآلة والفني قبل المتابعة');
                            return;
                          }
                          setWizardStep(2);
                        }}
                        variant="secondary"
                        rightIcon={<ArrowLeft className="w-4 h-4" />}
                      >
                        الانتقال للخطوة التالية: التشخيص
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 2: DIAGNOSIS & ROOT CAUSE ================= */}
                {wizardStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-2">
                      <Wrench className="w-4 h-4" /> المرحلة الثانية: المعاينة الميدانية والتشخيص الفعلي للعطل
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Intervention Start */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">تاريخ ووقت بدء تشخيص الفني *</label>
                        <input
                          type="datetime-local"
                          required
                          value={interventionStart}
                          onChange={(e) => setInterventionStart(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      {/* Domain Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">مجال العطل (Engineering Domain) *</label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { code: 'MEC', label: 'ميكانيك' },
                            { code: 'ELE', label: 'كهرباء' },
                            { code: 'HYD', label: 'هيدروليك' },
                            { code: 'PNU', label: 'بنيوماتيك' },
                            { code: 'ELN', label: 'إلكترونيك' }
                          ].map(d => (
                            <button
                              key={d.code}
                              type="button"
                              onClick={() => setDomainFamily(d.code as any)}
                              className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                                domainFamily === d.code
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-mono'
                                  : 'bg-[#0a0a0f] border-white/10 text-slate-400 hover:text-white'
                              }`}
                            >
                              {d.code}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Component Assembly */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">الجزء المعني بالعطل (Component Assembly)</label>
                        <select
                          value={selectedComponentTemplateId}
                          onChange={(e) => setSelectedComponentTemplateId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          <option value="">اختر المكون المسؤول (اختياري)...</option>
                          {availableComponentTemplates.map(ct => (
                            <option key={ct.id} value={ct.id}>
                              {ct.name} ({ct.family})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Root Cause Diagnosis */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">السبب الرئيسي الفعلي للعطل (Root Cause) *</label>
                        <input
                          type="text"
                          required
                          value={rootCause}
                          onChange={(e) => setRootCause(e.target.value)}
                          placeholder="مثال: Contacteur grillé / Joint d'étanchéité détérioré"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-white/10">
                      <Button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        variant="secondary"
                        leftIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        السابق
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (!rootCause.trim()) {
                            toast.error('يرجى كتابة السبب الرئيسي للعطل قبل المتابعة');
                            return;
                          }
                          setWizardStep(3);
                        }}
                        variant="secondary"
                        rightIcon={<ArrowLeft className="w-4 h-4" />}
                      >
                        الانتقال للخطوة التالية: الإجراء والقطع
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 3: ACTION & PARTS RECONCILIATION ================= */}
                {wizardStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> المرحلة الثالثة: الإجراء المنفذ وتسجيل قطع الغيار في البون
                    </div>

                    {/* Action Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">نوع الإجراء الصيانة المنفذ (Action Type) *</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { type: 'REPAIR', label: '🛠️ إصلاح' },
                          { type: 'REPLACE', label: '🔄 استبدال' },
                          { type: 'ADJUST', label: '📐 ضبط' },
                          { type: 'REMOVE', label: '🗑️ إزالة' },
                          { type: 'CLEAN', label: '🧼 تنظيف' }
                        ].map(act => (
                          <button
                            key={act.type}
                            type="button"
                            onClick={() => setActionType(act.type as any)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                              actionType === act.type
                                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                : 'bg-[#0a0a0f] border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Technician Notes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">ملاحظات الفني والخطوات المنفذة (Action Notes)</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="تفاصيل التدخل الميداني، الاختبارات المجراة، أو ملاحظات خاصة للوردية القادمة..."
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* SPARE PARTS RECONCILIATION CARD */}
                    <div className="p-4 rounded-2xl bg-[#0a0a0f]/80 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <Package className="w-4 h-4" /> تسجيل قطع الغيار المستعملة في التدخل
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {consumedParts.length} قطعة مضافة
                        </span>
                      </div>

                      {/* Storekeeper Sovereignty Banner */}
                      <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px] leading-relaxed">
                        🛡️ <strong>قانون مسؤول المخزن:</strong> القطع الجديدة المسجلة هنا <u>لا تُخصم تلقائياً</u> من المخزن المادي، بل تُحفظ كطلب مطابقة برقم البون <strong>{bonId}</strong> ليراجعها ويتأكد منها أمين المخزن.
                      </div>

                      {/* Add Part Sub-Form */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end pt-1">
                        <div className="md:col-span-1">
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">حالة القطعة</label>
                          <div className="flex rounded-lg border border-white/20 p-0.5 bg-[#0a0a0f]">
                            <button
                              type="button"
                              onClick={() => setPartIsNew(true)}
                              className={`flex-1 py-1 text-[10px] font-bold rounded-md ${partIsNew ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'}`}
                            >
                              جديدة (PDR)
                            </button>
                            <button
                              type="button"
                              onClick={() => setPartIsNew(false)}
                              className={`flex-1 py-1 text-[10px] font-bold rounded-md ${!partIsNew ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'}`}
                            >
                              ورشة/مستودع
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">اختر قطعة الغيار</label>
                          {partIsNew ? (
                            <select
                              value={selectedStockId}
                              onChange={(e) => setSelectedStockId(e.target.value)}
                              className="w-full py-1.5 px-3 rounded-lg bg-[#0a0a0f] border border-white/20 text-white text-xs font-mono"
                            >
                              <option value="">اختر من مخزن قطع الغيار...</option>
                              {stockOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name} — متوفر: {opt.stockQty}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={selectedBlueprintId}
                              onChange={(e) => setSelectedBlueprintId(e.target.value)}
                              className="w-full py-1.5 px-3 rounded-lg bg-[#0a0a0f] border border-white/20 text-white text-xs font-mono"
                            >
                              <option value="">اختر الموديل الكتالوجي...</option>
                              {pdrBlueprints.map(bp => {
                                const temp = tempMap.get(bp.templateId);
                                return (
                                  <option key={bp.id} value={bp.id}>
                                    {temp?.name || 'Part'} ({bp.reference})
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <div className="w-20">
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">الكمية</label>
                            <input
                              type="number"
                              min={1}
                              value={partQty}
                              onChange={(e) => setPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full py-1.5 px-2 rounded-lg bg-[#0a0a0f] border border-white/20 text-white text-xs font-mono text-center font-bold"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleAddPartClaim}
                            className="py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shrink-0"
                          >
                            + إضافة
                          </button>
                        </div>
                      </div>

                      {/* Consumed Parts List */}
                      {consumedParts.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-white/10">
                          {consumedParts.map((p, idx) => {
                            const bp = p.blueprintId ? blueMap.get(p.blueprintId) : null;
                            const tm = bp ? tempMap.get(bp.templateId) : null;

                            return (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#0a0a0f]/60 border border-white/10 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isNew ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {p.isNew ? 'جديدة (PDR)' : 'ورشة/مستعملة'}
                                  </span>
                                  <span className="font-bold text-white">{tm?.name || 'قطعة غيار'}</span>
                                  <span className="text-slate-400 font-mono">({bp?.reference})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-cyan-400">x{p.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePartClaim(idx)}
                                    className="text-rose-400 hover:text-rose-300"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between pt-4 border-t border-white/10">
                      <Button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        variant="secondary"
                        leftIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        السابق
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setWizardStep(4)}
                        variant="secondary"
                        rightIcon={<ArrowLeft className="w-4 h-4" />}
                      >
                        الانتقال للخطوة النهائية: الإكمال والحالة
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 4: TIMESTAMPS & OUTCOME STATUS ================= */}
                {wizardStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> المرحلة الرابعة: النتيجة النهائية وإغلاق التدخل
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Intervention End */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">تاريخ ووقت انتهاء التدخل والتشغيل *</label>
                        <input
                          type="datetime-local"
                          required
                          value={interventionEnd}
                          onChange={(e) => setInterventionEnd(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Outcome Status */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">نتيجة وحالة التدخل الاصلاحي *</label>
                        <select
                          value={outcomeStatus}
                          onChange={(e) => setOutcomeStatus(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
                        >
                          <option value="COMPLETED">✅ منجز بالكامل (COMPLETED)</option>
                          <option value="PENDING_PARTS">⏳ مؤجل لحين توفر/طلب قطعة غيار (PENDING PARTS)</option>
                          <option value="WORKSHOP_FABRICATION">🔨 تحت التصنيع بورشة الميكانيك (WORKSHOP FABRICATION)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Condition after repair */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">حالة الآلة والمكون بعد التدخل</label>
                        <select
                          value={condition}
                          onChange={(e) => setCondition(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/20 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="EXCELLENT">ممتازة - خالية من الأعراض</option>
                          <option value="WATCHFUL">مقبولة - يحتاج المراقبة (Watchful)</option>
                          <option value="CRITICAL">حرجة - تحتاج صيانة معمقة قريباً</option>
                        </select>
                      </div>
                    </div>

                    {/* Summary Live Card */}
                    <div className="p-4 rounded-2xl bg-[#0a0a0f] border border-white/10 space-y-2">
                      <div className="text-xs font-bold text-slate-400 border-b border-white/10 pb-2">
                        ملخص محرك الحساب التلقائي للبون {bonId}:
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 block text-[10px]">مدة توقف الآلة الإجمالية:</span>
                          <span className="font-bold text-amber-400 text-sm">
                            {Math.max(1, Math.round((new Date(interventionEnd).getTime() - new Date(downTimeStart).getTime()) / 60000))} دقيقة
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">مدة التدخل والتشخيص:</span>
                          <span className="font-bold text-cyan-400 text-sm">
                            {Math.max(1, Math.round((new Date(interventionEnd).getTime() - new Date(interventionStart).getTime()) / 60000))} دقيقة
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-white/10">
                      <Button
                        type="button"
                        onClick={() => setWizardStep(3)}
                        variant="secondary"
                        leftIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        السابق
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        rightIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        حفظ واعتماد بون التدخل الإصلاحي
                      </Button>
                    </div>
                  </motion.div>
                )}

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VOUCHER INSPECTION DETAILS MODAL */}
      <AnimatePresence>
        {selectedInspectExecution && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 dir-rtl" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInspectExecution(null)}
              className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#0a0a0f] border border-cyan-500/30 p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar text-right font-sans"
            >
              {/* Header Plaque */}
              <div className="flex justify-between items-start pb-4 border-b border-white/10 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/30 uppercase">
                      {selectedInspectExecution.bonId || `BDC-${selectedInspectExecution.id.slice(0, 6)}`}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                      {selectedInspectExecution.serviceType === 'CORR' ? 'تدخل طارئ' : 'صيانة وقائية'}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    تفاصيل بون التدخل الإصلاحي
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedInspectExecution(null)}
                  className="p-2 bg-[#0a0a0f] hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details grid */}
              <div className="space-y-6 text-xs">
                {/* Equipment & Tech info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-0.5">الآلة / المعدة</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {machinesMap.get(selectedInspectExecution.machineId)?.referenceCode || 'M-REG'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-0.5">القطاع الصناعي</span>
                    <span className="font-bold text-slate-200">
                      {sectorsMap.get(machinesMap.get(selectedInspectExecution.machineId)?.sectorId || '')?.name || 'عام'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-0.5">الفني المكلف</span>
                    <span className="font-bold text-slate-200">
                      {techsMap.get(selectedInspectExecution.doneBy || '')?.name || selectedInspectExecution.doneBy || 'فني الصيانة'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-0.5">المجال الصناعي</span>
                    <span className="font-mono font-bold text-orange-400">
                      {selectedInspectExecution.domainFamily || 'MEC'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-0.5">نوع الإجراء</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {selectedInspectExecution.actionType || 'REPAIR'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-0.5">مدة التوقف</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {selectedInspectExecution.durationMinutes} دقيقة
                    </span>
                  </div>
                </div>

                {/* Root cause and symptoms */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-1">السبب الرئيسي بالعطل</span>
                    <p className="text-slate-100 font-bold leading-relaxed bg-[#0a0a0f]/80 p-3 rounded-xl border border-white/5">
                      {selectedInspectExecution.rootCause || selectedInspectExecution.notes}
                    </p>
                  </div>
                  {selectedInspectExecution.operatorSymptom && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">عرض العطل في البون الاصلي</span>
                      <p className="text-slate-300 italic bg-[#0a0a0f]/50 p-3 rounded-xl border border-white/5">
                        "{selectedInspectExecution.operatorSymptom}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Claimed parts */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>قطع الغيار المسحوبة / المستهلكة ({selectedInspectExecution.claimedParts?.length || 0})</span>
                  </h3>
                  {(!selectedInspectExecution.claimedParts || selectedInspectExecution.claimedParts.length === 0) ? (
                    <div className="p-4 text-center text-slate-500 bg-white/[0.02] rounded-xl border border-white/5">
                      لم يتم سحب أو تسجيل قطع غيار لهذا البون.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0a0a0f]/60">
                      <table dir="ltr" className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-white/[0.04] border-b border-white/10 text-slate-400 font-bold font-mono">
                            <th className="p-2.5">حالة القطعة</th>
                            <th className="p-2.5">الكمية</th>
                            <th className="p-2.5">حالة المطابقة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {selectedInspectExecution.claimedParts.map((p, pIdx) => (
                            <tr key={pIdx}>
                              <td className="p-2.5 font-bold text-white">
                                {p.isNew ? 'جديدة (NEW)' : 'مستعملة / مجددة (USED)'}
                              </td>
                              <td className="p-2.5 font-bold text-cyan-400">
                                {p.quantity} قطعة
                              </td>
                              <td className="p-2.5">
                                <span className={cn(
                                  "text-[10px] px-2 py-0.5 rounded font-bold",
                                  p.reconciled 
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                )}>
                                  {p.reconciled ? 'مطابقة ومخصومة' : 'في انتظار تسوية المخزن'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer action button */}
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => setSelectedInspectExecution(null)}
                    className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-5 py-2 text-xs transition-all cursor-pointer shadow-lg"
                  >
                    إغلاق المعاينة
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
