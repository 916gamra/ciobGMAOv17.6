import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { GlassCard } from '@/shared/components/GlassCard';
import { getAssetMatrixForBlueprint, MAX_ASSETS_PER_BLUEPRINT, AssetSlot } from '@/core/config/assetMatrix';
import { 
  Factory, Cpu, Plus, X, Search, Activity, Box, Tag, Trash2, Edit3, 
  Save, Wrench, QrCode, Upload, Link2, AlertTriangle 
} from 'lucide-react';
import { useOrganizationEngine } from '../hooks/useOrganizationEngine';
import { useMachineLibrary } from '../hooks/useMachineLibrary';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { MachineBomModal } from '../components/MachineBomModal';
import { MachineDigitalIdModal } from '../components/MachineDigitalIdModal';
import { SmartImporterModal } from '../components/SmartImporterModal';
import { MachineWizardModal } from '../components/MachineWizardModal';
import { MachineDetailsModal } from '../components/MachineDetailsModal';
import { MachinePdrLinkModal } from '../components/MachinePdrLinkModal';
import { PageHeader } from '@/shared/components/PageHeader';
import { cn } from '@/shared/utils';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function MachineRegistryView() {
  const { machines, sectors, technicians, families, createMachine, updateMachine, deleteMachine } = useOrganizationEngine();
  const { blueprints, templates } = useMachineLibrary();
  const { showSuccess, showError } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('ALL');
  const [filterTemplate, setFilterTemplate] = useState('ALL');
  
  // Importer & Sub-Modals
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [selectedMachineForBom, setSelectedMachineForBom] = useState<{ id: string, name: string } | null>(null);
  const [selectedMachineForQr, setSelectedMachineForQr] = useState<any | null>(null);

  // New Step-Based Wizard States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialStep, setWizardInitialStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardLinkMachineId, setWizardLinkMachineId] = useState<string | undefined>(undefined);

  // Machine Details & Spare Part Linking States
  const [selectedMachineForDetails, setSelectedMachineForDetails] = useState<any | null>(null);
  const [selectedMachineForPdrLink, setSelectedMachineForPdrLink] = useState<any | null>(null);

  // Simple Edit Metadata Modal State (only for modifying physical serial, sector, mfg year of an existing machine)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturingYear, setManufacturingYear] = useState<number>(new Date().getFullYear());
  const [sectorId, setSectorId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [blueprintId, setBlueprintId] = useState('');
  const [referenceCode, setReferenceCode] = useState('');

  const uniqueTemplates = useMemo(() => Array.from(new Set(machines.map(m => m.templateName))).sort(), [machines]);

  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      const matchSearch = !searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.blueprintReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sectorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSector = filterSector === 'ALL' || m.sectorId === filterSector;
      const matchTemplate = filterTemplate === 'ALL' || m.templateName === filterTemplate;
      return matchSearch && matchSector && matchTemplate;
    });
  }, [machines, searchTerm, filterSector, filterTemplate]);

  // Handles basic physical twin metadata updates
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !serialNumber || !sectorId || !technicianId) return;

    try {
      await updateMachine(editingId, { 
        serialNumber, 
        manufacturingYear, 
        sectorId, 
        technicianId, 
        blueprintId: blueprintId || undefined, 
        templateId,
        referenceCode 
      });
      showSuccess('تم تحديث الآلة', 'تم تحديث البيانات المادية للآلة بنجاح.');
      handleEditClose();
    } catch (err: any) {
      showError('فشل التعديل', err.message);
    }
  };

  const handleEdit = (machine: any) => {
    setEditingId(machine.id);
    setSerialNumber(machine.serialNumber);
    setManufacturingYear(machine.manufacturingYear);
    setReferenceCode(machine.referenceCode);
    setSectorId(machine.sectorId);
    setTechnicianId(machine.technicianId || '');
    setBlueprintId(machine.blueprintId || '');
    setTemplateId(machine.templateId || '');
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditingId(null);
    setSerialNumber('');
    setManufacturingYear(new Date().getFullYear());
    setReferenceCode('');
    setSectorId('');
    setTechnicianId('');
    setBlueprintId('');
    setTemplateId('');
    setIsEditModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Decommission machine ${name}? This action is irreversible.`)) {
      await deleteMachine(id);
      showSuccess('Machine Removed', `${name} has been decommissioned.`);
    }
  };

  // Triggers the "New Asset" registration wizard
  const handleTriggerNewAssetWizard = () => {
    setWizardInitialStep(1);
    setWizardLinkMachineId(undefined);
    setIsWizardOpen(true);
  };

  useEffect(() => {
    const handleOpen = () => handleTriggerNewAssetWizard();
    document.addEventListener('open-add-machine', handleOpen);
    return () => document.removeEventListener('open-add-machine', handleOpen);
  }, []);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col gap-6 relative z-10"
    >
      <PageHeader
        title="Machine Registry"
        subtitle="Digital Twin Hub: Register and monitor physical assets across sectors."
        icon={<Factory className="w-8 h-8 text-indigo-500" />}
        badgeColor="indigo"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatCompact icon={<Factory className="w-4 h-4 text-indigo-500" />} label="Total Machines" value={machines.length.toString()} />
            <StatCompact icon={<Cpu className="w-4 h-4 text-emerald-500" />} label="Monitored" value={machines.length.toString()} />
          </div>
        }
      />

      <motion.div variants={itemVariants} className="flex-1 min-h-0 flex flex-col">
        <GlassCard className="!p-0 border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl h-full flex flex-col">
          <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Active Machinery Directory</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Asset Overview</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="titan-input py-2.5 pl-11 pr-3 w-48 lg:w-64 shadow-none"
                />
              </div>
              <select 
                value={filterSector}
                onChange={e => setFilterSector(e.target.value)}
                className="titan-input py-2.5 px-4 bg-white/[0.03] text-sm font-medium w-40"
              >
                <option value="ALL">All Sectors</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select 
                value={filterTemplate}
                onChange={e => setFilterTemplate(e.target.value)}
                className="titan-input py-2.5 px-4 bg-white/[0.03] text-sm font-medium w-40"
              >
                <option value="ALL">All Templates</option>
                {uniqueTemplates.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button 
                onClick={() => setIsImporterOpen(true)}
                className="titan-button titan-button-outline text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shrink-0 !py-2.5 gap-2"
              >
                 <Upload className="w-4 h-4" /> Smart Import
              </button>
              <button 
                onClick={handleTriggerNewAssetWizard}
                className="titan-button titan-button-primary bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] shrink-0 !py-2.5"
              >
                <Plus className="w-4 h-4" /> New Asset
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-black/10 p-6 md:p-8">
            {filteredMachines.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <Cpu className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-100 uppercase tracking-widest mb-2 mt-4">Null Results Detected</h3>
                <p className="text-slate-400 text-sm font-medium">No assets matching your query or registry is empty.</p>
                <button
                  onClick={handleTriggerNewAssetWizard}
                  className="mt-8 px-6 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-colors uppercase tracking-widest text-xs font-bold"
                >
                  + Sync First Machine
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filteredMachines.map((machine, idx) => (
                    <motion.div
                      key={machine.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <GlassCard 
                        className="!p-0 relative overflow-hidden group h-full flex flex-col hover:border-indigo-500/30 transition-all duration-300"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                        
                        {/* Make body card clickable to open MachineDetailsModal */}
                        <div 
                          onClick={() => setSelectedMachineForDetails(machine)}
                          className="p-6 relative z-10 flex-1 cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-5">
                            <span className="inline-block px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-[10px] font-mono font-bold text-indigo-400 tracking-widest shadow-sm">
                              {machine.referenceCode}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md border border-white/10 p-1 rounded-lg">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setWizardLinkMachineId(machine.id);
                                  setWizardInitialStep(3); // Blueprint selection
                                  setIsWizardOpen(true);
                                }}
                                className="p-1.5 rounded-md hover:bg-purple-500/20 text-purple-400 transition-colors"
                                title="Link to Blueprint"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedMachineForQr(machine); }}
                                className="p-1.5 rounded-md hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                title="Digital ID & QR Card"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedMachineForBom({ id: machine.id, name: machine.name }); }}
                                className="p-1.5 rounded-md hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                                title="BOM Configuration"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(machine); }}
                                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Edit Physical Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(machine.id, machine.name); }}
                                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                                title="Decommission Machine"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-2 group/title">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                            <h3 className="text-xl font-bold text-slate-100 leading-none tracking-tight uppercase truncate group-hover/title:text-indigo-400 transition-colors">{machine.name}</h3>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 mt-3">
                            <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest">
                              <Activity className="w-3.5 h-3.5 opacity-40 text-indigo-400" /> {machine.sectorName}
                            </p>
                            {machine.managerName && (
                               <p className="text-[10px] font-bold text-indigo-400/80 flex items-center gap-1.5 uppercase tracking-widest">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                 Resp: {machine.managerName}
                               </p>
                            )}
                          </div>

                          {/* Quick trigger for PDR linking on the card */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMachineForPdrLink(machine);
                            }}
                            className="mt-4 w-full py-2 px-3.5 rounded-xl border border-teal-500/20 hover:border-teal-500/40 text-teal-400 hover:bg-teal-500/5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative z-20"
                          >
                            <Link2 className="w-4 h-4" /> Link Spare Part / ربط قطعة غيار
                          </button>
                        </div>
                        
                        <div className="mt-auto grid grid-cols-2 divide-x divide-white/5 border-t border-white/5 bg-white/[0.02] text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">
                          <div className="p-4 flex items-center gap-2 justify-center" title="Family">
                            <Box className="w-4 h-4 text-slate-500" />
                            <span className="truncate">{machine.familyName}</span>
                          </div>
                          <div className="p-4 flex items-center gap-2 justify-center" title="Template">
                            <Tag className="w-4 h-4 text-slate-500" />
                            <span className="truncate">{machine.templateName}</span>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* 1. Step-Based Add / Link-Blueprint Machine Wizard */}
      <MachineWizardModal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardLinkMachineId(undefined);
          setWizardInitialStep(1);
        }}
        initialStep={wizardInitialStep}
        linkMachineId={wizardLinkMachineId}
        onSuccess={(newMachineId) => {
          showSuccess('عملية ناجحة', 'تم تسجيل الآلة بنجاح وتخصيص المقعد وتوريث كافة المهام الوقائية!');
        }}
      />

      {/* 2. Machine Detailed View Modal */}
      {selectedMachineForDetails && (
        <MachineDetailsModal
          isOpen={!!selectedMachineForDetails}
          onClose={() => setSelectedMachineForDetails(null)}
          machine={selectedMachineForDetails}
          onEditBlueprint={() => {
            const m = selectedMachineForDetails;
            setSelectedMachineForDetails(null);
            setWizardInitialStep(3); // Start straight at Blueprint selection step
            setWizardLinkMachineId(m.id);
            setIsWizardOpen(true);
          }}
          onTriggerLinkPdr={() => {
            const m = selectedMachineForDetails;
            setSelectedMachineForDetails(null);
            setSelectedMachineForPdrLink(m);
          }}
        />
      )}

      {/* 3. Dedicated Spare Part (PDR Blueprint) Linking Wizard */}
      {selectedMachineForPdrLink && (
        <MachinePdrLinkModal
          isOpen={!!selectedMachineForPdrLink}
          onClose={() => setSelectedMachineForPdrLink(null)}
          machineId={selectedMachineForPdrLink.id}
          machineName={selectedMachineForPdrLink.name}
          onSuccess={() => {
            showSuccess('ربط ناجح', 'تم ربط قطعة الغيار التجارية بالآلة المحددة بنجاح.');
          }}
        />
      )}

      {/* 4. Simple Physical Metadata Editing Modal (Maintained for non-wizard properties) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
               onClick={handleEditClose}
            />
             <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0a0f18] border border-white/10 shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-tight">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-indigo-500" />
                    </div>
                    Modify Digital Twin Metadata
                  </h3>
                  <button onClick={handleEditClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Physical Serial Number</label>
                      <input 
                        type="text" required value={serialNumber} onChange={e => setSerialNumber(e.target.value)}
                        placeholder="e.g. SN-99-01XYZ"
                        className="titan-input py-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Manufacturing Year</label>
                      <input 
                        type="number" min={1900} max={2100} required value={manufacturingYear} onChange={e => setManufacturingYear(Number(e.target.value))}
                        className="titan-input font-mono text-indigo-400 py-3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Asset ID (READ-ONLY)</label>
                    <input 
                      type="text" disabled value={referenceCode}
                      className="titan-input font-mono text-indigo-400 py-3 opacity-60 bg-black/50 border-white/5 cursor-not-allowed text-center tracking-widest text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Operational Sector</label>
                      <select
                        required value={sectorId} onChange={e => setSectorId(e.target.value)}
                        className="titan-input appearance-none transition-all cursor-pointer py-3"
                      >
                        <option value="" disabled className="bg-[#14161f]">Select primary sector...</option>
                        {sectors.filter(s => s.status === 'Active').map(s => <option key={s.id} value={s.id} className="bg-[#14161f]">{s.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">PM Technician Owner</label>
                      <select
                        required value={technicianId} onChange={e => setTechnicianId(e.target.value)}
                        className="titan-input appearance-none transition-all cursor-pointer py-3"
                      >
                        <option value="" disabled className="bg-[#14161f]">Select responsible tech...</option>
                        {technicians.map(t => <option key={t.id} value={t.id} className="bg-[#14161f]">{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-3">
                    <button type="button" onClick={handleEditClose} className="titan-button titan-button-outline !px-6 !py-2.5">
                      Abort
                    </button>
                    <button type="submit" className="titan-button titan-button-primary !px-8 !py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                       <Save className="w-4 h-4"/> Push Update
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMachineForBom && (
          <MachineBomModal 
            machineId={selectedMachineForBom.id}
            machineName={selectedMachineForBom.name}
            onClose={() => setSelectedMachineForBom(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMachineForQr && (
          <MachineDigitalIdModal
            machine={selectedMachineForQr}
            onClose={() => setSelectedMachineForQr(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImporterOpen && (
          <SmartImporterModal onClose={() => setIsImporterOpen(false)} />
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function StatCompact({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors group">
      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-base font-bold text-white -mt-0.5">{value}</span>
      </div>
    </div>
  );
}
