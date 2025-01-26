/**
 * Components for resource explorer
 *
 * default: Resource Explorer
 *   props :
 *      - Same as FlatList
 *      - resources
 *      - [folders]
 *      - [data]
 * Display a two-colums list of given resources and folders. All data passed with resources, folders and data props are merged.
 * Elements are displayed in the following order : folders - resources - aditional data. For now, there is no option to sort them in a mixed up order.
 * You have to sort elements by yourself before passing them with the `data` prop.
 *
 * ResourceExplorerItem: Component that displays a single resource/folder.
 *   props:
 *      - title + subtitle (+ textStyle) : Text displayed under the thumbnail.
 *      - color (+ showBgColor)          : Color of the item, traditionally matches to the entcore application. bgColor can be shown if no image is present, or with a transparent image.
 *      - image                          : Image thumbnail.
 *      - base                           : Another component displayed below the image/background. Typically the icon of the entcore application.
 *      - style                          : ViewStyle applied. Replaces entirely the default one. Use this if your style must be on a parent component to erase the default behavior.
 */
import * as React from 'react';
import { View } from 'react-native';

import styled from '@emotion/native';

import { UI_SIZES } from '~/framework/components/constants';
import styles from '~/framework/components/explorer/resource-explorer/styles';
import {
  ResourceExplorerEmptyItem,
  ResourceExplorerFolderItem,
  ResourceExplorerItemBase,
  ResourceExplorerItemProps,
  ResourceExplorerItemWithIcon,
  ResourceExplorerItemWithImage,
  ResourceExplorerProps,
} from '~/framework/components/explorer/resource-explorer/types';
import GridList from '~/framework/components/GridList';
import { Icon, Picture, PictureProps } from '~/framework/components/picture';
import { displayPastDate } from '~/framework/util/date';
import { Image } from '~/framework/util/media';

export const resourceItemTouchableStyle = { ...styles.commonItemTouchableStyle, ...styles.itemTouchableStyle };
export const empyItemTouchableStyle = { ...styles.commonItemTouchableStyle, ...styles.empyItemTouchableStyle };
const ResourceItemTouchable = styled.TouchableOpacity(resourceItemTouchableStyle);
const FolderItemTouchable = styled.TouchableOpacity(styles.commonItemTouchableStyle);
const EmptyItemTouchable = styled.TouchableOpacity(empyItemTouchableStyle);

const ThumbnailView = styled.View(styles.thumbnail);
const MetadataView = styled.View(styles.metadata);

const ResourceExplorerSmallText = styled.Text(styles.smallText);
const ResourceExplorerCaptionText = styled.Text(styles.captionText);
const ResourceExplorerCaptionBoldText = styled.Text(styles.captionBoldText);
const spaceString = ' ';

export const ResourceItem = (props: ResourceExplorerItemProps) => {
  const CustomView = styled(ThumbnailView)({ ...styles.custom, backgroundColor: props.color });

  const [error, setError] = React.useState<boolean>(false);

  const renderThumbnail = () => {
    if (props.image && !error) {
      return <Image source={props.image} style={styles.image} onError={() => setError(true)} />;
    }
    if (props.base) return props.base;
    return null;
  };

  return (
    <View style={props.style ?? resourceItemTouchableStyle}>
      <ThumbnailView>
        {props.showBgColor ? <CustomView /> : null}
        {renderThumbnail()}
      </ThumbnailView>
      <MetadataView>
        <View>
          {/* a resource item always has available space for 2 text lines,
          so we generate it and place the title/subtitle on top (as an absolute position) */}
          <ResourceExplorerSmallText>{spaceString}</ResourceExplorerSmallText>
          <ResourceExplorerSmallText>{spaceString}</ResourceExplorerSmallText>
          <View style={styles.textContainer}>
            <ResourceExplorerCaptionBoldText
              numberOfLines={props.textProps?.numberOfLines}
              style={props.textStyle}
              {...props.textProps}>
              {props.title ?? null}
            </ResourceExplorerCaptionBoldText>
          </View>
          {props.subtitle ? (
            <View style={styles.textContainer}>
              <ResourceExplorerSmallText>{spaceString}</ResourceExplorerSmallText>
              <ResourceExplorerCaptionText numberOfLines={props.textProps?.numberOfLines} style={props.textStyle}>
                {props.subtitle}
              </ResourceExplorerCaptionText>
            </View>
          ) : null}
        </View>
      </MetadataView>
    </View>
  );
};

