import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import NativeModal from 'react-native-modal';

import { UI_SIZES } from './constants';
import { Picture } from './picture';

import theme from '~/app/theme';

const styles = StyleSheet.create({
  innerView: {
    position: 'absolute',
    right: UI_SIZES.spacing.medium,
    top: UI_SIZES.spacing.medium,
  },
  nativeModal: {
    // Some magic number here. A negative margin of this value seems to be applied automatically by NativeModal.
    flex: 0,

    height: '100%',

    margin: 0,

    padding: 0,

    paddingVertical: 43,
    width: '100%',
  },
  outerView: {
    backgroundColor: theme.ui.background.card,
    borderRadius: UI_SIZES.radius.extraLarge,
    flexGrow: 0,
    marginBottom: UI_SIZES.screen.bottomInset + UI_SIZES.elements.tabbarHeight,
    marginHorizontal: UI_SIZES.spacing.medium,
    marginTop: UI_SIZES.elements.navbarHeight + UI_SIZES.screen.topInset,
    padding: UI_SIZES.spacing.big,
  },
});

export interface ModalBoxProps {
  content: JSX.Element;
}

export interface ModalBoxHandle {
  doShowModal: () => void;
  doDismissModal: () => void;
}

export const ModalBox = React.forwardRef<ModalBoxHandle, ModalBoxProps>(({ content }, ref) => {
  const [showModal, setShowModal] = React.useState(false);
  const doDismissModal = React.useCallback(() => setShowModal(false), []);
  const doShowModal = React.useCallback(() => setShowModal(true), []);
  React.useImperativeHandle(ref, () => ({ doDismissModal, doShowModal }));

  return (
    <NativeModal
      backdropTransitionOutTiming={0}
      hideModalContentWhileAnimating
      isVisible={showModal}
      onBackdropPress={doDismissModal}
      style={styles.nativeModal}>
      <View style={styles.outerView}>
        {content}
        <View style={styles.innerView}>
          <TouchableOpacity onPress={doDismissModal}>
            <Picture
              type="Svg"
              name="pictos-close"
              width={UI_SIZES.dimensions.width.large}
              height={UI_SIZES.dimensions.height.large}
              fill={theme.palette.grey.black}
            />
          </TouchableOpacity>
        </View>
      </View>
    </NativeModal>
  );
});

export default ModalBox;
