/**
 * OAuth2 client for Ressource Owner Password Grant type flow.
 */
import CookieManager from '@react-native-cookies/cookies';
import { encode as btoa } from 'base-64';
import moment from 'moment';
import querystring from 'querystring';
import { ImageRequireSource, ImageURISource } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Source } from 'react-native-fast-image';

import { I18n } from '~/app/i18n';
import { getStore } from '~/app/store';
import type { AuthLoggedAccount, AuthSavedAccount, AuthTokenSet } from '~/framework/modules/auth/model';
import { getSerializedLoggedInAccountInfo } from '~/framework/modules/auth/model';
import {
  assertSession,
  actions as authActions,
  getCurrentQueryParamToken,
  getSession,
  getState,
} from '~/framework/modules/auth/reducer';
import { updateAccount } from '~/framework/modules/auth/storage';
import { Platform } from '~/framework/util/appConf';
import { Error } from '~/framework/util/error';
import { ModuleArray } from '~/framework/util/moduleTool';
import { isEmpty } from '~/framework/util/object';
import { OldStorageFunctions } from '~/framework/util/storage';

// This is a big hack to prevent circular dependencies. AllModules.tsx must not included from modules theirself.
export const AllModulesBackup = {
  value: undefined,
} as {
  value?: ModuleArray;
};

export interface IOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: Date;
  refresh_token: string;
  scope: string;
}

export interface IOAuthCustomToken {
  structureName: string;
  key: string;
}

export interface IOAuthQueryParamToken {
  token_type: 'QueryParam';
  access_token: string;
  expires_in: number;
  expires_at: Date;
}

export type OAuthCustomTokens = IOAuthCustomToken[];

export const sanitizeScope = (scopes: string[]) => (Array.isArray(scopes) ? scopes.join(' ').trim() : scopes || '');

export class OAuthClientInfo {
  clientId: string;

  clientSecret: string;

  scope: string[];

  constructor(clientId: string, clientSecret: string, scope: string[]) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scope = scope;
  }

  get scopeString(): string {
    return sanitizeScope(this.scope);
  }
}

export const uniqueId = () => {
  try {
    return getSession()?.user?.uniqueId ?? '';
  } catch {
    return '';
  }
};

export class OAuth2RessourceOwnerPasswordClient {
  /**
   * Common headers to all oauth2 flow requets
   */
  private static DEFAULT_HEADERS = {
    // tslint:disable-next-line:prettier
    Accept: 'application/json, application/x-www-form-urlencoded',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Device-Id': uniqueId,
  };

  /**
   * Current active oauth connection.
   */
  public static connection: OAuth2RessourceOwnerPasswordClient | null = null;

  private token: IOAuthToken | null = null; // Current active token information

  private clientInfo: OAuthClientInfo | null = null; // Current connected client information

  private accessTokenUri: string = ''; // Uri to get or refresh the token

  private uniqueSessionIdentifier: string | undefined;

  /**
   * Inialize a oAuth connection. DOES NOT get token.
   * NOTE : This module offers a global instance of this class that is configured to work with ODE's backend API.
   * Use it only to create a new connection.
   * @param accessTokenUri URL where to get oAuth tokens
   * @param clientId
   * @param clientSecret
   * @param scope Array of scopes names. Will be automatically flattened into a string, don't worry about that.
   */
  public constructor(accessTokenUri: string, clientId: string, clientSecret: string, scope: string[]) {
    this.accessTokenUri = accessTokenUri;
    this.clientInfo = new OAuthClientInfo(clientId, clientSecret, scope);
  }

