import CookieManager from '@react-native-cookies/cookies';
import * as React from 'react';
import { ActivityIndicator, SafeAreaView, TouchableWithoutFeedback, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewNavigation,
  WebViewNavigationEvent,
} from 'react-native-webview/lib/WebViewTypes';

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
import { Trackers, trackingActionAddSuffix } from '~/framework/util/tracker';
import { OAuthCustomTokens } from '~/infra/oauth';
import { Loading } from '~/ui/Loading';

import styles from './styles';
import { IWayfScreenProps, IWayfScreenState, WAYFPageMode } from './types';

class WayfScreen extends React.Component<IWayfScreenProps, IWayfScreenState> {
  // Used to post HTML content and retrieve it via onMessage
  // Injected in WebView with injectedJavaScript property
  // Executed each time WebView url changes
  static get INJECTED_JS() {
    return 'ReactNativeWebView.postMessage(document.documentElement.innerHTML); true;';
  }

  // Used to set X-APP cookie used backend side
  // Injected in WebView with injectedJavaScriptBeforeContentLoaded property
  static get INJECTED_JS_BEFORE() {
    return 'document.cookie="X-APP=mobile"; true;';
  }

  // User selection dropdown items
  private dropdownItems: any = [];

  //  User selection dropdown selected value
  private dropdownValue: string | null = null;

  // Auth url if defined
  private authUrl: string | undefined = undefined;

  // Error if any
  private error: Error.ErrorTypes<typeof Error.LoginError> | undefined;

  // Flag first webview page loading completion
  private isFirstLoadFinished = false;

  // OpenID custom token if any
  private oidResponse: string | undefined = undefined;

  // Platform url
  private pfUrl: string | null = null;

