import { Input, Label, Select, FormGroup } from '@/shared/components/forms';
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';
import { X, PackagePlus, AlertTriangle, Loader2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { cn } from '@/shared/utils';
import { AddInventorySchema } from '../schemas/inventory.schema';

export function AddInventoryModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const blueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);
  const templates = useLiveQuery(() => db.pdrTemplates.toArray(), []);

  const [blueprintId, setBlueprintId] = useState('');
  const [warehouseId, setWarehouseId] = useState('WH-MAGASIN');
  const [locationDetails, setLocationDetails] = useState('');
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState<'NEW' | 'USED' | 'REFURBISHED' | 'LEGACY'>('NEW');
  const [error, setError] = useState<string | null>(null);
  const [zodErrors, setZodErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBlueprintId('');
      setWarehouseId('WH-MAGASIN');
      setLocationDetails('');
      setQuantity('');
      setCondition('NEW');
      setError(null);
      setZodErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setZodErrors({});

    const qty = parseFloat(quantity);
    
    const validation = AddInventorySchema.safeParse({
      blueprintId,
      warehouseId,
      locationDetails,
      quantity: isNaN(qty) ? undefined : qty,
      condition
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setZodErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if already exists in that warehouse with that condition
      const existing = await db.inventory.where({ blueprintId, warehouseId }).toArray();
      const existingWithSameCondition = existing.find(item => (item.condition || 'NEW') === condition);
      if (existingWithSameCondition) {
        setError(`This blueprint with condition ${condition} is already tracked in ${warehouseId}. Use 'New Movement' to add stock.`);
        setIsSubmitting(false);
        return;
      }

      await db.inventory.add({
        id: crypto.randomUUID(),
        blueprintId,
        warehouseId,
        quantityCurrent: qty,
        locationDetails,
        condition,
        updatedAt: new Date().toISOString()
      });

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
              >
                <Dialog.Content asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                    className="w-full max-w-md bg-[#0a0a0f]/85 backdrop-blur-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden relative my-auto gemini-breathing-border"
                  >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                    
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                             <PackagePlus className="w-5 h-5" />
                          </div>
                          Track New Blueprint
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button disabled={isSubmitting} className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
                            <X className="w-4 h-4" />
                          </button>
                        </Dialog.Close>
                      </div>

                      {error && (
                        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <p>{error}</p>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                           <Label>Select Blueprint from Catalog</Label>
                           <Select 
                             required 
                             disabled={isSubmitting}
                             value={blueprintId} 
                             onChange={e => setBlueprintId(e.target.value)} 
                             className="titan-input py-2.5 appearance-none disabled:opacity-50"
                           >
                              <option value="" className="bg-[#0a0f18]">-- Master Catalog --</option>
                              {blueprints?.map(bp => {
                                const t = templates?.find(t => t.id === bp.templateId);
                                return (
                                  <option key={bp.id} value={bp.id} className="bg-[#0a0f18]">
                                    {bp.reference} {t ? `(${t.skuBase})` : ''} - {bp.unit}
                                  </option>
                                );
                              })}
                           </Select>
                        </div>

                        <div>
                           <Label>Physical Location (Aisle/Shelf)</Label>
                           <Input 
                             disabled={isSubmitting}
                             value={locationDetails} 
                             onChange={e => setLocationDetails(e.target.value)} 
                               
                             placeholder="e.g. Aisle 4, Shelf B-12" 
                           />
                        </div>

                        <div>
                           <Label>Initial Quantity Found</Label>
                           <Input 
                             type="number" 
                             step="any" 
                             min="0" 
                             required 
                             disabled={isSubmitting}
                             value={quantity} 
                             onChange={e => setQuantity(e.target.value)} 
                               
                             placeholder="0.00" 
                           />
                        </div>

                        <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                           <button 
                             type="button" 
                             onClick={onClose} 
                             disabled={isSubmitting}
                             className="titan-button titan-button-outline disabled:opacity-50"
                           >
                             Cancel
                           </button>
                           <button 
                             type="submit" 
                             disabled={isSubmitting}
                             className="titan-button titan-button-active text-black bg-cyan-500 hover:bg-cyan-400 border-cyan-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             {isSubmitting ? (
                               <>
                                 <Loader2 className="w-4 h-4 animate-spin" />
                                 Processing...
                               </>
                             ) : (
                               <>
                                 <PackagePlus className="w-4 h-4" /> Start Tracking
                               </>
                             )}
                           </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </Dialog.Content>
              </motion.div>
            </Dialog.Overlay>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
