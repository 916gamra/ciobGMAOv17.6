import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  FolderTree, 
  FlaskConical,
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
  ArrowRight, 
  Tag, 
  Grid, 
  Info,
  Package,
  BookOpen,
  Zap,
  Eye,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useMasterCatalogEngine } from '../hooks/useMasterCatalogEngine';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { GlassCard } from '@/shared/components/GlassCard';
import { cn } from '@/shared/utils';
import { generatePdrSlotId } from '@/core/config/pdrMatrix';
import { db } from '@/core/db';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { EngineViewSkeleton } from '@/shared/components/EngineViewSkeleton';

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
    colorClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20 hover:border-cyan-500/40',
    textClass: 'text-cyan-400',
    fillClass: 'bg-cyan-500',
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
    colorClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20 hover:border-amber-500/40',
    textClass: 'text-amber-400',
    fillClass: 'bg-amber-500',
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
    nameAr: 'هوائي',
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
  const { t, i18n } = useTranslation();
  const { families, templates, blueprints, isLoading } = useMasterCatalogEngine();
  const { showSuccess, showError } = useNotifications();

  const getGroupName = (meta: GroupMeta) => {
    if (i18n.language === 'ar') return meta.nameAr;
    if (i18n.language === 'fr') return meta.nameFr;
    return meta.nameEn;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<FamilyGroup | 'all'>('all');
  const [selectedFamilyFilterId, setSelectedFamilyFilterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
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
      showSuccess('تم تفعيل التصنيف', `تمت إضافة عائلة ${newFamilyName.toUpperCase()} بنجاح.`);
    } catch (err: any) {
      showError('خطأ في النظام', err.message);
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
      showSuccess('تم إنشاء قالب المواصفات', `تم إنشاء قالب ${newTemplateName} بنجاح.`);
    } catch (err: any) {
      showError('خطأ في النظام', err.message);
    }
  };

  // Safe item deletion
  const handleDeleteItem = async (type: 'family' | 'template', id: string) => {
    const isConfirmed = window.confirm(`هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟ قد يؤثر ذلك على التوصيلات الهيكلية للقطع.`);
    if (!isConfirmed) return;

    try {
      if (type === 'family') {
        const hasTemplates = templates.some(t => t.familyId === id);
        if (hasTemplates) {
          toast.error("لا يمكن حذف العائلة: تحتوي على قوالب مواصفات نشطة.");
          return;
        }
        await db.pdrFamilies.delete(id);
      } else if (type === 'template') {
        const hasBps = blueprints.some(b => b.templateId === id);
        if (hasBps) {
          toast.error("لا يمكن حذف القالب: يحتوي على قطع غيار مسجلة في المخزن.");
          return;
        }
        await db.pdrTemplates.delete(id);
      }
      showSuccess('تم الحذف بنجاح', 'تم إزالة العنصر من قاعدة البيانات.');
    } catch (err: any) {
      showError('فشل الحذف', err.message);
    }
  };

  if (isLoading) {
    return <EngineViewSkeleton mode="lab" themeColor="amber" />;
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
        icon={<FlaskConical className="w-7 h-7 text-amber-400" />}
        badgeText={t('partsCatalogLab.badgeText', 'مختبر الكتالوج')}
        badgeColor="amber"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(GROUP_CONFIG) as FamilyGroup[]).map((grpKey) => {
            const cfg = GROUP_CONFIG[grpKey];
            const Icon = cfg.icon;
            const count = groupStats[grpKey];
            const isFilterActive = selectedGroupFilter === grpKey;
            const bentoColorMap: Record<FamilyGroup, 'cyan' | 'blue' | 'amber' | 'emerald' | 'cyan' | 'slate'> = {
              mecanique: 'cyan',
              hydraulique: 'blue',
              electrique: 'amber',
              electronique: 'emerald',
              pneumatique: 'cyan',
              autre: 'slate',
            };

            const groupTitle = i18n.language === 'en' ? cfg.nameEn : i18n.language === 'fr' ? cfg.nameFr : cfg.nameAr;
            const subtitleText = i18n.language === 'fr' ? undefined : undefined;

            return (
              <HeaderBentoCard
                key={grpKey}
                title={groupTitle}
                value={count}
                valueUnit={t('unit.family', 'عائلة')}
                icon={<Icon className="w-3.5 h-3.5" />}
                color={bentoColorMap[grpKey]}
                isActive={isFilterActive}
                onClick={() => setSelectedGroupFilter(isFilterActive ? 'all' : grpKey)}
              />
            );
          })}
        </div>
      </PageHeader>

      {/* Main Split-Pane Content Area */}
      <motion.div 
        variants={itemVariants} 
        className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 min-w-0"
      >
        {/* Navigation Panel */}
        <div className="w-full lg:w-[380px] border border-amber-500/30 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(245,158,11,0.12)] bg-gradient-to-b from-amber-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98 backdrop-blur-xl relative flex flex-col p-5 shrink-0 gap-3.5 text-start">
          
          {/* Background ambient engine accent glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          
          {/* Header Title & Sync Control */}
          <div className="flex flex-col shrink-0 relative">
            <div className="flex items-center justify-between">
              <span className="text-white font-black uppercase tracking-wider block">
                {t('pdr.familiesTitle', 'عائلات التصنيف والقوالب')}
              </span>
              <button 
                onClick={() => {
                  toast.success(t('partsCatalogLab.synced', 'تمت مزامنة وقواعد بيانات القوالب بنجاح'));
                }}
                className="p-1.5 px-2 rounded-xl bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title={t('pdr.syncData', 'مزامنة وتحديث البيانات')}
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
            <span className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">
              {t('partsCatalogLab.familiesSubtitle', 'إدارة وتصنيف العائلات ومقاعد الـ 999')}
            </span>
          </div>

          {/* Prominent Wide Action Button - High Contrast White */}
          <button 
            onClick={() => {
              setIsAddingFamily(true);
              setIsAddingTemplate(false);
              setSelectedTemplateForSlots(null);
            }}
            className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{t('pdr.addNewFamily', 'إضافة عائلة جديدة')}</span>
          </button>

          {/* Quick Search - Crystal Dark */}
          <div className="relative w-full shrink-0">
            <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder={t('pdr.searchFamiliesPlaceholder', 'البحث في العائلات...')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all text-start font-bold shadow-inner"
            />
          </div>

          {/* Families List */}
          <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1 min-h-[200px] pt-1 -mx-2 px-2 pb-4">
            {filteredFamilies.map((fam) => {
              const isSelected = selectedFamilyFilterId === fam.id;
              const famGroup = (fam.group || 'mecanique') as FamilyGroup;
              const meta = GROUP_CONFIG[famGroup] || GROUP_CONFIG.autre;
              const GroupIcon = meta.icon;
              const tCount = templateCounts.get(fam.id) || 0;

              return (
                <div key={fam.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedFamilyFilterId(isSelected ? null : fam.id);
                      setSelectedTemplateForSlots(null);
                      setIsAddingFamily(false);
                      setIsAddingTemplate(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 text-xs font-bold transform active:scale-95 cursor-pointer",
                      isSelected 
                        ? "bg-amber-500/20 border-amber-500/50 text-white font-black shadow-[0_4px_20px_rgba(245,158,11,0.25)] scale-[1.02] -translate-y-0.5"
                        : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors shrink-0",
                        isSelected ? "bg-amber-500/30 text-amber-200" : "bg-white/5 text-slate-400"
                      )}>
                        <GroupIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate max-w-[140px] text-start">{fam.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono",
                        isSelected ? "bg-amber-500/30 text-amber-200" : "bg-white/5 text-slate-500"
                      )}>
                        {tCount}
                      </span>
                      {isSelected ? (
                        <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 rtl:rotate-180" />
                      )}
                    </div>
                  </button>

                  {/* Sub-Selector for templates inside selected family */}
                  {isSelected && (
                    <div className="ml-4 pl-3 border-l rtl:ml-0 rtl:mr-4 rtl:pl-0 rtl:pr-3 rtl:border-l-0 rtl:border-r border-white/10 space-y-1 py-1.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('pdr.specTemplates', 'قوالب المواصفات')}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFamilyId(fam.id);
                            setIsAddingTemplate(true);
                            setIsAddingFamily(false);
                            setSelectedTemplateForSlots(null);
                          }}
                          className="text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" /> {t('pdr.newTemplate', 'قالب جديد')}
                        </button>
                      </div>

                      {templates.filter(t => t.familyId === fam.id).map(tmpl => {
                        const isTmplSelected = selectedTemplateForSlots === tmpl.id;
                        return (
                          <button
                            key={tmpl.id}
                            onClick={() => {
                              setSelectedTemplateForSlots(isTmplSelected ? null : tmpl.id);
                              setIsAddingTemplate(false);
                              setIsAddingFamily(false);
                            }}
                            className={cn(
                              "w-full text-start p-2 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center justify-between transform active:scale-95 cursor-pointer border",
                              isTmplSelected
                                ? "bg-amber-500/20 border-amber-500/50 text-white font-black shadow-[0_4px_20px_rgba(245,158,11,0.25)] scale-[1.02] -translate-y-0.5"
                                : "bg-[#0a0a0f] border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] hover:border-white/10"
                            )}
                          >
                            <span className="truncate max-w-[140px]">{tmpl.name}</span>
                            <span className={cn(
                              "font-mono text-[9px] uppercase",
                              isTmplSelected ? "text-amber-200" : "opacity-60"
                            )}>{tmpl.skuBase}</span>
                          </button>
                        );
                      })}

                      {templates.filter(t => t.familyId === fam.id).length === 0 && (
                        <p className="text-[10px] text-slate-500 italic text-center py-2">{t('pdr.noSpecTemplates', 'لا توجد قوالب مواصفات فنية')}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFamilies.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">{t('pdr.noFamiliesCurrent', 'لا توجد عائلات تصنيف حالية')}</p>
            )}
          </div>
        </div>

        {/* Right Main Workspace Canvas */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl bg-[#0a0b10]/95 backdrop-blur-xl relative w-full h-full min-h-0">
            
            {/* Engine Accent Line */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none z-20" />

            {/* Ambient Engine Accent Rays & Glows */}
            <div className="absolute -top-12 -right-12 sm:-top-20 sm:-right-20 w-64 h-64 sm:w-80 sm:h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="absolute -bottom-12 -left-12 sm:-bottom-20 sm:-left-20 w-64 h-64 sm:w-80 sm:h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none z-0" />
            
            {/* Foreground Content Container */}
            <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full h-full p-6 md:p-8 overflow-y-auto custom-scrollbar text-right">
              <AnimatePresence mode="wait">
            {/* Case 1: Create Family Form */}
            {isAddingFamily && (
              <motion.div
                key="add-family"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-3xl mx-auto"
              >
                <GlassCard className="!p-8 border-white/10 bg-white/[0.01]">
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 flex-row-reverse">
                    <FolderTree className="w-5 h-5 text-amber-500" /> 
                    <span>{t('pdr.addFamilyTitle', 'إنشاء عائلة تصنيف جديدة لقطع الغيار')}</span>
                  </h3>
                  <form onSubmit={handleCreateFamily} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                      <div className="space-y-2 text-right">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t('pdr.classificationGroup', 'مجموعة التصنيف')}</label>
                        <select 
                          value={newFamilyGroup} 
                          onChange={e => setNewFamilyGroup(e.target.value as FamilyGroup)}
                          className="titan-input py-2.5 bg-[#0b0c15] text-slate-100 font-bold w-full"
                        >
                          {(Object.keys(GROUP_CONFIG) as FamilyGroup[]).map(gk => (
                            <option key={gk} value={gk} className="bg-[#141624]">
                              {getGroupName(GROUP_CONFIG[gk])}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2 col-span-2 text-right">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t('pdr.familyNameLabel', 'اسم عائلة التصنيف')}</label>
                        <input 
                          required value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)} 
                          placeholder={t('pdr.familyNamePlaceholder', 'مثال: المحامل الكروية، السيور الناقلة، الصمامات الهيدروليكية، وحدات الـ PLC...')} 
                          className="titan-input py-2.5 text-slate-100 font-bold w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-right">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t('pdr.familyScopeLabel', 'الوصف الهندسي والنطاق الفني')}</label>
                      <input 
                        value={newFamilyDesc} onChange={e => setNewFamilyDesc(e.target.value)} 
                        placeholder={t('pdr.familyScopePlaceholder', 'حدد النطاق الفني التفصيلي أو المبادئ التوجيهية الهندسية لهذه العائلة')} 
                        className="titan-input py-2.5 text-slate-200 w-full"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-2 flex-row-reverse">
                      <button 
                        type="submit" 
                        className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        {t('pdr.activateFamily', 'تفعيل وتجسيد العائلة')}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingFamily(false)}
                        className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {t('common.cancel', 'إلغاء')}
                      </button>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            )}

            {/* Case 2: Create Specification Template Form */}
            {isAddingTemplate && (
              <motion.div
                key="add-template"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-3xl mx-auto"
              >
                <GlassCard className="!p-8 border-white/10 bg-white/[0.01]">
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 flex-row-reverse">
                    <Component className="w-5 h-5 text-amber-500" />
                    <span>{t('pdr.addTemplateTitle', 'تفعيل قالب هندسي ومواصفات تقنية لقطع الغيار')}</span>
                  </h3>
                  <form onSubmit={handleCreateTemplate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2 text-right">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t('pdr.skuBaseLabel', 'الرمز المعياري الأساسي')}</label>
                        <input 
                          required value={newTemplateSku} onChange={e => setNewTemplateSku(e.target.value)} 
                          placeholder={t('pdr.skuBasePlaceholder', 'مثال: ROB-001, PNE-001, MEC-001')} 
                          className="titan-input uppercase py-2.5 text-white font-mono font-bold w-full"
                        />
                      </div>
                      
                      <div className="space-y-2 text-right">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t('pdr.templateNameLabel', 'اسم قالب مواصفات قطعة الغيار')}</label>
                        <input 
                          required value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} 
                          placeholder={t('pdr.templateNamePlaceholder', 'مثال: محمل كروي دقيق عالي السرعة')} 
                          className="titan-input py-2.5 text-slate-100 font-bold w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-right">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t('pdr.templateSpecsLabel', 'المواصفات الفنية القياسية المعيارية')}</label>
                      <textarea 
                        value={newTemplateDesc} onChange={e => setNewTemplateDesc(e.target.value)} 
                        placeholder={t('pdr.templateSpecsPlaceholder', 'اكتب المعايير القياسية للقطعة (الأقطار، السرعات، درجات الحرارة والضغوط...)')} 
                        className="titan-input py-2.5 text-slate-200 w-full min-h-[100px]"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-2 flex-row-reverse">
                      <button 
                        type="submit" 
                        className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        {t('pdr.activateTemplate', 'تفعيل القالب الهندسي')}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingTemplate(false)}
                        className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {t('common.cancel', 'إلغاء')}
                      </button>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            )}

            {/* Case 3: Selected Template & its 999 dormant slots */}
            {selectedTemplateForSlots && !isAddingFamily && !isAddingTemplate && (() => {
              const tmpl = templates.find(t => t.id === selectedTemplateForSlots);
              if (!tmpl) return null;
              const parentFamily = families.find(f => f.id === tmpl.familyId);
              const bCount = blueprintCounts.get(tmpl.id) || 0;

              return (
                <motion.div
                  key={`template-${tmpl.id}`}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  className="space-y-6 max-w-4xl mx-auto"
                >
                  <div className="p-6 md:p-8 bg-[#0a0a0f] border border-white/10 rounded-2xl relative overflow-hidden shadow-2xl space-y-6">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row-reverse justify-between items-start gap-4 relative z-10">
                      <div className="text-right flex-1 space-y-1">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <span className="px-3 py-1 bg-white/10 border border-white/15 rounded-xl text-xs font-mono text-white font-extrabold uppercase tracking-wider">
                            {t('pdr.skuBase', 'الرمز الأساسي')}: {tmpl.skuBase}
                          </span>
                          <span className="text-xs uppercase font-extrabold text-slate-300 flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
                            <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                            {parentFamily?.name || t('common.general', 'عام')}
                          </span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight">
                          {tmpl.name}
                        </h2>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                          "{tmpl.description || t('pdr.noSpecsRules', 'لا توجد قواعد مواصفات تقنية محددة لهذه القطعة.')}"
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteItem('template', tmpl.id)}
                        className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                        title={t('pdr.deleteTemplate', 'حذف القالب')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-4 mb-4">
                        <div className="text-right">
                          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 justify-end mb-1">
                            <Grid className="w-4 h-4 text-amber-400" /> {t('pdr.slotsMapTitle', 'خريطة الـ 999 مقعداً الافتراضية')}
                          </h4>
                          <p className="text-[11px] text-slate-300">
                            {t('pdr.slotsMapDesc', 'استيعاب مسبق وتلقائي لـ 999 مقعدًا مع استهلاك صفري لقاعدة البيانات حتى تفعيل القطع.')}
                          </p>
                        </div>
                        <div className="flex gap-2 font-mono text-xs">
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-extrabold">
                            {bCount} {t('pdr.active', 'نشط')}
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-white/10 text-slate-300 border border-white/15 font-extrabold">
                            {999 - bCount} {t('pdr.dormant', 'شاغر ومجمد')}
                          </span>
                        </div>
                      </div>

                      {/* Display first 40 slots for physical verification */}
                      <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-2 p-4 bg-[#08080c] rounded-2xl border border-white/10">
                        {Array.from({ length: 40 }).map((_, idx) => {
                          const slotNum = idx + 1;
                          const isFilled = slotNum <= bCount;
                          const slotId = generatePdrSlotId(tmpl.skuBase, slotNum);
                          return (
                            <div 
                              key={idx} 
                              className={cn(
                                "aspect-square rounded-xl text-[10px] flex items-center justify-center transition-all border font-mono font-bold select-none",
                                isFilled 
                                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]" 
                                  : "bg-white/[0.02] border-white/5 hover:border-white/20 text-slate-500"
                              )}
                              title={isFilled ? `${t('pdr.activeSlot', 'مقعد نشط')}: ${slotId}` : `${t('pdr.dormantSlot', 'مقعد مجمد')} ${slotNum}: ${slotId}`}
                            >
                              {slotNum}
                            </div>
                          );
                        })}
                        <div className="col-span-full text-center py-2 text-[10px] font-mono text-slate-400 font-extrabold uppercase tracking-widest mt-2 border-t border-white/5">
                          + 959 {t('pdr.remainingSlotsText', 'مقعد شاغر ومجمد متبقي في هذا القالب')}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Case 4: Selected Family Details but no Template Selected */}
            {selectedFamilyFilterId && !selectedTemplateForSlots && !isAddingFamily && !isAddingTemplate && (() => {
              const fam = families.find(f => f.id === selectedFamilyFilterId);
              if (!fam) return null;
              const famGroup = (fam.group || 'mecanique') as FamilyGroup;
              const meta = GROUP_CONFIG[famGroup] || GROUP_CONFIG.autre;
              const GroupIcon = meta.icon;
              const familyTemplates = templates.filter(t => t.familyId === fam.id);

              return (
                <motion.div
                  key={`family-${fam.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col h-full min-h-0 space-y-6"
                >
                  {/* Family Header info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-6 gap-4 text-start">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner shrink-0 text-amber-400">
                        <GroupIcon className="w-6 h-6" />
                      </div>
                      <div className="text-start space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-extrabold bg-amber-500/15 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                            {getGroupName(meta)}
                          </span>
                          <h3 className="text-2xl font-extrabold text-white tracking-tight">{fam.name}</h3>
                        </div>
                        <p className="text-xs text-slate-300 uppercase tracking-wider">
                          {fam.description || t('pdr.noFamilyScope', 'لم يتم تحديد نطاق فني لهذه العائلة الهيكلية.')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* View Switcher - Standard Header Crystal Component */}
                      <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10">
                        <button
                          onClick={() => setViewMode('table')}
                          className={cn(
                            "p-1.5 rounded-lg transition-all cursor-pointer",
                            viewMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                          )}
                          title={t('pdr.tableViewTitle', 'عرض الجدول الكريستالي')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('cards')}
                          className={cn(
                            "p-1.5 rounded-lg transition-all cursor-pointer",
                            viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                          )}
                          title={t('pdr.cardsViewTitle', 'عرض شبكة البطاقات')}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedFamilyId(fam.id);
                          setIsAddingTemplate(true);
                        }}
                        className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('pdr.newTemplate', 'قالب جديد')}</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteItem('family', fam.id)}
                        className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
                        title={t('pdr.deleteFamily', 'حذف العائلة')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Templates list inside Family */}
                  <div className="flex-1 flex flex-col min-h-0 text-start space-y-4">
                    <div className="flex items-center justify-between flex-row border-b border-white/10 pb-3">
                      <div className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                        <Component className="w-4 h-4 text-amber-400" />
                        <span>{t('pdr.activeTemplatesUnderFamily', 'قوالب المواصفات الفنية النشطة تحت هذه العائلة')} ({familyTemplates.length})</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {familyTemplates.length === 0 ? (
                        <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                          <Component className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                          <p className="text-xs text-slate-300 mb-4">{t('pdr.noRegisteredTemplates', 'لا توجد قوالب مواصفات مسجلة لهذه العائلة.')}</p>
                          <button
                            onClick={() => {
                              setSelectedFamilyId(fam.id);
                              setIsAddingTemplate(true);
                            }}
                            className="bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold rounded-xl px-4 py-2 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {t('pdr.addFirstTemplate', 'إضافة قالب أول')}
                          </button>
                        </div>
                      ) : viewMode === 'table' ? (
                        <div className="rounded-2xl border border-white/10 bg-[#0a0b10]/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
                          <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                            <table className="w-full text-start border-collapse">
                              <thead className="bg-[#12141d] border-b-2 border-white/15 text-slate-200 font-extrabold uppercase tracking-wider text-xs text-start sticky top-0 z-20 backdrop-blur-md shadow-sm">
                                <tr>
                                  <th className="p-4 text-start">{t('pdr.baseSkuHeader', 'الرمز المعياري الأساسي')}</th>
                                  <th className="p-4 text-start">{t('pdr.templateNameHeader', 'اسم قالب مواصفات القطعة')}</th>
                                  <th className="p-4 text-start">{t('pdr.activeSlotsHeader', 'المقاعد النشطة (999 مقعد)')}</th>
                                  <th className="p-4 text-end">{t('common.actions', 'الإجراءات')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                {familyTemplates.map((tmpl, idx) => {
                                  const bCount = blueprintCounts.get(tmpl.id) || 0;
                                  return (
                                    <tr 
                                      key={tmpl.id}
                                      onClick={() => setSelectedTemplateForSlots(tmpl.id)}
                                      className={cn(
                                        "cursor-pointer transition-colors duration-150 text-start",
                                        idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                                        "hover:bg-amber-500/15 hover:text-white"
                                      )}
                                    >
                                      <td className="p-4 font-mono font-extrabold text-white uppercase text-start flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 inline-block" />
                                        {tmpl.skuBase}
                                      </td>
                                      <td className="p-4 font-extrabold text-white text-start">{tmpl.name}</td>
                                      <td className="p-4 font-mono text-start">
                                        <span className="text-amber-400 font-extrabold">{bCount}</span> <span className="text-slate-300 font-bold">{t('pdr.activeSlotsLabel', 'مقعد نشط')}</span>
                                      </td>
                                      <td className="p-4 text-end" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteItem('template', tmpl.id);
                                          }}
                                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                                          title={t('pdr.deleteTemplate', 'حذف القالب')}
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
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {familyTemplates.map(tmpl => {
                            const bCount = blueprintCounts.get(tmpl.id) || 0;
                            const isSelected = selectedTemplateForSlots === tmpl.id;
                            return (
                              <div
                                key={tmpl.id}
                                onClick={() => setSelectedTemplateForSlots(tmpl.id)}
                                className={cn(
                                  "p-5 border rounded-2xl cursor-pointer relative overflow-hidden group text-start flex flex-col justify-between transition-all duration-300 bg-[#0a0a0f] shadow-xl",
                                  isSelected
                                    ? "border-2 border-amber-500 scale-[1.02] shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                                    : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]"
                                )}
                              >
                                {/* Ambient Bottom Ray */}
                                {isSelected && (
                                  <div className="bg-amber-500/20 rounded-full blur-xl absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-16 pointer-events-none z-0" />
                                )}

                                <div className="relative z-10">
                                  <div className="flex items-start justify-between mb-4 flex-row">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-amber-400">
                                        <Component className="w-4 h-4" />
                                      </div>
                                      <span className="text-xs font-mono font-extrabold text-white uppercase tracking-wider bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg">
                                        {tmpl.skuBase}
                                      </span>
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteItem('template', tmpl.id);
                                      }}
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                                      title={t('pdr.deleteTemplate', 'حذف القالب')}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">{tmpl.name}</h4>
                                      <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">{tmpl.description}</p>
                                    </div>
                                    
                                    <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
                                      <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1">
                                        <Grid className="w-3 h-3 text-amber-400" /> {t('pdr.slotsTotal', '999 مقعد')}
                                      </span>
                                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-extrabold text-amber-400">
                                        {bCount} {bCount === 1 ? t('pdr.activeSlotLabel', 'مقعد نشط') : t('pdr.activeSlotsCountLabel', 'مقاعد نشطة')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Case 5: Standard Greeting / Guide Card */}
            {!selectedFamilyFilterId && !selectedTemplateForSlots && !isAddingFamily && !isAddingTemplate && (
              <motion.div
                key="default-greeting"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto py-10 md:py-14 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-lg text-amber-400">
                  <FolderTree className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-white uppercase tracking-wider mb-3">
                  {t('pdr.greetingTitle', 'مستكشف الكتالوج وقوالب قطع الغيار')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-lg mb-6 font-medium">
                  {t('pdr.greetingDesc', 'يرجى تصفح أو اختيار إحدى عائلات التصنيف الفني من القائمة الهيكلية للوصول إلى قوالب المواصفات والـ 999 مقعداً المرتبطة بها.')}
                </p>
                <div className="flex gap-3 flex-row-reverse">
                  <button
                    onClick={() => {
                      setIsAddingFamily(true);
                      setIsAddingTemplate(false);
                      setSelectedTemplateForSlots(null);
                    }}
                    className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-5 py-2.5 text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> {t('pdr.addNewFamily', 'إضافة عائلة جديدة')}
                  </button>
                  <button
                    onClick={() => {
                      if (families.length > 0) {
                        setSelectedFamilyFilterId(families[0].id);
                      } else {
                        setIsAddingFamily(true);
                      }
                    }}
                    className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-300" /> {t('pdr.browseFirstFamily', 'تصفح العائلة الأولى')}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mt-8 text-start">
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all shadow-lg">
                    <div className="flex items-center gap-2 mb-2 justify-start">
                      <Grid className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-extrabold text-white">{t('pdr.rule999Title', 'قانون الـ 999 مقعداً الافتراضية لقطع الغيار')}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {t('pdr.rule999Desc', 'يولد النظام تلقائياً 999 مقعداً شاغراً رياضياً فور إنشاء أي قالب، تضمن الترقيم المتسلسل والمنهجي التلقائي بمرونة عالية ودون استهلاك حجم قاعدة البيانات.')}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all shadow-lg">
                    <div className="flex items-center gap-2 mb-2 justify-start">
                      <FolderTree className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-extrabold text-white">{t('pdr.activationTitle', 'استقلالية ونطاق مسؤول المخزن')}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {t('pdr.activationDesc', 'يركز محرك الكتالوج على الرصيد المادي لقطع الغيار وحركات الصرف، الإيداع، الجرد والتسوية لضمان تلبية احتياجات التدخلات الوقائية والعلاجية بكفاءة.')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </motion.div>
  );
}
