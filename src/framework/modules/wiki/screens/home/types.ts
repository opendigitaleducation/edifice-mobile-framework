import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { WikiNavigationParams } from '~/framework/modules/wiki/navigation';

export interface WikiHomeScreenProps {
  // @scaffolder add props here
}

export interface WikiHomeScreenNavParams {
  // requiredFoo: string; // @scaffolder remove example
  // optionalBar?: number; // @scaffolder remove example
  // @scaffolder add nav params here
}

export interface WikiHomeScreenPrivateProps extends NativeStackScreenProps<WikiNavigationParams, 'home'>, WikiHomeScreenProps {
  // @scaffolder add HOC props here
}
