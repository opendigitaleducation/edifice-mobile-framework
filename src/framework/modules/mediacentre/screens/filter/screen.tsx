import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { IGlobalState } from '~/app/store';
import CheckboxButton from '~/framework/components/buttons/checkbox';
import FlatList from '~/framework/components/list/flat-list';
import { NavBarAction } from '~/framework/components/navigation';
import { PageView } from '~/framework/components/page';
import { getSession } from '~/framework/modules/auth/reducer';
import { ResourceFilter } from '~/framework/modules/mediacentre/model';
import { MediacentreNavigationParams, mediacentreRouteNames } from '~/framework/modules/mediacentre/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';

import { MediacentreFilterScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<MediacentreNavigationParams, typeof mediacentreRouteNames.filter>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: route.params.title,
  }),
});

const MediacentreFilterScreen = (props: MediacentreFilterScreenPrivateProps) => {
  const { params } = props.route;
  const [data, setData] = useState<ResourceFilter[]>(params.filters);

  const handleSaveChanges = () => {
    params.onChange(data);
    props.navigation.goBack();
  };

  useEffect(() => {
    props.navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => <NavBarAction icon="ui-check" onPress={handleSaveChanges} />,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const checkAllItems = () => {
    const active = !data.every(f => f.isActive);

    setData(data.map(f => ({ ...f, isActive: active })));
  };

  const checkItem = (name: string) => {
    const newItems = data.slice();
    const itemIndex = newItems.findIndex(item => item.name === name);
    newItems[itemIndex].isActive = !newItems[itemIndex].isActive;
    setData(newItems);
  };

  const renderItem = ({ item }: { item: ResourceFilter }) => {
    return (
      <CheckboxButton
        onPress={() => checkItem(item.name)}
        title={item.name.replace('fr.openent.mediacentre.source.', '')}
        checked={item.isActive}
      />
    );
  };

  const renderList = () => {
    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        ListHeaderComponent={
          data.length >= 2 ? (
            <CheckboxButton
              onPress={checkAllItems}
              title="mediacentre-filter-all"
              checked={data.every(f => f.isActive)}
              partialyChecked={data.some(f => f.isActive) && data.some(f => !f.isActive)}
            />
          ) : null
        }
      />
    );
  };

  return <PageView>{renderList()}</PageView>;
};

export default connect((state: IGlobalState) => {
  const session = getSession();

  return {
    session,
  };
})(MediacentreFilterScreen);
