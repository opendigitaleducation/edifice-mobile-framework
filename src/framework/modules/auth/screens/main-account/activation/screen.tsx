import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { activateAccountActionAddFirstAccount } from '~/framework/modules/auth/actions';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { getPlatformContextOf, getPlatformLegalUrlsOf } from '~/framework/modules/auth/reducer';
import ActivationScreen, { ActivationScreenDispatchProps } from '~/framework/modules/auth/templates/activation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { tryAction } from '~/framework/util/redux/actions';

import type { AuthActivationScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.activation>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('auth-navigation-activation-title'),
  }),
});

export default connect(
  (state, props: AuthActivationScreenPrivateProps) => {
    return {
      context: getPlatformContextOf(props.route.params.platform),
      legalUrls: getPlatformLegalUrlsOf(props.route.params.platform),
    };
  },
  (dispatch: ThunkDispatch<any, any, any>, props: AuthActivationScreenPrivateProps) => {
    return bindActionCreators<ActivationScreenDispatchProps>(
      {
        trySubmit: tryAction(activateAccountActionAddFirstAccount),
      },
      dispatch,
    );
  },
)(function AuthActivationScreen(props: AuthActivationScreenPrivateProps) {
  return <ActivationScreen {...props} />;
});
