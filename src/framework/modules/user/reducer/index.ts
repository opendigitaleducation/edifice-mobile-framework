import { IGlobalState, Reducers } from '~/app/store';
import { Mode } from '~/app/theme';
import moduleConfig from '~/framework/modules/user/module-config';
import createReducer from '~/framework/util/redux/reducerFactory';

// State type

export interface UserState {
  mode: Mode;
  xmasMusic: boolean;
  xmasTheme: boolean;
  flakesFalling: boolean;
}

// Initial state value

export const initialState: UserState = {
  mode: Mode.LIGHT,
  xmasMusic: false,
  xmasTheme: true,
  flakesFalling: false,
};

// Actions definitions

export const actionTypes = {
  setMode: moduleConfig.namespaceActionType('SET_MODE'),
  toggleXmasMusic: moduleConfig.namespaceActionType('TOGGLE_XMAS_MUSIC'),
  toggleXmasTheme: moduleConfig.namespaceActionType('TOGGLE_XMAS_THEME'),
  setFlakes: moduleConfig.namespaceActionType('SET_FLAKES'),
};

export interface ActionPayloads {}

export const actions = {};

// Reducer

const reducer = createReducer(initialState, {
  [actionTypes.setMode]: (state, action) => {
    return { ...state, mode: action.value };
  },
  [actionTypes.toggleXmasMusic]: (state, action) => {
    return { ...state, xmasMusic: action.value };
  },
  [actionTypes.toggleXmasTheme]: (state, action) => {
    return { ...state, xmasTheme: action.value };
  },
  [actionTypes.setFlakes]: (state, action) => {
    return { ...state, flakesFalling: action.value };
  },
});

// State getters

export const getState = (state: IGlobalState) => state[moduleConfig.reducerName] as UserState;

// Register the reducer

Reducers.register(moduleConfig.reducerName, reducer);
export default reducer;
