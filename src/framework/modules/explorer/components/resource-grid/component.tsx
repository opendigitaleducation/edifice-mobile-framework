import * as React from 'react';

import { FlashList, FlashListProps } from '@shopify/flash-list';

import { estimatedItemSize, ResourceExplorerItem } from './item-component';
import styles from './styles';
import type { ResourceGrid } from './types';

import type { ExplorerData } from '~/framework/modules/explorer/model/types';

const defaultKeyExtractor: ResourceGrid.Props<ResourceGrid.BaseItemT>['keyExtractor'] = (item, index) => {
  return item === null ? index.toString() : `${item.resourceType}${item.id}`;
};

const getItemType: FlashListProps<ResourceGrid.BaseItemT>['getItemType'] = item => item?.resourceType ?? 0;

const renderItem: FlashListProps<ResourceGrid.BaseItemT>['renderItem'] = info => <ResourceExplorerItem {...info} />;

export function ResourceGrid<T extends ExplorerData['items'][0]>({
  extraData: _extraData,
  keyExtractor,
  moduleConfig,
  ...flashListProps
}: ResourceGrid.Props<T>) {
  const extraData = React.useMemo(() => ({ ..._extraData, moduleConfig }), [_extraData, moduleConfig]);
  return (
    <FlashList
      {...flashListProps}
      extraData={extraData}
      keyExtractor={keyExtractor ?? defaultKeyExtractor}
      numColumns={2}
      getItemType={getItemType}
      contentContainerStyle={styles.contentContainer}
      renderItem={renderItem}
      estimatedItemSize={estimatedItemSize}
    />
  );
}
