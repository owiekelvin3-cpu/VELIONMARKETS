import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { BRAND } from "@/constants/brand";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import ar from "./locales/ar.json";
import zh from "./locales/zh.json";

export const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "ar", "zh"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "velion-locale";

function applyDocumentLanguage(lng: string) {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      ar: { translation: ar },
      zh: { translation: zh },
    },
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    returnNull: false,
    returnEmptyString: false,
    interpolation: {
      escapeValue: false,
      defaultVariables: {
        brandName: BRAND.name,
        shortName: BRAND.shortName,
      },
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
      convertDetectedLanguage: (lng) => lng.split("-")[0],
    },
    react: {
      useSuspense: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  const normalized = (lng || "en").split("-")[0];
  localStorage.setItem(STORAGE_KEY, normalized);
  applyDocumentLanguage(normalized);
});

applyDocumentLanguage((i18n.language || "en").split("-")[0]);

export default i18n;
