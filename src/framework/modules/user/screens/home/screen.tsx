import { useHeaderHeight } from '@react-navigation/elements';
import { CommonActions, NavigationProp, useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert, ImageURISource, TouchableOpacity, View } from 'react-native';
import RNConfigReader from 'react-native-config-reader';
import DeviceInfo from 'react-native-device-info';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import DefaultButton from '~/framework/components/buttons/default';
import { ButtonLineGroup, LineButton } from '~/framework/components/buttons/line';
import SecondaryButton from '~/framework/components/buttons/secondary';
import { UI_SIZES, UI_STYLES } from '~/framework/components/constants';
import { BottomSheetModalMethods } from '~/framework/components/modals/bottom-sheet';
import { PageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';
import ScrollView from '~/framework/components/scrollView';
import { HeadingSText, HeadingXSText, SmallBoldText } from '~/framework/components/text';
import { default as Toast, default as toast } from '~/framework/components/toast';
import { manualLogoutAction, removeAccountAction, switchAccountAction } from '~/framework/modules/auth/actions';
import {
  AccountType,
  AuthLoggedAccount,
  AuthSavedLoggedInAccount,
  InitialAuthenticationMethod,
  PlatformAuthContext,
  accountIsLoggable,
  getOrderedAccounts,
} from '~/framework/modules/auth/model';
import { userCanAddAccount } from '~/framework/modules/auth/model/business';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { getNavActionForAccountSwitch, navigationDispatchMultiple } from '~/framework/modules/auth/navigation/main-account/router';
import { assertSession, getState as getAuthState, getSession } from '~/framework/modules/auth/reducer';
import { AuthChangeEmailScreenNavParams } from '~/framework/modules/auth/screens/change-email/types';
import { AuthChangeMobileScreenNavParams } from '~/framework/modules/auth/screens/change-mobile/types';
import { LoginState } from '~/framework/modules/auth/screens/main-account/account-selection/types';
import { AuthMFAScreenNavParams } from '~/framework/modules/auth/screens/mfa/types';
import { getAuthContext, getMFAValidationInfos, getUserRequirements } from '~/framework/modules/auth/service';
import { ChangePasswordScreenNavParams } from '~/framework/modules/auth/templates/change-password/types';
import track, { trackingAccountEvents } from '~/framework/modules/auth/tracking';
import { showSplashadsOnUserScreen } from '~/framework/modules/splashads';
import { readSplashadsData } from '~/framework/modules/splashads/storage';
import { isWithinXmasPeriod } from '~/framework/modules/user/actions';
import ChangeAccountList from '~/framework/modules/user/components/account-list/change';
import BottomRoundDecoration from '~/framework/modules/user/components/bottom-round-decoration';
import AddAccountButton from '~/framework/modules/user/components/buttons/add-account';
import ChangeAccountButton from '~/framework/modules/user/components/buttons/change-account';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { ModalsRouteNames } from '~/framework/navigation/modals';
import { navBarOptions } from '~/framework/navigation/navBar';
import appConf from '~/framework/util/appConf';
import { formatSource } from '~/framework/util/media';
import { handleAction, tryAction } from '~/framework/util/redux/actions';
import { useZendesk } from '~/framework/util/zendesk';
import { OAuth2RessourceOwnerPasswordClient } from '~/infra/oauth';
import Avatar, { Size } from '~/ui/avatars/Avatar';

import styles from './styles';
import { ModificationType, UserHomeScreenDispatchProps, UserHomeScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-profile-myaccount'),
    titleTestID: 'account-title',
  }),
  headerShadowVisible: false,
});

/**
 * Setup a fancy navBar decoration feature
 * That consists of adding a svg as a background that scroll with the page content
 * @returns the React Element of the decoration
 */
function useCurvedNavBarFeature() {
  const navBarHeight = useHeaderHeight() - UI_SIZES.screen.topInset;
  // SVG size management
  const svgDisplayWidth = UI_SIZES.screen.width;
  const svgDisplayHeight = Math.ceil(
    svgDisplayWidth * (useCurvedNavBarFeature.svgOriginalHeight / useCurvedNavBarFeature.svgOriginalWidth),
  );
  const svgDisplayTopOffset =
    Math.ceil(navBarHeight * (svgDisplayWidth / useCurvedNavBarFeature.svgOriginalWidth)) -
    svgDisplayHeight +
    UI_SIZES.elements.statusbarHeight;
  // SVG size management
  return React.useMemo(() => {
    return (
      <NamedSVG
        width={svgDisplayWidth}
        height={svgDisplayHeight}
        style={[styles.navBarSvgDecoration, { top: svgDisplayTopOffset }]}
        fill={theme.palette.primary.regular}
        name="userpage-header"
      />
    );
  }, [svgDisplayHeight, svgDisplayTopOffset, svgDisplayWidth]);
}

