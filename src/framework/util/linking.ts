/**
 * Custom handler for React Native Linking API
 * Handle auto-login feature + alert confirmation
 */
import { Alert, Linking } from 'react-native';

import { I18n } from '~/app/i18n';
import { assertSession } from '~/framework/modules/auth/reducer';
import { urlSigner } from '~/infra/oauth';

export interface OpenUrlCustomLabels {
  title?: string;
  message?: string;
  continue?: string;
  cancel?: string;
  error?: string;
  errorTitle?: string;
}

const verifyAndOpenUrl = async (finalUrl: string) => {
  const isSupported = await Linking.canOpenURL(finalUrl);
  if (isSupported === true) {
    await Linking.openURL(finalUrl);
  } else {
    throw new Error('openUrl : url provided is not supported');
  }
};

export async function openUrl(
  url?: string,
  customLabels?: OpenUrlCustomLabels,
  generateException?: boolean,
  showConfirmation: boolean = true,
  autoLogin: boolean = true,
): Promise<void> {
  try {
    if (!url) {
      throw new Error('openUrl : no url provided.');
    }

    let finalUrl = urlSigner.getAbsoluteUrl(url);

    if (autoLogin) {
      try {
        const session = assertSession();
        if (urlSigner.getIsUrlSignable(finalUrl)) {
          const customToken = await session.oauth2.getQueryParamToken();
          if (customToken && finalUrl) {
            // Token can have failed to load. In that case, just ignore it and go on. The user may need to login on the web.
            const urlObj = new URL(finalUrl);
            urlObj.searchParams.append('queryparam_token', customToken);
            finalUrl = urlObj.href;
          }
        }
      } catch {
        // Do nothing. We just don't have customToken.
      }
    }

    if (showConfirmation) {
      Alert.alert(
        customLabels?.title ?? I18n.get('common.redirect.browser.title'),
        customLabels?.message ?? I18n.get('common.redirect.browser.message'),
        [
          {
            text: customLabels?.cancel ?? I18n.get('common.cancel'),
            style: 'cancel',
          },
          {
            text: customLabels?.continue ?? I18n.get('common.continue'),
            onPress: () => verifyAndOpenUrl(finalUrl!),
            style: 'default',
          },
        ],
        {
          cancelable: true,
        },
      );
    } else verifyAndOpenUrl(finalUrl!);
  } catch (e) {
    const title = customLabels?.errorTitle ?? customLabels?.error ?? I18n.get('common.redirect.browser.error');
    const message = customLabels?.error ?? (title ? undefined : I18n.get('common.redirect.browser.error'));
    Alert.alert(title, message);
    if (generateException) throw e;
  }
}
