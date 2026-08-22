import React, { useState } from "react";
import { FileCode, Cpu, Wrench, Edit, Copy, Trash2, Layers, AlertCircle, Zap } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MachineBlueprintData {
  id: string;
  name: string;
  description?: string;
  version?: string;
  familyName?: string;
  subsystems?: Array<{ id: string; name: string }>;
  subsystemIds?: string[];
  preventiveTasks?: Array<{ id: string; name: string }>;
  preventiveTaskIds?: string[];
  updatedAt?: string;
  model?: string;
  reference?: string;
  powerOrForce?: string;
  technicalSpecs?: string;
  componentIds?: string[];
}

interface MachineBlueprintCardProps {
  blueprint: MachineBlueprintData;
  onEdit?: (blueprint: MachineBlueprintData) => void;
  onDuplicate?: (blueprint: MachineBlueprintData) => void;
  onDelete?: (blueprint: MachineBlueprintData) => void;
  onSelect?: (blueprint: MachineBlueprintData) => void;
  onAssemble?: (blueprint: MachineBlueprintData) => void;
  isSelected?: boolean;
}

export function CompleteMachineBlueprintCard({
  blueprint,
  onEdit,
  onDuplicate,
  onDelete,
  onSelect,
  onAssemble,
  isSelected = false,
}: MachineBlueprintCardProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const subsystemCount = blueprint.subsystems?.length ?? blueprint.subsystemIds?.length ?? blueprint.componentIds?.length ?? 0;
  const preventiveCount = blueprint.preventiveTasks?.length ?? blueprint.preventiveTaskIds?.length ?? 0;

  return (
    <>
      <div
        onClick={() => onSelect?.(blueprint)}
        className={cn(
          "rounded-2xl border bg-slate-900/80 backdrop-blur-xl shadow-lg text-slate-100",
          "flex flex-col group relative overflow-hidden transition-all duration-300 p-5 text-start",
          isSelected
            ? "border-indigo-500/80 bg-indigo-950/30 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50"
            : "border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/95 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5",
          onSelect && "cursor-pointer"
        )}
      >
        {/* Ambient Top Watermark */}
        <div className="absolute -right-8 -top-8 rtl:-right-auto rtl:-left-8 opacity-[0.04] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.08] text-indigo-400">
          <FileCode className="h-36 w-36" />
        </div>

        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3 z-10">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <FileCode className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-base md:text-lg tracking-tight truncate text-white group-hover:text-indigo-300 transition-colors">
                {blueprint.reference || blueprint.name}
              </h3>
            </div>
            {(blueprint.familyName || blueprint.model) && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-7 rtl:pl-0 rtl:pr-7">
                <Layers className="h-3 w-3 text-indigo-400 shrink-0" />
                <span className="truncate">{blueprint.model || blueprint.familyName}</span>
              </div>
            )}
          </div>
          
          <span className="shrink-0 px-2 py-0.5 text-[11px] font-mono font-bold rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {blueprint.version ? `v${blueprint.version}` : (blueprint.id)}
          </span>
        </div>

        {/* Description / Tech Specs */}
        <p className="text-xs md:text-sm text-slate-300 line-clamp-2 min-h-[38px] mb-4 z-10 leading-relaxed font-medium">
          {blueprint.technicalSpecs || blueprint.description || t('lab.noBlueprintDesc', 'لا توجد تفاصيل إضافية لهذا المخطط الهندسي.')}
        </p>

        {/* Stats Matrix Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono font-extrabold text-white text-sm">{subsystemCount}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{t('lab.subsystemsOrComps', 'مكونات/أنظمة')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono font-extrabold text-white text-xs truncate max-w-[80px]">
                {blueprint.powerOrForce || (preventiveCount > 0 ? `${preventiveCount} مهام` : 'قياسي')}
              </p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{t('lab.powerOrForceLabel', 'القدرة / الطاقة')}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/10 pt-3 mt-auto grid grid-cols-3 gap-2 z-10">
          {onAssemble ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssemble(blueprint);
              }}
              className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-2 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Cpu className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5" />
              {t('lab.assembleCompsShort', 'تجميع')}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(blueprint);
              }}
              className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-2 border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Edit className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5 text-indigo-400" />
              {t('common.edit', 'تعديل')}
            </button>
          )}
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(blueprint);
            }}
            className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-2 border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <Copy className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5 text-slate-400" />
            {t('common.duplicate', 'نسخ')}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-2 bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200 transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5 text-rose-400" />
            {t('common.delete', 'حذف')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in-0"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 text-start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="h-6 w-6 shrink-0" />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-white">{t('lab.confirmDeleteBlueprintTitle', 'تأكيد حذف المخطط المعماري')}</h4>
                <p className="text-xs text-slate-400 font-mono">{blueprint.id}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('lab.confirmDeleteBlueprintDesc', 'هل أنت متأكد من رغبتك في حذف المخطط المعماري')} <span className="font-extrabold text-white">"{blueprint.reference || blueprint.name}"</span>؟ {t('common.actionCannotBeUndone', 'لا يمكن التراجع عن هذا الإجراء.')}
            </p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 text-xs font-bold rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {t('common.cancel', 'إلغاء')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(blueprint);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2.5 text-xs font-extrabold rounded-xl bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/30 transition-colors cursor-pointer"
              >
                {t('common.confirmDelete', 'تأكيد الحذف')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
