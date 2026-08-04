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

  const getCategoryIcon = (cat: SearchResultItem['category']) => {
    switch (cat) {
      case 'PDR':
        return <Box className="w-4 h-4 text-cyan-400" />;
      case 'MACHINE':
        return <Factory className="w-4 h-4 text-indigo-400" />;
      case 'TASK':
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'ENGINE':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto mb-10 z-40">
      {/* Gemini Capsule Search Input Container */}
      <div
        className={cn(
          "relative flex items-center w-full rounded-full transition-all duration-300",
          "bg-black/50 backdrop-blur-2xl border px-4 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]",
          isOpen
            ? "border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-black/80"
            : "border-white/15 hover:border-cyan-400/40 hover:bg-black/60"
        )}
      >
        <Sparkles className={cn(
          "w-5 h-5 ml-2 shrink-0 transition-all duration-300",
          isOpen ? "text-cyan-400 animate-pulse scale-110" : "text-slate-400"
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
          placeholder="ابحث عن قطعة غيار، آلة، أمر عمل، أو محرك تشغيل... (Ctrl + K)"
          className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-xs md:text-sm font-medium outline-none px-2"
        />

        {/* Keyboard shortcut hint pill */}
        <div className="flex items-center gap-1 shrink-0 mr-1 bg-white/[0.06] border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold text-slate-400 select-none">
          <Command className="w-3 h-3 text-cyan-400" />
          <span>K</span>
        </div>
      </div>

      {/* Dropdown Results Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full inset-x-0 bg-black/85 backdrop-blur-3xl border border-white/15 rounded-3xl p-3 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1">
              <span>نتائج البحث والتوجيه السريع</span>
              <span className="text-cyan-400 font-bold">{results.length} خيارات متاحة</span>
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
                        "flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 group text-right",
                        isSelected
                          ? "bg-cyan-500/15 border border-cyan-400/40 text-white shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                          : "bg-white/[0.02] border border-transparent text-slate-300 hover:bg-white/[0.06]"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                          isSelected ? "bg-cyan-400/20 border-cyan-400/50 scale-105" : "bg-white/5 border-white/10"
                        )}>
                          {getCategoryIcon(item.category)}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className={cn(
                            "text-xs font-bold truncate transition-colors",
                            isSelected ? "text-cyan-300" : "text-slate-200"
                          )}>
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
                            {item.badge}
                          </span>
                        )}
                        <ArrowRight className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          isSelected ? "text-cyan-400 translate-x-0.5" : "text-slate-600 group-hover:text-slate-400"
                        )} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between px-3 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3 text-cyan-400" />
                اضغط Enter للانتقال السريع
              </span>
              <span>استخدم الأسهم ↑ ↓ للتنقل</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
