import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { ListRenderItem } from '@shopify/flash-list';
import { Fade, Placeholder, PlaceholderLine, PlaceholderMedia } from 'rn-placeholder';

import styles from './styles';
import { ResourceGrid } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/override/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { CaptionText, SmallBoldText, TextSizeStyle } from '~/framework/components/text';
import { explorerItemIsFolder, explorerItemIsLoading } from '~/framework/modules/explorer/model';
import { Image } from '~/framework/util/media';

export const estimatedItemSize = 200; // Measured estimated height of an item from the react-native inspector. @see https://shopify.github.io/flash-list/docs/estimated-item-size

const resourceExplorerResourceItemStyle = [styles.item, styles.resourceItem];
export const ResourceExplorerResourceItem: React.FC<ResourceGrid.ResourceExplorerResourceItemProps> = ({
  item,
  onPressResource,
}) => {
  return (
    <TouchableOpacity
      style={resourceExplorerResourceItemStyle}
      onPress={React.useCallback(() => onPressResource?.(item), [item, onPressResource])}>
      <Image style={styles.itemThumbnail} source={{ uri: item.thumbnail }} />
      <View style={styles.labelContainer}>
        <SmallBoldText style={styles.labelCaption} numberOfLines={1}>
          {item.name}
        </SmallBoldText>
        <CaptionText style={styles.labelCaption} numberOfLines={1}>
          {I18n.date(item.updatedAt)}
        </CaptionText>
      </View>
    </TouchableOpacity>
  );
};

const resourceExplorerFolderItemStyle = [styles.item, styles.folderItem];
export const ResourceExplorerFolderItem: React.FC<ResourceGrid.ResourceExplorerFolderItemProps> = ({
  item,
  moduleConfig,
  onPressFolder,
}) => {
  return (
    <TouchableOpacity
      style={resourceExplorerFolderItemStyle}
      onPress={React.useCallback(() => onPressFolder?.(item), [item, onPressFolder])}>
      <View style={styles.folderThumbnail}>
        <Svg
          name="ui-folder"
          fill={moduleConfig?.displayColor?.regular ?? theme.palette.primary.regular}
          width={UI_SIZES.elements.icon.xxlarge}
          height={UI_SIZES.elements.icon.xxlarge}
        />
      </View>
      <View style={styles.labelContainer}>
        <SmallBoldText numberOfLines={2} style={styles.folderLabel}>
          {item.name}
        </SmallBoldText>
      </View>
    </TouchableOpacity>
  );
};

export const ResourceExplorerLoadingItem: ListRenderItem<null> = () => {
  return (
    <View style={resourceExplorerResourceItemStyle}>
      <Placeholder Animation={Fade}>
        <PlaceholderMedia style={styles.itemThumbnailPlaceholder} />
        <View style={styles.labelContainerPlaceholder}>
          <PlaceholderLine height={TextSizeStyle.Medium.fontSize} noMargin />
          <PlaceholderLine height={TextSizeStyle.Small.fontSize} width={80} noMargin />
        </View>
      </Placeholder>
    </View>
  );
};

export const ResourceExplorerItem = ({
  index,
  item,
  onPressFolder,
  onPressResource,
  ...info
}: ResourceGrid.ResourceExplorerItemProps) => {
  return explorerItemIsLoading(item) ? (
    <ResourceExplorerLoadingItem item={item} index={index} {...info} />
  ) : explorerItemIsFolder(item) ? (
    <ResourceExplorerFolderItem item={item} index={index} onPressFolder={onPressFolder} {...info} />
  ) : (
    <ResourceExplorerResourceItem item={item} index={index} onPressResource={onPressResource} {...info} />
  );
};
