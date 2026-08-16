import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Users, UserCircle2, Pocket, Fingerprint, Lock, Edit3, X, Save, Activity, Eye, LayoutGrid, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
import { useAuthSlots } from '@/features/auth/hooks/useAuthSlots';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { db } from '@/core/db';
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

export function StaffRegistryView() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formBadgeId, setFormBadgeId] = useState('');
  const [formIsActive, setFormIsActive] = useState(false);
  
  const allSlots = useAuthSlots();
  // Filter for Staff (Exclude System Admin, or include OP and TC?)
  const staffSlots = useMemo(() => allSlots.filter(s => s.id.startsWith('TC') || s.id.startsWith('OP')), [allSlots]);
  const activeStaff = useMemo(() => staffSlots.filter(s => s.isActive), [staffSlots]);
  const tcSlotsCount = useMemo(() => staffSlots.filter(s => s.id.startsWith('TC')).length, [staffSlots]);
  const opSlotsCount = useMemo(() => staffSlots.filter(s => s.id.startsWith('OP')).length, [staffSlots]);

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'role',
      label: t('staff.roleFilterLabel', 'Staff Role'),
      value: roleFilter,
      onChange: setRoleFilter,
      allLabel: t('staff.allRoles', 'All Roles'),
      type: 'chips',
      options: [
        { value: 'TC', label: t('staff.roleTechnician', 'Technician'), count: tcSlotsCount },
        { value: 'OP', label: t('staff.roleOperator', 'Operator'), count: opSlotsCount }
      ]
    },
    {
      id: 'status',
      label: t('staff.statusFilterLabel', 'Activation Status'),
      value: statusFilter,
      onChange: setStatusFilter,
      allLabel: t('staff.allStatuses', 'All Statuses'),
      type: 'chips',
      options: [
        { value: 'ACTIVE', label: t('staff.statusActive', 'Active'), count: activeStaff.length },
        { value: 'SPARE', label: t('staff.statusSpare', 'Spare / Dormant'), count: staffSlots.length - activeStaff.length }
      ]
    }
  ], [roleFilter, statusFilter, tcSlotsCount, opSlotsCount, activeStaff.length, staffSlots.length, t]);

  const filteredStaff = useMemo(() => {
    return staffSlots.filter(t => {
      const matchSearch = !searchTerm || 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.realBadgeId || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRole = roleFilter === 'ALL' || t.id.startsWith(roleFilter);
      const matchStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && t.isActive) || 
        (statusFilter === 'SPARE' && !t.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [staffSlots, searchTerm, roleFilter, statusFilter]);

  const handleEdit = (staff: any) => {
      setEditingId(staff.id);
      setFormName(staff.name);
      setFormBadgeId(staff.realBadgeId || '');
      setFormIsActive(staff.isActive);
  };

  const handleCancel = () => {
      setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingId) return;
      try {
          await db.userOverrides.put({
              id: editingId,
              name: formName,
              realBadgeId: formBadgeId,
              isActive: formIsActive
          });
          showSuccess('Slot Updated', `Staff slot ${editingId} successfully modified.`);
          setEditingId(null);
      } catch (err: any) {
          showError('Update Failed', err.message);
      }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-slate-800 dark:text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr" dir="ltr">
      <div className="p-6 md:p-8 pb-0 shrink-0">
      <PageHeader
        title={t('staff.title', 'Operational Staff')}
        subtitle={t('staff.subtitle', 'Active Maintenance Personnel Directory')}
        icon={<Users className="w-7 h-7 text-indigo-400" />}
        badgeText={t('staff.badge', 'Staff Registry')}
        badgeColor="indigo"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={t('staff.totalSlots', 'Total Slots')}
            subtitle="TOTAL SLOTS"
            value={staffSlots.length}
            icon={<Users className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title={t('staff.activePersonnel', 'Active Personnel')}
            subtitle="ACTIVE PERSONNEL"
            value={activeStaff.length}
            icon={<UserCircle2 className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title={t('staff.spareSlots', 'Spare Slots')}
            subtitle="SPARE SLOTS"
            value={staffSlots.length - activeStaff.length}
            icon={<Pocket className="w-3.5 h-3.5" />}
            color="amber"
          />
          <HeaderBentoCard
            title={t('staff.matrixLock', 'Matrix Lock')}
            subtitle="MATRIX LOCK"
            value={t('staff.lockedValue', 'Secured')}
            icon={<Lock className="w-3.5 h-3.5" />}
            color="cyan"
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
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">{t('staff.directoryTitle', 'Active Staff Directory')}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                    {filteredStaff.length} {t('staff.totalSlots', 'Slots')}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('staff.directorySubtitle', 'Global Personnel Registry')}</p>
              </div>
            </div>

            {/* Center & Left: Unified Search & Filter with View Switcher */}
            <div className="flex-1 max-w-2xl w-full">
              <UnifiedSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={t('staff.searchPlaceholder', 'Search staff...')}
                filterGroups={filterGroups}
                themeColor="indigo"
                extraControls={
                  <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('table')}
                      className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer",
                        displayMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                      )}
                      title={t('staff.tableTooltip', 'Crystal Table View')}
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
                      title={t('staff.cardsTooltip', 'Cards Grid View')}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                }
              />
            </div>
          </div>

          {editingId && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="border-b border-white/10 bg-white/[0.02]"
            >
              <div className="p-8 relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" /> {t('staff.configureSlotTitle', 'Configure Slot')} [{editingId}]
                </h2>
                
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">{t('staff.realName', 'Real Name')}</label>
                       <input 
                         required 
                         type="text"
                         value={formName}
                         onChange={(e) => setFormName(e.target.value)}
                         placeholder="e.g. John Doe" 
                         className="titan-input py-3"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">{t('staff.badgeId', 'Physical Badge ID')}</label>
                       <input 
                         type="text"
                         value={formBadgeId}
                         onChange={(e) => setFormBadgeId(e.target.value)}
                         placeholder="e.g. BADGE-0123" 
                         className="titan-input py-3 font-mono"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 flex flex-col justify-end">
                      <label className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <input type="checkbox" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} className="rounded border-none bg-[#0a0a0f]/50 text-indigo-500 focus:ring-offset-0 focus:ring-0 w-5 h-5 cursor-pointer" />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">{t('staff.slotActiveStatus', 'Slot Active Status')}</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={handleCancel}
                      className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all cursor-pointer"
                    >
                      {t('staff.abortBtn', 'Abort')}
                    </button>
                    <button 
                      type="submit" 
                      className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> {t('staff.saveBtn', 'Save Configuration')}
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
                        <th className="py-3.5 px-4 text-start font-bold">{t('staff.thSlotId', 'Slot ID')}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{t('staff.thNameRole', 'Name & Title')}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{t('staff.thBadgeId', 'Physical Badge ID')}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{t('staff.thResponsibility', 'Rank & Responsibility')}</th>
                        <th className="py-3.5 px-4 text-center font-bold">{t('staff.thStatus', 'Activation Status')}</th>
                        <th className="py-3.5 px-4 text-center font-bold">{t('staff.thActions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredStaff.map((tech, idx) => (
                        <tr 
                          key={tech.id} 
                          className={cn(
                            "transition-colors duration-150 group text-start",
                            idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                            "hover:bg-indigo-500/15"
                          )}
                        >
                          {/* Slot ID */}
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] inline-flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${tech.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                              {tech.id}
                            </span>
                          </td>

                          {/* Staff Name & Initials */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0">
                                {tech.initials}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-white text-xs tracking-tight group-hover:text-indigo-300 transition-colors uppercase">
                                  {tech.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {tech.role || t('staff.defaultRole', 'Certified Maintenance Tech')}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Physical Badge ID */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono text-xs font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                                {tech.realBadgeId || t('staff.unassignedBadge', 'Not Configured')}
                              </span>
                            </div>
                          </td>

                          {/* Role / Responsibility */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold inline-flex items-center gap-1">
                              <Pocket className="w-3 h-3 text-slate-400" />
                              {tech.role}
                            </span>
                          </td>

                          {/* Active Status */}
                          <td className="py-3.5 px-4 text-center">
                            {tech.isActive ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                {t('staff.badgeFieldActive', 'Field Active')}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                {t('staff.badgeDormant', 'Dormant Slot')}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <button 
                              onClick={() => handleEdit(tech)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                              title={t('staff.configureTooltip', 'Configure Slot')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{t('staff.configureBtn', 'Configure')}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredStaff.map((tech) => (
                      <motion.div 
                        key={tech.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="titan-card overflow-hidden flex flex-col group relative shadow-none p-0 hover:border-indigo-500 transition-all duration-300 border border-white/10 bg-[#0a0a0f] rounded-3xl"
                      >
                        {/* ID Header Plaque */}
                        <div className="flex justify-between items-center bg-white/[0.02] p-4 border-b border-white/5 relative z-10 transition-colors duration-300 group-hover:bg-white/[0.04]">
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${tech.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
                             <span className={`text-[10px] font-mono tracking-widest uppercase font-bold transition-colors ${tech.isActive ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600'}`}>{tech.id}</span>
                          </div>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1 bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-lg">
                             <button 
                               onClick={() => handleEdit(tech)}
                               className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                               title={t('staff.configureTooltip', 'Configure Slot')}
                             >
                               <Edit3 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        </div>

                        <div className={`p-6 flex flex-col items-center text-center relative z-10 flex-1 ${!tech.isActive && 'opacity-60 grayscale'}`}>
                          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-semibold group-hover:scale-105 transition-transform duration-500 text-slate-300 group-hover:text-white bg-white/5 border border-white/10 mb-5`}>
                            {tech.initials}
                          </div>
                          
                          <h3 className="text-xl font-bold text-slate-400 group-hover:text-white group-hover:font-black tracking-wide mb-2 uppercase transition-all duration-300">{tech.name}</h3>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-5 bg-white/5 px-3 py-1.5 rounded-md border border-white/10 uppercase tracking-widest font-bold">
                            <Pocket className="w-3.5 h-3.5" />
                            <span>{tech.role}</span>
                          </div>
                          
                          <div className="w-full bg-[#0a0a0f] rounded-xl p-4 border border-white/5 flex flex-col gap-2 mt-auto text-left group-hover:bg-white/5 transition-colors">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5 group-hover:text-slate-400 transition-colors">
                              <Fingerprint className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400" /> {t('staff.thBadgeId', 'Physical Badge ID')}
                            </span>
                            <div className="text-sm font-bold text-slate-400 group-hover:text-slate-200 font-mono uppercase tracking-tight transition-colors">
                               {tech.realBadgeId || t('staff.unassignedBadge', 'NOT CONFIGURED')}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
                {filteredStaff.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                    <Users className="w-12 h-12 text-slate-600 mb-4" />
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('staff.noPersonnelTitle', 'No Active Personnel')}</p>
                    <p className="text-xs text-slate-500 mt-2">{t('staff.noPersonnelDesc', 'Active slots list is currently empty.')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
      </div>
    </div>
  );
}

