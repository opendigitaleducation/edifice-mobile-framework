import DeviceInfo from 'react-native-device-info';
import { AnyAction } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import {
  ERASE_ALL_ACCOUNTS,
  IAuthState,
  actions,
  assertSession,
  getState as getAuthState,
  getSession,
} from '~/framework/modules/auth/reducer';
import { audienceService } from '~/framework/modules/core/audience/service';
import { AudienceValidReactionTypes } from '~/framework/modules/core/audience/types';
import appConf, { Platform } from '~/framework/util/appConf';
import { Error } from '~/framework/util/error';
import { createEndSessionAction } from '~/framework/util/redux/reducerFactory';
import { Storage } from '~/framework/util/storage';
import { Trackers } from '~/framework/util/tracker';
import { clearRequestsCacheLegacy } from '~/infra/cache';
import { OAuth2RessourceOwnerPasswordClient, destroyOAuth2Legacy } from '~/infra/oauth';

import {
  IActivationPayload as ActivationPayload,
  AuthCredentials,
  AuthFederationCredentials,
  AuthLoggedAccount,
  AuthPendingRedirection,
  AuthRequirement,
  AuthSavedAccount,
  AuthSavedLoggedInAccount,
  AuthSavedLoggedInAccountWithCredentials,
  ForgotMode,
  IActivationError,
  IChangePasswordError,
  IChangePasswordPayload,
  IForgotPayload,
  InitialAuthenticationMethod,
  PlatformAuthContext,
  accountIsActive,
  createActivationError,
  createChangePasswordError,
  getSerializedLoggedInAccountInfo,
} from './model';
import * as authService from './service';
import {
  IUserInfoBackend,
  UserPersonDataBackend,
  UserPrivateData,
  createSession,
  ensureUserValidity,
  fetchRawUserRequirements,
  fetchUserInfo,
  fetchUserPublicInfo,
  forgetPlatform,
  forgetPreviousSession,
  formatSession,
  getAuthContext,
  getRequirementScenario,
  manageFirebaseToken,
  revalidateTerms,
} from './service';
import {
  readSavedAccounts,
  readSavedStartup,
  readShowOnbording,
  writeCreateAccount,
  writeDeleteAccount,
  writeLogout,
  writeRemoveToken,
  writeReplaceAccount,
} from './storage';

type AuthDispatch = ThunkDispatch<IAuthState, any, AnyAction>;

const MAX_AUTH_TIMEOUT = 30000;

let loginCanceled = false;

const assertCancelLogin = () => {
  if (loginCanceled) {
    loginCanceled = false;
    throw new Error.LoginError(Error.FetchErrorType.TIMEOUT);
  }
};

/**
 * Init the auth state with walues read from the storage.
 * @returns If exist, the startup account to try refresh session with.
 */
export const authInitAction = () => async (dispatch: AuthDispatch, getState: () => IGlobalState) => {
  const startup = readSavedStartup();
  const accounts = readSavedAccounts();
  const showOnboarding = readShowOnbording();
  const deviceId = await DeviceInfo.getUniqueId();

  dispatch(actions.authInit(startup, accounts, showOnboarding, deviceId));
  const authState = getAuthState(getState());
  const ret =
    authState.pending && authState.pending.redirect === undefined && authState.pending.account
      ? authState.accounts[authState.pending.account]
      : Object.keys(authState.accounts).length === 1
        ? Object.values(authState.accounts)[0]
        : undefined;
  if (accountIsActive(ret)) {
    return getSerializedLoggedInAccountInfo(ret);
  } else return ret;
};

/**
 * fetch the auth context of current platform and stores it in redux.
 * @returns
 */
export const loadAuthContextAction = (platform: Platform) => async (dispatch: AuthDispatch) => {
  const context = await authService.getAuthContext(platform);
  if (!context) return;
  dispatch(actions.loadPfContext(platform.name, context));
  return context;
};

/**
 * fetchs the auth context of current platform and stores it in redux.
 * @returns
 */
export const loadPlatformLegalUrlsAction = (platform: Platform) => async (dispatch: AuthDispatch) => {
  const legalUrls = await authService.getAuthTranslationKeys(platform, I18n.getLanguage() as I18n.SupportedLocales);
  if (!legalUrls) return;
  dispatch(actions.loadPfLegalUrls(platform.name, legalUrls));
  return legalUrls;
};

/**
 * fetchs the valid reaction types of current platform and stores it in redux.
 * @returns
 */
