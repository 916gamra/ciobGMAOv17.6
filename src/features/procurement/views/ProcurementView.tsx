import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  ArrowRightCircle, 
  PackagePlus, 
  DollarSign, 
  Package, 
  Eye, 
  LayoutGrid, 
  Activity, 
  Save, 
  Truck, 
  Building2, 
  Layers, 
  Trash2,
  Boxes,
  ShieldCheck
} from 'lucide-react';
import { EngineViewSkeleton } from '@/shared/components/EngineViewSkeleton';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
import { useProcurementEngine } from '@/features/pdr-engine/hooks/useProcurementEngine';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { RegistryGuidanceState } from '@/core/ui/RegistryGuidanceState';
import { cn } from '@/shared/utils';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

interface NewOrderLine {
  blueprintId: string;
  quantity: number;
  unitPrice: number;
}

export function ProcurementView() {
  const { t } = useTranslation();
  const { orders, isLoading, confirmOrder, fulfillOrder, createPendingOrder } = useProcurementEngine();
  const { showSuccess, showError } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Drawer Form State for New Purchase Order
  const [isAdding, setIsAdding] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [orderLines, setOrderLines] = useState<NewOrderLine[]>([
    { blueprintId: '', quantity: 1, unitPrice: 0 }
  ]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Blueprints & Templates for dropdown
  const blueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);
  const templates = useLiveQuery(() => db.pdrTemplates.toArray(), []);

  const templateMap = useMemo(() => {
    if (!templates) return new Map();
    return new Map(templates.map(t => [t.id, t]));
  }, [templates]);

  const blueprintOptions = useMemo(() => {
    if (!blueprints) return [];
    return blueprints.map(bp => {
      const template = templateMap.get(bp.templateId);
      return {
        id: bp.id,
        label: `${bp.reference} - ${template?.name || 'قطعة غيار'}`
      };
    });
  }, [blueprints, templateMap]);

  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.supplierName))).filter(Boolean).sort();
  }, [orders]);

  const orderedCount = orders.filter(o => o.status === 'ORDERED').length;
  const fulfilledCount = orders.filter(o => o.status === 'FULFILLED').length;
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const totalSpend = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'status',
      label: 'حالة الطلب',
      value: statusFilter,
      onChange: setStatusFilter,
      allLabel: 'جميع الأوامر',
      type: 'chips',
      options: [
        { value: 'PENDING', label: 'مسودة قيد المراجعة', count: pendingCount },
        { value: 'ORDERED', label: 'في طريق التوريد', count: orderedCount },
        { value: 'FULFILLED', label: 'تم الاستلام والإيداع', count: fulfilledCount },
        { value: 'CANCELLED', label: 'ملغي' }
      ]
    },
    ...(uniqueVendors.length > 0 ? [{
      id: 'vendor',
      label: 'المورد',
      value: vendorFilter,
      onChange: setVendorFilter,
      allLabel: 'جميع الموردين',
      options: uniqueVendors.map(v => ({ value: v, label: v }))
    }] : [])
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

  const handleAction = async (orderId: string, action: 'CONFIRM' | 'FULFILL') => {
    setProcessingId(orderId);
    try {
      if (action === 'CONFIRM') {
        await confirmOrder(orderId);
        showSuccess('تم إرسال أمر الشراء', 'تم إرسال أمر التوريد إلى المورد وتغيير الحالة إلى قيد التوريد.');
      } else if (action === 'FULFILL') {
        await fulfillOrder(orderId);
        showSuccess('تم تحديث المخزون', 'تم استلام الشحنة وإيداع قطع الغيار في المخزون بنجاح.');
      }
    } catch (err: any) {
      showError('فشل الإجراء', err?.message || 'تعذر معالجة الطلب');
    } finally {
      setProcessingId(null);
    }
  };

  // Drawer Form Handlers
  const handleAddOrderLine = () => {
    setOrderLines(prev => [...prev, { blueprintId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveOrderLine = (idx: number) => {
    setOrderLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (idx: number, field: keyof NewOrderLine, value: any) => {
    setOrderLines(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleCancelDrawer = () => {
    setIsAdding(false);
    setSupplierName('');
    setOrderLines([{ blueprintId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      showError('خطأ بالبيانات', 'يرجى إدخال اسم المورد أو الشركة المصنعة');
      return;
    }

    const validLines = orderLines.filter(l => l.blueprintId && l.quantity > 0);
    if (validLines.length === 0) {
      showError('خطأ بالبيانات', 'يرجى إضافة قطعة غيار واحدة على الأقل بالكمية المحددة');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      await createPendingOrder(supplierName.trim(), validLines);
      showSuccess('تم إنشاء أمر الشراء', `تم تسجيل أمر التوريد للمورد ${supplierName} بنجاح.`);
      handleCancelDrawer();
    } catch (err: any) {
      showError('فشل الإنشاء', err?.message || 'تعذر إنشاء أمر التوريد');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (isLoading) {
    return <EngineViewSkeleton mode="table" themeColor="cyan" />;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-slate-800 dark:text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr" dir="ltr">
      {/* HEADER COCKPIT */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('procurement.pipeline.title', 'خط أنابيب التوريد والشراء')}
          subtitle={t('procurement.pipeline.subtitle', 'إدارة أوامر الشراء ومتابعة الموردين وتغذية رصيد المخزن')}
          icon={<ShoppingCart className="w-7 h-7 text-cyan-400" />}
          badgeText={t('procurement.pipeline.badge', 'PDR Procurement')}
          badgeColor="cyan"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('procurement.pipeline.totalOrders', 'إجمالي الأوامر')}
              subtitle="TOTAL ORDERS"
              value={orders.length}
              icon={<Package className="w-3.5 h-3.5" />}
              color="cyan"
            />
            <HeaderBentoCard
              title={t('procurement.pipeline.activeOrders', 'في طريق التوريد')}
              subtitle="ON ROUTE"
              value={orderedCount}
              icon={<Clock className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('procurement.pipeline.syncedOrders', 'تم الاستلام والإيداع')}
              subtitle="FULFILLED"
              value={fulfilledCount}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('procurement.pipeline.totalSpend', 'إجمالي القيمة التقديرية')}
              subtitle="ESTIMATED SPEND"
              value={`$${(totalSpend / 1000).toFixed(1)}k`}
              icon={<DollarSign className="w-3.5 h-3.5" />}
              color="purple"
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
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">سجل أوامر التوريد</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      {filteredOrders.length} طلب
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PURCHASE ORDERS & VENDOR TRACKING</p>
                </div>
              </div>

              {/* Center & Right: Unified Search, Filter Chips & View Switcher */}
              <div className="flex-1 max-w-2xl w-full">
                <UnifiedSearchFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  searchPlaceholder="بحث برقم الطلب، اسم المورد، أو القطع..."
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

                      {!isAdding && (
                        <button
                          onClick={() => setIsAdding(true)}
                          className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all shrink-0 flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span>إنشاء أمر شراء</span>
                        </button>
                      )}
                    </div>
                  }
                />
              </div>
            </div>

            {/* Inline Accordion Drawer Form for Creating Purchase Order */}
            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="border-b border-white/10 bg-white/[0.02] relative overflow-hidden"
                >
                  <div className="p-6 md:p-8 relative z-10">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" /> إنشاء أمر شراء وتوريد جديد
                    </h2>

                    <form onSubmit={handleSubmitOrder} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                            اسم المورد / الشركة الموردة
                          </label>
                          <input
                            required
                            type="text"
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            placeholder="مثال: SIEMENS INDUSTRIAL, SKF BEARINGS..."
                            className="titan-input py-3"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                            نوع الأمر
                          </label>
                          <div className="flex items-center gap-2 h-[46px] px-4 rounded-xl bg-white/5 border border-white/10 text-cyan-300 font-mono text-xs">
                            <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span>طلب توريد خارجي - مسودة (PENDING)</span>
                          </div>
                        </div>
                      </div>

                      {/* Order Lines Sub-section */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                            بنود قطع الغيار المطلوبة ({orderLines.length})
                          </label>
                          <button
                            type="button"
                            onClick={handleAddOrderLine}
                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> إضافة بند آخر
                          </button>
                        </div>

                        <div className="space-y-3">
                          {orderLines.map((line, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 items-center">
                              <div className="md:col-span-6">
                                <select
                                  required
                                  value={line.blueprintId}
                                  onChange={(e) => handleUpdateLine(idx, 'blueprintId', e.target.value)}
                                  className="titan-input py-2 text-xs appearance-none bg-[#0a0a0f] text-white w-full"
                                >
                                  <option value="">اختر قطعة الغيار المطلوبة...</option>
                                  {blueprintOptions.map(bp => (
                                    <option key={bp.id} value={bp.id}>{bp.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-3">
                                <input
                                  required
                                  type="number"
                                  min="1"
                                  value={line.quantity}
                                  onChange={(e) => handleUpdateLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                                  placeholder="الكمية"
                                  className="titan-input py-2 text-xs w-full font-mono"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={line.unitPrice || ''}
                                  onChange={(e) => handleUpdateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  placeholder="السعر التقديري ($)"
                                  className="titan-input py-2 text-xs w-full font-mono"
                                />
                              </div>
                              <div className="md:col-span-1 flex justify-center">
                                {orderLines.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOrderLine(idx)}
                                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="حذف البند"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end items-center gap-3 pt-4 border-t border-white/5">
                        <button
                          type="button"
                          onClick={handleCancelDrawer}
                          className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingOrder}
                          className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          <span>حفظ وإصدار أمر التوريد</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Area - Full Bleed Table / Cards Container */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-transparent relative">
              {filteredOrders.length === 0 && !isAdding ? (
                <div className="p-6 md:p-8 flex-1 flex items-center justify-center">
                  <RegistryGuidanceState
                    id="procurement-guidance"
                    icon={ShoppingCart}
                    title={
                      searchTerm || statusFilter !== 'ALL' || vendorFilter !== 'ALL'
                        ? 'لم يتم العثور على أوامر توريد مطابقة'
                        : 'خط أنابيب التوريد والشراء'
                    }
                    subtitle={
                      searchTerm || statusFilter !== 'ALL' || vendorFilter !== 'ALL'
                        ? 'لا توجد أوامر توريد تطابق معايير البحث والفلترة المحددة. يمكنك تصفير الفلاتر أو إنشاء أمر شراء جديد.'
                        : 'إدارة دورة حياة التوريد من إنشاء المسودة، إرسال الطلب للمورد، حتى استلام الشحنة وتحديث الرصيد المخزني آلياً.'
                    }
                    isSearchActive={Boolean(searchTerm || statusFilter !== 'ALL' || vendorFilter !== 'ALL')}
                    onClearSearch={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setVendorFilter('ALL');
                    }}
                    primaryAction={{
                      label: 'إنشاء أمر شراء جديد',
                      icon: Plus,
                      onClick: () => setIsAdding(true)
                    }}
                    guidanceCards={[
                      {
                        icon: Truck,
                        title: 'التتبع المتزامن للشحنات',
                        description: 'تتبع حالة الشحنات من الإرسال (ORDERED) إلى الوصول والإيداع المباشر في رصيد المستودع.'
                      },
                      {
                        icon: ShieldCheck,
                        title: 'التحديث التلقائي للمخزون',
                        description: 'بمجرد الضغط على استلام وإيداع، يقوم المحرك تلقائياً بتغذية رصيد القطع وتسجيل حركة توريد معتمدة.'
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
                        <th className="py-4 px-6 text-start font-extrabold">رقم الطلب</th>
                        <th className="py-4 px-6 text-start font-extrabold">المورد والجهة</th>
                        <th className="py-4 px-6 text-start font-extrabold">التاريخ</th>
                        <th className="py-4 px-6 text-center font-extrabold">البنود</th>
                        <th className="py-4 px-6 text-center font-extrabold">القيمة التقديرية</th>
                        <th className="py-4 px-6 text-center font-extrabold">الحالة</th>
                        <th className="py-4 px-6 text-center font-extrabold">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-medium">
                      {filteredOrders.map((order, idx) => {
                        const isProcessing = processingId === order.id;

                        return (
                          <tr
                            key={order.id}
                            className={cn(
                              "transition-colors duration-150 group text-start cursor-pointer",
                              idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                              "hover:bg-cyan-500/15 hover:text-white"
                            )}
                          >
                            {/* Order Number */}
                            <td className="py-3.5 px-6 font-mono font-extrabold">
                              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300 text-[11px] inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                #{order.id.substring(0, 8).toUpperCase()}
                              </span>
                            </td>

                            {/* Supplier */}
                            <td className="py-3.5 px-6">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-white text-xs tracking-tight group-hover:text-cyan-200 transition-colors">
                                  {order.supplierName}
                                </span>
                                {order.supplierName === 'SYSTEM_AUTO_GENERATED' && (
                                  <span className="text-[9px] font-bold text-cyan-400/80 uppercase tracking-widest mt-0.5">
                                    طلب آلي ذكي
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-6">
                              <span className="text-xs font-mono text-slate-400 font-medium">
                                {new Date(order.orderDate).toLocaleDateString()}
                              </span>
                            </td>

                            {/* Items count */}
                            <td className="py-3.5 px-6 text-center">
                              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-xs">
                                {order.lines.length} بنود
                              </span>
                            </td>

                            {/* Total Amount */}
                            <td className="py-3.5 px-6 text-center font-mono font-bold text-white text-xs">
                              ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-6 text-center">
                              {order.status === 'PENDING' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> مسودة
                                </span>
                              ) : order.status === 'ORDERED' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                                  <Truck className="w-3 h-3" /> في الطريق
                                </span>
                              ) : order.status === 'FULFILLED' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> تم الإيداع
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                  ملغي
                                </span>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-3.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center items-center gap-2">
                                {order.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleAction(order.id, 'CONFIRM')}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightCircle className="w-3.5 h-3.5" />}
                                    <span>إرسال للمورد</span>
                                  </button>
                                )}

                                {order.status === 'ORDERED' && (
                                  <button
                                    onClick={() => handleAction(order.id, 'FULFILL')}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackagePlus className="w-3.5 h-3.5" />}
                                    <span>استلام وإيداع</span>
                                  </button>
                                )}

                                {order.status === 'FULFILLED' && (
                                  <div className="w-7 h-7 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  </div>
                                )}
                              </div>
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
                      {filteredOrders.map((order) => {
                        const isProcessing = processingId === order.id;

                        return (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="titan-card overflow-hidden flex flex-col group relative shadow-none p-0 hover:border-cyan-500 transition-all duration-300 border border-white/10 bg-[#0a0a0f] rounded-3xl"
                          >
                            <div className="p-6 relative z-10 flex-1">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                                    <ShoppingCart className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className="text-base font-bold text-slate-300 group-hover:text-white group-hover:font-black tracking-tight uppercase transition-all duration-300 font-mono">
                                      #{order.id.substring(0, 8).toUpperCase()}
                                    </h3>
                                    <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono font-bold mt-0.5">
                                      {new Date(order.orderDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  {order.status === 'PENDING' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
                                      مسودة
                                    </span>
                                  ) : order.status === 'ORDERED' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      في الطريق
                                    </span>
                                  ) : order.status === 'FULFILLED' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                      تم الإيداع
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                      ملغي
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2 mb-4">
                                <div className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                                  {order.supplierName}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{order.lines.length} قطع غيار مطلوبة</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 divide-x divide-white/10 bg-white/[0.02] border-t border-white/10 mt-auto relative z-10 transition-colors duration-300">
                              <div className="p-4 flex flex-col items-center justify-center gap-1 group/stat hover:bg-white/[0.05] transition-colors">
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">القيمة الإجمالية</div>
                                <span className="text-base font-bold font-mono text-cyan-300">
                                  ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                </span>
                              </div>
                              <div className="p-4 flex flex-col items-center justify-center gap-1 group/stat hover:bg-white/[0.05] transition-colors">
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">البنود</div>
                                <span className="text-base font-bold font-mono text-slate-300">
                                  {order.lines.length}
                                </span>
                              </div>
                            </div>

                            {order.status !== 'FULFILLED' && (
                              <div className="p-3 bg-white/[0.01] border-t border-white/5">
                                {order.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleAction(order.id, 'CONFIRM')}
                                    disabled={isProcessing}
                                    className="w-full py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightCircle className="w-3.5 h-3.5" />}
                                    <span>إرسال للمورد</span>
                                  </button>
                                )}

                                {order.status === 'ORDERED' && (
                                  <button
                                    onClick={() => handleAction(order.id, 'FULFILL')}
                                    disabled={isProcessing}
                                    className="w-full py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackagePlus className="w-3.5 h-3.5" />}
                                    <span>استلام وإيداع بالمخزن</span>
                                  </button>
                                )}
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
