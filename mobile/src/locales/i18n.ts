import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import es from './es.json';
import en from './en.json';
import pt from './pt.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
  pt: { translation: pt },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0]?.languageCode ?? 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // react ya hace esto de forma segura
    },
  });

export default i18n;