  /**
   * Create a throwable authentication error object from the JSON response data or from custom data.
   * Use this returns always an error.
   * @param data
   */
  public authErrorFactory(body: { error: string; error_description?: any }): InstanceType<typeof Error.OAuth2Error>;
  public authErrorFactory(
    type: Error.ErrorTypes<typeof Error.OAuth2Error>,
    error: string,
    cause?: Error,
  ): InstanceType<typeof Error.OAuth2Error>;
  public authErrorFactory(
    bodyOrType: { error: string; error_description?: string } | Error.ErrorTypes<typeof Error.OAuth2Error>,
    error?: string,
    cause?: Error,
  ): InstanceType<typeof Error.OAuth2Error> {
    let type: Error.ErrorTypes<typeof Error.OAuth2Error> | undefined;

    if (bodyOrType && typeof bodyOrType === 'object' && Object.hasOwn(bodyOrType, 'error')) {
      if (bodyOrType.error === 'invalid_client') {
        type = Error.OAuth2ErrorType.OAUTH2_INVALID_CLIENT;
      } else if (bodyOrType.error === 'invalid_grant') {
        type = Error.OAuth2ErrorType.OAUTH2_INVALID_GRANT;
      } else if (bodyOrType.error === 'access_denied') {
        if (bodyOrType.error_description === 'auth.error.authenticationFailed') {
          type = Error.OAuth2ErrorType.CREDENTIALS_MISMATCH;
        } else if (bodyOrType.error_description === 'auth.error.blockedUser') {
          type = Error.OAuth2ErrorType.ACCOUNT_BLOCKED;
        } else if (bodyOrType.error_description === 'auth.error.blockedProfileType') {
          type = Error.OAuth2ErrorType.PLATFORM_BLOCKED_TYPE;
        } else if (bodyOrType.error_description === 'auth.error.global') {
          type = Error.OAuth2ErrorType.PLATFORM_UNAVAILABLE;
        } else if (bodyOrType.error_description === 'auth.error.ban') {
          type = Error.OAuth2ErrorType.SECURITY_TOO_MANY_TRIES;
        } else {
          type = Error.OAuth2ErrorType.UNKNOWN_DENIED;
        }
      } else if (bodyOrType.error === 'quota_overflow') {
        type = Error.OAuth2ErrorType.PLATFORM_TOO_LOAD;
      } else if (bodyOrType.error === 'multiple_vector_choice') {
        type = Error.OAuth2ErrorType.SAML_MULTIPLE_VECTOR;
        if (bodyOrType.error_description) {
          const vectors = JSON.parse(bodyOrType.error_description);
          return new Error.SamlMultipleVectorError(vectors, error, cause);
        } else return new Error.OAuth2Error(type ?? Error.FetchErrorType.BAD_RESPONSE, error, cause);
      }
    }
    return new Error.OAuth2Error(type ?? Error.FetchErrorType.BAD_RESPONSE, error, cause);
  }

  /**
   * Attempt to parse response body as JSON, fall back to parsing as a query string.
   *
   * @param body
   */
  private async parseResponseJSON(response: Response) {
    try {
      return await response.json();
    } catch (e) {
      throw new Error.FetchError(Error.FetchErrorType.BAD_RESPONSE, undefined, e as Error);
    }
  }

  /**
   * Create basic auth header.
   */
  private createAuthHeader(clientId: string, clientSecret: string): string {
    return 'Basic ' + btoa(clientId || '' + ':' + clientSecret || '');
  }

  /**
   * Sign a standardised request object with user authentication information.
   * To use with the standard fetch API, call `fetch(url, sign(init))`.
   */
  public static signRequestWithToken(token: IOAuthToken, requestInfo: RequestInfo, init?: RequestInit) {
    if (token.token_type.toLowerCase() === 'bearer') {
      const req = new Request(requestInfo, {
        ...init,
        headers: {
          ...init?.headers,
          'Accept-Language': I18n.getLanguage(),
          Authorization: 'Bearer ' + token.access_token,
          'X-APP': 'mobile',
          'X-APP-NAME': DeviceInfo.getApplicationName(),
          'X-APP-VERSION': DeviceInfo.getReadableVersion(),
          'X-Device-Id': uniqueId(),
        },
      });
      return req;
    } else {
      throw new Error.FetchError(
        Error.FetchErrorType.NOT_AUTHENTICATED,
        'EAUTH: Only Bearer token type supported. Given ' + token.token_type,
      );
    }
  }

