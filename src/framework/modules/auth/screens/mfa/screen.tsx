import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES, UI_VALUES } from '~/framework/components/constants';
import { KeyboardPageView } from '~/framework/components/page';
import { Picture } from '~/framework/components/picture';
import { NamedSVG } from '~/framework/components/picture/NamedSVG';
import { BodyBoldText, BodyText, HeadingLText, HeadingSText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { refreshRequirementsAction } from '~/framework/modules/auth/actions';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { getSession } from '~/framework/modules/auth/reducer';
import {
  IEntcoreEmailValidationState,
  IEntcoreMFAValidationState,
  IEntcoreMobileValidationState,
  getMFAValidationInfos,
  requestEmailVerificationCode,
  requestMobileVerificationCode,
  verifyEmailCode,
  verifyMFACode,
  verifyMobileCode,
} from '~/framework/modules/auth/service';
import { profileUpdateAction } from '~/framework/modules/user/actions';
import { userRouteNames } from '~/framework/modules/user/navigation';
import { ModificationType } from '~/framework/modules/user/screens/home/types';
import { navBarOptions } from '~/framework/navigation/navBar';
import { tryAction } from '~/framework/util/redux/actions';

import styles from './styles';
import {
  AuthMFAScreenDispatchProps,
  AuthMFAScreenPrivateProps,
  AuthMFAScreenStoreProps,
  CodeState,
  PageTexts,
  ResendResponse,
} from './types';

const animationSources = {
  [CodeState.CODE_CORRECT]: require('ASSETS/animations/mfa/code-correct.json'),
  [CodeState.CODE_EXPIRED]: require('ASSETS/animations/mfa/code-wrong-locked.json'),
  [CodeState.CODE_WRONG]: require('ASSETS/animations/mfa/code-wrong.json'),
  [CodeState.CODE_RESENT]: require('ASSETS/animations/mfa/code-wrong-unlocked.json'),
};

const CELL_COUNT = 6;
const CODE_RESEND_DELAY = 15000;
const CODE_VALIDATION_DELAY = 500;
const CODE_REDIRECTION_DELAY = 500;

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<
  AuthNavigationParams,
  typeof authRouteNames.mfa | typeof authRouteNames.mfaModal
>): NativeStackNavigationOptions => {
  const routeParams = route.params;
  const title = routeParams.isEmailMFA || routeParams.isMobileMFA ? routeParams.navBarTitle : I18n.get('auth-mfa-title');
  return {
    ...navBarOptions({
      navigation,
      route,
      title,
    }),
  };
};

const feedbackTexts = {
  mfaEmail: {
    [CodeState.CODE_CORRECT]: 'auth-mfa-email-feedback-codecorrect',
    [CodeState.CODE_EXPIRED]: 'auth-mfa-email-feedback-codeexpired',
    [CodeState.CODE_WRONG]: 'auth-mfa-email-feedback-codewrong',
  },
  mfaMobile: {
    [CodeState.CODE_CORRECT]: 'auth-mfa-mobile-feedback-codecorrect',
    [CodeState.CODE_EXPIRED]: 'auth-mfa-mobile-feedback-codeexpired',
    [CodeState.CODE_WRONG]: 'auth-mfa-mobile-feedback-codewrong',
  },
  mfa: {
    [CodeState.CODE_CORRECT]: 'auth-mfa-feedback-codecorrect',
    [CodeState.CODE_EXPIRED]: 'auth-mfa-feedback-codeexpired',
    [CodeState.CODE_WRONG]: 'auth-mfa-feedback-codewrong',
  },
};

