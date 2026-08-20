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
  searchPlaceholder?: string;
  className?: string;
  emptyMessage?: string;
  level3Enabled?: boolean;
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
    selectedBorder: 'border-amber-500/50',
    selectedBg: 'bg-amber-500/20',
    selectedShadow: 'shadow-[0_4px_20px_rgba(245,158,11,0.25)]',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-amber-500/30',
    badgeSelectedBorder: 'border-amber-500/40',
    badgeSelectedText: 'text-amber-200',
    iconSelectedBg: 'bg-amber-500/30',
    iconSelectedText: 'text-amber-200',
    activeChevron: 'text-amber-300',
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
    selectedBorder: 'border-cyan-500/50',
    selectedBg: 'bg-cyan-500/20',
    selectedShadow: 'shadow-[0_4px_20px_rgba(6,182,212,0.25)]',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-cyan-500/30',
    badgeSelectedBorder: 'border-cyan-500/40',
    badgeSelectedText: 'text-cyan-200',
    iconSelectedBg: 'bg-cyan-500/30',
    iconSelectedText: 'text-cyan-200',
    activeChevron: 'text-cyan-300',
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
    selectedBorder: 'border-indigo-500/50',
    selectedBg: 'bg-indigo-500/20',
    selectedShadow: 'shadow-[0_4px_20px_rgba(99,102,241,0.25)]',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-indigo-500/30',
    badgeSelectedBorder: 'border-indigo-500/40',
    badgeSelectedText: 'text-indigo-200',
    iconSelectedBg: 'bg-indigo-500/30',
    iconSelectedText: 'text-indigo-200',
    activeChevron: 'text-indigo-300',
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
    selectedBorder: 'border-orange-500/50',
    selectedBg: 'bg-orange-500/20',
    selectedShadow: 'shadow-[0_4px_20px_rgba(249,115,22,0.25)]',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-orange-500/30',
    badgeSelectedBorder: 'border-orange-500/40',
    badgeSelectedText: 'text-orange-200',
    iconSelectedBg: 'bg-orange-500/30',
    iconSelectedText: 'text-orange-200',
    activeChevron: 'text-orange-300',
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
    selectedBorder: 'border-violet-500/50',
    selectedBg: 'bg-violet-500/20',
    selectedShadow: 'shadow-[0_4px_20px_rgba(139,92,246,0.25)]',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-violet-500/30',
    badgeSelectedBorder: 'border-violet-500/40',
    badgeSelectedText: 'text-violet-200',
    iconSelectedBg: 'bg-violet-500/30',
    iconSelectedText: 'text-violet-200',
    activeChevron: 'text-violet-300',
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
    selectedBorder: 'border-emerald-500/50',
    selectedBg: 'bg-emerald-500/20',
    selectedShadow: 'shadow-[0_4px_20px_rgba(16,185,129,0.25)]',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-emerald-500/30',
    badgeSelectedBorder: 'border-emerald-500/40',
    badgeSelectedText: 'text-emerald-200',
    iconSelectedBg: 'bg-emerald-500/30',
    iconSelectedText: 'text-emerald-200',
    activeChevron: 'text-emerald-300',
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
    selectedBorder: 'border-blue-500/50',
    selectedBg: 'bg-blue-500/20',
    selectedShadow: 'shadow-[0_4px_20px_rgba(59,130,246,0.25)]',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-blue-500/30',
    badgeSelectedBorder: 'border-blue-500/40',
    badgeSelectedText: 'text-blue-200',
    iconSelectedBg: 'bg-blue-500/30',
    iconSelectedText: 'text-blue-200',
    activeChevron: 'text-blue-300',
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
    selectedBorder: 'border-white/40',
    selectedBg: 'bg-white/10',
    selectedShadow: 'shadow-[0_4px_20px_rgba(255,255,255,0.1)]',
    selectedText: 'text-white',
    badgeSelectedBg: 'bg-white/20',
    badgeSelectedBorder: 'border-white/30',
    badgeSelectedText: 'text-white',
    iconSelectedBg: 'bg-white/20',
    iconSelectedText: 'text-white',
    activeChevron: 'text-slate-200',
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
  searchPlaceholder = 'بحث بالاسم أو الكود...',
  className,
  emptyMessage = 'لا توجد عناصر مسجلة',
  level3Enabled = true,
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
    if (searchQuery.trim()) {
      const allFamIds = new Set<string>();
      const allTplIds = new Set<string>();
      filteredFamilies.forEach(f => {
        allFamIds.add(f.id);
        (f.templates || []).forEach(t => {
          allTplIds.add(t.id);
        });
      });
      setExpandedFamilies(allFamIds);
      setExpandedTemplates(allTplIds);
    }
  }, [searchQuery, filteredFamilies]);

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

      {/* Quick Search - Crystal Dark */}
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

      {/* Expanded Breathable Tree Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 text-start pt-1 -mx-2 px-2 pb-4 relative z-10 min-h-[300px]">
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
            const isFamilySelected = selectedFamilyId === fam.id && !selectedTemplateId && !selectedBlueprintId;
            const hasTemplates = fam.templates && fam.templates.length > 0;
            const templateCount = fam.count ?? (fam.templates ? fam.templates.length : 0);
            const DisciplineIcon = getDisciplineIcon(fam.discipline, fam.icon);

            return (
              <div key={fam.id} className="space-y-1.5">
                {/* Level 1: Family Node */}
                <div
                  onClick={() => onSelectFamily && onSelectFamily(fam)}
                  className={cn(
                    "group w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 text-xs font-bold transform active:scale-95 cursor-pointer",
                    isFamilySelected 
                      ? cn(theme.selectedBg, theme.selectedBorder, theme.selectedText, theme.selectedShadow, "font-black scale-[1.02] -translate-y-0.5")
                      : "bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Expand/Collapse Chevron Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleFamilyExpand(fam.id, e)}
                      className={cn(
                        "p-1 rounded shrink-0 transition-colors",
                        isFamilySelected 
                          ? cn(theme.iconSelectedText, "hover:text-white hover:bg-white/10")
                          : "text-slate-400 hover:text-white hover:bg-white/5",
                        !hasTemplates && "invisible"
                      )}
                    >
                      {isFamilyExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      )}
                    </button>

                    {/* Family Icon Box */}
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors shrink-0",
                      isFamilySelected ? theme.iconSelectedBg : "bg-white/5 text-slate-400"
                    )}>
                      <DisciplineIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* Family Name */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate max-w-[170px] text-start font-bold">{fam.name}</span>
                      {fam.subtitle && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[170px]">{fam.subtitle}</span>
                      )}
                    </div>
                  </div>

                  {/* Badges & Quick Action */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn(
                      "font-mono text-[9px] px-1.5 py-0.5 rounded border",
                      isFamilySelected
                        ? cn(theme.badgeSelectedBg, theme.badgeSelectedBorder, theme.badgeSelectedText)
                        : "bg-white/5 border-white/10 text-slate-400"
                    )}>
                      {fam.code}
                    </span>

                    {templateCount > 0 && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono",
                        isFamilySelected ? theme.badgeSelectedBg : "bg-white/5 text-slate-500"
                      )}>
                        {templateCount}
                      </span>
                    )}

                    {onQuickAddTemplate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAddTemplate(fam);
                        }}
                        title="إضافة قالب جديد في هذه العائلة"
                        className="w-5 h-5 rounded hover:bg-white/10 text-slate-400 hover:text-white items-center justify-center hidden group-hover:flex transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Level 2: Templates Sub-Tree (Spacious Breathable Indent) */}
                {isFamilyExpanded && hasTemplates && (
                  <div className="ms-4 ps-3 border-s border-white/10 space-y-1.5 py-1">
                    {/* Sub-Header for Templates */}
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        قوالب المواصفات
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
                          <Plus className="w-2.5 h-2.5" /> قالب جديد
                        </button>
                      )}
                    </div>

                    {fam.templates!.map((template) => {
                      const isTemplateExpanded = expandedTemplates.has(template.id);
                      const isTemplateSelected = selectedTemplateId === template.id && !selectedBlueprintId;
                      const hasBlueprints = level3Enabled && template.items && template.items.length > 0;
                      const blueprintCount = template.count ?? (template.items ? template.items.length : 0);

                      return (
                        <div key={template.id} className="space-y-1">
                          {/* Template Card Item */}
                          <div
                            onClick={() => onSelectTemplate && onSelectTemplate(template, fam)}
                            className={cn(
                              "group/t w-full text-start p-2 rounded-xl text-[11px] font-semibold transition-all duration-200 flex items-center justify-between transform active:scale-95 cursor-pointer border",
                              isTemplateSelected
                                ? cn(theme.selectedBg, theme.selectedBorder, theme.selectedText, theme.selectedShadow, "font-black scale-[1.02] -translate-y-0.5")
                                : "bg-[#0a0a0f] border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Level 3 Toggle */}
                              {level3Enabled && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleTemplateExpand(template.id, e)}
                                  className={cn(
                                    "p-0.5 rounded flex items-center justify-center text-slate-500 hover:text-white shrink-0",
                                    !hasBlueprints && "invisible"
                                  )}
                                >
                                  {isTemplateExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                                  )}
                                </button>
                              )}

                              <Layers className={cn("w-3.5 h-3.5 shrink-0", isTemplateSelected ? theme.accentText : "text-slate-400")} />
                              <span className="truncate max-w-[150px]">{template.name}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={cn(
                                "font-mono text-[9px] uppercase px-1.5 py-0.5 rounded",
                                isTemplateSelected ? theme.badgeSelectedText : "opacity-60 bg-white/5"
                              )}>
                                {template.code}
                              </span>

                              {blueprintCount > 0 && level3Enabled && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                                  {blueprintCount}
                                </span>
                              )}

                              {onQuickAddBlueprint && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAddBlueprint(template, fam);
                                  }}
                                  title="إضافة موديل/قطعة في هذا القالب"
                                  className="w-4 h-4 rounded hover:bg-white/10 text-slate-400 hover:text-white items-center justify-center hidden group-hover/t:flex transition-colors"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Level 3: Blueprints / Items Sub-Tree */}
                          {level3Enabled && isTemplateExpanded && hasBlueprints && (
                            <div className="ms-4 ps-3 border-s border-white/10 space-y-1 my-1">
                              {template.items!.map((blueprint) => {
                                const isBlueprintSelected = selectedBlueprintId === blueprint.id;

                                return (
                                  <div
                                    key={blueprint.id}
                                    onClick={() => onSelectBlueprint && onSelectBlueprint(blueprint, template, fam)}
                                    className={cn(
                                      "p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 border text-start transform active:scale-95 text-[11px]",
                                      isBlueprintSelected
                                        ? cn(theme.selectedBg, theme.selectedBorder, theme.selectedText, theme.selectedShadow, "font-bold scale-[1.02] -translate-y-0.5")
                                        : "bg-[#0a0a0f] border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-slate-300 hover:text-white"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {/* Physical Stock Status Dot */}
                                      {blueprint.isInStock !== undefined && (
                                        <div
                                          title={blueprint.isInStock ? `متوفر بالمخزن (${blueprint.stockQty ?? ''})` : 'غير مفعل بالمخزن'}
                                          className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            blueprint.isInStock
                                              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                              : "bg-slate-600"
                                          )}
                                        />
                                      )}
                                      <Cpu className={cn("w-3.5 h-3.5 shrink-0", isBlueprintSelected ? theme.accentText : "text-slate-400")} />
                                      <span className="truncate">{blueprint.name}</span>
                                    </div>

                                    <span className={cn(
                                      "font-mono text-[9px] px-1.5 py-0.5 rounded shrink-0",
                                      isBlueprintSelected ? theme.badgeSelectedText : "text-slate-400 bg-white/5"
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
