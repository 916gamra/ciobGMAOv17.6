import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, FolderPlus, Layers, Hash, ArrowRight, HelpCircle } from 'lucide-react';
import { db } from '@/core/db';
import { generatePdrSlotId, MAX_PDR_SLOTS_PER_TEMPLATE } from '@/core/config/pdrMatrix';
import { toast } from 'sonner';
import { useAuditTrail } from '@/features/system/hooks/useAuditTrail';
import { useTabStore } from '@/app/store';

export type ModalType = 'family' | 'template' | 'blueprint' | null;

interface PdrModalsProps {
  activeModal: ModalType;
  onClose: () => void;
  families: any[];
  templates: any[];
  blueprints?: any[];
  user?: any;
  onLinkTemplate?: (templateId: string) => void;
}

export function PdrModals({ activeModal, onClose, families, templates, blueprints = [], user, onLinkTemplate }: PdrModalsProps) {
  const [formData, setFormData] = useState<any>({});
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logEvent } = useAuditTrail();
  const { openTab } = useTabStore();

  useEffect(() => {
    if (activeModal === 'blueprint' || activeModal === 'family' || activeModal === 'template') {
      setSelectedFamilyId('');
      setFormData({});
    }
  }, [activeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      if (activeModal === 'family') {
        if (!formData.name) throw new Error('Family name is required');
        const code = formData.name.substring(0, 3).toUpperCase();
        const familyId = `fam-${code}-${crypto.randomUUID().substring(0, 4)}`;
        await db.pdrFamilies.add({
          id: familyId,
          name: formData.name.toUpperCase(),
          description: formData.description || `${formData.name} classification family`,
          group: formData.group || 'mecanique',
          createdAt,
        });
        await logEvent({
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'CREATE',
          entityType: 'PDR_FAMILY',
          entityId: familyId,
          details: `Created PDR Family: ${formData.name}`,
          severity: 'INFO'
        });
        toast.success('PDR Family created');
      } else if (activeModal === 'template') {
        if (!formData.name || !formData.familyId || !formData.skuBase) throw new Error('Missing required fields');
        const sanitizedSku = formData.skuBase.replace(/\s+/g, '-').toUpperCase();
        const templateId = `temp-${sanitizedSku}`;
        await db.pdrTemplates.add({
          id: templateId,
          familyId: formData.familyId,
          name: formData.name,
          skuBase: sanitizedSku,
          description: formData.description || `${formData.name} technical specification blueprint template`,
          createdAt,
        });
        await logEvent({
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'CREATE',
          entityType: 'PDR_TEMPLATE',
          entityId: templateId,
          details: `Created PDR Template: ${formData.name}`,
          severity: 'INFO'
        });
        if (onLinkTemplate) {
          onLinkTemplate(templateId);
        }
        toast.success('PDR Template created and linked to PDR Catalog');
      } else if (activeModal === 'blueprint') {
        if (!formData.templateId || !formData.reference || !formData.unit) throw new Error('Missing required fields');
        if (!formData.model || !formData.powerOrForce || !formData.technicalSpecs) throw new Error('Model, Power/Force and Technical Specifications are mandatory for Blueprints.');

        await db.pdrBlueprints.add({
          id: formData.id, // Pre-defined ID from the matrix
          templateId: formData.templateId,
          reference: formData.reference,
          unit: formData.unit,
          minThreshold: Number(formData.minThreshold) || 0,
          model: formData.model,
          powerOrForce: formData.powerOrForce,
          technicalSpecs: formData.technicalSpecs,
          createdAt,
        });
        await logEvent({
          userId: user?.id || 'GUEST',
          userName: user?.name || 'Guest User',
          action: 'CREATE',
          entityType: 'PDR_BLUEPRINT',
          entityId: formData.id,
          details: `Activated PDR Blueprint: ${formData.reference}`,
          severity: 'INFO'
        });
        toast.success('PDR Blueprint activated');
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
              {activeModal === 'family' && <><FolderPlus className="w-5 h-5 text-cyan-400" /> New Family</>}
              {activeModal === 'template' && <><Layers className="w-5 h-5 text-cyan-400" /> New Template</>}
              {activeModal === 'blueprint' && <><Hash className="w-5 h-5 text-cyan-400" /> New Blueprint</>}
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
              <div className="space-y-4">
                <div>
                  <label className="titan-label">Family Name (اسم العائلة)</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="titan-input text-xs"
                    placeholder="e.g., ROULEMENTS, COURROIES"
                  />
                </div>
                <div>
                  <label className="titan-label">System Group (القسم الفني للآلة)</label>
                  <select
                    value={formData.group || 'mecanique'}
                    onChange={e => setFormData({ ...formData, group: e.target.value })}
                    className="titan-input appearance-none"
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
                  <label className="titan-label">Description / الوصف (اختياري)</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="titan-input text-xs h-20 resize-none"
                    placeholder="Brief description of the spare parts family..."
                  />
                </div>
              </div>
            )}

            {activeModal === 'template' && (
              <div className="space-y-4">
                <div>
                  <label className="titan-label">Select Parent Family (اختر العائلة)</label>
                  <select
                    required
                    value={formData.familyId || ''}
                    onChange={e => setFormData({ ...formData, familyId: e.target.value })}
                    className="titan-input appearance-none"
                  >
                    <option value="" disabled>--- Select Family ---</option>
                    {families.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="titan-label">Template Name (اسم قالب المواصفات)</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="titan-input text-xs"
                    placeholder="e.g., Roulement Standard Ball 6xxx"
                  />
                </div>
                <div>
                  <label className="titan-label">SKU Base / Code Prefix (البادئة مثل RLM)</label>
                  <input
                    type="text"
                    required
                    value={formData.skuBase || ''}
                    onChange={e => setFormData({ ...formData, skuBase: e.target.value })}
                    className="titan-input text-xs"
                    placeholder="e.g., RO-B, CO-A (Must be unique)"
                  />
                </div>
                <div>
                  <label className="titan-label">Description / الوصف (اختياري)</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="titan-input text-xs h-20 resize-none"
                    placeholder="e.g. Ball bearings with single row deep grooves..."
                  />
                </div>
              </div>
            )}

            {activeModal === 'blueprint' && (() => {
              const selectedTemplate = templates.find(t => t.id === formData.templateId);
              let isMaxCapacity = false;
              let slotNum = 1;
              let activeSlotId = '';

              if (selectedTemplate) {
                const templateBlueprints = blueprints.filter(b => b.templateId === selectedTemplate.id);
                const existingIds = new Set(templateBlueprints.map(b => b.id));
                
                let found = false;
                for (let i = 1; i <= MAX_PDR_SLOTS_PER_TEMPLATE; i++) {
                  const candidateId = generatePdrSlotId(selectedTemplate.skuBase, i);
                  if (!existingIds.has(candidateId)) {
                    slotNum = i;
                    activeSlotId = candidateId;
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  isMaxCapacity = true;
                }
              }

              return (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="titan-label">1. Select Spare Part Family</label>
                    <select
                      value={selectedFamilyId}
                      onChange={e => {
                        setSelectedFamilyId(e.target.value);
                        setFormData({
                          ...formData,
                          templateId: '',
                          reference: '',
                          id: ''
                        });
                      }}
                      className="titan-input appearance-none"
                    >
                      <option value="" disabled>--- Choose Family ---</option>
                      {families.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="titan-label">2. Select Specification Template</label>
                    <select
                      required
                      disabled={!selectedFamilyId}
                      value={formData.templateId || ''}
                      onChange={e => {
                        const newTemplateId = e.target.value;
                        const template = templates.find(t => t.id === newTemplateId);
                        if (template) {
                          const templateBlueprints = blueprints.filter(b => b.templateId === newTemplateId);
                          const existingIds = new Set(templateBlueprints.map(b => b.id));
                          
                          let foundSlotId = '';
                          for (let i = 1; i <= MAX_PDR_SLOTS_PER_TEMPLATE; i++) {
                            const candidateId = generatePdrSlotId(template.skuBase, i);
                            if (!existingIds.has(candidateId)) {
                              foundSlotId = candidateId;
                              break;
                            }
                          }

                          setFormData({ 
                            ...formData, 
                            templateId: newTemplateId, 
                            reference: foundSlotId, 
                            id: foundSlotId 
                          });
                        }
                      }}
                      className="titan-input appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>--- Select Template ---</option>
                      {templates
                        .filter(t => t.familyId === selectedFamilyId)
                        .map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.skuBase})</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1.5">
                    <div className="text-slate-400 font-medium">Missing a classification family or template specification?</div>
                    <button
                      type="button"
                      onClick={() => {
                        openTab({ id: 'part-master', portalId: 'ORGANIZATION', title: 'Parts Catalog Lab', component: 'part-master' });
                        onClose();
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1 text-[11px]"
                    >
                      Create Globally in Parts Catalog Lab <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {isMaxCapacity && selectedTemplate && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 font-bold text-sm">MAX CAPACITY REACHED</p>
                    <p className="text-red-400/80 text-xs mt-1">This template has reached its maximum configuration slots ({MAX_PDR_SLOTS_PER_TEMPLATE}/{MAX_PDR_SLOTS_PER_TEMPLATE}).</p>
                  </div>
                )}

                {selectedTemplate && !isMaxCapacity && (
                  <>
                    <div className="space-y-4 pt-2">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="titan-label !mb-0 font-bold">Nomenclature Slot ID (Sequential Code)</label>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">Slot {slotNum} of {MAX_PDR_SLOTS_PER_TEMPLATE}</span>
                        </div>
                        <input
                          type="text"
                          disabled
                          value={activeSlotId}
                          className="titan-input font-mono opacity-80 bg-black/50 border-white/10 cursor-not-allowed text-cyan-400 text-lg text-center tracking-widest font-extrabold uppercase"
                        />
                      </div>

                      <AnimatePresence>
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-1">
                           <div className="flex items-center gap-2 mb-1">
                              <Layers className="w-4 h-4 text-cyan-400" />
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Active Technical Blueprint Specifications</span>
                           </div>
                           
                           <div className="grid grid-cols-1 gap-4">
                             <div>
                               <label className="titan-label">Model Name / Commercial Designation</label>
                               <input type="text" required value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} className="titan-input text-xs" placeholder="e.g., Heavy Duty X1, 6205-2RS, A-42" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <label className="titan-label">Power / Force / Size</label>
                                 <input type="text" required value={formData.powerOrForce || ''} onChange={e => setFormData({ ...formData, powerOrForce: e.target.value })} className="titan-input text-xs" placeholder="e.g., 15kW, 400T, 25x52x15mm" />
                               </div>
                               <div>
                                 <label className="titan-label">Technical Specs</label>
                                 <input type="text" required value={formData.technicalSpecs || ''} onChange={e => setFormData({ ...formData, technicalSpecs: e.target.value })} className="titan-input text-xs" placeholder="e.g., 400V 3Ph, Nitrile Rubber, Steel Cage" />
                               </div>
                             </div>
                           </div>
                        </motion.div>
                      </AnimatePresence>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="titan-label">Unit of Measure</label>
                          <select
                            required
                            value={formData.unit || ''}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            className="titan-input appearance-none"
                          >
                            <option value="" disabled>Select...</option>
                            <option value="Pcs">Pieces (Pcs)</option>
                            <option value="Kg">Kilograms (Kg)</option>
                            <option value="L">Liters (L)</option>
                            <option value="M">Meters (M)</option>
                            <option value="Set">Set</option>
                          </select>
                        </div>
                        <div>
                          <label className="titan-label">Min Stock Threshold</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={formData.minThreshold || ''}
                            onChange={e => setFormData({ ...formData, minThreshold: e.target.value })}
                            className="titan-input font-mono"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
              );
            })()}

            {activeModal && (
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
                  disabled={isSubmitting || (activeModal === 'blueprint' && formData.templateId && blueprints.filter(b => b.templateId === formData.templateId).length >= MAX_PDR_SLOTS_PER_TEMPLATE)}
                  className="flex-1 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-[#050508] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {isSubmitting ? 'Saving...' : activeModal === 'blueprint' ? 'Deploy Blueprint' : 'Deploy & Active'}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
