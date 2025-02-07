import * as React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { DrawerItem } from '@react-navigation/drawer';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { IFolder } from '~/framework/modules/zimbra/model';

const styles = StyleSheet.create({
  expandActionContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    position: 'absolute',
    right: 2,
    width: 48,
  },
  subfolderListContainer: {
    marginLeft: UI_SIZES.spacing.minor,
  },
});

interface FolderButtonProps {
  folder: IFolder;
  currentFolderPath?: string;
  selectedFolderId?: string | null;
  selectedFolderPath?: string;
  onPress: (folder: IFolder) => void;
}

export const FolderButton = (props: FolderButtonProps) => {
  const [isExpanded, setExpanded] = React.useState<boolean>(false);
  const { folder } = props;
  const isSelected = folder.id === props.selectedFolderId || folder.path === props.selectedFolderPath;
  const isCurrentFolder = folder.path === props.currentFolderPath;

  return (
    <>
      <View>
        <DrawerItem
          label={folder.name}
          focused={isSelected}
          onPress={() => (isCurrentFolder ? undefined : props.onPress(folder))}
          activeTintColor={theme.palette.primary.regular.toString()}
          inactiveTintColor={theme.ui.text.regular.toString()}
          activeBackgroundColor={theme.palette.primary.pale.toString()}
          inactiveBackgroundColor={isCurrentFolder ? theme.palette.grey.pearl.toString() : undefined}
        />
        {folder.folders.length ? (
          <TouchableOpacity onPress={() => setExpanded(!isExpanded)} style={styles.expandActionContainer}>
            <Svg
              name={isExpanded ? 'ui-rafterUp' : 'ui-rafterDown'}
              width={18}
              height={18}
              fill={isSelected ? theme.palette.primary.regular : theme.ui.text.regular}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {isExpanded ? (
        <FlatList
          data={folder.folders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <FolderButton {...props} folder={item} />}
          style={styles.subfolderListContainer}
        />
      ) : null}
    </>
  );
};
