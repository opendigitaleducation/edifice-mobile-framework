import CookieManager from '@react-native-cookies/cookies';
import I18n from 'i18n-js';
import { ThunkDispatch } from 'redux-thunk';

import { Platform } from '~/framework/util/appConf';
import { Trackers } from '~/framework/util/tracker';
import { clearRequestsCache } from '~/infra/fetchWithCache';
import { OAuth2ErrorCode, destroyOAuth2 } from '~/infra/oauth';
import { actionTypeLoggedIn, actionTypeLoggedInPartial, actionTypeLoginError } from '~/user/actions/actionTypes/login';

import {
  AuthError,
  AuthErrorCode,
  ForgotMode,
  IActivationError,
  IActivationPayload,
  IAuthContext,
  IAuthCredentials,
  IChangePasswordError,
  IChangePasswordPayload,
  IForgotPayload,
  PartialSessionScenario,
  RuntimeAuthErrorCode,
  createActivationError,
  createChangePasswordError,
} from './model';
import { actions, actions as authActions } from './reducer';
import {
  createSession,
  ensureCredentialsMatchActivationCode,
  ensureUserValidity,
  fetchUserInfo,
  fetchUserPublicInfo,
  formatSession,
  getAuthContext,
  getPartialSessionScenario,
  manageFirebaseToken as initFirebaseToken,
  removeFirebaseToken,
  restoreSession,
  restoreSessionAvailable,
  savePlatform,
  saveSession,
} from './service';

interface ILoginActionResultActivation {
  action: 'activate';
  credentials: IAuthCredentials;
  rememberMe?: boolean;
  context: IAuthContext;
}
interface ILoginActionResultPartialScenario {
  action: PartialSessionScenario;
  credentials?: IAuthCredentials;
  rememberMe?: boolean;
  context: IAuthContext;
}
export type ILoginResult = ILoginActionResultActivation | ILoginActionResultPartialScenario | void;

export function loginAction(platform: Platform, credentials?: IAuthCredentials, rememberMe?: boolean, timestamp?: number) {
  return async function (dispatch: ThunkDispatch<any, any, any>, getState: () => any): Promise<ILoginResult> {
    try {
      // 1. Get token from somewhere

      if (credentials) {
        await createSession(platform, credentials);
      } else {
        const tokenData = await restoreSessionAvailable();
        if (tokenData) {
          await restoreSession(platform);
        } else {
          return;
        }
      }

      // 2. Gather information about user

      const userinfo = await fetchUserInfo(platform);
      ensureUserValidity(userinfo);

      // 3. Check some partial session cases
      const partialSessionScenario = getPartialSessionScenario(userinfo);

      // 4. Gather user public info (only if complete session scenario)

      const { userdata, userPublicInfo } = partialSessionScenario
        ? { userdata: undefined, userPublicInfo: { result: [] } }
        : await fetchUserPublicInfo(userinfo, platform);

      // 5. Init Firebase

      await initFirebaseToken(platform);

      // 6. Save session info if needed

      await savePlatform(platform);
      if (!credentials || rememberMe || platform.wayf) await saveSession();

      // 7. Do tracking

      if (credentials) await Trackers.trackEvent('Auth', 'LOGIN', partialSessionScenario);
      else await Trackers.trackDebugEvent('Auth', 'RESTORE', partialSessionScenario);

      // === Bonus : clear cookies. The backend can soemtimes send back a Set-Cookie header that conflicts with the oAuth2 token.
      await CookieManager.clearAll();

      // 8. Validate session + return redirect scenario

      if (partialSessionScenario) {
        const context = await getAuthContext(platform);
        dispatch({
          // For legacy compat
          type: actionTypeLoggedInPartial,
          userbook: userinfo,
          userdata,
          userPublicInfo: userPublicInfo.result[0],
        });
        dispatch(authActions.sessionPartial(formatSession(platform, userinfo)));
        return { action: partialSessionScenario, context, credentials, rememberMe };
      } else {
        dispatch({
          // For legacy compat
          type: actionTypeLoggedIn,
          userbook: userinfo,
          userdata,
          userPublicInfo: userPublicInfo.result[0],
        });
        dispatch(authActions.sessionCreate(formatSession(platform, userinfo)));
      }
    } catch (e) {
      let authError = (e as Error).name === 'EAUTH' ? (e as AuthError) : undefined;

      // 1. If error is bad login/mdp, it may be an account activation process
      if (credentials && authError?.type === OAuth2ErrorCode.BAD_CREDENTIALS) {
        try {
          await ensureCredentialsMatchActivationCode(platform, credentials);
          const context = await getAuthContext(platform);
          return { action: 'activate', context, credentials, rememberMe };
        } catch (err) {
          authError = (err as Error).name === 'EAUTH' ? (err as AuthError) : undefined;
          dispatch(authActions.sessionError(authError?.type ?? RuntimeAuthErrorCode.UNKNOWN_ERROR, timestamp));
          throw err;
        }
      } else {
        if (credentials) await Trackers.trackEvent('Auth', 'LOGIN ERROR', authError?.type);
        else await Trackers.trackEvent('Auth', 'RESTORE ERROR', authError?.type);
        dispatch({
          // For legacy compat
          type: actionTypeLoginError,
          errmsg: authError?.type,
        });
        dispatch(authActions.sessionError(authError?.type ?? RuntimeAuthErrorCode.UNKNOWN_ERROR, timestamp));
        throw e;
      }
    }
  };
}

