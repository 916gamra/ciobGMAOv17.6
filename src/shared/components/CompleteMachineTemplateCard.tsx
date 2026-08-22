import React, { useState } from "react";
import { Cpu, Wrench, Edit, Copy, Trash2, Layers, AlertCircle, Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MachineTemplateData {
  id: string;
  name: string;
  description?: string;
  familyId?: string;
  subsystemIds?: string[];
  preventiveTaskIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  skuBase?: string;
}

interface MachineTemplateCardProps {
  template: MachineTemplateData;
  familyName?: string;
  onEdit?: (template: MachineTemplateData) => void;
  onDuplicate?: (template: MachineTemplateData) => void;
  onDelete?: (template: MachineTemplateData) => void;
  onSelect?: (template: MachineTemplateData) => void;
  isSelected?: boolean;
}

export function CompleteMachineTemplateCard({
  template,
  familyName,
  onEdit,
  onDuplicate,
  onDelete,
  onSelect,
  isSelected = false,
}: MachineTemplateCardProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const subsystemCount = template.subsystemIds?.length || 0;
  const preventiveCount = template.preventiveTaskIds?.length || 0;

  return (
    <>
      <div
        onClick={() => onSelect?.(template)}
        className={cn(
          "rounded-2xl border bg-slate-900/80 backdrop-blur-xl shadow-lg text-slate-100",
          "flex flex-col group relative overflow-hidden transition-all duration-300 p-5 text-start",
          isSelected
            ? "border-indigo-500/80 bg-indigo-950/30 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50"
            : "border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/95 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5",
          onSelect && "cursor-pointer"
        )}
      >
        {/* Ambient Top Glow Watermark */}
        <div className="absolute -right-8 -top-8 rtl:-right-auto rtl:-left-8 opacity-[0.04] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.08] text-indigo-400">
          <Cpu className="h-32 w-32" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3 z-10">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-bold text-base md:text-lg tracking-tight text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
              {template.name}
            </h3>
            {familyName && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Layers className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{familyName}</span>
              </div>
            )}
          </div>
          <span className="shrink-0 px-2.5 py-1 text-[11px] font-mono font-bold rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {template.skuBase || template.id}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-slate-300 line-clamp-2 min-h-[38px] mb-4 z-10 leading-relaxed font-medium">
          {template.description || t('lab.noMachineTemplateDesc', 'لا يوجد وصف تفصيلي متوفر لقالب هذه الآلة.')}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono font-extrabold text-white text-sm">{subsystemCount}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{t('lab.subsystemsLabel', 'أنظمة فرعية')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono font-extrabold text-white text-sm">{preventiveCount}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{t('lab.preventiveTasksLabel', 'مهام وقائية')}</p>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="border-t border-white/10 pt-3 mt-auto grid grid-cols-3 gap-2 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(template);
            }}
            className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-2 border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <Edit className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5 text-indigo-400" />
            {t('common.edit', 'تعديل')}
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(template);
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
                <h4 className="text-lg font-extrabold text-white">{t('lab.confirmDeleteMachineTemplateTitle', 'تأكيد حذف قالب الآلة')}</h4>
                <p className="text-xs text-slate-400 font-mono">{template.id}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('lab.confirmDeleteMachineTemplateDesc', 'هل أنت متأكد من رغبتك في حذف قالب الآلة')} <span className="font-extrabold text-white">"{template.name}"</span>؟ {t('common.actionCannotBeUndone', 'لا يمكن التراجع عن هذا الإجراء.')}
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
                  onDelete?.(template);
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
