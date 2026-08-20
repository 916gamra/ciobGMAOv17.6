import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  HardDriveDownload, 
  HardDriveUpload, 
  RefreshCw, 
  ShieldCheck, 
  Terminal, 
  Disc, 
  AlertTriangle, 
  FileJson, 
  CheckCircle2,
  Lock,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';
import { db, User } from '@/core/db';
import { useAuditTrail } from '@/features/system/hooks/useAuditTrail';
import { toast } from 'sonner';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function DataCoreView({ user }: { user?: User | null }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [dbStats, setDbStats] = useState({ tables: 0, rows: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progressData, setProgressData] = useState({ completed: 0, total: 0 });
  const { logEvent } = useAuditTrail();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    try {
      const tables = db.tables;
      let totalRows = 0;
      for (const table of tables) {
        totalRows += await table.count();
      }
      setDbStats({ tables: tables.length, rows: totalRows });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setProgressData({ completed: 0, total: 1 });
    try {
      const blob = await (db as any).export({
        progressCallback: (progress: any) => {
          setProgressData({ completed: progress.completedRows, total: progress.totalRows });
          return true;
        }
      });

      const fileName = `BDR_Nexus_Vault_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);

      await logEvent({
        userId: user?.id || 'system',
        userName: user?.name || 'Guest User',
        action: 'EXPORT',
        entityType: 'DATABASE',
        entityId: 'SYSTEM',
        details: `System snapshot exported: ${fileName}`,
        severity: 'INFO'
      });

      toast.success(isAr ? 'تم تصدير النسخة الاحتياطية بنجاح' : 'Backup Created', {
        description: isAr ? 'تم حفظ كافة سجلات وإعدادات النظام في ملف مشفر' : 'Database state captured and downloaded.',
        icon: <ShieldCheck className="text-emerald-400" />
      });

    } catch (error) {
      console.error(error);
      toast.error(isAr ? 'فشل تصدير النسخة الاحتياطية' : 'Backup Failed', {
        description: isAr ? 'حدث خطأ أثناء استخراج البيانات' : 'An error occurred during database extraction.'
      });
    } finally {
      setIsExporting(false);
      setProgressData({ completed: 0, total: 0 });
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      isAr 
        ? "تحذير أمني: استعادة قاعدة البيانات ستستبدل كافة السجلات والبيانات الحالية في النظام بالكامل. هل ترغب في المتابعة؟"
        : "CRITICAL WARNING: Importing a database backup will overwrite ALL current system data. Are you sure you want to proceed?"
    );

    if (!confirmRestore) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    const fileName = file.name;

    try {
      await (db as any).import(file, {
        progressCallback: (progress: any) => {
          setProgressData({ completed: progress.completedRows, total: progress.totalRows });
          return true;
        },
        overwriteValues: true,
        clearTablesBeforeImport: true
      });

      await logEvent({
        userId: user?.id || 'system',
        userName: user?.name || 'Guest User',
        action: 'IMPORT',
        entityType: 'DATABASE',
        entityId: 'SYSTEM',
        details: `System state overwritten by imported file: ${fileName}`,
        severity: 'CRITICAL'
      });

      toast.success(isAr ? 'اكتملت الاستعادة بنجاح' : 'Restore Complete', {
        description: isAr ? 'تمت استعادة حالة النظام. سيتم إعادة تحميل التطبيق تلقائياً.' : 'Database state restored. Reloading application.',
        icon: <ShieldCheck className="text-emerald-400" />
      });
      
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (error) {
      console.error(error);
      toast.error(isAr ? 'فشلت استعادة البيانات' : 'Restore Failed', {
         description: isAr ? 'ملف النسخة الاحتياطية غير صالح أو تالف' : 'The backup file is invalid or corrupted.'
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const progressPercentage = progressData.total > 0 ? Math.round((progressData.completed / progressData.total) * 100) : 0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-8 pb-12 pt-2 px-4 md:px-0 lg:px-8"
    >
      <PageHeader
        title={isAr ? "النسخ الاحتياطي واستعادة البيانات" : "Database Backup & Recovery"}
        subtitle={isAr ? "الحفظ الدوري لسجلات النظام، استخراج اللقطات المشفرة، وإدارة خطط الاستعادة للكوارث." : "System Data Preservation, Core Vault Snapshots, and Cold Storage Archives."}
        icon={<HardDriveDownload className="w-7 h-7 text-slate-300" />}
        badgeText={isAr ? "النسخ الاحتياطي" : "Disaster Recovery"}
        badgeColor="slate"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={isAr ? "جداول النظام" : "Database Tables"}
            subtitle="ACTIVE TABLES"
            value={dbStats.tables}
            icon={<Terminal className="w-3.5 h-3.5" />}
            color="slate"
          />
          <HeaderBentoCard
            title={isAr ? "إجمالي السجلات" : "Stored Records"}
            subtitle="TOTAL ROWS"
            value={dbStats.rows.toLocaleString()}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title={isAr ? "محرك التخزين" : "Storage Engine"}
            subtitle="PERSISTENCE MODE"
            value="IndexedDB"
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title={isAr ? "حالة الأمان" : "System Security"}
            subtitle="ENCRYPTION STATUS"
            value={isAr ? "نشط وآمن" : "Online / Secure"}
            icon={<Disc className="w-3.5 h-3.5" />}
            color="cyan"
          />
        </div>
      </PageHeader>

      {/* Stats Terminal */}
      <motion.div variants={itemVariants}>
        <div className="p-0 overflow-hidden bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl">
          <div className="p-3.5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
             <div className="flex items-center gap-2.5">
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
               <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                 {isAr ? "حالة التخزين المحلي: نشط ومتصل" : "Local Storage Engine: Online & Synced"}
               </span>
             </div>
             <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
               ACID Compliant
             </span>
          </div>
          <div className="p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
             <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{isAr ? "عدد الجداول" : "Tables"}</div>
                <div className="text-2xl font-bold font-mono text-white">{dbStats.tables}</div>
             </div>
             <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{isAr ? "عدد الصفوف" : "Records"}</div>
                <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
                  {dbStats.rows.toLocaleString()}
                </div>
             </div>
             <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{isAr ? "نمط الحفظ" : "Storage Mode"}</div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-tight mt-1 bg-emerald-500/10 px-2.5 py-1 rounded w-fit border border-emerald-500/20">
                  Local IndexedDB
                </div>
             </div>
             <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{isAr ? "درجة التشفير" : "Encryption"}</div>
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-tight mt-1 bg-cyan-500/10 px-2.5 py-1 rounded w-fit border border-cyan-500/20">
                  AES-GCM / SHA-256
                </div>
             </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backup Card */}
        <motion.div variants={itemVariants}>
          <div className="p-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all shadow-xl flex flex-col justify-between h-[360px] relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:border-white/20 transition-all">
                 <ArrowDownToLine className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2 tracking-tight">
                {isAr ? "تصدير نسخة احتياطية كاملة" : "DATABASE EXPORT"}
              </h2>
              <p className="text-slate-400 leading-relaxed text-xs">
                {isAr 
                  ? "توليد ملف شامل لكافة جداول البيانات، المخططات، السجلات، والمستخدمين بصيغة JSON قابلة للاستعادة."
                  : "Generate a full system backup containing all records and configurations in encrypted JSON format."}
              </p>
            </div>

            <div className="relative z-10">
               <AnimatePresence>
                 {isExporting && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                      <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                         <span>{isAr ? "نسبة المعالجة" : "Extraction Progress"}</span>
                         <span className="font-mono">{progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/10 shadow-inner">
                        <motion.div 
                          className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ ease: "linear", duration: 0.2 }}
                        />
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <button
                  onClick={handleExport}
                  disabled={isExporting || isImporting}
                  className="w-full py-3 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isAr ? "جاري التصدير..." : "SYNCHRONIZING..."}</span>
                    </>
                  ) : (
                    <>
                      <FileJson className="w-4 h-4" />
                      <span>{isAr ? "تحميل النسخة الاحتياطية" : "DOWNLOAD BACKUP"}</span>
                    </>
                  )}
               </button>
            </div>
          </div>
        </motion.div>

        {/* Restore Card */}
        <motion.div variants={itemVariants}>
          <div className="p-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all shadow-xl flex flex-col justify-between h-[360px] relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:border-amber-500/30 transition-all">
                 <ArrowUpFromLine className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2 tracking-tight">
                {isAr ? "استعادة قاعدة البيانات" : "DATABASE RESTORE"}
              </h2>
              <p className="text-slate-400 leading-relaxed text-xs">
                {isAr 
                  ? "استعادة حالة النظام من ملف نسخة احتياطية سابق. تنبيه: سيتم استبدال البيانات الحالية بالكامل."
                  : "Restore database from backup file. Warning: This action will completely overwrite all existing data."}
              </p>
            </div>

            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />

            <div className="relative z-10">
               <AnimatePresence>
                 {isImporting && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                      <div className="flex justify-between text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                         <span>{isAr ? "نسبة الاستعادة" : "Injection Flux"}</span>
                         <span className="font-mono">{progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/10 shadow-inner">
                        <motion.div 
                          className="h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ ease: "linear", duration: 0.2 }}
                        />
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>

              <button
                onClick={handleImportClick}
                disabled={isImporting || isExporting}
                className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-amber-500/30 text-amber-300 font-bold text-xs transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{isAr ? "جاري استعادة البيانات..." : "RESTORING DATABASE..."}</span>
                  </>
                ) : (
                  <>
                    <HardDriveUpload className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? "رفع ملف الاستعادة" : "UPLOAD BACKUP FILE"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
