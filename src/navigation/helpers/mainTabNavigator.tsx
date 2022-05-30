import styled from '@emotion/native';
import * as React from 'react';
import { View } from 'react-native';
import { NavigationScreenProp, NavigationState } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Picture, PictureProps } from '~/framework/components/picture';
import { CommonStyles } from '~/styles/common/styles';
import { IconOnOff } from '~/ui/icons/IconOnOff';

export const createMainTabNavigator = (routeConfigs, initialRouteName: string = undefined) =>
  createBottomTabNavigator(routeConfigs, {
    initialRouteName,
    defaultNavigationOptions: shouldTabBarBeVisible,
    swipeEnabled: false,
    tabBarOptions: {
      // Colors
      activeTintColor: theme.palette.primary.regular,
      inactiveTintColor: theme.palette.primary.regular,
      // Label and icon
      showIcon: true,
      showLabel: true,
      // Style
      style: {
        backgroundColor: CommonStyles.tabBottomColor,
        borderTopColor: CommonStyles.borderColorLighter,
        borderTopWidth: 1,
        elevation: 1,
        height: UI_SIZES.elements.tabbarHeight,
      },
      tabStyle: {
        flexDirection: 'column',
        height: '100%',
      },
    },
  });

export const createMainTabNavOption = (title: string, icon?: string | PictureProps, iconFocus?: PictureProps) => {
  const computePicture = (icon: PictureProps) => {
    if (icon.type === 'NamedSvg') {
      icon.height = icon.width = 24;
      icon.style = { marginTop: -6 };
    } else if (icon.type === 'Image') {
      icon.style = { width: 24, height: 24, marginTop: -6 };
    } else if (icon.type === 'Icon') {
      icon.size = 24;
      icon.style = { marginTop: -6 };
    }
    return icon;
  };
  if (!icon) {
    return {
      tabBarIcon: ({ focused }) => <View />,
      tabBarLabel: ({ focused }) => <MainTabNavigationLabel focused={focused}>{title}</MainTabNavigationLabel>,
    };
  } else if (typeof icon === 'string') {
    return {
      tabBarIcon: ({ focused }) => <IconOnOff size={24} name={icon} focused={focused} style={{ marginTop: -6 }} />,
      tabBarLabel: ({ focused }) => <MainTabNavigationLabel focused={focused}>{title}</MainTabNavigationLabel>,
    };
  } else {
    icon = computePicture(icon);
    iconFocus = computePicture(iconFocus ?? icon);
    if (icon.type === 'NamedSvg') {
      return {
        tabBarIcon: ({ focused }) => (focused ? <Picture {...iconFocus} /> : <Picture {...icon} />),
        tabBarLabel: ({ focused }) => <MainTabNavigationLabel focused={focused}>{title}</MainTabNavigationLabel>,
      };
    } else if (icon.type === 'Image') {
      icon.style = { width: 24, height: 24, marginTop: -6 };
      return {
        tabBarIcon: ({ focused }) => (focused ? <Picture {...iconFocus} /> : <Picture {...icon} />),
        tabBarLabel: ({ focused }) => <MainTabNavigationLabel focused={focused}>{title}</MainTabNavigationLabel>,
      };
    } else if (icon.type === 'Icon') {
      return {
        // focused ? theme.palette.primary.regular : CommonStyles.iconColorOff
        tabBarIcon: ({ focused }) =>
          focused ? (
            <Picture {...iconFocus} color={theme.palette.primary.regular} />
          ) : (
            <Picture {...icon} color={theme.ui.text.light} />
          ),
        tabBarLabel: ({ focused }) => <MainTabNavigationLabel focused={focused}>{title}</MainTabNavigationLabel>,
      };
    } else
      return {
        tabBarIcon: ({ focused }) => (focused ? <Picture {...iconFocus} /> : <Picture {...icon} />),
        tabBarLabel: ({ focused }) => <MainTabNavigationLabel focused={focused}>{title}</MainTabNavigationLabel>,
      };
  }
};

const MainTabNavigationLabel = styled.Text(
  {
    alignSelf: 'center',
    fontFamily: CommonStyles.primaryFontFamily,
    fontSize: 10,
    marginBottom: 4,
    marginTop: -12,
  },
  ({ focused }) => ({
    color: focused ? theme.palette.primary.regular : CommonStyles.textTabBottomColor,
  }),
);

export const shouldTabBarBeVisible = ({ navigation }: { navigation: NavigationScreenProp<NavigationState> }) => {
  let tabBarVisible = true;
  if (navigation.state.index > 0) {
    tabBarVisible = false;
  }

  return {
    tabBarVisible,
  };
};
