import React, { useState } from "react";
import { DraftingCompass, Binary, Cpu, Edit, Copy, Trash2, Tag, AlertCircle, Activity, ExternalLink } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ComponentBlueprintData {
  id: string;
  name: string;
  category?: string;
  description?: string;
  version?: string;
  pinCount?: number;
  voltageRating?: string;
  interfaces?: string[];
  parameters?: Record<string, string | number>;
  updatedAt?: string;
  manufacturer?: string;
  partNumber?: string;
  slotNumber?: string | number;
  stockCount?: number;
}

interface ComponentBlueprintCardProps {
  blueprint: ComponentBlueprintData;
  onEdit?: (blueprint: ComponentBlueprintData) => void;
  onDuplicate?: (blueprint: ComponentBlueprintData) => void;
  onDelete?: (blueprint: ComponentBlueprintData) => void;
  onSelect?: (blueprint: ComponentBlueprintData) => void;
  onActivateToStock?: (blueprint: ComponentBlueprintData) => void;
  isSelected?: boolean;
}

export function CompleteComponentBlueprintCard({
  blueprint,
  onEdit,
  onDuplicate,
  onDelete,
  onSelect,
  onActivateToStock,
  isSelected = false,
}: ComponentBlueprintCardProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const interfaceCount = blueprint.interfaces?.length || 0;

  return (
    <>
      <div
        onClick={() => onSelect?.(blueprint)}
        className={cn(
          "rounded-2xl border bg-slate-900/80 backdrop-blur-xl shadow-lg text-slate-100",
          "flex flex-col group relative overflow-hidden transition-all duration-300 p-5 text-start",
          isSelected
            ? "border-amber-500/80 bg-amber-950/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50"
            : "border-white/10 hover:border-amber-500/40 hover:bg-slate-900/95 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5",
          onSelect && "cursor-pointer"
        )}
      >
        {/* Background Watermark Icon */}
        <div className="absolute -right-8 -top-8 rtl:-right-auto rtl:-left-8 opacity-[0.04] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.08] text-amber-400">
          <DraftingCompass className="h-36 w-36" />
        </div>

        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3 z-10">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <DraftingCompass className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-base tracking-tight truncate text-white group-hover:text-amber-300 transition-colors">
                {blueprint.name || blueprint.partNumber}
              </h3>
            </div>
            <div className="flex items-center gap-2 pl-7 rtl:pl-0 rtl:pr-7 flex-wrap">
              <span className="font-mono text-xs text-slate-400 font-bold truncate">
                {blueprint.partNumber || blueprint.id}
              </span>
              {blueprint.manufacturer && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/10 font-medium">
                  {blueprint.manufacturer}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {blueprint.slotNumber && (
              <span className="shrink-0 px-2 py-0.5 text-[11px] font-mono font-bold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                #{String(blueprint.slotNumber).padStart(3, '0')}
              </span>
            )}
            {blueprint.version && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-white/5 text-slate-400 border border-white/10">
                v{blueprint.version}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-slate-300 line-clamp-2 min-h-[38px] mb-4 z-10 leading-relaxed font-medium">
          {blueprint.description || t('pdr.noComponentBlueprintDesc', 'لا يوجد وصف فني محدد لهذا المكون.')}
        </p>

        {/* Technical Specs & IO Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Binary className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono font-extrabold text-white text-sm">{blueprint.pinCount || interfaceCount || (blueprint.parameters ? Object.keys(blueprint.parameters).length : "-")}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{t('pdr.portsOrSpecs', 'المنافذ / المعايير')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono font-extrabold text-white text-xs truncate max-w-[80px]">
                {blueprint.voltageRating || (blueprint.stockCount !== undefined ? `${blueprint.stockCount} قطع` : "قياسي")}
              </p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{t('pdr.loadOrRating', 'الجهد / المخزون')}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/10 pt-3 mt-auto grid grid-cols-3 gap-2 z-10">
          {onActivateToStock ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onActivateToStock(blueprint);
              }}
              className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-8 px-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <ExternalLink className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5" />
              {t('pdr.activateToStockShort', 'تفعيل')}
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
              <Edit className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-3.5 w-3.5 text-amber-400" />
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
                <h4 className="text-lg font-extrabold text-white">{t('pdr.confirmDeleteBlueprintTitle', 'تأكيد حذف المخطط الفني')}</h4>
                <p className="text-xs text-slate-400 font-mono">{blueprint.id}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('pdr.confirmDeleteBlueprintDesc', 'هل أنت متأكد من رغبتك في حذف المخطط الهندسي للمكون')} <span className="font-extrabold text-white">"{blueprint.name || blueprint.partNumber}"</span>؟ {t('common.actionCannotBeUndone', 'لا يمكن التراجع عن هذه العملية.')}
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
