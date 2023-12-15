import * as React from 'react';
import { ThunkDispatch } from 'redux-thunk';

import { loginAction } from '~/framework/modules/auth/actions';
import { RuntimeAuthErrorCode } from '~/framework/modules/auth/model';
import { actions } from '~/framework/modules/auth/reducer';
import { loadCurrentPlatform } from '~/framework/modules/auth/service';
import { appReadyAction } from '~/framework/navigation/redux';
import { Platform } from '~/framework/util/appConf';
import { Storage } from '~/framework/util/storage';

import { Theme } from '~/app/theme';
import { I18n } from './i18n';

/**
 * Logic code that is run for the app start
 */
export function useAppStartup(dispatch: ThunkDispatch<any, any, any>, lastPlatform?: Platform) {
  const [loadedPlatform, setLoadedPlatform] = React.useState<Platform | undefined>(undefined);
  React.useEffect(() => {
    Storage.init()
      .then(() =>
        Theme.init().then(() =>
          I18n.init()
            .then(() =>
              loadCurrentPlatform().then(platform => {
                if (platform) {
                  let loginDone = false;
                  dispatch(loginAction(platform, undefined))
                    .then(redirect => {
                      dispatch(actions.redirectAutoLogin(redirect));
                    })
                    .catch(() => {
                      // Do nothing. Finally clause + default navigation state will handle the case.
                    })
                    .finally(() => {
                      loginDone = true;
                      setLoadedPlatform(platform);
                      dispatch(appReadyAction());
                    });
                  setTimeout(() => {
                    if (!loginDone) {
                      dispatch(actions.sessionError(RuntimeAuthErrorCode.NETWORK_ERROR));
                      setLoadedPlatform(platform);
                      dispatch(appReadyAction());
                    }
                  }, 15000);
                } else dispatch(appReadyAction());
              }),
            )
            .catch(e => {
              if (__DEV__) console.warn(e);
              dispatch(appReadyAction());
            }),
        ),
      )
      .catch(e => {
        if (__DEV__) console.warn(e);
        I18n.init().finally(() => {
          dispatch(appReadyAction());
        });
      });
    // We WANT TO call this only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update last-known platform if provided.
  if (lastPlatform && lastPlatform !== loadedPlatform) {
    setLoadedPlatform(lastPlatform);
    return lastPlatform;
  }
  return loadedPlatform;
}
