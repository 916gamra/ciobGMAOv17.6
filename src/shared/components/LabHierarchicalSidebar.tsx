import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Plus, 
  RefreshCw, 
  Layers, 
  Cpu, 
  Wrench, 
  Zap, 
  Sliders, 
  X, 
  FolderTree,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/shared/utils';

export type EngineTheme = 'cyan' | 'amber' | 'indigo' | 'orange' | 'violet' | 'emerald' | 'blue' | 'slate';

export interface HierarchyBlueprintNode {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  isInStock?: boolean;
  stockQty?: number;
  badge?: string;
  status?: string;
  raw?: any;
}

export interface HierarchyTemplateNode {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  count?: number;
  items?: HierarchyBlueprintNode[];
  raw?: any;
}

export interface HierarchyFamilyNode {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  icon?: React.ElementType;
  discipline?: 'mechanical' | 'electrical' | 'hydraulic' | 'pneumatic' | 'electronic' | 'general';
  count?: number;
  totalItemsCount?: number;
  templates?: HierarchyTemplateNode[];
  raw?: any;
}

export interface LabHierarchicalSidebarProps {
  title: string;
  subtitle: string;
  families: HierarchyFamilyNode[];
  selectedFamilyId?: string | null;
  selectedTemplateId?: string | null;
  selectedBlueprintId?: string | null;
  onSelectFamily?: (family: HierarchyFamilyNode | null) => void;
  onSelectTemplate?: (template: HierarchyTemplateNode | null, family: HierarchyFamilyNode | null) => void;
  onSelectBlueprint?: (blueprint: HierarchyBlueprintNode | null, template: HierarchyTemplateNode | null, family: HierarchyFamilyNode | null) => void;
  
  // Primary & Utility Actions
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  primaryActionIcon?: React.ElementType;
  
  onResetSelection?: () => void;
  resetLabel?: string;
  
  onRefresh?: () => void;
  isRefreshing?: boolean;
  
  onQuickAddTemplate?: (family: HierarchyFamilyNode) => void;
  onQuickAddBlueprint?: (template: HierarchyTemplateNode, family: HierarchyFamilyNode) => void;
  
  // Theming & Options
  engineTheme?: EngineTheme;
  showSearch?: boolean;
  searchPlaceholder?: string;
  className?: string;
  emptyMessage?: string;
  level3Enabled?: boolean;
  
