/**
 * Timeline services
 */

import deepmerge from 'deepmerge';
import queryString from 'query-string';

import { IEntcoreFlashMessage } from '~/framework/modules/timelinev2/reducer/flashMessages';
import { IEntcoreNotificationType } from '~/framework/modules/timelinev2/reducer/notifDefinitions/notifTypes';
import { IPushNotifsSettings_State_Data } from '~/framework/modules/timelinev2/reducer/notifSettings/pushNotifsSettings';
import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { IEntcoreTimelineNotification, ITimelineNotification, notificationAdapter } from '~/framework/util/notifications';
import { IUserSession } from '~/framework/util/session';
import { fetchJSONWithCache, signedFetchJson } from '~/infra/fetchWithCache';

// Notifications

export const registeredNotificationsService = {
  list: async (session: IUserSession) => {
    const api = '/timeline/registeredNotifications';
    return fetchJSONWithCache(api) as Promise<IEntcoreNotificationType[]>;
  },
};

export const notifFiltersService = {
  list: async (session: IUserSession) => {
    const api = '/timeline/types';
    return fetchJSONWithCache(api) as Promise<string[]>;
  },
};

export const notificationsService = {
  page: async (session: IUserSession, page: number, filters: string[]) => {
    const url = '/timeline/lastNotifications';
    const query = {
      page,
      type: filters,
    };
    const api = queryString.stringifyUrl({ url, query });
    const headers = {
      Accept: 'application/json;version=3.0',
    };
    const entcoreNotifications = (await fetchJSONWithCache(api, { headers })) as {
      results: IEntcoreTimelineNotification[];
      status: string;
      number: number;
    };
    if (entcoreNotifications.status !== 'ok') {
      throw new Error('[notificationsService.page] got status not ok from ' + api);
    }
    // Run the notification adapter for each received notification
    return entcoreNotifications.results.map(n => notificationAdapter(n) as ITimelineNotification);
  },
  report: async (session: IUserSession, id: string) => {
    const api = `${DEPRECATED_getCurrentPlatform()!.url}/timeline/${id}/report`;
    const method = 'PUT';
    return signedFetchJson(api, { method });
  },
};

// Flash Messages

export const flashMessagesService = {
  list: async (session: IUserSession) => {
    const api = '/timeline/flashmsg/listuser';
    return fetchJSONWithCache(api) as Promise<IEntcoreFlashMessage[]>;
  },
  dismiss: async (session: IUserSession, flashMessageId: number) => {
    const api = `/timeline/flashmsg/${flashMessageId}/markasread`;
    return fetchJSONWithCache(api, { method: 'PUT' }) as any;
  },
};

// Push-notifs preferences

export interface IEntcoreTimelinePreference {
  preference: string;
}
export interface IEntcoreTimelinePreferenceContent {
  config:
    | {
        [notifKey: string]: {
          defaultFrequency: string;
          type?: string;
          'event-type'?: string;
          'app-name'?: string;
          'app-address'?: string;
          key?: string;
          'push-notif'?: boolean;
          restriction?: string;
        };
      }
    | undefined;
  page: number;
  type: string[];
}

export const pushNotifsService = {
  _getPrefs: async (session: IUserSession) => {
    const api = '/userbook/preference/timeline';
    const response = (await fetchJSONWithCache(api)) as IEntcoreTimelinePreference;
    const prefs = JSON.parse(response.preference) as IEntcoreTimelinePreferenceContent;
    // console.log("prefs loaded before parse", prefs);
    return prefs;
  },
  _getConfig: async (session: IUserSession) => {
    const prefs = await pushNotifsService._getPrefs(session);
    return prefs?.config ?? {};
  },
  list: async (session: IUserSession) => {
    const notifsPrefs = Object.fromEntries(
      Object.entries(await pushNotifsService._getConfig(session))
        .filter(([k, v]) => v.hasOwnProperty('push-notif') && v['push-notif'] !== undefined)
        .map(([k, v]) => [k, v['push-notif']!]),
    );
    return notifsPrefs;
  },
  set: async (session: IUserSession, changes: IPushNotifsSettings_State_Data) => {
    const api = '/userbook/preference/timeline';
    const method = 'PUT';
    const notifPrefsUpdated = Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, { 'push-notif': v }]));
    // console.log('updates push-notif prefs', notifPrefsUpdated);
    const prefsOriginal = await pushNotifsService._getPrefs(session);
    const notifPrefsOriginal = prefsOriginal.config ?? {};
    // console.log('current push-notif prefs', notifPrefsOriginal);
    const notifPrefs = deepmerge(notifPrefsOriginal, notifPrefsUpdated);
    const prefsUpdated = { config: notifPrefs };
    // console.log('new notif prefs', prefsUpdated);
    const payload = { ...prefsOriginal, ...prefsUpdated };
    // console.log('payload', payload);
    const responseJson = await signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
      method,
      body: JSON.stringify(payload),
    });
    return responseJson;
  },
};
