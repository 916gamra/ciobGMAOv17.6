import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState } from 'react';
import { DatabaseZap, ShieldAlert, RefreshCw, AlertTriangle, ArrowRightLeft, HardDrive, LayoutGrid, Wrench, Factory, FileLock } from 'lucide-react';
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
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

      toast.success('تمت إعادة ضبط النظام بنجاح', {
         description: 'تمت مزامنة كافة العقد الأساسية وإعادة بناء الهياكل بنجاح...',
      });

      setTimeout(() => {
         window.location.reload();
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error('فشل في إعادة ضبط النظام', { description: 'فشلت عملية مسح البيانات وإعادة الضبط الشامل.' });
      setIsWiping(false);
    }
  };

  const handleGoToDataExchange = () => {
    openTab({ id: 'data-exchange', portalId: 'SETTINGS', title: 'مركز تبادل البيانات', component: 'data-exchange' });
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
      
      toast.success('تم تصدير الحالة المرجعية', {
         description: 'يرجى مراجعة كونسول المتصفح لنسخ كود JSON الجديد لقاعدة البيانات.'
      });
    } catch (err) {
      console.error(err);
      toast.error('فشل تصدير البيانات');
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 lg:px-8 pt-2 font-sans"
    >
      <PageHeader
        title={t('system.title', 'Data Management & System Settings')}
        subtitle={t('system.subtitle', 'Major architectural standards for factory assets, security protocols, and comprehensive industrial resets.')}
        icon={<DatabaseZap className="w-7 h-7 text-rose-500" />}
        badgeText={t('system.badge', 'Data Management')}
        badgeColor="rose"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={t('system.sparePartsCatalog', 'Spare Parts Catalog')}
            subtitle="TOTAL BLUEPRINTS"
            value={blueprintsCount}
            icon={<LayoutGrid className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title={t('system.inventoryUnits', 'Inventory Items')}
            subtitle="TOTAL INVENTORY ITEMS"
            value={partsCount}
            icon={<Wrench className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title={t('system.equipmentMachinery', 'Machinery & Equipment')}
            subtitle="REGISTERED EQUIPMENT"
            value={machinesCount}
            icon={<Factory className="w-3.5 h-3.5" />}
            color="purple"
          />
          <HeaderBentoCard
            title={t('system.securityLogs', 'Security Audit Trail')}
            subtitle="SECURITY AUDIT TRAIL"
            value={auditLogsCount}
            icon={<FileLock className="w-3.5 h-3.5" />}
            color="rose"
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* FACTORY DATA RESET CARD */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8 border border-red-500/20 bg-red-950/20 flex flex-col relative overflow-hidden group hover:border-red-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl h-[380px]">
             <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-red-500/20 transition-all duration-1000" />
             
             <div className="flex items-start gap-5 mb-6 relative z-10">
                <div className="p-4 rounded-2xl bg-[#0a0a0f]/40 border border-red-500/20 shadow-inner">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wide">إعادة ضبط المصنع الشاملة</h3>
                   <p className="text-sm text-red-400/80 mt-2 font-medium">
                     مسح شامل لكافة البيانات التشغيلية وحقن المعايير الفنية الأساسية للمصنع.
                   </p>
                </div>
             </div>
             
             <div className="mt-4 mb-6 bg-[#0a0a0f]/40 p-4 rounded-xl border border-red-500/20 flex items-start gap-3 relative z-10">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  سيقوم هذا الإجراء الفني بتهيئة سجل الآلات، وحركات الصرف، وكتالوج قطع الغيار تماماً. سيتم فقدان كافة البيانات المضافة وتصفير الأرصدة للعودة للقيم الافتراضية.
                </p>
             </div>

             <div className="mt-auto relative z-10">
                 <button
                    onClick={() => setShowResetModal(true)}
                    disabled={isWiping}
                    className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold tracking-widest text-xs transition-all shadow-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden"
                  >
                    {isWiping ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري مسح البيانات وحقن الأساسيات...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>تنفيذ إعادة الضبط للمصنع</span>
                      </>
                    )}
                 </button>
             </div>
          </GlassCard>
        </motion.div>

        {/* EXPORT TO SEED CARD */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8 border border-emerald-500/20 bg-emerald-950/10 flex flex-col relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl h-[380px]">
             <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.05] rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-1000" />
             
             <div className="flex items-start gap-5 mb-6 relative z-10">
                <div className="p-4 rounded-2xl bg-[#0a0a0f]/40 border border-emerald-500/20 shadow-inner">
                  <DatabaseZap className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wide">تصدير الحالة المرجعية</h3>
                   <p className="text-sm text-emerald-400/80 mt-2 font-medium">
                     تجميد وحفظ الحالة الحالية لقاعدة البيانات لتكون النظام الأساسي المصنعي.
                   </p>
                </div>
             </div>
             
             <div className="mt-4 mb-6 bg-[#0a0a0f]/40 p-4 rounded-xl border border-emerald-500/20 flex items-start gap-3 relative z-10">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  يقوم هذا المعالج باستخراج الهيكل الحالي للتطبيق (الآلات، القوالب، مخططات قطع الغيار) كملف JSON لنسخه وتجميده داخل ملف التهيئة والـ Database Seeder.
                </p>
             </div>

             <div className="mt-auto relative z-10">
                <button
                  onClick={handleExportSeed}
                  className="w-full py-4 rounded-xl bg-[#0a0a0f]/60 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-extrabold tracking-widest text-xs transition-all shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                >
                  <DatabaseZap className="w-4 h-4" />
                  <span>تصدير الحالة المرجعية للكونسول</span>
                </button>
             </div>
          </GlassCard>
        </motion.div>

        {/* DATA EXCHANGE REDIRECT CARD */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8 border border-blue-500/20 bg-blue-950/10 flex flex-col relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl h-[380px]">
             <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/[0.05] rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-1000" />
             
             <div className="flex items-start gap-5 mb-6 relative z-10">
                <div className="p-4 rounded-2xl bg-[#0a0a0f]/40 border border-blue-500/20 shadow-inner">
                  <HardDrive className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wide">مركز تبادل البيانات الشامل</h3>
                   <p className="text-sm text-blue-400/80 mt-2 font-medium">
                     القوالب المعيارية المعتمدة لخطوط الجرد وقانون الـ 999 مقعد.
                   </p>
                </div>
             </div>
             
             <div className="mt-4 mb-6 bg-[#0a0a0f]/40 p-4 rounded-xl border border-blue-500/20 flex items-start gap-3 relative z-10">
                <ArrowRightLeft className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  نستخدم مركز تبادل البيانات لاستيراد وتصدير حزم السجلات الضخمة وصيانة الآلات والتأكد من عدم الإخلال بهياكل الترقيم المتسلسلة لقطع الغيار.
                </p>
             </div>

             <div className="mt-auto relative z-10">
                <button
                  onClick={handleGoToDataExchange}
                  className="w-full py-4 rounded-xl bg-[#0a0a0f]/60 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 font-extrabold tracking-widest text-xs transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>فتح مركز تبادل البيانات</span>
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
        title="تأكيد إعادة التهيئة الشاملة"
        description="تنبيه هام جداً: أنت على وشك مسح كافة أصول المصنع، بيانات المخزون، سجلات عمليات الصيانة وحركات الصرف نهائياً وإعادة بناء قاعدة البيانات من الصفر بحسب المعايير الافتراضية للشركة المصنعة. لا يمكن التراجع عن هذا الإجراء."
        confirmText="تأكيد الحذف الشامل وإعادة البناء"
        cancelText="إلغاء و تراجع"
        isLoading={isWiping}
        requireVerification="RESET"
      />
    </motion.div>
  );
}
