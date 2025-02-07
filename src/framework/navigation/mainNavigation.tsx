/**
 * The MainNavigation is nav hierarchy used when the user is logged in.
 * It includes all modules screens and TabBar screens.
 *
 * navBar shows up with the RootSTack's NativeStackNavigator, not TabNavigator (because TabNavigator is not native).
 */
import * as React from 'react';
import { Platform } from 'react-native';

import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  CommonActions,
  EventMapBase,
  NavigationHelpers,
  NavigationState,
  ParamListBase,
  RouteProp,
  ScreenListeners,
  StackActions,
} from '@react-navigation/native';
import { connect } from 'react-redux';

import { handleCloseModalActions } from './helper';
import { getAndroidTabBarStyleForNavState } from './hideTabBarAndroid';
import modals from './modals/navigator';
import { ModuleScreens } from './moduleScreens';
import { getTypedRootStack } from './navigators';
import { setConfirmQuitAction } from './nextTabJump';
import { computeTabRouteName, tabModules } from './tabModules';

import { I18n } from '~/app/i18n';
import { setUpModulesAccess } from '~/app/modules';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { IconProps, Picture, PictureProps } from '~/framework/components/picture';
import useAuthNavigation from '~/framework/modules/auth/navigation/main-account/navigator';
import { getIsXmasActive } from '~/framework/modules/user/actions';
import { navBarOptions } from '~/framework/navigation/navBar';
import Feedback from '~/framework/util/feedback/feedback';
import { AnyNavigableModule, AnyNavigableModuleConfig } from '~/framework/util/moduleTool';
import { AuthActiveAccount } from '../modules/auth/model';

//  88888888888       888      888b    888                   d8b                   888
//      888           888      8888b   888                   Y8P                   888
//      888           888      88888b  888                                         888
//      888   8888b.  88888b.  888Y88b 888  8888b.  888  888 888  .d88b.   8888b.  888888  .d88b.  888d888
//      888      "88b 888 "88b 888 Y88b888     "88b 888  888 888 d88P"88b     "88b 888    d88""88b 888P"
//      888  .d888888 888  888 888  Y88888 .d888888 Y88  88P 888 888  888 .d888888 888    888  888 888
//      888  888  888 888 d88P 888   Y8888 888  888  Y8bd8P  888 Y88b 888 888  888 Y88b.  Y88..88P 888
//      888  "Y888888 88888P"  888    Y888 "Y888888   Y88P   888  "Y88888 "Y888888  "Y888  "Y88P"  888
//                                                                    888
//                                                               Y8b d88P
//                                                                "Y88P"

const Tab = createBottomTabNavigator();

const PictureWithXmas = connect((state: IGlobalState) => ({
  isXmas: getIsXmasActive(state),
}))((props: PictureProps & IconProps & { isXmas?: boolean; focused: boolean }) => {
  const { isXmas, name, ...other } = props;
  return <Picture {...other} name={`${isXmas ? 'xmas-' : ''}${name}`} />;
});

const createTabIcon = (
  moduleConfig: AnyNavigableModuleConfig,
  props: Parameters<Required<BottomTabNavigationOptions>['tabBarIcon']>[0],
) => {
  let dp: Partial<PictureProps> = { ...moduleConfig.displayPicture };
  props.size = UI_SIZES.elements.tabbarIconSize;

  if (dp.type === 'Image') {
    dp.style = [dp.style, { height: props.size, width: props.size }];
  } else if (dp.type === 'Icon') {
    dp.size = dp.size ?? props.size;
    dp.color = dp.color ?? props.color;
    dp.name = dp.name ?? 'more_vert';
  } else if (dp.type === 'Svg') {
    dp.name = dp.name ?? 'ui-options';
    dp.height = props.size;
    dp.width = props.size;
    dp.fill = props.color;
  }

  if (props.focused) {
    dp = { ...dp, ...moduleConfig.displayPictureFocus } as Partial<PictureProps>;
  }

  return <PictureWithXmas {...(dp as PictureProps)} />;
};

