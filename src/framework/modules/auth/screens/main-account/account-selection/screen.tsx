import React from 'react';
import { FlatListProps, TouchableOpacity, View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { AuthAccountSelectionScreenDispatchProps, AuthAccountSelectionScreenPrivateProps, LoginState } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import SecondaryButton from '~/framework/components/buttons/secondary';
import { getScaleWidth } from '~/framework/components/constants';
import { BottomSheetModalMethods } from '~/framework/components/modals/bottom-sheet';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { HeadingXSText, SmallBoldText, SmallText } from '~/framework/components/text';
import toast from '~/framework/components/toast';
import { removeAccountAction, restoreAccountAction } from '~/framework/modules/auth/actions';
import HandleAccountList from '~/framework/modules/auth/components/handle-account-list';
import { LargeHorizontalUserList } from '~/framework/modules/auth/components/large-horizontal-user-list';
import {
  accountIsLoggable,
  AuthLoggedAccount,
  AuthSavedLoggedInAccount,
  AuthSavedLoggedInAccountWithCredentials,
  getOrderedAccounts,
} from '~/framework/modules/auth/model';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { getNavActionForAccountLoad, navigationDispatchMultiple } from '~/framework/modules/auth/navigation/main-account/router';
import { getState as getAuthState } from '~/framework/modules/auth/reducer';
import styles from '~/framework/modules/auth/screens/main-account/account-selection/styles';
import track, { trackingAccountEvents } from '~/framework/modules/auth/tracking';
import { navBarOptions } from '~/framework/navigation/navBar';
import appConf from '~/framework/util/appConf';
import { handleAction, tryAction } from '~/framework/util/redux/actions';
import { Loading } from '~/ui/Loading';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.accounts>): NativeStackNavigationOptions => {
  return {
    ...navBarOptions({
      navigation,
      route,
      title: I18n.get('auth-accountselection-title'),
    }),
  };
};

const AccountSelectionScreen = (props: AuthAccountSelectionScreenPrivateProps) => {
  const { accounts, navigation, tryRemoveAccount, tryRestore } = props;
  const [loadingState, setLoadingState] = React.useState<LoginState>(LoginState.IDLE);
  const accountListRef = React.useRef<BottomSheetModalMethods>(null);
  const onHandleAccounts = () => {
    trackingAccountEvents.manageAccountsPressButton();
    accountListRef.current?.present();
  };
  const data = React.useMemo(() => getOrderedAccounts(props.accounts), [props.accounts]);
  const dataforList = React.useMemo(
    () =>
      data.map(account => ({
        displayName: account.user.displayName,
        id: account.user.id,
        isLoggable: accountIsLoggable(account),
        login: (account.user as Partial<AuthSavedLoggedInAccountWithCredentials['user']>).loginUsed,
        method: account.method,
        platform: appConf.getExpandedPlatform(account.platform),
        type: account.user.type,
      })),
    [data],
  );

  const onItemPress = React.useCallback(
    async (item: (typeof dataforList)[0], index: number) => {
      const redirect = (i: typeof item) => {
        const navAction = getNavActionForAccountLoad(i);
        if (!navAction) {
          console.warn('AccountSelectionScreen: Missing platform for this account');
          toast.showError(I18n.get('auth-account-select-error'));
          return;
        }
        navigationDispatchMultiple(navigation, navAction);
      };
      if (loadingState !== LoginState.IDLE) return;
      if (item.isLoggable) {
        try {
          setLoadingState(LoginState.RUNNING);
          const account = accounts[item.id];
          await tryRestore(account as AuthSavedLoggedInAccount | AuthLoggedAccount);
          setLoadingState(LoginState.DONE);
        } catch (e) {
          setLoadingState(LoginState.IDLE);
          console.error(e);
          redirect(item);
        }
      } else {
        redirect(item);
      }
    },
    [accounts, loadingState, navigation, tryRestore],
  );

  const onDeleteItem = React.useCallback(
    async (item: (typeof data)[0], index: number) => {
      try {
        trackingAccountEvents.deleteAccountFromManageAccounts();
        const account = accounts[item.user.id];
        await tryRemoveAccount(account);
        accountListRef.current?.dismiss();
        toast.showSuccess(I18n.get('auth-accountlist-delete-success'));
      } catch (e) {
        console.error(e);
      }
    },
    [accounts, tryRemoveAccount],
  );

  const onAddAccount = React.useCallback(async () => navigation.navigate(authRouteNames.addAccountModal, {}), [navigation]);

  const keyExtractor: FlatListProps<(typeof dataforList)[0]>['keyExtractor'] = React.useCallback(
    (item: (typeof dataforList)[0]) => item.id,
    [],
  );

  return (
    <PageView style={styles.page}>
      <View style={styles.topContainer}>
        <Svg name="multi-account" width={getScaleWidth(130)} height={getScaleWidth(130)} />
        <View style={styles.textContainer}>
          <HeadingXSText>{I18n.get('auth-accountselection-heading')}</HeadingXSText>
          <SmallText style={styles.description}>{I18n.get('auth-accountselection-description')}</SmallText>
        </View>
        <LargeHorizontalUserList
          keyExtractor={keyExtractor}
          data={dataforList}
          onItemPress={onItemPress}
          ListFooterComponent={
            data.length === 1 ? (
              <TouchableOpacity onPress={onAddAccount} style={styles.addAccount}>
                <View style={styles.addAccountRound}>
                  <Svg name="ui-plus" fill={theme.palette.primary.regular} height={getScaleWidth(48)} width={getScaleWidth(48)} />
                </View>
                <SmallBoldText style={styles.addAccountText}>{I18n.get('auth-accountbutton-add')}</SmallBoldText>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>
      {loadingState !== LoginState.IDLE ? <Loading /> : null}
      <View style={styles.bottomContainer}>
        <SecondaryButton
          style={styles.button}
          text={I18n.get('auth-accountselection-button')}
          iconLeft="ui-settings"
          action={onHandleAccounts}
        />
        <HandleAccountList ref={accountListRef} data={data} onDelete={onDeleteItem} />
      </View>
    </PageView>
  );
};

export default connect(
  state => ({
    accounts: getAuthState(state).accounts,
    lastDeletedAccount: getAuthState(state).lastDeletedAccount,
  }),
  dispatch =>
    bindActionCreators<AuthAccountSelectionScreenDispatchProps>(
      {
        tryRemoveAccount: handleAction(removeAccountAction),
        tryRestore: tryAction(restoreAccountAction, {
          track: track.loginRestore,
        }),
      },
      dispatch,
    ),
)(AccountSelectionScreen);
