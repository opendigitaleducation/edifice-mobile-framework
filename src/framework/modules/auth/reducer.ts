import { IGlobalState, Reducers, getStore } from '~/app/store';
import { AudienceValidReactionTypes } from '~/framework/modules/audience/types';
import {
  ANONYMOUS_ACCOUNT_ID,
  AccountType,
  AuthActiveAccount,
  AuthLoggedAccount,
  AuthLoggedAccountMap,
  AuthMixedAccountMap,
  AuthPendingRedirection,
  AuthRequirement,
  AuthSavedLoggedInAccount,
  AuthTokenSet,
  LegalUrls,
  PlatformAuthContext,
  accountIsActive,
  getSerializedLoggedInAccountInfo,
  getSerializedLoggedOutAccountInfo,
} from '~/framework/modules/auth/model';
import moduleConfig from '~/framework/modules/auth/module-config';
import { Platform } from '~/framework/util/appConf';
import createReducer from '~/framework/util/redux/reducerFactory';

import type { AuthStorageData } from './storage';

export interface AuthPendingRestore {
  redirect: undefined;
  account?: keyof IAuthState['accounts']; // If it concerns a saved account, which one
  platform: string; // Platform id of the login task (duplicated the value in `account` if present)
  loginUsed?: string; // Login to display if account is not defined
}

export interface AuthPendingActivation {
  redirect: AuthPendingRedirection.ACTIVATE;
  platform: string;
  loginUsed: string;
  code: string;
}

export interface AuthPendingPasswordRenew {
  redirect: AuthPendingRedirection.RENEW_PASSWORD;
  platform: string;
  loginUsed: string;
  code: string;
  accountId?: keyof IAuthState['accounts']; // If it concerns a saved account, which one
  accountTimestamp?: number;
}

export interface IAuthState {
  accounts: AuthMixedAccountMap; // account list with populated info
  connected?: keyof IAuthState['accounts']; // Currently logged user if so
  requirement?: AuthRequirement; // Requirement for the current account
  lastDeletedAccount?: keyof IAuthState['accounts']; // Last account was deleted
  showOnboarding: AuthStorageData['show-onboarding'];
  platformContexts: Record<string, PlatformAuthContext>; // Platform contexts by pf name
  platformLegalUrls: Record<string, LegalUrls>; // Platform legal urls by pf name
  validReactionTypes: string[]; // Valid reaction types for audience

  pending?: AuthPendingRestore | AuthPendingActivation | AuthPendingPasswordRenew;
  pendingAddAccount?: AuthPendingRestore | AuthPendingActivation | AuthPendingPasswordRenew;

  error?: {
    // No need to affiliate the error to a platform since the `key` contains the render ID on the screen
    key?: number;
    info: Error;
  };

  deviceInfo: {
    uniqueId?: string;
  };

  lastAddAccount: number;
}

// Initial state
export const initialState: IAuthState = {
  accounts: {},
  showOnboarding: true,
  platformContexts: {},
  platformLegalUrls: {},
  validReactionTypes: [],
  deviceInfo: {},
  lastAddAccount: 0,
};