useCurvedNavBarFeature.svgOriginalWidth = 375;
useCurvedNavBarFeature.svgOriginalHeight = 545;
useCurvedNavBarFeature.svgDisplayTopOffsetTolerance = 2;

/**
 * Setup a big avatar that acts as a button to Profile Page
 * @returns the React Element of the avatar button
 */
function useProfileAvatarFeature(session: UserHomeScreenPrivateProps['session']) {
  const userProfilePicture = React.useMemo(() => {
    const uri = session?.platform && session?.user.avatar ? new URL(session.user.avatar, session.platform.url) : undefined;
    if (uri) {
      const uti = OAuth2RessourceOwnerPasswordClient.connection?.getUniqueSessionIdentifier();
      if (uti) uri.searchParams.append('uti', uti);
    }
    return (
      uri &&
      ({
        ...formatSource(uri.href),
      } as ImageURISource)
    );
  }, [session?.platform, session?.user.avatar]);
  const navigation = useNavigation<NavigationProp<UserNavigationParams>>();
  return React.useMemo(() => {
    return !userProfilePicture ? (
      <TouchableOpacity onPress={() => navigation.navigate(userRouteNames.profile, {})}>
        <Avatar sourceOrId={userProfilePicture} size={Size.xxl} id="" testID="account-user-image" />
      </TouchableOpacity>
    ) : (
      <Avatar sourceOrId={userProfilePicture} size={Size.xxl} id="" testID="account-user-image" />
    );
  }, [navigation, userProfilePicture]);
}

/**
 * Setup the menu for Profile section of Account screen
 * @param session
 * @returns the React Element of the menu
 */
function useProfileMenuFeature(session: UserHomeScreenPrivateProps['session']) {
  const navigation = useNavigation<NavigationProp<UserNavigationParams>>();
  return React.useMemo(
    () => (
      <>
        <HeadingXSText style={styles.userInfoName} testID="account-username">
          {session?.user.displayName}
        </HeadingXSText>
        <SmallBoldText style={{ color: theme.color.profileTypes[session?.user.type!] }} testID="account-profil-type">
          {I18n.get(`user-profiletypes-${session?.user.type}`.toLowerCase())}
        </SmallBoldText>
        <SecondaryButton
          text={I18n.get('user-page-userfilebutton')}
          action={() => {
            navigation.navigate(userRouteNames.profile, {});
          }}
          style={styles.userInfoButton}
          testID="account-see-profil"
        />
      </>
    ),
    [navigation, session?.user.displayName, session?.user.type],
  );
}

/**
 * Setup the menu for Account screen
 * @param session
 * @returns the React Element of the menus
 */