  // SAMLResponse if any
  private samlResponse: string | undefined = undefined;

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
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'Erreur'));
      return (
        <EmptyScreen svgImage="empty-content" text={I18n.get('auth-wayf-empty-text')} title={I18n.get('auth-wayf-empty-title')} />
      );
    },
    // WAYFPageMode.ERROR: Display error message
    () => {
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'Erreur'), this.error?.toString());
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
          injectedJavaScriptBeforeContentLoaded={WayfScreen.INJECTED_JS_BEFORE}
          injectedJavaScript={WayfScreen.INJECTED_JS}
          javaScriptEnabled
          onError={this.onError.bind(this)}
          onHttpError={this.onHttpError.bind(this)}
          onLoad={this.onLoad.bind(this)}
          onLoadStart={this.onLoadStart.bind(this)}
          onMessage={this.onMessage.bind(this)}
          onNavigationStateChange={this.onNavigationStateChange.bind(this)}
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest.bind(this)}
          renderLoading={() => <Loading />}
          scalesPageToFit
          setSupportMultipleWindows={false}
          showsHorizontalScrollIndicator={false}
          source={{ uri: this.wayfUrl!, headers: { 'X-APP': 'mobile' } }}
          startInLoadingState
          style={styles.webview}
          webviewDebuggingEnabled={__DEV__}
        />
      );
    },
  ];

  constructor(props: IWayfScreenProps) {
    super(props);
    const pfConf = this.props.route.params.platform;
    this.authUrl = pfConf?.auth;
    this.pfUrl = pfConf?.url;
    this.wayfUrl = pfConf?.wayf;
    this.state = { dropdownOpened: false, mode: WAYFPageMode.WEBVIEW, errkey: Error.generateErrorKey() };
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
      errorType !== Error.OAuth2ErrorType.SAML_MULTIPLE_VECTOR
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
    // Clear cookies
    CookieManager.clearAll(true)
      .then(_success => {
        // Clear some stuff
        this.error = undefined;
        this.dropdownItems = [];
        this.dropdownValue = null;
        this.oidResponse = undefined;
        this.samlResponse = undefined;
        // Execute given callack
        callback();
      })
      .catch(_error => {
        // Go to WAYF stack home
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
    // Clear cookies and then go to WebView mode
    this.clearDatas(() => this.setState({ dropdownOpened: false, mode: WAYFPageMode.WEBVIEW }));
  }

  // Login with obtained saml assertion
  loginWithSaml() {
    const saml = this.samlResponse;
    this.clearDatas(async () => {
      if (!saml) return;
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'SAML'));
      this.displayLoading();
      try {
        await this.props.tryLogin(this.props.route.params.platform, { saml }, this.state.errkey);
      } catch (error) {
        const errtype = Error.getDeepErrorType<typeof Error.LoginError>(error as Error);
        if (error instanceof Error.SamlMultipleVectorError && errtype === Error.OAuth2ErrorType.SAML_MULTIPLE_VECTOR) {
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
      } finally {
        this.samlResponse = undefined;
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
  async loginWithOpenID() {
    const customToken = this.oidResponse;
    this.clearDatas(async () => {
      if (!customToken) return;
      Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'OpenID'));
      this.displayLoading();
      try {
        await this.props.tryLogin(this.props.route.params.platform, { customToken }, this.state.errkey);
      } catch (error) {
        const errtype = Error.getDeepErrorType<typeof Error.LoginError>(error as Error);
        if (errtype) {
          this.displayError(errtype);
        }
      } finally {
        this.oidResponse = undefined;
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
    if (!this.isFirstLoadFinished) trackingWayfEvents.loadError(nativeEvent.url);
    // Display empty screen
    this.displayEmpty();
  }

  // Called each time an http error occurs in WebView
  // See WebView onError property
  onHttpError({ nativeEvent }: WebViewHttpErrorEvent) {
    console.error('WAYFScreen::onHttpError => ', nativeEvent.statusCode);
    if (!this.isFirstLoadFinished) trackingWayfEvents.loadError(nativeEvent.url, nativeEvent.statusCode);
    // Display empty screen
    this.displayEmpty();
  }

  onLoad({ nativeEvent }: WebViewNavigationEvent) {
    // Flag first webview page loading completion
    if (!this.isFirstLoadFinished) trackingWayfEvents.loadSuccess(nativeEvent.url);
    this.isFirstLoadFinished = true;
  }

  onLoadStart() {
    setTimeout(() => {
      if (!this.isFirstLoadFinished) {
        this.error = Error.FetchErrorType.TIMEOUT;
        this.setState({ mode: WAYFPageMode.ERROR });
      }
    }, 20000);
  }

  // Called each time POST_HTML_CONTENT js code is executed (e.g when WebView url changes)
  // See WebView onMessage property
  onMessage(event: WebViewMessageEvent) {
    // Get HTML code
    const innerHTML = event?.nativeEvent?.data || '';
    console.debug('WAYFScreen::onMessage: url = ', event?.nativeEvent?.url);
    //console.debug('WAYFScreen::onMessage: innerHTML =\n' + innerHTML);
    // Retrieve potential SAML token (Stored in <input type="hidden" name="SAMLResponse" value="[saml]"/>)
    const saml = innerHTML.split('name="SAMLResponse" value="');
    if (saml?.length === 2) {
      const index = saml[1].indexOf('"');
      if (index > 0) {
        this.samlResponse = saml[1].substring(0, index);
        console.debug('WAYFScreen::onMessage: SAMLResponse retrieved');
      }
      // SP-Initiated WAYF stuff => Call oauth2 token api with received SAML if any
      if (this.authUrl && this.samlResponse) {
        console.debug('WAYFScreen::onMessage: SP-Initiated WAYF stuff');
        this.loginWithSaml();
      }
    } else {
      // Retrieve potential OpenID custom token (Stored via customToken=“..." format)
      // Call oauth2 token api with received OpenID custom token if any
      const oid = innerHTML.split('customToken=“');
      if (oid?.length === 2) {
        const index = oid[1].indexOf('"');
        if (index > 0) {
          this.oidResponse = oid[1].substring(0, index);
          console.debug('WAYFScreen::onMessage: customToken retrieved');
        }
        // SP-Initiated WAYF stuff => Call oauth2 token api with received SAML if any
        if (this.authUrl && this.oidResponse) {
          console.debug('WAYFScreen::onMessage: SP-Initiated WAYF stuff');
          this.loginWithOpenID();
        }
      }
    }
  }

  // Called each time WebView navigation state changes
  // See WebView onNavigationStateChange property
  onNavigationStateChange(navigationState: WebViewNavigation) {
    Trackers.trackDebugEvent(moduleConfig.trackingName, trackingActionAddSuffix('Wayf', 'Url'), navigationState.url);
    // Update WebView back history flag
    this.webviewCanGoBack = navigationState.canGoBack;
    // Track new url
  }

  // Called each time WebView url is about to change
  // Must return true|false to allow|avoid navigation
  // See WebView onNavigationStateChange property
  onShouldStartLoadWithRequest(request: ShouldStartLoadRequest) {
    const url = request.url;
    console.debug('WAYFScreen::onShouldStartLoadWithRequest: isFirstLoadFinished = ', this.isFirstLoadFinished);
    console.debug('WAYFScreen::onShouldStartLoadWithRequest: url = ', url);
    // If current url is outside the WAYF
    if (this.wayfUrl && this.isFirstLoadFinished && !url.startsWith(this.wayfUrl)) {
      if (this.authUrl) {
        // SP-Initiated WAYF stuff
        console.debug('WAYFScreen::onShouldStartLoadWithRequest: SP-Initiated WAYF stuff');
        // Allow navigation to SP-Initiated WAYFs via auth config field
        if (url.startsWith(this.authUrl)) {
          console.debug('WAYFScreen::onShouldStartLoadWithRequest: authUrl received => Navigation allowed');
          return true;
        }
        // Go to standard login page and block navigation when
        //   - No SAMLResponse has been detected
        //   - No OpenID custom token has been detected
        //   - WAYF redirects to ENT
        if (this.pfUrl && url.startsWith(this.pfUrl)) {
          if (!this.samlResponse && !this.oidResponse) {
            if (__DEV__) console.debug('WAYFScreen::onShouldStartLoadWithRequest: pfUrl received => Will show login page');
            this.props.navigation.dispatch(this.props.loginCredentialsNavAction);
          }
          return false;
        }
      } else {
        // IDP-Initiated WAYF stuff
        console.debug(' IDP-Initiated WAYF stuff');
        // If WAYF redirects to ENT
        //   - Try to login with SAML token if any retrieved previously
        //   - Try to login with OpenID custom token if any retrieved previously
        //   - Otherwise go to standard login page
        //   - Block navigation
        if (this.pfUrl && url.startsWith(this.pfUrl)) {
          if (this.samlResponse) {
            console.debug(
              'WAYFScreen::onShouldStartLoadWithRequest: pfUrl received => Try to login with SAML token\n' + this.samlResponse,
            );
            this.loginWithSaml();
          } else if (this.oidResponse) {
            console.debug(
              'WAYFScreen::onShouldStartLoadWithRequest: pfUrl received => Try to login with OpenID custom token\n' +
                this.oidResponse,
            );
            this.loginWithOpenID();
          } else {
            console.debug('WAYFScreen::onShouldStartLoadWithRequest: pfUrl received => Will show login page');
            this.props.navigation.dispatch(this.props.loginCredentialsNavAction);
          }
          // Block navigation
          return false;
        }
      }
    }
    // Allow navigation
    console.debug('WAYFScreen::onShouldStartLoadWithRequest: Navigation allowed');
    return true;
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
