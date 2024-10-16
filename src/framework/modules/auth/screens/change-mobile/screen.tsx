import { RouteProp, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import PhoneInput, {
  Country,
  CountryCode,
  getFormattedNumber,
  getRegionCodeAndNationalNumber,
  isMobileNumber,
  isValidNumber,
} from 'react-native-phone-number-input';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import DefaultButton from '~/framework/components/buttons/default';
import PrimaryButton from '~/framework/components/buttons/primary';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import { LoadingIndicator } from '~/framework/components/loading';
import { KeyboardPageView } from '~/framework/components/page';
import { Picture } from '~/framework/components/picture';
import { NamedSVG } from '~/framework/components/picture/NamedSVG';
import { CaptionItalicText, HeadingSText, SmallBoldText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import usePreventBack from '~/framework/hooks/prevent-back';
import { manualLogoutAction } from '~/framework/modules/auth/actions';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { getUserRequirements, requestMobileVerificationCode } from '~/framework/modules/auth/service';
import { profileUpdateAction } from '~/framework/modules/user/actions';
import { ModificationType } from '~/framework/modules/user/screens/home/types';
import { navBarOptions } from '~/framework/navigation/navBar';
import { containsKey, isEmpty } from '~/framework/util/object';
import { tryAction } from '~/framework/util/redux/actions';

import styles from './styles';
import { AuthChangeMobileScreenDispatchProps, AuthChangeMobileScreenPrivateProps, MobileState, PageTexts } from './types';

const getNavBarTitle = (route: RouteProp<AuthNavigationParams, typeof authRouteNames.changeMobile>) =>
  route.params.navBarTitle || I18n.get('auth-change-mobile-verify');

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.changeMobile>): NativeStackNavigationOptions => {
  return {
    ...navBarOptions({
      navigation,
      route,
      title: getNavBarTitle(route),
      titleTestID: 'phone-title',
      backButtonTestID: 'phone-back',
    }),
  };
};

const countryListLanguages = {
  fr: 'fra',
  en: 'common', // this is english
  es: 'spa',
  DEFAULT: 'common',
} as const;

const AuthChangeMobileScreen = (props: AuthChangeMobileScreenPrivateProps) => {
  const { tryLogout, navigation, route } = props;
  const isScreenFocused = useIsFocused();
  const phoneInputRef = useRef<PhoneInput>(null);

  const platform = route.params.platform;
  const defaultMobile = route.params.defaultMobile;
  const modificationType = route.params.modificationType;
  const isModifyingMobile = modificationType === ModificationType.MOBILE;

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [mobile, setMobile] = useState<string>('');
  const [region, setRegion] = useState<CountryCode>('FR');
  const [mobileState, setMobileState] = useState<MobileState>(MobileState.PRISTINE);
  const isMobileEmpty = isEmpty(mobile);
  const isMobileStateClean = mobileState === MobileState.STALE || mobileState === MobileState.PRISTINE;

  // Web 4.8+ compliance:
  //  -mobile verification APIs are available if /auth/user/requirements contains the needMfa field
  //  -requirementsChecked is used to avoid multiple calls to /auth/user/requirements (useEffect can be called multiple times)
  const [requirementsChecked, setRequirementsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isCheckMobile, setIsCheckMobile] = useState(false);
  useEffect(() => {
    async function checkRequirements() {
      try {
        setRequirementsChecked(true);
        setIsLoading(true);
        const requirements = await getUserRequirements(platform);
        setIsCheckMobile(containsKey(requirements as object, 'needRevalidateMobile'));
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }
    if (!requirementsChecked) checkRequirements();
  }, [platform, requirementsChecked]);

  const button = isCheckMobile ? I18n.get('auth-change-mobile-verify-button') : I18n.get('auth-change-mobile-edit-button');
  const message = isModifyingMobile
    ? isCheckMobile
      ? I18n.get('auth-change-mobile-edit-message')
      : I18n.get('auth-change-mobile-edit-message-unverified')
    : I18n.get('auth-change-mobile-verify-message');
  const texts: PageTexts = isModifyingMobile
    ? {
        button,
        message,
        label: I18n.get('auth-change-mobile-edit-label'),
        title: I18n.get('auth-change-mobile-edit-title'),
      }
    : {
        button,
        message,
        label: I18n.get('auth-change-mobile-verify-label'),
        title: I18n.get('auth-change-mobile-verify-title'),
      };

  useEffect(() => {
    if (defaultMobile) {
      const regionCodeAndNationalNumber = getRegionCodeAndNationalNumber(defaultMobile);
      if (regionCodeAndNationalNumber) {
        const regionCode = regionCodeAndNationalNumber.regionCode;
        const nationalNumber = regionCodeAndNationalNumber.nationalNumber;
        if (regionCode) setRegion(regionCode);
        if (nationalNumber) setMobile(nationalNumber);
      } else setMobile(defaultMobile);
    }
  }, [defaultMobile]);

  const getIsValidMobileNumberForRegion = useCallback(
    (toVerify: string) => {
      try {
        // Returns whether number is valid for selected region and an actual mobile number
        const isValidNumberForRegion = isValidNumber(toVerify, region);
        const isValidMobileNumber = isMobileNumber(toVerify, region);
        return isValidNumberForRegion && isValidMobileNumber;
      } catch {
        // Returns false in case of format error (string is too short, isn't recognized as a phone number, etc.)
        return false;
      }
    },
    [region],
  );

  const doRequestMobileVerificationCode = useCallback(
    async (toVerify: string) => {
      try {
        // First, we clean the number by trimming - and . characters (generally used as separators)
        const phoneNumberCleaned = toVerify.replaceAll(/[-.]+/g, '');
        const isValidMobileNumberForRegion = getIsValidMobileNumberForRegion(phoneNumberCleaned);
        const mobileNumberFormatted = getFormattedNumber(phoneNumberCleaned, region);
        // Exit if mobile is not valid
        if (!isValidMobileNumberForRegion || !mobileNumberFormatted) return MobileState.MOBILE_FORMAT_INVALID;
        if (isCheckMobile) {
          setIsSendingCode(true);
          await requestMobileVerificationCode(platform, mobileNumberFormatted);
          navigation.navigate(authRouteNames.mfa, {
            platform,
            rememberMe: false,
            modificationType,
            isMobileMFA: true,
            mobile: mobileNumberFormatted,
            navBarTitle: getNavBarTitle(route),
          });
        } else {
          setIsSendingCode(false);
          setMobileState(MobileState.PRISTINE);
          await props.trySaveNewMobile({ mobile: mobileNumberFormatted });
          setTimeout(() => {
            props.navigation.goBack();
            Toast.showSuccess(I18n.get('auth-change-mobile-edit-toast'));
          });
        }
      } catch {
        Toast.showError(I18n.get('auth-change-mobile-error-text'));
      } finally {
        setIsSendingCode(false);
      }
    },
    [getIsValidMobileNumberForRegion, isCheckMobile, modificationType, navigation, platform, props, region, route],
  );

  const sendSMS = useCallback(async () => {
    const sendResponse = await doRequestMobileVerificationCode(mobile);
    if (sendResponse) setMobileState(sendResponse);
  }, [doRequestMobileVerificationCode, mobile]);

  const changeMobile = useCallback(
    (number: string) => {
      if (mobileState !== MobileState.STALE) setMobileState(MobileState.STALE);
      setMobile(number);
    },
    [mobileState],
  );

  const refuseMobileVerification = useCallback(async () => {
    try {
      await tryLogout();
    } catch {
      Toast.showError(I18n.get('auth-change-mobile-error-text'));
    }
  }, [tryLogout]);

  usePreventBack({
    title: I18n.get('auth-change-mobile-edit-alert-title'),
    text: I18n.get('auth-change-mobile-edit-alert-message'),
    showAlert: !isMobileEmpty && mobileState !== MobileState.PRISTINE && isScreenFocused && isModifyingMobile,
  });

  const onChangeMobile = useCallback((text: string) => changeMobile(text), [changeMobile]);
  const onSetRegion = useCallback((code: Country) => setRegion(code.cca2), [setRegion]);
  const onSendSMS = useCallback(() => sendSMS(), [sendSMS]);
  const onRefuseMobileVerification = useCallback(() => {
    if (!isMobileEmpty && mobileState !== MobileState.PRISTINE && isScreenFocused) {
      Alert.alert(I18n.get('auth-change-mobile-edit-alert-title'), I18n.get('auth-change-mobile-edit-alert-message'), [
        {
          text: I18n.get('common-quit'),
          onPress: () => {
            refuseMobileVerification();
          },
          style: 'destructive',
        },
        {
          text: I18n.get('common-continue'),
          style: 'default',
        },
      ]);
    } else {
      refuseMobileVerification();
    }
  }, [isMobileEmpty, isScreenFocused, mobileState, refuseMobileVerification]);

  return (
    <KeyboardPageView style={styles.page} scrollable>
      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <EmptyConnectionScreen />
      ) : (
        <View style={styles.container}>
          <View style={styles.imageContainer}>
            <NamedSVG name="user-smartphone" width={UI_SIZES.elements.thumbnail} height={UI_SIZES.elements.thumbnail} />
          </View>
          <HeadingSText style={styles.title} testID="phone-new-title">
            {texts.title}
          </HeadingSText>
          <SmallText style={styles.content} testID="phone-new-subtitle">
            {texts.message}
          </SmallText>
          <View style={styles.inputTitleContainer} testID="phone-new-label">
            <Picture
              type="NamedSvg"
              name="pictos-smartphone"
              fill={theme.palette.grey.black}
              width={UI_SIZES.dimensions.width.mediumPlus}
              height={UI_SIZES.dimensions.height.mediumPlus}
            />
            <SmallBoldText style={styles.inputTitle}>{texts.label}</SmallBoldText>
          </View>
          <PhoneInput
            placeholder={I18n.get('auth-change-mobile-placeholder')}
            ref={phoneInputRef}
            value={mobile}
            defaultCode={region}
            layout="third"
            onChangeFormattedText={onChangeMobile}
            onChangeCountry={onSetRegion}
            containerStyle={[
              { borderColor: isMobileStateClean ? theme.palette.grey.cloudy : theme.palette.status.failure.regular },
              styles.input,
            ]}
            flagButtonStyle={styles.flagButton}
            codeTextStyle={styles.flagCode}
            textContainerStyle={[
              styles.inputTextContainer,
              {
                borderColor: isMobileStateClean ? theme.palette.grey.cloudy : theme.palette.status.failure.regular,
              },
            ]}
            textInputStyle={styles.inputTextInput}
            flagSize={Platform.select({ ios: UI_SIZES.dimensions.width.larger, android: UI_SIZES.dimensions.width.medium })}
            drowDownImage={
              <NamedSVG style={styles.dropDownArrow} name="ui-rafterDown" fill={theme.ui.text.regular} width={12} height={12} />
            }
            countryPickerProps={{
              filterProps: {
                placeholder: I18n.get('auth-change-mobile-country-placeholder'),
                autoFocus: true,
              },
              language: countryListLanguages[I18n.getLanguage()] ?? countryListLanguages.DEFAULT,
            }}
            testIDCountryWithCode="phone-new-country"
            textInputProps={{
              hitSlop: {
                top: -UI_SIZES.spacing.big,
                bottom: -UI_SIZES.spacing.big,
                left: 0,
                right: 0,
              },
              keyboardType: 'phone-pad',
              inputMode: 'tel',
              placeholderTextColor: theme.palette.grey.stone,
              testID: 'phone-new-field',
            }}
          />
          <CaptionItalicText style={styles.errorText} testID="phone-new-error">
            {isMobileStateClean ? I18n.get('common-space') : I18n.get('auth-change-mobile-error-invalid')}
          </CaptionItalicText>
          <PrimaryButton
            style={styles.sendButton}
            text={texts.button}
            disabled={isMobileEmpty}
            loading={isSendingCode}
            action={onSendSMS}
            testID="phone-change"
          />
          {isModifyingMobile ? null : (
            <DefaultButton
              style={styles.logoutButton}
              text={I18n.get('auth-change-mobile-verify-disconnect')}
              contentColor={theme.palette.status.failure.regular}
              action={onRefuseMobileVerification}
            />
          )}
        </View>
      )}
    </KeyboardPageView>
  );
};

const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>) => AuthChangeMobileScreenDispatchProps = dispatch => {
  return bindActionCreators(
    {
      tryLogout: tryAction(manualLogoutAction),
      trySaveNewMobile: tryAction(profileUpdateAction),
    },
    dispatch,
  );
};

export default connect(undefined, mapDispatchToProps)(AuthChangeMobileScreen);