  public signRequest(requestInfo: RequestInfo, init?: RequestInit) {
    if (!this.hasToken) {
      throw new Error.FetchError(
        Error.FetchErrorType.NOT_AUTHENTICATED,
        'EAUTH: Unable to sign request without active access token.',
      );
    }

    return OAuth2RessourceOwnerPasswordClient.signRequestWithToken(this.token!, requestInfo, init);
  }

  /**
   * Perform a fetch request specially for auth requests.
   * This checks EAUTH and HTTP errors and parses the response as a JSON object.
   * @param url
   * @param options
   */
  private async request(url: string, options: any) {
    // 1: Initialize request
    const body = querystring.stringify(options.body);
    const query = querystring.stringify(options.query);
    if (query) {
      // 1.1: Append url query with the given one
      url += (url.indexOf('?') === -1 ? '?' : '&') + query;
    }
    // 2: Send request
    let response: Response;
    try {
      response = await fetch(url, {
        body,
        headers: options.headers,
        method: options.method,
      });
    } catch (err) {
      throw new Error.FetchError(Error.FetchErrorType.NETWORK_ERROR, undefined, { cause: err });
    } finally {
      CookieManager.clearAll();
    }
    // 3: Check HTTP Status
    if (!response.ok) {
      const errdata = await this.parseResponseJSON(response);
      throw this.authErrorFactory(errdata);
    }
    // 4: Parse reponse
    let data: any;
    try {
      data = await this.parseResponseJSON(response);
    } catch (err) {
      throw new Error.FetchError(Error.FetchErrorType.BAD_RESPONSE, undefined, { cause: err });
    }
    // 5: Check if response is error
    if (data?.error) {
      throw this.authErrorFactory(data);
    }
    // 6: OK
    return data;
  }

  /**
   * Get a fresh new access token with given grant  type and body parameters
   */
  private async getNewToken(grantType: string, parms: any, saveToken: boolean = true): Promise<IOAuthToken> {
    if (!this.clientInfo) {
      throw new Error.OAuth2Error(Error.OAuth2ErrorType.OAUTH2_MISSING_CLIENT);
    }
    // 1: Build request
    const body = {
      ...parms,
      client_id: this.clientInfo.clientId,
      client_secret: this.clientInfo.clientSecret,
      grant_type: grantType,
      scope: this.clientInfo.scopeString,
    };
    const headers = {
      ...OAuth2RessourceOwnerPasswordClient.DEFAULT_HEADERS,
      Authorization: this.createAuthHeader(this.clientInfo.clientId, this.clientInfo.clientSecret),
    };
    try {
      // 2: Call oAuth API
      const data = await this.request(this.accessTokenUri, {
        body,
        headers,
        method: 'POST',
      });
      // 3: Build token from data
      if (!Object.hasOwn(data, 'access_token')) {
        throw new Error.FetchError(Error.FetchErrorType.BAD_RESPONSE, 'no access_token returned');
      }
      this.token = {
        ...data,
        expires_at: OAuth2RessourceOwnerPasswordClient.getExpirationDate(data.expires_in),
      };
      this.generateUniqueSesionIdentifier();
      return this.token!;
    } catch (err) {
      const error = err as Error;
      error.message = '[oAuth] getToken failed: ' + error.message;
      throw error;
    }
  }

  /**
   * Get a fresh new access token with custom token
   */
  public async getNewTokenWithCustomToken(token: string, saveToken: boolean = true): Promise<IOAuthToken> {
    return this.getNewToken('custom_token', { custom_token: token }, saveToken);
  }

  /**
   * Get a fresh new access token with SAML Token
   */
  public async getNewTokenWithSAML(saml: string, saveToken: boolean = true): Promise<IOAuthToken | IOAuthCustomToken[]> {
    return this.getNewToken('saml2', { assertion: saml }, saveToken);
  }

