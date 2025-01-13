import * as React from 'react';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import type { WikiHomeScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import { PageView } from '~/framework/components/page';
import { BodyBoldText } from '~/framework/components/text';
import { WikiNavigationParams, wikiRouteNames } from '~/framework/modules/wiki/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';

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

export default function WikiHomeScreen(props: WikiHomeScreenPrivateProps) {
  return (
    <PageView>
      <BodyBoldText>wiki home screen</BodyBoldText>
    </PageView>
  );
}
