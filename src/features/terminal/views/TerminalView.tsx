import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Terminal as TerminalIcon, Shield, Cpu, Activity } from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';

export function TerminalView() {
  const [history, setHistory] = useState<string[]>([
    'CIOB GMAO [Version 17.0.4]',
    '(c) Genesis Edition. All rights reserved.',
    '',
    'System initialization complete.',
    'Local database (Dexie) connected.',
    'Ready for input...',
    ''
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    const newHistory = [...history, `> ${input}`];

    switch (cmd) {
      case 'help':
        newHistory.push('Available commands:', '  help     - Show this help message', '  clear    - Clear terminal history', '  status   - Check system status', '  whoami   - Show current user info', '  version  - Show system version');
        break;
      case 'clear':
        setHistory(['Terminal cleared. Type "help" for commands.']);
        setInput('');
        return;
      case 'status':
        newHistory.push('SYSTEM STATUS: ONLINE', 'CPU LOAD: 12%', 'MEMORY: 452MB / 1024MB', 'DB SYNC: ACTIVE');
        break;
      case 'whoami':
        newHistory.push('USER: System Administrator', 'ROLE: Super User', 'AUTH: Level 10');
        break;
      case 'version':
        newHistory.push('CIOB GMAO v17.0.4 (Genesis Edition)');
        break;
      default:
        newHistory.push(`Command not found: ${cmd}. Type "help" for assistance.`);
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-semibold text-slate-100 tracking-tight mb-2">System Diagnostics</h1>
          <p className="text-slate-400 text-sm">Diagnostic console and system operations.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-3 flex flex-col bg-black/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/10">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <div className="flex-1 text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              admin_console.sh
            </div>
            <TerminalIcon className="w-3 h-3 text-slate-400" />
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 font-mono text-sm text-slate-300/90 space-y-1 selection:bg-blue-500/20"
          >
            {history.map((line, i) => (
              <div key={i} className={line.startsWith('>') ? 'text-white/80' : ''}>
                {line}
              </div>
            ))}
            <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2">
              <span className="text-blue-400 font-bold">{'>'}</span>
              <input 
                autoFocus
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white/90 focus:ring-0 p-0"
              />
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 text-white font-medium">
              <Shield className="w-4 h-4 text-blue-400" />
              Security Status
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Firewall</span>
                <span className="text-emerald-500">ACTIVE</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Encryption</span>
                <span className="text-emerald-500">AES-256</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Intrusion Det.</span>
                <span className="text-emerald-500">MONITORING</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 text-white font-medium">
              <Cpu className="w-4 h-4 text-blue-400" />
              System Load
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '12%' }}
                className="h-full bg-blue-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span>12% LOAD</span>
              <span>100%</span>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 text-white font-medium">
              <Activity className="w-4 h-4 text-blue-400" />
              Real-time Sync
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-8 flex items-end gap-0.5">
                {[...Array(20)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [10, 20, 15, 25, 10][i % 5] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                    className="flex-1 bg-blue-500/30 rounded-t-sm"
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-blue-400">LIVE</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