// Actions definitions
export const actionTypes = {
  authInit: moduleConfig.namespaceActionType('INIT'),
  loadPfContext: moduleConfig.namespaceActionType('LOAD_PF_CONTEXT'),
  loadPfLegalUrls: moduleConfig.namespaceActionType('LOAD_PF_LEGAL_URLS'),
  loadPfValidReactionTypes: moduleConfig.namespaceActionType('LOAD_PF_VALID_REACTION_TYPES'),
  addAccount: moduleConfig.namespaceActionType('ADD_ACCOUNT'),
  addAccountRequirement: moduleConfig.namespaceActionType('ADD_ACCOUNT_REQUIREMENT'),
  removeAccount: moduleConfig.namespaceActionType('REMOVE_ACCOUNT'),
  replaceAccount: moduleConfig.namespaceActionType('REPLACE_ACCOUNT'),
  replaceAccountRequirement: moduleConfig.namespaceActionType('REPLACE_ACCOUNT_REQUIREMENT'),
  updateRequirement: moduleConfig.namespaceActionType('UPDATE_REQUIREMENT'),
  refreshToken: moduleConfig.namespaceActionType('REFRESH_TOKEN'),
  setQueryParamToken: moduleConfig.namespaceActionType('SET_QUERY_PARAM_TOKEN'),
  setOneSessionId: moduleConfig.namespaceActionType('SET_ONE_SESSION_ID'),
  authError: moduleConfig.namespaceActionType('AUTH_ERROR'),
  logout: moduleConfig.namespaceActionType('LOGOUT'),
  deactivate: moduleConfig.namespaceActionType('DEACTIVATE'),
  redirectActivation: moduleConfig.namespaceActionType('REDIRECT_ACTIVATION'),
  redirectPasswordRenew: moduleConfig.namespaceActionType('REDIRECT_PASSWORD_RENEW'),
  redirectCancel: moduleConfig.namespaceActionType('REDIRECT_CANCEL'),
  addAccountInit: moduleConfig.namespaceActionType('ADD_ACCOUNT_INIT'),
  addAccountActivation: moduleConfig.namespaceActionType('ADD_ACCOUNT_ACTIVATION'),
  addAccountPasswordRenew: moduleConfig.namespaceActionType('ADD_ACCOUNT_PASSWORD_RENEW'),
  addAccountRedirectCancel: moduleConfig.namespaceActionType('ADD_ACCOUNT_REDIRECT_CANCEL'),
  profileUpdate: moduleConfig.namespaceActionType('PROFILE_UPDATE'),
  invalidate: moduleConfig.namespaceActionType('INVALIDATE'),
};

export const ERASE_ALL_ACCOUNTS = Symbol('ERASE_ALL_ACCOUNTS');

export interface ActionPayloads {
  authInit: Pick<AuthStorageData, 'accounts' | 'startup'> & {
    deviceId: IAuthState['deviceInfo']['uniqueId'];
    showOnboarding: AuthStorageData['show-onboarding'];
  };
  loadPfContext: { name: Platform['name']; context: PlatformAuthContext };
  loadPfLegalUrls: { name: Platform['name']; legalUrls: LegalUrls };
  loadPfValidReactionTypes: { validReactionTypes: AudienceValidReactionTypes };
  addAccount: { account: AuthLoggedAccount };
  addAccountRequirement: { account: AuthLoggedAccount; requirement: AuthRequirement; context: PlatformAuthContext };
  removeAccount: { id: keyof IAuthState['accounts'] };
  replaceAccount: { id: keyof IAuthState['accounts'] | typeof ERASE_ALL_ACCOUNTS; account: AuthLoggedAccount };
  replaceAccountRequirement: {
    id: keyof IAuthState['accounts'] | typeof ERASE_ALL_ACCOUNTS;
    account: AuthLoggedAccount;
    requirement: AuthRequirement;
    context: PlatformAuthContext;
  };
  updateRequirement: { requirement: AuthRequirement; account: AuthLoggedAccount; context?: PlatformAuthContext };
  refreshToken: { id: keyof IAuthState['accounts']; tokens: AuthTokenSet };
  setQueryParamToken: { id: keyof IAuthState['accounts']; token: AuthTokenSet['queryParam'] };
  setOneSessionId: { id: keyof IAuthState['accounts']; token: AuthTokenSet['oneSessionId'] };
  authError: {
    account: keyof IAuthState['accounts'];
    error: NonNullable<Required<IAuthState['error']>>;
  };
  logout: object;
  deactivate: object;
  redirectActivation: { platformName: Platform['name']; login: string; code: string };
  redirectPasswordRenew: {
    platformName: Platform['name'];
    login: string;
    code: string;
    accountId?: keyof IAuthState['accounts'];
    accountTimestamp?: number;
  };
  redirectCancel: {
    platformName: Platform['name'];
    login: string;
    accountId?: keyof IAuthState['accounts'];
    accountTimestamp?: number;
  };
  addAccountInit: object;
  addAccountActivation: { platformName: Platform['name']; login: string; code: string };
  addAccountPasswordRenew: { platformName: Platform['name']; login: string; code: string };
  addAccountRedirectCancel: {
    platformName: Platform['name'];
    login: string;
  };
  profileUpdate: { id: keyof IAuthState['accounts']; user: Partial<AuthLoggedAccount['user']> };
  invalidate: object;
}

