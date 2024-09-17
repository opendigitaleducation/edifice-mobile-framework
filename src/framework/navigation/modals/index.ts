/**
 * Modals screens available globally
 */
import { ParamListBase } from '@react-navigation/native';

import type { ICarouselNavParams } from '~/framework/components/carousel/screen';
import type { FileImportScreenProps } from '~/framework/components/inputs/rich-text/file-import';
import type { RichEditorFormReduxNavParams } from '~/framework/components/inputs/rich-text/form/types';
import type { MediaPlayerParams } from '~/framework/components/media/player/types';
import { AudienceReactionsScreenNavParams } from '~/framework/modules/core/audience/screens/reactions/types';
import { AudienceViewsScreenNavParams } from '~/framework/modules/core/audience/screens/views/types';

export enum ModalsRouteNames {
  Pdf = 'pdf',
  Carousel = 'carousel',
  MediaPlayer = 'media-player',
  RichTextEditor = 'rich-editor',
  AudienceReactions = 'audience-reactions',
  AudienceViews = 'audience-views',
  FileImport = 'file-import',
}

export interface IModalsNavigationParams extends ParamListBase {
  [ModalsRouteNames.Pdf]: { title: string; src?: string };
  [ModalsRouteNames.Carousel]: ICarouselNavParams;
  [ModalsRouteNames.MediaPlayer]: MediaPlayerParams;
  [ModalsRouteNames.AudienceReactions]: AudienceReactionsScreenNavParams;
  [ModalsRouteNames.AudienceViews]: AudienceViewsScreenNavParams;
  [ModalsRouteNames.FileImport]: FileImportScreenProps.NavParams;
  [ModalsRouteNames.RichTextEditor]: RichEditorFormReduxNavParams;
}
