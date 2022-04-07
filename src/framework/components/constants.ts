import { Dimensions, Platform, StatusBar } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';


const screenDimensions = Dimensions.get('window');

export const UI_ANIMATIONS = {
  fade: {
    duration: 300,
    useNativeDriver: true,
  },
  size: {
    duration: 300,
    useNativeDriver: false,
  },
};

export const UI_SIZES = {
  aspectRatios: {
    card: 15 / 14,
    thumbnail: 7 / 5,
  },
  dimensions: {
    height: {
      medium: 104,
    },
    width: {
      tiny: 1,
      small: 2,
    },
  },
  elements: {
    actionButtonSize: 20,
    navbarHeight: 56,
    statusbarHeight: StatusBar.currentHeight,
    tabbarHeight: 56,
  },
  radius: {
    medium: 8,
    large: 21,
    extraLarge: 24,
    small: 4,
  },
  screen: {
    bottomInset: initialWindowMetrics?.insets?.bottom || 0,
    height: screenDimensions.height,
    scale: screenDimensions.scale,
    topInset: initialWindowMetrics?.insets?.top || 0,
    width: screenDimensions.width,
  },
  spacing: {
    tiny: 2,
    extraSmall: 4,
    small: 6,
    smallPlus: 8,
    medium: 12,
    mediumPlus: 14,
    large: 16,
    largePlus: 22,
    extraLarge: 24,
    extraLargePlus: 36,
    huge: 64,
  },
  getViewHeight: (parms: { isNavbar: boolean; isTabbar: boolean } = { isNavbar: true, isTabbar: true }) => {
    const { isNavbar, isTabbar } = parms;
    return (
      UI_SIZES.screen.height -
      UI_SIZES.screen.topInset -
      UI_SIZES.screen.bottomInset -
      (isNavbar ? UI_SIZES.elements.navbarHeight : 0) -
      (isTabbar ? UI_SIZES.elements.tabbarHeight : 0) +
      Platform.select({ ios: 4, default: 24 })
    );
  },
};

export const UI_VALUES = {
  modalOpacity: 0.4,
};