const createTabOptions = (moduleConfig: AnyNavigableModuleConfig) => {
  return {
    tabBarIcon: props => {
      return createTabIcon(moduleConfig, props);
    },
    tabBarLabel: I18n.get(moduleConfig.displayI18n),
    tabBarTestID: moduleConfig.testID ?? '',
  } as BottomTabNavigationOptions;
};

/**
 * The tab listener handles reset the stack inside a tab when leaving the tab + handle prevent back mechanic in this case.
 */
const tabListeners = ({ navigation }: { navigation: NavigationHelpers<ParamListBase> }) =>
  ({
    tabPress: event => {
      if (!event.target) return;
      const state = navigation.getState();
      let mustPrevent = state.routes[state.index].key !== event.target; // We must prevent default if we change tab, not if it's the same tab. This allow to use useScrollToTop.
      let doTabSwitch: boolean = true;
      state.routes.forEach((route, tabIndex) => {
        //
        if (tabIndex === state.index) {
          // Narrows to the current tab
          if (state.routes[state.index]?.state?.index !== undefined && state.routes[state.index]?.state?.index !== 0) {
            // Pop to top only if there at least two pages in the stack
            mustPrevent = true;
            navigation.dispatch(StackActions.popToTop());
            const newState = navigation.getState();
            doTabSwitch = newState !== state;
          }
        }
      });
      if (mustPrevent) {
        (event as unknown as React.SyntheticEvent).preventDefault(); // Types given by ScreenListeners are wrong here. We use SyntheticEvent as a fallback that contains preventDefault.
      }
      // Then, change tabs only if previous pop to top hadn't be blocked by preventRemove or something else...
      if (doTabSwitch) {
        navigation.navigate({ key: event.target });
      } else {
        // Else, register the tab change that will be handled in preventRemove callback
        setConfirmQuitAction(CommonActions.navigate({ key: event.target }));
      }
      // Feebback
      Feedback.tabPressed();
    },
  }) as ScreenListeners<NavigationState, EventMapBase>;

const stackListeners = ({ navigation }: { navigation: NavigationHelpers<ParamListBase> }) => ({
  transitionEnd: event => {
    handleCloseModalActions(navigation);
  },
});

export function TabStack({ module }: { module: AnyNavigableModule }) {
  const RootStack = getTypedRootStack();
  const authNavigation = useAuthNavigation();
  return (
    <RootStack.Navigator screenOptions={navBarOptions} initialRouteName={module.config.routeName} screenListeners={stackListeners}>
      {ModuleScreens.all}
      {authNavigation}
      {modals}
    </RootStack.Navigator>
  );
}

