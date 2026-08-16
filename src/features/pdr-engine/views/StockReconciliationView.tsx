import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TaskExecution, type ConsumedPartClaim } from '@/core/db';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Search, 
  Filter, 
  PackageCheck, 
  Check, 
  MinusCircle, 
  Building2, 
  UserCheck, 
  Layers, 
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Box
} from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { KpiCard } from '@/shared/components/KpiCard';
import { BadgePill } from '@/shared/components/BadgePill';
import { Button } from '@/shared/components/Button';
import { PdrPageSkeleton } from '../components/PdrPageSkeleton';
import { toast } from 'sonner';
import { UnifiedSearchFilter } from '@/shared/components/UnifiedSearchFilter';
import { EmptyState } from '@/shared/components/EmptyState';

export function StockReconciliationView({ user }: { user: any }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RECONCILED'>('ALL');

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
  const movements = data?.movements ?? [];

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
    return <PdrPageSkeleton />;
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

      toast.success(`تم تأكيد مطابقة سحب البون ${item.bonId} بنجاح (دون خصم إضافي)`);
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

      toast.success(`تم خصم الكمية (${item.claim.quantity}) وتحديث حركة المخزن للبون ${item.bonId} بنجax`);
    } catch (err: any) {
      console.error(err);
      toast.error('خطأ في خصم المخزن: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr" dir="ltr">
      {/* HEADER COCKPIT */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('pdr.reconciliation.title')}
          subtitle={t('pdr.reconciliation.subtitle')}
          icon={<ClipboardCheck className="w-7 h-7 text-cyan-400" />}
          badgeText={t('pdr.reconciliation.badge')}
          badgeColor="cyan"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('pdr.reconciliation.totalClaims')}
              subtitle="TOTAL CLAIMS"
              value={stats.total}
              valueUnit={t('pdr.reconciliation.claimUnit')}
              icon={<Box className="w-3.5 h-3.5" />}
              color="cyan"
            />
            <HeaderBentoCard
              title={t('pdr.reconciliation.pendingAudit')}
              subtitle="PENDING AUDIT"
              value={stats.pending}
              valueUnit={t('pdr.reconciliation.reqUnit')}
              icon={<Clock className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('pdr.reconciliation.reconciled')}
              subtitle="RECONCILED"
              value={stats.reconciled}
              valueUnit={t('pdr.reconciliation.bonUnit')}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('pdr.reconciliation.deductedStock')}
              subtitle="DEDUCTED STOCK"
              value={stats.deducted}
              valueUnit={t('pdr.reconciliation.opUnit')}
              icon={<PackageCheck className="w-3.5 h-3.5" />}
              color="blue"
            />
          </div>
        </PageHeader>
      </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 pb-8 gap-6 min-h-0">
        <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl">
          {/* Universal Command Bar */}
          <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white uppercase tracking-tight font-sans">
                    مطابقة بونات السحب والصرف
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                    {filteredClaims.length} بون
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  VOUCHER RECONCILIATION & AUDIT RADAR
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-3xl">
              <UnifiedSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="بحث برقم البون، اسم القطعة، كود الآلة، أو اسم الفني..."
                quickTabs={[
                  { id: 'ALL', label: 'الكل', count: stats.total },
                  { id: 'PENDING', label: 'معلقة للتدقيق', count: stats.pending },
                  { id: 'RECONCILED', label: 'مطابقة ومعتمدة', count: stats.reconciled + stats.deducted },
                ]}
                activeQuickTab={statusFilter}
                onQuickTabChange={(id) => setStatusFilter(id as any)}
                themeColor="cyan"
                fullWidth
              />
            </div>
          </div>

          {/* TABLE RADAR */}
          <div className="overflow-x-auto custom-scrollbar">
            <table dir="rtl" className="w-full text-right text-xs border-collapse">
              <thead className="bg-white/[0.04] text-slate-300 border-b border-white/10 font-bold uppercase tracking-wider font-mono text-[11px]">
                <tr>
                  <th className="py-4 px-6">رقم البون</th>
                  <th className="py-4 px-6">الآلة والقطاع</th>
                  <th className="py-4 px-6">الفني وتاريخ التدخل</th>
                  <th className="py-4 px-6">القطعة المسجلة</th>
                  <th className="py-4 px-6 text-center">الكمية</th>
                  <th className="py-4 px-6 text-center">رصيد المخزن الفعلي</th>
                  <th className="py-4 px-6 text-center">حالة المطابقة</th>
                  <th className="py-4 px-6 text-left">إجراء أمين المخزن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium bg-[#0a0a0f]/40">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <EmptyState 
                        icon={PackageCheck}
                        title={t('pdr.reconciliation.noClaims', 'لا توجد طلبات سحب قطع')}
                        description={t('pdr.reconciliation.noClaimsDesc', 'لا توجد طلبات سحب قطع مطابقة للشروط الحالية للمراجعة والتسوية.')}
                        color="cyan"
                        className="py-16 opacity-80"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((item, idx) => {
                    const isReconciled = item.claim.reconciled;
                    const isDeducted = item.claim.deductedStock;

                    return (
                      <tr 
                        key={`${item.executionId}-${idx}`}
                        className="hover:bg-white/[0.04] transition-colors border-b border-white/5"
                      >
                        {/* BON ID */}
                        <td className="py-4 px-6">
                          <div className="font-mono font-extrabold text-cyan-400 text-sm tracking-tight flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            {item.bonId}
                          </div>
                        </td>

                        {/* MACHINE & SECTOR */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-white text-xs">{item.machineRef}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sectorName}</div>
                        </td>

                        {/* TECH & DATE */}
                        <td className="py-4 px-6">
                          <div className="text-slate-200 font-bold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            {item.techName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {new Date(item.executedAt).toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </td>

                        {/* CLAIMED PART */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-white text-xs">{item.partName}</div>
                          <div className="text-[10px] font-mono text-cyan-400/80 mt-0.5">{item.partRef}</div>
                        </td>

                        {/* QTY CLAIMED */}
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs">
                            x{item.claim.quantity}
                          </span>
                        </td>

                        {/* CURRENT STOCK */}
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            item.stockCurrentQty > 0 
                              ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {item.stockCurrentQty} قطع
                          </span>
                        </td>

                        {/* AUDIT STATUS */}
                        <td className="py-4 px-6 text-center">
                          {isDeducted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                              <PackageCheck className="w-3 h-3" /> تم الخصم فورياً
                            </span>
                          ) : isReconciled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" /> مطابقة سابقة
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                              <Clock className="w-3 h-3" /> في انتظار المطابقة
                            </span>
                          )}
                        </td>

                        {/* STOREKEEPER ACTIONS */}
                        <td className="py-4 px-6 text-left">
                          {isReconciled ? (
                            <div className="text-[10px] text-slate-500 font-mono text-left">
                              تمت بواسطة: {item.claim.reconciledBy || 'المسؤول'}
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {/* Option A: Match without deducting again */}
                              <button
                                onClick={() => handleConfirmMatchOnly(item)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-bold text-[11px] flex items-center gap-1"
                                title="تأكيد أن القطعة سُحبت مسبقاً وسُجلت بالمسودات"
                              >
                                <Check className="w-3.5 h-3.5" />
                                تأكيد المطابقة
                              </button>

                              {/* Option B: Deduct stock right now if forgotten */}
                              <button
                                onClick={() => handleDeductAndReconcile(item)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all font-bold text-[11px] flex items-center gap-1"
                                title="خصم الكمية الآن من المخزن واعتماد السحب"
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                                خصم واعتماد
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
