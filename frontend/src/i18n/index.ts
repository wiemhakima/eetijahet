import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ar from './locales/ar.json';

const LANGUAGE_KEY = 'etijahat_language';

const applyDirection = (lng: string) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir  = dir;
  document.documentElement.lang = lng;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: localStorage.getItem(LANGUAGE_KEY) || 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    // Synchronous init — i18n is ready before first render
    initImmediate: false,
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      // Disabled to prevent blank page when no <Suspense> boundary is present
      useSuspense: false,
    },
  });

// Persist language; apply RTL for Arabic, LTR for everything else
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng);
  applyDirection(lng);
});

// Apply direction on initial load
applyDirection(i18n.language);

export default i18n;
