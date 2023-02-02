import * as React from 'react';
import { StatusBar, TouchableOpacity, View } from 'react-native';
import VideoPlayer from 'react-native-media-console';
import Orientation, { LANDSCAPE, PORTRAIT, useOrientationChange } from 'react-native-orientation-locker';
import WebView from 'react-native-webview';

import theme from '~/app/theme';
import { PageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';

import styles from './styles';
import { MediaPlayerProps, MediaType } from './types';

export default function MediaPlayer(props: MediaPlayerProps) {
  const source = props.navigation.getParam('source');
  const type = props.navigation.getParam('type');

  const [orientation, setOrientation] = React.useState(PORTRAIT);
  const [vpControlTimeoutDelay, setVPControlTimeoutDelay] = React.useState(type === MediaType.AUDIO ? 999999 : 3000);

  React.useEffect(() => {
    Orientation.unlockAllOrientations();
    StatusBar.setHidden(true);
  });

  useOrientationChange(current => {
    if (current.indexOf(LANDSCAPE) > -1) setOrientation(LANDSCAPE);
    else if (current.indexOf(PORTRAIT) > -1) setOrientation(PORTRAIT);
  });

  const onBack = () => {
    Orientation.lockToPortrait();
    StatusBar.setHidden(false);
    props.navigation.goBack();
  };

  const onVPEnd = () => {
    setVPControlTimeoutDelay(999999);
  };

  const styleOverlay = {
    height: orientation === PORTRAIT ? 80 : 60,
  };

  const getPlayer = () => {
    if (type !== MediaType.WEB)
      return (
        <VideoPlayer
          controlTimeoutDelay={vpControlTimeoutDelay}
          disableFullscreen
          disableVolume
          ignoreSilentSwitch="ignore"
          showOnStart
          showOnEnd
          source={source}
          onBack={onBack}
          onEnd={onVPEnd}
        />
      );

    return (
      <>
        <View style={[styles.back, styleOverlay]}>
          <TouchableOpacity onPress={onBack}>
            <NamedSVG height={24} width={24} name="ui-rafterLeft" fill={theme.palette.grey.white} />
          </TouchableOpacity>
        </View>
        <WebView
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          source={source}
          startInLoadingState
          style={orientation === LANDSCAPE ? styles.playerLandscape : styles.playerPortrait}
        />
      </>
    );
  };

  return (
    <PageView style={styles.page} showNetworkBar={false}>
      {getPlayer()}
    </PageView>
  );
}