  /**
   * Get a fresh new access token with owner credentials
   */
  public async getNewTokenWithUserAndPassword(username: string, password: string, saveToken: boolean = true): Promise<IOAuthToken> {
    return this.getNewToken('password', { username, password }, saveToken);
  }

  /**
   * @deprecated
   * @returns
   */
  public static async getStoredTokenStr(): Promise<IOAuthToken | undefined> {
    const rawStoredToken = await OldStorageFunctions.getItemJson('token');
    if (!rawStoredToken) {
      return undefined;
    }
    return rawStoredToken as IOAuthToken;
  }

  /**
   * @deprecated
   * Read stored token in local storage. No-op if no token is stored, return undefined.
   */
  public async loadToken(): Promise<IOAuthToken | undefined> {
    const storedToken = await OAuth2RessourceOwnerPasswordClient.getStoredTokenStr();
    if (!storedToken) {
      return undefined;
    }
    this.token = {
      ...storedToken,
      expires_at: new Date(storedToken.expires_at),
    };
    this.generateUniqueSesionIdentifier();
    return this.token!;
  }

  /**
   * @deprecated
   * Saves given token information in local storage.
   */
  public async saveToken() {
    await OldStorageFunctions.setItemJson('token', this.token);
  }

  /**
   * @deprecated
   * Remove given token information in local storage.
   */
  public async forgetToken() {
    await OldStorageFunctions.removeItem('token');
  }

  /**
   * Return a serialisable object representing the current tokens
   * @returns the boect representing the token to be stored somewhere.
   */
  public exportToken(): AuthTokenSet {
    if (!this.token) throw new Error.FetchError(Error.FetchErrorType.NOT_AUTHENTICATED, '[oAuth] exportToken : no token');
    return {
      access: { value: this.token.access_token, type: 'Bearer', expiresAt: this.token.expires_at.toString() },
      refresh: { value: this.token.refresh_token },
      scope: this.token.scope.split(' '),
    };
  }

  public static convertTokenToOldObjectSyntax(token: AuthTokenSet): IOAuthToken {
    return {
      access_token: token.access.value,
      expires_at: new Date(token.access.expiresAt),
      expires_in: 0,
      token_type: token.access.type,
      refresh_token: token.refresh.value,
      scope: token.scope.join(' '),
    };
  }

  public importToken(token: AuthTokenSet) {
    this.token = OAuth2RessourceOwnerPasswordClient.convertTokenToOldObjectSyntax(token);
    this.generateUniqueSesionIdentifier();
    return token;
  }

  public updateToken(userId: AuthSavedAccount['user']['id'], token: AuthTokenSet, useRedux?: boolean) {
    if (useRedux) getStore().dispatch(authActions.refreshToken(userId, token)); // Update redux
    let account = getState(getStore().getState()).accounts[userId]; // Get account in reducer
    if (typeof account.platform === 'object') {
      account = getSerializedLoggedInAccountInfo(account as AuthLoggedAccount); // Get saved accoutn info if it's logged account
    }
    updateAccount(account as AuthSavedAccount); // Update Storage
    this.importToken(token); // Update OAuth2 client
    return token;
  }

  /**
   * Refresh the user access token.
   */
  public async refreshToken(userId: AuthSavedAccount['user']['id'], updateRedux?: boolean): Promise<IOAuthToken> {
    if (!this.clientInfo) {
      throw new Error.OAuth2Error(Error.OAuth2ErrorType.OAUTH2_MISSING_CLIENT);
    }
    if (!this.token) {
      throw new Error.FetchError(Error.FetchErrorType.NOT_AUTHENTICATED, '[oAuth] refreshToken : no token');
    }
    if (!this.token.refresh_token) throw new Error.OAuth2Error(Error.OAuth2ErrorType.REFRESH_INVALID);

    // 1: Build request
    const body = {
      client_id: this.clientInfo.clientId,
      client_secret: this.clientInfo.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: this.token.refresh_token,
      scope: this.clientInfo.scopeString,
    };
    const headers = {
      ...OAuth2RessourceOwnerPasswordClient.DEFAULT_HEADERS,
      Authorization: this.createAuthHeader(this.clientInfo.clientId, this.clientInfo.clientSecret),
    };

    try {
      // 2: Call oAuth API to the get the new token
      const data = await this.request(this.accessTokenUri, {
        body,
        headers,
        method: 'POST',
      });
      if (!Object.hasOwn(data, 'access_token')) {
        throw new Error.FetchError(Error.FetchErrorType.BAD_RESPONSE, 'no access_token returned');
      }
      // 3: Construct the token with received data
      this.token = {
        ...this.token,
        ...data,
        expires_at: OAuth2RessourceOwnerPasswordClient.getExpirationDate(data.expires_in),
      };
      // Update stored token
      this.updateToken(userId, this.exportToken(), updateRedux);
      return this.token!;
    } catch (err) {
      console.error('[oAuth2] failed refresh token', err);
      throw err;
    }
  }

