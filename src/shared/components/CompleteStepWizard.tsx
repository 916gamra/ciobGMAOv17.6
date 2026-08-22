import React, { useState } from "react";
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Layers, 
  Settings, 
  FileCheck, 
  Save
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  isOptional?: boolean;
}

interface StepWizardProps {
  steps?: WizardStep[];
  currentStepIndex?: number;
  onStepChange?: (index: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  engineTheme?: "indigo" | "cyan" | "amber" | "emerald" | "orange";
  children?: React.ReactNode;
}

const DEFAULT_STEPS: WizardStep[] = [
  {
    id: "general",
    title: "المعلومات العامة",
    subtitle: "تحديد الهوية والاسم والرمز",
    icon: Layers,
  },
  {
    id: "configuration",
    title: "التكوين والمواصفات",
    subtitle: "إعداد المعايير والأنظمة",
    icon: Settings,
  },
  {
    id: "review",
    title: "المراجعة والتأكيد",
    subtitle: "فحص البيانات والاعتماد",
    icon: FileCheck,
  },
];

export function CompleteStepWizard({
  steps = DEFAULT_STEPS,
  currentStepIndex: controlledStepIndex,
  onStepChange,
  onComplete,
  onCancel,
  isSubmitting = false,
  submitLabel,
  engineTheme = "indigo",
  children,
}: StepWizardProps) {
  const { t } = useTranslation();
  const [internalStep, setInternalStep] = useState(0);
  const activeStep = controlledStepIndex !== undefined ? controlledStepIndex : internalStep;

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      if (onStepChange) {
        onStepChange(index);
      } else {
        setInternalStep(index);
      }
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      goToStep(activeStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      goToStep(activeStep - 1);
    }
  };

  const progressPercentage = steps.length > 1 ? (activeStep / (steps.length - 1)) * 100 : 100;

