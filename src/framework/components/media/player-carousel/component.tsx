import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { AppState, Platform, StatusBar } from 'react-native';
import VideoPlayer from 'react-native-media-console';
import Orientation, { OrientationType, PORTRAIT, useDeviceOrientationChange } from 'react-native-orientation-locker';
import { connect } from 'react-redux';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyScreen } from '~/framework/components/empty-screens';
import FakeHeaderMedia from '~/framework/components/media/fake-header';
import { PageView } from '~/framework/components/page';
import { getSession } from '~/framework/modules/auth/reducer';

import styles from './styles';
import { MediaPlayerProps } from './types';

const ERRORS_I18N = {
  connection: ['mediaplayer-error-connection-title', 'mediaplayer-error-connection-text'],
  AVFoundationErrorDomain: ['mediaplayer-error-notsupported-title', 'mediaplayer-error-notsupported-text'],
  default: ['mediaplayer-error-content-title', 'mediaplayer-error-content-text'],
};

const DELAY_STATUS_HIDE = Platform.select({ ios: 250, default: 0 });

export const ANIMATION_AUDIO = require('ASSETS/animations/audio/disque.json');

function MediaPlayer(props: MediaPlayerProps) {
  const { connected, media } = props;

  const animationRef = React.useRef<LottieView>(null);

  const isAudio = media.type === 'audio';

  const [isPlaying, setIsPlaying] = React.useState(false);

  const [orientation, setOrientation] = React.useState(PORTRAIT);

  const isPortrait = React.useMemo(() => orientation === PORTRAIT, [orientation]);

  // Manage orientation

  const handleOrientationChange = React.useCallback(
    (newOrientation: OrientationType) => {
      const isPortraitOrLandscape = newOrientation.startsWith('LANDSCAPE') || newOrientation === PORTRAIT;
      if (isPortraitOrLandscape && newOrientation !== orientation) {
        setOrientation(newOrientation);
      }
    },
    [orientation],
  );

  useDeviceOrientationChange(handleOrientationChange);

  const isFocused = useIsFocused();

  React.useEffect(() => {
    // Unlock and handle orientation if needed
    if (isFocused && !isAudio) {
      Orientation.unlockAllOrientations();
      setTimeout(() => {
        Orientation.getDeviceOrientation(handleOrientationChange);
      });
    }
    // Lock to portrait when released
    return () => {
      Orientation.lockToPortrait();
    };
  }, [isAudio, isFocused, handleOrientationChange]);

  const [videoPlayerControlTimeoutDelay, setVideoPlayerControlTimeoutDelay] = React.useState(3000);

  const [error, setError] = React.useState<string | undefined>(undefined);
  const isLoadingRef = React.useRef<boolean>(true);

  // const setErrorMediaType = React.useCallback(() => {
  //   if (filetype === 'video/avi' || filetype === 'video/x-msvideo') {
  //     setError('AVFoundationErrorDomain');
  //     return false;
  //   }
  //   return true;
  // }, [filetype]);

  React.useEffect(() => {
    if (!connected) {
      setError('connection');
    } else {
      setError(undefined);
      // setErrorMediaType();
    }
  }, [connected /*, setErrorMediaType*/]);

  const handleVideoPlayerEnd = React.useCallback(() => {
    setVideoPlayerControlTimeoutDelay(999999);
  }, []);

  const renderError = () => {
    const i18nKeys = ERRORS_I18N[error ?? 'default'] ?? ERRORS_I18N.default;
    return (
      <>
        <FakeHeaderMedia />
        <EmptyScreen
          customStyle={styles.errorScreen}
          svgImage="image-not-found"
          title={I18n.get(i18nKeys[0])}
          text={I18n.get(i18nKeys[1])}
          svgFillColor={theme.palette.grey.fog}
          textColor={theme.palette.grey.fog}
        />
      </>
    );
  };

  const onError = React.useCallback((e: any) => {
    setError(e.error.domain);
  }, []);

  const onLoad = React.useCallback(() => {
    isLoadingRef.current = false;
  }, []);

  const onPlay = React.useCallback(() => {
    setIsPlaying(true);
    animationRef.current?.resume();
  }, []);

  const onPause = React.useCallback(() => {
    setIsPlaying(false);
    animationRef.current?.pause();
  }, []);

  const player = React.useMemo(() => {
    // if (type === MediaType.WEB)
    //   return (
    //     <>
    //       <FakeHeaderMedia />
    //       <WebView
    //         allowsInlineMediaPlayback
    //         mediaPlaybackRequiresUserAction={false}
    //         scrollEnabled={false}
    //         source={realSource}
    //         startInLoadingState
    //         style={isPortrait ? [styles.playerPortrait, styles.externalPlayerPortrait] : [styles.playerLandscape]}
    //         webviewDebuggingEnabled={__DEV__}
    //         onHttpError={() => setError('http error')}
    //         onError={() => setError('error')}
    //       />
    //     </>
    //   );
    // else {

    // navigation.setOptions({ headerLeft: () => <View /> });
    return (
      <VideoPlayer
        controlTimeoutDelay={videoPlayerControlTimeoutDelay}
        disableFullscreen
        disableVolume
        ignoreSilentSwitch="ignore"
        // onBack={handleBack}
        onEnd={handleVideoPlayerEnd}
        onError={onError}
        onLoad={onLoad}
        onPause={onPause}
        onPlay={onPlay}
        rewindTime={10}
        showDuration
        showOnStart
        showOnEnd
        paused
        disableBack
        source={media.src}
        videoStyle={isPortrait ? styles.playerPortrait : styles.playerLandscape}
        {...(isAudio
          ? {
              posterElement: <LottieView ref={animationRef} source={ANIMATION_AUDIO} style={styles.poster} speed={0.5} />,
            }
          : {})}
      />
    );
    // }
  }, [videoPlayerControlTimeoutDelay, handleVideoPlayerEnd, onError, onLoad, onPause, onPlay, media.src, isPortrait, isAudio]);

  // Manage Lottie after passed app in background
  React.useEffect(() => {
    if (media.type === 'audio') {
      const subscription = AppState.addEventListener('change', event => {
        if (event === 'active' && isPlaying) animationRef.current?.resume();
      });
      return () => subscription.remove();
    }
  }, [isPlaying, media.type]);

  // Manage Android back button
  // React.useEffect(() => {
  //   const backHandler = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
  //   return () => {
  //     backHandler.remove();
  //   };
  // }, [handleHardwareBack]);

  // force page to be 100% height of the screen
  const wrapperStyle = React.useMemo(
    () => [
      styles.page,
      {
        height: isPortrait ? UI_SIZES.screen.height : UI_SIZES.screen.width,
      },
    ],
    [isPortrait],
  );

  const [hideStatusBar, setHideStatusBar] = React.useState<boolean | undefined>(undefined);
  useFocusEffect(
    React.useCallback(() => {
      setTimeout(() => {
        setHideStatusBar(!error);
      }, DELAY_STATUS_HIDE);
    }, [error]),
  );
  React.useEffect(() => {
    if (hideStatusBar !== undefined) setHideStatusBar(!error);
  }, [error, hideStatusBar]);

  // Audience hook
  // useFocusEffect(
  //   React.useCallback(() => {
  //     if (route.params.referer) {
  //       markViewAudience(route.params.referer);
  //     }
  //   }, [route.params.referer]),
  // );

  return (
    <PageView style={wrapperStyle} showNetworkBar={false}>
      <StatusBar animated hidden={hideStatusBar ?? false} />
      {!error ? player : renderError()}
    </PageView>
  );
}

export default connect((state: any) => ({
  connected: !!state.connectionTracker.connected,
  session: getSession(),
}))(MediaPlayer);
