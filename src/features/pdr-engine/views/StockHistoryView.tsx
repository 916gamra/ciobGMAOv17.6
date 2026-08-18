import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { EngineViewSkeleton } from '@/shared/components/EngineViewSkeleton';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { 
  History, 
  ArrowDownRight, 
  ArrowUpRight, 
  Settings, 
  Search, 
  Activity, 
  Cpu, 
  Wrench, 
  TrendingUp, 
  Calendar, 
  User, 
  MapPin, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3, 
  Plus,
  Trash2,
  Edit3,
  Link2,
  ListFilter
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { toast } from 'sonner';
import { UnifiedSearchFilter, type FilterGroup, type QuickTabOption } from '@/shared/components/UnifiedSearchFilter';
import { EmptyState } from '@/shared/components/EmptyState';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.02 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function StockHistoryView() {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'machine-consumption'>('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUST'>('ALL');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('ALL');

  // Interactive UI state for smart mapper
  const [selectedMachineForDetails, setSelectedMachineForDetails] = useState<string | null>(null);
  const [mappingQuantityInput, setMappingQuantityInput] = useState<Record<string, string>>({});
  const [isAddingCustomMapping, setIsAddingCustomMapping] = useState<string | null>(null); // machineId
  const [customPartSelect, setCustomPartSelect] = useState<string>('');
  const [customQtySelect, setCustomQtySelect] = useState<string>('1');

  // Load live queries from database
  const movements = useLiveQuery(() => db.movements.orderBy('timestamp').reverse().toArray(), []);
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);
  const blueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);
  const templates = useLiveQuery(() => db.pdrTemplates.toArray(), []);
  const machines = useLiveQuery(() => db.machines.toArray(), []);
  const machineBlueprints = useLiveQuery(() => db.machineBlueprints.toArray(), []);
  const partMappings = useLiveQuery(() => db.machinePartMappings.toArray(), []);

  const isLoading = !movements || !inventory || !blueprints || !machines || !templates || !partMappings;

  // Optimize mapping lookups with memoized maps
  const blueprintMap = useMemo(() => {
    if (!blueprints) return new Map();
    return new Map(blueprints.map(b => [b.id, b]));
  }, [blueprints]);

  const templateMap = useMemo(() => {
    if (!templates) return new Map();
    return new Map(templates.map(t => [t.id, t]));
  }, [templates]);

  const stockItemMap = useMemo(() => {
    if (!inventory) return new Map();
    return new Map(inventory.map(i => [i.id, i]));
  }, [inventory]);

  const machineMap = useMemo(() => {
    if (!machines) return new Map();
    return new Map(machines.map(m => [m.id, m]));
  }, [machines]);

  const machineBlueprintMap = useMemo(() => {
    if (!machineBlueprints) return new Map();
    return new Map(machineBlueprints.map(mb => [mb.id, mb]));
  }, [machineBlueprints]);

  // Enrich stock movements with blueprint, template and machine names
  const enrichedMovements = useMemo(() => {
    if (isLoading || !movements) return [];

    return movements.map(mov => {
      const stockItem = stockItemMap.get(mov.stockId);
      const blueprint = stockItem ? blueprintMap.get(stockItem.blueprintId) : null;
      const template = blueprint ? templateMap.get(blueprint.templateId) : null;
      const machine = mov.machineId ? machineMap.get(mov.machineId) : null;

      return {
        ...mov,
        partReference: blueprint?.reference || 'Unknown Reference',
        partName: template?.name || 'Unknown Spare Part',
        partUnit: blueprint?.unit || 'Pcs',
        machineCode: machine?.referenceCode || null,
        machineStatus: machine?.status || null,
        machineSector: machine?.sectorId || null,
        blueprintId: blueprint?.id || null
      };
    });
  }, [movements, stockItemMap, blueprintMap, templateMap, machineMap, isLoading]);

  // General Filtered Ledger list
  const filteredMovements = useMemo(() => {
    return enrichedMovements.filter(mov => {
      const matchesType = typeFilter === 'ALL' || mov.type === typeFilter;
      const matchesMachine = selectedMachineId === 'ALL' || mov.machineId === selectedMachineId;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        mov.partReference.toLowerCase().includes(searchLower) ||
        mov.partName.toLowerCase().includes(searchLower) ||
        mov.performedBy.toLowerCase().includes(searchLower) ||
        (mov.notes || '').toLowerCase().includes(searchLower) ||
        (mov.machineCode || '').toLowerCase().includes(searchLower);

      return matchesType && matchesMachine && matchesSearch;
    });
  }, [enrichedMovements, typeFilter, selectedMachineId, searchTerm]);

  const quickTabs: QuickTabOption[] = useMemo(() => [
    { id: 'ALL', label: 'جميع الحركات', count: enrichedMovements.length },
    { id: 'IN', label: 'إيداع وتوريد', count: enrichedMovements.filter(m => m.type === 'IN').length },
    { id: 'OUT', label: 'صرف واستهلاك', count: enrichedMovements.filter(m => m.type === 'OUT').length },
    { id: 'ADJUST', label: 'تسوية وجرد', count: enrichedMovements.filter(m => m.type === 'ADJUST').length },
  ], [enrichedMovements]);

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'machine',
      label: 'الآلة المستهدفة',
      options: [
        { value: 'ALL', label: 'جميع الآلات والمستودع' },
        ...(machines || []).map(m => ({
          value: m.id,
          label: `${m.referenceCode} - ${m.serialNumber || 'Unit'}`
        }))
      ],
      value: selectedMachineId,
      onChange: (val) => setSelectedMachineId(val)
    }
  ], [machines, selectedMachineId]);

  // Calculate Machine Consumption and Smart recommendation suggestions
  const machineAnalysisList = useMemo(() => {
    if (isLoading || !machines) return [];

    return machines.map(m => {
      // 1. Get official mapped parts for this physical machine
      const officialMappingsForMachine = partMappings.filter(pm => pm.machineId === m.id);
      
      const mappedParts = officialMappingsForMachine.map(pm => {
        const blueprint = blueprintMap.get(pm.blueprintId);
        const template = blueprint ? templateMap.get(blueprint.templateId) : null;
        return {
          mappingId: pm.id,
          blueprintId: pm.blueprintId,
          reference: blueprint?.reference || 'Unknown Reference',
          name: template?.name || 'Unknown Spare Part',
          unit: blueprint?.unit || 'Pcs',
          installedQuantity: pm.quantity || 1, // Standard count inside the machine
          addedAt: pm.addedAt
        };
      });

      // 2. Extract consumption history from ledger (where OUT matches machineId)
      const consumptionSummary: Record<string, {
        blueprintId: string;
        reference: string;
        name: string;
        unit: string;
        totalConsumed: number;
        lastConsumedAt: string;
      }> = {};

      enrichedMovements.forEach(mov => {
        if (mov.type === 'OUT' && mov.machineId === m.id && mov.blueprintId) {
          if (!consumptionSummary[mov.blueprintId]) {
            consumptionSummary[mov.blueprintId] = {
              blueprintId: mov.blueprintId,
              reference: mov.partReference,
              name: mov.partName,
              unit: mov.partUnit,
              totalConsumed: 0,
              lastConsumedAt: mov.timestamp
            };
          }
          consumptionSummary[mov.blueprintId].totalConsumed += mov.quantity;
          if (new Date(mov.timestamp) > new Date(consumptionSummary[mov.blueprintId].lastConsumedAt)) {
            consumptionSummary[mov.blueprintId].lastConsumedAt = mov.timestamp;
          }
        }
      });

      const consumedParts = Object.values(consumptionSummary);

      // 3. Smart suggestion logic:
      // A part is suggested for mapping if:
      // - It has been consumed on this machine (is in consumedParts)
      // - It is NOT currently mapped in mappedParts
      const suggestions = consumedParts.filter(cp => 
        !mappedParts.some(mp => mp.blueprintId === cp.blueprintId)
      );

      return {
        machineId: m.id,
        machineCode: m.referenceCode,
        serialNumber: m.serialNumber,
        status: m.status,
        mappedParts,
        consumedParts,
        suggestions,
        totalConsumedCount: consumedParts.reduce((acc, curr) => acc + curr.totalConsumed, 0)
      };
    });
  }, [isLoading, machines, partMappings, enrichedMovements, blueprintMap, templateMap]);

  // Overall statistics
  const statistics = useMemo(() => {
    const stats = {
      totalIn: 0,
      totalOut: 0,
      machinesWithOfficialParts: 0,
      totalMappedComponentsCount: 0
    };

    if (enrichedMovements.length > 0) {
      enrichedMovements.forEach(m => {
        if (m.type === 'IN') stats.totalIn += m.quantity;
        if (m.type === 'OUT') stats.totalOut += m.quantity;
      });
    }

    if (partMappings) {
      stats.totalMappedComponentsCount = partMappings.length;
      const activeMachinesMapped = new Set(partMappings.map(pm => pm.machineId));
      stats.machinesWithOfficialParts = activeMachinesMapped.size;
    }

    return stats;
  }, [enrichedMovements, partMappings]);

  // Handle explicit manual/suggested component mapping
  const handleConfirmMapping = async (machineId: string, blueprintId: string, customQty?: number) => {
    const qtyStr = mappingQuantityInput[`${machineId}-${blueprintId}`] || '1';
    const installedQty = customQty !== undefined ? customQty : parseFloat(qtyStr);

    if (isNaN(installedQty) || installedQty <= 0) {
      toast.error('الرجاء إدخال كمية صحيحة أكبر من الصفر');
      return;
    }

    try {
      // Avoid duplicate mapping
      const existing = await db.machinePartMappings
        .where('machineId')
        .equals(machineId)
        .and((x: any) => x.blueprintId === blueprintId)
        .first();

      if (existing) {
        // Update existing quantity
        await db.machinePartMappings.update(existing.id, {
          quantity: installedQty
        });
        toast.success('تم تحديث كمية المكون في شجرة الآلة بنجاح');
      } else {
        // Create new mapping
        await db.machinePartMappings.add({
          id: crypto.randomUUID(),
          machineId,
          blueprintId,
          quantity: installedQty,
          addedAt: new Date().toISOString()
        });
        toast.success('تم ربط المكون وتوثيق الكمية في شجرة مكونات الآلة بنجاح! 🚀');
      }

      // Reset inputs
      setMappingQuantityInput(prev => ({ ...prev, [`${machineId}-${blueprintId}`]: '' }));
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ الربط');
    }
  };

  // Delete official mapping
  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الربط؟ سيؤدي ذلك إلى استبعاد القطعة من شجرة مكونات الآلة القياسية.')) {
      return;
    }

    try {
      await db.machinePartMappings.delete(mappingId);
      toast.success('تم إزالة ربط المكون بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل في حذف الربط');
    }
  };

  // Add custom manual mapping (without waiting for consumption)
  const handleAddCustomMapping = async (machineId: string) => {
    if (!customPartSelect) {
      toast.error('الرجاء اختيار قطعة الغيار للربط');
      return;
    }

    const qty = parseFloat(customQtySelect);
    if (isNaN(qty) || qty <= 0) {
      toast.error('الرجاء إدخال كمية صحيحة أكبر من الصفر');
      return;
    }

    try {
      const existing = await db.machinePartMappings
        .where('machineId')
        .equals(machineId)
        .and((x: any) => x.blueprintId === customPartSelect)
        .first();

      if (existing) {
        toast.error('هذا المكون مربوط بالفعل بهذه الآلة. يمكنك تعديل الكمية المكتوبة مباشرة.');
        return;
      }

      await db.machinePartMappings.add({
        id: crypto.randomUUID(),
        machineId,
        blueprintId: customPartSelect,
        quantity: qty,
        addedAt: new Date().toISOString()
      });

      toast.success('تم إضافة المكون يدوياً وتوثيقه بنجاح!');
      setIsAddingCustomMapping(null);
      setCustomPartSelect('');
      setCustomQtySelect('1');
    } catch (err) {
      console.error(err);
      toast.error('فشل الربط اليدوي');
    }
  };

  if (isLoading) {
    return <EngineViewSkeleton mode="table" themeColor="cyan" />;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr"
      dir="ltr"
    >
      {/* Visual Header */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('pdr.history.title')}
          subtitle={t('pdr.history.subtitle')}
          icon={<History className="w-7 h-7 text-cyan-400" />}
          badgeText={t('pdr.history.badge')}
          badgeColor="cyan"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('pdr.history.totalDeposits')}
              subtitle="TOTAL DEPOSITS"
              value={statistics.totalIn}
              valueUnit={t('analytics.unit.part')}
              icon={<ArrowDownRight className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('pdr.history.totalWithdrawals')}
              subtitle="TOTAL WITHDRAWALS"
              value={statistics.totalOut}
              valueUnit={t('analytics.unit.part')}
              icon={<ArrowUpRight className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('pdr.history.calibratedMachines')}
              subtitle="CALIBRATED MACHINES"
              value={statistics.machinesWithOfficialParts}
              valueUnit={t('pdr.history.machineUnit')}
              icon={<Cpu className="w-3.5 h-3.5" />}
              color="blue"
            />
            <HeaderBentoCard
              title={t('pdr.history.mappedComponents')}
              subtitle="MAPPED COMPONENTS"
              value={statistics.totalMappedComponentsCount}
              valueUnit={t('pdr.history.itemUnit')}
              icon={<Link2 className="w-3.5 h-3.5" />}
              color="purple"
            />
          </div>
        </PageHeader>
      </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 gap-6 min-h-0">
        {/* High-Contrast Sub-Tabs Menu */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 bg-[#0b0d14] p-1.5 rounded-2xl border border-white/15 self-start shrink-0 shadow-xl">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer",
              activeSubTab === 'ledger'
                ? "bg-white text-slate-950 shadow-lg shadow-white/10"
                : "text-slate-300 hover:text-white hover:bg-white/[0.08] font-bold"
            )}
          >
            <History className="w-4 h-4 text-current" />
            <span>سجل حركات وتسويات المخزون</span>
            <span className={cn(
              "text-[10px] font-mono font-black px-2 py-0.5 rounded-md",
              activeSubTab === 'ledger' ? "bg-slate-950 text-white" : "bg-white/10 text-slate-300"
            )}>
              {filteredMovements.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('machine-consumption')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer",
              activeSubTab === 'machine-consumption'
                ? "bg-white text-slate-950 shadow-lg shadow-white/10"
                : "text-slate-300 hover:text-white hover:bg-white/[0.08] font-bold"
            )}
          >
            <Cpu className="w-4 h-4 text-current" />
            <span>مخطط ربط شجرة الآلات الذكي</span>
            <span className={cn(
              "text-[10px] font-mono font-black px-2 py-0.5 rounded-md",
              activeSubTab === 'machine-consumption' ? "bg-slate-950 text-white" : "bg-white/10 text-slate-300"
            )}>
              {machineAnalysisList.length}
            </span>
          </button>
        </motion.div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'ledger' ? (
          <motion.div
            key="ledger-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl">
              {/* Universal Command Bar */}
              <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <History className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-white uppercase tracking-tight font-sans">
                        سجل حركات وتسويات المخزون
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                        {filteredMovements.length} حركة
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      INVENTORY MOVEMENTS & CONSUMPTION LEDGER
                    </p>
                  </div>
                </div>

                <div className="flex-1 max-w-3xl">
                  <UnifiedSearchFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="بحث في الحركات برقم العملية، اسم القطعة، الفني، أو الآلة..."
                    quickTabs={quickTabs}
                    activeQuickTab={typeFilter}
                    onQuickTabChange={(id) => setTypeFilter(id as any)}
                    filterGroups={filterGroups}
                    themeColor="cyan"
                    fullWidth
                  />
                </div>
              </div>

              {/* Ledger Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table dir="rtl" className="w-full text-right border-collapse whitespace-nowrap">
                  <thead className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider font-mono text-[11px]">
                    <tr>
                      <th className="px-6 py-4">نوع وتوقيت الحركة</th>
                      <th className="px-6 py-4">قطعة الغيار</th>
                      <th className="px-6 py-4 text-center">الكمية</th>
                      <th className="px-6 py-4">المنفذ والوجهة</th>
                      <th className="px-6 py-4">البيان والملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-[#0a0a0f]/40">
                    {filteredMovements.map((mov) => (
                      <tr key={mov.id} className="group hover:bg-white/[0.04] transition-colors border-b border-white/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(mov.timestamp).toLocaleString('ar-MA', { 
                                year: 'numeric', month: 'numeric', day: 'numeric', 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                              mov.type === 'IN' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              mov.type === 'OUT' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                              'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                            )}>
                              {mov.type === 'IN' ? 'إيداع' : mov.type === 'OUT' ? 'صرف' : 'تسوية'}
                            </span>
                          </div>
                          <div className="text-[9px] font-mono text-slate-600 mt-1">ID: #{mov.id.substring(0, 8).toUpperCase()}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-sans font-bold text-slate-200 text-sm">{mov.partName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-500">المرجع:</span>
                            <span className="font-mono text-xs font-semibold text-cyan-400">{mov.partReference}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-baseline gap-1 bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg">
                            <span className="font-mono text-sm font-bold text-white">{mov.quantity}</span>
                            <span className="text-[9px] font-mono text-slate-400">{mov.partUnit}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-200 text-xs">{mov.performedBy}</div>
                          {mov.machineCode ? (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-cyan-500/10 bg-cyan-500/5 text-[9px] font-mono text-cyan-400 mt-1">
                              الآلة: {mov.machineCode}
                            </div>
                          ) : mov.type === 'OUT' ? (
                            <span className="text-[9px] text-rose-400 block mt-1">صرف مباشر (دون تخصيص آلة)</span>
                          ) : (
                            <span className="text-[9px] text-slate-500 block mt-1">مستودع الأصول</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <p className="text-xs text-slate-400 max-w-xs break-words font-sans">
                            {mov.notes || <span className="text-slate-600 italic">بدون ملاحظات</span>}
                          </p>
                        </td>
                      </tr>
                    ))}

                    {filteredMovements.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <EmptyState 
                            icon={History}
                            title={t('pdr.history.noMovements', 'لم يتم العثور على أي حركات مخزنية')}
                            description={t('pdr.history.noMovementsDesc', 'لم يتم تسجيل حركات سحب أو صرف مطابقة لمعايير البحث الحالية.')}
                            color="cyan"
                            className="py-16 opacity-80"
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="consumption-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Informative description */}
            <GlassCard className="p-6 border-cyan-500/20 bg-cyan-950/10">
              <div className="flex gap-4 items-start text-right">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-white text-base">منظومة بناء شجرة مكونات الآلات العضوية (Organic Machine B.O.M Builder)</h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    لا يتم الربط هنا عشوائياً في الخلفية. يقوم النظام بمطابقة سجلات السحب الفعلية للآلات ويقترح عليك الأجزاء التي تم استهلاكها لتتمكن من **تأكيد ربطها قياسياً بالآلة** مع كتابة **العدد الفعلي الأصلي** الذي تحتويه الآلة من هذا المكون. يمكنك أيضاً ربط أي قطعة غيار يدوياً.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Registered Machines List */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between text-right px-1">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Total Machines: {machineAnalysisList.length}</span>
                  <h3 className="text-sm font-bold text-slate-300">Select Machine for Calibration & Linking</h3>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                  {machineAnalysisList.map((m) => {
                    const isSelected = selectedMachineForDetails === m.machineId;
                    return (
                      <button
                        key={m.machineId}
                        onClick={() => {
                          setSelectedMachineForDetails(m.machineId);
                          setIsAddingCustomMapping(null);
                        }}
                        className={cn(
                          "w-full text-right p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-2 relative group",
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                            : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded",
                            m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            m.status === 'Standby' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          )}>
                            {m.status}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold text-slate-200 text-sm">Machine: {m.machineCode}</div>
                              <div className="text-[10px] text-slate-500 font-mono">SN: {m.serialNumber}</div>
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                              isSelected ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-slate-400 group-hover:text-white"
                            )}>
                              <Cpu className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/[0.04] text-xs font-mono text-slate-400">
                          <div>
                            Consumed: <span className="text-amber-400 font-bold">{m.totalConsumedCount}</span> Pcs
                          </div>
                          <div className="text-right">
                            Linked Parts: <span className="text-cyan-400 font-bold">{m.mappedParts.length}</span>
                          </div>
                        </div>

                        {/* Alert Badges for Smart Suggestion */}
                        {m.suggestions.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400 font-sans font-bold justify-end">
                            <span>{m.suggestions.length} smart linking suggestions pending</span>
                            <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Columns: Smart Workspace */}
              <div className="lg:col-span-2">
                {selectedMachineForDetails ? (
                  (() => {
                    const selectedData = machineAnalysisList.find(x => x.machineId === selectedMachineForDetails);
                    if (!selectedData) return null;

                    return (
                      <div className="space-y-6">
                        {/* Machine Identity Banner */}
                        <div className="p-6 rounded-3xl border border-white/5 bg-[#0a0f18] flex flex-col sm:flex-row justify-between items-center gap-4 text-right">
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => setIsAddingCustomMapping(selectedData.machineId)}
                              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold transition-all duration-300 flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> Manual Part Link
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="space-y-1">
                              <h2 className="text-lg font-bold text-white">Machine Components Structure: {selectedData.machineCode}</h2>
                              <p className="text-xs text-slate-400">SN: {selectedData.serialNumber} | Status: {selectedData.status}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                              <Cpu className="w-6 h-6 text-cyan-400" />
                            </div>
                          </div>
                        </div>

                        {/* Interactive Manual Mapping Form */}
                        {isAddingCustomMapping === selectedData.machineId && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-3xl border border-cyan-500/30 bg-[#070c14] space-y-4"
                          >
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <button 
                                onClick={() => setIsAddingCustomMapping(null)} 
                                className="text-slate-400 hover:text-white text-xs font-mono"
                              >
                                Cancel
                              </button>
                              <h4 className="text-xs uppercase font-bold tracking-wider text-cyan-400">Manual Part Linking</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1 text-right">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Part from Catalog</label>
                                <select
                                  value={customPartSelect}
                                  onChange={(e) => setCustomPartSelect(e.target.value)}
                                  className="titan-input py-2 appearance-none text-xs text-right"
                                >
                                  <option value="" className="bg-[#0a0f18] text-slate-500">Select part...</option>
                                  {blueprints.map(bp => {
                                    const template = templateMap.get(bp.templateId);
                                    return (
                                      <option key={bp.id} value={bp.id} className="bg-[#0a0f18]">
                                        {template?.name || 'Unknown'} - {bp.reference}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <div className="space-y-1 text-right">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Original Quantity in Machine</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={customQtySelect}
                                  onChange={(e) => setCustomQtySelect(e.target.value)}
                                  placeholder="e.g. 4"
                                  className="titan-input py-2 text-xs"
                                />
                              </div>

                              <div className="flex items-end">
                                <button
                                  onClick={() => handleAddCustomMapping(selectedData.machineId)}
                                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
                                >
                                  Confirm Linking
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Smart Recommendations Section */}
                        {selectedData.suggestions.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center justify-end gap-1.5 px-1">
                              <span>Smart Linking Suggestions from Actual Consumption</span>
                              <AlertCircle className="w-4 h-4 animate-pulse" />
                            </h3>

                            <div className="space-y-3">
                              {selectedData.suggestions.map((suggestion) => {
                                const cacheKey = `${selectedData.machineId}-${suggestion.blueprintId}`;
                                const currentInput = mappingQuantityInput[cacheKey] || '';
                                return (
                                  <div 
                                    key={suggestion.blueprintId} 
                                    className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col md:flex-row justify-between items-center gap-4 text-right"
                                  >
                                    {/* Action button & Prompt */}
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                      <button
                                        onClick={() => handleConfirmMapping(selectedData.machineId, suggestion.blueprintId)}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition-all"
                                      >
                                        Confirm & Link
                                      </button>
                                      
                                      <input
                                        type="number"
                                        placeholder="Quantity in machine?"
                                        value={currentInput}
                                        onChange={(e) => setMappingQuantityInput(prev => ({ ...prev, [cacheKey]: e.target.value }))}
                                        className="titan-input py-1.5 px-3 text-xs w-32 border-amber-500/30 text-amber-300 focus:border-amber-500 text-center"
                                      />
                                    </div>

                                    {/* Suggestion metadata */}
                                    <div className="space-y-1">
                                      <div className="font-bold text-white text-xs">{suggestion.name}</div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-2 justify-end">
                                        <span>Part: <strong className="font-mono text-amber-400">{suggestion.reference}</strong></span>
                                        <span>•</span>
                                        <span>Previously consumed <strong className="text-white">{suggestion.totalConsumed} {suggestion.unit}</strong></span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Standard B.O.M: Mapped Components Table */}
                        <div className="space-y-3">
                          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center justify-end gap-1.5 px-1">
                            <span>Standard B.O.M Components</span>
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                          </h3>

                          <GlassCard className="!p-0 border-white/5 overflow-hidden">
                            <table dir="ltr" className="w-full text-left border-collapse">
                              <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                  <th className="px-5 py-3 text-xs font-bold text-slate-400">Part Name</th>
                                  <th className="px-5 py-3 text-xs font-bold text-slate-400 text-center">Original Quantity</th>
                                  <th className="px-5 py-3 text-xs font-bold text-slate-400 text-center">Linked Date</th>
                                  <th className="px-5 py-3 text-xs font-bold text-slate-400 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {selectedData.mappedParts.map((mp) => (
                                  <tr key={mp.mappingId} className="hover:bg-white/[0.01] transition-colors">
                                    <td className="px-5 py-3">
                                      <div className="font-bold text-white text-xs">{mp.name}</div>
                                      <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{mp.reference}</div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                      <div className="inline-flex items-center gap-2">
                                        <button 
                                          onClick={() => {
                                            const newQtyStr = prompt('Enter new quantity for this part in this machine:', mp.installedQuantity.toString());
                                            if (newQtyStr !== null) {
                                              const newQty = parseFloat(newQtyStr);
                                              if (!isNaN(newQty) && newQty > 0) {
                                                handleConfirmMapping(selectedData.machineId, mp.blueprintId, newQty);
                                              } else {
                                                toast.error('Invalid quantity');
                                              }
                                            }
                                          }}
                                          title="Edit quantity"
                                          className="p-1 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg">
                                          {mp.installedQuantity} {mp.unit}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3 text-center text-[10px] font-mono text-slate-500">
                                      {new Date(mp.addedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                      <button
                                        onClick={() => handleDeleteMapping(mp.mappingId)}
                                        className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                                        title="Delete link"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}


                                {selectedData.mappedParts.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="p-0">
                                      <EmptyState 
                                        icon={Cpu}
                                        title={t('pdr.history.noMappedComponents', 'لا توجد مكونات مربوطة')}
                                        description={t('pdr.history.noMappedComponentsDesc', 'لا توجد مكونات مربوطة قياسياً بشجرة هذه الآلة بعد.')}
                                        color="blue"
                                        className="py-10 opacity-80 text-xs"
                                      />
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </GlassCard>
                        </div>

                        {/* Historical Log on this machine */}
                        <div className="space-y-3">
                          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center justify-end gap-1.5 px-1">
                            <span>سجل الحركات التاريخي الخاص بالآلة (Consumption History)</span>
                            <Activity className="w-4 h-4 text-slate-500" />
                          </h3>

                          <div className="space-y-2">
                            {selectedData.consumedParts.map((cp) => (
                              <div key={cp.blueprintId} className="p-3 rounded-2xl bg-white/[0.01] border border-white/5 flex justify-between items-center text-right text-xs">
                                <div className="font-mono text-slate-400">
                                  إجمالي السحب: <strong className="text-white">{cp.totalConsumed} {cp.unit}</strong>
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-200">{cp.name}</div>
                                  <div className="text-[10px] text-slate-500">الرمز: {cp.reference} • أخر استهلاك: {new Date(cp.lastConsumedAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                            ))}

                            {selectedData.consumedParts.length === 0 && (
                              <p className="text-xs text-slate-600 text-center py-6">
                                لا توجد عمليات سحب مسجلة لهذه الآلة في سجل المستودع.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-12 text-center min-h-[400px]">
                    <Cpu className="w-16 h-16 text-slate-700 opacity-40 mb-4 animate-pulse" />
                    <h3 className="text-slate-300 font-bold text-base mb-1">لم يتم اختيار أي آلة مسجلة</h3>
                    <p className="text-xs text-slate-500 font-sans max-w-sm">
                      اختر آلة من القائمة الجانبية لعرض شجرة مكوناتها (B.O.M)، ومراجعة سجلات الاستهلاك، وقبول اقتراحات ربط قطع الغيار الذكية.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StatCompact({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors group text-right">
      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-base font-bold text-white -mt-0.5">{value}</span>
      </div>
    </div>
  );
}
