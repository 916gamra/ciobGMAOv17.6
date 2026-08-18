import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { EngineViewSkeleton } from '@/shared/components/EngineViewSkeleton';
import { useStockEngine } from '../hooks/useStockEngine';
import { useProcurementEngine } from '../hooks/useProcurementEngine';
import { useTabStore } from '@/app/store';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { 
  Box, 
  AlertTriangle, 
  AlertOctagon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  MapPin, 
  Activity, 
  ListFilter, 
  Plus, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  Search, 
  Database, 
  ArrowRightLeft,
  Sliders,
  History,
  ShieldCheck,
  Cpu,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Tag,
  Table,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { StockTransactionModal } from './StockTransactionModal';
import { AddInventoryModal } from './AddInventoryModal';
import { usePerformanceMonitor } from '@/core/monitoring/usePerformanceMonitor';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.02 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function StockDashboardPage({ tabId }: { tabId: string }) {
  usePerformanceMonitor('StockDashboardPage');
  const { t } = useTranslation();
  const { inventory, movements, lowStockItems, outOfStockItems, isLoading } = useStockEngine();
  const { createPendingOrder } = useProcurementEngine();
  const { showSuccess, showError } = useNotifications();
  const { openTab } = useTabStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'ALL' | 'NEW' | 'USED' | 'REFURBISHED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preselectedStockId, setPreselectedStockId] = useState<string | undefined>();
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'LOW' | 'EMPTY' | 'OPTIMAL'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Load blueprints and templates live for UI enrichment
  const blueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);
  const templates = useLiveQuery(() => db.pdrTemplates.toArray(), []);

  // Optimize lookup maps
  const blueprintMap = useMemo(() => {
    if (!blueprints) return new Map();
    return new Map(blueprints.map(b => [b.id, b]));
  }, [blueprints]);

  const templateMap = useMemo(() => {
    if (!templates) return new Map();
    return new Map(templates.map(t => [t.id, t]));
  }, [templates]);

  const newPartsCount = useMemo(() => {
    return inventory.filter(i => (i.condition || 'NEW') === 'NEW').length;
  }, [inventory]);

  // Warehouse health calculation
  const totalItemsCount = inventory.length;
  const optimalItemsCount = totalItemsCount - (lowStockItems.length + outOfStockItems.length);
  const healthPercentage = totalItemsCount > 0 ? Math.round((optimalItemsCount / totalItemsCount) * 100) : 100;

  const totalStockItems = inventory.reduce((acc, item) => acc + item.quantityCurrent, 0);
  const criticalShortages = outOfStockItems.length;
  const lowStockWarnings = lowStockItems.length;

  const handleAutoProcure = async () => {
    const criticalItems = [...outOfStockItems, ...lowStockItems];
    const uniqueItems = Array.from(new Map(criticalItems.map(item => [item.id, item])).values());
    
    if (uniqueItems.length === 0) return;

    const lines = uniqueItems.map(item => {
      const safeThreshold = item.minThreshold > 0 ? item.minThreshold : 5; 
      const suggestedQuantity = Math.max(1, (safeThreshold * 2) - item.quantityCurrent);
      return {
        blueprintId: item.blueprintId,
        quantity: suggestedQuantity
      };
    });

    try {
      await createPendingOrder('SYSTEM_AUTO_GENERATED', lines);
      showSuccess('أمر توريد آلي', `تم توليد أمر شراء معلق لعدد ${lines.length} قطعة حرجة.`);
      setTimeout(() => {
        openTab({ id: 'procurement', portalId: 'PDR', title: 'إدارة التوريد', component: 'procurement' });
      }, 1200);
    } catch(err: any) {
      showError('خطأ تزامن', err.message);
    }
  };

  // Enrich stock list with template name and detailed threshold ratios
  const enrichedInventory = useMemo(() => {
    return inventory.map(item => {
      const blueprint = blueprintMap.get(item.blueprintId);
      const template = blueprint ? templateMap.get(blueprint.templateId) : null;
      
      const ratio = item.minThreshold > 0 ? (item.quantityCurrent / item.minThreshold) : 2; // Safe ratio
      
      return {
        ...item,
        partName: template?.name || 'مكون مجهول',
        partFamily: template?.familyCode || 'GEN',
        ratio,
        blueprintReference: blueprint?.reference || item.blueprintReference
      };
    });
  }, [inventory, blueprintMap, templateMap]);

  // General Filtered List
  const filteredInventory = useMemo(() => {
    let items = enrichedInventory;
    
    // Urgency filter
    if (urgencyFilter === 'LOW') {
      items = items.filter(item => item.isLowStock);
    } else if (urgencyFilter === 'EMPTY') {
      items = items.filter(item => item.isOutOfStock);
    } else if (urgencyFilter === 'OPTIMAL') {
      items = items.filter(item => !item.isLowStock && !item.isOutOfStock);
    }

    if (conditionFilter !== 'ALL') {
      items = items.filter(item => (item.condition || 'NEW') === conditionFilter);
    }

    // Search term
    if (!searchTerm) return items;
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => 
      item.blueprintReference.toLowerCase().includes(searchLower) ||
      item.partName.toLowerCase().includes(searchLower) ||
      item.partFamily.toLowerCase().includes(searchLower) ||
      (item.locationDetails || '').toLowerCase().includes(searchLower)
    );
  }, [enrichedInventory, urgencyFilter, conditionFilter, searchTerm]);

  // Enrich recent movements logs with exact human names of the spare parts
  const enrichedRecentMovements = useMemo(() => {
    return movements.slice(0, 30).map(mov => {
      // Find matching inventory card
      const stockItem = inventory.find(i => i.id === mov.stockId);
      const blueprint = stockItem ? blueprintMap.get(stockItem.blueprintId) : null;
      const template = blueprint ? templateMap.get(blueprint.templateId) : null;

      return {
        ...mov,
        partName: template?.name || 'قطعة غيار مجهولة',
        reference: blueprint?.reference || 'REF'
      };
    });
  }, [movements, inventory, blueprintMap, templateMap]);

  const handleQuickAction = (stockId: string) => {
    setPreselectedStockId(stockId);
    setIsModalOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setConditionFilter('ALL');
    setUrgencyFilter('ALL');
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
      {/* Upper Subtle HUD Banner */}
      <div className="absolute top-0 right-0 left-0 h-[280px] bg-gradient-to-b from-slate-800/10 via-transparent to-transparent pointer-events-none z-0 rounded-t-[3rem]" />

      <div className="p-6 md:p-8 pb-0 shrink-0">
        {/* Premium Header Layout */}
        <PageHeader
          title={t('pdr.dashboard.title')}
          subtitle={t('pdr.dashboard.subtitle')}
          icon={<Box className="w-7 h-7 text-cyan-400" />}
          badgeText={t('pdr.dashboard.badge')}
          badgeColor="cyan"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('pdr.dashboard.healthTitle')}
              subtitle="READINESS INDEX"
              value={healthPercentage}
              valueUnit="%"
              icon={<Activity className="w-3.5 h-3.5" />}
              color="cyan"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('pdr.dashboard.stockVolumeTitle')}
              subtitle="TOTAL PARTS"
              value={totalStockItems}
              valueUnit={t('analytics.unit.part')}
              icon={<Box className="w-3.5 h-3.5" />}
              color="emerald"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('pdr.dashboard.criticalShortagesTitle')}
              subtitle="CRITICAL SHORTAGE"
              value={criticalShortages}
              valueUnit={t('pdr.dashboard.alertUnit')}
              icon={<AlertOctagon className="w-3.5 h-3.5" />}
              color={criticalShortages > 0 ? "rose" : "emerald"}
              isActive={false}
            />
            <HeaderBentoCard
              title={t('pdr.dashboard.lowStockTitle')}
              subtitle="LOW INVENTORY"
              value={lowStockWarnings}
              valueUnit={t('pdr.dashboard.alertUnit')}
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              color={lowStockWarnings > 0 ? "amber" : "slate"}
              isActive={false}
            />
          </div>
        </PageHeader>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 mx-6 md:mx-8 mb-6 mt-6">
        
        {/* Left Columns: Beautiful Stock Radar Table Panel */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-[650px] flex flex-col bg-[#0a0b10]/95 backdrop-blur-xl relative">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            
            {/* Control Panel Header */}
            <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 w-full xl:w-auto justify-start">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-white uppercase tracking-tight font-sans">الأصول والمخزون الفعلي</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      {filteredInventory.length} قطعة
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">تتبع حي للمكونات والأرصدة</p>
                </div>
              </div>

              {/* Action Buttons & Quick Search */}
              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-start">
                {/* Search Inputs */}
                <div className="relative w-full sm:w-56 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                  <input 
                    type="text" 
                    placeholder={t('pdr.dashboard.searchPlaceholder', 'Search stock (name, reference)...')} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0a0b10] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-inner"
                  />
                </div>
                
                {/* Intelligent Procurement Trigger button */}
                <AnimatePresence>
                  {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={handleAutoProcure}
                      className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-xs transition-all flex items-center gap-1.5"
                      title={t('pdr.dashboard.autoProcure', 'توليد أمر توريد')}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> {t('pdr.dashboard.autoProcure', 'توليد أمر توريد')}
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Entry Action */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 font-sans"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-300" /> {t('pdr.dashboard.addInventory', 'إدخال مخزون')}
                </button>

                {/* Transaction Action */}
                <button
                  onClick={() => { setPreselectedStockId(undefined); setIsModalOpen(true); }}
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 border border-transparent font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-950" /> حركة (صرف / إيداع)
                </button>
              </div>
            </div>

            {/* Premium Instrumented Filters */}
            <div className="px-5 py-2.5 bg-white/[0.01] border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Urgency status filter segment */}
                <div className="inline-flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setUrgencyFilter('ALL')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap",
                      urgencyFilter === 'ALL'
                        ? "bg-white/10 text-white border border-white/20 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setUrgencyFilter('LOW')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap",
                      urgencyFilter === 'LOW'
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                        : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 border border-transparent"
                    )}
                  >
                    تحت حد الأمان
                  </button>
                  <button
                    onClick={() => setUrgencyFilter('EMPTY')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap",
                      urgencyFilter === 'EMPTY'
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                        : "text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent"
                    )}
                  >
                    نافذ
                  </button>
                  <button
                    onClick={() => setUrgencyFilter('OPTIMAL')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap",
                      urgencyFilter === 'OPTIMAL'
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                        : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 border border-transparent"
                    )}
                  >
                    آمن ووفير
                  </button>
                </div>

                {/* View Switcher & Reset button */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setViewMode('table')}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                        viewMode === 'table'
                          ? "bg-white/10 text-white border border-white/20 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      )}
                      title="عرض القائمة"
                    >
                      <Table className="w-3.5 h-3.5" /> قائمة
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                        viewMode === 'grid'
                          ? "bg-white/10 text-white border border-white/20 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      )}
                      title="عرض البطاقات"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> بطاقات
                    </button>
                  </div>

                  {(searchTerm || conditionFilter !== 'ALL' || urgencyFilter !== 'ALL') && (
                    <button 
                      onClick={resetFilters}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all font-bold text-xs flex items-center gap-1"
                      title="إلغاء التصفية"
                    >
                      <RotateCcw className="w-3 h-3" /> إلغاء
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500">
                النتيجة: <strong className="text-white">{filteredInventory.length}</strong> من أصل {inventory.length}
              </div>
            </div>
            
            {/* Table / Grid Content Area */}
            <div className="flex-1 overflow-auto custom-scrollbar p-5 bg-transparent">
              {filteredInventory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <Box className="w-12 h-12 mb-3 text-slate-700 mx-auto opacity-20" />
                  <p className="text-xs font-medium text-slate-500 font-sans">لم يتم العثور على أي قطع تطابق معايير البحث.</p>
                  <button 
                    onClick={resetFilters}
                    className="mt-3 text-cyan-400 hover:text-cyan-300 text-xs font-bold underline font-sans"
                  >
                    إلغاء التصفية
                  </button>
                </div>
              ) : viewMode === 'table' ? (
                /* Crystal Clear High-Contrast Table View with Zebra Striping */
                <div className="rounded-2xl border border-white/10 bg-[#0a0b10]/95 backdrop-blur-xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table dir="ltr" className="w-full text-left border-collapse font-sans">
                      <thead className="bg-[#12141d] border-b-2 border-white/15 text-slate-200 sticky top-0 z-20 backdrop-blur-md shadow-sm">
                        <tr>
                          <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-left">كود القطعة / Reference</th>
                          <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-left">اسم القطعة والعائلة</th>
                          <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-left">موقع التخزين</th>
                          <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-center">الرصيد الفعلي</th>
                          <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-center">الحد الأدنى</th>
                          <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-center">حالة المخزون</th>
                          <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-left">إجراء حركة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                        {filteredInventory.map((item, idx) => {
                          let badgeClass = "";
                          let statusLabel = "";

                          if (item.isOutOfStock) {
                            badgeClass = "bg-rose-500/15 text-rose-300 border-rose-500/30";
                            statusLabel = "نافذ من المخزن";
                          } else if (item.isLowStock) {
                            badgeClass = "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse";
                            statusLabel = "تحت حد الأمان";
                          } else {
                            badgeClass = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
                            statusLabel = "آمن ووفير";
                          }

                          return (
                            <tr 
                              key={item.id} 
                              className={cn(
                                "transition-colors duration-150 group cursor-pointer",
                                idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                                "hover:bg-cyan-500/15 hover:text-white"
                              )}
                              onClick={() => handleQuickAction(item.id)}
                            >
                              {/* Reference Code */}
                              <td className="py-3.5 px-4 font-mono font-extrabold text-white text-sm tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 inline-block" />
                                {item.blueprintReference}
                              </td>

                              {/* Part Name & Family */}
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-white text-sm group-hover:text-cyan-200 transition-colors">
                                  {item.partName}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                                  <Tag className="w-3 h-3 text-slate-500" />
                                  <span>{item.partFamily}</span>
                                  <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">NEW</span>
                                </div>
                              </td>

                              {/* Location */}
                              <td className="py-3.5 px-4 text-slate-300 text-sm">
                                <div className="flex items-center gap-1.5 text-slate-300">
                                  <MapPin className="w-3.5 h-3.5 text-cyan-400/80" />
                                  <span>{item.locationDetails || 'المخزن الرئيسي (A1)'}</span>
                                </div>
                              </td>

                              {/* Current Quantity */}
                              <td className="py-3.5 px-4 text-center">
                                <span className="font-mono text-white font-extrabold text-sm tracking-tight">
                                  {item.quantityCurrent.toFixed(1).replace('.0', '')}
                                </span>
                                <span className="text-slate-400 text-xs font-mono mr-1">{item.unit}</span>
                              </td>

                              {/* Min Threshold */}
                              <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-sm">
                                {item.minThreshold} {item.unit}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4 text-center">
                                <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border inline-block whitespace-nowrap", badgeClass)}>
                                  {statusLabel}
                                </span>
                              </td>

                              {/* Action button */}
                              <td className="py-3.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleQuickAction(item.id)}
                                  className="px-3 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold transition-all flex items-center gap-1.5 ml-auto shadow-sm cursor-pointer"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-950" />
                                  حركة
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Grid Cards View */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredInventory.map((item, idx) => {
                      let pct = 0;
                      let barColor = "bg-emerald-500";
                      
                      if (item.minThreshold > 0) {
                        pct = (item.quantityCurrent / (item.minThreshold * 2.5)) * 100;
                        pct = Math.min(100, pct);
                      } else {
                        pct = item.quantityCurrent > 0 ? 100 : 0;
                      }

                      let glowColor = "";
                      let statusText = "";
                      
                      if (item.isOutOfStock) {
                        barColor = "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
                        glowColor = "group-hover:border-rose-500/30";
                        statusText = "نافذ";
                      } else if (item.isLowStock) {
                        barColor = "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)] animate-pulse";
                        glowColor = "group-hover:border-amber-400/30";
                        statusText = "منخفض جدا";
                      } else {
                        barColor = "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]";
                        glowColor = "group-hover:border-emerald-400/30";
                        statusText = "آمن ووفير";
                      }

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.5, delay: (idx % 12) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <GlassCard 
                            className={`!p-0 relative overflow-hidden group h-full flex flex-col transition-all duration-300 border border-white/10 bg-[#0a0a0f]/80 hover:bg-[#0a0a0f] ${glowColor} shadow-lg`}
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                            
                            {/* Make body card clickable to open Quick Actions / Transaction Modal */}
                            <div 
                              onClick={() => handleQuickAction(item.id)}
                              className="p-6 relative z-10 flex-1 cursor-pointer flex flex-col"
                            >
                              <div className="flex justify-between items-start mb-5 gap-4">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:border-cyan-500/40 transition-colors shadow-inner">
                                    <Box className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
                                  </div>
                                  <div className="overflow-hidden">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-white text-sm group-hover:text-slate-200 transition-colors truncate">{item.partName}</h3>
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">NEW</span>
                                    </div>
                                    <p className="text-[10px] text-white font-mono mt-0.5 truncate">{item.blueprintReference}</p>
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-1.5 bg-[#0a0a0f]/80 border border-white/10 px-2.5 py-1 rounded-lg shrink-0">
                                  <span className="font-mono text-sm font-extrabold text-white tabular-nums">
                                    {item.quantityCurrent.toFixed(1).replace('.0', '')}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400">{item.unit}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-3 mt-auto pt-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                    <span className="truncate max-w-[150px]">{item.locationDetails || 'المخزن الرئيسي (A1)'}</span>
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-slate-300">الرصيد: {item.quantityCurrent} / الحد الأدنى: {item.minThreshold}</span>
                                  <span className={cn("font-bold", item.isOutOfStock ? "text-rose-400" : item.isLowStock ? "text-amber-400" : "text-emerald-400")}>
                                    {statusText}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                  <div 
                                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                                    style={{ width: `${Math.max(4, pct)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-auto grid grid-cols-2 divide-x divide-x-reverse divide-white/5 border-t border-white/5 bg-white/[0.02] text-[10px] font-bold text-slate-300 uppercase tracking-widest relative z-10">
                              <div className="p-4 flex items-center gap-2 justify-center" title="العائلة">
                                <Tag className="w-4 h-4 text-slate-400" />
                                <span className="truncate">{item.partFamily}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(item.id);
                                }}
                                className="p-4 flex items-center gap-2 justify-center hover:bg-white/[0.08] hover:text-white text-cyan-300 transition-colors cursor-pointer" title="حركة"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                                <span className="truncate">حركة</span>
                              </button>
                            </div>
                          </GlassCard>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>          </GlassCard>
        </motion.div>

        {/* Right Column: Premium Cybernetic Log Stream */}
        <motion.div variants={itemVariants} className="space-y-6">
          <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-[650px] flex flex-col bg-[#0a0b10]/95 backdrop-blur-2xl relative">
            
            {/* Feed Header */}
            <div className="p-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <h2 className="text-xs font-extrabold text-white uppercase tracking-tight">سجل العمليات المباشر</h2>
              </div>
              <span className="text-[8px] font-mono text-emerald-400 border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(52,211,153,0.15)] font-black">
                بث حي
              </span>
            </div>
            
            {/* Log Stream with timeline thread design */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 relative">
              
              {/* Virtual vertical trace line */}
              {enrichedRecentMovements.length > 0 && (
                <div className="absolute left-[38px] top-6 bottom-6 w-px bg-gradient-to-b from-cyan-500/10 via-slate-800 to-transparent pointer-events-none" />
              )}

              <AnimatePresence mode="popLayout">
                {enrichedRecentMovements.length === 0 ? (
                  <div className="py-28 text-center opacity-40">
                    <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">في انتظار عمليات جديدة...</div>
                  </div>
                ) : (
                  enrichedRecentMovements.map((movement, idx) => {
                    const isNewest = idx === 0;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        key={movement.id}
                        className={cn(
                          "ml-8 p-4 rounded-2xl bg-white/[0.02] border transition-all flex flex-col gap-2 group relative",
                          isNewest ? "border-emerald-500/20 bg-white/[0.04] shadow-[0_0_15px_rgba(52,211,153,0.05)]" : "border-white/5 hover:border-white/10"
                        )}
                      >
                        {/* Timeline point */}
                        <div className={cn(
                          "absolute left-[-37px] top-6 w-2.5 h-2.5 rounded-full border-2 border-slate-950 z-10 transition-colors",
                          isNewest ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" : 
                          movement.type === 'IN' ? "bg-emerald-500" : "bg-amber-500"
                        )} />

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border text-[10px] font-extrabold",
                              movement.type === 'IN' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              movement.type === 'OUT' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                              'bg-white/10 border-white/20 text-white'
                            )}>
                              {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '='}
                            </div>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-wider",
                              movement.type === 'IN' ? "text-emerald-400" : 
                              movement.type === 'OUT' ? "text-amber-400" : "text-white"
                            )}>
                              {movement.type === 'IN' ? 'إيداع' : movement.type === 'OUT' ? 'صرف' : 'تسوية'}
                            </span>
                          </div>
                          
                          <span className="text-[9px] font-bold text-slate-500 font-mono">
                            {new Date(movement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        
                        {/* Component metadata */}
                        <div className="text-left">
                          <div className="font-extrabold text-slate-200 text-xs group-hover:text-white transition-colors">
                            {movement.partName}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                            {t('pdr.dashboard.reference', 'Reference')}: <span className="text-slate-400">{movement.reference}</span>
                          </div>
                          {movement.notes && (
                            <div className="text-[9px] text-slate-400/80 bg-[#0a0a0f]/40 p-1.5 rounded border border-white/[0.02] mt-1.5 font-sans leading-relaxed">
                              {movement.notes}
                            </div>
                          )}
                        </div>

                        {/* Executed by & quantity footer */}
                        <div className="flex items-center justify-between border-t border-white/[0.03] pt-2 mt-1 text-[9px] text-slate-400">
                          <div className={cn(
                            "font-mono text-xs font-black",
                            movement.type === 'IN' ? "text-emerald-400" : 
                            movement.type === 'OUT' ? "text-amber-400" : "text-white"
                          )}>
                            {movement.quantity} {(movement as any).unit || 'وحدة'}
                          </div>
                          <div className="font-mono text-slate-500">
                            بواسطة: <strong className="text-slate-400">{movement.performedBy}</strong>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#0a0a0f] to-transparent z-20 pointer-events-none" />
          </GlassCard>
        </motion.div>
      </div>

      {/* Interactive Modals */}
      <StockTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        inventory={inventory}
        preselectedStockId={preselectedStockId}
      />
      <AddInventoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </motion.div>
  );
}

// Sub-component for premium Pod stat card
function StatCompactPod({ 
  icon, 
  label, 
  value, 
  sub, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  sub: string;
  color: 'emerald' | 'indigo' | 'warning' | 'danger';
}) {
  const cardGlowClass = 
    color === 'warning' ? 'bento-card-warning' :
    color === 'danger' ? 'bento-card-danger' :
    color === 'emerald' ? 'bento-card-safe' :
    'titan-card';

  return (
    <div className={cn("flex items-center gap-4 px-4 py-4 text-left relative group cursor-pointer transition-all duration-300", cardGlowClass)}>
      
      {/* Decorative vertical colored accent bar */}
      <div className={cn(
        "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-300 group-hover:w-1.5",
        color === 'emerald' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' :
        color === 'indigo' ? 'bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.6)]' :
        color === 'warning' ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 
        'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
      )} />

      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 shadow-lg ml-1",
        color === 'emerald' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10' :
        color === 'indigo' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400 shadow-indigo-500/10' :
        color === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-500/10' : 
        'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-rose-500/10'
      )}>
        {icon}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sans truncate">{label}</span>
        <span className="text-2xl font-black text-white mt-0.5 font-mono tracking-tight">{value}</span>
        <span className="text-[9px] text-slate-400 mt-0.5 font-sans truncate">{sub}</span>
      </div>
    </div>
  );
}
