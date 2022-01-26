import CookieManager from '@react-native-cookies/cookies';
import style from 'glamorous-native';
import I18n from 'i18n-js';
import * as React from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import DropDownPicker from 'react-native-dropdown-picker';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { connect } from 'react-redux';

import theme from '~/app/theme';
import { FakeHeader, HeaderAction, HeaderCenter, HeaderLeft, HeaderRow, HeaderTitle } from '~/framework/components/header';
import { LoadingIndicator } from '~/framework/components/loading';
import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { Trackers } from '~/framework/util/tracker';
import withViewTracking from '~/framework/util/tracker/withViewTracking';
import { IOAuthToken, OAuthCustomTokens, OAuthErrorType, OAuth2RessourceOwnerPasswordClient } from '~/infra/oauth';
import { FlatButton } from '~/ui';
import { ErrorMessage } from '~/ui/Typography';
import { checkVersionThenLogin } from '~/user/actions/version';
import { IUserAuthState } from '~/user/reducers/auth';
import { getAuthState } from '~/user/selectors';

const Logo = style.image({ height: 75, width: 300, resizeMode: 'contain' });

enum WAYFPageMode {
  ERROR,
  LOADING,
  SELECT,
  WEBVIEW,
}

export interface IWAYFPageProps {
  auth: IUserAuthState;
  dispatch?: any;
  navigation?: any;
}

interface IWAYFPageState {
  // User selection dropdown opened?
  dropdownOpened: boolean;
  // Current display mode: Error Message | Loading Indicator | User Selection | WebView
  mode: WAYFPageMode;
}

export class WAYFPage extends React.Component<IWAYFPageProps, IWAYFPageState> {
  // Used to post HTML content and retrieve it via onMessage
  // Injected in WebView with injectedJavaScript property
  // Executed each time WebView url changes
  static get POST_HTML_CONTENT() {
    return 'ReactNativeWebView.postMessage(document.documentElement.innerHTML); true;';
  }
  // Styles sheet
  static get STYLES() {
    return StyleSheet.create({
      container: { alignItems: 'center', flex: 1, justifyContent: 'space-around', paddingHorizontal: 32, paddingVertical: 96 },
      help: { marginTop: 32, textAlign: 'center' },
      select: { borderColor: theme.color.secondary.regular, borderWidth: 1 },
      selectBackDrop: { flex: 1 },
      selectContainer: { borderColor: theme.color.secondary.regular, borderWidth: 1, maxHeight: 120 },
      selectPlaceholder: { color: theme.color.neutral.regular },
      selectText: { color: theme.color.neutral.regular },
      text: { textAlign: 'center' },
      webview: { flex: 1 },
    });
  }
  // User selection dropdown items
  private dropdownItems: any = [];
  //  User selection dropdown selected value
  dropdownValue: string | null = null;
  // Error if any
  private error: string = '';
  // Platform logo
  private pfLogo: any = '';
  // Platform url
  private pfUrl: string = '';
  // SAMLResponse if any
  private samlResponse: string | null = null;
  // WAYF url
  private wayfUrl: string = '';
  // WebView reference management
  private webview?: WebView;
  private setWebView(ref: WebView) {
    this.webview = ref;
  }
  // Is WebView back history empty?
  private webviewCanGoBack = false;

  constructor(props: IWAYFPageProps) {
    super(props);
    const pfConf = DEPRECATED_getCurrentPlatform();
    this.pfLogo = pfConf?.logo || '';
    this.pfUrl = pfConf?.url || '';
    this.wayfUrl = pfConf?.wayf || '';
    this.state = { dropdownOpened: false, mode: WAYFPageMode.WEBVIEW };
  }

  async componentDidUpdate() {
    const { auth } = this.props;
    // Display login error if any
    auth.error && this.displayError(auth.error);
  }

  // Clear WebView cookies and execute given callback when done
  clearCookies(callback: Function) {
    const { navigation } = this.props;
    // Clear cookies
    CookieManager.clearAll(true)
      .then(_success => {
        // Clear some stuff
        this.dropdownItems = [];
        this.dropdownValue = null;
        this.samlResponse = null;
        // Execute given callack
        callback();
      })
      .catch(_error => {
        // Go to WAYF stack home
        navigation.navigate('LoginWAYF');
      });
  }

  // Display error message
  displayError(error: string) {
    this.error = error;
    this.setState({ mode: WAYFPageMode.ERROR });
  }

  // Display WebView
  displayWebview() {
    // Clear cookies and then go to WebView mode
    this.clearCookies(() => this.setState({ dropdownOpened: false, mode: WAYFPageMode.WEBVIEW }));
  }

