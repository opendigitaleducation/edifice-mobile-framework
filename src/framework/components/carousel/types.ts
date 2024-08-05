import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import { AudienceParameter } from '~/framework/modules/core/audience/types';
import { IModalsNavigationParams, globalRouteNames } from '~/framework/navigation/modals';
import type { IMedia } from '~/framework/util/media';

export namespace CarouselScreenProps {
  export interface Public {
    // No props to provide byself
  }

  export interface NavParams {
    medias: IMedia[];
    startIndex?: number;
    referer: AudienceParameter; // used for audience tracking
  }

  export type Navigation = NativeStackScreenProps<IModalsNavigationParams, typeof globalRouteNames.carousel>;

  export type NavBarConfig = ({ navigation, route }: Navigation) => NativeStackNavigationOptions;

  export interface All extends Public, Navigation {}
}
