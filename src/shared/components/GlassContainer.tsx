import React, { forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** درجة ضبابية الزجاج */
  intensity?: "light" | "medium" | "heavy" | "ultra";
  /** نوع التأثير والتوهج */
  variant?: "default" | "card" | "glow" | "subtle" | "neon";
  /** تفعيل حركة الارتفاع والتوهج عند تمرير الفأرة */
  interactive?: boolean;
  /** إظهار طبقة انعكاس ضوئي علوي خفيف */
  hasShine?: boolean;
  className?: string;
}

export const GlassContainer = forwardRef<HTMLDivElement, GlassProps>(
  (
    {
      children,
      intensity = "medium",
      variant = "card",
      interactive = false,
      hasShine = true,
      className,
      ...props
    },
    ref
  ) => {
    // 1. مستويات الضبابية والشفافية مع مراعاة التباين والألوان الداكنة المعتمة
    const intensityStyles = {
      light: "bg-slate-900/40 backdrop-blur-md",
      medium: "bg-slate-900/60 backdrop-blur-xl",
      heavy: "bg-slate-900/80 backdrop-blur-2xl",
      ultra: "bg-[#0a0a0f]/90 backdrop-blur-3xl",
    };

    // 2. أنواع الإطار والظلال والتوهج
    const variantStyles = {
      default: "border border-white/10 shadow-sm",
      card: "border border-white/10 shadow-xl shadow-black/30",
      glow: "border border-indigo-500/30 shadow-xl shadow-indigo-500/10",
      subtle: "border border-white/5 shadow-xs",
      neon: "border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]",
    };

    // 3. تأثيرات التفاعل عند الـ Hover
    const interactiveStyles = interactive
      ? "transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer"
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl transition-colors text-slate-100",
          intensityStyles[intensity],
          variantStyles[variant],
          interactiveStyles,
          className
        )}
        {...props}
      >
        {/* طبقة انعكاس الإضاءة العلوية الأنيقة (Shine Reflection) */}
        {hasShine && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-80 z-20"
            aria-hidden="true"
          />
        )}

        {/* محتوى العنصر */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassContainer.displayName = "GlassContainer";
