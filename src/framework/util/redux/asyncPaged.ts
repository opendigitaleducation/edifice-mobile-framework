/**
 * Async Paged Reducer
 *
 * Handles an array of data that is loaded by segments of constant size named "pages".
 */
import moment from 'moment';
import { AnyAction, Reducer } from 'redux';

import {
  AsyncActionTypeKey,
  AsyncState,
  ErrorAction,
  ReceiptAction,
  asyncActionTypeSuffixes,
  createAsyncActionTypes,
  createInitialAsyncState,
} from './async';
import createReducer, { IReducerActionsHandlerMap, createSessionReducer } from './reducerFactory';

// Actions types & actions

export type AsyncPagedActionTypeKey = AsyncActionTypeKey;
export type AsyncPagedActionTypes = { [key in AsyncPagedActionTypeKey]: string };

export const asyncPagedActionTypeSuffixes: AsyncPagedActionTypes = {
  ...asyncActionTypeSuffixes,
};

export type AsyncPagedActionCreators<DataType extends any[]> = {
  request: () => AnyAction;
  receipt: (data: DataType, page: number) => ReceiptPagedAction<DataType>;
  error: (err: Error) => ErrorAction;
  clear: () => AnyAction;
};

export const createAsyncPagedActionTypes: (prefixUpperCase: string) => AsyncPagedActionTypes = (prefixUpperCase: string) =>
  ({
    ...createAsyncActionTypes(prefixUpperCase),
  }) as AsyncPagedActionTypes;

export const createAsyncPagedActionCreators: <DataType extends any[]>(
  actionTypes: AsyncPagedActionTypes,
) => AsyncPagedActionCreators<DataType> = <DataType>(actionTypes: AsyncPagedActionTypes) => ({
  request: () => ({ type: actionTypes.request }),
  receipt: (data: DataType, page: number) => ({ type: actionTypes.receipt, data, page }),
  error: (error: Error) => ({ type: actionTypes.error, error }),
  clear: () => ({ type: actionTypes.clear }),
});

// State

export interface AsyncPagedState<DataType extends any[]> extends AsyncState<DataType> {
  nextPage: number;
  endReached: boolean;
}

export function createInitialAsyncPagedState<DataType extends any[]>(initialState: DataType) {
  return {
    ...createInitialAsyncState(initialState),
    nextPage: 0,
    endReached: false,
  };
}

// Reducer

export interface ReceiptPagedAction<DataType extends any[]> extends ReceiptAction<DataType> {
  page: number;
}

function _createAsyncPagedReducer<DataType extends any[]>(
  initialState: DataType,
  actionTypes: AsyncPagedActionTypes,
  pageSize: number,
  reducerActionsHandlerMap: IReducerActionsHandlerMap<DataType> = {},
  createReducerFunction: <StateType>(
    initialState: StateType,
    reducerActionsHandlerMap: IReducerActionsHandlerMap<StateType>,
    ...args: any[]
  ) => Reducer<StateType, AnyAction>,
  createReducerFunctionAdditionalArgs: any[] = [],
): Reducer<AsyncState<DataType>> {
  const asyncInitialState = createInitialAsyncPagedState(initialState);
  const dataReducer = createReducer(initialState, reducerActionsHandlerMap);
  const asyncReducer = createReducerFunction<AsyncState<DataType>>(
    asyncInitialState,
    {
      [actionTypes.request]: (state, action) => ({
        ...state,
        isFetching: true,
      }),
      [actionTypes.receipt]: (state, action: ReceiptPagedAction<DataType>) => ({
        ...state,
        isFetching: false,
        isPristine: false,
        lastSuccess: moment(),
        nextPage: action.page + 1,
        endReached: action.data.length < pageSize,
        data: [...state.data.slice(0, pageSize * action.page), ...action.data, ...state.data.slice(pageSize * (action.page + 1))],
      }),
      [actionTypes.error]: (state, action: ErrorAction) => ({
        ...state,
        isFetching: false,
        error: action.error,
      }),
      [actionTypes.clear]: () => asyncInitialState,
    } as IReducerActionsHandlerMap<AsyncState<DataType>>,
    ...createReducerFunctionAdditionalArgs,
  );

  return (state = asyncInitialState, action) => {
    const ret = asyncReducer(state, action);
    ret.data = dataReducer(ret.data, action);
    return ret;
  };
}

export function createAsyncPagedReducer<DataType extends any[]>(
  initialState: DataType,
  actionTypes: AsyncPagedActionTypes,
  pageSize: number,
  reducerActionsHandlerMap?: IReducerActionsHandlerMap<DataType>,
): Reducer<AsyncState<DataType>> {
  return _createAsyncPagedReducer(initialState, actionTypes, pageSize, reducerActionsHandlerMap, createReducer);
}

export function createSessionAsyncPagedReducer<DataType extends any[]>(
  initialState: DataType,
  actionTypes: AsyncPagedActionTypes,
  pageSize: number,
  reducerActionsHandlerMap?: IReducerActionsHandlerMap<DataType>,
  sessionNamesUppercase?: string[],
): Reducer<AsyncState<DataType>> {
  return _createAsyncPagedReducer(initialState, actionTypes, pageSize, reducerActionsHandlerMap, createSessionReducer, [
    sessionNamesUppercase,
  ]);
}

export enum AsyncPagedLoadingState {
  PRISTINE, // When no data has been fetched yet
  INIT, // When data is fetching for the first time
  INIT_FAILED, // When the first-time fetch failed
  RETRY, // When we fetch again after a failing first-time fetch
  REFRESH, // When we refresh the list
  REFRESH_SILENT, // When we refresh the list without feedback
  REFRESH_FAILED, // When the refresh has failed
  FETCH_NEXT, // When fetching next content
  FETCH_NEXT_FAILED, // When fetching next content failed
  DONE, // When the last fetch has been successful
}
