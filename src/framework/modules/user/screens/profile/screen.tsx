import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import I18n from 'i18n-js';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { IGlobalState } from '~/app/store';
import { PageView } from '~/framework/components/page';
import { BodyBoldText } from '~/framework/components/text';
import { navBarOptions } from '~/framework/navigation/navBar';

import { UserNavigationParams, userRouteNames } from '../../navigation';
import styles from './styles';
import type { UserProfileScreenDispatchProps, UserProfileScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.profile>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
  }),
  title: I18n.t('user-profile-title'),
});

function UserProfileScreen(props: UserProfileScreenPrivateProps) {
  return (
    <PageView>
      <BodyBoldText>user profile screen</BodyBoldText>
    </PageView>
  );
}

export default connect(
  (state: IGlobalState) => {
    return {};
  },
  dispatch => bindActionCreators({}, dispatch),
)(UserProfileScreen);
