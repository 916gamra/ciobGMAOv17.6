import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState } from 'react';
import { 
  DatabaseZap, 
  ShieldAlert, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRightLeft, 
  HardDrive, 
  LayoutGrid, 
  Wrench, 
  Factory, 
  FileLock,
  Download,
  Terminal,
  Layers,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { db, User } from '@/core/db';
import { motion, Variants } from 'motion/react';
import { useAuditTrail } from '../hooks/useAuditTrail';
import { runDatabaseSeed } from '@/core/db/useDatabaseSeeder';
import { GlassCard } from '@/shared/components/GlassCard';
import { useTabStore } from '@/app/store';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { cn } from '@/shared/utils';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function SystemSettingsView({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { t } = useTranslation();
  const { logEvent } = useAuditTrail();
  const [isWiping, setIsWiping] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { openTab } = useTabStore();

  // Real-time Dexie Database counts for System Admin Bento info
  const machinesCount = useLiveQuery(() => db.machines.count()) || 0;
  const partsCount = useLiveQuery(() => db.inventory.count()) || 0;
  const blueprintsCount = useLiveQuery(() => db.pdrBlueprints.count()) || 0;
  const auditLogsCount = useLiveQuery(() => db.auditLogs.count()) || 0;

  const handleWipeAndReseed = async () => {
    try {
      setIsWiping(true);
      setShowResetModal(false);
      
      await logEvent({
        userId: user?.id || 'GUEST',
        userName: user?.name || 'Guest User',
        action: 'DELETE',
        entityType: 'DATABASE',
        entityId: 'SYSTEM',
        details: 'FACTORY RESET INITIATED. Wiping all operational data and injecting Master Data.',
        severity: 'CRITICAL'
      });

      await db.transaction('rw', [
        db.userOverrides, db.machines, db.machinePartMappings, db.sectors, 
        db.machineFamilies, db.machineTemplates, db.machineBlueprints,
        db.pdrBlueprints, db.pdrTemplates, db.pdrFamilies, db.inventory, db.movements,
        db.purchaseOrders, db.purchaseOrderLines, db.partRequisitions, db.partRequisitionLines,
        db.preventiveTasks, db.blueprintTasks, db.machineTasks, db.taskExecutions, db.auditLogs
      ], async () => {
        await db.userOverrides.clear();
        await db.machines.clear();
        await db.machinePartMappings.clear();
        await db.sectors.clear();
        await db.machineFamilies.clear();
        await db.machineTemplates.clear();
        await db.machineBlueprints.clear();
        await db.pdrBlueprints.clear();
        await db.pdrTemplates.clear();
        await db.pdrFamilies.clear();
        await db.inventory.clear();
        await db.movements.clear();
        await db.purchaseOrders.clear();
        await db.purchaseOrderLines.clear();
        await db.partRequisitions.clear();
        await db.partRequisitionLines.clear();
        await db.preventiveTasks.clear();
        await db.blueprintTasks.clear();
        await db.machineTasks.clear();
        await db.taskExecutions.clear();
        await db.auditLogs.clear();
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const seedFunc = runDatabaseSeed(true);
      await seedFunc();

      toast.success(t('system.resetSuccessTitle', 'تمت إعادة ضبط النظام بنجاح'), {
         description: t('system.resetSuccessDesc', 'تمت مزامنة كافة العقد الأساسية وإعادة بناء الهياكل بنجاح...'),
      });

      setTimeout(() => {
         window.location.reload();
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error(t('system.resetFailedTitle', 'فشل في إعادة ضبط النظام'), { 
        description: t('system.resetFailedDesc', 'فشلت عملية مسح البيانات وإعادة الضبط الشامل.') 
      });
      setIsWiping(false);
    }
  };

  const handleGoToDataExchange = () => {
    openTab({ 
      id: 'data-exchange', 
      portalId: 'SETTINGS', 
      title: t('system.exchangeCard.title', 'مركز تبادل البيانات الشامل'), 
      component: 'data-exchange' 
    });
  };

  const handleExportSeed = async () => {
    try {
      const families = await db.pdrFamilies.toArray();
      const templates = await db.pdrTemplates.toArray();
      const blueprints = await db.pdrBlueprints.toArray();
      const sectors = await db.sectors.toArray();
      const machines = await db.machines.toArray();
      
      const seedData = {
        families,
        sectors,
        machines,
        templates,
        blueprints
      };
      
      console.log('=== BDR NEXUS MASTER SEED DATA JSON ===');
      console.log(JSON.stringify(seedData, null, 2));
      console.log('=======================================');
      
      // Also copy to clipboard for user convenience
      await navigator.clipboard.writeText(JSON.stringify(seedData, null, 2));

      toast.success(t('system.exportSuccessTitle', 'تم تصدير الحالة المرجعية بنجاح'), {
         description: t('system.exportSuccessDesc', 'تم نسخ كود JSON للحافظة وطباعته في كونسول المتصفح.')
      });
    } catch (err) {
      console.error(err);
      toast.error(t('system.exportFailedTitle', 'فشل تصدير البيانات'));
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 lg:px-8 pt-2 font-sans"
    >
      {/* 1. Page Header with Bento Cards */}
      <PageHeader
        title={t('system.title', 'Data Management & System Settings')}
        subtitle={t('system.subtitle', 'Major architectural standards for factory assets, security protocols, and comprehensive industrial resets.')}
        icon={<DatabaseZap className="w-7 h-7 text-slate-300" />}
        badgeText={t('system.badge', 'Data Management')}
        badgeColor="slate"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={t('system.sparePartsCatalog', 'Spare Parts Catalog')}
            subtitle={t('system.blueprintsCountSubtitle', 'TOTAL BLUEPRINTS')}
            value={blueprintsCount}
            icon={<LayoutGrid className="w-3.5 h-3.5" />}
            color="slate"
          />
          <HeaderBentoCard
            title={t('system.inventoryUnits', 'Inventory Items')}
            subtitle={t('system.inventorySubtitle', 'TOTAL INVENTORY ITEMS')}
            value={partsCount}
            icon={<Wrench className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title={t('system.equipmentMachinery', 'Machinery & Equipment')}
            subtitle={t('system.equipmentSubtitle', 'REGISTERED EQUIPMENT')}
            value={machinesCount}
            icon={<Factory className="w-3.5 h-3.5" />}
            color="indigo"
          />
          <HeaderBentoCard
            title={t('system.securityLogs', 'Security Audit Trail')}
            subtitle={t('system.securityLogsSubtitle', 'SECURITY AUDIT TRAIL')}
            value={auditLogsCount}
            icon={<FileLock className="w-3.5 h-3.5" />}
            color="rose"
          />
        </div>
      </PageHeader>

      {/* 2. Main Glass Shell Container */}
      <motion.div variants={itemVariants} className="flex flex-col">
        <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl flex flex-col bg-[#0a0b10]/95 backdrop-blur-xl relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-slate-400/40 to-transparent pointer-events-none" />

          {/* Crystal Command & Section Header */}
          <div className="p-5 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center shrink-0 shadow-inner">
                <DatabaseZap className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">
                    {t('system.coreOperationsTitle', 'Core System & Data Control Portal')}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-500/15 border border-slate-500/30 text-slate-300">
                    3 Modules Active
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {t('system.coreOperationsSubtitle', 'CRITICAL OPERATIONS, MASTER EXPORTS & PROTOCOLS')}
                </p>
              </div>
            </div>
          </div>

          {/* The 3 Standardized Action Cards inside the Main Shell */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. FACTORY MASTER RESET CARD */}
            <div className="rounded-2xl p-6 md:p-7 bg-[#120d10]/60 border border-rose-500/25 hover:border-rose-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between relative overflow-hidden group min-h-[420px]">
              <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-[90px] pointer-events-none group-hover:bg-rose-500/15 transition-all duration-700" />
              
              <div>
                {/* Top Badge & Header */}
                <div className="flex items-center justify-between gap-2 mb-5 relative z-10">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    {t('system.resetCard.badge', 'CRITICAL PROTOCOL')}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>

                <div className="mb-4 relative z-10">
                  <h3 className="text-lg font-black text-white uppercase tracking-wide">
                    {t('system.resetCard.title', 'Factory Master Reset')}
                  </h3>
                  <p className="text-xs text-rose-300/80 mt-1.5 font-medium leading-relaxed">
                    {t('system.resetCard.subtitle', 'Wipe all operational data and inject default factory technical standards.')}
                  </p>
                </div>

                {/* Warning Callout Box */}
                <div className="mb-6 bg-black/40 p-3.5 rounded-xl border border-rose-500/20 flex items-start gap-3 relative z-10 shadow-inner">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {t('system.resetCard.warning', 'This action completely purges equipment registries, movements ledger, and parts catalogs. All user additions are cleared to restore manufacturer baseline data.')}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-2 border-t border-rose-500/15">
                <button
                  onClick={() => setShowResetModal(true)}
                  disabled={isWiping}
                  className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold tracking-wider text-xs transition-all shadow-lg hover:shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isWiping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('system.resetCard.btnLoading', 'Wiping data & injecting master seed...')}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>{t('system.resetCard.btn', 'Execute Factory Reset')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. EXPORT REFERENCE SNAPSHOT CARD */}
            <div className="rounded-2xl p-6 md:p-7 bg-[#0b1411]/60 border border-emerald-500/25 hover:border-emerald-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between relative overflow-hidden group min-h-[420px]">
              <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700" />
              
              <div>
                {/* Top Badge & Header */}
                <div className="flex items-center justify-between gap-2 mb-5 relative z-10">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 shadow-sm">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    {t('system.seedCard.badge', 'SNAPSHOT EXPORT')}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                    <DatabaseZap className="w-4 h-4" />
                  </div>
                </div>

                <div className="mb-4 relative z-10">
                  <h3 className="text-lg font-black text-white uppercase tracking-wide">
                    {t('system.seedCard.title', 'Export Reference State')}
                  </h3>
                  <p className="text-xs text-emerald-300/80 mt-1.5 font-medium leading-relaxed">
                    {t('system.seedCard.subtitle', 'Freeze and extract current database structures into standard factory seeder format.')}
                  </p>
                </div>

                {/* Info Callout Box */}
                <div className="mb-6 bg-black/40 p-3.5 rounded-xl border border-emerald-500/20 flex items-start gap-3 relative z-10 shadow-inner">
                  <Download className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {t('system.seedCard.info', 'This utility extracts the current application architecture (machinery, templates, PDR blueprints) as standard JSON for seeder snapshots.')}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-2 border-t border-emerald-500/15">
                <button
                  onClick={handleExportSeed}
                  className="w-full py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-extrabold tracking-wider text-xs transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('system.seedCard.btn', 'Export Reference Snapshot')}</span>
                </button>
              </div>
            </div>

            {/* 3. DATA EXCHANGE REDIRECT CARD */}
            <div className="rounded-2xl p-6 md:p-7 bg-[#0b101d]/60 border border-blue-500/25 hover:border-blue-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between relative overflow-hidden group min-h-[420px]">
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none group-hover:bg-blue-500/15 transition-all duration-700" />
              
              <div>
                {/* Top Badge & Header */}
                <div className="flex items-center justify-between gap-2 mb-5 relative z-10">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center gap-1.5 shadow-sm">
                    <Layers className="w-3 h-3 text-blue-400" />
                    {t('system.exchangeCard.badge', 'DIRECT INTEGRATION')}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                    <HardDrive className="w-4 h-4" />
                  </div>
                </div>

                <div className="mb-4 relative z-10">
                  <h3 className="text-lg font-black text-white uppercase tracking-wide">
                    {t('system.exchangeCard.title', 'Data Exchange Center')}
                  </h3>
                  <p className="text-xs text-blue-300/80 mt-1.5 font-medium leading-relaxed">
                    {t('system.exchangeCard.subtitle', 'Standardized templates for inventory lines, batch imports, and the 999 slots rule.')}
                  </p>
                </div>

                {/* Info Callout Box */}
                <div className="mb-6 bg-black/40 p-3.5 rounded-xl border border-blue-500/20 flex items-start gap-3 relative z-10 shadow-inner">
                  <ArrowRightLeft className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {t('system.exchangeCard.info', 'Access Data Exchange to import and export bulk registries, machinery schemes, and ensure strict sequence compliance.')}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-2 border-t border-blue-500/15">
                <button
                  onClick={handleGoToDataExchange}
                  className="w-full py-3.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-extrabold tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{t('system.exchangeCard.btn', 'Open Data Exchange Portal')}</span>
                </button>
              </div>
            </div>

          </div>
        </GlassCard>
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleWipeAndReseed}
        variant="danger"
        title={t('system.modal.resetTitle', 'Confirm Factory Master Reset')}
        description={t('system.modal.resetDesc', 'CRITICAL WARNING: You are about to permanently wipe all factory assets, inventory records, maintenance operations, and movements ledger, rebuilding the database from default baseline data. This action is irreversible.')}
        confirmText={t('system.modal.confirmBtn', 'Confirm Complete Reset & Rebuild')}
        cancelText={t('system.modal.cancelBtn', 'Cancel')}
        isLoading={isWiping}
        requireVerification="RESET"
      />
    </motion.div>
  );
}
