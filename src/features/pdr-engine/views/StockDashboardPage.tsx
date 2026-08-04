import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { PdrPageSkeleton } from '../components/PdrPageSkeleton';
import { useStockEngine } from '../hooks/useStockEngine';
import { useProcurementEngine } from '../hooks/useProcurementEngine';
import { useTabStore } from '@/app/store';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
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
  Tag
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { StockTransactionModal } from './StockTransactionModal';
import { AddInventoryModal } from './AddInventoryModal';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.02 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function StockDashboardPage({ tabId }: { tabId: string }) {
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
      showSuccess('Automatic Procurement Order', `A pending purchase order has been generated for ${lines.length} critical spare parts.`);
      setTimeout(() => {
        openTab({ id: 'procurement', portalId: 'PDR', title: 'Procurement v4', component: 'procurement' });
      }, 1200);
    } catch(err: any) {
      showError('Sync Error', err.message);
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
        partName: template?.name || 'Unknown Component',
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
        partName: template?.name || 'Unknown spare part',
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
    return <PdrPageSkeleton />;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 px-4 relative z-10 lg:px-8 text-left"
    >
      {/* Upper Subtle HUD Banner */}
      <div className="absolute top-0 right-0 left-0 h-[280px] bg-gradient-to-b from-slate-800/10 via-transparent to-transparent pointer-events-none z-0 rounded-t-[3rem]" />

      {/* Premium Header Layout */}
      <PageHeader
        title={t('pdr.dashboard.title', 'PDR Radar')}
        subtitle={t('pdr.dashboard.subtitle', 'Real-time spare parts stock & preventive consumption monitoring')}
        icon={<Box className="w-6 h-6 text-cyan-400" />}
        badgeText="Telemetry"
        badgeColor="cyan"
        actions={
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className="stroke-slate-800"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    healthPercentage > 75 ? "stroke-emerald-400" :
                    healthPercentage > 40 ? "stroke-amber-400" : "stroke-rose-500"
                  )}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 16}
                  strokeDashoffset={2 * Math.PI * 16 * (1 - healthPercentage / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-black text-white font-mono">{healthPercentage}%</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-sans">Readiness Index</div>
              <div className="text-xs font-black text-white mt-0.5 flex items-center gap-1.5 justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{optimalItemsCount} / {totalItemsCount} Safe</span>
              </div>
            </div>
          </div>
        }
      />

      {/* Upgraded Cyberpunk KPI display pods */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <StatCompactPod 
          icon={<Database className="w-5 h-5 text-emerald-400" />} 
          label="NEW Parts" 
          value={newPartsCount.toString()} 
          sub="Brand new stocks"
          color="emerald"
        />
        <StatCompactPod 
          icon={<AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />} 
          label="LOW Stock" 
          value={lowStockItems.length.toString()} 
          sub="Below safety threshold"
          color="warning"
        />
        <StatCompactPod 
          icon={<AlertOctagon className="w-5 h-5 text-rose-500 animate-bounce" />} 
          label="EMPTY Stock" 
          value={outOfStockItems.length.toString()} 
          sub="Requires immediate action"
          color="danger"
        />
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Left Columns: Beautiful Stock Radar Table Panel */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <GlassCard className="!p-0 border-white/5 overflow-hidden shadow-2xl rounded-3xl h-[650px] flex flex-col bg-black/20 backdrop-blur-2xl relative">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            
            {/* Control Panel Header */}
            <div className="p-4 md:p-5 border-b border-white/5 bg-white/[0.01] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 w-full lg:w-auto justify-start">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-tight font-sans">Asset & Inventory</h2>
                  <p className="text-[9px] font-bold text-cyan-400/60 uppercase tracking-widest font-mono">Live telemetry monitoring</p>
                </div>
              </div>

              {/* Action Buttons & Quick Search */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start">
                {/* Search Inputs */}
                <div className="relative w-full sm:w-56 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder={t('pdr.dashboard.searchPlaceholder', 'Search parts or references...')} 
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
                      title={t('pdr.dashboard.autoProcure', 'Auto-Procure')}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> {t('pdr.dashboard.autoProcure', 'Auto-Procure')}
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Entry Action */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 font-sans"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" /> {t('pdr.dashboard.addInventory', 'New Entry')}
                </button>

                {/* Transaction Action */}
                <button
                  onClick={() => { setPreselectedStockId(undefined); setIsModalOpen(true); }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" /> Withdraw / Deposit
                </button>
              </div>
            </div>

            {/* Premium Instrumented Filters */}
            <div className="px-5 py-2.5 bg-black/20 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Urgency status filter segment */}
                <div className="inline-flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setUrgencyFilter('ALL')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap",
                      urgencyFilter === 'ALL'
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    All Urgency
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
                    Below Safety
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
                    Empty
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
                    Optimal
                  </button>
                </div>

                {/* Reset button if filtered */}
                {(searchTerm || conditionFilter !== 'ALL' || urgencyFilter !== 'ALL') && (
                  <button 
                    onClick={resetFilters}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all font-bold text-xs flex items-center gap-1"
                    title="Reset filters"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="text-[10px] font-mono text-slate-500">
                Matching: <strong className="text-cyan-400">{filteredInventory.length}</strong> of {inventory.length} total
              </div>
            </div>
            
            {/* Table Area */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-black/20">
              {filteredInventory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <Box className="w-12 h-12 mb-3 text-slate-700 mx-auto opacity-20" />
                  <p className="text-xs font-medium text-slate-500 font-sans">No parts match your search or filter criteria.</p>
                  <button 
                    onClick={resetFilters}
                    className="mt-3 text-cyan-400 hover:text-cyan-300 text-xs font-bold underline font-sans"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        statusText = "OUT OF STOCK";
                      } else if (item.isLowStock) {
                        barColor = "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)] animate-pulse";
                        glowColor = "group-hover:border-amber-400/30";
                        statusText = "CRITICAL LOW";
                      } else {
                        barColor = "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]";
                        glowColor = "group-hover:border-emerald-400/30";
                        statusText = "SAFE";
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
                            className={`!p-0 relative overflow-hidden group h-full flex flex-col transition-all duration-300 border border-white/5 bg-black/20 hover:bg-white/[0.02] ${glowColor}`}
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
                            
                            {/* Make body card clickable to open Quick Actions / Transaction Modal */}
                            <div 
                              onClick={() => handleQuickAction(item.id)}
                              className="p-6 relative z-10 flex-1 cursor-pointer flex flex-col"
                            >
                              <div className="flex justify-between items-start mb-5 gap-4">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-cyan-500/20 transition-colors shadow-inner">
                                    <Box className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                  </div>
                                  <div className="overflow-hidden">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors truncate">{item.partName}</h3>
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">NEW</span>
                                    </div>
                                    <p className="text-[10px] text-cyan-400 font-mono mt-0.5 truncate">{item.blueprintReference}</p>
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-1.5 bg-black/40 border border-white/10 px-2 py-1 rounded-lg shrink-0">
                                  <span className="font-mono text-sm font-extrabold text-white tabular-nums">
                                    {item.quantityCurrent.toFixed(1).replace('.0', '')}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500">{item.unit}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-3 mt-auto pt-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-cyan-500/60" />
                                    <span className="truncate max-w-[150px]">{item.locationDetails || 'Main Warehouse (A1)'}</span>
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-slate-400">Bal: {item.quantityCurrent} / Min: {item.minThreshold}</span>
                                  <span className={cn("font-bold", item.isOutOfStock ? "text-rose-400" : item.isLowStock ? "text-amber-400" : "text-emerald-400")}>
                                    {statusText}
                                  </span>
                                </div>
                                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                                  <div 
                                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                                    style={{ width: `${Math.max(4, pct)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-auto grid grid-cols-2 divide-x divide-white/5 border-t border-white/5 bg-white/[0.02] text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">
                              <div className="p-4 flex items-center gap-2 justify-center" title="Family">
                                <Tag className="w-4 h-4 text-slate-500" />
                                <span className="truncate">{item.partFamily}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(item.id);
                                }}
                                className="p-4 flex items-center gap-2 justify-center hover:bg-white/[0.05] hover:text-cyan-400 transition-colors cursor-pointer" title="Action"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                                <span className="truncate">Transact</span>
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
          <GlassCard className="!p-0 border-white/5 overflow-hidden shadow-2xl rounded-3xl h-[650px] flex flex-col bg-black/20 backdrop-blur-2xl relative">
            
            {/* Feed Header */}
            <div className="p-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                <h2 className="text-xs font-extrabold text-white uppercase tracking-tight">Real-time Operations Stream</h2>
              </div>
              <span className="text-[8px] font-mono text-cyan-400 border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(6,182,212,0.15)] font-black">
                REALTIME TELEMETRY
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
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Waiting for new operations...</div>
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
                          isNewest ? "border-cyan-500/20 bg-white/[0.04] shadow-[0_0_15px_rgba(6,182,212,0.05)]" : "border-white/5 hover:border-white/10"
                        )}
                      >
                        {/* Timeline point */}
                        <div className={cn(
                          "absolute left-[-37px] top-6 w-2.5 h-2.5 rounded-full border-2 border-slate-950 z-10 transition-colors",
                          isNewest ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" : 
                          movement.type === 'IN' ? "bg-emerald-500" : "bg-amber-500"
                        )} />

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border text-[10px] font-extrabold",
                              movement.type === 'IN' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              movement.type === 'OUT' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                              'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                            )}>
                              {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '='}
                            </div>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-wider",
                              movement.type === 'IN' ? "text-emerald-400" : 
                              movement.type === 'OUT' ? "text-amber-400" : "text-cyan-400"
                            )}>
                              {movement.type === 'IN' ? 'Deposit' : movement.type === 'OUT' ? 'Withdrawal' : 'Adjustment'}
                            </span>
                          </div>
                          
                          <span className="text-[9px] font-bold text-slate-500 font-mono">
                            {new Date(movement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        
                        {/* Component metadata */}
                        <div className="text-left">
                          <div className="font-extrabold text-slate-200 text-xs group-hover:text-cyan-400 transition-colors">
                            {movement.partName}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                            Ref: <span className="text-slate-400">{movement.reference}</span>
                          </div>
                          {movement.notes && (
                            <div className="text-[9px] text-slate-400/80 bg-slate-950/40 p-1.5 rounded border border-white/[0.02] mt-1.5 font-sans leading-relaxed">
                              {movement.notes}
                            </div>
                          )}
                        </div>

                        {/* Executed by & quantity footer */}
                        <div className="flex items-center justify-between border-t border-white/[0.03] pt-2 mt-1 text-[9px] text-slate-400">
                          <div className={cn(
                            "font-mono text-xs font-black",
                            movement.type === 'IN' ? "text-emerald-400" : 
                            movement.type === 'OUT' ? "text-amber-400" : "text-cyan-400"
                          )}>
                            {movement.quantity} {(movement as any).unit || 'pcs'}
                          </div>
                          <div className="font-mono text-slate-500">
                            By: <strong className="text-slate-400">{movement.performedBy}</strong>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-950 to-transparent z-20 pointer-events-none" />
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
