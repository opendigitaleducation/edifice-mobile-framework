import * as React from 'react';
import { ImageProps, ImageURISource, Image as RNImage, StyleSheet, View } from 'react-native';
import { FastImageProps, default as RNFastImage } from 'react-native-fast-image';
import { VideoPlayerProps } from 'react-native-media-console';
import { PdfProps } from 'react-native-pdf';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture/NamedSVG';
import { urlSigner } from '~/infra/oauth';

import { AuthQueryParamToken } from '../modules/auth/model';

interface IMediaCommonAttributes {
  src: unknown;
  link?: string;
  alt?: string;
  mime?: string;
}

export interface IImageMedia extends IMediaCommonAttributes {
  type: 'image';
  src: ImageProps['source'];
}

export interface IVideoMedia extends IMediaCommonAttributes {
  type: 'video';
  src: VideoPlayerProps['source'];
  poster?: string | ImageURISource;
  ratio?: number;
}

export interface IAudioMedia extends IMediaCommonAttributes {
  type: 'audio';
  src: VideoPlayerProps['source'];
}

export interface IPdfMedia extends IMediaCommonAttributes {
  type: 'pdf';
  src: PdfProps['source'];
}

export interface IAttachmentMedia extends IMediaCommonAttributes {
  type: 'attachment';
  src: ImageProps['source'];
}

export type IMedia = IImageMedia | IVideoMedia | IAudioMedia | IPdfMedia | IAttachmentMedia;

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

export function formatMediaSource<MediaType extends IMedia>(
  media: MediaType,
  opts: { absolute?: boolean; queryParamToken?: AuthQueryParamToken },
) {
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
