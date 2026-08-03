import { PageHeader } from "@/shared/components/PageHeader";
import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { GlassCard } from '@/shared/components/GlassCard';
import { ShieldCheck, UserCog, AlertCircle, Save, X, Lock, Fingerprint, Info, CheckCircle2, User as UserIcon, KeyRound } from 'lucide-react';
import { db } from '@/core/db';
import type { User } from '@/core/db';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { measureOperation } from '@/core/logger';
import { cn } from '@/shared/utils';
import { useAuthStore } from '@/app/store/useAuthStore';
import { isUserAdmin } from '@/core/permissions';
import { useAuthSlots } from '@/features/auth/hooks/useAuthSlots';

const AVAILABLE_PORTALS = [
  { id: 'PDR', name: 'PDR Engine', color: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500' },
  { id: 'PREVENTIVE', name: 'Maintenance', color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { id: 'CORRECTIVE', name: 'Corrective Ops', color: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500' },
  { id: 'ORGANIZATION', name: 'Part Catalog', color: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500' },
  { id: 'FACTORY', name: 'Factory Admin', color: 'text-indigo-400', bg: 'bg-indigo-500', border: 'border-indigo-500' },
  { id: 'ANALYTICS', name: 'Analytics Hub', color: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500' },
  { id: 'SETTINGS', name: 'System Config', color: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-500' }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function UserManagementView() {
  const { currentUser } = useAuthStore();
  const allSlots = useAuthSlots();
  const { showSuccess, showError } = useNotifications();

  // Edit slot form state
  const [editingSlot, setEditingSlot] = useState<User | null>(null);
  const [confirmDeactivateSlot, setConfirmDeactivateSlot] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editIsActive, setEditIsActive] = useState(false);
  const [editBadgeId, setEditBadgeId] = useState('');
  const [editAllowedPortals, setEditAllowedPortals] = useState<string[]>([]);

  // SECURITY GUARD: Absolute gate for non-admins
  if (!isUserAdmin(currentUser)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/40 rounded-[2rem] border border-rose-500/10 md:min-h-[500px] relative overflow-hidden backdrop-blur-xl">
         <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 shadow-inner">
            <Lock className="w-8 h-8 text-rose-500" />
         </div>
         <h1 className="text-3xl font-semibold text-rose-500 tracking-tight mb-2 relative z-10" >Access Restrictions Applied</h1>
         <p className="max-w-md text-slate-400 text-sm leading-relaxed relative z-10">
            Your current authorization level prevents viewing or modifying identity configurations. Administrative privileges are mandatory.
         </p>
      </div>
    );
  }

  const openEditModal = (slot: User) => {
    setEditingSlot(slot);
    setEditName(slot.name);
    setEditColor(slot.color);
    setEditPin(''); // leave blank unless changing
    setEditIsActive(slot.isActive || false);
    setEditBadgeId(slot.realBadgeId || '');
    setEditAllowedPortals(slot.allowedPortals || []);
  };

  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !currentUser) return;

    try {
      const updates: any = {
        id: editingSlot.id,
        name: editName,
        color: editColor,
        isActive: editIsActive,
        allowedPortals: editingSlot.id === 'SY-ADMIN' ? AVAILABLE_PORTALS.map(p => p.id) : editAllowedPortals
      };

      if (editingSlot.id.startsWith('TC')) {
        updates.realBadgeId = editBadgeId;
      }
      
      if (editPin.trim() !== '') {
        const { hashPin } = await import('@/core/security');
        updates.pin = await hashPin(editPin);
      }

      await measureOperation('UpdateUserOverride', async () => {
        const existing = await db.userOverrides.get(editingSlot.id);
        if (existing) {
          await db.userOverrides.update(editingSlot.id, updates);
        } else {
          await db.userOverrides.put(updates);
        }
      });

      showSuccess('Profile Synchronized', `Slot ${editingSlot.id} configured successfully.`);
      setEditingSlot(null);
    } catch (err: any) {
      showError('Sync Failure', err.message);
    }
  };

  const renderSlotGroup = (title: string, prefix: string) => {
    const slots = allSlots.filter((s: User) => s.id.startsWith(prefix));

    return (
      <div className="mb-12">
        <motion.h2 variants={itemVariants} className="text-xl font-semibold text-white mb-8 flex items-center gap-3 tracking-tight">
          {prefix === 'SY' && <ShieldCheck className="w-5 h-5 text-red-500" />}
          {prefix === 'OP' && <UserCog className="w-5 h-5 text-indigo-500" />}
          {prefix === 'TC' && <UserIcon className="w-5 h-5 text-emerald-500" />}
          {title}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {slots.map(slot => (
            <motion.div key={slot.id} variants={itemVariants}>
              <GlassCard className={cn(
                "!p-0 overflow-hidden border-t-4 transition-colors transition-shadow duration-300 hover:shadow-2xl hover:border-white/20",
                !slot.isActive && "opacity-60 grayscale",
                prefix === 'SY' && "border-t-red-500",
                prefix === 'OP' && "border-t-indigo-500",
                prefix === 'TC' && "border-t-emerald-500"
              )}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg shrink-0", slot.color)}>
                      {slot.initials}
                    </div>
                    {slot.id !== 'SY-ADMIN' && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                           type="checkbox" 
                           className="sr-only peer" 
                           checked={slot.isActive} 
                            onChange={async (e) => {
                              const isActivating = e.target.checked;
                              
                              if (!isActivating) {
                                setConfirmDeactivateSlot(slot);
                                return;
                              }
                              
                              try {
                                await db.userOverrides.put({ ...slot, isActive: true } as User);
                                showSuccess('Status Updated', `Slot ${slot.id} has been Activated`);
                                if (slot.id.startsWith('TC')) {
                                  openEditModal(slot);
                                }
                              } catch (err: any) {
                                showError('Sync Failure', err.message);
                              }
                            }}
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                      </label>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">{slot.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mb-4">{slot.id}</p>

                  <div className="space-y-3 text-sm text-slate-400">
                    <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <span>{slot.role}</span>
                    </div>
                    {slot.realBadgeId && (
                      <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                        <Fingerprint className="w-4 h-4 text-slate-500" />
                        <span className="font-mono text-xs">{slot.realBadgeId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                   <div className="flex -space-x-2">
                       {slot.allowedPortals?.slice(0, 3).map(portalId => {
                        const p = AVAILABLE_PORTALS.find(x => x.id === portalId);
                        if (!p) return null;
                        return (
                          <div key={portalId} className={cn("w-6 h-6 rounded-full flex items-center justify-center border border-black text-[9px] font-bold text-white", p.bg)}>
                            {p.id.substring(0, 1)}
                          </div>
                        );
                      })}
                   </div>
                  <button 
                    onClick={() => openEditModal(slot)}
                    className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full flex flex-col pt-4 min-h-0 h-full relative z-10"
    >
      <PageHeader
        title="Identity Slot Configuration"
        subtitle="Manage stationary access slots and authentication overrides."
        icon={<Fingerprint className="w-6 h-6 text-slate-500" />}
      />
      
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar lg:px-8 pb-12">
        {renderSlotGroup("System Administration", "SY")}
        {renderSlotGroup("Global Operational Management", "OP")}
        {renderSlotGroup("Technical Execution", "TC")}
      </div>

      <AnimatePresence>
        {editingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setEditingSlot(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl"
            >
              <GlassCard className="!p-8 overflow-hidden relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
                
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <UserCog className="w-8 h-8 text-cyan-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Configure Slot</h2>
                      <p className="text-cyan-400 font-mono text-sm">{editingSlot.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingSlot(null)} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateSlot} className="space-y-8">
                  
                  {editingSlot.id !== 'SY-ADMIN' && (
                    <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex-1">
                        <label className="text-sm font-bold text-slate-300 uppercase tracking-widest block mb-1">Slot Status</label>
                        <p className="text-xs text-slate-500 leading-relaxed">Enable or disable this slot.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} />
                        <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500" />
                      </label>
                    </div>
                  )}

                  {!editingSlot.id.startsWith('TC') && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Operational Engines (Portals)</label>
                      <div className="grid grid-cols-2 gap-3">
                        {AVAILABLE_PORTALS.map(portal => (
                          <div key={portal.id} className={cn("p-4 rounded-xl border flex justify-between items-center", editAllowedPortals.includes(portal.id) ? "bg-white/5 border-white/10" : "bg-black/20 border-transparent")}>
                             <span className={cn("text-xs font-bold uppercase tracking-wide", portal.color)}>{portal.name}</span>
                             {editingSlot.id === 'SY-ADMIN' ? (
                               <Lock className="w-4 h-4 text-slate-500" />
                             ) : (
                               <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" checked={editAllowedPortals.includes(portal.id)} onChange={(e) => {
                                   if (e.target.checked) setEditAllowedPortals([...editAllowedPortals, portal.id]);
                                   else setEditAllowedPortals(editAllowedPortals.filter(id => id !== portal.id));
                                 }} />
                                 <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:bg-cyan-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                               </label>
                             )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                        required
                      />
                    </div>
                    
                    {!editingSlot.id.startsWith('TC') && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Override PIN Code</label>
                        <div className="relative">
                          <input 
                            type="password" 
                            value={editPin}
                            onChange={(e) => setEditPin(e.target.value)}
                            placeholder="••••"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors pl-10"
                          />
                          <KeyRound className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    )}
                  </div>

                  {editingSlot.id.startsWith('TC') && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Factory Badge ID</label>
                      <input 
                        type="text" 
                        value={editBadgeId}
                        onChange={(e) => setEditBadgeId(e.target.value)}
                        placeholder="e.g., PHY-BADGE-091"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                      />
                    </div>
                  )}

                  <div>
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Avatar Identity Color</label>
                     <div className="flex gap-3">
                        {['bg-cyan-500', 'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-slate-500'].map(color => (
                        <button
                           key={color} type="button"
                           onClick={() => setEditColor(color)}
                           className={cn('w-8 h-8 rounded-full transition-transform', color, editColor === color ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100')}
                        />
                        ))}
                     </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex gap-4">
                    <button type="button" onClick={() => setEditingSlot(null)} className="titan-button bg-white/5 hover:bg-white/10 text-white flex-1 flex justify-center items-center gap-2">
                       Cancel
                    </button>
                    <button type="submit" className="titan-button bg-slate-700 hover:bg-slate-600 text-white flex-1 flex justify-center items-center gap-2">
                       <Save className="w-5 h-5" /> Save Configuration
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirmDeactivateSlot && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setConfirmDeactivateSlot(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md"
            >
              <GlassCard className="!p-8 overflow-hidden relative border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.15)]">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 text-rose-500 border border-rose-500/20">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Deactivate Slot?</h3>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    You are about to revoke system access for <strong className="text-rose-400">{confirmDeactivateSlot.name}</strong> ({confirmDeactivateSlot.id}). This action will disable their tracking capabilities until re-enabled. Are you sure you want to proceed?
                  </p>
                  
                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => setConfirmDeactivateSlot(null)} 
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 hover:border-white/10 shrink-0"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                         try {
                           await db.userOverrides.put({ ...confirmDeactivateSlot, isActive: false } as User);
                           showSuccess('Access Revoked', `Slot ${confirmDeactivateSlot.id} has been disabled.`);
                         } catch (err: any) {
                           showError('Action Failed', err.message);
                         } finally {
                           setConfirmDeactivateSlot(null);
                         }
                      }}
                      className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] shrink-0"
                    >
                      Confirm Deactivation
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
