/**
 * All the logic needed for printing the snow flakes on screen
 */
import { useIsFocused } from '@react-navigation/native';
import * as React from 'react';
import { Animated } from 'react-native';
import Snow from 'react-native-snow-bg';
import { connect } from 'react-redux';

import { IGlobalState } from '~/app/store';
import { AuthActiveAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';

interface SnowFlakesReduxProps {
  session?: AuthActiveAccount;
  isXmasActivated?: boolean;
  isFlakesFalling: boolean;
}

const SnowFlakes = ({ session, isXmasActivated, isFlakesFalling }: SnowFlakesReduxProps) => {
  // Determine xmas theme setting here & if snow must be falling
  const [snowfall, setSnowfall] = React.useState(false);
  const [fadeAnim, setFadeAnim] = React.useState(new Animated.Value(1));
  const wasFlaskesFalling = React.useRef(false);

  // Pause and resume playback depending on app state
  // React.useEffect(() => {
  //   const subscription = AppState.addEventListener('change', event => {
  //     if (event === 'background') jingleBells.pause();
  //     if (event === 'active') {
  //       jingleBells.getCurrentTime(currentTime => {
  //         if (currentTime > 0) jingleBells.play();
  //       });
  //     }
  //   });
  //   return () => subscription.remove();
  // }, []);

  const getShouldSnowFall = React.useCallback(
    async (fadeAnimation: Animated.Value) => {
      // Check to let it snow / stop snow
      if (isFlakesFalling && !wasFlaskesFalling.current) {
        setSnowfall(true);
        setFadeAnim(new Animated.Value(1));
        wasFlaskesFalling.current = true;
      } else if (!isFlakesFalling && wasFlaskesFalling.current) {
        // stop snow if needed without condition
        wasFlaskesFalling.current = false;
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }).start(() => {
          if (!wasFlaskesFalling.current) {
            setSnowfall(false);
            setFadeAnim(new Animated.Value(1));
          }
        });
      }
    },
    [isFlakesFalling],
  );
  React.useEffect(() => {
    getShouldSnowFall(fadeAnim);
    // We want to control whenever this check re-run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isXmasActivated, isFlakesFalling]);

  const isFocused = useIsFocused();
  const snowStyle = React.useMemo(() => ({ position: 'absolute' as const, opacity: fadeAnim }), [fadeAnim]);
  const isSnowEligible = isXmasActivated && isFocused && session?.user?.id; // No session, no flakes !

  return snowfall && isSnowEligible ? (
    <Animated.View style={snowStyle}>
      <Snow fullScreen snowflakesCount={150} fallSpeed="medium" />
    </Animated.View>
  ) : null;
};

const SnowFlakesConnected = connect((state: IGlobalState) => ({
  session: getSession(),
  isXmasActivated: state.user.xmasTheme,
  isFlakesFalling: state.user.flakesFalling,
}))(SnowFlakes);

export default connect((state: IGlobalState) => ({
  session: getSession(),
  isXmasActivated: state.user.xmasTheme,
}))(({ isXmasActivated, session }: { isXmasActivated?: boolean; session?: AuthActiveAccount }) => {
  return session?.user?.id ? <SnowFlakesConnected key={isXmasActivated ? isXmasActivated.toString() : 'undefined'} /> : null;
});
