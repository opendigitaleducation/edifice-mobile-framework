import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import FlatList from '~/framework/components/list/flat-list';
import { NamedSVG } from '~/framework/components/picture';
import { BodyText } from '~/framework/components/text';
import ResourceCard from '~/framework/modules/mediacentre/components/resource-card';
import { Resource, SectionType } from '~/framework/modules/mediacentre/model';

import styles from './styles';
import { ResourceListProps } from './types';

const ResourceList: React.FunctionComponent<ResourceListProps> = ({
  resources,
  type,
  iconName,
  isResourceFavorite,
  onAddFavorite,
  onRemoveFavorite,
  openResourceList,
}) => {
  const renderResource = ({ item }: { item: Resource }) => (
    <ResourceCard
      variant={type === SectionType.PINS ? 'pin' : 'preview'}
      resource={item}
      isFavorite={isResourceFavorite(item.uid)}
      onAddFavorite={() => onAddFavorite(item)}
      onRemoveFavorite={() => onRemoveFavorite(item)}
    />
  );

  const handlePressShowAll = () => openResourceList(resources, I18n.get(`mediacentre-sectiontype-${type}`));

  return (
    <View>
      <TouchableOpacity onPress={handlePressShowAll} style={styles.headerContainer}>
        {iconName ? <NamedSVG name={iconName} fill={theme.palette.primary.regular} width={20} /> : null}
        <BodyText style={{ color: theme.palette.primary.regular }}>{I18n.get(`mediacentre-sectiontype-${type}`)}</BodyText>
        <NamedSVG name="ui-rafterRight" fill={theme.palette.primary.regular} width={20} height={20} />
      </TouchableOpacity>
      <FlatList
        horizontal
        data={resources.slice(0, 8)}
        renderItem={renderResource}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
};

export default ResourceList;