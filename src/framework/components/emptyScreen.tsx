/**
 * EmptyScreen
 *
 * A friendly empty screen for when there is no data to show.
 * Shows a large image (svg) with a title, an optional paragraph and an optional action button.
 */
import * as React from 'react';
import { View, ViewStyle } from 'react-native';

import theme from '~/app/theme';
import { NamedSVG } from '~/framework/components/picture/NamedSVG';

import { ActionButton } from './ActionButton';
import { UI_SIZES } from './constants';
import { PageViewWithStyle } from './page';
import { Text, TextSemiBold } from './text';

export const EmptyScreen = ({
  svgImage,
  title,
  text,
  buttonText,
  buttonUrl,
  buttonAction,
  customStyle,
}: {
  svgImage: string;
  title: string;
  text?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonAction?: () => void;
  customStyle?: ViewStyle;
}) => {
  const imageWidth = UI_SIZES.screen.width - 4 * UI_SIZES.spacing.big;
  const imageHeight = imageWidth / UI_SIZES.aspectRatios.thumbnail;
  const hasButton = buttonText && (buttonUrl || buttonAction);
  return (
    <PageViewWithStyle
      style={[
        {
          backgroundColor: theme.ui.background.empty,
          paddingTop: UI_SIZES.spacing.huge,
          paddingHorizontal: UI_SIZES.spacing.big,
        },
        customStyle,
      ]}>
      <View style={{ paddingHorizontal: UI_SIZES.spacing.big }}>
        <View style={{ height: imageHeight }}>
          <NamedSVG name={svgImage} width={imageWidth} height={imageHeight} />
        </View>
      </View>
      <TextSemiBold
        numberOfLines={2}
        style={{
          textAlign: 'center',
          fontSize: 18,
          color: theme.palette.primary.regular,
          marginTop: UI_SIZES.spacing.large,
        }}>
        {title}
      </TextSemiBold>
      {text ? (
        <Text
          numberOfLines={3}
          style={{
            textAlign: 'center',
            marginTop: UI_SIZES.spacing.small,
          }}>
          {text}
        </Text>
      ) : null}
      {hasButton ? (
        <View style={{ marginTop: UI_SIZES.spacing.large }}>
          <ActionButton text={buttonText} url={buttonUrl} action={buttonAction} />
        </View>
      ) : null}
    </PageViewWithStyle>
  );
};
