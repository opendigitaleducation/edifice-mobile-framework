import React, { Component } from 'react';
import { Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';

import theme from '~/app/theme';
import { navigateCarousel } from '~/framework/components/carousel';
import { MediaType, openMediaPlayer } from '~/framework/components/media/player';
import { getSession } from '~/framework/modules/auth/reducer';
import { urlSigner } from '~/infra/oauth';

import { actions, messages } from './const';
import { createHTML } from './editor';

const PlatformIOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  _input: {
    position: 'absolute',
    width: 1,
    height: 1,
    zIndex: -999,
    bottom: -999,
    left: -999,
  },
  webview: {
    backgroundColor: theme.palette.grey.white,
  },
});

export default class RichEditor extends Component {
  static defaultProps = {
    contentInset: {},
    style: {},
    placeholder: '',
    initialContentHTML: '',
    initialFocus: false,
    disabled: false,
    useContainer: true,
    pasteAsPlainText: false,
    autoCapitalize: 'off',
    defaultParagraphSeparator: 'div',
    editorInitializedCallback: () => {},
    initialHeight: 0,
    oneSessionId: undefined,
    onLoad: undefined,
  };

  constructor(props) {
    super(props);
    const that = this;
    that.renderWebView = that.renderWebView.bind(that);
    that.onMessage = that.onMessage.bind(that);
    that.sendAction = that.sendAction.bind(that);
    that.registerToolbar = that.registerToolbar.bind(that);
    that._onKeyboardWillShow = that._onKeyboardWillShow.bind(that);
    that._onKeyboardWillHide = that._onKeyboardWillHide.bind(that);
    that.init = that.init.bind(that);
    that.onViewLayout = that.onViewLayout.bind(that);
    that.setRef = that.setRef.bind(that);
    that.unmount = false;
    that._keyOpen = false;
    that._focus = false;
    that.layout = {};
    that.selectionChangeListeners = [];
    that.pfUrl = getSession()?.platform?.url || '';
    that.htmlLoaded = false;
    that.imagesUrls = [];
    that.linksUrls = [];
    that.medias = [];
    that._onAudioTouched = that._onAudioTouched.bind(that);
    that._onImageTouched = that._onImageTouched.bind(that);
    that._onLinkTouched = that._onLinkTouched.bind(that);
    that._onVideoTouched = that._onVideoTouched.bind(that);
    const {
      html,
      pasteAsPlainText,
      onPaste,
      onKeyUp,
      onKeyDown,
      onInput,
      enterKeyHint,
      autoCapitalize,
      autoCorrect,
      defaultParagraphSeparator,
      firstFocusEnd,
      useContainer,
      initialHeight,
      initialFocus,
      disabled,
      styleWithCSS,
      useComposition,
    } = props;
    that.state = {
      html: {
        html:
          html ||
          createHTML({
            pasteAsPlainText,
            pasteListener: !!onPaste,
            keyUpListener: !!onKeyUp,
            keyDownListener: !!onKeyDown,
            inputListener: !!onInput,
            enterKeyHint,
            autoCapitalize,
            autoCorrect,
            initialFocus: initialFocus && !disabled,
            defaultParagraphSeparator,
            firstFocusEnd,
            useContainer,
            styleWithCSS,
            useComposition,
          }),
        baseUrl: that.pfUrl,
      },
      height: initialHeight,
      keyboardHeight: 0,
    };
    that.focusListeners = [];
    // IFrame video auto play bug fix
    setTimeout(async () => {
      that.htmlLoaded = true;
      this.sendAction(actions.content, 'init');
    }, 1000);
  }

  componentDidMount() {
    this.unmount = false;
    if (PlatformIOS) {
      this.keyboardEventListeners = [
        Keyboard.addListener('keyboardWillShow', this._onKeyboardWillShow),
        Keyboard.addListener('keyboardWillHide', this._onKeyboardWillHide),
      ];
    } else {
      this.keyboardEventListeners = [
        Keyboard.addListener('keyboardDidShow', this._onKeyboardWillShow),
        Keyboard.addListener('keyboardDidHide', this._onKeyboardWillHide),
      ];
    }
  }

