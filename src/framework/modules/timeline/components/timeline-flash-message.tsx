import * as React from 'react';
import { LayoutChangeEvent, ScrollView as RNScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { I18n } from '~/app/i18n';
import theme, { IShades } from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import TertiaryButton from '~/framework/components/buttons/tertiary';
import { getScaleFontSize, getScaleWidth, UI_SIZES } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture';
import { SmallItalicText, TextFontStyle } from '~/framework/components/text';
import { IEntcoreFlashMessage } from '~/framework/modules/timeline/reducer/flash-messages';
import HtmlContentView from '~/ui/HtmlContentView';

interface ITimelineFlashMessageProps {
  flashMessage: IEntcoreFlashMessage;
  flashMessageAction: () => void;
}

interface ITimelineFlashMessageState {
  expandable: boolean | undefined;
  expanded: boolean;
}

const flashMessageColors: Record<NonNullable<IEntcoreFlashMessage['color']>, Pick<IShades, 'pale' | 'light' | 'regular'>> = {
  red: theme.palette.complementary.red,
  blue: theme.palette.complementary.blue,
  green: theme.palette.complementary.green,
  orange: theme.palette.complementary.orange,
  'grey-dark': {
    pale: theme.palette.grey.pearl,
    light: theme.palette.grey.cloudy,
    regular: theme.palette.grey.stone,
  },
};

const styles = StyleSheet.create({
  shadowWrapper: {
    borderRadius: UI_SIZES.radius.medium,
    paddingLeft: UI_SIZES.spacing.tiny,
    paddingBottom: UI_SIZES.spacing.tiny,
    marginHorizontal: UI_SIZES.spacing.medium,
    marginBottom: UI_SIZES.spacing.medium,
    marginTop: UI_SIZES.spacing.minor,
  },
  contentWrapper: {
    paddingTop: getScaleWidth(36),
    paddingHorizontal: getScaleWidth(24),
    paddingBottom: getScaleWidth(24),
    borderTopLeftRadius: UI_SIZES.radius.medium,
    borderTopRightRadius: UI_SIZES.radius.medium,
    borderBottomLeftRadius: UI_SIZES.radius.small,
    borderBottomRightRadius: UI_SIZES.radius.medium,
  },
  iconShadow: {
    position: 'absolute',
    top: -getScaleWidth(20),
    left: getScaleWidth(24),
    width: getScaleWidth(52),
    height: getScaleWidth(52),
    borderRadius: getScaleWidth(52) / 2,
    padding: UI_SIZES.spacing.tiny,
  },
  iconWrapper: {
    width: getScaleWidth(52) - 2 * UI_SIZES.spacing.tiny,
    height: getScaleWidth(52) - 2 * UI_SIZES.spacing.tiny,
    borderRadius: (getScaleWidth(52) - 2 * UI_SIZES.spacing.tiny) / 2,
    borderWidth: getScaleWidth(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: UI_SIZES.spacing.minor,
  },
  signature: {
    marginTop: getScaleFontSize(22),
  },
  postContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moreLessButton: {
    paddingVertical: 0,
  },
  lessButton: {
    alignSelf: 'flex-end',
  },
  moreButtonWrapper: {
    position: 'absolute',
    bottom: getScaleWidth(24),
    right: getScaleWidth(24),
  },
  buttonGradient: {
    position: 'absolute',
    left: -getScaleWidth(64),
    top: 0,
    height: '100%',
    width: getScaleWidth(64),
  },
});

export class TimelineFlashMessage extends React.PureComponent<ITimelineFlashMessageProps, ITimelineFlashMessageState> {
  state = {
    expandable: undefined,
    expanded: false,
  };

  wrapperHeightRef: React.MutableRefObject<number | null> = React.createRef<number>();

  htmlHeightRef: React.MutableRefObject<number | null> = React.createRef<number>();

  private onHtmlWrapperLayout({ nativeEvent }: LayoutChangeEvent) {
    this.wrapperHeightRef.current = this.wrapperHeightRef.current ?? nativeEvent.layout.height;
    this.computeLayout();
  }

  private onContentSizeChanges(w: number, h: number) {
    this.htmlHeightRef.current = this.htmlHeightRef.current ?? h;
    this.computeLayout();
  }

  private computeLayout() {
    if (this.wrapperHeightRef.current && this.htmlHeightRef.current) {
      const expandable = this.wrapperHeightRef.current < this.htmlHeightRef.current;
      this.setState({ expandable });
    }
  }

  public toggleExpand() {
    this.setState(state => ({ expanded: !state.expanded }));
  }

  public render() {
    const { flashMessage, flashMessageAction } = this.props;
    const { expandable, expanded } = this.state;
    const color = flashMessage && flashMessage.color;
    const signature = flashMessage && flashMessage.signature;
    const contents = flashMessage && flashMessage.contents;
    const appLanguage = I18n.getLanguage();
    const contentsHasAppLanguage = contents && Object.prototype.hasOwnProperty.call(contents, appLanguage);
    const contentsLanguages = contents && Object.keys(contents);
    const flashMessageHtml = contentsHasAppLanguage ? contents[appLanguage] : contents && contents[contentsLanguages[0]];
    const maxLines = 4,
      maxHeight = getScaleFontSize(22) * maxLines;
    const messageTint = flashMessageColors[color ?? 'blue'];
    const messageIcon = color === 'red' ? 'ui-alert-triangle' : 'ui-infoCircle';
    const iconStyle = color === 'red' ? { transform: [{ translateY: -1 }] } : undefined;

    return flashMessageHtml && flashMessageHtml.length > 0 ? (
      <View style={[styles.shadowWrapper, { backgroundColor: messageTint.light }]}>
        <View style={[styles.contentWrapper, { backgroundColor: messageTint.pale }]}>
          <RNScrollView
            onLayout={this.onHtmlWrapperLayout.bind(this)}
            style={expandable !== false && !expanded ? { maxHeight } : null}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={this.onContentSizeChanges.bind(this)}>
            <HtmlContentView
              html={flashMessageHtml}
              opts={{
                linkTextStyle: {
                  ...TextFontStyle.Bold,
                  textDecorationLine: 'underline',
                },
                textColor: false,
                images: false,
                iframes: false,
                audio: false,
                video: false,
              }}
            />
          </RNScrollView>
          <View style={styles.postContent}>
            {(!expandable && signature) || expanded ? (
              <SmallItalicText style={styles.signature}>{signature ?? ''}</SmallItalicText>
            ) : null}
            {expandable && expanded ? (
              <TertiaryButton
                style={[styles.lessButton, styles.moreLessButton, { backgroundColor: messageTint.pale }]}
                text="Voir moins"
                contentColor={theme.ui.text.regular}
                action={this.toggleExpand.bind(this)}
              />
            ) : null}
          </View>
          {expandable && !expanded ? (
            <View style={[styles.moreButtonWrapper, { backgroundColor: messageTint.pale }]}>
              <Svg style={styles.buttonGradient} viewBox="0 0 1 1">
                <Defs>
                  <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={messageTint.pale} stopOpacity="0" />
                    <Stop offset="0.3" stopColor={messageTint.pale} stopOpacity="0.5" />
                    <Stop offset="0.5" stopColor={messageTint.pale} stopOpacity="0.8" />
                    <Stop offset="0.75" stopColor={messageTint.pale} stopOpacity="0.95" />
                    <Stop offset="1" stopColor={messageTint.pale} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect x="-1" y="0" width="3" height="1" fill="url(#grad)" />
              </Svg>
              <TertiaryButton
                text="Voir plus"
                contentColor={theme.ui.text.regular}
                action={this.toggleExpand.bind(this)}
                style={styles.moreLessButton}
              />
            </View>
          ) : null}
        </View>
        <IconButton
          icon="ui-close"
          style={styles.closeButton}
          color={theme.ui.text.regular}
          action={flashMessageAction.bind(this)}
        />
        <View style={[styles.iconShadow, { backgroundColor: messageTint.pale }]}>
          <View style={[styles.iconWrapper, { borderColor: messageTint.light, backgroundColor: messageTint.regular }]}>
            <NamedSVG
              name={messageIcon}
              fill={theme.palette.grey.white}
              width={getScaleWidth(24)}
              height={getScaleWidth(24)}
              style={iconStyle}
            />
          </View>
        </View>
      </View>
    ) : null;
  }
}
