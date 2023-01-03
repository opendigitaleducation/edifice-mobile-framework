import styled from '@emotion/native';
import I18n from 'i18n-js';
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';

import theme from '~/app/theme';
import { ActionButton } from '~/framework/components/action-button';
import AlertCard from '~/framework/components/alert';
import { BackdropPdfReader } from '~/framework/components/backdropPdfReader';
import { Checkbox } from '~/framework/components/checkbox';
import { UI_SIZES, UI_STYLES } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import { PFLogo } from '~/framework/components/pfLogo';
import { SmallActionText, SmallText } from '~/framework/components/text';
import { Trackers } from '~/framework/util/tracker';
import { Loading } from '~/ui/Loading';
import { IActivationModel, IActivationUserInfo } from '~/user/actions/activation';
import { ContextState, SubmitState } from '~/utils/SubmitState';

import { IUserAuthState } from '../reducers/auth';
import {
  ActivationFormModel,
  InputEmail,
  InputPassword,
  InputPasswordConfirm,
  InputPhone,
  ValueChangeArgs,
} from './ActivationForm';

// TYPES ---------------------------------------------------------------------------

type IFields = 'login' | 'password' | 'confirm' | 'phone' | 'email';

export interface IActivationPageState extends IActivationModel {
  typing: boolean;
  isCGUAccepted: boolean;
  isModalVisible: boolean;
}
export interface IActivationPageDataProps extends IActivationModel {
  auth: IUserAuthState;
  passwordRegex: RegExp;
  passwordRegexI18n: { [lang: string]: string };
  emailRequired: boolean;
  phoneRequired: boolean;
  externalError: string;
  contextState: ContextState;
  submitState: SubmitState;
}
export interface IActivationPageEventProps {
  onSubmit(model: IActivationModel, rememberMe?: boolean): Promise<void>;
  onRetryLoad: (args: IActivationUserInfo) => void;
  onCancelLoad: () => void;
}
export type IActivationPageProps = IActivationPageDataProps &
  IActivationPageEventProps &
  NavigationInjectedProps<{
    rememberMe?: boolean;
  }>;
// Activation Page Component -------------------------------------------------------------

export class ActivationPage extends React.PureComponent<IActivationPageProps, IActivationPageState> {
  // fully controller component
  public state: IActivationPageState = {
    ...this.props,
    typing: false,
    isCGUAccepted: false,
    isModalVisible: false,
  };

  private handleActivation = async () => {
    this.props.onSubmit({ ...this.state }, this.props.navigation.getParam('rememberMe'));
    this.setState({ typing: false });
  };

  private onChange = (key: IFields) => {
    return (valueChange: ValueChangeArgs<string>) => {
      const newState: Partial<IActivationPageState> = {
        [key]: valueChange.value,
        typing: true,
      };
      this.setState(newState as any);
    };
  };
  private handleOpenCGU = () => {
    this.setState({ isModalVisible: true });
    Trackers.trackEvent('Auth', 'READ NOTICE', 'cgu');
  };

  public componentDidMount() {
    const props = this.props;
    if (this.props.contextState == ContextState.Failed) {
      Alert.alert(I18n.t('ErrorNetwork'), I18n.t('activation-errorLoading'), [
        {
          text: I18n.t('activation-retryLoad'),
          onPress() {
            props.onRetryLoad({
              activationCode: props.activationCode,
              login: props.login,
            });
          },
          style: 'default',
        },
        {
          text: I18n.t('activation-cancelLoad'),
          onPress() {
            props.onCancelLoad();
          },
          style: 'cancel',
        },
      ]);
    }
  }

