import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import NetworkLogger from 'react-native-network-logger';

import { PageView } from '~/framework/components/page';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import type { NetworkScreenPrivateProps } from '~/framework/modules/user/screens/debug/network/types';
import { navBarOptions } from '~/framework/navigation/navBar';

import styles from './styles';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.network>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: 'Debug',
  }),
});

function NetworkScreen(props: NetworkScreenPrivateProps) {
  return (
    <PageView style={styles.page}>
      <NetworkLogger maxRows={20} theme="light" />
    </PageView>
  );
}

export default NetworkScreen;
