import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Save, Plus, FolderPlus, Layers, Hash, Check, Settings, Cpu, Tag, Factory, Users } from 'lucide-react';
import { db, type MachineFamily, type MachineTemplate, type MachineBlueprint } from '@/core/db';
import { getBlueprintMatrixForTemplate, MAX_BLUEPRINTS_PER_TEMPLATE } from '@/core/config/blueprintMatrix';
import { getAssetMatrixForBlueprint, MAX_ASSETS_PER_BLUEPRINT } from '@/core/config/assetMatrix';
import { toast } from 'sonner';
import { MachineInstanceSchema } from '../schemas/machine.schema';

interface MachineWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMachineId: string) => void;
  // If editing/linking an existing machine
  linkMachineId?: string;
  initialStep?: 1 | 2 | 3 | 4;
}

export function MachineWizardModal({ isOpen, onClose, onSuccess, linkMachineId, initialStep = 1 }: MachineWizardModalProps) {
  const [step, setStep] = useState<number>(initialStep);

  // Database lists
  const [families, setFamilies] = useState<MachineFamily[]>([]);
  const [templates, setTemplates] = useState<MachineTemplate[]>([]);
  const [blueprints, setBlueprints] = useState<MachineBlueprint[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  // Selection states
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>(''); // empty means "Direct Asset"

  // Creation forms toggles
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateBlueprint, setShowCreateBlueprint] = useState(false);

  // Create Family Form
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyCode, setNewFamilyCode] = useState('');
  const [newFamilyTechDesc, setNewFamilyTechDesc] = useState('');

  // Create Template Form
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'A' | 'S' | 'I' | 'E' | 'P' | 'H' | 'M'>('M');
  const [newTemplateSkuBase, setNewTemplateSkuBase] = useState('');
  const [newTemplateTechDesc, setNewTemplateTechDesc] = useState('');

  // Create Blueprint Form
  const [newBlueprintBrand, setNewBlueprintBrand] = useState('');
  const [newBlueprintModel, setNewBlueprintModel] = useState('');
  const [newBlueprintPower, setNewBlueprintPower] = useState('');
  const [newBlueprintEnergy, setNewBlueprintEnergy] = useState('380V');

  // Step 4: Machine Instance Form
  const [serialNumber, setSerialNumber] = useState('');
  const [mfgYear, setMfgYear] = useState<number>(new Date().getFullYear());
  const [sectorId, setSectorId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [activeSlotId, setActiveSlotId] = useState('');
  const [zodErrors, setZodErrors] = useState<Record<string, string>>({});

  // Load Data
  const loadData = async () => {
    try {
      const fams = await db.machineFamilies.toArray();
      const tmpls = await db.machineTemplates.toArray();
      const bps = await db.machineBlueprints.toArray();
      const secs = await db.sectors.toArray();
      const techs = await db.technicians.toArray();

      setFamilies(fams);
      setTemplates(tmpls);
      setBlueprints(bps);
      setSectors(secs.filter((s: any) => s.status === 'Active'));
      setTechnicians(techs);

      // If linking existing, load its template
      if (linkMachineId) {
        const m = await db.machines.get(linkMachineId);
        if (m) {
          setSelectedTemplateId(m.templateId || '');
          const t = tmpls.find(tmpl => tmpl.id === m.templateId);
          if (t) {
            setSelectedFamilyId(t.familyId);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setStep(initialStep);
    }
  }, [isOpen, linkMachineId, initialStep]);

  // Set default SKU base when creating a template
  useEffect(() => {
    if (showCreateTemplate && selectedFamilyId) {
      const family = families.find(f => f.id === selectedFamilyId);
      if (family) {
        const typeLetter = newTemplateType;
        const generatedBase = `${family.code}${typeLetter}`.toUpperCase();
        setNewTemplateSkuBase(generatedBase);
      }
    }
  }, [showCreateTemplate, selectedFamilyId, newTemplateType, families]);

  // Handle Automatic Asset Reference Code / Slot ID allocation
  useEffect(() => {
    if (step !== 4 || linkMachineId) return;

    const resolveSlots = async () => {
      try {
        const allMachines = await db.machines.toArray();

        if (selectedBlueprintId) {
          const bp = blueprints.find(b => b.id === selectedBlueprintId);
          if (bp) {
            const matrixSlots = getAssetMatrixForBlueprint(bp.id, bp.reference);
            const existingMachineRefs = new Set(allMachines.filter(m => m.blueprintId === bp.id).map(m => m.referenceCode));
            const availableSlot = matrixSlots.find(slot => !existingMachineRefs.has(slot.referenceCode));

            if (availableSlot) {
              setReferenceCode(availableSlot.referenceCode);
              setActiveSlotId(availableSlot.id);
            } else {
              setReferenceCode('');
              setActiveSlotId('');
            }
          }
        } else if (selectedTemplateId) {
          const tmpl = templates.find(t => t.id === selectedTemplateId);
          if (tmpl) {
            const basePrefix = tmpl.skuBase;
            const matrixSlots = Array.from({ length: MAX_ASSETS_PER_BLUEPRINT }, (_, i) => {
              const index = i + 1;
              const refNum = index.toString().padStart(2, '0');
              const refCode = `${basePrefix}-${refNum}`;
              return {
                id: `mach-${refCode.toLowerCase()}`,
                referenceCode: refCode,
                index
              };
            });

            const existingMachineRefs = new Set(
              allMachines
                .filter(m => m.templateId === selectedTemplateId || m.referenceCode.startsWith(`${basePrefix}-`))
                .map(m => m.referenceCode)
            );
            const availableSlot = matrixSlots.find(slot => !existingMachineRefs.has(slot.referenceCode));

            if (availableSlot) {
              setReferenceCode(availableSlot.referenceCode);
              setActiveSlotId(availableSlot.id);
            } else {
              setReferenceCode('');
              setActiveSlotId('');
            }
          }
        }
      } catch (err) {
        console.error('Failed to resolve active slots:', err);
      }
    };

    resolveSlots();
  }, [step, selectedBlueprintId, selectedTemplateId, blueprints, templates, linkMachineId]);

  // Create Family Action
  const handleAddFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim() || !newFamilyCode.trim()) {
      toast.error('الرجاء تعبئة الاسم والرمز');
      return;
    }
    try {
      const id = crypto.randomUUID();
      const code = newFamilyCode.trim().toUpperCase().substring(0, 2);
      
      await db.machineFamilies.add({
        id,
        name: newFamilyName.trim(),
        code,
        description: '',
        technicalDescription: newFamilyTechDesc.trim(),
        createdAt: new Date().toISOString()
      });

      toast.success('تم إنشاء عائلة الآلات بنجاح');
      setSelectedFamilyId(id);
      setShowCreateFamily(false);
      setNewFamilyName('');
      setNewFamilyCode('');
      setNewFamilyTechDesc('');
      loadData();
    } catch (err: any) {
      toast.error(`فشل الإنشاء: ${err.message}`);
    }
  };

  // Create Template Action
  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newTemplateSkuBase.trim()) {
      toast.error('الرجاء تعبئة الاسم ورمز SKU');
      return;
    }
    try {
      const id = crypto.randomUUID();
      await db.machineTemplates.add({
        id,
        familyId: selectedFamilyId,
        name: newTemplateName.trim(),
        type: newTemplateType,
        skuBase: newTemplateSkuBase.trim().toUpperCase().substring(0, 3),
        description: '',
        technicalDescription: newTemplateTechDesc.trim(),
        createdAt: new Date().toISOString()
      });

      toast.success('تم إنشاء قالب الآلة بنجاح');
      setSelectedTemplateId(id);
      setShowCreateTemplate(false);
      setNewTemplateName('');
      setNewTemplateTechDesc('');
      loadData();
    } catch (err: any) {
      toast.error(`فشل الإنشاء: ${err.message}`);
    }
  };

  // Create Blueprint Action
  const handleAddBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlueprintBrand.trim() || !newBlueprintModel.trim() || !newBlueprintPower.trim()) {
      toast.error('الماركة والموديل والقدرة مطلوبة لنموذج الآلة');
      return;
    }

    try {
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (!selectedTemplate) throw new Error('No template selected');

      const templateBlueprints = blueprints.filter(b => b.templateId === selectedTemplateId);
      const existingIds = new Set(templateBlueprints.map(b => b.id));
      const matrixSlots = getBlueprintMatrixForTemplate(selectedTemplateId, selectedTemplate.skuBase);
      const activeSlot = matrixSlots.find(s => !existingIds.has(s.id));

      if (!activeSlot) {
        toast.error('تم الوصول للحد الأقصى للمقاعد في هذا القالب (5)');
        return;
      }

      const id = activeSlot.id;
      await db.machineBlueprints.add({
        id,
        templateId: selectedTemplateId,
        reference: activeSlot.reference,
        brand: newBlueprintBrand.trim(),
        model: newBlueprintModel.trim(),
        powerOrForce: newBlueprintPower.trim(),
        energySource: newBlueprintEnergy,
        createdAt: new Date().toISOString()
      });

      toast.success(`تم تفعيل نموذج الآلة كود: ${activeSlot.reference}`);
      setSelectedBlueprintId(id);
      setShowCreateBlueprint(false);
      setNewBlueprintBrand('');
      setNewBlueprintModel('');
      setNewBlueprintPower('');
      loadData();
    } catch (err: any) {
      toast.error(`فشل تفعيل النموذج: ${err.message}`);
    }
  };

  // Final Registration of the Machine / Dynamic Twin
  const handleRegisterMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setZodErrors({});

    const cascadeTasks = async (machineId: string, blueprintId: string) => {
      const blueprintTasks = await db.blueprintTasks.where('machineBlueprintId').equals(blueprintId).toArray();
      if (blueprintTasks.length > 0) {
        // Find existing tasks so we don't duplicate
        const existingTasks = await db.machineTasks.where('machineId').equals(machineId).toArray();
        const existingTaskIds = new Set(existingTasks.map(mt => mt.taskId));
        
        const newTasks = blueprintTasks
          .filter(bt => !existingTaskIds.has(bt.taskId))
          .map(bt => ({
            id: crypto.randomUUID(),
            machineId,
            taskId: bt.taskId,
            isInherited: true,
            isEnabled: true,
            addedAt: new Date().toISOString()
          }));
          
        if (newTasks.length > 0) {
          await db.machineTasks.bulkAdd(newTasks);
        }
      }
    };

    if (linkMachineId) {
      // Just updating/linking blueprint
      try {
        await db.transaction('rw', db.machines, db.blueprintTasks, db.machineTasks, async () => {
          await db.machines.update(linkMachineId, {
            blueprintId: selectedBlueprintId || undefined
          });
          if (selectedBlueprintId) {
            await cascadeTasks(linkMachineId, selectedBlueprintId);
          }
        });
        toast.success('تم ربط الآلة بالنموذج وتوريث المهام الوقائية بنجاح!');
        onSuccess(linkMachineId);
        onClose();
      } catch (err: any) {
        toast.error(`فشل الربط: ${err.message}`);
      }
      return;
    }

    const validation = MachineInstanceSchema.safeParse({
      templateId: selectedTemplateId,
      blueprintId: selectedBlueprintId || undefined,
      referenceCode,
      serialNumber: serialNumber.trim(),
      manufacturingYear: mfgYear,
      sectorId,
      technicianId
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setZodErrors(fieldErrors);
      
      // show first error as toast to catch attention
      const firstError = Object.values(fieldErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    if (!activeSlotId) {
      toast.error('عذراً، لا توجد مقاعد (Slots) شاغرة لهذه التهيئة');
      return;
    }

    try {
      await db.transaction('rw', db.machines, db.blueprintTasks, db.machineTasks, async () => {
        await db.machines.add({
          id: activeSlotId,
          sectorId,
          technicianId,
          blueprintId: selectedBlueprintId || undefined,
          templateId: selectedTemplateId,
          referenceCode,
          serialNumber: serialNumber.trim(),
          manufacturingYear: mfgYear,
          status: 'Active'
        });
        if (selectedBlueprintId) {
          await cascadeTasks(activeSlotId, selectedBlueprintId);
        }
      });

      toast.success(`تم تسجيل الآلة مادية كود: ${referenceCode} وتوريث المهام بنجاح!`);
      onSuccess(activeSlotId);
      onClose();
    } catch (err: any) {
      toast.error(`فشل التسجيل: ${err.message}`);
    }
  };

  const filteredTemplates = templates.filter(t => t.familyId === selectedFamilyId);
  const filteredBlueprints = blueprints.filter(b => b.templateId === selectedTemplateId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#080d16] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col my-8 max-h-[90vh]"
        >
          {/* Top subtle glow line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Modal Header */}
          <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                  {linkMachineId ? 'Link Machine Blueprint' : 'Interactive Machine Asset Wizard'}
                </h2>
                <p className="text-[10px] font-mono text-indigo-400/80 uppercase tracking-widest mt-0.5">
                  BDR Nexus v17.1 — Step {step} of {linkMachineId ? '3' : '4'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/5 h-1.5 overflow-hidden shrink-0">
            <motion.div 
              className="bg-indigo-500 h-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / (linkMachineId ? 3 : 4)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Modal Content body (Scrollable) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            
            {/* STEP 1: FAMILY SELECTION / CREATION */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center max-w-md mx-auto mb-6">
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">1. Select Machine Family (عائلة الآلات)</h3>
                  <p className="text-xs text-slate-400 mt-1">تجمع الآلات التي تشترك في الطابع الميكانيكي أو الوظيفي العام.</p>
                </div>

                {showCreateFamily ? (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAddFamily} className="space-y-4 p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/5"
                  >
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Create New Machine Family</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Family Name</label>
                        <input
                          type="text" required value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)}
                          placeholder="e.g. Satinage, Rotary Press" className="titan-input py-2 px-3 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Code (2 letters)</label>
                        <input
                          type="text" required maxLength={2} value={newFamilyCode} onChange={e => setNewFamilyCode(e.target.value)}
                          placeholder="RP" className="titan-input py-2 px-3 text-center text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Industrial / Mechanical Description</label>
                      <textarea
                        value={newFamilyTechDesc} onChange={e => setNewFamilyTechDesc(e.target.value)}
                        placeholder="Description of the mechanical process involved..." className="titan-input py-2 px-3 text-xs h-16 resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button" onClick={() => setShowCreateFamily(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-black shadow-lg transition-all"
                      >
                        Create & Choose
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {families.map(fam => {
                      const isSelected = selectedFamilyId === fam.id;
                      return (
                        <div
                          key={fam.id}
                          onClick={() => setSelectedFamilyId(fam.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                              : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                              isSelected ? 'bg-indigo-500 text-black' : 'bg-white/5 text-slate-400 group-hover:text-white'
                            }`}>
                              {fam.code}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white uppercase tracking-tight">{fam.name}</h4>
                              <p className="text-[10px] text-slate-500 font-mono">CODE: {fam.code}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </div>
                      );
                    })}
                    <div
                      onClick={() => setShowCreateFamily(true)}
                      className="p-4 rounded-2xl border border-dashed border-white/10 hover:border-indigo-500/30 bg-transparent hover:bg-indigo-500/[0.02] cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      <Plus className="w-4 h-4" /> Add New Family / إضافة عائلة جديدة
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: TEMPLATE SELECTION / CREATION */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center max-w-md mx-auto mb-6">
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">2. Select Machine Template (قالب الآلة)</h3>
                  <p className="text-xs text-slate-400 mt-1">يحدد الهوية الوظيفية للآلة وطرق تشغيلها.</p>
                </div>

                {showCreateTemplate ? (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAddTemplate} className="space-y-4 p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/5"
                  >
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Create New Machine Template</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Template Name</label>
                        <input
                          type="text" required value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)}
                          placeholder="e.g. Standard Satinage" className="titan-input py-2 px-3 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Operation Type</label>
                        <select
                          required value={newTemplateType} onChange={e => setNewTemplateType(e.target.value as any)}
                          className="titan-input py-2 px-3 text-xs appearance-none"
                        >
                          <option value="A">A - Automatic (CNC/PLC)</option>
                          <option value="S">S - Semi-Electric</option>
                          <option value="I">I - Injection (Molding)</option>
                          <option value="E">E - Electric (Electromechanical)</option>
                          <option value="P">P - Pneumatic</option>
                          <option value="H">H - Hydraulic</option>
                          <option value="M">M - Manual (Mechanical)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SKU Genetic Base (Auto)</label>
                        <input
                          type="text" required maxLength={3} value={newTemplateSkuBase} onChange={e => setNewTemplateSkuBase(e.target.value)}
                          placeholder="SAT" className="titan-input py-2 px-3 text-xs font-mono uppercase"
                        />
                      </div>
                      <div className="flex items-end justify-start text-[10px] text-slate-500 pb-2">
                        سيتم استخدامه كأصل لجميع الأكواد المادية والرسومات.
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Functional Identity / Description</label>
                      <textarea
                        value={newTemplateTechDesc} onChange={e => setNewTemplateTechDesc(e.target.value)}
                        placeholder="Specific purpose or technical process specifications..." className="titan-input py-2 px-3 text-xs h-16 resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button" onClick={() => setShowCreateTemplate(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-black shadow-lg transition-all"
                      >
                        Create & Choose
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredTemplates.map(tmpl => {
                      const isSelected = selectedTemplateId === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => setSelectedTemplateId(tmpl.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                              : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                              isSelected ? 'bg-indigo-500 text-black' : 'bg-white/5 text-slate-400 group-hover:text-white'
                            }`}>
                              {tmpl.skuBase}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white uppercase tracking-tight">{tmpl.name}</h4>
                              <p className="text-[10px] text-slate-500 font-mono">SKU Prefix: {tmpl.skuBase}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </div>
                      );
                    })}
                    <div
                      onClick={() => setShowCreateTemplate(true)}
                      className="p-4 rounded-2xl border border-dashed border-white/10 hover:border-indigo-500/30 bg-transparent hover:bg-indigo-500/[0.02] cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      <Plus className="w-4 h-4" /> Add New Template / قالب جديد
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: BLUEPRINT / MODEL SELECTION / CREATION (OPTIONAL) */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center max-w-md mx-auto mb-6">
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">3. Link Machine Model / Blueprint (النموذج التجاري)</h3>
                  <p className="text-xs text-slate-400 mt-1">تحديد الموديل والمصنّع بدقة، أو يمكنك التخطي وتسجيلها كآلة مباشرة (Direct Asset).</p>
                </div>

                {showCreateBlueprint ? (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAddBlueprint} className="space-y-4 p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/5"
                  >
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Create New Machine Blueprint Model</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Manufacturer / Brand</label>
                        <input
                          type="text" required value={newBlueprintBrand} onChange={e => setNewBlueprintBrand(e.target.value)}
                          placeholder="e.g. Siemens, Heidelberger" className="titan-input py-2 px-3 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Model Name / Number</label>
                        <input
                          type="text" required value={newBlueprintModel} onChange={e => setNewBlueprintModel(e.target.value)}
                          placeholder="e.g. SM 102" className="titan-input py-2 px-3 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Main Power / Force Specification</label>
                        <input
                          type="text" required value={newBlueprintPower} onChange={e => setNewBlueprintPower(e.target.value)}
                          placeholder="e.g. 15 kW, 250 kW, 50 Tons" className="titan-input py-2 px-3 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Energy Source</label>
                        <select
                          required value={newBlueprintEnergy} onChange={e => setNewBlueprintEnergy(e.target.value)}
                          className="titan-input py-2 px-3 text-xs appearance-none"
                        >
                          <option value="380V">380V Triphase</option>
                          <option value="220V">220V Monophase</option>
                          <option value="Pneumatic">Pneumatic (Compressed Air)</option>
                          <option value="Hydraulic">Hydraulic (Fluid Power)</option>
                          <option value="Mixed">Mixed Energy</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button" onClick={() => setShowCreateBlueprint(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-black shadow-lg transition-all"
                      >
                        Create & Select
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <div className="space-y-4">
                    {/* OPTION: DIRECT ASSET */}
                    <div
                      onClick={() => setSelectedBlueprintId('')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                        selectedBlueprintId === '' 
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                          : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                          selectedBlueprintId === '' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400 group-hover:text-white'
                        }`}>
                          DIR
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-tight">Direct Asset (No Blueprint / Custom BOM)</h4>
                          <p className="text-[10px] text-slate-500">تسجيل مباشر بدون التقيد بمواصفات مصنّع مسبقة. تمنحك الحرية في صيانة الآلة بقطع مختلفة.</p>
                        </div>
                      </div>
                      {selectedBlueprintId === '' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>

                    {/* MODELS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredBlueprints.map(bp => {
                        const isSelected = selectedBlueprintId === bp.id;
                        return (
                          <div
                            key={bp.id}
                            onClick={() => setSelectedBlueprintId(bp.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                              isSelected 
                                ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                                isSelected ? 'bg-indigo-500 text-black' : 'bg-white/5 text-slate-400 group-hover:text-white'
                              }`}>
                                MDL
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-tight">{bp.brand} {bp.model}</h4>
                                <p className="text-[10px] text-slate-500 font-mono">Specs: {bp.powerOrForce} / {bp.energySource}</p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                          </div>
                        );
                      })}
                      <div
                        onClick={() => setShowCreateBlueprint(true)}
                        className="p-4 rounded-2xl border border-dashed border-white/10 hover:border-indigo-500/30 bg-transparent hover:bg-indigo-500/[0.02] cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        <Plus className="w-4 h-4" /> Create New Model Blueprint / نموذج جديد
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: PHYSICAL METADATA & REGISTRATION */}
            {step === 4 && (
              <form onSubmit={handleRegisterMachine} className="space-y-6">
                <div className="text-center max-w-md mx-auto mb-6">
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">4. Digital Twin Registration (تفعيل الآلة في المصنع)</h3>
                  <p className="text-xs text-slate-400 mt-1">تعبئة البيانات المادية للآلة وتعيينها لقطاع الصيانة وفني المسؤل.</p>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Factory className="w-5 h-5 text-indigo-400" />
                    <div>
                      <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold">Auto Allocated ID (المقعد الشاغر المستهلك)</span>
                      <span className="text-sm font-mono font-bold text-white tracking-widest">{referenceCode || 'NOT AVAILABLE'}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                    999 Slots Rule
                  </span>
                </div>

                {!activeSlotId && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 font-bold text-sm">NO SLOTS AVAILABLE</p>
                    <p className="text-red-400/80 text-xs mt-1">عذراً، هذا القالب ممتلئ تماماً بـ 999 آلة مادية ولا يمكن تفعيل المزيد.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Physical Serial Number (الرقم التسلسلي)</label>
                    <input
                      type="text" required value={serialNumber} onChange={e => setSerialNumber(e.target.value)}
                      placeholder="e.g. SN-99-A05" className="titan-input py-2.5 px-3 text-xs font-mono text-indigo-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Manufacturing Year (سنة الصنع)</label>
                    <input
                      type="number" min={1900} max={2100} required value={mfgYear} onChange={e => setMfgYear(Number(e.target.value))}
                      className="titan-input py-2.5 px-3 text-xs font-mono text-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Operational Sector (خط الانتاج / القطاع)</label>
                    <select
                      required value={sectorId} onChange={e => setSectorId(e.target.value)}
                      className="titan-input py-2.5 px-3 text-xs appearance-none"
                    >
                      <option value="" disabled>Select sector...</option>
                      {sectors.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Technician Owner (الفني المسؤول)</label>
                    <select
                      required value={technicianId} onChange={e => setTechnicianId(e.target.value)}
                      className="titan-input py-2.5 px-3 text-xs appearance-none"
                    >
                      <option value="" disabled>Select responsible tech...</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>
            )}

          </div>

          {/* Modal Footer Controls */}
          <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(prev => (prev - 1) as any)}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Abort
              </button>

              {step < (linkMachineId ? 3 : 4) ? (
                <button
                  type="button"
                  disabled={
                    (step === 1 && !selectedFamilyId) ||
                    (step === 2 && !selectedTemplateId)
                  }
                  onClick={() => setStep(prev => (prev + 1) as any)}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 rounded-xl shadow-lg shadow-indigo-500/10 transition-all"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRegisterMachine}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all"
                >
                  <Save className="w-4 h-4" /> {linkMachineId ? 'Save & Link Model' : 'Deploy Digital Twin'}
                </button>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