  // Custom Tabs Support
  customTabs?: { id: string; label: string; count?: number; icon?: React.ElementType }[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
}

const THEME_CONFIG: Record<EngineTheme, {
  containerBorder: string;
  containerShadow: string;
  containerBg: string;
  ambientGlow: string;
  accentText: string;
  selectedBorder: string;
  selectedBg: string;
  selectedShadow: string;
  selectedText: string;
  badgeSelectedBg: string;
  badgeSelectedBorder: string;
  badgeSelectedText: string;
  iconSelectedBg: string;
  iconSelectedText: string;
  activeChevron: string;
  indicatorStrip?: string;
  inputFocusBorder: string;
  inputFocusRing: string;
  inputSearchIconFocus: string;
}> = {
  amber: {
    containerBorder: 'border-amber-500/30',
    containerShadow: 'shadow-[0_10px_30px_rgba(245,158,11,0.12)]',
    containerBg: 'bg-gradient-to-b from-amber-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    ambientGlow: 'bg-amber-500/15',
    accentText: 'text-amber-400',
    selectedBorder: 'border-white/20',
    selectedBg: 'bg-white/10',
    selectedShadow: 'shadow-md',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-amber-500/20',
    badgeSelectedBorder: 'border-amber-500/40',
    badgeSelectedText: 'text-amber-200',
    iconSelectedBg: 'bg-amber-500/20',
    iconSelectedText: 'text-amber-300',
    activeChevron: 'text-amber-400',
    indicatorStrip: 'bg-amber-400',
    inputFocusBorder: 'focus:border-amber-500/50',
    inputFocusRing: 'focus:ring-amber-500/30',
    inputSearchIconFocus: 'group-focus-within:text-amber-400',
  },
  cyan: {
    containerBorder: 'border-cyan-500/30',
    containerShadow: 'shadow-[0_10px_30px_rgba(6,182,212,0.12)]',
    containerBg: 'bg-gradient-to-b from-cyan-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    ambientGlow: 'bg-cyan-500/15',
    accentText: 'text-cyan-400',
    selectedBorder: 'border-white/20',
    selectedBg: 'bg-white/10',
    selectedShadow: 'shadow-md',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-cyan-500/20',
    badgeSelectedBorder: 'border-cyan-500/40',
    badgeSelectedText: 'text-cyan-200',
    iconSelectedBg: 'bg-cyan-500/20',
    iconSelectedText: 'text-cyan-300',
    activeChevron: 'text-cyan-400',
    indicatorStrip: 'bg-cyan-400',
    inputFocusBorder: 'focus:border-cyan-500/50',
    inputFocusRing: 'focus:ring-cyan-500/30',
    inputSearchIconFocus: 'group-focus-within:text-cyan-400',
  },
  indigo: {
    containerBorder: 'border-indigo-500/30',
    containerShadow: 'shadow-[0_10px_30px_rgba(99,102,241,0.12)]',
    containerBg: 'bg-gradient-to-b from-indigo-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    ambientGlow: 'bg-indigo-500/15',
    accentText: 'text-indigo-400',
    selectedBorder: 'border-white/20',
    selectedBg: 'bg-white/10',
    selectedShadow: 'shadow-md',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-indigo-500/20',
    badgeSelectedBorder: 'border-indigo-500/40',
    badgeSelectedText: 'text-indigo-200',
    iconSelectedBg: 'bg-indigo-500/20',
    iconSelectedText: 'text-indigo-300',
    activeChevron: 'text-indigo-400',
    indicatorStrip: 'bg-indigo-400',
    inputFocusBorder: 'focus:border-indigo-500/50',
    inputFocusRing: 'focus:ring-indigo-500/30',
    inputSearchIconFocus: 'group-focus-within:text-indigo-400',
  },
  orange: {
    containerBorder: 'border-orange-500/30',
    containerShadow: 'shadow-[0_10px_30px_rgba(249,115,22,0.12)]',
    containerBg: 'bg-gradient-to-b from-orange-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    ambientGlow: 'bg-orange-500/15',
    accentText: 'text-orange-400',
    selectedBorder: 'border-white/20',
    selectedBg: 'bg-white/10',
    selectedShadow: 'shadow-md',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-orange-500/20',
    badgeSelectedBorder: 'border-orange-500/40',
    badgeSelectedText: 'text-orange-200',
    iconSelectedBg: 'bg-orange-500/20',
    iconSelectedText: 'text-orange-300',
    activeChevron: 'text-orange-400',
    indicatorStrip: 'bg-orange-400',
    inputFocusBorder: 'focus:border-orange-500/50',
    inputFocusRing: 'focus:ring-orange-500/30',
    inputSearchIconFocus: 'group-focus-within:text-orange-400',
  },
  violet: {
    containerBorder: 'border-violet-500/30',
    containerShadow: 'shadow-[0_10px_30px_rgba(139,92,246,0.12)]',
    containerBg: 'bg-gradient-to-b from-violet-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    ambientGlow: 'bg-violet-500/15',
    accentText: 'text-violet-400',
    selectedBorder: 'border-white/20',
    selectedBg: 'bg-white/10',
    selectedShadow: 'shadow-md',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-violet-500/20',
    badgeSelectedBorder: 'border-violet-500/40',
    badgeSelectedText: 'text-violet-200',
    iconSelectedBg: 'bg-violet-500/20',
    iconSelectedText: 'text-violet-300',
    activeChevron: 'text-violet-400',
    indicatorStrip: 'bg-violet-400',
    inputFocusBorder: 'focus:border-violet-500/50',
    inputFocusRing: 'focus:ring-violet-500/30',
    inputSearchIconFocus: 'group-focus-within:text-violet-400',
  },
  emerald: {
    containerBorder: 'border-emerald-500/30',
    containerShadow: 'shadow-[0_10px_30px_rgba(16,185,129,0.12)]',
    containerBg: 'bg-gradient-to-b from-emerald-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    ambientGlow: 'bg-emerald-500/15',
    accentText: 'text-emerald-400',
    selectedBorder: 'border-white/20',
    selectedBg: 'bg-white/10',
    selectedShadow: 'shadow-md',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-emerald-500/20',
    badgeSelectedBorder: 'border-emerald-500/40',
    badgeSelectedText: 'text-emerald-200',
    iconSelectedBg: 'bg-emerald-500/20',
    iconSelectedText: 'text-emerald-300',
    activeChevron: 'text-emerald-400',
    indicatorStrip: 'bg-emerald-400',
    inputFocusBorder: 'focus:border-emerald-500/50',
    inputFocusRing: 'focus:ring-emerald-500/30',
    inputSearchIconFocus: 'group-focus-within:text-emerald-400',
  },
  blue: {
    containerBorder: 'border-blue-500/30',
    containerShadow: 'shadow-[0_10px_30px_rgba(59,130,246,0.12)]',
    containerBg: 'bg-gradient-to-b from-blue-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    ambientGlow: 'bg-blue-500/15',
    accentText: 'text-blue-400',
    selectedBorder: 'border-white/20',
    selectedBg: 'bg-white/10',
    selectedShadow: 'shadow-md',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-blue-500/20',
    badgeSelectedBorder: 'border-blue-500/40',
    badgeSelectedText: 'text-blue-200',
    iconSelectedBg: 'bg-blue-500/20',
    iconSelectedText: 'text-blue-300',
    activeChevron: 'text-blue-400',
    indicatorStrip: 'bg-blue-400',
    inputFocusBorder: 'focus:border-blue-500/50',
    inputFocusRing: 'focus:ring-blue-500/30',
    inputSearchIconFocus: 'group-focus-within:text-blue-400',
  },
  slate: {
    containerBorder: 'border-white/15',
    containerShadow: 'shadow-[0_10px_30px_rgba(255,255,255,0.05)]',
    containerBg: 'bg-gradient-to-b from-slate-900/60 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    ambientGlow: 'bg-white/5',
    accentText: 'text-slate-300',
    selectedBorder: 'border-white/20',
    selectedBg: 'bg-white/10',
    selectedShadow: 'shadow-md',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-white/10',
    badgeSelectedBorder: 'border-white/20',
    badgeSelectedText: 'text-white',
    iconSelectedBg: 'bg-white/10',
    iconSelectedText: 'text-white',
    activeChevron: 'text-white',
    indicatorStrip: 'bg-white',
    inputFocusBorder: 'focus:border-white/40',
    inputFocusRing: 'focus:ring-white/20',
    inputSearchIconFocus: 'group-focus-within:text-white',
  },
};

function getDisciplineIcon(discipline?: string, fallbackIcon?: React.ElementType) {
  if (fallbackIcon) return fallbackIcon;
  switch (discipline) {
    case 'mechanical': return Wrench;
    case 'electrical': return Zap;
    case 'hydraulic': return Sliders;
    case 'pneumatic': return Cpu;
    case 'electronic': return Cpu;
    default: return Layers;
  }
}

export function LabHierarchicalSidebar({
  title,
  subtitle,
  families = [],
  selectedFamilyId,
  selectedTemplateId,
  selectedBlueprintId,
  onSelectFamily,
  onSelectTemplate,
  onSelectBlueprint,
  onPrimaryAction,
  primaryActionLabel = 'إضافة جديدة',
  primaryActionIcon: PrimaryIcon = Plus,
  onResetSelection,
  resetLabel = 'عرض الدليل الشامل',
  onRefresh,
  isRefreshing = false,
  onQuickAddTemplate,
  onQuickAddBlueprint,
  engineTheme = 'amber',
  showSearch = false,
  searchPlaceholder = 'بحث بالاسم أو الكود...',
  className,
  emptyMessage = 'لا توجد عناصر مسجلة',
  level3Enabled = true,
  customTabs,
  activeTabId,
  onTabChange,
}: LabHierarchicalSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  const theme = THEME_CONFIG[engineTheme] || THEME_CONFIG.amber;

  // Auto expand when selected IDs change
  React.useEffect(() => {
    if (selectedFamilyId) {
      setExpandedFamilies(prev => new Set([...prev, selectedFamilyId]));
    }
    if (selectedTemplateId) {
      setExpandedTemplates(prev => new Set([...prev, selectedTemplateId]));
    }
  }, [selectedFamilyId, selectedTemplateId]);

  const toggleFamilyExpand = (familyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(familyId)) {
        next.delete(familyId);
      } else {
        next.add(familyId);
      }
      return next;
    });
  };

  const toggleTemplateExpand = (templateId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedTemplates(prev => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  // Filtered tree data based on search
  const filteredFamilies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return families;

    return families.map(family => {
      const matchFamily = family.name.toLowerCase().includes(q) || 
                          family.code.toLowerCase().includes(q) ||
                          (family.subtitle && family.subtitle.toLowerCase().includes(q));

      const matchingTemplates = (family.templates || []).map(template => {
        const matchTemplate = template.name.toLowerCase().includes(q) ||
                              template.code.toLowerCase().includes(q) ||
                              (template.subtitle && template.subtitle.toLowerCase().includes(q));

        const matchingBlueprints = (template.items || []).filter(bp => 
          bp.name.toLowerCase().includes(q) ||
          bp.code.toLowerCase().includes(q) ||
          (bp.subtitle && bp.subtitle.toLowerCase().includes(q))
        );

        if (matchTemplate || matchingBlueprints.length > 0) {
          return {
            ...template,
            items: matchingBlueprints.length > 0 ? matchingBlueprints : template.items
          };
        }
        return null;
      }).filter(Boolean) as HierarchyTemplateNode[];

      if (matchFamily || matchingTemplates.length > 0) {
        return {
          ...family,
          templates: matchingTemplates.length > 0 ? matchingTemplates : family.templates
        };
      }
      return null;
    }).filter(Boolean) as HierarchyFamilyNode[];
  }, [families, searchQuery]);

  // When searching, auto expand matching nodes
  React.useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const allFamIds = new Set<string>();
      const allTplIds = new Set<string>();
      families.forEach(f => {
        const matchFamily = f.name.toLowerCase().includes(q) || 
                            f.code.toLowerCase().includes(q) ||
                            (f.subtitle && f.subtitle.toLowerCase().includes(q));
        if (matchFamily) allFamIds.add(f.id);

        (f.templates || []).forEach(t => {
          const matchTemplate = t.name.toLowerCase().includes(q) ||
                                t.code.toLowerCase().includes(q) ||
                                (t.subtitle && t.subtitle.toLowerCase().includes(q));
          const hasMatchingBps = (t.items || []).some(bp => 
            bp.name.toLowerCase().includes(q) ||
            bp.code.toLowerCase().includes(q) ||
            (bp.subtitle && bp.subtitle.toLowerCase().includes(q))
          );
          if (matchTemplate || hasMatchingBps) {
            allFamIds.add(f.id);
            allTplIds.add(t.id);
          }
        });
      });
      setExpandedFamilies(allFamIds);
      setExpandedTemplates(allTplIds);
    }
  }, [searchQuery, families]);

  const hasActiveSelection = Boolean(selectedFamilyId || selectedTemplateId || selectedBlueprintId);

  return (
    <div className={cn(
      "w-full border rounded-3xl overflow-hidden backdrop-blur-xl relative flex flex-col p-5 gap-3.5 text-start h-full select-none",
      theme.containerBorder,
      theme.containerShadow,
      theme.containerBg,
      className
    )}>
      {/* Background Ambient Engine Accent Glow */}
      <div className={cn(
        "absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none",
        theme.ambientGlow
      )} />

      {/* Header Title & Sync Control */}
      <div className="flex flex-col shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-white font-black uppercase tracking-wider block">
            {title}
          </span>
          {onRefresh && (
            <button 
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 px-2 rounded-xl bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="مزامنة وتحديث البيانات"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", theme.accentText, isRefreshing && "animate-spin text-white")} />
            </button>
          )}
        </div>
        <span className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">
          {subtitle}
        </span>
      </div>

      {/* Segmented Custom Tabs Switcher */}
      {customTabs && customTabs.length > 0 && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#08080c]/90 rounded-2xl border border-white/10 shrink-0 relative z-10">
          {customTabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                  isActive
                    ? "bg-white/10 text-white border border-white/20 shadow-sm font-extrabold"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded border",
                    isActive ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-slate-400"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Prominent Wide Action Button - High Contrast White */}
      {onPrimaryAction && (
        <button 
          type="button"
          onClick={onPrimaryAction}
          className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 relative z-10"
        >
          <PrimaryIcon className="w-4 h-4 text-slate-950" />
          <span>{primaryActionLabel}</span>
        </button>
      )}

      {/* Master Reset Button (Visible when active selection exists) */}
      {hasActiveSelection && onResetSelection && (
        <button
          type="button"
          onClick={onResetSelection}
          className="w-full bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 hover:border-white/30 font-bold rounded-xl px-3 py-2 text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer relative z-10 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
          <span>{resetLabel}</span>
        </button>
      )}

      {/* Quick Search - Crystal Dark (Conditional) */}
      {showSearch && (
        <div className="relative w-full shrink-0 relative z-10 group">
          <Search className={cn(
            "w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors pointer-events-none",
            theme.inputSearchIconFocus
          )} />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl pl-9 pr-8 rtl:pr-9 rtl:pl-8 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all text-start font-bold shadow-inner",
              theme.inputFocusBorder,
              theme.inputFocusRing && "focus:ring-1"
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 -translate-y-1/2 right-2.5 rtl:right-auto rtl:left-2.5 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Expanded Breathable Tree Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 text-start pt-1 -mx-2 px-2 pb-4 relative z-10 min-h-[300px]">
        {filteredFamilies.length === 0 ? (
          <div className="py-12 text-center px-4 space-y-2">
            <FolderTree className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-bold">{emptyMessage}</p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-white underline underline-offset-4 hover:text-slate-300"
              >
                تصفير البحث
              </button>
            )}
          </div>
        ) : (
          filteredFamilies.map((fam) => {
            const isFamilyExpanded = expandedFamilies.has(fam.id);
            
            // Check if this family is directly selected or contains a selected child template or blueprint
            const isChildTemplateSelected = fam.templates?.some(t => t.id === selectedTemplateId || t.items?.some(b => b.id === selectedBlueprintId));
            const isFamilyActive = selectedFamilyId === fam.id || isChildTemplateSelected;
            const isFamilyDirectlySelected = selectedFamilyId === fam.id && !selectedTemplateId && !selectedBlueprintId;

            const hasTemplates = fam.templates && fam.templates.length > 0;
            const templateCount = fam.count ?? (fam.templates ? fam.templates.length : 0);
            const DisciplineIcon = getDisciplineIcon(fam.discipline, fam.icon);

            return (
              <div 
                key={fam.id} 
                className={cn(
                  "rounded-2xl transition-all duration-200 border",
                  isFamilyExpanded 
                    ? "bg-black/40 border-white/25 p-2 space-y-2 shadow-xl" 
                    : "bg-transparent border-transparent space-y-0"
                )}
              >
                {/* Level 1: Family Node */}
                <div
                  onClick={() => onSelectFamily && onSelectFamily(fam)}
                  className={cn(
                    "group relative w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-bold cursor-pointer text-start",
                    isFamilyActive 
                      ? "bg-white/10 border-white/25 text-white font-extrabold shadow-md"
                      : isFamilyExpanded
                        ? "bg-white/[0.05] border-white/15 text-white hover:bg-white/[0.08]"
                        : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/20"
                  )}
                >
                  {/* Active Indicator Strip Bar on Edge */}
                  {isFamilyActive && (
                    <div className={cn(
                      "absolute top-2.5 bottom-2.5 w-1 rounded-full left-1",
                      theme.indicatorStrip || "bg-white"
                    )} />
                  )}

                  {/* Left Section: Icon + Title + English Count Subtitle */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 ps-2">
                    {/* Family Icon Box on the Left - Engine Color when Active, Muted when Unselected */}
                    <div className={cn(
                      "p-2 rounded-xl border transition-colors shrink-0 flex items-center justify-center",
                      isFamilyActive 
                        ? cn(theme.iconSelectedBg, "border-white/20", theme.iconSelectedText) 
                        : "bg-white/5 border-white/10 text-slate-400 group-hover:text-white group-hover:border-white/20"
                    )}>
                      <DisciplineIcon className="w-4 h-4" />
                    </div>

                    {/* Family Name & Subtitle in English with high contrast */}
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                      <span className="truncate max-w-[170px] text-start text-white font-bold text-xs">{fam.name}</span>
                      {fam.subtitle ? (
                        <span className="text-[10px] text-slate-400 truncate max-w-[170px] text-start">{fam.subtitle}</span>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-mono font-medium text-start">
                          {templateCount} {templateCount === 1 ? 'Template' : 'Templates'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Section: Code Badge + Action + Chevron on the Far Right */}
                  <div className="flex items-center gap-2 shrink-0 pe-0.5">
                    {onQuickAddTemplate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAddTemplate(fam);
                        }}
                        title="Add Template"
                        className="w-5 h-5 rounded hover:bg-white/10 text-slate-400 hover:text-white items-center justify-center hidden group-hover:flex transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}

                    {/* Code Badge */}
                    <span className={cn(
                      "font-mono text-[9px] px-2 py-0.5 rounded-md border font-bold",
                      isFamilyActive
                        ? cn(theme.badgeSelectedBg, theme.badgeSelectedBorder, theme.badgeSelectedText)
                        : "bg-white/5 border-white/10 text-slate-300 font-mono"
                    )}>
                      {fam.code}
                    </span>

                    {/* Expand/Collapse Chevron on the Far Right - Changes to Engine Accent Color when Expanded */}
                    {hasTemplates ? (
                      <button
                        type="button"
                        onClick={(e) => toggleFamilyExpand(fam.id, e)}
                        className={cn(
                          "p-1 rounded-lg shrink-0 transition-colors cursor-pointer",
                          isFamilyExpanded
                            ? cn(theme.accentText, "bg-white/10 font-bold")
                            : "text-slate-400 hover:text-white hover:bg-white/10"
                        )}
                        title={isFamilyExpanded ? "Collapse" : "Expand"}
                      >
                        {isFamilyExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <div className="w-5" />
                    )}
                  </div>
                </div>

                {/* Level 2: Templates Sub-Drawer (Accordion Expansion Container) */}
                {isFamilyExpanded && hasTemplates && (
                  <div className="space-y-2 pt-1 px-1">
                    {/* Sub-Header for Templates */}
                    <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
                      <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">
                        SPEC TEMPLATES
                      </span>
                      {onQuickAddTemplate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickAddTemplate(fam);
                          }}
                          className="text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" /> New Template
                        </button>
                      )}
                    </div>

                    {fam.templates!.map((template) => {
                      const isTemplateExpanded = expandedTemplates.has(template.id);
                      
                      // Check if this template is directly selected or contains a selected blueprint
                      const isChildBlueprintSelected = template.items?.some(b => b.id === selectedBlueprintId);
                      const isTemplateActive = selectedTemplateId === template.id || isChildBlueprintSelected;

                      const hasBlueprints = level3Enabled && template.items && template.items.length > 0;
                      const blueprintCount = template.count ?? (template.items ? template.items.length : 0);

                      return (
                        <div 
                          key={template.id} 
                          className={cn(
                            "rounded-xl transition-all duration-200 border",
                            isTemplateExpanded && level3Enabled && hasBlueprints 
                              ? "bg-black/50 border-white/25 p-2 space-y-1.5 shadow-lg" 
                              : "bg-transparent border-transparent space-y-0"
                          )}
                        >
                          {/* Template Card Item - Standard Sizing */}
                          <div
                            onClick={() => onSelectTemplate && onSelectTemplate(template, fam)}
                            className={cn(
                              "group/t relative w-full text-start p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer border",
                              isTemplateActive
                                ? "bg-white/10 border-white/25 text-white font-extrabold shadow-md"
                                : isTemplateExpanded && level3Enabled && hasBlueprints
                                  ? "bg-white/[0.05] border-white/15 text-white hover:bg-white/[0.08]"
                                  : "bg-white/[0.03] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.06] hover:border-white/20"
                            )}
                          >
                            {/* Active Indicator Strip Bar on Edge */}
                            {isTemplateActive && (
                              <div className={cn(
                                "absolute top-2 bottom-2 w-1 rounded-full left-1",
                                theme.indicatorStrip || "bg-white"
                              )} />
                            )}

                            {/* Left Section: Layers Icon (Yellow/Amber Glow when Active, Muted when Unselected) + Name + Count */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 ps-2">
                              <div className={cn(
                                "p-1.5 rounded-lg border shrink-0 transition-colors",
                                isTemplateActive
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                  : "bg-white/5 border-white/10 text-slate-400 group-hover/t:text-white"
                              )}>
                                <Layers className="w-3.5 h-3.5 shrink-0" />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                                <span className="truncate text-white font-bold text-xs">{template.name}</span>
                                {level3Enabled && blueprintCount > 0 && (
                                  <span className="text-[10px] text-slate-300 font-mono font-medium">
                                    {blueprintCount} {blueprintCount === 1 ? 'Model' : 'Models'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right Section: Code Badge + Action + Level 3 Chevron */}
                            <div className="flex items-center gap-2 shrink-0">
                              {onQuickAddBlueprint && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAddBlueprint(template, fam);
                                  }}
                                  title="Add Model"
                                  className="w-4 h-4 rounded hover:bg-white/10 text-slate-400 hover:text-white items-center justify-center hidden group-hover/t:flex transition-colors"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              )}

                              <span className={cn(
                                "font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border font-bold",
                                isTemplateActive 
                                  ? cn(theme.badgeSelectedBg, theme.badgeSelectedBorder, theme.badgeSelectedText) 
                                  : "bg-white/5 border-white/10 text-slate-300 font-mono"
                              )}>
                                {template.code}
                              </span>

                              {/* Chevron Arrow Changes to Engine Accent Color when Expanded */}
                              {level3Enabled && hasBlueprints && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleTemplateExpand(template.id, e)}
                                  className={cn(
                                    "p-0.5 rounded flex items-center justify-center shrink-0 cursor-pointer transition-colors",
                                    isTemplateExpanded
                                      ? cn(theme.accentText, "bg-white/10 font-bold")
                                      : "text-slate-400 hover:text-white"
                                  )}
                                >
                                  {isTemplateExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Level 3: Blueprints / Items Sub-Drawer */}
                          {level3Enabled && isTemplateExpanded && hasBlueprints && (
                            <div className="space-y-1.5 pt-1.5 px-1">
                              {/* Sub-Header for Level 3 Models */}
                              <div className="flex items-center justify-between px-2 pt-0.5 pb-0.5">
                                <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">
                                  SPEC BLUEPRINTS
                                </span>
                                {onQuickAddBlueprint && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onQuickAddBlueprint(template, fam);
                                    }}
                                    className="text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" /> New Model
                                  </button>
                                )}
                              </div>

                              {template.items!.map((blueprint, bpIndex) => {
                                const isBlueprintSelected = selectedBlueprintId === blueprint.id;

                                return (
                                  <div
                                    key={blueprint.id}
                                    onClick={() => onSelectBlueprint && onSelectBlueprint(blueprint, template, fam)}
                                    className={cn(
                                      "group/b relative p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-all border text-start text-xs",
                                      isBlueprintSelected
                                        ? "bg-white/10 border-white/25 text-white font-extrabold shadow-md"
                                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20 text-slate-300 hover:text-white"
                                    )}
                                  >
                                    {/* Active Indicator Strip Bar on Edge */}
                                    {isBlueprintSelected && (
                                      <div className={cn(
                                        "absolute top-2 bottom-2 w-1 rounded-full left-1",
                                        theme.indicatorStrip || "bg-white"
                                      )} />
                                    )}

                                    <div className="flex items-center gap-2.5 min-w-0 flex-1 ps-2">
                                      {/* Physical Stock Status Dot */}
                                      {blueprint.isInStock !== undefined && (
                                        <div
                                          title={blueprint.isInStock ? `In Stock (${blueprint.stockQty ?? ''})` : 'Catalog Only'}
                                          className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            blueprint.isInStock
                                              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                              : "bg-slate-600"
                                          )}
                                        />
                                      )}
                                      
                                      {/* Numbered Sequence Badge 1, 2, 3... (Blue Glow when Active, Muted when Unselected) */}
                                      <div className={cn(
                                        "w-5 h-5 rounded-md border shrink-0 flex items-center justify-center font-mono font-extrabold text-[10px] transition-colors",
                                        isBlueprintSelected 
                                          ? "bg-blue-500/20 border-blue-500/40 text-blue-300" 
                                          : "bg-white/5 border-white/10 text-slate-400 group-hover/b:text-white group-hover/b:border-white/20"
                                      )}>
                                        {bpIndex + 1}
                                      </div>

                                      <span className="truncate text-white font-bold text-xs">{blueprint.name}</span>
                                    </div>

                                    <span className={cn(
                                      "font-mono text-[9px] px-1.5 py-0.5 rounded-md border shrink-0 font-bold",
                                      isBlueprintSelected 
                                        ? cn(theme.badgeSelectedBg, theme.badgeSelectedBorder, theme.badgeSelectedText) 
                                        : "text-slate-300 bg-white/5 border-white/10 font-mono"
                                    )}>
                                      {blueprint.code}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
