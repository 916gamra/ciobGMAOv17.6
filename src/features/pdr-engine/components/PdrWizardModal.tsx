import { Input, Label, Select, Textarea, FormGroup } from '@/shared/components/forms';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Plus, ArrowRight, ArrowLeft, FolderPlus, 
  Layers, Package, Save, ShieldAlert, Zap, Cpu, Droplets, Activity, Settings2
} from 'lucide-react';
import { db } from '@/core/db';
import { generatePdrSlotId } from '@/core/config/pdrMatrix';
import { useAuditTrail } from '@/features/system/hooks/useAuditTrail';
import { toast } from 'sonner';

export const MAX_PDR_SLOTS_PER_TEMPLATE = 999;

interface PdrWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: any[];
  templates: any[];
  blueprints: any[];
  onLinkTemplate: (templateId: string) => void;
  user?: any;
  initialFamilyId?: string | null;
  initialTemplateId?: string | null;
}

export function PdrWizardModal({ 
  isOpen, 
  onClose, 
  families, 
  templates, 
  blueprints, 
  onLinkTemplate, 
  user,
  initialFamilyId,
  initialTemplateId
}: PdrWizardModalProps) {
  const { logEvent } = useAuditTrail();

  // Wizard state: 1, 2, or 3
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection states
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Custom creation toggle states (in-place forms)
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // Step 1 Form Data (New Family)
  const [newFamilyData, setNewFamilyData] = useState({
    name: '',
    group: 'mecanique' as 'mecanique' | 'hydraulique' | 'electronique' | 'pneumatique' | 'electrique' | 'autre',
    description: ''
  });

  // Step 2 Form Data (New Template)
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    skuBase: '',
    description: ''
  });

  // Step 3 Form Data (New Blueprint/Specification)
  const [newBlueprintData, setNewBlueprintData] = useState({
    model: '',
    powerOrForce: '',
    technicalSpecs: '',
    unit: 'Pcs',
    minThreshold: 2
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
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

      if (initialFamilyId && initialTemplateId) {
        setSelectedFamilyId(initialFamilyId);
        setSelectedTemplateId(initialTemplateId);
        setStep(3);
      } else {
        setSelectedFamilyId(initialFamilyId || '');
        setSelectedTemplateId(initialTemplateId || '');
        setStep(initialFamilyId ? 2 : 1);
      }
    }
  }, [isOpen, initialFamilyId, initialTemplateId]);

  // Handle Family Creation
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyData.name.trim()) {
      toast.error('Please enter a family name.');
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

      await logEvent({
        userId: user?.id || 'GUEST',
        userName: user?.name || 'Guest User',
        action: 'CREATE',
        entityType: 'PDR_FAMILY',
        entityId: familyId,
        details: `Created PDR Family via Wizard: ${newFamilyData.name}`,
        severity: 'INFO'
      });

      toast.success('Classification Family Created successfully!');
      setSelectedFamilyId(familyId);
      setIsCreatingFamily(false);
      setStep(2); // Auto-advance to template selection
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
      toast.error('Please fill in Template Name and SKU Base.');
      return;
    }
    if (!selectedFamilyId) {
      toast.error('No parent family selected.');
      return;
    }
    setIsSubmitting(true);
    try {
      const sanitizedSku = newTemplateData.skuBase.replace(/\s+/g, '-').toUpperCase();
      const templateId = `temp-${sanitizedSku}`;
      const createdAt = new Date().toISOString();

      // Check if template code is already in use
      const existing = await db.pdrTemplates.get(templateId);
      if (existing) {
        throw new Error(`The SKU Base prefix '${sanitizedSku}' is already registered.`);
      }

      await db.pdrTemplates.add({
        id: templateId,
        familyId: selectedFamilyId,
        name: newTemplateData.name.trim(),
        skuBase: sanitizedSku,
        description: newTemplateData.description.trim() || `${newTemplateData.name} Technical Specification Template`,
        createdAt
      });

      await logEvent({
        userId: user?.id || 'GUEST',
        userName: user?.name || 'Guest User',
        action: 'CREATE',
        entityType: 'PDR_TEMPLATE',
        entityId: templateId,
        details: `Created PDR Template via Wizard: ${newTemplateData.name}`,
        severity: 'INFO'
      });

      // Automatically link this template to active list in PDR Catalog
      onLinkTemplate(templateId);

      toast.success('Specification Template Created and Linked!');
      setSelectedTemplateId(templateId);
      setIsCreatingTemplate(false);
      setStep(3); // Auto-advance to blueprint parameters
    } catch (error: any) {
      toast.error(error.message || 'Failed to create template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 Helper: Calculate Nomenclature Slot ID & Number
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

  // Handle Blueprint Creation (Final step)
  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      toast.error('No template selected.');
      return;
    }
    if (!newBlueprintData.model.trim() || !newBlueprintData.powerOrForce.trim() || !newBlueprintData.technicalSpecs.trim()) {
      toast.error('Model Name, Power/Size and Technical Specifications are strictly mandatory.');
      return;
    }
    if (slotDetails.isMax) {
      toast.error('Maximum capacity of slots has been reached for this template.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdAt = new Date().toISOString();
      const blueprintId = slotDetails.activeId;

      await db.pdrBlueprints.add({
        id: blueprintId,
        templateId: selectedTemplateId,
        reference: blueprintId, // The user wants the nomenclature code to be the primary reference ID
        unit: newBlueprintData.unit,
        minThreshold: Number(newBlueprintData.minThreshold) || 2,
        model: newBlueprintData.model.trim(),
        powerOrForce: newBlueprintData.powerOrForce.trim(),
        technicalSpecs: newBlueprintData.technicalSpecs.trim(),
        createdAt
      });

      await logEvent({
        userId: user?.id || 'GUEST',
        userName: user?.name || 'Guest User',
        action: 'CREATE',
        entityType: 'PDR_BLUEPRINT',
        entityId: blueprintId,
        details: `Created Blueprint via Wizard: Model ${newBlueprintData.model} assigned to code ${blueprintId}`,
        severity: 'INFO'
      });

      // Ensure the template is linked in active PDR views
      onLinkTemplate(selectedTemplateId);

      toast.success(`Blueprint ${blueprintId} registered successfully!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save blueprint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepHeader = () => {
    switch(step) {
      case 1: return { title: 'Select Spare Part Family', arabic: 'الخطوة 1: اختر عائلة القطعة' };
      case 2: return { title: 'Select Technical Template', arabic: 'الخطوة 2: اختر قالب المواصفات' };
      case 3: return { title: 'Specify Part Parameters', arabic: 'الخطوة 3: حدد خصائص القطعة' };
    }
  };

  // Helper icons for systems
  const getFamilyIcon = (code: string) => {
    const uc = code.toUpperCase();
    if (uc.includes('DIS') || uc.includes('CON') || uc.includes('REL') || uc.includes('ELC')) return <Zap className="w-5 h-5 text-cyan-400" />;
    if (uc.includes('SEN') || uc.includes('AUT')) return <Cpu className="w-5 h-5 text-fuchsia-400" />;
    if (uc.includes('PNU')) return <Droplets className="w-5 h-5 text-blue-400" />;
    if (uc.includes('VAR') || uc.includes('MOT')) return <Activity className="w-5 h-5 text-emerald-400" />;
    if (uc.includes('DIV')) return <Package className="w-5 h-5 text-slate-400" />;
    return <Settings2 className="w-5 h-5 text-amber-400" />;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 30 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          className="relative w-full max-w-2xl bg-[#0b0c16] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-teal-400" />

          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                  BDR Nexus Wizard
                </span>
                <span className="text-slate-500 text-xs font-medium">• Step {step} of 3</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
                {getStepHeader().title} <span className="text-sm text-slate-400 font-medium font-sans">({getStepHeader().arabic})</span>
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 z-0" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 z-0 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }} />
              
              {[1, 2, 3].map((num) => (
                <div 
                  key={num}
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm transition-all ${step >= num ? 'bg-indigo-500 text-black border-2 border-indigo-400' : 'bg-slate-900 text-slate-500 border border-white/10'}`}
                >
                  {step > num ? <Check className="w-4 h-4" /> : num}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 px-1">
              <span>Family (العائلة)</span>
              <span>Template (القالب)</span>
              <span>Specs (المواصفات)</span>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            
            {/* STEP 1: FAMILY SELECTION OR CREATION */}
            {step === 1 && (
              <div className="space-y-6">
                {!isCreatingFamily ? (
                  <>
                    <div className="space-y-2">
                      <Label>Choose Spare Part Family (اختر العائلة المناسبة)</Label>
                      <Select
                        value={selectedFamilyId}
                        onChange={e => setSelectedFamilyId(e.target.value)}
                        className="titan-input appearance-none text-sm font-semibold py-3.5"
                      >
                        <option value="" disabled>--- Select classification family ---</option>
                        {families.map(fam => (
                          <option key={fam.id} value={fam.id}>
                            {fam.name} ({fam.id.startsWith('fam-') ? fam.id.replace('fam-', '') : fam.name.substring(0, 3).toUpperCase()})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="p-5 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-center space-y-3">
                      <p className="text-xs text-slate-400">
                        Can't find the correct spare parts family classification for this spare part?
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreatingFamily(true)}
                        className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add New Family (عائلة جديدة)
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleCreateFamily} className="space-y-4 border border-indigo-500/20 bg-indigo-500/[0.02] p-5 rounded-2xl">
                    <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3 mb-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FolderPlus className="w-4 h-4" /> Define New Classification Family
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setIsCreatingFamily(false)}
                        className="text-[10px] text-slate-400 hover:text-white underline"
                      >
                        Select Existing
                      </button>
                    </div>

                    <div>
                      <Label>Family Name (اسم العائلة)</Label>
                      <Input
                        type="text"
                        required
                        value={newFamilyData.name}
                        onChange={e => setNewFamilyData({ ...newFamilyData, name: e.target.value })}
                        className="text-xs"
                        placeholder="e.g., AUTOMATES, CYLINDRES, VANNE"
                      />
                    </div>

                    <div>
                      <Label>System Group (القسم الفني للآلة)</Label>
                      <Select
                        value={newFamilyData.group}
                        onChange={e => setNewFamilyData({ ...newFamilyData, group: e.target.value as any })}
                        className="titan-input appearance-none text-xs"
                      >
                        <option value="mecanique">MÉCANIQUE (ميكانيك)</option>
                        <option value="hydraulique">HYDRAULIQUE (هيدروليك)</option>
                        <option value="electronique">ÉLECTRONIQUE (إلكترونيات)</option>
                        <option value="electrique">ÉLECTRIQUE (كهرباء)</option>
                        <option value="pneumatique">PNEUMATIQUE (نيوماتيك)</option>
                        <option value="autre">AUTRE (أخرى)</option>
                      </Select>
                    </div>

                    <div>
                      <Label>Description / الوصف (اختياري)</Label>
                      <Textarea
                        value={newFamilyData.description}
                        onChange={e => setNewFamilyData({ ...newFamilyData, description: e.target.value })}
                        className="titan-input text-xs h-16 resize-none"
                        placeholder="Brief description of classifying components in this spare family..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Deploy & Select Family'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: TEMPLATE SELECTION OR CREATION */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl mb-4">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    {getFamilyIcon(families.find(f => f.id === selectedFamilyId)?.name || 'MEC')}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Selected Classification</div>
                    <div className="text-sm font-bold text-indigo-400">
                      {families.find(f => f.id === selectedFamilyId)?.name || 'Standard Family'}
                    </div>
                  </div>
                </div>

                {!isCreatingTemplate ? (
                  <>
                    <div className="space-y-2">
                      <Label>Choose Specification Template (اختر قالب المواصفات)</Label>
                      <Select
                        value={selectedTemplateId}
                        onChange={e => setSelectedTemplateId(e.target.value)}
                        className="titan-input appearance-none text-sm font-semibold py-3.5"
                      >
                        <option value="" disabled>--- Select technical specification template ---</option>
                        {templates
                          .filter(t => t.familyId === selectedFamilyId)
                          .map(temp => (
                            <option key={temp.id} value={temp.id}>
                              {temp.name} ({temp.skuBase})
                            </option>
                          ))
                        }
                      </Select>
                    </div>

                    <div className="p-5 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-center space-y-3">
                      <p className="text-xs text-slate-400">
                        Need a template with different technical parameters (e.g. different dimension fields or SKU code prefix)?
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreatingTemplate(true)}
                        className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add New Template (قالب جديد)
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleCreateTemplate} className="space-y-4 border border-indigo-500/20 bg-indigo-500/[0.02] p-5 rounded-2xl">
                    <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3 mb-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> Create Specification Template
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setIsCreatingTemplate(false)}
                        className="text-[10px] text-slate-400 hover:text-white underline"
                      >
                        Select Existing
                      </button>
                    </div>

                    <div>
                      <Label>Template Name (اسم قالب المواصفات)</Label>
                      <Input
                        type="text"
                        required
                        value={newTemplateData.name}
                        onChange={e => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                        className="text-xs"
                        placeholder="e.g. Cylindres Pneumatique Standard D60, Roulement Standard Ball 6xxx"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <Label>SKU Base / Code Prefix (البادئة مثل RLM)</Label>
                        <span className="text-[9px] font-mono text-cyan-400">Rule of 999 slots generates: ROB-001</span>
                      </div>
                      <Input
                        type="text"
                        required
                        value={newTemplateData.skuBase}
                        onChange={e => setNewTemplateData({ ...newTemplateData, skuBase: e.target.value })}
                        className="titan-input text-xs font-mono"
                        placeholder="e.g., RLM, MOT-E, VNV"
                      />
                    </div>

                    <div>
                      <Label>Description (الوصف)</Label>
                      <Textarea
                        value={newTemplateData.description}
                        onChange={e => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
                        className="titan-input text-xs h-16 resize-none"
                        placeholder="Define what specific parameters this technical category covers..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Deploy & Select Template'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 3: BLUEPRINT SPECIFICATIONS */}
            {step === 3 && (
              <form onSubmit={handleCreateBlueprint} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Selected Classification</span>
                    <div className="text-xs font-bold text-indigo-400 truncate mt-0.5">
                      {families.find(f => f.id === selectedFamilyId)?.name || 'Standard Family'}
                    </div>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Active Template</span>
                    <div className="text-xs font-bold text-indigo-400 truncate mt-0.5">
                      {templates.find(t => t.id === selectedTemplateId)?.name || 'Technical Template'}
                    </div>
                  </div>
                </div>

                {slotDetails.isMax ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-red-400">999 Max Capacity Exceeded!</div>
                      <p className="text-xs text-slate-400 mt-1">
                        All 999 sequence slot spaces are filled for this category prefix. Please create a new template with a different SKU Base to continue.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-indigo-500/[0.02] border border-indigo-500/20 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Nomenclature Slot ID Assigned</span>
                        <span className="text-[9px] font-mono text-slate-500">Slot {slotDetails.num} of 999</span>
                      </div>
                      <div className="text-2xl font-extrabold font-mono text-cyan-400 text-center tracking-widest py-2 bg-black/60 rounded-xl border border-white/5 shadow-inner">
                        {slotDetails.activeId}
                      </div>
                      <p className="text-[10px] text-slate-400 text-center">
                        Following the **999 slots rule**, this physical ID is deterministically allocated to prevent inventory chaos.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Model Name / Commercial Reference (الموديل)</Label>
                        <Input
                          type="text"
                          required
                          value={newBlueprintData.model}
                          onChange={e => setNewBlueprintData({ ...newBlueprintData, model: e.target.value })}
                          className="text-xs"
                          placeholder="e.g., Heavy Duty X1, 6205-2RS-C3, A-42-RED"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Power / Force / Size (القدرة/المقاس)</Label>
                          <Input
                            type="text"
                            required
                            value={newBlueprintData.powerOrForce}
                            onChange={e => setNewBlueprintData({ ...newBlueprintData, powerOrForce: e.target.value })}
                            className="text-xs"
                            placeholder="e.g. 15kW, 400T, 25x52x15mm"
                          />
                        </div>
                        <div>
                          <Label>Technical Specs (المواصفات التقنية)</Label>
                          <Input
                            type="text"
                            required
                            value={newBlueprintData.technicalSpecs}
                            onChange={e => setNewBlueprintData({ ...newBlueprintData, technicalSpecs: e.target.value })}
                            className="text-xs"
                            placeholder="e.g. 400V 3Ph, Nitrile Rubber, ISO 9001"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Unit of Measure (وحدة القياس)</Label>
                          <Select
                            required
                            value={newBlueprintData.unit}
                            onChange={e => setNewBlueprintData({ ...newBlueprintData, unit: e.target.value })}
                            className="titan-input appearance-none text-xs"
                          >
                            <option value="Pcs">Pieces (Pcs)</option>
                            <option value="Kg">Kilograms (Kg)</option>
                            <option value="Liters">Liters (Liters)</option>
                            <option value="Meters">Meters (Meters)</option>
                          </Select>
                        </div>
                        <div>
                          <Label>Minimum Threshold (الحد الأدنى للطلب)</Label>
                          <Input
                            type="number"
                            min="0"
                            required
                            value={newBlueprintData.minThreshold}
                            onChange={e => setNewBlueprintData({ ...newBlueprintData, minThreshold: Number(e.target.value) })}
                            className="titan-input text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 mt-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> {isSubmitting ? 'Registering...' : 'Deploy Blueprint to Catalog'}
                    </button>
                  </>
                )}
              </form>
            )}

          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as any)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
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
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Abort
              </button>

              {step === 1 && !isCreatingFamily && (
                <button
                  type="button"
                  disabled={!selectedFamilyId}
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && !isCreatingTemplate && (
                <button
                  type="button"
                  disabled={!selectedTemplateId}
                  onClick={() => {
                    // Ensure selected template is linked in catalog
                    onLinkTemplate(selectedTemplateId);
                    setStep(3);
                  }}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
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