  // Login with current oAuth token
  login() {
    this.setState({ mode: WAYFPageMode.LOADING });
    this.props.dispatch(checkVersionThenLogin(false));
  }

  // Login with selected token
  loginWithCustomToken() {
    // SAML token found
    Trackers.trackDebugEvent('Auth', 'WAYF', 'CUSTOM_TOKEN');
    // Display loading sreen
    this.setState({ mode: WAYFPageMode.LOADING });
    // Call oauth2 token api with received SAML token
    this.dropdownValue &&
      OAuth2RessourceOwnerPasswordClient.connection
        ?.getNewTokenWithCustomToken(this.dropdownValue)
        .then(data => {
          // Manage unique user
          if ((data as IOAuthToken).access_token) {
            this.login();
            return;
          }
          // Otherwise send error
          throw OAuth2RessourceOwnerPasswordClient.connection?.createAuthError(
            OAuthErrorType.BAD_RESPONSE,
            'no access_token returned',
            '',
            { data },
          );
        })
        .catch(error => {
          // Display error
          this.displayError(error.type);
        });
  }

  // Navbar back handler
  onBack(mode: WAYFPageMode) {
    const { navigation } = this.props;
    switch (mode) {
      case WAYFPageMode.ERROR:
        // Go to top of navigation stack
        this.clearCookies(() => navigation.navigate('LoginWAYF'));
        break;
      case WAYFPageMode.SELECT:
        // Go back to WebView mode
        this.displayWebview();
        break;
      case WAYFPageMode.WEBVIEW:
        // Go back through WebView history if possible otherwise go back through navigation stack
        (this.webviewCanGoBack && this.webview?.goBack()) || (!this.webviewCanGoBack && this.props.navigation.goBack());
        break;
    }
  }

  // Called each time POST_HTML_CONTENT js code is executed (e.g when WebView url changes)
  // See WebView onMessage property
  onMessage(event: WebViewMessageEvent) {
    // Get HTML code
    const innerHTML = event?.nativeEvent?.data || '';
    // Retrieve potential SAML token (Stored in <input type="hidden" name="SAMLResponse" value="[saml]"/>)
    const components = innerHTML.split('name="SAMLResponse" value="');
    if (components?.length === 2) {
      const index = components[1].indexOf('"');
      if (index > 0) {
        // SAML token found
        Trackers.trackDebugEvent('Auth', 'WAYF', 'SAML');
        // Display loading sreen
        this.setState({ mode: WAYFPageMode.LOADING });
        // Call oauth2 token api with received SAML token
        this.samlResponse = components[1].substring(0, index);
        OAuth2RessourceOwnerPasswordClient.connection
          ?.getNewTokenWithSAML(this.samlResponse)
          .then(data => {
            // Manage unique user
            if ((data as IOAuthToken).access_token) {
              this.login();
              return;
            }
            // Manage multiple users
            if ((data as OAuthCustomTokens).length) {
              (data as OAuthCustomTokens).forEach(token => {
                this.dropdownItems.push({ label: token.structureName, value: token.key });
                this.setState({ mode: WAYFPageMode.SELECT });
              });
            }
            // Otherwise send error
            throw OAuth2RessourceOwnerPasswordClient.connection?.createAuthError(
              OAuthErrorType.BAD_RESPONSE,
              'no access_token returned',
              '',
              { data },
            );
          })
          .catch(error => {
            // Display error
            this.displayError(error.type);
          });
      }
    }
  }

  // Called each time WebView navigation state changes
  // See WebView onNavigationStateChange property
  onNavigationStateChange(navigationState: WebViewNavigation) {
    // Update WebView back history flag
    this.webviewCanGoBack = navigationState.canGoBack;
    // Track new url
    Trackers.trackDebugEvent('Auth', 'WAYF', navigationState.url);
  }

  // Called each time WebView url is about to change
  // Must return true|false to allow|avoid navigation
  // See WebView onNavigationStateChange property
  onShouldStartLoadWithRequest(request: ShouldStartLoadRequest) {
    // Go to standard login page and block navigation when
    //   - No SAMLResponse has been detected
    //   - WAYF redirects to web standard login page
    const url = request.url;
    if (!this.samlResponse && this.pfUrl && url.startsWith(this.pfUrl)) {
      this.props.navigation.navigate('LoginHome');
      return false;
    }
    return true;
  }

  // Render header left button depending on current display mode
  renderHeaderLeft(mode: WAYFPageMode) {
    return mode === WAYFPageMode.LOADING ? null : (
      <HeaderAction iconName={Platform.OS === 'ios' ? 'chevron-left1' : 'back'} iconSize={24} onPress={() => this.onBack(mode)} />
    );
  }

