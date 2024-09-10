/* eslint-disable react/jsx-max-depth */
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import inAppMessaging from '@react-native-firebase/in-app-messaging';
import * as React from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as RNLocalize from 'react-native-localize';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import AppModules from '~/app/modules';
import { UI_STYLES } from '~/framework/components/constants';
import Navigation from '~/framework/navigation/RootNavigator';
import { reducer as navigationReducer } from '~/framework/navigation/redux';
import appConf from '~/framework/util/appConf';
import { getCurrentBadgeValue, setCurrentBadgeValue } from '~/framework/util/badge';
import { isEmpty } from '~/framework/util/object';
import { Trackers } from '~/framework/util/tracker';
import { ZendeskProvider } from '~/framework/util/zendesk';
import { AllModulesBackup } from '~/infra/oauth';
import connectionTrackerReducer from '~/infra/reducers/connectionTracker';

import { I18n } from './i18n';
import { IStoreProp, Reducers, connectWithStore } from './store';

function useAppState() {
  const [currentLocale, setCurrentLocale] = React.useState(I18n.getLanguage());
  const currentState = React.useRef<AppStateStatus>();
  const handleAppStateChange = React.useCallback(
    (nextAppState: AppStateStatus) => {
      currentState.current = nextAppState;
      if (nextAppState === 'active') {
        // Track foreground state
        Trackers.trackDebugEvent('Application', 'DISPLAY');
        // Change locale if needed
        const locales = RNLocalize.getLocales();
        const newLocale = isEmpty(locales) ? null : locales[0].languageCode;
        I18n.setLanguage().then(lng => {
          if (newLocale !== currentLocale) setCurrentLocale(lng);
        });
        // Reset badge value
        setCurrentBadgeValue(0);
      } else if (nextAppState === 'background') {
        // Track background state
      }
    },
    [currentLocale],
  );
  React.useEffect(() => {
    const appStateListener = AppState.addEventListener('change', handleAppStateChange);
    // Reset badge value
    setCurrentBadgeValue(0);
    return () => {
      appStateListener.remove();
    };
  }, [handleAppStateChange]);
  return currentState;
}

function useTrackers() {
  React.useEffect(() => {
    Trackers.init().then(() => {
      Trackers.trackDebugEvent('Application', '');
      Trackers.setCustomDimension(4, 'App Name', DeviceInfo.getApplicationName());
    });
  }, []);
}

interface AppProps extends IStoreProp {}

function App(props: AppProps) {
  const currentState = useAppState();

  const onRemoteNotification =
    Platform.OS === 'ios'
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useCallback(notification => {
          const isClicked = notification.getData().userInteraction === 1;
          if (isClicked || currentState.current === 'active') {
            setCurrentBadgeValue(0);
          } else {
            setCurrentBadgeValue(getCurrentBadgeValue() + 1);
          }
          // Use the appropriate result based on what you needed to do for this notification
          const result = PushNotificationIOS.FetchResult.NoData;
          notification.finish(result);
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
      : undefined;

  useTrackers();

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const type = 'notification';
    PushNotificationIOS.addEventListener(type, onRemoteNotification!);
    inAppMessaging().setMessagesDisplaySuppressed(true).finally();
    return () => {
      if (Platform.OS !== 'ios') return;
      PushNotificationIOS.removeEventListener(type);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = (
    <GestureHandlerRootView style={UI_STYLES.flex1}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <Provider store={props.store}>
          <BottomSheetModalProvider>
            <Navigation />
          </BottomSheetModalProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
  return appConf.zendeskEnabled ? <ZendeskProvider zendeskConfig={appConf.zendesk!}>{content}</ZendeskProvider> : <>{content}</>;
}

// Hack to generate scopes without circular deps. ToDo: fix it !
AllModulesBackup.value = AppModules();

// Hack : Flatten reducers to prevent misordring of module execution
Reducers.register('startup', navigationReducer);
Reducers.register('connectionTracker', connectionTrackerReducer);

export default connectWithStore(App);
