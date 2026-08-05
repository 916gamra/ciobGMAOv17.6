import React, { useState } from 'react';
import { GlassCard } from '@/shared/components/GlassCard';
import { FileText, Code2, BookOpen, Shield, Cpu, ExternalLink, Terminal, Copy, Check, Search, Layers } from 'lucide-react';
import openApiSpec from '../../../../docs/swagger_openapi.json';
import { usePerformanceMonitor } from '@/core/monitoring/usePerformanceMonitor';

export function DocumentationHubView() {
  usePerformanceMonitor('DocumentationHubView');
  const [activeTab, setActiveTab] = useState<'openapi' | 'user_guide' | 'dev_guide' | 'specs'>('openapi');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const filteredPaths = Object.entries(openApiSpec.paths).filter(([path, methods]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return path.toLowerCase().includes(q) || JSON.stringify(methods).toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full w-full space-y-6 overflow-y-auto p-4 md:p-6 custom-scrollbar text-white">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v17.1.0 Docs Hub
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OpenAPI 3.0 Ready
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            مركز التوثيق والكتالوج الفني (Documentation Portal)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            دليل التشغيل الشامل، مواصفات OpenAPI Swagger، المعمارية الهندسية، وبروتوكولات الأمان.
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('openapi')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'openapi' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="w-4 h-4" /> OpenAPI Specs
          </button>
          <button
            onClick={() => setActiveTab('user_guide')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'user_guide' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" /> دليل المستخدم
          </button>
          <button
            onClick={() => setActiveTab('dev_guide')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'dev_guide' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4" /> دليل المطورين
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'specs' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" /> الأمان والأنماط
          </button>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'openapi' && (
        <div className="space-y-6">
          {/* OpenAPI Intro Card */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" /> OpenAPI 3.0 REST & Client Data Specifications
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  مواصفات واجهات البرمجة (Endpoints) للـ Dexie Data Engine وواجهات السحابة لمنظومة BDR Nexus.
                </p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن مسار أو Endpoint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>
            </div>

            {/* Endpoints List */}
            <div className="space-y-3 mt-4">
              {filteredPaths.map(([path, methods]: [string, any]) => (
                <div key={path} className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.03] flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-black text-indigo-400">{path}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(path)}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                      title="نسخ المسار"
                    >
                      {copiedPath === path ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {Object.entries(methods).map(([method, details]: [string, any]) => (
                      <div key={method} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                            method === 'get' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            method === 'post' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {method}
                          </span>
                          <span className="text-xs font-bold text-slate-200">{details.summary}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed pr-2 border-r-2 border-indigo-500/50">
                          {details.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'user_guide' && (
        <GlassCard className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-400" /> دليل التشغيل الميداني لنظام BDR Nexus
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              المرجع الرسمي لإدارة قطع الغيار (PDR)، قانون الـ 999 مقعد، والتكامل الوقائي.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Layers className="w-5 h-5" /> 1. الأبعاد الأربعة للبيانات (The 4 Dimensions)
              </h3>
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc pr-4">
                <li><strong className="text-white">القالب (Template):</strong> المعرفة الهندسية المجرّدة بدون كميات أو أسعار.</li>
                <li><strong className="text-white">البصمة (Blueprint):</strong> التجسيد التجاري الموديل والمصنع داخل الكتالوج.</li>
                <li><strong className="text-white">المثيل الحي (Instance/Stock):</strong> التفعيل المادي الحقيقي بالمخزن والكمية والممر.</li>
                <li><strong className="text-white">الآلة (Machine):</strong> وجهة الاستهلاك النهائية عند تنفيذ أمر العمل.</li>
              </ul>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                <Shield className="w-5 h-5" /> 2. قانون الـ 999 مقعد (The 999 Slots Rule)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                يولّد كل قالب تلقائياً 999 مقعداً متسلسلاً مجانياً (من 001 إلى 999). أول محمل هو <code className="text-cyan-300 font-mono">ROB-001</code> والتسلسل إجباري لمنع العشوائية.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'dev_guide' && (
        <GlassCard className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-fuchsia-400" /> دليل المطورين والمعمارية البرمجية (Developer Guide)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              دليل البناء الهيكلي، المحركات الأمنية، ومحرك التخزين المؤقت وتحسين السرعة.
            </p>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-300 overflow-x-auto">
            <div className="text-fuchsia-400 font-bold mb-2">// Core Architecture Layers</div>
            <div>├── QueryCacheEngine (In-memory TTL & Tag invalidation)</div>
            <div>├── HeavyWorkerManager (Compute offloading to unblock 60 FPS UI)</div>
            <div>├── CsrfShield (Anti-CSRF cryptographic token validation)</div>
            <div>├── RateLimiter (Sliding Window throttle control)</div>
            <div>└── PerformanceMonitor (Real-time telemetry stream)</div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'specs' && (
        <GlassCard className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400" /> المصفوفة الأمنية والأنماط البرمجية (Security Matrix)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              مواصفات التشفير، الحماية من هجمات CSRF، ومحدد المعدل (Rate Limiter).
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase">Cryptographic Engine</div>
              <p className="text-xs text-slate-400">AES-GCM 256-bit encryption for sensitive local Dexie fields.</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-cyan-400 uppercase">Anti-CSRF Shield</div>
              <p className="text-xs text-slate-400">Double-submit token pattern protecting mutation states.</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase">Sliding Window Throttle</div>
              <p className="text-xs text-slate-400">Throttles rapid double-click requests and API flood.</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
