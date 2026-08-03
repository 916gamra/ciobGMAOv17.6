import { PageHeader } from "@/shared/components/PageHeader";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import * as Tabs from '@radix-ui/react-tabs';
import { 
  FolderTree, 
  Component, 
  Search, 
  Plus, 
  Trash2, 
  Layers, 
  Cpu, 
  Wrench, 
  Droplets, 
  Wind, 
  Settings, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Copy, 
  Tag, 
  ListFilter, 
  Grid, 
  Info,
  Package,
  BookOpen,
  Zap
} from 'lucide-react';
import { useMasterCatalogEngine } from '../hooks/useMasterCatalogEngine';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { GlassCard } from '@/shared/components/GlassCard';
import { cn } from '@/shared/utils';
import { generatePdrSlotId } from '@/core/config/pdrMatrix';
import { db } from '@/core/db';
import { toast } from 'sonner';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

type FamilyGroup = 'mecanique' | 'hydraulique' | 'electrique' | 'electronique' | 'pneumatique' | 'autre';

interface GroupMeta {
  id: FamilyGroup;
  nameEn: string;
  nameFr: string;
  colorClass: string;
  borderClass: string;
  textClass: string;
  fillClass: string;
  icon: React.ComponentType<any>;
}

const GROUP_CONFIG: Record<FamilyGroup, GroupMeta> = {
  mecanique: {
    id: 'mecanique',
    nameEn: 'Mechanical',
    nameFr: 'MÉCANIQUE',
    colorClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20 hover:border-amber-500/40',
    textClass: 'text-amber-400',
    fillClass: 'bg-amber-500',
    icon: Wrench
  },
  hydraulique: {
    id: 'hydraulique',
    nameEn: 'Hydraulic',
    nameFr: 'HYDRAULIQUE',
    colorClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20 hover:border-blue-500/40',
    textClass: 'text-blue-400',
    fillClass: 'bg-blue-500',
    icon: Droplets
  },
  electrique: {
    id: 'electrique',
    nameEn: 'Electrical',
    nameFr: 'ÉLECTRIQUE',
    colorClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/20 hover:border-yellow-500/40',
    textClass: 'text-yellow-400',
    fillClass: 'bg-yellow-500',
    icon: Zap
  },
  electronique: {
    id: 'electronique',
    nameEn: 'Electronic',
    nameFr: 'ÉLECTRONIQUE',
    colorClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20 hover:border-emerald-500/40',
    textClass: 'text-emerald-400',
    fillClass: 'bg-emerald-500',
    icon: Cpu
  },
  pneumatique: {
    id: 'pneumatique',
    nameEn: 'Pneumatic',
    nameFr: 'PNEUMATIQUE',
    colorClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20 hover:border-cyan-500/40',
    textClass: 'text-cyan-400',
    fillClass: 'bg-cyan-500',
    icon: Wind
  },
  autre: {
    id: 'autre',
    nameEn: 'Other',
    nameFr: 'AUTRES & DIVERS',
    colorClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/20 hover:border-slate-500/40',
    textClass: 'text-slate-400',
    fillClass: 'bg-slate-500',
    icon: Settings
  }
};

