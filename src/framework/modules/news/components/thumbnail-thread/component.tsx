import * as React from 'react';
import { View } from 'react-native';
import { Grayscale } from 'react-native-color-matrix-image-filters';

import theme from '~/app/theme';
import { getScaleHeight } from '~/framework/components/constants';
import { NamedSVG, NamedSVGProps } from '~/framework/components/picture';
import { ThreadItemStatus } from '~/framework/modules/news/components/thread-item';
import moduleConfig, { fillColor } from '~/framework/modules/news/module-config';
import { Image } from '~/framework/util/media';

import styles from './styles';
import { ThumbnailThreadProps } from './types';

const Selected = () => (
  <View style={[styles.thumbnailSelectedItem, { borderColor: (moduleConfig.displayPicture as NamedSVGProps).fill }]} />
);

export default function ThumbnailThread({ status = ThreadItemStatus.DEFAULT, ...props }: ThumbnailThreadProps) {
  const { icon, square } = props;

  const globalStyle = [
    styles.thumbnailItem,
    { backgroundColor: theme.palette.complementary[fillColor].pale },
    { ...(square ? styles.thumbnailItemSquare : styles.thumbnailItemRectangle) },
  ];
  const heightSVGNoIcon = square ? getScaleHeight(12.5) : getScaleHeight(40);

  if (icon && status === ThreadItemStatus.SELECTED) {
    return (
      <View style={styles.thumbnailContainerSelected}>
        <Selected />
        <Image source={icon} style={globalStyle} />
      </View>
    );
  }
  if (icon && status === ThreadItemStatus.DISABLED) {
    return (
      <Grayscale>
        <Image source={icon} style={globalStyle} />
      </Grayscale>
    );
  }
  if (icon && status === ThreadItemStatus.DEFAULT) {
    return <Image source={icon} style={globalStyle} />;
  }
  if (!icon && status === ThreadItemStatus.SELECTED) {
    return (
      <View style={[globalStyle, styles.thumbnailContainerSelected]}>
        <Selected />
        <NamedSVG name="newsFeed" fill={(moduleConfig.displayPicture as NamedSVGProps).fill} height={heightSVGNoIcon} />
      </View>
    );
  }
  if (!icon && status === ThreadItemStatus.DISABLED) {
    return (
      <View style={[globalStyle, styles.thumbnailNoIconDisabled]}>
        <NamedSVG name="newsFeed" fill={theme.palette.grey.graphite} height={heightSVGNoIcon} />
      </View>
    );
  }
  return (
    <View style={globalStyle}>
      <NamedSVG name="newsFeed" fill={(moduleConfig.displayPicture as NamedSVGProps).fill} height={heightSVGNoIcon} />
    </View>
  );
}
