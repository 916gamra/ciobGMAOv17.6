import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Settings2, 
  Wrench, 
  Zap, 
  Droplet, 
  Wind, 
  Trash2, 
  Box, 
  Activity, 
  LayoutGrid, 
  Eye, 
  Edit3, 
  Layers, 
  Clock,
  Filter,
  ChevronRight,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { EmptyState } from '@/shared/components/EmptyState';
import { EngineViewSkeleton } from '@/shared/components/EngineViewSkeleton';

export function TaskCatalogView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tasks' | 'actions'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection States for Sidebar Navigation
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string | null>(null);
  const [selectedActionTypeFilter, setSelectedActionTypeFilter] = useState<'ALL' | 'PREV' | 'CORR' | 'BOTH' | null>(null);
  
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
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

  // Filtered Tasks list
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFamily = !selectedFamilyFilter || selectedFamilyFilter === 'ALL' || task.pdrFamilyId === selectedFamilyFilter;
      return matchesSearch && matchesFamily;
    });
  }, [tasks, searchTerm, selectedFamilyFilter]);

  // Filtered Actions list
  const filteredActions = useMemo(() => {
    if (!standardActions) return [];
    return standardActions.filter(act => {
      const matchesSearch = act.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (act.code && act.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (act.description && act.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = !selectedActionTypeFilter || selectedActionTypeFilter === 'ALL' || act.type === selectedActionTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [standardActions, searchTerm, selectedActionTypeFilter]);

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

  const handleEditAction = (act: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    if (!fam) return <Box className="w-5 h-5 text-emerald-400" />;
    const group = fam.group?.toLowerCase();
    if (group?.includes('mecanique')) return <Wrench className="w-5 h-5 text-cyan-400" />;
    if (group?.includes('hydraulique')) return <Droplet className="w-5 h-5 text-blue-400" />;
    if (group?.includes('pneumatique')) return <Wind className="w-5 h-5 text-amber-400" />;
    if (group?.includes('electronique') || group?.includes('electrique')) return <Zap className="w-5 h-5 text-purple-400" />;
    return <Box className="w-5 h-5 text-emerald-400" />;
  };

  const isLoading = tasks === undefined || pdrFamilies === undefined || pdrTemplates === undefined || standardActions === undefined;

  if (isLoading) {
    return <EngineViewSkeleton mode="lab" themeColor="emerald" />;
  }

  return (
    <div className="flex flex-col h-full bg-[#08080c] text-slate-100 custom-scrollbar overflow-y-auto" dir="ltr">
      {/* Page Header */}
      <div className="px-6 md:px-8 pt-6">
        <PageHeader
          title={t("preventive.catalog.title", "كتالوج المهمات الوقائية")}
          subtitle={t("preventive.catalog.subtitle", "مكتبة الإجراءات وأفعال الصيانة القياسية لجدولة صيانة الأصول والمعدات")}
          icon={<Settings2 className="w-7 h-7 text-emerald-400" />}
          badgeColor="emerald"
          badgeText={t("preventive.catalog.badge", "Tasks Catalog Lab")}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t("preventive.catalog.statGenericTasks", "المهمات القياسية")}
              subtitle="GENERIC TASKS"
              value={tasks?.length || 0}
              icon={<Settings2 className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t("preventive.catalog.statActionVerbs", "أفعال الصيانة")}
              subtitle="ACTION VERBS"
              value={standardActions?.length || 0}
              icon={<Activity className="w-3.5 h-3.5" />}
              color="purple"
            />
            <HeaderBentoCard
              title={t("preventive.catalog.statDisciplines", "العائلات الهندسية")}
              subtitle="DISCIPLINES"
              value={pdrFamilies?.length || 0}
              icon={<Wrench className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t("preventive.catalog.statPdrModules", "القوالب المعرفية")}
              subtitle="TEMPLATES"
              value={pdrTemplates?.length || 0}
              icon={<Box className="w-3.5 h-3.5" />}
              color="cyan"
            />
          </div>
        </PageHeader>
      </div>

      {/* Main Workspace Split Pane */}
      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 pb-6 gap-6 min-h-0">
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-6">
          
          {/* Right Sidebar - Taxonomy Tree Navigation */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
            <div className="flex flex-col flex-1 min-h-[420px] p-0 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(16,185,129,0.12)] bg-gradient-to-b from-emerald-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98 backdrop-blur-xl relative">
              
              {/* Background ambient engine accent glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Sidebar Content */}
              <div className="p-5 relative z-10 flex flex-col h-full space-y-4">
                {/* Title & Controls */}
                <div className="flex flex-col shrink-0">
                  <span className="text-white font-black uppercase tracking-wider block">
                    {t('preventive.catalog.hierarchyTree', 'المكتبة الهندسية')}
                  </span>
                  <span className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">
                    {t('preventive.catalog.hierarchySubtitle', 'تصنيف المهام والأفعال القياسية')}
                  </span>
                </div>

                {/* Segmented Tab Navigation - Neutral High Contrast */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#08080c]/90 rounded-2xl border border-white/10 shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab('tasks');
                      setSearchTerm('');
                      setSelectedFamilyFilter(null);
                      setSelectedActionTypeFilter(null);
                    }}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer",
                      activeTab === 'tasks'
                        ? "bg-white/10 text-white border border-white/20 shadow-sm font-extrabold"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    <span>{t("preventive.catalog.tabTasks", "المهمات")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('actions');
                      setSearchTerm('');
                      setSelectedFamilyFilter(null);
                      setSelectedActionTypeFilter(null);
                    }}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer",
                      activeTab === 'actions'
                        ? "bg-white/10 text-white border border-white/20 shadow-sm font-extrabold"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    <span>{t("preventive.catalog.tabActions", "الأفعال")}</span>
                  </button>
                </div>

                {/* Prominent Wide Action Button - High Contrast White */}
                {activeTab === 'tasks' ? (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>{t('preventive.catalog.newTask', 'إضافة مهمة وقائية جديدة')}</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setEditingActionId(null);
                      setActionName('');
                      setActionCode('');
                      setActionType('PREV');
                      setActionDesc('');
                      setIsActionModalOpen(true);
                    }}
                    className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>{t('preventive.catalog.newAction', 'إضافة فعل صيانة جديد')}</span>
                  </button>
                )}

                {/* Sidebar Search Bar - Crystal Glass */}
                <div className="relative w-full shrink-0">
                  <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" 
                    placeholder={t('preventive.catalog.searchPlaceholder', 'Search catalog...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all text-start font-bold shadow-sm"
                  />
                </div>

                {/* Tree Navigation Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar text-left pt-1 -mx-2 px-2 pb-4 space-y-2">
                  <div className="flex items-center justify-between mb-1.5 px-1 shrink-0">
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                      {activeTab === 'tasks' ? `عائلات المهمات (${pdrFamilies?.length || 0})` : `تصنيفات الأفعال (${standardActions?.length || 0})`}
                    </span>
                  </div>

                {activeTab === 'tasks' ? (
                  /* Tasks Navigation (By Family) */
                  <div className="space-y-2">
                    <div 
                      onClick={() => setSelectedFamilyFilter('ALL')}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-200 relative group overflow-hidden select-none cursor-pointer flex items-center justify-between text-start transform active:scale-95",
                        selectedFamilyFilter === 'ALL'
                          ? "bg-emerald-500/20 border-emerald-500/50 text-white font-black shadow-[0_4px_20px_rgba(16,185,129,0.25)] scale-[1.02] -translate-y-0.5" 
                          : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                          selectedFamilyFilter === 'ALL'
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-slate-300"
                        )}>
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs truncate">{t('preventive.catalog.allFamilies', 'جميع العائلات')}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 border",
                        selectedFamilyFilter === 'ALL'
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-slate-300 border-white/10"
                      )}>
                        {tasks?.length || 0}
                      </span>
                    </div>

                    {pdrFamilies?.map(fam => {
                      const isSelected = selectedFamilyFilter === fam.id;
                      const famTasks = tasks?.filter(t => t.pdrFamilyId === fam.id) || [];
                      
                      return (
                        <div 
                          key={fam.id}
                          onClick={() => setSelectedFamilyFilter(fam.id)}
                          className={cn(
                            "p-3.5 rounded-2xl border transition-all duration-200 relative group overflow-hidden select-none cursor-pointer flex items-center justify-between text-start transform active:scale-95",
                            isSelected 
                              ? "bg-emerald-500/20 border-emerald-500/50 text-white font-black shadow-[0_4px_20px_rgba(16,185,129,0.25)] scale-[1.02] -translate-y-0.5" 
                              : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                              isSelected 
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                : "bg-white/5 border-white/10 text-slate-300"
                            )}>
                              {getFamilyIcon(fam.id)}
                            </div>
                            <span className="text-xs truncate max-w-[180px]">{fam.name}</span>
                          </div>
                          <span className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 border",
                            isSelected 
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-white/5 text-slate-300 border-white/10"
                          )}>
                            {famTasks.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Actions Navigation (By Type) */
                  <div className="space-y-2">
                    <div 
                      onClick={() => setSelectedActionTypeFilter('ALL')}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-200 relative group overflow-hidden select-none cursor-pointer flex items-center justify-between text-start transform active:scale-95",
                        selectedActionTypeFilter === 'ALL'
                          ? "bg-emerald-500/20 border-emerald-500/50 text-white font-black shadow-[0_4px_20px_rgba(16,185,129,0.25)] scale-[1.02] -translate-y-0.5" 
                          : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                          selectedActionTypeFilter === 'ALL'
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-slate-300"
                        )}>
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs truncate">{t('preventive.catalog.allActions', 'جميع أفعال الصيانة')}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 border",
                        selectedActionTypeFilter === 'ALL'
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-slate-300 border-white/10"
                      )}>
                        {standardActions?.length || 0}
                      </span>
                    </div>

                    <div 
                      onClick={() => setSelectedActionTypeFilter('PREV')}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-200 relative group overflow-hidden select-none cursor-pointer flex items-center justify-between text-start transform active:scale-95",
                        selectedActionTypeFilter === 'PREV'
                          ? "bg-emerald-500/20 border-emerald-500/50 text-white font-black shadow-[0_4px_20px_rgba(16,185,129,0.25)] scale-[1.02] -translate-y-0.5" 
                          : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                          selectedActionTypeFilter === 'PREV'
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-slate-300"
                        )}>
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-xs truncate">{t('preventive.catalog.prevActions', 'أفعال وقائية')}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 border",
                        selectedActionTypeFilter === 'PREV'
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-slate-300 border-white/10"
                      )}>
                        {standardActions?.filter(a => a.type === 'PREV').length || 0}
                      </span>
                    </div>

                    <div 
                      onClick={() => setSelectedActionTypeFilter('CORR')}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-200 relative group overflow-hidden select-none cursor-pointer flex items-center justify-between text-start transform active:scale-95",
                        selectedActionTypeFilter === 'CORR'
                          ? "bg-emerald-500/20 border-emerald-500/50 text-white font-black shadow-[0_4px_20px_rgba(16,185,129,0.25)] scale-[1.02] -translate-y-0.5" 
                          : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                          selectedActionTypeFilter === 'CORR'
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-slate-300"
                        )}>
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                        </div>
                        <span className="text-xs truncate">{t('preventive.catalog.corrActions', 'أفعال علاجية')}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 border",
                        selectedActionTypeFilter === 'CORR'
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-slate-300 border-white/10"
                      )}>
                        {standardActions?.filter(a => a.type === 'CORR').length || 0}
                      </span>
                    </div>

                    <div 
                      onClick={() => setSelectedActionTypeFilter('BOTH')}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-200 relative group overflow-hidden select-none cursor-pointer flex items-center justify-between text-start transform active:scale-95",
                        selectedActionTypeFilter === 'BOTH'
                          ? "bg-emerald-500/20 border-emerald-500/50 text-white font-black shadow-[0_4px_20px_rgba(16,185,129,0.25)] scale-[1.02] -translate-y-0.5" 
                          : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                          selectedActionTypeFilter === 'BOTH'
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-slate-300"
                        )}>
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                        </div>
                        <span className="text-xs truncate">{t('preventive.catalog.bothActions', 'أفعال مشتركة')}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 border",
                        selectedActionTypeFilter === 'BOTH'
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-slate-300 border-white/10"
                      )}>
                        {standardActions?.filter(a => a.type === 'BOTH').length || 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* Left Main Workspace Canvas */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl bg-[#0a0b10]/90 backdrop-blur-xl">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={`workspace-${activeTab}-${selectedFamilyFilter}-${selectedActionTypeFilter}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col h-full min-h-0 p-6 md:p-8"
                >
                  {((activeTab === 'tasks' && selectedFamilyFilter !== null) || (activeTab === 'actions' && selectedActionTypeFilter !== null)) ? (
                    <>
                      {/* Dynamic Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-6 mb-6 gap-4 text-start">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner shrink-0",
                        activeTab === 'tasks' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-purple-500/10 border-purple-500/20"
                      )}>
                        {activeTab === 'tasks' ? <Settings2 className="w-6 h-6 text-emerald-400" /> : <Activity className="w-6 h-6 text-purple-400" />}
                      </div>
                      <div className="text-start">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/15">
                            {activeTab === 'tasks' ? 'مهمات' : 'أفعال'}
                          </span>
                          <h3 className="text-lg font-bold text-white tracking-tight">
                            {activeTab === 'tasks' 
                              ? (selectedFamilyFilter === 'ALL' ? t('preventive.catalog.allFamilies', 'جميع العائلات الهندسية') : pdrFamilies?.find(f => f.id === selectedFamilyFilter)?.name || 'عائلة غير معروفة')
                              : (selectedActionTypeFilter === 'ALL' ? t('preventive.catalog.allActions', 'جميع أفعال الصيانة') : 
                                 selectedActionTypeFilter === 'PREV' ? t('preventive.catalog.prevActions', 'أفعال وقائية') :
                                 selectedActionTypeFilter === 'CORR' ? t('preventive.catalog.corrActions', 'أفعال علاجية') : t('preventive.catalog.bothActions', 'أفعال مشتركة'))
                            }
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                          {activeTab === 'tasks' 
                            ? 'نطاق توجيه الصيانة الوقائية'
                            : 'قاموس مصطلحات الصيانة القياسية'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 p-1 bg-[#0a0a0f]/60 rounded-xl border border-white/5 mr-2">
                        <button
                          onClick={() => setViewMode('table')}
                          className={cn(
                            "p-1.5 rounded-lg transition-all cursor-pointer",
                            viewMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                          )}
                          title={t('common.tableView', 'عرض الجدول')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('cards')}
                          className={cn(
                            "p-1.5 rounded-lg transition-all cursor-pointer",
                            viewMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                          )}
                          title={t('common.cardsView', 'عرض البطاقات')}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                      </div>

                      {activeTab === 'tasks' ? (
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('preventive.catalog.newTask', 'مهمة وقائية جديدة')}</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingActionId(null);
                            setActionName('');
                            setActionCode('');
                            setActionType('PREV');
                            setActionDesc('');
                            setIsActionModalOpen(true);
                          }}
                          className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('preventive.catalog.newAction', 'فعل صيانة جديد')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Data Content */}
                  <div className="flex-1 flex flex-col min-h-0 text-start">
                    <div className="flex items-center justify-between mb-4 flex-row">
                      <div className="text-sm font-bold text-slate-200">
                        {activeTab === 'tasks' 
                          ? `${filteredTasks.length} المهمات المسجلة تحت هذا النطاق`
                          : `${filteredActions.length} أفعال الصيانة المسجلة`}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {activeTab === 'tasks' ? (
                        /* Tasks Content */
                        viewMode === 'table' ? (
                        <div className="rounded-2xl border border-white/10 bg-[#0a0b10]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                          <table className="w-full text-start border-collapse">
                            <thead className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider text-start">
                              <tr>
                                <th className="p-4 text-start">{t("preventive.catalog.colTitle", "عنوان المهمة")}</th>
                                <th className="p-4 text-start">{t("preventive.catalog.colFamily", "العائلة")}</th>
                                <th className="p-4 text-start">{t("preventive.catalog.colTemplate", "نطاق التوجيه")}</th>
                                <th className="p-4 text-start">{t("preventive.catalog.colAction", "الفعل")}</th>
                                <th className="p-4 text-start">{t("preventive.catalog.colFrequency", "التكرارية")}</th>
                                <th className="p-4 text-end">{t('common.actions', 'إجراءات')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs">
                              {filteredTasks.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-0">
                                    <EmptyState 
                                      icon={Settings2}
                                      title={t('preventive.catalog.noTasks', 'لا توجد مهام مطابقة')}
                                      description={t('preventive.catalog.noTasksDesc', 'لا توجد مهام مطابقة للبحث أو التصفية.')}
                                      color="emerald"
                                      className="py-16 opacity-80"
                                    />
                                  </td>
                                </tr>
                              ) : (
                                filteredTasks.map(task => {
                                  const linkedFamily = pdrFamilies?.find(f => f.id === task.pdrFamilyId);
                                  const linkedTemplate = pdrTemplates?.find(t => t.id === task.pdrTemplateId);
                                  const linkedAction = standardActions?.find(a => a.id === task.actionId);

                                  return (
                                    <tr key={task.id} className="hover:bg-white/[0.04] transition-colors border-b border-white/5">
                                      <td className="p-4 font-bold text-white text-start">
                                        <div className="font-bold text-white mb-1">{task.title}</div>
                                        {task.description && (
                                          <div className="text-[10px] text-slate-400 max-w-xs truncate">{task.description}</div>
                                        )}
                                      </td>
                                      <td className="p-4 text-start">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
                                            {getFamilyIcon(task.pdrFamilyId)}
                                          </div>
                                          <span className="font-bold text-[11px] truncate max-w-[100px]">{linkedFamily?.name || '—'}</span>
                                        </div>
                                      </td>
                                      <td className="p-4 text-slate-300 text-start">
                                        {linkedTemplate ? (
                                          <span className="font-medium text-slate-200">
                                            {linkedTemplate.name} <span className="font-mono text-[10px] text-slate-400">({linkedTemplate.skuBase})</span>
                                          </span>
                                        ) : (
                                          <span className="text-slate-500 italic">عامة (كامل العائلة)</span>
                                        )}
                                      </td>
                                      <td className="p-4 text-start">
                                        {linkedAction ? (
                                          <span className="font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30 text-[11px]">
                                            {linkedAction.code ? `[${linkedAction.code}] ` : ''}{linkedAction.name}
                                          </span>
                                        ) : (
                                          <span className="text-slate-500">—</span>
                                        )}
                                      </td>
                                      <td className="p-4 text-start">
                                        <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                                          {task.frequencyValue} أيام
                                        </span>
                                      </td>
                                      <td className="p-4 text-end">
                                        <button
                                          onClick={(e) => handleDeleteTask(task.id, e)}
                                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                          title={t('common.delete', 'حذف')}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                          {filteredTasks.length === 0 ? (
                            <div className="col-span-full">
                              <EmptyState 
                                icon={Settings2}
                                title={t('preventive.catalog.noTasks', 'لا توجد مهام مطابقة')}
                                description={t('preventive.catalog.noTasksDesc', 'لا توجد مهام مطابقة للبحث أو التصفية.')}
                                color="emerald"
                                className="py-16 opacity-80 glass-panel rounded-2xl border-dashed border-white/10"
                              />
                            </div>
                          ) : (
                            filteredTasks.map(task => {
                              const linkedFamily = pdrFamilies?.find(f => f.id === task.pdrFamilyId);
                              const linkedTemplate = pdrTemplates?.find(t => t.id === task.pdrTemplateId);
                              const linkedAction = standardActions?.find(a => a.id === task.actionId);

                              return (
                                <GlassCard 
                                  key={task.id} 
                                  className="p-5 flex flex-col justify-between group transition-all duration-500 hover:scale-[1.03] hover:border-emerald-500 hover:bg-[#0a0a0f] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] relative overflow-hidden text-start border border-white/10"
                                >
                                  {/* Ambient Hover Bottom Glow */}
                                  <div className="bg-emerald-500/0 group-hover:bg-emerald-500/25 rounded-full blur-xl absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-16 pointer-events-none z-0 transition-all duration-500" />

                                  <div className="relative z-10 w-full h-full flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-start justify-between gap-2 mb-3 flex-row">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                                            {getFamilyIcon(task.pdrFamilyId)}
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-bold text-white tracking-tight">{task.title}</h4>
                                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 mt-1 inline-block">
                                              {linkedFamily?.name || 'General'}
                                            </span>
                                          </div>
                                        </div>
                                        <button
                                          onClick={(e) => handleDeleteTask(task.id, e)}
                                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 transition-all rounded-lg hover:bg-rose-500/10 cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>

                                      {task.description && (
                                        <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}

                                      <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                                        <div className="flex justify-between items-center text-slate-300 flex-row">
                                          <span className="text-slate-500 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-emerald-400" /> التكرارية
                                          </span>
                                          <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                                            {task.frequencyValue} أيام
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-300 flex-row">
                                          <span className="text-slate-500 flex items-center gap-1">
                                            <Wrench className="w-3.5 h-3.5 text-purple-400" /> الفعل
                                          </span>
                                          <span className="font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded text-[10px]">
                                            {linkedAction?.code ? `[${linkedAction.code}] ` : ''}{linkedAction?.name || '—'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-300 flex-row">
                                          <span className="text-slate-500 flex items-center gap-1">
                                            <Box className="w-3.5 h-3.5 text-cyan-400" /> النطاق
                                          </span>
                                          <span className="text-[11px] font-medium text-slate-200">
                                            {linkedTemplate ? `${linkedTemplate.name} (${linkedTemplate.skuBase})` : 'كامل أصول العائلة'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </GlassCard>
                              );
                            })
                          )}
                        </div>
                      )
                    ) : (
                      /* Actions Content */
                      viewMode === 'table' ? (
                        <div className="rounded-2xl border border-white/10 bg-[#0a0b10]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                          <table className="w-full text-start border-collapse">
                            <thead className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider text-start">
                              <tr>
                                <th className="p-4 text-start">{t("preventive.catalog.colCode", "الرمز")}</th>
                                <th className="p-4 text-start">{t("preventive.catalog.colName", "الفعل")}</th>
                                <th className="p-4 text-start">{t("preventive.catalog.colType", "النوع")}</th>
                                <th className="p-4 text-start">{t("preventive.catalog.colDesc", "الوصف")}</th>
                                <th className="p-4 text-end">{t('common.actions', 'إجراءات')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs">
                              {filteredActions.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-0">
                                    <EmptyState 
                                      icon={Activity}
                                      title={t('preventive.catalog.noActions', 'لا توجد أفعال مطابقة')}
                                      description={t('preventive.catalog.noActionsDesc', 'لا توجد أفعال صيانة مطابقة للبحث أو التصفية.')}
                                      color="purple"
                                      className="py-16 opacity-80"
                                    />
                                  </td>
                                </tr>
                              ) : (
                                filteredActions.map(act => {
                                  const typeBadgeColor = act.type === 'PREV' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                                       : act.type === 'CORR' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                                       : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                                  return (
                                    <tr key={act.id} className="hover:bg-white/[0.04] transition-colors border-b border-white/5">
                                      <td className="p-4 font-mono font-bold text-purple-300 text-start">
                                        {act.code ? (
                                          <span className="bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                                            {act.code}
                                          </span>
                                        ) : '—'}
                                      </td>
                                      <td className="p-4 font-bold text-white text-start">{act.name}</td>
                                      <td className="p-4 text-start">
                                        <span className={cn("font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase border", typeBadgeColor)}>
                                          {act.type === 'PREV' ? 'وقائي' : act.type === 'CORR' ? 'علاجي' : 'مشترك'}
                                        </span>
                                      </td>
                                      <td className="p-4 text-slate-300 max-w-md truncate text-start">
                                        {act.description || <span className="text-slate-500 italic">—</span>}
                                      </td>
                                      <td className="p-4 text-end">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            onClick={(e) => handleEditAction(act, e)}
                                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                            title={t('common.edit', 'تعديل')}
                                          >
                                            <Edit3 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={(e) => handleDeleteAction(act.id, e)}
                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                            title={t('common.delete', 'حذف')}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                          {filteredActions.length === 0 ? (
                            <div className="col-span-full">
                              <EmptyState 
                                icon={Activity}
                                title={t('preventive.catalog.noActions', 'لا توجد أفعال مطابقة')}
                                description={t('preventive.catalog.noActionsDesc', 'لا توجد أفعال صيانة مطابقة للبحث أو التصفية.')}
                                color="purple"
                                className="py-16 opacity-80 glass-panel rounded-2xl border-dashed border-white/10"
                              />
                            </div>
                          ) : (
                            filteredActions.map(act => {
                              const typeText = act.type === 'PREV' ? 'وقائي' : act.type === 'CORR' ? 'علاجي' : 'مشترك';
                              const typeBadgeColor = act.type === 'PREV' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                                   : act.type === 'CORR' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                                   : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                              return (
                                <GlassCard 
                                  key={act.id} 
                                  className="p-5 relative group transition-all duration-500 hover:scale-[1.03] hover:border-purple-500 hover:bg-[#0a0a0f] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] flex flex-col justify-between text-start border border-white/10"
                                >
                                  {/* Ambient Hover Bottom Glow */}
                                  <div className="bg-purple-500/0 group-hover:bg-purple-500/25 rounded-full blur-xl absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-16 pointer-events-none z-0 transition-all duration-500" />

                                  <div className="relative z-10 w-full h-full flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between items-start mb-3 flex-row">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 shrink-0">
                                            <Wrench className="w-5 h-5 text-purple-400" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2 flex-row">
                                              <h4 className="text-sm font-bold text-white tracking-tight">{act.name}</h4>
                                              {act.code && (
                                                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                                  {act.code}
                                                </span>
                                              )}
                                            </div>
                                            <span className={cn("text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase mt-1 inline-block border", typeBadgeColor)}>
                                              {typeText}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={(e) => handleDeleteAction(act.id, e)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={(e) => handleEditAction(act, e)} className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer">
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {act.description && (
                                        <div className="border-t border-white/5 pt-3 mt-3">
                                          <p className="text-xs text-slate-400 leading-relaxed font-medium">{act.description}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </GlassCard>
                              );
                            })
                          )}
                        </div>
                      )
                    )}
                    </div>
                  </div>
                </>
              ) : (
                    /* Gorgeous Welcome / Greeting state */
                    <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center h-full flex-1 my-auto">
                      <div className={cn(
                        "w-16 h-16 rounded-3xl border flex items-center justify-center mb-6 shadow-lg transition-all duration-500",
                        activeTab === 'tasks'
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5 animate-pulse"
                          : "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-purple-500/5 animate-pulse"
                      )}>
                        {activeTab === 'tasks' ? <Settings2 className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
                      </div>

                      <h3 className="text-xl font-extrabold text-white uppercase tracking-wider mb-2">
                        {activeTab === 'tasks'
                          ? t('preventive.catalog.welcomeTasksTitle', 'مكتبة المهمات الوقائية القياسية')
                          : t('preventive.catalog.welcomeActionsTitle', 'كتالوج أفعال الصيانة القياسية')}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                        {activeTab === 'tasks'
                          ? t('preventive.catalog.welcomeTasksDesc', 'مرحباً بك في كتالوج المهام الوقائية. يرجى تصفح أو اختيار عائلة هندسية من القائمة اليسرى لعرض وإدارة قوالب المهام الوقائية الدورية.')
                          : t('preventive.catalog.welcomeActionsDesc', 'مرحباً بك في كتالوج أفعال الصيانة القياسية. يرجى تحديد نوع فعل صيانة من القائمة اليسرى لعرض أو تعديل أكواد وأوصاف الأفعال.')}
                      </p>

                      <div className="flex gap-3 flex-row-reverse mt-6">
                        {activeTab === 'tasks' ? (
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" /> {t('preventive.catalog.newTask', 'مهمة وقائية جديدة')}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingActionId(null);
                              setActionName('');
                              setActionCode('');
                              setActionType('PREV');
                              setActionDesc('');
                              setIsActionModalOpen(true);
                            }}
                            className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" /> {t('preventive.catalog.newAction', 'فعل صيانة جديد')}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (activeTab === 'tasks') {
                              setSelectedFamilyFilter('ALL');
                            } else {
                              setSelectedActionTypeFilter('ALL');
                            }
                          }}
                          className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Database className="w-4 h-4 text-slate-400" /> {t('common.browseAll', 'تصفح جميع السجلات')}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mt-8 text-start">
                        <div className="p-5 rounded-2xl bg-[#08080c]/80 border border-white/10 shadow-lg">
                          <div className="flex items-center gap-2 mb-2 justify-start">
                            <Wrench className={cn("w-4 h-4", activeTab === 'tasks' ? "text-emerald-400" : "text-purple-400")} />
                            <span className="text-xs font-extrabold text-white">
                              {activeTab === 'tasks' ? 'توحيد صياغة المهام' : 'هيكلة أفعال الصيانة'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {activeTab === 'tasks'
                              ? 'تربط المهام بين العائلات الهندسية وأفعال الصيانة القياسية لتشغيل خطط وقائية معيارية متكاملة.'
                              : 'توفر الأفعال مصطلحات موحدة (مثل: فحص، تنظيف، معايرة) لتسهيل التحليل الفني لخطط الصيانة وأوامر العمل.'}
                          </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#08080c]/80 border border-white/10 shadow-lg">
                          <div className="flex items-center gap-2 mb-2 justify-start">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-extrabold text-white">التكرارية والجدولة الزمنية</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            يتم جدولة المهام القياسية بناءً على دورة تكرار محددة بالأيام لضمان صيانة وقائية دورية وموثوقية عالية للأصول الصناعية.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

            </GlassCard>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
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
              className="w-full max-w-lg bg-[#0f111a] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden text-right"
              dir="rtl"
            >
              <div className="h-1 w-full bg-emerald-500" />
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                  <h2 className="text-2xl font-bold text-white font-sans">{t('preventive.catalog.newTask', 'مهمة وقائية جديدة')}</h2>
                </div>
                <form onSubmit={handleCreateTask} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colTitle', 'عنوان المهمة')}</label>
                    <input 
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="مثال: الفحص الشامل وتغيير الزيت"
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colFamily', 'العائلة الهندسية')}</label>
                    <select 
                      required
                      value={pdrFamilyId}
                      onChange={e => {
                        setPdrFamilyId(e.target.value);
                        setPdrTemplateId(''); // Reset template when family changes
                      }}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none font-sans text-xs"
                    >
                      <option value="" className="bg-[#0a0a0f]">-- اختر العائلة --</option>
                      {pdrFamilies?.map(fam => (
                        <option key={fam.id} value={fam.id} className="bg-[#0a0a0f]">{fam.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colTemplate', 'القالب الهندسي المستهدف (اختياري)')}</label>
                    <select 
                      value={pdrTemplateId}
                      onChange={e => setPdrTemplateId(e.target.value)}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none text-xs"
                      disabled={!pdrFamilyId}
                    >
                      <option value="" className="bg-[#0a0a0f]">-- عام (ينطبق على جميع مكونات العائلة) --</option>
                      {pdrTemplates?.filter(t => t.familyId === pdrFamilyId).map(tpl => (
                        <option key={tpl.id} value={tpl.id} className="bg-[#0a0a0f]">
                          {tpl.name} ({tpl.skuBase})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colAction', 'فعل الصيانة')}</label>
                    <select 
                      required
                      value={actionId}
                      onChange={e => setActionId(e.target.value)}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none text-xs"
                    >
                      <option value="" className="bg-[#0a0a0f]">-- اختر فعل الصيانة --</option>
                      {standardActions?.map(action => (
                        <option key={action.id} value={action.id} className="bg-[#0a0a0f]">
                          {action.code ? `[${action.code}] ` : ''}{action.name} ({action.type === 'PREV' ? 'وقائي' : action.type === 'CORR' ? 'علاجي' : 'مشترك'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colFrequency', 'التكرارية (بالأيام)')}</label>
                      <input 
                        type="number"
                        min={1}
                        required
                        value={frequencyValue}
                        onChange={e => setFrequencyValue(parseInt(e.target.value))}
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colDesc', 'الوصف والتفاصيل (اختياري)')}</label>
                      <input 
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="إرشادات التنفيذ..."
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {t('common.cancel', 'إلغاء')}
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                    >
                      {t('common.save', 'حفظ السجل')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Creation/Edit Modal */}
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
              className="w-full max-w-lg bg-[#0f111a] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden text-right"
              dir="rtl"
            >
              <div className="h-1 w-full bg-purple-500" />
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-purple-500 rounded-full" />
                  <h2 className="text-2xl font-bold text-white font-sans">
                    {editingActionId ? t('preventive.catalog.editAction', 'تعديل فعل صيانة') : t('preventive.catalog.newAction', 'إضافة فعل صيانة جديد')}
                  </h2>
                </div>
                <form onSubmit={handleSaveStandardAction} className="space-y-6">
                  <div className="flex gap-4 flex-row">
                    <div className="flex-[3] space-y-2">
                      <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colName', 'الفعل الإجرائي')}</label>
                      <input 
                        type="text"
                        required
                        value={actionName}
                        onChange={e => setActionName(e.target.value)}
                        placeholder="مثال: فحص، استبدال، تشحيم"
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-purple-500 outline-none text-xs"
                      />
                    </div>
                    <div className="flex-[2] space-y-2">
                      <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colCode', 'الرمز المرجعي')}</label>
                      <input 
                        type="text"
                        required
                        placeholder="LUB"
                        value={actionCode}
                        maxLength={4}
                        onChange={e => setActionCode(e.target.value.toUpperCase())}
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-purple-500 outline-none font-mono text-center text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colType', 'نوع الفعل')}</label>
                    <select 
                      value={actionType}
                      onChange={e => setActionType(e.target.value as any)}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-purple-500 outline-none appearance-none font-sans text-xs"
                    >
                      <option value="PREV" className="bg-[#0a0a0f]">{t('preventive.catalog.prevActions', 'فعل وقائي (فحص، قياس)')}</option>
                      <option value="CORR" className="bg-[#0a0a0f]">{t('preventive.catalog.corrActions', 'فعل علاجي (تغيير، إصلاح)')}</option>
                      <option value="BOTH" className="bg-[#0a0a0f]">{t('preventive.catalog.bothActions', 'مشترك (وقائي/علاجي)')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colDesc', 'الوصف والإرشادات')}</label>
                    <textarea 
                      value={actionDesc}
                      onChange={e => setActionDesc(e.target.value)}
                      placeholder="تفاصيل التوجيه أو الوصف التقني..."
                      rows={3}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-purple-500 outline-none resize-none text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={handleCloseActionModal}
                      className="px-5 py-2 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {t('common.cancel', 'إلغاء')}
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
                    >
                      {t('common.save', 'حفظ السجل')}
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