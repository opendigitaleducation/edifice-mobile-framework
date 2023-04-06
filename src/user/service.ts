import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AppLink from 'react-native-app-link';
import DeviceInfo from 'react-native-device-info';

import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { Connection } from '~/infra/Connection';
import { fetchJSONWithCache, signedFetch } from '~/infra/fetchWithCache';
import { uniqueId } from '~/infra/oauth';

export interface IEntcoreParentChildrenByStructure {
  children: {
    classesNames: string[];
    displayName: string;
    externalId: string;
    id: string;
  }[];
  structureName: string;
}

export type IEntcoreParentChildrenByStructureList = IEntcoreParentChildrenByStructure[];

export interface IEntcoreEmailValidationInfos {
  displayName: string; // User display name
  email: string; // Current email address of the user (possibly not verified)
  emailState: IEntcoreEmailValidationState | null; // State of the current email address
  firstName: string; // User first name
  lastName: string; // User last name
  waitInSeconds: number; // Suggested time to wait for the validation email to be sent (platform configuration)
}

export interface IEntcoreEmailValidationState {
  pending?: string; // (optional) Current pending (or outdated) email address being checked
  state: 'unchecked' | 'outdated' | 'pending' | 'valid'; // Validation state
  tries?: number; // (optional) Remaining number of times a validation code can be typed in
  ttl?: number; // (optional) Seconds remaining for the user to type in the correct validation code
  valid: string; // Last known valid email address (or empty string)
}

export interface IEntcoreMobileValidationInfos {
  displayName: string; // User display name
  firstName: string; // User first name
  lastName: string; // User last name
  mobile: string; // Current mobile of the user (possibly not verified)
  mobileState?: IEntcoreMobileValidationState | null; // State of the current mobile
  waitInSeconds: number; // Estimated number of seconds before code reaches cellphone
}

export interface IEntcoreMobileValidationState {
  pending?: string; // (optional) Current pending (or outdated) mobile being checked
  state: 'outdated' | 'pending' | 'valid'; // Validation state
  tries?: number; // (optional) Number of remaining retries before code becomes outdated
  ttl?: number; // (optional) Number of seconds remaining before expiration of the code
  valid: string; // (optional) Last known valid mobile (or empty string)
}

export interface IEntcoreMFAValidationInfos {
  state: IEntcoreMFAValidationState; // State of the current MFA code
  type: 'sms' | 'email'; // MFA validation type
  waitInSeconds: number; // Estimated number of seconds before code reaches cellphone or mailbox
}

export interface IEntcoreMFAValidationState {
  state: 'outdated | pending | valid'; // Validation state
  tries: number; // Number of remaining retries before code becomes outdated
  ttl: number; // Number of seconds remaining before expiration of the code
}

export type Languages = 'fr' | 'en' | 'es';

//https://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
function _compareVersion(version1: string, version2: string) {
  if (version1 === version2) {
    return 0;
  }
  const a_components = version1.split('.');
  const b_components = version2.split('.');
  const len = Math.min(a_components.length, b_components.length);
  // loop while the components are equal
  for (let i = 0; i < len; i++) {
    // version1 bigger than version2
    if (parseInt(a_components[i]) > parseInt(b_components[i])) {
      return 1;
    }
    // version2 bigger than version1
    if (parseInt(a_components[i]) < parseInt(b_components[i])) {
      return -1;
    }
  }
  // If one's prefix the other, the longer one is greater.
  if (a_components.length > b_components.length) {
    return 1;
  }
  if (a_components.length < b_components.length) {
    return -1;
  }
  // Otherwise they are the same.
  return 0;
}

export interface IUserAuthContext {
  callBack?: string;
  cgu: boolean;
  passwordRegex: RegExp;
  passwordRegexI18n: { [lang: string]: string };
  mandatory?: {
    mail?: boolean;
    phone?: boolean;
  };
}

class UserService {
  static FCM_TOKEN_TODELETE_KEY = 'users.fcmtokens.todelete';

  lastRegisteredToken: string = '';

  pendingRegistration: 'initial' | 'delayed' | 'registered' = 'initial';

  constructor() {
    Connection.onEachNetworkBack(async () => {
      if (this.pendingRegistration == 'delayed') {
        await this.registerFCMToken();
      }
      this._cleanQueue();
    });
  }

  private async _cleanQueue() {
    const tokens = await this._getTokenToDeleteQueue();
    tokens.forEach(token => {
      this.unregisterFCMToken(token);
    });
  }

  private async _getTokenToDeleteQueue(): Promise<string[]> {
    try {
      const tokensCached = await AsyncStorage.getItem(UserService.FCM_TOKEN_TODELETE_KEY);
      const tokens: string[] = JSON.parse(tokensCached);
      if (tokens instanceof Array) {
        return tokens;
      } else {
        //console.debug("not an array?", tokens)
      }
    } catch (e) {
      // TODO: Manage error
    }
    return [];
  }

  private async _addTokenToDeleteQueue(token: string) {
    if (!token) {
      return;
    }
    //merge is not supported by all implementation
    const tokens = await this._getTokenToDeleteQueue();
    tokens.push(token);
    //keep uniq tokens
    const json = JSON.stringify(Array.from(new Set(tokens)));
    await AsyncStorage.setItem(UserService.FCM_TOKEN_TODELETE_KEY, json);
  }

