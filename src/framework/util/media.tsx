import * as React from 'react';
import { ImageProps, ImageURISource, Image as RNImage, StyleSheet, View } from 'react-native';
import { FastImageProps, default as RNFastImage } from 'react-native-fast-image';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture/NamedSVG';
import { urlSigner } from '~/infra/oauth';

import { AuthQueryParamToken } from '../modules/auth/model';

interface IMediaCommonAttributes {
  src: string | ImageURISource;
  link?: string;
  alt?: string;
  mime?: string;
}

export interface IImageAttributes extends IMediaCommonAttributes {}
export interface IVideoAttributes extends IMediaCommonAttributes {
  poster?: string | ImageURISource;
  ratio?: number;
}
export interface IAudioAttributes extends IMediaCommonAttributes {}
export interface IAttachmentAttributes extends IMediaCommonAttributes {}

export interface IImageMedia extends IImageAttributes {
  type: 'image';
}

export interface IVideoMedia extends IVideoAttributes {
  type: 'video';
}

export interface IAudioMedia extends IAudioAttributes {
  type: 'audio';
}

export interface IAttachmentMedia extends IAttachmentAttributes {
  type: 'attachment';
}

export type IMedia = IImageMedia | IVideoMedia | IAudioMedia | IAttachmentMedia;

export function formatSource(src: string | ImageURISource, opts: { absolute?: boolean; queryParamToken?: AuthQueryParamToken }) {
  let uri = typeof src === 'string' ? src : src.uri;
  if (uri && opts?.absolute) {
    uri = urlSigner.getAbsoluteUrl(uri);
  }
  if (uri && opts?.queryParamToken) {
    const uriObj = new URL(uri);
    uriObj.searchParams.set('queryparam_token', opts.queryParamToken.value);
    uri = uriObj.toString();
  }
  return typeof src === 'string' ? { uri } : { ...src, uri };
}

export function formatMediaSource(media: IMedia, opts: { absolute?: boolean; queryParamToken?: AuthQueryParamToken }) {
  return { ...media, src: formatSource(media.src, opts) };
}

export function formatMediaSourceArray(medias: IMedia[], opts: { absolute?: boolean; queryParamToken?: AuthQueryParamToken }) {
  return medias.map(m => formatMediaSource(m, opts));
}

const style = StyleSheet.create({
  image: {
    flex: 1,
    justifyContent: 'space-around',
    margin: UI_SIZES.spacing.minor,
  },
  svg: { alignSelf: 'center', flex: 0 },
});

export const UnavailableImage = () => (
  <View style={style.image}>
    <NamedSVG style={style.svg} name="image-not-found" fill={theme.palette.grey.stone} />
  </View>
);

export class Image extends React.PureComponent<ImageProps> {
  render() {
    try {
      const { source, ...rest } = this.props;
      const hasSource = typeof source === 'object' ? (source as ImageURISource).uri !== undefined : true;
      return <RNImage source={hasSource ? urlSigner.signURISource(source) : undefined} {...rest} />;
    } catch {
      return <UnavailableImage {...this.props} />;
    }
  }
}

export class FastImage extends React.PureComponent<FastImageProps> {
  render() {
    try {
      const { source, ...rest } = this.props;
      const hasSource = typeof source === 'object' ? (source as ImageURISource).uri !== undefined : true;
      const newSource = hasSource ? urlSigner.signURISource(source) : undefined;
      // if (newSource) newSource.cache = RNFastImage.cacheControl.web;
      return <RNFastImage source={newSource} {...rest} />;
    } catch {
      return <UnavailableImage {...this.props} />;
    }
  }
}
