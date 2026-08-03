import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, AlertCircle, Wrench, ChevronDown, ChevronUp, Edit2, Trash2, Cpu, Box, Link } from 'lucide-react';
import { db, ComponentTemplate, ComponentBlueprint, PdrTemplate } from '@/core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '@/shared/utils';

export function ComponentsCatalogView() {
  const data = useLiveQuery(async () => {
    const [templates, blueprints, pdrTemplates] = await Promise.all([
      db.componentTemplates.toArray(),
      db.componentBlueprints.toArray(),
      db.pdrTemplates.toArray()
    ]);
    return { templates, blueprints, pdrTemplates };
  }, []);

  const templates = data?.templates ?? [];
  const blueprints = data?.blueprints ?? [];
  const pdrTemplates = data?.pdrTemplates ?? [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamily, setFilterFamily] = useState('');

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ComponentTemplate | null>(null);
  
  // Blueprint Modal State
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [selectedTemplateForBlueprint, setSelectedTemplateForBlueprint] = useState<ComponentTemplate | null>(null);

  // Template Form State
  const [tmplName, setTmplName] = useState('');
  const [tmplFamily, setTmplFamily] = useState('MEC');
  const [tmplCriticality, setTmplCriticality] = useState('Medium');
  const [tmplDesc, setTmplDesc] = useState('');
  const [tmplLinkedPdrs, setTmplLinkedPdrs] = useState<string[]>([]);

  // Blueprint Form State
  const [bpReference, setBpReference] = useState('');
  const [bpBrand, setBpBrand] = useState('');
  const [bpSpecs, setBpSpecs] = useState('');

  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  const toggleTemplate = (id: string) => {
    const next = new Set(expandedTemplates);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTemplates(next);
  };

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTmplName('');
    setTmplFamily('MEC');
    setTmplCriticality('Medium');
    setTmplDesc('');
    setTmplLinkedPdrs([]);
    setIsTemplateModalOpen(true);
  };

  const openEditTemplate = (t: ComponentTemplate) => {
    setEditingTemplate(t);
    setTmplName(t.name);
    setTmplFamily(t.family);
    setTmplCriticality(t.criticality || 'Medium');
    setTmplDesc(t.description || '');
    setTmplLinkedPdrs(t.linkedPartTemplateIds || []);
    setIsTemplateModalOpen(true);
  };

  const openNewBlueprint = (t: ComponentTemplate) => {
    setSelectedTemplateForBlueprint(t);
    setBpReference('');
    setBpBrand('');
    setBpSpecs('');
    setIsBlueprintModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await db.componentTemplates.update(editingTemplate.id, {
          name: tmplName,
          family: tmplFamily,
          description: tmplDesc,
          criticality: tmplCriticality,
          linkedPartTemplateIds: tmplLinkedPdrs
        });
      } else {
        await db.componentTemplates.add({
          id: crypto.randomUUID(),
          name: tmplName,
          family: tmplFamily,
          description: tmplDesc,
          criticality: tmplCriticality,
          linkedPartTemplateIds: tmplLinkedPdrs
        });
      }
      setIsTemplateModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error saving template');
    }
  };

  const handleSaveBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForBlueprint) return;

    try {
      // 999 slots rule
      const existingBps = await db.componentBlueprints
        .where('id')
        .startsWith(selectedTemplateForBlueprint.family + '-')
        .toArray();
      
      let nextNum = 1;
      if (existingBps.length > 0) {
        const nums = existingBps.map(bp => {
          const parts = bp.id.split('-');
          return parseInt(parts[1] || '0', 10);
        }).filter(n => !isNaN(n));
        if (nums.length > 0) {
          nextNum = Math.max(...nums) + 1;
        }
      }
      if (nextNum > 999) {
        alert("Maximum capacity of 999 reached for this family!");
        return;
      }

      const id = `${selectedTemplateForBlueprint.family}-${nextNum.toString().padStart(3, '0')}`;

      await db.componentBlueprints.add({
        id,
        templateId: selectedTemplateForBlueprint.id,
        reference: bpReference,
        brand: bpBrand,
        specs: bpSpecs
      });

      setIsBlueprintModalOpen(false);
      setExpandedTemplates(prev => new Set(prev).add(selectedTemplateForBlueprint.id));
    } catch (err) {
      console.error(err);
      alert('Error saving blueprint');
    }
  };

  const handleDeleteTemplate = async (t: ComponentTemplate) => {
    if (confirm(`Delete template ${t.name}?\nWARNING: This will delete all its blueprints!`)) {
      const relatedBps = blueprints.filter(b => b.templateId === t.id);
      await db.transaction('rw', db.componentTemplates, db.componentBlueprints, async () => {
        for (const bp of relatedBps) {
          await db.componentBlueprints.delete(bp.id);
        }
        await db.componentTemplates.delete(t.id);
      });
    }
  };

  const handleDeleteBlueprint = async (bp: ComponentBlueprint) => {
    if (confirm(`Delete blueprint ${bp.id}?`)) {
      await db.componentBlueprints.delete(bp.id);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchSearch = searchTerm ? t.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchFamily = filterFamily ? t.family === filterFamily : true;
      return matchSearch && matchFamily;
    });
  }, [templates, searchTerm, filterFamily]);

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-orange-400" />
            Machine Components Catalog
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage sub-systems, assemblies, and their commercial models (Blueprints).</p>
        </div>
        <button
          onClick={openNewTemplate}
          className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Component Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#12141c] p-4 rounded-2xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterFamily}
            onChange={(e) => setFilterFamily(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="">All Families</option>
            <option value="MEC">Mechanical (MEC)</option>
            <option value="ELE">Electrical (ELE)</option>
            <option value="HYD">Hydraulic (HYD)</option>
            <option value="PNU">Pneumatic (PNU)</option>
            <option value="ELN">Electronic (ELN)</option>
          </select>
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-12 custom-scrollbar">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-[#12141c] rounded-3xl border border-white/5">
            <Cpu className="w-12 h-12 mb-4 opacity-20" />
            <p>No component templates found.</p>
          </div>
        ) : (
          filteredTemplates.map(t => {
            const isExpanded = expandedTemplates.has(t.id);
            const tmplBlueprints = blueprints.filter(b => b.templateId === t.id);
            
            return (
              <div key={t.id} className="bg-[#12141c] rounded-2xl border border-white/5 overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleTemplate(t.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{t.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 font-mono">{t.family}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className={cn(
                          "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5",
                          t.criticality === 'Critical' ? "text-red-400" : 
                          t.criticality === 'High' ? "text-orange-400" : "text-slate-400"
                        )}>
                          {t.criticality}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                          {tmplBlueprints.length} Blueprints
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditTemplate(t); }}
                      className="p-2 text-slate-400 hover:text-white bg-black/40 hover:bg-black/80 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t); }}
                      className="p-2 text-slate-400 hover:text-red-400 bg-black/40 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 flex items-center justify-center text-slate-500">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-black/20"
                    >
                      <div className="p-4 pl-16">
                        {/* Blueprints Area */}
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-300">Commercial Blueprints</h4>
                          <button
                            onClick={() => openNewBlueprint(t)}
                            className="text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Blueprint
                          </button>
                        </div>

                        {tmplBlueprints.length === 0 ? (
                          <div className="text-xs text-slate-500 italic mb-4">No blueprints activated for this template.</div>
                        ) : (
                          <div className="space-y-2 mb-6">
                            {tmplBlueprints.map(bp => (
                              <div key={bp.id} className="flex items-center justify-between bg-[#12141c] border border-white/5 rounded-lg p-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-mono font-bold text-orange-400">{bp.id}</span>
                                  <span className="text-sm text-slate-300">{bp.reference} <span className="text-slate-500 text-xs ml-2">{bp.brand}</span></span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteBlueprint(bp)}
                                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Linked PDRs */}
                        <div className="pt-4 border-t border-white/5">
                          <h4 className="text-sm font-bold text-slate-300 mb-2">Linked Spare Parts (PDR)</h4>
                          <div className="flex flex-wrap gap-2">
                            {t.linkedPartTemplateIds && t.linkedPartTemplateIds.length > 0 ? (
                              t.linkedPartTemplateIds.map(pid => {
                                const pdrTmpl = pdrTemplates.find(p => p.id === pid);
                                return (
                                  <div key={pid} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                                    <Box className="w-3 h-3 text-slate-400" />
                                    <span className="text-[11px] text-slate-300">{pdrTmpl?.name || pid}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-xs text-slate-600">No spare parts linked.</span>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12141c] border border-white/10 rounded-3xl p-6 w-full max-w-xl shadow-2xl"
            >
              <h3 className="text-lg font-black text-white mb-4">
                {editingTemplate ? 'Edit Component Template' : 'New Component Template'}
              </h3>
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={tmplName}
                    onChange={e => setTmplName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                    placeholder="e.g. Electric Motor"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Family</label>
                    <select
                      value={tmplFamily}
                      onChange={e => setTmplFamily(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="MEC">Mechanical (MEC)</option>
                      <option value="ELE">Electrical (ELE)</option>
                      <option value="HYD">Hydraulic (HYD)</option>
                      <option value="PNU">Pneumatic (PNU)</option>
                      <option value="ELN">Electronic (ELN)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Criticality</label>
                    <select
                      value={tmplCriticality}
                      onChange={e => setTmplCriticality(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={tmplDesc}
                    onChange={e => setTmplDesc(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Linked Spare Parts (PDR Templates)</label>
                  <div className="h-32 overflow-y-auto bg-black/30 border border-white/10 rounded-xl p-2 custom-scrollbar">
                    {pdrTemplates.map(pt => (
                      <label key={pt.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tmplLinkedPdrs.includes(pt.id)}
                          onChange={(e) => {
                            if (e.target.checked) setTmplLinkedPdrs(prev => [...prev, pt.id]);
                            else setTmplLinkedPdrs(prev => prev.filter(id => id !== pt.id));
                          }}
                          className="rounded bg-black border-white/20 text-orange-500 focus:ring-0"
                        />
                        <span className="text-sm text-slate-300">{pt.name} <span className="text-slate-500 text-xs">({pt.skuBase})</span></span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-lg font-bold">Save Template</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blueprint Modal */}
      <AnimatePresence>
        {isBlueprintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12141c] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-black text-white mb-1">New Commercial Blueprint</h3>
              <p className="text-xs text-slate-400 mb-4">Template: {selectedTemplateForBlueprint?.name}</p>
              
              <form onSubmit={handleSaveBlueprint} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Reference Model *</label>
                  <input
                    type="text"
                    required
                    value={bpReference}
                    onChange={e => setBpReference(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                    placeholder="e.g. Siemens 5.5kW 400V"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Brand</label>
                  <input
                    type="text"
                    value={bpBrand}
                    onChange={e => setBpBrand(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Technical Specs</label>
                  <textarea
                    rows={2}
                    value={bpSpecs}
                    onChange={e => setBpSpecs(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setIsBlueprintModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-lg font-bold">Activate Blueprint</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