const AuthMFAScreen = (props: AuthMFAScreenPrivateProps) => {
  const { tryRefreshRequirements, tryUpdateProfile, navigation, route } = props;

  const platform = props.route.params.platform;
  const modificationType = route.params.modificationType;
  const mfaRedirectionRoute = route.params.mfaRedirectionRoute;
  const isEmailMFA = route.params.isEmailMFA;
  const isMobileMFA = route.params.isMobileMFA;
  const email = route.params.email;
  const mobile = isMobileMFA ? route.params.mobile : props.session?.user?.mobile;
  const isModifyingEmail = modificationType === ModificationType.EMAIL;
  const isModifyingMobile = modificationType === ModificationType.MOBILE;
  const isEmailOrMobileMFA = isEmailMFA || isMobileMFA;

  const [isVerifyingEnabled, setIsVerifyingEnabled] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isResendingVerificationCode, setIsResendingVerificationCode] = useState(false);
  const [isCodeStateHidden, setIsCodeStateHidden] = useState(true);
  const [code, setCode] = useState('');
  const [codeState, setCodeState] = useState<CodeState>(CodeState.PRISTINE);
  const [animationSource, setAnimationSource] = useState(animationSources[CodeState.CODE_CORRECT]);
  const animationRef = useRef<LottieView>(null);

  const codeFieldRef = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [codeFieldProps, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

  const isCodeComplete = code.length === CELL_COUNT;
  const isCodeCorrect = codeState === CodeState.CODE_CORRECT;
  const isCodeStateUnknown = codeState === CodeState.CODE_STATE_UNKNOWN;
  const isVerifyingActive = isVerifyingEnabled || isVerifyingCode;
  const isResendInactive = isResendDisabled || isResendingVerificationCode || isVerifyingActive || isCodeCorrect;
  const isCodeStateDisplayed = !(isCodeStateHidden || isVerifyingActive || isCodeStateUnknown);

  const codeStateColor = theme.palette.status[isCodeCorrect ? 'success' : 'failure'].regular;
  const resendOpacity = isResendInactive ? UI_VALUES.opacity.half : UI_VALUES.opacity.opaque;

  const texts: PageTexts = isEmailMFA
    ? {
        feedback: I18n.get(feedbackTexts.mfaEmail[codeState]),
        message: I18n.get('auth-mfa-email-message'),
        messageSent: `${I18n.get('auth-mfa-email-message-sent')} ${email}.`,
        resendToast: I18n.get('auth-mfa-email-toast'),
        title: I18n.get('auth-mfa-email-title'),
      }
    : isMobileMFA
      ? {
          feedback: I18n.get(feedbackTexts.mfaMobile[codeState]),
          message: I18n.get('auth-mfa-mobile-message'),
          messageSent: `${I18n.get('auth-mfa-mobile-message-sent')} ${mobile}.`,
          resendToast: I18n.get('auth-mfa-mobile-toast'),
          title: I18n.get('auth-mfa-mobile-title'),
        }
      : {
          feedback: I18n.get(feedbackTexts.mfa[codeState]),
          message: I18n.get('auth-mfa-message'),
          messageSent: `${I18n.get('auth-mfa-message-sent')} ${mobile}.`,
          resendToast: I18n.get('auth-mfa-toast'),
          title: I18n.get('auth-mfa-title'),
        };

  const setResendTimer = () => {
    setIsResendDisabled(true);
    setTimeout(() => {
      setIsResendDisabled(false);
    }, CODE_RESEND_DELAY);
  };

  const setVerifyTimer = () => {
    setIsVerifyingEnabled(true);
    setTimeout(() => {
      setIsVerifyingEnabled(false);
    }, CODE_VALIDATION_DELAY);
  };

  const startAnimation = (state: CodeState) => {
    setAnimationSource(animationSources[state]);
    animationRef.current?.play();
  };

  const verifyCode = useCallback(
    async (toVerify: string) => {
      try {
        setIsVerifyingCode(true);
        let validationState: IEntcoreEmailValidationState | IEntcoreMobileValidationState | IEntcoreMFAValidationState | undefined;
        if (isEmailMFA) validationState = await verifyEmailCode(toVerify);
        else if (isMobileMFA) validationState = await verifyMobileCode(toVerify);
        else validationState = await verifyMFACode(toVerify);
        const state =
          validationState?.state === 'valid'
            ? CodeState.CODE_CORRECT
            : validationState?.ttl === 0 || validationState?.tries === 0
              ? CodeState.CODE_EXPIRED
              : CodeState.CODE_WRONG;
        const isCodeAlreadyExpired = codeState === CodeState.CODE_EXPIRED && state === CodeState.CODE_EXPIRED;
        if (!isCodeAlreadyExpired) startAnimation(state);
        setCodeState(state);
      } catch {
        setCodeState(CodeState.CODE_STATE_UNKNOWN);
      } finally {
        setIsVerifyingCode(false);
      }
    },
    [codeState, isEmailMFA, isMobileMFA],
  );

  const verifyTypedCode = useCallback(() => {
    if (isCodeComplete) {
      setVerifyTimer();
      verifyCode(code);
      setIsCodeStateHidden(false);
    }
  }, [code, isCodeComplete, verifyCode]);

  const resetCode = useCallback(() => {
    setCode('');
    codeFieldRef?.current?.focus();
    setIsCodeStateHidden(true);
  }, [codeFieldRef]);

  const resendVerificationCode = useCallback(async () => {
    try {
      setIsResendingVerificationCode(true);
      if (isEmailMFA) {
        await requestEmailVerificationCode(platform, email!);
      } else if (isMobileMFA) {
        await requestMobileVerificationCode(platform, mobile!);
      } else await getMFAValidationInfos();
      return ResendResponse.SUCCESS;
    } catch {
      return ResendResponse.FAIL;
    } finally {
      setIsResendingVerificationCode(false);
    }
  }, [email, isEmailMFA, isMobileMFA, mobile, platform]);

  const resendCode = useCallback(async () => {
    setResendTimer();
    const resendResponse = await resendVerificationCode();
    if (resendResponse === ResendResponse.FAIL) {
      Toast.showError(I18n.get('auth-mfa-error-text'));
    } else if (resendResponse === ResendResponse.SUCCESS) {
      Toast.showSuccess(texts.resendToast);
      if (codeState === CodeState.CODE_EXPIRED) startAnimation(CodeState.CODE_RESENT);
    }
  }, [codeState, resendVerificationCode, texts.resendToast]);

  const redirectMFA = useCallback(() => {
    if (isCodeCorrect) {
      const params = { navBarTitle: route.params.navBarTitle, modificationType, platform };
      navigation.replace(mfaRedirectionRoute!, params);
    }
  }, [isCodeCorrect, modificationType, navigation, platform, route.params.navBarTitle, mfaRedirectionRoute]);

  const redirectEmailOrMobileMFA = useCallback(async () => {
    if (isModifyingEmail || isModifyingMobile) {
      try {
        await tryUpdateProfile(isModifyingEmail ? { email } : { mobile });
        navigation.navigate(userRouteNames.home);
        Toast.showSuccess(I18n.get(isModifyingEmail ? 'auth-change-email-edit-toast' : 'auth-change-mobile-edit-toast'));
      } catch {
        Toast.showError(I18n.get('auth-mfa-error-text'));
      }
    } else {
      try {
        await tryRefreshRequirements();
      } catch {
        Toast.showError(I18n.get('auth-mfa-error-text'));
      }
    }
  }, [isModifyingEmail, isModifyingMobile, tryUpdateProfile, email, mobile, navigation, tryRefreshRequirements]);

  useEffect(() => setResendTimer(), []);

  useEffect(() => {
    if (!isVerifyingActive) {
      if (isCodeStateUnknown) {
        Toast.showError(I18n.get('auth-mfa-error-text'));
      } else if (isCodeCorrect && isEmailOrMobileMFA) {
        setTimeout(() => redirectEmailOrMobileMFA(), CODE_REDIRECTION_DELAY);
      }
    }
  }, [isCodeCorrect, isCodeStateUnknown, isEmailOrMobileMFA, isVerifyingActive, redirectEmailOrMobileMFA]);

  const onRedirectMFA = useCallback(() => redirectMFA(), [redirectMFA]);
  const onVerifyTypedCode = useCallback(() => verifyTypedCode(), [verifyTypedCode]);
  const onResetCode = useCallback(() => resetCode(), [resetCode]);
  const onResendCode = useCallback(() => resendCode(), [resendCode]);

  return (
    <KeyboardPageView style={styles.page} scrollable>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.imageContainer}>
            {isEmailOrMobileMFA ? (
              <NamedSVG
                name={`user-${isEmailMFA ? 'email' : 'smartphone'}`}
                width={UI_SIZES.elements.thumbnail}
                height={UI_SIZES.elements.thumbnail}
              />
            ) : (
              <LottieView
                ref={animationRef}
                source={animationSource}
                style={styles.animation}
                loop={false}
                speed={0.5}
                onAnimationFinish={onRedirectMFA}
              />
            )}
          </View>
          <HeadingSText style={styles.title}>{texts.title}</HeadingSText>
          <SmallText style={styles.contentSent}>{texts.messageSent}</SmallText>
          <SmallText style={styles.content}>{texts.message}</SmallText>
          <View pointerEvents="box-none" style={styles.codeFieldContainer}>
            <CodeField
              {...codeFieldProps}
              ref={codeFieldRef}
              caretHidden={code.length > 0}
              cellCount={CELL_COUNT}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              renderCell={({ index, symbol, isFocused }) => (
                <HeadingLText
                  key={index}
                  style={[
                    styles.codeFieldCell,
                    {
                      borderColor: isCodeStateDisplayed
                        ? codeStateColor
                        : isFocused
                          ? theme.palette.grey.graphite
                          : theme.palette.grey.stone,
                    },
                  ]}
                  onLayout={getCellOnLayoutHandler(index)}>
                  {symbol || (isFocused ? <Cursor /> : null)}
                </HeadingLText>
              )}
              value={code}
              onChangeText={setCode}
              onBlur={onVerifyTypedCode}
            />
            {/* Note: the CodeField's "editable" prop is not sufficient to prevent the user from typing, so an invisible absolute View is used instead.*/}
            {isCodeComplete ? (
              <TouchableWithoutFeedback disabled={isVerifyingActive || isCodeCorrect || isCodeStateUnknown} onPress={onResetCode}>
                <View style={styles.codeFieldWrapper} />
              </TouchableWithoutFeedback>
            ) : null}
          </View>
          <View style={styles.feedbackContainer}>
            {isVerifyingActive ? (
              <ActivityIndicator size="large" color={theme.palette.primary.regular} />
            ) : isCodeStateDisplayed ? (
              <>
                <Picture
                  type="NamedSvg"
                  name={`pictos-${isCodeCorrect ? 'success-outline' : 'error'}`}
                  fill={codeStateColor}
                  width={33}
                  height={33}
                />
                <BodyText style={[styles.codeStateText, { color: codeStateColor }]}>{texts.feedback}</BodyText>
              </>
            ) : null}
          </View>
        </View>
        <View style={styles.resendContainer}>
          <SmallText style={styles.issueText}>{I18n.get('auth-mfa-issue')}</SmallText>
          <TouchableOpacity
            style={[styles.resendButton, { opacity: resendOpacity }]}
            disabled={isResendInactive}
            onPress={onResendCode}>
            <Picture
              type="NamedSvg"
              name="pictos-redo"
              fill={theme.palette.grey.black}
              width={UI_SIZES.dimensions.width.medium}
              height={UI_SIZES.dimensions.height.medium}
            />
            <BodyBoldText style={styles.resendText}>{I18n.get('auth-mfa-resend')}</BodyBoldText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardPageView>
  );
};

const mapStateToProps: (state: IGlobalState) => AuthMFAScreenStoreProps = state => {
  return { session: getSession() };
};

const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>) => AuthMFAScreenDispatchProps = dispatch => {
  return bindActionCreators<AuthMFAScreenDispatchProps>(
    {
      tryRefreshRequirements: tryAction(refreshRequirementsAction),
      tryUpdateProfile: tryAction(profileUpdateAction),
    },
    dispatch,
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthMFAScreen);
