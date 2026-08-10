import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import * as Tabs from '@radix-ui/react-tabs';
import { 
  FolderTree, 
  Component, 
  Search, 
  Plus, 
  Trash2, 
  Layers, 
  Cpu, 
  Wrench, 
  Droplets, 
  Wind, 
  Settings, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Copy, 
  Tag, 
  ListFilter, 
  Grid, 
  Info,
  Package,
  BookOpen,
  Zap
} from 'lucide-react';
import { useMasterCatalogEngine } from '../hooks/useMasterCatalogEngine';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { GlassCard } from '@/shared/components/GlassCard';
import { cn } from '@/shared/utils';
import { generatePdrSlotId } from '@/core/config/pdrMatrix';
import { db } from '@/core/db';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

type FamilyGroup = 'mecanique' | 'hydraulique' | 'electrique' | 'electronique' | 'pneumatique' | 'autre';

interface GroupMeta {
  id: FamilyGroup;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  colorClass: string;
  borderClass: string;
  textClass: string;
  fillClass: string;
  icon: React.ComponentType<any>;
}

const GROUP_CONFIG: Record<FamilyGroup, GroupMeta> = {
  mecanique: {
    id: 'mecanique',
    nameEn: 'Mechanical',
    nameFr: 'MÉCANIQUE',
    nameAr: 'ميكانيك',
    colorClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20 hover:border-amber-500/40',
    textClass: 'text-amber-400',
    fillClass: 'bg-amber-500',
    icon: Wrench
  },
  hydraulique: {
    id: 'hydraulique',
    nameEn: 'Hydraulic',
    nameFr: 'HYDRAULIQUE',
    nameAr: 'هيدروليك',
    colorClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20 hover:border-blue-500/40',
    textClass: 'text-blue-400',
    fillClass: 'bg-blue-500',
    icon: Droplets
  },
  electrique: {
    id: 'electrique',
    nameEn: 'Electrical',
    nameFr: 'ÉLECTRIQUE',
    nameAr: 'كهرباء',
    colorClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/20 hover:border-yellow-500/40',
    textClass: 'text-yellow-400',
    fillClass: 'bg-yellow-500',
    icon: Zap
  },
  electronique: {
    id: 'electronique',
    nameEn: 'Electronic',
    nameFr: 'ÉLECTRONIQUE',
    nameAr: 'إلكترونيات',
    colorClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20 hover:border-emerald-500/40',
    textClass: 'text-emerald-400',
    fillClass: 'bg-emerald-500',
    icon: Cpu
  },
  pneumatique: {
    id: 'pneumatique',
    nameEn: 'Pneumatic',
    nameFr: 'PNEUMATIQUE',
    nameAr: 'بنوماتيك',
    colorClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20 hover:border-cyan-500/40',
    textClass: 'text-cyan-400',
    fillClass: 'bg-cyan-500',
    icon: Wind
  },
  autre: {
    id: 'autre',
    nameEn: 'Other',
    nameFr: 'AUTRES & DIVERS',
    nameAr: 'متنوع وعام',
    colorClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/20 hover:border-slate-500/40',
    textClass: 'text-slate-400',
    fillClass: 'bg-slate-500',
    icon: Settings
  }
};

