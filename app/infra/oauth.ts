/**
 * OAuth2 client for Ressource OWner Credentials Grant type flow.
 */

import { encode as btoa } from "base-64";
import querystring from "querystring";
import { AsyncStorage } from "react-native";
import { Conf } from "../Conf";

export interface IOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: Date;
  refresh_token: string;
  scope: string;
}

class OAuth2RessourceOwnerClient {
  /**
   * Common headers to all oauth2 flow requets
   */
  private static DEFAULT_HEADERS = {
    // tslint:disable-next-line:prettier
    "Accept": "application/json, application/x-www-form-urlencoded",
    "Content-Type": "application/x-www-form-urlencoded"
  };

  // tslint:disable-next-line:variable-name
  private token: IOAuthToken = null;
  private accessTokenUri: string = "";
  private clientId: string = "";
  private clientSecret: string = "";
  private scope: string[] = [];

  /**
   * Inialize a oAuth connection.
   * NOTE : This module offers a global instance of this class that is configured to work with ODE's backend API.
   * Use it only to create a new connection.
   * @param accessTokenUri URL where to get oAuth tokens
   * @param clientId
   * @param clientSecret
   * @param scope Array of scopes names. Will be automatically flattened into a string, don't worry about that.
   */
  public constructor(
    accessTokenUri: string,
    clientId: string,
    clientSecret: string,
    scope: string[]
  ) {
    this.accessTokenUri = accessTokenUri;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scope = scope;
  }

  /**
   * Pull an authentication error from the response data.
   *
   * @param  {Object} data
   * @return {string}
   */
  private getAuthError(body) {
    if (body.error) {
      const err: Error & { body?: any; code?: string } = new Error(body.error);
      err.body = body;
      err.code = "EAUTH";
      return err;
    }
    return null;
  }

  /**
   * Attempt to parse response body as JSON, fall back to parsing as a query string.
   *
   * @param {string} body
   * @return {Object}
   */
  private async parseResponseBody(response: Response) {
    try {
      return await response.json();
    } catch (e) {
      throw new Error("EAUTH: invalid Json oauth response");
    }
  }

  /**
   * Sanitize the scopes option to be a string.
   */
  public sanitizeScope(scopes: string[]): string {
    return Array.isArray(scopes) ? scopes.join(" ") : scopes || "";
  }

  /**
   * Create basic auth header.
   */
  private getAuthHeader(clientId: string, clientSecret: string): string {
    return "Basic " + btoa(clientId || "" + ":" + clientSecret || "");
  }

  /**
   * Sign a standardised request object with user authentication information.
   * To use with the standard fetch API, call `fetch(url, sign(init))`.
   */
  public sign(requestObject) {
    if (!this.token || !this.token.access_token)
      throw new Error("EAUTH: Unable to sign without access token.");

    requestObject.headers = requestObject.headers || {};
    if (this.token.token_type.toLowerCase() === "bearer") {
      requestObject.headers.Authorization = "Bearer " + this.token.access_token;
    } else {
      throw new Error("EAUTH: Only Bearer token type supported.");
    }
    return requestObject;
  }

  /**
   * Get a fresh new access token with owner credentials
   */
  public async getToken(
    username: string,
    password: string
  ): Promise<IOAuthToken> {
    console.log("get new token...");
    // 1: Build request
    const body = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "password",
      password,
      scope: this.sanitizeScope(this.scope),
      username
    };
    const headers = {
      ...OAuth2RessourceOwnerClient.DEFAULT_HEADERS,
      Authorization: this.getAuthHeader(this.clientId, this.clientSecret)
    };

