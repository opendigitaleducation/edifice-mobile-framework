import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { TextFontStyle, TextSizeStyle } from '~/framework/components/text';

import { DropdownSize, DropdownVariant } from './types';

const styles = StyleSheet.create({
  bigPaddingGhost: {
    paddingHorizontal: UI_SIZES.spacing.minor,
    paddingVertical: UI_SIZES.spacing.minor,
  },
  bigPaddingOutline: {
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.small,
  },
  bodyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: UI_SIZES.spacing.minor,
  },
  // eslint-disable-next-line react-native/no-color-literals
  containerGhost: {
    minHeight: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: UI_SIZES.radius.medium,
  },
  containerOutline: {
    minHeight: 0,
    backgroundColor: theme.palette.grey.white,
    borderWidth: 1,
    borderColor: theme.palette.grey.cloudy,
    borderRadius: UI_SIZES.radius.medium,
  },
  disabledContainerGhost: {
    backgroundColor: theme.palette.grey.white,
  },
  disabledContainerOutline: {
    backgroundColor: theme.palette.grey.fog,
    borderColor: theme.palette.grey.grey,
  },
  disabledText: {
    color: theme.palette.grey.stone,
  },
  dropdownContainer: {
    maxHeight: 300,
    backgroundColor: theme.palette.grey.white,
    borderWidth: 0,
    borderRadius: UI_SIZES.radius.mediumPlus,
    shadowColor: theme.ui.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'visible',
  },
  dropdownItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownListContainer: {
    borderRadius: UI_SIZES.radius.mediumPlus,
  },
  dropdownListContentContainer: {
    paddingHorizontal: UI_SIZES.spacing.minor,
    paddingVertical: UI_SIZES.spacing.small,
    rowGap: UI_SIZES.spacing.tiny,
  },
  mediumPaddingOutline: {
    paddingHorizontal: UI_SIZES.spacing.small,
    paddingVertical: UI_SIZES.spacing.minor,
  },
  selectedContainerGhost: {
    backgroundColor: theme.palette.primary.pale,
  },
  text: {
    ...TextFontStyle.Regular,
    ...TextSizeStyle.Medium,
  },
});

export const getToggleStyle = (
  type: DropdownVariant,
  size: DropdownSize,
  isOpened: boolean,
  isItemSelected: boolean,
  style?: StyleProp<ViewStyle>,
) => {
  if (type === 'outlined') {
    return {
      style: [
        styles.containerOutline,
        size === 'big' ? styles.bigPaddingOutline : styles.mediumPaddingOutline,
        {
          borderColor: isOpened
            ? theme.palette.primary.light
            : isItemSelected
              ? theme.palette.grey.graphite
              : theme.palette.grey.cloudy,
        },
        style,
      ],
      disabledStyle: styles.disabledContainerOutline,
    };
  } else {
    return {
      style: [styles.containerGhost, styles.bigPaddingGhost, isOpened && styles.selectedContainerGhost, style],
      disabledStyle: styles.disabledContainerGhost,
    };
  }
};

export default styles;