export const loadValidReactionTypesAction = () => async (dispatch: AuthDispatch) => {
  const validReactionTypes = (await audienceService.reaction.getValidReactionTypes()) as AudienceValidReactionTypes;
  if (!validReactionTypes) return;
  dispatch(actions.loadPfValidReactionTypes(validReactionTypes));
  return validReactionTypes;
};

/**
 * Get default infos
 * - Fetch appropriate validation infos if must be verified
 * - Return default mobile or email
 */
async function getRequirementAdditionalInfos(requirement: AuthRequirement, platform: Platform) {
  let defaultMobile: string | undefined;
  let defaultEmail: string | undefined;
  if (requirement === AuthRequirement.MUST_VERIFY_MOBILE) {
    const mobileValidationInfos = await authService.getMobileValidationInfos(platform.url);
    defaultMobile = mobileValidationInfos?.mobile;
  } else if (requirement === AuthRequirement.MUST_VERIFY_EMAIL) {
    const emailValidationInfos = await authService.getEmailValidationInfos(platform.url);
    defaultEmail = emailValidationInfos?.email;
  }
  return { defaultMobile, defaultEmail };
}

const withMeasure = <Fn extends (...args: any[]) => any>(fn: Fn, tag?: string) => {
  return (async (...args: any) => {
    const start = Date.now();
    try {
      const ret = fn(...args);
      if (ret instanceof Promise) return await ret;
      else return ret;
    } finally {
      console.info(`[perf] ${tag ?? fn.toString()} in ${Date.now() - start}ms`);
    }
  }) as Fn;
};

const withErrorTracking = <Fn extends (...args: any[]) => any>(
  fn: Fn,
  category: string,
  action: string,
  name?: string,
  value?: number,
) => {
  return (async (...args: any) => {
    try {
      const ret = fn(...args);
      if (ret instanceof Promise) return await ret;
      else return ret;
    } catch (e) {
      Trackers.trackDebugEvent(category, action, name, value);
      throw e;
    }
  }) as Fn;
};

const raceTimeoutAction = <ReturnType>(fn: ThunkAction<ReturnType, any, any, any>, timeout: number, key?: number) => {
  return async (...args: Parameters<typeof fn>) => {
    try {
      loginCanceled = false;
      const ret = await Promise.race([
        fn(...args),
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error.FetchError(Error.FetchErrorType.TIMEOUT));
          }, timeout);
        }),
      ]);
      loginCanceled = false;
      return ret;
    } catch (e) {
      loginCanceled = true;
      args[0](
        actions.authError({
          key,
          info: e as Error,
        }),
      );
      console.error('[Auth] Login Timeout exceeded', e);
      throw e;
    }
  };
};

/**
 * Every step for login process is here.
 */
