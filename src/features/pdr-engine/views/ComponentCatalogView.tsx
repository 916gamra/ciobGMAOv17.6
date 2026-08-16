import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';
import { 
  Package, Zap, Settings2, Sparkles, Search, 
  Cpu, Droplets, Activity, ChevronRight, CheckCircle2, BatteryCharging,
  Plus, ArrowRight, Database, FolderTree, X, Link2, Unlink, ExternalLink, Tag, Layers,
  Table, LayoutGrid, BookOpen
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
import { CrystalTable, CrystalTableColumn } from '@/shared/components/CrystalTable';
import { EmptyState } from '@/shared/components/EmptyState';

export function ComponentCatalogView() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotifications();
  const { openTab } = useTabStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // View mode switcher: Default to table view for highly-detailed crystal aesthetics
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  
  // Selection state
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardPrefill, setWizardPrefill] = useState(false);
  const [activatingBlueprintId, setActivatingBlueprintId] = useState<string | null>(null);
  
  // Activate Instance form
  const [initialQuantity, setInitialQuantity] = useState(0);
  const [storageLocation, setStorageLocation] = useState('');
  const [minThreshold, setMinThreshold] = useState(2);
  
  const { blueprints, templates: dbTemplates, families: dbFamilies, isLoading } = useMasterCatalogEngine();
  const { inventory, addStock } = useStockEngine();

  // 1. Saved linked template IDs from localStorage to keep state of active templates in PDR Catalog
  const [linkedTemplateIds, setLinkedTemplateIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('BDR_NEXUS_PDR_ACTIVE_TEMPLATES');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save linked templates helper
  const handleLinkTemplate = (templateId: string) => {
    setLinkedTemplateIds(prev => {
      const next = Array.from(new Set([...prev, templateId]));
      localStorage.setItem('BDR_NEXUS_PDR_ACTIVE_TEMPLATES', JSON.stringify(next));
      return next;
    });
    showSuccess('Template Linked', 'The specification template is now active in PDR Catalog.');
  };

  const handleUnlinkTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const hasBlueprints = blueprints.some(b => b.templateId === templateId);
    if (hasBlueprints) {
      showError('Cannot Unlink', 'This template has active blueprints in the catalog and cannot be unlinked.');
      return;
    }
    setLinkedTemplateIds(prev => {
      const next = prev.filter(id => id !== templateId);
      localStorage.setItem('BDR_NEXUS_PDR_ACTIVE_TEMPLATES', JSON.stringify(next));
      return next;
    });
    showSuccess('Template Unlinked', 'The specification template is no longer active in PDR Catalog.');
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
    }
  };

  // Active templates are those that have blueprints OR are explicitly linked by the user
  const activeTemplateIds = useMemo(() => {
    const withBlueprints = blueprints.map(b => b.templateId);
    return Array.from(new Set([...withBlueprints, ...linkedTemplateIds]));
  }, [blueprints, linkedTemplateIds]);

  // Filter templates to show only active ones in PDR Catalog
  const activeTemplates = useMemo(() => {
    return dbTemplates.filter(t => activeTemplateIds.includes(t.id));
  }, [dbTemplates, activeTemplateIds]);

  // Active families are those that have at least one active template in PDR Catalog
  const activeFamilyIds = useMemo(() => {
    return Array.from(new Set(activeTemplates.map(t => t.familyId)));
  }, [activeTemplates]);

  const activeFamilies = useMemo(() => {
    return dbFamilies.filter(f => activeFamilyIds.includes(f.id));
  }, [dbFamilies, activeFamilyIds]);

  // Map active collections for tree component usage
  const families = useMemo(() => {
    return activeFamilies.map(f => ({
      id: f.id,
      code: f.id.startsWith('fam-') ? f.id.replace('fam-', '') : f.name.substring(0, 3).toUpperCase(),
      name: f.name,
      description: f.description
    }));
  }, [activeFamilies]);

  const templates = useMemo(() => {
    return activeTemplates.map(t => ({
      id: t.id,
      familyId: t.familyId,
      code: t.skuBase,
      skuBase: t.skuBase,
      name: t.name
    }));
  }, [activeTemplates]);

  // Set initial family selection if not set
  React.useEffect(() => {
    if (families.length > 0 && !selectedFamilyId) {
      setSelectedFamilyId(families[0].id);
    }
  }, [families, selectedFamilyId]);

  // Filtered lists for the main explorer view
  const displayFamilies = useMemo(() => {
    if (!searchTerm) return families;
    const term = searchTerm.toLowerCase();
    return families.filter(f => f.name.toLowerCase().includes(term) || f.code.toLowerCase().includes(term));
  }, [families, searchTerm]);

  const displayTemplates = useMemo(() => {
    if (!selectedFamilyId) return [];
    return templates.filter(t => t.familyId === selectedFamilyId);
  }, [templates, selectedFamilyId]);

  const displayBlueprints = useMemo(() => {
    let bps = blueprints;
    if (selectedTemplateId) {
      bps = bps.filter(b => b.templateId === selectedTemplateId);
    } else if (selectedFamilyId) {
      const familyTemplateIds = templates.filter(t => t.familyId === selectedFamilyId).map(t => t.id);
      bps = bps.filter(b => familyTemplateIds.includes(b.templateId));
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      bps = bps.filter(b => 
        b.reference.toLowerCase().includes(term) || 
        (b.model && b.model.toLowerCase().includes(term)) ||
        b.id.toLowerCase().includes(term)
      );
    }
    
    return bps;
  }, [blueprints, selectedTemplateId, selectedFamilyId, templates, searchTerm]);

  const blueprintColumns = useMemo<CrystalTableColumn<any>[]>(() => [
    {
      key: 'id',
      header: 'رمز البصمة الموحد',
      className: 'font-mono text-cyan-400 font-bold text-xs',
      render: (bp) => bp.id
    },
    {
      key: 'reference',
      header: 'الرقم المرجعي',
      className: 'text-white font-extrabold text-sm',
      render: (bp) => bp.reference
    },
    {
      key: 'model',
      header: 'الموديل التجاري',
      className: 'text-slate-300 font-medium text-xs',
      render: (bp) => bp.model || '-'
    },
    {
      key: 'unit',
      header: 'الوحدة',
      className: 'text-slate-300 font-medium text-xs',
      render: (bp) => bp.unit
    },
    {
      key: 'powerOrForce',
      header: 'القدرة/القياس',
      className: 'text-slate-300 font-medium text-xs',
      render: (bp) => bp.powerOrForce || '-'
    },
    {
      key: 'technicalSpecs',
      header: 'المواصفات الفنية',
      className: 'text-slate-400 font-medium text-xs max-w-[200px] truncate',
      render: (bp) => (
        <span title={bp.technicalSpecs}>
          {bp.technicalSpecs || '-'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'الحالة بالمصنع',
      className: 'text-xs',
      render: (bp) => {
        const inStock = inventory.some(i => i.blueprintId === bp.id);
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${inStock ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
            {inStock ? 'نشط' : 'مجمد'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'إجراءات التنشيط',
      className: 'text-center',
      render: (bp) => {
        const inStock = inventory.some(i => i.blueprintId === bp.id);
        if (inStock) {
          return (
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" /> جاهز
            </span>
          );
        }
        return (
          <button 
            type="button"
            onClick={() => setActivatingBlueprintId(bp.id)}
            className="px-3 py-1.5 bg-white text-slate-950 hover:bg-slate-200 font-bold text-[11px] rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            تفعيل للمخزن
          </button>
        );
      }
    }
  ], [inventory]);

  if (isLoading) {
    return <PdrPageSkeleton />;
  }

  const handleActivateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activatingBlueprintId) return;
    
    const blueprint = blueprints.find(b => b.id === activatingBlueprintId);
    if (!blueprint) return;

    try {
      await addStock({
        blueprintId: blueprint.id,
        quantityCurrent: initialQuantity,
        locationDetails: storageLocation || 'غير محدد',
        warehouseId: 'WH-MAIN'
      });
      
      showSuccess('تم التفعيل', `القطعة ${blueprint.id} أصبحت متوفرة الآن في المخزون الفعلي.`);
      setActivatingBlueprintId(null);
      setInitialQuantity(0);
      setStorageLocation('');
      setMinThreshold(2);
    } catch(err: any) {
      showError('خطأ في التفعيل', err.message);
    }
  };

  const getFamilyIcon = (code: string) => {
    if (code.startsWith('DIS') || code.startsWith('CON') || code.startsWith('REL')) return <Zap className="w-5 h-5" />;
    if (code.startsWith('SEN') || code.startsWith('AUT')) return <Cpu className="w-5 h-5" />;
    if (code.startsWith('PNU')) return <Droplets className="w-5 h-5" />;
    if (code.startsWith('VAR') || code.startsWith('MOT')) return <Activity className="w-5 h-5" />;
    if (code.startsWith('DIV')) return <Package className="w-5 h-5" />;
    return <Settings2 className="w-5 h-5" />;
  };

  const getFamilyColor = (code: string) => {
    if (code.startsWith('DIS') || code.startsWith('CON') || code.startsWith('REL')) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    if (code.startsWith('SEN') || code.startsWith('AUT')) return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
    if (code.startsWith('PNU')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (code.startsWith('VAR') || code.startsWith('MOT')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (code.startsWith('DIV')) return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden dir-ltr" dir="ltr">
      
      {/* Header */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('pdr.catalog.title')}
          subtitle={t('pdr.catalog.subtitle')}
          icon={<FolderTree className="w-7 h-7 text-cyan-400" />}
          badgeText={t('pdr.catalog.badge')}
          badgeColor="cyan"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('pdr.catalog.blueprints')}
              subtitle="BLUEPRINTS"
              value={blueprints.length}
              valueUnit={t('pdr.catalog.blueprintUnit')}
              icon={<Tag className="w-3.5 h-3.5" />}
              color="cyan"
            />
            <HeaderBentoCard
              title={t('pdr.catalog.templates')}
              subtitle="TEMPLATES"
              value={templates.length}
              valueUnit={t('pdr.catalog.templateUnit')}
              icon={<Layers className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('pdr.catalog.families')}
              subtitle="FAMILIES"
              value={families.length}
              valueUnit={t('pdr.catalog.familyUnit')}
              icon={<FolderTree className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('pdr.catalog.systemStatus')}
              subtitle="SYSTEM STATUS"
              value="100%"
              valueUnit="OK"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="emerald"
            />
          </div>
        </PageHeader>
      </div>

      {/* Explorer Split View */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 overflow-hidden px-6 md:px-8 pb-6">
        
        {/* Navigation Panel (Left Sidebar Container) */}
        <div className="w-full md:w-80 shrink-0 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(6,182,212,0.12)] bg-gradient-to-b from-cyan-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98 backdrop-blur-xl relative flex flex-col">
          
          {/* Background ambient engine accent glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Sidebar Content */}
          <div className="p-5 relative z-10 flex flex-col h-full space-y-4">
            {/* Title & Controls */}
            <div className="flex flex-col shrink-0">
              <span className="text-white font-black uppercase tracking-wider block">
                {t('pdr.catalog.hierarchyTree', 'كتالوج شجرة قطع الغيار')}
              </span>
              <span className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">
                {t('pdr.catalog.hierarchySubtitle', 'تنظيم وتصنيف القطع')}
              </span>
            </div>

            {/* Prominent Wide Action Button - High Contrast White */}
            <button 
              onClick={() => {
                setWizardPrefill(false);
                setIsWizardOpen(true);
              }}
              className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{t('pdr.catalog.registerPart', 'تسجيل قطعة غيار جديدة')}</span>
            </button>

            {/* Sidebar Search Bar - Crystal White */}
            <div className="relative w-full shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder={t('pdr.catalog.searchPlaceholder', 'Search by part code, model, or ID...')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-left font-bold shadow-sm"
              />
            </div>

            {/* Tree Navigation Area (Bento Mini-Cards) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 text-left pt-1 -mx-2 px-2 pb-4">
              {families.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-medium">
                  {t('pdr.catalog.noActiveFamilies', 'No active families in catalog yet.')}
                </div>
              ) : (
                <div className="space-y-1.5">
                {displayFamilies.map(family => {
                  const familyTemplates = templates.filter(t => t.familyId === family.id);
                  const isSelected = selectedFamilyId === family.id;
                  
                  return (
                    <div key={family.id} className="flex flex-col">
                      <button
                        onClick={() => {
                          setSelectedFamilyId(family.id);
                          setSelectedTemplateId(null);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left cursor-pointer transform active:scale-95",
                          isSelected 
                            ? "bg-cyan-500/20 border-cyan-500/50 text-white font-black shadow-[0_4px_20px_rgba(6,182,212,0.25)] scale-[1.02] -translate-y-0.5" 
                            : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                        )}
                      >
                        <div className={cn("shrink-0", isSelected ? "text-cyan-300" : getFamilyColor(family.code).split(' ')[0])}>
                          {getFamilyIcon(family.code)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("truncate text-xs", isSelected ? "text-white font-black" : "font-bold text-slate-200")}>
                            {family.name}
                          </div>
                          <div className={cn("text-[10px] font-mono", isSelected ? "text-cyan-200" : "text-slate-400")}>{family.code}</div>
                        </div>
                        <ChevronRight className={cn("w-4 h-4 transition-transform", isSelected ? "text-white rotate-90" : "text-slate-500")} />
                      </button>
                      
                      {isSelected && (
                        <div className="pl-6 pr-2 py-2 space-y-1 border-l-2 border-white/20 ml-4 mt-1 mb-2">
                          <button
                            onClick={() => setSelectedTemplateId(null)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer transform active:scale-95 duration-200",
                              selectedTemplateId === null 
                                ? "bg-cyan-500/20 text-white font-black border border-cyan-500/50 shadow-md scale-[1.02] -translate-y-0.5" 
                                : "bg-[#0a0a0f] border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] hover:border-white/10"
                            )}
                          >
                            {t('pdr.catalog.allFamilyTemplates', 'All templates for')} {family.name}
                          </button>
                          {familyTemplates.map(temp => (
                            <div
                              key={temp.id}
                              onClick={() => setSelectedTemplateId(temp.id)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 flex justify-between items-center cursor-pointer group/item transform active:scale-95",
                                selectedTemplateId === temp.id 
                                  ? "bg-cyan-500/20 text-white font-black border border-cyan-500/50 shadow-md scale-[1.02] -translate-y-0.5" 
                                  : "bg-[#0a0a0f] border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] hover:border-white/10"
                              )}
                            >
                              <span className="truncate pr-2">{temp.name}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={cn("text-[9px] font-mono opacity-60 group-hover/item:opacity-100", selectedTemplateId === temp.id ? "text-cyan-200" : "")}>{temp.code}</span>
                                <button 
                                  onClick={(e) => handleUnlinkTemplate(temp.id, e)}
                                  title={t('pdr.catalog.unlinkTemplate', 'Unlink template from catalog')}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-rose-500/20 text-rose-400 rounded transition-all"
                                >
                                  <Unlink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Right Workspace Pane (RTL): Black Crystal Glass Shell Container matching EngineeringLabView */}
        <div className="flex-1 bg-[#0a0b10]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
          <AnimatePresence mode="wait">
            {selectedTemplateId ? (
              // Mode A: Template Selected Detail View
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
                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-6 mb-6 gap-4 text-start">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
                          <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-start">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 uppercase">
                              {tpl.skuBase || 'TEMPLATE'}
                            </span>
                            <h3 className="text-lg font-bold text-white tracking-tight">{tpl.name}</h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                            {parentFamily?.name || 'عائلة قطعة الغيار'} / {tpl.skuBase} (قالب المواصفات المعيارية)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
                        <button 
                          type="button"
                          onClick={() => {
                            setWizardPrefill(false);
                            setIsWizardOpen(true);
                          }}
                          className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                        >
                          <Plus className="w-4 h-4 text-slate-400" /> 
                          <span>معالج تسجيل قطعة</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            setWizardPrefill(true);
                            setIsWizardOpen(true);
                          }}
                          className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-slate-950" /> 
                          <span>إضافة بصمة جديدة</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col min-h-0 text-start">
                      <div className="flex items-center justify-between mb-4 flex-row">
                        <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          <span>البصمات والموديلات المسجلة تحت هذا القالب</span>
                          <span className="text-xs font-mono bg-white/10 text-white border border-white/15 px-2.5 py-0.5 rounded-full font-bold">
                            {tplBlueprints.length}
                          </span>
                        </div>

                        {/* View Switcher */}
                        <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={cn(
                              "p-1.5 rounded-lg transition-all cursor-pointer",
                              viewMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                            )}
                            title="عرض الجدول الكريستالي"
                          >
                            <Table className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('cards')}
                            className={cn(
                              "p-1.5 rounded-lg transition-all cursor-pointer",
                              viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                            )}
                            title="عرض البطاقات"
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {tplBlueprints.length === 0 ? (
                        <div className="w-full">
                          <EmptyState 
                            icon={Database}
                            title={t('pdr.catalog.noPhysicalBlueprints', 'لا توجد بصمات مادية')}
                            description={t('pdr.catalog.noPhysicalBlueprintsDesc', 'لا توجد بصمات مادية مسجلة تحت هذا القالب بعد.')}
                            color="cyan"
                            className="border border-dashed border-white/10 rounded-3xl bg-white/[0.01]"
                            action={
                              <button 
                                type="button"
                                onClick={() => {
                                  setWizardPrefill(true);
                                  setIsWizardOpen(true);
                                }}
                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl px-4 py-2 transition-all inline-flex items-center gap-2 cursor-pointer"
                              >
                                <Plus className="w-4 h-4 text-white" />
                                <span>{t('pdr.catalog.addFirstBlueprint', 'أضف البصمة الأولى')}</span>
                              </button>
                            }
                          />
                        </div>
                      ) : viewMode === 'table' ? (
                        <div className="mb-6">
                          <CrystalTable
                            data={tplBlueprints}
                            columns={blueprintColumns}
                            rowKey={(bp) => bp.id}
                            emptyMessage={
                              <EmptyState 
                                icon={LayoutGrid}
                                title={t('pdr.catalog.noBlueprints', 'لا توجد بصمات تطابق خيارات البحث.')}
                                color="cyan"
                                className="py-16 opacity-80"
                              />
                            }
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                          {tplBlueprints.map(bp => {
                            const inStock = inventory.some(i => i.blueprintId === bp.id);
                            return (
                              <div 
                                key={bp.id}
                                className={cn(
                                  "p-5 relative overflow-hidden group border rounded-2xl transition-all duration-300",
                                  inStock 
                                    ? "border-emerald-500/20 bg-emerald-500/[0.01] hover:border-emerald-500/30" 
                                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                )}
                              >
                                {inStock ? (
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                                ) : (
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 pointer-events-none transition-all duration-300" />
                                )}
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                  <div className="min-w-0 pr-2 text-right">
                                    <div className="text-lg font-bold text-white tracking-tight truncate group-hover:text-white transition-colors" title={bp.reference}>{bp.reference}</div>
                                    <div className="text-xs font-mono text-slate-400 truncate">{bp.model || 'بدون موديل'}</div>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest shrink-0 ${inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>
                                    {inStock ? 'نشط' : 'مجمد'}
                                  </span>
                                </div>

                                <div className="space-y-2 mb-6 text-right relative z-10">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">الوحدة</span>
                                    <span className="text-slate-300 font-medium">{bp.unit}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">القدرة/القياس</span>
                                    <span className="text-slate-300 font-medium truncate max-w-[120px]">{bp.powerOrForce || '-'}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">المواصفات</span>
                                    <span className="text-slate-300 font-medium truncate max-w-[120px]" title={bp.technicalSpecs}>{bp.technicalSpecs || '-'}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">الرمز</span>
                                    <span className="text-white font-mono text-[10px] font-bold">{bp.id}</span>
                                  </div>
                                </div>

                                {!inStock && (
                                  <button 
                                    type="button"
                                    onClick={() => setActivatingBlueprintId(bp.id)}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/30 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer relative z-20"
                                  >
                                    تفعيل إلى المخزون
                                  </button>
                                )}
                                {inStock && (
                                  <div className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 relative z-20">
                                    <CheckCircle2 className="w-4 h-4" /> متوفر في المصنع
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()
            ) : selectedFamilyId ? (
              // Mode B: Family Selected Detail View
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
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
                          <FolderTree className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-start">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-white/10 text-white px-2 py-0.5 rounded border border-white/15">
                              {fam.code}
                            </span>
                            <h3 className="text-lg font-bold text-white tracking-tight">{fam.name}</h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                            {fam.description || 'عائلة قطع غيار معتمدة في الكتالوج المرجعي'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
                        <button 
                          type="button"
                          onClick={() => setSelectedFamilyId(null)}
                          className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                        >
                          <X className="w-4 h-4 text-slate-400" /> 
                          <span>إلغاء التحديد</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            setWizardPrefill(false);
                            setIsWizardOpen(true);
                          }}
                          className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-slate-950" /> 
                          <span>إضافة قالب جديد</span>
                        </button>
                      </div>
                    </div>

                    {/* Templates List inside Family */}
                    <div className="flex-1 flex flex-col min-h-0 text-start">
                      <div className="flex items-center justify-between mb-4 flex-row">
                        <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          <span>قوالب المواصفات المسجلة تحت هذه العائلة</span>
                          <span className="text-xs font-mono bg-white/10 text-white border border-white/15 px-2.5 py-0.5 rounded-full font-bold">
                            {famTemplates.length}
                          </span>
                        </div>

                        {/* View Switcher */}
                        <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={cn(
                              "p-1.5 rounded-lg transition-all cursor-pointer",
                              viewMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                            )}
                            title="عرض الجدول الكريستالي"
                          >
                            <Table className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('cards')}
                            className={cn(
                              "p-1.5 rounded-lg transition-all cursor-pointer",
                              viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                            )}
                            title="عرض البطاقات"
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {famTemplates.length === 0 ? (
                          <div className="w-full">
                            <EmptyState 
                              icon={Layers}
                              title={t('pdr.catalog.noTemplates', 'لا توجد قوالب مواصفات')}
                              description={t('pdr.catalog.noTemplatesDesc', 'لا توجد قوالب مواصفات مسجلة تحت هذه العائلة بعد.')}
                              color="blue"
                              className="border border-dashed border-white/10 rounded-2xl bg-white/[0.01]"
                              action={
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setWizardPrefill(false);
                                    setIsWizardOpen(true);
                                  }}
                                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl px-4 py-2 transition-all inline-flex items-center gap-2 cursor-pointer"
                                >
                                  <Plus className="w-4 h-4 text-white" />
                                  <span>{t('pdr.catalog.addFirstTemplate', 'أضف القالب الأول')}</span>
                                </button>
                              }
                            />
                          </div>
                        ) : viewMode === 'cards' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {famTemplates.map(tpl => {
                              const count = blueprints.filter(b => b.templateId === tpl.id).length;
                              return (
                                <div 
                                  key={tpl.id}
                                  onClick={() => setSelectedTemplateId(tpl.id)}
                                  className="bg-[#08080c]/80 border border-white/10 hover:border-white/20 rounded-2xl p-5 hover:bg-white/[0.03] transition-all cursor-pointer relative overflow-hidden group text-start flex flex-col justify-between shadow-lg"
                                >
                                  <div>
                                    <div className="flex items-start justify-between mb-4 flex-row">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                                          <Layers className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                          {tpl.skuBase}
                                        </span>
                                      </div>
                                    </div>

                                    <h4 className="text-sm font-bold text-white mb-3 group-hover:text-white transition-colors">{tpl.name}</h4>

                                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                                      <div>
                                        <span className="text-[9px] text-slate-400 block">البصمات المسجلة</span>
                                        <span className="text-xs font-mono font-bold text-white">{count} بصمة</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-slate-400 block">السعة الرياضية</span>
                                        <span className="text-xs font-mono font-bold text-slate-400">999 مقعد</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t border-white/5 pt-3 mt-3 flex justify-between items-center text-[10px] text-slate-500">
                                    <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">قالب معرفي معتمد</span>
                                    <span className="group-hover:text-white transition-colors">اضغط للتفاصيل ←</span>
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
                                  <th className="p-4 text-start">قالب المواصفات</th>
                                  <th className="p-4 text-start">الرمز المعياري SKU</th>
                                  <th className="p-4 text-start">عدد البصمات</th>
                                  <th className="p-4 text-end">إجراءات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                {famTemplates.map(tpl => {
                                  const count = blueprints.filter(b => b.templateId === tpl.id).length;
                                  return (
                                    <tr 
                                      key={tpl.id}
                                      onClick={() => setSelectedTemplateId(tpl.id)}
                                      className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                                    >
                                      <td className="p-4 font-bold text-white text-start">{tpl.name}</td>
                                      <td className="p-4 font-mono font-bold text-white uppercase text-start">{tpl.skuBase}</td>
                                      <td className="p-4 font-mono text-start">{count} بصمة</td>
                                      <td className="p-4 text-end" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={() => setSelectedTemplateId(tpl.id)}
                                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        >
                                          عرض التفاصيل
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
                    </div>
                  </motion.div>
                );
              })()
            ) : (
              // Mode C: Default Welcome / Empty Selection Screen twin of EngineeringLabView
              <motion.div
                key="default-welcome"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-8 md:p-12 flex flex-col items-center justify-center text-center h-full flex-1"
              >
                <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-inner">
                  <Database className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-extrabold text-white uppercase tracking-wider mb-2">
                  كتالوج قطع الغيار والبصمات المعيارية (PDR Engine)
                </h3>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  مرحباً بك في لوحة تحكم كتالوج قطع الغيار. اختر عائلة صناعية أو قالباً معرفياً من القائمة الجانبية لتصفح البصمات والموديلات المعيارية وتفعيلها في المخزن المادي.
                </p>

                <div className="flex gap-3 mt-6 flex-row-reverse">
                  <button
                    onClick={() => {
                      setWizardPrefill(false);
                      setIsWizardOpen(true);
                    }}
                    className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> تسجيل قطعة جديدة عبر المعالج
                  </button>
                  <button
                    onClick={() => {
                      if (families.length > 0) {
                        setSelectedFamilyId(families[0].id);
                      }
                    }}
                    className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-400" /> تصفح أول عائلة في الكتالوج
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mt-8 text-start">
                  <div className="p-5 rounded-2xl bg-[#08080c]/80 border border-white/10 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 justify-start">
                      <Layers className="w-4 h-4 text-white" />
                      <span className="text-xs font-extrabold text-white">قانون الـ 999 مقعداً المعرفية</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      يولد النظام تلقائياً 999 مقعداً شاغراً رياضياً تحت كل قالب PDR (مثل ROB-001 إلى ROB-999)، مما يضمن الترقيم المتسلسل دون تكرار وبدون استهلاك حجم قاعدة البيانات.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#08080c]/80 border border-white/10 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 justify-start">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-extrabold text-white">الفصل المعرفي والربط بالمخزون المادي</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      البصمة (Blueprint) هي مواصفة هندسية تجارية في الكتالوج. تتحول إلى مثيل مادي في المخزن (Stock) عند تفعيلها وتحديد الكمية الابتدائية والرف والحد الأدنى للطلب.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Activation Modal */}
      <AnimatePresence>
        {activatingBlueprintId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-sm"
            onClick={() => setActivatingBlueprintId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0f111a] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-8 text-right">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1 font-sans">
                      {blueprints.find(b => b.id === activatingBlueprintId)?.reference}
                    </h2>
                    <p className="text-xs text-emerald-400 font-mono font-bold tracking-widest uppercase">تفعيل وتنشيط كمخزون</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shrink-0">
                    <BatteryCharging className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <form onSubmit={handleActivateInstance} className="space-y-6 text-right">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mr-1 block">
                        الكمية الابتدائية
                      </label>
                      <input 
                        type="number"
                        min="0"
                        required
                        value={initialQuantity}
                        onChange={e => setInitialQuantity(Number(e.target.value))}
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-mono text-lg text-right"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mr-1 block">
                        الحد الأدنى
                      </label>
                      <input 
                        type="number"
                        min="0"
                        required
                        value={minThreshold}
                        onChange={e => setMinThreshold(Number(e.target.value))}
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-mono text-lg text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mr-1 block">
                      موقع التخزين (الرف / الممر)
                    </label>
                    <input 
                      type="text"
                      required
                      value={storageLocation}
                      onChange={e => setStorageLocation(e.target.value)}
                      placeholder="مثال: الممر 3 - الرف D2"
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-right"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setActivatingBlueprintId(null)}
                      className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                    >
                       تفعيل في المخزون
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
