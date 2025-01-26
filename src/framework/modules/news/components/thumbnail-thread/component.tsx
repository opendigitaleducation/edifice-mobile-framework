import * as React from 'react';
import { View } from 'react-native';

import { Grayscale } from 'react-native-color-matrix-image-filters';

import styles from './styles';
import { ThumbnailThreadProps } from './types';

import theme from '~/app/theme';
import { getScaleHeight } from '~/framework/components/constants';
import { Svg, SvgProps } from '~/framework/components/picture';
import { ThreadItemStatus } from '~/framework/modules/news/components/thread-item';
import moduleConfig, { fillColor } from '~/framework/modules/news/module-config';
import { Image } from '~/framework/util/media';

const Selected = () => (
  <View style={[styles.thumbnailSelectedItem, { borderColor: (moduleConfig.displayPicture as SvgProps).fill }]} />
);

export default function ThumbnailThread({ status = ThreadItemStatus.DEFAULT, ...props }: ThumbnailThreadProps) {
  const { icon, square } = props;

  const [error, setError] = React.useState(false);

  const globalStyle = [
    styles.thumbnailItem,
    { backgroundColor: theme.palette.complementary[fillColor].pale },
    { ...(square ? styles.thumbnailItemSquare : styles.thumbnailItemRectangle) },
  ];
  const heightSVGNoIcon = square ? getScaleHeight(12.5) : getScaleHeight(40);

  if (icon && !error && status === ThreadItemStatus.SELECTED) {
    return (
      <View style={styles.thumbnailContainerSelected}>
        <Selected />
        <Image source={icon} style={globalStyle} onError={() => setError(true)} />
      </View>
    );
  }
  if (icon && !error && status === ThreadItemStatus.DISABLED) {
    return (
      <Grayscale>
        <Image source={icon} style={globalStyle} onError={() => setError(true)} />
      </Grayscale>
    );
  }
  if (icon && !error && status === ThreadItemStatus.DEFAULT) {
    return <Image source={icon} style={globalStyle} onError={() => setError(true)} />;
  }
  if (status === ThreadItemStatus.SELECTED) {
    return (
      <View style={[globalStyle, styles.thumbnailContainerSelected]}>
        <Selected />
        <Svg name="newsFeed" fill={(moduleConfig.displayPicture as SvgProps).fill} height={heightSVGNoIcon} />
      </View>
    );
  }
  if (status === ThreadItemStatus.DISABLED) {
    return (
      <View style={[globalStyle, styles.thumbnailNoIconDisabled]}>
        <Svg name="newsFeed" fill={theme.palette.grey.graphite} height={heightSVGNoIcon} />
      </View>
    );
  }
  return (
    <View style={globalStyle}>
      <Svg name="newsFeed" fill={(moduleConfig.displayPicture as SvgProps).fill} height={heightSVGNoIcon} />
    </View>
  );
}
