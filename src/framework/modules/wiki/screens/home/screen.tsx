import * as React from 'react';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import type { WikiHomeScreenPrivateProps } from './types';

import { View } from 'react-native';
import { I18n } from '~/app/i18n';
import PrimaryButton from '~/framework/components/buttons/primary';
import { PageView } from '~/framework/components/page';
import { BodyBoldText } from '~/framework/components/text';
import { WikiNavigationParams, wikiRouteNames } from '~/framework/modules/wiki/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';

import { FOLDER, odeServices, SORT_ORDER } from '@edifice.io/client';
import '../../service/resource';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<WikiNavigationParams, typeof wikiRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('wiki-home-title'),
  }),
});

export const ExplorerContext = () => {
  const searchParams = {
    filters: {
      folder: FOLDER.DEFAULT,
      owner: undefined,
      shared: undefined,
      public: undefined,
    },
    orders: { updatedAt: SORT_ORDER.DESC },
    application: '',
    types: [],
    pagination: {
      startIdx: 0,
      pageSize: 48,
      maxIdx: 0,
    },
    trashed: false,
  };

  const searchContext = async () => {
    const result = await odeServices.resource('wiki').searchContext({
      ...searchParams,
      application: 'wiki',
      types: ['wiki'],
      pagination: {
        ...searchParams.pagination,
        startIdx: 1 as number,
      },
    });

    console.log({ result });

    return result;
  };

  const handleSearchContext = () => searchContext();

  return (
    <View>
      <PrimaryButton action={handleSearchContext}>Get Wiki Explorer Context</PrimaryButton>
    </View>
  );
};

export default function WikiHomeScreen(props: WikiHomeScreenPrivateProps) {
  return (
    <PageView>
      <BodyBoldText>wiki home screen</BodyBoldText>
      <ExplorerContext />
    </PageView>
  );
}
