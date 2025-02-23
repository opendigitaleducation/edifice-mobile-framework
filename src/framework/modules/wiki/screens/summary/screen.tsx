import * as React from 'react';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import type { WikiSummaryScreen } from './types';

import { I18n } from '~/app/i18n';
import { PageView } from '~/framework/components/page';
import { BodyBoldText } from '~/framework/components/text';
import { WikiNavigationParams, wikiRouteNames } from '~/framework/modules/wiki/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<WikiNavigationParams, typeof wikiRouteNames.summary>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('wiki-summary-title'),
  }),
});

export default function WikiSummaryScreen({
  route: {
    params: { resourceId },
  },
}: WikiSummaryScreen.AllProps) {
  return (
    <PageView>
      <BodyBoldText>Bonjour ! {resourceId}</BodyBoldText>
    </PageView>
  );
}
