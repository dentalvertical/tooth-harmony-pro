import { create } from 'zustand';
import uk from './translations/uk';
import en from './translations/en';
import env from '@/config/env';

export type Lang = 'uk' | 'en';

interface I18nStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = { uk, en };

export const useI18n = create<I18nStore>((set, get) => ({
  lang: env.defaultLang,
  setLang: (lang) => set({ lang }),
  t: (key: string) => {
    const { lang } = get();
    return translations[lang][key] || key;
  },
}));
