import { ThunkDispatch } from 'redux-thunk';

import { initEditor } from '~/framework/components/inputs/rich-text/editor/editor';
import { useConstructor } from '~/framework/hooks/constructor';
import { authInitAction, restoreAccountAction } from '~/framework/modules/auth/actions';
import { accountIsLoggable } from '~/framework/modules/auth/model';
import track from '~/framework/modules/auth/tracking';
import { appReadyAction } from '~/framework/navigation/redux';
import { tryAction } from '~/framework/util/redux/actions';
import { Storage } from '~/framework/util/storage';

import { I18n } from './i18n';
import { Log } from './log';

const initFeatures = async () => {
  await Log.init();
  await Storage.init();
  await I18n.init();
};

// const MAX_STARTUP_TIME_MS = 15000;
// Todo : implement this again.

/**
 * Logic code that is run for the app start
 */
export function useAppStartup(dispatch: ThunkDispatch<any, any, any>) {
  useConstructor(async () => {
    try {
      const tryRestore = tryAction(restoreAccountAction, {
        track: track.loginRestore,
      });
      await initFeatures();
      const startupAccount = await (dispatch(authInitAction()) as unknown as ReturnType<ReturnType<typeof authInitAction>>); // TS-issue with dispatch async
      if (startupAccount && accountIsLoggable(startupAccount)) {
        await (dispatch(tryRestore(startupAccount)) as unknown as ReturnType<ReturnType<typeof restoreAccountAction>>); // TS-issue with dispatch async
      }
    } catch (e) {
      console.error('[Startup] Startup failed. Cause :', e);
    } finally {
      initEditor().finally(null);
      dispatch(appReadyAction());
    }
  });
}
