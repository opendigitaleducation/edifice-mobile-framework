/**
 * Internationalization (i18n) loader and setup
 *
 * Usage: import and use the init() function when local changes (setup is automatic on import)
 * Then, import and use the native i18next and moment modules.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unflatten } from 'flat';
import i18n from 'i18next';
import ChainedBackend from 'i18next-chained-backend';
import resourcesToBackend from 'i18next-resources-to-backend';
import moment from 'moment';
import 'moment/locale/es';
import 'moment/locale/fr';
import { initReactI18next } from 'react-i18next';
import { NativeModules } from 'react-native';
import RNConfigReader from 'react-native-config-reader';
import DeviceInfo from 'react-native-device-info';
import * as RNLocalize from 'react-native-localize';
import Phrase from 'react-native-phrase-sdk';

// Read Phrase ID && Secrets
const phraseSecrets = require('ROOT/phrase.json');

export namespace I18n {
  // Local translations
  const builtInTranslations = unflatten({
    fr: require('ASSETS/i18n/fr.json'),
    en: require('ASSETS/i18n/en.json'),
    es: require('ASSETS/i18n/es.json'),
  }) as { [locale in SupportedLocales]: object };

  // Transform local translations (in a given language) by applying the override keys
  const getOverridenTranslations = (language: SupportedLocales) => {
    const translations = builtInTranslations[language];
    const overrideName = (RNConfigReader.BundleVersionOverride as string).replace(/\/test|\/prod/g, '');
    const overrideKeys = Object.keys(translations).filter(key => key.endsWith(`-${overrideName}`));
    const overridenTranslations = translations;
    overrideKeys.forEach(overrideKey => {
      overridenTranslations[overrideKey.replace(`-${overrideName}`, '')] = overridenTranslations[overrideKey];
    });
    return overridenTranslations;
  };

  // New local translations with overriden wordings
  const overridenTranslations = {
    fr: getOverridenTranslations('fr'),
    en: getOverridenTranslations('en'),
    es: getOverridenTranslations('es'),
  };

  // Final translations
  const localResources = {
    fr: { translation: overridenTranslations.fr },
    en: { translation: overridenTranslations.en },
    es: { translation: overridenTranslations.es },
  };

  // App language management
  const fallbackLng = 'en';

  // Keys toggling management
  const I18N_SHOW_KEYS_KEY = 'showKeys';
  let showKeys = false;

  export const canShowKeys = __DEV__ || (RNConfigReader.BundleVersionType as string).toLowerCase().startsWith('alpha');

  // Phrase stuff
  const phraseId = phraseSecrets?.distributionId;
  const phraseSecret = __DEV__ ? phraseSecrets?.devSecret : phraseSecrets?.prodSecret;

  const phrase = new Phrase(phraseId, phraseSecret, DeviceInfo.getVersion(), 'i18next');

  const backendPhrase = resourcesToBackend((language, _namespace, callback) => {
    phrase
      .requestTranslation(language)
      .then(remoteResources => {
        callback(null, remoteResources);
      })
      .catch(error => {
        callback(error, null);
      });
  });

  const backendFallback = resourcesToBackend(localResources);

  // Supported locales
  export type SupportedLocales = 'fr' | 'en' | 'es';

  // Get wording based on key (in the correct language)
  // Note: the "returnDetails" option is set to false, as we always want to return a string (not a details object)
  export function get(key: string, options?: Parameters<typeof i18n.t>[1]) {
    if (showKeys) return key;
    return i18n.t(key, { ...options, returnDetails: false }) as string;
  }

  // Get wordings array based on given key
  export function getArray(key: string, options?: Parameters<typeof i18n.t>[1]) {
    const values = i18n.t(key, { ...options, returnObjects: true });
    if (typeof values === 'string') return [];
    if (!showKeys) return values;
    for (let i = 0; i < (values as string[]).length; i++) values[i] = `${key}.${i}`;
    return values;
  }

  export function getLanguage() {
    return i18n.language;
  }

  export function updateLanguage() {
    const bestAvailableLanguage = RNLocalize.findBestLanguageTag(Object.keys(overridenTranslations)) as {
      languageTag: string;
      isRTL: boolean;
    };
    i18n.language = bestAvailableLanguage?.languageTag ?? fallbackLng;
    moment.locale(i18n.language?.split('-')[0]);
    return i18n.language;
  }

  export const toggleShowKeys = async () => {
    if (canShowKeys) {
      showKeys = !showKeys;
      await AsyncStorage.setItem(I18N_SHOW_KEYS_KEY, JSON.stringify(showKeys));
      NativeModules.DevSettings.reload();
    }
  };

  export async function init() {
    // Initalize language
    updateLanguage();
    // Initialize keys toggling
    if (canShowKeys) {
      const stored = await AsyncStorage.getItem(I18N_SHOW_KEYS_KEY);
      if (stored) showKeys = JSON.parse(stored);
    }
    // Initialize i18next
    await i18n
      .use(ChainedBackend)
      .use(initReactI18next)
      .init({
        backend: {
          backends: [backendPhrase, backendFallback],
        },
        compatibilityJSON: 'v3',
        debug: __DEV__,
        fallbackLng,
        interpolation: {
          escapeValue: false,
        },
        lng: i18n.language,
        returnObjects: true,
      });
  }
}
