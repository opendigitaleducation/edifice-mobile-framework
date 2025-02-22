import { ImageProps, ImageSourcePropType } from 'react-native';

import { PictureProps } from '~/framework/components/picture';
import { AnyNavigableModuleConfig } from '~/framework/util/moduleTool';

/** @vmou
 * Ici, en soi, tu peux utiliser pick<AnyNavigableModuleConfig, 'displayPicture' | 'displayColor'> pour obtenir juste les deux champs dont tu auras besoin.
 * Je pense que cette prop ne doit pas être optionelle.
 * Pour les mêmes raisons, il ne vaut mieux pas utiliser Partial<ImageProps>. Surtout que `source` est déjà optionnel dedans.
 */

export type ModuleImageProps = Partial<ImageProps> & {
  moduleConfig?: Partial<AnyNavigableModuleConfig>;
  source?: ImageSourcePropType;
};

export type ImageFallbackType = Partial<PictureProps> & {
  moduleConfig: Partial<AnyNavigableModuleConfig>;
};

/** @vmou
 * Pas besoin d'utiliser une enum string ici. `const enum` est aussi approprié car on n'a pas besoin de garder la lisibilité de la valeur dans un autre contexte.
 */

export enum ImageLoadingState {
  LOADING = 'Loading',
  SUCCESS = 'Success',
  ERROR = 'Error',
}
