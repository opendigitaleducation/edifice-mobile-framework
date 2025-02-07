import * as React from 'react';
import { ActivityIndicator, Platform, SafeAreaView, TouchableWithoutFeedback, View } from 'react-native';

import CookieManager from '@react-native-cookies/cookies';
import DropDownPicker from 'react-native-dropdown-picker';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewNavigation,
  WebViewNavigationEvent,
} from 'react-native-webview/lib/WebViewTypes';

import styles from './styles';
import { IWayfScreenProps, IWayfScreenState, WAYFPageMode } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import { EmptyScreen } from '~/framework/components/empty-screens';
import { PageView } from '~/framework/components/page';
import { PFLogo } from '~/framework/components/pfLogo';
import { SmallText } from '~/framework/components/text';
import { consumeAuthErrorAction } from '~/framework/modules/auth/actions';
import moduleConfig from '~/framework/modules/auth/module-config';
import { authRouteNames } from '~/framework/modules/auth/navigation';
import { trackingWayfEvents } from '~/framework/modules/auth/tracking';
import { navBarTitle } from '~/framework/navigation/navBar';
import { Error } from '~/framework/util/error';
import { OAuth2ErrorCode } from '~/framework/util/oauth2';
import { Trackers, trackingActionAddSuffix } from '~/framework/util/tracker';
import { OAuthCustomTokens } from '~/infra/oauth';
import { Loading } from '~/ui/Loading';

class WayfScreen extends React.Component<IWayfScreenProps, IWayfScreenState> {
  // User selection dropdown items
  private dropdownItems: any = [];

  //  User selection dropdown selected value
  private dropdownValue: string | null = null;

  // Error if any
  private error: Error.ErrorTypes<typeof Error.LoginError> | undefined;

  // WAYF url
  private wayfUrl: string | undefined = undefined;

  // WebView reference management
  private webview?: WebView;

  private setWebView(ref: WebView) {
    this.webview = ref;
  }

  // Is WebView back history empty?
  private webviewCanGoBack = false;

  // Navbar back handlers
  private backActions = [
    // WAYFPageMode.EMPTY: Go to top of wayf navigation stack
    () => {
      this.props.navigation.navigate(authRouteNames.loginWayf, { platform: this.props.route.params.platform });
    },
    // WAYFPageMode.ERROR: Go to top of wayf navigation stack
    () => {
      this.props.navigation.navigate(authRouteNames.loginWayf, { platform: this.props.route.params.platform });
    },
    // WAYFPageMode.LOADING: Nothing to do
    () => {},
    // case WAYFPageMode.SELECT: Go back to WebView mode
    () => {
      this.displayWebview();
    },
    // case WAYFPageMode.WEBVIEW: Go back through WebView history if possible otherwise go back through navigation stack
    () => {
      if (this.webviewCanGoBack) this.webview?.goBack();
      else this.clearDatas(() => this.props.navigation.goBack());
    },
  ];

