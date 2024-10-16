import React from 'react';
import { StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { SmallBoldText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { postFolderAction } from '~/framework/modules/conversation/actions/folders';
import { fetchInitAction } from '~/framework/modules/conversation/actions/initMails';
import { DialogButtonCancel, DialogButtonOk } from '~/ui/ConfirmDialog';
import { ModalBox, ModalContent, ModalContentBlock } from '~/ui/Modal';

export type ConversationCreateFolderModalEventProps = {
  createFolder: (name: string, parentId?: string) => void;
  fetchInit: () => void;
  onClose: () => void;
};
export type ConversationCreateFolderModalDataProps = {
  show: boolean;
};
export type ConversationCreateFolderModalProps = ConversationCreateFolderModalEventProps & ConversationCreateFolderModalDataProps;

interface ConversationCreateFolderModalState {
  name: string;
}

class CreateFolderModal extends React.PureComponent<ConversationCreateFolderModalProps, ConversationCreateFolderModalState> {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
    };
  }

  onNameChange = newName => {
    this.setState({ name: newName });
  };

  onConfirm = async () => {
    const { createFolder, fetchInit, onClose } = this.props;
    const { name } = this.state;
    try {
      await createFolder(name);
      fetchInit();
      onClose();
      Toast.showInfo(I18n.get('conversation-createfolder-createdirectory-confirm'));
    } catch (error) {
      const folderAlreadyExists = (error as Error).message === 'conversation.error.duplicate.folder';
      onClose();
      Toast.showError(
        I18n.get(
          folderAlreadyExists
            ? 'conversation-createfolder-createdirectoryerror-folderexists'
            : 'conversation-createfolder-error-text',
        ),
      );
    } finally {
      this.setState({ name: '' });
    }
  };

  public render() {
    const { name } = this.state;
    const { show, onClose } = this.props;
    const textInputStyle = {
      color: theme.ui.text.regular,
    } as ViewStyle;
    //FIXME: create/move to styles.ts
    const styles = StyleSheet.create({
      inputContainer: { width: '100%', marginBottom: UI_SIZES.spacing.big, paddingHorizontal: UI_SIZES.spacing.medium },
      modalContent: { width: 350 },
      modalContentBlock: { flexDirection: 'row' },
    });
    // Ignore ModalBox lint errors
    return (
      <ModalBox isVisible={show} backdropOpacity={0.5}>
        <ModalContent style={styles.modalContent}>
          <ModalContentBlock>
            <SmallBoldText>{I18n.get('conversation-createfolder-createdirectory')}</SmallBoldText>
          </ModalContentBlock>
          <View style={styles.inputContainer}>
            <TextInput
              autoFocus
              value={name}
              onChangeText={this.onNameChange}
              placeholder={I18n.get('conversation-createfolder-directoryname')}
              underlineColorAndroid={theme.palette.grey.grey}
              style={textInputStyle}
            />
          </View>
          <ModalContentBlock style={styles.modalContentBlock}>
            <DialogButtonCancel onPress={onClose} />
            <DialogButtonOk disabled={!name} label={I18n.get('conversation-createfolder-create')} onPress={this.onConfirm} />
          </ModalContentBlock>
        </ModalContent>
      </ModalBox>
    );
  }
}

const mapStateToProps = (state: IGlobalState) => {
  return {};
};

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators(
    {
      createFolder: postFolderAction,
      fetchInit: fetchInitAction,
    },
    dispatch,
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateFolderModal);
