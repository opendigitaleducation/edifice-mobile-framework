import { storage } from '~/framework/util/storage';

import { AuthLoggedAccount, AuthSavedAccount } from './model';
import moduleConfig from './module-config';

export interface AuthStorageData {
  accounts: Record<string, AuthSavedAccount>;
  startup: {
    account?: string;
    platform?: string;
  };
  'show-onboarding': boolean;
}

export const authStorage = storage
  .create<AuthStorageData>()
  .withModule(moduleConfig)
  .setAppInit(function () {})
  .setSessionInit(function (session) {});

export const readSavedAccounts = () => authStorage.getJSON('accounts') ?? {};
export const readSavedStartup = () => {
  let startup = authStorage.getJSON('startup');
  const oldCurrentPlatform = storage.global.getString('currentPlatform');
  if (!startup?.platform && oldCurrentPlatform) startup = { platform: oldCurrentPlatform };
  return { ...startup } as AuthStorageData['startup'];
};
export const readShowOnbording = () => authStorage.getBoolean('show-onboarding') ?? true;

/** Converts an actual logged account into a serialisable saved account information */
export const getSerializedLoggedOutAccountInfo = (account: AuthLoggedAccount) => {
  return {
    platform: account.platform.name,
    user: {
      displayName: account.user.displayName,
      id: account.user.id,
      loginUsed: account.user.loginUsed,
      type: account.user.type,
      avatar: account.user.avatar,
    },
  } as AuthSavedAccount;
};

/** Converts an actual logged account into a serialisable saved account information */
export const getSerializedLoggedInAccountInfo = (account: AuthLoggedAccount) => {
  return {
    ...getSerializedLoggedOutAccountInfo(account),
    tokens: account.tokens,
  } as AuthSavedAccount;
};

/**
 * Save in storage a single account, replacing the others already present.
 * @param account
 * @param showOnboarding
 */
export const writeSingleAccount = (account: AuthLoggedAccount, showOnboarding: boolean = false) => {
  const savedAccount = getSerializedLoggedInAccountInfo(account);
  const savedAccounts: Record<string, AuthSavedAccount> = {
    [account.user.id]: savedAccount,
  };
  const startup: AuthStorageData['startup'] = {
    platform: account.platform.name,
    account: account.user.id,
  };
  authStorage.setJSON('accounts', savedAccounts);
  authStorage.setJSON('startup', startup);
  authStorage.set('show-onboarding', showOnboarding);
};

/**
 * Update the given account information in the storage
 * @param account
 */
export const updateAccount = (savedAccount: AuthSavedAccount) => {
  const savedAccounts = readSavedAccounts();
  savedAccounts[savedAccount.user.id] = savedAccount;
  authStorage.setJSON('accounts', savedAccounts);
};

export const writeLogout = (account: AuthLoggedAccount) => {
  // Remove token for loegged out account
  const accounts = authStorage.getJSON('accounts');
  if (accounts) {
    const savedAccount = accounts[account.user.id];
    if (savedAccount) {
      savedAccount.tokens = undefined;
      accounts[account.user.id] = savedAccount;
    }
    authStorage.setJSON('accounts', accounts);
  }
  // Remove account id in startup object
  const newStartup = { platform: authStorage.getJSON('startup')?.platform, account: account.user.id };
  authStorage.setJSON('startup', newStartup);
};

/** read old auth values in storage */
// export const getLegagyAuthInformation = () => {
//   const currentPlatform = storage.global.getString('currentPlatform');
//   const tokenStr = storage.global.getString('token');
//   const token = tokenStr ? (JSON.parse(tokenStr) as IOAuthToken) : undefined;
//   return { currentPlatform, token };
// };
