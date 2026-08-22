import React, { useState } from "react";
import { Shapes, Edit, Trash2, AlertCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";
import { getFamilyIcon } from "@/shared/constants/icons";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ComponentFamilyData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  code?: string;
}

interface CompleteComponentFamilyCardProps {
  family: ComponentFamilyData;
  templateCount?: number;
  onEdit?: (family: ComponentFamilyData) => void;
  onDelete?: (family: ComponentFamilyData) => void;
  onSelect?: (family: ComponentFamilyData) => void;
  isSelected?: boolean;
}

export function CompleteComponentFamilyCard({
  family,
  templateCount = 0,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
}: CompleteComponentFamilyCardProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Dynamic icon extraction from registry or LucideIcons
  const IconComponent = getFamilyIcon(family.icon || family.code || family.name, 'component');

  return (
    <>
      <div
        onClick={() => onSelect?.(family)}
        className={cn(
          "rounded-2xl border bg-slate-900/80 backdrop-blur-xl shadow-lg text-slate-100",
          "flex flex-col group relative overflow-hidden transition-all duration-300 p-5 text-start cursor-pointer",
          isSelected
            ? "border-cyan-500/80 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50"
            : "border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/95 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-0.5"
        )}
      >
        {/* Background Watermark Icon */}
        <div
          className="absolute -right-6 -top-6 rtl:-right-auto rtl:-left-6 opacity-[0.04] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.08]"
          style={{ color: family.color || "#06b6d4" }}
        >
          <IconComponent className="h-36 w-36" />
        </div>

        {/* Card Header */}
        <div className="flex items-center gap-3.5 mb-4 z-10">
          <div
            className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/25 transition-transform duration-300 group-hover:scale-105 shadow-xs"
            style={{
              backgroundColor: family.color ? `${family.color}15` : undefined,
              borderColor: family.color ? `${family.color}35` : undefined,
              color: family.color || "#06b6d4",
            }}
          >
            <IconComponent className="h-6 w-6" />
          </div>

          <div className="overflow-hidden space-y-0.5 min-w-0 flex-1">
            <h3 className="font-extrabold text-base md:text-lg tracking-tight truncate text-white group-hover:text-cyan-300 transition-colors">
              {family.name}
            </h3>
            <p className="font-mono text-xs text-slate-400 font-bold truncate">
              {family.code || family.id}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="flex-grow mb-4 z-10">
          <p className="text-xs md:text-sm text-slate-300 line-clamp-2 min-h-[38px] leading-relaxed font-medium">
            {family.description || t('pdr.noComponentFamilyDesc', 'لا يوجد وصف محدد لهذه العائلة من المكونات.')}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/10 pt-3 mt-auto grid grid-cols-3 gap-2 items-center z-10">
          {/* Registered Templates Count */}
          <div className="col-span-1">
            <p className="font-mono font-extrabold text-white text-base leading-none">{templateCount}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{t('pdr.templatesRegisteredUnit', 'قوالب مسجلة')}</p>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(family);
            }}
            className="col-span-1 inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-2 border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <Edit className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5 text-cyan-400" />
            {t('common.edit', 'تعديل')}
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="col-span-1 inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-2 bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200 transition-all active:scale-95 cursor-pointer"
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
                <h4 className="text-lg font-extrabold text-white">{t('pdr.confirmDeleteComponentFamilyTitle', 'تأكيد حذف عائلة المكونات')}</h4>
                <p className="text-xs text-slate-400 font-mono">{family.code || family.id}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('pdr.confirmDeleteComponentFamilyDesc', 'هل أنت متأكد من رغبتك في حذف عائلة المكونات')} <span className="font-extrabold text-white">"{family.name}"</span>؟ {t('common.actionCannotBeUndone', 'لا يمكن التراجع عن هذا الإجراء إذا كانت هناك قوالب مرتبطة بها.')}
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
