import * as React from 'react';
import { View } from 'react-native';

import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import DeviceInfo from 'react-native-device-info';
import { connect } from 'react-redux';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import styles from './styles';
import { UserXmasScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import AlertCard from '~/framework/components/alert';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { BodyText, SmallText } from '~/framework/components/text';
import { Toggle } from '~/framework/components/toggle';
import { setXmasMusicAction, setXmasThemeAction } from '~/framework/modules/user/actions';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.xmas>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-xmas-title'),
  }),
});

const getNextYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  return currentMonth === 0 ? currentYear : currentYear + 1;
};

const XmasScreen = ({ onSetXmasMusic, onSetXmasTheme, xmasMusic, xmasTheme }: UserXmasScreenPrivateProps) => {
  return (
    <PageView style={styles.page}>
      <SmallText>{I18n.get('user-xmas-description-temporary', { nextYear: getNextYear() })}</SmallText>
      <View style={styles.toggleContainer}>
        <BodyText>{I18n.get('user-xmas-activate-theme')}</BodyText>
        <Toggle onCheckChange={() => onSetXmasTheme(!xmasTheme)} checked={xmasTheme} />
      </View>
      <View style={styles.toggleContainer}>
        <BodyText style={!xmasTheme && { color: theme.palette.grey.grey }}>{I18n.get('user-xmas-activate-music')}</BodyText>
        <Toggle disabled={!xmasTheme} onCheckChange={() => onSetXmasMusic(!xmasMusic)} checked={xmasMusic} />
      </View>
      <AlertCard style={styles.alertCard} type="info" text={I18n.get('user-xmas-description-hint')} />
      <View style={styles.xmasTreeContainer}>
        <View style={styles.wishTextContainer}>
          <SmallText>{I18n.get('user-xmas-description-wish', { appName: DeviceInfo.getApplicationName() })}</SmallText>
        </View>
        <View style={styles.xmasTreeSubcontainer}>
          <Svg style={styles.xmasTree} name="xmas" width="140%" height="70%" />
        </View>
      </View>
    </PageView>
  );
};

const XmasScreenConnected = connect(
  (state: any) => ({
    xmasMusic: state.user.xmasMusic,
    xmasTheme: state.user.xmasTheme,
  }),
  (dispatch: ThunkDispatch<any, void, AnyAction>) => ({
    dispatch,
    onSetXmasMusic(xmasMusic: boolean) {
      dispatch(setXmasMusicAction(xmasMusic));
    },
    onSetXmasTheme(xmasTheme: boolean) {
      dispatch(setXmasThemeAction(xmasTheme));
    },
  }),
)(XmasScreen);

export default XmasScreenConnected;
