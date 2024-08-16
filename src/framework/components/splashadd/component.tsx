import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';

import theme from '~/app/theme';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import WebView from '~/framework/components/webview';
import { navigate } from '~/framework/navigation/helper';
import { IModalsNavigationParams, ModalsRouteNames } from '~/framework/navigation/modals';
import { navBarOptions } from '~/framework/navigation/navBar';
import { openUrl } from '~/framework/util/linking';
import { urlSigner } from '~/infra/oauth';

import styles from './styles';
import { SplashaddScreenProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<IModalsNavigationParams, typeof ModalsRouteNames.SplashAdd>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: '',
  }),
  headerStyle: {
    backgroundColor: theme.palette.grey.white,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerShadowVisible: false,
});

const SplashaddScreen = (props: SplashaddScreenProps) => {
  const { route } = props;
  const source = route.params.resourceUri;

  const [isTimeout, setIsTimeout] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const firstLoadRef = React.useRef(true);

  const onLoad = React.useCallback(() => {
    firstLoadRef.current = false;
  }, []);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isLoaded) {
        setIsTimeout(true);
      }
    }, 20000);

    return () => clearTimeout(timeoutId);
  }, [isLoaded]);

  const onShouldStartLoadWithRequest = React.useCallback(request => {
    if (firstLoadRef.current) return true;

    openUrl(request.url);
    return false;
  }, []);

  const onLoadEnd = () => {
    setIsLoaded(true);
  };

  return isTimeout ? (
    <EmptyConnectionScreen />
  ) : (
    <WebView
      javaScriptEnabled
      scalesPageToFit
      setSupportMultipleWindows={false}
      showsHorizontalScrollIndicator={false}
      source={{ uri: urlSigner.getAbsoluteUrl(source)! }}
      startInLoadingState
      style={styles.splashadd}
      webviewDebuggingEnabled={__DEV__}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      onLoadEnd={onLoadEnd}
      bounces={false}
      onLoad={onLoad}
    />
  );
};

export default SplashaddScreen;

export function openSplashaddScreen(navParams: IModalsNavigationParams[ModalsRouteNames.SplashAdd]) {
  navigate(ModalsRouteNames.SplashAdd, navParams);
}