function useAccountMenuFeature(session: UserHomeScreenPrivateProps['session'], focusedRef: React.MutableRefObject<boolean>) {
  const navigation = useNavigation<NavigationProp<UserNavigationParams>>();
  const [currentLoadingMenu, setCurrentLoadingMenu] = React.useState<ModificationType | undefined>(undefined);
  const authContextRef = React.useRef<PlatformAuthContext | undefined>(undefined);

  const fetchAuthContext = React.useCallback(async () => {
    if (!session) return;
    if (!authContextRef.current) authContextRef.current = await getAuthContext(session.platform);
    return authContextRef.current;
  }, [session]);

  const fetchMFAValidationInfos = React.useCallback(async () => {
    const requirements = await getUserRequirements(session?.platform!);
    const needMfa = requirements?.needMfa;
    if (needMfa) await getMFAValidationInfos();
    return needMfa;
  }, [session]);

  const editUserInformation = React.useCallback(
    async (modificationType: ModificationType) => {
      try {
        setCurrentLoadingMenu(modificationType);
        if (!(await fetchAuthContext())) throw new global.Error('No session');
        let needMfa: undefined | boolean;
        if (modificationType !== ModificationType.PASSWORD) needMfa = await fetchMFAValidationInfos();
        const routeNames = {
          [ModificationType.EMAIL]: authRouteNames.changeEmail,
          [ModificationType.MOBILE]: authRouteNames.changeMobile,
          [ModificationType.PASSWORD]: authRouteNames.changePasswordModal,
        };
        let routeName = routeNames[modificationType];
        const params = {
          [ModificationType.EMAIL]: {
            navBarTitle: I18n.get('user-page-editemail'),
            modificationType: ModificationType.EMAIL,
            platform: session?.platform,
          } as AuthMFAScreenNavParams | AuthChangeEmailScreenNavParams,
          [ModificationType.MOBILE]: {
            navBarTitle: I18n.get('user-page-editmobile'),
            modificationType: ModificationType.MOBILE,
            platform: session?.platform,
          } as AuthMFAScreenNavParams | AuthChangeMobileScreenNavParams,
          [ModificationType.PASSWORD]: {
            platform: session?.platform,
            context: authContextRef?.current,
            credentials: { username: session?.user.loginUsed ?? session?.user.login },
            navCallback: CommonActions.goBack(),
          } as ChangePasswordScreenNavParams,
        };
        const routeParams = params[modificationType];
        if (needMfa) {
          (routeParams as AuthMFAScreenNavParams).mfaRedirectionRoute = routeName;
          routeName = authRouteNames.mfaModal;
        }
        setCurrentLoadingMenu(undefined);
        if (focusedRef.current) navigation.navigate(routeName, routeParams);
      } catch {
        setCurrentLoadingMenu(undefined);
        Toast.showError(I18n.get('user-page-error-text'));
      }
    },
    [
      fetchAuthContext,
      fetchMFAValidationInfos,
      focusedRef,
      navigation,
      session?.platform,
      session?.user.login,
      session?.user.loginUsed,
    ],
  );

  const canEditPersonalInfo = session?.user.type !== AccountType.Student;
  const isFederated = session?.method === InitialAuthenticationMethod.WAYF_SAML;
  const showWhoAreWe = session?.platform.showWhoAreWe;

  const splashads = readSplashadsData();
  //
  // Zendesk stuff
  //
  const showHelpCenter = appConf.zendeskHelpCenterEnabled;
  const zendesk = useZendesk();

  const loadHealthCheck = React.useCallback(async () => {
    try {
      const healthCheckResult = await zendesk?.healthCheck();
      console.debug('Zendesk health check: ', healthCheckResult);
    } catch (error) {
      Toast.showError(`Zendesk health check error: ${(error as Error).message}`);
    }
  }, [zendesk]);

  React.useEffect(() => {
    if (showHelpCenter)
      try {
        loadHealthCheck();
        zendesk?.changeTheme(theme.palette.primary.regular as string);
        zendesk?.setAnonymousIdentity({
          email: 'mobile@edifice.io',
          name: 'Edifice Mobile',
        });
        zendesk?.setHelpCenterLocaleOverride('fr');
      } catch (error) {
        Toast.showError(`Zendesk initialisation failed: ${(error as Error).message}`);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openHelpCenter = async () => {
    if (showHelpCenter)
      try {
        await zendesk?.openHelpCenter({
          labels: [],
          groupType: 'section',
          groupIds: appConf.zendeskSections!,
          showContactOptions: false,
        });
      } catch (error) {
        Toast.showError(`Error opening Zendesk help center: ${(error as Error).message}`);
      }
  };

  //
  // Show User Home Screen
  //

  return React.useMemo(
    () => (
      <>
        <View style={styles.section}>
          <HeadingSText style={styles.sectionTitle} testID="account-configuration">
            {I18n.get('user-page-configuration')}
          </HeadingSText>
          <ButtonLineGroup>
            <LineButton
              title={I18n.get('user-pushnotifssettings-title')}
              onPress={() => {
                navigation.navigate(userRouteNames.notifPrefs, {});
              }}
              icon="ui-notif"
              testID="account-notifications"
            />
            {!isFederated ? (
              <LineButton
                loading={currentLoadingMenu === ModificationType.PASSWORD}
                disabled={!!currentLoadingMenu}
                title={I18n.get('user-page-editpassword')}
                onPress={() => editUserInformation(ModificationType.PASSWORD)}
                icon="ui-lock"
                testID="account-change-password"
              />
            ) : null}
            {canEditPersonalInfo ? (
              <>
                <LineButton
                  loading={currentLoadingMenu === ModificationType.EMAIL}
                  disabled={!!currentLoadingMenu}
                  title={I18n.get('user-page-editemail')}
                  onPress={() => editUserInformation(ModificationType.EMAIL)}
                  icon="ui-mail"
                  testID="account-change-email"
                />
                <LineButton
                  loading={currentLoadingMenu === ModificationType.MOBILE}
                  disabled={!!currentLoadingMenu}
                  title={I18n.get('user-page-editmobile')}
                  onPress={() => editUserInformation(ModificationType.MOBILE)}
                  icon="ui-smartphone"
                  testID="account-change-phone"
                />
              </>
            ) : null}
            <LineButton
              disabled={!!currentLoadingMenu}
              title={I18n.get('user-page-editlang')}
              onPress={() => navigation.navigate(userRouteNames.lang, {})}
              icon="ui-globe"
              testID="account-change-language"
            />
            {isWithinXmasPeriod ? (
              <LineButton
                title={I18n.get('user-xmas-title')}
                onPress={() => {
                  navigation.navigate(userRouteNames.xmas, {});
                }}
                icon="ui-christmas"
              />
            ) : null}
          </ButtonLineGroup>
        </View>
        <View style={[styles.section, styles.sectionLast]}>
          <HeadingSText style={styles.sectionTitle} testID="account-others">
            {I18n.get('user-page-others')}
          </HeadingSText>
          <ButtonLineGroup>
            {showHelpCenter ? (
              <LineButton
                title={I18n.get('user-help-title')}
                onPress={() => {
                  openHelpCenter();
                }}
                icon="ui-question"
                testID="account-help"
              />
            ) : null}
            {showWhoAreWe ? (
              <LineButton
                title={I18n.get('user-whoarewe-title')}
                onPress={() => {
                  navigation.navigate(userRouteNames.whoAreWe, {});
                }}
                icon="ui-edifice"
                testID="account-who-are-we"
              />
            ) : null}
            {showSplashadsOnUserScreen(session!) ? (
              <LineButton
                title={I18n.get('user-page-splashads')}
                onPress={() => {
                  navigation.navigate(ModalsRouteNames.SplashAds, {
                    resourceUri: splashads[session?.platform.name!] ? splashads[session?.platform.name!].url : '',
                  });
                }}
                icon="ui-megaphone"
              />
            ) : null}
            <LineButton
              title={I18n.get('user-legalnotice-title')}
              onPress={() => {
                navigation.navigate(userRouteNames.legalNotice, {});
              }}
              icon="ui-checklist"
              testID="account-legal"
            />
          </ButtonLineGroup>
        </View>
      </>
    ),
    [
      isFederated,
      currentLoadingMenu,
      canEditPersonalInfo,
      showHelpCenter,
      showWhoAreWe,
      session,
      navigation,
      editUserInformation,
      openHelpCenter,
      splashads,
    ],
  );
}

/**
 * Setup an Accounts button feature that opens up an account list
 * @param session
 * @param accountListRef
 * @returns the React Elements of the account button and list
 */
function useAccountsFeature(
  session: UserHomeScreenPrivateProps['session'],
  accounts: UserHomeScreenPrivateProps['accounts'],
  trySwitch: UserHomeScreenPrivateProps['trySwitch'],
  tryRemoveAccount: UserHomeScreenPrivateProps['tryRemoveAccount'],
) {
  const accountListRef = React.useRef<BottomSheetModalMethods>(null);
  const accountsArray = React.useMemo(() => Object.values(accounts), [accounts]);
  const canManageAccounts = userCanAddAccount(session);
  const navigation = useNavigation<NavigationProp<UserNavigationParams & AuthNavigationParams>>();
  const showAccountList = React.useCallback(() => {
    trackingAccountEvents.switchAccountPressButton();
    accountListRef.current?.present();
  }, [accountListRef]);
  const addAccount = React.useCallback(() => {
    navigation.navigate(authRouteNames.addAccountModal, {});
  }, [navigation]);

  const [loadingState, setLoadingState] = React.useState<LoginState>(LoginState.IDLE);

  const data = React.useMemo(() => getOrderedAccounts(accounts), [accounts]);

  const onPressItem = React.useCallback(
    async (item: (typeof data)[0], index: number) => {
      const activeSession = assertSession();
      // await authService.removeFirebaseToken(account.platform);
      accountListRef.current?.dismiss();

      if (activeSession.user.id === item.user.id) return;

      const redirect = (i: typeof item) => {
        const navAction = getNavActionForAccountSwitch(i);
        if (!navAction) {
          console.warn('AccountSelectionScreen: Missing platform for this account');
          toast.showError(I18n.get('auth-account-select-error'));
          return;
        }
        navigationDispatchMultiple(navigation, navAction);
      };
      if (loadingState !== LoginState.IDLE) return;
      if (accountIsLoggable(item)) {
        try {
          setLoadingState(LoginState.RUNNING);
          const account = accounts[item.user.id];
          await trySwitch(account as AuthSavedLoggedInAccount | AuthLoggedAccount);
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
    [accounts, loadingState, navigation, trySwitch],
  );

  const onDeleteItem = React.useCallback(
    async (item: (typeof data)[0], index: number) => {
      try {
        trackingAccountEvents.deleteAccountFromSwitchAccount();
        const account = accounts[item.user.id];
        await tryRemoveAccount(account);
        if (session?.user.id !== item.user.id) toast.showSuccess(I18n.get('auth-accountlist-delete-success'));
      } catch (e) {
        console.error(e);
      }
    },
    [accounts, session?.user.id, tryRemoveAccount],
  );

  return React.useMemo(() => {
    return canManageAccounts && accountsArray.length === 1 ? (
      <AddAccountButton action={addAccount} style={styles.accountButton} testID="account-add-account" />
    ) : accountsArray.length > 1 ? (
      <>
        <ChangeAccountButton action={showAccountList} style={styles.accountButton} />
        <ChangeAccountList ref={accountListRef} data={data} onPress={onPressItem} onDelete={onDeleteItem} />
      </>
    ) : null;
  }, [canManageAccounts, accountsArray, addAccount, showAccountList, data, onPressItem, onDeleteItem]);
}

/**
 * Setup a Logout button feature
 * @param handleLogout a callback supposed to log the user out.
 * @returns the React Element of the logout button
 */
function useLogoutFeature(handleLogout: UserHomeScreenPrivateProps['handleLogout']) {
  /**
   * Displays an Alert to the user that allows logging out
   * Caution: Alert callbacks eats any exception thrown silently.
   */
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const logout = React.useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await handleLogout();
    } catch {
      Toast.showError(I18n.get('user-page-error-text'));
    } finally {
      setIsLoggingOut(false);
    }
  }, [handleLogout]);
  const doLogout = React.useCallback(() => {
    Alert.alert('', I18n.get('auth-disconnect-confirm'), [
      {
        text: I18n.get('common-cancel'),
        style: 'default',
      },
      {
        text: I18n.get('user-page-disconnect'),
        style: 'destructive',
        onPress: logout,
      },
    ]);
  }, [logout]);
  /**
   * renders the logout button
   */
  return React.useMemo(() => {
    return (
      <DefaultButton
        text={I18n.get('user-page-disconnect')}
        contentColor={theme.palette.status.failure.regular}
        action={doLogout}
        loading={isLoggingOut}
        iconLeft="ui-logout"
        testID="account-logout"
      />
    );
  }, [doLogout, isLoggingOut]);
}

/**
 * Setup a version details feature.
 * @returns the React Element of the version details text
 */
function useVersionDetailsFeature(session: UserHomeScreenPrivateProps['session'], debugVisible: boolean) {
  const currentPlatform = session?.platform.displayName;
  const navigation = useNavigation<NavigationProp<UserNavigationParams>>();
  return React.useMemo(() => {
    if (debugVisible)
      return (
        <>
          <SmallBoldText style={styles.version}>
            {`${useVersionDetailsFeature.versionType} (${useVersionDetailsFeature.buildNumber}) – ${useVersionDetailsFeature.versionOverride} – ${currentPlatform} - ${useVersionDetailsFeature.os} ${useVersionDetailsFeature.osVersion} - ${useVersionDetailsFeature.deviceModel}`}
          </SmallBoldText>
          {appConf.isDebugEnabled ? (
            <>
              <View style={styles.section}>
                <HeadingSText style={styles.sectionTitle}>Debug</HeadingSText>
                <ButtonLineGroup>
                  <LineButton
                    title="Network Log"
                    icon="ui-print"
                    onPress={() => {
                      navigation.navigate(userRouteNames.network, {});
                    }}
                  />
                  <LineButton
                    title="Debug Log"
                    icon="ui-print"
                    onPress={() => {
                      navigation.navigate(userRouteNames.log, {});
                    }}
                  />
                </ButtonLineGroup>
              </View>
            </>
          ) : null}
        </>
      );
    return null;
  }, [currentPlatform, debugVisible, navigation]);
}

/**
 * Setup a version number feature that can secretly display detailed information when long pressed.
 * @returns the React Element of the touchable version text
 */
function useVersionFeature(setDebugVisible, scrollViewRef) {
  /**
   * When true, additional information is displayed above (build/platform/override)
   */
  const toggleVersionDetails = React.useCallback(() => {
    setDebugVisible(oldState => !oldState);
    // setTimeout is used to wait for the ScrollView height to update (after details are shown).
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd();
    }, 0);
  }, [scrollViewRef, setDebugVisible]);
  return React.useMemo(() => {
    return (
      <TouchableOpacity onLongPress={toggleVersionDetails}>
        <SmallBoldText style={styles.version} testID="account-version-number">
          {I18n.get('user-page-versionnumber')} {useVersionFeature.versionNumber}
        </SmallBoldText>
      </TouchableOpacity>
    );
  }, [toggleVersionDetails]);
}

// All these values are compile-time constants. So we decalre them as function statics.
useVersionDetailsFeature.buildNumber = DeviceInfo.getBuildNumber();
useVersionDetailsFeature.deviceModel = DeviceInfo.getModel();
useVersionDetailsFeature.os = DeviceInfo.getSystemName();
useVersionDetailsFeature.osVersion = DeviceInfo.getSystemVersion();
useVersionDetailsFeature.versionType = RNConfigReader.BundleVersionType as string;
useVersionDetailsFeature.versionOverride = RNConfigReader.BundleVersionOverride as string;
useVersionFeature.versionNumber = DeviceInfo.getVersion();

/**
 * UserHomeScreen component
 * @param props
 * @returns
 */
function UserHomeScreen(props: UserHomeScreenPrivateProps) {
  const [debugVisible, setDebugVisible] = React.useState<boolean>(false);
  const { handleLogout, trySwitch, tryRemoveAccount, session, accounts } = props;

  const scrollViewRef = React.useRef(null);
  // Manages focus to send to others features in this screen.
  // We must store it in a Ref because of async operations.
  const focusedRef = React.useRef(useIsFocused());

  useFocusEffect(
    React.useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, []),
  );

  const navBarDecoration = useCurvedNavBarFeature();
  const avatarButton = useProfileAvatarFeature(session);
  const profileMenu = useProfileMenuFeature(session);
  const accountMenu = useAccountMenuFeature(session, focusedRef);
  const accountsButton = useAccountsFeature(session, accounts, trySwitch, tryRemoveAccount);
  const logoutButton = useLogoutFeature(handleLogout);
  const versionDetails = useVersionDetailsFeature(session, debugVisible);
  const versionButton = useVersionFeature(setDebugVisible, scrollViewRef);

  return (
    <PageView style={styles.page} showNetworkBar={false}>
      <ScrollView
        ref={scrollViewRef}
        style={UI_STYLES.flex1}
        bottomInset={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}>
        <View style={styles.sectionUserInfo}>
          {navBarDecoration}
          {avatarButton}
          {profileMenu}
        </View>
        {accountMenu}
        <View style={styles.sectionBottom}>
          {accountsButton}
          {logoutButton}
          {versionDetails}
          <BottomRoundDecoration style={styles.bottomRoundDecoration} child={versionButton} />
        </View>
      </ScrollView>
    </PageView>
  );
}

export default connect(
  (state: IGlobalState) => {
    return {
      session: getSession(),
      accounts: getAuthState(state).accounts,
    };
  },
  dispatch =>
    bindActionCreators<UserHomeScreenDispatchProps>(
      {
        handleLogout: handleAction(manualLogoutAction, { track: track.logout }),
        trySwitch: tryAction(switchAccountAction, {
          track: track.loginRestore,
        }),
        tryRemoveAccount: handleAction(removeAccountAction),
      },
      dispatch,
    ),
)(UserHomeScreen);
