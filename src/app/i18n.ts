/**
 * Internationalization (i18n) loader and setup
 *
 * Usage: import and use the init() function when local changes (setup is automatic on import)
 * Then, import and use the native i18next and moment modules.
 */
import { flatten, unflatten } from 'flat';
import i18n, { TOptions } from 'i18next';
import ChainedBackend from 'i18next-chained-backend';
import resourcesToBackend from 'i18next-resources-to-backend';
import moment from 'moment';
import 'moment/locale/es';
import 'moment/locale/fr';
import 'moment/locale/it';
import { initReactI18next } from 'react-i18next';
import DeviceInfo from 'react-native-device-info';
import * as RNLocalize from 'react-native-localize';
import Phrase from 'react-native-phrase-sdk';
import RNRestart from 'react-native-restart';

import appConf from '~/framework/util/appConf';
import { isEmpty } from '~/framework/util/object';
import { OldStorageFunctions } from '~/framework/util/storage';
import { getOverrideName } from '~/framework/util/string';

// Read Phrase ID && Secrets
const phraseSecrets = require('ROOT/phrase.json');

export namespace I18n {
  // Transform local translations (in a given language)
  //   - by applying the current override keys
  //   - and removing all overriden keys
  const getOverridenTranslations = (translations: object): object => {
    // Get Overriden keys for this override
    const overrideName = getOverrideName();
    const overridenKeys = Object.keys(translations).filter(key => key.endsWith(`-${overrideName}`));
    // Get all overriden keys
    const overrides = ['leducdenormandie', 'lyceeconnecte', 'monlyceenet', 'neo', 'one', 'openent', 'ent77'];
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

  // i18n Keys toggling management (dev && alpha only)
  // Toggle button available in UserHomeScreen (src/framework/modules/user/screens/home/screen.tsx)
  const I18N_SHOW_KEYS_KEY = 'showKeys';
  let showKeys = false;
  export const canShowKeys = appConf.isDebugEnabled;

  const I18N_APP_LANG = 'appLang';

  // Define fallback locale
  const fallbackLng = 'en';

  // Supported locales
  const supportedLanguages = ['co', 'en', 'es', 'fr', 'it'] as const;
  export type SupportedLocales = (typeof supportedLanguages)[number];

  // Transform translations for all embeded locales
  const localResources = {
    co: { translation: getOverridenTranslations(require('ASSETS/i18n/co.json')) },
    en: { translation: getOverridenTranslations(require('ASSETS/i18n/en.json')) },
    es: { translation: getOverridenTranslations(require('ASSETS/i18n/es.json')) },
    fr: { translation: getOverridenTranslations(require('ASSETS/i18n/fr.json')) },
    it: { translation: getOverridenTranslations(require('ASSETS/i18n/it.json')) },
  };

  const momentLocales = {
    co: 'fr',
    en: 'en',
    es: 'es',
    fr: 'fr',
    it: 'it',
    default: fallbackLng,
  };

  const splahadsLocales = {
    co: fallbackLng,
    en: 'en',
    es: 'es',
    fr: 'fr',
    it: fallbackLng,
    default: fallbackLng,
  };

  export const getSplashadsLocale = () => {
    return splahadsLocales[i18n.language];
  };

  // Phrase stuff
  const phraseId = phraseSecrets?.distributionId;
  const phraseSecret = appConf.isDevOrAlpha ? phraseSecrets?.devSecret : phraseSecrets?.prodSecret;

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
  export function getArray(key: string, options?: TOptions): string[] {
    const values = i18n.t(key, { ...options, returnObjects: true });
    if (typeof values === 'string') return [];
    if (!showKeys) return values as string[];
    for (let i = 0; i < (values as string[]).length; i++) values[i] = `${key}.${i}`;
    return values as string[];
  }

  // Get current language
  export function getLanguage() {
    return i18n.language;
  }

  // Set language to device one
  export async function setLanguage() {
    const bestAvailableLanguage = RNLocalize.findBestLanguageTag(supportedLanguages) as {
      languageTag: string;
      isRTL: boolean;
    };
    const lang = await OldStorageFunctions.getItemJson(I18N_APP_LANG);
    if (isEmpty(lang)) {
      const newLang = bestAvailableLanguage?.languageTag ?? fallbackLng;
      i18n.language = newLang;
    } else {
      i18n.language = (lang as string) ?? fallbackLng;
    }
    moment.locale(momentLocales[i18n.language?.split('-')[0]] ?? momentLocales.default);
    return i18n.language;
  }

  export const changeLanguage = async (lang: SupportedLocales | 'auto') => {
    if (showKeys) await OldStorageFunctions.setItemJson(I18N_SHOW_KEYS_KEY, false);
    if (lang === 'auto') await OldStorageFunctions.removeItem(I18N_APP_LANG);
    else await OldStorageFunctions.setItemJson(I18N_APP_LANG, lang);
    RNRestart.restart();
  };

  // Toggle i18n Keys (dev && alpha only)
  // Toggle button available in UserHomeScreen (src/framework/modules/user/screens/home/screen.tsx)
  export const toggleShowKeys = async () => {
    if (canShowKeys) {
      showKeys = !showKeys;
      await OldStorageFunctions.setItemJson(I18N_SHOW_KEYS_KEY, showKeys);
      RNRestart.restart();
    }
  };

  // Langues names in their respective language
  export const supportedLanguagesDisplayNames: Record<string, string> = {};
  // Get langues names in their respectivelanguage
  const computeLangDisplayNames = () => {
    Object.assign(
      supportedLanguagesDisplayNames,
      Object.fromEntries(
        Object.entries({
          co: 'user-lang-dropdownvalue-co',
          en: 'user-lang-dropdownvalue-en',
          es: 'user-lang-dropdownvalue-es',
          fr: 'user-lang-dropdownvalue-fr',
          it: 'user-lang-dropdownvalue-it',
        }).map(([lng, i18nKey]) => [lng, get(i18nKey, { lng, fallbackLng })]),
      ),
    );
  };

  export async function init() {
    // Initialize keys toggling
    if (canShowKeys) {
      const stored: boolean | null | undefined = await OldStorageFunctions.getItemJson(I18N_SHOW_KEYS_KEY);
      if (stored) showKeys = stored;
    }
    // Initalize language
    await setLanguage();
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
    computeLangDisplayNames();
  }
}
