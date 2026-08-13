import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { Select } from '@/shared/components/Select';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { ClipboardCheck, User, Cpu, Search, Plus, Minus, Trash2, CheckCircle2, AlertCircle, Loader2, Boxes, Wrench, ShoppingCart } from 'lucide-react';
import { useRequisitionEngine } from '../hooks/useRequisitionEngine';

interface CartItem {
  blueprintId: string;
  reference: string;
  quantity: number;
  available: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function RequisitionHubView() {
  const { t } = useTranslation();
  const { technicians, machines, blueprints, inventory, isLoading, submitRequisition } = useRequisitionEngine();
  
  const [selectedTechId, setSelectedTechId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const selectedTech = useMemo(() => technicians.find(t => t.id === selectedTechId), [technicians, selectedTechId]);
  
  // Smart Filtering: If technician had a sector, filter. Otherwise show all.
  const filteredMachines = useMemo(() => {
    return machines;
  }, [machines]);

  // Unified Part List: Combine Blueprints with Inventory quantity
  const availableParts = useMemo(() => {
    if (!blueprints || !inventory) return [];
    
    let parts = blueprints.map(bp => {
      const stock = inventory.find(i => i.blueprintId === bp.id);
      return {
        ...bp,
        available: stock ? stock.quantityCurrent : 0
      };
    }).filter(p => p.available > 0); // Only return parts that are actually in stock

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      parts = parts.filter(p => p.reference.toLowerCase().includes(lower));
    }
    return parts;
  }, [blueprints, inventory, searchTerm]);

  const handleAddToCart = (part: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.blueprintId === part.id);
      if (existing) {
        if (existing.quantity >= part.available) {
          showToast('Cannot exceed available stock.', 'error');
          return prev;
        }
        return prev.map(item => 
          item.blueprintId === part.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { blueprintId: part.id, reference: part.reference, quantity: 1, available: part.available }];
    });
  };

  const updateCartQty = (blueprintId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.blueprintId === blueprintId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.available) {
          showToast('Cannot exceed available stock.', 'error');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (blueprintId: string) => {
    setCart(prev => prev.filter(item => item.blueprintId !== blueprintId));
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCheckout = async () => {
    if (!selectedTechId || !selectedMachineId || cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await submitRequisition(selectedTechId, selectedMachineId, cart);
      if (!result.ok && 'error' in result) {
        showToast((result.error as Error).message || 'Transaction failed', 'error');
      } else {
        showToast('Requisition validated! Inventory deducted.', 'success');
        setCart([]);
        setSelectedMachineId(''); // Reset context slightly to prepare for next
      }
    } catch (err: any) {
      showToast(err.message || 'Transaction failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-400 flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Booting Requisition Hub...</div>;
  }

  const isValidCart = cart.length > 0 && selectedTechId && selectedMachineId;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr"
      dir="ltr"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-50 px-6 py-3 rounded-full flex items-center gap-3 border shadow-2xl backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                : 'bg-red-500/20 border-red-500/30 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
          title={t('requisition.hub.title')}
          subtitle={t('requisition.hub.subtitle')}
          icon={<ClipboardCheck className="w-8 h-8 text-cyan-400" />}
          badgeText={t('requisition.hub.badge')}
          badgeColor="cyan"
          className="mb-8"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('requisition.hub.blueprints')}
              subtitle="TOTAL BLUEPRINTS"
              value={blueprints.length}
              valueUnit={t('pdr.catalog.blueprintUnit')}
              icon={<Boxes className="w-3.5 h-3.5" />}
              color="cyan"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('requisition.hub.technicians')}
              subtitle="ACTIVE TECHS"
              value={technicians.length}
              valueUnit={t('requisition.hub.techUnit')}
              icon={<User className="w-3.5 h-3.5" />}
              color="emerald"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('requisition.hub.machines')}
              subtitle="ACTIVE MACHINES"
              value={machines.length}
              valueUnit={t('pdr.history.machineUnit')}
              icon={<Cpu className="w-3.5 h-3.5" />}
              color="blue"
              isActive={false}
            />
            <HeaderBentoCard
              title={t('requisition.hub.cartItems')}
              subtitle="SELECTED ITEMS"
              value={cart.reduce((sum, item) => sum + item.quantity, 0)}
              valueUnit={t('analytics.unit.part')}
              icon={<ShoppingCart className="w-3.5 h-3.5" />}
              color="purple"
              isActive={false}
            />
          </div>
        </PageHeader>
      </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-2 gap-6 min-h-0">

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Context (Technician & Machine) */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="relative overflow-hidden group border-indigo-500/20 bg-indigo-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 relative z-10">
              <User className="w-5 h-5 text-indigo-400" /> Requester Context
            </h2>
            <div className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                 <Select
                   label="Select Technician"
                   value={selectedTechId} onChange={e => setSelectedTechId(e.target.value)}
                   options={[
                     { value: '', label: '-- Choose Personnel --' },
                     ...technicians.map(t => ({ value: t.id, label: t.name }))
                   ]}
                 />
              </div>

              <div className="space-y-1.5">
                 <Select
                   label="Target Machine"
                   value={selectedMachineId} onChange={e => setSelectedMachineId(e.target.value)}
                   disabled={!selectedTechId}
                   options={[
                     { value: '', label: selectedTechId ? '-- Select Machine --' : 'Select Technician First' },
                     ...filteredMachines.map(m => ({ value: m.id, label: `${m.referenceCode} (${m.serialNumber || 'Unit'})` }))
                   ]}
                 />
              </div>
            </div>
          </GlassCard>

          {/* Cart Summary Header */}
          <GlassCard className="p-4 bg-cyan-500/5 border-cyan-500/20">
             <h3 className="text-lg font-bold text-cyan-400 mb-2">Requisition Cart</h3>
             <p className="text-sm text-slate-400 pb-4 border-b border-white/10">
               Items to be deducted from inventory and assigned to the selected machine.
             </p>
             <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">Cart is empty. Select parts from the right panel.</div>
                ) : (
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div key={item.blueprintId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0f]/40 border border-white/10">
                         <div>
                           <div className="font-mono text-sm text-white">{item.reference}</div>
                           <div className="text-xs text-slate-400">Stock available: {item.available}</div>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1 bg-white/5 rounded-md p-1 border border-white/10">
                              <button onClick={() => updateCartQty(item.blueprintId, -1)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Minus className="w-3 h-3"/></button>
                              <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                              <button onClick={() => updateCartQty(item.blueprintId, 1)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Plus className="w-3 h-3"/></button>
                           </div>
                           <button onClick={() => removeFromCart(item.blueprintId)} className="p-1.5 hover:bg-red-500/20 text-red-400/50 hover:text-red-400 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
             </div>
          </GlassCard>
        </div>

        {/* Right Panel: Parts Selection */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-medium text-white">Available Spare Parts</h2>
             <div className="relative">
                 <Input
                  type="text" placeholder="Search by reference..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                  className="w-64 !py-2"
                />
             </div>
          </div>

          <GlassCard className="flex-1 overflow-hidden p-0 flex flex-col h-[500px]">
             <div className="overflow-y-auto p-2">
                <table dir="ltr" className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-transparent/80 backdrop-blur-md z-10">
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Reference</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider text-center">Available Stock</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {availableParts.map((part) => {
                       const inCart = cart.find(c => c.blueprintId === part.id);
                       const remaining = part.available - (inCart?.quantity || 0);
                       const isDepleted = remaining <= 0;

                       return (
                         <tr key={part.id} className="group hover:bg-white/[0.02] transition-colors">
                           <td className="px-4 py-3 text-sm font-mono text-white">{part.reference}</td>
                           <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${remaining > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {remaining} {part.unit}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-left">
                              <Button
                                onClick={() => handleAddToCart(part)}
                                disabled={isDepleted}
                                variant="primary"
                                size="sm"
                                leftIcon={<Plus className="w-3 h-3" />}
                              >
                                Add
                              </Button>
                           </td>
                         </tr>
                       );
                    })}
                    {availableParts.length === 0 && (
                      <tr><td colSpan={3} className="py-8 text-center text-sm text-slate-400">No available parts match your search.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          </GlassCard>
        </div>
      </motion.div>
      </div>

      {/* Floating Action Button Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/10 p-4 flex justify-end z-40">
         <div className="w-full flex justify-between items-center px-4 lg:px-8">
            <div className="text-sm font-medium text-slate-400">
              {cart.length > 0 ? (
                <span className="text-cyan-400">{cart.length} distinct items ready for checkout.</span>
              ) : "Cart is empty. Select parts to begin."}
            </div>
            <Button
               onClick={handleCheckout}
               disabled={!isValidCart || isSubmitting}
               variant={isValidCart ? "primary" : "secondary"}
               className="!px-8 !py-3"
               leftIcon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
            >
               {isSubmitting ? "Processing Transaction..." : "Valider le Bon de Sortie"}
            </Button>
         </div>
      </div>

    </motion.div>
  );
}