  /**
   * See if access token exists
   */
  get hasToken() {
    return this.token && this.token.access_token;
  }

  /**
   * Is stored token actually expired ?
   */
  public getIsTokenExpired() {
    if (!this.hasToken) throw new Error.FetchError(Error.FetchErrorType.NOT_AUTHENTICATED, 'getIsTokenExpired: no token');
    return new Date() > this.token!.expires_at;
  }

  /**
   * Returns time before expiring in milliseconds (date.getTime())
   */
  public getTokenExpiresIn() {
    if (!this.hasToken) throw new Error.FetchError(Error.FetchErrorType.NOT_AUTHENTICATED, 'getTokenExpiresIn: no token');
    return this.token!.expires_at.getTime() - Date.now();
  }

  /**
   * Generates a new expiration date from a number of seconds added to the now Date.
   * @param seconds
   */
  private static getExpirationDate(seconds: number) {
    const expin = new Date();
    expin.setSeconds(expin.getSeconds() + seconds);
    return expin;
  }

  private static getExpirationMoment(seconds: number) {
    return moment().add(seconds, 'seconds');
  }

  /**
   * Removes the token in this connection.
   * It will be also removed from local storage.
   * @deprecated
   */
  public async eraseToken() {
    await OldStorageFunctions.removeItem('token');
    await this.deleteQueryParamToken();
    this.token = null;
  }

  /**
   * Get unique identifier from token (the key is refreshed only when the token is modified).
   */
  public getUniqueSessionIdentifier() {
    return this.uniqueSessionIdentifier || this.generateUniqueSesionIdentifier();
  }

  public generateUniqueSesionIdentifier() {
    this.uniqueSessionIdentifier = Math.random().toString(36).substring(7);
    return this.uniqueSessionIdentifier;
  }

  /**
   * oneSessionId management (for rich editor)
   */
  private oneSessionId?: string = undefined;

  public async getOneSessionId() {
    try {
      // Clear cookies before calling token-as-cookie
      await CookieManager.clearAll();
      // Call token-as-cookie
      const request = this.signRequest(`${assertSession().platform.url}/auth/oauth2/token-as-cookie`, { method: 'POST' });
      const response = await fetch(request);
      const cookie = response.headers.get('set-cookie') || undefined;

      let newSessionId: string | undefined;
      // Continue if set-cookie header found
      // Otherwise, last oneSessionId will be returned
      if (!isEmpty(cookie)) {
        // Extract oneSessionId from set-cookie header
        const match = cookie!.match(/oneSessionId=([^;]+)/);
        // Update oneSessionId if found
        // Otherwise, last oneSessionId will be returned
        if (!isEmpty(match)) newSessionId = match![1];
      }
      if (newSessionId && this.oneSessionId !== newSessionId) {
        this.oneSessionId = newSessionId;
        console.debug(`New oneSessionId retrieved: ${this.oneSessionId}`);
        const session = assertSession();
        getStore().dispatch(authActions.setOneSessionId(session.user.id, { value: newSessionId }));
      }
    } catch (e) {
      // We leave the catch and returned value will be last oneSessionId
      console.error('Unable to retrieve oneSessionId => ', e);
    }
    return this.oneSessionId;
  }