export const loginSteps = {
  /**
   * Get a new oAuth2 token set with given credentials
   * If bad credentials provided, check if this not the activation code / reset code
   */
  getNewToken: withErrorTracking(
    withMeasure(async (platform: Platform, credentials: AuthCredentials | AuthFederationCredentials) => {
      await createSession(platform, credentials);
    }, 'getNewToken'),
    'Auth',
    'LOGIN ERROR',
    'loginSteps.getToken',
  ),
  /**
   * Loads the saved token oAuth2 from the storage.
   * @param platform
   */
  loadToken: withErrorTracking(
    withMeasure(async (account: AuthSavedLoggedInAccount) => {
      authService.restoreSession(appConf.assertPlatformOfName(account.platform), account.tokens);
    }, 'loadToken'),
    'Auth',
    'LOGIN ERROR',
    'loginSteps.loadToken',
  ),
  /**
   * Get one of the requirements needed by the user to access the app
   * @param platform
   * @returns
   */
  getRequirement: withErrorTracking(
    withMeasure(async (platform: Platform) => {
      return getRequirementScenario(await fetchRawUserRequirements(platform));
    }, 'getRequirement'),
    'Auth',
    'LOGIN ERROR',
    'loginSteps.getRequirements',
  ),
  /**
   * Retrives the user information from the backend
   * @param platform
   * @param requirement
   * @returns
   */
  getUserData: withErrorTracking(
    withMeasure(async (platform: Platform, requirement?: AuthRequirement) => {
      const infos = await fetchUserInfo(platform);
      ensureUserValidity(infos);
      DeviceInfo.getUniqueId().then(uniqueID => {
        infos.uniqueId = uniqueID;
      });
      // If we have requirements, we can't fetch public info, we mock it instead.
      const { userdata, userPublicInfo } = requirement
        ? { userdata: undefined, userPublicInfo: undefined }
        : await fetchUserPublicInfo(infos, platform);
      return { infos, publicInfos: { userData: userdata, userPublicInfo } };
    }, 'getUserData'),
    'Auth',
    'LOGIN ERROR',
    'loginSteps.getUserData',
  ),
  /**
   * Saves the new account information & registers tokens (fcm) into the backend
   * @param platform
   */
  finalizeSession: withErrorTracking(
    withMeasure(
      async (
        addTimestamp: number,
        platform: Platform,
        loginUsed: string | undefined,
        userInfo: IUserInfoBackend,
        publicInfo: { userData?: UserPrivateData; userPublicInfo?: UserPersonDataBackend },
        method: InitialAuthenticationMethod | undefined,
      ) => {
        await Promise.all([manageFirebaseToken(platform), forgetPlatform(), forgetPreviousSession()]);
        const { userData, userPublicInfo } = publicInfo;
        const sessionInfo = formatSession(addTimestamp, platform, loginUsed, userInfo, method, userData, userPublicInfo);
        await Storage.sessionInit(sessionInfo);
        Trackers.setUserId(sessionInfo.user.id);
        Trackers.setCustomDimension(1, 'Profile', sessionInfo.user.type.toString());
        Trackers.setCustomDimension(3, 'Project', new URL(sessionInfo.platform.url).hostname);
        return sessionInfo;
      },
      'finalizeSession',
    ),
    'Auth',
    'LOGIN ERROR',
    'loginSteps.confirmLogin',
  ),
  /**
   * Check password against activation and password renew codes.
   */
  checkActivationAndRenew: withErrorTracking(
    withMeasure(async (platform: Platform, credentials: AuthCredentials) => {
      try {
        const response = await Promise.any([
          authService.ensureCredentialsMatchActivationCode(platform, credentials),
          authService.ensureCredentialsMatchPwdRenewCode(platform, credentials),
        ]);
        return response;
      } catch (e) {
        if (e instanceof AggregateError) {
          const ee = e.errors.find(
            eee => Error.getDeepErrorType<typeof Error.LoginError>(eee as Error) !== Error.OAuth2ErrorType.CREDENTIALS_MISMATCH,
          );
          if (ee) throw ee;
          else throw e.errors.at(0);
        } else throw e;
      }
    }, 'checkActivationAndRenew'),
    'Auth',
    'LOGIN ERROR',
    'loginSteps.checkActivationAndRenew',
  ),
};

const requirementsThatNeedLegalUrls = [AuthRequirement.MUST_REVALIDATE_TERMS, AuthRequirement.MUST_VALIDATE_TERMS];

export function deactivateLoggedAccountActionIfApplicable(action?: AnyAction | ThunkAction<void, IGlobalState, any, AnyAction>) {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    const account = getSession();
    if (account) {
      // Unregister the device token from the backend
      await authService.removeFirebaseTokenWithAccount(account);
      // Erase requests cache
      await clearRequestsCacheLegacy();
      // flush sessionReducers
      dispatch(createEndSessionAction());
      dispatch(actions.deactivate());
    }
    if (action) dispatch(action);
  };
}

interface AuthLoginFunctions {
  success:
    | typeof actions.addAccount
    | ((...args: Parameters<typeof actions.addAccount>) => ThunkAction<void, IGlobalState, undefined, AnyAction>);
  requirement:
    | typeof actions.addAccountRequirement
    | ((...args: Parameters<typeof actions.addAccountRequirement>) => ThunkAction<void, IGlobalState, undefined, AnyAction>);
  activation: typeof actions.redirectActivation;
  passwordRenew: typeof actions.redirectPasswordRenew;
  redirectCancel: typeof actions.redirectCancel | typeof actions.addAccountRedirectCancel;
  writeStorage: typeof writeCreateAccount;
  getTimestamp: () => number;
}

