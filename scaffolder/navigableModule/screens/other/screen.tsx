import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import I18n from 'i18n-js';
import * as React from 'react';

import { PageView } from '~/framework/components/page';
import { BodyBoldText } from '~/framework/components/text';
import { navBarOptions } from '~/framework/navigation/navBar';

import { {{moduleName | toCamelCase | capitalize}}NavigationParams, {{moduleName | toCamelCase}}RouteNames } from '~/framework/modules/module-name/navigation';
import styles from './styles';
import type { {{moduleName | toCamelCase | capitalize}}OtherScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<{{moduleName | toCamelCase | capitalize}}NavigationParams, typeof {{moduleName | toCamelCase}}RouteNames.other>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.t('{{moduleName}}-other-title'),
  }),
});

export default function {{moduleName | toCamelCase | capitalize}}OtherScreen(props: {{moduleName | toCamelCase | capitalize}}OtherScreenPrivateProps) {
  return (
    <PageView>
      <BodyBoldText>{{moduleName | toCamelCase}} Other</BodyBoldText>
    </PageView>
  );
}
