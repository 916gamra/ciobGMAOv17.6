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
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = lng;
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // default language is English as required
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

updateDocumentDir(i18n.language || 'en');

i18n.on('languageChanged', (lng) => {
  updateDocumentDir(lng);
});

export default i18n;
