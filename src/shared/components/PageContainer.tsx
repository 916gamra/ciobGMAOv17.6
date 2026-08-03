import React from 'react';
import { motion, Variants } from 'motion/react';
import { cn } from '@/shared/utils';

export const pageContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.08, 
      delayChildren: 0.05 
    } 
  }
};

export const pageItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5, 
      ease: "easeOut" 
    } 
  }
};

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'indigo' | 'fuchsia' | 'emerald' | 'amber' | 'rose' | 'orange' | 'purple';
}

export function PageContainer({ children, className, glowColor = 'cyan' }: PageContainerProps) {
  const glowMap = {
    cyan: 'from-cyan-500/5',
    indigo: 'from-indigo-500/5',
    fuchsia: 'from-fuchsia-500/5',
    emerald: 'from-emerald-500/5',
    amber: 'from-amber-500/5',
    rose: 'from-rose-500/5',
    orange: 'from-orange-500/5',
    purple: 'from-purple-500/5',
  };

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className={cn("w-full space-y-6 pb-24 px-4 lg:px-8 pt-2 relative z-10 text-right font-sans min-h-full flex flex-col", className)}
    >
      {/* Top Ambient Glow HUD */}
      <div className={cn("absolute top-0 right-0 left-0 h-[280px] bg-gradient-to-b via-transparent to-transparent pointer-events-none -z-10 rounded-t-[3rem]", glowMap[glowColor])} />
      
      {children}
    </motion.div>
  );
}
