import { navigate } from '~/framework/navigation/helper';
import { globalRouteNames } from '~/framework/navigation/modals';

import { CarouselScreenProps } from './types';

export function navigateCarousel(params: CarouselScreenProps.NavParams) {
  navigate(globalRouteNames.carousel, params);
}
