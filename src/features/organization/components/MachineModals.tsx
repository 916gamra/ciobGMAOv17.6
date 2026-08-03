import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, FolderPlus, Layers, Hash } from 'lucide-react';
import { db, type MachineFamily, type MachineTemplate, type MachineOperationType, type MachineBlueprint } from '@/core/db';
import { getBlueprintMatrixForTemplate, MAX_BLUEPRINTS_PER_TEMPLATE, MatrixSlot } from '@/core/config/blueprintMatrix';
import { toast } from 'sonner';
import { useAuditTrail } from '@/features/system/hooks/useAuditTrail';

export type ModalType = 'family' | 'template' | 'blueprint' | null;

interface MachineModalsProps {
  activeModal: ModalType;
  onClose: () => void;
  families: MachineFamily[];
  templates: MachineTemplate[];
  blueprints?: MachineBlueprint[];
  user?: any;
}

export function MachineModals({ activeModal, onClose, families, templates, blueprints = [], user }: MachineModalsProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logEvent } = useAuditTrail();

  // Auto-generate SKU Base for Templates
  useEffect(() => {
    if (activeModal === 'template' && formData.familyId && formData.type) {
      const family = families.find(f => f.id === formData.familyId);
      if (family) {
        let sku = '';
        if (formData.type === 'S') {
          // Special/Unique: First 3 letters of Family Name
          sku = family.name.substring(0, 3).toUpperCase();
        } else {
          // Functional Keys: Family Code (2 letters) + Type (1 letter)
          sku = `${family.code}${formData.type}`;
        }
        setFormData(prev => ({ ...prev, skuBase: sku }));
      }
    }
  }, [formData.familyId, formData.type, families, activeModal, formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      if (activeModal === 'family') {
        if (!formData.name || !formData.code) throw new Error('Name and Code are required');
        await db.machineFamilies.add({
          id,
          name: formData.name,
          code: formData.code.toUpperCase().substring(0, 2),
          description: formData.description || '',
          technicalDescription: formData.technicalDescription || '',
          createdAt,
        });
        await logEvent({
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'CREATE',
          entityType: 'MACHINE_FAMILY',
          entityId: id,
          details: `Created Machine Family: ${formData.name} (${formData.code})`,
          severity: 'INFO'
        });
        toast.success('Machine Family created');
      } else if (activeModal === 'template') {
        if (!formData.name || !formData.familyId || !formData.skuBase || !formData.type) throw new Error('Missing required fields');
        await db.machineTemplates.add({
          id,
          familyId: formData.familyId,
          name: formData.name,
          type: formData.type as MachineOperationType,
          skuBase: formData.skuBase,
          description: formData.description || '',
          technicalDescription: formData.technicalDescription || '',
          createdAt,
        });
        await logEvent({
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'CREATE',
          entityType: 'MACHINE_TEMPLATE',
          entityId: id,
          details: `Created Machine Template: ${formData.name} Type: ${formData.type}`,
          severity: 'INFO'
        });
        toast.success('Machine Template created');
      } else if (activeModal === 'blueprint') {
        if (!formData.templateId || !formData.reference) throw new Error('Missing required fields');
        if (!formData.brand || !formData.model || !formData.powerOrForce || !formData.energySource) throw new Error('Brand, Model, Power/Force and Energy Source are mandatory for Blueprints.');

        await db.machineBlueprints.add({
          id: formData.id,
          templateId: formData.templateId,
          reference: formData.reference,
          brand: formData.brand,
          model: formData.model,
          powerOrForce: formData.powerOrForce,
          energySource: formData.energySource,
          createdAt,
        });
        await logEvent({
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'CREATE',
          entityType: 'MACHINE_BLUEPRINT',
          entityId: formData.id,
          details: `Activated Machine Blueprint: ${formData.reference}`,
          severity: 'INFO'
        });
        toast.success('Machine Blueprint activated');
      }

      setFormData({});
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass-panel-heavy rounded-3xl overflow-hidden"
        >
          {/* Top Glare Edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {activeModal === 'family' && <><FolderPlus className="w-5 h-5 text-indigo-400" /> New Family</>}
              {activeModal === 'template' && <><Layers className="w-5 h-5 text-indigo-400" /> New Template</>}
              {activeModal === 'blueprint' && <><Hash className="w-5 h-5 text-indigo-400" /> New Blueprint</>}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {activeModal === 'family' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="titan-label">Family Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="titan-input"
                      placeholder="e.g., Satinage, Press"
                    />
                  </div>
                  <div>
                    <label className="titan-label">Code</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={formData.code || ''}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="titan-input font-mono uppercase text-center"
                      placeholder="ST"
                    />
                  </div>
                </div>
                <div>
                  <label className="titan-label">Industrial/Mechanical Definition</label>
                  <textarea
                    value={formData.technicalDescription || ''}
                    onChange={e => setFormData({ ...formData, technicalDescription: e.target.value })}
                    className="titan-input h-20 resize-none"
                    placeholder="Physical process (e.g., removal of material via rotation)..."
                  />
                </div>
                <div>
                  <label className="titan-label">Internal Notes</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="titan-input h-20 resize-none"
                    placeholder="Logistical hints or site-specific notes..."
                  />
                </div>
              </>
            )}

            {activeModal === 'template' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="titan-label">Parent Family</label>
                    <select
                      required
                      value={formData.familyId || ''}
                      onChange={e => setFormData({ ...formData, familyId: e.target.value })}
                      className="titan-input appearance-none"
                    >
                      <option value="" disabled>Select Family...</option>
                      {families.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="titan-label">Operation Type</label>
                    <select
                      required
                      value={formData.type || ''}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="titan-input appearance-none"
                    >
                      <option value="" disabled>Select Type (Priority Logic Applied)...</option>
                      <option value="A">A - Automatic (CNC/PLC Controlled)</option>
                      <option value="S">S - Semi-Electric / Specialized</option>
                      <option value="I">I - Injection (Plastic/Metal Molding)</option>
                      <option value="E">E - Electric (Electromechanical)</option>
                      <option value="P">P - Pneumatic (Compressed Air)</option>
                      <option value="H">H - Hydraulic (Fluid Power)</option>
                      <option value="M">M - Manual (Pure Mechanical)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="titan-label">Template Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="titan-input"
                      placeholder="e.g., Standard Satinage"
                    />
                  </div>
                  <div>
                    <label className="titan-label">SKU Genetic Base</label>
                    <input
                      type="text"
                      required
                      maxLength={3}
                      value={formData.skuBase || ''}
                      onChange={e => setFormData({ ...formData, skuBase: e.target.value.toUpperCase() })}
                      className="titan-input font-mono uppercase text-center border-indigo-500/30"
                      placeholder="e.g., TRP, STA"
                    />
                    <p className="text-[9px] text-indigo-400 mt-1 uppercase tracking-tighter opacity-70">Overridable Functional Code</p>
                  </div>
                </div>
                <div>
                  <label className="titan-label">Functional Mechanical Identity</label>
                  <textarea
                    rows={2}
                    value={formData.technicalDescription || ''}
                    onChange={e => setFormData({ ...formData, technicalDescription: e.target.value })}
                    className="titan-input resize-none"
                    placeholder="Specific mechanical purpose of this template..."
                  />
                </div>
                <div className="hidden">
                  <label className="titan-label">Notes</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="titan-input resize-none"
                  />
                </div>
              </>
            )}

            {activeModal === 'blueprint' && (() => {
              const selectedTemplate = templates.find(t => t.id === formData.templateId);
              let activeSlot: MatrixSlot | undefined;
              let isMaxCapacity = false;
              let availableCount = 0;
              
              if (selectedTemplate) {
                const templateBlueprints = blueprints.filter(b => b.templateId === selectedTemplate.id);
                const existingIds = new Set(templateBlueprints.map(b => b.id));
                const matrixSlots = getBlueprintMatrixForTemplate(selectedTemplate.id, selectedTemplate.skuBase);
                activeSlot = matrixSlots.find(s => !existingIds.has(s.id));
                isMaxCapacity = templateBlueprints.length >= MAX_BLUEPRINTS_PER_TEMPLATE;
                availableCount = activeSlot ? activeSlot.index : 0;
              }

              const displayReference = activeSlot ? activeSlot.reference : '';
              
              return (
              <>
                <div>
                  <label className="titan-label">Parent Template</label>
                  <select
                    required
                    value={formData.templateId || ''}
                    onChange={e => {
                      const newTemplateId = e.target.value;
                      const template = templates.find(t => t.id === newTemplateId);
                      if (template) {
                        const existingIds = new Set(blueprints.filter(b => b.templateId === newTemplateId).map(b => b.id));
                        const slots = getBlueprintMatrixForTemplate(template.id, template.skuBase);
                        const slot = slots.find(s => !existingIds.has(s.id));
                        setFormData({ 
                          ...formData, 
                          templateId: newTemplateId, 
                          reference: slot ? slot.reference : '', 
                          id: slot ? slot.id : '' 
                        });
                      }
                    }}
                    className="titan-input appearance-none"
                  >
                    <option value="" disabled>Select Template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.skuBase})</option>
                    ))}
                  </select>
                </div>

                {isMaxCapacity && selectedTemplate && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 font-bold text-sm">MAX CAPACITY REACHED</p>
                    <p className="text-red-400/80 text-xs mt-1">This template has reached its maximum configuration slots ({MAX_BLUEPRINTS_PER_TEMPLATE}/{MAX_BLUEPRINTS_PER_TEMPLATE}).</p>
                  </div>
                )}

                {selectedTemplate && !isMaxCapacity && (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="titan-label !mb-0">Blueprint Code (READ-ONLY)</label>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Slot {availableCount} of {MAX_BLUEPRINTS_PER_TEMPLATE}</span>
                      </div>
                      <input
                        type="text"
                        disabled
                        value={displayReference}
                        className="titan-input font-mono opacity-60 bg-black/50 border-white/5 cursor-not-allowed text-indigo-400 text-lg text-center tracking-widest uppercase"
                      />
                    </div>

                    <AnimatePresence>
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 pb-2">
                         <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Technical Specifications</span>
                         </div>
                         
                         <div className="grid grid-cols-1 gap-4">
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="titan-label">Brand / Constructeur</label>
                               <input type="text" required value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="titan-input text-xs" placeholder="e.g., Siemens, Atlas Copco" />
                             </div>
                             <div>
                               <label className="titan-label">Manufacturer Model</label>
                               <input type="text" required value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} className="titan-input text-xs" placeholder="e.g., G11FF" />
                             </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="titan-label">Main Power (Value)</label>
                               <input type="text" required value={formData.powerOrForce || ''} onChange={e => setFormData({ ...formData, powerOrForce: e.target.value })} className="titan-input text-xs" placeholder="e.g., 50 Tonnes, 15 kW" />
                             </div>
                             <div>
                               <label className="titan-label">Energy Source</label>
                               <select required value={formData.energySource || ''} onChange={e => setFormData({ ...formData, energySource: e.target.value })} className="titan-input text-xs appearance-none">
                                 <option value="" disabled>Select Energy...</option>
                                 <option value="380V">380V (Triphase)</option>
                                 <option value="220V">220V (Monophase)</option>
                                 <option value="Pneumatic">Pneumatic</option>
                                 <option value="Hydraulic">Hydraulic</option>
                                 <option value="Mixed">Mixed</option>
                               </select>
                             </div>
                           </div>
                         </div>
                      </motion.div>
                    </AnimatePresence>
                  </>
                )}
              </>
              );
            })()}

            <div className="pt-4 mt-6 border-t border-white/5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (activeModal === 'blueprint' && formData.templateId && blueprints.filter(b => b.templateId === formData.templateId).length >= MAX_BLUEPRINTS_PER_TEMPLATE)}
                className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-[#050508] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? 'Saving...' : 'Deploy Data'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