export const actions = {
  authInit: (
    startup: AuthStorageData['startup'],
    accounts: AuthStorageData['accounts'],
    showOnboarding: AuthStorageData['show-onboarding'],
    deviceId: IAuthState['deviceInfo']['uniqueId'],
  ) => ({ type: actionTypes.authInit, startup, accounts, showOnboarding, deviceId }),

  loadPfContext: (name: Platform['name'], context: PlatformAuthContext) => ({ type: actionTypes.loadPfContext, name, context }),

  loadPfLegalUrls: (name: Platform['name'], legalUrls: LegalUrls) => ({ type: actionTypes.loadPfLegalUrls, name, legalUrls }),

  loadPfValidReactionTypes: (validReactionTypes: AudienceValidReactionTypes) => ({
    type: actionTypes.loadPfValidReactionTypes,
    validReactionTypes,
  }),

  addAccount: (account: AuthLoggedAccount) => ({
    type: actionTypes.addAccount,
    account,
  }),

  addAccountRequirement: (account: AuthLoggedAccount, requirement: AuthRequirement, context: PlatformAuthContext) => ({
    type: actionTypes.addAccountRequirement,
    account,
    requirement,
    context,
  }),

  removeAccount: (id: keyof IAuthState['accounts']) => ({
    type: actionTypes.removeAccount,
    id,
  }),

  replaceAccount: (id: string | typeof ERASE_ALL_ACCOUNTS, account: AuthLoggedAccount) => ({
    type: actionTypes.replaceAccount,
    id,
    account,
  }),

  replaceAccountRequirement: (
    id: string | typeof ERASE_ALL_ACCOUNTS,
    account: AuthLoggedAccount,
    requirement: AuthRequirement,
    context: PlatformAuthContext,
  ) => ({
    type: actionTypes.replaceAccountRequirement,
    id,
    account,
    requirement,
    context,
  }),
  updateRequirement: (requirement: AuthRequirement | undefined, account: AuthLoggedAccount, context?: PlatformAuthContext) => ({
    type: actionTypes.updateRequirement,
    requirement,
    account,
    context,
  }),

  refreshToken: (id: string, tokens: AuthTokenSet) => ({
    type: actionTypes.refreshToken,
    id,
    tokens,
  }),

  setQueryParamToken: (id: string, token: AuthTokenSet['queryParam']) => ({
    type: actionTypes.setQueryParamToken,
    id,
    token,
  }),

  setOneSessionId: (id: string, token: AuthTokenSet['oneSessionId']) => ({
    type: actionTypes.setOneSessionId,
    id,
    token,
  }),

  authError: (error: NonNullable<IAuthState['error']>, account?: string) => ({
    type: actionTypes.authError,
    account,
    error,
  }),

  logout: () => ({
    type: actionTypes.logout,
  }),

  deactivate: () => ({
    type: actionTypes.deactivate,
  }),

  redirectActivation: (platformName: Platform['name'], login: string, code: string) => ({
    type: actionTypes.redirectActivation,
    platformName,
    login,
    code,
  }),

  redirectPasswordRenew: (
    platformName: Platform['name'],
    login: string,
    code: string,
    accountId?: keyof IAuthState['accounts'],
    accountTimestamp?: number,
  ) => ({
    type: actionTypes.redirectPasswordRenew,
    platformName,
    login,
    code,
    accountId,
    accountTimestamp,
  }),

  redirectCancel: (
    platformName: Platform['name'],
    login: string,
    accountId?: keyof IAuthState['accounts'],
    accountTimestamp?: number,
  ) => ({
    type: actionTypes.redirectCancel,
    platformName,
    login,
    accountId,
    accountTimestamp,
  }),

  profileUpdate: (id: string, user: Partial<AuthLoggedAccount['user']>) => ({
    type: actionTypes.profileUpdate,
    id,
    user,
  }),

  addAccountInit: () => ({
    type: actionTypes.addAccountInit,
  }),

  addAccountActivation: (platformName: Platform['name'], login: string, code: string) => ({
    type: actionTypes.addAccountActivation,
    platformName,
    login,
    code,
  }),

  addAccountPasswordRenew: (
    platformName: Platform['name'],
    login: string,
    code: string,
    accountId?: keyof IAuthState['accounts'],
    accountTimestamp?: number,
  ) => ({
    type: actionTypes.addAccountPasswordRenew,
    platformName,
    login,
    code,
    accountId,
    accountTimestamp,
  }),

  addAccountRedirectCancel: (platformName: Platform['name'], login: string) => ({
    type: actionTypes.addAccountRedirectCancel,
    platformName,
    login,
  }),

  invalidate: () => ({
    type: actionTypes.invalidate,
  }),
};

