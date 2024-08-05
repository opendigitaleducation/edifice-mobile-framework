import { navigate } from '~/framework/navigation/helper';
import { ModalsRouteNames } from '~/framework/navigation/modals';

import type { ICarouselNavParams } from './screen';

export function openCarousel(props: ICarouselNavParams) {
  navigate(ModalsRouteNames.CarouselOld, props);
}
