import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Component, Database, Sparkles, Layers, Layers3 } from 'lucide-react';
import { ComponentCatalogView } from '@/features/pdr-engine/views/ComponentCatalogView';
import { ComponentsCatalogView } from '@/features/corrective/views/ComponentsCatalogView';
import { PartsCatalogLabView } from '@/features/organization/views/PartsCatalogLabView';
import { cn } from '@/shared/utils';

interface MasterPartsCatalogHubProps {
  defaultTab?: 'pdr' | 'components' | 'spec-lab';
  tabId?: string;
  user?: any;
  onLogout?: () => void;
}

export function MasterPartsCatalogHub({ defaultTab = 'pdr', tabId }: MasterPartsCatalogHubProps) {
  // Infer active tab from tabId if provided, or fallback to defaultTab
  const initialTab = (() => {
    if (tabId === 'components-catalog' || tabId === 'master-components-catalog') return 'components';
    if (tabId === 'part-master' || tabId === 'spec-lab') return 'spec-lab';
    if (tabId === 'component-catalog' || tabId === 'master-pdr-catalog') return 'pdr';
    return defaultTab;
  })();

  const [activeTab, setActiveTab] = useState<'pdr' | 'components' | 'spec-lab'>(initialTab);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0f] text-slate-200 overflow-hidden">
      {/* Unified Master Header Toolbar */}
      <div className="shrink-0 bg-black/60 border-b border-white/10 px-6 py-3 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-400">
            <Layers3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">الكتالوج الشامل للقطع والمكونات</h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Master Parts & Components Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              كتالوج بصمات قطع الغيار (PDR Blueprints) والأنظمة المجمعة (Machine Assemblies) ومختبر الترقيم
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('pdr')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'pdr'
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Package className="w-3.5 h-3.5" />
            <span>قطع الغيار والجرائم (PDR Parts)</span>
          </button>

          <button
            onClick={() => setActiveTab('components')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'components'
                ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Component className="w-3.5 h-3.5" />
            <span>المكونات والأنظمة (Machine Assemblies)</span>
          </button>

          <button
            onClick={() => setActiveTab('spec-lab')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'spec-lab'
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Database className="w-3.5 h-3.5" />
            <span>مختبر الترقيم (Spec Matrix Lab)</span>
          </button>
        </div>
      </div>

      {/* Main Tab View Canvas */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'pdr' && <ComponentCatalogView />}
        {activeTab === 'components' && <ComponentsCatalogView />}
        {activeTab === 'spec-lab' && <PartsCatalogLabView />}
      </div>
    </div>
  );
}