  public render() {
    const { auth, externalError, contextState, submitState, navigation } = this.props;
    const { password, confirm, email, phone, isCGUAccepted, isModalVisible, typing } = this.state;
    const cguUrl = auth.legalUrls.cgu;
    if (contextState === ContextState.Loading || contextState === ContextState.Failed) {
      return <Loading />;
    }
    const formModel = new ActivationFormModel({
      ...this.props,
      password: () => password,
    });
    const isNotValid = !isCGUAccepted || !formModel.validate({ ...this.state });
    const errorKey = formModel.firstErrorKey({ ...this.state });
    const errorText = errorKey ? I18n.t(errorKey) : externalError;
    const hasErrorKey = !!errorText;
    const isSubmitLoading = submitState === SubmitState.Loading;

    return (
      <PageView
        navigation={navigation}
        navBarWithBack={{
          title: I18n.t('activation-title'),
        }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.ui.background.card }}>
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.ui.background.card }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView alwaysBounceVertical={false} overScrollMode="never" contentContainerStyle={{ flexGrow: 1 }}>
              <FormTouchable onPress={() => formModel.blur()}>
                <FormWrapper>
                  <FormContainer>
                    <LogoWrapper>
                      <PFLogo />
                    </LogoWrapper>
                    {/* <InputLogin login={login} form={formModel} onChange={this.onChange('login')} /> */}
                    {this.props.passwordRegexI18n?.[I18n.currentLocale()] ? (
                      <AlertCard
                        type="info"
                        text={this.props.passwordRegexI18n[I18n.currentLocale()]}
                        style={{ width: '100%', marginTop: UI_SIZES.spacing.medium }}
                      />
                    ) : null}
                    <InputPassword password={password} form={formModel} onChange={this.onChange('password')} />
                    <InputPasswordConfirm confirm={confirm} form={formModel} onChange={this.onChange('confirm')} />
                    <InputEmail email={email} form={formModel} onChange={this.onChange('email')} />
                    <InputPhone phone={phone} form={formModel} onChange={this.onChange('phone')} />
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'stretch',
                        marginTop: UI_SIZES.spacing.big,
                      }}>
                      <Checkbox
                        checked={isCGUAccepted}
                        onPress={() => this.setState({ isCGUAccepted: !isCGUAccepted })}
                        customContainerStyle={{ marginRight: UI_SIZES.spacing.tiny }}
                      />
                      <SmallText>{I18n.t('activation-cgu-accept')}</SmallText>
                      <TouchableOpacity onPress={this.handleOpenCGU}>
                        <SmallActionText>{I18n.t('activation-cgu')}</SmallActionText>
                      </TouchableOpacity>
                    </View>
                    <SmallText
                      style={{
                        flexGrow: 0,
                        marginTop: UI_SIZES.spacing.medium,
                        padding: UI_SIZES.spacing.tiny,
                        textAlign: 'center',
                        alignSelf: 'center',
                        color: theme.palette.status.failure.regular,
                      }}>
                      {' '}
                      {hasErrorKey && !typing ? errorText : ''}{' '}
                    </SmallText>
                    <ButtonWrapper error={hasErrorKey} typing={typing}>
                      <ActionButton
                        text={I18n.t('Activate')}
                        disabled={isNotValid}
                        action={() => this.handleActivation()}
                        loading={isSubmitLoading}
                      />
                    </ButtonWrapper>
                  </FormContainer>
                </FormWrapper>
              </FormTouchable>
            </ScrollView>
          </KeyboardAvoidingView>
          <BackdropPdfReader
            handleClose={() => this.setState({ isModalVisible: false })}
            handleOpen={() => this.setState({ isModalVisible: true })}
            visible={isModalVisible}
            title={I18n.t('activation-cgu')}
            uri={cguUrl}
          />
        </SafeAreaView>
      </PageView>
    );
  }
}

const FormTouchable = styled.TouchableWithoutFeedback({ flex: 1 });
const FormWrapper = styled.View({ flex: 1 });
const FormContainer = styled.View({
  alignItems: 'center',
  flex: 1,
  flexDirection: 'column',
  justifyContent: 'center',
  padding: UI_SIZES.spacing.large,
  paddingTop: UI_SIZES.spacing.huge,
});
const LogoWrapper = styled.View({
  flexGrow: 2,
  alignItems: 'center',
  justifyContent: 'center',
});
const ButtonWrapper = styled.View<{ error: any; typing: boolean }>({
  alignItems: 'center',
  flexGrow: 2,
  justifyContent: 'flex-start',
  marginTop: UI_SIZES.spacing.small,
});