const getLoginFunctions = {
  addFirstAccount: () =>
    ({
      success: (...args: Parameters<typeof actions.addAccount>) => actions.replaceAccount(ERASE_ALL_ACCOUNTS, ...args),
      requirement: (...args: Parameters<typeof actions.addAccountRequirement>) =>
        actions.replaceAccountRequirement(ERASE_ALL_ACCOUNTS, ...args),
      activation: actions.redirectActivation,
      passwordRenew: actions.redirectPasswordRenew,
      redirectCancel: actions.redirectCancel,
      writeStorage: (...args: Parameters<typeof writeCreateAccount>) => writeReplaceAccount(ERASE_ALL_ACCOUNTS, ...args),
      getTimestamp: Date.now,
    }) as AuthLoginFunctions,
  replaceAccount: (id: keyof IAuthState['accounts'], timestamp: number) =>
    ({
      success: (...args: Parameters<typeof actions.addAccount>) => actions.replaceAccount(id, ...args),
      requirement: (...args: Parameters<typeof actions.addAccountRequirement>) => actions.replaceAccountRequirement(id, ...args),
      activation: actions.redirectActivation,
      passwordRenew: (...[platformName, login, code]: Parameters<typeof actions.redirectPasswordRenew>) =>
        actions.redirectPasswordRenew(platformName, login, code, id, timestamp),
      redirectCancel: actions.redirectCancel,
      writeStorage: (...args: Parameters<typeof writeCreateAccount>) => writeReplaceAccount(id, ...args),
      getTimestamp: () => timestamp,
    }) as AuthLoginFunctions,
  addAnotherAccount: () =>
    ({
      success:
        (...args: Parameters<typeof actions.addAccount>) =>
        async (dispatch: AuthDispatch, getState: () => IGlobalState) => {
          await dispatch(deactivateLoggedAccountActionIfApplicable(actions.addAccount(...args)));
        },
      requirement:
        (...args: Parameters<typeof actions.addAccountRequirement>) =>
        async (dispatch: AuthDispatch, getState: () => IGlobalState) => {
          await dispatch(deactivateLoggedAccountActionIfApplicable(actions.addAccountRequirement(...args)));
        },
      activation: actions.addAccountActivation,
      passwordRenew: actions.addAccountPasswordRenew,
      redirectCancel: actions.addAccountRedirectCancel,
      writeStorage: writeCreateAccount,
      getTimestamp: Date.now,
    }) as AuthLoginFunctions,
  restoreAccount: (id: keyof IAuthState['accounts'], timestamp: number) =>
    ({
      success: (...args: Parameters<typeof actions.addAccount>) => actions.replaceAccount(id, ...args),
      requirement: (...args: Parameters<typeof actions.addAccountRequirement>) => actions.replaceAccountRequirement(id, ...args),
      activation: actions.redirectActivation,
      passwordRenew: actions.redirectPasswordRenew,
      redirectCancel: actions.redirectCancel,
      writeStorage: (...args: Parameters<typeof writeCreateAccount>) => writeReplaceAccount(id, ...args),
      getTimestamp: () => timestamp,
    }) as AuthLoginFunctions,
  switchAccount: (id: keyof IAuthState['accounts'], timestamp: number) =>
    ({
      success:
        (...args: Parameters<typeof actions.addAccount>) =>
        async (dispatch: AuthDispatch, getState: () => IGlobalState) => {
          await dispatch(deactivateLoggedAccountActionIfApplicable(actions.replaceAccount(id, ...args)));
        },
      requirement:
        (...args: Parameters<typeof actions.addAccountRequirement>) =>
        async (dispatch: AuthDispatch, getState: () => IGlobalState) => {
          await dispatch(deactivateLoggedAccountActionIfApplicable(actions.replaceAccountRequirement(id, ...args)));
        },
      activation: actions.redirectActivation,
      passwordRenew: actions.redirectPasswordRenew,
      redirectCancel: actions.redirectCancel,
      writeStorage: (...args: Parameters<typeof writeCreateAccount>) => writeReplaceAccount(id, ...args),
      getTimestamp: () => timestamp,
    }) as AuthLoginFunctions,
};

/** Generic function that perform login task when token got. Only affects Redux, not storage ! */
const performLogin = async (
  reduxActions: Pick<AuthLoginFunctions, 'success' | 'requirement' | 'getTimestamp'>,
  platform: Platform,
  loginUsed: string | undefined,
  method: InitialAuthenticationMethod | undefined,
  dispatch: AuthDispatch,
) => {
  assertCancelLogin();
  const requirement = await loginSteps.getRequirement(platform);
  assertCancelLogin();
  const user = await loginSteps.getUserData(platform, requirement);
  assertCancelLogin();
  const accountInfo = await loginSteps.finalizeSession(
    reduxActions.getTimestamp(),
    platform,
    loginUsed,
    user.infos,
    user.publicInfos,
    method,
  );
  if (requirement) {
    const context = await authService.getAuthContext(platform);
    const infos = await getRequirementAdditionalInfos(requirement, platform);
    accountInfo.user.mobile = infos.defaultMobile;
    accountInfo.user.email = infos.defaultEmail;
    if (requirementsThatNeedLegalUrls.includes(requirement)) {
      await dispatch(loadPlatformLegalUrlsAction(platform));
    }
    await dispatch(deactivateLoggedAccountActionIfApplicable(reduxActions.requirement(accountInfo, requirement, context)));
  } else {
    await dispatch(deactivateLoggedAccountActionIfApplicable(reduxActions.success(accountInfo)));
  }

  // Launch oneSessionId fetch to prevent errors in rich-content. This is non-preventing in case of fails, so no await !
  OAuth2RessourceOwnerPasswordClient.connection?.getOneSessionId();

  // GET the audience valid reaction types for the platform
  await dispatch(loadValidReactionTypesAction());

  return accountInfo;
};

