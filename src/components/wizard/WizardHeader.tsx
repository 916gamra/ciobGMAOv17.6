import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useWizard } from './WizardContext';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function WizardHeader() {
  const { t } = useTranslation();
  const { steps, currentStepIndex, goToStep, engineTheme = "indigo" } = useWizard();
  const progressPercent = steps.length > 1 ? (currentStepIndex / (steps.length - 1)) * 100 : 100;

  const themeColors = {
    indigo: {
      activeRing: "ring-indigo-500/30",
      activeBg: "bg-indigo-600 text-white shadow-indigo-500/25",
      completedBg: "bg-indigo-600 text-white",
      progressBar: "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]",
      activeText: "text-indigo-400 font-extrabold",
    },
    cyan: {
      activeRing: "ring-cyan-500/30",
      activeBg: "bg-cyan-600 text-white shadow-cyan-500/25",
      completedBg: "bg-cyan-600 text-white",
      progressBar: "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]",
      activeText: "text-cyan-400 font-extrabold",
    },
    amber: {
      activeRing: "ring-amber-500/30",
      activeBg: "bg-amber-600 text-white shadow-amber-500/25",
      completedBg: "bg-amber-600 text-white",
      progressBar: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]",
      activeText: "text-amber-400 font-extrabold",
    },
    emerald: {
      activeRing: "ring-emerald-500/30",
      activeBg: "bg-emerald-600 text-white shadow-emerald-500/25",
      completedBg: "bg-emerald-600 text-white",
      progressBar: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]",
      activeText: "text-emerald-400 font-extrabold",
    },
    orange: {
      activeRing: "ring-orange-500/30",
      activeBg: "bg-orange-600 text-white shadow-orange-500/25",
      completedBg: "bg-orange-600 text-white",
      progressBar: "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]",
      activeText: "text-orange-400 font-extrabold",
    }
  }[engineTheme];

  return (
    <div className="p-6 md:p-8 border-b border-white/10 bg-white/[0.02] relative text-start">
      {/* Light progress track line */}
      <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 bg-white/10 z-0">
        <div
          className={cn("h-full transition-all duration-500 ease-out", themeColors.progressBar)}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Interactive step nodes */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const StepIcon = step.icon || Sparkles;

          return (
            <div
              key={step.id}
              onClick={() => isCompleted && goToStep(index)}
              className={cn(
                "flex flex-col items-center flex-1 select-none transition-all",
                isCompleted ? "cursor-pointer group" : "cursor-default"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all duration-300 relative shadow-sm",
                  isCompleted && cn(themeColors.completedBg, "scale-100 group-hover:scale-105 shadow-md"),
                  isActive && cn(themeColors.activeBg, "ring-4", themeColors.activeRing, "scale-110 shadow-lg"),
                  index > currentStepIndex && "bg-slate-800 text-slate-400 border border-white/10"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[2.5] animate-in zoom-in-50" />
                ) : (
                  <StepIcon className={cn("h-5 w-5", isActive ? "animate-pulse" : "")} />
                )}

                {/* Step number badge */}
                <span className="absolute -bottom-1 -right-1 rtl:-right-auto rtl:-left-1 text-[10px] w-4 h-4 rounded-full bg-slate-950 border border-white/20 text-white flex items-center justify-center font-mono font-bold">
                  {index + 1}
                </span>
              </div>

              {/* Step title & subtitle */}
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
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-[130px] truncate font-medium">
                    {step.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile step indicator */}
      <div className="sm:hidden mt-4 pt-3 border-t border-white/10 text-center">
        <span className={cn("text-xs font-extrabold", themeColors.activeText)}>
          {t('common.step', 'المرحلة')} {currentStepIndex + 1} {t('common.of', 'من')} {steps.length}: 
        </span>
        <span className="text-xs text-white font-bold mr-1 rtl:mr-0 rtl:ml-1">
          {steps[currentStepIndex].title}
        </span>
      </div>
    </div>
  );
}
