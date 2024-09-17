/**
 * Error enums must be string enum to ensure values are unique between all them.
 * Be SURE to NOT reuse same values accross different categories.
 */

import * as React from 'react';
import DeviceInfo from 'react-native-device-info';

import { I18n } from '~/app/i18n';
import { IOAuthCustomToken } from '~/infra/oauth';

export namespace Error {
  //  8888888888                                                      d8b 888    888            888
  //  888                                                             Y8P 888    888            888
  //  888                                                                 888    888            888
  //  8888888    888d888 888d888  .d88b.  888d888       888  888  888 888 888888 88888b.        888  888  .d88b.  888  888
  //  888        888P"   888P"   d88""88b 888P"         888  888  888 888 888    888 "88b       888 .88P d8P  Y8b 888  888
  //  888        888     888     888  888 888           888  888  888 888 888    888  888       888888K  88888888 888  888
  //  888        888     888     Y88..88P 888           Y88b 888 d88P 888 Y88b.  888  888       888 "88b Y8b.     Y88b 888
  //  8888888888 888     888      "Y88P"  888            "Y8888888P"  888  "Y888 888  888       888  888  "Y8888   "Y88888
  //                                                                                                                   888
  //                                                                                                              Y8b d88P
  //                                                                                                               "Y88P"

  /**
   * Represents an Error and its generation key.
   * It depends on the screen that led to its generation so that it can be displayed only once on the correct screen. */
  export interface ErrorWithKey {
    info: Error;
    key?: number;
  }

  /**
   * Generates a error key to be stored in a ErrorWithKey object.
   * The error key is a unique number based on a precise timestamp.
   */
  export const generateErrorKey = performance.now;

  //  8888888888                                                      d8b 888    888            888
  //  888                                                             Y8P 888    888            888
  //  888                                                                 888    888            888
  //  8888888    888d888 888d888  .d88b.  888d888       888  888  888 888 888888 88888b.        888888 888  888 88888b.   .d88b.
  //  888        888P"   888P"   d88""88b 888P"         888  888  888 888 888    888 "88b       888    888  888 888 "88b d8P  Y8b
  //  888        888     888     888  888 888           888  888  888 888 888    888  888       888    888  888 888  888 88888888
  //  888        888     888     Y88..88P 888           Y88b 888 d88P 888 Y88b.  888  888       Y88b.  Y88b 888 888 d88P Y8b.
  //  8888888888 888     888      "Y88P"  888            "Y8888888P"  888  "Y888 888  888        "Y888  "Y88888 88888P"   "Y8888
  //                                                                                                        888 888
  //                                                                                                   Y8b d88P 888
  //                                                                                                    "Y88P"  888

  export enum AnyErrorType {}

  export class ErrorWithType<Types = AnyErrorType> extends global.Error {
    constructor(
      public type: Types,
      ...args: ConstructorParameters<typeof global.Error>
    ) {
      super(...args); // Note: built-in Error class break the prototype chain when extending it like this...
      Object.setPrototypeOf(this, new.target.prototype); // ... So, we need to restore the prototype chain like this.
      // @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#example
    }
  }

  /**
   * Dig into every cause of the given error to return the last encountered type.
   * @param error
   * @returns
   */
  export const getDeepErrorType = <ErrorClass = ErrorWithType>(error?: ErrorWithKey | Error) => {
    let currentError = (error as ErrorWithKey)?.info ?? error;
    let type: Error.ErrorTypes<ErrorClass> | undefined;
    do {
      if (currentError instanceof Error.ErrorWithType) type = currentError.type as Error.ErrorTypes<ErrorClass>;
      currentError = currentError?.cause as Error;
    } while (currentError);
    return type;
  };

  type Constructor<T> = new (...args: any[]) => T;

  export type ErrorTypes<ErrorClass> = ErrorClass extends Constructor<ErrorWithType<infer T>> ? T : AnyErrorType;