  /**
   * QueryParam token management (for loginless redirection)
   */
  private static QUERY_PARAM_TOKEN_EXPIRATION_PADDING = 60;

  public async getQueryParamToken() {
    try {
      // We apply a 60secs padding to the duration of the token to ensure validitiy will not be expired during the process.
      const session = assertSession();
      const nowMomentWithPadding = moment().add(OAuth2RessourceOwnerPasswordClient.QUERY_PARAM_TOKEN_EXPIRATION_PADDING, 'seconds');
      let currentQueryParamToken = getCurrentQueryParamToken(); // Get current one from the store
      if (!currentQueryParamToken || nowMomentWithPadding.isAfter(moment(currentQueryParamToken.expiresAt))) {
        currentQueryParamToken = undefined;
        const url = `${session.platform.url}/auth/oauth2/token?type=queryparam`;
        const data = await this.request(url, {
          headers: urlSigner.getAuthHeader(),
        });
        currentQueryParamToken = {
          type: 'QueryParam',
          value: data.access_token,
          expiresAt: OAuth2RessourceOwnerPasswordClient.getExpirationMoment(data.expires_in).format(),
        };
        getStore().dispatch(authActions.setQueryParamToken(session.user.id, currentQueryParamToken));
      }
      return currentQueryParamToken?.value;
    } catch (e) {
      throw new global.Error('getQueryParamToken failed', { cause: e });
    }
  }

  public async deleteQueryParamToken() {
    const session = assertSession();
    getStore().dispatch(authActions.setQueryParamToken(session.user.id, undefined));
  }
}

/**
 * Scopes needed for the application.
 */
export const scopes = `infra
 actualites
 blog
 conversation
 directory
 homeworks
 schoolbook
 timeline
 userinfo
 workspace
 portal
 cas
 sso
 zimbra
 presences
 incidents
 competences
 diary
 viescolaire
 edt
 support`.split('\n '); // Here the space after "\n" is important, they represent the indentation & the space between the words when "\n" is removed.
// You can copy the string directly in the "scope" field in a browser. Keep this indentation intact.
export const createAppScopes = () => {
  return [...AllModulesBackup.value!.getScopes(), 'auth'];
};
export const createAppScopesLegacy = () => [...new Set([...createAppScopes(), ...scopes])];

///////
// URL Signer
// Ensure specified string url is absolute
///////

