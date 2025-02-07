import * as React from 'react';
import { Platform } from 'react-native';

import PhoneInput from 'react-native-phone-number-input';

import styles from './styles';

import { InputPhoneProps } from './';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { CaptionItalicText } from '~/framework/components/text';

const countryListLanguages = {
  DEFAULT: 'common',
  en: 'common',
  es: 'spa',
  fr: 'fra',
} as const;

export const InputPhone = (props: InputPhoneProps) => {
  return (
    <>
      <PhoneInput
        defaultCode={props.defaultCode}
        onChangeCountry={props.onChangeCountry}
        onChangeFormattedText={props.onChangeText}
        placeholder={props.placeholder}
        layout="third"
        value={props.phoneNumber}
        containerStyle={[
          {
            borderColor: props.isMobileStateClean ? theme.palette.grey.cloudy : theme.palette.status.failure.regular,
          },
          styles.phoneInput,
        ]}
        flagButtonStyle={styles.flagButton}
        codeTextStyle={styles.flagCode}
        textContainerStyle={[
          styles.inputTextContainer,
          {
            borderColor: props.isMobileStateClean ? theme.palette.grey.cloudy : theme.palette.status.failure.regular,
          },
        ]}
        textInputStyle={styles.inputTextInput}
        flagSize={Platform.select({
          android: UI_SIZES.dimensions.width.medium,
          ios: UI_SIZES.dimensions.width.larger,
        })}
        drowDownImage={
          <Svg
            style={styles.dropDownArrow}
            name="ui-rafterDown"
            fill={theme.ui.text.regular}
            width={UI_SIZES.elements.icon.xxsmall}
            height={UI_SIZES.elements.icon.xxsmall}
          />
        }
        countryPickerProps={{
          filterProps: {
            autoFocus: true,
            placeholder: I18n.get('auth-activation-mobile-country-placeholder'),
          },
          language: countryListLanguages[I18n.getLanguage()] ?? countryListLanguages.DEFAULT,
        }}
        testIDCountryWithCode={props.testIDCountryWithCode}
        textInputProps={{
          hitSlop: {
            bottom: -UI_SIZES.spacing.big,
            left: 0,
            right: 0,
            top: -UI_SIZES.spacing.big,
          },
          inputMode: 'tel',
          keyboardType: 'phone-pad',
          onBlur: props.onPhoneInputBlur,
          placeholderTextColor: theme.palette.grey.stone,
          testID: props.testID,
        }}
      />
      <CaptionItalicText style={styles.errorText}>
        {props.isMobileStateClean ? I18n.get('common-space') : I18n.get('auth-error-activation-mobile-invalid')}
      </CaptionItalicText>
    </>
  );
};
