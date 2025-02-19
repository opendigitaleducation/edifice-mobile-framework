import type { FlashListProps } from '@shopify/flash-list';

import type { ExplorerData } from '~/framework/modules/explorer/model/types';
import type { AnyNavigableModuleConfig } from '~/framework/util/moduleTool';

export namespace ResourceGrid {
  export interface Props<T extends BaseItemT>
    extends Omit<FlashListProps<T>, 'numColumns' | 'getItemType' | 'renderItem' | 'contentContainerStyle' | 'estimatedItemSize'> {
    moduleConfig: Pick<AnyNavigableModuleConfig, 'displayPicture' | 'displayColor'>;
  }
  export type BaseItemT = ExplorerData['items'][0];
}
