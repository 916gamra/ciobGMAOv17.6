import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Users, Search, UserCircle2, Pocket, Fingerprint, Lock, Edit3, X, Save, Activity } from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { useAuthSlots } from '@/features/auth/hooks/useAuthSlots';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { db } from '@/core/db';
import { useTranslation } from 'react-i18next';

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
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formBadgeId, setFormBadgeId] = useState('');
  const [formIsActive, setFormIsActive] = useState(false);
  
  const allSlots = useAuthSlots();
  // Filter for Staff (Exclude System Admin, or include OP and TC?)
  const staffSlots = allSlots.filter(s => s.id.startsWith('TC') || s.id.startsWith('OP'));
  const activeStaff = staffSlots.filter(s => s.isActive);

  const filteredStaff = staffSlots.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.realBadgeId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col gap-6 relative z-10"
    >
      <PageHeader
        title={t('staff.title', 'طاقم العمل والتقنيين')}
        subtitle={t('staff.subtitle', 'سجل طواقم الصيانة والتشغيل النشطة ومراقبة الكفاءة والتوزيع.')}
        icon={<Users className="w-7 h-7 text-indigo-400" />}
        badgeText="سجل الطواقم"
        badgeColor="indigo"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title="إجمالي المقاعد"
            subtitle="TOTAL SLOTS"
            value={staffSlots.length}
            icon={<Users className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title="الكوادر النشطة"
            subtitle="ACTIVE PERSONNEL"
            value={activeStaff.length}
            icon={<UserCircle2 className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title="المقاعد الاحتياطية"
            subtitle="SPARE SLOTS"
            value={staffSlots.length - activeStaff.length}
            icon={<Pocket className="w-3.5 h-3.5" />}
            color="amber"
          />
          <HeaderBentoCard
            title="حالة المصفوفة"
            subtitle="MATRIX LOCK"
            value="مؤمنة"
            icon={<Lock className="w-3.5 h-3.5" />}
            color="cyan"
          />
        </div>
      </PageHeader>

      <motion.div variants={itemVariants} className="flex-1 min-h-0 flex flex-col">
        <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-full flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl">
          <div className="p-6 md:p-8 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">{t('staff.directoryTitle', 'Active Staff Directory')}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('staff.directorySubtitle', 'Global Personnel Registry')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="relative group flex-1 md:w-64">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('staff.searchPlaceholder', 'Search personnel...')} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="titan-input py-2.5 pl-11 pr-3 rtl:pr-11 rtl:pl-3 w-full shadow-none"
                />
              </div>
              <div className="px-4 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0">
                <Lock className="w-3.5 h-3.5" /> {t('staff.matrixLocked', 'Matrix Locked')}
              </div>
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
                      className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all"
                    >
                      {t('staff.abortBtn', 'Abort')}
                    </button>
                    <button 
                      type="submit" 
                      className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> {t('staff.saveBtn', 'Save Configuration')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#0a0a0f]/40 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredStaff.map((tech) => (
                    <motion.div 
                      key={tech.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="titan-card overflow-hidden flex flex-col group relative shadow-2xl p-0 hover:border-indigo-500/40 transition-all duration-300 border-white/10 bg-[#0a0a0f]/60 backdrop-blur-xl"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                      
                      {/* ID Header Plaque */}
                      <div className="flex justify-between items-center bg-white/[0.02] p-4 border-b border-white/5 relative z-10">
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${tech.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
                           <span className={`text-[10px] font-mono tracking-widest uppercase font-bold ${tech.isActive ? 'text-slate-200' : 'text-slate-500'}`}>{tech.id}</span>
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1 bg-[#0a0a0f]/60 backdrop-blur-md border border-white/10 p-1 rounded-lg">
                           <button 
                             onClick={() => handleEdit(tech)}
                             className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-colors"
                             title="Configure Slot"
                           >
                             <Edit3 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </div>

                      <div className={`p-6 flex flex-col items-center text-center relative z-10 flex-1 ${!tech.isActive && 'opacity-60 grayscale'}`}>
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-semibold shadow-[inset_0_0_20px_rgba(14,165,233,0.15)] group-hover:scale-105 transition-transform duration-500 text-white ${tech.color} bg-opacity-20 border border-white/10 mb-5`}>
                          {tech.initials}
                        </div>
                        
                        <h3 className="text-xl font-bold text-white tracking-wide mb-2 uppercase">{tech.name}</h3>
                        
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-400/90 mb-5 bg-indigo-500/10 px-3 py-1.5 rounded-md border border-indigo-500/20 uppercase tracking-widest font-bold">
                          <Pocket className="w-3.5 h-3.5" />
                          <span>{tech.role}</span>
                        </div>
                        
                        <div className="w-full bg-[#0a0a0f]/20 rounded-xl p-4 border border-white/5 flex flex-col gap-2 mt-auto text-left">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
                            <Fingerprint className="w-3.5 h-3.5 text-emerald-500" /> Physical Badge ID
                          </span>
                          <div className="text-sm font-bold text-slate-200 font-mono uppercase tracking-tight">
                             {tech.realBadgeId || 'NOT CONFIGURED'}
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
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Active Personnel</p>
                  <p className="text-xs text-slate-500 mt-2">Active slots list is currently empty.</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

