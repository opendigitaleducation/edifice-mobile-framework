import { RouteProp, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import { UI_SIZES } from '~/framework/components/constants';
import { KeyboardPageView } from '~/framework/components/page';
import { Picture } from '~/framework/components/picture';
import { NamedSVG } from '~/framework/components/picture/NamedSVG';
import { CaptionItalicText, HeadingSText, SmallBoldText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import usePreventBack from '~/framework/hooks/prevent-back';
import { manualLogoutAction } from '~/framework/modules/auth/actions';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { getEmailValidationInfos, requestEmailVerificationCode } from '~/framework/modules/auth/service';
import { ModificationType } from '~/framework/modules/user/screens/home/types';
import { navBarOptions } from '~/framework/navigation/navBar';
import { isEmpty } from '~/framework/util/object';
import { tryAction } from '~/framework/util/redux/actions';
import { ValidatorBuilder } from '~/utils/form';

import styles from './styles';
import { AuthChangeEmailScreenDispatchProps, AuthChangeEmailScreenPrivateProps, EmailState, PageTexts } from './types';

const getNavBarTitle = (route: RouteProp<AuthNavigationParams, typeof authRouteNames.changeEmail>) =>
  route.params.navBarTitle || I18n.get('auth-change-email-verify');

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.changeEmail>): NativeStackNavigationOptions => {
  return {
    ...navBarOptions({
      navigation,
      route,
      title: getNavBarTitle(route),
      titleTestID: 'email-title',
      backButtonTestID: 'email-back',
    }),
  };
};

const AuthChangeEmailScreen = (props: AuthChangeEmailScreenPrivateProps) => {
  const { tryLogout, navigation, route } = props;
  const isScreenFocused = useIsFocused();

  const platform = route.params.platform;
  const defaultEmail = route.params.defaultEmail;
  const modificationType = route.params.modificationType;
  const isModifyingEmail = modificationType === ModificationType.EMAIL;
  const texts: PageTexts = isModifyingEmail
    ? {
        button: I18n.get('auth-change-email-verify-button'),
        label: I18n.get('auth-change-email-edit-label'),
        message: I18n.get('auth-change-email-edit-message'),
        title: I18n.get('auth-change-email-edit-title'),
      }
    : {
        button: I18n.get('auth-change-email-verify-button'),
        label: I18n.get('auth-change-email-verify-label'),
        message: I18n.get('auth-change-email-verify-message'),
        title: I18n.get('auth-change-email-verify-title'),
      };

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [email, setEmail] = useState(defaultEmail || '');
  const [emailState, setEmailState] = useState<EmailState>(EmailState.PRISTINE);
  const isEmailEmpty = isEmpty(email);
  const isEmailStatePristine = emailState === EmailState.PRISTINE;

  const doRequestEmailVerificationCode = useCallback(
    async (toVerify: string) => {
      // Exit if email is not valid
      if (!new ValidatorBuilder().withEmail().build<string>().isValid(toVerify)) return EmailState.EMAIL_FORMAT_INVALID;
      try {
        setIsSendingCode(true);
        if (isModifyingEmail) {
          // We don't want to check this on mail validation scenario at login
          // Exit if email has already been verified
          const emailValidationInfos = await getEmailValidationInfos(platform.url);
          if (toVerify === emailValidationInfos?.emailState?.valid) {
            setIsSendingCode(false);
            return EmailState.EMAIL_ALREADY_VERIFIED;
          }
        }
        await requestEmailVerificationCode(platform, toVerify);
        navigation.navigate(authRouteNames.mfa, {
          platform,
          modificationType,
          isEmailMFA: true,
          email: toVerify,
          navBarTitle: getNavBarTitle(route),
        });
      } catch {
        Toast.showError(I18n.get('auth-change-email-error-text'));
      } finally {
        setIsSendingCode(false);
      }
    },
    [isModifyingEmail, modificationType, navigation, platform, route],
  );

  const sendEmail = useCallback(async () => {
    const sendResponse = await doRequestEmailVerificationCode(email);
    if (sendResponse) setEmailState(sendResponse);
  }, [doRequestEmailVerificationCode, email]);

  const changeEmail = useCallback(
    (text: string) => {
      if (!isEmailStatePristine) setEmailState(EmailState.PRISTINE);
      setEmail(text);
    },
    [isEmailStatePristine],
  );

  const refuseEmailVerification = useCallback(async () => {
    try {
      await tryLogout();
    } catch {
      Toast.showError(I18n.get('auth-change-email-error-text'));
    }
  }, [tryLogout]);

  usePreventBack({
    title: I18n.get('auth-change-email-edit-alert-title'),
    text: I18n.get('auth-change-email-edit-alert-message'),
    showAlert: !isEmailEmpty && isScreenFocused,
  });

  const onChangeEmail = useCallback((text: string) => changeEmail(text), [changeEmail]);
  const onSendEmail = useCallback(() => sendEmail(), [sendEmail]);
  const onRefuseEmailVerification = useCallback(() => refuseEmailVerification(), [refuseEmailVerification]);

  return (
    <KeyboardPageView style={styles.page} scrollable>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <NamedSVG name="user-email" width={UI_SIZES.elements.thumbnail} height={UI_SIZES.elements.thumbnail} />
        </View>
        <HeadingSText style={styles.title} testID="email-change-title">
          {texts.title}
        </HeadingSText>
        <SmallText style={styles.content} testID="email-change-subtitle">
          {texts.message}
        </SmallText>
        <View style={styles.inputTitleContainer} testID="email-field-label">
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
            placeholder={I18n.get('auth-change-email-placeholder')}
            placeholderTextColor={theme.palette.grey.graphite}
            style={styles.input}
            value={email}
            onChangeText={onChangeEmail}
            returnKeyType="send"
            {...(!isEmailEmpty ? { onSubmitEditing: onSendEmail } : {})}
            testID="email-field"
          />
        </View>
        <CaptionItalicText style={styles.errorText} testID="email-field-error">
          {isEmailStatePristine
            ? I18n.get('common-space')
            : emailState === EmailState.EMAIL_ALREADY_VERIFIED
              ? I18n.get('auth-change-email-error-same')
              : I18n.get('auth-change-email-error-invalid')}
        </CaptionItalicText>
        <PrimaryButton
          style={styles.sendButton}
          text={texts.button}
          disabled={isEmailEmpty}
          loading={isSendingCode}
          action={onSendEmail}
          testID="email-check"
        />
        {isModifyingEmail ? null : (
          <TouchableOpacity style={styles.logoutButton} onPress={onRefuseEmailVerification}>
            <SmallBoldText style={styles.logoutText}>{I18n.get('auth-change-email-verify-disconnect')}</SmallBoldText>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardPageView>
  );
};
const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>) => AuthChangeEmailScreenDispatchProps = dispatch => {
  return bindActionCreators(
    {
      tryLogout: tryAction(manualLogoutAction),
    },
    dispatch,
  );
};

export default connect(undefined, mapDispatchToProps)(AuthChangeEmailScreen);
