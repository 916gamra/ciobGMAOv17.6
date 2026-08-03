import React from 'react';
import { cn } from '@/shared/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "titan-input appearance-none pr-10",
            error && "border-red-500/50 focus:ring-red-500/20 focus:border-red-500/50",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';
