import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import fr from './locales/fr.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Order: check localStorage first (persisted user choice), then navigator language
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'chatbot-ui-language',
      caches: ['localStorage'],
    },
  })

export default i18n
