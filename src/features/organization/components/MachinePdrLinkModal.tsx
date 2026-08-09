import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Plus, ArrowRight, ArrowLeft, FolderPlus, 
  Layers, Package, Save, ShieldAlert, Zap, Cpu, Droplets, Activity, Settings2, Link
} from 'lucide-react';
import { db } from '@/core/db';
import { generatePdrSlotId } from '@/core/config/pdrMatrix';
import { toast } from 'sonner';

interface MachinePdrLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: string;
  machineName: string;
  onSuccess: () => void;
}

export const MAX_PDR_SLOTS_PER_TEMPLATE = 999;

export function MachinePdrLinkModal({ 
  isOpen, 
  onClose, 
  machineId,
  machineName,
  onSuccess 
}: MachinePdrLinkModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DB Data
  const [families, setFamilies] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);

  // Selection states
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('');

  // Creation forms toggles
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isCreatingBlueprint, setIsCreatingBlueprint] = useState(false);

  // Step 1: New Family Form
  const [newFamilyData, setNewFamilyData] = useState({
    name: '',
    group: 'mecanique' as 'mecanique' | 'hydraulique' | 'electronique' | 'pneumatique' | 'electrique' | 'autre',
    description: ''
  });

  // Step 2: New Template Form
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    skuBase: '',
    description: ''
  });

  // Step 3: New Blueprint Form
  const [newBlueprintData, setNewBlueprintData] = useState({
    model: '',
    powerOrForce: '',
    technicalSpecs: '',
    unit: 'Pcs',
    minThreshold: 2
  });

  // Load PDR Catalog Data
  const loadPdrData = async () => {
    try {
      const fams = await db.pdrFamilies.toArray();
      const tmpls = await db.pdrTemplates.toArray();
      const bps = await db.pdrBlueprints.toArray();

      setFamilies(fams);
      setTemplates(tmpls);
      setBlueprints(bps);
    } catch (err) {
      console.error('Error loading PDR Catalog tables:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPdrData();
      setStep(1);
      setSelectedFamilyId('');
      setSelectedTemplateId('');
      setSelectedBlueprintId('');
      setIsCreatingFamily(false);
      setIsCreatingTemplate(false);
      setIsCreatingBlueprint(false);
      setNewFamilyData({ name: '', group: 'mecanique', description: '' });
      setNewTemplateData({ name: '', skuBase: '', description: '' });
      setNewBlueprintData({ model: '', powerOrForce: '', technicalSpecs: '', unit: 'Pcs', minThreshold: 2 });
    }
  }, [isOpen]);

  // Handle Family Creation
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyData.name.trim()) {
      toast.error('الرجاء إدخال اسم العائلة لقطع الغيار');
      return;
    }
    setIsSubmitting(true);
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

      toast.success('تم إنشاء عائلة تصنيف قطع الغيار بنجاح!');
      setSelectedFamilyId(familyId);
      setIsCreatingFamily(false);
      setStep(2); // Advance
      loadPdrData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create family.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Template Creation
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateData.name.trim() || !newTemplateData.skuBase.trim()) {
      toast.error('الرجاء ملء اسم القالب وبادئة SKU');
      return;
    }
    if (!selectedFamilyId) {
      toast.error('لم يتم تحديد عائلة الأب');
      return;
    }
    setIsSubmitting(true);
    try {
      const sanitizedSku = newTemplateData.skuBase.replace(/\s+/g, '-').toUpperCase();
      const templateId = `temp-${sanitizedSku}`;
      const createdAt = new Date().toISOString();

      const existing = await db.pdrTemplates.get(templateId);
      if (existing) {
        throw new Error(`البادئة SKU '${sanitizedSku}' مسجلة مسبقاً.`);
      }

      await db.pdrTemplates.add({
        id: templateId,
        familyId: selectedFamilyId,
        name: newTemplateData.name.trim(),
        skuBase: sanitizedSku,
        description: newTemplateData.description.trim() || `${newTemplateData.name} Specification Template`,
        createdAt
      });

      toast.success('تم إنشاء قالب مواصفات قطع الغيار!');
      setSelectedTemplateId(templateId);
      setIsCreatingTemplate(false);
      setStep(3); // Advance
      loadPdrData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Slot details calculation
  const slotDetails = useMemo(() => {
    if (!selectedTemplateId) return { num: 1, activeId: '', isMax: false };
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return { num: 1, activeId: '', isMax: false };

    const templateBlueprints = blueprints.filter(b => b.templateId === selectedTemplateId);
    const existingIds = new Set(templateBlueprints.map(b => b.id));

    let found = false;
    let slotNum = 1;
    let activeSlotId = '';

    for (let i = 1; i <= MAX_PDR_SLOTS_PER_TEMPLATE; i++) {
      const candidateId = generatePdrSlotId(template.skuBase, i);
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
  }, [selectedTemplateId, templates, blueprints]);

  // Handle Blueprint Creation & Immediate Mapping Link
  const handleCreateAndLinkBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      toast.error('الرجاء اختيار قالب أولاً');
      return;
    }
    if (!newBlueprintData.model.trim() || !newBlueprintData.powerOrForce.trim() || !newBlueprintData.technicalSpecs.trim()) {
      toast.error('الموديل والمقاس والخصائص الفنية إلزامية لربط القطعة المحددة!');
      return;
    }
    if (slotDetails.isMax) {
      toast.error('تم الوصول للحد الأقصى للمقاعد لهذا القالب.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdAt = new Date().toISOString();
      const blueprintId = slotDetails.activeId;

      // 1. Add to PDR blueprints catalog
      await db.pdrBlueprints.add({
        id: blueprintId,
        templateId: selectedTemplateId,
        reference: blueprintId,
        unit: newBlueprintData.unit,
        minThreshold: Number(newBlueprintData.minThreshold) || 2,
        model: newBlueprintData.model.trim(),
        powerOrForce: newBlueprintData.powerOrForce.trim(),
        technicalSpecs: newBlueprintData.technicalSpecs.trim(),
        createdAt
      });

      // 2. Add dynamic mapping to the physical machine
      await db.machinePartMappings.add({
        id: crypto.randomUUID(),
        machineId,
        blueprintId,
        addedAt: createdAt
      });

      toast.success(`تم تسجيل قطعة الغيار التجاري كود: ${blueprintId} وربطها بالآلة ${machineName} بنجاح!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save blueprint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle linking an EXISTING blueprint
  const handleLinkExistingBlueprint = async () => {
    if (!selectedBlueprintId) {
      toast.error('الرجاء اختيار قطعة غيار تجارية لربطها!');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdAt = new Date().toISOString();

      // Check if already mapped to prevent duplicate mapping
      const existingMapping = await db.machinePartMappings
        .where('[machineId+blueprintId]')
        .equals([machineId, selectedBlueprintId])
        .first();

      if (existingMapping) {
        toast.error('هذه قطعة الغيار مرتبطة بالفعل بهذه الآلة.');
        setIsSubmitting(false);
        return;
      }

      await db.machinePartMappings.add({
        id: crypto.randomUUID(),
        machineId,
        blueprintId: selectedBlueprintId,
        addedAt: createdAt
      });

      toast.success(`تم ربط قطعة الغيار ${selectedBlueprintId} بالآلة ${machineName} بنجاح!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'فشل عملية الربط.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return '1. Spare Part Family Selection';
      case 2: return '2. Technical Category Template';
      case 3: return '3. Mandatory Commercial Spare Part (Blueprint)';
    }
  };

  if (!isOpen) return null;

  const filteredTemplates = templates.filter(t => t.familyId === selectedFamilyId);
  const filteredBlueprints = blueprints.filter(b => b.templateId === selectedTemplateId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          className="relative w-full max-w-xl bg-[#090b14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Top accent line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-indigo-500 to-rose-400" />

          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded text-[9px] font-mono text-teal-400 font-bold uppercase tracking-wider">
                  Mandatory PDR Link
                </span>
                <span className="text-slate-400 text-xs font-semibold">Step {step} of 3</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                {getStepTitle()}
              </h3>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">
                Target Machine: <span className="text-indigo-400 font-bold">{machineName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="px-8 pt-4 pb-2 shrink-0">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 z-0" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-teal-500 z-0 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }} />
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all ${
                    step >= num ? 'bg-teal-500 text-black border border-teal-400' : 'bg-[#0a0a0f] text-slate-500 border border-white/10'
                  }`}
                >
                  {step > num ? <Check className="w-3.5 h-3.5" /> : num}
                </div>
              ))}
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

            {/* STEP 1: FAMILY */}
            {step === 1 && (
              <div className="space-y-6">
                {!isCreatingFamily ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select PDR Family Classification</label>
                      <select
                        value={selectedFamilyId}
                        onChange={e => setSelectedFamilyId(e.target.value)}
                        className="titan-input py-3 px-3 text-xs appearance-none font-semibold"
                      >
                        <option value="" disabled>--- Select PDR Family ---</option>
                        {families.map(fam => (
                          <option key={fam.id} value={fam.id}>{fam.name} ({fam.group ? fam.group.toUpperCase() : 'AUTRE'})</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-center space-y-2">
                      <p className="text-[11px] text-slate-400">Can't find the correct Spare Part Family classification?</p>
                      <button
                        type="button"
                        onClick={() => setIsCreatingFamily(true)}
                        className="px-3.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create New Family / عائلة جديدة
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleCreateFamily} className="space-y-4 border border-teal-500/20 bg-teal-500/[0.01] p-4 rounded-2xl">
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4" /> Define New Spare Part Family
                    </h4>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Family Name</label>
                      <input
                        type="text" required value={newFamilyData.name}
                        onChange={e => setNewFamilyData({ ...newFamilyData, name: e.target.value })}
                        placeholder="e.g. ROULEMENTS, DISJONCTEURS" className="titan-input py-2 px-3 text-xs uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System Group</label>
                      <select
                        value={newFamilyData.group} onChange={e => setNewFamilyData({ ...newFamilyData, group: e.target.value as any })}
                        className="titan-input py-2 px-3 text-xs appearance-none"
                      >
                        <option value="mecanique">MÉCANIQUE (ميكانيك)</option>
                        <option value="hydraulique">HYDRAULIQUE (هيدروليك)</option>
                        <option value="electronique">ÉLECTRONIQUE (إلكترونيات)</option>
                        <option value="electrique">ÉLECTRIQUE (كهرباء)</option>
                        <option value="pneumatique">PNEUMATIQUE (نيوماتيك)</option>
                        <option value="autre">AUTRE (أخرى)</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button" onClick={() => setIsCreatingFamily(false)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Select Existing
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-black shadow-lg"
                      >
                        Save & Continue
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: TEMPLATE */}
            {step === 2 && (
              <div className="space-y-6">
                {!isCreatingTemplate ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select PDR Specification Template</label>
                      <select
                        value={selectedTemplateId}
                        onChange={e => setSelectedTemplateId(e.target.value)}
                        className="titan-input py-3 px-3 text-xs appearance-none font-semibold"
                      >
                        <option value="" disabled>--- Select Specification Template ---</option>
                        {filteredTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.skuBase})</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-center space-y-2">
                      <p className="text-[11px] text-slate-400">Can't find the correct technical specifications Template?</p>
                      <button
                        type="button"
                        onClick={() => setIsCreatingTemplate(true)}
                        className="px-3.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create New Template / قالب مواصفات جديد
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleCreateTemplate} className="space-y-4 border border-teal-500/20 bg-teal-500/[0.01] p-4 rounded-2xl">
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Create Specification Template
                    </h4>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Template Name</label>
                      <input
                        type="text" required value={newTemplateData.name}
                        onChange={e => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                        placeholder="e.g. Standard Radial Bearings, Inductive Proximity Sensors" className="titan-input py-2 px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SKU Base prefix (e.g. RLM)</label>
                      <input
                        type="text" required value={newTemplateData.skuBase}
                        onChange={e => setNewTemplateData({ ...newTemplateData, skuBase: e.target.value })}
                        placeholder="RLM" className="titan-input py-2 px-3 text-xs font-mono uppercase"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button" onClick={() => setIsCreatingTemplate(false)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Select Existing
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-black shadow-lg"
                      >
                        Save & Continue
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STEP 3: BLUEPRINT SPECIFICATION */}
            {step === 3 && (
              <div className="space-y-6">
                {!isCreatingBlueprint ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Choose Commercial Spare Part (MANDATORY)</label>
                      <select
                        value={selectedBlueprintId}
                        onChange={e => setSelectedBlueprintId(e.target.value)}
                        className="titan-input py-3 px-3 text-xs appearance-none font-semibold font-mono text-teal-400"
                      >
                        <option value="" disabled>--- SELECT SPARE PART (MANDATORY) ---</option>
                        {filteredBlueprints.map(b => (
                          <option key={b.id} value={b.id}>{b.id} — {b.model} ({b.powerOrForce})</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-center space-y-2">
                      <p className="text-[11px] text-slate-400">Can't find the specific commercial spare part model in stock?</p>
                      <button
                        type="button"
                        onClick={() => setIsCreatingBlueprint(true)}
                        className="px-3.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Define & Link Commercial Model / تعريف وربط موديل تجاري
                      </button>
                    </div>

                    {selectedBlueprintId && (
                      <button
                        type="button"
                        onClick={handleLinkExistingBlueprint}
                        className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
                      >
                        <Link className="w-4 h-4" /> Link Selected Spare Part to Machine
                      </button>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleCreateAndLinkBlueprint} className="space-y-4 border border-teal-500/20 bg-teal-500/[0.01] p-4 rounded-2xl">
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Package className="w-4 h-4" /> Register & Link Commercial Model
                    </h4>

                    {slotDetails.isMax ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-semibold">
                        Maximum capacity of sequence slot spaces has been reached.
                      </div>
                    ) : (
                      <div className="p-3 bg-[#0a0a0f]/40 border border-white/5 rounded-xl text-center">
                        <span className="block text-[9px] uppercase font-bold tracking-widest text-slate-500">Auto Generated Nomenclature ID</span>
                        <span className="text-lg font-mono font-bold text-teal-400 tracking-wider">{slotDetails.activeId}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Model Name / Commercial Reference</label>
                        <input
                          type="text" required value={newBlueprintData.model}
                          onChange={e => setNewBlueprintData({ ...newBlueprintData, model: e.target.value })}
                          placeholder="e.g. Model 6205-2RS" className="titan-input py-2 px-3 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Size / Rating / Power</label>
                          <input
                            type="text" required value={newBlueprintData.powerOrForce}
                            onChange={e => setNewBlueprintData({ ...newBlueprintData, powerOrForce: e.target.value })}
                            placeholder="e.g. 25x52x15 mm" className="titan-input py-2 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Technical Specifications</label>
                          <input
                            type="text" required value={newBlueprintData.technicalSpecs}
                            onChange={e => setNewBlueprintData({ ...newBlueprintData, technicalSpecs: e.target.value })}
                            placeholder="e.g. High Temp Rubber Seal" className="titan-input py-2 px-3 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unit of Measure</label>
                          <select
                            value={newBlueprintData.unit} onChange={e => setNewBlueprintData({ ...newBlueprintData, unit: e.target.value })}
                            className="titan-input py-2 px-3 text-xs appearance-none"
                          >
                            <option value="Pcs">Pieces (Pcs)</option>
                            <option value="Kg">Kilograms (Kg)</option>
                            <option value="Liters">Liters</option>
                            <option value="Meters">Meters</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Min Threshold (الحد الأدنى)</label>
                          <input
                            type="number" min={0} required value={newBlueprintData.minThreshold}
                            onChange={e => setNewBlueprintData({ ...newBlueprintData, minThreshold: Number(e.target.value) })}
                            className="titan-input py-2 px-3 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button" onClick={() => setIsCreatingBlueprint(false)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Select Existing
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || slotDetails.isMax}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-black shadow-lg"
                      >
                        Save & Link
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancel
              </button>

              {step === 1 && !isCreatingFamily && (
                <button
                  type="button"
                  disabled={!selectedFamilyId}
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40 transition-all"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && !isCreatingTemplate && (
                <button
                  type="button"
                  disabled={!selectedTemplateId}
                  onClick={() => setStep(3)}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40 transition-all"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