  // Render header title depending on current display mode
  renderHeaderTitle(mode: WAYFPageMode) {
    return <HeaderTitle>{I18n.t(mode === WAYFPageMode.SELECT ? 'login-wayf-select-title' : 'login-wayf-main-title')}</HeaderTitle>;
  }

  // Render content depending on current display mode
  renderContent(mode: WAYFPageMode, dropdownOpened: boolean) {
    switch (mode) {
      case WAYFPageMode.ERROR:
        // Display error messsage
        Trackers.trackDebugEvent('Auth', 'WAYF', 'ERROR');
        return (
          <View style={WAYFPage.STYLES.container}>
            <Logo source={this.pfLogo} />
            <ErrorMessage>
              {I18n.t('auth-error-' + this.error, {
                version: DeviceInfo.getVersion(),
                errorcode: this.error,
                currentplatform: DEPRECATED_getCurrentPlatform()!.url,
              })}
            </ErrorMessage>
            <FlatButton title={I18n.t('login-wayf-error-retry')} onPress={() => this.displayWebview()} />
          </View>
        );
      case WAYFPageMode.LOADING:
        // Display loading indicator
        Trackers.trackDebugEvent('Auth', 'WAYF', 'LOADING');
        return (
          <View style={WAYFPage.STYLES.container}>
            <Logo source={this.pfLogo} />
            <Text style={WAYFPage.STYLES.text}>{I18n.t('login-wayf-loading-text')}</Text>
            <ActivityIndicator size="large" color={theme.color.secondary.regular} />
          </View>
        );
      case WAYFPageMode.SELECT:
        // Display user selection
        Trackers.trackDebugEvent('Auth', 'WAYF', 'SELECT');
        return (
          <TouchableWithoutFeedback
            style={WAYFPage.STYLES.selectBackDrop}
            onPress={() => {
              this.setState({ dropdownOpened: false });
            }}>
            <View style={WAYFPage.STYLES.container}>
              <Text style={WAYFPage.STYLES.text}>{I18n.t('login-wayf-select-text')}</Text>
              <DropDownPicker
                dropDownContainerStyle={WAYFPage.STYLES.selectContainer}
                items={this.dropdownItems}
                open={dropdownOpened}
                placeholder={I18n.t('login-wayf-select-placeholder')}
                placeholderStyle={WAYFPage.STYLES.selectPlaceholder}
                setOpen={() => this.setState({ dropdownOpened: !dropdownOpened })}
                setValue={callback => {
                  this.dropdownValue = callback();
                }}
                showTickIcon={false}
                style={WAYFPage.STYLES.select}
                textStyle={WAYFPage.STYLES.selectText}
                value={this.dropdownValue}
              />
              <View>
                <FlatButton
                  title={I18n.t('login-wayf-select-button')}
                  disabled={this.dropdownValue === null}
                  onPress={() => this.loginWithCustomToken()}
                />
                <Text style={WAYFPage.STYLES.help}>{I18n.t('login-wayf-select-help')}</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        );
      case WAYFPageMode.WEBVIEW:
        // Dissplay WebView
        Trackers.trackDebugEvent('Auth', 'WAYF', 'WEVIEW');
        return (
          <WebView
            ref={(ref: WebView) => this.setWebView(ref)}
            injectedJavaScript={WAYFPage.POST_HTML_CONTENT}
            javaScriptEnabled
            onMessage={(event: WebViewMessageEvent) => this.onMessage(event)}
            onNavigationStateChange={(navigationState: WebViewNavigation) => this.onNavigationStateChange(navigationState)}
            onShouldStartLoadWithRequest={(request: ShouldStartLoadRequest) => this.onShouldStartLoadWithRequest(request)}
            renderLoading={() => <LoadingIndicator />}
            source={{ uri: this.wayfUrl }}
            setSupportMultipleWindows={false}
            startInLoadingState
            style={WAYFPage.STYLES.webview}
          />
        );
    }
  }

  public render() {
    const { dropdownOpened, mode } = this.state;
    return (
      <>
        <FakeHeader>
          <HeaderRow>
            <HeaderLeft>{this.renderHeaderLeft(mode)}</HeaderLeft>
            <HeaderCenter>{this.renderHeaderTitle(mode)}</HeaderCenter>
          </HeaderRow>
        </FakeHeader>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>{this.renderContent(mode, dropdownOpened)}</SafeAreaView>
      </>
    );
  }
}

const ConnectedWAYFPage = connect((state: any, props: any): IWAYFPageProps => {
  return {
    auth: getAuthState(state),
  };
})(WAYFPage);

export default withViewTracking('auth/WAYF')(ConnectedWAYFPage);
