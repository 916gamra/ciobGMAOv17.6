// src/features/security/components/SecurityDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Activity, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  Radio, 
  ShieldCheck,
  RadioTower,
  Network,
  Globe,
  Cpu,
  Fingerprint,
  AlertOctagon,
  FileCheck
} from 'lucide-react';
import { securityManager } from '@/core/security/SecurityManager';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { cn } from '@/shared/utils';
import { useTranslation } from 'react-i18next';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function SecurityDashboard() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'ids' | 'integrity' | 'sessions'>('overview');

  const fetchReport = () => {
    setLoading(true);
    try {
      const data = securityManager.getComprehensiveSecurityReport();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    securityManager.initialize();
    fetchReport();
    const interval = setInterval(fetchReport, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !report) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
        <span className="font-bold text-sm">
          {isAr ? "جاري تحميل مركز الدفاع الأمني المتقدم..." : "Loading Advanced Security Dashboard..."}
        </span>
      </div>
    );
  }

  const threatLevel = report?.threatReport?.threatLevel || 'low';
  
  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': 
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'high': 
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'medium': 
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default: 
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const getThreatLabel = (level: string) => {
    if (!isAr) return level.toUpperCase();
    switch (level) {
      case 'critical': return 'حرج جداً';
      case 'high': return 'مرتفع';
      case 'medium': return 'متوسط';
      default: return 'آمن / منخفض';
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 pt-2 w-full lg:px-8 font-sans"
    >
      {/* 1. Page Header with Bento Metrics */}
      <PageHeader
        title={isAr ? "نظام الحماية المتقدم والرصد السيبراني" : "Advanced Cyber Defense & System Shield"}
        subtitle={isAr ? "مراقبة التهديدات، تحليل الحزم، كشف التسلل، وسلامة تدفق البيانات في الوقت الفعلي." : "Real-time threat monitoring, packet inspection, intrusion detection, and data integrity enforcement."}
        icon={<Shield className="w-7 h-7 text-slate-300" />}
        badgeText={isAr ? "الحماية المتقدمة" : "Advanced Security"}
        badgeColor="slate"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={cn("px-3.5 py-2 rounded-xl text-xs font-bold border uppercase tracking-wider flex items-center gap-2 shadow-sm", getBadgeColor(threatLevel))}>
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>{isAr ? "مستوى التهديد:" : "Threat Level:"}</span>
              <strong className="font-mono">{getThreatLabel(threatLevel)}</strong>
            </span>
            <button 
              onClick={fetchReport}
              className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2 text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{isAr ? "تحديث البيانات" : "Refresh"}</span>
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={isAr ? "التهديدات المرصودة" : "Detected Threats"}
            subtitle="TOTAL THREATS"
            value={report?.threatReport?.totalThreats || 0}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            color="amber"
          />
          <HeaderBentoCard
            title={isAr ? "عناوين IP المحظورة" : "Blocked IPs"}
            subtitle="BLOCKED HOSTS"
            value={report?.blockedIPs?.length || 0}
            icon={<Lock className="w-3.5 h-3.5" />}
            color="rose"
          />
          <HeaderBentoCard
            title={isAr ? "خرق تكامل البيانات" : "Integrity Breaches"}
            subtitle="DATA INTEGRITY"
            value={report?.integrityViolations?.length || 0}
            icon={<Activity className="w-3.5 h-3.5" />}
            color="cyan"
          />
          <HeaderBentoCard
            title={isAr ? "الجلسات النشطة" : "Active Sessions"}
            subtitle="SECURE SESSIONS"
            value={report?.activeSessions?.length || 0}
            icon={<Server className="w-3.5 h-3.5" />}
            color="emerald"
          />
        </div>
      </PageHeader>

      {/* 2. Main Crystal Glass Container */}
      <motion.div variants={itemVariants} className="flex flex-col">
        <div className="border border-white/10 overflow-hidden shadow-2xl rounded-2xl flex flex-col bg-slate-900/60 backdrop-blur-xl relative">

          {/* Navigation Bar / Tabs */}
          <div className="p-4 md:p-5 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
              {[
                { id: 'overview', label: isAr ? 'نظرة عامة والتوصيات' : 'Overview & Guidance', icon: Zap },
                { id: 'threats', label: isAr ? 'التهديدات المرصودة' : 'Detected Threats', icon: AlertOctagon },
                { id: 'ids', label: isAr ? 'عناوين IP وشبكة الاتصال' : 'IP & Firewall', icon: Network },
                { id: 'integrity', label: isAr ? 'سلامة البيانات' : 'Data Integrity', icon: FileCheck },
                { id: 'sessions', label: isAr ? 'الجلسات والأمان' : 'Active Sessions', icon: Fingerprint },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                      isActive
                        ? "bg-white text-slate-950 shadow-md font-extrabold"
                        : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/5"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <RadioTower className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{isAr ? "فحص دوري كل 5 ثوانٍ" : "Polling every 5s"}</span>
            </div>
          </div>

          {/* Tab Body */}
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-tight">
                        {isAr ? "التوصيات والإجراءات الوقائية المقترحة" : "Security Recommendations & Proactive Actions"}
                      </h2>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {isAr ? "إرشادات فورية لمعالجة المخاطر وتحسين جدار الحماية" : "Live recommendations to mitigate risks"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report?.threatReport?.recommendations?.length > 0 ? (
                      report.threatReport.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/10 flex items-start gap-3 transition-colors shadow-sm">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-300 font-medium leading-relaxed">{rec}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3 col-span-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        <span>
                          {isAr 
                            ? "النظام مؤمن بالكامل. لم يتم رصد أي تهديدات غير معالجة أو ثغرات حرجة في الوقت الحالي." 
                            : "System is fully secure. No active threat vectors or unresolved alerts detected."}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'threats' && (
                <motion.div 
                  key="threats"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">
                      {isAr ? "التهديدات المكتشفة وسجل الرصد" : "Detected Threats & Event Stream"}
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      {report?.detectedThreats?.length || 0} {isAr ? 'عنصر' : 'events'}
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-start border-collapse">
                      <thead className="bg-slate-950/80 border-b border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 text-start">{isAr ? "النوع" : "Type"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "الخطورة" : "Severity"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "درجة التهديد" : "Score"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "المصدر" : "Source"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "التوقيت" : "Timestamp"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {report?.detectedThreats?.length > 0 ? (
                          report.detectedThreats.map((t: any) => (
                            <tr key={t.id} className="hover:bg-white/[0.04] transition-colors">
                              <td className="py-3 px-4 font-mono text-cyan-300 font-bold">{t.type}</td>
                              <td className="py-3 px-4">
                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getBadgeColor(t.severity))}>
                                  {t.severity}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-200">{t.score}/100</td>
                              <td className="py-3 px-4 text-slate-400">{t.source}</td>
                              <td className="py-3 px-4 text-slate-400 font-mono">
                                {new Date(t.timestamp).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-0">
                              <EmptyState 
                                icon={ShieldCheck}
                                title={isAr ? "لا توجد تهديدات مسجلة" : "No recorded threats"}
                                description={isAr ? "النظام آمن وحالة الحماية نشطة ومستقرة." : "Active protection is nominal."}
                                color="emerald"
                                className="py-10 text-xs"
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ids' && (
                <motion.div 
                  key="ids"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Blocked IPs */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          {isAr ? "عناوين IP المحظورة" : "Blocked IP Addresses"}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-md">
                          {report?.blockedIPs?.length || 0}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {report?.blockedIPs?.length > 0 ? (
                          report.blockedIPs.map((ip: string, idx: number) => (
                            <div key={idx} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl font-mono text-rose-300 text-xs flex items-center justify-between">
                              <span className="font-bold">{ip}</span>
                              <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded font-sans font-bold">
                                {isAr ? "محظور" : "BLOCKED"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-slate-400 text-xs text-center">
                            {isAr ? "لا توجد عناوين محظورة حالياً" : "No blocked IPs"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Suspicious Connections */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          {isAr ? "الاتصالات المشبوهة" : "Suspicious Connections"}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-md">
                          {report?.suspiciousConnections?.length || 0}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {report?.suspiciousConnections?.length > 0 ? (
                          report.suspiciousConnections.map((c: any, idx: number) => (
                            <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl font-mono text-amber-300 text-xs flex items-center justify-between">
                              <span className="font-bold">{c.ip}</span>
                              <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-sans font-bold">
                                {isAr ? `درجة الخطر: ${c.score}` : `Risk: ${c.score}`}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-slate-400 text-xs text-center">
                            {isAr ? "لا توجد اتصالات مشبوهة" : "No suspicious connections"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'integrity' && (
                <motion.div 
                  key="integrity"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">
                      {isAr ? "سجلات سلامة البيانات والتحقق المشفر" : "Data Integrity & Cryptographic Validation"}
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      {report?.integrityViolations?.length || 0} {isAr ? 'انتهاك' : 'violations'}
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-start border-collapse">
                      <thead className="bg-slate-950/80 border-b border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 text-start">{isAr ? "معرف السجل" : "Record ID"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "نوع الخرق" : "Violation Type"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "الخطورة" : "Severity"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "التوقيت" : "Timestamp"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {report?.integrityViolations?.length > 0 ? (
                          report.integrityViolations.map((v: any) => (
                            <tr key={v.id} className="hover:bg-white/[0.04] transition-colors">
                              <td className="py-3 px-4 font-mono text-cyan-300 font-bold">{v.id}</td>
                              <td className="py-3 px-4 text-slate-200">{v.type}</td>
                              <td className="py-3 px-4">
                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getBadgeColor(v.severity))}>
                                  {v.severity}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono">
                                {new Date(v.timestamp).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-0">
                              <EmptyState 
                                icon={ShieldCheck}
                                title={isAr ? "لا توجد خروقات لسلامة البيانات" : "No integrity breaches"}
                                description={isAr ? "توقيعات التشفير وسلسلة الكتل الرقمية متطابقة وسليمة 100%." : "All cryptographic hashes are 100% verified."}
                                color="cyan"
                                className="py-10 text-xs"
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'sessions' && (
                <motion.div 
                  key="sessions"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">
                      {isAr ? "الجلسات النشطة المؤمنة" : "Active Encrypted Sessions"}
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      {report?.activeSessions?.length || 0} {isAr ? 'جلسة' : 'sessions'}
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-start border-collapse">
                      <thead className="bg-slate-950/80 border-b border-white/10 text-slate-300 font-extrabold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 text-start">{isAr ? "معرف الجلسة" : "Session ID"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "معرف المستخدم" : "User ID"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "عنوان IP" : "IP Address"}</th>
                          <th className="py-3 px-4 text-start">{isAr ? "آخر نشاط" : "Last Activity"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {report?.activeSessions?.length > 0 ? (
                          report.activeSessions.map((s: any) => (
                            <tr key={s.id} className="hover:bg-white/[0.04] transition-colors">
                              <td className="py-3 px-4 font-mono text-cyan-300 font-bold">{s.id.substring(0, 16)}...</td>
                              <td className="py-3 px-4 font-extrabold text-white">{s.userId}</td>
                              <td className="py-3 px-4 font-mono text-slate-300">{s.ipAddress}</td>
                              <td className="py-3 px-4 text-slate-400 font-mono">
                                {new Date(s.lastActivity).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-0">
                              <EmptyState 
                                icon={Activity}
                                title={isAr ? "لا توجد جلسات نشطة مسجلة حالياً" : "No active sessions"}
                                description={isAr ? "سجل الجلسات فارغ." : "No active user sessions currently recorded."}
                                color="blue"
                                className="py-10 text-xs"
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
