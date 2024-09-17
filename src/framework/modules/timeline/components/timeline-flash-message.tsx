import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { TouchableContentCard } from '~/framework/components/card';
import { UI_SIZES, getScaleHeight } from '~/framework/components/constants';
import { Icon } from '~/framework/components/picture/Icon';
import { SmallBoldText, SmallItalicText, TextFontStyle } from '~/framework/components/text';
import { IEntcoreFlashMessage } from '~/framework/modules/timeline/reducer/flash-messages';
import { ArticleContainer } from '~/ui/ContainerContent';
import HtmlContentView from '~/ui/HtmlContentView';

interface ITimelineFlashMessageProps {
  flashMessage: IEntcoreFlashMessage;
  flashMessageAction: () => void;
}

interface ITimelineFlashMessageState {
  longText: boolean;
  measuredText: boolean;
  isExtended: boolean;
}

const styles = StyleSheet.create({
  containerOpaque: {
    width: '100%',
    opacity: 1,
  },
  containerTransparent: {
    width: '100%',
    opacity: 0,
  },
  header: {
    maxHeight: getScaleHeight(20) * (4 + 1),
    overflow: 'hidden',
  },
  seeMore: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export class TimelineFlashMessage extends React.PureComponent<ITimelineFlashMessageProps, ITimelineFlashMessageState> {
  state = {
    longText: false,
    measuredText: false,
    isExtended: false,
  };

  public render() {
    const { flashMessage, flashMessageAction } = this.props;
    const { isExtended, longText, measuredText } = this.state;
    const color = flashMessage && flashMessage.color;
    const customColor = flashMessage && flashMessage.customColor;
    const signature = flashMessage && flashMessage.signature;
    const signatureColor = flashMessage && flashMessage.signatureColor;
    const contents = flashMessage && flashMessage.contents;
    const appLanguage = I18n.getLanguage();
    const contentsHasAppLanguage = contents && Object.prototype.hasOwnProperty.call(contents, appLanguage);
    const contentsLanguages = contents && Object.keys(contents);
    const flashMessageHtml = contentsHasAppLanguage ? contents[appLanguage] : contents && contents[contentsLanguages[0]];
    const maxLines = 4,
      maxHeight = getScaleHeight(20) * maxLines;

    return flashMessageHtml && flashMessageHtml.length > 0 ? (
      <ArticleContainer style={measuredText ? styles.containerOpaque : styles.containerTransparent}>
        <TouchableContentCard
          activeOpacity={1}
          onPress={() => {
            this.setState({ isExtended: true });
          }}
          headerIndicator={
            <TouchableOpacity onPress={flashMessageAction}>
              <Icon
                name="close"
                color={theme.ui.text.inverse}
                style={{
                  paddingVertical: UI_SIZES.spacing.tiny,
                  paddingLeft: UI_SIZES.spacing.minor,
                }}
              />
            </TouchableOpacity>
          }
          style={{
            backgroundColor: color ? theme.palette.flashMessages[color] : customColor || theme.palette.secondary.regular,
          }}
          header={
            <View style={isExtended ? {} : longText ? styles.header : {}}>
              <HtmlContentView
                html={flashMessageHtml}
                opts={{
                  globalTextStyle: {
                    color: theme.ui.text.inverse,
                  },
                  boldTextStyle: {
                    color: theme.ui.text.inverse,
                  },
                  linkTextStyle: {
                    ...TextFontStyle.Bold,
                    color: theme.ui.text.inverse,
                    textDecorationLine: 'underline',
                  },
                  textColor: false,
                  images: false,
                  iframes: false,
                  audio: false,
                  video: false,
                }}
                onLayout={e => {
                  if (!measuredText) {
                    this.setState({ longText: e.nativeEvent.layout.height >= maxHeight, measuredText: true });
                  }
                }}
              />

              {signature ? <SmallItalicText style={{ color: signatureColor }}>{signature}</SmallItalicText> : null}
            </View>
          }>
          {longText && !isExtended ? (
            <View style={styles.seeMore}>
              <SmallBoldText style={{ color: theme.ui.text.inverse }}>{I18n.get('timeline-seemore')}</SmallBoldText>
              <Icon
                name="arrow_down"
                color={theme.ui.text.inverse}
                style={{
                  marginLeft: UI_SIZES.spacing.minor,
                  paddingTop: UI_SIZES.spacing.tiny,
                }}
              />
            </View>
          ) : null}
        </TouchableContentCard>
      </ArticleContainer>
    ) : null;
  }
}
