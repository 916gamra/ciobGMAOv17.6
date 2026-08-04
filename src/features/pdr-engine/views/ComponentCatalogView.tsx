import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Zap, Settings2, Sparkles, Search, 
  Cpu, Droplets, Activity, ChevronRight, CheckCircle2, BatteryCharging,
  Plus, ArrowRight, Database, FolderTree, X, Link2, Unlink, ExternalLink
} from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { useMasterCatalogEngine } from '@/features/organization/hooks/useMasterCatalogEngine';
import { useStockEngine } from '@/features/pdr-engine/hooks/useStockEngine';
import { useTabStore } from '@/app/store';
import { PdrWizardModal } from '../components/PdrWizardModal';
import { PdrPageSkeleton } from '../components/PdrPageSkeleton';

export function ComponentCatalogView() {
  const { showSuccess, showError } = useNotifications();
  const { openTab } = useTabStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection state
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardPrefill, setWizardPrefill] = useState(false);
  const [activatingBlueprintId, setActivatingBlueprintId] = useState<string | null>(null);
  
  // Activate Instance form
  const [initialQuantity, setInitialQuantity] = useState(0);
  const [storageLocation, setStorageLocation] = useState('');
  const [minThreshold, setMinThreshold] = useState(2);
  
  const { blueprints, templates: dbTemplates, families: dbFamilies, isLoading } = useMasterCatalogEngine();
  const { inventory, addStock } = useStockEngine();

  // 1. Saved linked template IDs from localStorage to keep state of active templates in PDR Catalog
  const [linkedTemplateIds, setLinkedTemplateIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('BDR_NEXUS_PDR_ACTIVE_TEMPLATES');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save linked templates helper
  const handleLinkTemplate = (templateId: string) => {
    setLinkedTemplateIds(prev => {
      const next = Array.from(new Set([...prev, templateId]));
      localStorage.setItem('BDR_NEXUS_PDR_ACTIVE_TEMPLATES', JSON.stringify(next));
      return next;
    });
    showSuccess('Template Linked', 'The specification template is now active in PDR Catalog.');
  };

  const handleUnlinkTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const hasBlueprints = blueprints.some(b => b.templateId === templateId);
    if (hasBlueprints) {
      showError('Cannot Unlink', 'This template has active blueprints in the catalog and cannot be unlinked.');
      return;
    }
    setLinkedTemplateIds(prev => {
      const next = prev.filter(id => id !== templateId);
      localStorage.setItem('BDR_NEXUS_PDR_ACTIVE_TEMPLATES', JSON.stringify(next));
      return next;
    });
    showSuccess('Template Unlinked', 'The specification template is no longer active in PDR Catalog.');
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
    }
  };

  // Active templates are those that have blueprints OR are explicitly linked by the user
  const activeTemplateIds = useMemo(() => {
    const withBlueprints = blueprints.map(b => b.templateId);
    return Array.from(new Set([...withBlueprints, ...linkedTemplateIds]));
  }, [blueprints, linkedTemplateIds]);

  // Filter templates to show only active ones in PDR Catalog
  const activeTemplates = useMemo(() => {
    return dbTemplates.filter(t => activeTemplateIds.includes(t.id));
  }, [dbTemplates, activeTemplateIds]);

  // Active families are those that have at least one active template in PDR Catalog
  const activeFamilyIds = useMemo(() => {
    return Array.from(new Set(activeTemplates.map(t => t.familyId)));
  }, [activeTemplates]);

  const activeFamilies = useMemo(() => {
    return dbFamilies.filter(f => activeFamilyIds.includes(f.id));
  }, [dbFamilies, activeFamilyIds]);

  // Map active collections for tree component usage
  const families = useMemo(() => {
    return activeFamilies.map(f => ({
      id: f.id,
      code: f.id.startsWith('fam-') ? f.id.replace('fam-', '') : f.name.substring(0, 3).toUpperCase(),
      name: f.name
    }));
  }, [activeFamilies]);

  const templates = useMemo(() => {
    return activeTemplates.map(t => ({
      id: t.id,
      familyId: t.familyId,
      code: t.skuBase,
      name: t.name
    }));
  }, [activeTemplates]);

  // Set initial family selection if not set
  React.useEffect(() => {
    if (families.length > 0 && !selectedFamilyId) {
      setSelectedFamilyId(families[0].id);
    }
  }, [families, selectedFamilyId]);

  // Filtered lists for the main explorer view
  const displayFamilies = useMemo(() => {
    if (!searchTerm) return families;
    const term = searchTerm.toLowerCase();
    return families.filter(f => f.name.toLowerCase().includes(term) || f.code.toLowerCase().includes(term));
  }, [families, searchTerm]);

  const displayTemplates = useMemo(() => {
    if (!selectedFamilyId) return [];
    return templates.filter(t => t.familyId === selectedFamilyId);
  }, [templates, selectedFamilyId]);

  const displayBlueprints = useMemo(() => {
    let bps = blueprints;
    if (selectedTemplateId) {
      bps = bps.filter(b => b.templateId === selectedTemplateId);
    } else if (selectedFamilyId) {
      const familyTemplateIds = templates.filter(t => t.familyId === selectedFamilyId).map(t => t.id);
      bps = bps.filter(b => familyTemplateIds.includes(b.templateId));
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      bps = bps.filter(b => 
        b.reference.toLowerCase().includes(term) || 
        (b.model && b.model.toLowerCase().includes(term)) ||
        b.id.toLowerCase().includes(term)
      );
    }
    
    return bps;
  }, [blueprints, selectedTemplateId, selectedFamilyId, templates, searchTerm]);

  if (isLoading) {
    return <PdrPageSkeleton />;
  }

  const handleActivateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activatingBlueprintId) return;
    
    const blueprint = blueprints.find(b => b.id === activatingBlueprintId);
    if (!blueprint) return;

    try {
      await addStock({
        blueprintId: blueprint.id,
        quantityCurrent: initialQuantity,
        locationDetails: storageLocation || 'To Be Assigned',
        warehouseId: 'WH-MAIN'
      });
      
      showSuccess('Instance Activated', `${blueprint.id} is now alive in factory stock.`);
      setActivatingBlueprintId(null);
      setInitialQuantity(0);
      setStorageLocation('');
      setMinThreshold(2);
    } catch(err: any) {
      showError('Activation Failed', err.message);
    }
  };

  const getFamilyIcon = (code: string) => {
    if (code.startsWith('DIS') || code.startsWith('CON') || code.startsWith('REL')) return <Zap className="w-5 h-5" />;
    if (code.startsWith('SEN') || code.startsWith('AUT')) return <Cpu className="w-5 h-5" />;
    if (code.startsWith('PNU')) return <Droplets className="w-5 h-5" />;
    if (code.startsWith('VAR') || code.startsWith('MOT')) return <Activity className="w-5 h-5" />;
    if (code.startsWith('DIV')) return <Package className="w-5 h-5" />;
    return <Settings2 className="w-5 h-5" />;
  };

  const getFamilyColor = (code: string) => {
    if (code.startsWith('DIS') || code.startsWith('CON') || code.startsWith('REL')) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    if (code.startsWith('SEN') || code.startsWith('AUT')) return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
    if (code.startsWith('PNU')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (code.startsWith('VAR') || code.startsWith('MOT')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (code.startsWith('DIV')) return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-slate-200">
      
      {/* Header */}
      <header className="shrink-0 p-8 border-b border-white/5 bg-white/[0.02]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tighter flex items-center gap-3 font-sans">
              <FolderTree className="w-8 h-8 text-indigo-400" /> PDR Catalog (كتالوج قطع الغيار)
            </h1>
            <p className="text-slate-400 max-w-2xl text-base opacity-80 mt-2">
              Browse, activate, and manage your operational spare parts catalog.
              <br/>This view lists only your selected and active spare part specifications.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button 
              onClick={() => {
                setWizardPrefill(false);
                setIsWizardOpen(true);
              }}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold text-sm rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" /> Add PDR Parts (تسجيل قطعة غيار)
            </button>
          </div>
        </div>
        
        <div className="mt-8 relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search catalog by reference, model, or custom ID... (ابحث برمز القطعة أو الموديل)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none text-white font-medium hover:bg-black/60 transition-colors"
          />
        </div>
      </header>

      {/* Explorer Split View */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* Left Pane: Taxonomy Tree */}
        <div className="w-80 border-r border-white/5 bg-white/[0.01] flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Tree</h3>
            <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full font-mono">{families.length} Fam</span>
          </div>
          
          {families.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No active families in PDR Catalog yet. Click "Link Specification Template" to link your first template.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {displayFamilies.map(family => {
                const familyTemplates = templates.filter(t => t.familyId === family.id);
                const isSelected = selectedFamilyId === family.id;
                
                return (
                  <div key={family.id} className="flex flex-col">
                    <button
                      onClick={() => {
                        setSelectedFamilyId(family.id);
                        setSelectedTemplateId(null);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${isSelected ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                      <div className={getFamilyColor(family.code).split(' ')[0]}>
                        {getFamilyIcon(family.code)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${isSelected ? 'text-indigo-400' : 'text-slate-300'}`}>
                          {family.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{family.code}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-400 rotate-90' : 'text-slate-600'}`} />
                    </button>
                    
                    {isSelected && (
                      <div className="pl-11 pr-2 py-2 space-y-1 border-l-2 border-indigo-500/20 ml-5 mt-1 mb-2">
                        <button
                          onClick={() => setSelectedTemplateId(null)}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-all ${selectedTemplateId === null ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                          All {family.name}
                        </button>
                        {familyTemplates.map(temp => (
                          <div
                            key={temp.id}
                            onClick={() => setSelectedTemplateId(temp.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all flex justify-between items-center cursor-pointer group/item ${selectedTemplateId === temp.id ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                          >
                            <span className="truncate pr-2">{temp.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] font-mono opacity-50 group-hover/item:opacity-80">{temp.code}</span>
                              <button 
                                onClick={(e) => handleUnlinkTemplate(temp.id, e)}
                                title="Unlink specification from PDR"
                                className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                              >
                                <Unlink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Blueprints Grid */}
        <div className="flex-1 bg-black/20 overflow-y-auto custom-scrollbar p-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {selectedTemplateId 
                  ? templates.find(t => t.id === selectedTemplateId)?.name 
                  : selectedFamilyId 
                    ? families.find(f => f.id === selectedFamilyId)?.name 
                    : 'All Blueprints'}
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                {displayBlueprints.length} Blueprints Registered
              </p>
            </div>
            
            <button 
              onClick={() => {
                setWizardPrefill(true);
                setIsWizardOpen(true);
              }}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#050508] font-extrabold text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" /> Add Blueprint
            </button>
          </div>
          
          {displayBlueprints.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
              <Database className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">No Blueprints Found</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Select a different template or link/create new templates above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayBlueprints.map(bp => {
                const inStock = inventory.some(i => i.blueprintId === bp.id);
                return (
                  <GlassCard 
                    key={bp.id}
                    className={`p-5 relative overflow-hidden group border ${inStock ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:border-indigo-500/50'}`}
                  >
                    {inStock && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 blur-2xl rounded-full" />}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 pr-2">
                        <div className="text-lg font-bold text-white tracking-tight truncate" title={bp.reference}>{bp.reference}</div>
                        <div className="text-xs font-mono text-slate-400 truncate">{bp.model || 'No Model'}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest shrink-0 ${inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>
                        {inStock ? 'Active' : 'Dormant'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Unit</span>
                        <span className="text-slate-300 font-medium">{bp.unit}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Power/Size</span>
                        <span className="text-slate-300 font-medium truncate max-w-[120px]">{bp.powerOrForce || '-'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Specs</span>
                        <span className="text-slate-300 font-medium truncate max-w-[120px]" title={bp.technicalSpecs}>{bp.technicalSpecs || '-'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">ID / الكود</span>
                        <span className="text-cyan-400 font-mono text-[10px] font-bold">{bp.id}</span>
                      </div>
                    </div>

                    {!inStock && (
                      <button 
                        onClick={() => setActivatingBlueprintId(bp.id)}
                        className="w-full py-2 bg-white/5 hover:bg-indigo-500/20 text-indigo-300 border border-white/10 hover:border-indigo-500/50 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        Activate to Stock
                      </button>
                    )}
                    {inStock && (
                      <div className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> In Factory
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activation Modal */}
      <AnimatePresence>
        {activatingBlueprintId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setActivatingBlueprintId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0f111a] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1 font-sans">
                      {blueprints.find(b => b.id === activatingBlueprintId)?.reference}
                    </h2>
                    <p className="text-xs text-emerald-400 font-mono font-bold tracking-widest uppercase">Activate Instance / Stock</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <BatteryCharging className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <form onSubmit={handleActivateInstance} className="space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                        Initial Quantity
                      </label>
                      <input 
                        type="number"
                        min="0"
                        required
                        value={initialQuantity}
                        onChange={e => setInitialQuantity(Number(e.target.value))}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-mono text-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                        Minimum Threshold
                      </label>
                      <input 
                        type="number"
                        min="0"
                        required
                        value={minThreshold}
                        onChange={e => setMinThreshold(Number(e.target.value))}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-mono text-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">
                      Storage Location / Bin
                    </label>
                    <input 
                      type="text"
                      required
                      value={storageLocation}
                      onChange={e => setStorageLocation(e.target.value)}
                      placeholder="e.g. Aisle 3 - Shelf D2"
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setActivatingBlueprintId(null)}
                      className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors"
                    >
                      Abort
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                    >
                       Activate to Live Stock
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PdrWizardModal 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        families={dbFamilies}
        templates={dbTemplates}
        blueprints={blueprints}
        onLinkTemplate={handleLinkTemplate}
        initialFamilyId={wizardPrefill ? selectedFamilyId : null}
        initialTemplateId={wizardPrefill ? selectedTemplateId : null}
      />
    </div>
  );
}