  private async _removeTokenFromDeleteQueue(token: string) {
    if (!token) {
      return;
    }
    //merge is not supported by all implementation
    let tokens = await this._getTokenToDeleteQueue();
    tokens = tokens.filter(t => t != token);
    const json = JSON.stringify(tokens);
    await AsyncStorage.setItem(UserService.FCM_TOKEN_TODELETE_KEY, json);
  }

  async unregisterFCMToken(token: string | null = null) {
    try {
      if (!token) {
        token = await messaging().getToken();
      }
      const deleteTokenResponse = await signedFetch(
        `${DEPRECATED_getCurrentPlatform()!.url}/timeline/pushNotif/fcmToken?fcmToken=${token}`,
        { method: 'delete' },
      );
      this._removeTokenFromDeleteQueue(token);
    } catch (err) {
      //unregistering fcm token should not crash the login process
      if (Connection.isOnline) {
        //console.debug(err);
      } else {
        //when no connection => get it from property
        const tokenTOUnregister = token || this.lastRegisteredToken;
        this._addTokenToDeleteQueue(tokenTOUnregister);
      }
    }
  }

  async registerFCMToken(token: string | null = null) {
    try {
      this.pendingRegistration = 'initial';
      if (!token) {
        token = await messaging().getToken();
      }
      this.lastRegisteredToken = token;
      const putTokenResponse = await signedFetch(
        `${DEPRECATED_getCurrentPlatform()!.url}/timeline/pushNotif/fcmToken?fcmToken=${token}`,
        {
          method: 'put',
        },
      );
      this.pendingRegistration = 'registered';
      //try to unregister queue
      this._cleanQueue(); //clean queue on login
      //
    } catch (err) {
      //registering fcm token should not crash the login process
      if (Connection.isOnline) {
        //console.debug(err);
      } else {
        this.pendingRegistration = 'delayed';
      }
    }
  }

  async checkVersion(): Promise<{ canContinue: boolean; hasNewVersion: boolean; newVersion: string }> {
    try {
      if (!DEPRECATED_getCurrentPlatform()) throw new Error('must specify a platform');
      const url = `${DEPRECATED_getCurrentPlatform()!.url}/assets/mobileapp.json`;
      const res = await fetch(url, {
        headers: {
          'X-Device-Id': uniqueId(),
        },
      });
      if (res.ok) {
        const json = await res.json();
        const version = DeviceInfo.getVersion();
        const bundleId = DeviceInfo.getBundleId();
        const info = json[bundleId];
        if (info) {
          const newVersion: string = info.version;
          const levelVersion = info.level;
          const hasNewVersion = _compareVersion(newVersion, version) > 0;
          const canContinue = hasNewVersion ? levelVersion != 'critical' : true;
          return { canContinue, hasNewVersion, newVersion };
        } else {
          //console.debug("[UserService] checkVersion: there isnt a new version for bundle ", bundleId, json.mobile)
        }
      } else {
        //console.debug("[UserService] checkVersion: there isnt a new version (not found) ", res.status, url, res)
      }
    } catch {
      // TODO: Manage error
    } finally {
      CookieManager.clearAll();
    }
    return { canContinue: true, hasNewVersion: false, newVersion: '' };
  }

  async redirectToTheStore() {
    const bundleId = DeviceInfo.getBundleId();
    const appName = DeviceInfo.getApplicationName();
    const appStoreLocale = 'fr';
    const playStoreId = bundleId;
    let appStoreId = null;
    if (Platform.OS == 'ios') {
      //get appstore id using itunes API
      const url = `http://itunes.apple.com/lookup?bundleId=${bundleId}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        appStoreId = json.resultCount > 0 ? json.results[0].trackId : null;
      } else {
        // console.debug('[UserService] redirectToTheStore:could not found appstoreid for ', url);
      }
    }
    try {
      await AppLink.openInStore({ appName, appStoreId, appStoreLocale, playStoreId });
    } catch {
      // TODO: Manage error
    } finally {
      CookieManager.clearAll();
    }
  }

  async getUserChildren(userId: string) {
    try {
      const parentChildrenByStructureList = (await fetchJSONWithCache(
        `/directory/user/${userId}/children`,
      )) as IEntcoreParentChildrenByStructureList;
      return parentChildrenByStructureList;
    } catch (e) {
      // console.warn('[UserService] getUserChildren: could not get children data', e);
    }
  }

  async revalidateTerms() {
    try {
      await fetchJSONWithCache('/auth/cgu/revalidate', {
        method: 'PUT',
      });
    } catch (e) {
      // console.warn('[UserService] revalidateTerms: could not revalidate terms', e);
    }
  }

  async getAuthTranslationKeys(language: Languages) {
    try {
      // Note: a simple fetch() is used here, to be able to call the API even without a token (for example, while activating an account)
      const res = await fetch(`${DEPRECATED_getCurrentPlatform()!.url}/auth/i18n`, {
        headers: { 'Accept-Language': language, 'X-Device-Id': uniqueId() },
      });
      if (res.ok) {
        const authTranslationKeys = await res.json();
        return authTranslationKeys;
      } else throw new Error('error in res.json()');
    } catch (e) {
      throw '[UserService] getAuthTranslationKeys: ' + e;
    } finally {
      CookieManager.clearAll();
    }
  }
}

export const userService = new UserService();