/** Generic thunk action that handle everything for a login with credentials */
const loginCredentialsAction = (functions: AuthLoginFunctions, platform: Platform, credentials: AuthCredentials, key?: number) =>
  raceTimeoutAction(
    async (dispatch: AuthDispatch, getState: () => IGlobalState) => {
      try {
        // Nested try/catch block to handle CREDENTIALS_MISMATCH errors caused by activation/renew code use.
        try {
          await loginSteps.getNewToken(platform, credentials);
          const session = await performLogin(
            functions,
            platform,
            credentials.username,
            InitialAuthenticationMethod.LOGIN_PASSWORD,
            dispatch,
          );
          functions.writeStorage(session, getAuthState(getState()).showOnboarding);
          return session;
        } catch (ee) {
          if (Error.getDeepErrorType<typeof Error.LoginError>(ee as Error) === Error.OAuth2ErrorType.CREDENTIALS_MISMATCH) {
            switch (await loginSteps.checkActivationAndRenew(platform, credentials)) {
              case AuthPendingRedirection.ACTIVATE:
                dispatch(functions.activation(platform.name, credentials.username, credentials.password));
                return AuthPendingRedirection.ACTIVATE;
              case AuthPendingRedirection.RENEW_PASSWORD:
                dispatch(functions.passwordRenew(platform.name, credentials.username, credentials.password));
                return AuthPendingRedirection.RENEW_PASSWORD;
            }
          } else {
            throw ee;
          }
        }
      } catch (e) {
        console.error(`[Auth] Login credentials error :`, e);
        dispatch(
          actions.authError({
            key,
            info: e as Error,
          }),
        );
        throw e;
      }
    },
    MAX_AUTH_TIMEOUT,
    key,
  );

/**
 * Manual login action with credentials by getting a fresh new token.
 * New account will exist among the other ones.
 * @param platform platform info to create the session on.
 * @param credentials login & password
 * @param key the screen key to store eventuel errors with
 * @returns
 * @throws
 */
export const loginCredentialsActionAddFirstAccount = (platform: Platform, credentials: AuthCredentials, key?: number) =>
  loginCredentialsAction(getLoginFunctions.addFirstAccount(), platform, credentials, key);

/**
 * Manual login action with credentials by getting a fresh new token.
 * New account will replace the one with given id.
 * @param accountId the account to replace
 * @param platform platform info to create the session on.
 * @param credentials login & password
 * @param key the screen key to store eventuel errors with
 * @returns
 * @throws
 */
export const loginCredentialsActionReplaceAccount = (
  accountId: keyof IAuthState['accounts'],
  timestamp: number,
  platform: Platform,
  credentials: AuthCredentials,
  key?: number,
) => loginCredentialsAction(getLoginFunctions.replaceAccount(accountId, timestamp), platform, credentials, key);

export const loginCredentialsActionAddAnotherAccount = (platform: Platform, credentials: AuthCredentials, key?: number) =>
  loginCredentialsAction(getLoginFunctions.addAnotherAccount(), platform, credentials, key);

/**
 * Manual login action with Federation.
 * @param platform platform info to create the session on.
 * @param saml saml assertion
 * @returns
 * @throws
 */
