import type { FlashListProps, ListRenderItem } from '@shopify/flash-list';

import type { ExplorerData, Folder, Resource } from '~/framework/modules/explorer/model/types';
import type { AnyNavigableModuleConfig } from '~/framework/util/moduleTool';

export namespace ResourceGrid {
  export interface Props<T extends BaseItemT>
    extends Omit<FlashListProps<T>, 'numColumns' | 'getItemType' | 'renderItem' | 'contentContainerStyle' | 'estimatedItemSize'> {
    moduleConfig: Pick<AnyNavigableModuleConfig, 'displayPicture' | 'displayColor'>;
    onPressResource?: (r: Resource) => void;
    onPressFolder?: (f: Folder) => void;
  }
  export type BaseItemT = ExplorerData['items'][0];

  export type ResourceExplorerItemProps = Parameters<ListRenderItem<ResourceGrid.BaseItemT>>[0] &
    Pick<ResourceGrid.Props<ResourceGrid.BaseItemT>, 'onPressFolder' | 'onPressResource' | 'moduleConfig'>;

  export type ResourceExplorerFolderItemProps = Parameters<ListRenderItem<Folder>>[0] &
    Pick<ResourceGrid.Props<ResourceGrid.BaseItemT>, 'onPressFolder' | 'moduleConfig'>;

  export type ResourceExplorerResourceItemProps = Parameters<ListRenderItem<Resource>>[0] &
    Pick<ResourceGrid.Props<ResourceGrid.BaseItemT>, 'onPressResource' | 'moduleConfig'>;
}
