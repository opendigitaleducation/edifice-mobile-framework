import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { IModalsNavigationParams, ModalsRouteNames } from '~/framework/navigation/modals';

export interface SplashadsScreenDataProps {}

export interface SplashadsScreenEventProps {}

export interface SplashadsScreenNavParams {
  resourceUri: string;
}

export type SplashadsScreenProps = SplashadsScreenDataProps &
  SplashadsScreenEventProps &
  NativeStackScreenProps<IModalsNavigationParams, typeof ModalsRouteNames.SplashAds>;