  componentDidUpdate(prevProps) {
    const { editorStyle, disabled, placeholder, initialContentHTML, editorInitializedCallback } = this.props;
    if (editorStyle && prevProps.editorStyle !== editorStyle) {
      this.setContentStyle(editorStyle);
    }
    if (disabled !== prevProps.disabled) {
      this.setDisable(disabled);
    }
    if (placeholder !== prevProps.placeholder) {
      this.setPlaceholder(placeholder);
    }
    if (initialContentHTML !== prevProps.initialContentHTML) {
      // Fix Android Weird Cookies behavior before updating HTML content
      this.setCookie();
      this.setContentHTML(initialContentHTML);
      editorInitializedCallback();
      setTimeout(() => {
        this.sendAction(actions.content, 'init');
      });
    }
  }

  componentWillUnmount() {
    this.unmount = true;
    this.keyboardEventListeners.forEach(eventListener => eventListener.remove());
  }

  _getAbsoluteUrl(url) {
    return url.startsWith('/') ? this.pfUrl + url : url;
  }

  _onKeyboardWillShow() {
    this._keyOpen = true;
  }

  _onKeyboardWillHide() {
    this._keyOpen = false;
  }

  _onAudioTouched(url) {
    const { disabled } = this.props;
    if (disabled)
      openMediaPlayer({
        type: MediaType.AUDIO,
        source: urlSigner.signURISource(url),
      });
  }

  _onImageTouched(url, medias) {
    const { disabled } = this.props;
    if (disabled) {
      const startIndex = medias.findIndex(m => m?.src?.uri === url);
      navigateCarousel({ medias, startIndex: startIndex === -1 ? 0 : startIndex });
    }
  }

  _onLinkTouched(url, medias) {
    const { disabled } = this.props;
    if (disabled) {
      const startIndex = medias.findIndex(m => m?.src?.uri === url);
      navigateCarousel({ medias, startIndex: startIndex === -1 ? 0 : startIndex });
      // TODO: https://edifice-community.atlassian.net/browse/MB-2437
    }
  }

  _onVideoTouched(url) {
    const { disabled } = this.props;
    if (disabled)
      openMediaPlayer({
        type: MediaType.VIDEO,
        source: urlSigner.signURISource(url),
      });
  }

