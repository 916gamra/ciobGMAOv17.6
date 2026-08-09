import React from 'react';
import { cn } from '@/shared/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] font-semibold text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full bg-[#0a0a0f]/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none",
            error && "border-rose-500/50 focus:border-rose-500",
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
