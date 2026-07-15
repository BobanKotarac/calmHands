import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const LANGUAGE_KEY = '@calmhands_lang';

export const defaultNS = 'translation';
export const resources = {
  sr: { translation: require('./locales/sr.json') },
  en: { translation: require('./locales/en.json') },
} as const;

export type SupportedLocale = 'sr' | 'en';

export async function getStoredLanguage(): Promise<SupportedLocale | null> {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (lang === 'sr' || lang === 'en') return lang;
    return null;
  } catch {
    return null;
  }
}

export async function setStoredLanguage(locale: SupportedLocale): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, locale);
}

function getDeviceLocale(): SupportedLocale {
  const tag = Localization.getLocales()[0]?.languageTag ?? 'en';
  if (tag.startsWith('sr') || tag.startsWith('sh') || tag.startsWith('bs')) return 'sr';
  return 'en';
}

export async function initI18n(): Promise<void> {
  const stored = await getStoredLanguage();
  const device = getDeviceLocale();
  const lng = stored ?? device;

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    defaultNS,
    interpolation: { escapeValue: false },
  });
}

export function changeAppLanguage(locale: SupportedLocale): void {
  i18n.changeLanguage(locale);
  setStoredLanguage(locale);
}

export default i18n;
