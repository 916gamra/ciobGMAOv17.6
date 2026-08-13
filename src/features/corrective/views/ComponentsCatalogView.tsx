import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Trash2, 
  Cpu, 
  Box, 
  Link as LinkIcon,
  LayoutList,
  Grid,
  X,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Link2
} from 'lucide-react';
import { db, ComponentTemplate, ComponentBlueprint, PdrTemplate } from '@/core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { GlassCard } from '@/shared/components/GlassCard';
import { FilterBar } from '@/shared/components/FilterBar';
import { BadgePill } from '@/shared/components/BadgePill';
import { cn } from '@/shared/utils';
import { useTranslation } from 'react-i18next';

export function ComponentsCatalogView() {
  const { t } = useTranslation();
  const data = useLiveQuery(async () => {
    const [templates, blueprints, pdrTemplates] = await Promise.all([
      db.componentTemplates.toArray(),
      db.componentBlueprints.toArray(),
      db.pdrTemplates.toArray()
    ]);
    return { templates, blueprints, pdrTemplates };
  }, []);

  const templates = data?.templates ?? [];
  const blueprints = data?.blueprints ?? [];
  const pdrTemplates = data?.pdrTemplates ?? [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamily, setFilterFamily] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ComponentTemplate | null>(null);
  
  // Blueprint Modal State
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [selectedTemplateForBlueprint, setSelectedTemplateForBlueprint] = useState<ComponentTemplate | null>(null);

  // Template Form State
  const [tmplName, setTmplName] = useState('');
  const [tmplFamily, setTmplFamily] = useState('MEC');
  const [tmplCriticality, setTmplCriticality] = useState('Medium');
  const [tmplDesc, setTmplDesc] = useState('');
  const [tmplLinkedPdrs, setTmplLinkedPdrs] = useState<string[]>([]);

  // Blueprint Form State
  const [bpReference, setBpReference] = useState('');
  const [bpBrand, setBpBrand] = useState('');
  const [bpSpecs, setBpSpecs] = useState('');

  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  const toggleTemplate = (id: string) => {
    const next = new Set(expandedTemplates);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTemplates(next);
  };

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTmplName('');
    setTmplFamily('MEC');
    setTmplCriticality('Medium');
    setTmplDesc('');
    setTmplLinkedPdrs([]);
    setIsTemplateModalOpen(true);
  };

  const openEditTemplate = (tItem: ComponentTemplate) => {
    setEditingTemplate(tItem);
    setTmplName(tItem.name);
    setTmplFamily(tItem.family);
    setTmplCriticality(tItem.criticality || 'Medium');
    setTmplDesc(tItem.description || '');
    setTmplLinkedPdrs(tItem.linkedPartTemplateIds || []);
    setIsTemplateModalOpen(true);
  };

  const openNewBlueprint = (tItem: ComponentTemplate) => {
    setSelectedTemplateForBlueprint(tItem);
    setBpReference('');
    setBpBrand('');
    setBpSpecs('');
    setIsBlueprintModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await db.componentTemplates.update(editingTemplate.id, {
          name: tmplName,
          family: tmplFamily,
          description: tmplDesc,
          criticality: tmplCriticality,
          linkedPartTemplateIds: tmplLinkedPdrs
        });
      } else {
        await db.componentTemplates.add({
          id: crypto.randomUUID(),
          name: tmplName,
          family: tmplFamily,
          description: tmplDesc,
          criticality: tmplCriticality,
          linkedPartTemplateIds: tmplLinkedPdrs
        });
      }
      setIsTemplateModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء حفظ القالب');
    }
  };

  const handleSaveBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForBlueprint) return;

    try {
      // 999 slots rule
      const existingBps = await db.componentBlueprints
        .where('id')
        .startsWith(selectedTemplateForBlueprint.family + '-')
        .toArray();
      
      let nextNum = 1;
      if (existingBps.length > 0) {
        const nums = existingBps.map(bp => {
          const parts = bp.id.split('-');
          return parseInt(parts[1] || '0', 10);
        }).filter(n => !isNaN(n));
        if (nums.length > 0) {
          nextNum = Math.max(...nums) + 1;
        }
      }
      if (nextNum > 999) {
        alert("تم الوصول للحد الأقصى (999 مقعد) لهذه العائلة!");
        return;
      }

      const id = `${selectedTemplateForBlueprint.family}-${nextNum.toString().padStart(3, '0')}`;

      await db.componentBlueprints.add({
        id,
        templateId: selectedTemplateForBlueprint.id,
        reference: bpReference,
        brand: bpBrand,
        specs: bpSpecs
      });

      setIsBlueprintModalOpen(false);
      setExpandedTemplates(prev => new Set(prev).add(selectedTemplateForBlueprint.id));
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء إضافة البصمة التجارية');
    }
  };

  const handleDeleteTemplate = async (tItem: ComponentTemplate) => {
    if (confirm(`هل أنت تأكد من حذف القالب ${tItem.name}؟\nتنبيه: سيؤدي هذا لحذف جميع البصمات التجارية المرتبطة به!`)) {
      const relatedBps = blueprints.filter(b => b.templateId === tItem.id);
      await db.transaction('rw', db.componentTemplates, db.componentBlueprints, async () => {
        for (const bp of relatedBps) {
          await db.componentBlueprints.delete(bp.id);
        }
        await db.componentTemplates.delete(tItem.id);
      });
    }
  };

  const handleDeleteBlueprint = async (bp: ComponentBlueprint) => {
    if (confirm(`حذف البصمة التجارية ${bp.id}؟`)) {
      await db.componentBlueprints.delete(bp.id);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(tmpl => {
      const matchSearch = searchTerm ? tmpl.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchFamily = filterFamily ? tmpl.family === filterFamily : true;
      return matchSearch && matchFamily;
    });
  }, [templates, searchTerm, filterFamily]);

  const getCriticalityBadge = (crit?: string) => {
    switch (crit) {
      case 'Critical':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">حرجة (Critical)</span>;
      case 'High':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">عالية (High)</span>;
      case 'Low':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30 font-mono">منخفضة (Low)</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">متوسطة (Medium)</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden">
      {/* Page Header Cockpit */}
      <div className="p-6 md:p-8 pb-0">
        <PageHeader
          title={t('corrective.componentsCatalog.title', 'كتالوج المكونات والأجزاء')}
          subtitle={t('corrective.componentsCatalog.subtitle', 'دليل المكونات الفنية وتجميعات الأجزاء المرتبطة بآلات ومعدات المعمل.')}
          icon={<Cpu className="w-7 h-7 text-orange-400" />}
          badgeText={t('corrective.componentsCatalog.badge', 'المكونات والتجميعات')}
          badgeColor="orange"
          actions={
            <button 
              onClick={openNewTemplate}
              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" /> 
              <span>{t('corrective.componentsCatalog.newComponent', 'إضافة مكون جديد')}</span>
            </button>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('corrective.componentsCatalog.totalTemplates', 'إجمالي القوالب')}
              subtitle="TEMPLATES"
              value={templates.length}
              valueUnit={t('unit.template', 'قالب')}
              icon={<Layers className="w-3.5 h-3.5" />}
              color="orange"
            />
            <HeaderBentoCard
              title={t('corrective.componentsCatalog.blueprints', 'البصمات المكونة')}
              subtitle="BLUEPRINTS"
              value={blueprints.length}
              valueUnit={t('unit.blueprint', 'بصمة')}
              icon={<Tag className="w-3.5 h-3.5" />}
              color="cyan"
            />
            <HeaderBentoCard
              title={t('corrective.componentsCatalog.linkedPdr', 'قوالب PDR المرتبطة')}
              subtitle="PDR LINKED"
              value={pdrTemplates.length}
              valueUnit={t('unit.template', 'قالب')}
              icon={<Link2 className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('corrective.componentsCatalog.linkStatus', 'حالة الربط الهندسي')}
              subtitle="LINK STATUS"
              value="100%"
              valueUnit={t('unit.active', 'نشط')}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="emerald"
            />
          </div>
        </PageHeader>
      </div>

      {/* CORE TABLE CONTAINER (FACTORY ADMIN CRYSTAL HIGH-CONTRAST DESIGN) */}
      <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl flex-1 flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl mx-6 md:mx-8 mb-6 mt-6">
        {/* Table Registry Header + FilterBar */}
        <div className="p-6 md:p-8 border-b border-white/10 bg-white/[0.02] flex flex-col gap-6 shrink-0 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Cpu className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight font-sans">
                  كتالوج المكونات الفنية وتجميعات الآلات
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Machine Component Templates & Commercial Blueprints
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BadgePill color="orange">
                {filteredTemplates.length} مكون مسجل
              </BadgePill>
              <button
                type="button"
                onClick={openNewTemplate}
                className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>إضافة مكون جديد</span>
              </button>
            </div>
          </div>

          {/* SEARCH AND FILTERS */}
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="بحث باسم المكون، القالب، أو العائلة..."
            extraControls={
              <div className="flex items-center gap-2 flex-row-reverse">
                <select
                  value={filterFamily}
                  onChange={(e) => setFilterFamily(e.target.value)}
                  className="py-1.5 px-3 bg-[#0a0a0f]/50 border border-white/10 rounded-xl text-xs text-slate-300 font-mono cursor-pointer focus:outline-none focus:border-orange-500/50 appearance-none pr-8 pl-3 rtl:pr-3 rtl:pl-8 text-right"
                  dir="rtl"
                >
                  <option value="">جميع العائلات الفنية</option>
                  <option value="MEC">ميكانيك (MEC)</option>
                  <option value="ELE">كهرباء (ELE)</option>
                  <option value="HYD">هيدروليك (HYD)</option>
                  <option value="PNU">بنيوماتيك (PNU)</option>
                  <option value="ELN">إلكترونيك (ELN)</option>
                </select>

                {/* VIEW SWITCHER */}
                <div className="flex items-center bg-[#0a0a0f]/90 border border-white/10 rounded-xl p-0.5 gap-0.5 flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 font-bold cursor-pointer",
                      viewMode === 'table' 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-slate-400 hover:text-white"
                    )}
                    title="عرض جدول كريستالي"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 font-bold cursor-pointer",
                      viewMode === 'cards' 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-slate-400 hover:text-white"
                    )}
                    title="عرض بطاقات"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            }
          />
        </div>

        {/* CONTENT DISPLAY */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#0a0a0f]/40 p-6 md:p-8">
          {viewMode === 'table' ? (
            /* CRYSTAL HIGH-CONTRAST TABLE VIEW */
            <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0a0f]/60 backdrop-blur-xl shadow-2xl">
              <table dir="ltr" className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider font-mono text-[11px]">
                    <th className="py-3.5 px-4">العائلة الفنية</th>
                    <th className="py-3.5 px-4">اسم المكون (Template)</th>
                    <th className="py-3.5 px-4">مستوى الأهمية</th>
                    <th className="py-3.5 px-4">البصمات التجارية (Blueprints)</th>
                    <th className="py-3.5 px-4">قطع الغيار المرتبطة (PDRs)</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات والتحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Cpu className="w-16 h-16 text-slate-500 mb-4 opacity-50" />
                          <p className="font-semibold text-slate-400">لا توجد قوالب مكونات مسجلة</p>
                          <p className="text-xs text-slate-500 mt-1">انقر فوق "إضافة مكون جديد" لبدء إضافة قالب جديد للكتالوج.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTemplates.map((tItem) => {
                    const isExpanded = expandedTemplates.has(tItem.id);
                    const tmplBlueprints = blueprints.filter(b => b.templateId === tItem.id);

                    return (
                      <React.Fragment key={tItem.id}>
                        <tr 
                          className="hover:bg-white/[0.04] transition-colors border-b border-white/5 cursor-pointer group"
                          onClick={() => toggleTemplate(tItem.id)}
                        >
                          {/* Family Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase">
                              {tItem.family}
                            </span>
                          </td>

                          {/* Template Name & Description */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm">
                                {tItem.name}
                              </span>
                              {tItem.description && (
                                <span className="text-[10px] text-slate-400 truncate max-w-xs">
                                  {tItem.description}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Criticality */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {getCriticalityBadge(tItem.criticality)}
                          </td>

                          {/* Commercial Blueprints count */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                {tmplBlueprints.length} موديل تجاري
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openNewBlueprint(tItem); }}
                                className="p-1 rounded bg-white/5 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 border border-white/10 transition-colors"
                                title="إضافة بصمة تجارية جديدة"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Linked PDRs count */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-300">
                            {tItem.linkedPartTemplateIds && tItem.linkedPartTemplateIds.length > 0 ? (
                              <span className="text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                {tItem.linkedPartTemplateIds.length} قطعة غيار
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">غير مرتبط</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => openEditTemplate(tItem)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title="تعديل القالب"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tItem)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                                title="حذف القالب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleTemplate(tItem.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-orange-400" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* EXPANDABLE BLUEPRINTS & PDR PANEL */}
                        {isExpanded && (
                          <tr className="bg-[#0a0a0f]/80 border-b border-white/10">
                            <td colSpan={6} className="p-4 md:p-6 text-left">
                              <div className="space-y-4 pr-6 border-r-2 border-orange-500/40">
                                {/* Blueprints sub-section */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between flex-row-reverse">
                                    <h4 className="text-xs font-bold text-orange-300 uppercase font-mono flex items-center justify-end gap-2 flex-row-reverse">
                                      <Box className="w-4 h-4 text-orange-400" />
                                      <span>البصمات والموديلات التجارية لهذا المكون (Commercial Blueprints)</span>
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => openNewBlueprint(tItem)}
                                      className="text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 border border-orange-500/30 cursor-pointer flex-row-reverse"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      إضافة بصمة تجارية
                                    </button>
                                  </div>

                                  {tmplBlueprints.length === 0 ? (
                                    <div className="text-xs text-slate-500 italic p-3 bg-white/[0.02] rounded-xl border border-white/5 text-right">
                                      لا توجد بصمات تجارية مفعّلة لهذا القالب بعد.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {tmplBlueprints.map(bp => (
                                        <div key={bp.id} className="p-3 bg-[#0a0a0f] border border-white/10 rounded-xl flex items-start justify-between gap-3 flex-row-reverse">
                                          <div className="text-right">
                                            <span className="text-xs font-mono font-black text-cyan-400 block mb-0.5">{bp.id}</span>
                                            <span className="text-xs font-bold text-white block">{bp.reference}</span>
                                            {bp.brand && (
                                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">المصنع: {bp.brand}</span>
                                            )}
                                            {bp.specs && (
                                              <p className="text-[10px] text-slate-300 mt-1 bg-[#0a0a0f]/40 p-1.5 rounded border border-white/5 text-right">
                                                {bp.specs}
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteBlueprint(bp)}
                                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                            title="حذف البصمة"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Linked PDRs sub-section */}
                                <div className="pt-3 border-t border-white/5 text-right">
                                  <h4 className="text-xs font-bold text-slate-300 font-mono mb-2 flex items-center justify-end gap-1.5 flex-row-reverse">
                                    <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>قطع الغيار المرتبطة الهيكلية (Linked Spare Parts)</span>
                                  </h4>
                                  <div className="flex flex-wrap gap-2 justify-end flex-row-reverse">
                                    {tItem.linkedPartTemplateIds && tItem.linkedPartTemplateIds.length > 0 ? (
                                      tItem.linkedPartTemplateIds.map(pid => {
                                        const pdrTmpl = pdrTemplates.find(p => p.id === pid);
                                        return (
                                          <div key={pid} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 flex-row-reverse">
                                            <Box className="w-3.5 h-3.5 text-orange-400" />
                                            <span className="text-xs text-slate-200 font-bold">{pdrTmpl?.name || pid}</span>
                                            {pdrTmpl?.skuBase && (
                                              <span className="text-[10px] text-slate-400 font-mono">({pdrTmpl.skuBase})</span>
                                            )}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <span className="text-xs text-slate-500 italic">لا توجد قطع غيار استهلاكية مرتبطة بهذا القالب.</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
              <Cpu className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
              <p className="font-semibold text-slate-400">لا توجد قوالب مكونات مسجلة</p>
              <p className="text-xs text-slate-500 mt-1">انقر فوق "إضافة مكون جديد" لبدء إضافة قالب جديد للكتالوج.</p>
            </div>
          ) : (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(tItem => {
                const isExpanded = expandedTemplates.has(tItem.id);
                const tmplBlueprints = blueprints.filter(b => b.templateId === tItem.id);

                return (
                  <motion.div
                    key={tItem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-[#0a0a0f]/60 hover:bg-[#0a0a0f]/90 border border-white/10 hover:border-orange-500/30 rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-xl backdrop-blur-xl"
                  >
                    <div>
                      <div className="flex items-start justify-between border-b border-white/5 pb-3 mb-3 flex-row-reverse">
                        <div className="flex items-center justify-end gap-3 flex-row-reverse">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold font-mono">
                            {tItem.family}
                          </div>
                          <div className="text-right">
                            <h3 className="text-sm font-bold text-white">{tItem.name}</h3>
                            <div className="mt-1 flex justify-end">{getCriticalityBadge(tItem.criticality)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-row-reverse">
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tItem)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditTemplate(tItem)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {tItem.description && (
                        <p className="text-xs text-slate-400 mb-3 line-clamp-2 text-right">
                          {tItem.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs bg-[#0a0a0f]/40 p-3 rounded-xl border border-white/5 flex-row-reverse">
                        <span className="text-slate-400 font-mono text-right">البصمات المفعّلة:</span>
                        <span className="font-mono font-bold text-cyan-400 text-left">{tmplBlueprints.length} بصمات تجارية</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 flex-row-reverse">
                      <button
                        type="button"
                        onClick={() => openNewBlueprint(tItem)}
                        className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 font-bold text-xs flex items-center justify-center gap-1 border border-orange-500/20 transition-all cursor-pointer flex-row-reverse"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        إضافة بصمة
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleTemplate(tItem.id)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 border border-white/10 transition-all cursor-pointer flex-row-reverse"
                      >
                        <span>{isExpanded ? 'إخفاء التفاصيل' : 'عرض البصمات'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* EXPANDED BLUEPRINTS IN CARDS VIEW */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-white/10 space-y-2 font-mono text-xs">
                        {tmplBlueprints.length === 0 ? (
                          <p className="text-slate-500 italic text-[11px] text-right">لا توجد بصمات مفعّلة.</p>
                        ) : (
                          tmplBlueprints.map(bp => (
                            <div key={bp.id} className="p-2 bg-[#0a0a0f] rounded-lg border border-white/5 flex items-center justify-between flex-row-reverse">
                              <div className="text-right">
                                <span className="text-cyan-400 font-bold block">{bp.id}</span>
                                <span className="text-white text-[11px] block">{bp.reference}</span>
                              </div>
                              <button onClick={() => handleDeleteBlueprint(bp)} className="text-slate-500 hover:text-rose-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>

      {/* TEMPLATE MODAL */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md dir-rtl" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl text-right font-sans"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6 flex-row-reverse">
                <h3 className="text-lg font-black text-white text-right">
                  {editingTemplate ? 'تعديل قالب المكون' : 'إضافة قالب مكون جديد'}
                </h3>
                <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 text-right">اسم المكون / القالب *</label>
                  <input
                    type="text"
                    required
                    value={tmplName}
                    onChange={e => setTmplName(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 text-right"
                    placeholder="مثال: محرك كهربائي ثلاثي الأطوار"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 flex-row-reverse">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 text-right">مستوى الأهمية *</label>
                    <select
                      value={tmplCriticality}
                      onChange={e => setTmplCriticality(e.target.value)}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 font-mono text-right appearance-none"
                    >
                      <option value="Low">منخفضة (Low)</option>
                      <option value="Medium">متوسطة (Medium)</option>
                      <option value="High">عالية (High)</option>
                      <option value="Critical">حرجة جداً (Critical)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 text-right">العائلة الفنية *</label>
                    <select
                      value={tmplFamily}
                      onChange={e => setTmplFamily(e.target.value)}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 font-mono text-right appearance-none"
                    >
                      <option value="MEC">ميكانيك (MEC)</option>
                      <option value="ELE">كهرباء (ELE)</option>
                      <option value="HYD">هيدروليك (HYD)</option>
                      <option value="PNU">بنيوماتيك (PNU)</option>
                      <option value="ELN">إلكترونيك (ELN)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 text-right">وصف المكون ووظائفه</label>
                  <textarea
                    rows={2}
                    value={tmplDesc}
                    onChange={e => setTmplDesc(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 text-right"
                    placeholder="وصف اختياري..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 text-right">قطع الغيار المرتبطة (PDR Templates)</label>
                  <div className="h-32 overflow-y-auto bg-[#0a0a0f]/30 border border-white/10 rounded-xl p-2 custom-scrollbar space-y-1">
                    {pdrTemplates.map(pt => (
                      <label key={pt.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer flex-row-reverse justify-end">
                        <span className="text-sm text-slate-300 font-bold">{pt.name} <span className="text-slate-500 text-xs font-mono">({pt.skuBase})</span></span>
                        <input
                          type="checkbox"
                          checked={tmplLinkedPdrs.includes(pt.id)}
                          onChange={(e) => {
                            if (e.target.checked) setTmplLinkedPdrs(prev => [...prev, pt.id]);
                            else setTmplLinkedPdrs(prev => prev.filter(id => id !== pt.id));
                          }}
                          className="rounded bg-[#0a0a0f] border-white/20 text-orange-500 focus:ring-0 ml-2"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10 flex-row-reverse">
                  <button type="submit" className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-5 py-2 text-xs shadow-lg transition-all cursor-pointer">حفظ القالب</button>
                  <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BLUEPRINT MODAL */}
      <AnimatePresence>
        {isBlueprintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md dir-rtl" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl text-right font-sans"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-4 flex-row-reverse">
                <div className="text-right">
                  <h3 className="text-lg font-black text-white">إضافة بصمة تجارية جديدة</h3>
                  <p className="text-xs text-orange-400 font-mono mt-0.5">القالب: {selectedTemplateForBlueprint?.name}</p>
                </div>
                <button onClick={() => setIsBlueprintModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveBlueprint} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 text-right">الموديل / المرجع التجاري *</label>
                  <input
                    type="text"
                    required
                    value={bpReference}
                    onChange={e => setBpReference(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 text-right"
                    placeholder="مثال: Siemens 5.5kW 400V 1450RPM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 text-right">الشركة المصنعة (Brand)</label>
                  <input
                    type="text"
                    value={bpBrand}
                    onChange={e => setBpBrand(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 text-right"
                    placeholder="مثال: Siemens, Schneider, ABB..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 text-right">المواصفات الفنية والهندسية</label>
                  <textarea
                    rows={2}
                    value={bpSpecs}
                    onChange={e => setBpSpecs(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 text-right"
                    placeholder="بيانات الـ Datasheet..."
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10 flex-row-reverse">
                  <button type="submit" className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-5 py-2 text-xs shadow-lg transition-all cursor-pointer">تفعيل البصمة (Activate)</button>
                  <button type="button" onClick={() => setIsBlueprintModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
