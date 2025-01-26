/**
 * Picture
 *
 * A unique component for displaying image from various technologies.
 */
import * as React from 'react';
import { ImageProps } from 'react-native';

import { Icon, IconProps } from '../icon';
import { Svg, SvgProps } from '../svg';

import { Image } from '~/framework/util/media';

export interface IAnyPictureSource {
  source: any;
}

interface IPictureIcon extends IconProps {
  type: 'Icon';
}
interface IPictureImage extends ImageProps {
  type: 'Image';
}
interface IPictureCustomSvg extends SvgProps {
  type: 'Svg';
}

export type PictureProps = IPictureIcon | IPictureImage | IPictureCustomSvg;

export function Picture(props: PictureProps) {
  const { type, ...rest } = props;
  switch (type) {
    case 'Icon':
      return <Icon {...(rest as IconProps)} />;
    case 'Image':
      return <Image {...(rest as ImageProps)} />;
    case 'Svg':
      return <Svg {...(rest as SvgProps)} />;
  }
}
