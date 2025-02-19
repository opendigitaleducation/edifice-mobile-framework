import * as React from 'react';
import { View } from 'react-native';

import { ListRenderItem } from '@shopify/flash-list';
import { Fade, Placeholder, PlaceholderLine, PlaceholderMedia } from 'rn-placeholder';

import styles from './styles';
import { ResourceGrid } from './types';

import theme from '~/app/override/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { CaptionText, SmallBoldText, TextSizeStyle } from '~/framework/components/text';
import { explorerItemIsFolder, explorerItemIsLoading, explorerItemIsResource } from '~/framework/modules/explorer/model';
import type { Folder, Resource } from '~/framework/modules/explorer/model/types';
import { Image } from '~/framework/util/media';

export const estimatedItemSize = TextSizeStyle.Medium.lineHeight * 5 + 4;

export const ResourceExplorerResourceItem: ListRenderItem<Resource> = ({ extraData, index, item }) => {
  return (
    <>
      <Image style={styles.itemThumbnail} source={{ uri: 'https://picsum.photos/200' }} />
      <View style={styles.labelContainer}>
        <SmallBoldText style={styles.labelCaption} numberOfLines={1}>{`R | (${index}) : ${item.name}`}</SmallBoldText>
        <CaptionText style={styles.labelCaption} numberOfLines={1}>{`R | (${index}) : ${item.name}`}</CaptionText>
      </View>
    </>
  );
};

export const ResourceExplorerFolderItem: ListRenderItem<Folder> = ({ extraData, index, item }) => {
  return (
    <>
      <View style={styles.folderThumbnail}>
        <Svg
          name="ui-folder"
          fill={extraData.moduleConfig?.displayColor?.regular ?? theme.palette.primary.regular}
          width={UI_SIZES.elements.icon.xxlarge}
          height={UI_SIZES.elements.icon.xxlarge}
        />
      </View>
      <View style={styles.labelContainer}>
        <SmallBoldText numberOfLines={2} style={styles.folderLabel}>{`F | (${index}) : ${item.name}`}</SmallBoldText>
      </View>
    </>
  );
};

export const ResourceExplorerLoadingItem: ListRenderItem<null> = () => {
  return (
    <>
      <Placeholder Animation={Fade}>
        <PlaceholderMedia style={styles.itemThumbnailPlaceholder} />
        <View style={styles.labelContainerPlaceholder}>
          <PlaceholderLine height={TextSizeStyle.Medium.fontSize} noMargin />
          <PlaceholderLine height={TextSizeStyle.Small.fontSize} width={80} noMargin />
        </View>
      </Placeholder>
    </>
  );
};

export const ResourceExplorerItem: ListRenderItem<ResourceGrid.BaseItemT> = ({ index, item, ...info }) => {
  return (
    <View
      style={React.useMemo(
        () => [
          styles.item,
          explorerItemIsResource(item) ? styles.resourceItem : undefined,
          explorerItemIsFolder(item) ? styles.folderItem : undefined,
        ],
        [item],
      )}>
      {explorerItemIsLoading(item) ? (
        <ResourceExplorerLoadingItem item={item} index={index} {...info} />
      ) : explorerItemIsFolder(item) ? (
        <ResourceExplorerFolderItem item={item} index={index} {...info} />
      ) : (
        <ResourceExplorerResourceItem item={item} index={index} {...info} />
      )}
    </View>
  );
};
