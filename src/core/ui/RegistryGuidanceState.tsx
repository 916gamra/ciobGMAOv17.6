import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface GuidanceCardItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface RegistryGuidanceStateProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  isSearchActive?: boolean;
  onClearSearch?: () => void;
  primaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
  guidanceCards?: GuidanceCardItem[];
  themeColor?: 'indigo' | 'cyan' | 'purple' | 'amber' | 'emerald';
}

export const RegistryGuidanceState: React.FC<RegistryGuidanceStateProps> = ({
  id,
  icon: Icon,
  title,
  subtitle,
  isSearchActive,
  onClearSearch,
  primaryAction,
  secondaryAction,
  guidanceCards,
  themeColor = 'indigo'
}) => {
  const getThemeClasses = () => {
    switch (themeColor) {
      case 'cyan':
        return {
          glow: 'bg-cyan-500/15',
          border: 'border-cyan-500/20',
          iconBox: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          cardIconBox: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        };
      case 'purple':
        return {
          glow: 'bg-purple-500/15',
          border: 'border-purple-500/20',
          iconBox: 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          cardIconBox: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        };
      case 'amber':
        return {
          glow: 'bg-amber-500/15',
          border: 'border-amber-500/20',
          iconBox: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          cardIconBox: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      case 'emerald':
        return {
          glow: 'bg-emerald-500/15',
          border: 'border-emerald-500/20',
          iconBox: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          cardIconBox: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'indigo':
      default:
        return {
          glow: 'bg-indigo-500/15',
          border: 'border-indigo-500/20',
          iconBox: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]',
          badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          cardIconBox: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div id={id} className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#08080c]/90 backdrop-blur-2xl p-8 sm:p-12 text-center shadow-2xl transition-all">
      {/* Ambient background glow */}
      <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 ${theme.glow} rounded-full blur-3xl pointer-events-none`} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
        {/* Main Central Semantic Icon */}
        <div className="relative mb-6 group">
          <div className={`w-20 h-20 rounded-3xl ${theme.iconBox} flex items-center justify-center border transition-transform duration-500 group-hover:scale-105`}>
            <Icon className="w-10 h-10 transition-transform duration-500 group-hover:rotate-6" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-lg mb-8">
          {subtitle}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto mb-10">
          {primaryAction && (
            <button
              id={`${id || 'guidance'}-primary-btn`}
              onClick={primaryAction.onClick}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-200 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4 text-slate-950 stroke-[2.5]" />}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {isSearchActive && onClearSearch ? (
            <button
              id={`${id || 'guidance'}-clear-search-btn`}
              onClick={onClearSearch}
              className="w-full sm:w-auto px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>إعادة ضبط البحث والتصفية</span>
            </button>
          ) : secondaryAction ? (
            <button
              id={`${id || 'guidance'}-secondary-btn`}
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 text-slate-400" />}
              <span>{secondaryAction.label}</span>
            </button>
          ) : null}
        </div>

        {/* Guidance Cards Grid */}
        {guidanceCards && guidanceCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-start">
            {guidanceCards.map((card, idx) => {
              const CardIcon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex items-start gap-3.5 group/card"
                >
                  <div className={`p-2.5 rounded-xl ${theme.cardIconBox} shrink-0 mt-0.5 border`}>
                    <CardIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1 group-hover/card:text-slate-100 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
