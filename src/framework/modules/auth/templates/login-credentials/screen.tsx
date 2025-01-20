import * as React from 'react';
import { ScrollView, View } from 'react-native';

import styles from './styles';
import { LoginCredentialsScreenPrivateProps, LoginState } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import DefaultButton from '~/framework/components/buttons/default';
import PrimaryButton from '~/framework/components/buttons/primary';
import { UI_SIZES } from '~/framework/components/constants';
import InputContainer from '~/framework/components/inputs/container';
import PasswordInput from '~/framework/components/inputs/password';
import TextInput from '~/framework/components/inputs/text';
import { KeyboardPageView } from '~/framework/components/page';
import { PFLogo } from '~/framework/components/pfLogo';
import { NamedSVG } from '~/framework/components/picture';
import { BodyText, HeadingXSText } from '~/framework/components/text';
import { AuthActiveAccountWithCredentials, AuthSavedLoggedOutAccountWithCredentials } from '~/framework/modules/auth/model';
import { getAccountById } from '~/framework/modules/auth/reducer';
import { Error, useErrorWithKey } from '~/framework/util/error';
import { openUrl } from '~/framework/util/linking';
import { OAuth2ErrorCode } from '~/framework/util/oauth2';

const LoginCredentialsScreen = (props: LoginCredentialsScreenPrivateProps) => {
  const {
    error,
    forgotIdRoute,
    forgotPasswordRoute,
    handleConsumeError,
    lockLogin,
    navigation,
    route,
    tryLoginAdd,
    tryLoginReplace,
  } = props;
  const { accountId, platform } = route.params;
  const account = getAccountById(accountId);

  const initialLogin =
    (account as Partial<AuthSavedLoggedOutAccountWithCredentials | AuthActiveAccountWithCredentials> | undefined)?.user
      ?.loginUsed ?? route.params.loginUsed;
  const [login, setLogin] = React.useState<string>(initialLogin ?? '');
  const [password, setPassword] = React.useState<string>('');
  const [typing, setTyping] = React.useState<boolean>(false);
  const [loginState, setLoginState] = React.useState<string>(LoginState.IDLE);

  const { errclear, errkey, errmsg, errtype } = useErrorWithKey<typeof Error.LoginError>(platform.url, error, handleConsumeError);

  const inputLogin = React.useRef<any>(null);
  const inputPassword = React.useRef<any>(null);
  const mounted = React.useRef(false);

  const isSubmitDisabled = React.useMemo(() => !(login && password), [login, password]);

  React.useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const doLogin = React.useCallback(async () => {
    setLoginState(LoginState.RUNNING);
    try {
      const loginCredentials = {
        password: password.trim(),
        username: login,
      };

      if (accountId) {
        await tryLoginReplace(accountId, account?.addTimestamp ?? Date.now(), platform, loginCredentials, errkey);
      } else {
        await tryLoginAdd(platform, loginCredentials, errkey);
      }

      if (mounted) {
        setTyping(false);
        setLoginState(LoginState.DONE);
        // Timemout is added after loggin in to keep spinner visible during screen transition
        setTimeout(() => {
          if (mounted) {
            setTyping(false);
            setLoginState(LoginState.IDLE);
          }
        }, 500);
      }
    } catch {
      if (mounted) {
        setTyping(false);
        setLoginState(LoginState.IDLE);
      }
    }
  }, [login, password, accountId, tryLoginReplace, account?.addTimestamp, platform, errkey, tryLoginAdd]);

  const goToWeb = React.useCallback(() => {
    openUrl(platform.url);
  }, [platform.url]);

  const onTextChange = React.useCallback(() => {
    setTyping(true);
    errclear();
  }, [errclear]);

  const onLoginChanged = React.useCallback(
    (value: string) => {
      setLogin(value.trim().toLowerCase());
      onTextChange();
    },
    [onTextChange],
  );

  const onPasswordChanged = React.useCallback(
    (value: string) => {
      setPassword(value);
      onTextChange();
    },
    [onTextChange],
  );

  const onSubmitEditingLogin = React.useCallback(() => {
    if (inputPassword.current) inputPassword.current.focus();
  }, []);

  const onSubmitEditingPassword = React.useCallback(() => {
    if (!isSubmitDisabled) doLogin();
  }, [doLogin, isSubmitDisabled]);

  const renderError = React.useCallback(() => {
    if (!errmsg) {
      return (
        <View style={styles.boxError}>
          <BodyText style={styles.userTextError} testID="login-error" />
        </View>
      );
    }
    return (
      <View style={[styles.boxError, styles.userError]}>
        <NamedSVG
          name="ui-error"
          fill={theme.palette.status.failure.regular}
          width={UI_SIZES.elements.icon.default}
          height={UI_SIZES.elements.icon.default}
        />
        <BodyText style={styles.userTextError} testID="login-error">
          {errmsg}
        </BodyText>
      </View>
    );
  }, [errmsg]);

  const renderPlatform = React.useCallback(() => {
    const logoStyle = {
      ...styles.platformLogo,
    };
    if (platform.logoStyle) Object.assign(logoStyle, platform.logoStyle);
    return (
      <View style={styles.platform}>
        <PFLogo pf={platform} />
        <HeadingXSText style={styles.platformName}>{platform.displayName}</HeadingXSText>
      </View>
    );
  }, [platform]);

  const renderInputs = React.useCallback(() => {
    return (
      <View style={styles.boxInputs}>
        <InputContainer
          label={{ icon: 'ui-user', text: I18n.get('auth-login-login') }}
          input={
            <TextInput
              placeholder={I18n.get('auth-login-inputLogin')}
              ref={inputLogin}
              onChangeText={onLoginChanged.bind(this)}
              value={login}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              testID="login-identifier"
              showError={errmsg ? errtype === OAuth2ErrorCode.CREDENTIALS_MISMATCH : false}
              onSubmitEditing={onSubmitEditingLogin}
              returnKeyType="next"
              disabled={lockLogin && !!initialLogin} // lock Login only if login is provided.
            />
          }
        />
        <InputContainer
          style={styles.inputPassword}
          label={{ icon: 'ui-lock', text: I18n.get('auth-login-password') }}
          input={
            <PasswordInput
              placeholder={I18n.get('auth-login-inputPassword')}
              ref={inputPassword}
              onChangeText={onPasswordChanged.bind(this)}
              value={password}
              showError={errmsg ? errtype === OAuth2ErrorCode.CREDENTIALS_MISMATCH : false}
              testID="login-password"
              onSubmitEditing={onSubmitEditingPassword}
              returnKeyType="send"
              testIDToggle="login-see-password"
            />
          }
        />
      </View>
    );
  }, [
    onLoginChanged,
    login,
    errmsg,
    errtype,
    onSubmitEditingLogin,
    lockLogin,
    initialLogin,
    onPasswordChanged,
    password,
    onSubmitEditingPassword,
  ]);

  const renderLoginButton = React.useCallback(() => {
    if (
      !typing &&
      errmsg &&
      (errtype === Error.LoginErrorType.ACCOUNT_INELIGIBLE_NOT_PREMIUM ||
        errtype === Error.LoginErrorType.ACCOUNT_INELIGIBLE_PRE_DELETED)
    ) {
      return (
        <PrimaryButton action={goToWeb} text={I18n.get('auth-login-web')} iconRight="ui-externalLink" testID="login-opentoweb" />
      );
    } else {
      return (
        <PrimaryButton
          action={doLogin}
          disabled={isSubmitDisabled}
          text={I18n.get('auth-login-connect')}
          loading={loginState === LoginState.RUNNING || loginState === LoginState.DONE}
          testID="login-connect"
        />
      );
    }
  }, [typing, errmsg, errtype, goToWeb, doLogin, isSubmitDisabled, loginState]);

  const renderPage = React.useCallback(() => {
    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={styles.scrollview}>
        <View style={styles.form}>
          {renderPlatform()}
          {renderInputs()}
          {renderError()}
          <View style={styles.boxButtons}>
            {renderLoginButton()}
            <View style={styles.boxTextForgot}>
              <DefaultButton
                text={I18n.get('auth-login-forgot-password')}
                action={() => navigation.dispatch(forgotPasswordRoute(login))}
                testID="login-forgot-password"
                style={styles.forgotPasswordButton}
              />
              {!lockLogin ? (
                <DefaultButton
                  text={I18n.get('auth-login-forgot-id')}
                  action={() => navigation.dispatch(forgotIdRoute)}
                  testID="login-forgot-identifier"
                />
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }, [
    renderPlatform,
    renderInputs,
    renderError,
    renderLoginButton,
    lockLogin,
    navigation,
    forgotPasswordRoute,
    login,
    forgotIdRoute,
  ]);

  return <KeyboardPageView style={styles.pageView}>{renderPage()}</KeyboardPageView>;
};

export default LoginCredentialsScreen;
