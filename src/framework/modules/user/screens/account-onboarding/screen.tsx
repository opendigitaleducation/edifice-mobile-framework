import * as React from 'react';
import { View } from 'react-native';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import { I18n } from '~/app/i18n';
import PrimaryButton from '~/framework/components/buttons/primary';
import { getScaleWidth } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { HeadingSText, SmallText } from '~/framework/components/text';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import styles from '~/framework/modules/user/screens/account-onboarding/styles';
import { UserAccountOnboardingScreenPrivateProps } from '~/framework/modules/user/screens/account-onboarding/types';
import { navBarOptions } from '~/framework/navigation/navBar';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.accountOnboarding>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('auth-accountonboarding-heading'),
  }),
});

const UserAccountOnboardingScreen = (props: UserAccountOnboardingScreenPrivateProps) => {
  const navigation = useNavigation<NavigationProp<UserNavigationParams>>();
  const onAddAccount = () => navigation.navigate('', {});

  return (
    <PageView style={styles.page}>
      <View style={styles.topContainer}>
        <Svg name="multi-account" width={getScaleWidth(130)} height={getScaleWidth(130)} />
        <HeadingSText style={styles.title}>{I18n.get('auth-accountonboarding-heading')}</HeadingSText>
        <SmallText style={styles.description}>{I18n.get('auth-accountonboarding-description')}</SmallText>
      </View>
      <View style={styles.bottomContainer}>
        <PrimaryButton
          text={I18n.get('auth-accountonboarding-button')}
          iconRight="ui-arrowRight"
          style={styles.button}
          action={onAddAccount}
        />
      </View>
    </PageView>
  );
};

export default UserAccountOnboardingScreen;
