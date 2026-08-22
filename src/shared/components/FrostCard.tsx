import React from "react";
import { cn } from "@/shared/utils";

export interface FrostCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Enables hover animations (border glow, lift) */
  hoverEffect?: boolean;
  /** Changes cursor to pointer */
  interactive?: boolean;
}

/**
 * FrostCard - Standard BDR Nexus Glassmorphism Wrapper
 * Based on Chapter 11 & 22 of the Architecture Constitution (GMAO v17.1)
 */
export function FrostCard({ 
  children, 
  className, 
  hoverEffect = true, 
  interactive = false,
  ...props 
}: FrostCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 transition-all duration-300",
        // دمج تأثير الزجاج الضبابي والتأثيرات الزجاجية وفق الدستور الكريستالي
        "bg-[#0a0a0f]/60 border-white/10 shadow-2xl backdrop-blur-xl",
        // التفاعلية والانتقالات السلسة
        hoverEffect && "hover:border-white/20 hover:bg-white/[0.02] hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(255,255,255,0.03)]",
        interactive && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
