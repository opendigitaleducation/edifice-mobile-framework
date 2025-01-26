import * as React from 'react';
import { ScrollView, View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import styles from './styles';
import type { UserStructuresScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { ButtonLineGroup, LineButton } from '~/framework/components/buttons/line';
import { UI_SIZES } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { HeadingXSText } from '~/framework/components/text';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { isEmpty } from '~/framework/util/object';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.structures>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-structures-title'),
  }),
});

const UserStructuresScreen = (props: UserStructuresScreenPrivateProps) => {
  const { route } = props;
  return (
    <PageView style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {route.params.structures.map(structure => (
          <View style={styles.section} key={structure.id}>
            <View style={styles.title}>
              <Svg
                name="ui-school"
                width={UI_SIZES.elements.icon.default}
                height={UI_SIZES.elements.icon.default}
                fill={theme.palette.grey.black}
                style={styles.titleIcon}
              />
              <HeadingXSText>{structure.name}</HeadingXSText>
            </View>
            <ButtonLineGroup>
              {!isEmpty(structure.classes) ? (
                structure.classes.map(className => <LineButton icon="ui-class" title={className} key={className} />)
              ) : (
                <LineButton icon="ui-class" title={I18n.get('user-profile-classEmpty')} />
              )}
            </ButtonLineGroup>
          </View>
        ))}
      </ScrollView>
    </PageView>
  );
};

export default UserStructuresScreen;
