import * as React from 'react';
import { StyleSheet } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import type { WikiHomeScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import { getScaleHeight, getScaleWidth, UI_SIZES } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import ModuleImage from '~/framework/components/picture/module-image';
import { BodyBoldText } from '~/framework/components/text';
import moduleConfig from '~/framework/modules/wiki/module-config';
import { WikiNavigationParams, wikiRouteNames } from '~/framework/modules/wiki/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';

const styles = StyleSheet.create({
  imageStyle: {
    borderRadius: UI_SIZES.radius.medium,
    height: getScaleHeight(120),
    width: getScaleWidth(120),
  },
});

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
      <ModuleImage moduleConfig={moduleConfig} source={{ uri: 'https://picsum.photos/200' }} style={styles.imageStyle} />
    </PageView>
  );
}