  // Content components
  private contentComponents = [
    // WAYFPageMode.EMPTY: Display empty screen
    () => {
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'Empty'));
      return (
        <EmptyScreen svgImage="empty-content" text={I18n.get('auth-wayf-empty-text')} title={I18n.get('auth-wayf-empty-title')} />
      );
    },
    // WAYFPageMode.ERROR: Display error message
    () => {
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'Error'), this.error?.toString());
      return (
        <View style={styles.container}>
          <PFLogo pf={this.props.route.params.platform} />
          <SmallText style={styles.errorMsg}>
            {this.error ? Error.getAuthErrorText<typeof Error.LoginError>(this.error, this.props.route.params.platform.url) : ''}
          </SmallText>
          <PrimaryButton text={I18n.get('auth-wayf-error-retry')} action={() => this.displayWebview()} />
        </View>
      );
    },
    // WAYFPageMode.LOADING: Display loading indicator
    () => {
      return (
        <View style={styles.container}>
          <PFLogo pf={this.props.route.params.platform} />
          <SmallText style={styles.text}>{I18n.get('auth-wayf-loading-text')}</SmallText>
          <ActivityIndicator size="large" color={theme.palette.primary.regular} />
        </View>
      );
    },
    // case WAYFPageMode.SELECT: Display user selection
    (dropdownOpened: boolean) => {
      return (
        <TouchableWithoutFeedback
          style={styles.selectBackDrop}
          onPress={() => {
            this.setState({ dropdownOpened: false });
          }}>
          <View style={styles.container}>
            <SmallText style={styles.text}>{I18n.get('auth-wayf-select-text')}</SmallText>
            <DropDownPicker
              dropDownContainerStyle={styles.selectContainer}
              items={this.dropdownItems}
              open={this.state.dropdownOpened}
              placeholder={I18n.get('auth-wayf-select-placeholder')}
              placeholderStyle={styles.selectPlaceholder}
              setOpen={() =>
                this.setState({
                  dropdownOpened: !dropdownOpened,
                })
              }
              setValue={callback => (this.dropdownValue = callback({}))}
              showTickIcon={false}
              style={styles.select}
              textStyle={styles.selectText}
              value={this.dropdownValue}
            />
            <View style={styles.submitButton}>
              <PrimaryButton
                text={I18n.get('auth-wayf-select-button')}
                disabled={this.dropdownValue === null}
                action={() => this.loginWithCustomToken()}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      );
    },
    // case WAYFPageMode.WEBVIEW: Display WebView
    () => {
      return (
        <WebView
          ref={(ref: WebView) => this.setWebView(ref)}
          incognito
          javaScriptEnabled
          onError={this.onError.bind(this)}
          onHttpError={this.onHttpError.bind(this)}
          onLoad={this.onLoad.bind(this)}
          onMessage={this.onMessage.bind(this)}
          onNavigationStateChange={this.onNavigationStateChange.bind(this)}
          renderLoading={() => <Loading />}
          scalesPageToFit
          setSupportMultipleWindows={false}
          showsHorizontalScrollIndicator={false}
          source={{ headers: { 'X-APP': 'mobile' }, uri: this.wayfUrl! }}
          startInLoadingState
          style={styles.webview}
          userAgent={`X-APP=mobile-${Platform.OS}`}
          webviewDebuggingEnabled={__DEV__}
        />
      );
    },
  ];

  constructor(props: IWayfScreenProps) {
    super(props);
    const pfConf = this.props.route.params.platform;
    this.wayfUrl = pfConf?.wayf;
    this.state = { dropdownOpened: false, errkey: Error.generateErrorKey(), mode: WAYFPageMode.WEBVIEW };
    this.backActions.forEach(action => {
      action.bind(this);
    });
    CookieManager.clearAll(true);
  }

  componentDidUpdate(prevProps: IWayfScreenProps) {
    const { auth } = this.props;
    const errorType = Error.getDeepErrorType<typeof Error.LoginError>(auth.error);
    // Detect && display potential login error sent after checkVersionThenLogin(false) call
    if (
      (auth.error?.key === undefined || auth.error.key === this.state.errkey) &&
      errorType?.length &&
      errorType?.length > 0 &&
      errorType !== this.error &&
      errorType !== OAuth2ErrorCode.SAML_MULTIPLE_VECTOR
    ) {
      this.displayError(errorType);
    }
    // Update page title
    this.props.navigation.setOptions({
      headerTitle: navBarTitle(
        I18n.get(this.state.mode === WAYFPageMode.SELECT ? 'auth-wayf-select-title' : 'auth-wayf-main-title'),
      ),
    });
  }

  // Clear datas (WebView cookies, etc.) and execute given callback when done
  clearDatas(callback: Function) {
    const { navigation } = this.props;
    CookieManager.clearAll(true)
      .then(_success => {
        this.error = undefined;
        this.dropdownItems = [];
        this.dropdownValue = null;
        callback();
      })
      .catch(_error => {
        navigation.navigate(authRouteNames.loginWayf, { platform: this.props.route.params.platform });
      });
  }

  // Display empty screen
  displayEmpty() {
    this.clearDatas(() => {
      this.setState({ mode: WAYFPageMode.EMPTY });
    });
  }

  // Display error message
  displayError(error: Error.ErrorTypes<typeof Error.LoginError>) {
    this.clearDatas(() => {
      this.error = error;
      this.setState({ mode: WAYFPageMode.ERROR });
      if (this.state.errkey === undefined) this.props.dispatch(consumeAuthErrorAction(this.state.errkey));
    });
  }

  // Display loading
  displayLoading() {
    this.setState({ mode: WAYFPageMode.LOADING });
  }

  // Display user selection
  displaySelect() {
    this.setState({ mode: WAYFPageMode.SELECT });
  }

  // Display WebView
  displayWebview() {
    this.clearDatas(() => this.setState({ dropdownOpened: false, mode: WAYFPageMode.WEBVIEW }));
  }

  // Login with obtained saml assertion
  loginWithSaml(saml: string) {
    this.clearDatas(async () => {
      if (!saml) return;
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'SAML'));
      this.displayLoading();
      try {
        await this.props.tryLogin(this.props.route.params.platform, { saml }, this.state.errkey);
      } catch (error) {
        const errtype = Error.getDeepErrorType<typeof Error.LoginError>(error as Error);
        if (error instanceof Error.SamlMultipleVectorError && errtype === OAuth2ErrorCode.SAML_MULTIPLE_VECTOR) {
          try {
            // Extract users from error description
            (error.data.users as OAuthCustomTokens).forEach(token => {
              this.dropdownItems.push({ label: token.structureName, value: token.key });
            });
            this.setState({ errkey: Error.generateErrorKey() }); // clear error
            this.displaySelect();
            return;
          } catch {
            // Malformed multiple users error description
            this.displayError(Error.FetchErrorType.BAD_RESPONSE);
          }
        }
        if (errtype) {
          this.displayError(errtype);
        }
      }
    });
  }

  // Login with selected token
  async loginWithCustomToken() {
    const customToken = this.dropdownValue;
    if (!customToken) return;
    this.displayLoading();
    try {
      await this.props.tryLogin(this.props.route.params.platform, { customToken }, this.state.errkey);
    } catch (error) {
      const errtype = Error.getDeepErrorType<typeof Error.LoginError>(error as Error);
      if (errtype) {
        this.displayError(errtype);
      }
    } finally {
      this.dropdownValue = null;
    }
  }

  // Login with OpenID custom token
  async loginWithOpenID(oidToken: string) {
    this.clearDatas(async () => {
      if (!oidToken) return;
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'OpenID'));
      this.displayLoading();
      try {
        await this.props.tryLogin(this.props.route.params.platform, { customToken: oidToken }, this.state.errkey);
      } catch (error) {
        const errtype = Error.getDeepErrorType<typeof Error.LoginError>(error as Error);
        if (errtype) {
          this.displayError(errtype);
        }
      }
    });
  }

  // Navbar back handler
  onBack(mode: WAYFPageMode) {
    this.backActions[mode]();
  }

  // Called each time a navigation error occurs in WebView
  // See WebView onError property
  onError({ nativeEvent }: WebViewErrorEvent) {
    console.error('WAYFScreen::onError => ', nativeEvent);
    trackingWayfEvents.loadError(nativeEvent.url);
    this.displayEmpty();
  }

  // Called each time an http error occurs in WebView
  // See WebView onError property
  onHttpError({ nativeEvent }: WebViewHttpErrorEvent) {
    console.error('WAYFScreen::onHttpError => ', nativeEvent.statusCode);
    trackingWayfEvents.loadError(nativeEvent.url, nativeEvent.statusCode);
    this.displayEmpty();
  }

  // Called when WebView content is loaded
  // See WebView onLoad property
  onLoad({ nativeEvent }: WebViewNavigationEvent) {
    console.debug('WAYFScreen::onLoad => ', nativeEvent.url);
    trackingWayfEvents.loadSuccess(nativeEvent.url);
  }

  // Called each time a message is posted via window.ReactNativeWebView.postMessage
  // See WebView onMessage property
  onMessage(event: WebViewMessageEvent) {
    try {
      // Decrypt received message
      const message = JSON.parse(event?.nativeEvent?.data);
      console.debug('WAYFScreen::onMessage => ', message);
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'Message'), message.toString());
      // Execute right action depending on message type
      const { token, type } = message;
      switch (type) {
        // Login with SAML token if received
        case 'SAML':
          if (token) this.loginWithSaml(token);
          break;
        // Login with OpenID token if received
        case 'OIDC':
          if (token) this.loginWithOpenID(token);
          break;
        // Redirect to login page
        case 'ENT':
          this.props.navigation.dispatch(this.props.loginCredentialsNavAction);
          break;
        default:
          console.error('WAYFScreen::onMessage => Wrong type received - ', type);
      }
    } catch (err) {
      console.error('WAYFScreen::onMessage => ', (err as Error).message);
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'Error'), (err as Error).message);
    }
  }

  // Called each time WebView navigation state changes
  // See WebView onNavigationStateChange property
  onNavigationStateChange(navigationState: WebViewNavigation) {
    Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'Url'), navigationState.url);
    this.webviewCanGoBack = navigationState.canGoBack;
  }

  public render() {
    const { dropdownOpened, mode } = this.state;
    return (
      <PageView>
        <SafeAreaView style={styles.safeView}>{this.contentComponents[mode](dropdownOpened)}</SafeAreaView>
      </PageView>
    );
  }
}

export default WayfScreen;
