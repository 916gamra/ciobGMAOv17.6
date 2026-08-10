// src/features/security/components/SecurityDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Lock, Activity, Server, RefreshCw, CheckCircle2, Zap, Radio } from 'lucide-react';
import { securityManager } from '@/core/security/SecurityManager';

export function SecurityDashboard() {
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
      <div className="flex h-96 items-center justify-center text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        جاري تحميل لوحة الحماية العسكرية...
      </div>
    );
  }

  const threatLevel = report?.threatReport?.threatLevel || 'low';
  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 shadow-lg">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">نظام الحماية العسكري المتقدم (BDR Security Shield)</h1>
            <p className="text-sm text-slate-400">مراقبة التهديدات، تحليل الحزم، كشف التسلل، وسلامة البيانات في الوقت الفعلي</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-xl text-xs font-bold border uppercase tracking-wider flex items-center gap-2 ${getBadgeColor(threatLevel)}`}>
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            مستوى التهديد: {threatLevel}
          </span>
          <button 
            onClick={fetchReport}
            className="px-4 py-2 bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            تحديث
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">إجمالي التهديدات المرصودة</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-white">
            {report?.threatReport?.totalThreats || 0}
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">عناوين IP المحظورة</span>
            <Lock className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-white">
            {report?.blockedIPs?.length || 0}
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">خرق تكامل البيانات</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-white">
            {report?.integrityViolations?.length || 0}
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">الجلسات النشطة المؤمنة</span>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-white">
            {report?.activeSessions?.length || 0}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'overview', label: 'نظرة عامة والتوصيات' },
          { id: 'threats', label: 'التهديدات المرصودة' },
          { id: 'ids', label: 'عناوين IP وشبكة الاتصال' },
          { id: 'integrity', label: 'سلامة البيانات' },
          { id: 'sessions', label: 'الجلسات والأمان' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              التوصيات والإجراءات الوقائية المقترحة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report?.threatReport?.recommendations?.length > 0 ? (
                report.threatReport.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="p-4 bg-white/[0.04] rounded-2xl border border-white/10 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{rec}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  النظام آمن تماماً. لا توجد أي تهديدات أو توصيات ملحة في الوقت الحالي.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">التهديدات المكتشفة</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 text-right">النوع</th>
                    <th className="py-3 px-4 text-right">الخطورة</th>
                    <th className="py-3 px-4 text-right">درجة التهديد</th>
                    <th className="py-3 px-4 text-right">المصدر</th>
                    <th className="py-3 px-4 text-right">التوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {report?.detectedThreats?.length > 0 ? (
                    report.detectedThreats.map((t: any) => (
                      <tr key={t.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="py-3 px-4 text-right font-mono text-cyan-300">{t.type}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getBadgeColor(t.severity)}`}>
                            {t.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{t.score}/100</td>
                        <td className="py-3 px-4 text-right text-slate-400">{t.source}</td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono text-xs">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">لا توجد تهديدات مسجلة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ids' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">عناوين IP المحظورة والاتصالات المشبوهة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 mb-3">عناوين IP المحظورة ({report?.blockedIPs?.length || 0})</h3>
                <div className="space-y-2">
                  {report?.blockedIPs?.length > 0 ? (
                    report.blockedIPs.map((ip: string, idx: number) => (
                      <div key={idx} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl font-mono text-rose-300 text-sm flex items-center justify-between">
                        <span>{ip}</span>
                        <span className="text-xs bg-rose-500/20 px-2 py-0.5 rounded">محظور</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-white/[0.04] rounded-xl text-slate-500 text-sm text-center">لا توجد عناوين محظورة</div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-400 mb-3">الاتصالات المشبوهة</h3>
                <div className="space-y-2">
                  {report?.suspiciousConnections?.length > 0 ? (
                    report.suspiciousConnections.map((c: any, idx: number) => (
                      <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl font-mono text-amber-300 text-sm flex items-center justify-between">
                        <span>{c.ip}</span>
                        <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded">نقاط: {c.score}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-white/[0.04] rounded-xl text-slate-500 text-sm text-center">لا توجد اتصالات مشبوهة</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrity' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">سجلات سلامة البيانات والتحقق</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 text-right">معرف البيانات</th>
                    <th className="py-3 px-4 text-right">نوع الخرق</th>
                    <th className="py-3 px-4 text-right">الخطورة</th>
                    <th className="py-3 px-4 text-right">التوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {report?.integrityViolations?.length > 0 ? (
                    report.integrityViolations.map((v: any) => (
                      <tr key={v.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="py-3 px-4 text-right font-mono text-cyan-300">{v.id}</td>
                        <td className="py-3 px-4 text-right">{v.type}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getBadgeColor(v.severity)}`}>
                            {v.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono text-xs">
                          {new Date(v.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">لا توجد خروقات لسلامة البيانات</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">الجلسات النشطة المؤمنة</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 text-right">معرف الجلسة</th>
                    <th className="py-3 px-4 text-right">معرف المستخدم</th>
                    <th className="py-3 px-4 text-right">عنوان IP</th>
                    <th className="py-3 px-4 text-right">آخر نشاط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {report?.activeSessions?.length > 0 ? (
                    report.activeSessions.map((s: any) => (
                      <tr key={s.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="py-3 px-4 text-right font-mono text-xs text-cyan-300">{s.id.substring(0, 16)}...</td>
                        <td className="py-3 px-4 text-right font-bold">{s.userId}</td>
                        <td className="py-3 px-4 text-right font-mono">{s.ipAddress}</td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono text-xs">
                          {new Date(s.lastActivity).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">لا توجد جلسات نشطة مسجلة حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
