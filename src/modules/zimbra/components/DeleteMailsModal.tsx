import I18n from 'i18n-js';
import * as React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { CommonStyles } from '~/styles/common/styles';
import { DialogButtonCancel, DialogButtonOk } from '~/ui/ConfirmDialog';
import { ModalBox, ModalContent, ModalContentBlock } from '~/ui/Modal';
import { Text, TextBold } from '~/ui/Typography';
import { Icon } from '~/ui/icons/Icon';

const styles = StyleSheet.create({
  titleContainer: { alignSelf: 'flex-start' },
  titleText: { fontSize: 16 },
  footerContainer: { alignSelf: 'flex-end' },
  contentBlock: { flexDirection: 'row' },
  messageContainer: {
    width: '100%',
    marginBottom: 35,
    paddingHorizontal: 20,
  },
});

export const ModalPermanentDelete = ({
  deleteModal,
  closeModal,
  actionsDeleteSuccess,
}: {
  deleteModal: { isShown: boolean; mailsIds: string[] };
  closeModal: () => void;
  actionsDeleteSuccess: (mailsIds: string[]) => void;
}) => (
  <ModalBox isVisible={deleteModal.isShown} backdropOpacity={0.5}>
    <ModalContent style={{ width: useWindowDimensions().width - 60 }}>
      <View style={styles.titleContainer}>
        <ModalContentBlock style={styles.contentBlock}>
          <Icon size={18} name="warning" color={CommonStyles.secondary} />
          <TextBold style={styles.titleText}>&emsp;{I18n.t('zimbra-message-deleted-confirm')}</TextBold>
        </ModalContentBlock>
      </View>

      <View style={styles.messageContainer}>
        <Text>{I18n.t('zimbra-message-deleted-confirm-text')}</Text>
      </View>

      <View style={styles.footerContainer}>
        <ModalContentBlock style={styles.contentBlock}>
          <DialogButtonCancel onPress={() => closeModal()} />
          <DialogButtonOk
            style={{ backgroundColor: CommonStyles.secondary }}
            label={I18n.t('delete')}
            onPress={() => actionsDeleteSuccess(deleteModal.mailsIds)}
          />
        </ModalContentBlock>
      </View>
    </ModalContent>
  </ModalBox>
);
