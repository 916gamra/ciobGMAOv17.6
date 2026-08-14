import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { Select } from '@/shared/components/Select';
import { 
  ClipboardCheck, 
  User, 
  Cpu, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Boxes, 
  ShoppingCart,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  LayoutGrid,
  List
} from 'lucide-react';
import { useRequisitionEngine } from '../hooks/useRequisitionEngine';
import { UnifiedSearchFilter, type FilterGroup, type QuickTabOption } from '@/shared/components/UnifiedSearchFilter';
import { EmptyState } from '@/shared/components/EmptyState';
import { cn } from '@/shared/utils';

interface CartItem {
  blueprintId: string;
  reference: string;
  quantity: number;
  available: number;
  unit: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function RequisitionHubView() {
  const { t } = useTranslation();
  const { 
    technicians, 
    machines, 
    blueprints, 
    inventory, 
    templates, 
    families, 
    isLoading, 
    submitRequisition 
  } = useRequisitionEngine();
  
  const [selectedTechId, setSelectedTechId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const selectedTech = useMemo(() => technicians.find(t => t.id === selectedTechId), [technicians, selectedTechId]);
  const selectedMachine = useMemo(() => machines.find(m => m.id === selectedMachineId), [machines, selectedMachineId]);
  
  // Smart Filtering: All available machines
  const filteredMachines = useMemo(() => {
    return machines;
  }, [machines]);

  // Lookup maps for rapid relational enrichment
  const templateMap = useMemo(() => new Map(templates.map(t => [t.id, t])), [templates]);
  const familyMap = useMemo(() => new Map(families.map(f => [f.id, f])), [families]);

  // Unified Enriched Part List: Combine Blueprints with Inventory, Template, and Family
  const enrichedParts = useMemo(() => {
    if (!blueprints || !inventory) return [];
    
    return blueprints.map(bp => {
      const stock = inventory.find(i => i.blueprintId === bp.id);
      const template = templateMap.get(bp.templateId);
      const family = template ? familyMap.get(template.familyId) : undefined;
      
      const available = stock ? stock.quantityCurrent : 0;
      const isCritical = available <= (bp.minThreshold || 2);

      return {
        ...bp,
        available,
        isCritical,
        warehouseId: stock?.warehouseId || 'WH-MAGASIN',
        locationDetails: stock?.locationDetails || 'الرف العام',
        condition: stock?.condition || 'NEW',
        templateName: template?.name || 'قطعة قياسية',
        skuBase: template?.skuBase || 'PDR',
        familyId: family?.id,
        familyName: family?.name || 'عام',
        familyGroup: family?.group || 'autre'
      };
    }).filter(p => p.available > 0); // Only in-stock parts can be requisitioned
  }, [blueprints, inventory, templateMap, familyMap]);

  // Filtered Parts
  const filteredParts = useMemo(() => {
    return enrichedParts.filter(part => {
      // Search match
      if (searchTerm) {
        const query = searchTerm.toLowerCase().trim();
        const matchesRef = part.reference.toLowerCase().includes(query);
        const matchesTemplate = part.templateName.toLowerCase().includes(query);
        const matchesSku = part.skuBase.toLowerCase().includes(query);
        const matchesFamily = part.familyName.toLowerCase().includes(query);
        const matchesLoc = part.locationDetails.toLowerCase().includes(query);
        if (!matchesRef && !matchesTemplate && !matchesSku && !matchesFamily && !matchesLoc) {
          return false;
        }
      }

      // Category / Family Group match
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'CRITICAL') {
          if (!part.isCritical) return false;
        } else if (categoryFilter === 'CART') {
          const inCart = cart.some(c => c.blueprintId === part.id);
          if (!inCart) return false;
        } else {
          if (part.familyGroup !== categoryFilter) return false;
        }
      }

      // Condition match
      if (conditionFilter !== 'ALL' && part.condition !== conditionFilter) {
        return false;
      }

      // Warehouse match
      if (warehouseFilter !== 'ALL' && part.warehouseId !== warehouseFilter) {
        return false;
      }

      return true;
    });
  }, [enrichedParts, searchTerm, categoryFilter, conditionFilter, warehouseFilter, cart]);

