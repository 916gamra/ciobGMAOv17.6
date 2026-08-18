import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, Plus, Search,
  Wrench, Zap, Droplets, Wind, Cpu,
  ChevronRight, Activity, Trash2, Sparkles, LayoutGrid, Eye,
  ArrowRight, Layers, ShieldCheck, CheckCircle2, BookOpen
} from 'lucide-react';
import { useFailureCatalog } from '../hooks/useFailureCatalog';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { cn } from '@/shared/utils';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/shared/components/GlassCard';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
import { useTabStore } from '@/app/store';

export function FailureCatalogView() {
  const { t } = useTranslation();
  const { openTab } = useTabStore();
  const { categories, templates, seedDefaultCategories, addCategory, deleteCategory, addTemplate, deleteTemplate } = useFailureCatalog();
  const { showSuccess, showError } = useNotifications();

  // Selection state - start as null to show Welcome / Empty State by default (matching EngineeringLabView)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Search and filter states for faults and categories
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [symptomsFilter, setSymptomsFilter] = useState<string>('ALL');
  const [categorySearch, setCategorySearch] = useState('');

  // Modals
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateSeverity, setNewTemplateSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Display Mode: Table vs Cards (matches EngineeringLabView standard)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Seed defaults on mount if empty
  useEffect(() => {
    seedDefaultCategories();
  }, [seedDefaultCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const id = await addCategory(newCategoryName, '', 'slate-500');
      setNewCategoryName('');
      setIsAddingCategory(false);
      setSelectedCategoryId(id);
      showSuccess(t('corrective.failureCatalog.familyAddedSuccess', 'تم إضافة العائلة بنجاح'));
    } catch {
      showError(t('corrective.failureCatalog.familyAddFailed', 'فشل إضافة العائلة'));
    }
  };

  const handleDeleteCategory = async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('corrective.failureCatalog.deleteFamilyConfirm', 'هل أنت متأكد من حذف هذه العائلة وكافة الأعطال المسجلة تحتها نهائياً؟'))) {
      try {
        await deleteCategory(categoryId);
        if (selectedCategoryId === categoryId) {
          setSelectedCategoryId(null);
        }
        showSuccess(t('corrective.failureCatalog.familyDeletedSuccess', 'تم حذف العائلة بنجاح'));
      } catch {
        showError(t('corrective.failureCatalog.familyDeleteFailed', 'فشل حذف العائلة'));
      }
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !selectedCategoryId) return;
    try {
      await addTemplate(selectedCategoryId, newTemplateName, newTemplateDesc, newTemplateSeverity);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplateSeverity('medium');
      setIsAddingTemplate(false);
      showSuccess(t('corrective.failureCatalog.faultSavedSuccess', 'تم تسجيل العطل بنجاح في الكتالوج'));
    } catch {
      showError(t('corrective.failureCatalog.faultSaveFailed', 'فشل تسجيل العطل'));
    }
  };

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('corrective.failureCatalog.deleteFaultConfirm', 'هل أنت متأكد من حذف هذا العطل من كشوفات المصنع نهائياً؟'))) {
      try {
        await deleteTemplate(templateId);
        showSuccess(t('corrective.failureCatalog.faultDeletedSuccess', 'تم حذف العطل من كتالوج النظام'));
      } catch {
        showError(t('common.deleteError', 'فشل الحذف'));
      }
    }
  };

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
  }, [categories, categorySearch]);

  const categoryTemplates = useMemo(() => {
    if (!selectedCategoryId) return [];
    return templates.filter(t => t.categoryId === selectedCategoryId);
  }, [templates, selectedCategoryId]);

  const filteredTemplates = useMemo(() => {
    let list = categoryTemplates;
    if (severityFilter && severityFilter !== 'ALL') {
      list = list.filter(t => (t.severity || 'medium') === severityFilter);
    }
    if (symptomsFilter === 'HAS_SYMPTOMS') {
      list = list.filter(t => t.description && t.description.trim().length > 0);
    } else if (symptomsFilter === 'NO_SYMPTOMS') {
      list = list.filter(t => !t.description || t.description.trim().length === 0);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(t => 
        t.name.toLowerCase().includes(term) || 
        (t.description && t.description.toLowerCase().includes(term)) ||
        t.id.toLowerCase().includes(term)
      );
    }
    return list;
  }, [categoryTemplates, severityFilter, symptomsFilter, searchTerm]);

  const filterGroups: FilterGroup[] = useMemo(() => {
    const criticalCount = categoryTemplates.filter(t => t.severity === 'critical').length;
    const highCount = categoryTemplates.filter(t => t.severity === 'high').length;
    const mediumCount = categoryTemplates.filter(t => (t.severity || 'medium') === 'medium').length;
    const lowCount = categoryTemplates.filter(t => t.severity === 'low').length;
    
    const hasSymptomsCount = categoryTemplates.filter(t => t.description && t.description.trim().length > 0).length;
    const noSymptomsCount = categoryTemplates.length - hasSymptomsCount;

    return [
      {
        id: 'severity',
        label: t('corrective.failureCatalog.severityFilterLabel', 'مستوى الخطورة'),
        value: severityFilter,
        onChange: setSeverityFilter,
        allLabel: t('corrective.failureCatalog.allSeverities', 'جميع المستويات'),
        type: 'chips',
        options: [
          { value: 'critical', label: t('corrective.failureCatalog.severityCritical', 'حرج (Critical)'), count: criticalCount, badgeColor: 'rose' },
          { value: 'high', label: t('corrective.failureCatalog.severityHigh', 'عالي (High)'), count: highCount, badgeColor: 'amber' },
          { value: 'medium', label: t('corrective.failureCatalog.severityMedium', 'متوسط (Medium)'), count: mediumCount, badgeColor: 'cyan' },
          { value: 'low', label: t('corrective.failureCatalog.severityLow', 'منخفض (Low)'), count: lowCount, badgeColor: 'emerald' }
        ]
      },
      {
        id: 'symptoms',
        label: t('corrective.failureCatalog.symptomsFilterLabel', 'مصفوفة الأعراض'),
        value: symptomsFilter,
        onChange: setSymptomsFilter,
        allLabel: t('corrective.failureCatalog.allSymptoms', 'جميع الأعطال'),
        type: 'chips',
        options: [
          { value: 'HAS_SYMPTOMS', label: t('corrective.failureCatalog.filterWithSymptoms', 'أعراض مسجلة وموثقة'), count: hasSymptomsCount },
          { value: 'NO_SYMPTOMS', label: t('corrective.failureCatalog.filterNoSymptoms', 'بانتظار توثيق الأعراض'), count: noSymptomsCount }
        ]
      }
    ];
  }, [categoryTemplates, severityFilter, symptomsFilter, t]);

  const getCategoryIcon = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('méc') || lower.includes('ميكانيك') || lower.includes('mechanical')) return <Wrench className="w-4 h-4" />;
    if (lower.includes('élec') || lower.includes('كهرباء') || lower.includes('electric')) return <Zap className="w-4 h-4" />;
    if (lower.includes('hydr') || lower.includes('هيدروليك') || lower.includes('hydraulic')) return <Droplets className="w-4 h-4" />;
    if (lower.includes('pneu') || lower.includes('نيوماتيك') || lower.includes('pneumatic')) return <Wind className="w-4 h-4" />;
    if (lower.includes('électron') || lower.includes('إلكترونيك') || lower.includes('electronic')) return <Cpu className="w-4 h-4" />;
    return <Layers className="w-4 h-4" />;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
            {t('corrective.failureCatalog.severityCritical', 'حرج')}
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
            {t('corrective.failureCatalog.severityHigh', 'عالي')}
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
            {t('corrective.failureCatalog.severityMedium', 'متوسط')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-300 border border-slate-500/20 font-mono">
            {t('corrective.failureCatalog.severityLow', 'منخفض')}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08080c] text-slate-100 custom-scrollbar overflow-y-auto">
      {/* Page Header */}
      <div className="px-6 md:px-8 pt-6">
        <PageHeader
          title={t('corrective.failureCatalog.title', 'كتالوج الأعطال ومصفوفات التشخيص')}
          subtitle={t('corrective.failureCatalog.subtitle', 'توثيق وتصنيف الأعطال الصناعية ومصفوفات الأعراض وتحديد مستويات الخطورة لربطها بالتدخلات العلاجية وقطع الغيار.')}
          icon={<Wrench className="w-7 h-7 text-orange-400" />}
          badgeText={t('corrective.failureCatalog.badge', 'كتالوج الأعطال v17.1')}
          badgeColor="orange"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('corrective.failureCatalog.statFamilies', 'العائلات الصناعية')}
              subtitle="FAMILIES"
              value={categories.length}
              valueUnit={t('unit.family', 'عائلة')}
              icon={<Layers className="w-3.5 h-3.5" />}
              color="orange"
            />
            <HeaderBentoCard
              title={t('corrective.failureCatalog.statFailures', 'أنواع الأعطال')}
              subtitle="FAILURES"
              value={templates.length}
              valueUnit={t('unit.type', 'عطل')}
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('corrective.failureCatalog.statReliability', 'تغطية التصنيف')}
              subtitle="COVERAGE"
              value="100%"
              valueUnit="ISO"
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('corrective.failureCatalog.statTreeStatus', 'جاهزية الكتالوج')}
              subtitle="READINESS"
              value="READY"
              valueUnit="v17.1"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="blue"
            />
          </div>
        </PageHeader>
      </div>

      {/* Main Workspace Area: Split-Pane Twin Panels */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 md:p-8 pt-0 overflow-hidden min-h-0">
        
        {/* Left Navigation Panel: Categories & Sectors (Chapter 12 Constitution) */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4">
          <div className="flex flex-col flex-1 min-h-[460px] p-0 border border-orange-500/30 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(249,115,22,0.12)] bg-gradient-to-b from-orange-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98 backdrop-blur-xl relative h-full">
            
            {/* Background ambient engine accent glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="p-5 relative z-10 flex flex-col h-full space-y-4">
              
              {/* Title & Badge */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider text-start">
                    {t('corrective.failureCatalog.familiesAndSectors', 'العائلات والقطاعات')}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5 text-start">
                    CATEGORIES & SECTORS
                  </span>
                </div>
                <span className="text-[10px] bg-white/10 text-white font-mono px-2.5 py-1 rounded-full border border-white/15 font-bold">
                  {categories.length} {t('corrective.failureCatalog.families', 'عائلة')}
                </span>
              </div>

              {/* Action Buttons: High-contrast Add Family + Simulator Link (Above search input) */}
              <div className="space-y-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>{t('corrective.failureCatalog.newFamilyBtn', 'إضافة عائلة أعطال جديدة')}</span>
                </button>

                <button 
                  type="button"
                  onClick={() => openTab({ id: 'diagnostic-simulator', portalId: 'CORRECTIVE', title: 'شجرة التشخيص الميداني', component: 'diagnostic-simulator' })}
                  className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-orange-400" />
                  <span>{t('corrective.failureCatalog.openSimulatorBtn', 'تشغيل شجرة التشخيص الميداني')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
                </button>
              </div>

              {/* Category Search Input with Clear Button (Positioned Below Action Buttons) */}
              <div className="relative shrink-0">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder={t('corrective.failureCatalog.searchFamilies', 'بحث في العائلات والقطاعات...')}
                  className="w-full bg-[#111218] border border-white/10 rounded-xl py-2 pl-9 pr-8 rtl:pr-9 rtl:pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors shadow-inner text-start"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-[10px] cursor-pointer transition-colors"
                    title={t('common.clear', 'مسح البحث')}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
                {filteredCategories.map(cat => {
                  const isSelected = selectedCategoryId === cat.id;
                  const catTemplatesCount = templates.filter(t => t.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-xs font-bold cursor-pointer text-start group",
                        isSelected 
                          ? "bg-white/10 border-white/20 text-white font-extrabold shadow-md"
                          : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn(
                          "p-2 rounded-xl border transition-colors shrink-0",
                          isSelected 
                            ? "bg-orange-500/20 border-orange-500/30 text-orange-300" 
                            : "bg-white/5 border-white/10 text-slate-400"
                        )}>
                          {getCategoryIcon(cat.name)}
                        </div>
                        <div className="overflow-hidden">
                          <span className="block text-white font-bold truncate">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {catTemplatesCount} {t('corrective.failureCatalog.activeFailuresCount', 'عطل مسجل')}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform rtl:rotate-180 shrink-0",
                        isSelected ? "opacity-100 text-orange-400" : "opacity-30 text-slate-500"
                      )} />
                    </div>
                  );
                })}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-500 italic space-y-2">
                    <p>{t('corrective.failureCatalog.noMatchingFamilies', 'لا توجد عائلات مطابقة للبحث')}</p>
                    <button
                      type="button"
                      onClick={() => setCategorySearch('')}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[11px] border border-white/10 cursor-pointer"
                    >
                      {t('common.clearFilter', 'إلغاء التصفية')}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Right Main Workspace Canvas (Exact architectural parity with EngineeringLabView) */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl bg-[#0a0b10]/95 backdrop-blur-xl relative w-full h-full min-h-0">
            
            {/* Engine Accent Line */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent pointer-events-none z-20" />

            {/* Ambient Engine Accent Rays & Glows (Positioned strictly in background) */}
            <div className="absolute -top-12 -right-12 sm:-top-20 sm:-right-20 w-64 h-64 sm:w-80 sm:h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="absolute -bottom-12 -left-12 sm:-bottom-20 sm:-left-20 w-64 h-64 sm:w-80 sm:h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none z-0" />

            {/* Foreground Content Container with relative z-10 */}
            <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full h-full">
              
              <AnimatePresence mode="wait">
                {selectedCategory ? (
                  <motion.div
                    key={`category-${selectedCategory.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex flex-col h-full min-h-0 p-6 md:p-8"
                  >
                    {/* Category Header info (Header & Actions matching EngineeringLabView standard) */}
                    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between border-b border-white/10 pb-5 mb-5 gap-4 text-start">
                      {/* Start / Left: Icon, Name & Result Count Badge */}
                      <div className="flex items-start gap-4 shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-inner shrink-0 text-orange-400">
                          {getCategoryIcon(selectedCategory.name)}
                        </div>
                        <div className="text-start">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-white tracking-tight">{selectedCategory.name}</h3>
                            <span className="text-xs font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
                              {filteredTemplates.length} {t('corrective.failureCatalog.activeFailuresCount', 'عطل')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                            {selectedCategory.description || t('corrective.failureCatalog.categoryHeaderSubtitle', 'كتالوج الأعطال ومصفوفات الأعراض الميدانية')}
                          </p>
                        </div>
                      </div>

                      {/* Center: Unified Search & Filters with Popover in the Middle of Header */}
                      <div className="flex-1 max-w-lg xl:max-w-xl mx-auto w-full px-1">
                        <UnifiedSearchFilter
                          searchTerm={searchTerm}
                          onSearchChange={setSearchTerm}
                          searchPlaceholder={t('corrective.failureCatalog.searchPlaceholder', 'بحث باسم العطل، رمز المعايرة، أو الأعراض...')}
                          filterGroups={filterGroups}
                          themeColor="orange"
                          onResetAll={() => {
                            setSearchTerm('');
                            setSeverityFilter('ALL');
                            setSymptomsFilter('ALL');
                          }}
                        />
                      </div>

                      {/* End / Right: View Switcher, Add Fault, Delete Category */}
                      <div className="flex items-center gap-2 shrink-0 justify-end">
                        {/* View Switcher matching EngineeringLab standard */}
                        <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10 mr-1">
                          <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={cn(
                              "p-1.5 rounded-lg transition-all cursor-pointer",
                              viewMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                            )}
                            title={t('common.tableView', 'عرض الجدول الكريستالي')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('cards')}
                            className={cn(
                              "p-1.5 rounded-lg transition-all cursor-pointer",
                              viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                            )}
                            title={t('common.cardsView', 'عرض البطاقات')}
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Add Fault Primary Button */}
                        <button 
                          type="button"
                          onClick={() => setIsAddingTemplate(true)}
                          className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-950" />
                          <span>{t('corrective.failureCatalog.addFaultBtn', 'تسجيل عطل جديد')}</span>
                        </button>
                        
                        {/* Delete Category Button */}
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteCategory(selectedCategory.id, e)}
                          className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                          title={t('common.delete', 'حذف العائلة')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Main List / Table / Empty States */}
                    <div className="flex-1 flex flex-col min-h-0 text-start">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {templates.filter(t => t.categoryId === selectedCategory.id).length === 0 ? (
                          /* Empty state when NO templates exist under this category - matching EngineeringLabView */
                          <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                            <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">{t('corrective.failureCatalog.noFaultsFound', 'لا توجد أعطال مسجلة ضمن هذه العائلة حتى الآن.')}</p>
                            <button 
                              type="button"
                              onClick={() => setIsAddingTemplate(true)}
                              className="mt-4 bg-white text-slate-950 hover:bg-slate-200 font-extrabold text-xs rounded-xl px-4 py-2 transition-all inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('corrective.failureCatalog.addFirstFaultBtn', 'إضافة أول عطل')}</span>
                            </button>
                          </div>
                        ) : filteredTemplates.length === 0 ? (
                          /* Empty state when search filters everything out */
                          <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                            <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">{t('corrective.failureCatalog.nullResultsDesc', 'لا توجد أعطال تطابق معايير البحث المحددة.')}</p>
                            <button 
                              type="button"
                              onClick={() => setSearchTerm('')}
                              className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 text-xs transition-all cursor-pointer"
                            >
                              {t('corrective.failureCatalog.resetSearch', 'إلغاء التصفية ومسح البحث')}
                            </button>
                          </div>
                        ) : viewMode === 'cards' ? (
                          /* Cards Grid View - Styled like EngineeringLabView */
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {filteredTemplates.map(item => (
                              <div 
                                key={item.id}
                                className="bg-[#08080c]/80 border border-white/10 hover:border-white/20 rounded-2xl p-5 hover:bg-white/[0.03] transition-all relative overflow-hidden group text-start flex flex-col justify-between shadow-lg"
                              >
                                <div>
                                  <div className="flex items-start justify-between mb-4 flex-row">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                                      </div>
                                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                        {item.id.length > 8 ? `TR-${item.id.slice(-4).toUpperCase()}` : item.id}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5">
                                      {getSeverityBadge(item.severity || 'medium')}
                                      <button 
                                        type="button"
                                        onClick={(e) => handleDeleteTemplate(item.id, e)}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-white/5 transition-colors cursor-pointer"
                                        title={t('common.delete', 'حذف')}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <h4 className="text-sm font-bold text-white mb-2">{item.name}</h4>

                                  {item.description && (
                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                                      {item.description}
                                    </p>
                                  )}
                                </div>

                                <div className="border-t border-white/5 pt-3 mt-3 flex justify-between items-center text-xs">
                                  <button
                                    type="button"
                                    onClick={() => openTab({ id: 'diagnostic-simulator', portalId: 'CORRECTIVE', title: 'شجرة التشخيص الميداني', component: 'diagnostic-simulator' })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/25 font-bold transition-all cursor-pointer"
                                  >
                                    <Activity className="w-3.5 h-3.5" />
                                    <span>{t('corrective.failureCatalog.diagnoseAction', 'تشخيص العطل')}</span>
                                  </button>
                                  <span className="text-[10px] text-slate-500 font-mono">ISO 14224</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Crystal High-Contrast Table - Styled like EngineeringLabView */
                          <div className="rounded-2xl border border-white/10 bg-[#0a0b10]/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
                            <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                              <table className="w-full text-start border-collapse">
                                <thead className="bg-[#12141d] border-b-2 border-white/15 text-slate-200 font-extrabold uppercase tracking-wider text-xs text-start sticky top-0 z-20 backdrop-blur-md shadow-sm">
                                  <tr>
                                    <th className="p-4 text-start">{t('corrective.failureCatalog.thFaultName', 'اسم العطل والأعراض الملاحظة')}</th>
                                    <th className="p-4 text-start">{t('corrective.failureCatalog.thCalibrationCode', 'رمز المعايرة')}</th>
                                    <th className="p-4 text-center">{t('corrective.failureCatalog.thSeverity', 'مستوى الخطورة')}</th>
                                    <th className="p-4 text-center">{t('corrective.failureCatalog.thDiagnosticTree', 'شجرة التشخيص')}</th>
                                    <th className="p-4 text-end">{t('common.actions', 'الإجراءات')}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                  {filteredTemplates.map((item, idx) => (
                                    <tr 
                                      key={item.id}
                                      className={cn(
                                        "transition-colors duration-150 text-start",
                                        idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                                        "hover:bg-orange-500/10 hover:text-white"
                                      )}
                                    >
                                      <td className="p-4 text-start">
                                        <div className="flex items-center gap-2.5">
                                          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 inline-block" />
                                          <div>
                                            <span className="font-bold text-white block">{item.name}</span>
                                            {item.description && (
                                              <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                {item.description}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-4 font-mono font-extrabold text-white uppercase text-start">
                                        {item.id.length > 8 ? `TR-${item.id.slice(-4).toUpperCase()}` : item.id}
                                      </td>
                                      <td className="p-4 text-center">
                                        {getSeverityBadge(item.severity || 'medium')}
                                      </td>
                                      <td className="p-4 text-center">
                                        <button
                                          type="button"
                                          onClick={() => openTab({ id: 'diagnostic-simulator', portalId: 'CORRECTIVE', title: 'شجرة التشخيص الميداني', component: 'diagnostic-simulator' })}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/25 text-xs font-bold transition-all cursor-pointer"
                                        >
                                          <Activity className="w-3.5 h-3.5" />
                                          <span>{t('corrective.failureCatalog.diagnoseAction', 'تشخيص')}</span>
                                        </button>
                                      </td>
                                      <td className="p-4 text-end">
                                        <button 
                                          type="button"
                                          onClick={(e) => handleDeleteTemplate(item.id, e)}
                                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                                          title={t('common.delete', 'حذف')}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Default Welcome / Empty state matching EngineeringLabView */
                  <motion.div
                    key="default-welcome"
                    initial={{ opacity: 0, scale: 0.98, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center w-full space-y-6 relative z-10 overflow-y-auto custom-scrollbar min-h-0 box-border"
                  >
                    {/* Glowing Engine Icon Container */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 shadow-[0_0_40px_rgba(249,115,22,0.25)]">
                        <Wrench className="w-8 h-8 sm:w-10 sm:h-10" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 border border-orange-500/40 flex items-center justify-center text-orange-300 shadow-md">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-w-xl">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                        {t('corrective.failureCatalog.welcomeTitle', 'مستكشف ومحرر كتالوج الأعطال')}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                        {t('corrective.failureCatalog.welcomeDesc', 'المركز الهندسي الموحد لتصنيف الأعطال الصناعية، وتأطير مصفوفات الأعراض الملاحظة لربطها بقطع الغيار والخطط الوقائية.')}
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-3 flex-wrap justify-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(true)}
                        className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-slate-950 font-extrabold rounded-2xl shadow-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-xs cursor-pointer active:scale-95"
                      >
                        <Plus className="w-4 h-4 text-slate-950" />
                        <span>{t('corrective.failureCatalog.newFamilyBtn', 'إضافة عائلة أعطال جديدة')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (categories.length > 0) {
                            setSelectedCategoryId(categories[0].id);
                          } else {
                            seedDefaultCategories();
                          }
                        }}
                        className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white/[0.05] hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-orange-400" />
                        <span>{t('corrective.failureCatalog.browseFirstAssetBtn', 'استعراض أول عائلة')}</span>
                      </button>
                    </div>

                    {/* Bento Grid Feature Highlight Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl text-start pt-2">
                      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-orange-500/30 transition-all duration-300 space-y-2 group backdrop-blur-md">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Layers className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                          {t('corrective.failureCatalog.guidanceCatalogTitle', 'التصنيف والتأطير الهندسي')}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                          {t('corrective.failureCatalog.guidanceCatalogDesc', 'تصنيف الأعطال حسب التخصصات الهندسية مع رمز معايرة موحد ومستوى خطورة قياسي لكل عَرَض.')}
                        </p>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-orange-500/30 transition-all duration-300 space-y-2 group backdrop-blur-md">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {t('corrective.failureCatalog.guidancePdrTitle', 'الربط مع قطع الغيار الاستهلاكية')}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                          {t('corrective.failureCatalog.guidancePdrDesc', 'ربط مخرجات تشخيص الأعطال مباشرة مع بصمات المخزن لسحب قطع الغيار اللازمة للإصلاح فوراً.')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </GlassCard>
        </div>

      </div>

      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0f111a] border border-orange-500/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden text-start"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0" />
              
              <h3 className="text-xl font-bold text-white mb-2">{t('corrective.failureCatalog.modalAddFamilyTitle', 'إضافة عائلة أعطال جديدة')}</h3>
              
              <form onSubmit={handleAddCategory} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('corrective.failureCatalog.modalFamilyNameLabel', 'اسم العائلة')}</label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 text-start"
                    placeholder={t('corrective.failureCatalog.modalFamilyNamePlaceholder', 'مثال: ميكانيك، هيدروليك، كهرباء...')}
                  />
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-white hover:bg-slate-200 text-slate-950 rounded-xl font-extrabold transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>{t('corrective.failureCatalog.modalAddFamilyBtn', 'إضافة العائلة')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    {t('common.cancel', 'إلغاء')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Template Modal */}
      <AnimatePresence>
        {isAddingTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0f111a] border border-orange-500/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden text-start"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0" />
              
              <h3 className="text-xl font-bold text-white mb-2">{t('corrective.failureCatalog.modalNewFaultTitle', 'تسجيل عطل جديد')}</h3>
              <p className="text-sm text-slate-400 mb-6">
                {t('corrective.failureCatalog.modalUnderFamily', 'ضمن عائلة')}: <strong className="text-orange-400">{selectedCategory?.name}</strong>
              </p>

              <form onSubmit={handleAddTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('corrective.failureCatalog.modalFaultNameLabel', 'اسم العطل والأعراض الملاحظة')}</label>
                  <input
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 text-start"
                    placeholder={t('corrective.failureCatalog.modalFaultNamePlaceholder', 'مثال: تسرب هيدروليكي، ارتفاع الحرارة...')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('corrective.failureCatalog.modalFaultDescLabel', 'وصف العطل وسياق الفحص (اختياري)')}</label>
                  <textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 h-24 resize-none text-start"
                    placeholder={t('corrective.failureCatalog.modalFaultDescPlaceholder', 'تفاصيل إضافية حول هذا العطل لتوجيه الفني...')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('corrective.failureCatalog.modalFaultSeverityLabel', 'مستوى الخطورة الافتراضي')}</label>
                  <select
                    value={newTemplateSeverity}
                    onChange={(e) => setNewTemplateSeverity(e.target.value as any)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 text-start appearance-none"
                  >
                    <option value="low">{t('corrective.failureCatalog.severityLow', 'منخفض')}</option>
                    <option value="medium">{t('corrective.failureCatalog.severityMedium', 'متوسط')}</option>
                    <option value="high">{t('corrective.failureCatalog.severityHigh', 'عالي')}</option>
                    <option value="critical">{t('corrective.failureCatalog.severityCritical', 'حرج')}</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-white hover:bg-slate-200 text-slate-950 rounded-xl font-extrabold transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <Plus className="w-5 h-5 text-slate-950" />
                    <span>{t('corrective.failureCatalog.saveInCatalogBtn', 'حفظ في الكتالوج')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTemplate(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    {t('common.cancel', 'إلغاء')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
