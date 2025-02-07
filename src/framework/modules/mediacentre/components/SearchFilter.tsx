import React, { useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { Checkbox } from '~/framework/components/checkbox';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import { IResource } from '~/framework/modules/mediacentre/reducer';

const styles = StyleSheet.create({
  mainContainer: {
    padding: UI_SIZES.spacing.minor,
    backgroundColor: theme.ui.background.card,
    borderRadius: UI_SIZES.radius.card,
    shadowColor: theme.ui.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: UI_SIZES.spacing.minor,
  },
  sectionsContainer: {
    marginHorizontal: UI_SIZES.spacing.tiny,
    marginBottom: UI_SIZES.spacing.tiny,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: UI_SIZES.spacing.tiny,
  },
  itemText: {
    marginLeft: UI_SIZES.spacing.tiny,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: UI_SIZES.spacing.minor,
    marginBottom: UI_SIZES.spacing.tiny,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.grey.pearl,
  },
});

interface IFilterItemProps {
  item: { value: string; active: boolean };
  sectionTitle: string;

  onChange: (title: string, item: string, active: boolean) => void;
}

interface IFilterSectionProps {
  items: any[];
  title: string;

  onChange: (title: string, item: string, active: boolean) => void;
}

interface ISearchFilterProps {
  containerStyle?: ViewStyle;
  resources: IResource[];

  onChange: (title: string, item: string, active: boolean) => void;
}

const compareFilters = (a: { value: string; active: boolean }, b: { value: string; active: boolean }) => {
  return a.value.toLowerCase() > b.value.toLowerCase() ? 1 : -1;
};

const getFilters = (resources: IResource[]) => {
  const types: { value: string; active: boolean }[] = [];
  const sources: { value: string; active: boolean }[] = [];
  const levels: { value: string; active: boolean }[] = [];
  for (const resource of resources) {
    const source = resource.source.substring(30);
    for (const type of resource.types) {
      if (!types.some(({ value }) => value === type)) {
        types.push({ value: type, active: false });
      }
    }
    if (!sources.some(({ value }) => value === source)) {
      sources.push({ value: source, active: false });
    }
    for (const level of resource.levels) {
      if (!levels.some(({ value }) => value === level)) {
        levels.push({ value: level, active: false });
      }
    }
  }
  return [
    { title: 'resourcetype', items: types.sort(compareFilters) },
    { title: 'source', items: sources.sort(compareFilters) },
    { title: 'level', items: levels.sort(compareFilters) },
  ];
};

const FilterItem: React.FunctionComponent<IFilterItemProps> = (props: IFilterItemProps) => {
  const onCheck = () => {
    props.onChange(props.sectionTitle, props.item.value, !props.item.active);
  };
  return (
    <TouchableOpacity onPress={onCheck} style={styles.itemContainer}>
      <Checkbox checked={props.item.active} onPress={onCheck} />
      <SmallText style={styles.itemText}>{props.item.value}</SmallText>
    </TouchableOpacity>
  );
};

const FilterSection: React.FunctionComponent<IFilterSectionProps> = (props: IFilterSectionProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const iconName = expanded ? 'ui-rafterUp' : 'ui-rafterDown';
  const expandSection = () => {
    setExpanded(!expanded);
  };
  return (
    <View>
      <TouchableOpacity style={styles.sectionHeaderContainer} onPress={expandSection}>
        <SmallText>{I18n.get(`mediacentre-home-filter-${props.title}`)}</SmallText>
        <Svg name={iconName} width={18} height={18} fill={theme.ui.text.regular} />
      </TouchableOpacity>
      {expanded ? props.items.map(item => <FilterItem {...props} item={item} sectionTitle={props.title} key={item.value} />) : null}
    </View>
  );
};

export const SearchFilter: React.FunctionComponent<ISearchFilterProps> = (props: ISearchFilterProps) => {
  const [filters, setFilters] = useState(getFilters(props.resources));
  const [expanded, setExpanded] = useState<boolean>(false);
  const expand = () => {
    setExpanded(!expanded);
  };
  const onChange = (title: string, item: string, active: boolean) => {
    props.onChange(title, item, active);
    const filter = filters.find(x => x.title === title);
    if (filter) {
      const index = filters.indexOf(filter);
      filters[index].items = filters[index].items.map(i => (i.value === item ? { value: item, active } : i));
      setFilters(filters);
    }
  };
  return (
    <View style={[styles.mainContainer, props.containerStyle]}>
      <TouchableOpacity style={styles.titleContainer} onPress={expand}>
        <Svg name="ui-filter" width={18} height={18} fill={theme.ui.text.regular} style={styles.iconContainer} />
        <SmallText>{I18n.get('mediacentre-home-filter').toUpperCase()}</SmallText>
      </TouchableOpacity>
      {expanded ? (
        <FlatList
          data={filters}
          keyExtractor={(item, index) => item.title + index}
          renderItem={({ item }) => <FilterSection title={item.title} items={item.items} onChange={onChange} />}
          style={styles.sectionsContainer}
        />
      ) : null}
    </View>
  );
};
