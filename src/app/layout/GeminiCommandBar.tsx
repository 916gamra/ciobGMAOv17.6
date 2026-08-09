import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Box, Factory, Wrench, ArrowRight, CornerDownLeft, Command, ShieldCheck, Network, PieChart, Settings } from 'lucide-react';
import { useOsStore } from '../store/useOsStore';
import { type PortalType } from '../store';
import { db } from '@/core/db';
import { cn } from '@/shared/utils';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'PDR' | 'MACHINE' | 'TASK' | 'ENGINE';
  portalId: PortalType;
  badge?: string;
  code?: string;
}

const ENGINE_SEARCH_LIST = [
  { id: 'PDR', title: 'PDR Engine - قطع الغيار والمخزن', subtitle: 'إدارة الرصيد المادي، حركات الصرف، والمستودع', category: 'ENGINE' as const, portalId: 'PDR' as PortalType, code: 'NODE-01' },
  { id: 'PREVENTIVE', title: 'Maintenance Engine - الصيانة الوقائية', subtitle: 'جدولة المهام والوعي الوقائي للمكائن', category: 'ENGINE' as const, portalId: 'PREVENTIVE' as PortalType, code: 'NODE-02' },
  { id: 'CORRECTIVE', title: 'Corrective Ops - الصيانة العلاجية', subtitle: 'أوامر العمل السريعة وإصلاح الأعطال', category: 'ENGINE' as const, portalId: 'CORRECTIVE' as PortalType, code: 'NODE-07' },
  { id: 'ORGANIZATION', title: 'Part Catalog - كود وتصنيف الكتالوج', subtitle: 'قالب وبصمة القطع الهندسية للشركة', category: 'ENGINE' as const, portalId: 'ORGANIZATION' as PortalType, code: 'NODE-03' },
  { id: 'FACTORY', title: 'Factory Admin - المعمل والأقسام', subtitle: 'إدارة الآلات والمعدات والقطاعات الصناعية', category: 'ENGINE' as const, portalId: 'FACTORY' as PortalType, code: 'NODE-04' },
  { id: 'ANALYTICS', title: 'Analytics Hub - التقارير والمؤشرات', subtitle: 'تحليلات الأداء والإنفاق والصيانة الإجمالية', category: 'ENGINE' as const, portalId: 'ANALYTICS' as PortalType, code: 'NODE-05' },
  { id: 'SETTINGS', title: 'System Config - إعدادات النظام', subtitle: 'الصلاحيات والمقاعد والمستخدمين', category: 'ENGINE' as const, portalId: 'SETTINGS' as PortalType, code: 'NODE-06' },
];

