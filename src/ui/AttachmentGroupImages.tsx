import * as React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import { openCarousel } from '~/framework/components/carousel/openCarousel';
import { UI_SIZES } from '~/framework/components/constants';
import { ImagePicked, cameraAction, galleryAction } from '~/framework/components/menus/actions';
import BottomMenu from '~/framework/components/menus/bottom';
import { Picture } from '~/framework/components/picture';
import { BodyBoldText, TextSizeStyle } from '~/framework/components/text';
import { Image, formatSource } from '~/framework/util/media';
import { isEmpty } from '~/framework/util/object';
import { Trackers } from '~/framework/util/tracker';

import { ILocalAttachment } from './Attachment';

const itemWidth =
  // The items' width is computed by substracting spacings from the screen's width
  (UI_SIZES.screen.width -
    // horizontal padding of page
    2 * UI_SIZES.spacing.medium -
    // horizontal padding of items' container
    2 * UI_SIZES.spacing.big -
    // space between items
    2 * UI_SIZES.spacing.big -
    // vertical border width of "attach photos" button
    2 * UI_SIZES.border.thin) /
  3;
const styles = StyleSheet.create({
  attachPhotos: { color: theme.palette.primary.regular, marginTop: UI_SIZES.spacing.small, textAlign: 'center' },
  attachPhotosAdded: { ...TextSizeStyle.Small, marginTop: UI_SIZES.spacing.tiny },
  attachPhotosContainer: { alignItems: 'center', justifyContent: 'center' },
  attachPhotosContainerAdded: {
    borderColor: theme.palette.primary.regular,
    borderWidth: UI_SIZES.border.thin,
    borderRadius: UI_SIZES.radius.medium,
    aspectRatio: UI_SIZES.aspectRatios.square,
    width: itemWidth,
  },
  iconButton: {
    borderRadius: UI_SIZES.radius.huge,
    backgroundColor: theme.palette.primary.regular,
    width: UI_SIZES.dimensions.height.large,
    height: UI_SIZES.dimensions.height.large,
    right: -UI_SIZES.spacing._LEGACY_small,
    top: -UI_SIZES.spacing.minor,
    position: 'absolute',
  },
  container: {
    borderColor: theme.ui.border.input,
    borderWidth: UI_SIZES.border.thin,
    borderRadius: UI_SIZES.radius.selector,
  },
  containerAdded: { borderColor: theme.palette.grey.stone },
  contentContainer: {
    paddingVertical: UI_SIZES.spacing.medium,
    paddingHorizontal: UI_SIZES.spacing.big,
  },
  contentContainerAdded: {
    alignItems: 'center',
  },
  itemSeperator: { paddingVertical: UI_SIZES.spacing.small },
  photo: {
    aspectRatio: UI_SIZES.aspectRatios.square,
    borderRadius: UI_SIZES.radius.medium,
    width: itemWidth,
  },
  photoContainer: { marginRight: UI_SIZES.spacing.big, borderRadius: UI_SIZES.radius.medium },
});

export class AttachmentGroupImages extends React.PureComponent<{
  imageCallback: (image: ImagePicked) => void;
  onRemove: (index: number) => void;
  images: ILocalAttachment[];
  moduleName: string;
}> {
  public imagesAdded() {
    const { images } = this.props;
    return images.length > 0;
  }

  public onOpenImage = () => {
    const { images, moduleName } = this.props;
    const carouselImages = images.map(image => ({ src: { uri: image.uri }, type: 'image' as const, alt: 'image' }));
    Trackers.trackEvent(moduleName, 'OPEN ATTACHMENT', 'Edit mode');
    openCarousel({ data: carouselImages });
  };

  public renderItemSeparator() {
    return <View style={styles.itemSeperator} />;
  }

  public AddPhotosButton() {
    const { imageCallback } = this.props;
    return (
      <BottomMenu actions={[cameraAction({ callback: imageCallback }), galleryAction({ callback: imageCallback, multiple: true })]}>
        <View style={[styles.attachPhotosContainer, this.imagesAdded() && styles.attachPhotosContainerAdded]}>
          <Picture
            type="NamedSvg"
            name={this.imagesAdded() ? 'ui-plus' : 'ui-camera'}
            width={UI_SIZES.dimensions.width[this.imagesAdded() ? 'medium' : 'hug']}
            height={UI_SIZES.dimensions.height[this.imagesAdded() ? 'medium' : 'hug']}
            fill={theme.palette.primary.regular}
          />
          <BodyBoldText style={[styles.attachPhotos, this.imagesAdded() && styles.attachPhotosAdded]}>
            {I18n.get('photospicker-addphotos')}
          </BodyBoldText>
        </View>
      </BottomMenu>
    );
  }

  public renderItem = ({ item, index }) => {
    const { onRemove } = this.props;
    if (isEmpty(item)) return this.AddPhotosButton();
    return (
      <View style={styles.photoContainer}>
        <TouchableOpacity onPress={this.onOpenImage}>
          <Image
            style={styles.photo}
            resizeMode="cover"
            source={formatSource((item as ILocalAttachment).uri)}
            onError={() => onRemove(index)}
          />
        </TouchableOpacity>
        <IconButton
          icon="ui-close"
          style={styles.iconButton}
          size={UI_SIZES.dimensions.height.smallPlus}
          color={theme.palette.grey.white}
          action={() => onRemove(index)}
        />
      </View>
    );
  };

  public render() {
    const { images } = this.props;
    const numColumns = 3;
    return (
      <FlatList
        data={[...images, {}]}
        numColumns={numColumns}
        scrollEnabled={false}
        style={[styles.container, this.imagesAdded() && styles.containerAdded]}
        contentContainerStyle={[styles.contentContainer, !this.imagesAdded() && styles.contentContainerAdded]}
        ItemSeparatorComponent={this.renderItemSeparator}
        renderItem={this.renderItem}
      />
    );
  }
}
