import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/shared/components/GlassCard';
import { ShoppingCart, Clock, CheckCircle2, AlertCircle, Search, Filter, Loader2, ArrowRightCircle, PackagePlus, Zap, TrendingUp, DollarSign, Package } from 'lucide-react';
import { useProcurementEngine } from '@/features/pdr-engine/hooks/useProcurementEngine';
import { useNotifications } from '@/shared/hooks/useNotifications';
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

  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const orderedCount = orders.filter(o => o.status === 'ORDERED').length;
  const fulfilledCount = orders.filter(o => o.status === 'FULFILLED').length;
  const totalSpend = orders.reduce((sum, order) => sum + order.totalAmount, 0);

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
        <GlassCard className="!p-0 border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Purchase Orders</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time procurement tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Find orders or vendors..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="titan-input pl-11 w-80 shadow-none"
              />
            </div>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table dir="ltr" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1c23]/50">
                <th className="px-8 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Order ID</th>
                <th className="px-8 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Vendor</th>
                <th className="px-8 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">BOM Lines</th>
                <th className="px-8 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-left">Value</th>
                <th className="px-8 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03] bg-[#0a0a0f]/5">
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
                      className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0"
                    >
                      <td className="px-8 py-6 text-xs font-mono font-bold text-cyan-500">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white tracking-tight">{order.supplierName}</span>
                          {order.supplierName === 'SYSTEM_AUTO_GENERATED' && (
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Automated System</span>
                          ) }
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs font-medium text-slate-400">{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/10">
                          {order.lines.length} Items
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <motion.div 
                          layout
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all shadow-sm",
                            order.status === 'ORDERED' && "shadow-cyan-500/5"
                          )}
                          style={{ backgroundColor: style.bg, borderColor: style.border, color: style.color }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          {style.label}
                        </motion.div>
                      </td>
                      <td className="px-8 py-6 text-sm font-mono font-medium text-white text-left">
                        ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6 text-left">
                        <div className="flex justify-end gap-2">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleAction(order.id, 'CONFIRM')}
                              disabled={isProcessing}
                              className="titan-button titan-button-primary !px-4 !py-2 !text-[9px]"
                            >
                              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : <ArrowRightCircle className="w-3 h-3"/>}
                              Transmit
                            </button>
                          )}
                          
                          {order.status === 'ORDERED' && (
                            <button
                              onClick={() => handleAction(order.id, 'FULFILL')}
                              disabled={isProcessing}
                              className="titan-button titan-button-success !px-4 !py-2 !text-[9px]"
                            >
                              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : <PackagePlus className="w-3 h-3"/>}
                              Receive
                            </button>
                          )}

                          {order.status === 'FULFILLED' && (
                            <div className="w-8 h-8 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <AlertCircle className="w-16 h-16 mb-4 text-white" />
                      <p className="text-lg font-bold uppercase tracking-widest text-white">No active purchase orders found</p>
                    </div>
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