export function GeminiCommandBar() {
  const setPortal = useOsStore(state => state.setPortal);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform multi-entity search
  useEffect(() => {
    if (!query.trim()) {
      setResults(ENGINE_SEARCH_LIST);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    let isCancelled = false;

    const executeSearch = async () => {
      try {
        const [blueprints, templates, machineTemplates, machines, prevTasks, taskExecs] = await Promise.all([
          db.pdrBlueprints.toArray(),
          db.pdrTemplates.toArray(),
          db.machineTemplates.toArray(),
          db.machines.toArray(),
          db.preventiveTasks.toArray(),
          db.taskExecutions.toArray(),
        ]);

        if (isCancelled) return;

        const templateMap = new Map(templates.map(t => [t.id, t]));
        const machineTemplateMap = new Map(machineTemplates.map(m => [m.id, m]));
        const prevTaskMap = new Map(prevTasks.map(pt => [pt.id, pt]));

        const pdrResults: SearchResultItem[] = blueprints
          .filter(bp => {
            const tmpl = templateMap.get(bp.templateId);
            return (
              bp.reference?.toLowerCase().includes(searchTerm) ||
              bp.model?.toLowerCase().includes(searchTerm) ||
              tmpl?.name?.toLowerCase().includes(searchTerm) ||
              tmpl?.skuBase?.toLowerCase().includes(searchTerm)
            );
          })
          .slice(0, 5)
          .map(bp => {
            const tmpl = templateMap.get(bp.templateId);
            return {
              id: bp.id,
              title: `${tmpl?.name || 'قطعة'} (${bp.reference})`,
              subtitle: `الموديل: ${bp.model || tmpl?.skuBase || '-'} | الحد الأدنى: ${bp.minThreshold} ${bp.unit}`,
              category: 'PDR',
              portalId: 'PDR',
              badge: bp.reference,
            };
          });

        const machineResults: SearchResultItem[] = machines
          .filter(m => {
            const tmpl = m.templateId ? machineTemplateMap.get(m.templateId) : null;
            return (
              m.referenceCode?.toLowerCase().includes(searchTerm) ||
              m.serialNumber?.toLowerCase().includes(searchTerm) ||
              tmpl?.name?.toLowerCase().includes(searchTerm)
            );
          })
          .slice(0, 4)
          .map(m => {
            const tmpl = m.templateId ? machineTemplateMap.get(m.templateId) : null;
            return {
              id: m.id,
              title: `آلة: ${tmpl?.name || m.referenceCode}`,
              subtitle: `الرمز: ${m.referenceCode} | الرقم التسلسلي: ${m.serialNumber || 'N/A'}`,
              category: 'MACHINE',
              portalId: 'FACTORY',
              badge: m.referenceCode,
            };
          });

        const taskResults: SearchResultItem[] = taskExecs
          .filter(t => {
            const pt = prevTaskMap.get(t.taskId);
            return (
              pt?.title?.toLowerCase().includes(searchTerm) ||
              t.notes?.toLowerCase().includes(searchTerm) ||
              t.bonId?.toLowerCase().includes(searchTerm)
            );
          })
          .slice(0, 4)
          .map(t => {
            const pt = prevTaskMap.get(t.taskId);
            return {
              id: t.id,
              title: `مهمة صيانة: ${pt?.title || t.bonId || 'عملية صيانة'}`,
              subtitle: `تاريخ الجدولة: ${t.scheduledDate} | الحالة: ${t.status}`,
              category: 'TASK',
              portalId: t.serviceType === 'CORR' ? 'CORRECTIVE' : 'PREVENTIVE',
              badge: t.bonId || t.status,
            };
          });

        const engineResults: SearchResultItem[] = ENGINE_SEARCH_LIST.filter(
          e => e.title.toLowerCase().includes(searchTerm) || e.subtitle.toLowerCase().includes(searchTerm)
        );

        const combined = [...pdrResults, ...machineResults, ...taskResults, ...engineResults];
        setResults(combined);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Command bar search error:', err);
      }
    };

    executeSearch();

    return () => {
      isCancelled = true;
    };
  }, [query]);

  const handleSelectResult = (item: SearchResultItem) => {
    setPortal(item.portalId);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    }
  };

  const getCategoryIcon = (item: SearchResultItem) => {
    if (item.category === 'ENGINE') {
      switch (item.portalId) {
        case 'PDR': return <Box className="w-4 h-4 text-cyan-400" />;
        case 'PREVENTIVE': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
        case 'CORRECTIVE': return <Wrench className="w-4 h-4 text-orange-400" />;
        case 'ORGANIZATION': return <Network className="w-4 h-4 text-amber-400" />;
        case 'FACTORY': return <Factory className="w-4 h-4 text-indigo-400" />;
        case 'ANALYTICS': return <PieChart className="w-4 h-4 text-fuchsia-400" />;
        case 'SETTINGS': return <Settings className="w-4 h-4 text-rose-400" />;
        default: return <Sparkles className="w-4 h-4 text-slate-400" />;
      }
    }

    switch (item.category) {
      case 'PDR':
        return <Box className="w-4 h-4 text-cyan-400" />;
      case 'MACHINE':
        return <Factory className="w-4 h-4 text-indigo-400" />;
      case 'TASK':
        return <Wrench className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto mb-10 z-40">
      {/* Search Input Container */}
      <div
        className={cn(
          "relative flex items-center w-full rounded-2xl transition-all duration-300",
          "bg-white/[0.03] backdrop-blur-xl border px-4 py-2.5",
          isOpen
            ? "border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-white/[0.06]"
            : "border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
        )}
      >
        <Search className={cn(
          "w-5 h-5 ml-3 shrink-0 transition-colors duration-300",
          isOpen ? "text-cyan-400" : "text-slate-400"
        )} />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="ابحث عن قطعة غيار، آلة، أمر عمل، أو محرك تشغيل..."
          className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm font-medium outline-none px-2"
        />
      </div>

      {/* Dropdown Results Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full inset-x-0 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 mb-1">
              <span>نتائج البحث</span>
              <span className="text-cyan-400/80">{results.length} نتائج</span>
            </div>

            {results.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                لم يتم العثور على نتائج تطابق <span className="text-cyan-400 font-bold">"{query}"</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {results.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={`${item.category}-${item.id}-${index}`}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 text-right",
                        isSelected
                          ? "bg-white/10 text-white"
                          : "bg-transparent text-slate-300 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-150",
                          isSelected ? "bg-white/10 border-white/20" : "bg-transparent border-transparent"
                        )}>
                          {getCategoryIcon(item)}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className={cn(
                            "text-sm font-semibold truncate transition-colors duration-150",
                            isSelected ? "text-cyan-100" : "text-slate-200"
                          )}>
                            {item.title}
                          </span>
                          <span className={cn(
                            "text-[11px] truncate mt-0.5",
                            isSelected ? "text-cyan-100/70" : "text-slate-400"
                          )}>
                            {item.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.badge && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between px-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="w-3 h-3 opacity-70" />
                <span>انتقال سريع</span>
              </span>
              <span>استخدم ↑ ↓ للتنقل</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
