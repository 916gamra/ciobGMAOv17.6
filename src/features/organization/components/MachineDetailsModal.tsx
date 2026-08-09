import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Cpu, Settings, Calendar, Tag, Shield, AlertTriangle, Link2, 
  Trash2, Layers, Briefcase, PlusCircle, Wrench, Factory, Package
} from 'lucide-react';
import { db, type MachineBlueprint } from '@/core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';

interface MachineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: any;
  onEditBlueprint: () => void; // Triggers the MachineWizardModal at Step 3
  onTriggerLinkPdr: () => void; // Triggers the PDR linking wizard
}

export function MachineDetailsModal({ 
  isOpen, 
  onClose, 
  machine, 
  onEditBlueprint,
  onTriggerLinkPdr
}: MachineDetailsModalProps) {
  
  // Fetch Blueprint details
  const blueprint = useLiveQuery(async () => {
    if (!machine || !machine.blueprintId) return null;
    return await db.machineBlueprints.get(machine.blueprintId);
  }, [machine]);

  // Fetch PM Technician details
  const technicianName = useLiveQuery(async () => {
    if (!machine || !machine.technicianId) return 'Unassigned';
    const tech = await db.technicians.get(machine.technicianId);
    return tech ? tech.name : 'Unknown';
  }, [machine]);

  // Fetch Linked PDR mappings
  const linkedParts = useLiveQuery(async () => {
    if (!machine) return [];
    const mappings = await db.machinePartMappings.where('machineId').equals(machine.id).toArray();
    const partsList = [];
    for (const map of mappings) {
      const bp = await db.pdrBlueprints.get(map.blueprintId);
      if (bp) {
        partsList.push({
          mappingId: map.id,
          blueprintId: bp.id,
          model: bp.model,
          powerOrForce: bp.powerOrForce,
          technicalSpecs: bp.technicalSpecs,
          unit: bp.unit
        });
      }
    }
    return partsList;
  }, [machine]);

  // Handle unlinking a PDR spare part from the machine
  const handleUnlinkPart = async (mappingId: string, partId: string) => {
    try {
      await db.machinePartMappings.delete(mappingId);
      toast.success(`تم إلغاء ربط قطعة الغيار ${partId} بنجاح!`);
    } catch (err: any) {
      toast.error(`فشل فك الارتباط: ${err.message}`);
    }
  };

  if (!isOpen || !machine) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          className="relative w-full max-w-xl bg-[#070b12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Accent border top */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-400" />

          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  {machine.templateName || 'Direct Machine'}
                </h3>
                <p className="text-[10px] font-mono text-indigo-400/80 uppercase tracking-widest mt-0.5">
                  Asset ID: {machine.referenceCode}
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

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
            
            {/* 1. Core Technical Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Physical Serial No.</span>
                <span className="text-xs font-mono font-bold text-indigo-400">{machine.serialNumber}</span>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Manufacturing Year</span>
                <span className="text-xs font-mono font-bold text-white">{machine.manufacturingYear}</span>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Operational Sector</span>
                <span className="text-xs font-bold text-white">{machine.sectorName}</span>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">PM Technician Owner</span>
                <span className="text-xs font-bold text-indigo-300">{technicianName}</span>
              </div>
            </div>

            {/* 2. Machine Blueprint Model section */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Machine Model Specifications</h4>
              {blueprint ? (
                <div className="p-4 bg-indigo-500/[0.02] border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white uppercase block">{blueprint.brand} {blueprint.model}</span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Power: {blueprint.powerOrForce} | Energy: {blueprint.energySource}
                    </span>
                    <span className="text-[9px] text-indigo-400 font-mono block mt-1">
                      Nomenclature Ref: {blueprint.reference}
                    </span>
                  </div>
                  <button
                    onClick={onEditBlueprint}
                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    Change Model
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-400 block">Direct Asset (No Blueprint linked)</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        هذه الآلة مسجلة مباشرة دون نموذج تجاري مسبق. يمكنك ربطها بنموذج لتوحيد المواصفات.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onEditBlueprint}
                    className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-widest shrink-0 transition-all"
                  >
                    Link Blueprint
                  </button>
                </div>
              )}
            </div>

            {/* 3. Linked Spare Parts (Commercial B.O.M) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Commercial B.O.M (قطع غيار تجارية مرتبطة)
                </h4>
                <button
                  type="button"
                  onClick={onTriggerLinkPdr}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Link Spare Part
                </button>
              </div>

              {linkedParts && linkedParts.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {linkedParts.map((part) => (
                    <div 
                      key={part.mappingId}
                      className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                          <Layers className="w-3.5 h-3.5 text-teal-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-white truncate uppercase">
                            {part.model}
                          </span>
                          <span className="block text-[9px] font-mono text-teal-400 mt-0.5">
                            ID: {part.blueprintId} | Specs: {part.powerOrForce} / {part.technicalSpecs}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnlinkPart(part.mappingId, part.blueprintId)}
                        className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0"
                        title="Unlink Spare Part"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center">
                  <Package className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-500">لا توجد قطع غيار تجارية مرتبطة بهذه الآلة حالياً.</p>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/5 bg-white/[0.01] flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              Done / إغلاق
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
