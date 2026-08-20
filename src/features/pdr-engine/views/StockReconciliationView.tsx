import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TaskExecution, type ConsumedPartClaim } from '@/core/db';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  Check, 
  MinusCircle, 
  UserCheck, 
  ShieldCheck,
  Box,
  Eye,
  LayoutGrid,
  Cpu,
  Layers,
  MapPin
} from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { EngineViewSkeleton } from '@/shared/components/EngineViewSkeleton';
import { RegistryGuidanceState } from '@/core/ui/RegistryGuidanceState';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export function StockReconciliationView({ user }: { user: any }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RECONCILED'>('ALL');
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');

  // Query live data
  const data = useLiveQuery(async () => {
    const [taskExecutions, inventory, pdrBlueprints, pdrTemplates, machines, sectors, technicians, movements] = await Promise.all([
      db.taskExecutions.where('serviceType').equals('CORR').toArray(),
      db.inventory.toArray(),
      db.pdrBlueprints.toArray(),
      db.pdrTemplates.toArray(),
      db.machines.toArray(),
      db.sectors.toArray(),
      db.technicians.toArray(),
      db.movements.toArray()
    ]);
    return { taskExecutions, inventory, pdrBlueprints, pdrTemplates, machines, sectors, technicians, movements };
  }, []);

  const taskExecutions = data?.taskExecutions ?? [];
  const inventory = data?.inventory ?? [];
  const pdrBlueprints = data?.pdrBlueprints ?? [];
  const pdrTemplates = data?.pdrTemplates ?? [];
  const machines = data?.machines ?? [];
  const sectors = data?.sectors ?? [];
  const technicians = data?.technicians ?? [];

  // Lookup maps
  const invMap = useMemo(() => new Map(inventory.map(i => [i.id, i])), [inventory]);
  const bpMap = useMemo(() => new Map(pdrBlueprints.map(b => [b.id, b])), [pdrBlueprints]);
  const tempMap = useMemo(() => new Map(pdrTemplates.map(t => [t.id, t])), [pdrTemplates]);
  const machineMap = useMemo(() => new Map(machines.map(m => [m.id, m])), [machines]);
  const sectorMap = useMemo(() => new Map(sectors.map(s => [s.id, s])), [sectors]);
  const techMap = useMemo(() => new Map(technicians.map(t => [t.id, t])), [technicians]);

  // Extract all claims from executions that have NEW parts claimed
  const claimsList = useMemo(() => {
    const items: {
      executionId: string;
      bonId: string;
      machineRef: string;
      sectorName: string;
      techName: string;
      executedAt: string;
      claimIndex: number;
      claim: ConsumedPartClaim;
      partName: string;
      partRef: string;
      stockCurrentQty: number;
      stockId?: string;
    }[] = [];

    taskExecutions.forEach(ex => {
      if (!ex.claimedParts || ex.claimedParts.length === 0) return;
      const machine = machineMap.get(ex.machineId);
      const sector = machine ? sectorMap.get(machine.sectorId) : null;
      const tech = techMap.get(ex.doneBy || '');

      ex.claimedParts.forEach((claim, index) => {
        if (!claim.isNew) return; // Only NEW parts claims from PDR main store need reconciliation
        let stockItem = claim.stockId ? invMap.get(claim.stockId) : null;
        if (!stockItem && claim.blueprintId) {
          stockItem = inventory.find(i => i.blueprintId === claim.blueprintId);
        }

        const blueprint = stockItem ? bpMap.get(stockItem.blueprintId) : (claim.blueprintId ? bpMap.get(claim.blueprintId) : null);
        const template = blueprint ? tempMap.get(blueprint.templateId) : null;

        items.push({
          executionId: ex.id,
          bonId: ex.bonId || `BDC-${ex.id.slice(0, 6).toUpperCase()}`,
          machineRef: machine?.referenceCode || 'M-REG',
          sectorName: sector?.name || 'القطاع العام',
          techName: tech?.name || ex.doneBy || 'فني الصيانة',
          executedAt: ex.executedAt || ex.scheduledDate,
          claimIndex: index,
          claim,
          partName: template?.name || 'قطعة غيار غير معروفة',
          partRef: blueprint?.reference || 'REF-N/A',
          stockCurrentQty: stockItem ? stockItem.quantityCurrent : 0,
          stockId: stockItem?.id
        });
      });
    });

    return items.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
  }, [taskExecutions, machineMap, sectorMap, techMap, invMap, bpMap, tempMap, inventory]);

  // Stats
  const stats = useMemo(() => {
    const total = claimsList.length;
    const pending = claimsList.filter(c => !c.claim.reconciled).length;
    const reconciled = claimsList.filter(c => c.claim.reconciled && !c.claim.deductedStock).length;
    const deducted = claimsList.filter(c => c.claim.deductedStock).length;
    return { total, pending, reconciled, deducted };
  }, [claimsList]);

  // Filter groups for UnifiedSearchFilter
  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'status',
      label: 'حالة المطابقة',
      value: statusFilter,
      onChange: (val) => setStatusFilter(val as any),
      allLabel: 'جميع البونات',
      type: 'chips',
      options: [
        { value: 'PENDING', label: 'معلقة للتدقيق', count: stats.pending },
        { value: 'RECONCILED', label: 'مطابقة ومعتمدة', count: stats.reconciled + stats.deducted }
      ]
    }
  ], [statusFilter, stats]);

  // Filtered List
  const filteredClaims = useMemo(() => {
    return claimsList.filter(item => {
      const matchesSearch = searchTerm ? (
        item.bonId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.machineRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.techName.toLowerCase().includes(searchTerm.toLowerCase())
      ) : true;

      const matchesStatus = statusFilter === 'PENDING' ? !item.claim.reconciled
        : statusFilter === 'RECONCILED' ? item.claim.reconciled
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [claimsList, searchTerm, statusFilter]);

  if (!data) {
    return <EngineViewSkeleton mode="table" themeColor="cyan" />;
  }

  // Storekeeper Action 1: Confirm Match (Without extra deduction)
  const handleConfirmMatchOnly = async (item: typeof claimsList[0]) => {
    try {
      const execution = await db.taskExecutions.get(item.executionId);
      if (!execution || !execution.claimedParts) return;

      const updatedParts = [...execution.claimedParts];
      updatedParts[item.claimIndex] = {
        ...updatedParts[item.claimIndex],
        reconciled: true,
        reconciledAt: new Date().toISOString(),
        reconciledBy: user?.name || 'مسؤول المخزن',
        deductedStock: false
      };

      const allReconciled = updatedParts.every(p => !p.isNew || p.reconciled);

      await db.taskExecutions.update(item.executionId, {
        claimedParts: updatedParts,
        reconciliationStatus: allReconciled ? 'RECONCILED' : 'PENDING_MATCH'
      });

      toast.success(`تم تأكيد مطابقة سحب البون ${item.bonId} بنجاح`);
    } catch (err: any) {
      console.error(err);
      toast.error('فشلت عملية المطابقة: ' + err.message);
    }
  };

  // Storekeeper Action 2: Process Missing Stock Deduction
  const handleDeductAndReconcile = async (item: typeof claimsList[0]) => {
    if (!item.stockId) {
      toast.error('لم يتم العثور على العنصر في رصيد المخزن للخصم منه');
      return;
    }

    const stockItem = await db.inventory.get(item.stockId);
    if (!stockItem) {
      toast.error('العنصر غير موجود بالمخزن');
      return;
    }

    if (stockItem.quantityCurrent < item.claim.quantity) {
      if (!confirm(`⚠️ تنبيه: الكمية المطلوبة (${item.claim.quantity}) أكبر من المتوفر حالياً بالمخزن (${stockItem.quantityCurrent}). هل ترغب بالخصم وإبقاء الرصيد 0؟`)) {
        return;
      }
    }

    try {
      const timestamp = new Date().toISOString();
      const newQty = Math.max(0, stockItem.quantityCurrent - item.claim.quantity);

      // 1. Deduct Stock
      await db.inventory.update(stockItem.id, {
        quantityCurrent: newQty,
        updatedAt: timestamp
      });

      // 2. Add Stock OUT movement
      await db.movements.add({
        id: crypto.randomUUID(),
        stockId: stockItem.id,
        type: 'OUT',
        quantity: item.claim.quantity,
        performedBy: user?.name || 'Magasinier (Audit)',
        notes: `خصم معتمد عبر مطابقة البون ${item.bonId} - الآلة: ${item.machineRef}`,
        timestamp
      });

      // 3. Update execution claim status
      const execution = await db.taskExecutions.get(item.executionId);
      if (execution && execution.claimedParts) {
        const updatedParts = [...execution.claimedParts];
        updatedParts[item.claimIndex] = {
          ...updatedParts[item.claimIndex],
          reconciled: true,
          reconciledAt: timestamp,
          reconciledBy: user?.name || 'مسؤول المخزن',
          deductedStock: true
        };

        const allReconciled = updatedParts.every(p => !p.isNew || p.reconciled);

        await db.taskExecutions.update(item.executionId, {
          claimedParts: updatedParts,
          reconciliationStatus: allReconciled ? 'STOCK_DEDUCTED' : 'PENDING_MATCH'
        });
      }

      toast.success(`تم خصم الكمية (${item.claim.quantity}) وتحديث حركة المخزن للبون ${item.bonId} بنجاح`);
    } catch (err: any) {
      console.error(err);
      toast.error('خطأ في خصم المخزن: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-slate-800 dark:text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr" dir="ltr">
      {/* HEADER COCKPIT */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('pdr.reconciliation.title', 'مطابقة بونات الصرف')}
          subtitle={t('pdr.reconciliation.subtitle', 'تدقيق ومطابقة بونات سحب قطع الغيار مع رصيد المخزن الفعلي')}
          icon={<ClipboardCheck className="w-7 h-7 text-cyan-400" />}
          badgeText={t('pdr.reconciliation.badge', 'PDR Audit')}
          badgeColor="cyan"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('pdr.reconciliation.totalClaims', 'إجمالي الطلبات')}
              subtitle="TOTAL CLAIMS"
              value={stats.total}
              icon={<Box className="w-3.5 h-3.5" />}
              color="cyan"
            />
            <HeaderBentoCard
              title={t('pdr.reconciliation.pendingAudit', 'معلقة للتدقيق')}
              subtitle="PENDING AUDIT"
              value={stats.pending}
              icon={<Clock className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('pdr.reconciliation.reconciled', 'مطابقة ومعتمدة')}
              subtitle="RECONCILED"
              value={stats.reconciled}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('pdr.reconciliation.deductedStock', 'تم الخصم فورياً')}
              subtitle="DEDUCTED STOCK"
              value={stats.deducted}
              icon={<PackageCheck className="w-3.5 h-3.5" />}
              color="blue"
            />
          </div>
        </PageHeader>
      </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 gap-6 min-h-0">
        <motion.div variants={itemVariants} className="flex-1 min-h-0 flex flex-col">
          <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-full flex flex-col bg-[#0a0b10]/95 backdrop-blur-xl relative">
            {/* Engine Top Accent Line */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

            {/* Universal Crystal Command Bar */}
            <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
              {/* Left Side: Context Count */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">سجل مطابقة البونات</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      {filteredClaims.length} بون
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VOUCHER AUDIT & RECONCILIATION RADAR</p>
                </div>
              </div>

              {/* Center & Right: Search, Filter Chips & View Switcher */}
              <div className="flex-1 max-w-2xl w-full">
                <UnifiedSearchFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  searchPlaceholder="بحث برقم البون، اسم القطعة، كود الآلة، أو اسم الفني..."
                  filterGroups={filterGroups}
                  themeColor="cyan"
                  extraControls={
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/10 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDisplayMode('table')}
                          className={cn(
                            "p-1.5 rounded-lg transition-all cursor-pointer",
                            displayMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                          )}
                          title="عرض الجدول الكريستالي"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDisplayMode('cards')}
                          className={cn(
                            "p-1.5 rounded-lg transition-all cursor-pointer",
                            displayMode === 'cards' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                          )}
                          title="عرض شبكة البطاقات"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Content Area - Full Bleed Table / Cards Container */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-transparent relative">
              {filteredClaims.length === 0 ? (
                <div className="p-6 md:p-8 flex-1 flex items-center justify-center">
                  <RegistryGuidanceState
                    id="stock-reconciliation-guidance"
                    icon={ClipboardCheck}
                    title={
                      searchTerm || statusFilter !== 'ALL'
                        ? 'لم يتم العثور على بونات مطابقة'
                        : 'رادار مطابقة بونات الصرف'
                    }
                    subtitle={
                      searchTerm || statusFilter !== 'ALL'
                        ? 'لا توجد بونات سحب تطابق معايير البحث والفلترة المحددة. يمكنك تصفير الفلاتر لمعاينة كافة السجلات.'
                        : 'الواجهة الرقابية لمسؤول المخزن لتدقيق كافة قطع الغيار المسحوبة عبر أوامر الصيانة العلاجية ومطابقتها مع الرصيد المخزني.'
                    }
                    isSearchActive={Boolean(searchTerm || statusFilter !== 'ALL')}
                    onClearSearch={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                    }}
                    secondaryAction={{
                      label: 'عرض جميع البونات',
                      icon: Eye,
                      onClick: () => {
                        setStatusFilter('ALL');
                        setSearchTerm('');
                      }
                    }}
                    guidanceCards={[
                      {
                        icon: ShieldCheck,
                        title: 'الرقابة المزدوجة على المخزون',
                        description: 'كل قطعة جديدة يسحبها الفني في أمر العمل تتطلب تدقيق أمين المخزن لضمان مطابقة الرصيد الدفتري مع الواقع الفيزيائي.'
                      },
                      {
                        icon: PackageCheck,
                        title: 'الخصم التلقائي عند التدقيق',
                        description: 'في حال عدم خصم القطعة مسبقاً، يتيح زر "خصم واعتماد" إنقاص رصيد المخزن فوراً وتسجيل حركة سحب معتمدة.'
                      }
                    ]}
                    themeColor="cyan"
                  />
                </div>
              ) : displayMode === 'table' ? (
                /* Crystal High-Contrast Full Table View */
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-0">
                  <table className="w-full text-start border-collapse">
                    <thead className="bg-[#12141d] border-b-2 border-white/15 text-slate-200 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
                      <tr>
                        <th className="py-4 px-6 text-start font-extrabold">{t('pdr.reconciliation.thVoucher', 'رقم البون')}</th>
                        <th className="py-4 px-6 text-start font-extrabold">{t('pdr.reconciliation.thPart', 'القطعة المسجلة')}</th>
                        <th className="py-4 px-6 text-start font-extrabold">{t('pdr.reconciliation.thMachine', 'الآلة والقطاع')}</th>
                        <th className="py-4 px-6 text-start font-extrabold">{t('pdr.reconciliation.thTech', 'الفني والتاريخ')}</th>
                        <th className="py-4 px-6 text-center font-extrabold">{t('pdr.reconciliation.thQty', 'الكمية')}</th>
                        <th className="py-4 px-6 text-center font-extrabold">{t('pdr.reconciliation.thCurrentStock', 'رصيد المخزن')}</th>
                        <th className="py-4 px-6 text-center font-extrabold">{t('pdr.reconciliation.thAuditStatus', 'الحالة')}</th>
                        <th className="py-4 px-6 text-center font-extrabold">{t('pdr.reconciliation.thStorekeeperAction', 'الإجراء')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-medium">
                      {filteredClaims.map((item, idx) => {
                        const isReconciled = item.claim.reconciled;
                        const isDeducted = item.claim.deductedStock;

                        return (
                          <tr 
                            key={`${item.executionId}-${idx}`} 
                            className={cn(
                              "transition-colors duration-150 group text-start cursor-pointer",
                              idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                              "hover:bg-cyan-500/15 hover:text-white"
                            )}
                          >
                            {/* Voucher Code */}
                            <td className="py-3.5 px-6 font-mono font-extrabold">
                              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300 text-[11px] inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                {item.bonId}
                              </span>
                            </td>

                            {/* Claimed Part */}
                            <td className="py-3.5 px-6">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-white text-xs tracking-tight group-hover:text-cyan-200 transition-colors">
                                  {item.partName}
                                </span>
                                <span className="text-[10px] font-mono text-cyan-400 font-medium mt-0.5">
                                  {item.partRef}
                                </span>
                              </div>
                            </td>

                            {/* Machine & Sector */}
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                  <Cpu className="w-3 h-3 text-cyan-400" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-200 text-xs">{item.machineRef}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">{item.sectorName}</span>
                                </div>
                              </div>
                            </td>

                            {/* Tech & Date */}
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                  <UserCheck className="w-3 h-3" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-200 text-xs">{item.techName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(item.executedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Quantity Claimed */}
                            <td className="py-3.5 px-6 text-center">
                              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs">
                                x{item.claim.quantity}
                              </span>
                            </td>

                            {/* Current Stock */}
                            <td className="py-3.5 px-6 text-center">
                              <span className={cn(
                                "font-mono font-bold px-2.5 py-1 rounded-md text-xs border",
                                item.stockCurrentQty > 0 
                                  ? "bg-white/5 text-slate-300 border-white/10" 
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              )}>
                                {item.stockCurrentQty} قطع
                              </span>
                            </td>

                            {/* Audit Status */}
                            <td className="py-3.5 px-6 text-center">
                              {isDeducted ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                                  <PackageCheck className="w-3 h-3" /> تم الخصم
                                </span>
                              ) : isReconciled ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> مطابق
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> في الانتظار
                                </span>
                              )}
                            </td>

                            {/* Storekeeper Actions */}
                            <td className="py-3.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              {isReconciled ? (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  بواسطة: {item.claim.reconciledBy || 'المسؤول'}
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleConfirmMatchOnly(item)}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="تأكيد المطابقة"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>مطابقة</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeductAndReconcile(item)}
                                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="خصم واعتماد"
                                  >
                                    <MinusCircle className="w-3 h-3" />
                                    <span>خصم</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Cards View */
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                      {filteredClaims.map((item, idx) => {
                        const isReconciled = item.claim.reconciled;
                        const isDeducted = item.claim.deductedStock;

                        return (
                          <motion.div 
                            key={`${item.executionId}-${idx}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="titan-card overflow-hidden flex flex-col group relative shadow-none p-0 hover:border-cyan-500 transition-all duration-300 border border-white/10 bg-[#0a0a0f] rounded-3xl"
                          >
                            <div className="p-6 relative z-10 flex-1">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                                    <ClipboardCheck className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className="text-base font-bold text-slate-300 group-hover:text-white group-hover:font-black tracking-tight uppercase transition-all duration-300">
                                      {item.bonId}
                                    </h3>
                                    <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono font-bold mt-0.5">
                                      {item.partRef}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  {isDeducted ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                      تم الخصم
                                    </span>
                                  ) : isReconciled ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                      مطابق
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      في الانتظار
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2 mb-4">
                                <div className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                                  {item.partName}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{item.machineRef} • {item.sectorName}</span>
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{item.techName}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 divide-x divide-white/10 bg-white/[0.02] border-t border-white/10 mt-auto relative z-10 transition-colors duration-300">
                              <div className="p-4 flex flex-col items-center justify-center gap-1 group/stat hover:bg-white/[0.05] transition-colors">
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">الكمية المسحوبة</div>
                                <span className="text-base font-bold font-mono text-cyan-300">x{item.claim.quantity}</span>
                              </div>
                              <div className="p-4 flex flex-col items-center justify-center gap-1 group/stat hover:bg-white/[0.05] transition-colors">
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">رصيد المخزن</div>
                                <span className={cn("text-base font-bold font-mono", item.stockCurrentQty > 0 ? "text-slate-300" : "text-rose-400")}>
                                  {item.stockCurrentQty}
                                </span>
                              </div>
                            </div>

                            {!isReconciled && (
                              <div className="p-3 bg-white/[0.01] border-t border-white/5 flex gap-2">
                                <button
                                  onClick={() => handleConfirmMatchOnly(item)}
                                  className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>مطابقة</span>
                                </button>
                                <button
                                  onClick={() => handleDeductAndReconcile(item)}
                                  className="flex-1 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <MinusCircle className="w-3.5 h-3.5" />
                                  <span>خصم</span>
                                </button>
                              </div>
                            )}
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
