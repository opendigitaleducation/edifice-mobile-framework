import I18n from 'i18n-js';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

import theme from '~/app/theme';
import { ActionButton } from '~/framework/components/buttons/action';
import { UI_SIZES } from '~/framework/components/constants';
import { SmallBoldText, TextFontStyle, TextSizeStyle } from '~/framework/components/text';
import { IFolder } from '~/framework/modules/conversation/state/initMails';
import { ModalBox, ModalContent } from '~/ui/Modal';

interface ConversationMoveToFolderModalEventProps {
  closeModal: () => any;
  confirm: () => any;
  selectFolder: (id: string) => any;
}
interface ConversationMoveToFolderModalDataProps {
  show: boolean;
  folders: IFolder[];
  currentFolder: string;
  selectedFolder: string | null;
}
export type ConversationMoveToFolderModalProps = ConversationMoveToFolderModalEventProps & ConversationMoveToFolderModalDataProps;

interface ConversationMoveToFolderModalState {
  openDropdown: boolean;
}

export default class MoveToFolderModal extends React.Component<
  ConversationMoveToFolderModalProps,
  ConversationMoveToFolderModalState
> {
  constructor(props) {
    super(props);
    this.state = {
      openDropdown: false,
    };
  }

  public render() {
    const { show, folders, closeModal, confirm, currentFolder, selectFolder, selectedFolder } = this.props;
    const { openDropdown } = this.state;
    const isCurrentFolderInbox = currentFolder === 'inbox';
    const isCurrentFolderTrash = currentFolder === 'trash';
    const modalTitle = `conversation.${isCurrentFolderTrash ? 'restore' : 'move'}To`;
    const foldersWithoutCurrent = folders && folders.filter(folder => folder.folderName !== currentFolder);
    const options: any = [];
    if (!isCurrentFolderInbox) options.push({ label: I18n.t('conversation.inbox'), value: 'inbox' });

    if (foldersWithoutCurrent && foldersWithoutCurrent.length > 0) {
      for (const folder of foldersWithoutCurrent) {
        options.push({ label: folder.folderName, value: folder.id });
      }
    }
    const isMoveImpossible = options.length === 0;
    //FIXME: create/move to styles.ts
    const styles = StyleSheet.create({
      buttonsContainer: { flexDirection: 'row' },
      dropDownPicker: { borderColor: theme.palette.primary.regular, borderWidth: 1 },
      dropDownPickerContainer: {
        borderColor: theme.palette.primary.regular,
        borderWidth: 1,
        maxHeight: 120,
      },
      modalBoxContainer: { alignItems: 'stretch' },
      modalContent: {
        height: 250,
        padding: UI_SIZES.spacing.big,
        paddingTop: undefined,
        width: undefined,
        justifyContent: 'space-between',
      },
    });

    return (
      <ModalBox
        isVisible={show}
        propagateSwipe
        style={styles.modalBoxContainer}
        onBackdropPress={() => {
          selectFolder('');
          closeModal();
        }}>
        <ModalContent style={styles.modalContent}>
          <SmallBoldText>{I18n.t(modalTitle)}</SmallBoldText>
          {isMoveImpossible ? (
            <SmallBoldText>{I18n.t('conversation.moveImpossible')}</SmallBoldText>
          ) : (
            <DropDownPicker
              open={openDropdown}
              items={options}
              value={selectedFolder}
              setOpen={() => this.setState({ openDropdown: !openDropdown })}
              setValue={callback => selectFolder(callback(selectedFolder))}
              placeholder={I18n.t('conversation.moveSelect')}
              placeholderStyle={{ color: theme.ui.text.light, ...TextFontStyle.Bold, ...TextSizeStyle.Normal }}
              textStyle={{ color: theme.palette.primary.regular, ...TextFontStyle.Bold, ...TextSizeStyle.Normal }}
              style={styles.dropDownPicker}
              dropDownContainerStyle={styles.dropDownPickerContainer}
            />
          )}
          <View style={styles.buttonsContainer}>
            <ActionButton
              text={I18n.t('Cancel')}
              type="secondary"
              action={() => {
                selectFolder('');
                closeModal();
              }}
            />
            <ActionButton
              text={I18n.t(`conversation.${isCurrentFolderTrash ? 'restore' : 'move'}`)}
              style={{ marginLeft: UI_SIZES.spacing.medium }}
              disabled={isMoveImpossible || !selectedFolder}
              action={() => {
                selectFolder('');
                confirm();
              }}
            />
          </View>
        </ModalContent>
      </ModalBox>
    );
  }
}