  //  8888888888                                        88888888888
  //  888                                                   888
  //  888                                                   888
  //  8888888    888d888 888d888  .d88b.  888d888           888  888  888 88888b.   .d88b.  .d8888b
  //  888        888P"   888P"   d88""88b 888P"             888  888  888 888 "88b d8P  Y8b 88K
  //  888        888     888     888  888 888               888  888  888 888  888 88888888 "Y8888b.
  //  888        888     888     Y88..88P 888               888  Y88b 888 888 d88P Y8b.          X88
  //  8888888888 888     888      "Y88P"  888               888   "Y88888 88888P"   "Y8888   88888P'
  //                                                                  888 888
  //                                                             Y8b d88P 888
  //                                                              "Y88P"  888

  export enum FetchErrorType {
    NOT_AUTHENTICATED = 'NOT_AUTHENTICATED', // Signed request but no token available
    NETWORK_ERROR = 'NETWORK_ERROR', // Server is unreachable or not responding
    NOT_OK = 'NOT_OK', // Response is not Http 2xx
    BAD_RESPONSE = 'BAD_RESPONSE', // Response is Http 2xx but given data is unintended
    TIMEOUT = 'TIMEOUT',
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

    ACTIVATION_CODE = 'ACTIVATION_CODE',
    PASSWORD_RESET = 'PASSWORD_RESET',
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

  export const getAuthErrorText = <ErrorClass = ErrorWithType>(
    type: Error.ErrorTypes<ErrorClass> | undefined,
    platformUrl: string,
  ) => {
    switch (type) {
      case Error.FetchErrorType.NOT_AUTHENTICATED:
        return I18n.get('auth-error-notinitilized');
      case Error.FetchErrorType.BAD_RESPONSE:
        return I18n.get('auth-error-badresponse');
      case Error.FetchErrorType.NETWORK_ERROR:
        return I18n.get('auth-error-networkerror');
      case Error.FetchErrorType.NOT_OK:
        return I18n.get('auth-error-unknownresponse');
      case Error.FetchErrorType.TIMEOUT:
        return I18n.get('auth-error-networkerror');

      case Error.OAuth2ErrorType.OAUTH2_INVALID_CLIENT:
        return I18n.get('auth-error-invalidclient', { version: DeviceInfo.getVersion() });
      case Error.OAuth2ErrorType.OAUTH2_MISSING_CLIENT:
        return I18n.get('auth-error-notinitilized');
      case Error.OAuth2ErrorType.OAUTH2_INVALID_GRANT:
        return I18n.get('auth-error-invalidgrant');
      case Error.OAuth2ErrorType.PLATFORM_TOO_LOAD:
        return I18n.get('auth-error-tooload');
      case Error.OAuth2ErrorType.PLATFORM_UNAVAILABLE:
        return I18n.get('auth-error-platformunavailable');
      case Error.OAuth2ErrorType.REFRESH_INVALID:
        return I18n.get('auth-error-restorefail');
      case Error.OAuth2ErrorType.SECURITY_TOO_MANY_TRIES:
        return I18n.get('auth-error-toomanytries');
      case Error.OAuth2ErrorType.UNKNOWN_DENIED:
        return I18n.get('auth-error-unknowndenied');
      case Error.OAuth2ErrorType.CREDENTIALS_MISMATCH:
        return I18n.get('auth-error-badcredentials');
      case Error.OAuth2ErrorType.SAML_INVALID:
        return I18n.get('auth-error-badsaml');
      case Error.OAuth2ErrorType.PLATFORM_BLOCKED_TYPE:
        return I18n.get('auth-error-blockedtype');
      case Error.OAuth2ErrorType.ACCOUNT_BLOCKED:
        return I18n.get('auth-error-blockeduser');
      case Error.OAuth2ErrorType.ACTIVATION_CODE:
        return I18n.get('auth-error-activationcode');
      case Error.OAuth2ErrorType.PASSWORD_RESET:
        return I18n.get('auth-error-passwordreset');

      case Error.LoginErrorType.NO_SPECIFIED_PLATFORM:
      case Error.LoginErrorType.INVALID_PLATFORM:
        return I18n.get('auth-error-runtimeerror');
      case Error.LoginErrorType.ACCOUNT_INELIGIBLE_NOT_PREMIUM:
        return I18n.get('auth-error-notpremium');
      case Error.LoginErrorType.ACCOUNT_INELIGIBLE_PRE_DELETED:
        return I18n.get('auth-error-predeleted', { currentplatform: platformUrl });

      case Error.OAuth2ErrorType.SAML_MULTIPLE_VECTOR:
      default:
        return I18n.get('auth-error-unknownerror');
    }
  };

