import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Machine, MachineTemplate, MachineBlueprint, PreventiveTask, PreventiveCard, MachineFamily, Technician } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
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
  ClipboardList
} from 'lucide-react';

export function MachineRegistryView() {
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
    <div className="flex h-full bg-[#0a0a0f] text-slate-200 overflow-hidden">
      
      {/* LEFT SIDEBAR: Templates and Blueprints Catalogs */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-[#0f111a] shrink-0">
        
        {/* Navigation Tabs */}
        <div className="p-4 border-b border-white/10">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => {
                setActiveSidebarTab('templates');
                setSearchTerm('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSidebarTab === 'templates' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              قوالب الآلات (Templates)
            </button>
            <button
              onClick={() => {
                setActiveSidebarTab('blueprints');
                setSearchTerm('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSidebarTab === 'blueprints' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              طرازات الكتالوج (Blueprints)
            </button>
          </div>
        </div>

        {/* Dynamic creation button depending on active tab */}
        <div className="px-6 py-4 border-b border-white/10">
          {activeSidebarTab === 'templates' ? (
            <button 
              onClick={() => setIsTemplateModalOpen(true)}
              className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/20 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            >
              <Plus className="w-4 h-4" /> إضافة قالب آلة جديد
            </button>
          ) : (
            <button 
              onClick={() => setIsBlueprintModalOpen(true)}
              className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-indigo-500/20 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.1)]"
            >
              <Plus className="w-4 h-4" /> إضافة طراز تجاري جديد
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {/* Search box */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder={activeSidebarTab === 'templates' ? "البحث عن قالب آلة..." : "البحث عن طراز تجاري..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-emerald-500/50 outline-none transition-colors text-right"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            {activeSidebarTab === 'templates' ? (
              templates?.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.skuBase.toLowerCase().includes(searchTerm.toLowerCase())).map(t => {
                const isSelected = selectedTemplateId === t.id;
                const fam = machineFamilies?.find(f => f.id === t.familyId);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setSelectedBlueprintId(null);
                    }}
                    className={`w-full text-right p-3 rounded-xl border transition-all ${isSelected ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    dir="rtl"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold text-sm ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>{t.name}</h3>
                      <span className="text-[10px] bg-white/10 text-slate-400 font-mono px-1.5 py-0.5 rounded uppercase">{t.skuBase}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">العائلة: {fam ? fam.name : 'عام'}</p>
                  </button>
                );
              })
            ) : (
              blueprints?.filter(b => b.reference.toLowerCase().includes(searchTerm.toLowerCase()) || b.brand.toLowerCase().includes(searchTerm.toLowerCase())).map(bp => {
                const isSelected = selectedBlueprintId === bp.id;
                const tpl = templates?.find(t => t.id === bp.templateId);
                return (
                  <button
                    key={bp.id}
                    onClick={() => {
                      setSelectedBlueprintId(bp.id);
                      if (tpl) setSelectedTemplateId(tpl.id);
                    }}
                    className={`w-full text-right p-3 rounded-xl border transition-all ${isSelected ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    dir="rtl"
                  >
                    <h3 className={`font-bold text-sm ${isSelected ? 'text-indigo-400' : 'text-slate-200'}`}>{bp.reference}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{bp.brand} • {bp.model}</p>
                    {tpl && <p className="text-[9px] text-indigo-400/80 mt-1">القالب: {tpl.name}</p>}
                  </button>
                );
              })
            )}

            {activeSidebarTab === 'templates' && templates?.length === 0 && (
              <div className="text-center text-xs text-slate-500 py-12">لا توجد قوالب آلات مسجلة بعد.</div>
            )}
            {activeSidebarTab === 'blueprints' && blueprints?.length === 0 && (
              <div className="text-center text-xs text-slate-500 py-12">لا توجد طرازات مسجلة بعد.</div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        {selectedTemplate ? (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Template Header & Details */}
            <div className="p-6 bg-gradient-to-r from-emerald-950/20 to-black/40 border border-white/10 rounded-2xl relative overflow-hidden" dir="rtl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 tracking-wider">قالب الآلة المعتمد (Template Mode)</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">{selectedTemplate.name}</h1>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-4">
                    <span>الرمز المرجعي SKU Base: <strong className="font-mono text-white">{selectedTemplate.skuBase}</strong></span>
                    <span>نوع التشغيل: <strong className="text-white">
                      {selectedTemplate.type === 'A' ? 'آلي (Automatic)' : 
                       selectedTemplate.type === 'I' ? 'كهربائي (Electric)' :
                       selectedTemplate.type === 'H' ? 'هيدروليكي (Hydraulic)' :
                       selectedTemplate.type === 'P' ? 'هوائي (Pneumatic)' :
                       selectedTemplate.type === 'M' ? 'يدوي (Manual)' : 'مختلط'}
                    </strong></span>
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center shrink-0">
                  <span className="text-[10px] text-slate-500 block">الآلات المادية التابعة</span>
                  <strong className="text-xl text-emerald-400 font-mono">{templateMachines.length}</strong>
                </div>
              </div>

              {selectedBlueprint && (
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-6 text-xs text-slate-400">
                  <span>الطراز التجاري النشط: <strong className="text-indigo-400 font-mono">{selectedBlueprint.reference}</strong> ({selectedBlueprint.brand})</span>
                  <span>القوة: <strong className="text-white">{selectedBlueprint.powerOrForce}</strong></span>
                  <span>مصدر الطاقة: <strong className="text-white">{selectedBlueprint.energySource}</strong></span>
                </div>
              )}
            </div>

            {/* Architectural Explanation Alert */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-right" dir="rtl">
              <Sparkles className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">الفصل الجديد: استقلالية الكتالوج والخطط الوقائية</h4>
                <p className="text-xs leading-relaxed text-slate-400 mt-1">
                  لقد فصلنا تماماً المهام الوقائية عن الطراز التجاري (Blueprint). ترتبط المهام الآن بـ <strong>قالب الآلة (Template Machine)</strong>. 
                  يمكنك تصميم عدة <strong>مجموعات صيانة وقائية (Preventive Cards)</strong> لنفس القالب (مثل خطة أسبوعية، خطة ميكانيكية، صيانة كهربائية). 
                  عند التفعيل، يمكنك اختيار أي عدد من الآلات الفيزيائية وتعيين الخطة لتقني محدد، مع إمكانية تكرار تفعيل الخطة لتقني آخر في قطاع مختلف!
                </p>
              </div>
            </div>

            {/* Core Section: Preventive Cards Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" dir="rtl">
              
              {/* Cards List Panel */}
              <GlassCard className="md:col-span-1 p-5 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-400" />
                    المجموعات الوقائية ({cardsForSelectedTemplate.length})
                  </h3>
                  <button
                    onClick={() => setIsCardModalOpen(true)}
                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-colors border border-emerald-500/20"
                    title="إنشاء مجموعة وقائية جديدة"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {cardsForSelectedTemplate.map(card => {
                    const isSelected = selectedCardId === card.id;
                    return (
                      <div 
                        key={card.id}
                        onClick={() => setSelectedCardId(card.id)}
                        className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex justify-between items-center ${isSelected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>{card.name}</h4>
                          <span className="text-[10px] text-slate-500 block mt-1">{card.taskIds.length} مهمة وقائية</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card.id);
                          }}
                          className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {cardsForSelectedTemplate.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-xl p-6 text-center">
                      <FileText className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs">لا توجد مجموعات وقائية مصممة لهذا القالب بعد.</p>
                      <button 
                        onClick={() => setIsCardModalOpen(true)}
                        className="mt-3 text-[10px] px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all"
                      >
                        إنشاء أول بطاقة وقائية
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Tasks of Selected Card Details Panel */}
              <GlassCard className="md:col-span-2 p-6 flex flex-col">
                {selectedCard ? (
                  <div className="flex flex-col h-full">
                    {/* Selected Card Header */}
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/5">
                      <div>
                        <h3 className="text-lg font-extrabold text-white">{selectedCard.name}</h3>
                        <p className="text-[10px] text-slate-500 mt-1">تاريخ التصميم: {new Date(selectedCard.createdAt).toLocaleDateString('ar-EG')}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsLinkTaskModalOpen(true)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" /> ربط مهام وقائية
                        </button>
                        
                        <button
                          onClick={() => setIsDeployModalOpen(true)}
                          disabled={linkedTasksInCard.length === 0 || templateMachines.length === 0}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Play className="w-3.5 h-3.5" /> جدولة وتفعيل الخطة
                        </button>
                      </div>
                    </div>

                    {/* Linked Tasks List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                      {linkedTasksInCard.map(task => {
                        const taskFamily = machineFamilies?.find(f => f.id === task.pdrFamilyId);
                        return (
                          <div 
                            key={task.id} 
                            className="p-4 bg-black/40 border border-white/5 rounded-xl group hover:border-emerald-500/30 transition-all flex justify-between items-start"
                          >
                            <div>
                              <h4 className="font-bold text-slate-200 text-sm">{task.title}</h4>
                              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                <span>الوتيرة الزمنية: <strong className="text-slate-300 font-mono">{task.frequencyValue} يوم</strong></span>
                                {taskFamily && <span>عائلة المكون: <strong className="text-slate-300">{taskFamily.name}</strong></span>}
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnlinkTaskFromCard(task.id)}
                              className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="إزالة من المجموعة الوقائية"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}

                      {linkedTasksInCard.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                          <Link2 className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-xs">لا توجد مهام وقائية مضافة لهذه البطاقة بعد.</p>
                          <button
                            onClick={() => setIsLinkTaskModalOpen(true)}
                            className="mt-3 text-xs text-emerald-400 hover:underline font-bold"
                          >
                            + ربط مهام وقائية من الكتالوج العام
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                    <Activity className="w-12 h-12 mb-3 opacity-20 text-emerald-400" />
                    <h4 className="font-bold text-slate-400">حدد مجموعة صيانة وقائية</h4>
                    <p className="text-xs text-slate-600 mt-1">اختر بطاقة وقائية من اللوحة الجانبية لعرض مهامها أو تفعيلها.</p>
                  </div>
                )}
              </GlassCard>

            </div>

            {/* Sub-Section: Physical Machines Overview */}
            <GlassCard className="p-6 text-right" dir="rtl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Factory className="w-4 h-4 text-indigo-400" />
                  الآلات المسجلة التابعة لهذا النوع في المعمل ({templateMachines.length})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {templateMachines.map(m => (
                  <div key={m.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-center">
                      <strong className="text-xs text-indigo-400 font-mono tracking-wider">{m.referenceCode}</strong>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {m.status === 'Active' ? 'نشطة' : 'صيانة'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">رقم تسلسلي SN: {m.serialNumber}</p>
                  </div>
                ))}

                {templateMachines.length === 0 && (
                  <div className="col-span-full py-8 text-center text-xs text-slate-500">
                    لا توجد آلات مادية من هذا الطراز مسجلة بالمصنع حالياً.
                  </div>
                )}
              </div>
            </GlassCard>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <FileStack className="w-16 h-16 mb-4 opacity-10 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-400">اختر قالب آلة للبدء</h2>
            <p className="mt-2 text-xs">حدد قالب آلة من القائمة الجانبية لعرض خطط الصيانة أو تصميم بطاقات وقائية جديدة.</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        
        {/* Modal 1: Create Machine Template */}
        {isTemplateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsTemplateModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a] border border-emerald-500/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl"
              dir="rtl"
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
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500"
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
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500 uppercase text-center font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 px-1">نوع التشغيل الأساسي</label>
                    <select 
                      value={newTemplateType} 
                      onChange={e => setNewTemplateType(e.target.value as any)} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="A">Automatic (آلي)</option>
                      <option value="I">Electric (كهربائي)</option>
                      <option value="H">Hydraulic (هيدروليكي)</option>
                      <option value="P">Pneumatic (هوائي)</option>
                      <option value="M">Manual (يدوي)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-4">
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
                    <div className="border border-emerald-500/10 bg-emerald-500/[0.02] p-4 rounded-xl space-y-3">
                      <input 
                        type="text" 
                        value={newFamilyName} 
                        onChange={e => setNewFamilyName(e.target.value)} 
                        placeholder="اسم العائلة (مثال: محركات وتوليد)" 
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none"
                      />
                      <input 
                        type="text" 
                        value={newFamilyCode} 
                        onChange={e => setNewFamilyCode(e.target.value)} 
                        placeholder="كود العائلة (حرفين، مثال: MC)" 
                        maxLength={2}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none uppercase font-mono text-center"
                      />
                    </div>
                  ) : (
                    <select 
                      value={selectedFamilyId} 
                      onChange={e => setSelectedFamilyId(e.target.value)} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="">اختر العائلة...</option>
                      {machineFamilies?.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6" dir="ltr">
                  <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-5 py-2 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5">إلغاء</button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs">إنشاء القالب</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Modal 2: Create Commercial Blueprint */}
        {isBlueprintModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsBlueprintModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a] border border-indigo-500/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl"
              dir="rtl"
            >
              <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">تسجيل طراز تجاري بالكتالوج (Blueprint)</h2>
              <form onSubmit={handleCreateBlueprint} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 px-1">القالب الهندسي الموجه</label>
                  <select 
                    required
                    value={bpTemplateId} 
                    onChange={e => setBpTemplateId(e.target.value)} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-indigo-500"
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
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 uppercase font-mono"
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
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500"
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
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 px-1">القدرة الكهربائية / القوة</label>
                    <input 
                      type="text" 
                      value={bpPower} 
                      onChange={e => setBpPower(e.target.value)} 
                      placeholder="مثال: 11 kW" 
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 px-1">مصدر الطاقة الأساسي</label>
                  <select 
                    value={bpEnergy} 
                    onChange={e => setBpEnergy(e.target.value)} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    <option value="380v">380v AC ثلاثي الأطوار</option>
                    <option value="220v">220v AC أحادي الطور</option>
                    <option value="Pneumatic">هوائي مضغوط (Pneumatic)</option>
                    <option value="Hydraulic">زيت مضغوط (Hydraulic)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-6" dir="ltr">
                  <button type="button" onClick={() => setIsBlueprintModalOpen(false)} className="px-5 py-2 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5">إلغاء</button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">حفظ الطراز</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Modal 3: Create Preventive Card */}
        {isCardModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsCardModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a] border border-emerald-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl"
              dir="rtl"
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
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6" dir="ltr">
                  <button type="button" onClick={() => setIsCardModalOpen(false)} className="px-5 py-2 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5">إلغاء</button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs">إنشاء المجموعة</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Modal 4: Link Preventive Tasks to Card */}
        {isLinkTaskModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsLinkTaskModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a] border border-emerald-500/30 rounded-3xl p-6 w-full max-w-2xl shadow-2xl"
              dir="rtl"
            >
              <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">ربط مهام صيانة وقائية من الكتالوج العام</h2>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar mb-6 pr-1 text-right">
                {tasks?.filter(t => !activeCardTaskIds.has(t.id)).map(task => {
                  const linkedFamily = machineFamilies?.find(f => f.id === task.pdrFamilyId);
                  return (
                    <label key={task.id} className="flex items-start gap-4 p-4 bg-black/40 border border-white/10 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                        checked={selectedTasksForLink.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTasksForLink(prev => [...prev, task.id]);
                          else setSelectedTasksForLink(prev => prev.filter(id => id !== task.id));
                        }}
                      />
                      <div className="text-right">
                        <h4 className="font-bold text-slate-200 text-sm">{task.title}</h4>
                        <div className="flex gap-4 mt-1 text-xs text-slate-500">
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

              <div className="flex justify-end gap-3" dir="ltr">
                <button type="button" onClick={() => setIsLinkTaskModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5">إلغاء</button>
                <button type="button" onClick={handleLinkTasksToCard} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs">تأكيد ربط المهام المحددة</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal 5: Deploy & Schedule Preventive Plan */}
        {isDeployModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsDeployModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f111a] border border-indigo-500/30 rounded-3xl shadow-2xl w-full max-w-4xl flex overflow-hidden"
              dir="rtl"
            >
              
              {/* Left Column: Physical Machines List */}
              <div className="w-1/2 p-8 border-l border-white/10 bg-black/20 text-right">
                <h3 className="text-lg font-bold text-white mb-2">تحديد الآلات المستهدفة</h3>
                <p className="text-slate-400 text-xs mb-6">اختر الآلات المادية التابعة التي سيتم تطبيق الصيانة عليها</p>
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  {templateMachines.map(m => {
                    const isChecked = deployMachineIds.includes(m.id);
                    return (
                      <label key={m.id} className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-white/20 bg-black/50 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer"
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
                          <p className="text-[10px] text-slate-500 font-mono mt-1">SN: {m.serialNumber}</p>
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
              <div className="w-1/2 p-8 flex flex-col justify-between text-right">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">إطلاق وتوريث الخطة الوقائية</h3>
                    <p className="text-xs text-slate-400 mt-1">جدولة مجموعة: <strong>{selectedCard?.name}</strong></p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-2 justify-start">
                      <Users className="w-4 h-4 text-indigo-400" /> إسناد للتقني المسؤول عن التنفيذ
                    </label>
                    <select 
                      required
                      value={deployTechId}
                      onChange={e => setDeployTechId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none text-right appearance-none"
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
                        <Calendar className="w-4 h-4 text-indigo-400" /> تاريخ إطلاق الصيانة
                      </label>
                      <input 
                        type="date"
                        required
                        value={deployDate}
                        onChange={e => setDeployDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none text-right font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-2 justify-start">
                        <Clock className="w-4 h-4 text-indigo-400" /> ساعة بدء العمل
                      </label>
                      <input 
                        type="time"
                        required
                        value={deployTime}
                        onChange={e => setDeployTime(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none text-right font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      💡 <strong>توضيح تشغيلي:</strong> يمكنك تكرار جدولة هذه البطاقة عدة مرات. تفعيلها لتقني آخر أو لآلات مختلفة لن يمنع الجدولة السابقة بل سيضيف صيانة متوازية بكل سلاسة.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-8" dir="ltr">
                  <button type="button" onClick={() => setIsDeployModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-bold text-xs">إلغاء</button>
                  <button 
                    type="button" 
                    onClick={handleDeployPlan} 
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2"
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
