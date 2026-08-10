import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, PreventiveTask } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Settings2, Wrench, Zap, Droplet, Wind, Cpu, Trash2, Box, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function TaskCatalogView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tasks' | 'actions'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  
  // Form State (Tasks)
  const [title, setTitle] = useState('');
  const [pdrFamilyId, setPdrFamilyId] = useState('');
  const [pdrTemplateId, setPdrTemplateId] = useState('');
  const [actionId, setActionId] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyValue, setFrequencyValue] = useState(30);

  // Form State (Actions)
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [actionName, setActionName] = useState('');
  const [actionCode, setActionCode] = useState('');
  const [actionType, setActionType] = useState<'PREV' | 'CORR' | 'BOTH'>('PREV');
  const [actionDesc, setActionDesc] = useState('');

  const tasks = useLiveQuery(() => db.preventiveTasks.toArray(), []);
  const pdrFamilies = useLiveQuery(() => db.pdrFamilies.toArray(), []);
  const pdrTemplates = useLiveQuery(() => db.pdrTemplates.toArray(), []);
  const standardActions = useLiveQuery(() => db.standardActions.toArray(), []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pdrFamilyId || !actionId) {
      toast.error('Task title, Family, and Action are required');
      return;
    }

    try {
      await db.preventiveTasks.add({
        id: crypto.randomUUID(),
        title,
        pdrFamilyId,
        pdrTemplateId: pdrTemplateId || undefined,
        actionId,
        description,
        frequencyType: 'TIME',
        frequencyValue,
        createdAt: new Date().toISOString()
      });
      toast.success('Task added to knowledge base', { description: 'Generic task created successfully.' });
      setIsModalOpen(false);
      setTitle('');
      setPdrFamilyId('');
      setPdrTemplateId('');
      setActionId('');
      setDescription('');
      setFrequencyValue(30);
    } catch (err: any) {
      toast.error('Failed to create task', { description: err.message });
    }
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this generic task?')) {
      await db.preventiveTasks.delete(id);
      toast.success('Task deleted');
    }
  };

  const handleSaveStandardAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionName.trim() || !actionCode.trim()) {
      toast.error('Action verb name and code are required.');
      return;
    }

    try {
      if (editingActionId) {
        await db.standardActions.update(editingActionId, {
          name: actionName.trim(),
          code: actionCode.trim().toUpperCase(),
          type: actionType,
          description: actionDesc.trim() || undefined
        });
        toast.success('Action Verb Updated');
      } else {
        await db.standardActions.add({
          id: crypto.randomUUID(),
          name: actionName.trim(),
          code: actionCode.trim().toUpperCase(),
          type: actionType,
          description: actionDesc.trim() || undefined
        });
        toast.success('Action Verb Registered');
      }
      handleCloseActionModal();
    } catch (err: any) {
      toast.error('Failed to save action: ' + err.message);
    }
  };

  const handleDeleteAction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this action? It might be used by existing tasks.')) {
      await db.standardActions.delete(id);
      toast.success('Action deleted');
    }
  };

  const handleEditAction = (act: any) => {
    setEditingActionId(act.id);
    setActionName(act.name);
    setActionCode(act.code || '');
    setActionType(act.type as any);
    setActionDesc(act.description || '');
    setIsActionModalOpen(true);
  };

  const handleCloseActionModal = () => {
    setEditingActionId(null);
    setActionName('');
    setActionCode('');
    setActionType('PREV');
    setActionDesc('');
    setIsActionModalOpen(false);
  };

  const getFamilyIcon = (familyId: string) => {
    const fam = pdrFamilies?.find(f => f.id === familyId);
    if (!fam) return <Box className="w-6 h-6" />;
    const group = fam.group?.toLowerCase();
    if (group?.includes('mecanique')) return <Wrench className="w-6 h-6" />;
    if (group?.includes('hydraulique')) return <Droplet className="w-6 h-6" />;
    if (group?.includes('pneumatique')) return <Wind className="w-6 h-6" />;
    if (group?.includes('electronique') || group?.includes('electrique')) return <Zap className="w-6 h-6" />;
    return <Box className="w-6 h-6" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] p-6 space-y-6 text-slate-200 custom-scrollbar overflow-y-auto">
      <PageHeader
        title={t("preventive.catalog.title", "كتالوج المهام القياسية")}
        subtitle={t("preventive.catalog.subtitle", "مكتبة المهام الهندسية والإجراءات الفنية المنظمة لأعمال الصيانة الوقائية للأجزاء والمكونات")}
        icon={<Settings2 className="w-7 h-7 text-emerald-400" />}
        badgeColor="emerald"
        badgeText={t("portals.preventive", "الصيانة الوقائية")}
        actions={
          <div className="flex bg-[#0a0a0f]/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-400 hover:text-white'}`}
            >
              المهام (Tasks)
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'actions' ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'text-slate-400 hover:text-white'}`}
            >
              الإجراءات (Actions)
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title="المهام القياسية"
            subtitle="GENERIC TASKS"
            value={tasks?.length || 0}
            icon={<Settings2 className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title="الإجراءات والأفعال"
            subtitle="ACTION VERBS"
            value={standardActions?.length || 0}
            icon={<Activity className="w-3.5 h-3.5" />}
            color="purple"
          />
          <HeaderBentoCard
            title="التخصصات الفنية"
            subtitle="TECHNICAL DISCIPLINES"
            value={pdrFamilies?.length || 0}
            icon={<Wrench className="w-3.5 h-3.5" />}
            color="amber"
          />
          <HeaderBentoCard
            title="المكونات الهندسية"
            subtitle="PDR MODULES"
            value={pdrTemplates?.length || 0}
            icon={<Box className="w-3.5 h-3.5" />}
            color="cyan"
          />
        </div>
      </PageHeader>
      
      {activeTab === 'tasks' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 flex items-center bg-white/[0.03] rounded-2xl px-5 py-3.5 border border-white/10 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input 
                type="text"
                placeholder="Search generic tasks library..."
                className="bg-transparent border-none outline-none text-white flex-1 py-1 placeholder-slate-500 font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center gap-2 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] font-bold tracking-wider text-xs uppercase whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-emerald-500 pl-3 rtl:text-right" dir="rtl">
              استعراض مكتبة المهام (Tasks Library)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks?.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).map(task => {
                const linkedFamily = pdrFamilies?.find(f => f.id === task.pdrFamilyId);
                const linkedTemplate = pdrTemplates?.find(t => t.id === task.pdrTemplateId);
                
                return (
                  <GlassCard key={task.id} className="p-6 flex flex-col items-center text-center group border-t-0 border-r-0 border-b-0 border-l-4 border-l-emerald-500 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                    <button 
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-4 rounded-full text-emerald-400 bg-emerald-400/10 mb-4 shadow-lg">
                      {getFamilyIcon(task.pdrFamilyId)}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 tracking-wide" dir="rtl">{task.title}</h3>
                    
                    {task.description && (
                      <p className="text-xs text-slate-400 mb-2 truncate max-w-[200px]" dir="rtl">{task.description}</p>
                    )}
                    
                    <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded border mb-4 mt-2 text-emerald-400 border-emerald-400/20 bg-emerald-400/10">
                      {linkedFamily ? linkedFamily.name : 'Unknown Family'}
                    </span>
                    
                    <div className="w-full mt-auto pt-4 border-t border-white/10 flex flex-col items-center gap-2">
                      <div className="flex justify-between w-full text-xs text-slate-400 px-2" dir="rtl">
                        <span>الوتيرة: {task.frequencyValue} أيام</span>
                        <span>الإجراء: {standardActions?.find(a => a.id === task.actionId)?.code || standardActions?.find(a => a.id === task.actionId)?.name || '-'}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 mb-1" dir="rtl">مخصصة للمكون (Template):</span>
                        <span className="text-xs font-medium text-slate-300">
                          {linkedTemplate ? `${linkedTemplate.name} (${linkedTemplate.skuBase})` : 'عام لجميع العائلة'}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
              {tasks?.length === 0 && (
                 <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center glass-panel rounded-2xl border-dashed">
                   <Settings2 className="w-12 h-12 mb-4 opacity-20" />
                   <p>No generic tasks defined in the library.</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex gap-4 mb-6">
             <div className="flex-1 flex items-center bg-white/[0.03] rounded-2xl px-5 py-3.5 border border-white/10 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input 
                  type="text"
                  placeholder="Search actions library..."
                  className="bg-transparent border-none outline-none text-white flex-1 py-1 placeholder-slate-500 font-medium"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsActionModalOpen(true)}
                className="px-6 py-3.5 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center gap-2 border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)] font-bold tracking-wider text-xs uppercase whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> New Action
              </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {standardActions?.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.code?.toLowerCase().includes(searchTerm.toLowerCase())).map(act => {
              const typeText = act.type === 'PREV' ? 'PREVENTIVE' : act.type === 'CORR' ? 'CORRECTIVE' : 'DUAL PURPOSE';
              const typeBadgeColor = act.type === 'PREV' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                   : act.type === 'CORR' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                   : 'text-amber-400 bg-amber-500/10 border-amber-500/20';
              return (
                <GlassCard key={act.id} className="p-6 relative group border-l-4 border-l-purple-500 border-t-0 border-r-0 border-b-0 hover:bg-white/[0.04]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <Wrench className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white tracking-tight">{act.name}</h4>
                          {act.code && (
                            <span className="text-[10px] font-mono bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30">
                              {act.code}
                            </span>
                          )}
                        </div>
                        <span className={`text-[8px] font-mono tracking-widest font-extrabold px-1.5 py-0.5 rounded uppercase mt-1 inline-block border ${typeBadgeColor}`}>
                          {typeText}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditAction(act)} className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors">
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => handleDeleteAction(act.id, e)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {act.description && (
                    <div className="border-t border-white/5 pt-4 mt-2">
                      <p className="text-xs text-slate-400 leading-relaxed font-medium" dir="rtl">{act.description}</p>
                    </div>
                  )}
                </GlassCard>
              );
            })}
            {standardActions?.length === 0 && (
               <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center glass-panel rounded-2xl border-dashed">
                 <Activity className="w-12 h-12 mb-4 opacity-20" />
                 <p>No actions defined in the library.</p>
               </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0f111a] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="h-1 w-full bg-emerald-500" />
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                  <h2 className="text-2xl font-bold text-white font-sans">إنشاء مهمة صيانة للمكون</h2>
                </div>
                <form onSubmit={handleCreateTask} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">إسم المهمة</label>
                    <input 
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="مثال: فحص مستوى الزيت والتشحيم"
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">عائلة القطع (Family Parts)</label>
                    <select 
                      required
                      value={pdrFamilyId}
                      onChange={e => {
                        setPdrFamilyId(e.target.value);
                        setPdrTemplateId(''); // Reset template when family changes
                      }}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none font-sans"
                    >
                      <option value="" className="bg-[#0a0a0f]">-- إختر عائلة القطع --</option>
                      {pdrFamilies?.map(fam => (
                        <option key={fam.id} value={fam.id} className="bg-[#0a0a0f]">{fam.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">قالب القطع (Template Parts)</label>
                    <select 
                      value={pdrTemplateId}
                      onChange={e => setPdrTemplateId(e.target.value)}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
                      disabled={!pdrFamilyId}
                    >
                      <option value="" className="bg-[#0a0a0f]">-- عام (ينطبق على كل العائلة) --</option>
                      {pdrTemplates?.filter(t => t.familyId === pdrFamilyId).map(tpl => (
                        <option key={tpl.id} value={tpl.id} className="bg-[#0a0a0f]">
                          {tpl.name} ({tpl.skuBase})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">الإجراء (Action)</label>
                    <select 
                      required
                      value={actionId}
                      onChange={e => setActionId(e.target.value)}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
                    >
                      <option value="" className="bg-[#0a0a0f]">-- إختر الإجراء --</option>
                      {standardActions?.map(action => (
                        <option key={action.id} value={action.id} className="bg-[#0a0a0f]">
                          {action.code ? `[${action.code}] ` : ''}{action.name} ({action.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 px-1">الوتيرة (بالأيام)</label>
                      <input 
                        type="number"
                        min={1}
                        required
                        value={frequencyValue}
                        onChange={e => setFrequencyValue(parseInt(e.target.value))}
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 px-1">ملاحظات (اختياري)</label>
                      <input 
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="تفاصيل إضافية..."
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 text-right">
                     <Settings2 className="w-6 h-6 text-emerald-400 shrink-0" />
                     <div>
                       <h4 className="text-sm font-bold text-emerald-400 mb-1">الفلسفة المعمارية لربط الصيانة الوقائية</h4>
                       <p className="text-xs leading-relaxed text-slate-300">
                         ترتبط مهام الصيانة الوقائية مباشرة بـ <strong>Family Parts</strong> أو <strong>Template Parts</strong> في معمل الكتالوج (Parts Catalog Lab). 
                         ولا ترتبط بالقطع التجارية (PDR Engine) أو بـ Blueprint Machine أو Templates Machine. تحتفظ القطعة بمهامها الهندسية أينما حلت في المصنع بشكل عضوي.
                       </p>
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4" dir="ltr">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                    >
                      حفظ المهمة
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Action Creation Modal */}
      <AnimatePresence>
        {isActionModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md"
            onClick={handleCloseActionModal}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0f111a] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="h-1 w-full bg-purple-500" />
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-purple-500 rounded-full" />
                  <h2 className="text-2xl font-bold text-white font-sans">
                    {editingActionId ? 'تعديل الإجراء' : 'إضافة إجراء (Action)'}
                  </h2>
                </div>
                <form onSubmit={handleSaveStandardAction} className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-[2] space-y-2">
                      <label className="text-xs text-slate-400 px-1">الرمز (Code)</label>
                      <input 
                        type="text"
                        required
                        placeholder="LUB"
                        value={actionCode}
                        maxLength={4}
                        onChange={e => setActionCode(e.target.value.toUpperCase())}
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-purple-500 outline-none font-mono text-center"
                      />
                    </div>
                    <div className="flex-[3] space-y-2">
                      <label className="text-xs text-slate-400 px-1">إسم الإجراء (الفعل)</label>
                      <input 
                        type="text"
                        required
                        value={actionName}
                        onChange={e => setActionName(e.target.value)}
                        placeholder="مثال: تشحيم، استبدال، فحص"
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">نوع الإجراء</label>
                    <select 
                      value={actionType}
                      onChange={e => setActionType(e.target.value as any)}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-purple-500 outline-none appearance-none font-sans"
                    >
                      <option value="PREV" className="bg-[#0a0a0f]">صيانة وقائية (Preventive)</option>
                      <option value="CORR" className="bg-[#0a0a0f]">صيانة علاجية (Corrective)</option>
                      <option value="BOTH" className="bg-[#0a0a0f]">كلاهما (Dual Purpose)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">الوصف (اختياري)</label>
                    <textarea 
                      value={actionDesc}
                      onChange={e => setActionDesc(e.target.value)}
                      placeholder="تفاصيل وشرح هذا الإجراء..."
                      rows={3}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4" dir="ltr">
                    <button 
                      type="button"
                      onClick={handleCloseActionModal}
                      className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                    >
                      {editingActionId ? 'حفظ التعديلات' : 'تأكيد الإضافة'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
