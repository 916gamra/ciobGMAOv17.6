export const TITAN_DESIGN = {
  colors: {
    surface: '#050508', // Factory Admin Portal background style
    surfaceLight: '#0f0f12', // Shield Ops background style
    surfaceLightest: '#1a1a1f', // PDR background style
    cyan: '#00d9ff',
    emerald: '#00ff88',
    rose: '#ff0080'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    container: '1.5rem', // 24px as requested for uniform padding
  },
  components: {
    card: 'bg-[#0f0f12] border border-[#1a1a1f] rounded-2xl p-6 shadow-2xl',
    button: 'px-4 py-3 rounded-xl font-mono uppercase tracking-[0.2em] text-[10px] sm:text-xs transition-all duration-300 ease-out active:scale-95 shadow-lg relative overflow-hidden',
    input: 'w-full bg-[#0a0b10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#f8fafc] outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/10 transition-all duration-200 placeholder:text-slate-600 shadow-inner'
  }
};
