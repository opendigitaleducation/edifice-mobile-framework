/**
 * Modals screens available globally
 */
import { ParamListBase } from '@react-navigation/native';

import type { ICarouselNavParams } from '~/framework/components/carousel/screen';
import type { MediaPlayerParams } from '~/framework/components/media/player/types';
import { AudienceReactionsScreenNavParams } from '~/framework/modules/core/audience/screens/reactions/types';
import { AudienceViewsScreenNavParams } from '~/framework/modules/core/audience/screens/views/types';

export enum ModalsRouteNames {
  Pdf = '$pdf',
  Carousel = '$carousel',
  MediaPlayer = '$mediaPlayer',
  RichTextEditor = '$richTextEditor',
  AudienceReactions = '$audienceReactions',
  AudienceViews = '$audienceViews',
}

export interface IModalsNavigationParams extends ParamListBase {
  [ModalsRouteNames.Pdf]: { title: string; src?: string };
  [ModalsRouteNames.Carousel]: ICarouselNavParams;
  [ModalsRouteNames.MediaPlayer]: MediaPlayerParams;
  [ModalsRouteNames.AudienceReactions]: AudienceReactionsScreenNavParams;
  [ModalsRouteNames.AudienceViews]: AudienceViewsScreenNavParams;
}
