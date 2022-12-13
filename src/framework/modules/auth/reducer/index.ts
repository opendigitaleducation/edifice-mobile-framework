import { IGlobalState, Reducers, getStore } from '~/app/store';
import createReducer from '~/framework/util/redux/reducerFactory';
import { cacheActiveSession } from '~/framework/util/session';

import { ILoginResult } from '../actions';
import type { AuthErrorCode, ISession } from '../model';
import moduleConfig from '../moduleConfig';

// State type
export interface IAuthState {
  session?: ISession;
  error?: AuthErrorCode;
  errorTimestamp?: number; // Login screen render timestamp of last error to known what screen the error belongs to
  logged: boolean;
  autoLoginResult?: ILoginResult;
}

// Initial state
export const initialState: IAuthState = {
  logged: false,
};

// Actions definitions
export const actionTypes = {
  sessionCreate: moduleConfig.namespaceActionType('SESSION_START'),
  sessionPartial: moduleConfig.namespaceActionType('SESSION_PARTIAL'),
  sessionRefresh: moduleConfig.namespaceActionType('SESSION_REFRESH'),
  sessionError: moduleConfig.namespaceActionType('SESSION_ERROR'),
  sessionEnd: moduleConfig.namespaceActionType('SESSION_END'),
  redirectAutoLogin: moduleConfig.namespaceActionType('REDIRECT_AUTO_LOGIN'),
};

export interface IActionPayloads {
  sessionCreate: Pick<Required<IAuthState>, 'session'>;
  sessionPartial: Pick<Required<IAuthState>, 'session'>;
  sessionRefresh: Pick<Required<IAuthState>, 'session'>;
  sessionError: Pick<Required<IAuthState>, 'error' | 'errorTimestamp'>;
  sessionEnd: undefined;
  redirectAutoLogin: Pick<Required<IAuthState>, 'autoLoginResult'>;
}

export const actions = {
  sessionCreate: (session: ISession) => ({ type: actionTypes.sessionCreate, session }),
  sessionPartial: (session: ISession) => ({ type: actionTypes.sessionPartial, session }),
  sessionRefresh: (session: ISession) => ({ type: actionTypes.sessionRefresh, session }),
  sessionError: (error: AuthErrorCode, errorTimestamp?: number) => ({
    type: actionTypes.sessionError,
    error,
    errorTimestamp,
  }),
  sessionEnd: () => ({ type: actionTypes.sessionEnd }),
  redirectAutoLogin: (result: ILoginResult) => ({ type: actionTypes.redirectAutoLogin, autoLoginResult: result }),
};

const reducer = createReducer(initialState, {
  [actionTypes.sessionCreate]: (state, action) => {
    const { session }: IActionPayloads['sessionCreate'] = action as any;
    cacheActiveSession(session);
    return { ...initialState, session, logged: true };
  },
  [actionTypes.sessionPartial]: (state, action) => {
    const { session }: IActionPayloads['sessionCreate'] = action as any;
    cacheActiveSession(session);
    return { ...initialState, session, logged: false };
  },
  [actionTypes.sessionRefresh]: (state, action) => {
    const { session }: IActionPayloads['sessionRefresh'] = action as any;
    cacheActiveSession(session);
    return { ...initialState, session, logged: true };
  },
  [actionTypes.sessionError]: (state, action) => {
    const { error, errorTimestamp }: IActionPayloads['sessionError'] = action as any;
    cacheActiveSession(initialState.session);
    return { ...initialState, error, errorTimestamp };
  },
  [actionTypes.sessionEnd]: (state, action) => {
    cacheActiveSession(initialState.session);
    return { ...initialState, error: state.error, errorTimestamp: state.errorTimestamp }; // Logout preserve error
  },
  [actionTypes.redirectAutoLogin]: (state, action) => {
    const { autoLoginResult }: IActionPayloads['redirectAutoLogin'] = action as any;
    return { ...state, autoLoginResult };
  },
});

Reducers.register(moduleConfig.reducerName, reducer);

export const getState = (state: IGlobalState) => state[moduleConfig.reducerName] as IAuthState;

/**
 * Get the current active session.
 * This IS NOT the recommended way to get the session information.
 * - In a component, use the above `getState` (as getAuthState)
 * - In an action/thunk, use the above `getState` (as getAuthState)
 * - In a utility function, use this assertion.
 * Caution : this is an "assert" function. If session not present, this function will throw an error.
 * @returns the current session
 */
export function assertSession() {
  const session = getState(getStore().getState()).session;
  if (!session) throw new Error('[assertSession] no session');
  return session;
}
/**
 * Get the current active session from Redux state.
 * This is the recommended way to get the session in a component.
 * Though `assertSession` should work, `getSession` does NOT throw exceptions, and return undefined instead,
 * letting you deal with the undefined value as you wish.
 * @param state 
 * @returns 
 */
export function getSession(state: IGlobalState){
  return getState(state).session;
}

export default reducer;
