import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ReactJSXElement } from 'node_modules/@emotion/react/dist/declarations/types/jsx-namespace';
import * as React from 'react';

import ScrollView from '~/framework/components/scrollView';
import { BodyText } from '~/framework/components/text';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { DetailedScreenPrivateProps } from '~/framework/modules/user/screens/debug/log/detailed/types';
import { navBarOptions } from '~/framework/navigation/navBar';

import styles from './styles';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.detailed>): NativeStackNavigationOptions => {
  const logTime = route.params.logData?.time;
  const logSeverity = route.params.logData?.severity;

  return {
    ...navBarOptions({
      navigation,
      route,
      title: `${logTime} - ${logSeverity}`,
    }),
  };
};

const DetailedScreen = (props: DetailedScreenPrivateProps): ReactJSXElement => {
  const { logData } = props.route.params;
  if (logData) {
    const { message } = logData;

    return (
      <ScrollView>
        <BodyText style={styles.logMessageContainer}>{message}</BodyText>
      </ScrollView>
    );
  }

  return <></>;
};

export default DetailedScreen;
