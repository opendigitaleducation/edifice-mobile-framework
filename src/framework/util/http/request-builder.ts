import CookieManager from '@react-native-cookies/cookies';
import DeviceInfo from 'react-native-device-info';

import { FetchError, FetchErrorCode, HTTPError } from './error';

import { AuthActiveAccount, AuthSavedLoggedInAccount } from '~/framework/modules/auth/model';
import { getDeviceId } from '~/framework/modules/auth/reducer';
import appConf, { Platform } from '~/framework/util/appConf';
import { Error } from '~/framework/util/error';

export class RequestBuilder {
  /**
   * Formats a given URL for a specific platform.
   *
   * @param url - The URL to be formatted. It can be a string or a URL object.
   * @param platform - The platform object containing the base URL.
   * @returns A new URL object formatted for the specified platform.
   */
  static formatUrlForPlatform(url: string | URL, platform?: Platform): URL {
    return new URL(url, platform?.url);
  }

  /**
   * Formats a given URL string and optionally appends the platform base URL oif given account.
   *
   * @param url - The URL string to be formatted.
   * @param account - An optional account object which may contain platform information.
   * @returns A new URL object constructed from the given URL string and the platform base URL if account is provided.
   */
  static formatUrlForAccount(url: string | URL, account: AuthSavedLoggedInAccount | AuthActiveAccount): URL {
    return RequestBuilder.formatUrlForPlatform(url, account?.platform ? appConf.getExpandedPlatform(account.platform) : undefined);
  }

  /**
   * Generates an authorization header for a given account.
   *
   * @param account - The account object which can be either `AuthSavedLoggedInAccount` or `AuthActiveAccount`.
   * @returns An object containing the authorization header with the access token type and value.
   */
  static generateAuthorizationHeaderForAccount(account: AuthSavedLoggedInAccount | AuthActiveAccount): RequestInit['headers'] {
    return { Authorization: `${account.tokens.access.type} ${account.tokens.access.value}` };
  }

  /**
   * Retrieves the HTTP method from the given request information.
   *
   * @param requestInfo - The request information, which can be an instance of `Request` or a URL string.
   * @param init - An optional `RequestInit` object containing custom settings to apply to the request.
   * @returns The HTTP method as a non-nullable string. If the method is not specified, defaults to 'GET'.
   */
  static getMethod(requestInfo: RequestInfo | URL, init?: RequestInit): NonNullable<Request['method']> {
    return requestInfo instanceof Request ? (requestInfo.method ?? init?.method) : (init?.method ?? 'GET');
  }

  /**
   * Retrieves the URL string from the given request information.
   *
   * @param requestInfo - The request information, which can be an instance of `Request` or a URL string.
   * @returns The URL string extracted from the request information
   */
  static getUrl(requestInfo: RequestInfo | URL): string {
    return requestInfo instanceof Request ? requestInfo.url : requestInfo.toString();
  }

  static defaultMethod: Request['method'] = 'GET';

  static defaultHeaders = {
    'X-APP': 'mobile',
    'X-APP-NAME': DeviceInfo.getApplicationName(),
    'X-APP-VERSION': DeviceInfo.getReadableVersion(),
  };

  private _url: URL | string;
  private _init?: RequestInit;

  constructor(method: string = RequestBuilder.defaultMethod, url: string | URL, init?: RequestInit) {
    const { headers = {}, ...restInit } = init ?? {};
    const deviceId = getDeviceId();
    this._url = url;
    this._init = {
      headers: {
        ...RequestBuilder.defaultHeaders,
        ...(deviceId ? { 'X-Device-Id': getDeviceId() } : {}),
        ...headers,
      },
      ...restInit,
      method,
    };
  }

  public withPlatform(platform: Platform): RequestBuilder {
    // Format the URL with the account platform base URL
    this._url = RequestBuilder.formatUrlForPlatform(this._url, platform);
    return this;
  }

