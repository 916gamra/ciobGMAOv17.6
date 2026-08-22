import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { LabHierarchicalSidebar, HierarchyFamilyNode } from '@/shared/components/LabHierarchicalSidebar';
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
import { LabEntityCard } from '@/shared/components/LabEntityCard';

export function TaskCatalogView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tasks' | 'actions'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection States for Sidebar Navigation
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedActionTypeFilter, setSelectedActionTypeFilter] = useState<'ALL' | 'PREV' | 'CORR' | 'BOTH' | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  
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

  // Hierarchical Structure for LabHierarchicalSidebar
  const hierarchicalFamilies: HierarchyFamilyNode[] = useMemo(() => {
    if (!pdrFamilies) return [];
    
    return pdrFamilies.map(fam => {
      const group = (fam.group || fam.name || '').toLowerCase();
      let discipline: 'mechanical' | 'hydraulic' | 'electrical' | 'electronic' | 'pneumatic' | 'general' = 'general';
      if (group.includes('mecanique') || group.includes('méc') || group.includes('mechanical') || group.includes('rob')) {
        discipline = 'mechanical';
      } else if (group.includes('hydraulique') || group.includes('hydr') || group.includes('hydraulic') || group.includes('hyd')) {
        discipline = 'hydraulic';
      } else if (group.includes('pneumatique') || group.includes('pneum') || group.includes('pneumatic') || group.includes('pnu')) {
        discipline = 'pneumatic';
      } else if (group.includes('electronique') || group.includes('electronic')) {
        discipline = 'electronic';
      } else if (group.includes('electrique') || group.includes('elec') || group.includes('electrical')) {
        discipline = 'electrical';
      }

      const famTemplates = (pdrTemplates || []).filter(t => t.familyId === fam.id);
      const famTasks = (tasks || []).filter(t => t.pdrFamilyId === fam.id);

      return {
        id: fam.id,
        code: fam.name.slice(0, 3).toUpperCase(),
        name: fam.name,
        subtitle: fam.description || (fam.group ? `عائلة ${fam.group}` : undefined),
        discipline,
        count: famTasks.length,
        templates: famTemplates.map(tmpl => {
          const tmplTasks = famTasks.filter(t => t.pdrTemplateId === tmpl.id);
          return {
            id: tmpl.id,
            code: tmpl.skuBase || tmpl.id.slice(0, 6).toUpperCase(),
            name: tmpl.name,
            subtitle: tmpl.description,
            count: tmplTasks.length,
            items: tmplTasks.map(task => {
              const act = standardActions?.find(a => a.id === task.actionId);
              return {
                id: task.id,
                code: task.frequencyValue ? `${task.frequencyValue}d` : 'TASK',
                name: task.title,
                subtitle: act?.name ? `[${act.code || 'ACT'}] ${act.name}` : undefined,
                raw: task
              };
            }),
            raw: tmpl
          };
        }),
        raw: fam
      };
    });
  }, [pdrFamilies, pdrTemplates, tasks, standardActions]);

  // Hierarchical Structure for Standard Actions
  const hierarchicalActions: HierarchyFamilyNode[] = useMemo(() => {
    if (!standardActions) return [];

    const categories: { 
      id: 'PREV' | 'CORR' | 'BOTH'; 
      name: string; 
      subtitle: string; 
      code: string; 
      discipline: 'mechanical' | 'hydraulic' | 'electrical' | 'general'
    }[] = [
      { id: 'PREV', name: 'أفعال وقائية واستباقية', subtitle: 'إجراءات فحص وتشحيم ومعايرة دورية', code: 'PREV', discipline: 'general' },
      { id: 'CORR', name: 'أفعال علاجية وتصليح', subtitle: 'إجراءات استجابة للأعطال والتبديل الطارئ', code: 'CORR', discipline: 'general' },
      { id: 'BOTH', name: 'أفعال صيانة مشتركة', subtitle: 'إجراءات تناسب النوعين الوقائي والعلاجي', code: 'BOTH', discipline: 'general' },
    ];

    return categories.map(cat => {
      const matching = standardActions.filter(a => a.type === cat.id);
      return {
        id: cat.id,
        code: cat.code,
        name: cat.name,
        subtitle: cat.subtitle,
        discipline: cat.discipline,
        count: matching.length,
        templates: [
          {
            id: `cat_${cat.id}`,
            code: cat.code,
            name: `قائمة ${cat.name}`,
            subtitle: `${matching.length} أفعال مسجلة`,
            count: matching.length,
            items: matching.map(act => ({
              id: act.id,
              code: act.code || 'ACT',
              name: act.name,
              subtitle: act.description || `فعل صيانة (${cat.code})`,
              raw: act
            })),
            raw: cat
          }
        ],
        raw: cat
      };
    });
  }, [standardActions]);

  // Filtered Tasks list
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesHierarchy = true;
      if (selectedTaskId) {
        matchesHierarchy = task.id === selectedTaskId;
      } else if (selectedTemplateId) {
        matchesHierarchy = task.pdrTemplateId === selectedTemplateId;
      } else if (selectedFamilyId) {
        matchesHierarchy = task.pdrFamilyId === selectedFamilyId;
      }

      return matchesSearch && matchesHierarchy;
    });
  }, [tasks, searchTerm, selectedFamilyId, selectedTemplateId, selectedTaskId]);

  // Filtered Actions list
  const filteredActions = useMemo(() => {
    if (!standardActions) return [];
    return standardActions.filter(act => {
      const matchesSearch = act.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (act.code && act.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (act.description && act.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesType = true;
      if (selectedActionId) {
        matchesType = act.id === selectedActionId;
      } else if (selectedActionTypeFilter && selectedActionTypeFilter !== 'ALL') {
        matchesType = act.type === selectedActionTypeFilter;
      }

      return matchesSearch && matchesType;
    });
  }, [standardActions, searchTerm, selectedActionTypeFilter, selectedActionId]);

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
        <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-6">
          
          {/* Left Sidebar - Taxonomy Tree Navigation */}
          <div className="w-full md:w-96 shrink-0 h-[650px] md:h-auto min-h-0">
            <LabHierarchicalSidebar
              title={activeTab === 'tasks' ? t("preventive.catalog.tasksHierarchy", "هيكلية المهمات") : t("preventive.catalog.actionsDictionary", "قاموس أفعال الصيانة")}
              subtitle={activeTab === 'tasks' ? t("preventive.catalog.tasksSub", "تصنيف حسب العائلات والقوالب") : t("preventive.catalog.actionsSub", "تصنيف الأفعال القياسية حسب النوع")}
              customTabs={[
                { id: 'tasks', label: t('preventive.catalog.tabTasks', 'المهمات'), count: tasks?.length || 0, icon: Settings2 },
                { id: 'actions', label: t('preventive.catalog.tabActions', 'أفعال الصيانة'), count: standardActions?.length || 0, icon: Activity }
              ]}
              activeTabId={activeTab}
              onTabChange={(tabId) => {
                setActiveTab(tabId as 'tasks' | 'actions');
                setSelectedFamilyId(null);
                setSelectedTemplateId(null);
                setSelectedTaskId(null);
                setSelectedActionTypeFilter('ALL');
                setSelectedActionId(null);
              }}
              families={activeTab === 'tasks' ? hierarchicalFamilies : hierarchicalActions}
              selectedFamilyId={activeTab === 'tasks' ? selectedFamilyId : (selectedActionTypeFilter === 'ALL' ? null : selectedActionTypeFilter)}
              selectedTemplateId={activeTab === 'tasks' ? selectedTemplateId : null}
              selectedBlueprintId={activeTab === 'tasks' ? selectedTaskId : selectedActionId}
              onSelectFamily={(fam) => {
                if (activeTab === 'tasks') {
                  setSelectedFamilyId(fam ? fam.id : null);
                  setSelectedTemplateId(null);
                  setSelectedTaskId(null);
                } else {
                  setSelectedActionTypeFilter(fam ? (fam.id as 'PREV' | 'CORR' | 'BOTH') : 'ALL');
                  setSelectedActionId(null);
                }
              }}
              onSelectTemplate={(tmpl, fam) => {
                if (activeTab === 'tasks') {
                  if (fam) setSelectedFamilyId(fam.id);
                  setSelectedTemplateId(tmpl ? tmpl.id : null);
                  setSelectedTaskId(null);
                }
              }}
              onSelectBlueprint={(item, tmpl, fam) => {
                if (activeTab === 'tasks') {
                  if (fam) setSelectedFamilyId(fam.id);
                  if (tmpl) setSelectedTemplateId(tmpl.id);
                  setSelectedTaskId(item ? item.id : null);
                } else {
                  if (fam) setSelectedActionTypeFilter(fam.id as 'PREV' | 'CORR' | 'BOTH');
                  setSelectedActionId(item ? item.id : null);
                }
              }}
              onResetSelection={() => {
                if (activeTab === 'tasks') {
                  setSelectedFamilyId(null);
                  setSelectedTemplateId(null);
                  setSelectedTaskId(null);
                } else {
                  setSelectedActionTypeFilter('ALL');
                  setSelectedActionId(null);
                }
              }}
              resetLabel={activeTab === 'tasks' ? t('preventive.catalog.allFamilies', 'عرض كافة المهمات (الكل)') : t('preventive.catalog.allActions', 'عرض كافة أفعال الصيانة (الكل)')}
              onPrimaryAction={() => {
                if (activeTab === 'tasks') {
                  if (selectedFamilyId) setPdrFamilyId(selectedFamilyId);
                  if (selectedTemplateId) setPdrTemplateId(selectedTemplateId);
                  setIsModalOpen(true);
                } else {
                  setEditingActionId(null);
                  setActionName('');
                  setActionCode('');
                  setActionType(selectedActionTypeFilter && selectedActionTypeFilter !== 'ALL' ? selectedActionTypeFilter : 'PREV');
                  setActionDesc('');
                  setIsActionModalOpen(true);
                }
              }}
              primaryActionLabel={activeTab === 'tasks' ? t('preventive.catalog.newTask', 'إضافة مهمة وقائية جديدة') : t('preventive.catalog.newAction', 'إضافة فعل صيانة جديد')}
              engineTheme="emerald"
              level3Enabled={true}
            />
          </div>

          {/* Left Main Workspace Canvas */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-full bg-[#0a0b10]/95 backdrop-blur-xl relative min-h-0 w-full">
              
              {/* Engine Accent Line */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none z-20" />

              {/* Ambient Engine Accent Rays & Glows */}
              <div className="absolute -top-12 -right-12 sm:-top-20 sm:-right-20 w-64 h-64 sm:w-80 sm:h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />
              <div className="absolute -bottom-12 -left-12 sm:-bottom-20 sm:-left-20 w-64 h-64 sm:w-80 sm:h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={`workspace-${activeTab}-${selectedFamilyId}-${selectedTemplateId}-${selectedTaskId}-${selectedActionTypeFilter}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col h-full min-h-0 w-full relative z-10"
                >
                  {((activeTab === 'tasks') || (activeTab === 'actions')) ? (
                    <>
                      {/* Dynamic Header */}
                      <div className="p-4 md:p-6 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-[#0a0b10]/95 backdrop-blur-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10 shadow-md text-start">
                        <div className="flex items-start gap-4 shrink-0">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
                            activeTab === 'tasks' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                          )}>
                            {activeTab === 'tasks' ? <Settings2 className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                          </div>
                          <div className="text-start">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold bg-white/10 text-white px-2 py-0.5 rounded border border-white/15">
                                {activeTab === 'tasks' ? 'مهمات' : 'أفعال'}
                              </span>
                              <h3 className="text-lg font-bold text-white tracking-tight">
                                {activeTab === 'tasks' 
                                  ? (selectedTaskId
                                      ? tasks?.find(t => t.id === selectedTaskId)?.title || 'مهمة محددة'
                                      : selectedTemplateId
                                        ? pdrTemplates?.find(t => t.id === selectedTemplateId)?.name || 'قالب محدد'
                                        : selectedFamilyId
                                          ? pdrFamilies?.find(f => f.id === selectedFamilyId)?.name || 'عائلة محددة'
                                          : t('preventive.catalog.allFamilies', 'جميع العائلات الهندسية')
                                    )
                                  : (selectedActionTypeFilter === 'ALL' ? t('preventive.catalog.allActions', 'جميع أفعال الصيانة') : 
                                     selectedActionTypeFilter === 'PREV' ? t('preventive.catalog.prevActions', 'أفعال وقائية') :
                                     selectedActionTypeFilter === 'CORR' ? t('preventive.catalog.corrActions', 'أفعال علاجية') : t('preventive.catalog.bothActions', 'أفعال مشتركة'))
                                }
                              </h3>
                              <span className="text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                                {activeTab === 'tasks' ? `${filteredTasks.length} مهمة` : `${filteredActions.length} فعل`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                              {activeTab === 'tasks' 
                                ? 'نطاق توجيه الصيانة الوقائية'
                                : 'قاموس مصطلحات الصيانة القياسية'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10 mr-1">
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
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5 text-slate-950" />
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
                              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5 text-slate-950" />
                              <span>{t('preventive.catalog.newAction', 'فعل صيانة جديد')}</span>
                            </button>
                          )}
                        </div>
                      </div>

                  {/* Main Data Content */}
                  <div className="flex-1 flex flex-col min-h-0 w-full text-start overflow-hidden">
                    {activeTab === 'tasks' ? (
                      /* Tasks Content */
                      viewMode === 'table' ? (
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-0">
                          <table className="w-full text-start border-collapse">
                            <thead className="bg-[#0b0c13]/98 border-b-2 border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
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
                                filteredTasks.map((task, idx) => {
                                  const linkedFamily = pdrFamilies?.find(f => f.id === task.pdrFamilyId);
                                  const linkedTemplate = pdrTemplates?.find(t => t.id === task.pdrTemplateId);
                                  const linkedAction = standardActions?.find(a => a.id === task.actionId);

                                  return (
                                    <tr 
                                      key={task.id} 
                                      className={cn(
                                        "transition-colors duration-150 border-b border-white/5",
                                        idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                                        "hover:bg-emerald-500/15 hover:text-white"
                                      )}
                                    >
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
                                          <span className="font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
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
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
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
                                    className="p-5 flex flex-col justify-between group transition-all duration-500 hover:scale-[1.02] hover:border-emerald-500/50 hover:bg-[#0a0a0f] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] relative overflow-hidden text-start border border-white/10"
                                  >
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
                                              <Wrench className="w-3.5 h-3.5 text-emerald-400" /> الفعل
                                            </span>
                                            <span className="font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded text-[10px]">
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
                        </div>
                      )
                    ) : (
                      /* Actions Content */
                      viewMode === 'table' ? (
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-0">
                          <table className="w-full text-start border-collapse">
                            <thead className="bg-[#0b0c13]/98 border-b-2 border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
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
                                      color="emerald"
                                      className="py-16 opacity-80"
                                    />
                                  </td>
                                </tr>
                              ) : (
                                filteredActions.map((act, idx) => {
                                  const typeBadgeColor = act.type === 'PREV' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                                       : act.type === 'CORR' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                                       : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                                  return (
                                    <tr 
                                      key={act.id} 
                                      className={cn(
                                        "transition-colors duration-150 border-b border-white/5",
                                        idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                                        "hover:bg-white/[0.06] hover:text-white"
                                      )}
                                    >
                                      <td className="p-4 font-mono font-bold text-emerald-300 text-start">
                                        {act.code ? (
                                          <span className="bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
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
                                color="emerald"
                                className="py-16 opacity-80 glass-panel rounded-2xl border-dashed border-white/10"
                              />
                            </div>
                          ) : (
                            filteredActions.map(act => {
                              const typeText = act.type === 'PREV' ? 'وقائي' : act.type === 'CORR' ? 'علاجي' : 'مشترك';
                              const statusVariant = act.type === 'PREV' ? 'emerald' : act.type === 'CORR' ? 'rose' : 'amber';

                              return (
                                <LabEntityCard
                                  key={act.id}
                                  id={`action-card-${act.id}`}
                                  title={act.name}
                                  subtitle={act.description || t('preventive.catalog.noActionDesc', 'فعل صيانة قياسي معتمد في النظام')}
                                  code={act.code}
                                  icon={Wrench}
                                  engineTheme="emerald"
                                  statusBadge={{
                                    label: typeText,
                                    variant: statusVariant
                                  }}
                                  metrics={[
                                    {
                                      label: 'نوع الفعل',
                                      value: typeText,
                                      icon: Activity,
                                      highlight: true
                                    },
                                    {
                                      label: 'التصنيف',
                                      value: act.type === 'PREV' ? 'صيانة دورية' : act.type === 'CORR' ? 'تدخل طارئ' : 'استخدام عام',
                                      icon: Settings2
                                    }
                                  ]}
                                  actions={[
                                    {
                                      icon: Edit3,
                                      title: t('common.edit', 'تعديل'),
                                      onClick: (e) => handleEditAction(act, e),
                                      variant: 'ghost'
                                    },
                                    {
                                      icon: Trash2,
                                      title: t('common.delete', 'حذف'),
                                      onClick: (e) => handleDeleteAction(act.id, e),
                                      variant: 'danger'
                                    }
                                  ]}
                                />
                              );
                            })
                          )}
                        </div>
                      )
                    )}
                  </div>
                </>
              ) : (
                    /* Gorgeous Welcome / Greeting state */
                    <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center h-full flex-1 my-auto">
                      <div className="w-16 h-16 rounded-3xl border flex items-center justify-center mb-6 shadow-lg transition-all duration-500 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5 animate-pulse">
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
                              setSelectedFamilyId(null);
                              setSelectedTemplateId(null);
                              setSelectedTaskId(null);
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
              className="w-full max-w-lg bg-[#0f111a] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden text-right"
              dir="rtl"
            >
              <div className="h-1 w-full bg-emerald-500" />
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-emerald-500 rounded-full" />
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
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
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
                        className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono text-center text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 px-1">{t('preventive.catalog.colType', 'نوع الفعل')}</label>
                    <select 
                      value={actionType}
                      onChange={e => setActionType(e.target.value as any)}
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none font-sans text-xs"
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
                      className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none resize-none text-xs"
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
    </div>
  );
}