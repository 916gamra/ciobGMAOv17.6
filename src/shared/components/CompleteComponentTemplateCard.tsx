import React, { useState } from "react";
import { Box, Edit, Trash2, Tag, Layers, AlertCircle, Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ComponentTemplateData {
  id: string;
  name: string;
  description?: string;
  familyId?: string;
  familyName?: string;
  familyColor?: string;
  unit?: string;
  specifications?: Record<string, string | number>;
  skuBase?: string;
}

interface ComponentTemplateCardProps {
  template: ComponentTemplateData;
  onEdit?: (template: ComponentTemplateData) => void;
  onDelete?: (template: ComponentTemplateData) => void;
  onSelect?: (template: ComponentTemplateData) => void;
  isSelected?: boolean;
}

export function CompleteComponentTemplateCard({
  template,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
}: ComponentTemplateCardProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div
        onClick={() => onSelect?.(template)}
        className={cn(
          "rounded-2xl border bg-slate-900/80 backdrop-blur-xl shadow-lg text-slate-100",
          "flex flex-col group relative overflow-hidden transition-all duration-300 p-5 text-start",
          isSelected
            ? "border-cyan-500/80 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50"
            : "border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/95 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-0.5",
          onSelect && "cursor-pointer"
        )}
      >
        {/* Background Watermark Icon */}
        <div 
          className="absolute -right-6 -top-6 rtl:-right-auto rtl:-left-6 opacity-[0.04] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.08]"
          style={{ color: template.familyColor || "#06b6d4" }}
        >
          <Box className="h-32 w-32" />
        </div>

        {/* Card Header */}
        <div className="flex items-center gap-3 mb-3.5 z-10">
          <div
            className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/25 transition-colors shadow-xs"
            style={{
              backgroundColor: template.familyColor ? `${template.familyColor}15` : undefined,
              borderColor: template.familyColor ? `${template.familyColor}35` : undefined,
              color: template.familyColor || "#06b6d4",
            }}
          >
            <Box className="h-5 w-5" />
          </div>

          <div className="overflow-hidden space-y-0.5 min-w-0 flex-1">
            <h3 className="font-bold text-base tracking-tight truncate text-white group-hover:text-cyan-300 transition-colors">
              {template.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-slate-400 font-bold truncate">
                {template.skuBase || template.id}
              </span>
              {template.familyName && (
                <span 
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    backgroundColor: template.familyColor ? `${template.familyColor}18` : "rgba(255,255,255,0.06)",
                    borderColor: template.familyColor ? `${template.familyColor}40` : "rgba(255,255,255,0.12)",
                    color: template.familyColor || "#e2e8f0",
                  }}
                >
                  <Layers className="h-2.5 w-2.5" />
                  {template.familyName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-slate-300 line-clamp-2 min-h-[38px] mb-4 z-10 leading-relaxed font-medium">
          {template.description || t('pdr.noComponentTemplateDesc', 'لا يوجد وصف محدد لقالب هذا المكون.')}
        </p>

        {/* Specs & Unit Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4 z-10">
          {template.unit && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-white/[0.04] text-slate-300 border border-white/10 font-mono">
              <Tag className="h-3 w-3 text-cyan-400" />
              <span>{t('pdr.unitLabel', 'الوحدة')}:</span> <strong className="text-white font-bold">{template.unit}</strong>
            </span>
          )}
          {template.specifications && Object.keys(template.specifications).length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              <Sparkles className="h-3 w-3" />
              <span className="font-bold">{Object.keys(template.specifications).length}</span> {t('pdr.specificationsCount', 'مواصفات')}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/10 pt-3 mt-auto flex items-center justify-end gap-2 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(template);
            }}
            className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-3 border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <Edit className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5 text-cyan-400" />
            {t('common.edit', 'تعديل')}
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-3 bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200 transition-all active:scale-95 cursor-pointer"
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
                <h4 className="text-lg font-extrabold text-white">{t('pdr.confirmDeleteComponentTemplateTitle', 'تأكيد حذف قالب المكون')}</h4>
                <p className="text-xs text-slate-400 font-mono">{template.id}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('pdr.confirmDeleteComponentTemplateDesc', 'هل أنت متأكد من رغبتك في حذف قالب المكون')} <span className="font-extrabold text-white">"{template.name}"</span>؟ {t('pdr.affectLinkedMachinesWarning', 'سيؤثر هذا على القوالب والآلات التي تعتمد عليه.')}
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
