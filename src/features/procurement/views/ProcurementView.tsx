import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/shared/components/GlassCard';
import { ShoppingCart, Clock, CheckCircle2, AlertCircle, Search, Filter, Loader2, ArrowRightCircle, PackagePlus, Zap, TrendingUp, DollarSign, Package } from 'lucide-react';
import { UnifiedSearchFilter, FilterGroup, QuickTabOption } from '@/shared/components/UnifiedSearchFilter';
import { useProcurementEngine } from '@/features/pdr-engine/hooks/useProcurementEngine';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { EmptyState } from '@/shared/components/EmptyState';
import { cn } from '@/shared/utils';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function ProcurementView() {
  const { t } = useTranslation();
  const { orders, isLoading, confirmOrder, fulfillOrder } = useProcurementEngine();
  const { showSuccess, showError } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: '#9CA3AF', bg: 'rgba(156,163,175,0.05)', border: 'rgba(156,163,175,0.2)', label: 'Draft / Pending' };
      case 'ORDERED': return { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', label: 'On Route' };
      case 'FULFILLED': return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'Stocked' };
      case 'CANCELLED': return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'Voided' };
      default: return { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', label: status };
    }
  };

  const handleAction = async (orderId: string, action: 'CONFIRM' | 'FULFILL') => {
    setProcessingId(orderId);
    try {
      if (action === 'CONFIRM') {
        await confirmOrder(orderId);
        showSuccess('Order Dispatched', 'PO has been transmitted to supplier.');
      } else if (action === 'FULFILL') {
        await fulfillOrder(orderId);
        showSuccess('Inventory Synchronized', 'Order items have been injected into global stock.');
      }
    } catch (err: any) {
      showError('Transaction Failure', err?.message || 'State transition failed');
    } finally {
      setProcessingId(null);
    }
  };

  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.supplierName))).filter(Boolean).sort();
  }, [orders]);

  const orderedCount = orders.filter(o => o.status === 'ORDERED').length;
  const fulfilledCount = orders.filter(o => o.status === 'FULFILLED').length;
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const totalSpend = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  const quickTabs: QuickTabOption[] = useMemo(() => [
    { id: 'ALL', label: 'All Orders', count: orders.length },
    { id: 'ORDERED', label: 'On Route', count: orderedCount, color: 'amber' },
    { id: 'FULFILLED', label: 'Stocked', count: fulfilledCount, color: 'emerald' },
    { id: 'PENDING', label: 'Draft', count: pendingCount, color: 'cyan' },
  ], [orders.length, orderedCount, fulfilledCount, pendingCount]);

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'status',
      label: 'Order Status',
      value: statusFilter,
      onChange: setStatusFilter,
      allLabel: 'All Statuses',
      type: 'chips',
      options: [
        { value: 'ORDERED', label: 'On Route', count: orderedCount },
        { value: 'FULFILLED', label: 'Stocked', count: fulfilledCount },
        { value: 'PENDING', label: 'Draft', count: pendingCount },
        { value: 'CANCELLED', label: 'Voided' },
      ]
    },
    {
      id: 'vendor',
      label: 'Supplier / Vendor',
      value: vendorFilter,
      onChange: setVendorFilter,
      allLabel: 'All Suppliers',
      options: uniqueVendors.map(v => ({ value: v, label: v }))
    }
  ], [statusFilter, vendorFilter, orderedCount, fulfilledCount, pendingCount, uniqueVendors]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = !searchTerm || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchVendor = vendorFilter === 'ALL' || order.supplierName === vendorFilter;
      return matchSearch && matchStatus && matchVendor;
    });
  }, [orders, searchTerm, statusFilter, vendorFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin opacity-50" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Syncing Procurement Data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr"
      dir="ltr"
    >
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('procurement.pipeline.title')}
          subtitle={t('procurement.pipeline.subtitle')}
          icon={<ShoppingCart className="w-7 h-7 text-cyan-400" />}
          badgeText={t('procurement.pipeline.badge')}
          badgeColor="cyan"
          className="mb-8"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('procurement.pipeline.activeOrders')}
              subtitle="ON ROUTE"
              value={orderedCount}
              valueUnit={t('procurement.pipeline.orderUnit')}
              icon={<Clock className="w-3.5 h-3.5" />}
              color="amber"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('procurement.pipeline.syncedOrders')}
              subtitle="FULFILLED"
              value={fulfilledCount}
              valueUnit={t('procurement.pipeline.syncUnit')}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="emerald"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('procurement.pipeline.totalOrders')}
              subtitle="TOTAL ORDERS"
              value={orders.length}
              valueUnit={t('procurement.pipeline.poUnit')}
              icon={<Package className="w-3.5 h-3.5" />}
              color="cyan"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('procurement.pipeline.totalSpend')}
              subtitle="ESTIMATED SPEND"
              value={`${(totalSpend/1000).toFixed(1)}k`}
              valueUnit="USD"
              icon={<DollarSign className="w-3.5 h-3.5" />}
              color="purple"
              isActive={false}
            />
          </div>
        </PageHeader>
      </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 gap-6 min-h-0">
        <motion.div variants={itemVariants}>
        <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl">
        {/* Universal Command Bar */}
        <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white uppercase tracking-tight font-sans">
                  سجل أوامر التوريد والشراء
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  {filteredOrders.length} طلب
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                PURCHASE ORDERS & VENDOR TRACKING
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-3xl">
            <UnifiedSearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="بحث في الأوامر برقم الطلب، اسم المورد، أو المواد..."
              quickTabs={quickTabs}
              activeQuickTab={statusFilter}
              onQuickTabChange={setStatusFilter}
              filterGroups={filterGroups}
              themeColor="cyan"
              fullWidth
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table dir="ltr" className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider font-mono text-[11px]">
              <tr>
                <th className="px-6 py-4">{t('procurement.orderNumber', 'Order #')}</th>
                <th className="px-6 py-4">{t('procurement.supplier', 'Supplier')}</th>
                <th className="px-6 py-4">{t('procurement.date', 'Date')}</th>
                <th className="px-6 py-4">{t('procurement.items', 'Items')}</th>
                <th className="px-6 py-4 text-center">{t('procurement.status', 'Status')}</th>
                <th className="px-6 py-4 text-center">{t('procurement.estimatedValue', 'Est. Value')}</th>
                <th className="px-6 py-4 text-right">{t('procurement.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0a0a0f]/40">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order, idx) => {
                  const style = getStatusStyle(order.status);
                  const isProcessing = processingId === order.id;
                  
                  return (
                    <motion.tr 
                      key={order.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-white/[0.04] transition-colors border-b border-white/5"
                    >
                      <td className="px-6 py-4 text-xs font-mono font-bold text-cyan-400">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white tracking-tight">{order.supplierName}</span>
                          {order.supplierName === 'SYSTEM_AUTO_GENERATED' && (
                            <span className="text-[9px] font-bold text-cyan-400/80 uppercase tracking-widest mt-0.5">طلب آلي من النظام</span>
                          ) }
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">
                        {new Date(order.orderDate).toLocaleDateString('ar-MA')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-slate-300 font-mono border border-white/10">
                          {order.lines.length} قطع
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <motion.div 
                          layout
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all shadow-sm",
                            order.status === 'ORDERED' && "shadow-cyan-500/5"
                          )}
                          style={{ backgroundColor: style.bg, borderColor: style.border, color: style.color }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          {order.status === 'PENDING' ? 'مسودة قيد المعالجة' :
                           order.status === 'ORDERED' ? 'في طريق التوريد' :
                           order.status === 'FULFILLED' ? 'تم الاستلام والإيداع' : 'ملغي'}
                        </motion.div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono font-medium text-white text-center">
                        ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex justify-end gap-2">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleAction(order.id, 'CONFIRM')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <ArrowRightCircle className="w-3.5 h-3.5"/>}
                              إرسال للمورد
                            </button>
                          )}
                          
                          {order.status === 'ORDERED' && (
                            <button
                              onClick={() => handleAction(order.id, 'FULFILL')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <PackagePlus className="w-3.5 h-3.5"/>}
                              استلام وإدخال للمخزن
                            </button>
                          )}

                          {order.status === 'FULFILLED' && (
                            <div className="w-8 h-8 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filteredOrders.length === 0 && (
                <tr className="bg-[#0a0a0f]/20">
                  <td colSpan={7} className="p-0">
                    <EmptyState 
                      icon={ShoppingCart}
                      title={t('procurement.noOrders', 'لا توجد أوامر توريد مطابقة لمعايير البحث')}
                      description={t('procurement.noOrdersDesc', 'يمكنك تعديل خيارات البحث أو التصفية لعرض الأوامر المتاحة.')}
                      color="amber"
                      className="py-20 opacity-80"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCompact({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors group">
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
