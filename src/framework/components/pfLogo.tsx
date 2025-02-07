/**
 * ODE Mobile UI - Logo
 * Display current platform logo
 */
import React from 'react';

import styled from '@emotion/native';

import { UI_SIZES } from '~/framework/components/constants';
import { Picture } from '~/framework/components/picture';
import { Platform } from '~/framework/util/appConf';
import { Image } from '~/framework/util/media';

const ImageLogo = styled(Image)({
  ...UI_SIZES.elements.logoSize,
  resizeMode: 'contain',
});

export const PFLogo = ({ pf }: { pf: Platform }) => {
  const { logoSize } = UI_SIZES.elements;
  return pf.logoType === 'Svg' ? (
    <Picture type="Svg" name={pf.logo} height={logoSize.height} width={logoSize.width} />
  ) : (
    <ImageLogo source={pf.logo} />
  );
};
