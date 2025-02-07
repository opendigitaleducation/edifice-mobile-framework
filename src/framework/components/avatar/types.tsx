import { ImageProps, ImageURISource } from 'react-native';

import { SvgProps } from '~/framework/components/picture';

export enum Size {
  sm = 'sm',
  md = 'md',
  lg = 'lg',
  xl = 'xl',
  xxl = 'xxl',
}

export interface CommonSingleAvatarProps extends Omit<ImageProps, 'source'> {
  size: Size | keyof typeof Size; // Override width & height given in style property.
}

// User avatar

export interface SingleUserAvatarSpecificProps {
  userId: string;
}

export interface SingleUserAvatarProps extends CommonSingleAvatarProps, SingleUserAvatarSpecificProps {}

// Custom source avatar

export interface SingleSourceAvatarSpecificProps {
  source: ImageURISource;
}

export interface SingleSourceAvatarProps extends CommonSingleAvatarProps, SingleSourceAvatarSpecificProps {}

// Svg avatar

export interface SingleSvgAvatarSpecificProps {
  svg: SvgProps;
}

export interface SingleSvgAvatarProps extends CommonSingleAvatarProps, SingleSvgAvatarSpecificProps {}

// Group avatar

export interface SingleGroupAvatarSpecificProps {
  group: true;
}

export interface SingleGroupAvatarProps extends CommonSingleAvatarProps, SingleGroupAvatarSpecificProps {}

// Default avatar (no specific props provided or undefined)

export interface SingleDefaultAvatarProps extends CommonSingleAvatarProps {}

// Private types

export interface SingleAvatarUnknownSpecificProps
  extends SingleUserAvatarSpecificProps,
    SingleSourceAvatarSpecificProps,
    SingleSvgAvatarSpecificProps,
    SingleGroupAvatarSpecificProps {}

export type SingleAvatarOnlySpecificProps =
  | SingleUserAvatarSpecificProps
  | SingleSourceAvatarSpecificProps
  | SingleSvgAvatarSpecificProps
  | SingleGroupAvatarSpecificProps;

// Public props types

export type SingleAvatarProps =
  | SingleUserAvatarProps
  | SingleSourceAvatarProps
  | SingleSvgAvatarProps
  | SingleDefaultAvatarProps
  | SingleGroupAvatarProps;
