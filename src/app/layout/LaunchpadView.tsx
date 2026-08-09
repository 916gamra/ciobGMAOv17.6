import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'motion/react';
import { Box, ShieldCheck, PieChart, Network, Settings, Factory, Activity, Cpu, Database, AlertTriangle, Users, Wrench } from 'lucide-react';
import { useOsStore } from '../store/useOsStore';
import { type PortalType } from '../store';
import type { User } from '@/core/db';
import { hasPortalAccess } from '@/core/permissions';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';
import { cn } from '@/shared/utils';
import { SystemBackground } from '@/shared/components/SystemBackground';
import { useNotificationsContext } from '@/shared/context/NotificationContext';
import { useTranslation } from 'react-i18next';
import { GeminiCommandBar } from './GeminiCommandBar';

// --- SYSTEM NODES CONFIGURATION ---
const APPS = [
  {
    id: 'PDR' as PortalType,
    title: 'PDR Engine',
    desc: 'Parts & Requisition Control',
    icon: Box,
    theme: 'cyan',
    sysCode: 'NODE-01'
  },
  {
    id: 'PREVENTIVE' as PortalType,
    title: 'Maintenance',
    desc: 'Preventive Task Scheduling',
    icon: ShieldCheck,
    theme: 'emerald',
    sysCode: 'NODE-02'
  },
  {
    id: 'CORRECTIVE' as PortalType,
    title: 'Corrective Ops',
    desc: 'Emergency Diagnostics & Repair',
    icon: Wrench,
    theme: 'orange',
    sysCode: 'NODE-07'
  },
  {
    id: 'ORGANIZATION' as PortalType,
    title: 'Part Catalog',
    desc: 'Master Reference Dictionary',
    icon: Network,
    theme: 'amber',
    sysCode: 'NODE-03'
  },
  {
    id: 'FACTORY' as PortalType,
    title: 'Factory Admin',
    desc: 'Sectors & Infrastructure',
    icon: Factory,
    theme: 'indigo',
    sysCode: 'NODE-04'
  },
  {
    id: 'ANALYTICS' as PortalType,
    title: 'Analytics Hub',
    desc: 'Executive Telemetry',
    icon: PieChart,
    theme: 'fuchsia',
    sysCode: 'NODE-05'
  },
  {
    id: 'SETTINGS' as PortalType,
    title: 'System Config',
    desc: 'RBAC & Global Security',
    icon: Settings,
    theme: 'rose',
    sysCode: 'NODE-06'
  }
];

const THEME_MAP: Record<string, string> = {
  cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-[inner_0_0_15px_rgba(34,211,238,0.1)]',
  emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[inner_0_0_15px_rgba(16,185,129,0.1)]',
  orange: 'text-orange-400 border-orange-500/30 bg-orange-500/10 shadow-[inner_0_0_15px_rgba(249,115,22,0.1)]',
  amber: 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[inner_0_0_15px_rgba(245,158,11,0.1)]',
  indigo: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 shadow-[inner_0_0_15px_rgba(99,102,241,0.1)]',
  fuchsia: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10 shadow-[inner_0_0_15px_rgba(217,70,239,0.1)]',
  rose: 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-[inner_0_0_15px_rgba(244,63,94,0.1)]',
};

const THEME_BG_MAP: Record<string, string> = {
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
  fuchsia: 'bg-fuchsia-500',
  rose: 'bg-rose-500',
};

const containerAnim: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemAnim: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

function LiveHeaderClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();

  return (
    <div className="flex flex-col items-start md:items-end md:text-right">
      <h2 className="text-3xl text-slate-200 tracking-tight font-medium">{formatTime(time)}</h2>
      <p className="text-sm text-slate-400 mt-1">{formatDate(time)}</p>
    </div>
  );
}