  /**
   * Adds the account authorization information to the request.
   *
   * @param account - The account object containing authentication details.
   *                   It can be either an `AuthSavedLoggedInAccount` or an `AuthActiveAccount`.
   * @returns The updated `RequestBuilder` instance with the account authorization headers set.
   */
  public withAccount(account: AuthSavedLoggedInAccount | AuthActiveAccount): RequestBuilder {
    // Format the URL with the account platform base URL
    this._url = RequestBuilder.formatUrlForAccount(this._url, account);

    // Put the authrozation header in the request
    this._init = {
      ...this._init,
      headers: {
        ...this._init?.headers,
        Authorization: `${account.tokens.access.type} ${account.tokens.access.value}`,
      },
    };
    return this;
  }

  /**
   * Builds and returns a new `Request` object with the specified URL and initialization options.
   *
   * @returns {Request} A new `Request` object configured with the URL and initialization options.
   */
  public build(): Request {
    return new Request(typeof this._url === 'string' ? this._url : this._url.href, this._init);
  }
}

/**
 * Fetches a resource from the network while handling errors and clearing cookies.
 *
 * @param info - The resource that you wish to fetch. This can either be a string containing the URL of the resource, or a Request object.
 * @param init - An optional object containing any custom settings that you want to apply to the request.
 * @returns A promise that resolves to the Response object representing the response to the request.
 * @throws {FetchError} If there is a network error during the fetch operation.
 * @throws {HTTPError} If the response status is not ok (status is not in the range 200-299).
 */
const _performFetch = async (info: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // ToDo : Add client timeout support
  CookieManager.clearAll();
  let response: Response;
  try {
    response = await global.fetch(info, init);
  } catch (e) {
    throw new FetchError(
      FetchErrorCode.NETWORK_ERROR,
      `Failed to fetch resource: ${RequestBuilder.getMethod(info, init)} ${RequestBuilder.getUrl(info)}`,
      { cause: e },
    );
  }
  if (!response.ok) {
    throw new HTTPError(response);
  }
  return response;
};

const MAX_FETCH_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Wraps a fetch function with a timeout mechanism.
 *
 * @param fetchFn - The fetch function to be wrapped.
 * @returns A function that performs a fetch request with a timeout.
 *
 * @param info - The resource that you want to fetch.
 * @param init - An optional object containing any custom settings that you want to apply to the request.
 * @returns A Promise that resolves to the Response object representing the response to the request.
 *
 * @throws {Error} If the request times out, an AbortError is thrown.
 */
const _timeoutFetch =
  (fetchFn: typeof fetch) =>
  async (info: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAX_FETCH_TIMEOUT_MS);
    try {
      return await fetchFn(info, { ...init, signal: controller.signal });
    } catch (e) {
      const deepError = Error.getDeepError(e);
      if (deepError instanceof global.Error && deepError.name === 'AbortError') {
        throw new FetchError(FetchErrorCode.TIMEOUT, undefined, { cause: e });
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  };

const _realFetch = _timeoutFetch(_performFetch);

export const _fetch = async (info: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    return await _realFetch(info, init);
  } catch (e) {
    console.error(e instanceof global.Error ? e.constructor.name : 'Error', (e as Error.WithCode<unknown>).code, e);
    throw e;
  }
};

/**
 * Parses the JSON from a fetch response.
 *
 * @template ResponseType - The expected type of the parsed JSON response.
 * @param r - The fetch response object.
 * @returns A promise that resolves to the parsed JSON object.
 * @throws {FetchError} If there is a network error during the fetch operation of ir JSON parsing fails.
 * @throws {HTTPError} If the response status is not ok (status is not in the range 200-299).
 */
export const _parseJson = async <ResponseType>(r: Response) => {
  try {
    return (await r.json()) as Promise<ResponseType>;
  } catch (e) {
    const error = new FetchError(FetchErrorCode.PARSE_ERROR, 'Failed to parse response JSON', { cause: e });
    console.error(error, '\n', await r.clone().text());
    throw error;
  }
};
