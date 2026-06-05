import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from './locales/ar.json';
import fr from './locales/fr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
    },
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'fr'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'bottola-lang',
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export const setLanguage = (lang: 'ar' | 'fr') => {
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('bottola-lang', lang);
};

// Apply on load
const stored = (localStorage.getItem('bottola-lang') as 'ar' | 'fr') || 'ar';
i18n.changeLanguage(stored);
document.documentElement.lang = stored;
document.documentElement.dir = stored === 'ar' ? 'rtl' : 'ltr';

export default i18n;
