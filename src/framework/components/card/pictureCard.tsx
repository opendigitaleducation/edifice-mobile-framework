import React from 'react';
import { TextStyle, TouchableOpacityProps, View, ViewProps, ViewStyle } from 'react-native';

import { UI_SIZES, getScaleHeight } from '~/framework/components/constants';
import { Picture, PictureProps } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';

import { Card, CardWithoutPadding, TouchCard } from './base';

export type PictureCardProps = {
  text?: string | React.ReactElement;
  textStyle?: TextStyle;
  picture: PictureProps;
  pictureStyle?: ViewStyle;
} & ViewProps;

function PictureCard_Base(props: PictureCardProps & { cardComponent?: React.ComponentType<ViewProps> }) {
  const { cardComponent, text, textStyle, picture, style, ...viewProps } = props;
  const CC = cardComponent ?? CardWithoutPadding;
  return (
    <CC {...viewProps} style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Picture {...picture} />
      {text ? (
        typeof text === 'string' ? (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: UI_SIZES.spacing.minor,
              height: getScaleHeight(20) * 2,
            }}>
            <SmallText
              numberOfLines={2}
              style={[
                {
                  textAlign: 'center',
                  lineHeight: undefined,
                },
                textStyle,
              ]}>
              {text}
            </SmallText>
          </View>
        ) : (
          text
        )
      ) : null}
    </CC>
  );
}
export function PictureCard(props: PictureCardProps) {
  return <PictureCard_Base cardComponent={Card} {...props} />;
}
export function TouchablePictureCard(props: PictureCardProps & TouchableOpacityProps) {
  return <PictureCard_Base cardComponent={TouchCard} {...props} />;
}

function SelectorPictureCard_Base(props: PictureCardProps & { cardComponent?: React.ComponentType<ViewProps> }) {
  const { style, picture, pictureStyle, ...rest } = props;
  picture.style = { maxWidth: '100%', ...pictureStyle };
  picture.resizeMode = 'contain';
  return (
    <PictureCard
      style={[{ paddingVertical: UI_SIZES.spacing.medium, paddingHorizontal: UI_SIZES.spacing.medium }, style]}
      picture={picture}
      {...rest}
    />
  );
}
export function SelectorPictureCard(props: PictureCardProps) {
  return <SelectorPictureCard_Base cardComponent={Card} {...props} />;
}
export function TouchableSelectorPictureCard(props: PictureCardProps & TouchableOpacityProps) {
  return <SelectorPictureCard_Base cardComponent={TouchCard} {...props} />;
}

export type OverviewCardProps = {
  title?: string | React.ReactElement;
  picture?: PictureProps;
  pictureStyle?: PictureProps['style'];
  pictureWrapperStyle?: ViewStyle;
} & ViewProps;
