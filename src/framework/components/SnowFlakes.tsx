/**
 * All the logic needed for printing the snow flakes on screen
 */
import * as React from 'react';
import { Animated, AppState } from 'react-native';

import { useIsFocused } from '@react-navigation/native';
import Snow from 'react-native-snow-bg';
import { connect } from 'react-redux';

import { IGlobalState } from '~/app/store';
import { AuthActiveAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { jingleBells } from '~/framework/modules/user/actions';

interface SnowFlakesReduxProps {
  session?: AuthActiveAccount;
  isXmasActivated?: boolean;
  isFlakesFalling: boolean;
}

const SnowFlakes = ({ isFlakesFalling, isXmasActivated, session }: SnowFlakesReduxProps) => {
  // Determine xmas theme setting here & if snow must be falling
  const [snowfall, setSnowfall] = React.useState(false);
  const [fadeAnim, setFadeAnim] = React.useState(new Animated.Value(1));
  const wasFlaskesFalling = React.useRef(false);

  // Pause and resume playback depending on app state
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', event => {
      if (event === 'background') jingleBells.setVolume(0);
      if (event === 'active') jingleBells.setVolume(0.5);
    });
    return () => subscription.remove();
  }, []);

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
          duration: 1000,
          toValue: 0,
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
  const snowStyle = React.useMemo(() => ({ opacity: fadeAnim, position: 'absolute' as const }), [fadeAnim]);
  const isSnowEligible = isXmasActivated && isFocused && session?.user?.id; // No session, no flakes !

  return snowfall && isSnowEligible ? (
    <Animated.View style={snowStyle}>
      <Snow fullScreen snowflakesCount={150} fallSpeed="medium" />
    </Animated.View>
  ) : null;
};

const SnowFlakesConnected = connect((state: IGlobalState) => ({
  isFlakesFalling: state.user.flakesFalling,
  isXmasActivated: state.user.xmasTheme,
  session: getSession(),
}))(SnowFlakes);

export default connect((state: IGlobalState) => ({
  isXmasActivated: state.user.xmasTheme,
  session: getSession(),
}))(({ isXmasActivated, session }: { isXmasActivated?: boolean; session?: AuthActiveAccount }) => {
  return session?.user?.id ? <SnowFlakesConnected key={isXmasActivated ? isXmasActivated.toString() : 'undefined'} /> : null;
});
