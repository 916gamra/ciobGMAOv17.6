import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/core/i18n';

export type Language = 'EN' | 'FR' | 'AR';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  cycleLanguage: () => void;
}

const syncI18n = (lang: Language) => {
  const code = lang.toLowerCase();
  i18n.changeLanguage(code);
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'AR' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  }
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'AR',
      setLanguage: (lang) => {
        syncI18n(lang);
        set({ language: lang });
      },
      cycleLanguage: () =>
        set((state) => {
          const sequence: Language[] = ['AR', 'FR', 'EN'];
          const currentIndex = sequence.indexOf(state.language);
          const nextIndex = (currentIndex + 1) % sequence.length;
          const nextLang = sequence[nextIndex];
          syncI18n(nextLang);
          return { language: nextLang };
        }),
    }),
    {
      name: 'titan-language-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          syncI18n(state.language);
        }
      },
    }
  )
);

