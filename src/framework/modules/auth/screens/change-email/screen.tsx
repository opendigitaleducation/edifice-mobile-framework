import { RouteProp, UNSTABLE_usePreventRemove, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import I18n from 'i18n-js';
import React, { useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-tiny-toast';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import theme from '~/app/theme';
import { ActionButton } from '~/framework/components/buttons/action';
import { UI_ANIMATIONS, UI_SIZES } from '~/framework/components/constants';
import { KeyboardPageView } from '~/framework/components/page';
import { Picture } from '~/framework/components/picture';
import { NamedSVG } from '~/framework/components/picture/NamedSVG';
import { CaptionItalicText, HeadingSText, SmallBoldText, SmallText } from '~/framework/components/text';
import { logoutAction } from '~/framework/modules/auth/actions';
import { AuthRouteNames, IAuthNavigationParams, getAuthNavigationState } from '~/framework/modules/auth/navigation';
import { getEmailValidationInfos, sendEmailVerificationCode } from '~/framework/modules/auth/service';
import { ModificationType } from '~/framework/modules/user/screens/home/types';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { isEmpty } from '~/framework/util/object';
import { tryAction } from '~/framework/util/redux/actions';
import { ValidatorBuilder } from '~/utils/form';

import styles from './styles';
import { AuthChangeEmailScreenDispatchProps, AuthChangeEmailScreenPrivateProps, EmailState, PageTexts } from './types';

const getNavBarTitle = (route: RouteProp<IAuthNavigationParams, AuthRouteNames.changeEmail>) =>
  route.params.navBarTitle || I18n.t('auth-change-email-verify');

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<IAuthNavigationParams, typeof AuthRouteNames.changeEmail>): NativeStackNavigationOptions => {
  return {
    ...navBarOptions({
      navigation,
      route,
    }),
    headerTitle: navBarTitle(getNavBarTitle(route)),
  };
};

const AuthChangeEmailScreen = (props: AuthChangeEmailScreenPrivateProps) => {
  const { tryLogout, navigation, route } = props;
  const isScreenFocused = useIsFocused();

  const platform = route.params.platform;
  const rememberMe = route.params.rememberMe;
  const defaultEmail = route.params.defaultEmail;
  const modificationType = route.params.modificationType;
  const isModifyingEmail = modificationType === ModificationType.EMAIL;
  const texts: PageTexts = isModifyingEmail
    ? {
        title: I18n.t('auth-change-email-edit-title'),
        message: I18n.t('auth-change-email-edit-message'),
        label: I18n.t('auth-change-email-edit-label'),
        button: I18n.t('auth-change-email-verify-button'),
      }
    : {
        title: I18n.t('auth-change-email-verify-title'),
        message: I18n.t('auth-change-email-verify-message'),
        label: I18n.t('auth-change-email-verify-label'),
        button: I18n.t('auth-change-email-verify-button'),
      };

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [email, setEmail] = useState(defaultEmail || '');
  const [emailState, setEmailState] = useState<EmailState>(EmailState.PRISTINE);
  const isEmailEmpty = isEmpty(email);
  const isEmailStatePristine = emailState === EmailState.PRISTINE;

  const doSendEmailVerificationCode = React.useCallback(
    async (toVerify: string) => {
      // Exit if email is not valid
      if (!new ValidatorBuilder().withEmail().build<string>().isValid(toVerify)) return EmailState.EMAIL_FORMAT_INVALID;
      try {
        setIsSendingCode(true);
        if (isModifyingEmail) {
          // We don't want to check this on mail validation scenario at login
          // Exit if email has already been verified
          const emailValidationInfos = await getEmailValidationInfos();
          if (toVerify === emailValidationInfos?.emailState?.valid) {
            setIsSendingCode(false);
            return EmailState.EMAIL_ALREADY_VERIFIED;
          }
        }
        await sendEmailVerificationCode(platform, toVerify);
        navigation.navigate(AuthRouteNames.mfa, {
          platform,
          rememberMe,
          modificationType,
          isEmailMFA: true,
          email: toVerify,
          navBarTitle: getNavBarTitle(route),
        });
      } catch {
        Toast.show(I18n.t('common.error.text'), {
          ...UI_ANIMATIONS.toast,
        });
      } finally {
        setIsSendingCode(false);
      }
    },
    [isModifyingEmail, modificationType, navigation, platform, rememberMe, route],
  );

  const sendEmail = React.useCallback(async () => {
    const sendResponse = await doSendEmailVerificationCode(email);
    if (sendResponse) setEmailState(sendResponse);
  }, [doSendEmailVerificationCode, email]);

  const changeEmail = React.useCallback(
    (text: string) => {
      if (!isEmailStatePristine) setEmailState(EmailState.PRISTINE);
      setEmail(text);
    },
    [isEmailStatePristine],
  );

  const refuseEmailVerification = React.useCallback(async () => {
    try {
      await tryLogout();
      navigation.reset(getAuthNavigationState(platform));
    } catch {
      Toast.show(I18n.t('common.error.text'), { ...UI_ANIMATIONS.toast });
    }
  }, [navigation, platform, tryLogout]);

  UNSTABLE_usePreventRemove(!isEmailEmpty && isScreenFocused, ({ data }) => {
    Alert.alert(I18n.t('auth-change-email-edit-alert-title'), I18n.t('auth-change-email-edit-alert-message'), [
      {
        text: I18n.t('common.discard'),
        onPress: () => props.navigation.dispatch(data.action),
        style: 'destructive',
      },
      {
        text: I18n.t('common.continue'),
        style: 'cancel',
      },
    ]);
  });

  const onChangeEmail = React.useCallback((text: string) => changeEmail(text), [changeEmail]);
  const onSendEmail = React.useCallback(() => sendEmail(), [sendEmail]);
  const onRefuseEmailVerification = React.useCallback(() => refuseEmailVerification(), [refuseEmailVerification]);

  return (
    <KeyboardPageView style={styles.page} scrollable>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <NamedSVG name="user-email" width={UI_SIZES.elements.thumbnail} height={UI_SIZES.elements.thumbnail} />
        </View>
        <HeadingSText style={styles.title}>{texts.title}</HeadingSText>
        <SmallText style={styles.content}>{texts.message}</SmallText>
        <View style={styles.inputTitleContainer}>
          <Picture
            type="NamedSvg"
            name="pictos-mail"
            fill={theme.palette.grey.black}
            width={UI_SIZES.dimensions.width.mediumPlus}
            height={UI_SIZES.dimensions.height.mediumPlus}
          />
          <SmallBoldText style={styles.inputTitle}>{texts.label}</SmallBoldText>
        </View>
        <View
          style={[
            styles.inputWrapper,
            { borderColor: isEmailStatePristine ? theme.palette.grey.stone : theme.palette.status.failure.regular },
          ]}>
          <TextInput
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={I18n.t('auth-change-email-placeholder')}
            placeholderTextColor={theme.palette.grey.graphite}
            style={styles.input}
            value={email}
            onChangeText={onChangeEmail}
          />
        </View>
        <CaptionItalicText style={styles.errorText}>
          {isEmailStatePristine
            ? I18n.t('common.space')
            : emailState === EmailState.EMAIL_ALREADY_VERIFIED
            ? I18n.t('auth-change-email-error-same')
            : I18n.t('auth-change-email-error-invalid')}
        </CaptionItalicText>
        <ActionButton
          style={styles.sendButton}
          text={texts.button}
          disabled={isEmailEmpty}
          loading={isSendingCode}
          action={onSendEmail}
        />
        {isModifyingEmail ? null : (
          <TouchableOpacity style={styles.logoutButton} onPress={onRefuseEmailVerification}>
            <SmallBoldText style={styles.logoutText}>{I18n.t('auth-change-email-verify-disconnect')}</SmallBoldText>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardPageView>
  );
};

const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>) => AuthChangeEmailScreenDispatchProps = dispatch => {
  return bindActionCreators(
    {
      tryLogout: tryAction(logoutAction),
    },
    dispatch,
  );
};

export default connect(undefined, mapDispatchToProps)(AuthChangeEmailScreen);
