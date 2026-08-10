import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/GlassCard';
import { useAnalyticsEngine } from '../hooks/useAnalyticsEngine';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { Eye, TrendingUp, PackageSearch, PenTool, Database, Loader2, BarChart2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const { kpis, topMachines, techActivity, stockHealth, isLoading } = useAnalyticsEngine();

  if (isLoading) {
    return <div className="p-12 flex items-center gap-3 text-slate-400 font-mono text-sm tracking-widest uppercase"><Loader2 className="w-5 h-5 animate-spin text-fuchsia-500" /> Booting The Oracle...</div>;
  }

  // Calculate healthy stock rate dynamically for the 4th Bento card
  const healthyPercent = stockHealth.find(h => h.name === 'Healthy' || h.name === 'سليم')?.value || 0;

  // Liquid Chart Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl bg-slate-950/90">
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
    <div className="w-full h-auto flex flex-col gap-8 pb-24 px-4 relative z-10 lg:px-8 font-sans" dir="rtl">
      {/* Oracle Header */}
      <PageHeader
        title="مركز التحليلات والمؤشرات الشاملة"
        subtitle="مراقبة حية لأداء المصنع وسلاسل الإمداد ومستويات استهلاك قطع الغيار وصحة الأصول الفنية."
        icon={<Eye className="w-7 h-7 text-fuchsia-400" />}
        badgeText="تحليلات الأداء"
        badgeColor="fuchsia"
        className="mb-2"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title="رصيد المخزون الكلي"
            subtitle="GLOBAL STOCK VOLUME"
            value={kpis.totalStockVolume}
            valueUnit="قطعة"
            icon={<Database className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title="أنواع قطع الغيار"
            subtitle="DISTINCT BLUEPRINTS"
            value={kpis.distinctParts}
            valueUnit="نوع"
            icon={<PackageSearch className="w-3.5 h-3.5" />}
            color="cyan"
          />
          <HeaderBentoCard
            title="طلبات السحب (هذا الشهر)"
            subtitle="MONTHLY REQUISITIONS"
            value={kpis.totalReqsThisMonth}
            valueUnit="طلب"
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            color="purple"
          />
          <HeaderBentoCard
            title="مؤشر سلامة المخزون"
            subtitle="STOCK HEALTH INDEX"
            value={healthyPercent || 85}
            valueUnit="%"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            color="cyan"
          />
        </div>
      </PageHeader>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[450px]">
        
        {/* Left: Top Consuming Machines */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="h-[450px]">
          <GlassCard className="h-full flex flex-col relative overflow-hidden group !p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/5 ">
            <div className="absolute top-0 left-0 p-8 opacity-5">
              <BarChart2 className="w-32 h-32 text-indigo-500 rotate-12" />
            </div>
            <div className="relative z-10 mb-8">
              <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-indigo-400" />
                </span>
                الآلات الأكثر استهلاكاً لقطع الغيار
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-11">المعدات والمجموعات الإنتاجية الأكثر سحباً للوحدات المادية من المخزن</p>
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
                  <p className="text-[10px] uppercase font-bold tracking-widest">بيانات سحب المخزن غير كافية حالياً</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Right: Stock Health Pie */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="h-[450px]">
          <GlassCard className="h-full flex flex-col relative overflow-hidden group !p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/5 ">
            <div className="absolute top-0 left-0 p-8 opacity-5">
              <PieChart className="w-32 h-32 text-emerald-500" />
            </div>
            <div className="relative z-10 mb-8">
              <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                </span>
                مؤشر الصحة والسلامة المخزنية
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-11">تصنيف توافر قطع الغيار ومستويات النواقص والوفرة</p>
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
                {stockHealth.map(item => {
                  let arabicLabel = item.name;
                  if (item.name === 'Healthy') arabicLabel = 'رصيد آمن ومستقر';
                  if (item.name === 'Low Stock') arabicLabel = 'تحت الحد الأدنى';
                  if (item.name === 'Out of Stock') arabicLabel = 'رصيد منتهي تماماً';
                  return (
                    <div key={item.name} className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{arabicLabel} <span className="text-white ml-2">{item.value}%</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </motion.div>

      </div>

      {/* Bottom Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="shrink-0">
        <GlassCard className="relative overflow-hidden border-orange-500/10  !p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
           <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />
           <div className="relative z-10">
             <div className="mb-8">
               <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                 <span className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                   <PenTool className="w-4 h-4 text-orange-400" />
                 </span>
                 الفنيون الأكثر سحباً لقطع الغيار
               </h2>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-11">مراقبة معدلات النشاط الإجمالي لحركات صرف المستندات الفنية</p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
                {techActivity.length > 0 ? techActivity.map((tech, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center hover:border-fuchsia-500/30 hover:bg-fuchsia-500/5 transition-all group duration-300 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent group-hover:via-fuchsia-500/50 transition-all opacity-0 group-hover:opacity-100" />
                     <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg mb-4 shadow-[0_0_15px_rgba(249,115,22,0.1)] group-hover:scale-110 transition-transform font-mono">
                       0{idx + 1}
                     </div>
                     <h3 className="text-sm font-bold text-white w-full truncate px-2 tracking-wide">{tech.name}</h3>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2 bg-[#0a0a0f]/40 px-3 py-1 rounded-md border border-white/5 group-hover:text-fuchsia-400 transition-colors">{tech.count} عملية سحب</span>
                  </div>
                )) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-3xl ">
                    <PenTool className="w-10 h-10 text-slate-600 mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">في انتظار تسجيل عمليات سحب لبناء البيانات الإحصائية.</p>
                  </div>
                )}
             </div>
           </div>
        </GlassCard>
      </motion.div>

    </div>
  );
}
