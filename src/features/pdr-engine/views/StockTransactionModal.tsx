import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowDownRight, ArrowUpRight, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useStockTransaction } from '../hooks/useStockTransaction';
import type { EnrichedStockItem } from '../hooks/useStockEngine';
import { db, type Machine } from '@/core/db';
import { toast } from 'sonner';
import { StockTransactionSchema } from '../schemas/inventory.schema';

interface StockTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: EnrichedStockItem[];
  preselectedStockId?: string;
}

export function StockTransactionModal({
  isOpen,
  onClose,
  inventory,
  preselectedStockId
}: StockTransactionModalProps) {
  const [stockId, setStockId] = useState<string>('');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState<string>('');
  const [performedBy, setPerformedBy] = useState<string>('');
  const [machineId, setMachineId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [zodErrors, setZodErrors] = useState<Record<string, string>>({});

  const { executeTransaction, isProcessing, error, clearError } = useStockTransaction();

  useEffect(() => {
    if (isOpen) {
      setStockId(preselectedStockId || (inventory.length > 0 ? inventory[0].id : ''));
      setType('IN');
      setQuantity('');
      setPerformedBy('');
      setMachineId('');
      setNotes('');
      setSuccessMsg(null);
      setZodErrors({});
      clearError();

      // Fetch active registered machines
      db.machines.toArray().then(list => {
        setMachines(list.sort((a, b) => a.referenceCode.localeCompare(b.referenceCode)));
      }).catch(err => {
        console.error('Failed to load registered machines:', err);
      });
    }
    // Only re-initialize when modal opens or preselected item changes.
    // Excluding inventory and clearError avoids reset of form inputs during typing and background updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preselectedStockId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);
    setZodErrors({});

    const qty = parseFloat(quantity);
    
    const validation = StockTransactionSchema.safeParse({
      stockId,
      type,
      quantity: isNaN(qty) ? undefined : qty,
      performedBy,
      machineId: machineId || undefined,
      notes
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setZodErrors(fieldErrors);
      
      if (fieldErrors.machineId) {
         toast.error(fieldErrors.machineId);
      }
      return;
    }

    const success = await executeTransaction(
      stockId, 
      type, 
      qty, 
      performedBy, 
      type === 'OUT' ? machineId : undefined, 
      notes
    );
    if (success) {
      setSuccessMsg(`Transaction successful: ${type} ${qty} for selected item.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const selectedItem = inventory.find(i => i.id === stockId);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <Dialog.Content asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                    className="w-full max-w-md bg-[#0a0a0f]/80 backdrop-blur-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden relative gemini-breathing-border"
                  >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-semibold text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-cyan-500" />
                          New Stock Movement
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </Dialog.Close>
                      </div>

                      {error && (
                        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <p>{error}</p>
                        </div>
                      )}

                      {successMsg && (
                        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                          <p>{successMsg}</p>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Selected Item */}
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase font-semibold tracking-wider text-slate-400">Target Item</label>
                          <select
                            value={stockId}
                            onChange={(e) => setStockId(e.target.value)}
                            disabled={isProcessing}
                            className="titan-input py-2.5 appearance-none disabled:opacity-50"
                          >
                            <option value="" disabled className="bg-[#0a0f18]">Select an item...</option>
                            {inventory.map(item => (
                              <option key={item.id} value={item.id} className="bg-[#0a0f18]">
                                {item.blueprintReference} (جديدة) • Avail: {item.quantityCurrent}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Transaction Type */}
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase font-semibold tracking-wider text-slate-400">Movement Type</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setType('IN')}
                              disabled={isProcessing}
                              className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all font-medium text-sm disabled:opacity-50",
                                type === 'IN' 
                                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                                  : "bg-[#0a0a0f]/30 border-white/10 text-slate-400 hover:bg-white/5"
                              )}
                            >
                              <ArrowDownRight className="w-4 h-4" /> Entrée (IN)
                            </button>
                            <button
                              type="button"
                              onClick={() => setType('OUT')}
                              disabled={isProcessing}
                              className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all font-medium text-sm disabled:opacity-50",
                                type === 'OUT' 
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                                  : "bg-[#0a0a0f]/30 border-white/10 text-slate-400 hover:bg-white/5"
                              )}
                            >
                              <ArrowUpRight className="w-4 h-4" /> Sortie (OUT)
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Quantity */}
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase font-semibold tracking-wider text-slate-400 flex items-center justify-between">
                              <span>Quantity</span>
                              {selectedItem && <span className="text-[10px] text-cyan-500">Avail: {selectedItem.quantityCurrent} {selectedItem.unit}</span>}
                            </label>
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              disabled={isProcessing}
                              placeholder="0.00"
                              className="titan-input py-2.5 disabled:opacity-50"
                            />
                          </div>

                          {/* Performed By */}
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase font-semibold tracking-wider text-slate-400">Technician</label>
                            <input
                              type="text"
                              required
                              value={performedBy}
                              onChange={(e) => setPerformedBy(e.target.value)}
                              disabled={isProcessing}
                              placeholder="Name / ID"
                              className="titan-input py-2.5 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {/* Machine Selector (Only when withdrawing OUT) */}
                        {type === 'OUT' && (
                          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs uppercase font-semibold tracking-wider text-slate-400 flex items-center justify-between">
                              <span className="text-amber-400">الآلة المستهدفة (Target Machine) *</span>
                              <span className="text-[9px] text-cyan-500 font-bold font-mono">AUTOBOM Active</span>
                            </label>
                            <select
                              value={machineId}
                              onChange={(e) => setMachineId(e.target.value)}
                              disabled={isProcessing}
                              required={type === 'OUT'}
                              className="titan-input py-2.5 appearance-none disabled:opacity-50 border-cyan-500/30 text-cyan-400 focus:border-cyan-500 focus:ring-cyan-500"
                            >
                              <option value="" className="bg-[#0a0f18] text-slate-500">اختر الآلة التي استهلكت هذه القطعة...</option>
                              {machines.map(m => (
                                <option key={m.id} value={m.id} className="bg-[#0a0f18] text-white">
                                  {m.referenceCode} - {m.serialNumber} ({m.status})
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-500 font-sans mt-1">سحب هذه القطعة سيقوم بربطها تلقائياً بشجرة مكونات هذه الآلة (B.O.M).</p>
                          </div>
                        )}

                        {/* Notes Input */}
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase font-semibold tracking-wider text-slate-400">الملاحظات والبيان (Justification / Notes)</label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isProcessing}
                            placeholder="مثال: استبدال محرك تالف / صيانة وقائية..."
                            rows={2}
                            className="titan-input py-2 disabled:opacity-50 resize-none h-16"
                          />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="titan-button titan-button-outline disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isProcessing || !stockId || !quantity || !performedBy}
                            className={cn(
                              "titan-button disabled:opacity-50 disabled:cursor-not-allowed",
                              type === 'IN'
                                ? "bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-black"
                                : "bg-amber-500 hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-black"
                            )}
                          >
                            {isProcessing ? (
                              <>
                                <Activity className="w-4 h-4 animate-pulse" />
                                Processing...
                              </>
                            ) : (
                              <>Confirm {type}</>
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
