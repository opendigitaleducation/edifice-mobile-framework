import { navigate } from '~/framework/navigation/helper';
import { ModalsRouteNames } from '~/framework/navigation/modals';

import { ICarouselNavParams } from './screen';

export function openCarousel(props: ICarouselNavParams) {
  navigate(ModalsRouteNames.Carousel, props);
}
