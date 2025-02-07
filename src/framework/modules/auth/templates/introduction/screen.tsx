import * as React from 'react';
import { View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import styles from './styles';
import type { AuthIntroductionScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import PrimaryButton from '~/framework/components/buttons/primary';
import { getScaleWidth } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { HeadingSText, SmallText } from '~/framework/components/text';
import { AuthNavigationParams } from '~/framework/modules/auth/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<AuthNavigationParams>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('auth-introduction-title'),
  }),
});

export default function AuthIntroductionScreen(props: AuthIntroductionScreenPrivateProps) {
  return (
    <PageView style={styles.page}>
      <View style={styles.topContainer}>
        <Svg name={props.svgName} width={getScaleWidth(130)} height={getScaleWidth(130)} />
        <HeadingSText style={styles.title}>{props.title}</HeadingSText>
        <SmallText style={styles.description}>{props.description}</SmallText>
      </View>
      <View style={styles.bottomContainer}>
        <PrimaryButton
          text={props.buttonText}
          iconRight="ui-arrowRight"
          style={styles.button}
          action={() => {
            props.navigation.dispatch(props.nextScreenAction);
          }}
        />
      </View>
    </PageView>
  );
}
