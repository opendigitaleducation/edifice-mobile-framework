import i18n from 'i18next';
import moment from 'moment';

import { I18n } from '~/app/i18n';
import { AccountType, AuthActiveAccount } from '~/framework/modules/auth/model';
import { showSplashads } from '~/framework/modules/splashads/screen';
import { Platform } from '~/framework/util/appConf';

import { readSplashadsData, writeSplashadsData } from './storage';

const splahadsLocales = {
  co: I18n.fallbackLng,
  en: 'en',
  es: 'es',
  fr: 'fr',
  it: I18n.fallbackLng,
  default: I18n.fallbackLng,
};

const getSplashadsLocale = () => {
  return splahadsLocales[i18n.language];
};

const timeoutPromise = new Promise((resolve, reject) => {
  setTimeout(() => reject(new global.Error('Request timed out')), 2000);
});

export const checkAndShowSplashAds = async (platform: Platform, userType: AccountType) => {
  const fetchSplashads = async () => {
    const source = `${platform.splashads}/${userType}/${getSplashadsLocale()}`;
    try {
      const response = await Promise.race([timeoutPromise, fetch(source)]);

      if (response && response.status === 200) {
        writeSplashadsData(platform.name, moment().startOf('day'), source);
        showSplashads({ resourceUri: source });
      } else {
        console.error('[Splashads]: Failed to fetch splashads: ', response.status);
      }
    } catch (error) {
      console.error('[Splashads]: Failed to fetch splashads: ', error.message);
    }
  };
  if (platform.splashads) {
    const splashads = readSplashadsData();
    const today = moment().startOf('day');
    const splashadsDay = splashads[platform.name];

    if (!splashadsDay || today.isAfter(moment(splashadsDay.date).clone()) || platform.splashads.includes('test')) fetchSplashads();
  }
};

export const showSplashadsOnUserScreen = (session: AuthActiveAccount) => {
  const splashads = readSplashadsData();
  return session?.platform.name && splashads[session?.platform.name]
    ? moment().startOf('day').toISOString() === splashads[session?.platform.name].date.toString()
    : false;
};
