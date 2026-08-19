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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function AuditTrailView() {
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
        toast.success(`اختبار الأداء ممتاز (SLA Pass < 1000ms): تم الاستعلام بـ ${res.readAllMachinesMs}ms فقط!`, {
          duration: 5000
        });
      } else {
        toast.warning(`اختبار الأداء أظهر تباطؤ في الاستعلامات.`, {
          duration: 5000
        });
      }
    } catch {
      toast.error('فشل تشغيل اختبار قياس الأداء');
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyAuditIntegrity();
      if (res.isValid) {
        toast.success(`تم التحقق بنجاح من سلامة ${res.totalChecked} سجل! التوقيع الرقمي وسلسلة SHA-256 سليمة 100%.`, {
          duration: 4000
        });
      } else {
        toast.error(`تحذير أمني: تم اكتشاف ${res.tamperedLogIds.length} سجلات معدلة أو غير متطابقة!`, {
          duration: 5000
        });
      }
    } catch (err) {
      toast.error('فشل إجراء فحص سلامة التوقيعات الرقمية');
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
    toast.success('تم نسخ المعرف بنجاح');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportLogsAsCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('لا توجد سجلات لتصديرها');
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
    toast.success('تم تصدير ملف السجلات بنجاح (CSV)');
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/15 text-[10px] uppercase text-rose-300 font-extrabold tracking-wider whitespace-nowrap shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            CRITICAL
          </span>
        );
      case 'WARNING': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/15 text-[10px] uppercase text-amber-300 font-extrabold tracking-wider whitespace-nowrap shadow-sm">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            WARNING
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/15 text-[10px] uppercase text-cyan-300 font-extrabold tracking-wider whitespace-nowrap shadow-sm">
            <Info className="w-3 h-3 text-cyan-400" />
            INFO
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
      return 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300';
    }
    return 'bg-white/5 border-white/10 text-slate-300';
  };

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'severity',
      label: 'مستوى الأهمية (Severity)',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      value: severityFilter,
      onChange: setSeverityFilter,
      allLabel: 'جميع المستويات (All Severities)',
      allValue: 'ALL',
      options: [
        { value: 'CRITICAL', label: 'حرج (Critical Alerts)', count: criticalCount, badgeColor: 'rose' },
        { value: 'WARNING', label: 'تحذيرات (Warnings)', count: warningCount, badgeColor: 'amber' },
        { value: 'INFO', label: 'معلومات عامة (Info)', count: infoCount, badgeColor: 'cyan' },
      ]
    },
    {
      id: 'entity',
      label: 'نوع الكيان (Target Entity)',
      icon: <Layers className="w-3.5 h-3.5" />,
      value: entityFilter,
      onChange: setEntityFilter,
      allLabel: 'جميع الكيانات (All Entities)',
      allValue: 'ALL',
      options: entityTypes.map(type => ({
        value: type,
        label: type,
        count: logs.filter(l => l.entityType === type).length,
        badgeColor: 'slate'
      }))
    }
  ], [severityFilter, entityFilter, criticalCount, warningCount, infoCount, entityTypes, logs]);

  const quickTabs: QuickTabOption[] = useMemo(() => [
    { id: 'ALL', label: 'الكل (All Logs)', count: logs.length, color: 'indigo' },
    { id: 'CRITICAL', label: 'حرج (Critical)', count: criticalCount, color: 'rose' },
    { id: 'WARNING', label: 'تحذير (Warning)', count: warningCount, color: 'amber' },
    { id: 'INFO', label: 'معلومات (Info)', count: infoCount, color: 'cyan' },
  ], [logs.length, criticalCount, warningCount, infoCount]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 w-full lg:px-8"
    >
      {/* 1. Page Header with Bento Cards */}
      <PageHeader
        title="سجل العمليات والتدقيق (System Audit Trail)"
        subtitle="Immutable cryptographic log of critical system operations, transactional data changes, and user activities."
        icon={<RefreshCw className="w-7 h-7 text-slate-300" />}
        badgeText="Audit & Compliance"
        badgeColor="slate"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button 
               onClick={handleRunBenchmark}
               disabled={isBenchmarking}
               className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-extrabold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isBenchmarking ? 'جاري القياس...' : 'اختبار الأداء (Benchmark <1s SLA)'}</span>
            </button>
            <button 
               onClick={handleVerifyIntegrity}
               disabled={isVerifying}
               className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 font-extrabold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Shield className="w-4 h-4 text-indigo-400" /> 
              <span>{isVerifying ? 'جاري التحقق...' : 'فحص سلامة التوقيع الرقمي (Audit Shield)'}</span>
            </button>
            <button 
               onClick={exportLogsAsCSV}
               className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> تصدير السجلات (CSV)
            </button>
            <button 
               onClick={clearLogs}
               className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> مسح السجلات
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title="Total Events"
            subtitle="REGISTERED LOGS"
            value={logs.length}
            icon={<Activity className="w-3.5 h-3.5" />}
            color="slate"
          />
          <HeaderBentoCard
            title="Critical Alerts"
            subtitle="HIGH SEVERITY"
            value={criticalCount}
            icon={<AlertOctagon className="w-3.5 h-3.5" />}
            color="rose"
          />
          <HeaderBentoCard
            title="System Warnings"
            subtitle="MEDIUM SEVERITY"
            value={warningCount}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            color="amber"
          />
          <HeaderBentoCard
            title="Information Logs"
            subtitle="STANDARD STREAM"
            value={infoCount}
            icon={<Info className="w-3.5 h-3.5" />}
            color="cyan"
          />
        </div>
      </PageHeader>

      {/* 2. Universal Crystal Table Container */}
      <motion.div variants={itemVariants} className="flex flex-col">
        <GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl flex flex-col bg-[#0a0b10]/95 backdrop-blur-xl relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-slate-400/40 to-transparent pointer-events-none" />

          {/* Command Bar */}
          <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10">
            {/* Context Count */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center shrink-0 shadow-inner">
                <Activity className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">سجل التدقيق المؤسسي</h2>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-500/20 border border-slate-500/30 text-slate-200">
                    {filteredLogs.length} / {logs.length} سجل
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cryptographic Audit Ledger & Compliance</p>
              </div>
            </div>

            {/* Central Unified Search & Filter with View Switcher */}
            <div className="flex-1 max-w-3xl w-full">
              <UnifiedSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="البحث في السجلات، المستخدمين، العمليات، المعرفات..."
                filterGroups={filterGroups}
                quickTabs={quickTabs}
                activeQuickTab={severityFilter}
                onQuickTabChange={setSeverityFilter}
                themeColor="white"
                extraControls={
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDisplayMode('table')}
                        className={cn(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          displayMode === 'table' ? "bg-white text-slate-950 shadow-sm font-bold" : "text-slate-400 hover:text-white"
                        )}
                        title="عرض الجدول الكريستالي"
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
                        title="عرض البطاقات الكريستالية"
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
                title="لم يتم العثور على سجلات مطابقة"
                description="لا توجد عمليات مسجلة تطابق معايير البحث أو التصفية الحالية. جرب تصفير الفلاتر أو تغيير نص البحث."
                color="slate"
                className="py-16"
              />
            </div>
          ) : displayMode === 'table' ? (
            /* Standard Crystal High-Contrast Table */
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar w-full min-h-[350px]">
              <table className="w-full text-start border-collapse">
                <thead className="bg-[#12141d] border-b-2 border-white/15 text-slate-200 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm">
                  <tr>
                    <th className="py-4 px-6 text-start font-extrabold">التوقيت الزمني (Timestamp)</th>
                    <th className="py-4 px-6 text-start font-extrabold">المشغل (Operator)</th>
                    <th className="py-4 px-6 text-start font-extrabold">العملية (Action)</th>
                    <th className="py-4 px-6 text-start font-extrabold">الكيان المستهدف (Target Entity)</th>
                    <th className="py-4 px-6 text-center font-extrabold">مستوى الأهمية (Severity)</th>
                    <th className="py-4 px-6 text-start font-extrabold">تفاصيل العملية (Payload Details)</th>
                    <th className="py-4 px-6 text-center font-extrabold">معاينة (Inspect)</th>
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
                          idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]",
                          "hover:bg-slate-500/15 hover:text-white"
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
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-slate-800 border border-slate-700 shadow-inner">
                              {(log.userName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-white text-xs tracking-tight group-hover:text-slate-100 transition-colors">
                                {log.userName || 'System Auto'}
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
                            title="معاينة السجل وتفاصيل الحزمة"
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
                  className="group relative p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition-all shadow-lg hover:shadow-xl cursor-pointer flex flex-col justify-between"
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
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white bg-slate-800 border border-slate-700 shadow-inner">
                        {(log.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-extrabold text-white text-xs">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">[{log.entityType}]</span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 bg-black/30 p-2.5 rounded-xl border border-white/5 font-mono mb-4">
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
                      معاينة <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* 3. Log Detail Inspector Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-[#0e1017] border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500/40 via-slate-400/50 to-indigo-500/40" />

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
                    <Shield className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      معاينة السجل الأمني (Audit Log Details)
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</span>
                      <button 
                        onClick={() => handleCopy(selectedLog.id, 'id')}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="نسخ المعرف"
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">المشغل (Operator)</span>
                  <span className="text-xs font-black text-white">{selectedLog.userName || 'System'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">نوع العملية (Action)</span>
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase", getActionBadgeColor(selectedLog.action))}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">مستوى الخطورة</span>
                  <div>{getSeverityBadge(selectedLog.severity)}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">الكيان (Target Entity)</span>
                  <span className="text-xs font-bold text-white font-mono">{selectedLog.entityType} ({String(selectedLog.entityId || '').substring(0, 8)})</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">التوقيت الدقيق (Timestamp)</span>
                  <span className="text-xs font-mono text-slate-200">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
              </div>

              {/* Payload Raw Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" /> تفاصيل الحزمة والبيانات (Payload Content):
                  </span>
                  <button 
                    onClick={() => handleCopy(selectedLog.details || '', 'payload')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'payload' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    نسخ البيانات
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
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
