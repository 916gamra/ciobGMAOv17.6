import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/GlassCard';
import { useAnalyticsEngine } from '../hooks/useAnalyticsEngine';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PageHeader } from '@/shared/components/PageHeader';
import { Eye, TrendingUp, PackageSearch, PenTool, Database, Loader2, BarChart2 } from 'lucide-react';

export function AnalyticsDashboardPage() {
  const { kpis, topMachines, techActivity, stockHealth, isLoading } = useAnalyticsEngine();

  if (isLoading) {
    return <div className="p-12 flex items-center gap-3 text-slate-400 font-mono text-sm tracking-widest uppercase"><Loader2 className="w-5 h-5 animate-spin text-fuchsia-500" /> Booting The Oracle...</div>;
  }

  // Liquid Chart Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className=" border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">{label || payload[0]?.name}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-sm text-slate-200 flex items-center gap-3 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: p.color || p.fill }} />
              {p.name}: <span className="text-white font-mono font-bold ml-auto">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-auto flex flex-col gap-8 pb-24 px-4 relative z-10 lg:px-8">
      {/* Oracle Header */}
      <PageHeader
        title="Executive Analytics Hub"
        subtitle="Central nervous system telemetry. Global supply chain and maintenance insights."
        icon={<Eye />}
        badgeText="Oracle"
        badgeColor="fuchsia"
        className="mb-2"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0 }}>
          <GlassCard className="relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] !p-6 border-white/5 ">
             <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-emerald-500/20 to-transparent">
                  <Database className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Database className="w-3 h-3" /> Global Stock Volume</h3>
                  <div className="text-4xl font-bold font-mono text-white flex items-baseline gap-2 tracking-tight">
                    {kpis.totalStockVolume.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-bold uppercase tracking-widest">units</span>
                  </div>
                </div>
             </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <GlassCard className="relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] !p-6 border-white/5 ">
             <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-cyan-500/20 to-transparent">
                  <PackageSearch className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><PackageSearch className="w-3 h-3" /> Distinct Parts</h3>
                  <div className="text-4xl font-bold font-mono text-white flex items-baseline gap-2 tracking-tight">
                    {kpis.distinctParts.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-bold uppercase tracking-widest">blueprints</span>
                  </div>
                </div>
             </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <GlassCard className="relative overflow-hidden group hover:border-fuchsia-500/30 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] !p-6 border-white/5 ">
             <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/50 to-fuchsia-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 text-fuchsia-400 shrink-0 shadow-[0_0_15px_rgba(217,70,239,0.15)] group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-fuchsia-500/20 to-transparent">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Monthly Requisitions</h3>
                  <div className="text-4xl font-bold font-mono text-white flex items-baseline gap-2 tracking-tight">
                    {kpis.totalReqsThisMonth.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-bold uppercase tracking-widest">orders</span>
                  </div>
                </div>
             </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[450px]">
        
        {/* Left: Top Consuming Machines */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="h-[450px]">
          <GlassCard className="h-full flex flex-col relative overflow-hidden group !p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/5 ">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BarChart2 className="w-32 h-32 text-indigo-500 rotate-12" />
            </div>
            <div className="relative z-10 mb-8">
              <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-indigo-400" />
                </span>
                The Black Holes
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-11">Top Consuming Machines (Units Drafted)</p>
            </div>
            <div className="flex-1 relative z-10 -ml-4 min-h-0">
              {topMachines.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMachines} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} width={130} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="quantity" fill="#818cf8" radius={[0, 6, 6, 0]} barSize={20}>
                      {topMachines.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Database className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">Insufficient requisition data</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Right: Stock Health Pie */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="h-[450px]">
          <GlassCard className="h-full flex flex-col relative overflow-hidden group !p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/5 ">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <PieChart className="w-32 h-32 text-emerald-500" />
            </div>
            <div className="relative z-10 mb-8">
              <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                </span>
                Global Stock Health
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-11">Inventory Viability Index</p>
            </div>
            <div className="flex-1 relative z-10 flex flex-col items-center min-h-0">
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockHealth}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth={2}
                      cornerRadius={6}
                    >
                      {stockHealth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Custom Legend */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-4 shrink-0">
                {stockHealth.map(item => (
                  <div key={item.name} className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{item.name} <span className="text-white ml-2">{item.value}%</span></span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

      </div>

      {/* Bottom Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="shrink-0">
        <GlassCard className="relative overflow-hidden border-orange-500/10  !p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
           <div className="absolute top-0 right-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />
           <div className="relative z-10">
             <div className="mb-8">
               <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                 <span className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                   <PenTool className="w-4 h-4 text-orange-400" />
                 </span>
                 Top Requisitioning Technicians
               </h2>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-11">Operator Activity Telemetry</p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
                {techActivity.length > 0 ? techActivity.map((tech, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center hover:border-fuchsia-500/30 hover:bg-fuchsia-500/5 transition-all group duration-300 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent group-hover:via-fuchsia-500/50 transition-all opacity-0 group-hover:opacity-100" />
                     <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg mb-4 shadow-[0_0_15px_rgba(249,115,22,0.1)] group-hover:scale-110 transition-transform font-mono">
                       0{idx + 1}
                     </div>
                     <h3 className="text-sm font-bold text-white w-full truncate px-2 tracking-wide">{tech.name}</h3>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2 bg-black/40 px-3 py-1 rounded-md border border-white/5 group-hover:text-fuchsia-400 transition-colors">{tech.count} requests</span>
                  </div>
                )) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-3xl ">
                    <PenTool className="w-10 h-10 text-slate-600 mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Awaiting field activity to populate.</p>
                  </div>
                )}
             </div>
           </div>
        </GlassCard>
      </motion.div>

    </div>
  );
}
