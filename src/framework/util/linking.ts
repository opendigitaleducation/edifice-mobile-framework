/**
 * Custom handler for React Native Linking API
 * Handle auto-login feature + alert confirmation
 */
import I18n from 'i18n-js';
import { Alert, Linking } from 'react-native';

import { getIsUrlSignable } from '~/infra/oauth';

import { IUserSession, getUserSession } from './session';

export interface OpenUrlCustomLabels {
  title?: string;
  message?: string;
  continue?: string;
  cancel?: string;
  error?: string;
}

export async function openUrl(url?: string, customLabels?: OpenUrlCustomLabels, generateException?: boolean): Promise<void>;
export async function openUrl(
  getUrl?: (session: IUserSession) => string | false | undefined | Promise<string | false | undefined>,
  customLabels?: OpenUrlCustomLabels,
  generateException?: boolean,
): Promise<void>;
export async function openUrl(
  urlOrGetUrl?: string | ((session: IUserSession) => string | false | undefined | Promise<string | false | undefined>),
  customLabels?: OpenUrlCustomLabels,
  generateException?: boolean,
): Promise<void> {
  try {
    const session = getUserSession();
    if (!session) {
      throw new Error('openUrl : no active session.');
    }
    // 1. compute url redirection if function provided
    if (!urlOrGetUrl) {
      throw new Error('openUrl : no url provided.');
    }
    let url = typeof urlOrGetUrl === 'string' ? urlOrGetUrl : await urlOrGetUrl(session);
    if (!url) {
      throw new Error('openUrl : no url provided.');
    }
    // 1. compute url redirection if function provided
    if (getIsUrlSignable(url)) {
      const customToken = await session.oauth.getQueryParamToken();
      const urlObj = new URL(url);
      urlObj.searchParams.append('queryparam_token', customToken);
      url = urlObj.href;
    }
    const finalUrl: string = url;
    // 2. Show confirmation
    Alert.alert(
      customLabels?.title ?? I18n.t('common.redirect.browser.title'),
      customLabels?.message ?? I18n.t('common.redirect.browser.message'),
      [
        {
          text: customLabels?.cancel ?? I18n.t('common.cancel'),
          style: 'cancel',
        },
        {
          text: customLabels?.continue ?? I18n.t('common.continue'),
          onPress: async () => {
            const isSupported = await Linking.canOpenURL(finalUrl);
            if (isSupported === true) {
              console.debug('open url', finalUrl);
              await Linking.openURL(finalUrl);
            } else {
              throw new Error('openUrl : url provided is not supported');
            }
          },
          style: 'default',
        },
      ],
      {
        cancelable: true,
      },
    );
  } catch (e) {
    Alert.alert(customLabels?.error ?? I18n.t('common.redirect.browser.error'));
    if (generateException) throw e;
  }
}
