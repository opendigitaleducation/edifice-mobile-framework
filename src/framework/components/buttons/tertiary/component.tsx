import * as React from 'react';
import { useEffect, useState } from 'react';

import theme from '~/app/theme';
import DefaultButton from '~/framework/components/buttons/default';

import { TertiaryButtonProps } from './types';

const TertiaryButton = (props: TertiaryButtonProps) => {
  const initialContentColor = props.contentColor ?? theme.palette.primary.regular;

  const [contentColor, setContentColor] = useState(initialContentColor);

  useEffect(() => {
    if (props.disabled) setContentColor(theme.palette.primary.light);
    if (!props.disabled && contentColor === theme.palette.primary.light) setContentColor(initialContentColor);
  }, [contentColor, initialContentColor, props.disabled]);
  return (
    <DefaultButton
      {...props}
      activeOpacity={1}
      onPressIn={() => setContentColor(theme.palette.primary.dark)}
      onPressOut={() => setContentColor(initialContentColor)}
      contentColor={contentColor}
    />
  );
};

export default TertiaryButton;
