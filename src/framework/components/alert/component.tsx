import * as React from 'react';
import { Platform, View } from 'react-native';

import { toastConfigColor } from './model';
import styles from './styles';
import { AlertCardProps } from './types';

import theme, { IShades } from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import TertiaryButton from '~/framework/components/buttons/tertiary';
import { UI_SIZES } from '~/framework/components/constants';
import { Picture, PictureProps } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';

const toastDefaultPictureProps = {
  error: 'ui-error',
  info: 'ui-infoCircle',
  success: 'ui-success_outline',
  warning: 'ui-alert-triangle',
};

/**
 * Populates the given picture props with the right color shade and size
 * Works only for Svg pictures for the moment
 * @param picture
 * @param shades
 * @returns the picture props with new members
 */
function autoFillPicture(picture: PictureProps, shades: IShades) {
  if (picture.type !== 'Svg') return picture;
  return {
    ...picture,
    fill: picture.fill ?? shades.regular,
    height: picture.width !== undefined && picture.height !== undefined ? picture.height : UI_SIZES.elements.icon.default,
    width: picture.width !== undefined && picture.height !== undefined ? picture.width : UI_SIZES.elements.icon.default,
  };
}

function useToastStyles(type: AlertCardProps['type'], picture: AlertCardProps['icon']) {
  const colorShades = theme.palette.status[toastConfigColor[type]] as IShades;
  const cardBorderStyle = React.useMemo(() => [{ backgroundColor: colorShades.regular }, styles.cardBorder], [colorShades.regular]);
  const cardContentStyle = React.useMemo(() => [{ borderColor: colorShades.pale }, styles.cardContent], [colorShades.pale]);
  const cardShadowContainerStyle = React.useMemo(
    () => [
      {
        backgroundColor: Platform.select({
          // On iOS we set the coloured background to make pixel-perfect rounded corners.
          default: undefined,
          ios: colorShades.pale, // Android sucks to render translucent views with subviews, we have to minimise backgrounded views.
        }),
      },
      styles.cardShadowContainer,
    ],
    [colorShades.pale],
  );
  const pictureWithColor = React.useMemo(
    () => ({
      ...(picture
        ? autoFillPicture(picture, colorShades)
        : ({
            fill: colorShades.regular,
            height: UI_SIZES.elements.icon.default,
            name: toastDefaultPictureProps[type],
            type: 'Svg',
            width: UI_SIZES.elements.icon.default,
          } as PictureProps)),
    }),
    [colorShades, picture, type],
  );

  return { cardBorderStyle, cardContentStyle, cardShadowContainerStyle, colorShades, pictureWithColor };
}

const defaultRenderCloseButton: Required<AlertCardProps>['renderCloseButton'] = (shades, onClose) =>
  onClose ? <IconButton icon="ui-close" action={onClose} /> : null;

export function AlertCard(props: AlertCardProps) {
  const {
    containerProps,
    icon,
    label,
    onClose,
    onLabelPress,
    renderCloseButton = defaultRenderCloseButton,
    shadow,
    style,
    testID,
    text,
    type,
  } = props;
  const { cardBorderStyle, cardContentStyle, cardShadowContainerStyle, colorShades, pictureWithColor } = useToastStyles(type, icon);

  const closeButton = React.useMemo(() => renderCloseButton(colorShades, onClose), [colorShades, onClose, renderCloseButton]);

  const cardContent = React.useMemo(
    () => (
      <>
        <Picture {...pictureWithColor} />
        <SmallText style={styles.cardText}>{text}</SmallText>
        {label && onLabelPress ? <TertiaryButton text={label} action={onLabelPress} /> : null}
        {closeButton}
      </>
    ),
    [label, onLabelPress, pictureWithColor, closeButton, text],
  );

  /* must decompose card and shadow because of overflow:hidden */
  const cardContainer = React.useMemo(
    () => (
      <View style={[styles.card, style]} {...containerProps} testID={testID}>
        <View style={cardBorderStyle} />
        <View style={cardContentStyle}>{cardContent}</View>
      </View>
    ),
    [cardBorderStyle, cardContent, cardContentStyle, containerProps, style, testID],
  );

  return React.useMemo(
    () => (shadow ? <View style={[cardShadowContainerStyle, style]}>{cardContainer}</View> : cardContainer),
    [cardContainer, cardShadowContainerStyle, shadow, style],
  );
}
