import React from 'react';
import { cn } from '@/shared/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isFullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', leftIcon, rightIcon, isFullWidth, children, ...props }, ref) => {
    
    const baseStyles = "titan-button";
    
    const variants = {
      primary: "titan-button-primary",
      secondary: "titan-button-secondary",
      ghost: "bg-transparent hover:bg-white/10 border border-transparent text-slate-400 hover:text-white shadow-none",
      danger: "titan-button-danger"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          isFullWidth ? "w-full" : "",
          className
        )}
        {...props}
      >
        {leftIcon && <span className="w-4 h-4 flex items-center justify-center">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="w-4 h-4 flex items-center justify-center">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';