const reducer = createReducer(initialState, {
  [actionTypes.authInit]: (state, action) => {
    const { accounts, startup, showOnboarding, deviceId } = action as unknown as ActionPayloads['authInit'];
    let realAccounts = { ...accounts };
    const pending: AuthPendingRestore | undefined = startup.platform
      ? { platform: startup.platform, redirect: undefined }
      : undefined;
    if (pending && startup.account) {
      (pending as AuthPendingRestore).account = startup.account;
    }
    if (pending && startup.anonymousToken) {
      (pending as AuthPendingRestore).account = ANONYMOUS_ACCOUNT_ID;
      realAccounts = {
        ...realAccounts,
        [ANONYMOUS_ACCOUNT_ID]: {
          platform: pending.platform,
          method: undefined,
          user: { displayName: '', id: ANONYMOUS_ACCOUNT_ID, loginUsed: '', type: AccountType.Guest },
          tokens: {
            access: {
              type: startup.anonymousToken.token_type as 'Bearer',
              value: startup.anonymousToken.access_token,
              expiresAt: startup.anonymousToken.expires_at.toString(),
            },
            refresh: {
              value: startup.anonymousToken.refresh_token,
            },
            scope: startup.anonymousToken.scope.split(' '),
          },
          addTimestamp: 0,
        },
      };
    }
    return {
      ...initialState,
      accounts: realAccounts,
      showOnboarding,
      pending,
      deviceInfo: { ...state.deviceInfo, uniqueId: deviceId },
    };
  },

  [actionTypes.loadPfContext]: (state, action) => {
    const { name, context } = action as unknown as ActionPayloads['loadPfContext'];
    return { ...state, platformContexts: { ...state.platformContexts, [name]: context } };
  },

  [actionTypes.loadPfLegalUrls]: (state, action) => {
    const { name, legalUrls } = action as unknown as ActionPayloads['loadPfLegalUrls'];
    return { ...state, platformLegalUrls: { ...state.platformLegalUrls, [name]: legalUrls } };
  },

  [actionTypes.loadPfValidReactionTypes]: (state, action) => {
    const { validReactionTypes } = action as unknown as ActionPayloads['loadPfValidReactionTypes'];
    return { ...state, validReactionTypes: validReactionTypes['reaction-types'] };
  },

  [actionTypes.addAccount]: (state, action) => {
    const { account } = action as unknown as ActionPayloads['addAccount'];
    return {
      ...state,
      accounts: { ...state.accounts, [account.user.id]: account },
      connected: account.user.id,
      showOnboarding: false,
      requirement: undefined,
      lastAddAccount: Date.now(),
    };
  },

  [actionTypes.addAccountRequirement]: (state, action) => {
    const { account, requirement, context } = action as unknown as ActionPayloads['addAccountRequirement'];
    return {
      ...state,
      accounts: { ...state.accounts, [account.user.id]: account },
      connected: account.user.id,
      showOnboarding: false,
      requirement,
      platformContexts: { ...state.platformContexts, [account.platform.name]: context },
      lastAddAccount: Date.now(),
    };
  },

  [actionTypes.removeAccount]: (state, action) => {
    const { id } = action as unknown as ActionPayloads['removeAccount'];
    const newAccounts = { ...state.accounts };
    delete newAccounts[id];
    return {
      ...state,
      accounts: newAccounts,
      lastDeletedAccount: id,
      requirement: undefined,
    };
  },

  [actionTypes.replaceAccount]: (state, action) => {
    const { id, account } = action as unknown as ActionPayloads['replaceAccount'];
    const newAccounts = id === ERASE_ALL_ACCOUNTS ? {} : { ...state.accounts };
    if (id !== ERASE_ALL_ACCOUNTS) delete newAccounts[id];
    return {
      ...state,
      accounts: { ...newAccounts, [account.user.id]: account },
      connected: account.user.id,
      showOnboarding: false,
      requirement: undefined,
    };
  },

  [actionTypes.replaceAccountRequirement]: (state, action) => {
    const { id, account, requirement, context } = action as unknown as ActionPayloads['replaceAccountRequirement'];
    const newAccounts = id === ERASE_ALL_ACCOUNTS ? {} : { ...state.accounts };
    if (id !== ERASE_ALL_ACCOUNTS) delete newAccounts[id];
    return {
      ...state,
      accounts: { ...newAccounts, [account.user.id]: account },
      connected: account.user.id,
      showOnboarding: false,
      requirement,
      platformContexts: { ...state.platformContexts, [account.platform.name]: context },
    };
  },

  [actionTypes.updateRequirement]: (state, action) => {
    if (!state.connected) return state;
    const { requirement, context, account } = action as unknown as ActionPayloads['updateRequirement'];
    const id = account.user.id;
    if (context)
      return {
        ...state,
        accounts: { ...state.accounts, [id]: account },
        requirement,
        platformContexts: { ...state.platformContexts, [account.platform.name]: context },
      };
    else return { ...state, accounts: { ...state.accounts, [id]: account }, requirement };
  },

  [actionTypes.refreshToken]: (state, action) => {
    const { id, tokens } = action as unknown as ActionPayloads['refreshToken'];
    return { ...state, accounts: { ...state.accounts, [id]: { ...state.accounts[id], tokens } } };
  },

  [actionTypes.setQueryParamToken]: (state, action) => {
    const { id, token } = action as unknown as ActionPayloads['setQueryParamToken'];
    const tokens = (state.accounts[id] as Partial<AuthActiveAccount | AuthSavedLoggedInAccount>).tokens
      ? { ...(state.accounts[id] as AuthActiveAccount | AuthSavedLoggedInAccount).tokens, queryParam: token }
      : undefined;
    return tokens
      ? {
          ...state,
          accounts: {
            ...state.accounts,
            [id]: { ...state.accounts[id], tokens },
          },
        }
      : state;
  },

  [actionTypes.setOneSessionId]: (state, action) => {
    const { id, token } = action as unknown as ActionPayloads['setOneSessionId'];
    const tokens = (state.accounts[id] as Partial<AuthActiveAccount | AuthSavedLoggedInAccount>).tokens
      ? { ...(state.accounts[id] as AuthActiveAccount | AuthSavedLoggedInAccount).tokens, oneSessionId: token }
      : undefined;
    return tokens
      ? {
          ...state,
          accounts: {
            ...state.accounts,
            [id]: { ...state.accounts[id], tokens },
          },
        }
      : state;
  },

  [actionTypes.authError]: (state, action) => {
    const { error } = action as unknown as ActionPayloads['authError'];
    return {
      ...state,
      error,
      // connected: undefined, // This is a test : a priori, there is no need to erase this field as it will be undefined before any login task
    };
  },

  [actionTypes.logout]: (state, action) => {
    const currentAccount = (state.connected ? state.accounts[state.connected] : undefined) as AuthLoggedAccount | undefined;
    if (!currentAccount) return state;
    return {
      ...state,
      accounts: { ...state.accounts, [currentAccount.user.id]: getSerializedLoggedOutAccountInfo(currentAccount) },
      requirement: undefined,
      connected: undefined,
      pending: undefined,
      error: undefined,
      lastDeletedAccount: undefined,
    };
  },

  [actionTypes.deactivate]: (state, action) => {
    const currentAccount = (state.connected ? state.accounts[state.connected] : undefined) as AuthLoggedAccount | undefined;
    if (!currentAccount) return state;
    return {
      ...state,
      accounts: { ...state.accounts, [currentAccount.user.id]: getSerializedLoggedInAccountInfo(currentAccount) },
      requirement: undefined,
      connected: undefined,
      pending: undefined,
      error: undefined,
      lastDeletedAccount: undefined,
    };
  },

  [actionTypes.redirectActivation]: (state, action) => {
    const { platformName, login, code } = action as unknown as ActionPayloads['redirectActivation'];
    return {
      ...state,
      requirement: undefined,
      connected: undefined,
      error: undefined,
      pending: {
        redirect: AuthPendingRedirection.ACTIVATE as const,
        platform: platformName,
        loginUsed: login,
        code,
      },
    };
  },

  [actionTypes.redirectPasswordRenew]: (state, action) => {
    const { platformName, login, code, accountId, accountTimestamp } = action as unknown as ActionPayloads['redirectPasswordRenew'];
    return {
      ...state,
      requirement: undefined,
      connected: undefined,
      error: undefined,
      pending: {
        redirect: AuthPendingRedirection.RENEW_PASSWORD as const,
        platform: platformName,
        loginUsed: login,
        code,
        accountId,
        accountTimestamp,
      },
    };
  },

  [actionTypes.redirectCancel]: (state, action) => {
    const { platformName, login, accountId, accountTimestamp } = action as unknown as ActionPayloads['redirectCancel'];
    return {
      ...state,
      requirement: undefined,
      connected: undefined,
      pending: {
        redirect: undefined,
        platform: platformName,
        loginUsed: login,
        accountId,
        accountTimestamp,
      },
    };
  },

  [actionTypes.profileUpdate]: (state, action) => {
    const { id, user } = action as unknown as ActionPayloads['profileUpdate'];
    const account = state.accounts[id] as AuthActiveAccount;
    if (!account || !accountIsActive(account)) return state;
    const newAccount = { ...account, user: { ...account.user, ...user } } as AuthActiveAccount;
    return { ...state, accounts: { ...state.accounts, [id]: newAccount } };
  },

  [actionTypes.addAccountInit]: (state, action) => {
    return { ...state, pendingAddAccount: undefined, error: undefined };
  },

  [actionTypes.addAccountActivation]: (state, action) => {
    const { platformName, login, code } = action as unknown as ActionPayloads['redirectActivation'];
    return {
      ...state,
      requirement: undefined,
      error: undefined,
      pendingAddAccount: {
        redirect: AuthPendingRedirection.ACTIVATE as const,
        platform: platformName,
        loginUsed: login,
        code,
      },
    };
  },

  [actionTypes.addAccountPasswordRenew]: (state, action) => {
    const { platformName, login, code, accountId, accountTimestamp } = action as unknown as ActionPayloads['redirectPasswordRenew'];
    return {
      ...state,
      requirement: undefined,
      error: undefined,
      pendingAddAccount: {
        redirect: AuthPendingRedirection.RENEW_PASSWORD as const,
        platform: platformName,
        loginUsed: login,
        code,
        accountId,
        accountTimestamp,
      },
    };
  },

  [actionTypes.addAccountRedirectCancel]: (state, action) => {
    const { platformName, login } = action as unknown as ActionPayloads['addAccountRedirectCancel'];
    return {
      ...state,
      requirement: undefined,
      pendingAddAccount: {
        redirect: undefined,
        platform: platformName,
        loginUsed: login,
      },
    };
  },

  [actionTypes.invalidate]: (state, action) => {
    const currentAccount = (state.connected ? state.accounts[state.connected] : undefined) as AuthLoggedAccount | undefined;
    if (!currentAccount) return state;
    return {
      ...state,
      accounts: { ...state.accounts, [currentAccount.user.id]: getSerializedLoggedOutAccountInfo(currentAccount) },
      requirement: undefined,
      connected: undefined,
      pending: { redirect: undefined, account: currentAccount.user.id, platform: currentAccount.platform.name },
      lastDeletedAccount: undefined,
    };
  },
});

