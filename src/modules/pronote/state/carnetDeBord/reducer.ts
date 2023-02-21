import { IGlobalState } from '~/AppStore';
import {
  AsyncState,
  createAsyncActionCreators,
  createAsyncActionTypes,
  createSessionAsyncReducer,
} from '~/framework/util/redux/async';
import { ICarnetDeBord } from '~/modules/pronote/model/carnetDeBord';
import moduleConfig from '~/modules/pronote/moduleConfig';

export type ICarnetDeBordStateData = ICarnetDeBord[];
export type ICarnetDeBordState = AsyncState<ICarnetDeBordStateData>;

const initialState: ICarnetDeBordStateData = [];

export const actionTypes = createAsyncActionTypes(moduleConfig.namespaceActionType('CARNET_DE_BORD'));
export const actions = createAsyncActionCreators<ICarnetDeBordStateData>(actionTypes);

export default createSessionAsyncReducer(initialState, actionTypes);

export const getCarnetDeBordState = (globalState: IGlobalState) => moduleConfig.getState(globalState).carnetDeBord;