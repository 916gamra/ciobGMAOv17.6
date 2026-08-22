import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';
import { 
  Package, Zap, Settings2, Search, 
  Cpu, Droplets, Activity, ChevronRight, ChevronDown, CheckCircle2, BatteryCharging,
  Plus, Database, FolderTree, X, Layers,
  Table, LayoutGrid, Tag, Hash, Wrench, Droplet, Wind, Eye, ExternalLink, ShieldCheck,
  Edit3, SlidersHorizontal, Info, Binary, Sparkles
} from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { useMasterCatalogEngine } from '@/features/organization/hooks/useMasterCatalogEngine';
import { useStockEngine } from '@/features/pdr-engine/hooks/useStockEngine';
import { useTabStore } from '@/app/store';
import { PdrWizardModal } from '../components/PdrWizardModal';
import { PdrPageSkeleton } from '../components/PdrPageSkeleton';
import { RegistryGuidanceState } from '@/core/ui/RegistryGuidanceState';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
import { LabHierarchicalSidebar, HierarchyFamilyNode } from '@/shared/components/LabHierarchicalSidebar';
import { CompleteComponentBlueprintCard } from '@/shared/components/CompleteComponentBlueprintCard';
import { toast } from 'sonner';

export function ComponentCatalogView() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotifications();
  const { openTab } = useTabStore();
  
  // Selection states (Triple-tier Hierarchy)
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);

  // Search & Filter states
  const [rightSearchTerm, setRightSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('ALL');
  const [familyFilter, setFamilyFilter] = useState<string>('ALL');

  // View mode switcher: Default to table view
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardPrefill, setWizardPrefill] = useState(false);
  const [activatingBlueprintId, setActivatingBlueprintId] = useState<string | null>(null);

  // Activate Instance form
  const [initialQuantity, setInitialQuantity] = useState(1);
  const [storageLocation, setStorageLocation] = useState('');
  const [minThreshold, setMinThreshold] = useState(2);

  const { blueprints, templates: dbTemplates, families: dbFamilies, isLoading } = useMasterCatalogEngine();
  const { inventory, addStock } = useStockEngine();

  // Saved linked template IDs from localStorage
  const [linkedTemplateIds, setLinkedTemplateIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('BDR_NEXUS_PDR_ACTIVE_TEMPLATES');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleLinkTemplate = (templateId: string) => {
    setLinkedTemplateIds(prev => {
      const next = Array.from(new Set([...prev, templateId]));
      localStorage.setItem('BDR_NEXUS_PDR_ACTIVE_TEMPLATES', JSON.stringify(next));
      return next;
    });
    showSuccess(t('pdr.catalog.templateLinked', 'Template Linked'), t('pdr.catalog.templateLinkedDesc', 'The specification template is now active in PDR Catalog.'));
  };

  const activeTemplateIds = useMemo(() => {
    const withBlueprints = blueprints.map(b => b.templateId);
    return Array.from(new Set([...withBlueprints, ...linkedTemplateIds]));
  }, [blueprints, linkedTemplateIds]);

  const activeTemplates = useMemo(() => {
    return dbTemplates.filter(t => activeTemplateIds.includes(t.id));
  }, [dbTemplates, activeTemplateIds]);

  const activeFamilyIds = useMemo(() => {
    return Array.from(new Set(activeTemplates.map(t => t.familyId)));
  }, [activeTemplates]);

  const activeFamilies = useMemo(() => {
    return dbFamilies.filter(f => activeFamilyIds.includes(f.id));
  }, [dbFamilies, activeFamilyIds]);

  const families = useMemo(() => {
    return (activeFamilies.length > 0 ? activeFamilies : dbFamilies).map(f => ({
      id: f.id,
      code: f.id.startsWith('fam-') ? f.id.replace('fam-', '') : f.name.substring(0, 3).toUpperCase(),
      name: f.name,
      description: f.description
    }));
  }, [activeFamilies, dbFamilies]);

  const templates = useMemo(() => {
    return (activeTemplates.length > 0 ? activeTemplates : dbTemplates).map(t => ({
      id: t.id,
      familyId: t.familyId,
      code: t.skuBase,
      skuBase: t.skuBase,
      name: t.name
    }));
  }, [activeTemplates, dbTemplates]);

  const getFamilyIcon = (fam: any) => {
    const group = (fam?.name || fam?.code || '').toLowerCase();
    if (group.includes('mecanique') || group.includes('méc') || group.includes('mechanical') || group.includes('rob')) {
      return <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (group.includes('hydraulique') || group.includes('hydr') || group.includes('hydraulic') || group.includes('hyd')) {
      return <Droplet className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    if (group.includes('pneumatique') || group.includes('pneum') || group.includes('pneumatic') || group.includes('pnu')) {
      return <Wind className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (group.includes('electronique') || group.includes('electrique') || group.includes('elec') || group.includes('aut')) {
      return <Zap className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    return <FolderTree className="w-4 h-4 text-cyan-400 shrink-0" />;
  };

  // Transform data for LabHierarchicalSidebar
  const hierarchicalFamilies: HierarchyFamilyNode[] = useMemo(() => {
    return families.map(fam => {
      const group = (fam.name || fam.code || '').toLowerCase();
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
            code: tmpl.skuBase || tmpl.code,
            name: tmpl.name,
            count: tmplBps.length,
            items: tmplBps.map(bp => {
              const inStockItem = inventory.find(i => i.blueprintId === bp.id);
              const inStock = !!inStockItem;
              return {
                id: bp.id,
                code: bp.reference || bp.id,
                name: bp.model || bp.reference || bp.id,
                subtitle: bp.technicalSpecs || bp.powerOrForce,
                isInStock: inStock,
                stockQty: inStockItem?.quantityCurrent,
                raw: bp
              };
            }),
            raw: tmpl
          };
        }),
        raw: fam
      };
    });
  }, [families, templates, blueprints, inventory]);

  // Handle Instance Activation into Physical Inventory
  const handleActivateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activatingBlueprintId) return;
    
    const blueprint = blueprints.find(b => b.id === activatingBlueprintId);
    if (!blueprint) return;

    try {
      await addStock({
        blueprintId: blueprint.id,
        quantityCurrent: initialQuantity,
        locationDetails: storageLocation || t('pdr.catalog.unassignedBin', 'Unassigned Bin'),
        warehouseId: 'WH-MAIN'
      });
      
      showSuccess(
        t('pdr.catalog.activationSuccess', 'Part Activated in Stock'), 
        `${blueprint.reference} (${blueprint.id}) ${t('pdr.catalog.isNowAvailableInStock', 'is now physically active in warehouse inventory.')}`
      );
      setActivatingBlueprintId(null);
      setInitialQuantity(1);
      setStorageLocation('');
      setMinThreshold(2);
    } catch(err: any) {
      showError(t('pdr.catalog.activationError', 'Activation Failed'), err.message);
    }
  };

  // All Blueprints enriched with template and family data for master view
  const allEnrichedBlueprints = useMemo(() => {
    return blueprints.map(bp => {
      const parentTemplate = templates.find(t => t.id === bp.templateId);
      const parentFamily = parentTemplate ? families.find(f => f.id === parentTemplate.familyId) : null;
      const inStockItem = inventory.find(i => i.blueprintId === bp.id);
      const inStock = !!inStockItem;

      return {
        ...bp,
        parentTemplate,
        parentFamily,
        inStockItem,
        inStock
      };
    });
  }, [blueprints, templates, families, inventory]);

  // Filtered blueprints in right workspace based on selection & search
  const filteredWorkspaceBlueprints = useMemo(() => {
    return allEnrichedBlueprints.filter(bp => {
      // Hierarchy filter
      if (selectedBlueprintId && bp.id !== selectedBlueprintId) return false;
      if (selectedTemplateId && bp.templateId !== selectedTemplateId) return false;
      if (selectedFamilyId && bp.parentFamily?.id !== selectedFamilyId) return false;
      
      // Stock Status filter
      if (stockStatusFilter === 'IN_STOCK' && !bp.inStock) return false;
      if (stockStatusFilter === 'DORMANT' && bp.inStock) return false;

      // Family Chip Filter (when in global master view)
      if (!selectedFamilyId && familyFilter !== 'ALL' && bp.parentFamily?.id !== familyFilter) return false;

      // Search term
      if (rightSearchTerm.trim()) {
        const q = rightSearchTerm.toLowerCase();
        const matchRef = bp.reference.toLowerCase().includes(q);
        const matchModel = (bp.model || '').toLowerCase().includes(q);
        const matchId = bp.id.toLowerCase().includes(q);
        const matchSpecs = (bp.technicalSpecs || '').toLowerCase().includes(q);
        const matchPower = (bp.powerOrForce || '').toLowerCase().includes(q);
        const matchTpl = (bp.parentTemplate?.name || '').toLowerCase().includes(q);
        const matchFam = (bp.parentFamily?.name || '').toLowerCase().includes(q);

        return matchRef || matchModel || matchId || matchSpecs || matchPower || matchTpl || matchFam;
      }

      return true;
    });
  }, [allEnrichedBlueprints, selectedBlueprintId, selectedTemplateId, selectedFamilyId, stockStatusFilter, familyFilter, rightSearchTerm]);

  // Context counts for badges
  const inStockCount = useMemo(() => allEnrichedBlueprints.filter(b => b.inStock).length, [allEnrichedBlueprints]);
  const dormantCount = useMemo(() => allEnrichedBlueprints.filter(b => !b.inStock).length, [allEnrichedBlueprints]);

  // Filter Groups for UnifiedSearchFilter in Right Workspace
  const workspaceFilterGroups: FilterGroup[] = useMemo(() => {
    const groups: FilterGroup[] = [
      {
        id: 'stockStatus',
        label: t('pdr.catalog.filterStatusLabel', 'Physical Status'),
        value: stockStatusFilter,
        onChange: setStockStatusFilter,
        allLabel: t('pdr.catalog.allStatuses', 'All Slots'),
        type: 'chips',
        options: [
          { value: 'IN_STOCK', label: t('pdr.catalog.activeStock', 'In Stock'), count: inStockCount, badgeColor: 'emerald' },
          { value: 'DORMANT', label: t('pdr.catalog.dormantSlot', 'Dormant'), count: dormantCount, badgeColor: 'slate' }
        ]
      }
    ];

    if (!selectedFamilyId && families.length > 1) {
      groups.push({
        id: 'family',
        label: t('pdr.catalog.filterFamilyLabel', 'Family Category'),
        value: familyFilter,
        onChange: setFamilyFilter,
        allLabel: t('pdr.catalog.allFamilies', 'All Families'),
        type: 'select',
        options: families.map(f => ({
          value: f.id,
          label: `${f.name} (${f.code})`
        }))
      });
    }

    return groups;
  }, [stockStatusFilter, inStockCount, dormantCount, selectedFamilyId, families, familyFilter, t]);

  // Active Context Label for Right Command Bar
  const contextDetails = useMemo(() => {
    if (selectedBlueprintId) {
      const bp = allEnrichedBlueprints.find(b => b.id === selectedBlueprintId);
      return {
        title: bp?.reference || 'Blueprint Details',
        subtitle: `${bp?.parentFamily?.name || 'FAMILY'} / ${bp?.parentTemplate?.name || 'TEMPLATE'} (${bp?.id})`,
        count: 1,
        unit: 'SLOT'
      };
    }
    if (selectedTemplateId) {
      const tpl = templates.find(t => t.id === selectedTemplateId);
      const fam = families.find(f => f.id === tpl?.familyId);
      return {
        title: tpl?.name || 'Specification Template',
        subtitle: `${fam?.name || 'FAMILY'} / ${tpl?.skuBase || 'SKU'} (SPECIFICATION TEMPLATE)`,
        count: filteredWorkspaceBlueprints.length,
        unit: 'BLUEPRINTS'
      };
    }
    if (selectedFamilyId) {
      const fam = families.find(f => f.id === selectedFamilyId);
      return {
        title: fam?.name || 'Spare Parts Family',
        subtitle: `${fam?.code || 'CODE'} (CLASSIFICATION FAMILY)`,
        count: filteredWorkspaceBlueprints.length,
        unit: 'BLUEPRINTS'
      };
    }
    return {
      title: t('pdr.catalog.masterDirectory', 'Spare Parts Master Catalog'),
      subtitle: t('pdr.catalog.globalMatrix', 'Global 999-Slot Blueprint Registry'),
      count: filteredWorkspaceBlueprints.length,
      unit: 'TOTAL SLOTS'
    };
  }, [selectedBlueprintId, selectedTemplateId, selectedFamilyId, allEnrichedBlueprints, templates, families, filteredWorkspaceBlueprints, t]);

  if (isLoading) {
    return <PdrPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden">
      
      {/* Page Header */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('pdr.catalog.title', 'PDR Spare Parts Catalog')}
          subtitle={t('pdr.catalog.subtitle', 'Four-Dimensional taxonomy, 999 slots matrix, and theoretical blueprint management.')}
          icon={<FolderTree className="w-7 h-7 text-cyan-400" />}
          badgeText={t('pdr.catalog.badge', 'PDR ENGINE')}
          badgeColor="cyan"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('pdr.catalog.blueprints', 'Blueprints')}
              subtitle="ACTIVE MODELS"
              value={blueprints.length}
              valueUnit={t('pdr.catalog.blueprintUnit', 'PARTS')}
              icon={<Tag className="w-3.5 h-3.5" />}
              color="cyan"
            />
            <HeaderBentoCard
              title={t('pdr.catalog.templates', 'Templates')}
              subtitle="SPECS TYPES"
              value={templates.length}
              valueUnit={t('pdr.catalog.templateUnit', 'SPECS')}
              icon={<Layers className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('pdr.catalog.families', 'Families')}
              subtitle="SECTORS"
              value={families.length}
              valueUnit={t('pdr.catalog.familyUnit', 'FAMILIES')}
              icon={<FolderTree className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('pdr.catalog.activeStockRate', 'Stock Rate')}
              subtitle="PHYSICAL LINK"
              value={`${inventory.length}/${blueprints.length || 1}`}
              valueUnit="ITEMS"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="emerald"
            />
          </div>
        </PageHeader>
      </div>

      {/* Main Split Explorer Canvas */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 overflow-hidden px-6 md:px-8 pb-6">
        
        {/* Left Navigation Card (دستور البطاقة اليسرى لمختبرات النظام الموحدة) */}
        <div className="w-full md:w-96 shrink-0 h-[650px] md:h-auto min-h-0">
          <LabHierarchicalSidebar
            title={t('pdr.catalog.hierarchyTree', 'Parts Taxonomy Matrix')}
            subtitle={t('pdr.catalog.hierarchySubtitle', '999 Slots Mathematical Architecture')}
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
            onPrimaryAction={() => {
              setWizardPrefill(false);
              setIsWizardOpen(true);
            }}
            primaryActionLabel={t('pdr.catalog.registerPart', 'Register New Part')}
            onResetSelection={() => {
              setSelectedFamilyId(null);
              setSelectedTemplateId(null);
              setSelectedBlueprintId(null);
            }}
            resetLabel={t('pdr.catalog.showMasterCatalog', 'View Master Catalog (All)')}
            engineTheme="cyan"
            level3Enabled={true}
          />
        </div>

        {/* Right Workspace Canvas Container */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-full flex flex-col bg-[#0a0b10]/95 backdrop-blur-xl relative">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent pointer-events-none z-20" />

            {/* Ambient Background Glows */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none z-0" />

            {/* Mode: Selected Blueprint Detail View vs Full-Bleed Table View */}
            {selectedBlueprintId ? (
              (() => {
                const bp = allEnrichedBlueprints.find(b => b.id === selectedBlueprintId);
                if (!bp) return null;

                return (
                  <motion.div
                    key={`blueprint-${bp.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex flex-col h-full min-h-0 relative z-10"
                  >
                    {/* Rich Glass Header for Blueprint Detail View */}
                    <div className="p-4 md:p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-[#0a0b10]/95 backdrop-blur-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10 text-start shadow-md">
                      
                      {/* Accent highlight beam */}
                      <div className="absolute -top-10 left-10 w-60 h-24 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

                      <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                          <Tag className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black text-white uppercase tracking-tight">{bp.reference}</h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                              {bp.id}
                            </span>
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border",
                              bp.inStock 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-white/5 text-slate-400 border-white/10"
                            )}>
                              {bp.inStock ? t('pdr.catalog.activeInStock', 'IN STOCK') : t('pdr.catalog.dormantSlot', 'DORMANT')}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {bp.parentFamily?.name || 'FAMILY'} / {bp.parentTemplate?.name || 'TEMPLATE'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-stretch xl:self-auto justify-end relative z-10">
                        {bp.inStock ? (
                          <button
                            type="button"
                            onClick={() => openTab({ id: 'dashboard', portalId: 'PDR', title: t('pdr.radar', 'PDR Radar'), component: 'pdr-dashboard' })}
                            className="bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{t('pdr.catalog.viewInRadar', 'Inspect in Stock Radar')}</span>
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => setActivatingBlueprintId(bp.id)}
                            className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2 text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                          >
                            <BatteryCharging className="w-4 h-4 text-slate-950" />
                            <span>{t('pdr.catalog.activateInstanceBtn', 'Activate into Warehouse')}</span>
                          </button>
                        )}

                        <button 
                          type="button"
                          onClick={() => setSelectedBlueprintId(null)}
                          className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>{t('pdr.catalog.backToCatalog', 'Back to Table')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Detail Specification Bento Grid */}
                    <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-start">
                        
                        {/* Card 1: Technical & Physical Specifications */}
                        <div className="bg-[#12141d]/80 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col">
                          <div className="text-xs uppercase font-extrabold text-slate-200 tracking-wider border-b border-white/10 pb-2 flex items-center justify-between">
                            <span>{t('pdr.catalog.technicalSpecsTitle', 'Technical Specifications')}</span>
                            <Tag className="w-3.5 h-3.5 text-cyan-400" />
                          </div>

                          <div className="space-y-3 flex-1">
                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.commercialModelLabel', 'Commercial Model')}
                              </span>
                              <span className="block text-sm font-semibold text-white font-mono mt-0.5">
                                {bp.model || 'N/A'}
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.powerOrForceLabel', 'Measurement / Capacity')}
                              </span>
                              <span className="block text-sm font-semibold text-white mt-0.5">
                                {bp.powerOrForce || 'N/A'}
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.unitLabel', 'Measurement Unit')}
                              </span>
                              <span className="block text-sm font-semibold text-white font-mono mt-0.5">
                                {bp.unit || 'PCS'}
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.technicalDetailsLabel', 'Extended Datasheet')}
                              </span>
                              <span className="block text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5 mt-1">
                                {bp.technicalSpecs || t('pdr.catalog.noExtendedSpecs', 'Standard industrial component without customized parameter constraints.')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Physical Inventory & Stock Status */}
                        <div className="bg-[#12141d]/80 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col">
                          <div className="text-xs uppercase font-extrabold text-slate-200 tracking-wider border-b border-white/10 pb-2 flex items-center justify-between">
                            <span>{t('pdr.catalog.physicalStockTitle', 'Physical Stock & Bin')}</span>
                            <Package className="w-3.5 h-3.5 text-emerald-400" />
                          </div>

                          <div className="space-y-3 flex-1">
                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.quantityCurrent', 'Current Available Quantity')}
                              </span>
                              <span className="block text-2xl font-black text-white font-mono mt-1">
                                {bp.inStockItem?.quantityCurrent ?? 0} <span className="text-xs text-slate-400 font-sans font-normal">{bp.unit || 'PCS'}</span>
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.storageLocationLabel', 'Storage Bin / Shelf')}
                              </span>
                              <span className="block text-sm font-mono font-bold text-slate-200 mt-0.5">
                                {bp.inStockItem?.locationDetails || t('pdr.catalog.notInWarehouse', 'Dormant (Not in Warehouse)')}
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.reorderThreshold', 'Reorder Threshold')}
                              </span>
                              <span className="block text-sm font-mono text-slate-300 mt-0.5">
                                {bp.inStockItem?.minThreshold ?? 2} {bp.unit || 'PCS'}
                              </span>
                            </div>

                            <div className="pt-2">
                              <div className={cn(
                                "p-3 rounded-xl border flex items-center gap-2",
                                bp.inStock 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                                  : "bg-white/5 border-white/10 text-slate-300"
                              )}>
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                <span className="text-[11px] leading-tight">
                                  {bp.inStock 
                                    ? t('pdr.catalog.readyForWorkOrders', 'Item is active and ready to be consumed on work orders.')
                                    : t('pdr.catalog.activateToConsume', 'Activate item to assign to maintenance work orders.')
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: 999 Slots Mathematical Architecture */}
                        <div className="bg-[#12141d]/80 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col">
                          <div className="text-xs uppercase font-extrabold text-slate-200 tracking-wider border-b border-white/10 pb-2 flex items-center justify-between">
                            <span>{t('pdr.catalog.nomenclatureTitle', 'Nomenclature & Slot')}</span>
                            <Hash className="w-3.5 h-3.5 text-cyan-400" />
                          </div>

                          <div className="space-y-3 flex-1">
                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.assignedSlotCode', 'Assigned Slot Code')}
                              </span>
                              <span className="block text-base font-mono font-bold text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl mt-1">
                                {bp.id}
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.parentTemplateSku', 'Parent SKU Base')}
                              </span>
                              <span className="block text-sm font-mono text-slate-200 mt-0.5">
                                {bp.parentTemplate?.skuBase || 'GENERIC'}
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                                {t('pdr.catalog.architectureDimension', 'Architecture Dimension')}
                              </span>
                              <span className="block text-xs font-bold text-slate-300 mt-0.5">
                                {t('pdr.catalog.dimensionBlueprint', 'Dimension 2: Commercial Blueprint')}
                              </span>
                            </div>

                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                              {t('pdr.catalog.slotGuaranteedDesc', 'Zero Database Footprint rule guaranteed. This slot belongs to the 999 sequential capacity under this specification template.')}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </motion.div>
                );
              })()
            ) : (
              /* FULL BLEED UNIVERSAL CRYSTAL TABLE VIEW */
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-transparent relative z-10">
                
                {/* Rich Glass Command Bar with Distinct Visual Depth & Engine Accent Glow */}
                <div className="p-4 md:p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-[#0a0b10]/95 backdrop-blur-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10 shadow-md">
                  
                  {/* Subtle ambient cyan glow beam inside the command bar */}
                  <div className="absolute -top-10 left-10 w-64 h-24 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

                  {/* Left Side: Context Count with glowing cyan badge */}
                  <div className="flex items-center gap-3.5 shrink-0 text-start relative z-10">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                      {selectedTemplateId ? (
                        <Layers className="w-5 h-5 text-cyan-400" />
                      ) : selectedFamilyId ? (
                        <FolderTree className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <Tag className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-white uppercase tracking-tight">{contextDetails.title}</h2>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                          {contextDetails.count} {contextDetails.unit}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{contextDetails.subtitle}</p>
                    </div>
                  </div>

                  {/* Center & Right: Unified Search & Filter with View Switcher and Action */}
                  <div className="flex-1 max-w-3xl w-full flex items-center gap-3 relative z-10">
                    <div className="flex-1">
                      <UnifiedSearchFilter
                        searchTerm={rightSearchTerm}
                        onSearchChange={setRightSearchTerm}
                        searchPlaceholder={t('pdr.catalog.searchBlueprintsPlaceholder', 'Search reference, model, slot code, dimensions...')}
                        filterGroups={workspaceFilterGroups}
                        themeColor="cyan"
                        extraControls={
                          <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/10 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDisplayMode('table')}
                              className={cn(
                                "p-1.5 rounded-lg transition-all cursor-pointer",
                                displayMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                              )}
                              title={t('pdr.catalog.tableTooltip', 'Crystal Table View')}
                            >
                              <Table className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDisplayMode('cards')}
                              className={cn(
                                "p-1.5 rounded-lg transition-all cursor-pointer",
                                displayMode === 'cards' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                              )}
                              title={t('pdr.catalog.cardsTooltip', 'Cards Grid View')}
                            >
                              <LayoutGrid className="w-4 h-4" />
                            </button>
                          </div>
                        }
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        setWizardPrefill(Boolean(selectedFamilyId || selectedTemplateId));
                        setIsWizardOpen(true);
                      }}
                      className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 text-slate-950" /> 
                      <span>{t('pdr.catalog.registerPart', 'Register Part')}</span>
                    </button>
                  </div>
                </div>

                {/* Content Area - Full Bleed Table / Cards Container */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-transparent relative">
                  {filteredWorkspaceBlueprints.length === 0 ? (
                    <div className="p-6 md:p-8 flex-1 flex items-center justify-center">
                      <RegistryGuidanceState
                        id="pdr-catalog-guidance"
                        icon={Package}
                        title={
                          rightSearchTerm || stockStatusFilter !== 'ALL' || familyFilter !== 'ALL'
                            ? t('pdr.catalog.nullResultsTitle', 'No Matching Spare Parts Found')
                            : t('pdr.catalog.welcomeTitle', 'PDR Spare Parts Blueprint Catalog')
                        }
                        subtitle={
                          rightSearchTerm || stockStatusFilter !== 'ALL' || familyFilter !== 'ALL'
                            ? t('pdr.catalog.nullResultsDesc', 'No blueprints match your filter criteria. Try resetting your search or registering a new part.')
                            : t('pdr.catalog.welcomeDesc', 'Explore the four-dimensional taxonomy of industrial components governed by the 999 dormant slots rule.')
                        }
                        isSearchActive={Boolean(rightSearchTerm || stockStatusFilter !== 'ALL' || familyFilter !== 'ALL')}
                        onClearSearch={() => {
                          setRightSearchTerm('');
                          setStockStatusFilter('ALL');
                          setFamilyFilter('ALL');
                        }}
                        primaryAction={{
                          label: t('pdr.catalog.registerPartWizard', 'Register Part via Wizard'),
                          icon: Plus,
                          onClick: () => {
                            setWizardPrefill(false);
                            setIsWizardOpen(true);
                          }
                        }}
                        secondaryAction={{
                          label: t('pdr.catalog.showAllSlots', 'View All Slots'),
                          icon: Database,
                          onClick: () => {
                            setSelectedFamilyId(null);
                            setSelectedTemplateId(null);
                            setSelectedBlueprintId(null);
                            setStockStatusFilter('ALL');
                            setFamilyFilter('ALL');
                          }
                        }}
                        guidanceCards={[
                          {
                            icon: Binary,
                            title: t('pdr.catalog.slotsRuleTitle', 'The 999 Slots Rule (Dormant Slots)'),
                            description: t('pdr.catalog.slotsRuleDesc', 'Each template generates 999 mathematical dormant slots (ROB-001 to ROB-999) with zero database overhead until physically activated.')
                          },
                          {
                            icon: CheckCircle2,
                            title: t('pdr.catalog.fourDimensionsTitle', 'Four-Dimensional Architecture'),
                            description: t('pdr.catalog.fourDimensionsDesc', 'Theoretical blueprints in this catalog transition into physical inventory instances upon warehouse activation.')
                          }
                        ]}
                        themeColor="cyan"
                      />
                    </div>
                  ) : displayMode === 'table' ? (
                    
                    /* Crystal High-Contrast Full Bleed Table View (with distinct crystalline thead) */
                    <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-0">
                      <table className="w-full text-start border-collapse">
                        <thead className="bg-[#0b0c13]/98 border-b-2 border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
                          <tr>
                            <th className="py-4 px-6 text-start font-extrabold">{t('pdr.catalog.thSlotId', 'Slot ID')}</th>
                            <th className="py-4 px-6 text-start font-extrabold">{t('pdr.catalog.thReferenceModel', 'Reference & Commercial Model')}</th>
                            <th className="py-4 px-6 text-start font-extrabold">{t('pdr.catalog.thTaxonomy', 'Family & Template')}</th>
                            <th className="py-4 px-6 text-start font-extrabold">{t('pdr.catalog.thSpecs', 'Capacity / Specs')}</th>
                            <th className="py-4 px-6 text-center font-extrabold">{t('pdr.catalog.thStatus', 'Physical State')}</th>
                            <th className="py-4 px-6 text-center font-extrabold">{t('pdr.catalog.thActions', 'Actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                          {filteredWorkspaceBlueprints.map((bp, idx) => (
                            <tr 
                              key={bp.id} 
                              onClick={() => setSelectedBlueprintId(bp.id)}
                              className={cn(
                                "transition-colors duration-150 group text-start cursor-pointer",
                                idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                                "hover:bg-cyan-500/15 hover:text-white"
                              )}
                            >
                              {/* Slot ID */}
                              <td className="py-3.5 px-6 font-mono font-extrabold">
                                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] inline-flex items-center gap-2">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    bp.inStock 
                                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" 
                                      : "bg-slate-500"
                                  )} />
                                  {bp.id}
                                </span>
                              </td>

                              {/* Reference & Model */}
                              <td className="py-3.5 px-6">
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-white text-xs tracking-tight group-hover:text-cyan-200 transition-colors uppercase font-mono">
                                    {bp.reference}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {bp.model || t('pdr.catalog.genericModel', 'Standard Commercial Model')}
                                  </span>
                                </div>
                              </td>

                              {/* Family & Template SKU */}
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white text-[10px] font-mono font-bold">
                                    {bp.parentTemplate?.skuBase || 'SKU'}
                                  </span>
                                  <span className="text-[11px] text-slate-300 font-bold truncate max-w-[140px]">
                                    {bp.parentFamily?.name || 'FAMILY'}
                                  </span>
                                </div>
                              </td>

                              {/* Capacity / Technical Specs */}
                              <td className="py-3.5 px-6">
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-slate-200">
                                    {bp.powerOrForce || '-'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {bp.unit || 'PCS'}
                                  </span>
                                </div>
                              </td>

                              {/* Physical Status */}
                              <td className="py-3.5 px-6 text-center">
                                {bp.inStock ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{t('pdr.catalog.inStockBadge', 'IN STOCK ({{qty}} {{unit}})', { qty: bp.inStockItem?.quantityCurrent || 0, unit: bp.unit || 'PCS' })}</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10 inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                    <span>{t('pdr.catalog.dormantSlotBadge', 'DORMANT SLOT')}</span>
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-2">
                                  {bp.inStock ? (
                                    <button 
                                      type="button"
                                      onClick={() => setSelectedBlueprintId(bp.id)}
                                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                                      title={t('pdr.catalog.inspectDetails', 'Inspect Blueprint Details')}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>{t('pdr.catalog.inspectBtn', 'Inspect')}</span>
                                    </button>
                                  ) : (
                                    <button 
                                      type="button"
                                      onClick={() => setActivatingBlueprintId(bp.id)}
                                      className="px-3 py-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-200 font-extrabold transition-colors inline-flex items-center gap-1.5 text-xs cursor-pointer shadow-sm"
                                      title={t('pdr.catalog.activateSlotTooltip', 'Activate to Physical Inventory')}
                                    >
                                      <BatteryCharging className="w-3.5 h-3.5 text-slate-950" />
                                      <span>{t('pdr.catalog.activateBtn', 'Activate')}</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Cards Grid View */
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-start">
                        <AnimatePresence mode="popLayout">
                          {filteredWorkspaceBlueprints.map((bp) => (
                            <CompleteComponentBlueprintCard
                              key={bp.id}
                              blueprint={{
                                id: bp.id,
                                name: bp.reference,
                                partNumber: bp.reference,
                                manufacturer: bp.model || bp.parentFamily?.name,
                                category: bp.parentFamily?.name,
                                description: bp.technicalSpecs || bp.model,
                                voltageRating: bp.powerOrForce,
                                slotNumber: bp.id.replace(/\D/g, ''),
                                stockCount: bp.inStockItem?.quantityCurrent,
                                version: (bp as any).version
                              }}
                              isSelected={selectedBlueprintId === bp.id}
                              onSelect={() => setSelectedBlueprintId(bp.id)}
                              onActivateToStock={!bp.inStock ? () => setActivatingBlueprintId(bp.id) : undefined}
                              onEdit={() => {
                                setSelectedBlueprintId(bp.id);
                              }}
                              onDuplicate={() => {
                                toast.info(t('pdr.duplicateBlueprintNotice', 'جاري نسخ المخطط الفني...'));
                              }}
                              onDelete={() => {
                                toast.info(t('pdr.blueprintDeleteNotice', 'تم تسجيل طلب حذف المخطط الفني'));
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </GlassCard>
        </div>

      </div>

      {/* Activation Modal with High-Contrast White Primary Button */}
      <AnimatePresence>
        {activatingBlueprintId && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-sm"
            onClick={() => setActivatingBlueprintId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0f111a] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden relative text-start"
            >
              <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500" />
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-8 text-start">
                  <div>
                    <h2 className="text-xl font-black text-white mb-1 font-sans">
                      {blueprints.find(b => b.id === activatingBlueprintId)?.reference}
                    </h2>
                    <p className="text-xs text-cyan-400 font-mono font-bold tracking-widest uppercase">
                      {t('pdr.catalog.activateInstanceHeader', 'Physical Stock Activation')}
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl shrink-0">
                    <BatteryCharging className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>

                <form onSubmit={handleActivateInstance} className="space-y-5 text-start">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                        {t('pdr.catalog.initialQuantity', 'Initial Quantity')}
                      </label>
                      <input 
                        type="number"
                        min="1"
                        required
                        value={initialQuantity}
                        onChange={e => setInitialQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all font-mono text-base text-start font-bold"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                        {t('pdr.catalog.minimumThreshold', 'Min Threshold')}
                      </label>
                      <input 
                        type="number"
                        min="0"
                        required
                        value={minThreshold}
                        onChange={e => setMinThreshold(Number(e.target.value))}
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all font-mono text-base text-start font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                      {t('pdr.catalog.storageLocationBin', 'Storage Location (Aisle / Shelf / Bin)')}
                    </label>
                    <input 
                      type="text"
                      required
                      value={storageLocation}
                      onChange={e => setStorageLocation(e.target.value)}
                      placeholder={t('pdr.catalog.storageLocationPlaceholder', 'e.g. Aisle 03 - Rack D2')}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all text-start text-xs font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button 
                      type="button" 
                      onClick={() => setActivatingBlueprintId(null)}
                      className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all cursor-pointer"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button 
                      type="submit"
                      className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <BatteryCharging className="w-4 h-4 text-slate-950" />
                      <span>{t('pdr.catalog.confirmActivateBtn', 'Confirm Activation')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDR Wizard Modal */}
      <PdrWizardModal 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        families={dbFamilies}
        templates={dbTemplates}
        blueprints={blueprints}
        onLinkTemplate={handleLinkTemplate}
        initialFamilyId={wizardPrefill ? selectedFamilyId : null}
        initialTemplateId={wizardPrefill ? selectedTemplateId : null}
      />
    </div>
  );
}