  // High-Contrast Quick Tabs Options
  const quickTabs: QuickTabOption[] = useMemo(() => [
    { id: 'ALL', label: t('requisition.hub.allAvailable'), count: enrichedParts.length },
    { id: 'mecanique', label: t('filters.families.mecanique', 'ميكانيك'), count: enrichedParts.filter(p => p.familyGroup === 'mecanique').length },
    { id: 'electrique', label: t('filters.families.electrique', 'كهرباء'), count: enrichedParts.filter(p => p.familyGroup === 'electrique').length },
    { id: 'hydraulique', label: t('filters.families.hydraulique', 'هيدروليك'), count: enrichedParts.filter(p => p.familyGroup === 'hydraulique').length },
    { id: 'pneumatique', label: t('filters.families.pneumatique', 'هوائي'), count: enrichedParts.filter(p => p.familyGroup === 'pneumatique').length },
    { id: 'electronique', label: t('filters.families.electronique', 'إلكترونيك'), count: enrichedParts.filter(p => p.familyGroup === 'electronique').length },
    { id: 'CRITICAL', label: t('requisition.hub.criticalStock'), count: enrichedParts.filter(p => p.isCritical).length, color: 'amber' },
    { id: 'CART', label: t('requisition.hub.inCartTab'), count: enrichedParts.filter(p => cart.some(c => c.blueprintId === p.id)).length, color: 'cyan' },
  ], [enrichedParts, cart, t]);

