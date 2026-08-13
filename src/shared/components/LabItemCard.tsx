import React from 'react';
import { cn } from '@/shared/utils';
import { ChevronRight } from 'lucide-react';

interface LabItemCardProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ElementType;
  isSelected: boolean;
  onClick: () => void;
  accentColor?: 'neutral' | 'engine';
}

export function LabItemCard({ 
  title, 
  subtitle, 
  badge, 
  icon: Icon, 
  isSelected, 
  onClick,
  accentColor = 'neutral'
}: LabItemCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border text-right",
        isSelected 
          ? "bg-white/[0.08] border-white/20 text-white font-extrabold shadow-md relative overflow-hidden before:absolute before:inset-y-0 before:right-0 before:w-1 before:bg-white"
          : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
      )}
    >
      <div className="flex items-center gap-3 flex-row-reverse">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
          isSelected
            ? accentColor === 'neutral'
              ? "bg-white/10 border-white/20 text-white"
              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            : "bg-white/5 border-white/10 text-slate-400"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex flex-col text-right">
          <span className={cn("text-xs transition-colors", isSelected ? "text-white font-bold" : "text-slate-300 font-medium")}>
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 mt-0.5">{subtitle}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[10px] font-mono bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/15">
            {badge}
          </span>
        )}
        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isSelected ? "text-white" : "text-slate-600")} />
      </div>
    </div>
  );
}
