import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/shared/utils';

export interface PdrCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function PdrCard({
  children,
  onClick,
  className,
  ...props
}: PdrCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "titan-card p-6 cursor-pointer",
        className
      )}
      {...props}
    >
      {/* Structural Glare */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </motion.div>
  );
}
