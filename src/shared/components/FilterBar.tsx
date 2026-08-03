import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/shared/utils';

interface FilterTabOption {
  id: string;
  label: string;
  count?: number;
  color?: 'amber' | 'emerald' | 'cyan' | 'rose' | 'indigo' | 'fuchsia' | 'orange';
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  tabs?: FilterTabOption[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  extraControls?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'بحث...',
  tabs,
  activeTab,
  onTabChange,
  extraControls,
  className
}: FilterBarProps) {
  const tabColorStyles = {
    amber: 'bg-amber-500 text-black shadow-md shadow-amber-500/20',
    emerald: 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20',
    cyan: 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20',
    rose: 'bg-rose-500 text-white shadow-md shadow-rose-500/20',
    indigo: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20',
    fuchsia: 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20',
    orange: 'bg-orange-500 text-black shadow-md shadow-orange-500/20',
  };

  return (
    <div className={cn(
      "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 bg-black/40 border border-white/5 backdrop-blur-xl rounded-2xl shrink-0 text-right font-sans",
      className
    )}>
      {/* Tabs list if provided */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-xl overflow-x-auto custom-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const activeClass = tab.color ? tabColorStyles[tab.color] : 'bg-white/10 text-white border border-white/20';

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                  isActive ? activeClass : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    "text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full",
                    isActive ? "bg-black/20 text-current" : "bg-white/10 text-slate-300"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Extra dropdowns or custom controls */}
      <div className="flex flex-1 md:flex-none items-center gap-3 justify-end">
        {extraControls}

        {/* Search Input Box */}
        <div className="relative flex-1 md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
