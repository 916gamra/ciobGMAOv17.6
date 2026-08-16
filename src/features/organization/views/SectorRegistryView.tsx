import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Network, Plus, Trash2, Edit3, Save, Activity, Users, Cpu, Layers, Eye, LayoutGrid, ShieldCheck } from 'lucide-react';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
import { useOrganizationEngine } from '../hooks/useOrganizationEngine';
import { useAuthSlots } from '@/features/auth/hooks/useAuthSlots';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { GlassCard } from '@/shared/components/GlassCard';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';

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
  const [statusFilter, setStatusFilter] = useState('Active');
  const [techFilter, setTechFilter] = useState('ALL');
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerName, setManagerName] = useState('');
  const [preventiveTechId, setPreventiveTechId] = useState('');

  const activeSectors = useMemo(() => sectors.filter(s => s.status === 'Active'), [sectors]);
  const availableSlots = useMemo(() => sectors.filter(s => s.status === 'Dormant'), [sectors]);
  const availableSlot = availableSlots.length > 0 ? availableSlots[0] : null;

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'status',
      label: t('sectors.statusFilterLabel', 'Zone Status'),
      value: statusFilter,
      onChange: setStatusFilter,
      allLabel: t('sectors.allStatuses', 'All Zones (Active & Dormant)'),
      type: 'chips',
      options: [
        { value: 'Active', label: t('sectors.filterActive', 'Active Zones'), count: activeSectors.length },
        { value: 'Dormant', label: t('sectors.filterDormant', 'Dormant Slots'), count: availableSlots.length }
      ]
    },
    {
      id: 'tech',
      label: t('sectors.techFilterLabel', 'PM Technician'),
      value: techFilter,
      onChange: setTechFilter,
      allLabel: t('sectors.allTechs', 'All Assignments'),
      type: 'chips',
      options: [
        { value: 'ASSIGNED', label: t('sectors.filterAssigned', 'Assigned to PM Tech') },
        { value: 'UNASSIGNED', label: t('sectors.filterUnassigned', 'Unassigned') }
      ]
    }
  ], [statusFilter, techFilter, activeSectors.length, availableSlots.length, t]);

  const filteredSectors = useMemo(() => {
    return sectors.filter(s => {
      const matchSearch = !searchTerm || 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.managerName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchTech = techFilter === 'ALL' || 
        (techFilter === 'ASSIGNED' && s.preventiveTechId) || 
        (techFilter === 'UNASSIGNED' && !s.preventiveTechId);

      return matchSearch && matchStatus && matchTech;
    });
  }, [sectors, searchTerm, statusFilter, techFilter]);

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
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-slate-800 dark:text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr" dir="ltr">
      <div className="p-6 md:p-8 pb-0 shrink-0">
      <PageHeader
        title={t('sectors.title', 'Production Zones')}
        subtitle={t('sectors.subtitle', 'Macro-Level Facility Organization & Area Management')}
        icon={<Network className="w-7 h-7 text-indigo-400" />}
        badgeText={t('sectors.badge', 'Production Zones')}
        badgeColor="indigo"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={t('sectors.activeZones', 'Active Zones')}
            subtitle="ACTIVE ZONES"
            value={activeSectors.length}
            icon={<Network className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title={t('sectors.dormantSlots', 'Dormant Slots')}
            subtitle="DORMANT SLOTS"
            value={availableSlots.length}
            icon={<Layers className="w-3.5 h-3.5" />}
            color="amber"
          />
          <HeaderBentoCard
            title={t('sectors.machines', 'Machines')}
            subtitle="MACHINES"
            value={machines.length}
            icon={<Cpu className="w-3.5 h-3.5" />}
            color="cyan"
          />
          <HeaderBentoCard
            title={t('sectors.personnel', 'Personnel')}
            subtitle="PERSONNEL"
            value={activeTechnicians.length}
            icon={<Users className="w-3.5 h-3.5" />}
            color="emerald"
          />
        </div>
      </PageHeader>
      </div>
      
      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 gap-6 min-h-0">
      <motion.div variants={itemVariants} className="flex-1 min-h-0 flex flex-col">
        <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-full flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl">
          {/* Universal Crystal Command Bar */}
          <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
            {/* Right Side (RTL): Context Count */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Network className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">{t('sectors.directoryTitle', 'Active Zone Directory')}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                    {filteredSectors.length} {t('sectors.activeZones', 'Active')}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('sectors.directorySubtitle', 'Global Sector Registry')}</p>
              </div>
            </div>

            {/* Center & Left: Unified Search & Filter with View Switcher & Action */}
            <div className="flex-1 max-w-2xl w-full">
              <UnifiedSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={t('sectors.searchPlaceholder', 'Search zones...')}
                filterGroups={filterGroups}
                themeColor="indigo"
                extraControls={
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDisplayMode('table')}
                        className={cn(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          displayMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                        )}
                        title={t('sectors.tableTooltip', 'Crystal Table View')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayMode('cards')}
                        className={cn(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          displayMode === 'cards' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                        )}
                        title={t('sectors.cardsTooltip', 'Cards Grid View')}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>

                    {!isAdding && (
                      <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all shrink-0 flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>{t('sectors.initializeBtn', 'Initialize Zone')}</span>
                      </button>
                    )}
                  </div>
                }
              />
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

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#0a0a0f]/40 p-4 md:p-6">
            {displayMode === 'table' ? (
              /* Crystal Table View */
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900/60 backdrop-blur-xl shadow-2xl flex flex-col max-h-[600px]">
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                  <table className="w-full text-start border-collapse">
                    <thead className="bg-[#12141d] border-b-2 border-white/15 text-slate-200 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
                      <tr>
                        <th className="py-3.5 px-4 text-start font-bold">{t('sectors.thCode', 'Zone Code')}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{t('sectors.thDesignation', 'Designation & Details')}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{t('sectors.thManager', 'Sector Manager')}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{t('sectors.thPmTech', 'Preventive Tech')}</th>
                        <th className="py-3.5 px-4 text-center font-bold">{t('sectors.thMachines', 'Machines')}</th>
                        <th className="py-3.5 px-4 text-center font-bold">{t('sectors.thPersonnel', 'Staff')}</th>
                        <th className="py-3.5 px-4 text-center font-bold">{t('sectors.thStatus', 'Status')}</th>
                        <th className="py-3.5 px-4 text-center font-bold">{t('sectors.thActions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredSectors.map((sector, idx) => {
                        const zoneTechs = activeTechnicians.filter(t => t.id === sector.preventiveTechId).length;
                        const zoneMachines = machines.filter(m => m.sectorId === sector.id).length;
                        const assignedTech = activeTechnicians.find(t => t.id === sector.preventiveTechId);

                        return (
                          <tr 
                            key={sector.id} 
                            className={cn(
                              "transition-colors duration-150 group text-start",
                              idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                              "hover:bg-indigo-500/15"
                            )}
                          >
                            {/* Code / ID */}
                            <td className="py-3.5 px-4 font-mono font-bold">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] inline-flex items-center gap-1">
                                <Network className="w-3 h-3 text-indigo-400" />
                                {sector.id.substring(0, 8).toUpperCase()}
                              </span>
                            </td>

                            {/* Zone Designation & Details */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-white text-xs tracking-tight group-hover:text-indigo-300 transition-colors uppercase">
                                  {sector.name}
                                </span>
                                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
                                  {sector.description || t('sectors.defaultProtocol', 'Standard Operational Protocol')}
                                </span>
                              </div>
                            </td>

                            {/* Sector Manager */}
                            <td className="py-3.5 px-4">
                              {sector.managerName ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                    <Users className="w-3 h-3" />
                                  </div>
                                  <span className="font-bold text-slate-200 text-xs">{sector.managerName}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">{t('sectors.unassignedManager', 'Unassigned')}</span>
                              )}
                            </td>

                            {/* Assigned PM Tech */}
                            <td className="py-3.5 px-4">
                              {assignedTech ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Activity className="w-3 h-3" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-200 text-xs">{assignedTech.name}</span>
                                    <span className="text-[9px] text-emerald-400 font-mono">{assignedTech.id}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">{t('sectors.generalistPool', 'Generalist Pool')}</span>
                              )}
                            </td>

                            {/* Machines Count */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white text-xs">
                                {zoneMachines}
                              </span>
                            </td>

                            {/* Staff Count */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-xs">
                                {zoneTechs}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {t('sectors.statusActive', 'Active')}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => handleEdit(sector)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                  title={t('sectors.editZone', 'Edit Zone')}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(sector.id, sector.name)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 transition-colors cursor-pointer"
                                  title={t('sectors.decommissionZone', 'Decommission Zone')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Cards View */
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
                        className="titan-card overflow-hidden flex flex-col group relative shadow-none p-0 hover:border-indigo-500 transition-all duration-300 border border-white/10 bg-[#0a0a0f] rounded-3xl"
                      >
                        <div className="p-6 relative z-10 flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center shrink-0">
                                <Network className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-slate-400 group-hover:text-white group-hover:font-black tracking-tight uppercase transition-all duration-300">{sector.name}</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold mt-0.5">ID: {sector.id.substring(0, 8)}</p>
                              </div>
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1 bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-lg">
                              <button 
                                onClick={() => handleEdit(sector)}
                                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Edit Zone"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(sector.id, sector.name)}
                                className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Decommission Zone"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors duration-300 font-medium line-clamp-2 h-8 leading-relaxed">
                            {sector.description || t('sectors.noParams', 'No direct operational parameters defined. Following universal factory protocol.')}
                          </p>
                          
                          {sector.managerName && (
                            <div className="mt-4 flex flex-col gap-2">
                               <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-1 ml-1 opacity-80">{t('sectors.leadership', 'Sector Leadership')}</div>
                               <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl group/manager hover:bg-white/10 transition-all duration-300">
                                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/manager:scale-110 transition-transform shrink-0">
                                   <Users className="w-4 h-4 text-slate-400" />
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="text-[11px] font-bold text-slate-300 group-hover:text-white uppercase tracking-wider transition-colors">{sector.managerName}</span>
                                   <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-90">{t('sectors.headTitle', 'Operational Head')}</span>
                                 </div>
                               </div>
                               {sector.preventiveTechId && (
                                 <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                                   <Activity className="w-3.5 h-3.5 text-slate-400" />
                                   <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{t('sectors.pmTechAssigned', 'PM Tech Assigned')}</span>
                                 </div>
                               )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-white/10 bg-white/[0.02] border-t border-white/10 mt-auto relative z-10 transition-colors duration-300">
                          <div className="p-4 flex flex-col items-center justify-center gap-1 group/stat hover:bg-white/[0.05] transition-colors">
                            <div className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-400 tracking-widest flex items-center gap-1.5 transition-colors">
                              <Users className="w-3.5 h-3.5 text-slate-500 group-hover/stat:text-slate-300 group-hover/stat:scale-110 transition-all" /> {t('sectors.personnel', 'Staff')}
                            </div>
                            <span className="text-lg font-bold font-mono text-slate-400 group-hover:text-white transition-colors">{zoneTechs}</span>
                          </div>
                          <div className="p-4 flex flex-col items-center justify-center gap-1 group/stat hover:bg-white/[0.05] transition-colors">
                            <div className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-400 tracking-widest flex items-center gap-1.5 transition-colors">
                               <Cpu className="w-3.5 h-3.5 text-slate-500 group-hover/stat:text-slate-300 group-hover/stat:scale-110 transition-all" /> {t('sectors.machines', 'Machines')}
                            </div>
                            <span className="text-lg font-bold font-mono text-slate-400 group-hover:text-white transition-colors">{zoneMachines}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
            
            {filteredSectors.length === 0 && !isAdding && (
              <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <Network className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('sectors.noZones', 'No Zones Registered')}</p>
                <p className="text-xs text-slate-500 mt-2">{t('sectors.noZonesHelp', 'Initialize the first production zone to continue.')}</p>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
      </div>
    </div>
  );
}

