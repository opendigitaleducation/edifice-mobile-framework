import * as React from 'react';

import PrimaryButton, { PrimaryButtonProps } from '~/framework/components/buttons/primary';

import { BottomSheet, BottomSheetProps } from './BottomSheet';

export const BottomButtonSheet = (props: PrimaryButtonProps & Omit<BottomSheetProps, 'content'>) => {
  return <BottomSheet displayShadow={props.displayShadow} content={<PrimaryButton {...props} />} />;
};
