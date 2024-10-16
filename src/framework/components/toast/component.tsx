import { useRoute } from '@react-navigation/native';
import * as React from 'react';
import { Animated, Easing, LayoutChangeEvent } from 'react-native';
import ToastMessage, { ToastConfig } from 'react-native-toast-message';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

import theme, { IShades } from '~/app/theme';
import AlertCard, { AlertCardProps } from '~/framework/components/alert';
import { toastConfigColor } from '~/framework/components/alert/model';
import IconButton from '~/framework/components/buttons/icon';
import { UI_SIZES } from '~/framework/components/constants';
import { isModalModeOnThisRoute } from '~/framework/navigation/hideTabBarAndroid';

import styles from './styles';
import { ToastParams, ToastProps } from './types';

// Config constants for Toasts

const TOAST_DURATION = 6000;
const TOAST_TOP_MARGIN = UI_SIZES.spacing.minor;
const TOAST_PROGESS_ANIMATION_DELAY = 400; // Approximatively the duration of toast display anim.
const TOAST_PROGESS_ANIMATION_EASING = Easing.bezier(0.75, 1, 0.75, 1); // nearly linear but with a small slow down at the end
const TOAST_PROGESS_ANIMATION_START_VALUE = 1;
const TOAST_PROGESS_ANIMATION_END_VALUE = 0;

export const DEFAULTS = {
  visibilityTime: TOAST_DURATION + TOAST_PROGESS_ANIMATION_DELAY,
  offset: TOAST_TOP_MARGIN,
};

function useToastShades(type: ToastParams['type']) {
  return theme.palette.status[toastConfigColor[type]] as IShades;
}

function useToastProgress(duration: ToastParams['props']['duration'], colorShades: IShades) {
  const [progressWidth, setProgressWidth] = React.useState<number>(0);
  const measureProgressLayout = React.useCallback(({ nativeEvent }: { nativeEvent: LayoutChangeEvent['nativeEvent'] }) => {
    setProgressWidth(nativeEvent.layout.width);
  }, []);

  const progressValue = React.useRef(new Animated.Value(TOAST_PROGESS_ANIMATION_START_VALUE)).current;
  const progressTimeStart = React.useRef(0);
  const remainingTime = React.useRef(0);
  const progressAnimation = React.useMemo(
    () =>
      Animated.timing(progressValue, {
        toValue: TOAST_PROGESS_ANIMATION_END_VALUE,
        delay: TOAST_PROGESS_ANIMATION_DELAY,
        easing: TOAST_PROGESS_ANIMATION_EASING,
        duration: duration - TOAST_PROGESS_ANIMATION_DELAY,
        useNativeDriver: false,
      }),
    [duration, progressValue],
  );
  const progressStyle = React.useMemo(() => {
    return [
      { backgroundColor: colorShades.light },
      styles.progress,
      {
        transform: [{ translateX: -progressWidth / 2 }, { scaleX: progressValue }, { translateX: progressWidth / 2 }],
      },
    ];
  }, [colorShades.light, progressValue, progressWidth]);

  const onPause = React.useCallback(() => {
    progressAnimation.stop();
    Toast.pause();
    remainingTime.current = remainingTime.current - (Date.now() - progressTimeStart.current);
  }, [progressAnimation]);

  const onResume = React.useCallback(() => {
    progressTimeStart.current = Date.now();
    const progressResumeAnimation = Animated.timing(progressValue, {
      toValue: TOAST_PROGESS_ANIMATION_END_VALUE,
      easing: TOAST_PROGESS_ANIMATION_EASING,
      duration: remainingTime.current,
      useNativeDriver: false,
    });
    progressResumeAnimation.start();
    Toast.resume();
  }, [progressValue]);

  // Will be triggered
  const onStart = React.useCallback(() => {
    if (!duration) return;
    progressAnimation.reset();
    progressAnimation.start();
    progressTimeStart.current = Date.now();
    remainingTime.current = duration;
  }, [duration, progressAnimation]);

  return { onStart, onPause, onResume, measureProgressLayout, progressStyle };
}

function ToastCard(params: ToastParams) {
  const colorShades = useToastShades(params.type);

  const onClose = React.useCallback(() => {
    ToastMessage.hide();
  }, []);

  const { onStart, onPause, onResume, measureProgressLayout, progressStyle } = useToastProgress(params.props.duration, colorShades);
  // Refresh start effect when toastId is renewed (= when new toast is triggered)
  React.useLayoutEffect(onStart, [onStart, params.props.toastId]);

  const innerToastComponent: AlertCardProps['renderCloseButton'] = React.useCallback(
    (shades, closeCallback?: () => void) =>
      params.props.duration ? (
        <Animated.View onLayout={measureProgressLayout} style={progressStyle} />
      ) : (
        <IconButton icon="ui-close" action={closeCallback!} />
      ),
    [measureProgressLayout, params.props.duration, progressStyle],
  );

  const containerProps = React.useMemo(
    () => ({
      onTouchStart: onPause,
      onTouchEnd: onResume,
      testID: params.props.testID,
    }),
    [onPause, onResume, params.props.testID],
  );

  return (
    <AlertCard
      type={params.type as AlertCardProps['type']}
      text={params.text1}
      label={params.text2}
      onLabelPress={params.props.onLabelPress}
      onClose={onClose}
      renderCloseButton={innerToastComponent}
      containerProps={containerProps}
      shadow
      style={styles.container}
      icon={params.props.picture}
      testID={params.props.testID}
    />
  );
}

const config: ToastConfig = {
  success: props => <ToastCard {...props} />,
  warning: props => <ToastCard {...props} />,
  info: props => <ToastCard {...props} />,
  error: props => <ToastCard {...props} />,
};

//
// Toast Containers
//

const defaultRootScreenOffset = UI_SIZES.elements.navbarHeight + (UI_SIZES.screen.topInset || UI_SIZES.elements.statusbarHeight);

function useToastOffset(customOffset?: number) {
  const route = useRoute();
  if (customOffset) return customOffset;
  const isModal = isModalModeOnThisRoute(route.name);
  return isModal
    ? DEFAULTS.offset // On modal screens, zero is below the navBar
    : DEFAULTS.offset + defaultRootScreenOffset; // Anywhere else, zero is the very top of screen
}

export function ToastHandler(props: ToastProps) {
  const offset = useToastOffset(props.offset);
  return <ToastMessage config={config} topOffset={offset} {...props} />;
}

export function RootToastHandler(props: ToastProps) {
  return <ToastMessage config={config} topOffset={props.offset ?? DEFAULTS.offset + defaultRootScreenOffset} />; // For the global Toast, zero is the very top of screen
}
