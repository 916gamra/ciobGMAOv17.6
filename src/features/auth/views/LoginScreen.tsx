import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { ArrowRight, ChevronLeft, ShieldCheck, Fingerprint, TestTubeDiagonal } from 'lucide-react';
import { cn } from '@/shared/utils';
import { toast } from 'sonner';
import { User } from '@/core/db';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useAuditTrail } from '@/features/system/hooks/useAuditTrail';
import { useNotificationsContext } from '@/shared/context/NotificationContext';
import { SystemBackground } from '@/shared/components/SystemBackground';
import { useActiveUsers } from '../hooks/useAuthSlots';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.15, delayChildren: 0.1 } 
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
};

export function LoginScreen() {
  const users = useActiveUsers();
  const { login, loginSandbox } = useAuthStore();
  const { logEvent } = useAuditTrail();
  const { addNotification } = useNotificationsContext();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [time, setTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isSandboxMode, setIsSandboxMode] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('BDR_NEXUS_SANDBOX_MODE') === 'true' : false;
  });

  const handleToggleSandbox = (val: boolean) => {
    setIsSandboxMode(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('BDR_NEXUS_SANDBOX_MODE', val ? 'true' : 'false');
      window.location.reload(); // Force full reload to reset Dexie database proxy
    }
  };

  const handleSandboxLogin = async (id: string, name: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const success = await loginSandbox(id);
    if (success) {
      toast.success(`Sandbox Identity Assumed: ${name}`);
      addNotification({
        type: 'warning',
        title: 'Simulation Core Engaged',
        message: `Sandbox profile loaded for ${name}`,
        source: 'Factory Engine',
        portal: 'SYSTEM'
      });
    } else {
      toast.error('Sandbox login failed.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (selectedUser && pin.length > 0) {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        const isMatch = await login(selectedUser.id!, pin);

        if (isMatch) {
          await logEvent({
            userId: selectedUser.id!,
            userName: selectedUser.name,
            action: 'LOGIN',
            entityType: 'SESSION',
            entityId: selectedUser.id!.toString(),
            details: `Secure PIN authentication successful for session origin.`,
            severity: 'INFO'
          });
          
          addNotification({
            type: 'info',
            title: 'Identity Verified',
            message: `Neural link established for ${selectedUser.name}.`,
            source: 'Security Core',
            portal: 'SYSTEM'
          });

          toast.success(`Welcome back, ${selectedUser.name}!`, {
            description: 'System credentials verified. Establishing neural link...',
          });
        } else {
          await logEvent({
            userId: selectedUser.id!,
            userName: selectedUser.name,
            action: 'LOGIN_FAILURE',
            entityType: 'SESSION',
            entityId: selectedUser.id!.toString(),
            details: `Failed login attempt with incorrect credentials.`,
            severity: 'WARNING'
          });

          addNotification({
            type: 'warning',
            title: 'Intrusion Alert',
            message: `Unauthorized access attempt detected for identity: ${selectedUser.name}.`,
            source: 'Security Shield',
            portal: 'SYSTEM'
          });

          setError('AUTH_ERROR: Invalid credentials.');
          toast.error('Authentication Failed');
          setPin('');
          setTimeout(() => setError(''), 3000);
        }
      } catch (err) {
        addNotification({
          type: 'critical',
          title: 'System Breach',
          message: 'Internal verification failure detected in Security Core.',
          source: 'System Guard',
          portal: 'SYSTEM'
        });
        setError('SYS_ERROR: Internal verification failure.');
        toast.error('System Error');
      } finally {
        setIsLoading(false);
      }
    } else if (!selectedUser && pin === '0000') {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = await login(null, pin);
      if (success) {
        await logEvent({
          userId: 'ROOT',
          userName: 'System Root',
          action: 'LOGIN',
          entityType: 'SESSION',
          entityId: 'BACKDOOR',
          details: `Master root access granted.`,
          severity: 'CRITICAL'
        });

        addNotification({
          type: 'critical',
          title: 'Root Override',
          message: 'Master owner access protocols activated.',
          source: 'Titanic Kernel',
          portal: 'SYSTEM'
        });

        toast.success('Root Authenticated');
      } else {
        toast.error('Invalid Root Code');
      }
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] flex flex-col items-center justify-center selection:bg-slate-500/30 font-sans">
      <SystemBackground />
      
      {/* Decorative framing for Titanic OS */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />

      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center">
        
        {/* Central Hub Clock */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: selectedUser ? -40 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center mb-16 pointer-events-none"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="flex gap-1.5">
               <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
               <div className="w-1.5 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)] mt-1" />
            </div>
            <h2 className="md:text-xl font-mono tracking-[0.4em] font-bold uppercase flex items-center gap-2">
               <span className="text-white">TITANIC</span>
               <span className="text-blue-500">OS</span>
            </h2>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white drop-shadow-md">
            {formatTime(time)}
          </h1>
          <p className="text-sm text-slate-400 mt-4 font-mono tracking-widest uppercase">{formatDate(time)}</p>
        </motion.div>

        {!selectedUser && (
          <div className="flex flex-col items-center mb-10 relative z-10 w-full max-w-sm">
             <div className="flex items-center justify-between w-full bg-[#0a0a0f]/40 border border-white/5 rounded-full p-1.5 backdrop-blur-md shadow-2xl">
               <span className={cn("text-[10px] sm:text-xs font-black tracking-widest uppercase transition-colors duration-300 w-1/3 text-center", !isSandboxMode ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" : "text-white/30")}>Production</span>
               <button
                 onClick={() => handleToggleSandbox(!isSandboxMode)}
                 className={cn(
                   "relative w-16 h-8 rounded-full transition-colors duration-300 shadow-inner flex items-center px-1 shrink-0",
                   isSandboxMode ? "bg-purple-900 border border-purple-500/50" : "bg-cyan-900 border border-cyan-500/50"
                 )}
               >
                  <div 
                    className={cn(
                      "w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-[0_0_15px_rgba(255,255,255,0.9)]", 
                      isSandboxMode ? "translate-x-8" : "translate-x-0"
                    )} 
                  />
               </button>
               <span className={cn("text-[10px] sm:text-xs font-black tracking-widest uppercase transition-colors duration-300 flex items-center justify-center gap-1.5 w-1/3 text-center", isSandboxMode ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "text-white/30")}>
                 <TestTubeDiagonal className="hidden sm:block w-3 h-3" />
                 Sandbox
               </span>
             </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isSandboxMode && !selectedUser ? (
            <motion.div 
              key="sandbox-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-col items-center w-full max-w-2xl gap-4 relative z-10"
            >
              <div className="text-center mb-4">
                <h3 className="text-purple-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                  Quick-Select Virtual Identity Panel
                </h3>
                <p className="text-white/40 text-[10px] mt-2 max-w-sm mx-auto uppercase">One-click login to hardcoded, fully populated simulation states. No password required.</p>
              </div>
              
              <div className="flex justify-center w-full px-4">
                {[
                  { id: 'SYSTEM-ADMIN-SANDBOX', name: 'System Admin Sandbox', color: 'bg-purple-600', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', role: 'Super Sandbox Root (v17.5)' }
                ].map(ident => (
                  <motion.button
                    key={ident.id}
                    variants={itemVariants}
                    onClick={() => handleSandboxLogin(ident.id, ident.name)}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center text-left gap-4 p-4 w-full max-w-sm rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={cn("w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg", ident.color)}>
                      {ident.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold flex items-center text-sm group-hover:text-purple-300 transition-colors">{ident.name}</h4>
                      <p className="text-[10px] text-white/50 truncate block mt-0.5 uppercase tracking-wide">{ident.role}</p>
                    </div>
                    <div className={cn("px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest rounded-full border hidden md:block", ident.badge)}>
                      {ident.id}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : !isSandboxMode && !selectedUser ? (
            <motion.div 
              key="user-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-col items-center w-full max-w-2xl gap-4 relative z-10"
            >
              <div className="text-center mb-4">
                <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                  Factory Production Identities
                </h3>
                <p className="text-white/40 text-[10px] mt-2 max-w-sm mx-auto uppercase">Select an authorized profile to enter the live factory environment.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {users?.filter(u => u.id !== 'SYSTEM-ADMIN-SANDBOX').map((user) => (
                  <motion.button
                    key={user.id}
                    variants={itemVariants}
                    onClick={() => setSelectedUser(user)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center text-left gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md group relative overflow-hidden min-h-[80px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={cn("w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg", user.color)}>
                      {user.initials || user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold flex items-center text-sm group-hover:text-cyan-300 transition-colors">{user.name}</h4>
                      <p className="text-[10px] text-white/50 truncate block mt-0.5 uppercase tracking-wide">{user.role}</p>
                    </div>
                    <div className="px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest rounded-full border hidden md:block bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                      {user.id}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
          <motion.div 
            key="login-form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="w-full max-w-md relative flex flex-col items-center mx-auto"
          >
            <div className="flex flex-col items-center relative z-10 w-full max-w-sm mx-auto">
              
              <motion.div 
                variants={itemVariants}
                className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center text-3xl font-semibold text-white shadow-2xl ${selectedUser.color} bg-opacity-20 border-2 border-white/20 backdrop-blur-xl relative z-10 overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                <span className="drop-shadow-sm">{selectedUser.initials}</span>
              </motion.div>
              
              <motion.h2 variants={itemVariants} className="text-2xl font-medium text-white tracking-tight mb-2 relative z-10 text-center drop-shadow-md">{selectedUser.name}</motion.h2>
              
              <motion.div variants={itemVariants} className="mb-6 relative z-10 text-center">
                {selectedUser.id === 'SYSTEM-ADMIN-SANDBOX' ? (
                  <span className="inline-block text-[10px] font-bold text-purple-400 bg-purple-950/40 border border-purple-800/40 px-3 py-1 rounded-full uppercase tracking-widest">
                    SANDBOX PIN: 7777 (المحاكي)
                  </span>
                ) : selectedUser.id === 'SY-ADMIN' ? (
                  <span className="inline-block text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-3 py-1 rounded-full uppercase tracking-widest">
                    ROOT PIN: 0000
                  </span>
                ) : (
                  <span className="inline-block text-[10px] font-bold text-slate-400 bg-[#0a0a0f] border border-slate-800 px-3 py-1 rounded-full uppercase tracking-widest">
                    OPERATOR PIN: 1234
                  </span>
                )}
              </motion.div>

              <form onSubmit={handleLogin} className="w-full relative z-10 flex flex-col items-center">
                <motion.div variants={itemVariants} className="relative flex items-center w-56 group mb-4">
                  <motion.input
                    type="password"
                    autoFocus
                    placeholder="Enter PIN"
                    value={pin}
                    animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
                    onChange={(e) => setPin(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "w-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.15] border rounded-full px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 transition-all font-sans text-center md:text-left text-sm backdrop-blur-2xl shadow-xl",
                      error ? "border-red-500/50 ring-red-500/20" : "border-white/20 focus:border-white/40 focus:ring-white/20"
                    )}
                  />
                  <AnimatePresence>
                    {pin.length > 0 && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-2 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all flex items-center justify-center border border-white/10"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-white/80 font-medium text-xs text-center drop-shadow-md bg-[#0a0a0f]/20 backdrop-blur-md px-4 py-1.5 rounded-full"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                
                <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center">
                  <button 
                    type="button" 
                    onClick={() => { setSelectedUser(null); setPin(''); setError(''); }}
                    className="flex flex-col items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md transition-colors shadow-sm">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                    Switch Identity
                  </button>
                </motion.div>
              </form>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
