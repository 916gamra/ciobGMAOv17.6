import React from 'react';
import { cn } from '@/shared/utils';

export function GlassCard({ children, className, onClick, ...props }: React.ComponentProps<'div'>) {
  // If onClick is presented, make it obviously interactive
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]'
    : '';

  return (
    <div 
      className={cn(
        "titan-card group",
        interactiveClasses,
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Subtle top glare effect strictly for 3D realism */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </div>
  );
}
