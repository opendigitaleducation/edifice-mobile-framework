import * as React from 'react';
import { Platform, View } from 'react-native';

import theme, { IShades } from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import TertiaryButton from '~/framework/components/buttons/tertiary';
import { UI_SIZES } from '~/framework/components/constants';
import { Picture, PictureProps } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';

import { toastConfigColor } from './model';
import styles from './styles';
import { AlertCardProps } from './types';

const toastDefaultPictureProps = {
  success: 'ui-success_outline',
  info: 'ui-infoCircle',
  warning: 'ui-alert-triangle',
  error: 'ui-error',
};

/**
 * Populates the given picture props with the right color shade and size
 * Works only for NamedSvg pictures for the moment
 * @param picture
 * @param shades
 * @returns the picture props with new members
 */
function autoFillPicture(picture: PictureProps, shades: IShades) {
  if (picture.type !== 'NamedSvg') return picture;
  return {
    ...picture,
    fill: picture.fill ?? shades.regular,
    width: picture.width !== undefined && picture.height !== undefined ? picture.width : UI_SIZES.elements.icon.default,
    height: picture.width !== undefined && picture.height !== undefined ? picture.height : UI_SIZES.elements.icon.default,
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
          ios: colorShades.pale, // On iOS we set the coloured background to make pixel-perfect rounded corners.
          default: undefined, // Android sucks to render translucent views with subviews, we have to minimise backgrounded views.
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
            type: 'NamedSvg',
            name: toastDefaultPictureProps[type],
            fill: colorShades.regular,
            width: UI_SIZES.elements.icon.default,
            height: UI_SIZES.elements.icon.default,
          } as PictureProps)),
    }),
    [colorShades, picture, type],
  );

  return { colorShades, cardBorderStyle, cardContentStyle, cardShadowContainerStyle, pictureWithColor };
}

const defaultRenderCloseButton: Required<AlertCardProps>['renderCloseButton'] = (shades, onClose) =>
  onClose ? <IconButton icon="ui-close" action={onClose} /> : null;

export function AlertCard(props: AlertCardProps) {
  const {
    type,
    icon,
    text,
    label,
    onLabelPress,
    onClose,
    renderCloseButton = defaultRenderCloseButton,
    shadow,
    containerProps,
    style,
    testID,
  } = props;
  const { colorShades, cardBorderStyle, cardContentStyle, cardShadowContainerStyle, pictureWithColor } = useToastStyles(type, icon);

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