const loginFederationAction = (
  functions: AuthLoginFunctions,
  platform: Platform,
  credentials: AuthFederationCredentials,
  key?: number,
) =>
  raceTimeoutAction(
    async (dispatch: AuthDispatch, getState: () => IGlobalState) => {
      try {
        await loginSteps.getNewToken(platform, credentials);
        const session = await performLogin(functions, platform, undefined, InitialAuthenticationMethod.WAYF_SAML, dispatch);
        functions.writeStorage(session, getAuthState(getState()).showOnboarding);
        return session;
      } catch (e) {
        // When login in with federation, "CREDENTIALS_MISMATCH" is the errcode obtained if the saml token does not link to an actual user account.
        // We override the error type to "SAML_INVALID" in this case.
        const error =
          e instanceof Error.ErrorWithType && e.type === Error.OAuth2ErrorType.CREDENTIALS_MISMATCH
            ? new Error.LoginError(Error.OAuth2ErrorType.SAML_INVALID, undefined, { cause: e.cause })
            : e;

        console.error(`[Auth] Login federation error :`, error);
        dispatch(
          actions.authError({
            key,
            info: error as Error,
          }),
        );
        throw error;
      }
    },
    MAX_AUTH_TIMEOUT,
    key,
  );

export const loginFederationActionAddFirstAccount = (platform: Platform, credentials: AuthFederationCredentials, key?: number) =>
  loginFederationAction(getLoginFunctions.addFirstAccount(), platform, credentials, key);

export const loginFederationActionReplaceAccount = (
  accountId: keyof IAuthState['accounts'],
  timestamp: number,
  platform: Platform,
  credentials: AuthFederationCredentials,
  key?: number,
) => loginFederationAction(getLoginFunctions.replaceAccount(accountId, timestamp), platform, credentials, key);

export const loginFederationActionAddAnotherAccount = (platform: Platform, credentials: AuthFederationCredentials, key?: number) =>
  loginFederationAction(getLoginFunctions.addAnotherAccount(), platform, credentials, key);

/**
 * Automatic login action with given saved account information (and its serialized token).
 * @param account stored accound information
 * @returns
 * @throws
 */
const loadAccountAction = (functions: AuthLoginFunctions, account: AuthSavedLoggedInAccount | AuthLoggedAccount) =>
  raceTimeoutAction(async (dispatch: AuthDispatch, getState: () => IGlobalState) => {
    try {
      const accountToRestore = accountIsActive(account)
        ? (getSerializedLoggedInAccountInfo(account) as AuthSavedLoggedInAccount)
        : account;
      await loginSteps.loadToken(accountToRestore);
      if (!OAuth2RessourceOwnerPasswordClient.connection) {
        throw new Error.OAuth2Error(Error.OAuth2ErrorType.OAUTH2_MISSING_CLIENT);
      }
      await OAuth2RessourceOwnerPasswordClient.connection.refreshToken(accountToRestore.user.id, false);
      const session = await performLogin(
        functions,
        appConf.assertPlatformOfName(accountToRestore.platform),
        (accountToRestore.user as Partial<AuthSavedLoggedInAccountWithCredentials['user']>).loginUsed,
        account.method,
        dispatch,
      );
      writeReplaceAccount(account.user.id, session, getAuthState(getState()).showOnboarding);
      return session;
    } catch (e) {
      console.error(`[Auth] Restore error :`, e);
      dispatch(
        actions.authError({
          key: undefined,
          info: e as Error,
        }),
      );
      throw e;
    }
  }, MAX_AUTH_TIMEOUT);

export const restoreAccountAction = (account: AuthSavedLoggedInAccount | AuthLoggedAccount) =>
  loadAccountAction(getLoginFunctions.restoreAccount(account.user.id, account.addTimestamp), account);

export const switchAccountAction = (account: AuthSavedLoggedInAccount | AuthLoggedAccount) =>
  loadAccountAction(getLoginFunctions.switchAccount(account.user.id, account.addTimestamp), account);

/**
 * Marks the current error as displayed.
 */
export const consumeAuthErrorAction = (key: number) => (dispatch: AuthDispatch, getState: () => IGlobalState) => {
  const error = getAuthState(getState()).error;
  if (error) {
    error.key = key;
    dispatch(actions.authError(error));
  }
};

/**
 * Fetch again the logged user requirements and updates the store.
 * User needs to be logged.
 * @returns The new requirement if exists
 */
export const refreshRequirementsAction = () => async (dispatch: AuthDispatch) => {
  const session = assertSession();
  const requirement = await loginSteps.getRequirement(session.platform);
  const user = await loginSteps.getUserData(session.platform, requirement);
  const accountInfo = formatSession(
    session.addTimestamp,
    session.platform,
    (session.user as Partial<AuthSavedLoggedInAccountWithCredentials['user']>).loginUsed,
    user.infos,
    session.method,
    user.publicInfos.userData,
    user.publicInfos.userPublicInfo,
  );
  let context: PlatformAuthContext | undefined;
  if (requirement) {
    context = await getAuthContext(session.platform);
    if (requirementsThatNeedLegalUrls.includes(requirement)) {
      await dispatch(loadPlatformLegalUrlsAction(session.platform));
    }
  }
  dispatch(actions.updateRequirement(requirement, accountInfo, context));
};