export const urlSigner = {
  /**
   * Prepend url with domain name if needed.
   * Uses the current platform as domain, but custom platform can be used as a second optional argument.
   */
  getAbsoluteUrl: (url?: string, pf?: Platform) => {
    if (!url) return undefined;
    if (url?.startsWith('workspace')) url = `/${url}`;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) {
      if (!pf) pf = assertSession().platform;
      return `${pf.url}${url}`;
    }
    return url;
  },

  /**
   * Remove domain, protocol & searchParams from url
   * @param absoluteUrl
   * @returns
   */
  getRelativeUrl: (absoluteUrl?: string) => {
    const pf = assertSession().platform;
    return absoluteUrl && absoluteUrl.replace(pf.url, '').split('?')[0];
  },

  /**
   * Returns if the given url need to be signed.
   * An url must be signed if it point to the current platform.
   * If the url contains a protocol identifier, it not be signed.
   */
  getIsUrlSignable: (absoluteUrl?: string) => {
    const pf = assertSession().platform;
    return absoluteUrl && (absoluteUrl.indexOf('://') === -1 || absoluteUrl.indexOf(pf.url) !== -1);
  },

  /**
   * Returns an empty signed request, just to get the authorisation header.
   * Caution: That request and its properties are read-only.
   */
  getDummySignedRequest: () => {
    if (!OAuth2RessourceOwnerPasswordClient.connection)
      throw new Error.FetchError(
        Error.FetchErrorType.NOT_AUTHENTICATED,
        '[oAuth2] urlSigner.getDummySignedRequest: no active token',
      );
    return OAuth2RessourceOwnerPasswordClient.connection.signRequest('<dummy request>');
  },

  /**
   * Returns an headers object containing only the authorisation header.
   * Caution: That header is read-only, use its just before sending the requests.
   */
  getAuthHeader: () => {
    const ret = { Authorization: urlSigner.getDummySignedRequest().headers.get('Authorization') };
    if (!ret.Authorization)
      throw new Error.FetchError(Error.FetchErrorType.NOT_AUTHENTICATED, '[oAuth2] urlSigner.getAuthHeader: empty auth header');
    return ret as { Authorization: string };
  },

  /**
   * Returns a signed request from an url or a request
   */
  signRequest: (requestInfo: RequestInfo) => {
    if (!OAuth2RessourceOwnerPasswordClient.connection)
      throw new Error.FetchError(Error.FetchErrorType.NOT_AUTHENTICATED, '[oAuth] signRequest: no token');

    if (requestInfo instanceof Request) {
      return urlSigner.getIsUrlSignable(requestInfo.url)
        ? OAuth2RessourceOwnerPasswordClient.connection.signRequest(requestInfo)
        : (requestInfo as RequestInfo);
    } else {
      /* requestInfo is string */
      return urlSigner.getIsUrlSignable(requestInfo)
        ? OAuth2RessourceOwnerPasswordClient.connection.signRequest(requestInfo)
        : (requestInfo as RequestInfo);
    }
  },

  /**
   * Returns a signed URISource from a url or an imageURISource.
   */
  signURISource: (
    URISource:
      | (ImageURISource & { isLocal?: boolean })
      | string
      | ImageRequireSource
      | (ImageURISource & { isLocal?: boolean })[]
      | (Source & { isLocal?: boolean })
      | undefined,
  ) => {
    if (URISource === undefined) return URISource;
    if (typeof URISource === 'number') return URISource;
    if (Array.isArray(URISource)) {
      return URISource.map(urlSigner.signURISource);
    }
    if (!OAuth2RessourceOwnerPasswordClient.connection)
      throw new Error.FetchError(Error.FetchErrorType.NOT_AUTHENTICATED, '[oAuth] signURISource: no token');

    if (typeof URISource === 'object') {
      if (!URISource.uri) throw new global.Error('[oAuth] signURISource: no uri');
      if (URISource.isLocal) return URISource;
      const absUri = urlSigner.getAbsoluteUrl(URISource.uri)!;
      if (urlSigner.getIsUrlSignable(absUri)) {
        return { ...URISource, uri: absUri, headers: { ...URISource.headers, ...urlSigner.getAuthHeader() } };
      } else {
        return { ...URISource, uri: absUri };
      }
    } else {
      /* URISource is string */
      const absUri = urlSigner.getAbsoluteUrl(URISource);
      if (urlSigner.getIsUrlSignable(absUri)) {
        return { uri: absUri, headers: urlSigner.getAuthHeader() };
      } else {
        return { uri: absUri };
      }
    }
  },

  /**
   * Returns a signed URISource from a url or an imageURISource for all items in the given array.
   * @param images
   */
  signURISourceArray: (URISources: { src: ImageURISource | string }[]) => {
    return URISources.map(URISource => ({ ...URISource, src: urlSigner.signURISource(URISource.src) }));
  },

  getSourceURIAsString(URISource: ImageURISource | string) {
    return typeof URISource === 'string' ? URISource : URISource.uri;
  },
};

export function initOAuth2(platform: Platform) {
  OAuth2RessourceOwnerPasswordClient.connection = new OAuth2RessourceOwnerPasswordClient(
    `${platform.url}/auth/oauth2/token`,
    platform.oauth.client_id,
    platform.oauth.client_secret,
    createAppScopesLegacy(),
  );
}

export function destroyOAuth2Legacy() {
  return OAuth2RessourceOwnerPasswordClient.connection?.eraseToken();
}