export function LaunchpadView({ user }: { user: User | null }) {
  const { t } = useTranslation();
  const setPortal = useOsStore(state => state.setPortal);
  const { getUnreadCountByPortal } = useNotificationsContext();

  // --- LIVE TELEMETRY HOOKS ---
  const stats = useLiveQuery(async () => {
    const [invCount, machinesCount, pendingOrders, usersCount] = await Promise.all([
      db.inventory.count(),
      db.machines.count(),
      db.taskExecutions.where('status').equals('PENDING').count(),
      db.userOverrides.count()
    ]);
    return { invCount, machinesCount, pendingOrders, usersCount };
  }, []);

  const visibleApps = APPS.filter(app => hasPortalAccess(user, app.id));

  return (
    <div className="flex flex-col h-full w-full relative overflow-y-auto overflow-x-hidden bg-transparent custom-scrollbar">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 xl:px-12 py-8 min-h-full flex flex-col">
        
        {/* --- OS HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 pt-8 md:pt-4">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                <div className="w-1.5 h-4 bg-emerald-500 rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center gap-3">
                TITANIC <span className="text-white/20 font-light border-l border-white/10 pl-3 ml-1">OS</span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-3 text-mono uppercase tracking-widest text-[10px]">
               <span className="w-2 h-2 rounded-full border border-white/30 flex items-center justify-center"><span className="w-1 h-1 bg-white/50 rounded-full" /></span>
               SECURE WORKSPACE INITIALIZED
            </p>
          </div>
          
          <LiveHeaderClock />
        </header>

        {/* --- TELEMETRY DASHBOARD --- */}
        <motion.section 
          variants={containerAnim}
          initial="hidden"
          animate="show"
          className="mb-12"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            <motion.div variants={itemAnim}>
              <GlassCard className="border-l-4 border-l-cyan-500 p-6 flex flex-col gap-3 group transition-all duration-500 hover:-translate-y-2 hover:border-y-cyan-500/30 hover:border-r-cyan-500/30 hover:shadow-[0_25px_50px_-12px_rgba(6,182,212,0.3)] hover:bg-cyan-500/[0.05]">
                 <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                   <Database className="w-5 h-5 text-cyan-400" />
                 </div>
                 <div>
                   <div className="text-3xl font-semibold text-slate-100">{stats?.invCount ?? '-'}</div>
                   <div className="text-sm text-slate-500 mt-1 font-medium group-hover:text-cyan-400/80 transition-colors">Inventory Items</div>
                 </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemAnim}>
              <GlassCard className="border-l-4 border-l-indigo-500 p-6 flex flex-col gap-3 group transition-all duration-500 hover:-translate-y-2 hover:border-y-indigo-500/30 hover:border-r-indigo-500/30 hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.3)] hover:bg-indigo-500/[0.05]">
                 <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                   <Factory className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div>
                   <div className="text-3xl font-semibold text-slate-100">{stats?.machinesCount ?? '-'}</div>
                   <div className="text-sm text-slate-500 mt-1 font-medium group-hover:text-indigo-400/80 transition-colors">Machines</div>
                 </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemAnim}>
              <GlassCard className="border-l-4 border-l-amber-500 p-6 flex flex-col gap-3 group transition-all duration-500 hover:-translate-y-2 hover:border-y-amber-500/30 hover:border-r-amber-500/30 hover:shadow-[0_25px_50px_-12px_rgba(245,158,11,0.3)] hover:bg-amber-500/[0.05]">
                 <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                   <AlertTriangle className="w-5 h-5 text-amber-400" />
                 </div>
                 <div>
                   <div className="text-3xl font-semibold text-amber-400">{stats?.pendingOrders ?? '-'}</div>
                   <div className="text-sm text-amber-500/80 mt-1 font-medium group-hover:text-amber-400 transition-colors">Pending Tasks</div>
                 </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemAnim}>
              <GlassCard className="border-l-4 border-l-emerald-500 p-6 flex flex-col gap-3 group transition-all duration-500 hover:-translate-y-2 hover:border-y-emerald-500/30 hover:border-r-emerald-500/30 hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.3)] hover:bg-emerald-500/[0.05]">
                 <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                   <Users className="w-5 h-5 text-emerald-400" />
                 </div>
                 <div>
                   <div className="text-3xl font-semibold text-slate-100">{stats?.usersCount ?? '-'}</div>
                   <div className="text-sm text-slate-500 mt-1 font-medium group-hover:text-emerald-400/80 transition-colors">Active Users</div>
                 </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.section>

        {/* --- GEMINI COMMAND BAR --- */}
        <GeminiCommandBar />

        {/* --- SYSTEM NODES (PORTALS) --- */}
        <section className="flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-400 mb-6">Applications</h3>
          
          <motion.div 
            variants={containerAnim}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {visibleApps.map((app) => {
              const themeStyle = THEME_MAP[app.theme];
              const themeBg = THEME_BG_MAP[app.theme];
              
              return (
                <motion.div 
                  key={app.id} 
                  variants={itemAnim} 
                  className="h-full"
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlassCard 
                    onClick={() => setPortal(app.id)}
                    className={cn(
                      "group flex flex-col p-0 h-[240px] !bg-[#0a0a0f]/40 border-white/5 hover:border-white/30 transition-all duration-500 overflow-hidden cursor-pointer relative",
                      "hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]"
                    )}
                  >
                    {/* Dynamic Glow Reflex */}
                    <div className={cn(
                      "absolute -top-24 -right-24 w-64 h-64 blur-[80px] opacity-10 group-hover:opacity-40 transition-all duration-1000 pointer-events-none rounded-full",
                      themeBg
                    )} />
                    
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="p-8 relative z-10 flex-1 flex flex-col">
                       <div className="flex justify-between items-start mb-auto relative">
                           <div className={cn(
                             "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-700 shadow-xl group-hover:rotate-[5deg]",
                             themeStyle
                           )}>
                             <app.icon className="w-8 h-8 stroke-[1.2] group-hover:scale-110 transition-transform" />
                           </div>
                           
                           <div className="flex flex-col items-end gap-2">
                             <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-[0.2em]">{app.sysCode}</span>
                             {getUnreadCountByPortal(app.id) > 0 && (
                               <motion.span 
                                 initial={{ scale: 0 }}
                                 animate={{ scale: 1 }}
                                 className={cn(
                                   "flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-lg border border-white/20",
                                   themeBg
                                 )}
                               >
                                 {getUnreadCountByPortal(app.id)} NEW
                               </motion.span>
                             )}
                           </div>
                       </div>

                       <div className="transform group-hover:translate-x-1 transition-transform duration-500">
                           <h3 className="text-2xl font-bold text-slate-100 tracking-tight mb-2 group-hover:text-white transition-colors">{t(`portals.${app.id.toLowerCase()}`, app.title)}</h3>
                           <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[80%] group-hover:text-slate-300 transition-colors">{app.desc}</p>
                       </div>
                    </div>
                    
                    <div className="h-1 w-full bg-white/5 relative overflow-hidden">
                       <div className={cn("h-full w-0 group-hover:w-full transition-all duration-1000 ease-out", themeBg)} />
                       <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] pointer-events-none opacity-0 group-hover:opacity-100" />
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

      </div>
    </div>
  );
}