interface IActivationSubmitPayload extends IActivationPayload {
  callBack: string; // No idea what is it for...
  theme: string;
}

// ToDo : move API calls of this in service !
export function activateAccountAction(platform: Platform, model: IActivationPayload, rememberMe?: boolean) {
  return async (dispatch: ThunkDispatch<any, any, any>, getState) => {
    try {
      // === 0 auto select the default theme
      const theme = platform.webTheme;
      if (!theme) {
        console.debug('[User][Activation] activationAccount -> theme was not found:', platform.webTheme);
      }
      // === 1 - prepare payload
      const payload: IActivationSubmitPayload = {
        acceptCGU: true,
        activationCode: model.activationCode,
        callBack: '',
        login: model.login,
        password: model.password,
        confirmPassword: model.confirmPassword,
        mail: model.mail || '',
        phone: model.phone,
        theme,
      };
      const formdata = new FormData();
      for (const key in payload) {
        formdata.append(key, payload[key]);
      }
      // === 2 - Send activation information
      const res = await fetch(`${platform.url}/auth/activation`, {
        body: formdata,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        method: 'post',
      });
      // === 3 - Check whether the activation was successfull
      if (!res.ok) {
        throw createActivationError('activation', I18n.t('activation-errorSubmit'));
      }
      // a json response can contains an error field
      if (res.headers.get('content-type')?.indexOf('application/json') !== -1) {
        // checking response header
        const resBody = await res.json();
        if (resBody.error) {
          throw createActivationError('activation', resBody.error.message);
        }
      }

      // === Bonus : clear cookies. The backend send back a Set-Cookie header that conflicts with the oAuth2 token.
      await CookieManager.clearAll();
      // ToDo : what to do if clearing the cookies doesn't work ? The user will be stuck with that cookie and will be logged to that account forever and ever ! 😱

      // === 4 - call thunk login using login/password
      const redirect = await dispatch(
        loginAction(
          platform,
          {
            username: model.login,
            password: model.password,
          },
          rememberMe,
        ),
      );
      // === 5 - Tracking
      Trackers.trackEvent('Auth', 'ACTIVATE');
      return redirect;
    } catch (e) {
      if ((e as IActivationError).name === 'EACTIVATION') throw e;
      else throw createActivationError('activation', I18n.t('activation-errorSubmit'), '', e as object);
    }
  };
}

