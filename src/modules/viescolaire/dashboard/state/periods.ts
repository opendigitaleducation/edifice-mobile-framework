import moment from 'moment';

import { AsyncActionTypes, AsyncState, createAsyncActionTypes } from '~/infra/redux/async2';
import viescoConfig from '~/modules/viescolaire/dashboard/moduleConfig';

// THE MODEL --------------------------------------------------------------------------------------

export interface IPeriod {
  start_date: moment.Moment;
  end_date: moment.Moment;
  order: number;
  type: number;
  id_type: number;
}

export interface IYear {
  start_date: moment.Moment;
  end_date: moment.Moment;
}

export type IPeriodsList = IPeriod[];

// THE STATE --------------------------------------------------------------------------------------

export type IPeriodsListState = AsyncState<IPeriodsList>;

export type IYearState = AsyncState<IYear>;

export const periodsInitialState: IPeriodsList = [];
export const yearInitialState: IYear = {
  start_date: moment(),
  end_date: moment(),
};

export const getPeriodsListState = (globalState: any) => viescoConfig.getState(globalState).periods as IPeriodsListState;

export const getYearState = (globalState: any) => viescoConfig.getState(globalState).year as IYearState;

// THE ACTION TYPES -------------------------------------------------------------------------------

export const periodsActionTypes: AsyncActionTypes = createAsyncActionTypes(viescoConfig.namespaceActionType('PERIODS_LIST'));

export const yearActionTypes: AsyncActionTypes = createAsyncActionTypes(viescoConfig.namespaceActionType('YEAR'));
