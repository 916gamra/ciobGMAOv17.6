import React from 'react';
import { cn } from '@/shared/utils';

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string;
}

export const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, error, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1", className)} {...props}>
      {children}
      {error && (
        <p className="text-[11px] text-red-400 font-medium tracking-wide mt-1 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  )
);
FormGroup.displayName = 'FormGroup';