const renderItem = <FolderType extends object, ResourceType extends object>(
  item:
    | (ResourceExplorerFolderItem & FolderType)
    | (ResourceExplorerItemWithImage & ResourceType)
    | (ResourceExplorerItemWithIcon & ResourceType)
    | ResourceExplorerEmptyItem,
  onItemPress: ResourceExplorerProps<FolderType, ResourceType>['onItemPress'],
) => {
  if (item.type === 'empty')
    return (
      <EmptyItemTouchable>
        <View />
      </EmptyItemTouchable>
    );
  const TheRightTouchable = item.type === 'folder' ? FolderItemTouchable : ResourceItemTouchable;
  // "isResourceWithDate" is used to adjust the text layout:
  // -a resource with a date has a date subtitle (so the title/subtitle are not centered and use 1 line max)
  // -a folder or a resource without a date have no subtitle (so the title is centered and uses 2 lines max)
  const isResourceWithDate = item.type === 'resource' && item.date;
  return (
    <TheRightTouchable
      onPress={() => {
        if (onItemPress) onItemPress(item);
      }}>
      <ResourceItem
        title={(item as ResourceExplorerFolderItem).name || (item as ResourceExplorerItemBase).title}
        subtitle={isResourceWithDate ? displayPastDate(item.date!) : undefined}
        color={item.type === 'folder' ? 'transparent' : item.color}
        showBgColor={item.type !== 'folder'}
        base={
          (item as ResourceExplorerItemWithIcon).icon || item.type === 'folder' ? (
            typeof (item as ResourceExplorerItemWithIcon).icon === 'string' || item.type === 'folder' ? (
              <Icon
                color={item.color}
                size={item.type === 'folder' ? 88 : 48}
                name={item.type === 'folder' ? 'folder1' : ((item as ResourceExplorerItemWithIcon).icon as string)}
              />
            ) : (
              <Picture {...((item as ResourceExplorerItemWithIcon).icon as PictureProps)} width={48} height={48} />
            )
          ) : null
        }
        image={(item as ResourceExplorerItemWithImage).thumbnail}
        textStyle={isResourceWithDate ? {} : styles.itemText}
        textProps={{ numberOfLines: isResourceWithDate ? 1 : 2 }}
        style={item.type !== 'folder' ? styles.item : {}} // reset default card styles because that's the touchable that hold them
      />
    </TheRightTouchable>
  );
};

export default <FolderType extends object, ResourceType extends object>(props: ResourceExplorerProps<FolderType, ResourceType>) => {
  const { contentContainerStyle, data, folders, keyExtractor, resources, ...otherProps } = props;
  const resourceExplorerData: (
    | (ResourceExplorerFolderItem & FolderType)
    | (ResourceExplorerItemWithImage & ResourceType)
    | (ResourceExplorerItemWithIcon & ResourceType)
    | ResourceExplorerEmptyItem
  )[] = [
    ...(folders ?? []).map(f => ({ ...f, type: 'folder' }) as ResourceExplorerFolderItem & FolderType),
    ...(resources ?? []).map(
      f =>
        ({ ...f, type: 'resource' }) as
          | (ResourceExplorerItemWithImage & ResourceType)
          | (ResourceExplorerItemWithIcon & ResourceType),
    ),
    ...(data ?? []),
  ];
  if (resourceExplorerData.length % 2 !== 0) {
    resourceExplorerData.push({ type: 'empty' });
  }
  return (
    <GridList
      data={resourceExplorerData}
      renderItem={({ item }) => renderItem(item, props.onItemPress)}
      gapOutside={UI_SIZES.spacing.medium}
      contentContainerStyle={[resourceExplorerData.length === 0 ? {} : contentContainerStyle]}
      {...(keyExtractor
        ? {
            keyExtractor: (item, index) => (item.type === 'empty' ? item.type : keyExtractor(item, index)),
          }
        : {})}
      {...otherProps}
    />
  );
};
