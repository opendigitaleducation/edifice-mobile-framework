/**
 * EmptyScreen
 *
 * A friendly empty screen for when there is no data to show.
 * Shows a large image (svg) with a title, an optional paragraph and an optional action button.
 */
import * as React from 'react';
import { ColorValue, TextStyle, View, ViewStyle } from 'react-native';

import styles from './styles';

import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import { getScaleImageSize, UI_SIZES } from '~/framework/components/constants';
import { PageViewStyle } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { HeadingSText, SmallText } from '~/framework/components/text';

const EmptyScreen = ({
  buttonAction,
  buttonIcon,
  buttonText,
  buttonUrl,
  customStyle,
  customTitleStyle,
  svgFillColor,
  svgImage,
  text,
  textColor,
  title,
}: {
  svgImage: string;
  title: string;
  text?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonAction?: () => void;
  buttonIcon?: string;
  customStyle?: ViewStyle;
  customTitleStyle?: TextStyle;
  svgFillColor?: ColorValue;
  textColor?: ColorValue;
}) => {
  const imageWidth = getScaleImageSize(280);
  const imageHeight = getScaleImageSize(200);
  const hasButton = buttonText && (buttonUrl || buttonAction);
  return (
    <PageViewStyle
      style={[
        {
          paddingHorizontal: UI_SIZES.spacing.big,
          paddingTop: UI_SIZES.spacing.huge,
        },
        customStyle,
      ]}>
      <Svg style={styles.icon} name={svgImage} width={imageWidth} height={imageHeight} fill={svgFillColor} />
      {title ? (
        <HeadingSText
          numberOfLines={2}
          style={[styles.title, { color: textColor ?? theme.palette.primary.regular }, customTitleStyle]}>
          {title}
        </HeadingSText>
      ) : null}
      {text ? (
        <SmallText
          // numberOfLines={5}
          style={[styles.text, textColor ? { color: textColor } : {}]}>
          {text}
        </SmallText>
      ) : null}
      {hasButton ? (
        <View style={{ marginTop: UI_SIZES.spacing.large }}>
          <PrimaryButton text={buttonText} url={buttonUrl} action={buttonAction} iconRight={buttonIcon} />
        </View>
      ) : null}
    </PageViewStyle>
  );
};

export default EmptyScreen;
