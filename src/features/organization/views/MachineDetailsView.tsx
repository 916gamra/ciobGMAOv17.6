import React, { useState, useMemo } from 'react';
import { motion, Variants } from 'motion/react';
import { 
  Factory, 
  Cpu, 
  Hash, 
  X, 
  Wrench, 
  Layers, 
  Settings, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  Link as LinkIcon, 
  AlertTriangle,
  RefreshCw,
  GitFork,
  Package,
  Check,
  CheckCircle
} from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { useOrganizationEngine } from '../hooks/useOrganizationEngine';
import { usePdrLibrary } from '@/features/pdr-engine/hooks/usePdrLibrary';
import { useTabStore } from '@/app/store';
import { PdrCard } from '@/features/pdr-engine/components/PdrCard';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { toast } from 'sonner';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function MachineDetailsView({ tabId }: { tabId: string }) {
  const machineId = tabId.replace('machine-detail:', '');
  const { machines } = useOrganizationEngine();
  const { blueprints, getMachineBOM, templates: pdrBlueprints } = usePdrLibrary();
  const { openTab } = useTabStore();
  
  const [activeTab, setActiveTab] = useState<'stock' | 'spec' | 'blueprint'>('stock');

  const machine = machines.find(m => m.id === machineId);
  const machineParts = getMachineBOM(machineId) || [];

  // Query Machine Blueprint & PDR templates to show direct model-composing spec BOM
  const blueprint = useLiveQuery(() => 
    machine?.blueprintId ? db.machineBlueprints.get(machine.blueprintId) : null
  , [machine?.blueprintId]);

  const pdrTemplates = useLiveQuery(() => db.pdrTemplates.toArray(), []) || [];
  const pdrFamilies = useLiveQuery(() => db.pdrFamilies.toArray(), []) || [];
  const allPdrBlueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []) || [];
  const standardComponents = useLiveQuery(() => db.standardComponents.toArray(), []) || [];
  const allMachines = useLiveQuery(() => db.machines.toArray(), []) || [];

  const directMappings = useLiveQuery(() => 
    db.machinePartMappings.where('machineId').equals(machineId).toArray()
  , [machineId]) || [];

  const linkedPartTemplates = useMemo(() => {
    if (!blueprint?.partTemplateIds) return [];
    return pdrTemplates.filter(t => blueprint.partTemplateIds?.includes(t.id));
  }, [blueprint, pdrTemplates]);

  const linkedPartBlueprints = useMemo(() => {
    if (!blueprint?.pdrBlueprintIds) return [];
    return allPdrBlueprints.filter(bp => blueprint.pdrBlueprintIds?.includes(bp.id));
  }, [blueprint, allPdrBlueprints]);

  const linkedComponents = useMemo(() => {
    const ids = blueprint?.componentIds || blueprint?.componentBlueprintIds || [];
    if (!ids.length) return [];
    return standardComponents.filter(sc => ids.includes(sc.id));
  }, [blueprint, standardComponents]);

  const missingPdrSelections = useMemo(() => {
    if (!linkedPartTemplates || !machineParts) return [];
    return linkedPartTemplates.filter(pt => {
      return !machineParts.some(part => part.templateId === pt.id);
    });
  }, [linkedPartTemplates, machineParts]);

  // Form states for resolving missing specifications
  const [selectedBlueprintForTemplate, setSelectedBlueprintForTemplate] = useState<Record<string, string>>({});
  const [newBlueprintModel, setNewBlueprintModel] = useState<Record<string, string>>({});
  const [newBlueprintPower, setNewBlueprintPower] = useState<Record<string, string>>({});
  const [newBlueprintSpecs, setNewBlueprintSpecs] = useState<Record<string, string>>({});
  const [activeFormMode, setActiveFormMode] = useState<Record<string, 'link' | 'create'>>({});

  // States for custom/additional part linkage
  const [selectedFamilyForCustomLink, setSelectedFamilyForCustomLink] = useState('');
  const [selectedTemplateForCustomLink, setSelectedTemplateForCustomLink] = useState('');
  const [selectedBlueprintForCustomLink, setSelectedBlueprintForCustomLink] = useState('');

  // States for spawning brand new blueprint configurations
  const [newBpReference, setNewBpReference] = useState('');
  const [newBpBrand, setNewBpBrand] = useState('');
  const [newBpModelField, setNewBpModelField] = useState('');
  const [newBpPowerField, setNewBpPowerField] = useState('');
  const [newBpEnergy, setNewBpEnergy] = useState('380v');
  const [migratedMachineIds, setMigratedMachineIds] = useState<string[]>([]);

  // Initialize spawn inputs when machine model loads
  React.useEffect(() => {
    if (blueprint) {
      setNewBpReference(`${blueprint.reference}-REV1`);
      setNewBpBrand(blueprint.brand);
      setNewBpModelField(blueprint.model);
      setNewBpPowerField(blueprint.powerOrForce);
    }
  }, [blueprint]);

  const handleLinkExistingBlueprint = async (templateId: string) => {
    const bpId = selectedBlueprintForTemplate[templateId];
    if (!bpId) {
      toast.error('الرجاء اختيار قطعة غيار تجارية أولاً');
      return;
    }
    try {
      const alreadyLinked = await db.machinePartMappings.where({ machineId, blueprintId: bpId }).first();
      if (alreadyLinked) {
        toast.warning('هذه القطعة مربوطة بالفعل بهذه الآلة');
        return;
      }
      await db.machinePartMappings.add({
        id: crypto.randomUUID(),
        machineId,
        blueprintId: bpId,
        addedAt: new Date().toISOString()
      });
      toast.success('تم ربط قطعة الغيار التجارية بالآلة بنجاح!');
      setSelectedBlueprintForTemplate(prev => ({ ...prev, [templateId]: '' }));
    } catch (err: any) {
      toast.error(`فشل الربط: ${err.message}`);
    }
  };

  const handleLinkCustomBlueprint = async () => {
    if (!selectedBlueprintForCustomLink) {
      toast.error('الرجاء تحديد قطعة غيار أولاً');
      return;
    }
    try {
      const alreadyLinked = await db.machinePartMappings.where({ 
        machineId, 
        blueprintId: selectedBlueprintForCustomLink 
      }).first();
      
      if (alreadyLinked) {
        toast.warning('هذه القطعة مربوطة بالفعل بهذه الآلة المادية');
        return;
      }
      
      await db.machinePartMappings.add({
        id: crypto.randomUUID(),
        machineId,
        blueprintId: selectedBlueprintForCustomLink,
        addedAt: new Date().toISOString()
      });
      
      toast.success('تم ربط قطعة الغيار الإضافية بالآلة بنجاح!');
      setSelectedBlueprintForCustomLink('');
    } catch (err: any) {
      toast.error(`فشل ربط القطعة المخصصة: ${err.message}`);
    }
  };

  const handlePromoteToSharedBlueprint = async () => {
    if (!blueprint) {
      toast.error('هذه الآلة ليست مرتبطة بطراز تجاري بعد (Blueprint)');
      return;
    }
    if (directMappings.length === 0) {
      toast.error('لا توجد قطع غيار مباشرة لدمجها.');
      return;
    }

    try {
      const directPartIds = directMappings.map(m => m.blueprintId);
      const existingPartIds = blueprint.pdrBlueprintIds || [];
      const mergedPartIds = Array.from(new Set([...existingPartIds, ...directPartIds]));

      await db.transaction('rw', db.machineBlueprints, db.machinePartMappings, async () => {
        await db.machineBlueprints.update(blueprint.id, {
          pdrBlueprintIds: mergedPartIds
        });

        await db.machinePartMappings
          .where('machineId')
          .equals(machineId)
          .delete();
      });

      toast.success(`تم دمج وضم قطع الغيار (${directPartIds.length} قطع) بنجاح إلى طراز النموذج المشترك [${blueprint.reference}]! الآن سترث جميع الآلات التابعة هذه القطع تلقائياً.`);
    } catch (err: any) {
      toast.error(`فشل عملية الدمج: ${err.message}`);
    }
  };

  const handleSpawnNewBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBpReference.trim() || !newBpBrand.trim() || !newBpModelField.trim()) {
      toast.error('الرجاء تعبئة الحقول الأساسية: كود المرجع، الماركة، والموديل');
      return;
    }

    try {
      const templateId = machine?.templateId || blueprint?.templateId;
      if (!templateId) {
        toast.error('تعذر تحديد قالب الآلة الأساسي لتوريث الهوية');
        return;
      }

      const existingBp = await db.machineBlueprints.where('reference').equals(newBpReference.trim().toUpperCase()).first();
      if (existingBp) {
        toast.error(`كود المرجع [${newBpReference}] مستخدم بالفعل لطراز آخر! الرجاء اختيار كود فريد.`);
        return;
      }

      const previouslyInheritedPartIds = blueprint?.pdrBlueprintIds || [];
      const currentDirectPartIds = directMappings.map(m => m.blueprintId);
      const combinedPartIds = Array.from(new Set([...previouslyInheritedPartIds, ...currentDirectPartIds]));

      const newBlueprintId = crypto.randomUUID();

      await db.transaction('rw', db.machineBlueprints, db.machines, db.machinePartMappings, async () => {
        await db.machineBlueprints.add({
          id: newBlueprintId,
          templateId,
          reference: newBpReference.trim().toUpperCase(),
          brand: newBpBrand.trim(),
          model: newBpModelField.trim(),
          powerOrForce: newBpPowerField.trim(),
          energySource: newBpEnergy,
          pdrBlueprintIds: combinedPartIds,
          createdAt: new Date().toISOString()
        });

        await db.machines.update(machineId, {
          blueprintId: newBlueprintId
        });
        await db.machinePartMappings.where('machineId').equals(machineId).delete();

        if (migratedMachineIds.length > 0) {
          for (const extraId of migratedMachineIds) {
            await db.machines.update(extraId, {
              blueprintId: newBlueprintId
            });
            await db.machinePartMappings.where('machineId').equals(extraId).delete();
          }
        }
      });

      toast.success(`🎉 تم إنشاء طراز مخصص جديد بنجاح: [${newBpReference.toUpperCase()}]! وتم ترحيل الآلات المحددة وتصفية الروابط المكررة.`);
      setNewBpReference('');
      setMigratedMachineIds([]);
      setActiveTab('stock');
    } catch (err: any) {
      toast.error(`فشل إنشاء الطراز المخصص: ${err.message}`);
    }
  };

  const handleCreateAndLinkBlueprint = async (templateId: string, skuBase: string) => {
    const modelName = newBlueprintModel[templateId]?.trim();
    const power = newBlueprintPower[templateId]?.trim() || '';
    const specs = newBlueprintSpecs[templateId]?.trim() || '';

    if (!modelName) {
      toast.error('الرجاء إدخال اسم الموديل / الماركة التجاري (الموديل مطلوب)');
      return;
    }

    try {
      const templateBlueprints = allPdrBlueprints.filter(b => b.templateId === templateId);
      const existingIds = new Set(templateBlueprints.map(b => b.id));

      let slotNum = 1;
      let activeSlotId = '';
      let found = false;

      for (let i = 1; i <= 999; i++) {
        const tCode = skuBase.replace(/-/g, '');
        const indexStr = i.toString().padStart(3, '0');
        const candidateId = `PDR-${tCode}-${indexStr}`.toUpperCase();

        if (!existingIds.has(candidateId)) {
          slotNum = i;
          activeSlotId = candidateId;
          found = true;
          break;
        }
      }

      if (!found) {
        toast.error('عذراً، تم الوصول للحد الأقصى لعدد المقاعد المتاحة (999)');
        return;
      }

      const createdAt = new Date().toISOString();

      await db.pdrBlueprints.add({
        id: activeSlotId,
        templateId,
        reference: activeSlotId,
        unit: 'Pcs',
        minThreshold: 2,
        model: modelName,
        powerOrForce: power,
        technicalSpecs: specs,
        createdAt
      });

      await db.machinePartMappings.add({
        id: crypto.randomUUID(),
        machineId,
        blueprintId: activeSlotId,
        addedAt: createdAt
      });

      toast.success(`تم إنشاء قطعة غيار جديدة كود: ${activeSlotId} وربطها بالآلة بنجاح!`);

      setNewBlueprintModel(prev => ({ ...prev, [templateId]: '' }));
      setNewBlueprintPower(prev => ({ ...prev, [templateId]: '' }));
      setNewBlueprintSpecs(prev => ({ ...prev, [templateId]: '' }));
    } catch (err: any) {
      toast.error(`فشل إنشاء وربط القطعة: ${err.message}`);
    }
  };

  if (!machine) {
    return <div className="p-8 text-slate-400">Loading Digital Twin...</div>;
  }

  const openPartDetail = (blueprintId: string, reference: string) => {
    openTab({
      id: `part-detail:${blueprintId}`,
      portalId: 'PDR',
      title: `Part: ${reference}`,
      component: 'part-detail'
    });
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col gap-6 relative z-10 lg:px-8 pt-4"
    >
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-start justify-between gap-6 shrink-0 relative">
        <div className="absolute -top-20 -left-10 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex gap-6 items-start relative z-10">
           <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
             <Cpu className="w-10 h-10 text-indigo-400" />
           </div>
           <div>
             <div className="flex items-center gap-3 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Digital Twin</span>
             </div>
             <h1 className="text-4xl font-bold text-slate-100 tracking-tight uppercase truncate max-w-2xl">{machine.name}</h1>
             <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 font-mono text-indigo-400/80">Ref: {machine.referenceCode}</p>
           </div>
        </div>

        <button 
           onClick={() => openTab({ id: 'machine-registry', portalId: 'FACTORY', title: 'Machine Registry', component: 'machine-registry' })}
           className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all absolute top-0 right-0 sm:relative z-10"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.header>

      {/* Machine Tech Specs / Metadata Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <GlassCard className="p-4 border-l-2 border-l-indigo-500 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Factory className="w-5 h-5 text-indigo-400" />
              <div>
                 <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Sector</span>
                 <span className="text-sm font-bold text-white uppercase">{machine.sectorName}</span>
                 {machine.managerName && (
                   <span className="block text-[9px] uppercase tracking-widest text-indigo-400 font-bold mt-1.5 flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                     {machine.managerName}
                   </span>
                 )}
              </div>
            </div>
         </GlassCard>
         <GlassCard className="p-4 border-l-2 border-l-indigo-500 flex items-center gap-4">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
               <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Family</span>
               <span className="text-sm font-bold text-white uppercase">{machine.familyName}</span>
            </div>
         </GlassCard>
         <GlassCard className="p-4 border-l-2 border-l-indigo-500 flex items-center gap-4">
            <Wrench className="w-5 h-5 text-indigo-400" />
            <div>
               <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Template</span>
               <span className="text-sm font-bold text-white uppercase">{machine.templateName}</span>
            </div>
         </GlassCard>
         <GlassCard className="p-4 border-l-2 border-l-emerald-500 flex items-center gap-4">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
               <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">BOM Count</span>
               <span className="text-sm font-bold text-emerald-400 uppercase">{machineParts.length} Parts</span>
            </div>
         </GlassCard>
      </motion.div>

      {/* Specification Gap Warning Banner */}
      {missingPdrSelections.length > 0 && (
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5 border-l-4 border-l-amber-500 bg-amber-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  ⚠️ Specification Gaps Detected (فجوات في مواصفات الآلة المسجلة)
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                  هذه الآلة مسجلة وتتبع نموذج (Machine Blueprint) يحتوي على {linkedPartTemplates.length} قوالب مواصفات (Part Templates)، ولكن يوجد {missingPdrSelections.length} منها بدون تعيين جزء تجاري مادي (Commercial Parts/Blueprints). يرجى إكمال الاختيارات أدناه لتفعيلها في المخزن.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 uppercase tracking-widest shrink-0 animate-pulse font-mono">
              {missingPdrSelections.length} missing parts
            </span>
          </GlassCard>
        </motion.div>
      )}

      {/* Assembly Details Split Navigation */}
      <motion.div variants={itemVariants} className="flex-1 min-h-0 flex flex-col mt-4 pb-6">
         
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
           <div className="flex items-center gap-3">
              <Hash className="w-6 h-6 text-cyan-500" />
              <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-tight">Machine Composition & BOM</h2>
           </div>

           {/* Tabs */}
           <div className="flex gap-2 p-1 bg-[#0a0a0f]/40 border border-white/5 rounded-xl self-start">
             <button 
               onClick={() => setActiveTab('stock')}
               className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                 activeTab === 'stock' 
                   ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/10' 
                   : 'text-slate-400 hover:text-white'
               }`}
             >
               <Hash className="w-4 h-4" /> Physical Stocks Radar ({machineParts.length})
             </button>
             <button 
               onClick={() => setActiveTab('spec')}
               className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                 activeTab === 'spec' 
                   ? 'bg-indigo-500 text-black shadow-lg shadow-indigo-500/10' 
                   : 'text-slate-400 hover:text-white'
               }`}
             >
               <Settings className="w-4 h-4" /> Design-time Specs ({linkedComponents.length + linkedPartTemplates.length + linkedPartBlueprints.length})
             </button>
             <button 
               onClick={() => setActiveTab('blueprint')}
               className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                 activeTab === 'blueprint' 
                   ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/10' 
                   : 'text-slate-400 hover:text-white'
               }`}
             >
               <GitFork className="w-4 h-4" /> ترقية وتطوير السلالة ({directMappings.length} قطع مباشرة)
             </button>
           </div>
         </div>

         {activeTab === 'stock' ? (
           (machineParts.length === 0 && missingPdrSelections.length === 0) ? (
              <GlassCard className="p-12 flex flex-col items-center justify-center text-center border-dashed border-white/10 shrink-0">
                 <Wrench className="w-12 h-12 text-slate-600 mb-4" />
                 <p className="text-slate-400 font-bold uppercase tracking-widest">No physical parts linked to stock</p>
                 <p className="text-slate-500 text-sm mt-2">Activate this machine's parts inside the warehouse to begin tracking active spare parts.</p>
              </GlassCard>
           ) : (
                             <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-3 space-y-8">
                 
                 {/* Missing Selections Resolver Panel */}
                 {missingPdrSelections.length > 0 && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                       <h3 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-widest flex items-center gap-2">
                         ⚠️ Pending Commercial Part Actions ({missingPdrSelections.length})
                       </h3>
                       <span className="text-[10px] text-slate-400 font-mono">Select or Create Commercial PDR for these slots</span>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {missingPdrSelections.map(pt => {
                         const fam = pdrFamilies.find(f => f.id === pt.familyId);
                         const compatibleBlueprints = allPdrBlueprints.filter(bp => bp.templateId === pt.id);
                         const mode = activeFormMode[pt.id] || 'link';

                         return (
                           <GlassCard key={pt.id} className="p-5 border-amber-500/20 bg-amber-950/5 flex flex-col justify-between">
                             <div>
                               <div className="flex items-center justify-between mb-3">
                                 <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider font-mono">
                                   {fam?.name || 'FAMILY'}
                                 </span>
                                 <span className="text-[8px] text-slate-500 font-mono">SKU Prefix: {pt.skuBase}</span>
                               </div>
                               <h4 className="text-sm font-bold text-white uppercase">{pt.name}</h4>
                               <p className="text-[11px] text-slate-400 mt-1 mb-4">{pt.description || 'No technical notes recorded for this slot.'}</p>
                               
                               {/* Selector mode toggles */}
                               <div className="flex gap-2 mb-4 bg-[#0a0a0f]/40 border border-white/5 p-1 rounded-lg">
                                 <button
                                   type="button"
                                   onClick={() => setActiveFormMode(prev => ({ ...prev, [pt.id]: 'link' }))}
                                   className={`flex-1 py-1 px-3 text-[10px] font-bold rounded uppercase tracking-wider transition-all ${
                                     mode === 'link' 
                                       ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                       : 'text-slate-400 hover:text-slate-200'
                                   }`}
                                 >
                                   Link Existing Part
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => setActiveFormMode(prev => ({ ...prev, [pt.id]: 'create' }))}
                                   className={`flex-1 py-1 px-3 text-[10px] font-bold rounded uppercase tracking-wider transition-all ${
                                     mode === 'create' 
                                       ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                                       : 'text-slate-400 hover:text-slate-200'
                                   }`}
                                 >
                                   Create New Part
                                 </button>
                               </div>

                               {mode === 'link' ? (
                                 <div className="space-y-3">
                                   <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                                     Select Commercial Part
                                   </label>
                                   <div className="flex gap-2">
                                     <select
                                       value={selectedBlueprintForTemplate[pt.id] || ''}
                                       onChange={e => setSelectedBlueprintForTemplate(prev => ({ ...prev, [pt.id]: e.target.value }))}
                                       className="flex-1 bg-[#0a0a0f]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                                     >
                                       <option value="">-- Select from designed parts --</option>
                                       {compatibleBlueprints.map(cb => (
                                         <option key={cb.id} value={cb.id}>
                                           {cb.id} ({cb.model || cb.reference})
                                         </option>
                                       ))}
                                     </select>
                                     <button
                                       type="button"
                                       onClick={() => handleLinkExistingBlueprint(pt.id)}
                                       className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] rounded-xl uppercase tracking-wider flex items-center gap-1 transition-all"
                                     >
                                       <LinkIcon className="w-3.5 h-3.5" /> Link
                                     </button>
                                   </div>
                                   {compatibleBlueprints.length === 0 && (
                                     <p className="text-[10px] text-amber-500/80 font-mono mt-1">
                                       No existing commercial parts found for this template in the catalog.
                                     </p>
                                   )}
                                 </div>
                               ) : (
                                 <div className="space-y-3">
                                   <div>
                                     <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                                       Commercial Model Name (MANDATORY)
                                     </label>
                                     <input
                                       type="text"
                                       placeholder="e.g. 6205-2RS, SKF, 5.5kW"
                                       value={newBlueprintModel[pt.id] || ''}
                                       onChange={e => setNewBlueprintModel(prev => ({ ...prev, [pt.id]: e.target.value }))}
                                       className="w-full bg-[#0a0a0f]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                                     />
                                   </div>
                                   <div className="grid grid-cols-2 gap-2">
                                     <div>
                                       <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                                         Power / Force
                                       </label>
                                       <input
                                         type="text"
                                         placeholder="e.g. 24VDC, 5kW"
                                         value={newBlueprintPower[pt.id] || ''}
                                         onChange={e => setNewBlueprintPower(prev => ({ ...prev, [pt.id]: e.target.value }))}
                                         className="w-full bg-[#0a0a0f]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                                       />
                                     </div>
                                     <div>
                                       <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                                         Technical Specs
                                       </label>
                                       <input
                                         type="text"
                                         placeholder="e.g. Size, Type"
                                         value={newBlueprintSpecs[pt.id] || ''}
                                         onChange={e => setNewBlueprintSpecs(prev => ({ ...prev, [pt.id]: e.target.value }))}
                                         className="w-full bg-[#0a0a0f]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                                       />
                                     </div>
                                   </div>
                                   <button
                                     type="button"
                                     onClick={() => handleCreateAndLinkBlueprint(pt.id, pt.skuBase)}
                                     className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                                   >
                                     <Plus className="w-3.5 h-3.5" /> Register & Link Commercial Part
                                   </button>
                                 </div>
                               )}
                             </div>
                           </GlassCard>
                         );
                       })}
                     </div>
                   </div>
                 )}

                 {/* Active Stocks Radar Grid Wrapper */}
                 <div className="space-y-4">
                   <div className="border-b border-white/5 pb-2">
                     <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest">
                       Active Physical Parts & Stocks ({machineParts.length})
                     </h3>
                   </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                 {machineParts.map(part => {
                   const partTemplate = pdrTemplates.find(t => t.id === part.templateId);
                   return (
                    <PdrCard 
                      key={part.id} 
                      onClick={() => openPartDetail(part.id, part.reference)} 
                      className="flex flex-row items-center justify-between group overflow-hidden relative border border-white/5 transition-all duration-500 hover:border-y-cyan-500/30 hover:border-r-cyan-500/30 hover:shadow-[0_15px_40px_-10px_rgba(6,182,212,0.2)] hover:bg-cyan-500/[0.03] border-l-4 border-l-cyan-500 p-4 shrink-0"
                    >
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform border border-cyan-500/20">
                            <Hash className="w-4 h-4 text-cyan-400" />
                         </div>
                         <div>
                            <h3 className="text-sm font-mono font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors uppercase">{part.reference}</h3>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-0.5 block truncate max-w-[120px]">{partTemplate?.name || 'Component'}</span>
                         </div>
                       </div>
                    </PdrCard>
                   );
                 })}
                 </div>
                 </div>
              </div>
           )
         ) : activeTab === 'spec' ? (
           linkedComponents.length === 0 && linkedPartTemplates.length === 0 && linkedPartBlueprints.length === 0 ? (
             <GlassCard className="p-12 flex flex-col items-center justify-center text-center border-dashed border-white/10 shrink-0">
                <ShieldAlert className="w-12 h-12 text-slate-600 mb-4 animate-pulse" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">Model BOM is Empty</p>
                <p className="text-slate-500 text-sm mt-2">Open this machine's Blueprint in the Engineering Lab and add the component parts composing its standard skeleton.</p>
             </GlassCard>
           ) : (
             <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-3 space-y-8 pb-12">
               {/* 1. Sub-Systems & Machine Assemblies */}
               {linkedComponents.length > 0 && (
                 <GlassCard className="p-5 border-purple-500/20 flex flex-col bg-purple-950/10">
                   <h3 className="text-sm font-bold text-purple-400 font-mono mb-4 pb-2 border-b border-purple-500/10 uppercase flex items-center gap-2">
                     🧩 Machine Sub-Systems & Components Assemblies ({linkedComponents.length})
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {linkedComponents.map(sc => (
                       <div key={sc.id} className="p-3 rounded-xl bg-[#0a0a0f]/40 border border-purple-500/20 flex items-center justify-between text-xs">
                         <div>
                           <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 uppercase font-mono border border-purple-500/20">
                             {sc.id}
                           </span>
                           <p className="font-bold text-white mt-1">{sc.name}</p>
                           <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sc.family}</p>
                         </div>
                         <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-300 uppercase tracking-wider">
                           ASSEMBLY
                         </span>
                       </div>
                     ))}
                   </div>
                 </GlassCard>
               )}

               {/* 2. Specific Commercial Parts */}
               {linkedPartBlueprints.length > 0 && (
                 <GlassCard className="p-5 border-cyan-500/20 flex flex-col bg-cyan-950/10">
                   <h3 className="text-sm font-bold text-cyan-400 font-mono mb-4 pb-2 border-b border-cyan-500/10 uppercase flex items-center gap-2">
                     🛠️ Commercial Spare Parts ({linkedPartBlueprints.length})
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {linkedPartBlueprints.map(bp => {
                       const tmpl = pdrTemplates.find(t => t.id === bp.templateId);
                       return (
                         <div key={bp.id} className="p-3 rounded-xl bg-[#0a0a0f]/40 border border-white/5 flex items-center justify-between text-xs">
                           <div>
                             <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 uppercase font-mono">{bp.id}</span>
                             <p className="font-bold text-white mt-1">{bp.reference}</p>
                             <p className="text-[10px] text-slate-500 font-mono mt-0.5">{tmpl?.name}</p>
                           </div>
                           <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                             INHERITED
                           </span>
                         </div>
                       );
                     })}
                   </div>
                 </GlassCard>
               )}

               {/* 2. Abstract Templates */}
               {linkedPartTemplates.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {pdrFamilies.map(fam => {
                     const associatedInFam = linkedPartTemplates.filter(pt => pt.familyId === fam.id);
                     if (associatedInFam.length === 0) return null;

                     return (
                       <GlassCard key={fam.id} className="p-5 border-white/5 flex flex-col bg-[#0a0a0f]/40">
                         <h3 className="text-sm font-bold text-indigo-400 font-mono mb-4 pb-2 border-b border-white/5 uppercase flex items-center gap-2">
                           📁 {fam.name}
                         </h3>
                         <div className="space-y-2.5">
                           {associatedInFam.map(pt => (
                             <div key={pt.id} className="p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between text-xs">
                               <div className="flex items-center gap-3">
                                 <div className="w-7 h-7 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-mono">
                                   {pt.skuBase.substring(0, 2)}
                                 </div>
                                 <div>
                                   <p className="font-bold text-white">{pt.name}</p>
                                   <p className="text-[10px] text-slate-500 font-mono mt-0.5">Base Sku: {pt.skuBase}</p>
                                 </div>
                               </div>
                               <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                 SPECIFIED
                               </span>
                             </div>
                           ))}
                         </div>
                       </GlassCard>
                     );
                   })}
                 </div>
               )}
             </div>
           )) : (
             /* activeTab === 'blueprint' (Evolving and promotion panel) */
             <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-3 space-y-8 pb-12 text-right" dir="rtl">
               
               {/* Promotion Section */}
               <GlassCard className="p-6 border-l-4 border-l-purple-500 bg-purple-500/[0.01]">
                 <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 justify-start">
                   <Layers className="w-5 h-5 text-purple-400" /> دمج وتوريث قطع الغيار إلى الطراز المشترك ({blueprint?.reference})
                 </h3>
                 <p className="text-xs text-slate-400 leading-relaxed mb-6 block text-right">
                   هذه الآلة المادية تمتلك حالياً <strong>{directMappings.length}</strong> قطع غيار مربوطة بشكل مباشر وخاص بها. يمكنك دمج هذه القطع المحددة وترقيتها إلى الطراز القياسي المشترك <strong>[{blueprint?.reference}]</strong>، مما يتيح لكافة الآلات المادية التابعة لنفس الطراز أن ترث هذه القطع تلقائياً وتلغي تكرار البيانات المكررة.
                 </p>

                 {directMappings.length === 0 ? (
                   <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
                     <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                     <p className="text-xs text-emerald-400 text-right">بنية قطع الغيار لهذه الآلة سليمة ومثالية! كل قطع الغيار موروثة بالكامل من طراز النموذج القياسي ولا توجد روابط فردية مكررة.</p>
                   </div>
                 ) : (
                   <div className="space-y-4 text-right">
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                       {directMappings.map(dm => {
                         const bpItem = allPdrBlueprints.find(b => b.id === dm.blueprintId);
                         const tmpl = pdrTemplates.find(t => t.id === bpItem?.templateId);
                         return (
                           <div key={dm.id} className="p-3 rounded-xl bg-[#0a0a0f]/40 border border-white/5 flex items-center justify-between text-xs" dir="ltr">
                             <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[9px] text-purple-400 font-bold uppercase shrink-0">رابط مادي مباشر</span>
                             <div className="text-right">
                               <p className="font-bold text-purple-300 font-mono">{dm.blueprintId}</p>
                               <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]">{tmpl?.name || 'قطعة مخصصة'}</p>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                     <div className="flex justify-start">
                       <button
                         type="button"
                         onClick={() => {
                           if (confirm(`هل أنت متأكد من دمج ${directMappings.length} قطع وتوريثها إلى الطراز [${blueprint?.reference}]؟ سيؤدي هذا لتنظيف وحذف الروابط المادية الفردية بعد الترقية لضمان سلامة البيانات.`)) {
                             handlePromoteToSharedBlueprint();
                           }
                         }}
                         className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                       >
                         <RefreshCw className="w-4 h-4 animate-spin-slow" /> تفعيل دمج وتوريث الطراز المشترك ({blueprint?.reference})
                       </button>
                     </div>
                   </div>
                 )}
               </GlassCard>

               {/* Spawning Custom Blueprint Model */}
               <GlassCard className="p-6 border-l-4 border-l-cyan-500 bg-cyan-500/[0.01]">
                 <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 justify-start">
                   <GitFork className="w-5 h-5 text-cyan-400" /> تفريع وإنشاء طراز مخصص جديد (Custom Model Revision)
                 </h3>
                 <p className="text-xs text-slate-400 leading-relaxed mb-6 block text-right">
                   إذا تعرضت هذه الآلة لعملية تعديل هندسي مخصص، أو أضيفت لها ميزات تجعلها تختلف عن طرازها الأصلي، يمكنك تفريعها وإنشاء <strong>طراز تجاري جديد بالكامل (Machine Blueprint)</strong> يرث البنية القياسية السابقة مضافاً إليها كافة القطع الإضافية المركبة حالياً، مع تحويل هذه الآلة وآلات أخرى لنفس الطراز الجديد.
                 </p>

                 <form onSubmit={handleSpawnNewBlueprint} className="space-y-6 text-right">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-300 block text-right">كود المرجع الجديد للطراز (Unique Blueprint Reference)</label>
                       <input
                         type="text"
                         required
                         placeholder="مثال: RVA-02"
                         value={newBpReference}
                         onChange={e => setNewBpReference(e.target.value)}
                         className="w-full bg-[#0a0a0f]/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-left font-bold"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-300 block text-right">الشركة المصنعة / الماركة (Brand)</label>
                       <input
                         type="text"
                         required
                         placeholder="مثال: Siemens"
                         value={newBpBrand}
                         onChange={e => setNewBpBrand(e.target.value)}
                         className="w-full bg-[#0a0a0f]/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 text-right font-bold"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-300 block text-right">الموديل الفني (Model)</label>
                       <input
                         type="text"
                         required
                         placeholder="مثال: Motor Series 5"
                         value={newBpModelField}
                         onChange={e => setNewBpModelField(e.target.value)}
                         className="w-full bg-[#0a0a0f]/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 text-right font-bold"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-300 block text-right">القدرة والجهد / المواصفات (Power / Force)</label>
                       <input
                         type="text"
                         placeholder="مثال: 5.5 kW / 380V"
                         value={newBpPowerField}
                         onChange={e => setNewBpPowerField(e.target.value)}
                         className="w-full bg-[#0a0a0f]/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 text-right font-bold"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-300 block text-right">مصدر الطاقة (Energy Source)</label>
                       <select
                         value={newBpEnergy}
                         onChange={e => setNewBpEnergy(e.target.value)}
                         className="w-full bg-[#0a0a0f]/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 text-right font-bold"
                       >
                         <option value="380v">380V Trifase</option>
                         <option value="220v">220V Monofase</option>
                         <option value="24v">24V DC</option>
                         <option value="pneumatic">Pneumatic</option>
                         <option value="hydraulic">Hydraulic</option>
                       </select>
                     </div>
                   </div>

                   {/* Migrate other machines checklist */}
                   {allMachines.filter(m => m.blueprintId === machine?.blueprintId && m.id !== machineId).length > 0 && (
                     <div className="space-y-3 bg-[#0a0a0f]/20 p-4 border border-white/5 rounded-xl">
                       <p className="text-xs font-bold text-white text-right font-bold">🔗 هل ترغب في نقل آلات مادية أخرى تابعة لنفس الطراز القديم إلى هذا الطراز الجديد؟</p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                         {allMachines.filter(m => m.blueprintId === machine?.blueprintId && m.id !== machineId).map(otherM => {
                           const isChecked = migratedMachineIds.includes(otherM.id);
                           return (
                             <label key={otherM.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-xs justify-end" dir="rtl">
                               <input
                                 type="checkbox"
                                 checked={isChecked}
                                 onChange={e => {
                                   if (e.target.checked) {
                                     setMigratedMachineIds(prev => [...prev, otherM.id]);
                                   } else {
                                     setMigratedMachineIds(prev => prev.filter(id => id !== otherM.id));
                                   }
                                 }}
                                 className="rounded bg-[#0a0a0f]/40 border-white/10 text-cyan-500 focus:ring-cyan-500"
                               />
                               <div className="text-right">
                                 <span className="font-bold text-white block">آلة: {otherM.referenceCode}</span>
                                 <span className="text-[10px] text-slate-400 font-mono">الرقم التسلسلي: {otherM.serialNumber}</span>
                               </div>
                             </label>
                           );
                         })}
                       </div>
                     </div>
                   )}

                   <div className="flex justify-start">
                     <button
                       type="button"
                       onClick={() => {
                         if (confirm(`تحذير هندسي: أنت على وشك عزل هذه الآلة (ومجموع الآلات الأخرى المحددة) وتوليد طراز تجاري معتمد جديد بالكامل [${newBpReference.toUpperCase()}]. هل ترغب في التأكيد والمتابعة؟`)) {
                           handleSpawnNewBlueprint(new Event('submit') as any);
                         }
                       }}
                       className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                     >
                       <GitFork className="w-4 h-4" /> تأكيد عزل الآلة وإنشاء الطراز المخصص الجديد
                     </button>
                   </div>
                 </form>
               </GlassCard>

             </div>
           )
         }

      </motion.div>
    </motion.div>
  );
}
