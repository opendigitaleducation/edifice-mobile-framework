import { ToastConfigParams } from 'react-native-toast-message';

import { PictureProps } from '~/framework/components/picture';

export enum ToastType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface ToastOptions {
  label?: string;
  onLabelPress?: () => void;
  duration?: number;
  icon?: PictureProps;
  testID?: string;
}

export interface ToastProps {
  offset?: number;
}

export type ToastParams = ToastConfigParams<{
  toastId: number;
  picture?: PictureProps;
  duration: number;
  onLabelPress?: () => void;
  testID?: string;
}>;
