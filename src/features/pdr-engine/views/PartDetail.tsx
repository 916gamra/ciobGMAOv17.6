import React, { useMemo } from 'react';
import { GlassCard } from '@/shared/components/GlassCard';
import { Box, Hash, Layers, Folder, Package, MapPin, Activity, CalendarClock, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { PdrPageSkeleton } from '../components/PdrPageSkeleton';
import { motion, AnimatePresence } from 'motion/react';

export function PartDetail({ tabId }: { tabId: string }) {
  // tabId format usually would be like "part-detail:SOME_UUID", or maybe just passed plainly.
  // let's extract the UUID if it uses a compound notation
  const blueprintId = tabId.includes(':') ? tabId.split(':')[1] : tabId;

  const data = useLiveQuery(async () => {
    const bp = await db.pdrBlueprints.get(blueprintId);
    if (!bp) return null;
    
    const tpl = await db.pdrTemplates.get(bp.templateId);
    const fam = tpl ? await db.pdrFamilies.get(tpl.familyId) : null;
    
    const stockItems = await db.inventory.where('blueprintId').equals(bp.id).toArray();
    
    // For movements, we need to gather all stock movements for all stock items associated with this blueprint.
    const stockIds = stockItems.map(s => s.id);
    const allMovements = await db.movements.where('stockId').anyOf(stockIds).reverse().sortBy('timestamp');

    return { bp, tpl, fam, stockItems, movements: allMovements };
  }, [blueprintId]);

  if (data === undefined) {
    return <PdrPageSkeleton />;
  }

  if (data === null) {
    return (
      <div className="w-full space-y-6 pb-12 pt-12 lg:px-8">
        <GlassCard className="py-12 text-center text-slate-400 border border-dashed border-red-500/20 bg-red-500/5">
          <Box className="w-12 h-12 mx-auto mb-4 opacity-50 text-red-500" />
          <h3 className="text-lg font-medium text-white mb-1">Entity Not Found</h3>
          <p className="max-w-sm mx-auto text-sm text-slate-400">The mechanical blueprint requested could not be located in the database. It might have been deleted.</p>
        </GlassCard>
      </div>
    );
  }

  const { bp, tpl, fam, stockItems, movements } = data;
  const totalStock = stockItems.reduce((acc, curr) => acc + curr.quantityCurrent, 0);
  const isCriticalOut = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock <= bp.minThreshold;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full space-y-6 pb-12 lg:px-8"
    >
      <header className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8 pt-2">
        <div>
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
             <span className="flex items-center gap-1"><Folder className="w-3.5 h-3.5"/> {fam?.name || 'Unknown Family'}</span>
             <span>/</span>
             <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5"/> {tpl?.name || 'Unknown Template'}</span>
           </div>
           <h1 className="text-3xl font-bold text-slate-100 tracking-tight mb-2 flex items-center gap-3">
            <Hash className="w-8 h-8 text-blue-400 opacity-60" /> 
            {bp.reference}
          </h1>
          <p className="text-slate-400 font-mono text-sm pl-11">
            SKU Base Context: {tpl?.skuBase}
          </p>
        </div>

        <div className="flex gap-4">
          <GlassCard className="!p-4 text-center min-w-[120px] bg-black/40 border-white/10">
             <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Unit Config</div>
             <div className="text-xl font-medium text-white">{bp.unit}</div>
          </GlassCard>
          <GlassCard className="!p-4 text-center min-w-[120px] bg-black/40 border-white/10">
             <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Threshold</div>
             <div className="text-xl font-mono text-emerald-400">{bp.minThreshold}</div>
          </GlassCard>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Context Data */}
        <div className="space-y-6">
          <GlassCard className={`relative overflow-hidden ${isCriticalOut ? 'border-red-500/30 bg-red-500/5' : isLowStock ? 'border-amber-500/30 bg-amber-500/5' : 'bg-cyan-500/5 border-cyan-500/20'}`}>
             <div className="flex justify-between items-start mb-4">
               <div>
               <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Total Physical Inventory</h3>
                  <div className={`text-4xl font-bold mt-2 ${isCriticalOut ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-blue-400'}`}>
                    {totalStock}
                  </div>
               </div>
               <div className={`p-3 rounded-xl border ${isCriticalOut ? 'bg-red-500/10 border-red-500/20 text-red-500' : isLowStock ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500'}`}>
                 <Package className="w-6 h-6" />
               </div>
             </div>
             {isCriticalOut ? (
               <div className="text-sm font-medium text-red-400">Critical: Stock completely depleted. Action required.</div>
             ) : isLowStock ? (
               <div className="text-sm font-medium text-amber-400">Warning: Stock is equal to or below minimum threshold.</div>
             ) : (
               <div className="text-sm font-medium text-cyan-400/80">Stock levels refer to healthy parameters.</div>
             )}
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden">
             <div className="p-4 border-b border-white/10 bg-black/20 text-sm font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" /> Bin Locations
             </div>
             <div className="divide-y divide-white/10 max-h-[300px] overflow-auto">
               {stockItems.length === 0 ? (
                 <div className="p-6 text-center text-sm text-slate-400 font-medium">No active locations mapped.</div>
               ) : (
                 stockItems.map(s => (
                   <div key={s.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div>
                        <div className="font-medium text-white">{s.warehouseId}</div>
                        {s.locationDetails && <div className="text-xs text-slate-400 mt-0.5">{s.locationDetails}</div>}
                      </div>
                      <div className="font-mono text-lg font-bold text-cyan-400">{s.quantityCurrent}</div>
                   </div>
                 ))
               )}
             </div>
          </GlassCard>
        </div>

        {/* Right Col - Telemetry */}
        <div className="lg:col-span-2">
           <GlassCard className="h-[600px] flex flex-col p-0 overflow-hidden">
             <div className="p-5 border-b border-white/10 bg-black/20 flex justify-between items-center shrink-0">
                <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" /> 
                  Component Telemetry Log
                </h2>
                <div className="text-xs font-mono text-slate-400 px-3 py-1 bg-black/40 rounded-full border border-white/5 shadow-inner">
                  {movements.length} Records
                </div>
             </div>
             
             <div className="flex-1 overflow-auto p-2 bg-[#05050A]">
                {movements.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-slate-400 text-sm font-medium">
                    <CalendarClock className="w-8 h-8 mb-3 opacity-30" />
                    No historical movements recorded.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {movements.map(m => (
                      <div key={m.id} className="p-4 bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl flex items-center gap-6">
                        {/* Directed Metric */}
                        <div className="flex items-center gap-3 w-32 shrink-0">
                          {m.type === 'IN' ? (
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 shadow-inner">
                              <ArrowDownRight className="w-4 h-4" />
                            </div>
                          ) : m.type === 'OUT' ? (
                            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shadow-inner">
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 shadow-inner">
                              <RefreshCcw className="w-4 h-4" />
                            </div>
                          )}
                          <div className={`font-mono text-xl font-bold ${m.type === 'IN' ? 'text-emerald-400' : m.type === 'OUT' ? 'text-amber-400' : 'text-blue-400'}`}>
                            {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : ''}{m.quantity}
                          </div>
                        </div>

                        {/* Actor & Details */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate block">System Operation: {m.type}</div>
                           {m.notes && <div className="text-xs text-slate-400 mt-0.5 truncate">{m.notes}</div>}
                        </div>

                        {/* Timestamp */}
                        <div className="text-right shrink-0">
                          <div className="text-[13px] font-mono text-white opacity-90">
                            {new Date(m.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400uppercase mt-0.5">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
             </div>
           </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}
