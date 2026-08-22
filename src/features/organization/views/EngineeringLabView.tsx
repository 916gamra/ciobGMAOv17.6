import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Folder, Layers, Hash, Plus, Trash2, Database,
  Component, Eye, LayoutGrid, Zap, BookOpen, Sparkles,
  DraftingCompass, RefreshCw, Building2
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
import { EngineViewSkeleton } from '@/shared/components/EngineViewSkeleton';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
import { LabHierarchicalSidebar, HierarchyFamilyNode } from '@/shared/components/LabHierarchicalSidebar';
import { LabEntityCard } from '@/shared/components/LabEntityCard';
import { CompleteFamilyCard } from '@/shared/components/CompleteFamilyCard';
import { CompleteMachineFamilyCard } from '@/shared/components/CompleteMachineFamilyCard';
import { CompleteMachineTemplateCard } from '@/shared/components/CompleteMachineTemplateCard';
import { CompleteMachineBlueprintCard } from '@/shared/components/CompleteMachineBlueprintCard';
import { getFamilyIcon, getTemplateIcon, getBlueprintIcon } from '@/shared/constants/icons';

export function EngineeringLabView({ tabId, user }: { tabId?: string, user?: User | null }) {
  const { t } = useTranslation();
  const { families, templates, blueprints, blueprintCounts, isLoading } = useMachineLibrary();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [deleteContext, setDeleteContext] = useState<{ type: ModalType, id: string } | null>(null);
  
  // Machine Taxonomy Sidebar Selection States
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  
  // View mode state for toggle: table vs cards
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [rightSearchTerm, setRightSearchTerm] = useState('');
  const [blueprintComponentsFilter, setBlueprintComponentsFilter] = useState<string>('ALL');
  const [blueprintSpecsFilter, setBlueprintSpecsFilter] = useState<string>('ALL');
  const [templateStatusFilter, setTemplateStatusFilter] = useState<string>('ALL');
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Queries for Standard Components attached to Blueprints
  const engData = useLiveQuery(async () => {
    const [standardComponents] = await Promise.all([
      db.standardComponents.toArray(),
    ]);
    return { standardComponents };
  }, []);

  const standardComponents = engData?.standardComponents ?? EMPTY_ARRAY;

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

  // Transform machine families, templates, and blueprints for LabHierarchicalSidebar
  const hierarchicalFamilies: HierarchyFamilyNode[] = useMemo(() => {
    return families.map(fam => {
      const group = ((fam as any).group || fam.name || fam.code || '').toLowerCase();
      let discipline: 'mechanical' | 'hydraulic' | 'electrical' | 'electronic' | 'pneumatic' | 'general' = 'general';
      if (group.includes('mecanique') || group.includes('méc') || group.includes('mechanical') || group.includes('rob')) {
        discipline = 'mechanical';
      } else if (group.includes('hydraulique') || group.includes('hydr') || group.includes('hydraulic') || group.includes('hyd')) {
        discipline = 'hydraulic';
      } else if (group.includes('pneumatique') || group.includes('pneum') || group.includes('pneumatic') || group.includes('pnu')) {
        discipline = 'pneumatic';
      } else if (group.includes('electronique') || group.includes('electronic')) {
        discipline = 'electronic';
      } else if (group.includes('electrique') || group.includes('elec') || group.includes('electrical')) {
        discipline = 'electrical';
      }

      const famTemplates = templates.filter(t => t.familyId === fam.id);
      
      return {
        id: fam.id,
        code: fam.code,
        name: fam.name,
        subtitle: fam.description,
        discipline,
        count: famTemplates.length,
        templates: famTemplates.map(tmpl => {
          const tmplBps = blueprints.filter(b => b.templateId === tmpl.id);
          return {
            id: tmpl.id,
            code: tmpl.skuBase || tmpl.id,
            name: tmpl.name,
            subtitle: tmpl.description,
            count: tmplBps.length,
            items: tmplBps.map(bp => ({
              id: bp.id,
              code: bp.reference || bp.id,
              name: bp.model || bp.reference || bp.id,
              subtitle: bp.technicalSpecs || bp.powerOrForce,
              raw: bp
            })),
            raw: tmpl
          };
        }),
        raw: fam
      };
    });
  }, [families, templates, blueprints]);

  const handleDelete = (type: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  if (isLoading) {
    return <EngineViewSkeleton mode="lab" themeColor="indigo" />;
  }

  return (
    <div className="flex flex-col h-full bg-[#08080c] text-slate-100 custom-scrollbar overflow-y-auto">
      {/* Page Header */}
      <div className="px-6 md:px-8 pt-6">
        <PageHeader
          title={t('lab.title', 'Engineering Classification & Modeling Lab')}
          subtitle={t('lab.subtitle', 'Manage and classify engineering families, specification templates, and physical blueprints')}
          icon={<DraftingCompass className="w-7 h-7 text-indigo-400" />}
          badgeText={t('lab.badge', 'Engineering Lab')}
          badgeColor="indigo"
          actions={
            <button 
              onClick={() => setShowSyncModal(true)}
              disabled={isSyncing}
              className="p-2 px-3 rounded-xl bg-white/[0.06] text-slate-200 hover:bg-white/[0.12] hover:text-white border border-white/15 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
              title={t('lab.syncTooltip', 'Synchronize Laboratory')}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-400", isSyncing && "animate-spin")} />
              <span>{t('lab.syncBtn', 'Sync Laboratory')}</span>
            </button>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('lab.statFamilies', 'Machine Families')}
              subtitle="MACHINE FAMILIES"
              value={families.length}
              icon={<Building2 className="w-3.5 h-3.5" />}
              color="blue"
            />
            <HeaderBentoCard
              title={t('lab.statTemplates', 'Machine Templates')}
              subtitle="MACHINE TEMPLATES"
              value={templates.length}
              icon={<Layers className="w-3.5 h-3.5" />}
              color="blue"
            />
            <HeaderBentoCard
              title={t('lab.statBlueprints', 'Machine Blueprints')}
              subtitle="MACHINE BLUEPRINTS"
              value={blueprints.length}
              icon={<Hash className="w-3.5 h-3.5" />}
              color="indigo"
            />
            <HeaderBentoCard
              title={t('lab.statComponents', 'Modular Components')}
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
        <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-6 overflow-hidden">
          
          {/* Left Sidebar - Machine Taxonomy Tree (Golden Master Lab Standard) */}
          <div className="w-full md:w-96 shrink-0 h-[650px] md:h-auto min-h-0">
            <LabHierarchicalSidebar
              title={t('lab.hierarchyTree', 'Engineering Hierarchy Tree')}
              subtitle={t('lab.hierarchySubtitle', 'Families & Templates Library')}
              families={hierarchicalFamilies}
              selectedFamilyId={selectedFamilyId}
              selectedTemplateId={selectedTemplateId}
              selectedBlueprintId={selectedBlueprintId}
              onSelectFamily={(fam) => {
                setSelectedFamilyId(fam ? fam.id : null);
                setSelectedTemplateId(null);
                setSelectedBlueprintId(null);
              }}
              onSelectTemplate={(tmpl, fam) => {
                if (fam) setSelectedFamilyId(fam.id);
                setSelectedTemplateId(tmpl ? tmpl.id : null);
                setSelectedBlueprintId(null);
              }}
              onSelectBlueprint={(bp, tmpl, fam) => {
                if (fam) setSelectedFamilyId(fam.id);
                if (tmpl) setSelectedTemplateId(tmpl.id);
                setSelectedBlueprintId(bp ? bp.id : null);
              }}
              onPrimaryAction={() => setActiveModal('family')}
              primaryActionLabel={t('lab.addFamilyBtn', 'Add New Machine Family')}
              onResetSelection={() => {
                setSelectedFamilyId(null);
                setSelectedTemplateId(null);
                setSelectedBlueprintId(null);
              }}
              resetLabel={t('pdr.catalog.showMasterCatalog', 'View Master Catalog (All)')}
              engineTheme="indigo"
              level3Enabled={true}
            />
          </div>

          {/* Right Main Workspace Canvas */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl bg-[#0a0b10]/95 backdrop-blur-xl relative w-full h-full min-h-0">
              
              {/* Engine Accent Line */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none z-20" />

              {/* Ambient Engine Accent Rays & Glows (Positioned strictly in background layer behind content) */}
              <div className="absolute -top-12 -right-12 sm:-top-20 sm:-right-20 w-64 h-64 sm:w-80 sm:h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none z-0" />
              <div className="absolute -bottom-12 -left-12 sm:-bottom-20 sm:-left-20 w-64 h-64 sm:w-80 sm:h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />
              
              {/* Foreground Content Container with z-10 relative layer */}
              <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full h-full">                <AnimatePresence mode="wait">
                  {selectedBlueprintId ? (
                  // Mode: Blueprint Selected Detail View
                  (() => {
                    const bp = blueprints.find(b => b.id === selectedBlueprintId);
                    if (!bp) return null;
                    const parentTemplate = templates.find(t => t.id === bp.templateId);
                    const parentFamily = parentTemplate ? families.find(f => f.id === parentTemplate.familyId) : null;
                    const assembledComps = standardComponents.filter(c => bp.componentIds?.includes(c.id));
                    const BlueprintIcon = getBlueprintIcon(bp.model || bp.reference, 'card');

                    return (
                      <motion.div
                        key={`blueprint-${bp.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="flex flex-col h-full min-h-0"
                      >
                        {/* Universal Glass Command Bar Header */}
                        <div className="p-4 md:p-6 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-[#0a0b10]/95 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 relative z-10 shadow-md">
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)] shrink-0 text-indigo-400">
                              <BlueprintIcon className="w-6 h-6" />
                            </div>
                            <div className="text-start">
                              <div className="flex items-center gap-2 flex-wrap">
                                {bp.model && (
                                  <span className="text-[10px] uppercase font-bold text-slate-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full">{bp.model}</span>
                                )}
                                <h3 className="text-lg font-mono font-bold text-white tracking-tight uppercase">{bp.reference}</h3>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                                {parentFamily?.name} / {parentTemplate?.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => setSelectedBlueprintIdForAssembly(bp.id)}
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Component className="w-3.5 h-3.5" />
                              <span>{t('lab.assembleCompsBtn', 'تجميع وتعديل المكونات')}</span>
                            </button>
                            <button 
                              onClick={(e) => handleDelete('blueprint', bp.id, e)}
                              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
                              title={t('common.delete', 'حذف')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
                          
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
                                      <p className="text-[9px] text-slate-400 mt-1">{t('lab.linkedTasks', 'Linked Tasks')}: {comp.taskIds?.length || 0}</p>
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
                    const allTplBlueprints = blueprints.filter(b => b.templateId === tpl.id);
                    const TemplateIcon = getTemplateIcon(tpl.name, 'component');
                    
                    const tplBlueprints = allTplBlueprints.filter(b => {
                      if (blueprintComponentsFilter === 'WITH_COMPONENTS') {
                        const hasComps = standardComponents.some(c => c.blueprintId === b.id);
                        if (!hasComps) return false;
                      } else if (blueprintComponentsFilter === 'WITHOUT_COMPONENTS') {
                        const hasComps = standardComponents.some(c => c.blueprintId === b.id);
                        if (hasComps) return false;
                      }

                      if (blueprintSpecsFilter === 'WITH_SPECS') {
                        const hasSpecs = (b.powerOrForce && b.powerOrForce.trim()) || (b.technicalSpecs && b.technicalSpecs.trim());
                        if (!hasSpecs) return false;
                      } else if (blueprintSpecsFilter === 'WITHOUT_SPECS') {
                        const hasSpecs = (b.powerOrForce && b.powerOrForce.trim()) || (b.technicalSpecs && b.technicalSpecs.trim());
                        if (hasSpecs) return false;
                      }

                      if (rightSearchTerm.trim()) {
                        const q = rightSearchTerm.toLowerCase();
                        return (
                          b.reference.toLowerCase().includes(q) ||
                          (b.model && b.model.toLowerCase().includes(q)) ||
                          (b.powerOrForce && b.powerOrForce.toLowerCase().includes(q))
                        );
                      }
                      return true;
                    });

                    const withCompsCount = allTplBlueprints.filter(b => standardComponents.some(c => c.blueprintId === b.id)).length;
                    const withoutCompsCount = allTplBlueprints.length - withCompsCount;
                    const withSpecsCount = allTplBlueprints.filter(b => (b.powerOrForce && b.powerOrForce.trim()) || (b.technicalSpecs && b.technicalSpecs.trim())).length;
                    const withoutSpecsCount = allTplBlueprints.length - withSpecsCount;

                    const templateFilterGroups: FilterGroup[] = [
                      {
                        id: 'components',
                        label: t('lab.filterComponentsLabel', 'المكونات المجمعة'),
                        value: blueprintComponentsFilter,
                        onChange: setBlueprintComponentsFilter,
                        allLabel: t('lab.filterAllBlueprints', 'جميع البصمات'),
                        type: 'chips',
                        options: [
                          { value: 'WITH_COMPONENTS', label: t('lab.filterWithComponents', 'بصمات بمكونات مجمعة'), count: withCompsCount, badgeColor: 'indigo' },
                          { value: 'WITHOUT_COMPONENTS', label: t('lab.filterWithoutComponents', 'بصمات بدون مكونات'), count: withoutCompsCount, badgeColor: 'slate' }
                        ]
                      },
                      {
                        id: 'specs',
                        label: t('lab.filterSpecsLabel', 'المواصفات الفنية'),
                        value: blueprintSpecsFilter,
                        onChange: setBlueprintSpecsFilter,
                        allLabel: t('lab.filterAllBlueprints', 'جميع المواصفات'),
                        type: 'chips',
                        options: [
                          { value: 'WITH_SPECS', label: t('lab.filterWithSpecs', 'بمواصفات مكتملة'), count: withSpecsCount, badgeColor: 'cyan' },
                          { value: 'WITHOUT_SPECS', label: t('lab.filterWithoutSpecs', 'بدون مواصفات'), count: withoutSpecsCount, badgeColor: 'slate' }
                        ]
                      }
                    ];

                    return (
                      <motion.div
                        key={`template-${tpl.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="flex flex-col h-full min-h-0"
                      >
                        {/* Universal Glass Command Bar Header */}
                        <div className="p-4 md:p-6 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-[#0a0b10]/95 backdrop-blur-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10 shadow-md text-start">
                          {/* Start / Left: Icon, Names & Results Count Badge */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)] shrink-0 text-indigo-400">
                              <TemplateIcon className="w-6 h-6" />
                            </div>
                            <div className="text-start">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                                  {tpl.skuBase}
                                </span>
                                <h3 className="text-lg font-bold text-white tracking-tight">{tpl.name}</h3>
                                <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                                  {tplBlueprints.length} {t('lab.registeredBlueprintsCount', 'بصمة مسجلة')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                                {parentFamily?.name} / {tpl.skuBase} ({t('lab.templateTitle', 'Specification Template')})
                              </p>
                            </div>
                          </div>

                          {/* Center: Search & Filter in the Middle of Header */}
                          <div className="flex-1 max-w-md xl:max-w-lg mx-auto w-full px-1">
                            <UnifiedSearchFilter
                              searchTerm={rightSearchTerm}
                              onSearchChange={setRightSearchTerm}
                              searchPlaceholder={t('lab.searchBlueprintsPlaceholder', 'بحث برقم المرجع أو الطراز أو المواصفات...')}
                              filterGroups={templateFilterGroups}
                              themeColor="indigo"
                              onResetAll={() => {
                                setRightSearchTerm('');
                                setBlueprintComponentsFilter('ALL');
                                setBlueprintSpecsFilter('ALL');
                              }}
                            />
                          </div>

                          {/* End / Right: View Mode Switcher, Actions */}
                          <div className="flex items-center gap-2 shrink-0 justify-end">
                            <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10 mr-1">
                              <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all cursor-pointer",
                                  viewMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.tableView', 'Crystal Table View')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all cursor-pointer",
                                  viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.cardsView', 'Cards Grid View')}
                              >
                                <LayoutGrid className="w-4 h-4" />
                              </button>
                            </div>

                            <button 
                              onClick={() => setActiveModal('blueprint')}
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('lab.newBlueprintBtn', 'New Blueprint')}</span>
                            </button>
                            <button 
                              onClick={(e) => handleDelete('template', tpl.id, e)}
                              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
                              title={t('common.delete', 'Delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Blueprints List inside Template */}
                        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden text-start">
                          {allTplBlueprints.length === 0 ? (
                            <div className="p-12 m-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                              <Hash className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                              <p className="text-xs text-slate-400">{t('lab.noBlueprintsFound', 'No physical blueprints registered under this template yet.')}</p>
                              <button 
                                onClick={() => setActiveModal('blueprint')}
                                className="mt-4 bg-white text-slate-950 hover:bg-slate-200 font-extrabold text-xs rounded-xl px-4 py-2 transition-all inline-flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {t('lab.addFirstBlueprintBtn', 'Add First Blueprint')}
                              </button>
                            </div>
                          ) : tplBlueprints.length === 0 ? (
                            <div className="p-12 m-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                              <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                              <p className="text-xs text-slate-400">{t('common.nullResultsDesc', 'لا توجد نتائج تطابق معايير البحث.')}</p>
                              <button 
                                type="button"
                                onClick={() => setRightSearchTerm('')}
                                className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 text-xs transition-all cursor-pointer"
                              >
                                {t('common.resetSearch', 'إلغاء التصفية ومسح البحث')}
                              </button>
                            </div>
                          ) : viewMode === 'cards' ? (
                            <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {tplBlueprints.map(bp => {
                                return (
                                  <CompleteMachineBlueprintCard
                                    key={bp.id}
                                    blueprint={{
                                      id: bp.id,
                                      name: bp.reference,
                                      reference: bp.reference,
                                      model: bp.model,
                                      description: (bp as any).description,
                                      technicalSpecs: bp.technicalSpecs,
                                      powerOrForce: bp.powerOrForce,
                                      familyName: tpl.name,
                                      componentIds: bp.componentIds || [],
                                      subsystemIds: bp.componentIds || [],
                                      version: (bp as any).version
                                    }}
                                    isSelected={selectedBlueprintId === bp.id}
                                    onSelect={() => setSelectedBlueprintId(bp.id)}
                                    onAssemble={() => setSelectedBlueprintIdForAssembly(bp.id)}
                                    onEdit={() => {
                                      setSelectedBlueprintId(bp.id);
                                      setActiveModal('blueprint');
                                    }}
                                    onDuplicate={() => {
                                      toast.info(t('lab.duplicateBlueprintNotice', 'جاري نسخ المخطط المعماري...'));
                                    }}
                                    onDelete={() => {
                                      handleDelete('blueprint', bp.id);
                                    }}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-0">
                              <table className="w-full text-start border-collapse">
                                <thead className="bg-[#0b0c13]/98 border-b-2 border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
                                  <tr>
                                    <th className="p-4 text-start">{t('lab.blueprintRefLabel', 'Blueprint Reference')}</th>
                                    <th className="p-4 text-start">{t('lab.commercialModelLabel', 'Commercial Model')}</th>
                                    <th className="p-4 text-start">{t('lab.powerEnergyLabel', 'Power / Energy')}</th>
                                    <th className="p-4 text-end">{t('common.actions', 'Actions')}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                  {tplBlueprints.map((bp, idx) => (
                                    <tr 
                                      key={bp.id} 
                                      onClick={() => {
                                        setSelectedBlueprintId(bp.id);
                                      }}
                                      className={cn(
                                        "cursor-pointer transition-colors duration-150 text-start border-b border-white/5",
                                        idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                                        "hover:bg-indigo-500/15 hover:text-white"
                                      )}
                                    >
                                      <td className="p-4 font-mono font-extrabold text-white uppercase text-start flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 inline-block" />
                                        {bp.reference}
                                      </td>
                                      <td className="p-4 font-mono text-start font-semibold">{bp.model || 'N/A'}</td>
                                      <td className="p-4 font-mono text-start">{bp.powerOrForce || 'N/A'}</td>
                                      <td className="p-4 text-end" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={(e) => handleDelete('blueprint', bp.id, e)}
                                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                          title={t('common.delete', 'Delete')}
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
                      </motion.div>
                    );
                  })()
                ) : selectedFamilyId ? (
                  // Mode: Family Selected Detail View
                  (() => {
                    const fam = families.find(f => f.id === selectedFamilyId);
                    if (!fam) return null;
                    const allFamTemplates = templates.filter(t => t.familyId === fam.id);
                    const FamilyIcon = getFamilyIcon(fam.code || fam.name, 'machine');

                    const famTemplates = allFamTemplates.filter(t => {
                      if (templateStatusFilter === 'HAS_BLUEPRINTS') {
                        const hasBps = blueprints.some(b => b.templateId === t.id);
                        if (!hasBps) return false;
                      } else if (templateStatusFilter === 'EMPTY') {
                        const hasBps = blueprints.some(b => b.templateId === t.id);
                        if (hasBps) return false;
                      }

                      if (rightSearchTerm.trim()) {
                        const q = rightSearchTerm.toLowerCase();
                        return (
                          t.name.toLowerCase().includes(q) ||
                          t.skuBase.toLowerCase().includes(q) ||
                          (t.description && t.description.toLowerCase().includes(q))
                        );
                      }
                      return true;
                    });

                    const withBlueprintsCount = allFamTemplates.filter(t => blueprints.some(b => b.templateId === t.id)).length;
                    const emptyCount = allFamTemplates.length - withBlueprintsCount;

                    const familyFilterGroups: FilterGroup[] = [
                      {
                        id: 'templatesStatus',
                        label: t('lab.filterTemplatesLabel', 'حالة القوالب'),
                        value: templateStatusFilter,
                        onChange: setTemplateStatusFilter,
                        allLabel: t('lab.filterAllTemplates', 'جميع القوالب'),
                        type: 'chips',
                        options: [
                          { value: 'HAS_BLUEPRINTS', label: t('lab.filterWithBlueprints', 'قوالب بها بصمات نشطة'), count: withBlueprintsCount, badgeColor: 'indigo' },
                          { value: 'EMPTY', label: t('lab.filterEmptyTemplates', 'قوالب شاغرة (0 بصمات)'), count: emptyCount, badgeColor: 'slate' }
                        ]
                      }
                    ];

                    return (
                      <motion.div
                        key={`family-${fam.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="flex flex-col h-full min-h-0"
                      >
                        {/* Universal Glass Command Bar Header */}
                        <div className="p-4 md:p-6 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-[#0a0b10]/95 backdrop-blur-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10 shadow-md text-start">
                          {/* Start / Left: Icon, Names & Results Count Badge */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)] shrink-0 text-indigo-400">
                              <FamilyIcon className="w-6 h-6" />
                            </div>
                            <div className="text-start">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold bg-white/10 text-white px-2 py-0.5 rounded border border-white/15">
                                  {fam.code}
                                </span>
                                <h3 className="text-lg font-bold text-white tracking-tight">{fam.name}</h3>
                                <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                                  {famTemplates.length} {t('lab.registeredTemplatesCount', 'قالب مسجل')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                                {fam.description || t('lab.familyDescriptionDefault', 'Certified Industrial Family')}
                              </p>
                            </div>
                          </div>

                          {/* Center: Search & Filter in the Middle of Header */}
                          <div className="flex-1 max-w-md xl:max-w-lg mx-auto w-full px-1">
                            <UnifiedSearchFilter
                              searchTerm={rightSearchTerm}
                              onSearchChange={setRightSearchTerm}
                              searchPlaceholder={t('lab.searchTemplatesPlaceholder', 'بحث باسم القالب أو الرمز المعياري...')}
                              filterGroups={familyFilterGroups}
                              themeColor="indigo"
                              onResetAll={() => {
                                setRightSearchTerm('');
                                setTemplateStatusFilter('ALL');
                              }}
                            />
                          </div>

                          {/* End / Right: View Mode Switcher, Actions */}
                          <div className="flex items-center gap-2 shrink-0 justify-end">
                            <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10 mr-1">
                              <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all cursor-pointer",
                                  viewMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.tableView', 'Crystal Table View')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all cursor-pointer",
                                  viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.cardsView', 'Cards Grid View')}
                              >
                                <LayoutGrid className="w-4 h-4" />
                              </button>
                            </div>

                            <button 
                              onClick={() => setActiveModal('template')}
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('lab.newTemplateBtn', 'New Technical Template')}</span>
                            </button>
                            <button 
                              onClick={(e) => handleDelete('family', fam.id, e)}
                              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
                              title={t('common.delete', 'Delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Templates list inside Family */}
                        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden text-start">
                          {allFamTemplates.length === 0 ? (
                            <div className="p-12 m-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                              <p className="text-xs text-slate-400">{t('lab.noTemplatesFound', 'No specification templates registered under this family yet.')}</p>
                              <button 
                                onClick={() => setActiveModal('template')}
                                className="mt-4 bg-white text-slate-950 hover:bg-slate-200 font-extrabold text-xs rounded-xl px-4 py-2 transition-all inline-flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {t('lab.addFirstTemplateBtn', 'Add First Template')}
                              </button>
                            </div>
                          ) : famTemplates.length === 0 ? (
                            <div className="p-12 m-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                              <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                              <p className="text-xs text-slate-400">{t('common.nullResultsDesc', 'لا توجد نتائج تطابق معايير البحث.')}</p>
                              <button 
                                type="button"
                                onClick={() => setRightSearchTerm('')}
                                className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 text-xs transition-all cursor-pointer"
                              >
                                {t('common.resetSearch', 'إلغاء التصفية ومسح البحث')}
                              </button>
                            </div>
                          ) : viewMode === 'cards' ? (
                            <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {famTemplates.map(tpl => {
                                return (
                                  <CompleteMachineTemplateCard
                                    key={tpl.id}
                                    template={{
                                      id: tpl.id,
                                      name: tpl.name,
                                      description: tpl.description,
                                      familyId: tpl.familyId,
                                      skuBase: tpl.skuBase,
                                      subsystemIds: (tpl as any).subsystems || [],
                                      preventiveTaskIds: (tpl as any).preventiveTasks || []
                                    }}
                                    familyName={fam.name}
                                    isSelected={selectedTemplateId === tpl.id}
                                    onSelect={() => setSelectedTemplateId(tpl.id)}
                                    onEdit={() => {
                                      setSelectedTemplateId(tpl.id);
                                      setActiveModal('template');
                                    }}
                                    onDuplicate={() => {
                                      toast.info(t('lab.duplicateTemplateNotice', 'جاري نسخ قالب الآلة...'));
                                    }}
                                    onDelete={() => {
                                      handleDelete('template', tpl.id);
                                    }}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-0">
                              <table className="w-full text-start border-collapse">
                                <thead className="bg-[#0b0c13]/98 border-b-2 border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
                                  <tr>
                                    <th className="p-4 text-start">{t('lab.templateNameLabel', 'Template Name')}</th>
                                    <th className="p-4 text-start">{t('lab.baseSkuLabel', 'Standard Base SKU')}</th>
                                    <th className="p-4 text-start">{t('lab.blueprintsCountLabel', 'Blueprints Count')}</th>
                                    <th className="p-4 text-end">{t('common.actions', 'Actions')}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                  {famTemplates.map((tpl, idx) => (
                                    <tr 
                                      key={tpl.id}
                                      onClick={() => {
                                        setSelectedTemplateId(tpl.id);
                                      }}
                                      className={cn(
                                        "cursor-pointer transition-colors duration-150 text-start border-b border-white/5",
                                        idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                                        "hover:bg-indigo-500/15 hover:text-white"
                                      )}
                                    >
                                      <td className="p-4 font-bold text-white text-start flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 inline-block" />
                                        {tpl.name}
                                      </td>
                                      <td className="p-4 font-mono font-extrabold text-white uppercase text-start">{tpl.skuBase}</td>
                                      <td className="p-4 font-mono text-start font-semibold">{blueprintCounts.get(tpl.id) || 0} {t('lab.unitModel', 'models')}</td>
                                      <td className="p-4 text-end" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={(e) => handleDelete('template', tpl.id, e)}
                                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                          title={t('common.delete', 'Delete')}
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
                      </motion.div>
                    );
                  })()
                ) : (
                  // Default View: Master Families Overview (Table vs Cards with CompleteFamilyCard)
                  (() => {
                    const filteredFamilies = families.filter(f => {
                      if (!rightSearchTerm.trim()) return true;
                      const q = rightSearchTerm.toLowerCase();
                      return (
                        f.name.toLowerCase().includes(q) ||
                        f.code.toLowerCase().includes(q) ||
                        (f.description && f.description.toLowerCase().includes(q))
                      );
                    });

                    return (
                      <motion.div
                        key="master-families-overview"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="flex flex-col h-full min-h-0"
                      >
                        {/* Universal Glass Command Bar Header for Master Families */}
                        <div className="p-4 md:p-6 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-[#0a0b10]/95 backdrop-blur-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10 shadow-md text-start">
                          {/* Start / Left: Icon & Title */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)] shrink-0 text-indigo-400">
                              <Layers className="w-6 h-6" />
                            </div>
                            <div className="text-start">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold text-white tracking-tight">{t('lab.masterFamiliesTitle', 'Machine Families Catalog')}</h3>
                                <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                                  {families.length} {t('lab.familiesCountBadge', 'عائلة صناعية')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                                {t('lab.masterFamiliesSubtitle', 'Architectural classification & knowledge tree for machines')}
                              </p>
                            </div>
                          </div>

                          {/* Center: Search */}
                          <div className="flex-1 max-w-md xl:max-w-lg mx-auto w-full px-1">
                            <UnifiedSearchFilter
                              searchTerm={rightSearchTerm}
                              onSearchChange={setRightSearchTerm}
                              searchPlaceholder={t('lab.searchFamiliesPlaceholder', 'بحث باسم العائلة أو الكود أو الوصف...')}
                              themeColor="indigo"
                              onResetAll={() => setRightSearchTerm('')}
                            />
                          </div>

                          {/* End / Right: View Mode Switcher, Actions */}
                          <div className="flex items-center gap-2 shrink-0 justify-end">
                            <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10 mr-1">
                              <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all cursor-pointer",
                                  viewMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.tableView', 'Crystal Table View')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all cursor-pointer",
                                  viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                                )}
                                title={t('common.cardsView', 'Cards Grid View')}
                              >
                                <LayoutGrid className="w-4 h-4" />
                              </button>
                            </div>

                            <button 
                              onClick={() => setActiveModal('family')}
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('lab.newFamilyBtn', 'Add New Machine Family')}</span>
                            </button>
                          </div>
                        </div>

                        {/* Master Content Area */}
                        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden text-start">
                          {families.length === 0 ? (
                            <div className="p-12 m-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                              <p className="text-xs text-slate-400">{t('lab.noFamiliesFound', 'No machine families registered yet.')}</p>
                              <button 
                                onClick={() => setActiveModal('family')}
                                className="mt-4 bg-white text-slate-950 hover:bg-slate-200 font-extrabold text-xs rounded-xl px-4 py-2 transition-all inline-flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {t('lab.newFamilyBtn', 'Add New Machine Family')}
                              </button>
                            </div>
                          ) : filteredFamilies.length === 0 ? (
                            <div className="p-12 m-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                              <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                              <p className="text-xs text-slate-400">{t('common.nullResultsDesc', 'لا توجد نتائج تطابق معايير البحث.')}</p>
                              <button 
                                type="button"
                                onClick={() => setRightSearchTerm('')}
                                className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 text-xs transition-all cursor-pointer"
                              >
                                {t('common.resetSearch', 'إلغاء التصفية ومسح البحث')}
                              </button>
                            </div>
                          ) : viewMode === 'cards' ? (
                            <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {filteredFamilies.map(fam => {
                                const famTemplatesList = templates.filter(t => t.familyId === fam.id);
                                const famTemplateCount = famTemplatesList.length;
                                const famMachineCount = blueprints.filter(b => famTemplatesList.some(t => t.id === b.templateId)).length;
                                return (
                                  <CompleteMachineFamilyCard
                                    key={fam.id}
                                    family={{
                                      id: fam.id,
                                      name: fam.name,
                                      description: fam.description,
                                      code: fam.code,
                                      icon: fam.code,
                                      color: '#6366f1'
                                    }}
                                    stats={{
                                      templateCount: famTemplateCount,
                                      machineCount: famMachineCount
                                    }}
                                    onSelect={() => setSelectedFamilyId(fam.id)}
                                    onAddTemplate={() => {
                                      setSelectedFamilyId(fam.id);
                                      setActiveModal('template');
                                    }}
                                    onEdit={() => {
                                      setSelectedFamilyId(fam.id);
                                      setActiveModal('family');
                                    }}
                                    onDelete={() => {
                                      handleDelete('family', fam.id);
                                    }}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-0">
                              <table className="w-full text-start border-collapse">
                                <thead className="bg-[#0b0c13]/98 border-b-2 border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
                                  <tr>
                                    <th className="p-4 text-start">{t('lab.familyCode', 'Family Code')}</th>
                                    <th className="p-4 text-start">{t('lab.familyName', 'Family Name')}</th>
                                    <th className="p-4 text-start">{t('lab.templatesCount', 'Templates Count')}</th>
                                    <th className="p-4 text-end">{t('common.actions', 'Actions')}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                  {filteredFamilies.map((fam, idx) => {
                                    const count = templates.filter(t => t.familyId === fam.id).length;
                                    return (
                                      <tr 
                                        key={fam.id}
                                        onClick={() => setSelectedFamilyId(fam.id)}
                                        className={cn(
                                          "cursor-pointer transition-colors duration-150 text-start border-b border-white/5",
                                          idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                                          "hover:bg-indigo-500/15 hover:text-white"
                                        )}
                                      >
                                        <td className="p-4 font-mono font-extrabold text-white uppercase text-start flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 inline-block" />
                                          {fam.code}
                                        </td>
                                        <td className="p-4 font-bold text-white text-start">{fam.name}</td>
                                        <td className="p-4 font-mono text-start font-semibold">{count} {t('lab.registeredTemplatesCount', 'قالب مسجل')}</td>
                                        <td className="p-4 text-end" onClick={(e) => e.stopPropagation()}>
                                          <button 
                                            onClick={(e) => handleDelete('family', fam.id, e)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                            title={t('common.delete', 'Delete')}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()
                )}
              </AnimatePresence>
            </div>

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
          title={t('common.confirmDeleteTitle', 'Confirm Permanent Deletion')}
          description={t('common.confirmDeleteMessage', 'Are you sure you want to delete this resource? This action cannot be undone.')}
          confirmText={t('common.delete', 'Delete')}
          cancelText={t('common.cancel', 'Cancel')}
          onConfirm={confirmDelete}
          onClose={() => setDeleteContext(null)}
        />

        {/* Sync Confirmation Modal */}
        <ConfirmationModal
          isOpen={showSyncModal}
          title={t('lab.syncModalTitle', 'Synchronize Industrial Knowledge')}
          description={t('lab.syncModalMessage', 'This will synchronize and inject standard industrial taxonomies, templates, and blueprints. Do you wish to proceed?')}
          confirmText={t('common.sync', 'Sync')}
          cancelText={t('common.cancel', 'Cancel')}
          onConfirm={handleSyncLaboratory}
          onClose={() => setShowSyncModal(false)}
        />
      </div>
    </div>
  );
}
