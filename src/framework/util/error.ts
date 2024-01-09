/**
 * Error enums must be string enum to ensure values are unique between all them.
 * Be SURE to NOT reuse same values accross different categories.
 */

export namespace Error {
  enum EmptyEnum {}

  type Constructor<T> = new (...args: any[]) => T;

  export type ErrorTypes<ErrorClass> = ErrorClass extends Constructor<ErrorWithType<infer T>> ? T : EmptyEnum;

  export class ErrorWithType<Types = EmptyEnum> extends global.Error {
    constructor(
      public type: Types,
      message?: ConstructorParameters<typeof global.Error>[0],
      options?: ConstructorParameters<typeof global.Error>[1],
    ) {
      super(message, options); // Note: built-in Error class break the prototype chain when extending it like this...
      Object.setPrototypeOf(this, new.target.prototype); // ... So, we need to restore the prototype chain like this.
      // @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#example
    }
  }

  export interface ErrorWithKey {
    info: Error;
    key?: number;
  }

  export const getDeepErrorType = <ErrorClass = ErrorWithType>(error?: ErrorWithKey) => {
    let currentError = error?.info;
    let type: Error.ErrorTypes<ErrorClass> | undefined;
    do {
      if (currentError instanceof Error.ErrorWithType) type = currentError.type as Error.ErrorTypes<ErrorClass>;
      currentError = currentError?.cause as Error;
    } while (currentError);
    return type;
  };

  export enum FetchErrorType {
    NOT_AUTHENTICATED = 'NOT_AUTHENTICATED', // Signed request but no token available
    NETWORK_ERROR = 'NETWORK_ERROR', // Server is unreachable or not responding
    NOT_OK = 'NOT_OK', // Response is not Http 2xx
    BAD_RESPONSE = 'BAD_RESPONSE', // Response is Http 2xx but given data is unintended
  }

  export const FetchError = ErrorWithType<FetchErrorType>;

  export enum OAuth2ErrorType {
    // App config related
    OAUTH2_MISSING_CLIENT = 'OAUTH2_MISSING_CLIENT', // clientID / clientSecret not intialized
    OAUTH2_INVALID_CLIENT = 'OAUTH2_INVALID_CLIENT', // Invalid OAuth2 clientID / clientSecret
    OAUTH2_INVALID_GRANT = 'OAUTH2_INVALID_GRANT', // Invalid OAuth2 grant (ex scope)
    // Credentials (login/pwd) related
    CREDENTIALS_MISMATCH = 'CREDENTIALS_MISMATCH', // Invalid login/pwd pair
    // Refresh token related
    REFRESH_INVALID = 'REFRESH_INVALID', // Invalid refresh token
    // SAML (Federation)
    SAML_INVALID = 'SAML_INVALID', // Invalid saml token
    SAML_MULTIPLE_VECTOR = 'SAML_MULTIPLE_VECTOR', // saml token corresponds to multiple accounts, need to login with given custom token
    // Security related
    SECURITY_TOO_MANY_TRIES = 'SECURITY_TOO_MANY_TRIES', // Brute-force prevention
    // Account related
    ACCOUNT_BLOCKED = 'ACCOUNT_BLOCKED', // Specified account is blocked
    // Platform availability related
    PLATFORM_UNAVAILABLE = 'PLATFORM_UNAVAILABLE', // Distant backend is in maintenance
    PLATFORM_TOO_LOAD = 'PLATFORM_TOO_LOAD', // Distant platform has quota overflow
    PLATFORM_BLOCKED_TYPE = 'PLATFORM_BLOCKED_TYPE', // Distant platform refuses certain account types
    // Unknown reason
    UNKNOWN_DENIED = 'UNKNOWN_DENIED', // User denied for non-specified reason
  }

  export const OAuth2Error = ErrorWithType<OAuth2ErrorType | ErrorTypes<typeof FetchError>>;

  export enum LoginErrorType {
    NO_SPECIFIED_PLATFORM = 'NO_SPECIFIED_PLATFORM',
    INVALID_PLATFORM = 'INVALID_PLATFORM',
    ACCOUNT_INELIGIBLE_NOT_PREMIUM = 'ACCOUNT_INELIGIBLE_NOT_PREMIUM',
    ACCOUNT_INELIGIBLE_PRE_DELETED = 'ACCOUNT_INELIGIBLE_PRE_DELETED',
    TOO_MANY_ACCOUNTS = 'TOO_MANY_ACCOUNTS',
  }

  export const LoginError = ErrorWithType<LoginErrorType | ErrorTypes<typeof OAuth2Error>>;
}
