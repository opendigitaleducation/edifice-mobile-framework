import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import FastImage from 'react-native-fast-image';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon } from '~/framework/components/picture';
import { getSession } from '~/framework/modules/auth/reducer';
import { Filter, IFile } from '~/framework/modules/workspace/reducer';
import { formatSource, Image } from '~/framework/util/media';
import ImageOptional from '~/ui/ImageOptional';

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    width: UI_SIZES.screen.width,
  },
  imageContainer: {
    flexGrow: 1,
    width: UI_SIZES.screen.width,
  },
});

const UnavailableImage = () => (
  <View style={styles.iconContainer}>
    <Icon color={theme.palette.grey.cloudy} size={200} name="picture" />
  </View>
);

const UnavailableIcon = () => <Icon color={theme.palette.grey.cloudy} size={46} name="picture" />;

const getIcon = (id: string | null, isFolder: boolean, pName: string | null, contentType: string | undefined): string | null => {
  if (isFolder) {
    switch (id) {
      case Filter.OWNER:
        return 'folder11';
      case Filter.SHARED:
        return 'shared_files';
      case Filter.PROTECTED:
        return 'added_files';
      case Filter.TRASH:
        return 'deleted_files';
      default:
        return 'folder11';
    }
  }

  if (contentType) {
    if (contentType.startsWith('audio')) {
      return 'file-audio';
    }
    if (contentType.startsWith('video')) {
      return 'file-video-outline';
    }
    if (contentType.startsWith('image')) {
      return null;
    }
    if (contentType.startsWith('application/pdf')) {
      return 'pdf_files';
    }
  }

  if (!pName) {
    return 'file-document-outline';
  }

  const name = pName.toLowerCase();

  if (name.endsWith('.pdf')) {
    return 'pdf_files';
  }
  if (
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    name.endsWith('.dot') ||
    name.endsWith('.dotm') ||
    name.endsWith('.dotx') ||
    name.endsWith('.docm')
  ) {
    return 'file-word';
  }
  if (name.endsWith('.ppt') || name.endsWith('.pptx') || name.endsWith('.pps')) {
    return 'file-powerpoint';
  }
  if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.xlsm') || name.endsWith('.xltm')) {
    return 'file-excel';
  }
  if (name.endsWith('.svg')) {
    return 'file-document-outline';
  }
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.bmp') || name.endsWith('.tiff')) {
    return null;
  }
  if (name.endsWith('.avi') || name.endsWith('.mp4') || name.endsWith('.ogg')) {
    return 'file-video-outline';
  }
  if (name.endsWith('.zip') || name.endsWith('.7z') || name.endsWith('.gz') || name.endsWith('.tgz')) {
    return 'file-archive';
  }
  return 'file-document-outline';
};

export const renderIcon = (id: string | null, isFolder: boolean, name: string, contentType: string | undefined): any => {
  const icon = getIcon(id, isFolder, name, contentType);
  const session = getSession();

  if (icon) {
    return <Icon color={theme.palette.grey.grey} size={50} name={icon} />;
  } else {
    const uri = `${session?.platform.url}/workspace/document/${id}?thumbnail=120x120`;
    const style = { height: 50, width: 50 };
    return <ImageOptional style={style} imageComponent={Image} errorComponent={<UnavailableIcon />} source={formatSource(uri)} />;
  }
};

export const renderImage = (item: IFile, isFolder: boolean, name: string): any => {
  const icon = getIcon(item.id, isFolder, name, item.contentType);
  const session = getSession();
  const uri = `${session?.platform.url}/workspace/document/${item.id}`;

  if (icon) {
    return (
      <View style={styles.iconContainer}>
        <Icon color={theme.palette.grey.grey} size={200} name={icon} />
      </View>
    );
  }
  return (
    <ImageOptional
      style={styles.imageContainer}
      imageComponent={Image}
      errorComponent={<UnavailableImage />}
      resizeMode={FastImage.resizeMode.contain}
      source={formatSource(uri)}
    />
  );
};
