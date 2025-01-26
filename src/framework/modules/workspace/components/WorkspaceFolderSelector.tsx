import React, { useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import { IFile, IFolder } from '~/framework/modules/workspace/reducer';

const styles = StyleSheet.create({
  listContainer: {
    marginBottom: UI_SIZES.spacing.medium,
    maxHeight: UI_SIZES.screen.height - 250,
  },
  nameText: {
    marginLeft: UI_SIZES.spacing.tiny,
  },
  rowContainer: {
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
    height: 30,
    marginBottom: UI_SIZES.spacing.tiny / 2,
    paddingHorizontal: UI_SIZES.spacing.tiny,
  },
  searchBarInput: {
    backgroundColor: theme.palette.grey.fog,
    borderColor: theme.ui.border.input,
    borderRadius: 5,
    borderWidth: 1,
    color: theme.ui.text.regular,
    marginBottom: UI_SIZES.spacing.small,
    marginTop: UI_SIZES.spacing.medium,
    padding: UI_SIZES.spacing.minor,
  },
});

interface IWorkspaceFolderSelectorProps {
  data: IFolder[];
  defaultValue: string;
  excludeData: IFile[];
  onChangeValue: (value: string) => void;
}

export const WorkspaceFolderSelector = ({ data, defaultValue, excludeData, onChangeValue }: IWorkspaceFolderSelectorProps) => {
  const [currentValue, setCurrentValue] = useState<string>(defaultValue);
  const [searchValue, setSearchValue] = useState<string>('');

  function find(id: string) {
    const stack: IFolder[] = [];
    let going = true;

    const walker = (folders: IFolder[], innerId: string) => {
      folders.forEach((item: IFolder) => {
        if (!going) return;
        stack.push(item);
        if (item.id === innerId) {
          going = false;
        } else if (item.children) {
          walker(item.children, innerId);
        } else {
          stack.pop();
        }
      });
      if (going) stack.pop();
    };

    walker(data, id);
    return stack;
  }
  const [expandedFolders, setExpandedFolders] = useState<string[]>(find(defaultValue).map(item => item.id));

  const onTapFolder = ({ item }) => {
    setCurrentValue(item.id);
    if (expandedFolders.includes(item.id)) {
      setExpandedFolders(expandedFolders.filter(id => id !== item.id));
    } else {
      setExpandedFolders(expanded => [...expanded, item.id]);
    }
    onChangeValue(item.id);
  };

  const matchStackFilter = item => {
    if (searchValue === '' || item.id === 'owner') {
      return true;
    }
    return (
      item.name.toLowerCase().match(searchValue.toLowerCase()) ||
      (item.children && item.children.reduce((acc, child) => acc || matchStackFilter(child), false))
    );
  };

  const getFilters = (item: IFolder, value: string): IFolder[] => {
    const matchItem = item.name.toLowerCase().match(value);
    const subItems = item.children
      ? item.children.reduce((acc, child) => [...acc, ...getFilters(child, value)], [] as IFolder[])
      : [];

    if (subItems.length > 0 || matchItem) return [item, ...subItems];
    return [];
  };

  const onSearch = (value: string) => {
    setSearchValue(value);
    if (value !== '') {
      const filteredItems = data.reduce((acc, child) => [...acc, ...getFilters(child, value.toLowerCase())], [] as IFolder[]);
      setExpandedFolders(filteredItems.map(item => item.id));
    }
  };

  const renderRow = ({ item }) => {
    const backgroundColor = currentValue === item.id ? theme.palette.primary.pale : theme.ui.background.card;
    const isParentOfSelection = defaultValue === item.id;
    const selectedFolders = excludeData.filter(exclude => exclude.isFolder);
    const allFoldersSelected = item.children.length === selectedFolders.length;

    if (!matchStackFilter(item) || excludeData.filter(exclude => item.id === exclude.id).length) return null;

    if (item.children && item.children.length && !(isParentOfSelection && allFoldersSelected)) {
      const isExpanded = expandedFolders.includes(item.id);
      const iconName = isExpanded ? 'ui-rafterDown' : 'ui-rafterRight';
      return (
        <View>
          <TouchableOpacity onPress={() => onTapFolder({ item })} style={[styles.rowContainer, { backgroundColor }]}>
            <Svg name={iconName} width={16} height={16} fill={theme.palette.secondary.regular} />
            <SmallText style={styles.nameText}>{item.name}</SmallText>
          </TouchableOpacity>
          {isExpanded ? (
            <FlatList
              data={item.children.sort((a: IFolder, b: IFolder) => a.name.localeCompare(b.name))}
              renderItem={renderRow}
              keyExtractor={childItem => childItem.name}
              style={{ marginLeft: UI_SIZES.spacing.medium }}
            />
          ) : null}
        </View>
      );
    }
    return (
      <TouchableOpacity onPress={() => onTapFolder({ item })} style={[styles.rowContainer, { backgroundColor }]}>
        <SmallText style={styles.nameText}>{item.name}</SmallText>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <TextInput
        style={styles.searchBarInput}
        value={searchValue}
        placeholder={I18n.get('workspace-filelist-search')}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
        spellCheck={false}
        onChangeText={onSearch}
      />
      <FlatList data={data} renderItem={renderRow} keyExtractor={item => item.name} style={styles.listContainer} />
    </View>
  );
};
