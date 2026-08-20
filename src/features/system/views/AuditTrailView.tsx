import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import { GlassCard } from '@/shared/components/GlassCard';
import { useAuditTrail } from '../hooks/useAuditTrail';
import { runOfflinePerformanceBenchmark } from '@/core/utils/perfBenchmark';
import { 
  Trash2, 
  Calendar, 
  Activity, 
  Info, 
  AlertTriangle, 
  AlertOctagon,
  Download,
  RefreshCw,
  Eye,
  LayoutGrid,
  Shield,
  User,
  Terminal,
  Copy,
  CheckCircle2,
  X,
  FileText,
  Clock,
  Layers,
  Search,
  Zap
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { EmptyState } from '@/shared/components/EmptyState';
import { UnifiedSearchFilter, FilterGroup, QuickTabOption } from '@/shared/components/UnifiedSearchFilter';
import { toast } from 'sonner';
import { AuditLog } from '@/core/db';
import { useTranslation } from 'react-i18next';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function AuditTrailView() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { logs, clearLogs, verifyAuditIntegrity } = useAuditTrail();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await runOfflinePerformanceBenchmark();
      if (res.overallPassSla) {
        toast.success(
          isAr 
            ? `اختبار الأداء ممتاز: استجابة الاستعلام ${res.readAllMachinesMs} ميلي ثانية فقط!`
            : `Performance SLA Pass: Query responded in ${res.readAllMachinesMs}ms!`, 
          { duration: 4000 }
        );
      } else {
        toast.warning(
          isAr ? 'اختبار الأداء أظهر تباطؤاً في بعض الاستعلامات.' : 'Performance benchmark detected queries above SLA threshold.', 
          { duration: 4000 }
        );
      }
    } catch {
      toast.error(isAr ? 'فشل تشغيل اختبار قياس الأداء' : 'Benchmark failed');
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyAuditIntegrity();
      if (res.isValid) {
        toast.success(
          isAr 
            ? `تم التحقق بنجاح من سلامة ${res.totalChecked} سجل. سلسلة التوقيع الرقمي سليمة تماماً.`
            : `Verified ${res.totalChecked} audit records successfully. SHA-256 Hash chain intact.`, 
          { duration: 4000 }
        );
      } else {
        toast.error(
          isAr 
            ? `تحذير أمني: تم رصد ${res.tamperedLogIds.length} سجل غير متطابق!`
            : `Security Alert: Detected ${res.tamperedLogIds.length} mismatched records!`, 
          { duration: 5000 }
        );
      }
    } catch (err) {
      toast.error(isAr ? 'فشل إجراء فحص سلامة التوقيعات الرقمية' : 'Integrity verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Quick statistics
  const criticalCount = useMemo(() => logs.filter(l => l.severity === 'CRITICAL').length, [logs]);
  const warningCount = useMemo(() => logs.filter(l => l.severity === 'WARNING').length, [logs]);
  const infoCount = useMemo(() => logs.filter(l => l.severity === 'INFO' || !l.severity).length, [logs]);

  // Unique entities for filter dropdown
  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.entityType) set.add(l.entityType);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtering
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        log.userName?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.entityType?.toLowerCase().includes(searchLower) ||
        log.entityId?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.id?.toLowerCase().includes(searchLower);
      
      const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
      const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
      
      return matchesSearch && matchesSeverity && matchesEntity;
    });
  }, [logs, searchTerm, severityFilter, entityFilter]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(isAr ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportLogsAsCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error(isAr ? 'لا توجد سجلات لتصديرها' : 'No logs to export');
      return;
    }
    const headers = ['Log ID', 'Timestamp', 'Operator', 'Action', 'Entity Type', 'Entity ID', 'Severity', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      l.userName,
      l.action,
      l.entityType,
      l.entityId,
      l.severity || 'INFO',
      (l.details || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bdr_audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(isAr ? 'تم تصدير ملف السجلات بنجاح' : 'CSV Export Complete');
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/15 text-[10px] uppercase text-rose-300 font-extrabold tracking-wider whitespace-nowrap shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            {isAr ? 'حرج' : 'CRITICAL'}
          </span>
        );
      case 'WARNING': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/15 text-[10px] uppercase text-amber-300 font-extrabold tracking-wider whitespace-nowrap shadow-sm">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            {isAr ? 'تحذير' : 'WARNING'}
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/15 text-[10px] uppercase text-cyan-300 font-extrabold tracking-wider whitespace-nowrap shadow-sm">
            <Info className="w-3 h-3 text-cyan-400" />
            {isAr ? 'معلوماتي' : 'INFO'}
          </span>
        );
    }
  };

  const getActionBadgeColor = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('DELETE') || act.includes('PURGE') || act.includes('DROP')) {
      return 'bg-rose-500/10 border-rose-500/25 text-rose-300';
    }
    if (act.includes('CREATE') || act.includes('INSERT') || act.includes('ADD')) {
      return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300';
    }
    if (act.includes('UPDATE') || act.includes('MODIFY') || act.includes('EDIT')) {
      return 'bg-amber-500/10 border-amber-500/25 text-amber-300';
    }
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('SESSION')) {
      return 'bg-sky-500/10 border-sky-500/25 text-sky-300';
    }
    return 'bg-white/5 border-white/10 text-slate-300';
  };

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'severity',
      label: isAr ? 'مستوى الأهمية' : 'Severity Level',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      value: severityFilter,
      onChange: setSeverityFilter,
      allLabel: isAr ? 'جميع المستويات' : 'All Severities',
      allValue: 'ALL',
      options: [
        { value: 'CRITICAL', label: isAr ? 'تنبيهات حرجة' : 'Critical Alerts', count: criticalCount, badgeColor: 'rose' },
        { value: 'WARNING', label: isAr ? 'تحذيرات أمنية' : 'Warnings', count: warningCount, badgeColor: 'amber' },
        { value: 'INFO', label: isAr ? 'معلومات عامة' : 'General Info', count: infoCount, badgeColor: 'cyan' },
      ]
    },
    {
      id: 'entity',
      label: isAr ? 'نوع الكيان' : 'Target Entity',
      icon: <Layers className="w-3.5 h-3.5" />,
      value: entityFilter,
      onChange: setEntityFilter,
      allLabel: isAr ? 'جميع الكيانات' : 'All Entities',
      allValue: 'ALL',
      options: entityTypes.map(type => ({
        value: type,
        label: type,
        count: logs.filter(l => l.entityType === type).length,
        badgeColor: 'slate'
      }))
    }
  ], [severityFilter, entityFilter, criticalCount, warningCount, infoCount, entityTypes, logs, isAr]);

  const quickTabs: QuickTabOption[] = useMemo(() => [
    { id: 'ALL', label: isAr ? 'كافة السجلات' : 'All Logs', count: logs.length, color: 'indigo' },
    { id: 'CRITICAL', label: isAr ? 'حرج' : 'Critical', count: criticalCount, color: 'rose' },
    { id: 'WARNING', label: isAr ? 'تحذيرات' : 'Warnings', count: warningCount, color: 'amber' },
    { id: 'INFO', label: isAr ? 'معلومات' : 'Info', count: infoCount, color: 'cyan' },
  ], [logs.length, criticalCount, warningCount, infoCount, isAr]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 pt-2 w-full lg:px-8"
    >
      {/* 1. Page Header with Bento Cards */}
      <PageHeader
        title={isAr ? "سجل التدقيق الشامل والتحقق الرقمي" : "System Audit Trail & Cryptographic Ledger"}
        subtitle={isAr ? "سجل رقمي غير قابل للتعديل يوثق كافة العمليات الحساسة، حركات البيانات، والتحقق المشفر من سلامة الهوية." : "Immutable cryptographic log of critical system operations, transactional data changes, and user activities."}
        icon={<RefreshCw className="w-7 h-7 text-slate-300" />}
        badgeText={isAr ? "سجل التدقيق" : "Audit & Compliance"}
        badgeColor="slate"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button 
               onClick={handleRunBenchmark}
               disabled={isBenchmarking}
               className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-3.5 py-2 text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isBenchmarking ? (isAr ? 'جاري القياس...' : 'Testing...') : (isAr ? 'قياس كفاءة الأداء' : 'Benchmark SLA')}</span>
            </button>
            <button 
               onClick={handleVerifyIntegrity}
               disabled={isVerifying}
               className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-3.5 py-2 text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Shield className="w-4 h-4 text-sky-400" /> 
              <span>{isVerifying ? (isAr ? 'جاري التحقق...' : 'Verifying...') : (isAr ? 'فحص سلامة التوقيعات' : 'Verify Integrity')}</span>
            </button>
            <button 
               onClick={exportLogsAsCSV}
               className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2 text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> {isAr ? "تصدير السجلات" : "Export CSV"}
            </button>
            <button 
               onClick={clearLogs}
               className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 font-bold rounded-xl px-3.5 py-2 text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> {isAr ? "مسح السجلات" : "Clear"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={isAr ? "إجمالي العمليات" : "Total Events"}
            subtitle="REGISTERED LOGS"
            value={logs.length}
            icon={<Activity className="w-3.5 h-3.5" />}
            color="slate"
          />
          <HeaderBentoCard
            title={isAr ? "تنبيهات حرجة" : "Critical Alerts"}
            subtitle="HIGH SEVERITY"
            value={criticalCount}
            icon={<AlertOctagon className="w-3.5 h-3.5" />}
            color="rose"
          />
          <HeaderBentoCard
            title={isAr ? "تحذيرات أمنية" : "System Warnings"}
            subtitle="MEDIUM SEVERITY"
            value={warningCount}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            color="amber"
          />
          <HeaderBentoCard
            title={isAr ? "سجلات معلوماتية" : "Information Logs"}
            subtitle="STANDARD STREAM"
            value={infoCount}
            icon={<Info className="w-3.5 h-3.5" />}
            color="cyan"
          />
        </div>
      </PageHeader>

      {/* 2. Universal Crystal Table Container */}
      <motion.div variants={itemVariants} className="flex flex-col">
        <div className="border border-white/10 overflow-hidden shadow-2xl rounded-2xl flex flex-col bg-slate-900/60 backdrop-blur-xl relative">

          {/* Command Bar */}
          <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
            {/* Context Count */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                <Activity className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">
                    {isAr ? "سجل التدقيق المؤسسي" : "Enterprise Audit Ledger"}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-slate-200">
                    {filteredLogs.length} / {logs.length} {isAr ? 'سجل' : 'logs'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? "سلسلة موثوقة ومحمية بتوقيع مشفر" : "Cryptographic Audit Ledger & Compliance"}
                </p>
              </div>
            </div>

            {/* Central Unified Search & Filter with View Switcher */}
            <div className="flex-1 max-w-3xl w-full">
              <UnifiedSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={isAr ? "البحث في السجلات، المستخدمين، العمليات، المعرفات..." : "Search in logs, operators, actions, payloads..."}
                filterGroups={filterGroups}
                quickTabs={quickTabs}
                activeQuickTab={severityFilter}
                onQuickTabChange={setSeverityFilter}
                themeColor="white"
                extraControls={
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDisplayMode('table')}
                        className={cn(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          displayMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                        )}
                        title={isAr ? "عرض الجدول" : "Table View"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayMode('cards')}
                        className={cn(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          displayMode === 'cards' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                        )}
                        title={isAr ? "عرض البطاقات" : "Cards View"}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Body Content: Table or Cards */}
          {filteredLogs.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                icon={Activity}
                title={isAr ? "لم يتم العثور على سجلات مطابقة" : "No matching logs found"}
                description={isAr ? "لا توجد عمليات مسجلة تطابق معايير البحث أو التصفية الحالية." : "No audit events match your current filter criteria."}
                color="slate"
                className="py-16"
              />
            </div>
          ) : displayMode === 'table' ? (
            /* Standard Crystal High-Contrast Table */
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-[350px]">
              <table className="w-full text-start border-collapse">
                <thead className="bg-slate-950/80 border-b border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
                  <tr>
                    <th className="py-3.5 px-6 text-start font-extrabold">{isAr ? "التوقيت الزمني" : "Timestamp"}</th>
                    <th className="py-3.5 px-6 text-start font-extrabold">{isAr ? "المشغل" : "Operator"}</th>
                    <th className="py-3.5 px-6 text-start font-extrabold">{isAr ? "العملية" : "Action"}</th>
                    <th className="py-3.5 px-6 text-start font-extrabold">{isAr ? "الكيان المستهدف" : "Target Entity"}</th>
                    <th className="py-3.5 px-6 text-center font-extrabold">{isAr ? "مستوى الأهمية" : "Severity"}</th>
                    <th className="py-3.5 px-6 text-start font-extrabold">{isAr ? "تفاصيل العملية" : "Details"}</th>
                    <th className="py-3.5 px-6 text-center font-extrabold">{isAr ? "معاينة" : "Inspect"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  <AnimatePresence mode="popLayout">
                    {filteredLogs.map((log, idx) => (
                      <motion.tr 
                        key={log.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(idx * 0.005, 0.15) }}
                        onClick={() => setSelectedLog(log)}
                        className={cn(
                          "transition-colors duration-150 group text-start cursor-pointer",
                          idx % 2 === 0 ? "bg-white/[0.01]" : "bg-white/[0.03]",
                          "hover:bg-white/[0.06] hover:text-white"
                        )}
                      >
                        {/* 1. Timestamp */}
                        <td className="py-3.5 px-6 font-mono whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-300 group-hover:text-white transition-colors">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-bold">
                              {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        {/* 2. Operator Identity */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-slate-800 border border-white/10 shadow-inner">
                              {(log.userName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-white text-xs tracking-tight group-hover:text-slate-100 transition-colors">
                                {log.userName || 'System'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {String(log.userId || 'SYS').substring(0, 10)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Action */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider border shadow-sm",
                            getActionBadgeColor(log.action)
                          )}>
                            {log.action}
                          </span>
                        </td>

                        {/* 4. Target Entity */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-bold text-[11px]">
                              {log.entityType}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              #{String(log.entityId || '').substring(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </td>

                        {/* 5. Severity */}
                        <td className="py-3.5 px-6 text-center whitespace-nowrap">
                          {getSeverityBadge(log.severity)}
                        </td>

                        {/* 6. Details */}
                        <td className="py-3.5 px-6 max-w-md">
                          <div className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate font-sans">
                            {log.details || 'No additional payload provided.'}
                          </div>
                        </td>

                        {/* 7. Inspect Action */}
                        <td className="py-3.5 px-6 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer"
                            title={isAr ? "معاينة السجل وتفاصيل الحزمة" : "Inspect Log Details"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLogs.map(log => (
                <div 
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="group relative p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 transition-all shadow-lg cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border",
                        getActionBadgeColor(log.action)
                      )}>
                        {log.action}
                      </span>
                      {getSeverityBadge(log.severity)}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white bg-slate-800 border border-white/10 shadow-inner">
                        {(log.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-extrabold text-white text-xs">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">[{log.entityType}]</span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono mb-4">
                      {log.details || 'No details'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString([], { hour12: false })}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1"
                    >
                      {isAr ? "معاينة" : "Inspect"} <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* 3. Log Detail Inspector Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <Shield className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      {isAr ? "معاينة السجل الأمني الرقمي" : "Cryptographic Audit Log Inspection"}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</span>
                      <button 
                        onClick={() => handleCopy(selectedLog.id, 'id')}
                        className="text-slate-400 hover:text-white transition-colors"
                        title={isAr ? "نسخ المعرف" : "Copy ID"}
                      >
                        {copiedId === 'id' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{isAr ? "المشغل" : "Operator"}</span>
                  <span className="text-xs font-black text-white">{selectedLog.userName || 'System'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{isAr ? "نوع العملية" : "Action"}</span>
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase", getActionBadgeColor(selectedLog.action))}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{isAr ? "مستوى الأهمية" : "Severity"}</span>
                  <div>{getSeverityBadge(selectedLog.severity)}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{isAr ? "الكيان المستهدف" : "Target Entity"}</span>
                  <span className="text-xs font-bold text-white font-mono">{selectedLog.entityType} ({String(selectedLog.entityId || '').substring(0, 8)})</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{isAr ? "التوقيت الدقيق" : "Timestamp"}</span>
                  <span className="text-xs font-mono text-slate-200">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
              </div>

              {/* Payload Raw Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" /> {isAr ? "تفاصيل الحزمة والبيانات:" : "Payload Content:"}
                  </span>
                  <button 
                    onClick={() => handleCopy(selectedLog.details || '', 'payload')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'payload' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {isAr ? "نسخ البيانات" : "Copy Payload"}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-slate-200 overflow-x-auto max-h-60 custom-scrollbar whitespace-pre-wrap break-all">
                  {(() => {
                    try {
                      const parsed = JSON.parse(selectedLog.details);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return selectedLog.details || 'No payload data registered.';
                    }
                  })()}
                </pre>
              </div>

              {/* Device Info */}
              {selectedLog.deviceInfo && (
                <div className="text-[11px] text-slate-400 font-mono bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <strong className="text-slate-300">Client Device:</strong> {selectedLog.deviceInfo}
                </div>
              )}

              {/* Close Action */}
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-5 py-2 text-xs shadow-lg transition-all cursor-pointer"
                >
                  {isAr ? "إغلاق النافذة" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