    try {
      // 2: Call oAuth API
      const data = await this.request(this.accessTokenUri, {
        body,
        headers,
        method: "POST"
      });
      // 3: Build token from data and save it
      this.token = {
        ...data,
        expires_at: this.getExpirationDate(data.expires_in)
      };
      await this.saveToken();
      return this.token;
    } catch (err) {
      // Check error type
      // tslint:disable-next-line:no-console
      console.warn(err);
      throw err;
    }
  }

  /**
   * Read stored token in local storage.
   */
  public async loadToken() {
    try {
      console.log("load token...");
      const storedToken = JSON.parse(await AsyncStorage.getItem("token"));
      if (!storedToken) throw new Error("EAUTH: No token stored");
      this.token = {
        ...storedToken,
        expires_at: new Date(storedToken.expires_at)
      };
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.warn("load token failed: ", err);
      throw err;
    }
  }

  /**
   * Saves given token information in local storage.
   */
  private async saveToken() {
    try {
      await AsyncStorage.setItem("token", JSON.stringify(this.token));
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.warn("saving token failed: ", err);
      throw err;
    }
  }

  /**
   * Refresh the user access token.
   */
  public async refreshToken(): Promise<IOAuthToken> {
    console.log("refreshing token...");

    if (!this.token || !this.token.refresh_token)
      throw new Error("EAUTH: No refresh token provided.");

    // 1: Build request
    const body = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "refresh_token",
      refresh_token: this.token.refresh_token,
      scope: this.sanitizeScope(this.scope)
    };
    const headers = {
      ...OAuth2RessourceOwnerClient.DEFAULT_HEADERS,
      Authorization: this.getAuthHeader(this.clientId, this.clientSecret)
    };

    try {
      // 2: Call oAuth API to the get the new token
      const data = await this.request(this.accessTokenUri, {
        body,
        headers,
        method: "POST"
      });
      // 3: Construct the token with received data
      this.token = {
        ...this.token,
        ...data,
        expires_at: this.getExpirationDate(data.expires_in)
      };
      await this.saveToken();
      return this.token;
    } catch (err) {
      // TODO: Check error type
      // tslint:disable-next-line:no-console
      console.warn("EAUTH: refreshing token failed: ", err);
    }
  }

  /**
   * Is stored token actually expired ?
   */
  public isExpired() {
    return this.token && new Date() > this.token.expires_at;
  }

  /**
   * Returns time before expiring in milliseconds (date.getTime())
   */
  public expiresIn() {
    return this.token.expires_at.getTime() - Date.now();
  }

  /**
   * Generates a new expiration date from a number of seconds added to the now Date.
   * @param seconds
   */
  private getExpirationDate(seconds: number) {
    const expin = new Date();
    expin.setSeconds(expin.getSeconds() + seconds);
    return expin;
  }

  /**
   * Perform a fetch request specially for auth requests.
   * This checks EAUTH and HTTP erros and parses the response as a JSON object.
   * @param url
   * @param options
   */
  private async request(url: string, options: any) {
    const body = querystring.stringify(options.body);
    const query = querystring.stringify(options.query);
    if (query) {
      // append url query with the given one
      url += (url.indexOf("?") === -1 ? "?" : "&") + query;
    }
    console.log("request ", {
      url,
      body,
      headers: options.headers,
      method: options.method
    });
    const response = await fetch(url, {
      body,
      headers: options.headers,
      method: options.method
    });
    const data = await this.parseResponseBody(response);
    const authErr = this.getAuthError(data);
    if (authErr) throw new Error(authErr.code);
    if (response.status < 200 || response.status >= 399) {
      const statusErr = new Error("HTTP status " + response.status) as any;
      statusErr.status = response.status;
      statusErr.body = response.body;
      statusErr.code = "ESTATUS";
      throw new Error(statusErr.status + " " + statusErr.body);
    }
    return data;
  }

  /**
   * Removes the token in this connection.
   * It will be also removed from local storage.
   */
  public async eraseToken() {
    try {
      await AsyncStorage.removeItem("token");
      this.token = null;
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.warn("failed erasing token: ", err);
      throw err;
    }
  }
}

/**
 * A oAuth connexion configured for Open Digital Education API
 */
const oauth = new OAuth2RessourceOwnerClient(
  `${Conf.platform}/auth/oauth2/token`,
  "app-e",
  "ODE",
  [
    "userinfo",
    "timeline",
    "homeworks",
    "workspace",
    "directory",
    "conversation"
  ]
);

export default oauth;

/**
 * Returns a image array with signed url requests.
 */
export function signImagesUrls(
  images: Array<{ src: string; alt: string }>
): Array<{ src: object; alt: string }> {
  return images.map(v => ({
    alt: v.alt,
    src: signUrl(v.src)
  }));
}

/**
 * Build a signed request from an url.
 */
export function signUrl(url: string) {
  return oauth.sign({
    method: "GET",
    uri: url
  });
}
