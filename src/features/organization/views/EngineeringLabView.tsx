import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  Search, Folder, Layers, Hash, Plus, Trash2, Database, 
  RefreshCw, Component, ChevronDown, ChevronRight, Eye, LayoutGrid,
  Wrench, Droplet, Wind, Zap, Box, Cpu
} from 'lucide-react';
import { useMachineLibrary } from '../hooks/useMachineLibrary';
import { GlassCard } from '@/shared/components/GlassCard';
import { db } from '@/core/db';
import { MachineModals, ModalType } from '../components/MachineModals';
import { useLiveQuery } from 'dexie-react-hooks';
import { BlueprintAssemblyModal } from '../components/BlueprintAssemblyModal';
import { toast } from 'sonner';
import { useAuditTrail } from '@/features/system/hooks/useAuditTrail';
import { runDatabaseSeed } from '@/core/db/useDatabaseSeeder';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import type { User } from '@/core/db';
import { cn, EMPTY_ARRAY } from '@/shared/utils';
import { useTranslation } from 'react-i18next';

export function EngineeringLabView({ tabId, user }: { tabId?: string, user?: User | null }) {
  const { t } = useTranslation();
  const { families, templates, blueprints, blueprintCounts } = useMachineLibrary();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [deleteContext, setDeleteContext] = useState<{ type: ModalType, id: string } | null>(null);
  
  // Machine Taxonomy Sidebar Selection States
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  
  // View mode state for toggle: table vs cards
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Expanded Tree Node States for Sidebar
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Queries for Standard Components attached to Blueprints
  const engData = useLiveQuery(async () => {
    const [standardComponents] = await Promise.all([
      db.standardComponents.toArray(),
    ]);
    return { standardComponents };
  }, []);

  const standardComponents = engData?.standardComponents ?? EMPTY_ARRAY;

  const getFamilyIcon = (fam: any) => {
    const group = (fam?.group || fam?.name || '').toLowerCase();
    if (group.includes('mecanique') || group.includes('méc') || group.includes('mechanical')) return <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />;
    if (group.includes('hydraulique') || group.includes('hydr') || group.includes('hydraulic')) return <Droplet className="w-4 h-4 text-blue-400 shrink-0" />;
    if (group.includes('pneumatique') || group.includes('pneum') || group.includes('pneumatic')) return <Wind className="w-4 h-4 text-amber-400 shrink-0" />;
    if (group.includes('electronique') || group.includes('electrique') || group.includes('elec') || group.includes('electric')) return <Zap className="w-4 h-4 text-purple-400 shrink-0" />;
    return <Folder className="w-4 h-4 text-indigo-400 shrink-0" />;
  };

  // State for Blueprint Assembly configuration
  const [selectedBlueprintIdForAssembly, setSelectedBlueprintIdForAssembly] = useState<string | null>(null);

  const { logEvent } = useAuditTrail();

  const handleSyncLaboratory = async () => {
    try {
      setIsSyncing(true);
      setShowSyncModal(false);
      await logEvent({
        userId: user?.id || 'GUEST',
        userName: user?.name || 'Guest User',
        action: 'UPDATE',
        entityType: 'KNOWLEDGE_BASE',
        entityId: 'GENETIC_INJECTION',
        details: 'Manual synchronization of machine taxonomy and laboratory assets.',
        severity: 'INFO'
      });

      const seedFunc = runDatabaseSeed(true); 
      await seedFunc();
      
      toast.success(t('lab.syncSuccessTitle', 'Laboratory Synchronized'), {
        description: t('lab.syncSuccessDesc', 'New industrial taxonomy loaded. Reloading system...')
      });

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error(t('lab.syncError', 'Injection Failed'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Tree Filters & Search Terms
  const filteredFamilies = useMemo(() => {
    return families
      .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.code.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [families, searchTerm]);

  const toggleFamilyExpansion = (familyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFamilies(prev => ({ ...prev, [familyId]: !prev[familyId] }));
  };

  const toggleTemplateExpansion = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTemplates(prev => ({ ...prev, [templateId]: !prev[templateId] }));
  };

  const handleDelete = (type: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteContext({ type: type as any, id });
  };

  const confirmDelete = async () => {
    if (!deleteContext) return;
    
    const { type, id } = deleteContext;
    
    try {
      if (type === 'family') {
        const item = families.find(f => f.id === id);
        await db.machineFamilies.delete(id);
        if (selectedFamilyId === id) {
          setSelectedFamilyId(null);
          setSelectedTemplateId(null);
          setSelectedBlueprintId(null);
        }
        await logEvent({
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'DELETE',
          entityType: 'MACHINE_FAMILY',
          entityId: id,
          details: `Deleted Machine Family: ${item?.name || id}`,
          severity: 'WARNING'
        });
      } else if (type === 'template') {
        const item = templates.find(t => t.id === id);
        await db.machineTemplates.delete(id);
        if (selectedTemplateId === id) {
          setSelectedTemplateId(null);
          setSelectedBlueprintId(null);
        }
        await logEvent({
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'DELETE',
          entityType: 'MACHINE_TEMPLATE',
          entityId: id,
          details: `Deleted Machine Template: ${item?.name || id}`,
          severity: 'WARNING'
        });
      } else if (type === 'blueprint') {
        const item = blueprints.find(b => b.id === id);
        await db.machineBlueprints.delete(id);
        if (selectedBlueprintId === id) {
          setSelectedBlueprintId(null);
        }
        await logEvent({
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'DELETE',
          entityType: 'MACHINE_BLUEPRINT',
          entityId: id,
          details: `Deleted Machine Blueprint: ${item?.reference || id}`,
          severity: 'WARNING'
        });
      }
      toast.success(t('common.purged', 'Record purged successfully.'));
    } catch (error) {
      console.error(error);
      toast.error(t('common.deleteError', 'Deletion failed.'));
    } finally {
      setDeleteContext(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08080c] text-slate-100 custom-scrollbar overflow-y-auto" dir="ltr">
      {/* Page Header */}
      <div className="px-6 md:px-8 pt-6">
        <PageHeader
          title={t('lab.title', 'مختبر التصنيف والنمذجة الهندسية للآلات')}
          subtitle={t('lab.subtitle', 'إدارة وتصنيف العائلات الهندسية، القوالب المعرفية، والطرازات المادية للآلات والمكونات')}
          icon={<Database className="w-7 h-7 text-indigo-400" />}
          badgeText={t('lab.badge', 'Engineering Lab')}
          badgeColor="indigo"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('lab.statFamilies', 'العائلات الهندسية')}
              subtitle="MACHINE FAMILIES"
              value={families.length}
              icon={<Folder className="w-3.5 h-3.5" />}
              color="blue"
            />
            <HeaderBentoCard
              title={t('lab.statTemplates', 'القوالب المعرفية')}
              subtitle="MACHINE TEMPLATES"
              value={templates.length}
              icon={<Layers className="w-3.5 h-3.5" />}
              color="blue"
            />
            <HeaderBentoCard
              title={t('lab.statBlueprints', 'الطرازات المعتمدة')}
              subtitle="MACHINE BLUEPRINTS"
              value={blueprints.length}
              icon={<Hash className="w-3.5 h-3.5" />}
              color="indigo"
            />
            <HeaderBentoCard
              title={t('lab.statComponents', 'المكونات المعيارية')}
              subtitle="MODULAR COMPONENTS"
              value={standardComponents.length}
              icon={<Component className="w-3.5 h-3.5" />}
              color="emerald"
            />
          </div>
        </PageHeader>
      </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 pb-6 gap-6 min-h-0">
        <MachineModals 
          activeModal={activeModal} 
          onClose={() => setActiveModal(null)} 
          families={families} 
          templates={templates} 
          blueprints={blueprints}
          user={user}
        />

        {/* Split-Pane Structure */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-6">
          
          {/* Left Sidebar - Machine Taxonomy Tree */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
            <div className="flex flex-col flex-1 min-h-[420px] p-0 border border-indigo-500/30 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(99,102,241,0.12)] bg-gradient-to-b from-indigo-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98 backdrop-blur-xl relative">
              
              {/* Background ambient engine accent glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="p-5 relative z-10 flex flex-col h-full space-y-4">
                {/* Title & Controls */}
                <div className="flex flex-col shrink-0 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-black uppercase tracking-wider block">
                      {t('lab.hierarchyTree', 'شجرة الهيكلية الهندسية')}
                    </span>
                    <button 
                      onClick={() => setShowSyncModal(true)}
                      disabled={isSyncing}
                      className="p-1.5 px-2 rounded-xl bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                      title={t('lab.syncTooltip', 'مزامنة المختبر')}
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-400", isSyncing && "animate-spin")} />
                    </button>
                  </div>
                  <span className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">
                    {t('lab.hierarchySubtitle', 'مكتبة العائلات والقوالب')}
                  </span>
                </div>

                {/* Prominent Wide Action Button - High Contrast White */}
                <button 
                  onClick={() => setActiveModal('family')}
                  className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>{t('lab.addFamilyBtn', 'إضافة عائلة هندسية جديدة')}</span>
                </button>

                {/* Sidebar Search Bar - Crystal White */}
                <div className="relative w-full shrink-0">
                  <Search className="w-4 h-4 absolute right-3 rtl:right-3 left-auto rtl:left-auto left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t('lab.searchPlaceholder', 'ابحث في العائلات أو القوالب أو الرمز...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pr-9 pl-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-start font-bold shadow-sm"
                  />
                </div>

                {/* Tree Navigation Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 text-start pt-1 -mx-2 px-2 pb-4">
                  {filteredFamilies.map(fam => {
                  const isExpanded = !!expandedFamilies[fam.id];
                  const isSelected = selectedFamilyId === fam.id && !selectedTemplateId && !selectedBlueprintId;
                  const famTemplates = templates.filter(t => t.familyId === fam.id);
                  
                  return (
                    <div key={fam.id} className="space-y-1">
                      {/* Family Node */}
                      <div 
                        onClick={() => {
                          setSelectedFamilyId(fam.id);
                          setSelectedTemplateId(null);
                          setSelectedBlueprintId(null);
                          setExpandedFamilies(prev => ({ ...prev, [fam.id]: true }));
                        }}
                        className={cn(
                          "p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 border transform active:scale-95",
                          isSelected 
                            ? "bg-indigo-500/20 border-indigo-500/50 text-white font-black shadow-[0_4px_20px_rgba(99,102,241,0.25)] scale-[1.02] -translate-y-0.5" 
                            : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <button 
                            onClick={(e) => toggleFamilyExpansion(fam.id, e)}
                            className={cn("p-1 rounded shrink-0 transition-colors", isSelected ? "text-indigo-300 hover:text-white hover:bg-indigo-500/30" : "text-slate-400 hover:text-white hover:bg-white/5")}
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                          </button>
                          <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0", isSelected ? "text-indigo-300" : "")}>
                            {getFamilyIcon(fam)}
                          </div>
                          <span className={cn("text-xs truncate", isSelected ? "font-black" : "font-extrabold")}>
                            {fam.name}
                          </span>
                        </div>
                        <span className={cn(
                          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0",
                          isSelected ? "bg-indigo-500/30 text-indigo-200 border-indigo-500/40" : "bg-white/10 text-white border-white/15"
                        )}>
                          {fam.code}
                        </span>
                      </div>

                      {/* Family Children (Templates) */}
                      {isExpanded && (
                        <div className="pl-4 border-l border-white/5 ml-2.5 rtl:pr-4 rtl:border-r rtl:border-l-0 rtl:mr-2.5 rtl:ml-0 space-y-1 py-1">
                          {famTemplates.map(tpl => {
                            const isTplExpanded = !!expandedTemplates[tpl.id];
                            const isTplSelected = selectedTemplateId === tpl.id && !selectedBlueprintId;
                            const tplBlueprints = blueprints.filter(b => b.templateId === tpl.id);

                            return (
                              <div key={tpl.id} className="space-y-1">
                                {/* Template Node */}
                                <div
                                  onClick={() => {
                                    setSelectedFamilyId(fam.id);
                                    setSelectedTemplateId(tpl.id);
                                    setSelectedBlueprintId(null);
                                    setExpandedTemplates(prev => ({ ...prev, [tpl.id]: true }));
                                  }}
                                  className={cn(
                                    "p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 border text-start transform active:scale-95",
                                    isTplSelected
                                      ? "bg-indigo-500/20 border-indigo-500/50 text-white font-black shadow-[0_4px_20px_rgba(99,102,241,0.25)] scale-[1.02] -translate-y-0.5"
                                      : "bg-[#0a0a0f] border-white/10 hover:bg-white/[0.05] hover:border-white/15 text-slate-300"
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                    <button
                                      onClick={(e) => toggleTemplateExpansion(tpl.id, e)}
                                      className={cn("p-1 rounded shrink-0 transition-colors", isTplSelected ? "text-indigo-300 hover:text-white hover:bg-indigo-500/30" : "text-slate-400 hover:text-white hover:bg-white/5")}
                                    >
                                      {isTplExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                                    </button>
                                    <Layers className={cn("w-3.5 h-3.5 shrink-0", isTplSelected ? "text-indigo-300" : "text-cyan-400")} />
                                    <span className={cn("text-xs truncate", isTplSelected ? "font-black text-white" : "font-bold text-slate-200")}>
                                      {tpl.name}
                                    </span>
                                  </div>
                                  <span className={cn(
                                    "text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0",
                                    isTplSelected ? "text-indigo-200 border-indigo-500/40 bg-indigo-500/30" : "text-white bg-white/10 border-white/15"
                                  )}>
                                    {tpl.skuBase}
                                  </span>
                                </div>

                                {/* Template Children (Blueprints) */}
                                {isTplExpanded && (
                                  <div className="pl-4 border-l border-white/5 ml-2 rtl:pr-4 rtl:border-r rtl:border-l-0 rtl:mr-2 rtl:ml-0 space-y-1 py-0.5">
                                    {tplBlueprints.map(bp => {
                                      const isBpSelected = selectedBlueprintId === bp.id;

                                      return (
                                        <div
                                          key={bp.id}
                                          onClick={() => {
                                            setSelectedFamilyId(fam.id);
                                            setSelectedTemplateId(tpl.id);
                                            setSelectedBlueprintId(bp.id);
                                          }}
                                          className={cn(
                                            "p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 border text-start transform active:scale-95",
                                            isBpSelected
                                              ? "bg-indigo-500/20 border-indigo-500/50 text-white font-black shadow-[0_4px_20px_rgba(99,102,241,0.25)] scale-[1.02] -translate-y-0.5"
                                              : "bg-[#0a0a0f] border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-slate-300 hover:text-white"
                                          )}
                                        >
                                          <div className="flex items-center gap-2 overflow-hidden w-full">
                                            <Cpu className={cn("w-3.5 h-3.5 shrink-0", isBpSelected ? "text-indigo-300" : "text-indigo-400")} />
                                            <span className={cn("text-xs font-mono tracking-tight truncate flex-1 px-1", isBpSelected ? "font-black text-white" : "font-bold text-indigo-200")}>
                                              {bp.reference}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {tplBlueprints.length === 0 && (
                                      <div className="text-[10px] text-slate-500 italic py-1 px-4 text-start">
                                        {t('lab.noBlueprintsInTemplate', 'لا توجد طرازات مادية')}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {famTemplates.length === 0 && (
                            <div className="text-[10px] text-slate-500 italic py-1 px-4 text-start">
                              {t('lab.noTemplatesInFamily', 'لا توجد قوالب مواصفات')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredFamilies.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-500 italic">
                    {t('lab.noMatchingItems', 'لا توجد عناصر مطابقة لشجرة الهيكلية')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Workspace Canvas */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl bg-[#0a0b10]/90 backdrop-blur-xl">
              
              <AnimatePresence mode="wait">
                {selectedBlueprintId ? (
                  // Mode: Blueprint Selected Detail View
                  (() => {
                    const bp = blueprints.find(b => b.id === selectedBlueprintId);
                    if (!bp) return null;
                    const parentTemplate = templates.find(t => t.id === bp.templateId);
                    const parentFamily = parentTemplate ? families.find(f => f.id === parentTemplate.familyId) : null;
                    const assembledComps = standardComponents.filter(c => bp.componentIds?.includes(c.id));

                    return (
                      <motion.div
                        key={`blueprint-${bp.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="flex flex-col h-full min-h-0 p-6 md:p-8"
                      >
                        {/* Blueprint Header info */}
                        <div className="flex flex-col md:flex-row justify-between items-start border-b border-white/10 pb-6 mb-6 gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#08080c] border border-white/10 flex items-center justify-center shadow-inner shrink-0">
                              <Hash className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-start">
                              <div className="flex items-center gap-2">
                                {bp.model && (
                                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{bp.model}</span>
                                )}
                                <h3 className="text-lg font-mono font-bold text-white tracking-tight uppercase">{bp.reference}</h3>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                                {parentFamily?.name} / {parentTemplate?.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSelectedBlueprintIdForAssembly(bp.id)}
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5"
                            >
                              <Component className="w-3.5 h-3.5" />
                              <span>{t('lab.assembleCompsBtn', 'تجميع وتعديل المكونات')}</span>
                            </button>
                            <button 
                              onClick={(e) => handleDelete('blueprint', bp.id, e)}
                              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                              title={t('common.delete', 'حذف')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar pb-6">
                          
                          {/* Physical Specs */}
                          <div className="lg:col-span-1 space-y-4">
                            <div className="bg-[#08080c]/80 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
                              <div className="text-xs uppercase font-extrabold text-slate-300 tracking-wider text-start border-b border-white/10 pb-2">
                                {t('lab.physicalSpecsTitle', 'المواصفات الفنية المادية')}
                              </div>
                              
                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider text-start">{t('lab.powerLabel', 'القدرة والقوة التشغيلية')}</span>
                                <span className="block text-sm font-semibold text-white text-start">{bp.powerOrForce || 'N/A'}</span>
                              </div>

                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider text-start">{t('lab.technicalSpecsLabel', 'المواصفات الملحقة')}</span>
                                <span className="block text-sm font-semibold text-white text-start">{bp.technicalSpecs || 'N/A'}</span>
                              </div>

                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider text-start">{t('lab.modelNumberLabel', 'رقم الطراز المعياري')}</span>
                                <span className="block text-sm font-mono text-slate-200 text-start">{bp.model || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Assembled Component Parts */}
                          <div className="lg:col-span-2 space-y-4 text-start">
                            <div className="text-sm font-bold text-slate-200">
                              {t('lab.assembledComponentsTitle', 'المكونات القياسية المجمعة')} ({assembledComps.length})
                            </div>

                            {assembledComps.length === 0 ? (
                              <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                                <Component className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-xs text-slate-400">{t('lab.noComponentsAssembled', 'لم يتم تجميع أي مكونات معيارية لهذه البصمة حتى الآن.')}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{t('lab.noComponentsHint', 'اضغط على زر تجميع المكونات بالأعلى لإضافة محركات، مضخات أو صمامات مخصصة.')}</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {assembledComps.map(comp => (
                                  <div 
                                    key={comp.id}
                                    className="p-4 rounded-xl border border-white/10 bg-[#08080c]/80 hover:border-white/20 transition-colors flex items-start justify-between gap-3 text-start shadow-md"
                                  >
                                    <div className="flex-1">
                                      <span className={cn(
                                        "inline-block text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded mb-1.5",
                                        comp.criticality === 'CRITICAL' ? 'bg-red-500/15 text-red-400' :
                                        comp.criticality === 'HIGH' ? 'bg-orange-500/15 text-orange-400' :
                                        comp.criticality === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400' :
                                        'bg-green-500/15 text-green-400'
                                      )}>
                                        {comp.criticality}
                                      </span>
                                      <h4 className="text-xs font-bold text-white">{comp.name}</h4>
                                      <p className="text-[9px] text-slate-400 mt-1">المهمات المرتبطة: {comp.taskIds?.length || 0}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </motion.div>
                    );
                  })()
                ) : selectedTemplateId ? (
                  // Mode: Template Selected Detail View
                  (() => {
                    const tpl = templates.find(t => t.id === selectedTemplateId);
                    if (!tpl) return null;
                    const parentFamily = families.find(f => f.id === tpl.familyId);
                    const tplBlueprints = blueprints.filter(b => b.templateId === tpl.id);

                    return (
                      <motion.div
                        key={`template-${tpl.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="flex flex-col h-full min-h-0 p-6 md:p-8"
                      >
                        {/* Template Header info */}
                        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-6 mb-6 gap-4 text-start">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#08080c] border border-white/10 flex items-center justify-center shadow-inner shrink-0">
                              <Layers className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-start">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15">
                                  {tpl.skuBase}
                                </span>
                                <h3 className="text-lg font-bold text-white tracking-tight">{tpl.name}</h3>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                                {parentFamily?.name} / {tpl.skuBase} ({t('lab.templateTitle', 'قالب المواصفات')})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setActiveModal('blueprint')}
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('lab.newBlueprintBtn', 'طراز (بصمة) مادي جديد')}</span>
                            </button>
                            <button 
                              onClick={(e) => handleDelete('template', tpl.id, e)}
                              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                              title={t('common.delete', 'حذف')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Blueprints List inside Template */}
                        <div className="flex-1 flex flex-col min-h-0 text-start">
                          <div className="flex items-center justify-between mb-4 flex-row">
                            <div className="text-sm font-bold text-slate-200">
                              {t('lab.clonedBlueprintsTitle', 'الطرازات المادية المستنسخة من هذا القالب')} ({tplBlueprints.length})
                            </div>
                            
                            {/* View Switcher */}
                            <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10">
                              <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  viewMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.tableView', 'عرض الجدول')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.cardsView', 'عرض البطاقات')}
                              >
                                <LayoutGrid className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {tplBlueprints.length === 0 ? (
                              <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                                <Hash className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                <p className="text-xs text-slate-400">{t('lab.noBlueprintsFound', 'لا توجد طرازات مادية مسجلة تحت هذا القالب بعد.')}</p>
                                <button 
                                  onClick={() => setActiveModal('blueprint')}
                                  className="mt-4 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-lg px-3 py-1.5 transition-all inline-block"
                                >
                                  {t('lab.addFirstBlueprintBtn', 'أضف الطراز الأول')}
                                </button>
                              </div>
                            ) : viewMode === 'cards' ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                {tplBlueprints.map(bp => {
                                  const isSelected = selectedBlueprintId === bp.id;
                                  return (
                                    <div 
                                      key={bp.id}
                                      onClick={() => setSelectedBlueprintId(bp.id)}
                                      className={cn(
                                        "border rounded-2xl p-5 cursor-pointer relative overflow-hidden group text-start flex flex-col justify-between transition-all duration-500",
                                        isSelected 
                                          ? "border-2 border-indigo-500 bg-[#0a0a0f] scale-[1.03] shadow-[0_0_25px_rgba(99,102,241,0.25)]" 
                                          : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:scale-[1.01]"
                                      )}
                                    >
                                      {/* Ambient Bottom Ray */}
                                      {isSelected && (
                                        <div className="bg-indigo-500/25 rounded-full blur-xl absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-16 pointer-events-none z-0" />
                                      )}

                                      <div className="relative z-10 w-full h-full flex flex-col justify-between">
                                        <div>
                                          <div className="flex items-start justify-between mb-4 flex-row">
                                            <div className="flex items-center gap-2">
                                              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                <Hash className="w-4 h-4 text-slate-300" />
                                              </div>
                                              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                                {bp.reference}
                                              </span>
                                            </div>
                                            
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete('blueprint', bp.id, e);
                                              }}
                                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-white/5 transition-colors cursor-pointer"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          <div className="space-y-3">
                                            <div>
                                              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">{t('lab.commercialModelLabel', 'الطراز التجاري')}</span>
                                              <span className="text-sm font-bold text-white">{bp.model || 'N/A'}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                                              <div>
                                                <span className="text-[9px] text-slate-400 block">{t('lab.powerEnergyLabel', 'القدرة / الطاقة')}</span>
                                                <span className="text-xs font-mono font-bold text-slate-200">{bp.powerOrForce || 'N/A'}</span>
                                              </div>
                                              <div>
                                                <span className="text-[9px] text-slate-400 block">{t('lab.activeComponentsLabel', 'المكونات النشطة')}</span>
                                                <span className="text-xs font-bold text-emerald-400">{bp.componentIds?.length || 0} مكون</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {bp.technicalSpecs && (
                                          <div className="border-t border-white/5 pt-3 mt-3 text-start">
                                            <span className="text-[9px] text-slate-400 block">{t('lab.techSpecsLabel', 'المواصفات الفنية')}</span>
                                            <p className="text-[11px] text-slate-300 truncate mt-0.5">{bp.technicalSpecs}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-white/10 bg-[#0a0b10]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                                <table className="w-full text-start border-collapse">
                                  <thead className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-xs text-start">
                                    <tr>
                                      <th className="p-4 text-start">{t('lab.blueprintRefLabel', 'رمز البصمة الهندسي')}</th>
                                      <th className="p-4 text-start">{t('lab.commercialModelLabel', 'الطراز التجاري')}</th>
                                      <th className="p-4 text-start">{t('lab.powerEnergyLabel', 'القدرة / الطاقة')}</th>
                                      <th className="p-4 text-end">{t('common.actions', 'إجراءات')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                    {tplBlueprints.map(bp => (
                                      <tr 
                                        key={bp.id}
                                        onClick={() => {
                                          setSelectedBlueprintId(bp.id);
                                        }}
                                        className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                                      >
                                        <td className="p-4 font-mono font-bold text-white uppercase text-start">{bp.reference}</td>
                                        <td className="p-4 font-mono text-start">{bp.model || 'N/A'}</td>
                                        <td className="p-4 font-mono text-start">{bp.powerOrForce || 'N/A'}</td>
                                        <td className="p-4 text-end" onClick={(e) => e.stopPropagation()}>
                                          <button 
                                            onClick={(e) => handleDelete('blueprint', bp.id, e)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()
                ) : selectedFamilyId ? (
                  // Mode: Family Selected Detail View
                  (() => {
                    const fam = families.find(f => f.id === selectedFamilyId);
                    if (!fam) return null;
                    const famTemplates = templates.filter(t => t.familyId === fam.id);

                    return (
                      <motion.div
                        key={`family-${fam.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="flex flex-col h-full min-h-0 p-6 md:p-8"
                      >
                        {/* Family Header info */}
                        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-6 mb-6 gap-4 text-start">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#08080c] border border-white/10 flex items-center justify-center shadow-inner shrink-0">
                              <Folder className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-start">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/15">
                                  {fam.code}
                                </span>
                                <h3 className="text-lg font-bold text-white tracking-tight">{fam.name}</h3>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                                {fam.description || t('lab.familyDescriptionDefault', 'عائلة صناعية معتمدة')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setActiveModal('template')}
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('lab.newTemplateBtn', 'قالب مواصفات فني جديد')}</span>
                            </button>
                            <button 
                              onClick={(e) => handleDelete('family', fam.id, e)}
                              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                              title={t('common.delete', 'حذف')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Templates list inside Family */}
                        <div className="flex-1 flex flex-col min-h-0 text-start">
                          <div className="flex items-center justify-between mb-4 flex-row">
                            <div className="text-sm font-bold text-slate-200">
                              {t('lab.templatesUnderFamilyTitle', 'قوالب المواصفات المسجلة تحت هذه العائلة')} ({famTemplates.length})
                            </div>
                            
                            {/* View Switcher */}
                            <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10">
                              <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  viewMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.tableView', 'عرض الجدول')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.cardsView', 'عرض البطاقات')}
                              >
                                <LayoutGrid className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {famTemplates.length === 0 ? (
                              <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                                <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                <p className="text-xs text-slate-400">{t('lab.noTemplatesFound', 'لا توجد قوالب مواصفات فنية مسجلة تحت هذه العائلة بعد.')}</p>
                                <button 
                                  onClick={() => setActiveModal('template')}
                                  className="mt-4 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-lg px-3 py-1.5 transition-all inline-block"
                                >
                                  {t('lab.addFirstTemplateBtn', 'أضف القالب الأول')}
                                </button>
                              </div>
                            ) : viewMode === 'cards' ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                {famTemplates.map(tpl => (
                                  <div 
                                    key={tpl.id}
                                    onClick={() => setSelectedTemplateId(tpl.id)}
                                    className="bg-[#08080c]/80 border border-white/10 hover:border-white/20 rounded-2xl p-5 hover:bg-white/[0.03] transition-all cursor-pointer relative overflow-hidden group text-start flex flex-col justify-between shadow-lg"
                                  >
                                    <div>
                                      <div className="flex items-start justify-between mb-4 flex-row">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                            <Layers className="w-4 h-4 text-slate-300" />
                                          </div>
                                          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                            {tpl.skuBase}
                                          </span>
                                        </div>
                                        
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete('template', tpl.id, e);
                                          }}
                                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-white/5 transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <h4 className="text-sm font-bold text-white mb-3">{tpl.name}</h4>

                                      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                                        <div>
                                          <span className="text-[9px] text-slate-400 block">{t('lab.registeredBlueprintsLabel', 'الطرازات المسجلة')}</span>
                                          <span className="text-xs font-mono font-bold text-slate-200">{blueprintCounts.get(tpl.id) || 0} طراز</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] text-slate-400 block">{t('lab.capacityLabel', 'السعة الرياضية')}</span>
                                          <span className="text-xs font-mono font-bold text-slate-400">999 مقعد</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="border-t border-white/5 pt-3 mt-3 flex justify-between items-center text-[10px] text-slate-500">
                                      <span className="font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">{t('lab.approvedTemplateBadge', 'قالب معرفي معتمد')}</span>
                                      <span>{t('common.clickForDetails', 'اضغط للتفاصيل')}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-white/10 bg-[#0a0b10]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                                <table className="w-full text-start border-collapse">
                                  <thead className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-xs text-start">
                                    <tr>
                                      <th className="p-4 text-start">{t('lab.templateNameLabel', 'قالب المواصفات')}</th>
                                      <th className="p-4 text-start">{t('lab.baseSkuLabel', 'الرمز المعياري Base SKU')}</th>
                                      <th className="p-4 text-start">{t('lab.blueprintsCountLabel', 'عدد الطرازات')}</th>
                                      <th className="p-4 text-end">{t('common.actions', 'إجراءات')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                    {famTemplates.map(tpl => (
                                      <tr 
                                        key={tpl.id}
                                        onClick={() => {
                                          setSelectedTemplateId(tpl.id);
                                        }}
                                        className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                                      >
                                        <td className="p-4 font-bold text-white text-start">{tpl.name}</td>
                                        <td className="p-4 font-mono font-bold text-white uppercase text-start">{tpl.skuBase}</td>
                                        <td className="p-4 font-mono text-start">{blueprintCounts.get(tpl.id) || 0} طراز</td>
                                        <td className="p-4 text-end" onClick={(e) => e.stopPropagation()}>
                                          <button 
                                            onClick={(e) => handleDelete('template', tpl.id, e)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()
                ) : (
                  // Default Welcome / Empty state
                  <motion.div
                    key="default-welcome"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-8 md:p-12 flex flex-col items-center justify-center text-center h-full flex-1"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                      <Database className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-white uppercase tracking-wider mb-2">
                      {t('lab.welcomeTitle', 'مختبر تصنيف الأصول والهيكلية الهندسية للآلات')}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                      {t('lab.welcomeDesc', 'مرحباً بك في لوحة تحكم مختبر الهندسة الصناعية. استخدم القائمة الجانبية للتنقل بين العائلات الهندسية والمواصفات المعيارية والأصول المادية.')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mt-8 text-start">
                      <div className="p-5 rounded-2xl bg-[#08080c]/80 border border-white/10 shadow-lg">
                        <div className="flex items-center gap-2 mb-2 justify-start">
                          <Layers className="w-4 h-4 text-white" />
                          <span className="text-xs font-extrabold text-white">{t('lab.rule999Title', 'الـ 999 مقعداً المعرفية')}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {t('lab.rule999Desc', 'يولد النظام تلقائياً 999 مقعداً شاغراً رياضياً فور إنشاء أي قالب، تضمن الترقيم المتسلسل والمنهجي التلقائي بمرونة عالية ودون استهلاك حجم قاعدة البيانات.')}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-[#08080c]/80 border border-white/10 shadow-lg">
                        <div className="flex items-center gap-2 mb-2 justify-start">
                          <Component className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-extrabold text-white">{t('lab.componentsTreeTitle', 'تجميع المكونات والأصول')}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {t('lab.componentsTreeDesc', 'تسمح الهيكلية النشطة ببناء شجرة المكونات الداخلية للآلة بشكل تصاعدي، لضمان توافق عمليات الصيانة والتدخلات الوقائية بدقة متناهية.')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </GlassCard>
          </div>

        </div>

        {/* Blueprint Assembly Configuration Overlay Modal */}
        <AnimatePresence>
          {selectedBlueprintIdForAssembly && (
            <BlueprintAssemblyModal
              blueprintId={selectedBlueprintIdForAssembly}
              onClose={() => setSelectedBlueprintIdForAssembly(null)}
              user={user}
            />
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!deleteContext}
          title={t('common.confirmDeleteTitle', 'تأكيد الحذف النهائي')}
          description={t('common.confirmDeleteMessage', 'هل أنت تأكد من ترغيبك في حذف هذا المورد من قاعدة البيانات؟ لا يمكن التراجع عن هذه العملية.')}
          confirmText={t('common.delete', 'حذف')}
          cancelText={t('common.cancel', 'إلغاء')}
          onConfirm={confirmDelete}
          onClose={() => setDeleteContext(null)}
        />

        {/* Sync Confirmation Modal */}
        <ConfirmationModal
          isOpen={showSyncModal}
          title={t('lab.syncModalTitle', 'مزامنة المعرفة الصناعية')}
          description={t('lab.syncModalMessage', 'سيتم إعادة مزامنة وتغذية قاعدة البيانات الجينية للآلات بالأكواد والقوالب القياسية. هل ترغب بالتأكيد؟')}
          confirmText={t('common.sync', 'مزامنة')}
          cancelText={t('common.cancel', 'إلغاء')}
          onConfirm={handleSyncLaboratory}
          onClose={() => setShowSyncModal(false)}
        />
      </div>
    </div>
  );
}
