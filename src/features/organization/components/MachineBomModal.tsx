import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/core/db';
import { usePdrLibrary } from '@/features/pdr-engine/hooks/usePdrLibrary';
import { X, Search, Plus, Trash2, Cpu, Wrench } from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';

interface MachineBomModalProps {
  machineId: string;
  machineName: string;
  onClose: () => void;
}

export function MachineBomModal({ machineId, machineName, onClose }: MachineBomModalProps) {
  const { blueprints, getMachineBOM, linkPartToMachine, unlinkPartFromMachine } = usePdrLibrary();
  const machineParts = getMachineBOM(machineId);
  const [searchTerm, setSearchTerm] = useState('');

  const availableBlueprints = blueprints.filter(b => 
    !machineParts?.find(mp => mp.id === b.id) &&
    (b.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#050508] border border-white/10 border-t-indigo-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 uppercase tracking-tight">
              <Wrench className="w-6 h-6 text-indigo-400" />
              BOM Configuration
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              Linking Spare Parts to Digital Twin: <span className="text-indigo-400">{machineName}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          {/* Current BOM */}
          <div className="border-r border-white/5 p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Linked Components</h4>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-[9px] font-bold text-indigo-300 border border-indigo-500/20">
                {machineParts?.length || 0} ITEMS
              </span>
            </div>

            <div className="space-y-3">
              {machineParts?.map(p => (
                <div key={p.id} className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white truncate max-w-[150px]">{p.reference}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.unit}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => unlinkPartFromMachine(machineId, p.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!machineParts || machineParts.length === 0) && (
                <div className="py-12 text-center opacity-40 text-slate-400 text-xs font-medium">
                  Empty Bill of Materials. Populate Registry.
                </div>
              )}
            </div>
          </div>

          {/* Catalog Search */}
          <div className="p-6 overflow-y-auto bg-black/5 custom-scrollbar">
            <div className="mb-6 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Component Catalog</h4>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" placeholder="Search reference..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              {availableBlueprints.map(b => (
                <button
                  key={b.id}
                  onClick={() => linkPartToMachine(machineId, b.id)}
                  className="w-full p-4 rounded-xl bg-white/[0.01] hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/20 text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">{b.reference}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{b.unit}</p>
                    </div>
                  </div>
                </button>
              ))}
              {availableBlueprints.length === 0 && (
                <div className="py-12 text-center opacity-40 text-slate-400 text-xs font-medium">
                  No compatible components found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/[0.01] border-t border-white/5 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest shadow-[0_10px_30px_rgba(99,102,241,0.3)] transition-all">
            Finish Sync
          </button>
        </div>
      </motion.div>
    </div>
  );
}
