import * as React from 'react';
import { LayoutChangeEvent, ScrollView as RNScrollView, View } from 'react-native';

import styles from './styles';
import { ITimelineFlashMessageProps, ITimelineFlashMessageState } from './types';

import { I18n } from '~/app/i18n';
import theme, { IShades } from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import TertiaryButton from '~/framework/components/buttons/tertiary';
import { getScaleWidth } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { getLineHeight, SmallBoldText, TextFontStyle } from '~/framework/components/text';
import { IEntcoreFlashMessage } from '~/framework/modules/timeline/reducer/flash-messages';
import HtmlContentView from '~/ui/HtmlContentView';

const flashMessageColors: Record<NonNullable<IEntcoreFlashMessage['color']>, Pick<IShades, 'pale' | 'light' | 'regular'>> = {
  blue: theme.palette.complementary.blue,
  green: theme.palette.complementary.green,
  'grey-dark': {
    light: theme.palette.grey.cloudy,
    pale: theme.palette.grey.pearl,
    regular: theme.palette.grey.stone,
  },
  orange: theme.palette.complementary.orange,
  red: theme.palette.complementary.red,
};

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
    const maxLines = 3;
    const textSize = 'Normal';
    const lineHeight = getLineHeight(textSize);
    const maxHeight = lineHeight * maxLines;
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
                audio: false,
                iframes: false,
                images: false,
                linkTextStyle: {
                  ...TextFontStyle.Bold,
                  textDecorationLine: 'underline',
                },
                textColor: false,
                video: false,
              }}
            />
          </RNScrollView>
          <View style={styles.postContent}>
            <SmallBoldText style={styles.signature} ellipsizeMode="tail" numberOfLines={2}>
              {signature}
            </SmallBoldText>

            {expandable && expanded ? (
              <TertiaryButton
                style={[styles.moreLessButton, { backgroundColor: messageTint.pale }]}
                text={I18n.get('textpreview-seeless')}
                contentColor={theme.ui.text.regular}
                action={this.toggleExpand.bind(this)}
              />
            ) : null}

            {expandable && !expanded ? (
              <TertiaryButton
                text={I18n.get('textpreview-seemore')}
                contentColor={theme.ui.text.regular}
                action={this.toggleExpand.bind(this)}
                style={styles.moreLessButton}
              />
            ) : null}
          </View>
        </View>
        <IconButton
          icon="ui-close"
          style={styles.closeButton}
          color={theme.ui.text.regular}
          action={flashMessageAction.bind(this)}
        />
        <View style={[styles.iconShadow, { backgroundColor: messageTint.pale }]}>
          <View style={[styles.iconWrapper, { backgroundColor: messageTint.regular, borderColor: messageTint.light }]}>
            <Svg
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