/**
 * Revalidates terms for the current user and updates the store
 * @returns
 */
export const revalidateTermsAction = () => async (dispatch: AuthDispatch) => {
  const session = assertSession();
  await revalidateTerms(session);
  await dispatch(refreshRequirementsAction());
};

const activateAccountAction =
  (reduxActions: AuthLoginFunctions, platform: Platform, model: ActivationPayload) =>
  async (dispatch: ThunkDispatch<any, any, any>, getState) => {
    let activationWasDone = false;
    try {
      await authService.activateAccount(platform, model);
      activationWasDone = true;
      await dispatch(
        loginCredentialsAction(reduxActions, platform, {
          username: model.login,
          password: model.password,
        }),
      );
    } catch (e) {
      if (activationWasDone) {
        dispatch(reduxActions.redirectCancel(platform.name, model.login));
      }

      if ((e as IActivationError).name === 'EACTIVATION') throw e;
      else if (e instanceof global.Error) throw createActivationError('activation', I18n.get('auth-activation-errorsubmit'), '', e);
      else throw createActivationError('activation', I18n.get('auth-activation-errorsubmit'), '');
    }
  };

export const activateAccountActionAddFirstAccount = (platform: Platform, model: ActivationPayload) =>
  activateAccountAction(getLoginFunctions.addFirstAccount(), platform, model);

export const activateAccountActionAddAnotherAccount = (platform: Platform, model: ActivationPayload) =>
  activateAccountAction(getLoginFunctions.addAnotherAccount(), platform, model);

/**
 * Send reset mail for id or password
 * @param platform
 * @param userInfo
 * @param forgotMode
 * @returns
 */
export function forgotAction(platform: Platform, userInfo: IForgotPayload, forgotMode: ForgotMode) {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => {
    const deviceId = getAuthState(getState()).deviceInfo.uniqueId;
    if (!deviceId) throw new global.Error('forgotAction: deviceId is undefined.');
    if (forgotMode === 'id') {
      return authService.forgot<'id'>(
        platform,
        forgotMode,
        {
          mail: userInfo.login,
          firstName: userInfo.firstName,
          structureId: userInfo.structureId,
        },
        deviceId,
      );
    } else {
      return authService.forgot<'password'>(
        platform,
        forgotMode,
        {
          login: userInfo.login,
        },
        deviceId,
      );
    }
  };
}

/** Action that erases the session without Tracking anything. */
export function quietLogoutAction() {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    // Unregister the device token from the backend
    const account = assertSession();
    await authService.removeFirebaseToken(account.platform);
    // Erase requests cache
    await clearRequestsCacheLegacy();
    // Erase stored oauth2 token and cache information
    await destroyOAuth2Legacy();
    // Writes new storage values
    writeLogout(account);
    // Validate log out
    dispatch(actions.logout());
    dispatch(createEndSessionAction()); // flush sessionReducers
  };
}

export function invalidateSessionAction() {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    const account = assertSession();
    await authService.removeFirebaseToken(account.platform);
    await clearRequestsCacheLegacy();
    await destroyOAuth2Legacy();
    writeRemoveToken(account);
    dispatch(actions.invalidate());
    dispatch(createEndSessionAction()); // flush sessionReducers
  };
}

/** Clear the current session and track logout event.
 * Session must exist and this action will throw if no session is active.
 */
export function manualLogoutAction() {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    await dispatch(quietLogoutAction());
  };
}

export function removeAccountAction(account: AuthLoggedAccount | AuthSavedLoggedInAccount | AuthSavedAccount) {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    if (accountIsActive(account)) {
      await dispatch(quietLogoutAction());
    }
    dispatch(actions.removeAccount(account.user.id));
    writeDeleteAccount(account.user.id);
  };
}

export interface IChangePasswordModel {
  oldPassword: string;
  newPassword: string;
  confirm: string;
}

export interface IChangePasswordUserInfo {
  login: string;
}

export interface IChangePasswordSubmitPayload {
  oldPassword?: string;
  password: string;
  confirmPassword: string;
  login: string;
  callback: string;
  resetCode?: string;
}

