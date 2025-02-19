import * as React from 'react';

import { FlashListProps, ViewToken } from '@shopify/flash-list';

import type { ResourceExplorerTemplate } from './types';

import { UI_SIZES } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import { ContentLoader, ContentLoaderProps } from '~/framework/hooks/loader';
import ResourceGrid from '~/framework/modules/explorer/components/resource-grid';
import { ExplorerData, Folder, Resource } from '~/framework/modules/explorer/model/types';
import service from '~/framework/modules/explorer/service/index';
import { HTTPError } from '~/framework/util/http';

const estimatedListSize = {
  height: UI_SIZES.getViewHeight(),
  width: UI_SIZES.screen.width,
};

const viewabilityConfig: FlashListProps<ExplorerData['items'][0]>['viewabilityConfig'] = {
  itemVisiblePercentThreshold: 0,
  minimumViewTime: 250,
  waitForInteraction: false,
};

const PAGE_SIZE = 24;
const WINDOW_SLOP = 12; // How many margin to compute which items to load outside the visible ones

const placeholderData = new Array(8).fill(null);

export function ResourceExplorerTemplate({ moduleConfig }: ResourceExplorerTemplate.AllProps) {
  const [data, setData] = React.useState<ExplorerData>({ items: [], nbFolders: 0, nbResources: 0 });
  // Note: here store a ref to the state because `onViewableItemsChanged` won't be refreshed by state updates.
  const dataRef = React.useRef(data);
  dataRef.current = data;

  // Pages currenlty fetching
  const fetchingPages = React.useRef<Set<number>>(new Set());

  const loadPage = React.useCallback(async (start_idx: number, reloadAll: boolean = false) => {
    // DUMMY WAIT
    // if (__DEV__) await new Promise(resolve => setTimeout(resolve, 1000));

    // Call Page API
    try {
      const response = await service.resources.get({
        application: 'wiki',
        folder: 'default',
        order_by: 'updatedAt:desc',
        page_size: PAGE_SIZE,
        resource_type: 'wiki',
        start_idx: start_idx,
      });

      // Merge Page Data into existent
      setData(previousData => {
        // console.debug(previousData, data);
        const newItems: (Folder | Resource | null)[] = [...response.folders, ...new Array(response.pagination.total).fill(null)];
        const keepOldResources = !reloadAll && previousData.nbResources === response.pagination.total;
        // Fill resources with old or new data
        // console.debug('BEFORE', response.pagination.pageStart, newItems);
        // console.debug(
        //   'RESPONSE',
        //   response.pagination.pageStart,
        //   response.resources.map(e => e.name),
        // );
        for (let iResource = 0; iResource < response.pagination.total; ++iResource) {
          if (
            iResource >= response.pagination.pageStart &&
            iResource < response.pagination.pageStart + response.pagination.pageSize
          ) {
            // console.debug(
            //   `INSERT (${response.folders.length} + ${response.pagination.pageStart} +) ${iResource - response.pagination.pageStart} at ${response.folders.length + iResource} (${response.resources[iResource - response.pagination.pageStart].name})`,
            // );
            newItems[response.folders.length + iResource] = response.resources[iResource - response.pagination.pageStart];
          } else if (keepOldResources) {
            // console.debug('copy OLD resource from', previousData.nbFolders + iResource, 'to', response.folders.length + iResource);
            newItems[response.folders.length + iResource] = previousData.items[previousData.nbFolders + iResource];
          }
        }
        // console.debug('AFTER', newItems);
        return {
          items: newItems,
          nbFolders: response.folders.length,
          nbResources: response.pagination.total,
        };
      });
    } catch (e) {
      if (e instanceof HTTPError) console.error(await e.read(e.text));
      else console.error(e?.toString());
      throw e;
    }
  }, []);

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      const firstVisibleItem = viewableItems.at(0)?.index;
      const lastVisibleItem = viewableItems.at(-1)?.index;
      // console.info(`VISIBLE ITEMS FROM ${firstVisibleItem} to ${lastVisibleItem}`);
      if (
        firstVisibleItem === undefined ||
        firstVisibleItem === null ||
        lastVisibleItem === undefined ||
        lastVisibleItem === null
      ) {
        return;
      }
      const firstVisibleResource = firstVisibleItem - dataRef.current.nbFolders - WINDOW_SLOP;
      const lastVisibleResource = lastVisibleItem - dataRef.current.nbFolders + WINDOW_SLOP;
      // console.info(`VISIBLE RESOURCES FROM ${firstVisibleResource} to ${lastVisibleResource}`);

      const firstVisiblePage = Math.max(0, firstVisibleResource - (firstVisibleResource % PAGE_SIZE)) / PAGE_SIZE;
      const lastVisiblePage = Math.max(0, lastVisibleResource - (lastVisibleResource % PAGE_SIZE)) / PAGE_SIZE;
      // console.info(`VISIBLE PAGES FROM ${firstVisiblePage} to ${lastVisiblePage}`);

      const pagesToCheck = Array.from(
        { length: lastVisiblePage - firstVisiblePage + 1 },
        (x, i) => (i + firstVisiblePage) * PAGE_SIZE,
      );
      // console.info(`PAGES TO CHECK : ${pagesToCheck.join(' – ')}`);

      for (const page of pagesToCheck) {
        let mustFetch: boolean = false;
        for (let i = page; i < page + PAGE_SIZE; ++i) {
          if (dataRef.current.items[i + dataRef.current.nbFolders] === null) {
            mustFetch = true;
            break;
          }
        }

        if (mustFetch && !fetchingPages.current.has(page)) {
          fetchingPages.current.add(page);
          loadPage(page).then(() => {
            fetchingPages.current.delete(page);
          });
        }
      }
    },
    [loadPage],
  );

  const loadContent: ContentLoaderProps['loadContent'] = () => loadPage(0, true);

  const extraData = React.useMemo(
    () => ({
      nbFolders: data.nbFolders,
      nbResources: data.nbResources,
    }),
    [data.nbResources, data.nbFolders],
  );

  const renderContent: ContentLoaderProps['renderContent'] = React.useCallback(
    refreshControl => {
      return (
        <ResourceGrid
          key="data"
          moduleConfig={moduleConfig}
          data={data.items}
          extraData={extraData}
          estimatedListSize={estimatedListSize}
          refreshControl={refreshControl}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
        />
      );
    },
    [data.items, extraData, moduleConfig, onViewableItemsChanged],
  );

  const renderLoading: ContentLoaderProps['renderLoading'] = React.useCallback(
    () => (
      <ResourceGrid
        key="placeholder"
        moduleConfig={moduleConfig}
        data={placeholderData}
        estimatedListSize={estimatedListSize}
        scrollEnabled={false}
      />
    ),
    [moduleConfig],
  );

  return (
    <PageView>
      <ContentLoader loadContent={loadContent} renderContent={renderContent} renderLoading={renderLoading} />
    </PageView>
  );
}

export default ResourceExplorerTemplate;
