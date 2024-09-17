import { Moment } from 'moment';

import { Storage } from '~/framework/util/storage';

import moduleConfig from './module-config';

export interface SplashadsStorageData {
  splashads: Record<string, { date: Moment; url: string }>;
}

export const storage = Storage.slice<SplashadsStorageData>().withModule(moduleConfig);

const SPLASHADS_KEY = 'splashads';

export const readSplashadsData = () => storage.getJSON(SPLASHADS_KEY) ?? {};

export const writeSplashadsData = (name: string, date: Moment, url: string) => {
  const splashads = readSplashadsData();
  splashads[name] = { date, url };
  storage.setJSON(SPLASHADS_KEY, splashads);
};
