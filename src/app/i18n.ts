/**
 * Internationalization (i18n) loader and setup
 *
 * Usage: import and use the init() function when local changes (setup is automatic on import)
 * Then, import and use the native i18next and moment modules.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { flatten, unflatten } from 'flat';
import i18n, { TOptions } from 'i18next';
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

import appConf from '~/framework/util/appConf';

// Read Phrase ID && Secrets
const phraseSecrets = require('ROOT/phrase.json');

export namespace I18n {
  // Transform local translations (in a given language)
  //   - by applying the current override keys
  //   - and removing all overriden keys
  const getOverridenTranslations = (translations: object) => {
    // Get Overriden keys for this override
    const overrideName = (RNConfigReader.BundleVersionOverride as string).replace(/\/test|\/prod/g, '');
    const overridenKeys = Object.keys(translations).filter(key => key.endsWith(`-${overrideName}`));
    // Get all overriden keys
    const overrides = ['leducdenormandie', 'lyceeconnecte', 'monlyceenet', 'neo', 'one', 'openent'];
    const overridesKeys: string[] = [];
    overrides.forEach(override => {
      const keys = Object.keys(translations).filter(key => key.endsWith(`-${override}`));
      if (keys) overridesKeys.push(...keys);
    });
    // Replace current override keys
    const overridenTranslations = translations;
    overridenKeys.forEach(overrideKey => {
      overridenTranslations[overrideKey.replace(`-${overrideName}`, '')] = overridenTranslations[overrideKey];
    });
    // Remove all overrides keys
    overridesKeys.forEach(key => {
      delete overridenTranslations[`${key}`];
    });
    // Return unflatten translations
    return unflatten(overridenTranslations);
  };

  // Determine wether the app is in dev mode or alpha
  const isDevOrAlpha = __DEV__ || (RNConfigReader.BundleVersionType as string).toLowerCase().startsWith('alpha');

  // i18n Keys toggling management (dev && alpha only)
  // Toggle button available in UserHomeScreen (src/framework/modules/user/screens/home/screen.tsx)
  const I18N_SHOW_KEYS_KEY = 'showKeys';
  let showKeys = false;
  export const canShowKeys = isDevOrAlpha;

  // Define fallback locale
  const fallbackLng = 'en';

  // Supported locales
  const supportedLanguages = ['fr', 'en', 'es'] as const;
  export type SupportedLocales = (typeof supportedLanguages)[number];

  // Transform translations for all embeded locales
  const localResources = {
    fr: { translation: getOverridenTranslations(require('ASSETS/i18n/fr.json')) },
    en: { translation: getOverridenTranslations(require('ASSETS/i18n/en.json')) },
    es: { translation: getOverridenTranslations(require('ASSETS/i18n/es.json')) },
  };

  // Phrase stuff
  const phraseId = phraseSecrets?.distributionId;
  const phraseSecret = isDevOrAlpha ? phraseSecrets?.devSecret : phraseSecrets?.prodSecret;

  const phrase = new Phrase(phraseId, phraseSecret, DeviceInfo.getVersion(), 'i18next');

  const backendPhrase = resourcesToBackend((language, _namespace, callback) => {
    phrase
      .requestTranslation(language)
      .then(remoteResources => {
        callback(null, getOverridenTranslations(flatten(remoteResources)));
      })
      .catch(error => {
        callback(error, null);
      });
  });

  const backendFallback = resourcesToBackend(localResources);

  // Get wording based on key (in the correct language)
  // Note: the "returnDetails" option is set to false, as we always want to return a string (not a details object)
  export function get(key: string, options?: TOptions) {
    if (showKeys) return key;
    return i18n.t(key, { ...options, returnDetails: false }) as string;
  }

  // Get wordings array based on given key
  export function getArray(key: string, options?: TOptions) {
    const values = i18n.t(key, { ...options, returnObjects: true });
    if (typeof values === 'string') return [];
    if (!showKeys) return values;
    for (let i = 0; i < (values as string[]).length; i++) values[i] = `${key}.${i}`;
    return values;
  }

  // Get current language
  export function getLanguage() {
    return i18n.language;
  }

  // Set language to device one
  export function setLanguage() {
    const bestAvailableLanguage = RNLocalize.findBestLanguageTag(supportedLanguages) as {
      languageTag: string;
      isRTL: boolean;
    };
    i18n.language = bestAvailableLanguage?.languageTag ?? fallbackLng;
    moment.locale(i18n.language?.split('-')[0]);
    return i18n.language;
  }

  // Toggle i18n Keys (dev && alpha only)
  // Toggle button available in UserHomeScreen (src/framework/modules/user/screens/home/screen.tsx)
  export const toggleShowKeys = async () => {
    if (canShowKeys) {
      showKeys = !showKeys;
      await AsyncStorage.setItem(I18N_SHOW_KEYS_KEY, JSON.stringify(showKeys));
      NativeModules.DevSettings.reload();
    }
  };

  export async function init() {
    // Initalize language
    setLanguage();
    // Initialize keys toggling
    if (canShowKeys) {
      const stored = await AsyncStorage.getItem(I18N_SHOW_KEYS_KEY);
      if (stored) showKeys = JSON.parse(stored);
    }
    // Initialize i18n depending on i18n OTA enabled or not
    if (appConf.i18nOTAEnabled) {
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
    } else {
      await i18n.use(initReactI18next).init({
        compatibilityJSON: 'v3',
        debug: __DEV__,
        fallbackLng,
        interpolation: {
          escapeValue: false,
        },
        lng: i18n.language,
        resources: localResources,
        returnObjects: true,
      });
    }
  }
}
