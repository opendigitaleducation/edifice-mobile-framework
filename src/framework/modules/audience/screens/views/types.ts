import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AudienceReferer } from '~/framework/modules/audience/types';
import { IModalsNavigationParams, ModalsRouteNames } from '~/framework/navigation/modals';

export interface AudienceViewsScreenDataProps {}
export interface AudienceViewsScreenEventProps {}
export interface AudienceViewsScreenNavParams {
  referer: AudienceReferer;
}
export type AudienceViewsScreenProps = AudienceViewsScreenDataProps &
  AudienceViewsScreenEventProps &
  NativeStackScreenProps<IModalsNavigationParams, typeof ModalsRouteNames.AudienceViews>;
