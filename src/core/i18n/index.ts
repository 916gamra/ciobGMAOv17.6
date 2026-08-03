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

export default i18n;