export function PartsCatalogLabView({ user, tabId }: { user?: any, tabId?: string }) {
  const { t } = useTranslation();
  const { families, templates, blueprints, isLoading, createFamily, createTemplate } = useMasterCatalogEngine();
  const { showSuccess, showError } = useNotifications();

  const [activeTab, setActiveTab] = useState('families');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<FamilyGroup | 'all'>('all');
  const [selectedFamilyFilterId, setSelectedFamilyFilterId] = useState<string | null>(null);
  
  // Creation Form Triggers
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

  // New Family Form Fields
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyDesc, setNewFamilyDesc] = useState('');
  const [newFamilyGroup, setNewFamilyGroup] = useState<FamilyGroup>('mecanique');

  // New Template Form Fields
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateSku, setNewTemplateSku] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  // UI state for Template slots inspection
  const [selectedTemplateForSlots, setSelectedTemplateForSlots] = useState<string | null>(null);

  // Grouped count calculations
  const groupStats = useMemo(() => {
    const stats: Record<FamilyGroup | 'all', number> = {
      all: families.length,
      mecanique: 0,
      hydraulique: 0,
      electrique: 0,
      electronique: 0,
      pneumatique: 0,
      autre: 0
    };
    families.forEach(f => {
      // Check if seeded family has a predefined group or fall back
      const g = (f.group || 'mecanique') as FamilyGroup;
      if (stats[g] !== undefined) {
        stats[g]++;
      } else {
        stats.autre++;
      }
    });
    return stats;
  }, [families]);

  // Filter calculations for Families
  const filteredFamilies = useMemo(() => {
    return families.filter(f => {
      const g = (f.group || 'mecanique') as FamilyGroup;
      const groupMatch = selectedGroupFilter === 'all' || g === selectedGroupFilter;
      const searchMatch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (f.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.id.toLowerCase().includes(searchTerm.toLowerCase());
      return groupMatch && searchMatch;
    });
  }, [families, selectedGroupFilter, searchTerm]);

  // Filter calculations for Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const parentFam = families.find(f => f.id === t.familyId);
      const parentFamGroup = parentFam ? ((parentFam.group || 'mecanique') as FamilyGroup) : 'mecanique';
      const groupMatch = selectedGroupFilter === 'all' || parentFamGroup === selectedGroupFilter;
      const familyMatch = !selectedFamilyFilterId || t.familyId === selectedFamilyFilterId;
      const searchMatch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.skuBase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (parentFam?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return groupMatch && familyMatch && searchMatch;
    });
  }, [templates, families, selectedGroupFilter, selectedFamilyFilterId, searchTerm]);

  // Template count per family
  const templateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    templates.forEach(t => {
      counts.set(t.familyId, (counts.get(t.familyId) || 0) + 1);
    });
    return counts;
  }, [templates]);

  // Blueprints count per template for reference details
  const blueprintCounts = useMemo(() => {
    const counts = new Map<string, number>();
    blueprints.forEach(b => {
      counts.set(b.templateId, (counts.get(b.templateId) || 0) + 1);
    });
    return counts;
  }, [blueprints]);

  // Creation of Family Classification Group
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName) return;
    try {
      const code = newFamilyName.substring(0, 3).toUpperCase();
      const uuid = `fam-${code}-${crypto.randomUUID().substring(0, 4)}`;
      
      await db.transaction('rw', [db.pdrFamilies, db.auditLogs], async () => {
        await db.pdrFamilies.add({
          id: uuid,
          name: newFamilyName.toUpperCase(),
          description: newFamilyDesc || `${newFamilyName} classification family`,
          group: newFamilyGroup,
          createdAt: new Date().toISOString()
        });
      });

      setNewFamilyName('');
      setNewFamilyDesc('');
      setIsAddingFamily(false);
      showSuccess('Classification Activated', `Family ${newFamilyName.toUpperCase()} added under ${GROUP_CONFIG[newFamilyGroup].nameFr}.`);
    } catch (err: any) {
      showError('System Error', err.message);
    }
  };

  // Creation of Abstract Template specification
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName || !newTemplateSku || !selectedFamilyId) return;
    try {
      const sanitizedSku = newTemplateSku.replace(/\s+/g, '-').toUpperCase();
      const uuid = `temp-${sanitizedSku}`;

      await db.transaction('rw', [db.pdrTemplates, db.auditLogs], async () => {
        await db.pdrTemplates.add({
          id: uuid,
          familyId: selectedFamilyId,
          name: newTemplateName,
          skuBase: sanitizedSku,
          description: newTemplateDesc || `${newTemplateName} technical specification blueprint template`,
          createdAt: new Date().toISOString()
        });
      });

      setNewTemplateName('');
      setNewTemplateSku('');
      setNewTemplateDesc('');
      setIsAddingTemplate(false);
      showSuccess('Specification Template online', `Template ${newTemplateName} created successfully.`);
    } catch (err: any) {
      showError('System Error', err.message);
    }
  };

  // Safe item deletion
  const handleDeleteItem = async (type: 'family' | 'template', id: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to permanently delete this ${type}? Deleting classifications may impact mapped equipment and technical processes.`);
    if (!isConfirmed) return;

    try {
      if (type === 'family') {
        // Prevent deletion if families have templates mapped
        const hasTemplates = templates.some(t => t.familyId === id);
        if (hasTemplates) {
          toast.error("Impossible to delete: This family has active specifications/templates mapped to it.");
          return;
        }
        await db.pdrFamilies.delete(id);
      } else if (type === 'template') {
        const hasBps = blueprints.some(b => b.templateId === id);
        if (hasBps) {
          toast.error("Impossible to delete: This template has active commercial blueprints in physical stock.");
          return;
        }
        await db.pdrTemplates.delete(id);
      }
      showSuccess('Purged Successfully', `The requested ${type} has been deleted.`);
    } catch (err: any) {
      showError('Deletion Failed', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-slate-400 flex flex-col items-center justify-center h-full min-h-[400px]">
        <Cpu className="w-12 h-12 text-amber-500 animate-pulse mb-4" />
        <p className="font-mono text-sm uppercase tracking-widest text-slate-500">جاري استعلام مصفوفة الكتالوج الرئيسي...</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col gap-6 relative z-10 px-4 lg:px-8"
    >
      {/* HEADER SECTION WITH EMBEDDED BENTO CLASSIFICATION CARDS */}
      <PageHeader
        title={t('partsCatalogLab.title', 'مختبر عائلات وقوالب قطع الغيار')}
        subtitle={t('partsCatalogLab.subtitle', 'المساحة المركزية لتصميم عائلات التصنيف والقوالب القياسية لقطع الغيار والمكونات تحت قاعدة الـ 999 مقعداً.')}
        icon={<FolderTree className="w-7 h-7 text-amber-400" />}
        badgeText={t('partsCatalogLab.badgeText', 'مختبر الكتالوج')}
        badgeColor="amber"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(GROUP_CONFIG) as FamilyGroup[]).map((grpKey) => {
            const cfg = GROUP_CONFIG[grpKey];
            const Icon = cfg.icon;
            const count = groupStats[grpKey];
            const isFilterActive = selectedGroupFilter === grpKey;
            const bentoColorMap: Record<FamilyGroup, 'amber' | 'blue' | 'yellow' | 'emerald' | 'cyan' | 'slate'> = {
              mecanique: 'amber',
              hydraulique: 'blue',
              electrique: 'yellow',
              electronique: 'emerald',
              pneumatique: 'cyan',
              autre: 'slate',
            };

            return (
              <HeaderBentoCard
                key={grpKey}
                title={cfg.nameAr}
                subtitle={cfg.nameFr}
                value={count}
                valueUnit="عائلة"
                icon={<Icon className="w-3.5 h-3.5" />}
                color={bentoColorMap[grpKey]}
                isActive={isFilterActive}
                onClick={() => setSelectedGroupFilter(isFilterActive ? 'all' : grpKey)}
              />
            );
          })}
        </div>
      </PageHeader>

      {/* WORKSPACE AREA */}
      <motion.div variants={itemVariants} className="flex-1 flex flex-col min-h-0 min-w-0">
        <Tabs.Root 
          value={activeTab} 
          onValueChange={(val) => { 
            setActiveTab(val); 
            setSearchTerm(''); 
            if (val === 'families') {
              setSelectedFamilyFilterId(null);
            }
          }} 
          className="flex-1 flex flex-col min-h-0 bg-transparent"
        >
          
          {/* Action and Filter Controller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 shrink-0 relative z-10">
            <Tabs.List className="flex bg-[#121318] p-1.5 rounded-2xl border border-white/10 gap-1">
              <Tabs.Trigger 
                value="families" 
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                  activeTab === 'families' ? "bg-white text-slate-950 font-extrabold shadow-md" : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                )}
              >
                <FolderTree className="w-3.5 h-3.5" /> {t('partsCatalogLab.familiesTab', 'عائلات التصنيف')} ({families.length})
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="templates" 
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                  activeTab === 'templates' ? "bg-white text-slate-950 font-extrabold shadow-md" : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                )}
              >
                <Component className="w-3.5 h-3.5" /> {t('partsCatalogLab.templatesTab', 'قوالب المواصفات')} ({templates.length})
              </Tabs.Trigger>
            </Tabs.List>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Group selection reset if group is filtered */}
              {selectedGroupFilter !== 'all' && (
                <button 
                  onClick={() => setSelectedGroupFilter('all')}
                  className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-1"
                >
                  {t('partsCatalogLab.group', 'المجموعة')}: <span className="font-bold uppercase font-mono">{selectedGroupFilter}</span>
                </button>
              )}

              {/* Family specific filter badge */}
              {selectedFamilyFilterId && (
                <button 
                  onClick={() => setSelectedFamilyFilterId(null)}
                  className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  {t('partsCatalogLab.family', 'العائلة')}: <span className="font-bold uppercase font-mono text-white">{families.find(f => f.id === selectedFamilyFilterId)?.name}</span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 w-4 h-4 rounded-full flex items-center justify-center hover:bg-emerald-500/40">×</span>
                </button>
              )}

              <div className="relative group flex-1 sm:flex-none">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder={activeTab === 'families' ? t('partsCatalogLab.searchFamilies', 'البحث في عائلات التصنيف...') : t('partsCatalogLab.searchTemplates', 'البحث في قوالب المواصفات...')} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="titan-input py-2.5 pl-11 pr-3 rtl:pr-11 rtl:pl-3 w-full sm:w-64 shadow-none text-slate-100"
                />
              </div>

              {activeTab === 'families' && (
                <button 
                  onClick={() => setIsAddingFamily(true)}
                  className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-slate-950" /> {t('partsCatalogLab.addFamily', 'إضافة عائلة جديدة')}
                </button>
              )}
              {activeTab === 'templates' && (
                <button 
                  onClick={() => setIsAddingTemplate(true)}
                  className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-slate-950" /> {t('partsCatalogLab.addTemplate', 'إضافة قالب مواصفات')}
                </button>
              )}
            </div>
          </div>

          {/* TAB CONTENT GRID SCROLLER */}
          <div className="flex-1 overflow-y-auto custom-scrollbar mt-5">

            {/* ==================================== TAB: FAMILIES ==================================== */}
            <Tabs.Content value="families" className="outline-none h-full flex flex-col gap-6">
              
              {/* New Family Inline Form */}
              <AnimatePresence>
                {isAddingFamily && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, height: 0 }} 
                    animate={{ opacity: 1, y: 0, height: 'auto' }} 
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="overflow-hidden mb-2"
                  >
                    <GlassCard className="!p-6 border-amber-500/20 bg-amber-500/[0.01]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-amber-500" /> {t('partsCatalogLab.createFamilyTitle', 'إنشاء عائلة تصنيف جديدة لقطع الغيار')}
                      </h3>
                      <form onSubmit={handleCreateFamily} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('partsCatalogLab.groupLabel', 'مجموعة التصنيف')}</label>
                            <select 
                              value={newFamilyGroup} 
                              onChange={e => setNewFamilyGroup(e.target.value as FamilyGroup)}
                              className="titan-input py-2.5 bg-[#0b0c15] text-slate-100 font-bold"
                            >
                              {(Object.keys(GROUP_CONFIG) as FamilyGroup[]).map(gk => (
                                <option key={gk} value={gk} className="bg-[#141624]">
                                  {GROUP_CONFIG[gk].nameFr} - {GROUP_CONFIG[gk].nameAr}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-2 col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('partsCatalogLab.familyNameLabel', 'اسم عائلة التصنيف (الاسم الفني)')}</label>
                            <input 
                              required value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)} 
                              placeholder={t('partsCatalogLab.familyNamePlaceholder', 'مثال: BEARINGS, BELTS, VALVES, CYLINDERS, PLC MODULES...')} 
                              className="titan-input uppercase py-2.5 text-slate-100 font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('partsCatalogLab.familyDescLabel', 'النطاق / الوصف الهندسي')}</label>
                          <input 
                            value={newFamilyDesc} onChange={e => setNewFamilyDesc(e.target.value)} 
                            placeholder={t('partsCatalogLab.familyDescPlaceholder', 'حدد النطاق الفني التفصيلي أو المبادئ التوجيهية الهندسية لهذه العائلة')} 
                            className="titan-input py-2.5 text-slate-200"
                          />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                          <button 
                            type="button" 
                            onClick={() => setIsAddingFamily(false)}
                            className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer"
                          >
                            {t('common.cancel', 'إلغاء')}
                          </button>
                          <button 
                            type="submit" 
                            className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            {t('partsCatalogLab.submitFamily', 'تفعيل وتجسيد العائلة')}
                          </button>
                        </div>
                      </form>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {filteredFamilies.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                  <FolderTree className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">لا توجد عائلات تصنيف تطابق التصفية</p>
                  <p className="text-xs text-slate-500 mt-2">جرّب تغيير مجموعة التصنيف أو إلغاء التصفية لعرض العائلات النشطة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
                  {filteredFamilies.map((fam) => {
                    const famGroup = (fam.group || 'mecanique') as FamilyGroup;
                    const meta = GROUP_CONFIG[famGroup] || GROUP_CONFIG.autre;
                    const GroupIcon = meta.icon;
                    const tCount = templateCounts.get(fam.id) || 0;

                    return (
                      <div 
                        key={fam.id} 
                        onClick={() => {
                          setSelectedFamilyFilterId(fam.id);
                          setActiveTab('templates');
                        }}
                        className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col justify-between hover:border-white/20 transition-all duration-300 relative group overflow-hidden cursor-pointer active:scale-[0.99] shadow-lg"
                      >
                        {/* Elegant Glowing Backdrop Circle */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 pointer-events-none transition-all duration-300" />
                        
                        <div>
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold tracking-widest uppercase flex items-center gap-1 bg-white/5 text-slate-300 border border-white/10">
                              <GroupIcon className="w-3 h-3" />
                              {meta.nameFr}
                            </span>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem('family', fam.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all opacity-0 group-hover:opacity-100 relative z-20"
                              title="حذف العائلة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-400 transition-colors mb-2 uppercase relative z-10">
                            {fam.name}
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans min-h-[40px] italic relative z-10">
                            "{fam.description || 'لم يتم تحديد نطاق فني لهذه العائلة الهيكلية.'}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6 relative z-10">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                            معرف النظام: {fam.id.replace('fam-', '')}
                          </span>
                          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/10 transition-colors">
                            <Layers className="w-3.5 h-3.5 text-amber-400" />
                            {tCount} {tCount === 1 ? 'قالب مواصفات' : 'قوالب مواصفات'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Tabs.Content>

            {/* ==================================== TAB: TEMPLATES ==================================== */}
            <Tabs.Content value="templates" className="outline-none h-full flex flex-col gap-6">
              
              {/* New Template Specification Form */}
              <AnimatePresence>
                {isAddingTemplate && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, height: 0 }} 
                    animate={{ opacity: 1, y: 0, height: 'auto' }} 
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="overflow-hidden mb-2"
                  >
                    <GlassCard className="!p-6 border-emerald-500/20 bg-emerald-500/[0.01]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Component className="w-4 h-4 text-emerald-400" /> إضافة قالب مواصفات جديد (Abstract Specification)
                      </h3>
                      <form onSubmit={handleCreateTemplate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">عائلة التصنيف الهيكلية</label>
                            <select 
                              required value={selectedFamilyId} onChange={e => setSelectedFamilyId(e.target.value)} 
                              className="titan-input py-2.5 bg-[#0b0c15] text-slate-100"
                            >
                              <option value="" disabled className="bg-[#141624]">--- اختر العائلة ---</option>
                              {families.map(f => {
                                const meta = GROUP_CONFIG[(f.group || 'mecanique') as FamilyGroup];
                                return (
                                  <option key={f.id} value={f.id} className="bg-[#141624]">
                                    [{meta?.nameFr}] - {f.name}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">اسم قالب المواصفات</label>
                            <input 
                              required value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} 
                              placeholder="مثال: محمل كروي، سير ناقل V-Belt..." 
                              className="titan-input py-2.5 text-slate-100 font-bold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">الرمز المرجعي العائلي (SKU Prefix)</label>
                            <input 
                              required value={newTemplateSku} onChange={e => setNewTemplateSku(e.target.value)} 
                              placeholder="مثال: ROB, COU, VAL, MAG" 
                              className="titan-input uppercase py-2.5 text-emerald-400 font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">ملاحظات هندسية (اختياري)</label>
                          <input 
                            value={newTemplateDesc} onChange={e => setNewTemplateDesc(e.target.value)} 
                            placeholder="الخصائص التقنية العريضة لهذا القالب..." 
                            className="titan-input py-2.5 text-slate-200"
                          />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                          <button 
                            type="button" 
                            onClick={() => setIsAddingTemplate(false)}
                            className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button 
                            type="submit" 
                            className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            تفعيل القالب الهندسي
                          </button>
                        </div>
                      </form>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {filteredTemplates.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                  <Component className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">لا توجد قوالب مواصفات فنية</p>
                  <p className="text-xs text-slate-500 mt-2">تأكد من توفر عائلات التصنيف في المجموعات المختارة قبل إنشاء القوالب.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
                  {filteredTemplates.map((tmpl) => {
                    const parentFamily = families.find(f => f.id === tmpl.familyId);
                    const famGroup = parentFamily ? ((parentFamily.group || 'mecanique') as FamilyGroup) : 'mecanique';
                    const meta = GROUP_CONFIG[famGroup] || GROUP_CONFIG.autre;
                    const bCount = blueprintCounts.get(tmpl.id) || 0;
                    const GroupIcon = meta.icon;

                    return (
                      <div 
                        key={tmpl.id} 
                        onClick={() => setSelectedTemplateForSlots(selectedTemplateForSlots === tmpl.id ? null : tmpl.id)}
                        className={cn(
                          "p-5 bg-white/[0.02] border rounded-2xl flex flex-col justify-between hover:border-white/20 transition-all group duration-300 relative cursor-pointer shadow-lg overflow-hidden",
                          selectedTemplateForSlots === tmpl.id ? "border-cyan-500/40 shadow-cyan-500/5 ring-1 ring-cyan-500/10 bg-cyan-500/[0.01]" : "border-white/10"
                        )}
                      >
                        {/* Glowing radial background circle */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 pointer-events-none transition-all duration-300" />

                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                              الرمز: {tmpl.skuBase}
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteItem('template', tmpl.id); }}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all opacity-0 group-hover:opacity-100 relative z-20"
                              title="حذف القالب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 mb-1.5 text-slate-400 relative z-10">
                            <GroupIcon className="w-3.5 h-3.5 text-slate-500" />
                            {parentFamily?.name || 'عام'}
                          </span>
                          <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors mb-2 leading-tight uppercase relative z-10">
                            {tmpl.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-4 relative z-10">
                            {tmpl.description || 'لا توجد قواعد مواصفات تقنية محددة.'}
                          </p>
                        </div>

                        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500 font-bold flex items-center gap-1 hover:text-white transition-colors">
                            <Grid className="w-3 h-3" /> عرض مقاعد 999
                          </span>
                          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-mono font-bold flex items-center gap-1 shadow-sm">
                            <Package className="w-3 h-3 text-slate-400" /> {bCount} مرتبطة
                          </div>
                        </div>

                        {/* Interactive Dormant 999 slots container */}
                        {selectedTemplateForSlots === tmpl.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            className="mt-4 pt-4 border-t border-white/5 overflow-hidden cursor-default"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Info className="w-3 h-3 text-cyan-400" /> خريطة المقاعد المجمدة (999 Slots)
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 font-mono">{999 - bCount} مجمد / {bCount} نشط</span>
                            </div>
                            
                            <div className="grid grid-cols-10 gap-1 p-1.5 bg-[#0a0a0f]/40 rounded-xl border border-white/5">
                              {Array.from({ length: 40 }).map((_, idx) => {
                                const slotNum = idx + 1;
                                const isFilled = slotNum <= bCount;
                                const slotId = generatePdrSlotId(tmpl.skuBase, slotNum);
                                return (
                                  <div 
                                    key={idx} 
                                    className={cn(
                                      "aspect-square rounded text-[8px] flex items-center justify-center transition-all border font-mono",
                                      isFilled 
                                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold" 
                                        : "bg-[#0a0a0f]/30 border-white/5 hover:border-white/20 text-slate-600"
                                    )}
                                    title={isFilled ? `مقعد نشط: ${slotId}` : `مقعد مجمد ${slotNum}: ${slotId}`}
                                  >
                                    {slotNum}
                                  </div>
                                );
                              })}
                              <div className="col-span-10 text-center py-1.5 text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1 border-t border-white/5">
                                + 959 مقعد مجمد متبقي
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </motion.div>
    </motion.div>
  );
}
