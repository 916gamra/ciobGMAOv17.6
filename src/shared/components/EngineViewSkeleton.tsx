import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';
import { cn } from '@/shared/utils';

export type SkeletonTheme = 'indigo' | 'cyan' | 'emerald' | 'orange' | 'fuchsia' | 'amber' | 'blue' | 'rose' | 'slate';

interface EngineViewSkeletonProps {
  mode?: 'lab' | 'split-pane' | 'registry' | 'table' | 'cards';
  themeColor?: SkeletonTheme;
  className?: string;
}

const THEME_ACCENTS: Record<SkeletonTheme, {
  glow: string;
  leftGrad: string;
  pillBorder: string;
  badgeBg: string;
}> = {
  indigo: {
    glow: 'bg-indigo-500/15',
    leftGrad: 'from-indigo-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    pillBorder: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/10',
  },
  cyan: {
    glow: 'bg-cyan-500/15',
    leftGrad: 'from-cyan-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    pillBorder: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
  },
  emerald: {
    glow: 'bg-emerald-500/15',
    leftGrad: 'from-emerald-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    pillBorder: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10',
  },
  orange: {
    glow: 'bg-orange-500/15',
    leftGrad: 'from-orange-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    pillBorder: 'border-orange-500/30',
    badgeBg: 'bg-orange-500/10',
  },
  fuchsia: {
    glow: 'bg-fuchsia-500/15',
    leftGrad: 'from-fuchsia-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    pillBorder: 'border-fuchsia-500/30',
    badgeBg: 'bg-fuchsia-500/10',
  },
  amber: {
    glow: 'bg-amber-500/15',
    leftGrad: 'from-amber-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    pillBorder: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10',
  },
  blue: {
    glow: 'bg-blue-500/15',
    leftGrad: 'from-blue-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    pillBorder: 'border-blue-500/30',
    badgeBg: 'bg-blue-500/10',
  },
  rose: {
    glow: 'bg-rose-500/15',
    leftGrad: 'from-rose-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    pillBorder: 'border-rose-500/30',
    badgeBg: 'bg-rose-500/10',
  },
  slate: {
    glow: 'bg-slate-400/15',
    leftGrad: 'from-slate-900/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98',
    pillBorder: 'border-slate-500/30',
    badgeBg: 'bg-slate-500/10',
  },
};

export function EngineViewSkeleton({
  mode = 'registry',
  themeColor = 'indigo',
  className
}: EngineViewSkeletonProps) {
  const theme = THEME_ACCENTS[themeColor] || THEME_ACCENTS.indigo;
  const isLab = mode === 'lab' || mode === 'split-pane';

  return (
    <div className={cn("w-full flex-1 flex flex-col min-h-0 space-y-6 animate-in fade-in duration-300", className)}>
      {/* 1. Page Header Skeleton (1:1 with PageHeader + Bento KPI Grid) */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch justify-between shrink-0">
        {/* Main Title & Subtitle Card */}
        <div className="flex-1 min-w-0 p-6 rounded-3xl bg-[#0a0a0f]/40 border border-white/10 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-4">
            {/* Header Icon Box (12x12 = 48px) */}
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0 bg-white/10 border border-white/15" />
            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-48 sm:w-64 rounded-lg" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-72 sm:w-96 max-w-full rounded-md" />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* 4 Quick Bento KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:w-[480px] shrink-0 gap-3">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#0a0a0f]/40 border border-white/10 backdrop-blur-xl flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="w-10 h-3 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-14 rounded-md" />
                <Skeleton className="h-2.5 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Work Area Skeleton */}
      {isLab ? (
        /* ARCHETYPE A: LAB SKELETON (Engineering Lab / Parts Catalog Lab / Task Catalog) */
        <div className="flex flex-col lg:flex-row flex-1 min-h-[540px] gap-6 items-stretch">
          {/* Left Lab Navigation Card (Chapter 12 Constitution: w-full lg:w-[380px]) */}
          <div className={cn(
            "w-full lg:w-[380px] shrink-0 rounded-3xl border border-white/10 backdrop-blur-2xl p-5 flex flex-col space-y-4 relative overflow-hidden bg-gradient-to-b shadow-2xl",
            theme.leftGrad
          )}>
            {/* Ambient Glow */}
            <div className={cn("absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-50", theme.glow)} />

            {/* Left Header: Bold Title & Mandatory Subtitle */}
            <div className="space-y-1.5 pb-3 border-b border-white/10 relative z-10">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-3 w-52 rounded" />
            </div>

            {/* Search Input & System Filter Bar */}
            <div className="space-y-2 relative z-10">
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            </div>

            {/* Shimmer Slot Items List */}
            <div className="flex-1 space-y-2.5 pt-2 relative z-10 overflow-hidden">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="p-3.5 rounded-2xl border border-white/10 bg-[#111218]/40 backdrop-blur-md flex items-center gap-3.5"
                >
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0 bg-white/10" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-28 rounded font-mono" />
                      <Skeleton className="h-3 w-10 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Pagination / Status */}
            <div className="pt-3 border-t border-white/10 flex justify-between items-center relative z-10">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-7 w-20 rounded-xl" />
            </div>
          </div>

          {/* Right Lab Canvas Panel */}
          <div className="flex-1 min-w-0 rounded-3xl bg-[#0a0a0f]/40 border border-white/10 backdrop-blur-xl p-6 flex flex-col space-y-5 shadow-2xl relative overflow-hidden">
            {/* Top Action Command Bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-40 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-60 rounded" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-32 rounded-xl" />
              </div>
            </div>

            {/* Middle Datasheet / Specs Tabs */}
            <div className="flex gap-2 pb-2">
              <Skeleton className="h-8 w-28 rounded-xl" />
              <Skeleton className="h-8 w-28 rounded-xl" />
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>

            {/* Blueprint Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
              {[1, 2, 3, 4, 5, 6].map((card) => (
                <div key={card} className="p-4 rounded-2xl border border-white/10 bg-[#111218]/40 backdrop-blur-md space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20 rounded font-mono" />
                      <Skeleton className="h-4 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-36 rounded-md" />
                    <Skeleton className="h-14 w-full rounded-xl bg-white/[0.02]" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ARCHETYPE B: REGISTRY / TABLE SKELETON (Machine Registry / Staff / Sectors / Stock) */
        <div className="flex-1 min-h-[500px] rounded-3xl bg-[#0a0a0f]/40 border border-white/10 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl">
          {/* Controls & Unified Search Bar */}
          <div className="p-4 md:p-5 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <Skeleton className="h-10 w-full max-w-md rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>

          {/* Table Header Placeholder */}
          <div className="grid grid-cols-6 gap-4 py-3.5 px-6 border-b border-white/10 bg-white/[0.02]">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded justify-self-end" />
          </div>

          {/* Table Rows Placeholder */}
          <div className="flex-1 p-4 space-y-2.5 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div
                key={row}
                className="grid grid-cols-6 gap-4 items-center py-3.5 px-4 rounded-2xl border border-white/[0.04] bg-[#111218]/30"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                  <Skeleton className="h-4 w-16 rounded font-mono" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-2.5 w-24 rounded" />
                </div>
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-xl justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
