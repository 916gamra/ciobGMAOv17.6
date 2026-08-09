import { PageHeader } from "@/shared/components/PageHeader";
import { StatCompact } from "@/shared/components/StatCompact";
import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Network, Plus, Trash2, Edit3, Save, Search, Activity, Users, Cpu, Layers } from 'lucide-react';
import { useOrganizationEngine } from '../hooks/useOrganizationEngine';
import { useAuthSlots } from '@/features/auth/hooks/useAuthSlots';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { GlassCard } from '@/shared/components/GlassCard';
import { useTranslation } from 'react-i18next';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function SectorRegistryView() {
  const { t } = useTranslation();
  const { sectors, machines, createSector, updateSector, deleteSector } = useOrganizationEngine();
  const allStaff = useAuthSlots();
  const activeTechnicians = allStaff.filter(s => s.isActive && (s.id.startsWith('TC') || s.id.startsWith('OP')));
  
  const { showSuccess, showError } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerName, setManagerName] = useState('');
  const [preventiveTechId, setPreventiveTechId] = useState('');

  const activeSectors = sectors.filter(s => s.status === 'Active');
  const availableSlots = sectors.filter(s => s.status === 'Dormant');
  const availableSlot = availableSlots.length > 0 ? availableSlots[0] : null;

  const filteredSectors = activeSectors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.managerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      if (editingId) {
        await updateSector(editingId, { name, description, managerName, preventiveTechId });
        showSuccess('Zone Updated', `${name} parameters adjusted.`);
      } else {
        if (!availableSlot) {
            throw new Error('All 15 Sector lots are already active.');
        }
        await updateSector(availableSlot.id, { name, description, managerName, preventiveTechId, status: 'Active' });
        showSuccess('Zone Activated', `${name} is active.`);
      }
      handleCancel();
    } catch (err: any) {
      showError('Action Failed', err.message);
    }
  };

  const handleEdit = (sector: any) => {
    setEditingId(sector.id);
    setName(sector.name);
    setDescription(sector.description || '');
    setManagerName(sector.managerName || '');
    setPreventiveTechId(sector.preventiveTechId || '');
    setIsAdding(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const hasMachines = machines.some(m => m.sectorId === id);
    
    if (hasMachines) {
      showError('Constraint Violation', 'Cannot delete zone containing active machines. Reassign them first.');
      return;
    }

    if (window.confirm(`Decommission Zone: ${name}?`)) {
      try {
        await deleteSector(id);
        showSuccess('Zone Decommissioned', `${name} has been removed.`);
      } catch (err: any) {
        showError('Action Failed', err.message);
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setManagerName('');
    setPreventiveTechId('');
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col gap-6 relative z-10"
    >
      <PageHeader
        title={t('sectors.title', 'Production Zones')}
        subtitle={t('sectors.subtitle', 'Macro-Level Facility Organization & Area Management.')}
        icon={<Network className="w-8 h-8 text-indigo-400" />}
        badgeColor="indigo"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatCompact 
              icon={<Network className="w-4 h-4 text-indigo-400" />} 
              label={t('sectors.activeZones', 'Active Zones')} 
              value={activeSectors.length.toString()} 
            />
            <StatCompact 
              icon={<Layers className="w-4 h-4 text-amber-400/80" />} 
              label={t('sectors.dormantSlots', 'Dormant Slots')} 
              value={availableSlots.length.toString()} 
            />
            <StatCompact 
              icon={<Cpu className="w-4 h-4 text-cyan-400" />} 
              label={t('sectors.machines', 'Machines')} 
              value={machines.length.toString()} 
            />
            <StatCompact 
              icon={<Users className="w-4 h-4 text-emerald-400" />} 
              label={t('sectors.personnel', 'Personnel')} 
              value={activeTechnicians.length.toString()} 
            />
          </div>
        }
      />
      
      <motion.div variants={itemVariants} className="flex-1 min-h-0 flex flex-col">
        <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-full flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl">
          <div className="p-6 md:p-8 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Network className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">{t('sectors.directoryTitle', 'Active Zone Directory')}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('sectors.directorySubtitle', 'Global Sector Registry')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="relative group flex-1 md:w-64">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('sectors.searchPlaceholder', 'Search zones...')} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="titan-input py-2.5 pl-11 pr-3 rtl:pr-11 rtl:pl-3 w-full shadow-none"
                />
              </div>
              {!isAdding && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all shrink-0 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>{t('sectors.initializeBtn', 'Initialize Zone')}</span>
                </button>
              )}
            </div>
          </div>

          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="border-b border-white/10 bg-white/[0.02]"
            >
              <div className="p-8 relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" /> {editingId ? `${t('sectors.reconfigureTitle', 'Reconfigure Zone')} [${editingId}]` : `${t('sectors.activateSlotTitle', 'Activate Slot')} [${availableSlot?.id}]`}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">{t('sectors.designationLabel', 'Zone Designation')}</label>
                       <input 
                         required 
                         type="text"
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         placeholder="e.g., PACKAGING SECTOR A" 
                         className="titan-input py-3"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">{t('sectors.managerLabel', 'Sector Manager (Head)')}</label>
                       <input 
                         type="text"
                         value={managerName}
                         onChange={(e) => setManagerName(e.target.value)}
                         placeholder="e.g., Mohammed Zaradi" 
                         className="titan-input py-3"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">{t('sectors.pmTechLabel', 'Assigned Preventive Technician')}</label>
                      <select
                        value={preventiveTechId}
                        onChange={(e) => setPreventiveTechId(e.target.value)}
                        className="titan-input py-3 appearance-none bg-[#0a0a0f] text-white"
                      >
                        <option value="">{t('sectors.generalistOption', 'No specific technician (Generalist Pool)')}</option>
                        {activeTechnicians.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.role || 'Generalist'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">{t('sectors.detailsLabel', 'Operational Directive / Area Details')}</label>
                      <input 
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Critical Line 1, Main Hall..." 
                        className="titan-input py-3"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={handleCancel}
                      className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all"
                    >
                      {t('sectors.abortBtn', 'Abort')}
                    </button>
                    <button 
                      type="submit" 
                      className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> {editingId ? t('sectors.commitBtn', 'Commit Changes') : t('sectors.initBtn', 'Initialize')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#0a0a0f]/40 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredSectors.map((sector) => {
                  const zoneTechs = activeTechnicians.filter(t => t.id === sector.preventiveTechId).length;
                  const zoneMachines = machines.filter(m => m.sectorId === sector.id).length;
                  
                  return (
                    <motion.div 
                      key={sector.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="titan-card overflow-hidden flex flex-col group relative shadow-2xl p-0 hover:border-indigo-500/40 transition-all duration-300 border-white/10 bg-[#0a0a0f]/60 backdrop-blur-xl"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                      
                      <div className="p-6 relative z-10 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                              <Network className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-white tracking-tight uppercase">{sector.name}</h3>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-0.5">ID: {sector.id.substring(0, 8)}</p>
                            </div>
                          </div>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1 bg-[#0a0a0f]/60 backdrop-blur-md border border-white/10 p-1 rounded-lg">
                            <button 
                              onClick={() => handleEdit(sector)}
                              className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-colors"
                              title="Edit Zone"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(sector.id, sector.name)}
                              className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Decommission Zone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-slate-300 font-medium line-clamp-2 h-8 leading-relaxed">
                          {sector.description || t('sectors.noParams', 'No direct operational parameters defined. Following universal factory protocol.')}
                        </p>
                        
                        {sector.managerName && (
                          <div className="mt-4 flex flex-col gap-2">
                             <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-1 ml-1 opacity-80">{t('sectors.leadership', 'Sector Leadership')}</div>
                             <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 rounded-2xl group/manager hover:bg-indigo-500/20 transition-all duration-300">
                               <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 group-hover/manager:scale-110 transition-transform shrink-0">
                                 <Users className="w-4 h-4 text-indigo-400" />
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[11px] font-bold text-white uppercase tracking-wider">{sector.managerName}</span>
                                 <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest opacity-90">{t('sectors.headTitle', 'Operational Head')}</span>
                               </div>
                             </div>
                             {sector.preventiveTechId && (
                               <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                                 <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                 <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">{t('sectors.pmTechAssigned', 'PM Tech Assigned')}</span>
                               </div>
                             )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 divide-x divide-white/10 bg-white/[0.02] border-t border-white/10 mt-auto relative z-10">
                        <div className="p-4 flex flex-col items-center justify-center gap-1 group/stat hover:bg-white/[0.02] transition-colors">
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-400 group-hover/stat:scale-110 transition-transform" /> {t('sectors.personnel', 'Staff')}
                          </div>
                          <span className="text-lg font-bold font-mono text-white">{zoneTechs}</span>
                        </div>
                        <div className="p-4 flex flex-col items-center justify-center gap-1 group/stat hover:bg-white/[0.02] transition-colors">
                          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-1.5">
                             <Cpu className="w-3.5 h-3.5 text-cyan-400 group-hover/stat:scale-110 transition-transform" /> {t('sectors.machines', 'Machines')}
                          </div>
                          <span className="text-lg font-bold font-mono text-white">{zoneMachines}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {filteredSectors.length === 0 && !isAdding && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                  <Network className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('sectors.noZones', 'No Zones Registered')}</p>
                  <p className="text-xs text-slate-500 mt-2">{t('sectors.noZonesHelp', 'Initialize the first production zone to continue.')}</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

