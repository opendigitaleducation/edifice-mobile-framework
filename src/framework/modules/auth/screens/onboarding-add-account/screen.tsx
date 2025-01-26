import * as React from 'react';
import { View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import styles from './styles';
import type { AuthOnboardingAddAccountScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import PrimaryButton from '~/framework/components/buttons/primary';
import { getScaleWidth } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { HeadingSText, SmallText } from '~/framework/components/text';
import { authRouteNames, IAuthNavigationParams, navigateAfterOnboarding } from '~/framework/modules/auth/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<IAuthNavigationParams, typeof authRouteNames.onboardingAddAccount>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('auth-onboarding-add-account-title'),
  }),
});

export default function AuthOnboardingAddAccountScreen(props: AuthOnboardingAddAccountScreenPrivateProps) {
  const onNavigate = React.useCallback(() => {
    navigateAfterOnboarding(props.navigation);
  }, [props.navigation]);
  return (
    <PageView style={styles.page}>
      <View style={styles.topContainer}>
        <Svg name="multi-account" width={getScaleWidth(130)} height={getScaleWidth(130)} />
        <HeadingSText style={styles.title}>{I18n.get('user-accountonboarding-heading')}</HeadingSText>
        <SmallText style={styles.description}>{I18n.get('user-accountonboarding-description')}</SmallText>
      </View>
      <View style={styles.bottomContainer}>
        <PrimaryButton
          text={I18n.get('user-accountonboarding-button')}
          iconRight="ui-arrowRight"
          style={styles.button}
          action={onNavigate}
        />
      </View>
    </PageView>
  );
}
