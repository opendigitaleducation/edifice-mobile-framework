/**
 * Thunk actions for user module
 */
import { Moment } from 'moment';
import { EmitterSubscription, Vibration } from 'react-native';
import RNShake from 'react-native-shake';
import { AnyAction, Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import Sound from 'react-native-sound';
import { IGlobalState } from '~/app/store';
import { Mode, Theme } from '~/app/theme';
import { ILoggedUserProfile } from '~/framework/modules/auth/model';
import { assertSession, actions as authActions } from '~/framework/modules/auth/reducer';
import { actionTypes } from '~/framework/modules/user/reducer';
import { addTime, today } from '~/framework/util/date';
import { getItemJson, setItemJson } from '~/framework/util/storage';
import { Trackers } from '~/framework/util/tracker';
import { signedFetchJson } from '~/infra/fetchWithCache';
import { refreshSelfAvatarUniqueKey } from '~/ui/avatars/Avatar';

export type UpdatableProfileValues = Partial<ILoggedUserProfile>;

export function profileUpdateAction(newValues: UpdatableProfileValues) {
  return async (dispatch: Dispatch & ThunkDispatch<any, void, AnyAction>, getState: () => IGlobalState) => {
    const isUpdatingPhoto = newValues.photo !== undefined;

    const session = assertSession();

    for (const key in newValues) {
      if (newValues[key] !== undefined) {
        if (
          key.match(/Valid/) ||
          newValues[key as keyof UpdatableProfileValues] === session.user[key] ||
          key === 'updatingAvatar'
        ) {
          delete newValues[key as keyof UpdatableProfileValues];
        }
      }
    }

    dispatch(authActions.profileUpdateRequest(newValues));
    try {
      const userId = session.user.id;
      const updatedValues = isUpdatingPhoto ? { ...newValues, picture: newValues.photo } : newValues;
      const reponse = await signedFetchJson(`${session.platform.url}/directory/user${isUpdatingPhoto ? 'book' : ''}/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedValues),
      });
      if ((reponse as any).error) {
        throw new Error((reponse as any).error);
      }
      dispatch(authActions.profileUpdateSuccess(newValues));
      if (isUpdatingPhoto) {
        refreshSelfAvatarUniqueKey();
      }
      Trackers.trackEvent('Profile', 'UPDATE');
    } catch (e) {
      dispatch(authActions.profileUpdateError());

      if ((e as Error).message.match(/loginAlias/)) {
        Trackers.trackEvent('Profile', 'UPDATE ERROR', 'user-profilechange-login-error');
      } else {
        Trackers.trackEvent('Profile', 'UPDATE ERROR', `${isUpdatingPhoto ? 'Avatar' : 'Profile'}ChangeError`);
      }
    }
  };
}

export const setModeAction = async (mode: Mode) => Theme.setMode(mode);

export const getMode = () => Theme.getMode;

const xmasThemeStorageKey = 'xmasThemeSetting';
const xmasMusicStorageKey = 'xmasMusicSetting';
const snowFallDuration = 35000;
const snowFirstLaunchWait = 1000;
let snowfallTimer: NodeJS.Timeout;

Sound.setCategory('Playback');
export const jingleBells = new Sound('jingle_bells.mp3', Sound.MAIN_BUNDLE, error => {
  if (error) {
    console.log('failed to load the sound', error);
  } else
    console.log('duration in seconds: ' + jingleBells.getDuration() + 'number of channels: ' + jingleBells.getNumberOfChannels());
});
jingleBells.setVolume(0.5);

const getIsWithinXmasPeriod = (startDay: number, startMonth: number, endDay: number, endMonth: number) => {
  const getDateForYear = (startOfYear: Moment, day: number, month: number) => {
    const monthOfYear = addTime(startOfYear, month - 1, 'month');
    const dateOfYear = addTime(monthOfYear, day - 1, 'day');
    return dateOfYear;
  };
  const startOfThisYear = today().startOf('year');
  const startOfNextYear = addTime(today(), 1, 'year').startOf('year');
  const startDateThisYear = getDateForYear(startOfThisYear, startDay, startMonth);
  const endDateNextYear = getDateForYear(startOfNextYear, endDay, endMonth);
  const isWithinXmasPeriod = today().isBetween(startDateThisYear, endDateNextYear);
  return isWithinXmasPeriod;
};

export const isWithinXmasPeriod = getIsWithinXmasPeriod(1, 12, 5, 1);

export const getIsXmasActive = (state: IGlobalState) => isWithinXmasPeriod && state.user.xmasTheme;
export const getIsXmasMusicActive = (state: IGlobalState) => state.user.xmasMusic;

export const letItSnowAction = () => async (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => {
  try {
    if (!getIsXmasActive(getState())) return;
    dispatch({ type: actionTypes.setFlakes, value: true });
    if (snowfallTimer) {
      clearTimeout(snowfallTimer);
    }
    snowfallTimer = setTimeout(() => dispatch({ type: actionTypes.setFlakes, value: false }), snowFallDuration);
  } catch {
    // ToDo: Error handling
  }
};

export const stopItSnowAction = () => async (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => {
  try {
    if (!getIsXmasActive(getState())) return;
    jingleBells.stop();
    dispatch({ type: actionTypes.setFlakes, value: false });
    if (snowfallTimer) {
      clearTimeout(snowfallTimer);
    }
  } catch {
    // ToDo: Error handling
  }
};

let shakeListener: EmitterSubscription | undefined;

const updateShakeListenerAction = () => async (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => {
  try {
    if (!shakeListener && getIsXmasActive(getState())) {
      shakeListener = RNShake.addListener(() => {
        Vibration.vibrate();
        dispatch(letItSnowAction());
        if (getIsXmasMusicActive(getState())) jingleBells.play();
      });
    } else if (shakeListener && !getIsXmasActive(getState())) {
      shakeListener.remove();
      shakeListener = undefined;
    }
  } catch {
    // Nothing
  }
};

export const setXmasMusicAction = (xmasMusic: boolean) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
  try {
    await setItemJson(xmasMusicStorageKey, xmasMusic);
    dispatch({ type: actionTypes.toggleXmasMusic, value: xmasMusic });
    if (xmasMusic) {
      jingleBells.play();
      dispatch(letItSnowAction());
    } else {
      dispatch(stopItSnowAction());
    }
  } catch {
    // If error, we disable music for now
    dispatch({ type: actionTypes.toggleXmasMusic, value: false });
  }
};

export const setXmasThemeAction = (xmasTheme: boolean) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
  try {
    await setItemJson(xmasThemeStorageKey, xmasTheme);
    dispatch({ type: actionTypes.toggleXmasTheme, value: xmasTheme });
    if (xmasTheme) {
      dispatch(letItSnowAction());
      if (getIsXmasMusicActive(getState())) jingleBells.play();
    } else jingleBells.stop();
    dispatch(updateShakeListenerAction());
  } catch {
    // If error, we disable theme for now
    dispatch({ type: actionTypes.toggleXmasTheme, value: false });
  }
};

export const importXmasAction = () => async (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => {
  try {
    let xmasThemeSetting;
    let xmasMusicSetting;
    xmasThemeSetting = (await getItemJson(xmasThemeStorageKey)) as boolean | undefined;
    xmasMusicSetting = (await getItemJson(xmasMusicStorageKey)) as boolean | undefined;
    // These settings are undefined on first launch (by default, we set the theme on and the music off)
    if (xmasThemeSetting === undefined) {
      await setItemJson(xmasThemeStorageKey, true);
      xmasThemeSetting = true;
    }
    if (xmasMusicSetting === undefined) {
      await setItemJson(xmasMusicStorageKey, false);
      xmasMusicSetting = false;
    }

    const xmasTheme = xmasThemeSetting && isWithinXmasPeriod;
    dispatch({ type: actionTypes.toggleXmasTheme, value: xmasTheme });
    dispatch({ type: actionTypes.toggleXmasMusic, value: xmasMusicSetting });

    // We make sure the app is ready to display the snowflakes on first launch
    setTimeout(() => {
      if (xmasTheme) dispatch(letItSnowAction());
    }, snowFirstLaunchWait);
    dispatch(updateShakeListenerAction());
  } catch {
    // If error, we reset to the inital behavior => theme on
    dispatch({ type: actionTypes.toggleXmasTheme, value: true });
    return true;
  }
};
