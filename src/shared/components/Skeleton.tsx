import React from 'react';
import { cn } from "@/shared/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.06] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent",
        className
      )}
      {...props}
    />
  );
}
