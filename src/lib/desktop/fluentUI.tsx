import React from 'react';

interface FluentWrapperProps {
  children: React.ReactNode;
  activeWindowMode?: boolean;
}

export const FluentDesignWrapper: React.FC<FluentWrapperProps> = ({ children, activeWindowMode = true }) => {
  return (
    <div className="fluent-container relative min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <style>{`
        .fluent-acrylic {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .fluent-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fluent-card:hover {
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .fluent-button-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          font-weight: 600;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .fluent-button-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4);
        }

        .fluent-button-primary:active {
          transform: translateY(0);
        }
      `}</style>
      {activeWindowMode && (
        <div className="hidden desktop-titlebar h-8 bg-slate-950/80 border-b border-white/10 flex items-center justify-between px-3 select-none text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            <span className="font-semibold text-slate-200">BDR Nexus v17.6 - Industrial CMMS</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span>TAURI_NATIVE_READY</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
