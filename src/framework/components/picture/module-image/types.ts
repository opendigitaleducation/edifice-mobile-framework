import { ImageProps, ImageSourcePropType } from 'react-native';

import { PictureProps } from '~/framework/components/picture';
import { AnyNavigableModuleConfig } from '~/framework/util/moduleTool';

export type ModuleImageProps = Partial<ImageProps> & {
  moduleConfig?: Partial<AnyNavigableModuleConfig>;
  source?: ImageSourcePropType;
};

export type ImageFallbackType = Partial<PictureProps> & {
  moduleConfig: Partial<AnyNavigableModuleConfig>;
};

export enum ImageLoadingState {
  LOADING = 'Loading',
  SUCCESS = 'Success',
  ERROR = 'Error',
}
