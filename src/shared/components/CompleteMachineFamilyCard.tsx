import React, { useState } from "react";
import { Layers, PlusCircle, Settings, Trash2, Shapes, Server, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MachineFamilyData {
  id: string;
  name: string;
  description?: string;
  code?: string;
  icon?: string;
  color?: string;
}

interface CompleteMachineFamilyCardProps {
  family: MachineFamilyData;
  stats?: { templateCount: number; machineCount: number };
  onSelect?: (familyId: string) => void;
  onEdit?: (family: MachineFamilyData) => void;
  onDelete?: (family: MachineFamilyData) => void;
  onAddTemplate?: (family: MachineFamilyData) => void;
  isSelected?: boolean;
}

export function CompleteMachineFamilyCard({
  family,
  stats = { templateCount: 0, machineCount: 0 },
  onSelect,
  onEdit,
  onDelete,
  onAddTemplate,
  isSelected = false,
}: CompleteMachineFamilyCardProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border bg-slate-900/80 backdrop-blur-xl shadow-lg text-slate-100",
          "flex flex-col group relative overflow-hidden transition-all duration-300 p-5 text-start",
          isSelected
            ? "border-indigo-500/80 bg-indigo-950/30 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50"
            : "border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/95 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5"
        )}
      >
        {/* Ambient Top Watermark */}
        <div 
          className="absolute -right-8 -top-8 rtl:-right-auto rtl:-left-8 opacity-[0.04] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.08]"
          style={{ color: family.color || "#6366f1" }}
        >
          <Layers className="h-36 w-36" />
        </div>

        {/* Card Header */}
        <div 
          className="cursor-pointer mb-3 z-10" 
          onClick={() => onSelect?.(family.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-extrabold text-base md:text-lg tracking-tight line-clamp-1 text-white group-hover:text-indigo-300 transition-colors">
              {family.name}
            </h3>
            <span className="shrink-0 px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {family.code || family.id}
            </span>
          </div>
        </div>

        {/* Description */}
        <div 
          className="flex-grow mb-4 cursor-pointer z-10" 
          onClick={() => onSelect?.(family.id)}
        >
          <p className="text-xs md:text-sm text-slate-300 line-clamp-2 min-h-[38px] leading-relaxed font-medium">
            {family.description || t('lab.noMachineFamilyDesc', 'لا يوجد وصف متوفر لعائلة الآلات هذه.')}
          </p>
        </div>

        {/* Footer & Stats & Buttons */}
        <div className="border-t border-white/10 pt-4 space-y-3 mt-auto z-10">
          {/* Stats Matrix Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Shapes className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-white text-xs">{stats.templateCount} {t('lab.templatesUnit', 'قوالب')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Server className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-white text-xs">{stats.machineCount} {t('lab.activeMachinesUnit', 'آلات نشطة')}</span>
            </div>
          </div>

          {/* Buttons Row */}
          <div className="w-full space-y-2">
            {onAddTemplate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTemplate?.(family);
                }}
                className="w-full inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-3 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all active:scale-[0.98] cursor-pointer"
              >
                <PlusCircle className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5" />
                {t('lab.addNewTemplateBtn', 'إضافة قالب جديد')}
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(family);
                }}
                className="w-full inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-3 bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <Settings className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5 text-slate-400" />
                {t('common.edit', 'تعديل')}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="w-full inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-3 bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200 transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5 text-rose-400" />
                {t('common.delete', 'حذف')}
              </button>
            </div>
          </div>
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
                <h4 className="text-lg font-extrabold text-white">{t('lab.confirmDeleteMachineFamilyTitle', 'تأكيد حذف عائلة الآلات')}</h4>
                <p className="text-xs text-slate-400 font-mono">{family.code || family.id}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('lab.confirmDeleteMachineFamilyDesc', 'هل أنت متأكد من رغبتك في حذف عائلة الآلات')} <span className="font-extrabold text-white">"{family.name}"</span>؟ {t('lab.affectLinkedTemplatesWarning', 'سيؤدي ذلك للتأثير على القوالب والآلات المرتبطة بها.')}
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
                  onDelete?.(family);
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
