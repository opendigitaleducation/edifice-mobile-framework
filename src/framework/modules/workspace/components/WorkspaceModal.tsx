import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import ModalBox, { ModalBoxHandle } from '~/framework/components/ModalBox';
import PrimaryButton from '~/framework/components/buttons/primary';
import { UI_SIZES } from '~/framework/components/constants';
import { BodyText } from '~/framework/components/text';
import { Filter, IFile, IFolder } from '~/framework/modules/workspace/reducer';

import { WorkspaceFileListItem } from './WorkspaceFileListItem';
import { WorkspaceFolderSelector } from './WorkspaceFolderSelector';

const styles = StyleSheet.create({
  flatListContainer: {
    maxHeight: 400,
    marginVertical: UI_SIZES.spacing.small,
  },
  textInput: {
    marginVertical: UI_SIZES.spacing.medium,
    padding: UI_SIZES.spacing.minor,
    backgroundColor: theme.palette.grey.fog,
    borderColor: theme.ui.border.input,
    borderWidth: 1,
    borderRadius: 5,
    color: theme.ui.text.regular,
  },
});

export enum WorkspaceModalType {
  COPY,
  CREATE_FOLDER,
  DOWNLOAD,
  MOVE,
  NONE,
  RENAME,
}

interface IWorkspaceModalSettings {
  buttonText: string;
  title: string;
  hasDestinationSelector?: boolean;
  hasFileList?: boolean;
  hasInput?: boolean;
}

interface IWorkspaceModalProps {
  filter: Filter;
  folderTree: IFolder[];
  parentId: string;
  selectedFiles: IFile[];
  type: WorkspaceModalType;
  onAction: (files: IFile[], value: string, destinationId: string) => void;
}

const getModalSettings = (type: WorkspaceModalType): IWorkspaceModalSettings => {
  switch (type) {
    case WorkspaceModalType.COPY:
      return {
        buttonText: I18n.get('workspace-filelist-modal-copy-action'),
        title: I18n.get('workspace-filelist-modal-copy-title'),
        hasDestinationSelector: true,
      };
    case WorkspaceModalType.CREATE_FOLDER:
      return {
        buttonText: I18n.get('workspace-filelist-modal-createfolder-action'),
        title: I18n.get('workspace-filelist-modal-createfolder-title'),
        hasInput: true,
      };
    case WorkspaceModalType.DOWNLOAD:
      return {
        buttonText: I18n.get('workspace-filelist-modal-download-action'),
        title: I18n.get('workspace-filelist-modal-download-title'),
        hasFileList: true,
      };
    case WorkspaceModalType.MOVE:
      return {
        buttonText: I18n.get('workspace-filelist-modal-move-action'),
        title: I18n.get('workspace-filelist-modal-move-title'),
        hasDestinationSelector: true,
      };
    case WorkspaceModalType.RENAME:
      return {
        buttonText: I18n.get('workspace-filelist-modal-rename-action'),
        title: I18n.get('workspace-filelist-modal-rename-title'),
        hasInput: true,
      };
    case WorkspaceModalType.NONE:
    default:
      return { buttonText: '', title: '' };
  }
};

export const WorkspaceModal = React.forwardRef<ModalBoxHandle, IWorkspaceModalProps>(
  ({ filter, folderTree, parentId, selectedFiles, type, onAction }, ref) => {
    const [inputValue, setInputValue] = useState<string>('');
    const [fileExtension, setFileExtension] = useState<string>('');
    const [destination, setDestination] = useState<string>('');
    const settings = getModalSettings(type);
    const isDisabled =
      (settings.hasInput && inputValue === '') ||
      (type === WorkspaceModalType.MOVE && filter === Filter.OWNER && destination === parentId);
    const action = () => onAction(selectedFiles, inputValue + fileExtension, destination);

    useEffect(() => {
      if (type === WorkspaceModalType.RENAME && selectedFiles.length) {
        const name = selectedFiles[0].name;
        const index = name.lastIndexOf('.');
        setInputValue(index > 0 ? name.substring(0, index) : name);
        setFileExtension(index > 0 ? name.substring(index) : '');
      } else if (type === WorkspaceModalType.CREATE_FOLDER) {
        setInputValue('');
        setFileExtension('');
      } else if (settings.hasDestinationSelector) {
        setDestination(parentId);
      }
    }, [parentId, selectedFiles, settings.hasDestinationSelector, type]);

    return (
      <ModalBox
        ref={ref}
        content={
          <View>
            <BodyText>{settings.title}</BodyText>
            {settings.hasDestinationSelector ? (
              <WorkspaceFolderSelector
                data={folderTree}
                defaultValue={filter === Filter.OWNER ? parentId : 'owner'}
                excludeData={selectedFiles}
                onChangeValue={value => setDestination(value)}
              />
            ) : null}
            {settings.hasFileList ? (
              <FlatList
                data={selectedFiles}
                renderItem={({ item }) => <WorkspaceFileListItem item={item} isDisabled />}
                keyExtractor={(item: IFile) => item.id}
                style={styles.flatListContainer}
              />
            ) : null}
            {settings.hasInput ? (
              <TextInput
                value={inputValue}
                onChangeText={value => setInputValue(value)}
                autoFocus={type === WorkspaceModalType.CREATE_FOLDER}
                style={styles.textInput}
              />
            ) : null}
            <PrimaryButton text={settings.buttonText} action={action} disabled={isDisabled} />
          </View>
        }
      />
    );
  },
);

export default WorkspaceModal;
