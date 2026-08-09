import { PageHeader } from "@/shared/components/PageHeader";
import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Hash, Search, Plus, Filter, Database, FileText, Settings2, BarChart2, Info, LayoutTemplate, Copy } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMasterCatalogEngine } from '../hooks/useMasterCatalogEngine';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { GlassCard } from '@/shared/components/GlassCard';
import { cn } from '@/shared/utils';
import { generatePdrSlotId } from '@/core/config/pdrMatrix';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function PartMasterView() {
  const { blueprints, templates, families, createBlueprint } = useMasterCatalogEngine();
  const { showSuccess, showError } = useNotifications();
  const parentRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [newBlueprintRef, setNewBlueprintRef] = useState('');
  // Vis-specific
  const [visLength, setVisLength] = useState('');

  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const filteredBlueprints = useMemo(() => {
    return blueprints.filter(b => b.id.toLowerCase().includes(searchTerm.toLowerCase()) || b.reference.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [blueprints, searchTerm]);

  const virtualizer = useVirtualizer({
    count: filteredBlueprints.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // Reduced card height approximation
    overscan: 5,
  });

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const isVis = selectedTemplate?.skuBase?.startsWith('VI-');

  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlueprintRef || !selectedTemplate) return;
    
    // Compute next sequential 1..999 slot index according to the 999 slots rule
    const templateBlueprints = blueprints.filter(b => b.templateId === selectedTemplate.id);
    const existingIds = templateBlueprints.map(b => b.id);
    let nextSlotIndex = 1;
    let deterministicId = '';
    
    while (nextSlotIndex <= 999) {
      deterministicId = generatePdrSlotId(selectedTemplate.skuBase, nextSlotIndex);
      if (!existingIds.includes(deterministicId)) {
        break;
      }
      nextSlotIndex++;
    }

    if (nextSlotIndex > 999) {
      showError('Capacity Reached', 'This template has exhausted all 999 slots.');
      return;
    }

    try {
      await createBlueprint({
        id: deterministicId, // pass sequential deterministic ID
        templateId: selectedTemplate.id,
        reference: (newBlueprintRef + (isVis ? `x${visLength}` : '')).toUpperCase(),
        unit: 'Pcs',
        minThreshold: 2
      });
      setNewBlueprintRef('');
      setVisLength('');
      setIsAdding(false);
      showSuccess('Blueprint Slot Activated', `Slot ${deterministicId} has been successfully brought online.`);
    } catch (err: any) {
      showError('System Error', err.message);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col gap-6 relative z-10 lg:px-4"
    >
      <PageHeader
        title="Part Blueprints Registry"
        subtitle="Technical master registry for standard component parts and catalog references."
        icon={<Database className="w-6 h-6 text-amber-500" />}
        actions={
          <>
            <StatCompact icon={<Database className="w-4 h-4 text-amber-500" />} label="Part Blueprints" value={blueprints.length.toString()} />
            <StatCompact icon={<LayoutTemplate className="w-4 h-4 text-emerald-500" />} label="Templates" value={templates.length.toString()} />
          </>
        }
      />

      <motion.div variants={itemVariants} className="flex-1 flex flex-col min-h-0">
        <GlassCard className="!p-0 border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl h-full flex flex-col min-h-[600px]">
          <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Active Part Blueprints</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Component Catalog Specifications</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search blueprint reference..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="titan-input py-2.5 pl-11 pr-3 w-64 shadow-none"
                />
              </div>
              {!isAdding && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="titan-button titan-button-primary bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 shrink-0 !py-2.5"
                >
                  <Plus className="w-4 h-4" /> Add Part Blueprint
                </button>
              )}
            </div>
          </div>

          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="border-b border-white/5 bg-white/[0.02]"
            >
              <div className="p-8 relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-amber-400" /> Define Commercial Part Blueprint
                </h2>
                
                <form onSubmit={handleCreateBlueprint} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Family</label>
                      <select 
                        required value={selectedFamilyId} onChange={e => { setSelectedFamilyId(e.target.value); setSelectedTemplateId(''); }} 
                        className="titan-input appearance-none py-3"
                      >
                        <option value="" disabled className="bg-[#14161f]">--- SELECT FAMILY ---</option>
                        {families.map(f => <option key={f.id} value={f.id} className="bg-[#14161f]">{f.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Template</label>
                      <select 
                        required value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} 
                        disabled={!selectedFamilyId}
                        className="titan-input appearance-none py-3"
                      >
                        <option value="" disabled className="bg-[#14161f]">--- SELECT TEMPLATE ---</option>
                        {templates.filter(t => t.familyId === selectedFamilyId).map(t => <option key={t.id} value={t.id} className="bg-[#14161f]">{t.name} ({t.skuBase})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{isVis ? 'Diameter' : 'Standard Measurement / SKF Code'}</label>
                      <input 
                        required value={newBlueprintRef} onChange={e => setNewBlueprintRef(e.target.value)} 
                        placeholder={isVis ? "e.g. 8" : "e.g. 6205 or 42"} 
                        className="titan-input text-amber-400 uppercase py-3"
                      />
                    </div>
                    {isVis && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Length</label>
                      <input 
                        required value={visLength} onChange={e => setVisLength(e.target.value)} 
                        placeholder="e.g. 30" 
                        className="titan-input text-amber-400 uppercase py-3"
                      />
                    </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Info className="w-3 h-3" /> System automatically computes the unique sequence code according to the 999 slots rule.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setIsAdding(false)}
                        className="titan-button titan-button-outline !px-6"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="titan-button titan-button-primary bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] !px-8"
                      >
                        <Database className="w-4 h-4" /> Instantiate Blueprint
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Virtualized Blueprints List */}
          <div 
            ref={parentRef} 
            className="flex-1 w-full custom-scrollbar bg-[#0a0a0f]/10 p-8 overflow-auto"
          >
            <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const blueprint = filteredBlueprints[virtualItem.index];
                const tmpl = templates?.find(t => t.id === blueprint.templateId);
                const fam = families?.find(f => f.id === tmpl?.familyId);

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                      paddingBottom: '16px'
                    }}
                  >
                    <div className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/5 hover:border-amber-500/30 overflow-hidden flex flex-col md:flex-row group transition-all duration-300">
                      <div className="p-5 border-b md:border-b-0 md:border-r border-white/5 bg-[#0a0a0f]/20 flex flex-col justify-center min-w-[280px] shrink-0">
                         <div className="flex items-center gap-1.5 mb-3">
                           <span className="text-[9px] font-bold tracking-widest uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shadow-sm">
                             {fam?.name || 'GEN'}
                           </span>
                           <span className="text-[9px] font-bold tracking-widest uppercase text-slate-500">/</span>
                           <span className="text-[9px] font-bold tracking-widest uppercase text-slate-400">
                             {tmpl?.name || 'N/A'}
                           </span>
                         </div>
                         <h3 className="text-xl font-bold text-white font-mono tracking-tight group-hover:text-amber-400 transition-colors flex items-center gap-3">
                           {blueprint.id}
                           <button className="opacity-0 group-hover:opacity-100 p-1 bg-white/5 hover:bg-white/10 rounded-md text-slate-400 transition-all active:scale-95"><Copy className="w-3.5 h-3.5" /></button>
                         </h3>
                      </div>

                      <div className="p-5 flex flex-1 items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        
                        <div className="flex gap-8 relative z-10">
                          <div className="flex flex-col">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-500/50" /> Reference</p>
                            <p className="text-sm font-bold text-slate-200">{blueprint.reference}</p>
                          </div>
                          <div className="w-px h-8 bg-white/5 self-center hidden sm:block" />
                          <div className="flex flex-col">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-amber-500/50" /> Min Alert</p>
                            <p className="text-sm font-bold text-amber-400 font-mono">{blueprint.minThreshold}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end justify-center relative z-10 shrink-0">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 mb-3 bg-[#0a0a0f]/40 px-2 py-1 rounded-md border border-white/5">{blueprint.id}</span>
                          <button className="text-amber-400 hover:text-black uppercase tracking-widest font-bold px-4 py-2 bg-amber-500/10 hover:bg-amber-500 rounded-xl transition-colors text-[10px] border border-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            View Slot
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredBlueprints.length === 0 && !isAdding && (
              <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02] mt-4">
                <Database className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Matrix Dormant</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Activate a PDR slot to begin tracking inventory.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function StatCompact({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors group">
      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-base font-bold text-white -mt-0.5">{value}</span>
      </div>
    </div>
  );
}


