import * as React from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';

import theme from '~/app/theme';

export interface StatusBarProps {
  type: 'primary' | 'light' | 'dark';
  hidden?: boolean;
}

export const StatusBar = (props: StatusBarProps) => {
  const { type, hidden } = props;
  return Platform.select(
    type === 'primary'
      ? {
          ios: <RNStatusBar barStyle="light-content" hidden={hidden} />,
          android: <RNStatusBar backgroundColor={theme.palette.primary.regular} barStyle="light-content" hidden={hidden} />,
        }
      : type === 'light'
        ? {
            ios: <RNStatusBar barStyle="dark-content" hidden={hidden} />,
            android: <RNStatusBar backgroundColor={theme.ui.background.page} barStyle="dark-content" hidden={hidden} />,
          }
        : /* props.type === 'dark' */ {
            ios: <RNStatusBar barStyle="light-content" hidden={hidden} />,
            android: <RNStatusBar backgroundColor={theme.palette.grey.black} barStyle="light-content" hidden={hidden} />,
          },
  );
};

export default StatusBar;