// ToDo : type the return value
export function forgotAction(platform: Platform, userInfo: IForgotPayload, forgotMode: ForgotMode) {
  return async (dispatch: ThunkDispatch<any, any, any>) => {
    try {
      const payLoad =
        forgotMode === 'id'
          ? {
              mail: userInfo.login,
              firstName: userInfo.firstName,
              structureId: userInfo.structureId,
              service: 'mail',
            }
          : {
              login: userInfo.login,
              service: 'mail',
            };
      const res = await fetch(`${platform.url}/auth/forgot-${forgotMode === 'id' ? 'id' : 'password'}`, {
        body: JSON.stringify(payLoad),
        method: 'POST',
      });
      const resJson = await res.json();
      const resStatus = await res.status;
      const ok = resStatus >= 200 && resStatus < 300;
      const response = { ...resJson, ok };
      return response;
    } catch (err) {
      throw err;
    }
  };
}

/**
 * mark the current to be genereted with the given timestamp.
 * Login screens get the timestamp to ensure to show the error only once.
 * @param errcode the AuthErrorCode
 * @param timestamp timestamp of the last-render-time of the screen
 */
export function markLoginErrorTimestampAction(errcode: AuthErrorCode, timestamp: number) {
  return async (dispatch: ThunkDispatch<any, any, any>) => {
    dispatch(actions.sessionError(errcode, timestamp));
  };
}

/** Action that erases the session without Tracking anything. */
function sessionDestroyAction(platform: Platform) {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    // Unregister the device token from the backend
    await removeFirebaseToken(platform);
    // Erase requests cache
    await clearRequestsCache();
    // Erase stored oauth2 token and cache information
    await destroyOAuth2();
    // Validate log out
    dispatch(actions.sessionEnd());
  };
}

export function logoutAction(platform: Platform) {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    await dispatch(sessionDestroyAction(platform));
    Trackers.trackEvent('Auth', 'LOGOUT');
  };
}

export interface IChangePasswordSubmitPayload {
  oldPassword: string;
  password: string;
  confirmPassword: string;
  login: string;
  callback: string; // WTF is it for ???
}

export function changePasswordAction(platform: Platform, p: IChangePasswordPayload, forceChange?: boolean) {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      // === 1 - prepare payload
      const payload: IChangePasswordSubmitPayload = {
        oldPassword: p.oldPassword,
        password: p.newPassword,
        confirmPassword: p.confirm,
        login: p.login,
        callback: '',
        ...(forceChange ? { forceChange: 'force' } : {}),
      };
      const formdata = new FormData();
      for (const key in payload) {
        formdata.append(key, payload[key as keyof IChangePasswordSubmitPayload]);
      }
      // === 2 - Send change password information
      const res = await fetch(`${platform.url}/auth/reset`, {
        body: formdata,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        method: 'post',
      });
      // === 3 - Check whether the password change was successfull
      if (!res.ok) {
        throw createChangePasswordError('change password', I18n.t('changePassword-errorSubmit'));
      }
      // a json response can contains an error field
      if (res.headers.get('content-type') && res.headers.get('content-type')!.indexOf('application/json') !== -1) {
        // checking response header
        const resBody = await res.json();
        if (resBody.error) {
          const pwdRegex = getState().user.changePassword?.context?.passwordRegex;
          const regexp = new RegExp(pwdRegex);
          if (pwdRegex && !regexp.test(p.newPassword)) {
            throw createChangePasswordError('change password', I18n.t('changePassword-errorRegex'));
          } else {
            throw createChangePasswordError('change password', I18n.t('changePassword-errorFields'));
          }
        }
      }

      Trackers.trackEvent('Profile', 'CHANGE PASSWORD');
    } catch (e) {
      Trackers.trackEvent('Profile', 'CHANGE PASSWORD ERROR');
      if ((e as IChangePasswordError).name === 'ECHANGEPWD') throw e;
      else throw createChangePasswordError('change password', I18n.t('changePassword-errorSubmit'));
    }
  };
}