Reducers.register(moduleConfig.reducerName, reducer);

export const getState = (state: IGlobalState) => state[moduleConfig.reducerName] as IAuthState;

/**
 * Get the current active session from Redux state.
 * This is the recommended way to get the session in a component.
 * Though `assertSession` should work, `getSession` does NOT throw exceptions, and return undefined instead,
 * letting you deal with the undefined value as you wish.
 * @returns the active session present in redux state. Can be undefined.
 */
export function getSession() {
  const state = getState(getStore().getState());
  return state.connected ? (state.accounts as AuthLoggedAccountMap)[state.connected] : undefined;
}

export function getPlatform() {
  return getSession()?.platform;
}

/**
 * get the platform context of the authentified user.
 */
export function getPlatformContext() {
  const state = getState(getStore().getState());
  const session = getSession();
  return session ? state.platformContexts[session.platform.name] : undefined;
}

/**
 * get the platform context of the given platform
 */
export function getPlatformContextOf(platform?: Platform) {
  const state = getState(getStore().getState());
  return platform ? state.platformContexts[platform.name] : undefined;
}

export function getPlatformLegalUrls() {
  const state = getState(getStore().getState());
  const session = getSession();
  return session ? state.platformLegalUrls[session.platform.name] : undefined;
}

export function getPlatformLegalUrlsOf(platform?: Platform) {
  const state = getState(getStore().getState());
  return platform ? state.platformLegalUrls[platform.name] : undefined;
}

export function getValidReactionTypes() {
  const state = getState(getStore().getState());
  return state.validReactionTypes;
}

export function getAccountsNumber() {
  const state = getState(getStore().getState());
  return Object.keys(state.accounts).length;
}

export function getAccounts() {
  const state = getState(getStore().getState());
  return Object.values(state.accounts);
}

export function getAccountById(id?: keyof IAuthState['accounts']) {
  const state = getState(getStore().getState());
  return id ? state.accounts[id] : undefined;
}

/**
 * Gets the currently stored query param token. Do NOT refresh it if expired.
 * Please use `getQueryParamToken` in `oauth.ts` instead.
 * @returns
 */
export function getCurrentQueryParamToken() {
  return getSession()?.tokens.queryParam;
}

/**
 * Get the current active session.
 * This IS NOT the recommended way to get the session information.
 * - In a component, use the below `getSession`
 * - In an action/thunk, use this only if you call your action with tryAction/callAction. Else, use the below `getSession`
 * - In a utility function, use this assertion.
 * Caution : this is an "assert" function. If session not present, this function will throw an error.
 * @returns the current session
 * @throws Error
 */
export function assertSession() {
  const session = getSession();
  if (!session) throw new Error('[assertSession] no session');
  return session;
}

export default reducer;
