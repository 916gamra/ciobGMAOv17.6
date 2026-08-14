import React from 'react';
import { UnifiedSearchFilter, FilterGroup, FilterOption, QuickTabOption } from './UnifiedSearchFilter';
import { cn } from '@/shared/utils';

export type { FilterGroup, FilterOption, QuickTabOption };
export { UnifiedSearchFilter };

interface FilterTabOption {
  id: string;
  label: string;
  count?: number;
  color?: 'amber' | 'emerald' | 'cyan' | 'rose' | 'indigo' | 'fuchsia' | 'orange' | 'purple';
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  tabs?: FilterTabOption[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  filterGroups?: FilterGroup[];
  extraControls?: React.ReactNode;
  className?: string;
  themeColor?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'purple';
  showActiveTags?: boolean;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'بحث...',
  tabs,
  activeTab,
  onTabChange,
  filterGroups,
  extraControls,
  className,
  themeColor = 'cyan',
  showActiveTags = true
}: FilterBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <UnifiedSearchFilter
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        quickTabs={tabs}
        activeQuickTab={activeTab}
        onQuickTabChange={onTabChange}
        filterGroups={filterGroups}
        extraControls={extraControls}
        themeColor={themeColor}
        showActiveTags={showActiveTags}
        fullWidth
      />
    </div>
  );
}

