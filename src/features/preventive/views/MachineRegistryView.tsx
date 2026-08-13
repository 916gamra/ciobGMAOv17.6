import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Machine, MachineTemplate, MachineBlueprint, PreventiveTask, PreventiveCard, MachineFamily, Technician } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { cn } from '@/shared/utils';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  FileStack, 
  Activity, 
  Play, 
  Settings2, 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Link2, 
  Factory, 
  ChevronRight, 
  Boxes, 
  FileText, 
  CheckCircle, 
  Tag, 
  Info,
  Layers,
  Sparkles,
  ClipboardList,
  Eye,
  LayoutGrid,
  Database
} from 'lucide-react';

export function MachineRegistryView() {
  const { t } = useTranslation();
  // Database Live Queries
  const templates = useLiveQuery(() => db.machineTemplates.toArray(), []);
  const blueprints = useLiveQuery(() => db.machineBlueprints.toArray(), []);
  const machineFamilies = useLiveQuery(() => db.machineFamilies.toArray(), []);
  const tasks = useLiveQuery(() => db.preventiveTasks.toArray(), []);
  const machines = useLiveQuery(() => db.machines.toArray(), []);
  const technicians = useLiveQuery(() => db.technicians?.toArray() || [], []);
  const preventiveCards = useLiveQuery(() => db.preventiveCards.toArray(), []);

  // UI state
  const [activeSidebarTab, setActiveSidebarTab] = useState<'templates' | 'blueprints'>('templates');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isLinkTaskModalOpen, setIsLinkTaskModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  // Link Task state
  const [selectedTasksForLink, setSelectedTasksForLink] = useState<string[]>([]);

  // Deploy state
  const [deployMachineIds, setDeployMachineIds] = useState<string[]>([]);
  const [deployTechId, setDeployTechId] = useState('');
  const [deployDate, setDeployDate] = useState('');
  const [deployTime, setDeployTime] = useState('08:00');

  // Dynamic template & family creation on-the-fly fields
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateSkuBase, setNewTemplateSkuBase] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<any>('A');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyCode, setNewFamilyCode] = useState('');

  // Blueprint creation fields
  const [bpTemplateId, setBpTemplateId] = useState('');
  const [bpReference, setBpReference] = useState('');
  const [bpBrand, setBpBrand] = useState('');
  const [bpModel, setBpModel] = useState('');
  const [bpPower, setBpPower] = useState('');
  const [bpEnergy, setBpEnergy] = useState('380v');

  // Preventive Card creation fields
  const [newCardName, setNewCardName] = useState('');

  // Resolved selections
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
  const selectedBlueprint = blueprints?.find(b => b.id === selectedBlueprintId);

  // Filtered Cards for the selected Template
  const cardsForSelectedTemplate = preventiveCards?.filter(c => c.templateId === selectedTemplateId) || [];
  const selectedCard = cardsForSelectedTemplate.find(c => c.id === selectedCardId);

  // Filtered Templates & Blueprints for Sidebar Navigation
  const filteredTemplates = templates?.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.skuBase.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredBlueprints = blueprints?.filter(bp => 
    bp.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
    bp.brand.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Resolve tasks inside the selected card
  const activeCardTaskIds = new Set(selectedCard?.taskIds || []);
  const linkedTasksInCard = tasks?.filter(t => activeCardTaskIds.has(t.id)) || [];

  // Resolve physical machines belonging to the selected template
  const getTemplateMachines = () => {
    if (!selectedTemplateId || !machines) return [];
    return machines.filter(m => {
      if (m.templateId === selectedTemplateId) return true;
      if (m.blueprintId && blueprints) {
        const bp = blueprints.find(b => b.id === m.blueprintId);
        return bp?.templateId === selectedTemplateId;
      }
      return false;
    });
  };
  const templateMachines = getTemplateMachines();

  // Auto-select first card when template changes
  useEffect(() => {
    if (cardsForSelectedTemplate.length > 0) {
      setSelectedCardId(cardsForSelectedTemplate[0].id);
    } else {
      setSelectedCardId(null);
    }
  }, [selectedTemplateId, preventiveCards]);

  // Pre-populate target machines in deploy modal
  useEffect(() => {
    if (isDeployModalOpen && templateMachines) {
      setDeployMachineIds(templateMachines.map(m => m.id));
    }
  }, [isDeployModalOpen]);

  // Operations & Handlers
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalFamilyId = selectedFamilyId;

      if (isCreatingFamily) {
        if (!newFamilyName.trim() || !newFamilyCode.trim()) {
          toast.error('الرجاء إدخال اسم ورمز العائلة الجديدة');
          return;
        }
        const familyId = crypto.randomUUID();
        await db.machineFamilies.add({
          id: familyId,
          name: newFamilyName.trim(),
          code: newFamilyCode.toUpperCase().trim().slice(0, 2),
          createdAt: new Date().toISOString()
        });
        finalFamilyId = familyId;
        toast.success(`تم إنشاء عائلة الآلة [${newFamilyName}] بنجاح!`);
      }

      if (!finalFamilyId) {
        toast.error('الرجاء تحديد العائلة لقالب الآلة الجديد');
        return;
      }

      if (!newTemplateName.trim() || !newTemplateSkuBase.trim()) {
        toast.error('الرجاء إدخال اسم القالب والرمز المرجعي الأساسي SKU Base');
        return;
      }

      const templateId = crypto.randomUUID();
      await db.machineTemplates.add({
        id: templateId,
        familyId: finalFamilyId,
        name: newTemplateName.trim(),
        type: newTemplateType,
        skuBase: newTemplateSkuBase.toUpperCase().trim(),
        createdAt: new Date().toISOString()
      });

      toast.success(`تم إنشاء قالب الآلة [${newTemplateName}] بنجاح!`);
      setIsTemplateModalOpen(false);
      
      // Select newly created template
      setSelectedTemplateId(templateId);
      
      // Clear fields
      setNewTemplateName('');
      setNewTemplateSkuBase('');
      setNewTemplateType('A');
      setSelectedFamilyId('');
      setNewFamilyName('');
      setNewFamilyCode('');
      setIsCreatingFamily(false);
    } catch (err: any) {
      toast.error('فشل إنشاء قالب الآلة: ' + err.message);
    }
  };

  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bpTemplateId || !bpReference.trim() || !bpBrand.trim() || !bpModel.trim()) {
      toast.error('الرجاء إدخال جميع الحقول المطلوبة للطراز');
      return;
    }

    try {
      const blueprintId = crypto.randomUUID();
      await db.machineBlueprints.add({
        id: blueprintId,
        templateId: bpTemplateId,
        reference: bpReference.toUpperCase().trim(),
        brand: bpBrand.trim(),
        model: bpModel.trim(),
        powerOrForce: bpPower.trim(),
        energySource: bpEnergy,
        createdAt: new Date().toISOString()
      });

      toast.success('تم تسجيل طراز الآلة الجديد (Blueprint) بنجاح!');
      setIsBlueprintModalOpen(false);

      // Clear fields
      setBpTemplateId('');
      setBpReference('');
      setBpBrand('');
      setBpModel('');
      setBpPower('');
      setBpEnergy('380v');
    } catch (err: any) {
      toast.error('فشل تسجيل الطراز: ' + err.message);
    }
  };

  const handleCreatePreventiveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    if (!newCardName.trim()) {
      toast.error('الرجاء إدخال اسم البطاقة');
      return;
    }

    try {
      const cardId = crypto.randomUUID();
      await db.preventiveCards.add({
        id: cardId,
        templateId: selectedTemplateId,
        name: newCardName.trim(),
        taskIds: [],
        createdAt: new Date().toISOString()
      });

      toast.success('تم إنشاء المجموعة الوقائية الجديدة بنجاح.');
      setIsCardModalOpen(false);
      setNewCardName('');
      setSelectedCardId(cardId);
    } catch (err: any) {
      toast.error('فشل إنشاء المجموعة الوقائية: ' + err.message);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المجموعة الوقائية بالكامل؟')) {
      try {
        await db.preventiveCards.delete(cardId);
        toast.success('تم حذف المجموعة الوقائية بنجاح.');
        setSelectedCardId(null);
      } catch (err: any) {
        toast.error('فشل الحذف: ' + err.message);
      }
    }
  };

  const handleLinkTasksToCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId || !selectedCard || selectedTasksForLink.length === 0) return;

    try {
      const updatedTaskIds = Array.from(new Set([...selectedCard.taskIds, ...selectedTasksForLink]));
      await db.preventiveCards.update(selectedCardId, {
        taskIds: updatedTaskIds
      });

      toast.success('تم ربط المهام المحددة بهذه المجموعة الوقائية بنجاح.');
      setIsLinkTaskModalOpen(false);
      setSelectedTasksForLink([]);
    } catch (err: any) {
      toast.error('فشل ربط المهام: ' + err.message);
    }
  };

  const handleUnlinkTaskFromCard = async (taskId: string) => {
    if (!selectedCardId || !selectedCard) return;

    try {
      const updatedTaskIds = selectedCard.taskIds.filter(id => id !== taskId);
      await db.preventiveCards.update(selectedCardId, {
        taskIds: updatedTaskIds
      });
      toast.success('تمت إزالة المهمة من هذه المجموعة الوقائية.');
    } catch (err: any) {
      toast.error('فشل إزالة المهمة: ' + err.message);
    }
  };

  const handleDeployPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || deployMachineIds.length === 0 || !deployDate || !deployTime) {
      toast.error('الرجاء تحديد فني، تاريخ بداية التنفيذ، وآلة واحدة على الأقل');
      return;
    }

    try {
      await db.transaction('rw', db.machineTasks, db.taskExecutions, async () => {
        const existingMachineTasks = await db.machineTasks.where('machineId').anyOf(deployMachineIds).toArray();
        const existingMap = new Set(existingMachineTasks.map(mt => `${mt.machineId}-${mt.taskId}`));
        
        const newMachineTasks: any[] = [];
        const newExecutions: any[] = [];

        for (const mId of deployMachineIds) {
          for (const t of linkedTasksInCard) {
            // Register as task inherited by the machine instance
            if (!existingMap.has(`${mId}-${t.id}`)) {
              newMachineTasks.push({
                id: crypto.randomUUID(),
                machineId: mId,
                taskId: t.id,
                isInherited: true,
                isEnabled: true,
                addedAt: new Date().toISOString(),
                technicianId: deployTechId || undefined,
                scheduledTime: deployTime
              });
            }
            
            // Register the execution entry in schedule
            newExecutions.push({
              id: crypto.randomUUID(),
              machineId: mId,
              taskId: t.id,
              status: 'PENDING',
              scheduledDate: `${deployDate}T${deployTime}:00`,
              doneBy: deployTechId || undefined,
              serviceType: "PREV"
            });
          }
        }
        
        if (newMachineTasks.length > 0) {
          await db.machineTasks.bulkAdd(newMachineTasks);
        }
        if (newExecutions.length > 0) {
          await db.taskExecutions.bulkAdd(newExecutions);
        }
      });
      
      toast.success(`تمت جدولة وتفعيل الخطة الوقائية بنجاح على ${deployMachineIds.length} آلة!`);
      setIsDeployModalOpen(false);
      setDeployMachineIds([]);
    } catch (err: any) {
      toast.error('فشل تفعيل الخطة الوقائية: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08080c] text-slate-100 custom-scrollbar overflow-y-auto">
      
      {/* Header Cockpit */}
      <div className="px-6 md:px-8 pt-6">
        <PageHeader
          title={t("preventive.plans.title", "Asset Registry & Maintenance Plans")}
          subtitle={t("preventive.plans.subtitle", "إدارة وتصنيف آلات المعمل، هندسة المجموعات الوقائية المؤثثة، وجدولتها المباشرة")}
          icon={<Layers className="w-6 h-6 text-emerald-400" />}
          badgeColor="emerald"
          badgeText={t("preventive.plans.badge", "Maintenance Schemes")}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t("preventive.plans.statTemplates", "Machine Templates")}
              subtitle="TEMPLATES"
              value={templates?.length || 0}
              icon={<Layers className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t("preventive.plans.statBlueprints", "Catalog Blueprints")}
              subtitle="BLUEPRINTS"
              value={blueprints?.length || 0}
              icon={<Boxes className="w-3.5 h-3.5" />}
              color="cyan"
            />
            <HeaderBentoCard
              title={t("preventive.plans.statInstances", "Active Machines")}
              subtitle="INSTANCES"
              value={machines?.length || 0}
              icon={<Factory className="w-3.5 h-3.5" />}
              color="blue"
            />
            <HeaderBentoCard
              title={t("preventive.plans.statCards", "Preventive Groups")}
              subtitle="PREVENTIVE"
              value={preventiveCards?.length || 0}
              icon={<ClipboardList className="w-3.5 h-3.5" />}
              color="purple"
            />
          </div>
        </PageHeader>
      </div>

      {/* Main Content Area */}
      <div className="px-6 md:px-8 py-6 flex-1 min-h-0">
        <div className="flex flex-col lg:flex-row gap-6 min-h-0 h-full">
        
          {/* LEFT SIDEBAR: Templates & Blueprints Navigation */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
            <div className="flex flex-col h-full min-h-[420px] p-0 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(16,185,129,0.12)] bg-gradient-to-b from-emerald-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98 backdrop-blur-xl relative">
              
              {/* Background ambient engine accent glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Sidebar Header & Controls */}
              <div className="p-5 text-start space-y-3.5 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-white uppercase tracking-wider block">
                      {t("preventive.plans.sidebarHeader", "مكتبة وسجل الأصول")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">
                      {activeSidebarTab === 'templates' ? 'قوالب الآلات والهياكل' : 'كتالوج الطرازات والموديلات'}
                    </span>
                  </div>
                </div>

                {/* Segmented Tab Navigation - Neutral High Contrast */}
                <div className="flex items-center gap-1 bg-[#08080c]/90 p-1 rounded-2xl border border-white/10">
                  <button
                    onClick={() => {
                      setActiveSidebarTab('templates');
                      setSearchTerm('');
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer",
                      activeSidebarTab === 'templates' 
                        ? "bg-white/10 text-white border border-white/20 shadow-sm font-extrabold" 
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {t("preventive.plans.tabTemplates", "قوالب الآلات")} ({templates?.length || 0})
                  </button>

                  <button
                    onClick={() => {
                      setActiveSidebarTab('blueprints');
                      setSearchTerm('');
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer",
                      activeSidebarTab === 'blueprints' 
                        ? "bg-white/10 text-white border border-white/20 shadow-sm font-extrabold" 
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {t("preventive.plans.tabBlueprints", "الطرازات")} ({blueprints?.length || 0})
                  </button>
                </div>

                {/* Prominent Wide Action Button */}
                {activeSidebarTab === 'templates' ? (
                  <button 
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>{t("preventive.plans.addTemplate", "إضافة قالب آلة جديد")}</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsBlueprintModalOpen(true)}
                    className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>{t("preventive.plans.addBlueprint", "تسجيل طراز تجاري بالكتالوج")}</span>
                  </button>
                )}

                {/* Search Bar - Crystal White */}
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute right-3 rtl:right-3 left-auto rtl:left-auto left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder={activeSidebarTab === 'templates' ? "بحث في قوالب الآلات..." : "بحث في الطرازات التجارية..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pr-9 pl-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-start font-bold shadow-sm"
                  />
                </div>

              </div>

              {/* Scrollable Items List */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2.5 text-start relative z-10">
                
                {/* List Header Row with Count */}
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    {activeSidebarTab === 'templates' 
                      ? `قوالب الآلات (${filteredTemplates.length})` 
                      : `الطرازات المادية (${filteredBlueprints.length})`}
                  </span>
                </div>

                {/* Filtered Bento Mini-Cards - Matching HeaderBentoCard */}
                {activeSidebarTab === 'templates' ? (
                  filteredTemplates.map(t => {
                    const isSelected = selectedTemplateId === t.id && !selectedBlueprintId;
                    const fam = machineFamilies?.find(f => f.id === t.familyId);
                    const mCount = machines?.filter(m => m.templateId === t.id || blueprints?.some(b => b.id === m.blueprintId && b.templateId === t.id)).length || 0;

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplateId(t.id);
                          setSelectedBlueprintId(null);
                        }}
                        className={cn(
                          "p-3.5 rounded-2xl transition-all duration-500 relative group overflow-hidden select-none cursor-pointer flex flex-col gap-2.5 text-start bg-[#0a0a0f]",
                          isSelected 
                            ? "border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-[1.03]" 
                            : "border border-white/10 hover:border-white/25 hover:scale-[1.01]"
                        )}
                      >
                        {/* Selected Background Ambient Glow */}
                        {isSelected && (
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-16 bg-emerald-500/25 rounded-full blur-xl pointer-events-none" />
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-sm transition-all duration-300",
                              isSelected 
                                ? "bg-white/5 border-white/10 text-emerald-400" 
                                : "bg-white/5 border-white/10 text-slate-300 group-hover:text-white"
                            )}>
                              <Layers className="w-3.5 h-3.5" />
                            </div>
                            <span className={cn(
                              "text-xs truncate transition-all duration-300",
                              isSelected ? "text-white font-black" : "text-slate-300 group-hover:text-white font-bold"
                            )}>{t.name}</span>
                          </div>
                          <span className={cn(
                            "text-[10px] font-mono font-bold border px-2 py-0.5 rounded-md shrink-0 uppercase transition-all duration-300",
                            isSelected 
                              ? "bg-white/20 text-white border-white/30" 
                              : "bg-white/5 text-slate-300 border-white/10 group-hover:text-white"
                          )}>
                            {t.skuBase}
                          </span>
                        </div>

                        <div className={cn(
                          "flex justify-between items-center text-[10px] pt-2 border-t transition-colors duration-300",
                          isSelected ? "border-white/15 text-slate-200" : "border-white/5 text-slate-400 group-hover:text-white"
                        )}>
                          <span>العائلة: <strong className={cn("transition-colors", isSelected ? "text-slate-200 font-bold" : "text-slate-400 group-hover:text-slate-200 font-bold")}>{fam ? fam.name : 'عام'}</strong></span>
                          <span className={cn(
                            "font-mono border px-2 py-0.5 rounded-md font-bold transition-all duration-300",
                            isSelected 
                              ? "bg-white/20 text-white border-white/30" 
                              : "bg-white/5 text-slate-300 border-white/10 group-hover:text-white"
                          )}>
                            {mCount} آلة
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  filteredBlueprints.map(bp => {
                    const isSelected = selectedBlueprintId === bp.id;
                    const tpl = templates?.find(t => t.id === bp.templateId);

                    return (
                      <div
                        key={bp.id}
                        onClick={() => {
                          setSelectedBlueprintId(bp.id);
                          if (tpl) setSelectedTemplateId(tpl.id);
                        }}
                        className={cn(
                          "p-3.5 rounded-2xl transition-all duration-500 relative group overflow-hidden select-none cursor-pointer flex flex-col gap-2.5 text-start bg-[#0a0a0f]",
                          isSelected 
                            ? "border-2 border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.35)] scale-[1.03]" 
                            : "border border-white/10 hover:border-white/25 hover:scale-[1.01]"
                        )}
                      >
                        {/* Selected Background Ambient Glow */}
                        {isSelected && (
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-16 bg-cyan-500/25 rounded-full blur-xl pointer-events-none" />
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-sm transition-all duration-300",
                              isSelected 
                                ? "bg-white/5 border-white/10 text-cyan-400" 
                                : "bg-white/5 border-white/10 text-slate-300 group-hover:text-white"
                            )}>
                              <Boxes className="w-3.5 h-3.5" />
                            </div>
                            <span className={cn(
                              "text-xs font-mono truncate transition-all duration-300",
                              isSelected ? "text-white font-black" : "text-slate-300 group-hover:text-white font-bold"
                            )}>{bp.reference}</span>
                          </div>
                          <span className={cn(
                            "text-[10px] font-mono font-bold border px-2 py-0.5 rounded-md shrink-0 transition-all duration-300",
                            isSelected 
                              ? "bg-white/20 text-white border-white/30" 
                              : "bg-white/5 text-slate-300 border-white/10 group-hover:text-white"
                          )}>
                            {bp.brand}
                          </span>
                        </div>

                        <div className={cn(
                          "flex justify-between items-center text-[10px] pt-2 border-t transition-colors duration-300",
                          isSelected ? "border-white/15 text-slate-200" : "border-white/5 text-slate-400 group-hover:text-white"
                        )}>
                          <span>القالب: <strong className={cn("transition-colors", isSelected ? "text-slate-200 font-bold" : "text-slate-400 group-hover:text-slate-200 font-bold")}>{tpl ? tpl.name : 'غير محدد'}</strong></span>
                          <span className={cn(
                            "font-mono border px-2 py-0.5 rounded-md font-bold transition-all duration-300",
                            isSelected 
                              ? "bg-white/20 text-white border-white/30" 
                              : "bg-white/5 text-slate-300 border-white/10 group-hover:text-white"
                          )}>
                            {bp.powerOrForce || 'N/A'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                {activeSidebarTab === 'templates' && filteredTemplates.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-12">لا توجد قوالب آلات مسجلة بعد.</div>
                )}
                {activeSidebarTab === 'blueprints' && filteredBlueprints.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-12">لا توجد طرازات مسجلة بعد.</div>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT MAIN WORKSPACE CANVAS */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl bg-[#0a0b10]/90 backdrop-blur-xl">
              <AnimatePresence mode="wait">
                {selectedTemplate ? (
                  <motion.div
                    key={`template-${selectedTemplate.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex flex-col h-full min-h-0 p-6 md:p-8 text-start overflow-y-auto custom-scrollbar space-y-6"
                  >
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-6 mb-2 gap-4 text-start">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#08080c] border border-white/10 flex items-center justify-center shadow-inner shrink-0">
                          <Layers className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="text-start">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg border border-white/15 uppercase">
                              SKU: {selectedTemplate.skuBase}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                              {selectedTemplate.type === 'A' ? 'آلي (Automatic)' : selectedTemplate.type === 'I' ? 'كهربائي (Electric)' : 'يدوي/ميكانيكي'}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white tracking-tight mt-1">{selectedTemplate.name}</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            الآلات المادية التابعة: <strong className="text-white font-mono">{templateMachines.length} آلة</strong> • المجموعات الوقائية المصممة: <strong className="text-emerald-400 font-mono">{cardsForSelectedTemplate.length} مجموعة</strong>
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons & View Switcher */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View Switcher Toggle */}
                        <div className="flex items-center gap-1.5 p-1 bg-[#08080c] rounded-xl border border-white/10">
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

                        <button
                          onClick={() => setIsCardModalOpen(true)}
                          className="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-extrabold rounded-xl px-3.5 py-2 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>إنشاء مجموعة وقائية</span>
                        </button>

                        <button
                          onClick={() => setIsDeployModalOpen(true)}
                          disabled={cardsForSelectedTemplate.length === 0 || templateMachines.length === 0}
                          className="bg-white hover:bg-slate-200 text-slate-950 font-extrabold rounded-xl px-4 py-2 text-xs shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>جدولة وتفعيل الخطة</span>
                        </button>
                      </div>
                    </div>

                    {/* Architectural Notice */}
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-start">
                      <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-300">استقلالية القوالب والخطط الوقائية</h4>
                        <p className="text-[11px] leading-relaxed text-slate-300 mt-1">
                          ترتبط الخطط والبطاقات الوقائية بـ <strong>قالب الآلة (Template)</strong>. يمكنك تصميم مجموعات متعددة وتفعيلها بضغطة زر واحدة لتصل تلقائياً لجميع الآلات المادية التابعة له ولجدول التقني المسؤول.
                        </p>
                      </div>
                    </div>

                    {/* Section 1: Preventive Cards */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-emerald-400" />
                          المجموعات والخطط الوقائية المصممة ({cardsForSelectedTemplate.length})
                        </h4>
                      </div>

                      {cardsForSelectedTemplate.length === 0 ? (
                        <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                          <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">لا توجد مجموعات وقائية مصممة لهذا القالب بعد.</p>
                          <button
                            onClick={() => setIsCardModalOpen(true)}
                            className="mt-3 text-xs px-4 py-2 bg-white text-slate-950 font-extrabold rounded-xl hover:bg-slate-200 shadow-md transition-all inline-block cursor-pointer"
                          >
                            إنشاء أول مجموعة وقائية
                          </button>
                        </div>
                      ) : viewMode === 'table' ? (
                        /* Crystal High-Contrast Table View for Cards */
                        <div className="rounded-2xl border border-white/10 bg-[#0a0b10]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                          <table className="w-full text-start border-collapse">
                            <thead className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-xs text-start">
                              <tr>
                                <th className="p-4 text-start">اسم المجموعة الوقائية</th>
                                <th className="p-4 text-start">عدد المهام</th>
                                <th className="p-4 text-start">تاريخ التصميم</th>
                                <th className="p-4 text-end">إجراءات التحكم</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                              {cardsForSelectedTemplate.map(card => {
                                const isSelected = card.id === selectedCardId;
                                return (
                                  <tr
                                    key={card.id}
                                    onClick={() => setSelectedCardId(card.id)}
                                    className={cn(
                                      "hover:bg-white/[0.04] cursor-pointer transition-colors",
                                      isSelected && "bg-white/[0.06] text-white font-semibold"
                                    )}
                                  >
                                    <td className="p-4 text-start">
                                      <span className="font-bold text-white">{card.name}</span>
                                    </td>
                                    <td className="p-4 text-start font-mono">
                                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[11px]">
                                        {card.taskIds.length} مهمة
                                      </span>
                                    </td>
                                    <td className="p-4 text-start font-mono text-slate-400">
                                      {new Date(card.createdAt).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="p-4 text-end" onClick={e => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => {
                                            setSelectedCardId(card.id);
                                            setIsLinkTaskModalOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                          title="ربط مهام"
                                        >
                                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCard(card.id)}
                                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                          title="حذف البطاقة"
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
                      ) : (
                        /* Cards View */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {cardsForSelectedTemplate.map(card => {
                            const isSelected = card.id === selectedCardId;
                            const cardTasks = tasks?.filter(t => card.taskIds?.includes(t.id)) || [];

                            return (
                              <div
                                key={card.id}
                                onClick={() => setSelectedCardId(card.id)}
                                className={cn(
                                  "p-5 rounded-2xl border transition-all duration-500 cursor-pointer flex flex-col justify-between text-start relative overflow-hidden",
                                  isSelected
                                    ? "border-2 border-emerald-500 bg-[#0a0a0f] scale-[1.03] shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                                    : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:scale-[1.01]"
                                )}
                              >
                                {/* Ambient Bottom Ray */}
                                {isSelected && (
                                  <div className="bg-emerald-500/25 rounded-full blur-xl absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-16 pointer-events-none z-0" />
                                )}

                                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between mb-3">
                                      <h5 className="font-bold text-white text-sm truncate max-w-[200px]">{card.name}</h5>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCard(card.id);
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                        title="حذف المجموعة"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    
                                    <div className="text-xs text-slate-400 mb-3 font-mono">
                                      تاريخ الإنشاء: {new Date(card.createdAt).toLocaleDateString('ar-EG')}
                                    </div>

                                    {/* Tasks summary list */}
                                    <div className="space-y-1.5 border-t border-white/10 pt-3">
                                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">
                                        المهام المرتبطة ({cardTasks.length})
                                      </div>
                                      {cardTasks.slice(0, 3).map(tk => (
                                        <div key={tk.id} className="text-xs text-slate-200 bg-white/5 p-2 rounded-lg flex items-center justify-between">
                                          <span className="truncate">{tk.title}</span>
                                          <span className="text-[10px] font-mono text-emerald-400 shrink-0 ml-2">{tk.frequencyValue} يوم</span>
                                        </div>
                                      ))}
                                      {cardTasks.length > 3 && (
                                        <p className="text-[10px] text-slate-500 text-center font-mono pt-1">+ {cardTasks.length - 3} مهام أخرى...</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCardId(card.id);
                                        setIsLinkTaskModalOpen(true);
                                      }}
                                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" /> ربط مهام
                                    </button>
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCardId(card.id);
                                        setIsDeployModalOpen(true);
                                      }}
                                      className="text-[11px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 hover:bg-white/20 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Play className="w-3 h-3 text-emerald-400" /> تفعيل الخطة
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Selected Card Tasks Detail Section */}
                    {selectedCard && (
                      <div className="p-5 bg-[#08080c]/80 border border-white/10 rounded-2xl text-start">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 pb-3 border-b border-white/10">
                          <div>
                            <h5 className="text-sm font-extrabold text-white">تفاصيل المهام في المجموعة: {selectedCard.name}</h5>
                            <p className="text-[11px] text-slate-400 mt-0.5">يمكنك إضافة وإزالة المهام الوقائية الفردية من هذه البطاقة</p>
                          </div>
                          <button
                            onClick={() => setIsLinkTaskModalOpen(true)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" /> إضافة مهام للمجموعة
                          </button>
                        </div>

                        {linkedTasksInCard.length === 0 ? (
                          <p className="text-xs text-slate-500 py-4 text-center">لم يتم ربط أي مهمة وقائية بهذه البطاقة بعد. اضغط على زر ربط المهام بالأعلى.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {linkedTasksInCard.map(task => (
                              <div key={task.id} className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl flex justify-between items-start text-start">
                                <div>
                                  <h6 className="font-bold text-white text-xs">{task.title}</h6>
                                  <p className="text-[10px] text-slate-400 font-mono mt-1">الوتيرة: {task.frequencyValue} يوم</p>
                                </div>
                                <button
                                  onClick={() => handleUnlinkTaskFromCard(task.id)}
                                  className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                  title="إزالة المهمة من المجموعة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section 2: Physical Machines Registered */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Factory className="w-4 h-4 text-emerald-400" />
                          الآلات المادية المسجلة تحت هذا النوع في المصنع ({templateMachines.length})
                        </h4>
                      </div>

                      {templateMachines.length === 0 ? (
                        <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                          <Factory className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">لا توجد آلات مادية مفعّلة تحت هذا القالب بعد.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {templateMachines.map(m => (
                            <div key={m.id} className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.06] transition-colors text-start">
                              <div className="flex justify-between items-center">
                                <strong className="text-xs text-emerald-400 font-mono tracking-wider">{m.referenceCode}</strong>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${m.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                                  {m.status === 'Active' ? 'نشطة' : 'صيانة'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">SN: {m.serialNumber}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </motion.div>
                ) : (
                  /* Default Welcome / Empty state */
                  <motion.div
                    key="default-welcome"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-8 md:p-12 flex flex-col items-center justify-center text-center h-full flex-1"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                      <Layers className="w-8 h-8 text-emerald-400" />
                    </div>

                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                      مركز سجل الآلات والخطط الوقائية
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
                      اختر قالب آلة أو طراز تجاري من القائمة الجانبية لتصفح الهيكلية، تصميم المجموعات الوقائية المؤثثة، وجدولتها مباشرة على طاقم التقنيين.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-2xl text-start">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                          <Layers className="w-4 h-4" />
                          <span>قوالب الآلات</span>
                        </div>
                        <p className="text-[11px] text-slate-400">المعرفة الهندسية الفنية المجرّدة ونوع التشغيل.</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                          <Boxes className="w-4 h-4" />
                          <span>الطرازات المادية</span>
                        </div>
                        <p className="text-[11px] text-slate-400">البصمات التجارية المصنعة بالماركات والمواصفات.</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                          <ClipboardList className="w-4 h-4" />
                          <span>الخطط الوقائية</span>
                        </div>
                        <p className="text-[11px] text-slate-400">بطاقات المجموعات الوقائية المجدولة دورياً للتقنيين.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        
        {/* Modal 1: Create Machine Template */}
        {isTemplateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md"
            onClick={() => setIsTemplateModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a]/95 border border-white/15 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-start"
            >
              <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">إضافة قالب آلة جديد (Template)</h2>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 px-1">اسم قالب الآلة</label>
                  <input 
                    type="text" 
                    required
                    value={newTemplateName} 
                    onChange={e => setNewTemplateName(e.target.value)} 
                    placeholder="مثال: ضاغط هواء حلزوني" 
                    className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-white/30 text-start"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 px-1">كود SKU الأساسي (3 حروف)</label>
                    <input 
                      type="text" 
                      required
                      value={newTemplateSkuBase} 
                      onChange={e => setNewTemplateSkuBase(e.target.value)} 
                      placeholder="مثال: CMP" 
                      maxLength={3}
                      className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-white/30 uppercase text-center font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 px-1">نوع التشغيل الأساسي</label>
                    <select 
                      value={newTemplateType} 
                      onChange={e => setNewTemplateType(e.target.value as any)} 
                      className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-white/30 text-start"
                    >
                      <option value="A">Automatic (آلي)</option>
                      <option value="I">Electric (كهربائي)</option>
                      <option value="H">Hydraulic (هيدروليكي)</option>
                      <option value="P">Pneumatic (هوائي)</option>
                      <option value="M">Manual (يدوي)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-400 px-1">عائلة الآلات الهندسية</label>
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingFamily(!isCreatingFamily)}
                      className="text-xs text-emerald-400 hover:underline font-bold"
                    >
                      {isCreatingFamily ? '← اختر عائلة موجودة' : '+ عائلة جديدة على الطاير'}
                    </button>
                  </div>

                  {isCreatingFamily ? (
                    <div className="border border-white/10 bg-white/[0.02] p-4 rounded-xl space-y-3">
                      <input 
                        type="text" 
                        value={newFamilyName} 
                        onChange={e => setNewFamilyName(e.target.value)} 
                        placeholder="اسم العائلة (مثال: محركات وتوليد)" 
                        className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none text-start"
                      />
                      <input 
                        type="text" 
                        value={newFamilyCode} 
                        onChange={e => setNewFamilyCode(e.target.value)} 
                        placeholder="كود العائلة (حرفين، مثال: MC)" 
                        maxLength={2}
                        className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none uppercase font-mono text-center"
                      />
                    </div>
                  ) : (
                    <select 
                      value={selectedFamilyId} 
                      onChange={e => setSelectedFamilyId(e.target.value)} 
                      className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-white/30 text-start"
                    >
                      <option value="">اختر العائلة...</option>
                      {machineFamilies?.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5">إلغاء</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg">إنشاء القالب</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Modal 2: Create Commercial Blueprint */}
        {isBlueprintModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md"
            onClick={() => setIsBlueprintModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a]/95 border border-white/15 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-start"
            >
              <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">تسجيل طراز تجاري بالكتالوج (Blueprint)</h2>
              <form onSubmit={handleCreateBlueprint} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 px-1">القالب الهندسي الموجه</label>
                  <select 
                    required
                    value={bpTemplateId} 
                    onChange={e => setBpTemplateId(e.target.value)} 
                    className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-white/30 text-start"
                  >
                    <option value="">حدد قالب الآلة المتوافق...</option>
                    {templates?.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.skuBase})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 px-1">كود المرجع التجاري</label>
                    <input 
                      type="text" 
                      required
                      value={bpReference} 
                      onChange={e => setBpReference(e.target.value)} 
                      placeholder="مثال: GA-11V" 
                      className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-white/30 uppercase font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 px-1">الشركة المصنعة (Brand)</label>
                    <input 
                      type="text" 
                      required
                      value={bpBrand} 
                      onChange={e => setBpBrand(e.target.value)} 
                      placeholder="مثال: Atlas Copco" 
                      className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-white/30 text-start"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 px-1">رقم الموديل (Model)</label>
                    <input 
                      type="text" 
                      required
                      value={bpModel} 
                      onChange={e => setBpModel(e.target.value)} 
                      placeholder="رقم الموديل المصنعي..." 
                      className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-white/30 text-start"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 px-1">القدرة الكهربائية / القوة</label>
                    <input 
                      type="text" 
                      value={bpPower} 
                      onChange={e => setBpPower(e.target.value)} 
                      placeholder="مثال: 11 kW" 
                      className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-white/30 text-start"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 px-1">مصدر الطاقة الأساسي</label>
                  <select 
                    value={bpEnergy} 
                    onChange={e => setBpEnergy(e.target.value)} 
                    className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-white/30 text-start"
                  >
                    <option value="380v">380v AC ثلاثي الأطوار</option>
                    <option value="220v">220v AC أحادي الطور</option>
                    <option value="Pneumatic">هوائي مضغوط (Pneumatic)</option>
                    <option value="Hydraulic">زيت مضغوط (Hydraulic)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button type="button" onClick={() => setIsBlueprintModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5">إلغاء</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg transition-all">حفظ الطراز</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Modal 3: Create Preventive Card */}
        {isCardModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md"
            onClick={() => setIsCardModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a]/95 border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl text-start"
            >
              <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">تصميم بطاقة وقائية جديدة للآلات</h2>
              <form onSubmit={handleCreatePreventiveCard} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 px-1">اسم المجموعة (مثال: صيانة ميكانيكية أسبوعية)</label>
                  <input 
                    type="text" 
                    required
                    value={newCardName} 
                    onChange={e => setNewCardName(e.target.value)} 
                    placeholder="مثال: الصيانة الدورية فئة A" 
                    className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-white/30 text-start"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button type="button" onClick={() => setIsCardModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5">إلغاء</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg">إنشاء المجموعة</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Modal 4: Link Preventive Tasks to Card */}
        {isLinkTaskModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md"
            onClick={() => setIsLinkTaskModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a]/95 border border-white/15 rounded-3xl p-6 w-full max-w-2xl shadow-2xl text-start"
            >
              <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">ربط مهام صيانة وقائية من الكتالوج العام</h2>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar mb-6 pr-1 text-start">
                {tasks?.filter(t => !activeCardTaskIds.has(t.id)).map(task => {
                  const linkedFamily = machineFamilies?.find(f => f.id === task.pdrFamilyId);
                  return (
                    <label key={task.id} className="flex items-start gap-4 p-4 bg-[#0a0a0f]/80 border border-white/10 rounded-2xl cursor-pointer hover:border-white/20 transition-colors text-start">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-5 h-5 rounded border-white/20 bg-[#0a0a0f]/50 text-white focus:ring-white/50 cursor-pointer"
                        checked={selectedTasksForLink.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTasksForLink(prev => [...prev, task.id]);
                          else setSelectedTasksForLink(prev => prev.filter(id => id !== task.id));
                        }}
                      />
                      <div className="text-start">
                        <h4 className="font-bold text-white text-sm">{task.title}</h4>
                        <div className="flex gap-4 mt-1 text-xs text-slate-400">
                          <span>الوتيرة: {task.frequencyValue} يوم</span>
                          {linkedFamily && <span>العائلة المتوافقة: {linkedFamily.name}</span>}
                        </div>
                      </div>
                    </label>
                  );
                })}

                {tasks?.filter(t => !activeCardTaskIds.has(t.id)).length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    جميع المهام المتاحة مرتبطة بالفعل بهذه البطاقة.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsLinkTaskModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5">إلغاء</button>
                <button type="button" onClick={handleLinkTasksToCard} className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg">تأكيد ربط المهام المحددة</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal 5: Deploy & Schedule Preventive Plan */}
        {isDeployModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md"
            onClick={() => setIsDeployModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a]/95 border border-white/15 rounded-3xl shadow-2xl w-full max-w-4xl flex overflow-hidden text-start"
            >
              
              {/* Left Column: Physical Machines List */}
              <div className="w-1/2 p-8 border-l border-white/10 bg-[#0a0a0f]/40 text-start">
                <h3 className="text-lg font-bold text-white mb-2">تحديد الآلات المستهدفة</h3>
                <p className="text-slate-400 text-xs mb-6">اختر الآلات المادية التابعة التي سيتم تطبيق الصيانة عليها</p>
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  {templateMachines.map(m => {
                    const isChecked = deployMachineIds.includes(m.id);
                    return (
                      <label key={m.id} className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${isChecked ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-white/20 bg-[#0a0a0f]/50 text-white focus:ring-white/50 cursor-pointer"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDeployMachineIds(prev => [...prev, m.id]);
                            } else {
                              setDeployMachineIds(prev => prev.filter(id => id !== m.id));
                            }
                          }}
                        />
                        <div>
                          <h4 className="font-bold text-white text-sm font-mono tracking-wider uppercase">{m.referenceCode}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">SN: {m.serialNumber}</p>
                        </div>
                      </label>
                    );
                  })}

                  {templateMachines.length === 0 && (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      لا توجد آلات مادية تابعة لهذا القالب حالياً بالمصنع.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Parameters Assignment */}
              <div className="w-1/2 p-8 flex flex-col justify-between text-start">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">إطلاق وتوريث الخطة الوقائية</h3>
                    <p className="text-xs text-slate-400 mt-1">جدولة مجموعة: <strong>{selectedCard?.name}</strong></p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-2 justify-start">
                      <Users className="w-4 h-4 text-emerald-400" /> إسناد للتقني المسؤول عن التنفيذ
                    </label>
                    <select 
                      required
                      value={deployTechId}
                      onChange={e => setDeployTechId(e.target.value)}
                      className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-white/30 outline-none text-start"
                    >
                      <option value="">تحديد تقني صيانة...</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-2 justify-start">
                        <Calendar className="w-4 h-4 text-emerald-400" /> تاريخ إطلاق الصيانة
                      </label>
                      <input 
                        type="date"
                        required
                        value={deployDate}
                        onChange={e => setDeployDate(e.target.value)}
                        className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-white/30 outline-none text-start font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-2 justify-start">
                        <Clock className="w-4 h-4 text-emerald-400" /> ساعة بدء العمل
                      </label>
                      <input 
                        type="time"
                        required
                        value={deployTime}
                        onChange={e => setDeployTime(e.target.value)}
                        className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-white/30 outline-none text-start font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      💡 <strong>توضيح تشغيلي:</strong> يمكنك تكرار جدولة هذه البطاقة عدة مرات. تفعيلها لتقني آخر أو لآلات مختلفة لن يمنع الجدولة السابقة بل سيضيف صيانة متوازية بكل سلاسة.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-8">
                  <button type="button" onClick={() => setIsDeployModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-bold text-xs">إلغاء</button>
                  <button 
                    type="button" 
                    onClick={handleDeployPlan} 
                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4" /> تأكيد وجدولة خطة العمل
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
