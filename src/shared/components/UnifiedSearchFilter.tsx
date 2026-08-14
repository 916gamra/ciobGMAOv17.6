import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, Check, RotateCcw, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/utils';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  badgeColor?: 'emerald' | 'amber' | 'cyan' | 'rose' | 'indigo' | 'purple' | 'slate';
}

export interface FilterGroup {
  id: string;
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  type?: 'select' | 'chips';
  allLabel?: string;
  allValue?: string; // defaults to 'ALL'
  placeholder?: string;
}

export interface QuickTabOption {
  id: string;
  label: string;
  count?: number;
  color?: 'amber' | 'emerald' | 'cyan' | 'rose' | 'indigo' | 'fuchsia' | 'orange' | 'purple';
}

export interface UnifiedSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  quickTabs?: QuickTabOption[];
  activeQuickTab?: string;
  onQuickTabChange?: (id: string) => void;
  extraControls?: React.ReactNode;
  className?: string;
  themeColor?: 'white' | 'indigo' | 'cyan' | 'emerald' | 'amber' | 'purple' | 'orange';
  showActiveTags?: boolean;
  onResetAll?: () => void;
  fullWidth?: boolean;
}

export function UnifiedSearchFilter({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'بحث...',
  filterGroups = [],
  quickTabs,
  activeQuickTab,
  onQuickTabChange,
  extraControls,
  className,
  themeColor = 'white',
  showActiveTags = true,
  onResetAll,
  fullWidth = false
}: UnifiedSearchFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Calculate active filter count (excluding 'ALL' or empty)
  const activeFilters = filterGroups.filter(g => {
    const defaultVal = g.allValue !== undefined ? g.allValue : 'ALL';
    return g.value && g.value !== defaultVal && g.value !== '';
  });

  const activeCount = activeFilters.length;

  const handleResetFilters = () => {
    filterGroups.forEach(g => {
      const defaultVal = g.allValue !== undefined ? g.allValue : 'ALL';
      g.onChange(defaultVal);
    });
    if (onResetAll) {
      onResetAll();
    }
  };

  const themeStyles = {
    white: {
      focusRing: 'focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/15 focus-within:bg-[#121422]',
      activeBadge: 'bg-white text-slate-950 font-black shadow-md',
      activeBtn: 'border-white bg-white text-slate-950 font-black shadow-lg hover:bg-slate-100',
      activeTab: 'bg-white text-slate-950 font-extrabold shadow-md',
      chipActive: 'bg-white text-slate-950 font-extrabold border-white shadow-md',
      accentGlow: 'from-white/20 via-transparent to-transparent'
    },
    indigo: {
      focusRing: 'focus-within:border-indigo-500/50 focus-within:bg-[#121422]',
      activeBadge: 'bg-white text-slate-950 font-black shadow-indigo-500/30',
      activeBtn: 'border-white/40 bg-white/10 text-white font-extrabold hover:bg-white/20',
      activeTab: 'bg-white text-slate-950 font-extrabold shadow-md',
      chipActive: 'bg-white text-slate-950 font-extrabold border-white shadow-md',
      accentGlow: 'from-indigo-500/20 via-transparent to-transparent'
    },
    cyan: {
      focusRing: 'focus-within:border-cyan-500/50 focus-within:bg-[#121422]',
      activeBadge: 'bg-white text-slate-950 font-black shadow-cyan-500/30',
      activeBtn: 'border-white/40 bg-white/10 text-white font-extrabold hover:bg-white/20',
      activeTab: 'bg-white text-slate-950 font-extrabold shadow-md',
      chipActive: 'bg-white text-slate-950 font-extrabold border-white shadow-md',
      accentGlow: 'from-cyan-500/20 via-transparent to-transparent'
    },
    emerald: {
      focusRing: 'focus-within:border-emerald-500/50 focus-within:bg-[#121422]',
      activeBadge: 'bg-white text-slate-950 font-black shadow-emerald-500/30',
      activeBtn: 'border-white/40 bg-white/10 text-white font-extrabold hover:bg-white/20',
      activeTab: 'bg-white text-slate-950 font-extrabold shadow-md',
      chipActive: 'bg-white text-slate-950 font-extrabold border-white shadow-md',
      accentGlow: 'from-emerald-500/20 via-transparent to-transparent'
    },
    amber: {
      focusRing: 'focus-within:border-amber-500/50 focus-within:bg-[#121422]',
      activeBadge: 'bg-white text-slate-950 font-black shadow-amber-500/30',
      activeBtn: 'border-white/40 bg-white/10 text-white font-extrabold hover:bg-white/20',
      activeTab: 'bg-white text-slate-950 font-extrabold shadow-md',
      chipActive: 'bg-white text-slate-950 font-extrabold border-white shadow-md',
      accentGlow: 'from-amber-500/20 via-transparent to-transparent'
    },
    purple: {
      focusRing: 'focus-within:border-purple-500/50 focus-within:bg-[#121422]',
      activeBadge: 'bg-white text-slate-950 font-black shadow-purple-500/30',
      activeBtn: 'border-white/40 bg-white/10 text-white font-extrabold hover:bg-white/20',
      activeTab: 'bg-white text-slate-950 font-extrabold shadow-md',
      chipActive: 'bg-white text-slate-950 font-extrabold border-white shadow-md',
      accentGlow: 'from-purple-500/20 via-transparent to-transparent'
    },
    orange: {
      focusRing: 'focus-within:border-orange-500/50 focus-within:bg-[#121422]',
      activeBadge: 'bg-white text-slate-950 font-black shadow-orange-500/30',
      activeBtn: 'border-white/40 bg-white/10 text-white font-extrabold hover:bg-white/20',
      activeTab: 'bg-white text-slate-950 font-extrabold shadow-md',
      chipActive: 'bg-white text-slate-950 font-extrabold border-white shadow-md',
      accentGlow: 'from-orange-500/20 via-transparent to-transparent'
    }
  }[themeColor];

  const quickTabColorStyles = {
    amber: 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20',
    emerald: 'bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20',
    cyan: 'bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-500/20',
    rose: 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/20',
    indigo: 'bg-white text-slate-950 font-black shadow-md shadow-white/20',
    fuchsia: 'bg-fuchsia-400 text-slate-950 font-black shadow-md shadow-fuchsia-500/20',
    orange: 'bg-orange-400 text-slate-950 font-black shadow-md shadow-orange-500/20',
    purple: 'bg-white text-slate-950 font-black shadow-md shadow-white/20',
  };

  return (
    <div className={cn("flex flex-col gap-2.5", fullWidth ? "w-full" : "", className)}>
      {/* Primary Row: Quick Tabs + Search Input & Integrated Filter Button + Extra Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        {/* Quick Tabs (if provided) */}
        {quickTabs && quickTabs.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#0b0d14] border border-white/15 p-1 rounded-2xl overflow-x-auto custom-scrollbar shrink-0 shadow-xl">
            {quickTabs.map(tab => {
              const isActive = activeQuickTab === tab.id;
              const activeClass = tab.color ? quickTabColorStyles[tab.color] : themeStyles.activeTab;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onQuickTabChange?.(tab.id)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
                    isActive 
                      ? "bg-white text-slate-950 shadow-lg shadow-white/10 font-black" 
                      : "text-slate-300 hover:text-white hover:bg-white/[0.08] font-bold"
                  )}
                >
                  <span className="tracking-tight">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={cn(
                      "text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center",
                      isActive ? "bg-slate-950 text-white" : "bg-white/10 text-slate-300"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Integrated Search & Filter Group */}
        <div className="flex flex-1 items-center gap-2 relative max-w-full" ref={filterDropdownRef}>
          <div className={cn(
            "relative flex-1 flex items-center bg-[#0e1018]/90 hover:bg-[#141624] border border-white/15 hover:border-white/30 rounded-xl transition-all shadow-inner group",
            themeStyles.focusRing,
            isFilterOpen && "border-white/40 ring-1 ring-white/20"
          )}>
            {/* Search Icon */}
            <div className="absolute right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto pointer-events-none text-slate-400 group-focus-within:text-white transition-colors">
              <Search className="w-4 h-4" />
            </div>

            {/* Input Field */}
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors pr-9 pl-9 rtl:pr-9 rtl:pl-9 ltr:pl-9 ltr:pr-9 text-start font-medium"
            />

            {/* Clear Search Button (shows when searchTerm has text) */}
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Integrated Filter Popover Trigger Button */}
          {filterGroups.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen(prev => !prev)}
                className={cn(
                  "p-2 sm:px-3.5 sm:py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm relative",
                  isFilterOpen || activeCount > 0
                    ? themeStyles.activeBtn
                    : "bg-[#0e1018]/90 hover:bg-[#181a28] border-white/15 hover:border-white/30 text-white font-extrabold"
                )}
                title="تصفية النتائج"
                aria-expanded={isFilterOpen}
              >
                <Filter className={cn("w-4 h-4 transition-transform", isFilterOpen && "scale-110", (isFilterOpen || activeCount > 0) && "text-current")} />
                <span className="hidden sm:inline">فلاتر</span>

                {activeCount > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full font-mono text-[10px] font-black shadow-sm",
                    (isFilterOpen || activeCount > 0) && themeColor === 'white' ? "bg-slate-950 text-white" : themeStyles.activeBadge
                  )}>
                    {activeCount}
                  </span>
                )}
              </button>

              {/* Floating Filter Popover Menu */}
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-0 rtl:left-0 rtl:right-auto ltr:right-0 ltr:left-auto top-full mt-2 w-72 sm:w-88 bg-[#0c0e17]/98 border border-white/20 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-4 z-50 text-start"
                  >
                    {/* Header: Title & Clear All */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-white" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">خيارات التصفية</span>
                      </div>

                      {activeCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>إعادة ضبط</span>
                        </button>
                      )}
                    </div>

                    {/* Filter Groups List */}
                    <div className="space-y-4 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                      {filterGroups.map(group => {
                        const defaultVal = group.allValue !== undefined ? group.allValue : 'ALL';
                        const isGroupActive = group.value && group.value !== defaultVal && group.value !== '';

                        return (
                          <div key={group.id} className="space-y-2">
                            {/* Group Title */}
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-extrabold text-white uppercase tracking-wide flex items-center gap-1.5">
                                {group.icon && <span className="text-slate-400">{group.icon}</span>}
                                <span>{group.label}</span>
                              </label>
                              {isGroupActive && (
                                <button
                                  type="button"
                                  onClick={() => group.onChange(defaultVal)}
                                  className="text-[10px] text-slate-400 hover:text-white"
                                >
                                  إلغاء
                                </button>
                              )}
                            </div>

                            {/* Group Display: Chips or Dropdown */}
                            {group.type === 'chips' ? (
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => group.onChange(defaultVal)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer",
                                    group.value === defaultVal || !group.value
                                      ? themeStyles.chipActive
                                      : "bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/30 hover:text-white"
                                  )}
                                >
                                  {group.allLabel || 'الكل'}
                                </button>
                                {group.options.map(opt => {
                                  const isSelected = group.value === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => group.onChange(opt.value)}
                                      className={cn(
                                        "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer",
                                        isSelected
                                          ? themeStyles.chipActive
                                          : "bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/30 hover:text-white"
                                      )}
                                    >
                                      <span>{opt.label}</span>
                                      {opt.count !== undefined && (
                                        <span className="font-mono text-[9px] opacity-70">({opt.count})</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              /* Standard Select Option */
                              <div className="relative">
                                <select
                                  value={group.value || defaultVal}
                                  onChange={(e) => group.onChange(e.target.value)}
                                  className="w-full bg-[#141624] hover:bg-[#1a1d30] border border-white/15 focus:border-white/40 focus:ring-1 focus:ring-white/20 rounded-xl py-2 px-3 text-xs text-white appearance-none cursor-pointer focus:outline-none transition-colors font-medium"
                                >
                                  <option value={defaultVal} className="bg-[#0e1018] text-slate-300">
                                    {group.allLabel || `جميع ${group.label}`}
                                  </option>
                                  {group.options.map(opt => (
                                    <option key={opt.value} value={opt.value} className="bg-[#0e1018] text-white font-medium">
                                      {opt.label} {opt.count !== undefined ? `(${opt.count})` : ''}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Close Button */}
                    <div className="pt-3 mt-3 border-t border-white/10 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl py-2 text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>تطبيق الفلاتر</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Extra controls (e.g. view switchers or buttons) */}
          {extraControls && (
            <div className="shrink-0 flex items-center gap-2">
              {extraControls}
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Tags (Removable Pills) */}
      {showActiveTags && (activeCount > 0 || (searchTerm && searchTerm.length > 0)) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">الفلاتر النشطة:</span>
          
          {searchTerm && (
            <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-[11px] font-mono font-bold inline-flex items-center gap-1.5">
              <span>البحث: "{searchTerm}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-rose-400 text-slate-300 p-0.5 cursor-pointer"
                title="حذف"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeFilters.map(group => {
            const defaultVal = group.allValue !== undefined ? group.allValue : 'ALL';
            const matchedOption = group.options.find(o => o.value === group.value);
            const displayLabel = matchedOption ? matchedOption.label : group.value;

            return (
              <span
                key={group.id}
                className="px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>{group.label}: {displayLabel}</span>
                <button
                  type="button"
                  onClick={() => group.onChange(defaultVal)}
                  className="hover:text-rose-400 text-slate-300 p-0.5 cursor-pointer"
                  title="حذف الفلتر"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] text-slate-400 hover:text-rose-400 underline font-extrabold px-1.5 cursor-pointer"
          >
            مسح الكل
          </button>
        </div>
      )}
    </div>
  );
}