  // Filter Groups for Dropdown selections
  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'warehouse',
      label: t('filters.warehouse.title', 'مستودع التخزين'),
      value: warehouseFilter,
      onChange: setWarehouseFilter,
      options: [
        { value: 'ALL', label: t('filters.warehouse.all', 'جميع المستودعات') },
        { value: 'WH-MAGASIN', label: t('filters.warehouse.main', 'المخزن المركزي (WH-MAGASIN)') },
        { value: 'WH-DEPOT', label: t('filters.warehouse.depot', 'مستودع الورشة (WH-DEPOT)') },
      ]
    },
    {
      id: 'condition',
      label: t('filters.condition.title', 'الحالة الفنية'),
      value: conditionFilter,
      onChange: setConditionFilter,
      options: [
        { value: 'ALL', label: t('filters.condition.all', 'كافة الحالات') },
        { value: 'NEW', label: t('filters.condition.new', 'جديد (NEW)') },
        { value: 'USED', label: t('filters.condition.used', 'مستعمل بحالة جيدة (USED)') },
        { value: 'REFURBISHED', label: t('filters.condition.refurbished', 'مجدد ومعاير (REFURBISHED)') },
      ]
    }
  ], [warehouseFilter, conditionFilter, t]);

  const handleAddToCart = (part: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.blueprintId === part.id);
      if (existing) {
        if (existing.quantity >= part.available) {
          showToast(t('requisition.hub.exceedStockError'), 'error');
          return prev;
        }
        return prev.map(item => 
          item.blueprintId === part.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        blueprintId: part.id, 
        reference: part.reference, 
        quantity: 1, 
        available: part.available,
        unit: part.unit || 'Pcs'
      }];
    });
  };

  const updateCartQty = (blueprintId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.blueprintId === blueprintId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.available) {
          showToast(t('requisition.hub.exceedStockError'), 'error');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (blueprintId: string) => {
    setCart(prev => prev.filter(item => item.blueprintId !== blueprintId));
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCheckout = async () => {
    if (!selectedTechId || !selectedMachineId || cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await submitRequisition(selectedTechId, selectedMachineId, cart);
      if (!result.ok && 'error' in result) {
        showToast((result.error as Error).message || t('common.error', 'حدث خطأ'), 'error');
      } else {
        showToast(t('requisition.hub.successMsg'), 'success');
        setCart([]);
        setSelectedMachineId('');
      }
    } catch (err: any) {
      showToast(err.message || t('common.error', 'حدث خطأ'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-slate-400 flex flex-col items-center justify-center gap-4 h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm font-mono font-bold tracking-wider">{t('common.loading', 'Loading...')}</span>
      </div>
    );
  }

  const isValidCart = cart.length > 0 && selectedTechId && selectedMachineId;
  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar"
    >
      {/* Dynamic Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-50 px-6 py-3.5 rounded-2xl flex items-center gap-3 border shadow-2xl backdrop-blur-xl ${
              toast.type === 'success' 
                ? 'bg-[#0a0a0f]/90 border-emerald-500/40 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                : 'bg-[#0a0a0f]/90 border-rose-500/40 text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
            }`}
          >
            {toast.type === 'success' ? (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
            )}
            <span className="text-xs font-bold font-sans">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header with Bento KPI Stats */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('requisition.hub.title')}
          subtitle={t('requisition.hub.subtitle')}
          icon={<ClipboardCheck className="w-8 h-8 text-cyan-400" />}
          badgeText={t('requisition.hub.badge')}
          badgeColor="cyan"
          className="mb-6"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('requisition.hub.inStockParts')}
              subtitle="IN-STOCK BLUEPRINTS"
              value={enrichedParts.length}
              valueUnit={t('requisition.hub.partUnit')}
              icon={<Boxes className="w-3.5 h-3.5" />}
              color="cyan"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('requisition.hub.authorizedTechs')}
              subtitle="AUTHORIZED TECHS"
              value={technicians.length}
              valueUnit={t('requisition.hub.techUnit')}
              icon={<User className="w-3.5 h-3.5" />}
              color="emerald"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('requisition.hub.targetMachines')}
              subtitle="PRODUCTION ASSETS"
              value={machines.length}
              valueUnit={t('requisition.hub.machineUnit')}
              icon={<Cpu className="w-3.5 h-3.5" />}
              color="blue"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('requisition.hub.cartContents')}
              subtitle="ITEMS IN CART"
              value={totalCartQty}
              valueUnit={t('requisition.hub.pieceUnit')}
              icon={<ShoppingCart className="w-3.5 h-3.5" />}
              color="purple"
              isActive={totalCartQty > 0}
            />
          </div>
        </PageHeader>
      </div>

      {/* Main Dual-Panel Workspace */}
      <div className="flex flex-col flex-1 px-6 md:px-8 mt-2 gap-6 min-h-0">
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel: Context (Technician, Machine & Live Cart) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Requester & Machine Selector Card */}
            <GlassCard className="!p-5 border-white/10 overflow-hidden shadow-2xl rounded-3xl bg-[#0a0a0f]/60 backdrop-blur-xl relative">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight">
                    {t('requisition.hub.recipientContextTitle')}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    {t('requisition.hub.recipientContextSubtitle')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>{t('requisition.hub.technicianLabel')}</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <Select
                    value={selectedTechId}
                    onChange={e => setSelectedTechId(e.target.value)}
                    options={[
                      { value: '', label: t('requisition.hub.selectTechnician') },
                      ...technicians.map(t => ({ 
                        value: t.id, 
                        label: `${t.name} (${t.realBadgeId || t.id})` 
                      }))
                    ]}
                    className="w-full font-sans"
                  />
                  {selectedTech && (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{selectedTech.name} • {selectedTech.role || 'Technicien'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>{t('requisition.hub.machineLabel')}</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <Select
                    value={selectedMachineId}
                    onChange={e => setSelectedMachineId(e.target.value)}
                    disabled={!selectedTechId}
                    options={[
                      { value: '', label: selectedTechId ? t('requisition.hub.selectMachine') : t('requisition.hub.selectTechFirst') },
                      ...filteredMachines.map(m => ({ 
                        value: m.id, 
                        label: `${m.referenceCode} - ${m.serialNumber || 'Unit'}` 
                      }))
                    ]}
                    className="w-full font-sans"
                  />
                  {selectedMachine && (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 font-mono">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>{selectedMachine.referenceCode} • قطاع: {selectedMachine.sectorId || 'SEC-01'}</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Requisition Cart Panel */}
            <GlassCard className="!p-5 border-white/10 overflow-hidden shadow-2xl rounded-3xl bg-[#0a0a0f]/60 backdrop-blur-xl flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight">
                      {t('requisition.hub.cartTitle')}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      {t('requisition.hub.cartSubtitle')}
                    </p>
                  </div>
                </div>
                {cart.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                    {cart.length}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs font-bold text-slate-400 mb-1">{t('requisition.hub.emptyCart')}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{t('requisition.hub.emptyCartHint')}</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div 
                        key={item.blueprintId} 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#0b0d14] border border-white/10 hover:border-cyan-500/30 transition-all shadow-md"
                      >
                        <div className="min-w-0 flex-1 pl-2">
                          <div className="font-mono text-xs font-black text-cyan-300 truncate">
                            {item.reference}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>الرصيد: {item.available} {item.unit}</span>
                            <span>•</span>
                            <span className="text-emerald-400">المتبقي: {item.available - item.quantity}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-[#07090e] rounded-xl p-1 border border-white/10 shadow-inner">
                            <button 
                              onClick={() => updateCartQty(item.blueprintId, -1)} 
                              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="تقليل الكمية"
                            >
                              <Minus className="w-3 h-3"/>
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-black text-white">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateCartQty(item.blueprintId, 1)} 
                              disabled={item.quantity >= item.available}
                              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="زيادة الكمية"
                            >
                              <Plus className="w-3 h-3"/>
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(item.blueprintId)} 
                            className="p-1.5 hover:bg-rose-500/20 text-rose-400/60 hover:text-rose-300 rounded-xl transition-colors cursor-pointer"
                            title="حذف من السلة"
                          >
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Cart Quick Summary */}
              {cart.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400"></span>
                  <span className="text-white font-black text-sm">{totalCartQty}</span>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right Panel: Available Parts (High-Contrast Unified Command Bar & Table) */}
          <div className="lg:col-span-8 flex flex-col">
            <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl">
              
              {/* Universal Command Bar */}
              <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Boxes className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-white uppercase tracking-tight font-sans">
                        {t('requisition.hub.availablePartsTitle')}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                        {filteredParts.length}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      {t('requisition.hub.availablePartsSubtitle')}
                    </p>
                  </div>
                </div>

                {/* Unified Search & Filters with View Mode toggle */}
                <div className="flex-1 w-full">
                  <UnifiedSearchFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder={t('requisition.hub.searchPlaceholder')}
                    quickTabs={quickTabs}
                    activeQuickTab={categoryFilter}
                    onQuickTabChange={setCategoryFilter}
                    filterGroups={filterGroups}
                    themeColor="cyan"
                    extraControls={
                      <div className="flex items-center bg-[#07090e] p-1 rounded-xl border border-white/10 shadow-inner shrink-0">
                        <button
                          onClick={() => setViewMode('table')}
                          className={cn(
                            "p-2 rounded-lg transition-all cursor-pointer",
                            viewMode === 'table'
                              ? "bg-white text-slate-950 font-bold shadow-md"
                              : "text-slate-400 hover:text-white"
                          )}
                          title="عرض الجدول"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={cn(
                            "p-2 rounded-lg transition-all cursor-pointer",
                            viewMode === 'grid'
                              ? "bg-white text-slate-950 font-bold shadow-md"
                              : "text-slate-400 hover:text-white"
                          )}
                          title="عرض البطاقات"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                      </div>
                    }
                  />
                </div>
              </div>

              {/* Table View Mode */}
              {viewMode === 'table' ? (
                <div className="overflow-x-auto custom-scrollbar max-h-[580px]">
                  <table className="w-full text-start border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-[#0c0d14] z-10 border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider font-mono text-[11px]">
                      <tr>
                        <th className="px-6 py-4">{t('requisition.hub.thReference')}</th>
                        <th className="px-6 py-4">{t('requisition.hub.thFamilyTemplate')}</th>
                        <th className="px-6 py-4">{t('requisition.hub.thLocation')}</th>
                        <th className="px-6 py-4 text-center">{t('requisition.hub.thCondition')}</th>
                        <th className="px-6 py-4 text-center">{t('requisition.hub.thAvailable')}</th>
                        <th className="px-6 py-4 text-end">{t('requisition.hub.thAction')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-[#0a0a0f]/40">
                      <AnimatePresence mode="popLayout">
                        {filteredParts.map((part, idx) => {
                          const inCart = cart.find(c => c.blueprintId === part.id);
                          const currentCartQty = inCart?.quantity || 0;
                          const remaining = part.available - currentCartQty;
                          const isDepleted = remaining <= 0;

                          return (
                            <motion.tr 
                              key={part.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.015 }}
                              className="group hover:bg-white/[0.04] transition-colors border-b border-white/5"
                            >
                              {/* Reference & Model */}
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-black text-cyan-300 tracking-tight">
                                      {part.reference}
                                    </span>
                                    {part.isCritical && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        <span>{t('requisition.hub.criticalStock')}</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {part.model || part.skuBase}
                                  </span>
                                </div>
                              </td>

                              {/* Family & Template */}
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white font-sans">
                                    {part.templateName}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {t('common.family')}: {part.familyName}
                                  </span>
                                </div>
                              </td>

                              {/* Storage Location */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-mono text-slate-200">
                                      {part.locationDetails}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-500">
                                      {part.warehouseId}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Condition */}
                              <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-black border",
                                  part.condition === 'NEW' && "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                                  part.condition === 'USED' && "bg-amber-500/10 text-amber-300 border-amber-500/20",
                                  part.condition === 'REFURBISHED' && "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
                                  part.condition === 'LEGACY' && "bg-purple-500/10 text-purple-300 border-purple-500/20",
                                )}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {part.condition}
                                </span>
                              </td>

                              {/* Available Stock & Live Balance */}
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-mono font-black border shadow-sm",
                                    remaining > 5 && "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
                                    remaining <= 5 && remaining > 0 && "bg-amber-500/10 text-amber-300 border-amber-500/30",
                                    remaining <= 0 && "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                  )}>
                                    {remaining} {part.unit}
                                  </span>
                                  {currentCartQty > 0 && (
                                    <span className="text-[10px] font-mono text-cyan-400">
                                      ({currentCartQty} {t('requisition.hub.inCart')})
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 text-end">
                                <div className="flex items-center justify-end gap-2">
                                  {currentCartQty > 0 ? (
                                    <div className="flex items-center bg-[#07090e] rounded-xl p-1 border border-white/15">
                                      <button
                                        onClick={() => updateCartQty(part.id, -1)}
                                        className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="w-6 text-center text-xs font-mono font-black text-cyan-300">
                                        {currentCartQty}
                                      </span>
                                      <button
                                        onClick={() => updateCartQty(part.id, 1)}
                                        disabled={isDepleted}
                                        className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddToCart(part)}
                                      disabled={isDepleted}
                                      className={cn(
                                        "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                                        isDepleted
                                          ? "bg-slate-800/40 text-slate-600 border border-white/5 cursor-not-allowed"
                                          : "bg-white text-slate-950 hover:bg-slate-200 font-extrabold shadow-md"
                                      )}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>{t('requisition.hub.addToCart')}</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>

                      {filteredParts.length === 0 && (
                        <tr className="bg-[#0a0a0f]/20">
                          <td colSpan={6} className="p-0">
                            <EmptyState 
                              icon={Boxes}
                              title={t('requisition.hub.noPartsFound')}
                              description={t('requisition.hub.tryModifySearch')}
                              color="cyan"
                              className="py-20 opacity-80"
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View Mode */
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto custom-scrollbar">
                  {filteredParts.length === 0 && (
                    <div className="col-span-full">
                      <EmptyState 
                        icon={Boxes}
                        title={t('requisition.hub.noPartsFound')}
                        description={t('requisition.hub.tryModifySearch')}
                        color="cyan"
                        className="py-20 opacity-80"
                      />
                    </div>
                  )}
                  {filteredParts.map((part) => {
                    const inCart = cart.find(c => c.blueprintId === part.id);
                    const currentCartQty = inCart?.quantity || 0;
                    const remaining = part.available - currentCartQty;
                    const isDepleted = remaining <= 0;

                    return (
                      <div 
                        key={part.id}
                        className="p-4 rounded-2xl bg-[#0b0d14] border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-4 shadow-md group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-mono font-black text-cyan-300">
                              {part.reference}
                            </span>
                            <h4 className="text-xs font-bold text-white mt-1">
                              {part.templateName}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {t('common.family')}: {part.familyName} • {part.skuBase}
                            </span>
                          </div>

                          <span className={cn(
                            "px-2.5 py-0.5 rounded-md text-[9px] font-mono font-black border",
                            part.condition === 'NEW' && "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                            part.condition === 'USED' && "bg-amber-500/10 text-amber-300 border-amber-500/20",
                            part.condition === 'REFURBISHED' && "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
                          )}>
                            {part.condition}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{part.locationDetails}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-md font-mono font-bold text-[11px] border",
                              remaining > 0 ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}>
                              {remaining} {part.unit}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(part)}
                          disabled={isDepleted}
                          className={cn(
                            "w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                            isDepleted
                              ? "bg-slate-800/40 text-slate-600 border border-white/5 cursor-not-allowed"
                              : "bg-white text-slate-950 hover:bg-slate-200 font-extrabold shadow-md"
                          )}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{currentCartQty > 0 ? `${t('requisition.hub.addAnother')} (${currentCartQty})` : t('requisition.hub.addToCart')}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        </motion.div>
      </div>

      {/* Floating Action Button Bar (Checkout & Validation) */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-2xl border-t border-white/10 p-4 flex justify-end z-40 mt-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 px-4 lg:px-8">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            {cart.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-cyan-300 font-black">{cart.length}</span>
                <span>{t('requisition.hub.itemsReady')}</span>
                <span className="font-mono text-white font-black">{totalCartQty} {t('requisition.hub.pieceUnit')}</span>
                <span>{t('requisition.hub.readyForIssue')}</span>
              </div>
            ) : (
              <span className="text-slate-500 text-xs">{t('requisition.hub.instructionPrompt')}</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleCheckout}
              disabled={!isValidCart || isSubmitting}
              className={cn(
                "w-full sm:w-auto px-8 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2.5 shadow-xl cursor-pointer",
                isValidCart && !isSubmitting
                  ? "bg-white text-slate-950 hover:bg-slate-200 shadow-white/10"
                  : "bg-slate-800/60 text-slate-500 border border-white/5 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{t('requisition.hub.submitting')}</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4" />
                  <span>{t('requisition.hub.confirmCheckout')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
