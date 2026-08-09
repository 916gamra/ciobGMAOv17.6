import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './ar';
import fr from './fr';
import en from './en';

// Define resources
const resources = {
  ar,
  fr,
  en
};

const updateDocumentDir = (lng: string) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "ar", // default language
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

updateDocumentDir(i18n.language || 'ar');

i18n.on('languageChanged', (lng) => {
  updateDocumentDir(lng);
});

export default i18n;
