import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import React, { useState, useEffect } from 'react';
import { Shield, LockKeyhole, Timer, Fingerprint, Code2, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { motion, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function SecurityPoliciesView() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState(15);
  const [strictMode, setStrictMode] = useState(true);
  const [devMode, setDevMode] = useState(false);

  // Load preferences from local storage
  useEffect(() => {
    const prefsStr = localStorage.getItem('ciob_security_prefs');
    if (prefsStr) {
      try {
        const prefs = JSON.parse(prefsStr);
        if (prefs.autoLogoutMinutes !== undefined) setAutoLogoutMinutes(prefs.autoLogoutMinutes);
        if (prefs.strictMode !== undefined) setStrictMode(prefs.strictMode);
        if (prefs.devMode !== undefined) setDevMode(prefs.devMode);
      } catch (e) {
        console.error("Failed to parse security preferences");
      }
    }
  }, []);

  const handleSave = () => {
    const prefs = {
      autoLogoutMinutes,
      strictMode,
      devMode
    };
    localStorage.setItem('ciob_security_prefs', JSON.stringify(prefs));
    toast.success(isAr ? 'تم تحديث سياسات الأمان بنجاح' : 'Policies Updated', {
       description: isAr ? 'تم حفظ إعدادات الأمان وسياسات الجلسات في النظام' : 'System security configuration successfully saved.',
       icon: <Shield className="w-4 h-4 text-emerald-400" />
    });
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 pt-2 px-4 md:px-0 relative w-full lg:px-8"
    >
      <PageHeader
        title={isAr ? "سياسات الأمان والتحكم بالوصول" : "Security & Network Policies"}
        subtitle={isAr ? "الضبط الشامل لمعايير حماية النظام، مهلات الجلسات، وقواعد التحقق الصارم في بيئة المصنع." : "Global configuration capabilities for system-wide access parameters and interface behavior settings."}
        icon={<Shield className="w-7 h-7 text-slate-300" />}
        badgeText={isAr ? "سياسات الأمان" : "Security Policies"}
        badgeColor="slate"
        actions={
          <button 
            onClick={handleSave}
            className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {isAr ? "حفظ التغييرات" : "Save Configuration"}
          </button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={isAr ? "مهلة خمول الجلسة" : "Session Inactivity"}
            subtitle="AUTO LOGOUT"
            value={`${autoLogoutMinutes} ${isAr ? 'دقيقة' : 'min'}`}
            icon={<Timer className="w-3.5 h-3.5" />}
            color="slate"
          />
          <HeaderBentoCard
            title={isAr ? "جدار انعدام الثقة" : "Zero-Trust Guard"}
            subtitle="STRICT VALIDATION"
            value={strictMode ? (isAr ? "مفعّل صارم" : "Enforced") : (isAr ? "معطّل" : "Disabled")}
            icon={<Fingerprint className="w-3.5 h-3.5" />}
            color={strictMode ? "emerald" : "amber"}
          />
          <HeaderBentoCard
            title={isAr ? "بيئة الاختبار والتطوير" : "Dev Sandbox"}
            subtitle="DEV DIAGNOSTICS"
            value={devMode ? (isAr ? "نشط" : "Active") : (isAr ? "مغلق" : "Locked")}
            icon={<Code2 className="w-3.5 h-3.5" />}
            color={devMode ? "cyan" : "slate"}
          />
          <HeaderBentoCard
            title={isAr ? "الامتثال الأمني" : "Policy Compliance"}
            subtitle="INTEGRITY STATUS"
            value={isAr ? "متوافق 100%" : "Compliant"}
            icon={<Shield className="w-3.5 h-3.5" />}
            color="blue"
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 relative z-10">
        
        {/* Session Timeout Panel */}
        <motion.div 
          variants={itemVariants} 
          className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all shadow-xl relative overflow-hidden"
        >
          <div className="flex gap-5 items-center w-full md:w-auto mb-5 md:mb-0">
            <div className="w-13 h-13 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-sky-500/30 transition-colors shrink-0">
               <Timer className="w-6 h-6 text-slate-300 group-hover:text-sky-400 transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h3 className="text-base font-bold text-white tracking-tight">{isAr ? "مهلة خمول الجلسة التلقائية" : "Session Inactivity Decay Rate"}</h3>
                 <span className="text-[10px] font-mono font-bold bg-white/5 text-slate-300 px-2 py-0.5 rounded border border-white/10">
                   {autoLogoutMinutes} {isAr ? 'دقيقة' : 'min'}
                 </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                {isAr ? "تحديد المدة الزمنية لخمول المستخدم قبل تسجيل الخروج الآمن لحماية محطات العمل المشتركة في المصنع." : "Determine the chronological inactivity threshold before an active session is automatically logged out."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded-xl border border-white/10 shadow-inner w-full md:w-auto justify-between md:justify-start">
            <input 
              type="number" 
              min="1" 
              max="120"
              value={autoLogoutMinutes}
              onChange={(e) => setAutoLogoutMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-transparent text-center text-lg font-bold font-mono text-white outline-none focus:text-sky-400 transition-colors"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">{isAr ? "دقائق" : "Minutes"}</span>
          </div>
        </motion.div>

        {/* Strict Zero-Trust Guard */}
        <motion.div 
          variants={itemVariants} 
          className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all shadow-xl relative overflow-hidden"
        >
          <div className="flex gap-5 items-center w-full md:w-auto mb-5 md:mb-0">
            <div className="w-13 h-13 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-emerald-500/30 transition-colors shrink-0">
               <Fingerprint className="w-6 h-6 text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h3 className="text-base font-bold text-white tracking-tight">{isAr ? "جدار انعدام الثقة والتحقق الصارم" : "Zero-Trust Guard (Strict Mode)"}</h3>
                 <span className={cn(
                   "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                   strictMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-slate-400 border-white/10"
                 )}>
                   {strictMode ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Off")}
                 </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                {isAr ? "إلزام المستخدم بإدخال رمز التحقق الأمني عند تنفيذ العمليات الهيكلية الحساسة أو تعديل المخططات." : "Require additional cryptographic validation for core structural alterations or destructive actions."}
              </p>
            </div>
          </div>
          <button 
             onClick={() => setStrictMode(!strictMode)}
             className={cn(
                "w-12 h-6 rounded-full border transition-colors relative outline-none active:scale-95 shadow-inner grow-0 shrink-0", 
                strictMode 
                 ? "bg-emerald-500 border-emerald-400" 
                 : "bg-slate-800 border-white/10"
              )}
          >
             <div className={cn(
               "absolute top-1/2 w-4 h-4 rounded-full bg-white transition-all shadow-md", 
               strictMode 
                 ? (isAr ? "right-1 -translate-y-1/2" : "left-[1.6rem] -translate-y-1/2") 
                 : (isAr ? "right-[1.6rem] bg-slate-400 -translate-y-1/2" : "left-1 bg-slate-400 -translate-y-1/2")
             )} />
          </button>
        </motion.div>

        {/* Developer Diagnostics Mode */}
        <motion.div 
          variants={itemVariants} 
          className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all shadow-xl relative overflow-hidden cursor-pointer" 
          onClick={() => setDevMode(!devMode)}
        >
          <div className="flex gap-5 items-center w-full md:w-auto mb-5 md:mb-0">
            <div className="w-13 h-13 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-amber-500/30 transition-colors shrink-0">
               <Code2 className="w-6 h-6 text-slate-300 group-hover:text-amber-400 transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h3 className="text-base font-bold text-white tracking-tight">{isAr ? "بيئة التشخيص وأدوات المطورين" : "Technical Hub Diagnostics"}</h3>
                 <span className="text-[10px] border border-amber-500/30 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                   <AlertTriangle className="w-3 h-3"/> {isAr ? "تشخيص" : "Debug"}
                 </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                {isAr ? "تفعيل واجهات فحص قاعدة البيانات المحلية ومؤشرات الأداء الداخلية المخصصة لفرق الصيانة البرمجية." : "Enable internal diagnostic overlays, raw database metrics, and developer-only testing interfaces."}
              </p>
            </div>
          </div>
          <button 
             onClick={(e) => { e.stopPropagation(); setDevMode(!devMode); }}
             className={cn(
               "w-12 h-6 rounded-full border transition-all duration-300 relative outline-none active:scale-95 shadow-inner grow-0 shrink-0", 
               devMode 
                ? "bg-amber-500 border-amber-400" 
                : "bg-slate-800 border-white/10"
             )}
          >
             <div className={cn(
               "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md", 
               devMode 
                 ? (isAr ? "right-1" : "left-[1.6rem]") 
                 : (isAr ? "right-[1.6rem] bg-slate-400" : "left-1 bg-slate-400")
             )} />
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}
