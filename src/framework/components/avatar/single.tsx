import * as React from 'react';
import { Image, ImageProps } from 'react-native';

import { AvatarSizes } from './styles';
import {
  CommonSingleAvatarProps,
  SingleAvatarOnlySpecificProps,
  SingleAvatarProps,
  SingleAvatarUnknownSpecificProps,
  SingleDefaultAvatarProps,
  SingleGroupAvatarProps,
  SingleGroupAvatarSpecificProps,
  SingleSourceAvatarProps,
  SingleSourceAvatarSpecificProps,
  SingleSvgAvatarProps,
  SingleSvgAvatarSpecificProps,
  SingleUserAvatarSpecificProps,
} from './types';

import theme from '~/app/theme';
import { AuthLoggedAccount, AuthSavedAccount } from '~/framework/modules/auth/model';
import appConf, { Platform } from '~/framework/util/appConf';
import { urlSigner } from '~/infra/oauth';

const useAvatarStyle = (props: Pick<SingleAvatarProps, 'size' | 'style'>) => {
  return React.useMemo(
    () => [
      props.style,
      {
        backgroundColor: theme.ui.background.card,
        borderRadius: AvatarSizes[props.size] / 2,
        height: AvatarSizes[props.size],
        width: AvatarSizes[props.size],
      },
    ],
    [props.size, props.style],
  );
};

const fallbackSource: ImageProps['source'] = require('ASSETS/images/no-avatar.png');

export const buildRelativeUserAvatarUrl = (id: string) => `/userbook/avatar/${id}`;
export const buildAbsoluteUserAvatarUrl = (id: string) => urlSigner.getAbsoluteUrl(buildRelativeUserAvatarUrl(id));
export const buildAbsoluteUserAvatarUrlWithPlatform = (id: string, platform?: Platform) =>
  platform ? urlSigner.getAbsoluteUrl(buildRelativeUserAvatarUrl(id), platform) : undefined;
export const buildAvatarSourceForAccount = (account: AuthSavedAccount | AuthLoggedAccount) => {
  const uri = buildAbsoluteUserAvatarUrlWithPlatform(account.user.id, appConf.getExpandedPlatform(account.platform));
  return uri
    ? {
        uri,
      }
    : undefined;
};

const isUserAvatar = (props: SingleAvatarOnlySpecificProps): props is SingleUserAvatarSpecificProps =>
  (props as Partial<SingleUserAvatarSpecificProps>).userId !== undefined;
const isSourceAvatar = (props: SingleAvatarOnlySpecificProps): props is SingleSourceAvatarSpecificProps =>
  (props as Partial<SingleSourceAvatarSpecificProps>).source !== undefined;
const isSvgAvatar = (props: SingleAvatarOnlySpecificProps): props is SingleSvgAvatarSpecificProps =>
  (props as Partial<SingleSvgAvatarSpecificProps>).svg !== undefined;
const isGroupAvatar = (props: SingleAvatarOnlySpecificProps): props is SingleGroupAvatarSpecificProps =>
  (props as Partial<SingleGroupAvatarSpecificProps>).group === true;

const commonSourceAttributes: ImageProps['source'] = {};

const getAvatarImage = (props: SingleAvatarOnlySpecificProps, error: boolean): ImageProps['source'] => {
  if (error) return fallbackSource;
  try {
    if (isUserAvatar(props)) {
      return { uri: buildAbsoluteUserAvatarUrl(props.userId), ...commonSourceAttributes };
    } else if (isSourceAvatar(props)) {
      const { source } = props;
      if (typeof source === 'number') {
        return source;
      } else {
        return { headers: source.headers, uri: source.uri, ...commonSourceAttributes };
      }
    } else {
      return fallbackSource;
    }
  } catch {
    return fallbackSource;
  }
};

const useAvatarImage = <SpecificProps extends SingleAvatarOnlySpecificProps>(
  props: SpecificProps,
  error: boolean,
): ImageProps['source'] =>
  React.useMemo(
    () => getAvatarImage(props as SingleAvatarOnlySpecificProps, error),
    // Here we memo on only specific props that can issue to image changes, without rebuild the object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // eslint-disable-next-line react-hooks/exhaustive-deps
      (props as SingleAvatarUnknownSpecificProps).group,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      (props as SingleAvatarUnknownSpecificProps).source,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      (props as SingleAvatarUnknownSpecificProps).svg,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      (props as SingleAvatarUnknownSpecificProps).userId,
      error,
    ],
  );

const removeAvatarSpecificProps = (props: SingleAvatarProps): CommonSingleAvatarProps => {
  const { group, id, source, svg, ...commonProps } = props as SingleAvatarProps &
    SingleSourceAvatarProps &
    SingleSvgAvatarProps &
    SingleDefaultAvatarProps &
    SingleGroupAvatarProps;
  return commonProps;
};

export function SingleAvatar(props: SingleAvatarProps) {
  const { size, style, ...otherProps } = removeAvatarSpecificProps(props);

  const [error, setError] = React.useState(false);
  const onError = React.useCallback(() => {
    setError(true);
  }, []);

  const computedStyle = useAvatarStyle(props);
  const imageSource = useAvatarImage(props as SingleAvatarOnlySpecificProps, error);

  return <Image style={computedStyle} source={imageSource} onError={onError} {...otherProps} />;
}
