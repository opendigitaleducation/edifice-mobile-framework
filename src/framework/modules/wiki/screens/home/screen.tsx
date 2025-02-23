import * as React from 'react';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import type { WikiHomeScreen } from './types';

import { I18n } from '~/app/i18n';
import ResourceExplorer, { ResourceExplorerTemplate } from '~/framework/modules/explorer/templates/resource-explorer';
import moduleConfig from '~/framework/modules/wiki//module-config';
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

export default function WikiHomeScreen({ navigation, route, ...props }: WikiHomeScreen.AllProps) {
  const onOpenResource = React.useCallback<NonNullable<ResourceExplorerTemplate.Props['onOpenResource']>>(
    r => {
      navigation.navigate(wikiRouteNames.summary, { resourceId: r.id });
    },
    [navigation],
  );
  return (
    <ResourceExplorer
      {...props}
      navigation={navigation as ResourceExplorerTemplate.NavigationProps['navigation']}
      route={route as ResourceExplorerTemplate.NavigationProps['route']}
      moduleConfig={moduleConfig}
      onOpenResource={onOpenResource}
    />
  );
}
