import { PageHeader } from "@/shared/components/PageHeader";
import React, { useState, useEffect } from 'react';
import { Shield, LockKeyhole, Timer, Fingerprint, Code2, AlertTriangle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { motion, Variants } from 'motion/react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function SecurityPoliciesView() {
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
    toast.success('Policies Updated', {
       description: 'System security configuration successfully saved.',
       icon: <Shield className="w-4 h-4 text-emerald-500" />
    });
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-12 pt-4 px-4 md:px-0 relative w-full lg:px-8"
    >
      <PageHeader
        title="Network Policies"
        subtitle="Global configuration capabilities for system-wide access parameters and interface behavior settings."
        icon={<Settings className="w-6 h-6 text-slate-400" />}
        actions={
          <button 
            onClick={handleSave}
            className="titan-button titan-button-primary"
          >
            <Shield className="w-4 h-4" /> Save Configuration
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 relative z-10">
        
        {/* Session Timeout */}
        <motion.div variants={itemVariants} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-colors shadow-lg hover:shadow-xl relative overflow-hidden">
          <div className="flex gap-6 items-center w-full md:w-auto mb-6 md:mb-0">
            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shadow-inner group-hover:border-blue-500/30 transition-colors duration-300 shrink-0">
               <Timer className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                 <h3 className="text-lg font-bold text-slate-200 tracking-tight">Session Decay Rate</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-md">Determine the chronological inactivity threshold before an active session is automatically logged out.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/5 shadow-inner w-full md:w-auto justify-between md:justify-start group-hover:border-blue-500/20 transition-all">
            <input 
              type="number" 
              min="1" 
              max="120"
              value={autoLogoutMinutes}
              onChange={(e) => setAutoLogoutMinutes(parseInt(e.target.value))}
              className="w-16 bg-transparent text-center text-xl font-bold text-white outline-none focus:text-blue-400 transition-colors"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pr-3">Minutes</span>
          </div>
        </motion.div>

        {/* Strict Hardware Validation */}
        <motion.div variants={itemVariants} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-colors shadow-lg hover:shadow-xl relative overflow-hidden">
          <div className="flex gap-6 items-center w-full md:w-auto mb-6 md:mb-0">
            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shadow-inner group-hover:border-cyan-500/30 transition-colors shrink-0">
               <Fingerprint className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                 <h3 className="text-lg font-bold text-slate-200 tracking-tight">Zero-Trust Guard (Strict Mode)</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-md">Require additional cryptographic validation for core structural alterations or destructive actions.</p>
            </div>
          </div>
          <button 
             onClick={() => setStrictMode(!strictMode)}
             className={cn(
                "w-12 h-6 rounded-full border transition-colors relative outline-none active:scale-95 shadow-inner grow-0 shrink-0", 
                strictMode 
                 ? "bg-blue-600 border-blue-500" 
                 : "bg-black/60 border-white/10"
              )}
          >
             <div className={cn(
               "absolute top-1/2 w-4 h-4 rounded-full bg-white transition-all shadow-md", 
               strictMode ? "left-[1.6rem] bg-white -translate-y-1/2" : "left-1 bg-slate-500 -translate-y-1/2"
             )} />
          </button>
        </motion.div>

        {/* Developer Mode */}
        <motion.div variants={itemVariants} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-colors shadow-lg hover:shadow-xl relative overflow-hidden cursor-pointer" onClick={() => setDevMode(!devMode)}>
          <div className="flex gap-6 items-center w-full md:w-auto mb-6 md:mb-0">
            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shadow-inner group-hover:border-amber-500/30 transition-colors shrink-0">
               <Code2 className="w-6 h-6 text-slate-400 group-hover:text-amber-400 transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                 <h3 className="text-lg font-bold text-slate-200 tracking-tight">Technical Hub Diagnostics</h3>
                 <span className="text-[9px] border border-amber-500/30 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-3 h-3"/> Debug</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-md">Enable internal diagnostic overlays, raw database metrics, and developer-only testing interfaces.</p>
            </div>
          </div>
          <button 
             onClick={(e) => { e.stopPropagation(); setDevMode(!devMode); }}
             className={cn(
               "w-12 h-6 rounded-full border transition-all duration-300 relative outline-none active:scale-95 shadow-inner grow-0 shrink-0", 
               devMode 
                ? "bg-amber-600 border-amber-500" 
                : "bg-black/60 border-white/10"
             )}
          >
             <div className={cn(
               "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md", 
               devMode ? "left-[1.6rem] bg-white" : "left-1 bg-slate-500"
             )} />
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}
