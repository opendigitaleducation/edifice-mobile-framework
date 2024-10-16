import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import * as React from 'react';

import styles from './styles';
import type { CustomBottomSheetModalProps } from './types';

// eslint-disable-next-line @typescript-eslint/naming-convention, react/display-name
export const CustomBottomSheetModal = React.forwardRef<BottomSheetModalMethods, CustomBottomSheetModalProps>(
  (props: CustomBottomSheetModalProps, ref) => {
    const renderBackdrop = (backdropProps: BottomSheetBackdropProps) => {
      return <BottomSheetBackdrop {...backdropProps} disappearsOnIndex={-1} appearsOnIndex={0} />;
    };
    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        //snapPoints={animatedSnapPoints}
        //handleHeight={animatedHandleHeight}
        //contentHeight={animatedContentHeight}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        {...props}>
        <BottomSheetView style={styles.contentContainer}>{props.children}</BottomSheetView>
      </BottomSheetModal>
    );
  },
);
