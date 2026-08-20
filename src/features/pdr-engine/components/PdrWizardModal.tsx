import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  X, Check, Plus, ArrowRight, ArrowLeft, FolderPlus, 
  Layers, Package, Save, ShieldAlert, Zap, Cpu, Droplets, Activity, Settings2, FolderTree
} from 'lucide-react';
import { Input, Label, Select, Textarea } from '@/shared/components/forms';
import { db } from '@/core/db';
import { generatePdrSlotId } from '@/core/config/pdrMatrix';
import { useAuditTrail } from '@/features/system/hooks/useAuditTrail';
import { useNotifications } from '@/shared/hooks/useNotifications';

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
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotifications();
  const { logEvent } = useAuditTrail();

  // Wizard step: 1, 2, or 3
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection states
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Custom creation toggle states
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

  // Step 3 Form Data (New Blueprint)
  const [newBlueprintData, setNewBlueprintData] = useState({
    model: '',
    powerOrForce: '',
    technicalSpecs: '',
    unit: 'PCS',
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
        unit: 'PCS',
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
      showError(t('common.error', 'Error'), t('pdr.wizard.enterFamilyName', 'Please enter a family classification name.'));
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

      showSuccess(t('pdr.wizard.familyCreated', 'Classification Family Created'), `${newFamilyData.name} (${code})`);
      setSelectedFamilyId(familyId);
      setIsCreatingFamily(false);
      setStep(2);
    } catch (error: any) {
      showError(t('common.error', 'Error'), error.message || 'Failed to create classification family.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Template Creation
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateData.name.trim() || !newTemplateData.skuBase.trim()) {
      showError(t('common.error', 'Error'), t('pdr.wizard.fillTemplateFields', 'Please fill in Template Name and SKU Base.'));
      return;
    }
    if (!selectedFamilyId) {
      showError(t('common.error', 'Error'), t('pdr.wizard.noFamilySelected', 'No parent family classification selected.'));
      return;
    }
    setIsSubmitting(true);
    try {
      const sanitizedSku = newTemplateData.skuBase.replace(/\s+/g, '-').toUpperCase();
      const templateId = `temp-${sanitizedSku}`;
      const createdAt = new Date().toISOString();

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

      onLinkTemplate(templateId);

      showSuccess(t('pdr.wizard.templateCreated', 'Specification Template Created'), `${newTemplateData.name} (${sanitizedSku})`);
      setSelectedTemplateId(templateId);
      setIsCreatingTemplate(false);
      setStep(3);
    } catch (error: any) {
      showError(t('common.error', 'Error'), error.message || 'Failed to create template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 Helper: Calculate Nomenclature Slot ID
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

  // Handle Blueprint Creation
  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      showError(t('common.error', 'Error'), t('pdr.wizard.noTemplateSelected', 'No specification template selected.'));
      return;
    }
    if (!newBlueprintData.model.trim() || !newBlueprintData.powerOrForce.trim() || !newBlueprintData.technicalSpecs.trim()) {
      showError(t('common.error', 'Error'), t('pdr.wizard.fillBlueprintFields', 'Model name, capacity/size, and technical specifications are required.'));
      return;
    }
    if (slotDetails.isMax) {
      showError(t('common.error', 'Error'), t('pdr.wizard.slotMaxReached', 'Maximum capacity of 999 slots has been reached for this template.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const createdAt = new Date().toISOString();
      const blueprintId = slotDetails.activeId;

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

      await logEvent({
        userId: user?.id || 'GUEST',
        userName: user?.name || 'Guest User',
        action: 'CREATE',
        entityType: 'PDR_BLUEPRINT',
        entityId: blueprintId,
        details: `Created Blueprint via Wizard: Model ${newBlueprintData.model} assigned to code ${blueprintId}`,
        severity: 'INFO'
      });

      onLinkTemplate(selectedTemplateId);

      showSuccess(t('pdr.wizard.blueprintRegistered', 'Blueprint Registered'), `${blueprintId} - ${newBlueprintData.model}`);
      onClose();
    } catch (error: any) {
      showError(t('common.error', 'Error'), error.message || 'Failed to register blueprint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return t('pdr.wizard.step1Title', 'Select Spare Part Family');
      case 2: return t('pdr.wizard.step2Title', 'Select Specification Template');
      case 3: return t('pdr.wizard.step3Title', 'Specify Blueprint Parameters');
    }
  };

  const getFamilyIcon = (nameOrCode: string) => {
    const uc = (nameOrCode || '').toUpperCase();
    if (uc.includes('MEC') || uc.includes('ROB')) return <Settings2 className="w-5 h-5 text-cyan-400" />;
    if (uc.includes('HYD')) return <Droplets className="w-5 h-5 text-blue-400" />;
    if (uc.includes('PNU')) return <Activity className="w-5 h-5 text-amber-400" />;
    if (uc.includes('ELE') || uc.includes('AUT')) return <Zap className="w-5 h-5 text-purple-400" />;
    return <FolderTree className="w-5 h-5 text-cyan-400" />;
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
          className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 30 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          className="relative w-full max-w-2xl bg-[#0b0c16] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden text-start"
        >
          {/* Cyan Engine Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500" />

          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs font-medium">{t('pdr.wizard.step', 'Step')} {step} / 3 •</span>
                <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  {t('pdr.wizard.badge', 'PDR WIZARD')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1.5">
                {getStepTitle()}
              </h3>
            </div>

            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 z-0" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-cyan-500 z-0 transition-all duration-300" 
                style={{ width: `${((step - 1) / 2) * 100}%` }} 
              />
              
              {[1, 2, 3].map((num) => (
                <div 
                  key={num}
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm transition-all ${
                    step >= num 
                      ? 'bg-white text-slate-950 border-2 border-white shadow-md' 
                      : 'bg-[#0a0a0f] text-slate-500 border border-white/10'
                  }`}
                >
                  {step > num ? <Check className="w-4 h-4 text-slate-950" /> : num}
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-1">
              <span>{t('pdr.wizard.stepFamily', 'Family')}</span>
              <span>{t('pdr.wizard.stepTemplate', 'Template')}</span>
              <span>{t('pdr.wizard.stepBlueprint', 'Blueprint')}</span>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            
            {/* STEP 1: FAMILY */}
            {step === 1 && (
              <div className="space-y-6">
                {!isCreatingFamily ? (
                  <>
                    <div className="space-y-2">
                      <Label>{t('pdr.wizard.selectFamilyLabel', 'Select Spare Parts Family')}</Label>
                      <Select
                        value={selectedFamilyId}
                        onChange={e => setSelectedFamilyId(e.target.value)}
                        className="titan-input appearance-none text-sm font-semibold py-3.5"
                      >
                        <option value="" disabled>--- {t('pdr.wizard.selectFamilyOption', 'Select Classification Family')} ---</option>
                        {families.map(fam => (
                          <option key={fam.id} value={fam.id}>
                            {fam.name} ({fam.id.startsWith('fam-') ? fam.id.replace('fam-', '') : fam.name.substring(0, 3).toUpperCase()})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="p-5 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-center space-y-3">
                      <p className="text-xs text-slate-400">
                        {t('pdr.wizard.familyNotFoundPrompt', 'Need a new classification family for this equipment?')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreatingFamily(true)}
                        className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 hover:text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all inline-flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-cyan-400" /> 
                        <span>{t('pdr.wizard.createNewFamily', 'Create New Family')}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleCreateFamily} className="space-y-4 border border-cyan-500/20 bg-cyan-500/[0.02] p-5 rounded-2xl">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FolderPlus className="w-4 h-4" /> {t('pdr.wizard.newFamilyHeader', 'Define New Classification Family')}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setIsCreatingFamily(false)}
                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        {t('pdr.wizard.backToExisting', 'Choose existing')}
                      </button>
                    </div>

                    <div>
                      <Label>{t('pdr.wizard.familyName', 'Family Name')}</Label>
                      <Input
                        type="text"
                        required
                        value={newFamilyData.name}
                        onChange={e => setNewFamilyData({ ...newFamilyData, name: e.target.value })}
                        className="text-xs"
                        placeholder="e.g. AUTOMATION, CYLINDERS, VALVES"
                      />
                    </div>

                    <div>
                      <Label>{t('pdr.wizard.systemGroup', 'Technical System Group')}</Label>
                      <Select
                        value={newFamilyData.group}
                        onChange={e => setNewFamilyData({ ...newFamilyData, group: e.target.value as any })}
                        className="titan-input appearance-none text-xs"
                      >
                        <option value="mecanique">{t('pdr.wizard.groupMechanical', 'Mechanical')}</option>
                        <option value="hydraulique">{t('pdr.wizard.groupHydraulic', 'Hydraulic')}</option>
                        <option value="electronique">{t('pdr.wizard.groupElectronic', 'Electronic')}</option>
                        <option value="electrique">{t('pdr.wizard.groupElectrical', 'Electrical')}</option>
                        <option value="pneumatique">{t('pdr.wizard.groupPneumatic', 'Pneumatic')}</option>
                        <option value="autre">{t('pdr.wizard.groupOther', 'Other')}</option>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('pdr.wizard.description', 'Description (Optional)')}</Label>
                      <Textarea
                        value={newFamilyData.description}
                        onChange={e => setNewFamilyData({ ...newFamilyData, description: e.target.value })}
                        className="titan-input text-xs h-16 resize-none"
                        placeholder={t('pdr.wizard.familyDescPlaceholder', 'Brief summary of components belonging to this family...')}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-200 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Save className="w-4 h-4 text-slate-950" /> 
                      <span>{isSubmitting ? t('common.saving', 'Saving...') : t('pdr.wizard.saveAndSelectFamily', 'Save & Select Family')}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: TEMPLATE */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 p-3.5 bg-white/[0.02] border border-white/10 rounded-xl mb-4">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    {getFamilyIcon(families.find(f => f.id === selectedFamilyId)?.name || 'MEC')}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('pdr.wizard.selectedFamily', 'Selected Family')}</div>
                    <div className="text-sm font-bold text-white">
                      {families.find(f => f.id === selectedFamilyId)?.name || 'Classification Family'}
                    </div>
                  </div>
                </div>

                {!isCreatingTemplate ? (
                  <>
                    <div className="space-y-2">
                      <Label>{t('pdr.wizard.selectTemplateLabel', 'Select Specification Template')}</Label>
                      <Select
                        value={selectedTemplateId}
                        onChange={e => setSelectedTemplateId(e.target.value)}
                        className="titan-input appearance-none text-sm font-semibold py-3.5"
                      >
                        <option value="" disabled>--- {t('pdr.wizard.selectTemplateOption', 'Select Specification Template')} ---</option>
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
                        {t('pdr.wizard.templateNotFoundPrompt', 'Need a new specification template with custom SKU prefix?')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreatingTemplate(true)}
                        className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 hover:text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all inline-flex items-center gap-1.5 justify-center w-full sm:w-auto cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-cyan-400" /> 
                        <span>{t('pdr.wizard.createNewTemplate', 'Create New Template')}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleCreateTemplate} className="space-y-4 border border-cyan-500/20 bg-cyan-500/[0.02] p-5 rounded-2xl">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> {t('pdr.wizard.newTemplateHeader', 'Define Specification Template')}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setIsCreatingTemplate(false)}
                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        {t('pdr.wizard.backToExisting', 'Choose existing')}
                      </button>
                    </div>

                    <div>
                      <Label>{t('pdr.wizard.templateName', 'Template Name')}</Label>
                      <Input
                        type="text"
                        required
                        value={newTemplateData.name}
                        onChange={e => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                        className="text-xs"
                        placeholder="e.g. Pneumatic Cylinder D60, Deep Groove Ball Bearing 6xxx"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label>{t('pdr.wizard.skuPrefix', 'SKU Base Prefix')}</Label>
                        <span className="text-[10px] font-mono text-cyan-400">{t('pdr.wizard.slotFormatExample', 'e.g. ROB-001')}</span>
                      </div>
                      <Input
                        type="text"
                        required
                        value={newTemplateData.skuBase}
                        onChange={e => setNewTemplateData({ ...newTemplateData, skuBase: e.target.value })}
                        className="titan-input text-xs font-mono"
                        placeholder="e.g. RLM, MOT-E, VNV"
                      />
                    </div>

                    <div>
                      <Label>{t('pdr.wizard.description', 'Description')}</Label>
                      <Textarea
                        value={newTemplateData.description}
                        onChange={e => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
                        className="titan-input text-xs h-16 resize-none"
                        placeholder={t('pdr.wizard.templateDescPlaceholder', 'Define technical parameters covered by this template...')}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-200 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Save className="w-4 h-4 text-slate-950" /> 
                      <span>{isSubmitting ? t('common.saving', 'Saving...') : t('pdr.wizard.saveAndSelectTemplate', 'Save & Select Template')}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 3: BLUEPRINT */}
            {step === 3 && (
              <form onSubmit={handleCreateBlueprint} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t('pdr.wizard.selectedFamily', 'Family')}</span>
                    <div className="text-xs font-bold text-white truncate mt-0.5">
                      {families.find(f => f.id === selectedFamilyId)?.name || 'Standard Family'}
                    </div>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t('pdr.wizard.selectedTemplate', 'Template')}</span>
                    <div className="text-xs font-bold text-cyan-400 truncate mt-0.5">
                      {templates.find(t => t.id === selectedTemplateId)?.name || 'Specification Template'}
                    </div>
                  </div>
                </div>

                {slotDetails.isMax ? (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-rose-400">{t('pdr.wizard.slotMaxTitle', 'Capacity Limit Exceeded (999 Slots)')}</div>
                      <p className="text-xs text-slate-400 mt-1">
                        {t('pdr.wizard.slotMaxDesc', 'All 999 slots have been allocated. Please create a new template with a separate SKU prefix.')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-[#08080c] border border-white/10 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {t('pdr.wizard.assignedSlot', 'Deterministic Slot Code')}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {t('pdr.wizard.slotOfTotal', 'Slot {{num}} of 999', { num: slotDetails.num })}
                        </span>
                      </div>
                      <div className="text-2xl font-black font-mono text-white text-center tracking-widest py-2 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                        {slotDetails.activeId}
                      </div>
                      <p className="text-[10px] text-slate-400 text-center">
                        {t('pdr.wizard.slotGuaranteedDesc', 'Zero Database Footprint rule guaranteed. Slot is sequentially assigned.')}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>{t('pdr.wizard.modelName', 'Model / Commercial Reference')}</Label>
                        <Input
                          type="text"
                          required
                          value={newBlueprintData.model}
                          onChange={e => setNewBlueprintData({ ...newBlueprintData, model: e.target.value })}
                          className="text-xs"
                          placeholder="e.g. Heavy Duty X1, 6205-2RS-C3, A-42-RED"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{t('pdr.wizard.capacitySize', 'Capacity / Dimensions')}</Label>
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
                          <Label>{t('pdr.wizard.technicalSpecs', 'Technical Specs')}</Label>
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
                          <Label>{t('pdr.wizard.unitOfMeasure', 'Unit of Measure')}</Label>
                          <Select
                            required
                            value={newBlueprintData.unit}
                            onChange={e => setNewBlueprintData({ ...newBlueprintData, unit: e.target.value })}
                            className="titan-input appearance-none text-xs"
                          >
                            <option value="PCS">PCS ({t('pdr.wizard.unitPieces', 'Pieces')})</option>
                            <option value="KG">KG ({t('pdr.wizard.unitKg', 'Kilograms')})</option>
                            <option value="LITERS">LITERS ({t('pdr.wizard.unitLiters', 'Liters')})</option>
                            <option value="METERS">METERS ({t('pdr.wizard.unitMeters', 'Meters')})</option>
                            <option value="SET">SET ({t('pdr.wizard.unitSet', 'Set / Kit')})</option>
                          </Select>
                        </div>
                        <div>
                          <Label>{t('pdr.wizard.minThreshold', 'Minimum Threshold')}</Label>
                          <Input
                            type="number"
                            min="0"
                            required
                            value={newBlueprintData.minThreshold}
                            onChange={e => setNewBlueprintData({ ...newBlueprintData, minThreshold: Number(e.target.value) })}
                            className="text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 mt-2 bg-white text-slate-950 hover:bg-slate-200 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-slate-950" /> 
                      <span>{isSubmitting ? t('common.saving', 'Registering...') : t('pdr.wizard.registerBlueprintBtn', 'Register Blueprint in Catalog')}</span>
                    </button>
                  </>
                )}
              </form>
            )}

          </div>

          {/* Footer Navigation */}
          <div className="p-6 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> 
                  <span>{t('common.back', 'Back')}</span>
                </button>
              ) : (
                <div />
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>

              {step === 1 && !isCreatingFamily && (
                <button
                  type="button"
                  disabled={!selectedFamilyId}
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <span>{t('common.next', 'Next')}</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              )}

              {step === 2 && !isCreatingTemplate && (
                <button
                  type="button"
                  disabled={!selectedTemplateId}
                  onClick={() => {
                    onLinkTemplate(selectedTemplateId);
                    setStep(3);
                  }}
                  className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <span>{t('common.next', 'Next')}</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
