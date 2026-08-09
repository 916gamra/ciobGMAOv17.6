import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export function PdrPageSkeleton() {
  return (
    <div className="w-full space-y-6 pb-12 px-4 lg:px-8 text-left animate-in fade-in duration-300">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0a0f]/20 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* 2. KPI Stat Cards Grid Skeleton (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-[#0a0a0f]/20 border border-white/5 backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="w-12 h-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* 3. Controls & Filter Bar Skeleton */}
      <div className="p-4 rounded-2xl bg-[#0a0a0f]/20 border border-white/5 backdrop-blur-md flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* 4. Main Data Table / Rows Skeleton */}
      <div className="rounded-2xl bg-[#0a0a0f]/20 border border-white/5 backdrop-blur-md overflow-hidden p-4 space-y-3">
        {/* Table Header Placeholder */}
        <div className="grid grid-cols-6 gap-4 pb-3 border-b border-white/5 px-4">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-16 rounded justify-self-end" />
        </div>

        {/* Rows Placeholders */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="grid grid-cols-6 gap-4 items-center py-3 px-4 rounded-xl border border-white/[0.02]">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-xl justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}