  onMessage(event) {
    const that = this;
    const { onFocus, onBlur, onChange, onPaste, onKeyUp, onKeyDown, onInput, onMessage, onCursorPosition } = that.props;
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const data = message.data;
      switch (message.type) {
        case messages.CONTENT_HTML_RESPONSE:
          if (that.contentResolve) {
            that.contentResolve(message.data);
            that.contentResolve = undefined;
            that.contentReject = undefined;
            if (that.pendingContentHtml) {
              clearTimeout(that.pendingContentHtml);
              that.pendingContentHtml = undefined;
            }
          }
          break;
        case messages.LINK_TOUCHED:
          that._onLinkTouched(that._getAbsoluteUrl(data), that.medias);
          break;
        case messages.LOG:
          console.debug('FROM EDIT:', ...data);
          break;
        case messages.SELECTION_CHANGE:
          // eslint-disable-next-line no-case-declarations
          const items = message.data;
          that.selectionChangeListeners.map(listener => {
            listener(items);
          });
          break;
        case messages.CONTENT_FOCUSED:
          that._focus = true;
          that.focusListeners.map(da => da()); // Subsequent versions will be deleted
          onFocus?.();
          break;
        case messages.CONTENT_BLUR:
          that._focus = false;
          onBlur?.();
          break;
        case messages.CONTENT_CHANGE:
          onChange?.(data);
          break;
        case messages.CONTENT_PASTED:
          onPaste?.(data);
          break;
        case messages.CONTENT_KEYUP:
          onKeyUp?.(data);
          break;
        case messages.CONTENT_KEYDOWN:
          onKeyDown?.(data);
          break;
        case messages.ON_INPUT:
          onInput?.(data);
          break;
        case messages.OFFSET_HEIGHT:
          that.setWebHeight(data);
          break;
        case messages.OFFSET_Y:
          // eslint-disable-next-line no-case-declarations
          const offsetY = Number.parseInt(Number.parseInt(data, 10) + that.layout.y || 0, 10);
          if (offsetY > 0) onCursorPosition(offsetY);
          break;
        case messages.AUDIO_TOUCHED:
          that._onAudioTouched(that._getAbsoluteUrl(data));
          break;
        case messages.IMAGE_TOUCHED:
          that._onImageTouched(that._getAbsoluteUrl(data), that.medias);
          break;
        case messages.IMAGES_URLS:
          that.imagesUrls = data.map(url => that._getAbsoluteUrl(url));
          break;
        case messages.LINKS_URLS:
          that.linksUrls = data.map(url => that._getAbsoluteUrl(url));
          break;
        case messages.MEDIAS:
          that.medias = data.map(media => ({ type: media.type, src: { uri: that._getAbsoluteUrl(media.src) } }));
          break;
        case messages.VIDEO_TOUCHED:
          that._onVideoTouched(that._getAbsoluteUrl(data));
          break;
        default:
          onMessage?.(message);
          break;
      }
    } catch {
      //alert('NON JSON MESSAGE');
    }
  }

  setWebHeight(height) {
    const { onHeightChange, useContainer, initialHeight, onLoad } = this.props;
    if (height !== this.state.height) {
      const maxHeight = Math.max(height, initialHeight);
      if (!this.unmount && useContainer && maxHeight >= initialHeight) {
        this.setState({ height: maxHeight });
      }
      if (onHeightChange) onHeightChange(height);
      if (height > 0) {
        onLoad?.();
      }
    }
  }

  sendAction(type, action, data, options) {
    const jsonString = JSON.stringify({ type, name: action, data, options });
    if (!this.unmount && this.webviewBridge) {
      this.webviewBridge.postMessage(jsonString);
    }
  }

  setRef(ref) {
    this.webviewBridge = ref;
  }

  renderWebView() {
    const that = this;
    const { html, editorStyle, useContainer, style, onLink, ...rest } = that.props;
    const { html: viewHTML } = that.state;
    const js = `document.cookie="oneSessionId=${this.props.oneSessionId?.value}"; true;`;
    return (
      // eslint-disable-next-line react/jsx-filename-extension
      <>
        <WebView
          injectedJavaScriptBeforeContentLoaded={js}
          useWebKit={false}
          scrollEnabled={false}
          hideKeyboardAccessoryView
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          keyboardDisplayRequiresUserAction={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={!useContainer}
          style={[styles.webview, style]}
          {...rest}
          ref={that.setRef}
          onMessage={that.onMessage}
          originWhitelist={['*']}
          dataDetectorTypes="none"
          domStorageEnabled={false}
          bounces={false}
          javaScriptEnabled
          source={viewHTML}
          onLoad={that.init}
          onShouldStartLoadWithRequest={() => !that.htmlLoaded}
          setSupportMultipleWindows={false}
          webviewDebuggingEnabled={__DEV__}
        />
        {Platform.OS === 'android' && <TextInput ref={ref => (that._input = ref)} style={styles._input} />}
      </>
    );
  }

  onViewLayout({ nativeEvent: { layout } }) {
    // const {x, y, width, height} = layout;
    this.layout = layout;
  }

  render() {
    const { useContainer, style } = this.props;
    // if (!oneSessionId) return <EmptyConnectionScreen />;
    // useContainer is an optional prop with default value of true
    // If set to true, it will use a View wrapper with styles and height.
    const { height } = this.state;
    if (useContainer)
      return (
        <View style={[style, { height }]} onLayout={this.onViewLayout}>
          {this.renderWebView()}
        </View>
      );
  }

  //-------------------------------------------------------------------------------
  //--------------- Public API

  registerToolbar(listener) {
    this.selectionChangeListeners = [...this.selectionChangeListeners, listener];
  }

  setContentFocusHandler(listener) {
    this.focusListeners.push(listener);
  }

  setContentHTML(html) {
    this.sendAction(actions.content, 'setHtml', html);
  }

  setCookie() {
    this.sendAction(actions.content, 'setCookie', `oneSessionId=${this.props.oneSessionId?.value}`);
  }

  setPlaceholder(placeholder) {
    this.sendAction(actions.content, 'setPlaceholder', placeholder);
  }

  setContentStyle(contentStyles) {
    this.sendAction(actions.content, 'setContentStyle', contentStyles);
  }

  setDisable(dis) {
    this.sendAction(actions.content, 'setDisable', !!dis);
  }

  blurContentEditor() {
    this.sendAction(actions.content, 'blur');
  }

  focusContentEditor() {
    this.showAndroidKeyboard();
    this.sendAction(actions.content, 'focus');
  }

  lockContentEditor() {
    this.sendAction(actions.content, 'lock');
  }

  unlockContentEditor() {
    this.sendAction(actions.content, 'unlock');
  }

  showAndroidKeyboard() {
    const that = this;
    if (Platform.OS === 'android') {
      if (!that._keyOpen) that._input.focus();
      that.webviewBridge?.requestFocus?.();
    }
  }

  insertText(text) {
    this.sendAction(actions.insertText, 'result', text);
  }

  insertHTML(html) {
    // TODO: - https://edifice-community.atlassian.net/browse/MB-2404 => Use insertHTML
    // TODO: - https://edifice-community.atlassian.net/browse/MB-2360 => Use insertHTML
    // TODO: - https://edifice-community.atlassian.net/browse/MB-2363 => Use insertHTML
    // Fix Android Weird Cookies behavior before inserting html
    this.setCookie();
    this.sendAction(actions.insertHTML, 'result', html);
  }

  finalizeInsertion() {
    this.sendAction(actions.content, 'finalize');
  }

  injectJavascript(script) {
    return this.webviewBridge.injectJavaScript(script);
  }

  preCode(type) {
    this.sendAction(actions.code, 'result', type);
  }

  setFontSize(size) {
    this.sendAction(actions.fontSize, 'result', size);
  }

  setForeColor(color) {
    this.sendAction(actions.foreColor, 'result', color);
  }

  setHiliteColor(color) {
    this.sendAction(actions.hiliteColor, 'result', color);
  }

  setFontName(name) {
    this.sendAction(actions.fontName, 'result', name);
  }

  commandDOM(command) {
    if (command) {
      this.sendAction(actions.content, 'commandDOM', command);
    }
  }

  command(command) {
    if (command) {
      this.sendAction(actions.content, 'command', command);
    }
  }

  dismissKeyboard() {
    if (this._focus) this.blurContentEditor();
    else Keyboard.dismiss();
  }

  get isKeyboardOpen() {
    return this._keyOpen;
  }

  init() {
    const that = this;
    const { initialFocus, initialContentHTML, placeholder, editorInitializedCallback, disabled } = that.props;
    if (initialContentHTML) that.setContentHTML(initialContentHTML);
    if (placeholder) that.setPlaceholder(placeholder);
    that.setDisable(disabled);
    editorInitializedCallback();
    // initial request focus
    if (initialFocus && !disabled) that.focusContentEditor();
    // no visible ?
    that.sendAction(actions.init);
  }

  async getContentHtml() {
    return new Promise((resolve, reject) => {
      this.contentResolve = resolve;
      this.contentReject = reject;
      this.sendAction(actions.content, 'postHtml');
      this.pendingContentHtml = setTimeout(() => {
        if (this.contentReject) {
          this.contentReject('timeout');
        }
      }, 5000);
    });
  }
}
