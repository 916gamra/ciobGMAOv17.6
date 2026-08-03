import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  requireVerification?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
  requireVerification
}: ConfirmationModalProps) {
  const [verificationValue, setVerificationValue] = React.useState('');
  
  const isVerified = !requireVerification || verificationValue === requireVerification;

  React.useEffect(() => {
    if (!isOpen) {
      setVerificationValue('');
    }
  }, [isOpen]);
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: ShieldAlert,
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-500',
          button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40',
          accent: 'bg-rose-500/20'
        };
      case 'info':
        return {
          icon: CheckCircle2,
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40',
          accent: 'bg-blue-500/20'
        };
      default: // warning
        return {
          icon: AlertCircle,
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-500',
          button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40',
          accent: 'bg-amber-500/20'
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
              />
            </Dialog.Overlay>
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[101]">
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
                >
                  {/* Industrial Background Accent */}
                  <div className={cn("absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-20 pointer-events-none", styles.accent)} />
                  
                  <div className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-colors", styles.bg, styles.border)}>
                        <Icon className={cn("w-6 h-6", styles.text)} />
                      </div>
                      <Dialog.Close asChild>
                        <button className="p-2 rounded-xl border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                          <X className="w-5 h-5" />
                        </button>
                      </Dialog.Close>
                    </div>

                    <Dialog.Title className={cn("text-2xl font-bold uppercase tracking-tight mb-4", styles.text)}>
                      {title}
                    </Dialog.Title>
                    
                    <AnimatePresence mode="wait">
                      {!isLoading ? (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                        >
                          <Dialog.Description className="text-slate-400 text-sm leading-relaxed mb-6 pb-6 border-b border-slate-800/50">
                            {description}
                          </Dialog.Description>

                          {requireVerification && (
                            <div className="mb-8 p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                               <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-3 text-center">
                                 Type <span className="text-white select-none">{requireVerification}</span> to verify authorization
                               </label>
                               <input 
                                 type="text"
                                 autoFocus
                                 value={verificationValue}
                                 onChange={(e) => setVerificationValue(e.target.value)}
                                 className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-center font-mono text-white placeholder:text-slate-600 focus:border-rose-500/50 focus:ring-0 transition-all uppercase"
                                 placeholder="Verification"
                               />
                            </div>
                          )}

                          <div className="flex gap-3">
                            <Dialog.Close asChild>
                              <button className="flex-1 py-3.5 rounded-xl border border-slate-800 text-slate-300 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50">
                                {cancelText}
                              </button>
                            </Dialog.Close>
                            <button
                              onClick={onConfirm}
                              disabled={isLoading || !isVerified}
                              className={cn(
                                "flex-1 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2",
                                styles.button
                              )}
                            >
                              <span>{confirmText}</span>
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="py-12 flex flex-col items-center justify-center"
                        >
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-8 relative">
                            <motion.div 
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                              className={cn("absolute inset-0 w-1/2 h-full rounded-full blur-[2px]", styles.button.split(' ')[0])}
                            />
                            <motion.div 
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 3, ease: "linear" }}
                              className={cn("h-full rounded-full", styles.button.split(' ')[0])}
                            />
                          </div>
                          
                          <div className="flex flex-col items-center gap-3">
                             <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ 
                                      scale: [1, 1.5, 1],
                                      opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{ 
                                      repeat: Infinity, 
                                      duration: 1, 
                                      delay: i * 0.2 
                                    }}
                                    className={cn("w-1.5 h-1.5 rounded-full", styles.text)}
                                  />
                                ))}
                             </div>
                             <span className={cn("text-[10px] font-bold uppercase tracking-[0.3em]", styles.text)}>
                               Processing Genetic Engine
                             </span>
                             <span className="text-slate-500 text-[9px] uppercase tracking-wider animate-pulse">
                               Performing Database Injection...
                             </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