  // Engine theme colors mapping
  const themeColors = {
    indigo: {
      activeRing: "ring-indigo-500/30",
      activeBg: "bg-indigo-600 text-white shadow-indigo-500/25",
      completedBg: "bg-indigo-600 text-white",
      progressBar: "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]",
      activeText: "text-indigo-400 font-extrabold",
      badge: "border-indigo-500/40 text-indigo-300",
      primaryBtn: "bg-white text-slate-950 hover:bg-slate-200 shadow-md",
    },
    cyan: {
      activeRing: "ring-cyan-500/30",
      activeBg: "bg-cyan-600 text-white shadow-cyan-500/25",
      completedBg: "bg-cyan-600 text-white",
      progressBar: "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]",
      activeText: "text-cyan-400 font-extrabold",
      badge: "border-cyan-500/40 text-cyan-300",
      primaryBtn: "bg-white text-slate-950 hover:bg-slate-200 shadow-md",
    },
    amber: {
      activeRing: "ring-amber-500/30",
      activeBg: "bg-amber-600 text-white shadow-amber-500/25",
      completedBg: "bg-amber-600 text-white",
      progressBar: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]",
      activeText: "text-amber-400 font-extrabold",
      badge: "border-amber-500/40 text-amber-300",
      primaryBtn: "bg-white text-slate-950 hover:bg-slate-200 shadow-md",
    },
    emerald: {
      activeRing: "ring-emerald-500/30",
      activeBg: "bg-emerald-600 text-white shadow-emerald-500/25",
      completedBg: "bg-emerald-600 text-white",
      progressBar: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]",
      activeText: "text-emerald-400 font-extrabold",
      badge: "border-emerald-500/40 text-emerald-300",
      primaryBtn: "bg-white text-slate-950 hover:bg-slate-200 shadow-md",
    },
    orange: {
      activeRing: "ring-orange-500/30",
      activeBg: "bg-orange-600 text-white shadow-orange-500/25",
      completedBg: "bg-orange-600 text-white",
      progressBar: "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]",
      activeText: "text-orange-400 font-extrabold",
      badge: "border-orange-500/40 text-orange-300",
      primaryBtn: "bg-white text-slate-950 hover:bg-slate-200 shadow-md",
    }
  }[engineTheme];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 text-start">
      
      {/* 1️⃣ Stepper Header */}
      <div className="p-6 md:p-8 border-b border-white/10 bg-white/[0.02] relative">
        
        {/* Dynamic Background Progress Bar */}
        <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 bg-white/10 z-0">
          <div 
            className={cn("h-full transition-all duration-500 ease-out", themeColors.progressBar)}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Steps Nodes */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {steps.map((step, index) => {
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;
            const isPending = index > activeStep;
            const StepIcon = step.icon || Sparkles;

            return (
              <div 
                key={step.id} 
                onClick={() => isCompleted && goToStep(index)}
                className={cn(
                  "flex flex-col items-center flex-1 transition-all duration-300 select-none",
                  isCompleted ? "cursor-pointer group" : "cursor-default"
                )}
              >
                {/* Step Node Circle */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all duration-300 shadow-md relative",
                    isCompleted && cn(themeColors.completedBg, "scale-100 group-hover:scale-105 cursor-pointer"),
                    isActive && cn(themeColors.activeBg, "ring-4", themeColors.activeRing, "scale-110 shadow-lg"),
                    isPending && "bg-slate-800 text-slate-400 border border-white/10"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[2.5] animate-in zoom-in-50" />
                  ) : (
                    <StepIcon className={cn("h-5 w-5", isActive ? "animate-pulse" : "")} />
                  )}

                  {/* Step Sequence Badge */}
                  <span className="absolute -bottom-1 -right-1 text-[10px] w-4 h-4 rounded-full bg-slate-950 border border-white/20 text-white flex items-center justify-center font-mono font-bold">
                    {index + 1}
                  </span>
                </div>

                {/* Step Label */}
                <div className="text-center mt-3 hidden sm:block">
                  <p 
                    className={cn(
                      "text-xs md:text-sm font-bold transition-colors",
                      isActive ? themeColors.activeText : isCompleted ? "text-white" : "text-slate-400"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.subtitle && (
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-[140px] truncate font-medium">
                      {step.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Simplified Step Banner */}
        <div className="sm:hidden mt-4 pt-3 border-t border-white/10 text-center">
          <span className="text-xs font-extrabold text-indigo-400">
            {t('common.step', 'المرحلة')} {activeStep + 1} {t('common.of', 'من')} {steps.length}: 
          </span>
          <span className="text-xs text-white font-bold mr-1 rtl:mr-0 rtl:ml-1">
            {steps[activeStep].title}
          </span>
        </div>
      </div>

      {/* 2️⃣ Step Body Content */}
      <div className="p-6 md:p-8 flex-1 min-h-[320px] relative overflow-y-auto custom-scrollbar">
        {children ? (
          children
        ) : (
          <DefaultStepContent stepIndex={activeStep} step={steps[activeStep]} />
        )}
      </div>

      {/* 3️⃣ Footer Action Controls */}
      <div className="p-4 md:p-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
        {/* Cancel / Prev Button */}
        <div>
          {activeStep === 0 ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {t('common.cancel', 'إلغاء')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <ChevronRight className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-4 w-4" />
              {t('common.prev', 'السابق')}
            </button>
          )}
        </div>

        {/* Next / Submit Button */}
        <div className="flex items-center gap-2">
          {activeStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-extrabold bg-white text-slate-950 hover:bg-slate-200 shadow-md shadow-white/10 transition-all active:scale-95 cursor-pointer"
            >
              {t('common.next', 'التالي')}
              <ChevronLeft className="ml-1.5 rtl:ml-0 rtl:mr-1.5 h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-extrabold bg-white text-slate-950 hover:bg-slate-200 shadow-lg shadow-white/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="mr-2 rtl:mr-0 rtl:ml-2 h-4 w-4" />
              {isSubmitting ? t('common.saving', 'جاري الحفظ...') : (submitLabel || t('common.saveAndConfirm', 'حفظ واعتماد'))}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

function DefaultStepContent({ stepIndex, step }: { stepIndex: number; step: WizardStep }) {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300 text-start">
      <div className="border-b border-white/10 pb-3">
        <h4 className="text-lg font-extrabold text-white">{step.title}</h4>
        <p className="text-xs text-slate-400">{step.subtitle}</p>
      </div>

      {stepIndex === 0 && (
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم العنصر / الآلة</label>
            <input 
              type="text" 
              placeholder="مثال: وحدة حقن القوالب الهيدروليكية" 
              className="w-full h-10 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">الرمز التعريفي الفريد (ID)</label>
            <input 
              type="text" 
              placeholder="مثال: MCH-INJ-001" 
              className="w-full h-10 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع التغذية الكهربائية</label>
            <select className="w-full h-10 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all">
              <option className="bg-slate-900">380V Three-Phase AC</option>
              <option className="bg-slate-900">220V Single-Phase AC</option>
              <option className="bg-slate-900">24V Industrial DC</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات ومواصفات التشغيل</label>
            <textarea 
              rows={3} 
              placeholder="أدخل أي متطلبات خاصة بالصيانة الوقائية أو التركيب..."
              className="w-full p-3 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      )}

      {stepIndex === 2 && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-sm">
            <Sparkles className="h-4 w-4" />
            جاهز للاعتماد النهائي
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            تم استيفاء جميع المتطلبات والمعايير الفنية بنجاح. اضغط على زر الحفظ أدناه لإدراج هذا المخطط داخل قاعدة البيانات.
          </p>
        </div>
      )}
    </div>
  );
}
