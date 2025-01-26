import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Country, CountryCode, getFormattedNumber, isMobileNumber, isValidNumber } from 'react-native-phone-number-input';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import styles from './styles';
import { ActivationScreenProps, ActivationScreenState, IFields } from './types';

import { I18n } from '~/app/i18n';
import AlertCard from '~/framework/components/alert';
import PrimaryButton from '~/framework/components/buttons/primary';
import { Checkbox } from '~/framework/components/checkbox';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import InputContainer from '~/framework/components/inputs/container';
import { LabelIndicator } from '~/framework/components/inputs/container/label';
import EmailInput from '~/framework/components/inputs/email/';
import PasswordInput from '~/framework/components/inputs/password';
import InputPhone from '~/framework/components/inputs/phone/';
import { KeyboardPageView } from '~/framework/components/page';
import { openPDFReader } from '~/framework/components/pdf/pdf-reader';
import { Svg } from '~/framework/components/picture';
import { HeadingSText, SmallActionText, SmallText } from '~/framework/components/text';
import toast from '~/framework/components/toast';
import { useConstructor } from '~/framework/hooks/constructor';
import { loadAuthContextAction, loadPlatformLegalUrlsAction } from '~/framework/modules/auth/actions';
import { ActivationFormModel, ValueChangeArgs } from '~/framework/modules/auth/components/ActivationForm';
import { IActivationError, LegalUrls, PlatformAuthContext } from '~/framework/modules/auth/model';
import { Loading } from '~/ui/Loading';
import { ValidatorBuilder } from '~/utils/form';

const ActivationScreenLoader = (props: ActivationScreenProps) => {
  const { context, legalUrls, route, validReactionTypes } = props;

  const platform = route.params.platform;
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  useConstructor(async () => {
    if (!context && platform) {
      dispatch(loadAuthContextAction(platform));
    }
    if (!legalUrls && platform) {
      dispatch(loadPlatformLegalUrlsAction(platform));
    }
  });

  if (!platform) return <EmptyConnectionScreen />;
  if (!context || !legalUrls || !validReactionTypes) return <Loading />;
  else return <ActivationScreen {...props} context={context} legalUrls={legalUrls} />;
};

export default ActivationScreenLoader;

const keyboardPageViewScrollViewProps = { bounces: false, showsVerticalScrollIndicator: false };

export class ActivationScreen extends React.PureComponent<
  ActivationScreenProps & { context: PlatformAuthContext; legalUrls: LegalUrls },
  ActivationScreenState
