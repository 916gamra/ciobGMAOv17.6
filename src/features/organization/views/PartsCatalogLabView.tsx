import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
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
  ArrowRight, 
  Tag, 
  Grid, 
  Info,
  Package,
  BookOpen,
  Zap,
  Eye,
  LayoutGrid
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
    colorClass: 'bg-white/5',
    borderClass: 'border-white/10 hover:border-cyan-500/40',
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
    nameAr: 'هوائي',
    colorClass: 'bg-white/5',
    borderClass: 'border-white/10 hover:border-cyan-500/40',
    textClass: 'text-slate-300',
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
    return (
      <div className="p-12 text-slate-400 flex flex-col items-center justify-center h-full min-h-[400px]">
        <Cpu className="w-12 h-12 text-cyan-500 animate-pulse mb-4" />
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
        icon={<FolderTree className="w-7 h-7 text-cyan-400" />}
        badgeText={t('partsCatalogLab.badgeText', 'مختبر الكتالوج')}
        badgeColor="cyan"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(GROUP_CONFIG) as FamilyGroup[]).map((grpKey) => {
            const cfg = GROUP_CONFIG[grpKey];
            const Icon = cfg.icon;
            const count = groupStats[grpKey];
            const isFilterActive = selectedGroupFilter === grpKey;
            const bentoColorMap: Record<FamilyGroup, 'cyan' | 'blue' | 'yellow' | 'emerald' | 'cyan' | 'slate'> = {
              mecanique: 'cyan',
              hydraulique: 'blue',
              electrique: 'yellow',
              electronique: 'emerald',
              pneumatique: 'cyan',
              autre: 'slate',
            };

            const groupTitle = i18n.language === 'en' ? cfg.nameEn : i18n.language === 'fr' ? cfg.nameFr : cfg.nameAr;

            return (
              <HeaderBentoCard
                key={grpKey}
                title={groupTitle}
                subtitle={cfg.nameFr}
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
        <div className="w-full md:w-80 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(6,182,212,0.12)] bg-gradient-to-b from-cyan-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98 backdrop-blur-xl relative flex flex-col p-5 shrink-0 gap-3.5 text-start">
          
          {/* Background ambient engine accent glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col shrink-0">
            <span className="text-white font-black uppercase tracking-wider block">
              {t('corrective.failureCatalog.families', 'عائلات التصنيف')}
            </span>
            <span className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">
              {t('partsCatalogLab.familiesSubtitle', 'إدارة وتصنيف العائلات')}
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
            <span>إضافة عائلة جديدة</span>
          </button>

          {/* Quick Search - Crystal White */}
          <div className="relative w-full shrink-0">
            <Search className="w-4 h-4 absolute right-3 rtl:right-3 left-auto rtl:left-auto left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="البحث في العائلات..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pr-9 pl-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-start font-bold shadow-sm"
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
                      "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 text-xs font-bold flex-row-reverse transform active:scale-95 cursor-pointer",
                      isSelected 
                        ? "bg-cyan-500/20 border-cyan-500/50 text-white font-black shadow-[0_4px_20px_rgba(6,182,212,0.25)] scale-[1.02] -translate-y-0.5"
                        : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5 flex-row-reverse">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors shrink-0",
                        isSelected ? "bg-cyan-500/30 text-cyan-200" : "bg-white/5 text-slate-400"
                      )}>
                        <GroupIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate max-w-[120px]">{fam.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono",
                        isSelected ? "bg-cyan-500/30 text-cyan-200" : "bg-white/5 text-slate-500"
                      )}>
                        {tCount}
                      </span>
                      <ArrowRight className={cn(
                        "w-3 h-3 transition-transform rotate-180",
                        isSelected ? "opacity-100 translate-x-0 text-cyan-300" : "opacity-30 translate-x-1"
                      )} />
                    </div>
                  </button>

                  {/* Sub-Selector for templates inside selected family */}
                  {isSelected && (
                    <div className="mr-4 pr-3 border-r border-white/10 space-y-1 py-1.5">
                      <div className="flex items-center justify-between flex-row-reverse mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">قوالب المواصفات</span>
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
                          <Plus className="w-2.5 h-2.5" /> قالب جديد
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
                              "w-full text-right p-2 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center justify-between flex-row-reverse transform active:scale-95 cursor-pointer border",
                              isTmplSelected
                                ? "bg-cyan-500/20 border-cyan-500/50 text-white font-black shadow-[0_4px_20px_rgba(6,182,212,0.25)] scale-[1.02] -translate-y-0.5"
                                : "bg-[#0a0a0f] border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] hover:border-white/10"
                            )}
                          >
                            <span className="truncate max-w-[140px]">{tmpl.name}</span>
                            <span className={cn(
                              "font-mono text-[9px] uppercase",
                              isTmplSelected ? "text-cyan-200" : "opacity-60"
                            )}>{tmpl.skuBase}</span>
                          </button>
                        );
                      })}

                      {templates.filter(t => t.familyId === fam.id).length === 0 && (
                        <p className="text-[10px] text-slate-500 italic text-center py-2">لا توجد قوالب مواصفات فنية</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFamilies.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">لا توجد عائلات تصنيف حالية</p>
            )}
          </div>
        </div>

        {/* Left Workspace - Dynamic Content Viewer */}
        <div className="flex-1 bg-slate-950/20 border border-white/10 rounded-2xl overflow-y-auto custom-scrollbar p-6 text-right relative min-h-0">
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
                    <FolderTree className="w-5 h-5 text-cyan-500" /> 
                    <span>إنشاء عائلة تصنيف جديدة لقطع الغيار</span>
                  </h3>
                  <form onSubmit={handleCreateFamily} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                      <div className="space-y-2 text-right">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">مجموعة التصنيف</label>
                        <select 
                          value={newFamilyGroup} 
                          onChange={e => setNewFamilyGroup(e.target.value as FamilyGroup)}
                          className="titan-input py-2.5 bg-[#0b0c15] text-slate-100 font-bold w-full"
                        >
                          {(Object.keys(GROUP_CONFIG) as FamilyGroup[]).map(gk => (
                            <option key={gk} value={gk} className="bg-[#141624]">
                              {GROUP_CONFIG[gk].nameFr} - {GROUP_CONFIG[gk].nameAr}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2 col-span-2 text-right">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">اسم عائلة التصنيف (الاسم الفني)</label>
                        <input 
                          required value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)} 
                          placeholder="مثال: BEARINGS, BELTS, VALVES, CYLINDERS, PLC MODULES..." 
                          className="titan-input uppercase py-2.5 text-slate-100 font-bold w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-right">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">النطاق / الوصف الهندسي</label>
                      <input 
                        value={newFamilyDesc} onChange={e => setNewFamilyDesc(e.target.value)} 
                        placeholder="حدد النطاق الفني التفصيلي أو المبادئ التوجيهية الهندسية لهذه العائلة" 
                        className="titan-input py-2.5 text-slate-200 w-full"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-2 flex-row-reverse">
                      <button 
                        type="submit" 
                        className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        تفعيل وتجسيد العائلة
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingFamily(false)}
                        className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        إلغاء
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
                    <Component className="w-5 h-5 text-cyan-500" />
                    <span>تفعيل قالب هندسي ومواصفات تقنية لقطع الغيار</span>
                  </h3>
                  <form onSubmit={handleCreateTemplate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2 text-right">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">الترميز والرمز الأساسي (SKU Base)</label>
                        <input 
                          required value={newTemplateSku} onChange={e => setNewTemplateSku(e.target.value)} 
                          placeholder="مثال: ROB-ROU, PNE-VLV, MEC-VBT" 
                          className="titan-input uppercase py-2.5 text-white font-mono font-bold w-full"
                        />
                      </div>
                      
                      <div className="space-y-2 text-right">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">اسم قالب المواصفات الفنية</label>
                        <input 
                          required value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} 
                          placeholder="مثال: ROULEMENT A BILLES DE PRECISION" 
                          className="titan-input py-2.5 text-slate-100 font-bold w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-right">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">الدليل والمواصفات الفنية القياسية للقطعة</label>
                      <textarea 
                        value={newTemplateDesc} onChange={e => setNewTemplateDesc(e.target.value)} 
                        placeholder="اكتب المعايير القياسية للقطعة (الأقطار، السرعات، درجات الحرارة والضغوط...)" 
                        className="titan-input py-2.5 text-slate-200 w-full min-h-[100px]"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-2 flex-row-reverse">
                      <button 
                        type="submit" 
                        className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        تفعيل القالب الهندسي
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingTemplate(false)}
                        className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        إلغاء
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
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row-reverse justify-between items-start gap-4 mb-6 relative z-10">
                      <div className="text-right flex-1">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                            الرمز الأساسي: {tmpl.skuBase}
                          </span>
                          <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <FolderTree className="w-3.5 h-3.5 text-slate-500" />
                            {parentFamily?.name || 'عام'}
                          </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-white uppercase group-hover:text-slate-300 transition-colors mb-2">
                          {tmpl.name}
                        </h2>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl italic">
                          "{tmpl.description || 'لا توجد قواعد مواصفات تقنية محددة لهذه القطعة.'}"
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteItem('template', tmpl.id)}
                        className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5 hover:border-rose-500/20 active:scale-95"
                        title="حذف القالب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-4 mb-4">
                        <div className="text-right">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-end mb-1">
                            <Grid className="w-4 h-4 text-slate-300" /> خريطة الـ 999 مقعداً الافتراضية
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            استيعاب مسبق وتلقائي لـ 999 مقعدًا مع استهلاك صفري لقاعدة البيانات حتى تفعيل القطع.
                          </p>
                        </div>
                        <div className="flex gap-2 font-mono text-xs">
                          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {bCount} نشط
                          </span>
                          <span className="px-2.5 py-1 rounded bg-white/5 text-slate-400 border border-white/10">
                            {999 - bCount} شاغر ومجمد
                          </span>
                        </div>
                      </div>

                      {/* Display first 40 slots for physical verification */}
                      <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-1.5 p-3 bg-slate-950/60 rounded-xl border border-white/10">
                        {Array.from({ length: 40 }).map((_, idx) => {
                          const slotNum = idx + 1;
                          const isFilled = slotNum <= bCount;
                          const slotId = generatePdrSlotId(tmpl.skuBase, slotNum);
                          return (
                            <div 
                              key={idx} 
                              className={cn(
                                "aspect-square rounded-lg text-[9px] flex items-center justify-center transition-all border font-mono select-none",
                                isFilled 
                                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                                  : "bg-[#0a0a0f]/30 border-white/5 hover:border-white/20 text-slate-600"
                              )}
                              title={isFilled ? `مقعد نشط: ${slotId}` : `مقعد مجمد ${slotNum}: ${slotId}`}
                            >
                              {slotNum}
                            </div>
                          );
                        })}
                        <div className="col-span-full text-center py-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2 border-t border-white/5">
                          + 959 مقعد شاغر ومجمد متبقي في هذا القالب
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 max-w-4xl mx-auto"
                >
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row-reverse justify-between items-start gap-4 mb-6 relative z-10">
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1 justify-end bg-white/5 text-slate-300 border border-white/10 w-fit ml-auto">
                          <GroupIcon className="w-3.5 h-3.5" />
                          {meta.nameFr}
                        </span>
                        <h2 className="text-2xl font-extrabold text-cyan-400 uppercase mt-3 mb-2">
                          {fam.name}
                        </h2>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl italic">
                          "{fam.description || 'لم يتم تحديد نطاق فني لهذه العائلة الهيكلية.'}"
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteItem('family', fam.id)}
                        className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5 hover:border-rose-500/20 active:scale-95"
                        title="حذف العائلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <div className="flex justify-between items-center mb-4 flex-row-reverse">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          القوالب الفنية النشطة تحت هذه العائلة
                        </h3>
                        
                        <div className="flex items-center gap-3 flex-row-reverse">
                          <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono font-bold">
                            {familyTemplates.length} قالب
                          </span>

                          {/* View Switcher */}
                          <div className="flex items-center gap-1.5 p-1 bg-[#0a0a0f]/60 rounded-xl border border-white/5">
                            <button
                              onClick={() => setViewMode('table')}
                              className={cn(
                                "p-1.5 rounded-lg transition-all",
                                viewMode === 'table' ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
                              )}
                              title="عرض الجدول"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setViewMode('cards')}
                              className={cn(
                                "p-1.5 rounded-lg transition-all",
                                viewMode === 'cards' ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
                              )}
                              title="عرض البطاقات"
                            >
                              <LayoutGrid className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {familyTemplates.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                          <Component className="w-10 h-10 text-slate-600 mb-3" />
                          <p className="text-xs text-slate-500">لا توجد قوالب مواصفات مسجلة لهذه العائلة.</p>
                          <button
                            onClick={() => {
                              setSelectedFamilyId(fam.id);
                              setIsAddingTemplate(true);
                            }}
                            className="mt-3 px-3 py-1.5 bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-lg text-xs transition-all cursor-pointer"
                          >
                            إضافة قالب أول
                          </button>
                        </div>
                      ) : viewMode === 'table' ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                          <table dir="ltr" className="w-full text-left border-collapse">
                            <thead className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-xs">
                              <tr>
                                <th className="p-4">إجراءات</th>
                                <th className="p-4">القطع النشطة</th>
                                <th className="p-4">الرمز المعياري Base SKU</th>
                                <th className="p-4">قالب مواصفات قطع الغيار</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                              {familyTemplates.map(tmpl => {
                                const bCount = blueprintCounts.get(tmpl.id) || 0;
                                return (
                                  <tr 
                                    key={tmpl.id}
                                    onClick={() => setSelectedTemplateForSlots(tmpl.id)}
                                    className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                                  >
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteItem('template', tmpl.id);
                                        }}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                    <td className="p-4 font-mono">{bCount} قطع نشطة</td>
                                    <td className="p-4 font-mono font-bold text-white uppercase">{tmpl.skuBase}</td>
                                    <td className="p-4 font-bold text-slate-200">{tmpl.name}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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
                                  "p-4 border rounded-xl cursor-pointer relative overflow-hidden group text-right flex flex-col justify-between transition-all duration-500",
                                  isSelected
                                    ? "border-2 border-cyan-500 bg-[#0a0a0f] scale-[1.03] shadow-[0_0_25px_rgba(6,182,212,0.25)]"
                                    : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:scale-[1.01]"
                                )}
                              >
                                {/* Ambient Bottom Ray */}
                                {isSelected && (
                                  <div className="bg-cyan-500/25 rounded-full blur-xl absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-16 pointer-events-none z-0" />
                                )}

                                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                                  <div>
                                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">{tmpl.skuBase}</span>
                                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-slate-300 transition-colors mt-1 mb-1.5">{tmpl.name}</h4>
                                    <p className="text-[11px] text-slate-400 line-clamp-2 italic mb-3">"{tmpl.description}"</p>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-white/5 pt-2.5 mt-2 flex-row-reverse">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                      <Grid className="w-3 h-3" /> عرض المقاعد 999
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-slate-300">
                                      {bCount} مقاعد نشطة
                                    </span>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/5">
                  <FolderTree className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-3">مستكشف الكتالوج وقوالب قطع الغيار</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-6">
                  يرجى تصفح أو اختيار إحدى عائلات التصنيف الفني من القائمة اليمنى الذكية للوصول إلى قوالب المواصفات والـ 999 مقعداً المرتبطة بها.
                </p>
                <div className="flex gap-3 flex-row-reverse">
                  <button
                    onClick={() => {
                      setIsAddingFamily(true);
                      setIsAddingTemplate(false);
                      setSelectedTemplateForSlots(null);
                    }}
                    className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> إضافة عائلة جديدة
                  </button>
                  <button
                    onClick={() => {
                      if (families.length > 0) {
                        setSelectedFamilyFilterId(families[0].id);
                      } else {
                        setIsAddingFamily(true);
                      }
                    }}
                    className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-400" /> تصفح العائلة الأولى
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