export function PartsCatalogLabView() {
  const { families, templates, blueprints, isLoading, createFamily, createTemplate } = useMasterCatalogEngine();
  const { showSuccess, showError } = useNotifications();

  const [activeTab, setActiveTab] = useState('families');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<FamilyGroup | 'all'>('all');
  const [selectedFamilyFilterId, setSelectedFamilyFilterId] = useState<string | null>(null);
  
  // Creation Form Triggers
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

  // New Family Form Fields
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyDesc, setNewFamilyDesc] = useState('');
  const [newFamilyGroup, setNewFamilyGroup] = useState<FamilyGroup>('mecanique');

  // New Template Form Fields
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateSku, setNewTemplateSku] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  // UI state for Template slots inspection
  const [selectedTemplateForSlots, setSelectedTemplateForSlots] = useState<string | null>(null);

  // Grouped count calculations
  const groupStats = useMemo(() => {
    const stats: Record<FamilyGroup | 'all', number> = {
      all: families.length,
      mecanique: 0,
      hydraulique: 0,
      electrique: 0,
      electronique: 0,
      pneumatique: 0,
      autre: 0
    };
    families.forEach(f => {
      // Check if seeded family has a predefined group or fall back
      const g = (f.group || 'mecanique') as FamilyGroup;
      if (stats[g] !== undefined) {
        stats[g]++;
      } else {
        stats.autre++;
      }
    });
    return stats;
  }, [families]);

  // Filter calculations for Families
  const filteredFamilies = useMemo(() => {
    return families.filter(f => {
      const g = (f.group || 'mecanique') as FamilyGroup;
      const groupMatch = selectedGroupFilter === 'all' || g === selectedGroupFilter;
      const searchMatch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (f.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.id.toLowerCase().includes(searchTerm.toLowerCase());
      return groupMatch && searchMatch;
    });
  }, [families, selectedGroupFilter, searchTerm]);

  // Filter calculations for Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const parentFam = families.find(f => f.id === t.familyId);
      const parentFamGroup = parentFam ? ((parentFam.group || 'mecanique') as FamilyGroup) : 'mecanique';
      const groupMatch = selectedGroupFilter === 'all' || parentFamGroup === selectedGroupFilter;
      const familyMatch = !selectedFamilyFilterId || t.familyId === selectedFamilyFilterId;
      const searchMatch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.skuBase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (parentFam?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return groupMatch && familyMatch && searchMatch;
    });
  }, [templates, families, selectedGroupFilter, selectedFamilyFilterId, searchTerm]);

  // Template count per family
  const templateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    templates.forEach(t => {
      counts.set(t.familyId, (counts.get(t.familyId) || 0) + 1);
    });
    return counts;
  }, [templates]);

  // Blueprints count per template for reference details
  const blueprintCounts = useMemo(() => {
    const counts = new Map<string, number>();
    blueprints.forEach(b => {
      counts.set(b.templateId, (counts.get(b.templateId) || 0) + 1);
    });
    return counts;
  }, [blueprints]);

  // Creation of Family Classification Group
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName) return;
    try {
      const code = newFamilyName.substring(0, 3).toUpperCase();
      const uuid = `fam-${code}-${crypto.randomUUID().substring(0, 4)}`;
      
      await db.transaction('rw', [db.pdrFamilies, db.auditLogs], async () => {
        await db.pdrFamilies.add({
          id: uuid,
          name: newFamilyName.toUpperCase(),
          description: newFamilyDesc || `${newFamilyName} classification family`,
          group: newFamilyGroup,
          createdAt: new Date().toISOString()
        });
      });

      setNewFamilyName('');
      setNewFamilyDesc('');
      setIsAddingFamily(false);
      showSuccess('Classification Activated', `Family ${newFamilyName.toUpperCase()} added under ${GROUP_CONFIG[newFamilyGroup].nameFr}.`);
    } catch (err: any) {
      showError('System Error', err.message);
    }
  };

  // Creation of Abstract Template specification
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName || !newTemplateSku || !selectedFamilyId) return;
    try {
      const sanitizedSku = newTemplateSku.replace(/\s+/g, '-').toUpperCase();
      const uuid = `temp-${sanitizedSku}`;

      await db.transaction('rw', [db.pdrTemplates, db.auditLogs], async () => {
        await db.pdrTemplates.add({
          id: uuid,
          familyId: selectedFamilyId,
          name: newTemplateName,
          skuBase: sanitizedSku,
          description: newTemplateDesc || `${newTemplateName} technical specification blueprint template`,
          createdAt: new Date().toISOString()
        });
      });

      setNewTemplateName('');
      setNewTemplateSku('');
      setNewTemplateDesc('');
      setIsAddingTemplate(false);
      showSuccess('Specification Template online', `Template ${newTemplateName} created successfully.`);
    } catch (err: any) {
      showError('System Error', err.message);
    }
  };

  // Safe item deletion
  const handleDeleteItem = async (type: 'family' | 'template', id: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to permanently delete this ${type}? Deleting classifications may impact mapped equipment and technical processes.`);
    if (!isConfirmed) return;

    try {
      if (type === 'family') {
        // Prevent deletion if families have templates mapped
        const hasTemplates = templates.some(t => t.familyId === id);
        if (hasTemplates) {
          toast.error("Impossible to delete: This family has active specifications/templates mapped to it.");
          return;
        }
        await db.pdrFamilies.delete(id);
      } else if (type === 'template') {
        const hasBps = blueprints.some(b => b.templateId === id);
        if (hasBps) {
          toast.error("Impossible to delete: This template has active commercial blueprints in physical stock.");
          return;
        }
        await db.pdrTemplates.delete(id);
      }
      showSuccess('Purged Successfully', `The requested ${type} has been deleted.`);
    } catch (err: any) {
      showError('Deletion Failed', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-slate-400 flex flex-col items-center justify-center h-full min-h-[400px]">
        <Cpu className="w-12 h-12 text-amber-500 animate-pulse mb-4" />
        <p className="font-mono text-sm uppercase tracking-widest text-slate-500">Querying Master Catalogue Matrix...</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col gap-6 relative z-10 px-4 lg:px-8"
    >
      {/* HEADER SECTION */}
      <PageHeader
        title="Parts Catalogue Lab"
        subtitle="Centralized laboratory workspace for configuring structural classification families (Component Classifications) and standardized specification templates under the 999 Dormant slots rule."
        icon={<FolderTree className="w-6 h-6 text-amber-500" />}
        badgeText="Core Catalogue Workspace"
        badgeColor="amber"
      />

      {/* CLASSIFICATION BENTO CARDS */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        {(Object.keys(GROUP_CONFIG) as FamilyGroup[]).map((grpKey) => {
          const cfg = GROUP_CONFIG[grpKey];
          const Icon = cfg.icon;
          const count = groupStats[grpKey];
          const isFilterActive = selectedGroupFilter === grpKey;

          return (
            <div
              key={grpKey}
              onClick={() => setSelectedGroupFilter(isFilterActive ? 'all' : grpKey)}
              className={cn(
                "p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative group overflow-hidden select-none",
                isFilterActive 
                  ? "bg-slate-900/90 border-amber-500/40 shadow-[0_5px_15px_rgba(245,158,11,0.1)] scale-[1.02]" 
                  : "bg-black/30 border-white/5 hover:bg-white/[0.02]"
              )}
            >
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5", cfg.colorClass)}>
                  <Icon className={cn("w-4 h-4", cfg.textClass)} />
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 tracking-wider group-hover:text-white transition-colors">
                  {count} {count === 1 ? 'Fam' : 'Fams'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{cfg.nameEn}</span>
                <span className="text-sm font-bold text-white mt-1 leading-none">{cfg.nameFr}</span>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* WORKSPACE AREA */}
      <motion.div variants={itemVariants} className="flex-1 flex flex-col min-h-0 min-w-0">
        <Tabs.Root 
          value={activeTab} 
          onValueChange={(val) => { 
            setActiveTab(val); 
            setSearchTerm(''); 
            if (val === 'families') {
              setSelectedFamilyFilterId(null);
            }
          }} 
          className="flex-1 flex flex-col min-h-0 bg-transparent"
        >
          
          {/* Action and Filter Controller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 shrink-0 relative z-10">
            <Tabs.List className="flex bg-[#070913]/60 p-1.5 rounded-2xl border border-white/5 gap-1">
              <Tabs.Trigger 
                value="families" 
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                  activeTab === 'families' ? "bg-amber-500 text-black font-extrabold shadow-[0_5px_15px_rgba(245,158,11,0.2)]" : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                )}
              >
                <FolderTree className="w-3.5 h-3.5" /> Families ({families.length})
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="templates" 
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                  activeTab === 'templates' ? "bg-emerald-500 text-black font-extrabold shadow-[0_5px_15px_rgba(16,185,129,0.2)]" : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                )}
              >
                <Component className="w-3.5 h-3.5" /> Tech Templates ({templates.length})
              </Tabs.Trigger>
            </Tabs.List>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Group selection reset if group is filtered */}
              {selectedGroupFilter !== 'all' && (
                <button 
                  onClick={() => setSelectedGroupFilter('all')}
                  className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-1"
                >
                  Group: <span className="font-bold uppercase font-mono">{selectedGroupFilter}</span>
                </button>
              )}

              {/* Family specific filter badge */}
              {selectedFamilyFilterId && (
                <button 
                  onClick={() => setSelectedFamilyFilterId(null)}
                  className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  Family: <span className="font-bold uppercase font-mono text-white">{families.find(f => f.id === selectedFamilyFilterId)?.name}</span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 w-4 h-4 rounded-full flex items-center justify-center hover:bg-emerald-500/40">×</span>
                </button>
              )}

              <div className="relative group flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder={`Search in ${activeTab}...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="titan-input py-2.5 pl-11 pr-3 w-full sm:w-64 shadow-none text-slate-100"
                />
              </div>

              {activeTab === 'families' && (
                <button 
                  onClick={() => setIsAddingFamily(true)}
                  className="titan-button titan-button-primary bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/10 shrink-0 !py-2.5 !px-5 font-bold"
                >
                  <Plus className="w-4 h-4" /> Add Family Class
                </button>
              )}
              {activeTab === 'templates' && (
                <button 
                  onClick={() => setIsAddingTemplate(true)}
                  className="titan-button titan-button-primary bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/10 shrink-0 !py-2.5 !px-5 font-bold"
                >
                  <Plus className="w-4 h-4" /> Add Template Spec
                </button>
              )}
            </div>
          </div>

          {/* TAB CONTENT GRID SCROLLER */}
          <div className="flex-1 overflow-y-auto custom-scrollbar mt-5">
            
            {/* ==================================== TAB: FAMILIES ==================================== */}
            <Tabs.Content value="families" className="outline-none h-full flex flex-col gap-6">
              
              {/* New Family Inline Form */}
              <AnimatePresence>
                {isAddingFamily && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, height: 0 }} 
                    animate={{ opacity: 1, y: 0, height: 'auto' }} 
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="overflow-hidden mb-2"
                  >
                    <GlassCard className="!p-6 border-amber-500/20 bg-amber-500/[0.01]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-amber-500" /> Create Part Family Classification
                      </h3>
                      <form onSubmit={handleCreateFamily} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification Group</label>
                            <select 
                              value={newFamilyGroup} 
                              onChange={e => setNewFamilyGroup(e.target.value as FamilyGroup)}
                              className="titan-input py-2.5 bg-[#0b0c15] text-slate-100 font-bold"
                            >
                              {(Object.keys(GROUP_CONFIG) as FamilyGroup[]).map(gk => (
                                <option key={gk} value={gk} className="bg-[#141624]">
                                  {GROUP_CONFIG[gk].nameFr}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-2 col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification Family Name (Technical Name)</label>
                            <input 
                              required value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)} 
                              placeholder="e.g. BEARINGS, BELTS, VALVES, CYLINDERS, PLC MODULES..." 
                              className="titan-input uppercase py-2.5 text-slate-100 font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scope / Technical Description</label>
                          <input 
                            value={newFamilyDesc} onChange={e => setNewFamilyDesc(e.target.value)} 
                            placeholder="Specify detailed technical process boundaries or engineering guidelines for this spare parts family" 
                            className="titan-input py-2.5 text-slate-200"
                          />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                          <button 
                            type="button" 
                            onClick={() => setIsAddingFamily(false)}
                            className="titan-button titan-button-outline !py-2.5 !px-6"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="titan-button titan-button-primary bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 !py-2.5 !px-8 font-bold"
                          >
                            Instantiate Family
                          </button>
                        </div>
                      </form>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {filteredFamilies.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                  <FolderTree className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Classification Families Match Filter</p>
                  <p className="text-xs text-slate-500 mt-2">Try switching classification groups or clear filters to view active catalog nodes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
                  {filteredFamilies.map((fam) => {
                    const famGroup = (fam.group || 'mecanique') as FamilyGroup;
                    const meta = GROUP_CONFIG[famGroup] || GROUP_CONFIG.autre;
                    const GroupIcon = meta.icon;
                    const tCount = templateCounts.get(fam.id) || 0;

                    return (
                      <div 
                        key={fam.id} 
                        onClick={() => {
                          setSelectedFamilyFilterId(fam.id);
                          setActiveTab('templates');
                        }}
                        className="p-6 bg-[#070913]/40 border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-white/[0.01] hover:border-amber-500/30 transition-all duration-300 relative group overflow-hidden cursor-pointer active:scale-[0.99]"
                      >
                        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white/[0.01] to-transparent pointer-events-none" />
                        
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold tracking-widest uppercase flex items-center gap-1", meta.colorClass, meta.textClass)}>
                              <GroupIcon className="w-3 h-3" />
                              {meta.nameFr}
                            </span>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem('family', fam.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/15 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Family"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-400 transition-colors mb-2 uppercase">
                            {fam.name}
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans min-h-[40px] italic">
                            "{fam.description || 'No specific technical scope defined for this structural family.'}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                            SYS-ID: {fam.id.replace('fam-', '')}
                          </span>
                          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/10 transition-colors">
                            <Layers className="w-3.5 h-3.5 text-amber-500" />
                            {tCount} Abstract {tCount === 1 ? 'Template' : 'Templates'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Tabs.Content>

            {/* ==================================== TAB: TEMPLATES ==================================== */}
            <Tabs.Content value="templates" className="outline-none h-full flex flex-col gap-6">
              
              {/* New Template Specification Form */}
              <AnimatePresence>
                {isAddingTemplate && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, height: 0 }} 
                    animate={{ opacity: 1, y: 0, height: 'auto' }} 
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="overflow-hidden mb-2"
                  >
                    <GlassCard className="!p-6 border-emerald-500/20 bg-emerald-500/[0.01]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Component className="w-4 h-4 text-emerald-400" /> Initialize Technical Template Specification (Abstract Specification)
                      </h3>
                      <form onSubmit={handleCreateTemplate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent Classification Family</label>
                            <select 
                              required value={selectedFamilyId} onChange={e => setSelectedFamilyId(e.target.value)} 
                              className="titan-input py-2.5 bg-[#0b0c15] text-slate-100"
                            >
                              <option value="" disabled className="bg-[#141624]">--- SELECT FAMILY ---</option>
                              {families.map(f => {
                                const meta = GROUP_CONFIG[(f.group || 'mecanique') as FamilyGroup];
                                return (
                                  <option key={f.id} value={f.id} className="bg-[#141624]">
                                    [{meta?.nameFr}] - {f.name}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Template Spec Name</label>
                            <input 
                              required value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} 
                              placeholder="e.g. Ball Bearing 62xx, Courroie Type A, Electrovanne 24V..." 
                              className="titan-input py-2.5 text-slate-100 font-bold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU Base Prefix / Nomenclature Code</label>
                            <input 
                              required value={newTemplateSku} onChange={e => setNewTemplateSku(e.target.value)} 
                              placeholder="e.g. RO-B, CO-A, PNU-VAL, DIS-MAG" 
                              className="titan-input uppercase py-2.5 text-emerald-400 font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generic Specifications & Engineering Constants</label>
                          <input 
                            value={newTemplateDesc} onChange={e => setNewTemplateDesc(e.target.value)} 
                            placeholder="Define sizing parameters, metric standard constraints, safety constants..." 
                            className="titan-input py-2.5 text-slate-200"
                          />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                          <button 
                            type="button" 
                            onClick={() => setIsAddingTemplate(false)}
                            className="titan-button titan-button-outline !py-2.5 !px-6"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="titan-button titan-button-primary bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 !py-2.5 !px-8 font-bold"
                          >
                            Instantiate Specification Template
                          </button>
                        </div>
                      </form>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {filteredTemplates.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                  <Component className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Technical Templates Found</p>
                  <p className="text-xs text-slate-500 mt-2">Ensure families exist in selected classification groups before creating templates.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
                  {filteredTemplates.map((tmpl) => {
                    const parentFamily = families.find(f => f.id === tmpl.familyId);
                    const famGroup = parentFamily ? ((parentFamily.group || 'mecanique') as FamilyGroup) : 'mecanique';
                    const meta = GROUP_CONFIG[famGroup] || GROUP_CONFIG.autre;
                    const bCount = blueprintCounts.get(tmpl.id) || 0;
                    const GroupIcon = meta.icon;

                    return (
                      <div 
                        key={tmpl.id} 
                        onClick={() => setSelectedTemplateForSlots(selectedTemplateForSlots === tmpl.id ? null : tmpl.id)}
                        className={cn(
                          "p-5 bg-[#070913]/40 border rounded-2xl flex flex-col justify-between hover:bg-white/[0.01] hover:border-emerald-500/30 transition-all group duration-300 relative cursor-pointer",
                          selectedTemplateForSlots === tmpl.id ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50" : "border-white/5"
                        )}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                              PREFIX: {tmpl.skuBase}
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteItem('template', tmpl.id); }}
                              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/15 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <span className={cn("text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 mb-1.5", meta.textClass)}>
                            <GroupIcon className="w-3.5 h-3.5" />
                            {parentFamily?.name || 'GENERIC'}
                          </span>
                          <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-2 leading-tight uppercase">
                            {tmpl.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-4">
                            {tmpl.description || 'No technical specification rules designated.'}
                          </p>
                        </div>

                        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500 font-bold flex items-center gap-1 hover:text-emerald-400 transition-colors">
                            <Grid className="w-3 h-3" /> View 999 slots rule
                          </span>
                          <div className="px-2.5 py-1 rounded-lg bg-[#0c1c14] border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1 shadow-sm">
                            <Package className="w-3 h-3" /> {bCount} Mapped
                          </div>
                        </div>

                        {/* Interactive Dormant 999 slots container */}
                        {selectedTemplateForSlots === tmpl.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            className="mt-4 pt-4 border-t border-white/5 overflow-hidden cursor-default"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Info className="w-3 h-3 text-cyan-400" /> Dormant Slots Mapping
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 font-mono">{999 - bCount} Dormant / {bCount} Active</span>
                            </div>
                            
                            <div className="grid grid-cols-10 gap-1 p-1.5 bg-black/40 rounded-xl border border-white/5">
                              {Array.from({ length: 40 }).map((_, idx) => {
                                const slotNum = idx + 1;
                                const isFilled = slotNum <= bCount;
                                const slotId = generatePdrSlotId(tmpl.skuBase, slotNum);
                                return (
                                  <div 
                                    key={idx} 
                                    className={cn(
                                      "aspect-square rounded text-[8px] flex items-center justify-center transition-all border font-mono",
                                      isFilled 
                                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold" 
                                        : "bg-black/30 border-white/5 hover:border-white/20 text-slate-600"
                                    )}
                                    title={isFilled ? `Active Slot: ${slotId}` : `Dormant Slot ${slotNum}: ${slotId}`}
                                  >
                                    {slotNum}
                                  </div>
                                );
                              })}
                              <div className="col-span-10 text-center py-1.5 text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1 border-t border-white/5">
                                + 959 remaining dormant slots
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </motion.div>
    </motion.div>
  );
}