> {
  private mounted = false;

  // fully controller component
  public state: ActivationScreenState = {
    acceptCGU: false,
    activationCode: this.props.route.params.credentials.password,
    activationState: 'IDLE',
    confirmPassword: '',
    login: this.props.route.params.credentials.username,
    mail: '',
    mailState: 'PRISTINE',
    password: '',
    phone: '',
    phoneCountry: 'FR',
    phoneState: 'PRISTINE',
    typing: false,
  };

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  private doActivation = async () => {
    try {
      this.setState({ activationState: 'RUNNING', error: undefined, typing: false });
      await this.props.trySubmit(this.props.route.params.platform, this.state);
    } catch (e) {
      const activationError = e as IActivationError;
      toast.showError(I18n.get('auth-activation-error-generic'));
      if (this.mounted) this.setState({ activationState: 'IDLE', error: activationError.error, typing: false });
    }
  };

  private onFieldChange = (key: IFields) => {
    return (valueChange: ValueChangeArgs<string>) => {
      const newState: Partial<ActivationScreenState> = {
        [key]: valueChange.value,
        typing: true,
      };
      this.setState(newState as any);
    };
  };

  private onCheckBoxPress = () => {
    this.setState(prevState => ({ acceptCGU: !prevState.acceptCGU }));
  };

  private onMailInputBlur = () => {
    const { mail } = this.state;
    this.verifyEmail(mail);
  };

  private onPhoneInputBlur = () => {
    const { phone } = this.state;
    if (this.props.context.mandatory?.phone) {
      this.verifyAndFormatPhoneNumber(phone);
    }
  };

  private onSetCountry = (newCountry: Country): void => {
    const country: CountryCode = newCountry.cca2;
    this.setState({ phoneCountry: country });
  };

  private doOpenLegalUrls = (title: string, url?: string) => {
    openPDFReader({ src: url, title });
  };

  private getIsValidMobileNumberForRegion = (toVerify: string) => {
    try {
      // Returns whether number is valid for selected region and an actual mobile number
      const isValidNumberForRegion = isValidNumber(toVerify, this.state.phoneCountry);
      const isValidMobileNumber = isMobileNumber(toVerify, this.state.phoneCountry);
      return isValidNumberForRegion && isValidMobileNumber;
    } catch {
      // Returns false in case of format error (string is too short, isn't recognized as a phone number, etc.)
      return false;
    }
  };

  private verifyAndFormatPhoneNumber = (phoneNumber: string) => {
    const phoneNumberCleaned = phoneNumber.replaceAll(/[-.]+/g, '');
    const isValidMobileNumberForRegion = this.getIsValidMobileNumberForRegion(phoneNumberCleaned);
    const mobileNumberFormatted = getFormattedNumber(phoneNumberCleaned, this.state.phoneCountry);
    if (isValidMobileNumberForRegion && mobileNumberFormatted) {
      this.setState(prevState => ({
        ...prevState,
        phone: mobileNumberFormatted,
        phoneState: 'PRISTINE',
      }));
      return true;
    }
    // Exit if mobile is not valid
    if (!isValidMobileNumberForRegion || !mobileNumberFormatted) {
      this.setState({ phoneState: 'MOBILE_FORMAT_INVALID' });
      return false;
    }
  };

  private verifyEmail = (toVerify: string) => {
    const verifiedEmail = new ValidatorBuilder().withEmail().build<string>().isValid(toVerify);
    if (verifiedEmail) {
      this.setState(prevState => ({
        ...prevState,
        mailState: 'PRISTINE',
      }));
      return true;
    }
    if (!verifiedEmail) {
      this.setState({ mailState: 'EMAIL_FORMAT_INVALID' });
      return false;
    }
  };

  public render() {
    const { acceptCGU, activationState, confirmPassword, error, mail, password, phone, typing } = this.state;
    const { context } = this.props;
    const formModel = new ActivationFormModel({
      ...context,
      emailRequired: context?.mandatory?.mail ?? false,
      password: () => password,
      phoneRequired: context?.mandatory?.phone ?? false,
    });
    const isNotValid = !acceptCGU || !formModel.validate({ ...this.state });
    const errorKey = typing ? formModel.firstErrorKey({ ...this.state }) : undefined;
    const errorText = errorKey ? I18n.get(errorKey) : error;
    const hasErrorKey = !!errorText;
    const isSubmitLoading = activationState === 'RUNNING';
    const cguUrl = this.props.legalUrls?.cgu;
    const usercharterUrl = this.props.legalUrls?.userCharter;
    const isMobileStateClean = this.state.phoneState === 'PRISTINE';
    const isEmailStatePristine = this.state.mailState === 'PRISTINE';
    const isEmailRequired = context.mandatory?.mail === true;
    const isPhoneRequired = context.mandatory?.phone === true;
    const passwordI18nKey = context.passwordRegexI18nActivation![I18n.getLanguage()];

    const passwordRules = (
      <>
        {passwordI18nKey ? (
          <AlertCard type="info" text={passwordI18nKey} style={styles.alertCard} testID="activation-password-rules" />
        ) : null}
      </>
    );

    return (
      <KeyboardPageView scrollable scrollViewProps={keyboardPageViewScrollViewProps} safeArea style={styles.page}>
        <Pressable onPress={() => formModel.blur()} style={styles.pressable}>
          <View style={styles.infos}>
            <Svg name="ui-userSearchColor" />
            <HeadingSText style={styles.infosText}>{I18n.get('auth-activation-welcome')}</HeadingSText>
            <SmallText style={styles.infosSubText}>{I18n.get('auth-activation-form-infos')}</SmallText>
          </View>
          {passwordRules}
          <InputContainer
            label={{
              icon: 'ui-lock',
              indicator: LabelIndicator.REQUIRED,
              text: I18n.get('auth-activation-password'),
            }}
            input={
              <PasswordInput
                annotation={formModel.showPasswordError(password) ? errorText : ''}
                onChangeText={formModel.password.changeCallback(this.onFieldChange('password'))}
                placeholder={I18n.get('auth-activation-password-placeholder')}
                showError={formModel.showPasswordError(password)}
                showIconCallback
                testID="activation-password"
                testIDToggle="activation-see-password"
                value={password}
              />
            }
          />

          <InputContainer
            style={styles.inputContainer}
            label={{
              icon: 'ui-lock',
              indicator: LabelIndicator.REQUIRED,
              text: I18n.get('auth-activation-password-confirmation'),
            }}
            input={
              <PasswordInput
                annotation={formModel.showConfirmError(confirmPassword) ? errorText : ''}
                onChangeText={formModel.confirm.changeCallback(this.onFieldChange('confirmPassword'))}
                placeholder={I18n.get('auth-activation-password-placeholder')}
                showError={formModel.showConfirmError(confirmPassword)}
                showIconCallback
                testID="activation-confirmed-password"
                testIDToggle="activation-see-confirmed-password"
                value={confirmPassword}
              />
            }
          />

          <InputContainer
            label={{
              icon: 'ui-mail',
              indicator: isEmailRequired ? LabelIndicator.REQUIRED : LabelIndicator.OPTIONAL,
              text: I18n.get('auth-activation-email-address'),
            }}
            input={
              <EmailInput
                annotation={
                  isEmailStatePristine || !formModel.showEmailError(mail)
                    ? I18n.get('common-space')
                    : I18n.get('auth-activation-email-error-invalid')
                }
                onBlur={this.onMailInputBlur}
                onChangeText={formModel.email.changeCallback(this.onFieldChange('mail'))}
                placeholder={I18n.get('auth-activation-email-placeholder')}
                showError={isEmailStatePristine ? undefined : formModel.showEmailError(mail)}
                showIconCallback
                testID="activation-email"
                value={mail}
              />
            }
          />

          <InputContainer
            style={styles.phoneInputContainer}
            label={{
              icon: 'ui-smartphone',
              indicator: isPhoneRequired ? LabelIndicator.REQUIRED : LabelIndicator.OPTIONAL,
              text: I18n.get('auth-activation-mobile'),
            }}
            input={
              <InputPhone
                defaultCode={this.state.phoneCountry}
                isMobileStateClean={isMobileStateClean}
                onChangeText={formModel.phone.changeCallback(this.onFieldChange('phone'))}
                onPhoneInputBlur={this.onPhoneInputBlur}
                onChangeCountry={this.onSetCountry}
                phoneNumber={phone}
                placeholder={I18n.get('auth-activation-mobile-placeholder')}
                testID="activation-phone"
                testIDCountryWithCode="phone-new-country"
              />
            }
          />
          <View style={styles.cguWrapper}>
            <Checkbox
              checked={acceptCGU}
              onPress={this.onCheckBoxPress}
              customContainerStyle={{ marginRight: UI_SIZES.spacing.minor }}
              testID="activation-accept-legal-condition"
            />
            <View style={styles.cguText} testID="activation-legal-condition">
              <SmallText>{I18n.get('auth-activation-cgu-accept')}</SmallText>
              <SmallActionText
                onPress={() => this.doOpenLegalUrls(I18n.get('user-legalnotice-usercharter'), usercharterUrl)}
                testID="activation-user-charter">
                {I18n.get('auth-activation-usercharter')}
              </SmallActionText>
              <SmallText>{I18n.get('auth-activation-cgu-accept-and')}</SmallText>
              <SmallActionText
                onPress={() => this.doOpenLegalUrls(I18n.get('auth-activation-cgu'), cguUrl)}
                testID="activation-cgu">
                {I18n.get('auth-activation-cgu')}
              </SmallActionText>
            </View>
          </View>
          <SmallText style={styles.errorMsg}>
            {(hasErrorKey || errorText) && !typing ? I18n.get('auth-activation-errorsubmit') : ''}
          </SmallText>
          <View style={styles.buttonWrapper} testID="activation-activate">
            <PrimaryButton
              action={() => this.doActivation()}
              disabled={isNotValid}
              text={I18n.get('auth-activation-activate')}
              loading={isSubmitLoading}
            />
          </View>
        </Pressable>
      </KeyboardPageView>
    );
  }
}
