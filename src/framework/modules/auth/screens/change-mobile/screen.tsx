import { RouteProp, UNSTABLE_usePreventRemove, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import I18n from 'i18n-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, TouchableOpacity, View } from 'react-native';
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

import theme from '~/app/theme';
import { ActionButton } from '~/framework/components/buttons/action';
import { UI_SIZES } from '~/framework/components/constants';
import { KeyboardPageView } from '~/framework/components/page';
import { Picture } from '~/framework/components/picture';
import { NamedSVG } from '~/framework/components/picture/NamedSVG';
import { CaptionItalicText, HeadingSText, SmallBoldText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { logoutAction } from '~/framework/modules/auth/actions';
import { AuthRouteNames, IAuthNavigationParams, getAuthNavigationState } from '~/framework/modules/auth/navigation';
import { getMobileValidationInfos, sendMobileVerificationCode } from '~/framework/modules/auth/service';
import { ModificationType } from '~/framework/modules/user/screens/home/types';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { isEmpty } from '~/framework/util/object';
import { tryAction } from '~/framework/util/redux/actions';

import styles from './styles';
import { AuthChangeMobileScreenDispatchProps, AuthChangeMobileScreenPrivateProps, MobileState, PageTexts } from './types';

const getNavBarTitle = (route: RouteProp<IAuthNavigationParams, AuthRouteNames.changeMobile>) =>
  route.params.navBarTitle || I18n.t('auth-change-mobile-verify');

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<IAuthNavigationParams, typeof AuthRouteNames.changeMobile>): NativeStackNavigationOptions => {
  return {
    ...navBarOptions({
      navigation,
      route,
    }),
    headerTitle: navBarTitle(getNavBarTitle(route)),
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
  const rememberMe = route.params.rememberMe;
  const defaultMobile = route.params.defaultMobile;
  const modificationType = route.params.modificationType;
  const isModifyingMobile = modificationType === ModificationType.MOBILE;

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [mobile, setMobile] = useState<string>('');
  const [region, setRegion] = useState<CountryCode>('FR');
  const [mobileState, setMobileState] = useState<MobileState>(MobileState.PRISTINE);
  const isMobileEmpty = isEmpty(mobile);
  const isMobileStatePristine = mobileState === MobileState.PRISTINE;

  const texts: PageTexts = isModifyingMobile
    ? {
        button: I18n.t('auth-change-mobile-verify-button'),
        message: I18n.t('auth-change-mobile-edit-message'),
        label: I18n.t('auth-change-mobile-edit-label'),
        title: I18n.t('auth-change-mobile-edit-title'),
      }
    : {
        button: I18n.t('auth-change-mobile-verify-button'),
        message: I18n.t('auth-change-mobile-verify-message'),
        label: I18n.t('auth-change-mobile-verify-label'),
        title: I18n.t('auth-change-mobile-verify-title'),
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

  const doSendMobileVerificationCode = useCallback(
    async (toVerify: string) => {
      try {
        // First, we clean the number by trimming - and . characters (generally used as separators)
        const phoneNumberCleaned = toVerify.replaceAll(/[-.]+/g, '');
        const isValidMobileNumberForRegion = getIsValidMobileNumberForRegion(phoneNumberCleaned);
        const mobileNumberFormatted = getFormattedNumber(phoneNumberCleaned, region);
        // Exit if mobile is not valid
        if (!isValidMobileNumberForRegion || !mobileNumberFormatted) return MobileState.MOBILE_FORMAT_INVALID;
        setIsSendingCode(true);
        if (isModifyingMobile) {
          // Exit if mobile has already been verified
          const mobileValidationInfos = await getMobileValidationInfos();
          if (mobileNumberFormatted === mobileValidationInfos?.mobileState?.valid) {
            setIsSendingCode(false);
            return MobileState.MOBILE_ALREADY_VERIFIED;
          }
        }
        await sendMobileVerificationCode(platform, mobileNumberFormatted);
        navigation.navigate(AuthRouteNames.mfa, {
          platform,
          rememberMe,
          modificationType,
          isMobileMFA: true,
          mobile: mobileNumberFormatted,
          navBarTitle: getNavBarTitle(route),
        });
      } catch {
        Toast.showError(I18n.t('common.error.text'));
      } finally {
        setIsSendingCode(false);
      }
    },
    [getIsValidMobileNumberForRegion, isModifyingMobile, modificationType, navigation, platform, region, rememberMe, route],
  );

  const sendSMS = useCallback(async () => {
    const sendResponse = await doSendMobileVerificationCode(mobile);
    if (sendResponse) setMobileState(sendResponse);
  }, [doSendMobileVerificationCode, mobile]);

  const changeMobile = useCallback(
    (number: string) => {
      if (!isMobileStatePristine) setMobileState(MobileState.PRISTINE);
      setMobile(number);
    },
    [isMobileStatePristine],
  );

  const refuseMobileVerification = useCallback(async () => {
    try {
      await tryLogout();
      navigation.reset(getAuthNavigationState(platform));
    } catch {
      Toast.showError(I18n.t('common.error.text'));
    }
  }, [navigation, tryLogout, platform]);

  UNSTABLE_usePreventRemove(!isMobileEmpty && isScreenFocused, ({ data }) => {
    Alert.alert(I18n.t('auth-change-mobile-edit-alert-title'), I18n.t('auth-change-mobile-edit-alert-message'), [
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

  const onChangeMobile = useCallback((text: string) => changeMobile(text), [changeMobile]);
  const onSetRegion = useCallback((code: Country) => setRegion(code.cca2), [setRegion]);
  const onSendSMS = useCallback(() => sendSMS(), [sendSMS]);
  const onRefuseMobileVerification = useCallback(() => refuseMobileVerification(), [refuseMobileVerification]);

  return (
    <KeyboardPageView style={styles.page} scrollable>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <NamedSVG name="user-smartphone" width={UI_SIZES.elements.thumbnail} height={UI_SIZES.elements.thumbnail} />
        </View>
        <HeadingSText style={styles.title}>{texts.title}</HeadingSText>
        <SmallText style={styles.content}>{texts.message}</SmallText>
        <View style={styles.inputTitleContainer}>
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
          placeholder={I18n.t('auth-change-mobile-placeholder')}
          ref={phoneInputRef}
          value={mobile}
          defaultCode={region}
          layout="third"
          onChangeFormattedText={onChangeMobile}
          onChangeCountry={onSetRegion}
          containerStyle={[
            { borderColor: isMobileStatePristine ? theme.palette.grey.cloudy : theme.palette.status.failure.regular },
            styles.input,
          ]}
          flagButtonStyle={styles.flagButton}
          codeTextStyle={styles.flagCode}
          textContainerStyle={[
            styles.inputTextContainer,
            {
              borderColor: isMobileStatePristine ? theme.palette.grey.cloudy : theme.palette.status.failure.regular,
            },
          ]}
          textInputStyle={styles.inputTextInput}
          flagSize={Platform.select({ ios: UI_SIZES.dimensions.width.larger, android: UI_SIZES.dimensions.width.medium })}
          drowDownImage={
            <NamedSVG style={styles.dropDownArrow} name="ui-rafterDown" fill={theme.ui.text.regular} width={12} height={12} />
          }
          countryPickerProps={{
            filterProps: {
              placeholder: I18n.t('auth-change-mobile-country-placeholder'),
              autoFocus: true,
            },
            language: countryListLanguages[I18n.currentLocale()] ?? countryListLanguages.DEFAULT,
          }}
          textInputProps={{
            hitSlop: {
              top: -UI_SIZES.spacing.big,
              bottom: -UI_SIZES.spacing.big,
              left: 0,
              right: 0,
            },
          }}
        />
        <CaptionItalicText style={styles.errorText}>
          {isMobileStatePristine
            ? I18n.t('common.space')
            : mobileState === MobileState.MOBILE_ALREADY_VERIFIED
            ? I18n.t('auth-change-mobile-error-same')
            : I18n.t('auth-change-mobile-error-invalid')}
        </CaptionItalicText>
        <ActionButton
          style={styles.sendButton}
          text={texts.button}
          disabled={isMobileEmpty}
          loading={isSendingCode}
          action={onSendSMS}
        />
        {isModifyingMobile ? null : (
          <TouchableOpacity style={styles.logoutButton} onPress={onRefuseMobileVerification}>
            <SmallBoldText style={styles.logoutText}>{I18n.t('auth-change-mobile-verify-disconnect')}</SmallBoldText>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardPageView>
  );
};

const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>) => AuthChangeMobileScreenDispatchProps = dispatch => {
  return bindActionCreators(
    {
      tryLogout: tryAction(logoutAction),
    },
    dispatch,
  );
};

export default connect(undefined, mapDispatchToProps)(AuthChangeMobileScreen);
