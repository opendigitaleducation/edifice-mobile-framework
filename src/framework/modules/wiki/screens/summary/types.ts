import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import { Resource } from '~/framework/modules/explorer/model/types';
import type { WikiNavigationParams } from '~/framework/modules/wiki/navigation';

export namespace WikiSummaryScreen {
  export interface NavParams {
    resourceId: Resource['id'];
  }

  export type NavigationProps = NativeStackScreenProps<WikiNavigationParams, 'summary'>;

  export type NavBarConfig = ({ navigation, route }: NavigationProps) => NativeStackNavigationOptions;

  export interface AllProps extends NavigationProps {}
}
