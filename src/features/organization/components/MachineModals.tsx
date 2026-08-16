import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, FolderPlus, Layers, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, type MachineFamily, type MachineTemplate, type MachineOperationType, type MachineBlueprint } from '@/core/db';
import { getBlueprintMatrixForTemplate, MAX_BLUEPRINTS_PER_TEMPLATE, MatrixSlot } from '@/core/config/blueprintMatrix';
import { toast } from 'sonner';
import { useAuditTrail } from '@/features/system/hooks/useAuditTrail';
import { Modal } from '@/shared/components/Modal';

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
  const { t } = useTranslation();
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
        toast.success(t('lab.familyCreated', 'Machine Family created'));
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
        toast.success(t('lab.templateCreated', 'Machine Template created'));
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
        toast.success(t('lab.blueprintActivated', 'Machine Blueprint activated'));
      }

      setFormData({});
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalProps = () => {
    switch (activeModal) {
      case 'family':
        return { title: t('lab.newFamilyTitle', 'New Family'), icon: <FolderPlus className="w-5 h-5 text-indigo-400" /> };
      case 'template':
        return { title: t('lab.newTemplateTitle', 'New Template'), icon: <Layers className="w-5 h-5 text-indigo-400" /> };
      case 'blueprint':
        return { title: t('lab.newBlueprintTitle', 'New Blueprint'), icon: <Hash className="w-5 h-5 text-indigo-400" /> };
      default:
        return { title: '', icon: undefined };
    }
  };

  const modalProps = getModalProps();

  return (
    <Modal
      isOpen={!!activeModal}
      onClose={onClose}
      title={modalProps.title}
      icon={modalProps.icon}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {activeModal === 'family' && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="titan-label">{t('lab.familyName', 'Family Name')}</label>
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
                <label className="titan-label">{t('lab.familyCode', 'Code')}</label>
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
              <label className="titan-label">{t('lab.industrialDefinition', 'Industrial/Mechanical Definition')}</label>
              <textarea
                value={formData.technicalDescription || ''}
                onChange={e => setFormData({ ...formData, technicalDescription: e.target.value })}
                className="titan-input h-20 resize-none"
                placeholder="Physical process (e.g., removal of material via rotation)..."
              />
            </div>
            <div>
              <label className="titan-label">{t('lab.internalNotes', 'Internal Notes')}</label>
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
                <label className="titan-label">{t('lab.parentFamily', 'Parent Family')}</label>
                <select
                  required
                  value={formData.familyId || ''}
                  onChange={e => setFormData({ ...formData, familyId: e.target.value })}
                  className="titan-input appearance-none"
                >
                  <option value="" disabled>{t('lab.selectFamily', 'Select Family...')}</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="titan-label">{t('lab.operationType', 'Operation Type')}</label>
                <select
                  required
                  value={formData.type || ''}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="titan-input appearance-none"
                >
                  <option value="" disabled>{t('lab.selectType', 'Select Type...')}</option>
                  <option value="A">A - Automatic</option>
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
                <label className="titan-label">{t('lab.templateName', 'Template Name')}</label>
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
                <label className="titan-label">{t('lab.skuGeneticBase', 'SKU Genetic Base')}</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={formData.skuBase || ''}
                  onChange={e => setFormData({ ...formData, skuBase: e.target.value.toUpperCase() })}
                  className="titan-input font-mono uppercase text-center border-indigo-500/30"
                  placeholder="e.g., TRP, STA"
                />
              </div>
            </div>
            <div>
              <label className="titan-label">{t('lab.functionalIdentity', 'Functional Identity')}</label>
              <textarea
                rows={2}
                value={formData.technicalDescription || ''}
                onChange={e => setFormData({ ...formData, technicalDescription: e.target.value })}
                className="titan-input resize-none"
                placeholder="Specific mechanical purpose..."
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
              <label className="titan-label">{t('lab.parentTemplate', 'Parent Template')}</label>
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
                <option value="" disabled>{t('lab.selectTemplate', 'Select Template...')}</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.skuBase})</option>
                ))}
              </select>
            </div>

            {isMaxCapacity && selectedTemplate && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 font-bold text-sm">{t('lab.maxCapacityTitle', 'MAX CAPACITY REACHED')}</p>
                <p className="text-red-400/80 text-xs mt-1">{t('lab.maxCapacityDesc', 'This template has reached its maximum slots.')}</p>
              </div>
            )}

            {selectedTemplate && !isMaxCapacity && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="titan-label !mb-0">{t('lab.blueprintCode', 'Blueprint Code')}</label>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{t('lab.slotPrefix', 'Slot')} {availableCount} {t('lab.slotOf', 'of')} {MAX_BLUEPRINTS_PER_TEMPLATE}</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={displayReference}
                    className="titan-input font-mono opacity-60 bg-[#0a0a0f]/50 border-white/5 cursor-not-allowed text-indigo-400 text-lg text-center tracking-widest uppercase"
                  />
                </div>

                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 pb-2">
                     <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{t('lab.technicalSpecifications', 'Technical Specifications')}</span>
                     </div>
                     
                     <div className="grid grid-cols-1 gap-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="titan-label">{t('lab.brandConstructeur', 'Brand / Constructeur')}</label>
                           <input type="text" required value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="titan-input text-xs" placeholder="e.g., Siemens" />
                         </div>
                         <div>
                           <label className="titan-label">{t('lab.manufacturerModel', 'Manufacturer Model')}</label>
                           <input type="text" required value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} className="titan-input text-xs" placeholder="e.g., G11FF" />
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="titan-label">{t('lab.mainPowerValue', 'Main Power (Value)')}</label>
                           <input type="text" required value={formData.powerOrForce || ''} onChange={e => setFormData({ ...formData, powerOrForce: e.target.value })} className="titan-input text-xs" placeholder="e.g., 50 Tonnes, 15 kW" />
                         </div>
                         <div>
                           <label className="titan-label">{t('lab.energySource', 'Energy Source')}</label>
                           <select required value={formData.energySource || ''} onChange={e => setFormData({ ...formData, energySource: e.target.value })} className="titan-input text-xs appearance-none">
                             <option value="" disabled>{t('lab.selectEnergy', 'Select Energy...')}</option>
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
            className="flex-1 py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (activeModal === 'blueprint' && formData.templateId && blueprints.filter(b => b.templateId === formData.templateId).length >= MAX_BLUEPRINTS_PER_TEMPLATE)}
            className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-200 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