export function useTabNavigator(sessionIfExists?: AuthActiveAccount) {
  // Simple Hack : session can be recreated with same values.
  // By using JSON-stringified version for useMemo() deps, we ensure that the navigation will be re-rendered only if necessary.
  const appsJson = JSON.stringify(sessionIfExists?.rights.apps);

  const tabModulesCache = tabModules.get();
  const moduleTabStackCache = React.useMemo(
    () => tabModulesCache.map(module => <TabStack module={module} key={module.config.name} />),
    [tabModulesCache],
  );
  const moduleTabStackGetterCache = React.useMemo(() => moduleTabStackCache.map(ts => () => ts), [moduleTabStackCache]);
  const availableTabModules = React.useMemo(
    () =>
      sessionIfExists
        ? tabModules
            .get()
            .filterAvailables(sessionIfExists)
            .sort((a, b) => a.config.displayOrder - b.config.displayOrder)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appsJson],
  );
  const tabRoutes = React.useMemo(() => {
    return availableTabModules.map(module => {
      const index = tabModulesCache.findIndex(tm => tm.config.name === module.config.name);
      if (index < 0) return undefined;

      return (
        <Tab.Screen
          key={module.config.routeName}
          name={computeTabRouteName(module.config.routeName)}
          options={createTabOptions(module.config)}
          listeners={tabListeners}>
          {moduleTabStackGetterCache[index]}
        </Tab.Screen>
      );
    });
    // We effectively want to have this deps to minimise re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appsJson]);
  const screenOptions: (props: { route: RouteProp<ParamListBase>; navigation: any }) => BottomTabNavigationOptions =
    React.useCallback(({ navigation, route }) => {
      return {
        // Prevent navBar flickering with this option
        freezeOnBlur: true,
        headerShown: false,
        lazy: false,
        tabBarActiveTintColor: theme.palette.primary.regular.toString(),
        // 😡 F U React Nav 6, using plain string instead of ColorValue
        tabBarHideOnKeyboard: Platform.select({ android: true, ios: false }),

        tabBarIconStyle: {
          height: UI_SIZES.elements.tabbarIconSize,
          marginTop: UI_SIZES.elements.tabbarLabelMarginTop,
          width: UI_SIZES.elements.tabbarIconSize,
        },

        // 😡 F U React Nav 6, using plain string instead of ColorValue
        tabBarInactiveTintColor: theme.ui.text.light.toString(),

        tabBarLabelStyle: {
          fontSize: 12,
          lineHeight: undefined,
          marginBottom: UI_SIZES.elements.tabbarLabelMarginBottom,
        },

        tabBarStyle: {
          backgroundColor: theme.ui.background.card,
          borderTopColor: theme.palette.grey.cloudy,
          borderTopWidth: 1,
          elevation: 1,
          height: UI_SIZES.elements.tabbarHeight + UI_SIZES.screen.bottomInset,
          ...getAndroidTabBarStyleForNavState(navigation.getState()),
        },
      };
    }, []);
  return React.useMemo(() => {
    return <Tab.Navigator screenOptions={screenOptions}>{tabRoutes}</Tab.Navigator>;
  }, [screenOptions, tabRoutes]);
}

//   .d8888b.  888                      888      888b    888                   d8b                   888
//  d88P  Y88b 888                      888      8888b   888                   Y8P                   888
//  Y88b.      888                      888      88888b  888                                         888
//   "Y888b.   888888  8888b.   .d8888b 888  888 888Y88b 888  8888b.  888  888 888  .d88b.   8888b.  888888  .d88b.  888d888
//      "Y88b. 888        "88b d88P"    888 .88P 888 Y88b888     "88b 888  888 888 d88P"88b     "88b 888    d88""88b 888P"
//        "888 888    .d888888 888      888888K  888  Y88888 .d888888 Y88  88P 888 888  888 .d888888 888    888  888 888
//  Y88b  d88P Y88b.  888  888 Y88b.    888 "88b 888   Y8888 888  888  Y8bd8P  888 Y88b 888 888  888 Y88b.  Y88..88P 888
//   "Y8888P"   "Y888 "Y888888  "Y8888P 888  888 888    Y888 "Y888888   Y88P   888  "Y88888 "Y888888  "Y888  "Y88P"  888
//                                                                                      888
//                                                                                 Y8b d88P
//                                                                                  "Y88P"

export enum MainRouteNames {
  Tabs = '$tabs',
}

/**
 * Computes the main navigation screens as a Group.
 * This operation is heavy so be careful to not call it unless content of apps or widgets really changes.
 * @param apps available apps for the user
 * @param widgets available widgets for the user
 * @returns
 */
export function useMainNavigation(sessionIfExists?: AuthActiveAccount) {
  const RootStack = getTypedRootStack();
  setUpModulesAccess(sessionIfExists);
  const MainTabNavigator = useTabNavigator(sessionIfExists);
  const renderMainTabNavigator = React.useCallback(() => {
    return MainTabNavigator;
  }, [MainTabNavigator]);

  return React.useMemo(() => {
    return (
      <RootStack.Group screenOptions={navBarOptions}>
        <RootStack.Screen name={MainRouteNames.Tabs} component={renderMainTabNavigator} options={{ headerShown: false }} />
      </RootStack.Group>
    );
  }, [RootStack, renderMainTabNavigator]);
}
