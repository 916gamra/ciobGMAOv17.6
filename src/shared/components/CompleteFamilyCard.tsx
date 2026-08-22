import React from 'react';
import { Edit3, Trash2, Layers, Grid } from 'lucide-react';
import { cn } from '@/shared/utils';
import { getFamilyIcon } from '@/shared/constants/icons';
import { FrostCard } from '@/shared/components/FrostCard';
import { useTranslation } from 'react-i18next';

export interface ComponentFamilyData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  code?: string;
  familyType?: 'component' | 'machine';
}

export interface CompleteFamilyCardProps {
  family: ComponentFamilyData;
  templateCount: number;
  engineTheme?: 'amber' | 'cyan' | 'emerald' | 'indigo' | 'orange' | 'violet' | 'rose';
  onEdit?: (family: ComponentFamilyData, e: React.MouseEvent) => void;
  onDelete?: (family: ComponentFamilyData, e: React.MouseEvent) => void;
  onClick?: (family: ComponentFamilyData) => void;
  isSelected?: boolean;
}

export function CompleteFamilyCard({
  family,
  templateCount,
  engineTheme = 'amber',
  onEdit,
  onDelete,
  onClick,
  isSelected = false,
}: CompleteFamilyCardProps) {
  const { t } = useTranslation();
  // Standard Icon Extraction from BDR Nexus Icon Constitution
  const IconComponent = getFamilyIcon(family.icon, family.familyType || 'component');

  // Theme accent colors matching BDR Nexus engines
  const themeStyles = {
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:border-amber-500/40",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:border-cyan-500/40",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40",
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover:border-indigo-500/40",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-400 group-hover:border-orange-500/40",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400 group-hover:border-violet-500/40",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:border-rose-500/40",
  }[engineTheme] || "bg-amber-500/10 border-amber-500/20 text-amber-400";

  return (
    <FrostCard
      interactive={!!onClick}
      hoverEffect={!isSelected}
      onClick={() => onClick?.(family)}
      className={cn(
        "group relative flex flex-col justify-between text-start overflow-hidden p-5",
        isSelected
          ? "border-white/40 bg-white/[0.08] shadow-[0_0_25px_rgba(255,255,255,0.06)]"
          : ""
      )}
    >
      {/* Background Watermark Icon */}
      <div
        className="absolute -left-6 -top-6 rtl:-left-auto rtl:-right-6 opacity-[0.04] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.07] text-white"
      >
        <IconComponent className="h-36 w-36" />
      </div>

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105", themeStyles)}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-white truncate group-hover:text-amber-300 transition-colors">
              {family.name}
            </h3>
            <p className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
              {family.code || family.id}
            </p>
          </div>
        </div>

        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-slate-300 tracking-wider shrink-0 uppercase">
          {t('common.family', 'FAMILY')}
        </span>
      </div>

      {/* Body Description */}
      <div className="flex-1 mb-4 relative z-10">
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 font-medium">
          {family.description || t('pdr.noFamilyDesc', 'لا يوجد وصف محدد لهذه العائلة الهندسية.')}
        </p>
      </div>

      {/* Stats Matrix Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            {t('pdr.subTemplatesCount', 'القوالب التابعة')}
          </span>
          <span className="text-xs font-mono font-extrabold text-white mt-1">
            {templateCount} {templateCount === 1 ? t('unit.templateOne', 'قالب') : t('unit.templatesMany', 'قوالب')}
          </span>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Grid className="w-3 h-3 text-slate-400" />
            {t('pdr.slotsCapacity', 'سعة المقاعد')}
          </span>
          <span className="text-xs font-mono font-extrabold text-white mt-1">
            999 {t('pdr.slotsTotal', 'مقعد')}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-white/10 pt-3 relative z-10 flex items-center justify-between gap-2 mt-auto">
        <span className="text-[10px] font-mono text-slate-400 uppercase">
          BDR NEXUS C-CATALOG
        </span>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(family, e);
              }}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('common.edit', 'تعديل')}</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(family, e);
              }}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('common.delete', 'حذف')}</span>
            </button>
          )}
        </div>
      </div>
    </FrostCard>
  );
}
