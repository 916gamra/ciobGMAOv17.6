import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { GlassCard } from '@/shared/components/GlassCard';
import { getAssetMatrixForBlueprint, MAX_ASSETS_PER_BLUEPRINT, AssetSlot } from '@/core/config/assetMatrix';
import { 
  Factory, Cpu, Plus, X, Search, Activity, Box, Tag, Trash2, Edit3, 
  Save, Wrench, QrCode, Upload, Link2, AlertTriangle, Eye, LayoutGrid, CheckCircle2 
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
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { UnifiedSearchFilter, FilterGroup } from '@/shared/components/UnifiedSearchFilter';
import { cn } from '@/shared/utils';
import { useTranslation } from 'react-i18next';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function MachineRegistryView() {
  const { t } = useTranslation();
  const { machines, sectors, technicians, families, createMachine, updateMachine, deleteMachine } = useOrganizationEngine();
  const { blueprints, templates } = useMachineLibrary();
  const { showSuccess, showError } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('ALL');
  const [filterTemplate, setFilterTemplate] = useState('ALL');
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  
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

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'sector',
      label: 'منطقة التشغيل (Sector)',
      value: filterSector,
      onChange: setFilterSector,
      allLabel: 'جميع قطاعات المعمل',
      options: sectors.map(s => ({ value: s.id, label: s.name }))
    },
    {
      id: 'template',
      label: 'القالب المرجعي (Template)',
      value: filterTemplate,
      onChange: setFilterTemplate,
      allLabel: 'جميع القوالب الهندسية',
      options: uniqueTemplates.map(t => ({ value: t, label: t }))
    }
  ], [filterSector, filterTemplate, sectors, uniqueTemplates]);

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
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-slate-800 dark:text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr" dir="ltr">
      <div className="p-6 md:p-8 pb-0 shrink-0">
      <PageHeader
        title={t('machines.title', 'Machine Registry')}
        subtitle={t('machines.subtitle', 'Comprehensive Machinery & Asset Directory')}
        icon={<Factory className="w-7 h-7 text-indigo-400" />}
        badgeText={t('machines.badge', 'Machine Registry')}
        badgeColor="indigo"
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsImporterOpen(true)}
              className="bg-white/[0.04] text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 font-bold rounded-xl px-4 py-2.5 text-xs transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
               <Upload className="w-4 h-4" /> {t('machines.smartImport', 'Smart Import')}
            </button>
            <button 
              onClick={handleTriggerNewAssetWizard}
              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" /> {t('machines.newAsset', 'New Asset')}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={t('machines.total', 'إجمالي الآلات')}
            subtitle="TOTAL MACHINES"
            value={machines.length}
            icon={<Factory className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title={t('machines.sectors', 'قطاعات المعمل')}
            subtitle="SECTORS"
            value={sectors.length}
            icon={<Cpu className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title={t('machines.squad', 'الفريق الموجه')}
            subtitle="TECHNICIANS SQUAD"
            value={technicians.length}
            icon={<Activity className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title={t('machines.health', 'جاهزية العمليات')}
            subtitle="OPERATIONAL HEALTH"
            value="100%"
            icon={<Box className="w-3.5 h-3.5" />}
            color="cyan"
          />
        </div>
      </PageHeader>
      </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 gap-6 min-h-0">
      <motion.div variants={itemVariants} className="flex-1 min-h-0 flex flex-col">
        <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-full flex flex-col bg-[#0a0a0f]/60 backdrop-blur-xl">
          {/* Universal Crystal Command Bar */}
          <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shrink-0 relative z-10">
            {/* Right Side (RTL): Context Count */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">{t('machines.directoryTitle', 'Active Machinery Directory')}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                    {filteredMachines.length} {t('machines.total', 'Assets')}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('machines.directorySubtitle', 'Global Asset Overview')}</p>
              </div>
            </div>

            {/* Center & Left: Unified Search & Filter with View Switcher */}
            <div className="flex-1 max-w-3xl">
              <UnifiedSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={t('machines.searchPlaceholder', 'بحث في الآلات، الأكواد، القطاعات، أو الموديلات...')}
                filterGroups={filterGroups}
                themeColor="indigo"
                extraControls={
                  <div className="flex items-center gap-1 p-1 bg-[#161821] rounded-xl border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('table')}
                      className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer",
                        displayMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-white"
                      )}
                      title="عرض الجدول (Crystal Table)"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('cards')}
                      className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer",
                        displayMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-white"
                      )}
                      title="عرض البطاقات (Cards Grid)"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                }
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#0a0a0f]/40 p-4 md:p-6">
            {filteredMachines.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <Cpu className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-100 uppercase tracking-widest mb-2 mt-4">{t('machines.nullResultsTitle', 'Null Results Detected')}</h3>
                <p className="text-slate-400 text-sm font-medium">{t('machines.nullResultsDesc', 'No assets matching your query or registry is empty.')}</p>
                <button
                  onClick={handleTriggerNewAssetWizard}
                  className="mt-8 px-6 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-colors uppercase tracking-widest text-xs font-bold cursor-pointer"
                >
                  + {t('machines.syncFirst', 'Sync First Machine')}
                </button>
              </div>
            ) : displayMode === 'table' ? (
              /* Crystal Table View */
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900/60 backdrop-blur-xl shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4 text-start font-bold">معرف الآلة (Asset ID)</th>
                        <th className="py-3.5 px-4 text-start font-bold">اسم الآلة والموديل</th>
                        <th className="py-3.5 px-4 text-start font-bold">منطقة التشغيل</th>
                        <th className="py-3.5 px-4 text-start font-bold">المسؤول والفني</th>
                        <th className="py-3.5 px-4 text-start font-bold">العائلة والقالب</th>
                        <th className="py-3.5 px-4 text-center font-bold">الإجراءات والربط</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredMachines.map((machine) => (
                        <tr key={machine.id} className="hover:bg-white/[0.04] transition-colors group">
                          {/* Reference Code */}
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span 
                              onClick={() => setSelectedMachineForDetails(machine)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] inline-flex items-center gap-1.5 cursor-pointer hover:bg-indigo-500/20 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                              {machine.referenceCode}
                            </span>
                          </td>

                          {/* Machine Name & Blueprint */}
                          <td className="py-3.5 px-4">
                            <div 
                              onClick={() => setSelectedMachineForDetails(machine)}
                              className="flex flex-col cursor-pointer"
                            >
                              <span className="font-extrabold text-white text-xs tracking-tight group-hover:text-indigo-300 transition-colors uppercase">
                                {machine.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {machine.blueprintReference || 'غير مسند لموديل تجاري'}
                              </span>
                            </div>
                          </td>

                          {/* Sector */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="font-bold text-slate-200 text-xs">
                                {machine.sectorName}
                              </span>
                            </div>
                          </td>

                          {/* Tech / Manager */}
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] text-slate-300 font-medium">
                              {machine.managerName || 'مسؤول القطاع'}
                            </span>
                          </td>

                          {/* Family & Template */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
                                {machine.familyName}
                              </span>
                              <span className="text-slate-500 text-xs">/</span>
                              <span className="text-[10px] text-slate-300 font-bold">
                                {machine.templateName}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Link Spare Part Quick Trigger */}
                              <button
                                type="button"
                                onClick={() => setSelectedMachineForPdrLink(machine)}
                                className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer"
                                title="ربط قطعة غيار PDR"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </button>

                              {/* QR Code */}
                              <button 
                                onClick={() => setSelectedMachineForQr(machine)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title="Digital ID & QR Card"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>

                              {/* BOM */}
                              <button 
                                onClick={() => setSelectedMachineForBom({ id: machine.id, name: machine.name })}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title="BOM Configuration"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button 
                                onClick={() => handleEdit(machine)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title="تعديل البيانات"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button 
                                onClick={() => handleDelete(machine.id, machine.name)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                                title="إخراج من الخدمة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Cards View */
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
                      <div 
                        className="!p-0 relative overflow-hidden group h-full flex flex-col hover:border-indigo-500 transition-all duration-300 border border-white/10 bg-[#0a0a0f] rounded-3xl"
                      >
                        {/* Make body card clickable to open MachineDetailsModal */}
                        <div 
                          onClick={() => setSelectedMachineForDetails(machine)}
                          className="p-6 relative z-10 flex-1 cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-5">
                            <span className="inline-block px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono font-bold text-slate-300 tracking-widest shadow-sm">
                              {machine.referenceCode}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-lg">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setWizardLinkMachineId(machine.id);
                                  setWizardInitialStep(3); // Blueprint selection
                                  setIsWizardOpen(true);
                                }}
                                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Link to Blueprint"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedMachineForQr(machine); }}
                                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Digital ID & QR Card"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedMachineForBom({ id: machine.id, name: machine.name }); }}
                                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="BOM Configuration"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(machine); }}
                                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Edit Physical Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(machine.id, machine.name); }}
                                className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Decommission Machine"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                            <h3 className="text-xl font-bold text-slate-400 leading-none tracking-tight uppercase truncate group-hover:text-white group-hover:font-black transition-all duration-300">{machine.name}</h3>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 mt-3 transition-colors duration-300">
                            <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 flex items-center gap-1.5 uppercase tracking-widest transition-colors">
                              <Activity className="w-3.5 h-3.5 opacity-40 text-slate-400" /> {machine.sectorName}
                            </p>
                            {machine.managerName && (
                               <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 flex items-center gap-1.5 uppercase tracking-widest transition-colors">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 opacity-40 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
                            className="mt-4 w-full py-2 px-3.5 rounded-xl border border-white/10 hover:border-white/30 text-slate-400 hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative z-20 group/btn cursor-pointer"
                          >
                            <Link2 className="w-4 h-4 text-slate-500 group-hover/btn:text-white" /> {t('machines.linkSparePart', 'Link Spare Part')}
                          </button>
                        </div>
                        
                        <div className="mt-auto grid grid-cols-2 divide-x divide-white/5 border-t border-white/5 bg-white/[0.02] text-[10px] font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-widest relative z-10 transition-colors duration-300">
                          <div className="p-4 flex items-center gap-2 justify-center" title="Family">
                            <Box className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                            <span className="truncate">{machine.familyName}</span>
                          </div>
                          <div className="p-4 flex items-center gap-2 justify-center" title="Template">
                            <Tag className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                            <span className="truncate">{machine.templateName}</span>
                          </div>
                        </div>
                      </div>
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
               className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-md"
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
                      className="titan-input font-mono text-indigo-400 py-3 opacity-60 bg-[#0a0a0f]/50 border-white/5 cursor-not-allowed text-center tracking-widest text-lg"
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
                    <button type="button" onClick={handleEditClose} className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all cursor-pointer">
                      {t('machines.abortBtn', 'Abort')}
                    </button>
                    <button type="submit" className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer">
                       <Save className="w-4 h-4"/> {t('machines.pushUpdate', 'Push Update')}
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

    </div>
    </div>
  );
}
