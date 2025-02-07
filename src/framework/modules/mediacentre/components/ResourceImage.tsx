import React, { useState } from 'react';
import { ImageResizeMode, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';

import { Svg } from '~/framework/components/picture';
import { getSession } from '~/framework/modules/auth/reducer';
import { Source } from '~/framework/modules/mediacentre/reducer';
import { Image } from '~/framework/util/media';

interface IResourceImageProps {
  image: string;
  resizeMode?: ImageResizeMode;
  style?: StyleProp<ImageStyle>;
}

interface ISourceImageProps {
  size: number;
  source: string;
  style?: StyleProp<ImageStyle>;
}

const getImageUri = (value: string): string => {
  const session = getSession();
  if (value.startsWith('/')) {
    const url = session?.platform.url;
    return url + value;
  }
  return value;
};

export const ResourceImage: React.FunctionComponent<IResourceImageProps> = (props: IResourceImageProps) => {
  const [loadingFailed, setLoadingFailed] = useState<boolean>(false);
  const onError = () => {
    setLoadingFailed(true);
  };
  if (loadingFailed) {
    const style = StyleSheet.flatten(props.style);
    return (
      <View style={props.style}>
        <Svg name="textbook-default" width={style.width || 50} height={style.height || 70} />
      </View>
    );
  }
  return <Image source={{ uri: getImageUri(props.image) }} onError={onError} style={props.style} resizeMode={props.resizeMode} />;
};

export const SourceImage: React.FunctionComponent<ISourceImageProps> = (props: ISourceImageProps) => {
  let image;
  switch (props.source) {
    case Source.GAR:
      image = require('ASSETS/images/logo-gar.png');
      break;
    case Source.MOODLE:
      image = require('ASSETS/images/logo-moodle.png');
      break;
    case Source.PMB:
      image = require('ASSETS/images/logo-pmb.png');
      break;
    default:
      image = require('ASSETS/images/logo-gar.png');
      break;
  }
  return <Image source={image} style={[props.style, { height: props.size, width: props.size }]} resizeMode="contain" />;
};
