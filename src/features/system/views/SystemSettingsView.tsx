import { PageHeader } from "@/shared/components/PageHeader";
import React, { useState } from 'react';
import { DatabaseZap, ShieldAlert, RefreshCw, AlertTriangle, ArrowRightLeft, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { db, User } from '@/core/db';
import { motion, Variants } from 'motion/react';
import { useAuditTrail } from '../hooks/useAuditTrail';
import { runDatabaseSeed } from '@/core/db/useDatabaseSeeder';
import { GlassCard } from '@/shared/components/GlassCard';
import { useTabStore } from '@/app/store';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function SystemSettingsView({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const { logEvent } = useAuditTrail();
  const [isWiping, setIsWiping] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { openTab } = useTabStore();

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

      toast.success('Nuclear Reset Complete', {
         description: 'All nodes synchronized. System is rebooting...',
      });

      setTimeout(() => {
         window.location.reload();
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error('System Failure', { description: 'Failed to complete the factory reset.' });
      setIsWiping(false);
    }
  };

  const handleGoToDataExchange = () => {
    openTab({ id: 'data-exchange', portalId: 'SETTINGS', title: 'Data Exchange Hub', component: 'data-exchange' });
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
      
      console.log('=== NUCLEAR SEED DATA JSON ===');
      console.log(JSON.stringify(seedData, null, 2));
      console.log('==============================');
      
      toast.success('Seed State Exported', {
         description: 'Check browser console. Copy JSON and freeze into seedData.ts'
      });
    } catch (err) {
      console.error(err);
      toast.error('Export Failed');
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 lg:px-8 pt-2"
    >
      <PageHeader
        title="Master Data Administration"
        subtitle="Core parameters, strict industrial resets, and baseline state management protocols."
        icon={<DatabaseZap className="w-6 h-6 text-rose-500" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* FACTORY DATA RESET CARD */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8 border border-red-500/20 bg-red-950/20 flex flex-col relative overflow-hidden group hover:border-red-500/40 transition-colors transition-shadow shadow-xl hover:shadow-2xl h-[360px]">
             <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-red-500/20 transition-all duration-1000" />
             
             <div className="flex items-start gap-5 mb-6 relative z-10">
                <div className="p-4 rounded-2xl bg-[#0a0a0f]/40 border border-red-500/20 shadow-inner">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wide">Factory Data Reset</h3>
                   <p className="text-sm text-red-400/80 mt-2 font-medium">
                     Purge all operational data and inject baseline industrial parameters.
                   </p>
                </div>
             </div>
             
             <div className="mt-4 mb-6 bg-[#0a0a0f]/40 p-4 rounded-xl border border-red-500/20 flex items-start gap-3 relative z-10">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  This maintenance protocol will format the equipment registry, personnel records, and inventory stocks. 
                  All custom modifications will be lost and reverted to default limits.
                </p>
             </div>

             <div className="mt-auto relative z-10">
                <button
                   onClick={() => setShowResetModal(true)}
                   disabled={isWiping}
                   className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden"
                 >
                   {isWiping ? (
                     <>
                       <RefreshCw className="w-4 h-4 animate-spin" />
                       <span>PURGING OPERATIONAL DATA...</span>
                     </>
                   ) : (
                     <>
                       <RefreshCw className="w-4 h-4" />
                       <span>EXECUTE FACTORY RESET</span>
                     </>
                   )}
                </button>
             </div>
          </GlassCard>
        </motion.div>

        {/* EXPORT TO SEED CARD */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8 border border-emerald-500/20 bg-emerald-950/10 flex flex-col relative overflow-hidden group hover:border-emerald-500/40 transition-colors transition-shadow shadow-xl hover:shadow-2xl h-[360px]">
             <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.05] rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-1000" />
             
             <div className="flex items-start gap-5 mb-6 relative z-10">
                <div className="p-4 rounded-2xl bg-[#0a0a0f]/40 border border-emerald-500/20 shadow-inner">
                  <DatabaseZap className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wide">Export to Seed</h3>
                   <p className="text-sm text-emerald-400/80 mt-2 font-medium">
                     Freeze current database state as system baseline.
                   </p>
                </div>
             </div>
             
             <div className="mt-4 mb-6 bg-[#0a0a0f]/40 p-4 rounded-xl border border-emerald-500/20 flex items-start gap-3 relative z-10">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  This tool extracts the entire current state of the application (Machines, Models, Stock) as JSON to the console. Copy it into `seedData.ts` to make it the default nuclear state.
                </p>
             </div>

             <div className="mt-auto relative z-10">
               <button
                 onClick={handleExportSeed}
                 className="w-full py-4 rounded-xl bg-[#0a0a0f]/60 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 relative overflow-hidden group/btn"
               >
                 <DatabaseZap className="w-4 h-4" />
                 <span>EXPORT SEED TO CONSOLE</span>
               </button>
             </div>
          </GlassCard>
        </motion.div>

        {/* DATA EXCHANGE REDIRECT CARD */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8 border border-blue-500/20 bg-blue-950/10 flex flex-col relative overflow-hidden group hover:border-blue-500/40 transition-colors transition-shadow shadow-xl hover:shadow-2xl h-[360px]">
             <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/[0.05] rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-1000" />
             
             <div className="flex items-start gap-5 mb-6 relative z-10">
                <div className="p-4 rounded-2xl bg-[#0a0a0f]/40 border border-blue-500/20 shadow-inner">
                  <HardDrive className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wide">Data Exchange Hub</h3>
                   <p className="text-sm text-blue-400/80 mt-2 font-medium">
                     Standardized templates & strict injection framework.
                   </p>
                </div>
             </div>
             
             <div className="mt-4 mb-6 bg-[#0a0a0f]/40 p-4 rounded-xl border border-blue-500/20 flex items-start gap-3 relative z-10">
                <ArrowRightLeft className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  We use the specialized Data Exchange Hub for importing and exporting massive data logs, factory schemas, and stock limits safely. 
                  Direct CSV manual uploads are restricted to maintain architectural integrity.
                </p>
             </div>

             <div className="mt-auto relative z-10">
               <button
                 onClick={handleGoToDataExchange}
                 className="w-full py-4 rounded-xl bg-[#0a0a0f]/60 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] flex items-center justify-center gap-3 relative overflow-hidden group/btn"
               >
                 <ArrowRightLeft className="w-4 h-4" />
                 <span>OPEN DATA EXCHANGE HUB</span>
               </button>
             </div>
          </GlassCard>
        </motion.div>

      </div>

      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleWipeAndReseed}
        variant="danger"
        title="Nuclear Reset Initiated"
        description="Attention: You are about to perform a Factory Data Reset. This will permanently wipe all machines, technicians, and operational logs, reverting the system to its baseline genetic state. This action cannot be undone."
        confirmText="Execute Nuclear Wipe"
        cancelText="Abort Mission"
        isLoading={isWiping}
        requireVerification="RESET"
      />
    </motion.div>
  );
}
