import * as React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import theme from '~/app/theme';
import { Picture } from '~/framework/components//picture';
import { TextSemiBold } from '~/framework/components//text';
import { UI_SIZES } from '~/framework/components/constants';
import { openUrl } from '~/framework/util/linking';
import { transformedSrc } from '~/infra/oauth';

export interface ActionButtonProps {
  text: string;
  iconName?: string;
  url?: string;
  action?: () => void;
  disabled?: boolean;
  type?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

export const ActionButton = ({ text, iconName, url, action, disabled, type, style }: ActionButtonProps) => {
  const Component = disabled ? View : TouchableOpacity;
  const viewStyle = {
    primary: {
      backgroundColor: disabled ? theme.ui.text.light : theme.palette.primary.regular,
      opacity: disabled ? 0.5 : 1,
    },
    secondary: {
      borderColor: disabled ? theme.ui.text.light : theme.palette.primary.regular,
      borderWidth: 2,
      opacity: disabled ? 0.5 : 1,
    },
  };
  const textStyle = {
    primary: {
      color: theme.ui.text.inverse,
    },
    secondary: {
      color: disabled ? theme.ui.text.light : theme.palette.primary.regular,
    },
  };
  const pictureFill = {
    primary: theme.ui.text.inverse,
    secondary: disabled ? theme.ui.text.light : theme.palette.primary.regular,
  };
  return (
    <Component
      style={[ActionButton.Style.viewCommon, viewStyle[type ?? 'primary'], style]}
      {...(!disabled
        ? {
            onPress: () => {
              if (action) {
                action();
              }
              if (url) {
                openUrl(transformedSrc(url));
              }
            },
          }
        : {})}>
      <TextSemiBold numberOfLines={1} style={[ActionButton.Style.textCommon, textStyle[type ?? 'primary']]}>
        {text}
      </TextSemiBold>
      {url || iconName ? (
        <Picture
          type="NamedSvg"
          name={iconName || 'pictos-external-link'}
          width={UI_SIZES.dimensions.width.large}
          height={UI_SIZES.dimensions.height.large}
          fill={pictureFill[type ?? 'primary']}
          style={ActionButton.Style.picture}
        />
      ) : null}
    </Component>
  );
};

const rlh = UI_SIZES.getResponsiveStyledLineHeight();

ActionButton.Style = StyleSheet.create({
  viewCommon: {
    height: UI_SIZES.dimensions.height.largePlus,
    paddingVertical: UI_SIZES.spacing.minor,
    paddingHorizontal: UI_SIZES.spacing.medium,
    borderRadius: UI_SIZES.radius.extraLarge,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  textCommon: {
    marginRight: UI_SIZES.spacing.minor,
    lineHeight: rlh,
    height: rlh,
  },
  picture: {
    marginLeft: UI_SIZES.spacing.minor,
  },
});
