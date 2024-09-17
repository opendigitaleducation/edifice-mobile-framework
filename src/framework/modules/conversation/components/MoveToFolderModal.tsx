import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import SecondaryButton from '~/framework/components/buttons/secondary';
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
  dropdownWidth: number | undefined;
}

export default class MoveToFolderModal extends React.Component<
  ConversationMoveToFolderModalProps,
  ConversationMoveToFolderModalState
> {
  constructor(props) {
    super(props);
    this.state = {
      openDropdown: false,
      dropdownWidth: undefined,
    };
  }

  public render() {
    const { show, folders, closeModal, confirm, currentFolder, selectFolder, selectedFolder } = this.props;
    const { openDropdown } = this.state;
    const isCurrentFolderInbox = currentFolder === 'inbox';
    const isCurrentFolderTrash = currentFolder === 'trash';
    const modalTitle = isCurrentFolderTrash ? 'conversation-movetofolder-restoreto' : 'conversation-movetofolder-moveto';
    const foldersWithoutCurrent = folders && folders.filter(folder => folder.folderName !== currentFolder);
    const options: any = [];
    if (!isCurrentFolderInbox) options.push({ label: I18n.get('conversation-movetofolder-inbox'), value: 'inbox' });

    if (foldersWithoutCurrent && foldersWithoutCurrent.length > 0) {
      for (const folder of foldersWithoutCurrent) {
        options.push({ label: folder.folderName, value: folder.id });
      }
    }
    const isMoveImpossible = options.length === 0;
    const HEIGHT_ITEM_DROPDOWN = 40;
    //FIXME: create/move to styles.ts
    const styles = StyleSheet.create({
      buttonsContainer: { flexDirection: 'row', zIndex: -1 },
      dropDownPicker: { borderColor: theme.palette.primary.regular, borderWidth: 1, marginTop: UI_SIZES.spacing.big },
      dropDownPickerContainer: {
        borderColor: theme.palette.primary.regular,
        borderWidth: 1,
        height: HEIGHT_ITEM_DROPDOWN * options.length,
        maxHeight: 120,
        position: 'relative',
        top: 0,
        width: this.state.dropdownWidth ?? 0,
      },
      modalBoxContainer: { alignItems: 'stretch' },
      modalContent: {
        height: 250,
        padding: UI_SIZES.spacing.big,
        paddingTop: undefined,
        width: undefined,
        justifyContent: 'space-between',
      },
      text: { textAlign: 'center' },
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
          <View>
            <SmallBoldText style={styles.text}>{I18n.get(modalTitle)}</SmallBoldText>
            {isMoveImpossible ? (
              <SmallBoldText style={styles.text}>{I18n.get('conversation-movetofolder-moveimpossible')}</SmallBoldText>
            ) : (
              <DropDownPicker
                open={openDropdown}
                items={options}
                value={selectedFolder}
                setOpen={() => this.setState({ openDropdown: !openDropdown })}
                setValue={callback => selectFolder(callback(selectedFolder))}
                placeholder={I18n.get('conversation-movetofolder-moveselect')}
                placeholderStyle={{ color: theme.ui.text.light, ...TextFontStyle.Bold, ...TextSizeStyle.Normal }}
                textStyle={{ color: theme.palette.primary.regular, ...TextFontStyle.Bold, ...TextSizeStyle.Normal }}
                style={styles.dropDownPicker}
                dropDownContainerStyle={styles.dropDownPickerContainer}
                onLayout={({ nativeEvent }) => {
                  if (nativeEvent.layout.width !== this.state.dropdownWidth)
                    this.setState({ dropdownWidth: nativeEvent.layout.width });
                }}
              />
            )}
          </View>
          {!openDropdown ? (
            <View style={styles.buttonsContainer}>
              <SecondaryButton
                text={I18n.get('common-cancel')}
                action={() => {
                  selectFolder('');
                  closeModal();
                }}
              />
              <PrimaryButton
                text={I18n.get(isCurrentFolderTrash ? 'conversation-movetofolder-restore' : 'conversation-movetofolder-move')}
                style={{ marginLeft: UI_SIZES.spacing.medium }}
                disabled={isMoveImpossible || !selectedFolder}
                action={() => {
                  selectFolder('');
                  confirm();
                }}
              />
            </View>
          ) : null}
        </ModalContent>
      </ModalBox>
    );
  }
}