function changePasswordAction(
  reduxActions: AuthLoginFunctions,
  platform: Platform,
  p: IChangePasswordPayload,
  forceChange?: boolean,
  rememberMe?: boolean,
) {
  return async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      // === 2 - prepare chg pwd payload
      const payload: IChangePasswordSubmitPayload = {
        oldPassword: p.oldPassword,
        ...(p?.resetCode ? { resetCode: p?.resetCode } : {}),
        password: p.newPassword,
        confirmPassword: p.confirm,
        login: p.login,
        callback: '',
        ...(forceChange ? { forceChange: 'force' } : {}),
      };
      const formdata = new FormData();
      for (const key in payload) {
        if (payload[key as keyof IChangePasswordSubmitPayload]) formdata.append(key, payload[key]);
      }
      // === 3 - Send change password information
      const deviceId = getAuthState(getState()).deviceInfo.uniqueId;
      if (!deviceId) {
        throw createChangePasswordError('change password', I18n.get('auth-changepassword-error-submit'));
      }
      const res = await fetch(`${platform.url}/auth/reset`, {
        body: formdata,
        headers: {
          Accept: 'application/json',
          'Accept-Language': I18n.getLanguage(),
          'Content-Type': 'multipart/form-data',
          'X-APP': 'mobile',
          'X-APP-NAME': DeviceInfo.getApplicationName(),
          'X-APP-VERSION': DeviceInfo.getReadableVersion(),
          'X-Device-Id': deviceId,
        },
        method: 'post',
      });
      // === 3 - Check whether the password change was successful
      if (!res.ok) {
        throw createChangePasswordError('change password', I18n.get('auth-changepassword-error-submit'));
      }
      // a json response can contains an error field
      if (res.headers.get('content-type') && res.headers.get('content-type')!.indexOf('application/json') !== -1) {
        // checking response header
        const resBody = await res.json();
        if (resBody.error) {
          const pwdRegex = getState().user.changePassword?.context?.passwordRegex;
          const regexp = new RegExp(pwdRegex);
          if (pwdRegex && !regexp.test(p.newPassword)) {
            throw createChangePasswordError('change password', I18n.get('auth-changepassword-error-regex'));
          } else {
            throw createChangePasswordError('change password', I18n.get('auth-changepassword-error-fields'));
          }
        }
      }
    } catch (e) {
      if ((e as IChangePasswordError).name === 'ECHANGEPWD') throw e;
      else
        throw createChangePasswordError(
          'change password',
          I18n.get('auth-changepassword-error-submit'),
          undefined,
          e instanceof global.Error ? e : undefined,
        );
    }

    try {
      // 4 === Login back to get renewed token
      const credentials: AuthCredentials = {
        username: p.login,
        password: p.newPassword,
      };
      await dispatch(loginCredentialsAction(reduxActions, platform, credentials));
    } catch (e) {
      dispatch(reduxActions.redirectCancel(platform.name, p.login));
      throw e;
    }
  };
}

export const changePasswordActionAddFirstAccount = (
  platform: Platform,
  p: IChangePasswordPayload,
  forceChange?: boolean,
  rememberMe?: boolean,
) => changePasswordAction(getLoginFunctions.addFirstAccount(), platform, p, forceChange, rememberMe);

export const changePasswordActionReplaceAccount = (
  accountId: keyof IAuthState['accounts'],
  timestamp: number,
  platform: Platform,
  p: IChangePasswordPayload,
  forceChange?: boolean,
  rememberMe?: boolean,
) => changePasswordAction(getLoginFunctions.replaceAccount(accountId, timestamp), platform, p, forceChange, rememberMe);

export const buildChangePasswordActionReplaceAccount =
  (accountId: keyof IAuthState['accounts'], timestamp: number) =>
  (platform: Platform, p: IChangePasswordPayload, forceChange?: boolean, rememberMe?: boolean) =>
    changePasswordAction(getLoginFunctions.replaceAccount(accountId, timestamp), platform, p, forceChange, rememberMe);

export const buildLoginFederationActionReplaceAccount =
  (accountId: keyof IAuthState['accounts'], timestamp: number) =>
  (platform: Platform, credentials: AuthFederationCredentials, key?: number) =>
    loginFederationAction(getLoginFunctions.replaceAccount(accountId, timestamp), platform, credentials, key);

export const changePasswordActionAddAnotherAccount = (
  platform: Platform,
  p: IChangePasswordPayload,
  forceChange?: boolean,
  rememberMe?: boolean,
) => changePasswordAction(getLoginFunctions.addAnotherAccount(), platform, p, forceChange, rememberMe);
