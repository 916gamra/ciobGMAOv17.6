import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  X, Save, Component, CheckCircle2, Settings, Boxes, Search, 
  Info, Plus, ChevronRight, LayoutGrid, FileText, ArrowLeft, 
  ArrowRight, Zap, Cpu, Droplets, Trash2, Edit2, Play, Layout, Hammer, Eye
} from 'lucide-react';
import { db } from '@/core/db';
import { toast } from 'sonner';

interface BlueprintAssemblyModalProps {
  blueprintId: string | null;
  onClose: () => void;
  user: any;
}

export function BlueprintAssemblyModal({ blueprintId, onClose, user }: BlueprintAssemblyModalProps) {
  // Queries
  const blueprint = useLiveQuery(() => 
    blueprintId ? db.machineBlueprints.get(blueprintId) : null
  , [blueprintId]);

  // Part Catalogue & Component queries
  const pdrTemplates = useLiveQuery(() => db.pdrTemplates.toArray(), []) || [];
  const pdrFamilies = useLiveQuery(() => db.pdrFamilies.toArray(), []) || [];
  const pdrBlueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []) || [];
  const componentBlueprints = useLiveQuery(() => db.componentBlueprints.toArray(), []) || [];
  const componentTemplates = useLiveQuery(() => db.componentTemplates.toArray(), []) || [];

  // Modal display view: 'details' | 'advanced_edit' | 'wizard'
  const [view, setView] = useState<'details' | 'advanced_edit' | 'wizard'>('details');

  // Local state for the advanced edit tab
  const [leftTab, setLeftTab] = useState<'components' | 'pdrCatalog' | 'parts'>('components');

  // Local State for selections
  const [selectedPartTemplateIds, setSelectedPartTemplateIds] = useState<string[]>([]);
  const [selectedPdrBlueprintIds, setSelectedPdrBlueprintIds] = useState<string[]>([]);
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [pdrSearchTerm, setPdrSearchTerm] = useState('');
  const [componentSearchTerm, setComponentSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardSelectedFamilyId, setWizardSelectedFamilyId] = useState<string>('');
  const [wizardSelectedTemplateId, setWizardSelectedTemplateId] = useState<string>('');
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isSubmittingWizard, setIsSubmittingWizard] = useState(false);

  // Step 1: New Family Form Data
  const [newFamilyData, setNewFamilyData] = useState({
    name: '',
    group: 'mecanique' as 'mecanique' | 'hydraulique' | 'electronique' | 'pneumatique' | 'electrique' | 'autre',
    description: ''
  });

  // Step 2: New Template Form Data
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    skuBase: '',
    description: ''
  });

  // Step 3: New Blueprint Form Data
  const [newBlueprintData, setNewBlueprintData] = useState({
    model: '',
    powerOrForce: '',
    technicalSpecs: '',
    unit: 'Pcs',
    minThreshold: 2
  });

  // Sync state with db loaded model
  useEffect(() => {
    if (blueprint) {
      setSelectedPartTemplateIds(blueprint.partTemplateIds || []);
      setSelectedPdrBlueprintIds(blueprint.pdrBlueprintIds || []);
      setSelectedComponentIds(blueprint.componentIds || blueprint.componentBlueprintIds || []);
    }
  }, [blueprint]);

  // Reset wizard states on view change to wizard
  useEffect(() => {
    if (view === 'wizard') {
      setWizardStep(1);
      setWizardSelectedFamilyId('');
      setWizardSelectedTemplateId('');
      setIsCreatingFamily(false);
      setIsCreatingTemplate(false);
      setNewFamilyData({ name: '', group: 'mecanique', description: '' });
      setNewTemplateData({ name: '', skuBase: '', description: '' });
      setNewBlueprintData({
        model: '',
        powerOrForce: '',
        technicalSpecs: '',
        unit: 'Pcs',
        minThreshold: 2
      });
    }
  }, [view]);

  // Filter part templates, components and commercial parts selected
  const selectedPartTemplates = pdrTemplates.filter(pt => selectedPartTemplateIds.includes(pt.id));
  const selectedPdrBlueprints = pdrBlueprints.filter(bp => selectedPdrBlueprintIds.includes(bp.id));
  const selectedComponents = componentBlueprints.filter(sc => selectedComponentIds.includes(sc.id));

  // Filtered components search list
  const filteredComponentBlueprints = componentBlueprints.filter(sc => {
    if (!componentSearchTerm.trim()) return true;
    const term = componentSearchTerm.toLowerCase();
    const temp = componentTemplates.find(t => t.id === sc.templateId);
    return (
      (temp?.name || '').toLowerCase().includes(term) ||
      (temp?.family || '').toLowerCase().includes(term) ||
      sc.reference.toLowerCase().includes(term) ||
      (sc.brand || '').toLowerCase().includes(term)
    );
  });

  // Filtered PDR commercial blueprints search list
  const filteredPdrBlueprints = pdrBlueprints.filter(bp => {
    if (!pdrSearchTerm.trim()) return true;
    const term = pdrSearchTerm.toLowerCase();
    return (
      bp.reference.toLowerCase().includes(term) ||
      bp.id.toLowerCase().includes(term) ||
      (bp.model && bp.model.toLowerCase().includes(term))
    );
  });

  // Wizard Step 3: Nomenclature ID calculator (999 slots rule)
  const slotDetails = useMemo(() => {
    if (!wizardSelectedTemplateId) return { num: 1, activeId: '', isMax: false };
    const template = pdrTemplates.find(t => t.id === wizardSelectedTemplateId);
    if (!template) return { num: 1, activeId: '', isMax: false };

    const templateBlueprints = pdrBlueprints.filter(b => b.templateId === wizardSelectedTemplateId);
    const existingIds = new Set(templateBlueprints.map(b => b.id));

    let found = false;
    let slotNum = 1;
    let activeSlotId = '';

    for (let i = 1; i <= 999; i++) {
      const candidateId = `PDR-${template.skuBase.replace('-', '')}-${i.toString().padStart(3, '0')}`.toUpperCase();
      if (!existingIds.has(candidateId)) {
        slotNum = i;
        activeSlotId = candidateId;
        found = true;
        break;
      }
    }

    return {
      num: slotNum,
      activeId: activeSlotId,
      isMax: !found
    };
  }, [wizardSelectedTemplateId, pdrTemplates, pdrBlueprints]);

  const handleToggleComponent = (componentId: string) => {
    setSelectedComponentIds(prev =>
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  const handleTogglePartTemplate = (partTemplateId: string) => {
    setSelectedPartTemplateIds(prev => 
      prev.includes(partTemplateId) 
        ? prev.filter(id => id !== partTemplateId) 
        : [...prev, partTemplateId]
    );
  };

  const handleTogglePdrBlueprint = (blueprintId: string) => {
    const pdrBp = pdrBlueprints.find(b => b.id === blueprintId);
    setSelectedPdrBlueprintIds(prev => {
      const isAdding = !prev.includes(blueprintId);
      if (isAdding) {
        if (pdrBp && pdrBp.templateId) {
          setSelectedPartTemplateIds(tPrev => {
            if (!tPrev.includes(pdrBp.templateId)) {
              return [...tPrev, pdrBp.templateId];
            }
            return tPrev;
          });
        }
        return [...prev, blueprintId];
      } else {
        return prev.filter(id => id !== blueprintId);
      }
    });
  };

  const handleSaveAssembly = async (
    customTemplates?: string[], 
    customBlueprints?: string[], 
    customComponents?: string[]
  ) => {
    setIsSaving(true);
    const templatesToSave = customTemplates || selectedPartTemplateIds;
    const blueprintsToSave = customBlueprints || selectedPdrBlueprintIds;
    const componentsToSave = customComponents || selectedComponentIds;

    try {
      await db.transaction('rw', [
        db.machineBlueprints, 
        db.auditLogs
      ], async () => {
        await db.machineBlueprints.update(blueprint.id, {
          componentIds: componentsToSave,
          componentBlueprintIds: componentsToSave,
          partTemplateIds: templatesToSave,
          pdrBlueprintIds: blueprintsToSave
        });

        // Add audit trail log
        await db.auditLogs.add({
          id: crypto.randomUUID(),
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'ASSEMBLE_BLUEPRINT',
          entityType: 'MACHINE_BLUEPRINT',
          entityId: blueprint.id,
          details: `Updated BOM configuration for machine blueprint ${blueprint.reference}. Linked ${componentsToSave.length} components, ${templatesToSave.length} templates, and ${blueprintsToSave.length} PDR parts.`,
          timestamp: new Date().toISOString(),
          severity: 'INFO',
          deviceInfo: navigator.userAgent
        });
      });

      toast.success('تم حفظ مواصفات التجميع بنجاح!', {
        description: 'تم تحديث قائمة المكونات، وقطع الغيار وقوالب المواصفات المرتبطة بنموذج الآلة.'
      });
      
      // Update state locally
      setSelectedComponentIds(componentsToSave);
      setSelectedPartTemplateIds(templatesToSave);
      setSelectedPdrBlueprintIds(blueprintsToSave);
      setView('details');
    } catch (error: any) {
      console.error(error);
      toast.error('فشل في حفظ هيكل تجميع الآلة', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Wizard: Create Family inline
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyData.name.trim()) {
      toast.error('الرجاء إدخال اسم العائلة بشكل صحيح');
      return;
    }
    setIsSubmittingWizard(true);
    try {
      const code = newFamilyData.name.trim().substring(0, 3).toUpperCase();
      const familyId = `fam-${code}-${crypto.randomUUID().substring(0, 4)}`;
      const createdAt = new Date().toISOString();

      await db.pdrFamilies.add({
        id: familyId,
        name: newFamilyData.name.trim().toUpperCase(),
        description: newFamilyData.description.trim() || `${newFamilyData.name} Spare Parts Family`,
        group: newFamilyData.group,
        createdAt
      });

      toast.success('تم إنشاء عائلة قطع غيار جديدة وتفعيلها!');
      setWizardSelectedFamilyId(familyId);
      setIsCreatingFamily(false);
      setWizardStep(2);
    } catch (err: any) {
      toast.error('فشل في إنشاء العائلة: ' + err.message);
    } finally {
      setIsSubmittingWizard(false);
    }
  };

  // Wizard: Create Template inline
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateData.name.trim() || !newTemplateData.skuBase.trim()) {
      toast.error('الرجاء ملء اسم القالب ورمز البادئة');
      return;
    }
    if (!wizardSelectedFamilyId) {
      toast.error('لم يتم تحديد عائلة الأجزاء الأب');
      return;
    }
    setIsSubmittingWizard(true);
    try {
      const sanitizedSku = newTemplateData.skuBase.replace(/\s+/g, '-').toUpperCase();
      const templateId = `temp-${sanitizedSku}`;
      const createdAt = new Date().toISOString();

      // Check duplicate
      const existing = await db.pdrTemplates.get(templateId);
      if (existing) {
        throw new Error(`بادئة الكود '${sanitizedSku}' مسجلة بالفعل لقالب آخر.`);
      }

      await db.pdrTemplates.add({
        id: templateId,
        familyId: wizardSelectedFamilyId,
        name: newTemplateData.name.trim(),
        skuBase: sanitizedSku,
        description: newTemplateData.description.trim() || `${newTemplateData.name} Specification Template`,
        createdAt
      });

      toast.success('تم تسجيل قالب المواصفات الجديد بنجاح!');
      setWizardSelectedTemplateId(templateId);
      setIsCreatingTemplate(false);
      setWizardStep(2); // Keep on step 2 but selected
    } catch (err: any) {
      toast.error('فشل في تسجيل القالب: ' + err.message);
    } finally {
      setIsSubmittingWizard(false);
    }
  };

  // Wizard: Finish at Template Stage (Stop at Step 2)
  const handleLinkTemplateOnlyAndFinish = async () => {
    if (!wizardSelectedTemplateId) {
      toast.error('الرجاء تحديد قالب مواصفات لربطه');
      return;
    }

    const nextTemplates = [...selectedPartTemplateIds];
    if (!nextTemplates.includes(wizardSelectedTemplateId)) {
      nextTemplates.push(wizardSelectedTemplateId);
    }

    await handleSaveAssembly(nextTemplates, selectedPdrBlueprintIds);
    toast.success('تم ربط قالب المواصفات بنجاح بالآلة دون تفعيل قطعة غيار تجارية!');
  };

  // Wizard: Create commercial part and link (Step 3)
  const handleCreateBlueprintPdr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardSelectedTemplateId) {
      toast.error('لم يتم اختيار قالب المواصفات');
      return;
    }
    if (!newBlueprintData.model.trim() || !newBlueprintData.powerOrForce.trim() || !newBlueprintData.technicalSpecs.trim()) {
      toast.error('الرجاء ملء حقول الموديل، القدرة، والمواصفات الفنية بشكل كامل');
      return;
    }
    if (slotDetails.isMax) {
      toast.error('تم تجاوز الحد الأقصى للمقاعد المتاحة (999 مقعد) لهذا القالب!');
      return;
    }

    setIsSubmittingWizard(true);
    try {
      const createdAt = new Date().toISOString();
      const blueprintId = slotDetails.activeId;

      // Add to Catalog
      await db.pdrBlueprints.add({
        id: blueprintId,
        templateId: wizardSelectedTemplateId,
        reference: blueprintId, // nomenclature code is the primary reference
        unit: newBlueprintData.unit,
        minThreshold: Number(newBlueprintData.minThreshold) || 2,
        model: newBlueprintData.model.trim(),
        powerOrForce: newBlueprintData.powerOrForce.trim(),
        technicalSpecs: newBlueprintData.technicalSpecs.trim(),
        createdAt
      });

      // Update machine blueprint linkages (add both template and blueprint if not already present)
      const nextTemplates = [...selectedPartTemplateIds];
      if (!nextTemplates.includes(wizardSelectedTemplateId)) {
        nextTemplates.push(wizardSelectedTemplateId);
      }

      const nextBlueprints = [...selectedPdrBlueprintIds];
      if (!nextBlueprints.includes(blueprintId)) {
        nextBlueprints.push(blueprintId);
      }

      await handleSaveAssembly(nextTemplates, nextBlueprints);
      toast.success(`تم إنشاء قطعة الغيار التجارية ${blueprintId} وربطها بنموذج الآلة بنجاح!`);
    } catch (err: any) {
      toast.error('فشل في حفظ قطعة الغيار: ' + err.message);
    } finally {
      setIsSubmittingWizard(false);
    }
  };

  const getSystemGroupColor = (group: string) => {
    switch (group) {
      case 'mecanique': return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      case 'hydraulique': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      case 'electronique': return 'text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/5';
      case 'pneumatique': return 'text-sky-400 border-sky-500/20 bg-sky-500/5';
      case 'electrique': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
      default: return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
    }
  };

  if (!blueprintId || !blueprint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-lg"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-5xl max-h-[92vh] h-full glass-panel-heavy rounded-3xl overflow-hidden flex flex-col bg-[#06070d] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.9)]"
      >
        {/* Top Glow bar */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-teal-400" />
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              {view === 'wizard' ? (
                <Boxes className="w-6 h-6 text-cyan-400 animate-bounce" />
              ) : view === 'advanced_edit' ? (
                <Settings className="w-6 h-6 text-amber-400 animate-spin-slow" />
              ) : (
                <Component className="w-6 h-6 text-indigo-400 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {view === 'details' ? 'Specifications & BOM DNA' : view === 'advanced_edit' ? 'Advanced BOM Editor' : 'Link Spare Part Wizard'}
                </span>
                <span className="text-xs text-slate-500 font-mono">[{blueprint.reference}]</span>
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight mt-1">
                {blueprint.brand} {blueprint.model}
              </h2>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Views Container */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* VIEW 1: DETAILS & BOM OVERVIEW */}
            {view === 'details' && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="w-full h-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden"
              >
                {/* Left Column: Spec Sheet */}
                <div className="lg:col-span-5 p-6 border-r border-white/5 overflow-y-auto custom-scrollbar flex flex-col gap-5 bg-white/[0.01]">
                  <div>
                    <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Layout className="w-4 h-4" /> بطاقة المواصفات الفنية للآلة
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      التعريف الجيني والتفاصيل الهندسية الأساسية المسجلة لنموذج هذا الهيكل الصناعي.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">الشركة المصنعة / Brand</span>
                      <span className="text-sm font-bold text-slate-200">{blueprint.brand || 'Unspecified'}</span>
                    </div>

                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">الموديل / Model Number</span>
                      <span className="text-sm font-bold text-slate-200">{blueprint.model || 'Unspecified'}</span>
                    </div>

                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">مصدر الطاقة والتشغيل / Energy Source</span>
                      <span className="text-sm font-semibold text-slate-200 capitalize">{blueprint.energySource || 'Mixed / electric'}</span>
                    </div>

                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">القدرة الفنية / Power or Force</span>
                      <span className="text-sm font-mono text-indigo-300 font-bold">{blueprint.powerOrForce || 'N/A'}</span>
                    </div>

                    {blueprint.category && (
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">الفئة / Classification Category</span>
                        <span className="text-xs font-semibold text-slate-300">{blueprint.category}</span>
                      </div>
                    )}

                    <div className="p-4 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> المواصفات الهندسية الخاصة
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {blueprint.technicalSpecs || 'لا توجد ملاحظات تقنية إضافية مسجلة لهذا النموذج.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Physical Assembly BOM */}
                <div className="lg:col-span-7 p-6 bg-[#0a0a0f]/40 overflow-y-auto custom-scrollbar flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[11px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Boxes className="w-4 h-4" /> هيكل قطع الغيار المرتبطة (BOM)
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        قوالب المواصفات والأجزاء التجارية المرتبطة حالياً بهيكل الآلة هذا.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setView('wizard')}
                        className="py-2 px-3.5 bg-cyan-500 hover:bg-cyan-400 text-[#050508] font-black rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> ربط قطعة غيار
                      </button>
                      <button 
                        onClick={() => setView('advanced_edit')}
                        className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5" /> تعديل التجميع
                      </button>
                    </div>
                  </div>

                  {/* BOM Render list */}
                  {selectedComponents.length === 0 && selectedPartTemplates.length === 0 && selectedPdrBlueprints.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl p-10 min-h-[300px] bg-[#0a0a0f]/20">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                        <Component className="w-8 h-8 text-slate-600 animate-pulse" />
                      </div>
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-widest text-center">جدول المكونات فارغ (BOM Empty)</p>
                      <p className="text-xs text-slate-500 text-center max-w-sm mt-2 leading-relaxed">
                        لم يتم ربط أي مكونات، مواصفات أو قطع غيار تجارية بعد. اضغط على زر **"ربط قطعة غيار"** للبدء في تجميع الهيكل بشكل مرن.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Sub-Systems & Machine Assemblies */}
                      {selectedComponents.length > 0 && (
                        <div className="p-4 bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl space-y-3">
                          <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-wider font-mono flex items-center gap-2">
                            🧩 Sub-Systems & Machine Assemblies ({selectedComponents.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {selectedComponents.map(sc => (
                              <div key={sc.id} className="p-3 rounded-xl bg-[#0a0a0f]/60 border border-purple-500/20 text-xs text-slate-200 flex flex-col gap-1.5 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 uppercase font-mono border border-purple-500/20">
                                    {sc.id}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">
                                    {componentTemplates.find(t => t.id === sc.templateId)?.family || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-bold text-white text-xs truncate">{componentTemplates.find(t => t.id === sc.templateId)?.name || 'Unknown'}</p>
                                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                    مكون آلة رئيسي • {componentTemplates.find(t => t.id === sc.templateId)?.criticality || 'عالي الأهمية'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Commercial Spare Parts */}
                      {selectedPdrBlueprints.length > 0 && (
                        <div className="p-4 bg-cyan-500/[0.02] border border-cyan-500/10 rounded-2xl space-y-3">
                          <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
                            🛠️ Commercial Spare Parts ({selectedPdrBlueprints.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {selectedPdrBlueprints.map(bp => {
                              const tmpl = pdrTemplates.find(t => t.id === bp.templateId);
                              return (
                                <div key={bp.id} className="p-3 rounded-xl bg-[#0a0a0f]/60 border border-white/5 text-xs text-slate-200 flex flex-col gap-1.5 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 uppercase font-mono border border-cyan-500/20">{bp.id}</span>
                                    <span className="text-[9px] text-slate-500 font-medium truncate max-w-[120px]">{tmpl?.name}</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-white text-xs truncate">{bp.reference}</p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{bp.model} • {bp.powerOrForce}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Part Templates */}
                      {selectedPartTemplates.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-wider font-mono px-1 flex items-center gap-1.5">
                            📦 Component Part Templates ({selectedPartTemplates.length})
                          </h4>
                          {pdrFamilies.map(fam => {
                            const associatedInFam = selectedPartTemplates.filter(pt => pt.familyId === fam.id);
                            if (associatedInFam.length === 0) return null;

                            return (
                              <div key={fam.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono mb-2 pb-1.5 border-b border-white/5 flex items-center justify-between">
                                  <span>📁 {fam.name}</span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded border font-sans ${getSystemGroupColor(fam.group || '')}`}>
                                    {fam.group?.toUpperCase() || 'SYSTEM'}
                                  </span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {associatedInFam.map(pt => (
                                    <div key={pt.id} className="p-2.5 rounded-xl bg-[#0a0a0f]/40 border border-white/5 text-xs text-slate-200 flex items-center gap-3">
                                      <div className="w-7 h-7 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-bold font-mono border border-indigo-500/20 shrink-0">
                                        {pt.skuBase.substring(0, 2)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white truncate">{pt.name}</p>
                                        <p className="text-[9px] text-slate-500 font-mono truncate mt-0.5">{pt.skuBase}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* VIEW 2: ADVANCED EDIT CHECKLIST */}
            {view === 'advanced_edit' && (
              <motion.div 
                key="advanced_edit"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="w-full h-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden"
              >
                {/* Left Column: Selection lists */}
                <div className="p-6 border-r border-white/5 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                  <div className="flex gap-1.5 p-1 bg-[#0a0a0f]/40 border border-white/5 rounded-xl mb-5 shrink-0">
                    <button 
                      onClick={() => setLeftTab('components')}
                      className={`flex-1 py-2 px-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                        leftTab === 'components' 
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Component className="w-3.5 h-3.5" /> 1. Components
                    </button>
                    <button 
                      onClick={() => setLeftTab('pdrCatalog')}
                      className={`flex-1 py-2 px-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                        leftTab === 'pdrCatalog' 
                          ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/10' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5" /> 2. PDR Catalog
                    </button>
                    <button 
                      onClick={() => setLeftTab('parts')}
                      className={`flex-1 py-2 px-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                        leftTab === 'parts' 
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" /> 3. Templates
                    </button>
                  </div>

                  <div className="flex-1 min-h-0">
                    {leftTab === 'components' && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                            🧩 Sub-Systems & Components Assemblies
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            حدد المكونات والتجميعات الوظيفية الكبرى (محركات، مضخات، مخفضات سرعة) المرتبطة بهذه الآلة.
                          </p>
                        </div>

                        <div className="relative shrink-0">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text"
                            placeholder="البحث اسم المكون أو العائلة..."
                            value={componentSearchTerm}
                            onChange={(e) => setComponentSearchTerm(e.target.value)}
                            className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                          />
                        </div>

                        {filteredComponentBlueprints.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/5 rounded-2xl bg-[#0a0a0f]/20 min-h-[200px]">
                            <Component className="w-10 h-10 text-slate-600 mb-2" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">لا توجد مكونات مسجلة مطابقة</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                            {filteredComponentBlueprints.map(sc => {
                              const isChecked = selectedComponentIds.includes(sc.id);
                              const temp = componentTemplates.find(t => t.id === sc.templateId);
                              return (
                                <div 
                                  key={sc.id}
                                  onClick={() => handleToggleComponent(sc.id)}
                                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                                    isChecked 
                                      ? 'bg-purple-500/10 border-purple-500/40 text-purple-300' 
                                      : 'bg-[#0a0a0f]/30 border-white/5 hover:border-white/10 text-slate-300'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold flex items-center gap-2">
                                      {temp?.name || 'Unknown'} 
                                      <span className="text-[9px] px-1.5 rounded-sm bg-[#0a0a0f]/40 text-slate-500 border border-white/5">{sc.reference}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 uppercase truncate font-mono">
                                      {temp?.family || 'N/A'} {sc.brand ? `• ${sc.brand}` : ''}
                                    </div>
                                  </div>
                                  <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full border border-white/10 bg-[#0a0a0f]/50">
                                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {leftTab === 'parts' && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                            📦 Raw Part Templates (BOM Definitions)
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed">حدد قوالب مواصفات الأجزاء التي تناسب مكونات هيكل هذه الآلة مباشرة.</p>
                        </div>

                        {pdrTemplates.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl p-8 bg-white/[0.01] min-h-[220px]">
                            <Component className="w-12 h-12 text-slate-600 mb-2" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">No templates registered</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {pdrFamilies.map(fam => {
                              const templatesInFam = pdrTemplates.filter(t => t.familyId === fam.id);
                              if (templatesInFam.length === 0) return null;

                              return (
                                <div key={fam.id} className="p-4 bg-[#0a0a0f]/20 border border-white/5 rounded-2xl">
                                  <h4 className="text-xs font-bold text-amber-400/80 uppercase tracking-wider font-mono mb-3 pb-1.5 border-b border-white/5">
                                    📁 {fam.name}
                                  </h4>
                                  <div className="space-y-2">
                                    {templatesInFam.map(tmpl => {
                                      const isChecked = selectedPartTemplateIds.includes(tmpl.id);
                                      return (
                                        <div 
                                          key={tmpl.id}
                                          onClick={() => handleTogglePartTemplate(tmpl.id)}
                                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                                            isChecked 
                                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                                              : 'bg-[#0a0a0f]/30 border-white/5 hover:border-white/10 text-slate-300'
                                          }`}
                                        >
                                          <div className="flex flex-col">
                                            <p className="font-bold">{tmpl.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Base Sku: {tmpl.skuBase}</p>
                                          </div>
                                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                                            isChecked 
                                              ? 'bg-amber-500 border-amber-500 text-black' 
                                              : 'border-white/20'
                                          }`}>
                                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {leftTab === 'pdrCatalog' && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                            🛠️ Commercial Spare Parts (BDR Catalogue)
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans">حدد لربط أجزاء مادية تجارية من الكتالوج المركزي لتوريثها لآلات هذا النموذج.</p>
                        </div>

                        <div className="relative shrink-0">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text"
                            placeholder="البحث بالرمز أو الموديل..."
                            value={pdrSearchTerm}
                            onChange={(e) => setPdrSearchTerm(e.target.value)}
                            className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                          />
                        </div>

                        {filteredPdrBlueprints.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/5 rounded-2xl bg-[#0a0a0f]/20 min-h-[200px]">
                            <Boxes className="w-10 h-10 text-slate-600 mb-2" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">لا توجد قطع مطابقة للبحث</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                            {filteredPdrBlueprints.map(bp => {
                              const isChecked = selectedPdrBlueprintIds.includes(bp.id);
                              const tmpl = pdrTemplates.find(t => t.id === bp.templateId);
                              const fam = tmpl ? pdrFamilies.find(f => f.id === tmpl.familyId) : null;
                              return (
                                <div 
                                  key={bp.id}
                                  onClick={() => handleTogglePdrBlueprint(bp.id)}
                                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                                    isChecked 
                                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' 
                                      : 'bg-[#0a0a0f]/30 border-white/5 hover:border-white/10 text-slate-300'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                      <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 font-mono">
                                        {bp.id}
                                      </span>
                                      {fam && (
                                        <span className="text-[8px] uppercase tracking-wider text-slate-400">
                                          {fam.name}
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-bold text-slate-100 truncate">{bp.reference}</p>
                                    <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{tmpl?.name || 'Spare Part'}</p>
                                  </div>
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                                    isChecked 
                                      ? 'bg-cyan-500 border-cyan-500 text-black' 
                                      : 'border-white/20'
                                  }`}>
                                    {isChecked && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Physical Assembly Summary */}
                <div className="p-6 bg-[#0a0a0f]/40 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4 flex-1 min-h-0">
                    <div>
                      <h3 className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-1 flex items-center gap-2">
                        📦 Physical Assembly BOM (قطع الغيار المرتبطة)
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        مراجعة التغييرات قبل تفعيل خطة تجميع المكونات بشكل مستدام على الآلة.
                      </p>
                    </div>

                    {selectedComponents.length === 0 && selectedPartTemplates.length === 0 && selectedPdrBlueprints.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl p-8 min-h-[220px]">
                        <Component className="w-12 h-12 text-slate-600 mb-2" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">لم تختر عناصر بعد</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedComponents.length > 0 && (
                          <div className="p-4 bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl">
                            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                              🧩 Selected Machine Components ({selectedComponents.length})
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {selectedComponents.map(sc => (
                                <div key={sc.id} className="p-2.5 rounded-xl bg-[#0a0a0f]/40 border border-purple-500/20 text-xs text-slate-200 flex items-center justify-between">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">{sc.id}</span>
                                    <p className="font-semibold text-white truncate mt-1">{componentTemplates.find(t => t.id === sc.templateId)?.name || 'Unknown'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedPdrBlueprints.length > 0 && (
                          <div className="p-4 bg-cyan-500/[0.02] border border-cyan-500/20 rounded-2xl">
                            <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                              🛠️ Selected Commercial Parts ({selectedPdrBlueprints.length})
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {selectedPdrBlueprints.map(bp => (
                                <div key={bp.id} className="p-2.5 rounded-xl bg-[#0a0a0f]/40 border border-white/5 text-xs text-slate-200 flex items-center justify-between">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">{bp.id}</span>
                                    <p className="font-semibold text-white truncate mt-1">{bp.reference}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedPartTemplates.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider font-mono px-2">
                              📦 Selected Component Templates ({selectedPartTemplates.length})
                            </h4>
                            {pdrFamilies.map(fam => {
                              const associatedInFam = selectedPartTemplates.filter(pt => pt.familyId === fam.id);
                              if (associatedInFam.length === 0) return null;

                              return (
                                <div key={fam.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">📁 {fam.name}</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {associatedInFam.map(pt => (
                                      <div key={pt.id} className="p-2.5 rounded-xl bg-[#0a0a0f]/40 border border-white/5 text-xs text-slate-200 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-mono">{pt.skuBase.substring(0,2)}</div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-semibold truncate">{pt.name}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/5 flex gap-3 bg-white/[0.01] mt-auto">
                    <button
                      type="button"
                      onClick={() => setView('details')}
                      className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      إلغاء والعودة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAssembly()}
                      disabled={isSaving}
                      className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-[#050508] font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'جاري الحفظ...' : 'تطبيق المواصفات والتجميع'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW 3: POPUP WIZARD FOR DIRECT CREATION & LINK */}
            {view === 'wizard' && (
              <motion.div 
                key="wizard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full flex flex-col overflow-hidden"
              >
                {/* Steps Navigator */}
                <div className="px-8 pt-5 pb-2 bg-white/[0.01] border-b border-white/5 shrink-0">
                  <div className="flex items-center justify-between relative max-w-xl mx-auto">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 z-0" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-cyan-500 z-0 transition-all duration-300" style={{ width: `${((wizardStep - 1) / 2) * 100}%` }} />
                    
                    {[1, 2, 3].map((num) => (
                      <div 
                        key={num}
                        className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all ${
                          wizardStep >= num 
                            ? 'bg-cyan-500 text-black border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                            : 'bg-[#0a0a0f] text-slate-500 border border-white/10'
                        }`}
                      >
                        {wizardStep > num ? <CheckCircle2 className="w-4 h-4" /> : num}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 px-1 max-w-xl mx-auto">
                    <span>1. Family (العائلة)</span>
                    <span>2. Template (القالب)</span>
                    <span>3. Commercial Part (القطعة التجارية)</span>
                  </div>
                </div>

                {/* Wizard Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 max-w-2xl mx-auto w-full">
                  
                  {/* STEP 1: SELECT OR CREATE FAMILY */}
                  {wizardStep === 1 && (
                    <div className="space-y-6">
                      <div className="border-b border-white/5 pb-2">
                        <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          📁 الخطوة 1: حدد عائلة تصنيف قطعة الغيار
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          اختر التصنيف الفني للقطعة (ميكانيك، كهرباء، هيدروليك...) لتأطير المعايير الهندسية.
                        </p>
                      </div>

                      {!isCreatingFamily ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">اختر عائلة مسجلة / Select Family</label>
                            <select
                              value={wizardSelectedFamilyId}
                              onChange={e => setWizardSelectedFamilyId(e.target.value)}
                              className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all appearance-none"
                            >
                              <option value="">--- اختر عائلة قطع الغيار المسجلة ---</option>
                              {pdrFamilies.map(fam => (
                                <option key={fam.id} value={fam.id}>
                                  {fam.name} ({fam.group?.toUpperCase() || 'SYSTEM'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="p-5 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-center space-y-3">
                            <p className="text-xs text-slate-400 font-sans">
                              هل عائلة قطع الغيار غير متواجدة؟ قم بتسجيل وتصنيف عائلة جديدة في المعمل مباشرة.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsCreatingFamily(true)}
                              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> إضافة عائلة تصنيف جديدة
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleCreateFamily} className="space-y-4 border border-cyan-500/20 bg-cyan-500/[0.02] p-5 rounded-2xl">
                          <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3">
                            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Plus className="w-4 h-4" /> إضافة عائلة جديدة للمصنع
                            </span>
                            <button 
                              type="button" 
                              onClick={() => setIsCreatingFamily(false)}
                              className="text-[10px] text-slate-400 hover:text-white underline"
                            >
                              الرجوع للقائمة المسجلة
                            </button>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">اسم العائلة بالإنجليزية (مثل: ROULEMENTS)</label>
                            <input
                              type="text"
                              required
                              value={newFamilyData.name}
                              onChange={e => setNewFamilyData({ ...newFamilyData, name: e.target.value })}
                              className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                              placeholder="e.g. CYLINDRES, VANNE, ROULEMENTS"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">القسم الفني / System Group</label>
                            <select
                              value={newFamilyData.group}
                              onChange={e => setNewFamilyData({ ...newFamilyData, group: e.target.value as any })}
                              className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all appearance-none"
                            >
                              <option value="mecanique">MÉCANIQUE (ميكانيك)</option>
                              <option value="hydraulique">HYDRAULIQUE (هيدروليك)</option>
                              <option value="electronique">ÉLECTRONIQUE (إلكترونيات)</option>
                              <option value="electrique">ÉLECTRIQUE (كهرباء)</option>
                              <option value="pneumatique">PNEUMATIQUE (نيوماتيك)</option>
                              <option value="autre">AUTRE (أخرى)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">وصف العائلة / Description</label>
                            <textarea
                              value={newFamilyData.description}
                              onChange={e => setNewFamilyData({ ...newFamilyData, description: e.target.value })}
                              className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all h-20 resize-none font-sans"
                              placeholder="أدخل وصفاً مبسطاً لنوعية قطع الغيار التي يصنفها هذا النظام..."
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingWizard}
                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-[#050508] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {isSubmittingWizard ? 'جاري الحفظ والإنشاء...' : 'حفظ وتفعيل عائلة قطع الغيار'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* STEP 2: SELECT OR CREATE TEMPLATE */}
                  {wizardStep === 2 && (
                    <div className="space-y-6">
                      <div className="border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            {pdrFamilies.find(f => f.id === wizardSelectedFamilyId)?.name || 'Family Selected'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          📦 الخطوة 2: حدد قالب المواصفات الهندسية (Template)
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          قالب المعرفة المجرّد يحدد بادئة الرمز (SKU) والهيكل الهندسي المشترك للقطع.
                        </p>
                      </div>

                      {!isCreatingTemplate ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">اختر قالباً مسجلاً / Select Template</label>
                            <select
                              value={wizardSelectedTemplateId}
                              onChange={e => setWizardSelectedTemplateId(e.target.value)}
                              className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all appearance-none"
                            >
                              <option value="">--- اختر قالب المواصفات الفنية ---</option>
                              {pdrTemplates
                                .filter(t => t.familyId === wizardSelectedFamilyId)
                                .map(temp => (
                                  <option key={temp.id} value={temp.id}>
                                    {temp.name} (بادئة الكود: {temp.skuBase})
                                  </option>
                                ))
                              }
                            </select>
                          </div>

                          <div className="p-5 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-center space-y-3">
                            <p className="text-xs text-slate-400 font-sans">
                              هل ترغب في تسجيل مواصفات تقنية فريدة تملك كود SKU مخصص؟ قم بإنشاء قالب جديد.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsCreatingTemplate(true)}
                              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> إضافة قالب مواصفات جديد
                            </button>
                          </div>

                          {/* Possibility to Stop at Template Stage */}
                          {wizardSelectedTemplateId && (
                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl space-y-3 flex flex-col items-center text-center">
                              <Info className="w-5 h-5 text-indigo-400" />
                              <div>
                                <p className="text-xs font-bold text-indigo-300">إمكانية الاكتفاء بالقالب الهندسي (Lite Mode)</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                                  كما اتفقنا، يمكنك التوقف عند مرحلة القالب الهندسي وربطه بالآلة دون الحاجة لتعريف قطعة غيار تجارية محددة حالياً.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleLinkTemplateOnlyAndFinish}
                                className="w-full max-w-sm py-2.5 bg-indigo-500 hover:bg-indigo-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" /> ربط هذا القالب بالآلة والإنهاء فورا
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={handleCreateTemplate} className="space-y-4 border border-cyan-500/20 bg-cyan-500/[0.02] p-5 rounded-2xl">
                          <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3">
                            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Plus className="w-4 h-4" /> إنشاء قالب مواصفات جديد
                            </span>
                            <button 
                              type="button" 
                              onClick={() => setIsCreatingTemplate(false)}
                              className="text-[10px] text-slate-400 hover:text-white underline"
                            >
                              الرجوع للمواصفات المسجلة
                            </button>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">اسم قالب المواصفات (مثل: Roulement à Billes 62xx)</label>
                            <input
                              type="text"
                              required
                              value={newTemplateData.name}
                              onChange={e => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                              className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                              placeholder="e.g. Capteur Inductif M12, Roulement Standard Ball 6xxx"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">بادئة الكود الفني (مثل RLM)</label>
                              <span className="text-[8px] font-mono text-cyan-400">قاعدة الـ 999 مقعد تولد تلقائياً: RLM-001</span>
                            </div>
                            <input
                              type="text"
                              required
                              value={newTemplateData.skuBase}
                              onChange={e => setNewTemplateData({ ...newTemplateData, skuBase: e.target.value })}
                              className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                              placeholder="e.g. RLM, MOT-E, CAP"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">تفاصيل المواصفات الفنية / Description</label>
                            <textarea
                              value={newTemplateData.description}
                              onChange={e => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
                              className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all h-20 resize-none font-sans"
                              placeholder="صف المعايير الفنية والكهربائية أو الميكانيكية الموحدة في هذا القالب..."
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingWizard}
                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-[#050508] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {isSubmittingWizard ? 'جاري الحفظ...' : 'حفظ وتفعيل قالب المواصفات'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* STEP 3: CREATE COMMERCIAL BLUEPRINT PDR */}
                  {wizardStep === 3 && (
                    <form onSubmit={handleCreateBlueprintPdr} className="space-y-6">
                      <div className="border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                            {pdrFamilies.find(f => f.id === wizardSelectedFamilyId)?.name || 'Family'}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                            {pdrTemplates.find(t => t.id === wizardSelectedTemplateId)?.name || 'Template'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          🛠️ الخطوة 3: تحديد مواصفات قطعة الغيار التجارية (Commercial Blueprint)
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          تحديد الموديل الدقيق والماركة وأبعاد القطعة المادية التي سيتم استهلاكها في خط الإنتاج.
                        </p>
                      </div>

                      {slotDetails.isMax ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                          <p className="text-xs text-red-400 font-bold">تم تجاوز الطاقة الاستيعابية البالغة 999 مقعداً لهذا الكود.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-cyan-500/[0.02] border border-cyan-500/20 rounded-2xl space-y-2 text-center">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">كود الترقيم المتسلسل الممنوح (999 Slots Nomenclature ID)</span>
                            <div className="text-2xl font-black font-mono text-cyan-300 py-2.5 bg-[#0a0a0f]/60 rounded-xl border border-white/5 tracking-wider shadow-inner">
                              {slotDetails.activeId}
                            </div>
                            <p className="text-[9px] text-slate-400 font-sans">
                              هذا هو المقعد الحركي رقم **{slotDetails.num}** من أصل **999** مقعداً مخمداً ومفرزاً تلقائياً تحت هذا التصنيف لمنع فوضى الأكواد.
                            </p>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">رقم الموديل التجاري الدقيق / Commercial Model Number</label>
                            <input
                              type="text"
                              required
                              value={newBlueprintData.model}
                              onChange={e => setNewBlueprintData({ ...newBlueprintData, model: e.target.value })}
                              className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                              placeholder="e.g. 6205-2RS-C3, IM12-04N-N-C10"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">القدرة / المقاس / الحجم</label>
                              <input
                                type="text"
                                required
                                value={newBlueprintData.powerOrForce}
                                onChange={e => setNewBlueprintData({ ...newBlueprintData, powerOrForce: e.target.value })}
                                className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                                placeholder="e.g. 15 kW, 25x52x15 mm"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">المواصفات التقنية الدقيقة</label>
                              <input
                                type="text"
                                required
                                value={newBlueprintData.technicalSpecs}
                                onChange={e => setNewBlueprintData({ ...newBlueprintData, technicalSpecs: e.target.value })}
                                className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                                placeholder="e.g. 3-Phase 400V, PNP NO"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">وحدة القياس المستعملة</label>
                              <select
                                value={newBlueprintData.unit}
                                onChange={e => setNewBlueprintData({ ...newBlueprintData, unit: e.target.value })}
                                className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all appearance-none"
                              >
                                <option value="Pcs">قطعة (Pieces/Pcs)</option>
                                <option value="Kg">كيلوغرام (Kg)</option>
                                <option value="Liters">لتر (Liters)</option>
                                <option value="Meters">متر (Meters)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">الحد الأدنى للطلب (Stock Warning Threshold)</label>
                              <input
                                type="number"
                                min="1"
                                required
                                value={newBlueprintData.minThreshold}
                                onChange={e => setNewBlueprintData({ ...newBlueprintData, minThreshold: Number(e.target.value) })}
                                className="w-full bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingWizard}
                            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {isSubmittingWizard ? 'جاري تسجيل وتفعيل قطعة الغيار...' : 'تسجيل قطعة الغيار وربطها بهيكل الآلة'}
                          </button>
                        </div>
                      )}
                    </form>
                  )}

                </div>

                {/* Wizard Footer buttons */}
                <div className="p-6 border-t border-white/5 bg-white/[0.01] shrink-0 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (wizardStep > 1) {
                        setWizardStep((prev) => (prev - 1) as any);
                      } else {
                        setView('details');
                      }
                    }}
                    className="py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> الرجوع
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setView('details')}
                      className="py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors"
                    >
                      إلغاء المعالج
                    </button>

                    {wizardStep === 1 && (
                      <button
                        type="button"
                        disabled={!wizardSelectedFamilyId}
                        onClick={() => setWizardStep(2)}
                        className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-xs uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        الخطوة التالية <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {wizardStep === 2 && (
                      <button
                        type="button"
                        disabled={!wizardSelectedTemplateId}
                        onClick={() => setWizardStep(3)}
                        className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-xs uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        استمر لتعيين قطعة تجارية <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Universal View mode footer for Details page */}
        {view === 'details' && (
          <div className="p-6 border-t border-white/5 flex gap-3 bg-white/[0.01]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
            >
              إغلاق نافذة التفاصيل (Close)
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
