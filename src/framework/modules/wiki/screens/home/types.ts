import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ResourceExplorerTemplate } from '~/framework/modules/explorer/templates/resource-explorer/types';
import type { WikiNavigationParams } from '~/framework/modules/wiki/navigation';

export namespace WikiHomeScreen {
  export interface NavParams extends ResourceExplorerTemplate.NavParams {}
  export type NavigationProps = NativeStackScreenProps<WikiNavigationParams, 'home'>;
  export interface AllProps
    extends Omit<ResourceExplorerTemplate.ScreenProps, keyof ResourceExplorerTemplate.NavigationProps>,
      NavigationProps {}
}
