/**
 * Modals screens available globally
 */
import { ParamListBase } from '@react-navigation/native';

import type { ICarouselNavParams } from '~/framework/components/carousel-old/screen';
import type { CarouselScreenProps } from '~/framework/components/carousel/types';
import type { FileImportScreenProps } from '~/framework/components/inputs/rich-text/file-import';
import type { RichEditorFormReduxNavParams } from '~/framework/components/inputs/rich-text/form/types';
import type { MediaPlayerParams } from '~/framework/components/media/player/types';
import type { SplashaddScreenNavParams } from '~/framework/components/splashadd/types';
import type { AudienceReactionsScreenNavParams } from '~/framework/modules/core/audience/screens/reactions/types';
import type { AudienceViewsScreenNavParams } from '~/framework/modules/core/audience/screens/views/types';

export enum ModalsRouteNames {
  Pdf = 'pdf',
  Carousel = 'carousel',
  MediaPlayer = 'media-player',
  RichTextEditor = 'rich-editor',
  AudienceReactions = 'audience-reactions',
  AudienceViews = 'audience-views',
  FileImport = 'file-import',
  SplashAdd = 'splashadd',
  CarouselOld = '$carousel',
}

export const globalRouteNames = {
  'file-import': 'file-import' as const,
  carousel: 'carousel' as const,
};

export interface IModalsNavigationParams extends ParamListBase {
  [ModalsRouteNames.Pdf]: { title: string; src?: string };
  [ModalsRouteNames.CarouselOld]: ICarouselNavParams;
  [ModalsRouteNames.MediaPlayer]: MediaPlayerParams;
  [ModalsRouteNames.AudienceReactions]: AudienceReactionsScreenNavParams;
  [ModalsRouteNames.AudienceViews]: AudienceViewsScreenNavParams;
  'file-import': FileImportScreenProps.NavParams;
  [ModalsRouteNames.RichTextEditor]: RichEditorFormReduxNavParams;
  [ModalsRouteNames.SplashAdd]: SplashaddScreenNavParams;
  carousel: CarouselScreenProps.NavParams;
}
