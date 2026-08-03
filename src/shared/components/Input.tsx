import React from 'react';
import { cn } from '@/shared/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] font-semibold text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center justify-center pointer-events-none z-10">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-rose-500/50 focus:border-rose-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center justify-center pointer-events-none z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
