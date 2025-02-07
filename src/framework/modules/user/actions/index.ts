/**
 * Thunk actions for user module
 */
import { EmitterSubscription, Vibration } from 'react-native';

import { Moment } from 'moment';
import RNShake from 'react-native-shake';
import Sound from 'react-native-sound';
import { AnyAction, Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { IGlobalState } from '~/app/store';
import { ILoggedUserProfile } from '~/framework/modules/auth/model';
import { assertSession, actions as authActions } from '~/framework/modules/auth/reducer';
import { actionTypes } from '~/framework/modules/user/reducer';
import { writeXmasMusic, writeXmasTheme } from '~/framework/modules/user/storage';
import { addTime, subtractTime, today } from '~/framework/util/date';
import { signedFetchJson } from '~/infra/fetchWithCache';
import { refreshSelfAvatarUniqueKey } from '~/ui/avatars/Avatar';

export function profileUpdateAction(newValues: Partial<ILoggedUserProfile>) {
  return async (dispatch: Dispatch & ThunkDispatch<any, void, AnyAction>, getState: () => IGlobalState) => {
    const isUpdatingPhoto = newValues.avatar !== undefined;

    const session = assertSession();

    for (const key in newValues) {
      if (newValues[key] !== undefined) {
        if (
          key.match(/Valid/) ||
          newValues[key as keyof Partial<ILoggedUserProfile>] === session.user[key] ||
          key === 'updatingAvatar'
        ) {
          delete newValues[key as keyof Partial<ILoggedUserProfile>];
        }
      }
    }

    try {
      const userId = session.user.id;
      const updatedValues = isUpdatingPhoto ? { ...newValues, picture: newValues.avatar } : newValues;
      const reponse = await signedFetchJson(`${session.platform.url}/directory/user${isUpdatingPhoto ? 'book' : ''}/${userId}`, {
        body: JSON.stringify(updatedValues),
        method: 'PUT',
      });
      if ((reponse as any).error) {
        throw new Error((reponse as any).error);
      }
      dispatch(authActions.profileUpdate(userId, newValues));
      if (isUpdatingPhoto) {
        refreshSelfAvatarUniqueKey();
      }
    } catch (e) {
      if ((e as Error).message.match(/loginAlias/)) {
        // Tracking was here
      } else {
        // Tracking was here
      }
    }
  };
}

const snowFallDuration = 35000;
let snowfallTimer: NodeJS.Timeout;

Sound.setCategory('Playback');
export const jingleBells = new Sound('jingle_bells.mp3', Sound.MAIN_BUNDLE, error => {
  if (error) {
    console.error('failed to load the sound', error);
  } else
    console.debug('duration in seconds: ' + jingleBells.getDuration() + 'number of channels: ' + jingleBells.getNumberOfChannels());
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
  const lastYear = subtractTime(today(), 1, 'year').startOf('year');
  const startDateThisYear = getDateForYear(startOfThisYear, startDay, startMonth);
  const startDatePreviousYear = getDateForYear(lastYear, startDay, startMonth);
  const endDateNextYear = getDateForYear(startOfNextYear, endDay, endMonth);
  const endDateThisYear = getDateForYear(startOfThisYear, endDay, endMonth);
  const isWithinXmasPeriod =
    today().month() === 0
      ? today().isBetween(startDatePreviousYear, endDateThisYear)
      : today().isBetween(startDateThisYear, endDateNextYear);
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

export const updateShakeListenerAction = () => async (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => {
  try {
    if (!shakeListener && getIsXmasActive(getState())) {
      setTimeout(() => {
        dispatch(letItSnowAction());
        if (getIsXmasMusicActive(getState())) {
          jingleBells.setVolume(0.5);
          jingleBells.play();
        }
      }, 100);
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
    writeXmasMusic(xmasMusic);
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
    writeXmasTheme(xmasTheme);
    dispatch({ type: actionTypes.toggleXmasTheme, value: xmasTheme });
    if (!xmasTheme) jingleBells.stop();
    dispatch(updateShakeListenerAction());
  } catch {
    // If error, we disable theme for now
    dispatch({ type: actionTypes.toggleXmasTheme, value: false });
  }
};