  //  8888888888                                                      d8b 888    888                 888          888
  //  888                                                             Y8P 888    888                 888          888
  //  888                                                                 888    888                 888          888
  //  8888888    888d888 888d888  .d88b.  888d888       888  888  888 888 888888 88888b.         .d88888  8888b.  888888  8888b.
  //  888        888P"   888P"   d88""88b 888P"         888  888  888 888 888    888 "88b       d88" 888     "88b 888        "88b
  //  888        888     888     888  888 888           888  888  888 888 888    888  888       888  888 .d888888 888    .d888888
  //  888        888     888     Y88..88P 888           Y88b 888 d88P 888 Y88b.  888  888       Y88b 888 888  888 Y88b.  888  888
  //  8888888888 888     888      "Y88P"  888            "Y8888888P"  888  "Y888 888  888        "Y88888 "Y888888  "Y888 "Y888888
  //
  //
  //

  export class SamlMultipleVectorError extends Error.ErrorWithType<Error.OAuth2ErrorType.SAML_MULTIPLE_VECTOR> {
    constructor(
      public data: { users: IOAuthCustomToken[] },
      ...args: ConstructorParameters<typeof global.Error>
    ) {
      super(Error.OAuth2ErrorType.SAML_MULTIPLE_VECTOR, ...args); // Note: built-in Error class break the prototype chain when extending it like this...
      Object.setPrototypeOf(this, new.target.prototype); // ... So, we need to restore the prototype chain like this.
      // @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#example
    }
  }
}

//  8888888888                                        888    888                   888
//  888                                               888    888                   888
//  888                                               888    888                   888
//  8888888    888d888 888d888  .d88b.  888d888       8888888888  .d88b.   .d88b.  888  888
//  888        888P"   888P"   d88""88b 888P"         888    888 d88""88b d88""88b 888 .88P
//  888        888     888     888  888 888           888    888 888  888 888  888 888888K
//  888        888     888     Y88..88P 888           888    888 Y88..88P Y88..88P 888 "88b
//  8888888888 888     888      "Y88P"  888           888    888  "Y88P"   "Y88P"  888  888
//
//
//

/**
 * Manage the raw error informatino and returns usable valeus like error message, type, and clear function.
 * @param error error structure with info & key
 * @param consumeError function to update the key whenever it's undefined
 * @returns an object containing error information :
 *  - errmsg : i18n translated message if the error needs to be displayed. If the given error has been cleared, contains `undefined`
 *  - errtype : the enum type of the error, if any. If the given error has been cleared, contains `undefined`
 *  - errkey : current key of the displaying context. Contains the timestamp of the last screen mount / error cleared
 *  - errclear : function to call to clear the error (set state, so it does fire a re-render !).
 */
export const useErrorWithKey = <ErrorClass = Error.ErrorWithType>(
  platformUrl: string,
  error?: Error.ErrorWithKey,
  consumeError?: (errorKey: number) => void,
) => {
  const [errkey, setErrkey] = React.useState(Error.generateErrorKey);
  const showError = error?.key === errkey || error?.key === undefined;
  const errtype = React.useMemo(() => (showError ? Error.getDeepErrorType<ErrorClass>(error) : undefined), [error, showError]);
  const errclear = React.useCallback(() => {
    if (error && showError) setErrkey(Error.generateErrorKey());
  }, [error, showError]);
  const errmsg = React.useMemo(
    () =>
      showError && error ? Error.getAuthErrorText<ErrorClass>(errtype as Error.ErrorTypes<ErrorClass>, platformUrl) : undefined,
    [error, errtype, platformUrl, showError],
  );
  React.useEffect(() => {
    if (error?.key === undefined) {
      consumeError?.(errkey);
    }
    // only launch this once after screen mount to mark error key if undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { errmsg, errtype, errkey, errclear } as const;
};
