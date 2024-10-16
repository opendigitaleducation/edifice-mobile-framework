import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import AlertCard from '~/framework/components/alert';
import DefaultButton from '~/framework/components/buttons/default';
import PrimaryButton from '~/framework/components/buttons/primary';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import InputContainer from '~/framework/components/inputs/container';
import PasswordInput from '~/framework/components/inputs/password';
import TextInput from '~/framework/components/inputs/text';
import { TextInputType } from '~/framework/components/inputs/text/component';
import { KeyboardPageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { useConstructor } from '~/framework/hooks/constructor';
import { loadAuthContextAction } from '~/framework/modules/auth/actions';
import {
  AuthActiveAccountWithCredentials,
  AuthCredentials,
  AuthSavedLoggedOutAccountWithCredentials,
  IChangePasswordError,
  IChangePasswordPayload,
  PlatformAuthContext,
  createChangePasswordError,
} from '~/framework/modules/auth/model';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { getPlatformContext, getPlatformContextOf, getSession } from '~/framework/modules/auth/reducer';
import { Error } from '~/framework/util/error';
import { Loading } from '~/ui/Loading';
import { ValueChangeArgs } from '~/utils/form';

import ChangePasswordFormModel from './form-model';
import styles from './styles';
import { ChangePasswordScreenPrivateProps, ChangePasswordScreenProps, ChangePasswordScreenStoreProps, IFields } from './types';

const keyboardPageViewScrollViewProps = { showsVerticalScrollIndicator: false, bounces: false };
const ChangePasswordScreen = (props: ChangePasswordScreenPrivateProps & { context: PlatformAuthContext }) => {
  const { navigation, route, session, context, tryLogout, trySubmit } = props;

  const platform = route.params.platform ?? session?.platform;

  const forceChangeAlert = React.useMemo(
    () =>
      route.params.forceChange ? (
        <AlertCard style={styles.alert} type="warning" text={I18n.get('auth-changepassword-warning')} />
      ) : null,
    [route.params.forceChange],
  );

  const passwordRules = React.useMemo(
    () =>
      context.passwordRegexI18n?.[I18n.getLanguage()] ? (
        <View style={styles.infos}>
          <NamedSVG name="ui-lock-alternate" />
          <SmallText style={styles.infosText} testID="change-password-rules">
            {context.passwordRegexI18n?.[I18n.getLanguage()]}
          </SmallText>
        </View>
      ) : null,
    [context.passwordRegexI18n],
  );

  const [oldPassword, setOldPassword] = React.useState(route.params.useResetCode ? (route.params.credentials?.username ?? '') : '');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [submitState, setSumitState] = React.useState<'IDLE' | 'RUNNING'>('IDLE');

  const doSubmit = React.useCallback(async () => {
    try {
      setError(undefined);
      setSumitState('RUNNING');
      const login =
        route.params.credentials?.username ??
        (session as Partial<AuthSavedLoggedOutAccountWithCredentials | AuthActiveAccountWithCredentials> | undefined)?.user
          ?.loginUsed ??
        session?.user.login;
      if (!platform || !login) {
        throw createChangePasswordError('change password', I18n.get('auth-changepassword-error-submit'));
      }
      const payload: IChangePasswordPayload = {
        oldPassword,
        newPassword,
        confirm,
        login,
      };
      if (route.params.useResetCode) {
        payload.resetCode = (route.params.credentials as AuthCredentials).password;
        delete payload.oldPassword;
      }
      await trySubmit(platform, payload, route.params.forceChange);

      try {
        setTimeout(() => {
          // We set timeout to let the app time to navigate before resetting the state of this screen in background
          setError(undefined);
          setTyping(false);
          setSumitState('IDLE');
          Toast.showSuccess(I18n.get('auth-changepassword-success'));
        }, 500);
        if (route.params.navCallback) {
          navigation.dispatch(route.params.navCallback);
        }
      } catch {
        // If error during the login phase, redirect to login screen
        tryLogout();
      }
    } catch (e) {
      const changePwdError = e as IChangePasswordError;
      // We don't show toaster if it's login error since that case is handled by redirecting the user to the login page, with error displayed.
      if (!(e instanceof Error.LoginError))
        Toast.showError(I18n.get('toast-error-text'), { testID: 'change-password-confirmed-error' });
      setError(changePwdError.error);
      setSumitState('IDLE');
      setTyping(false);
    }
  }, [
    confirm,
    navigation,
    newPassword,
    oldPassword,
    platform,
    route.params.credentials,
    route.params.forceChange,
    route.params.navCallback,
    route.params.useResetCode,
    session,
    tryLogout,
    trySubmit,
  ]);

  const doRefuseTerms = React.useCallback(() => {
    try {
      tryLogout();
    } catch (e) {
      console.error('Error while refusing terms:', e);
    }
  }, [tryLogout]);

  const formModel = React.useMemo(
    () =>
      new ChangePasswordFormModel({
        passwordRegex: context.passwordRegex,
        oldPassword: () => oldPassword,
        newPassword: () => newPassword,
      }),
    [context.passwordRegex, newPassword, oldPassword],
  );

  const isNotValid = React.useMemo(
    () => !formModel.validate({ oldPassword, newPassword, confirm }),
    [confirm, formModel, newPassword, oldPassword],
  );
  const errorKey = React.useMemo(
    () => formModel.firstErrorKey({ oldPassword, newPassword, confirm }),
    [confirm, formModel, newPassword, oldPassword],
  );
  const errorText = React.useMemo(() => (errorKey ? I18n.get(errorKey) : typing ? undefined : error), [error, errorKey, typing]);
  const isSubmitLoading = submitState === 'RUNNING';

  const inputOldPassword = React.useRef<TextInputType>(null);
  const inputNewPassword = React.useRef<TextInputType>(null);
  const inputConfirmPassword = React.useRef<TextInputType>(null);

  const onFormBlur = React.useCallback(() => {
    inputOldPassword.current?.blur();
    inputNewPassword.current?.blur();
    inputConfirmPassword.current?.blur();
  }, []);

  const onChange = React.useCallback((key: IFields) => {
    return (valueChange: ValueChangeArgs<string>) => {
      if (key === 'oldPassword') setOldPassword(valueChange.value);
      if (key === 'newPassword') setNewPassword(valueChange.value);
      if (key === 'confirm') setConfirm(valueChange.value);
      setTyping(true);
    };
  }, []);

  const isResetMode = route.params.useResetCode;

  return (
    <KeyboardPageView scrollable scrollViewProps={keyboardPageViewScrollViewProps} safeArea style={styles.page}>
      <Pressable onPress={onFormBlur} style={styles.pressable}>
        {forceChangeAlert}
        {passwordRules}
        <InputContainer
          label={{
            text: isResetMode ? I18n.get('auth-changepassword-login') : I18n.get('auth-changepassword-password-old'),
            icon: isResetMode ? 'ui-user' : 'ui-lock',
            testID: 'change-password-actual-label',
          }}
          input={
            isResetMode ? (
              <TextInput
                ref={inputOldPassword}
                onChangeText={formModel.oldPassword.changeCallback(onChange('oldPassword'))}
                value={oldPassword}
                keyboardType="email-address"
                disabled
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                testID="login-identifier"
                onSubmitEditing={() => inputNewPassword.current?.focus()}
                returnKeyType="next"
                annotation=" "
              />
            ) : (
              <PasswordInput
                placeholder={I18n.get('auth-changepassword-placeholder')}
                showIconCallback
                showError={formModel.showOldPasswordError(oldPassword)}
                value={oldPassword}
                onChangeText={formModel.oldPassword.changeCallback(onChange('oldPassword'))}
                annotation=" "
                ref={inputOldPassword}
                onSubmitEditing={() => inputNewPassword.current?.focus()}
                returnKeyType="next"
                testID="change-password-actual-field"
                testIDToggle="change-password-actual-see"
              />
            )
          }
        />
        <InputContainer
          style={styles.inputNewPassword}
          label={{
            text: I18n.get('auth-changepassword-password-new'),
            icon: 'ui-lock',
            testID: 'change-password-new-label',
          }}
          input={
            <PasswordInput
              placeholder={I18n.get('auth-changepassword-placeholder')}
              showIconCallback
              showError={formModel.showNewPasswordError(newPassword)}
              value={newPassword}
              onChangeText={formModel.newPassword.changeCallback(onChange('newPassword'))}
              annotation={formModel.showNewPasswordError(newPassword) ? errorText : ' '}
              ref={inputNewPassword}
              onSubmitEditing={() => inputConfirmPassword.current?.focus()}
              returnKeyType="next"
              testID="change-password-new-field"
              testIDToggle="change-password-new-see"
              testIDCaption="change-password-new-error"
            />
          }
        />
        <InputContainer
          label={{
            text: I18n.get('auth-changepassword-password-new-confirm'),
            icon: 'ui-lock',
            testID: 'change-password-confirmed-label',
          }}
          input={
            <PasswordInput
              placeholder={I18n.get('auth-changepassword-placeholder')}
              showIconCallback
              showError={formModel.showPasswordConfirmError(confirm)}
              value={confirm}
              onChangeText={formModel.confirm.changeCallback(onChange('confirm'))}
              annotation={formModel.showPasswordConfirmError(confirm) ? errorText : ' '}
              ref={inputConfirmPassword}
              returnKeyType="send"
              onSubmitEditing={isNotValid ? () => {} : () => doSubmit()}
              testID="change-password-confirmed-field"
              testIDToggle="change-password-confirmed-see"
            />
          }
        />
        <View style={styles.buttons}>
          <PrimaryButton
            action={doSubmit}
            disabled={isNotValid}
            text={I18n.get('common-save')}
            loading={isSubmitLoading}
            testID="change-password"
          />
          {props.route.params.forceChange ? (
            <DefaultButton
              text={I18n.get('user-revalidateterms-refuseanddisconnect')}
              contentColor={theme.palette.status.failure.regular}
              style={{ marginTop: UI_SIZES.spacing.big }}
              action={doRefuseTerms}
            />
          ) : null}
        </View>
      </Pressable>
    </KeyboardPageView>
  );
};

export const mapStateToProps: (
  state: IGlobalState,
  props: ChangePasswordScreenProps &
    NativeStackScreenProps<
      AuthNavigationParams,
      | typeof authRouteNames.changePassword
      | typeof authRouteNames.changePasswordModal
      | typeof authRouteNames.addAccountChangePassword
    >,
) => ChangePasswordScreenStoreProps = (state, props) => {
  return {
    session: getSession(),
    context: props.route.params.platform ? getPlatformContextOf(props.route.params.platform) : getPlatformContext(),
  };
};

// const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>) => ChangePasswordScreenDispatchProps = dispatch => {
//   return bindActionCreators<ChangePasswordScreenDispatchProps>(
//     {
//       trySubmit: tryAction(changePasswordAction),
//       tryLogout: tryAction(manualLogoutAction),
//     },
//     dispatch,
//   );
// };

const ChangePasswordScreenLoader = (props: ChangePasswordScreenPrivateProps) => {
  const { context, session, route } = props;
  const platform = route.params.platform ?? session?.platform;
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  useConstructor(async () => {
    if (!context && platform) {
      dispatch(loadAuthContextAction(platform));
    }
  });

  if (!platform) return <EmptyConnectionScreen />;
  if (!context) return <Loading />;
  else return <ChangePasswordScreen {...props} context={context} />;
};

export default ChangePasswordScreenLoader;
