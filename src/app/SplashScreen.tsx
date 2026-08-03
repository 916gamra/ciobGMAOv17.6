import React, { useEffect } from 'react';
import { motion } from 'motion/react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {

  useEffect(() => {
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-slate-100 overflow-hidden selection:bg-white/10">
      
      {/* Subtle refined decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.05] via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center w-full px-8"
      >
        {/* Animated Custom SVG Logo */}
        <div className="relative mb-12">
          <motion.svg 
            className="w-24 h-24" 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path 
              d="M50 14L81 32V68L50 86L19 68V32L50 14Z" 
              stroke="white" 
              strokeWidth="2" 
              strokeOpacity="0.8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            />
            <motion.circle 
              cx="50" cy="50" r="4" 
              fill="white" 
              fillOpacity="0.8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
          </motion.svg>
        </div>
        
        {/* Typographic Logo */}
        <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                <div className="w-1.5 h-5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)] mt-1" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                TITANIC <span className="text-blue-500 font-light border-l border-white/10 pl-4 ml-1">OS</span>
              </h1>
            </div>
            
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-medium mt-6"
          >
            Strategic Command & Maintenance
          </motion.p>
        </div>
        
        {/* Progress Container */}
        <div className="w-48 relative mt-16">
           <div className="w-full h-[1px] bg-white/10 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-white/50"
               initial={{ width: "0%" }}
               animate={{ width: "100%" }}
               transition={{ duration: 2.5, ease: "easeInOut" }}
             />
           </div>
        </div>
      </motion.div>
      
      {/* Footer Versioning */}
      <div className="absolute bottom-8 text-[9px] text-slate-600 font-mono tracking-[0.2em] uppercase">
        v4.0.0 // SECURE_ENCLAVE
      </div>
    </div>
  );
}
