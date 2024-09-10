import conversationConfig from '~/framework/modules/conversation/module-config';
import { AsyncState, createAsyncActionTypes } from '~/framework/util/redux/async';
import { computeSearchQuery, computeSearchValue } from '~/framework/util/string';

// THE MODEL --------------------------------------------------------------------------------------

export interface IVisible {
  id: string;
  profile: string;
}
export interface IVisibleUser extends IVisible {
  displayName: string;
}
export interface IVisibleGroup extends IVisibleUser {
  groupDisplayName: string;
  name: string;
  structureName: string;
}

export interface IVisibles {
  groups: IVisibleGroup[];
  users: IVisibleUser[];
}

// THE STATE --------------------------------------------------------------------------------------

export type IVisiblesState = AsyncState<IVisibles>;

export const initialState: IVisibles = { groups: [], users: [] };

export const getVisiblesState = (globalState: any) => conversationConfig.getState(globalState).visibles as IVisiblesState;

// THE ACTION TYPES -------------------------------------------------------------------------------

export const actionTypes = createAsyncActionTypes(conversationConfig.namespaceActionType('VISIBLES'));

// THE UTILITARY ----------------------------------------------------------------------------------

export const searchVisibles = (
  visibles: IVisibles,
  query: string,
  omitResults?: (IVisibleGroup | IVisibleUser)[],
  limit?: number,
  threshold?: number,
) => {
  const queryWords = computeSearchQuery(query);
  const computeScoreString = (s: string) =>
    queryWords.reduce((score, q) => {
      const str = computeSearchValue(s);
      const common = q.length && str.includes(q);
      return score + (common ? 1 : 0);
    }, 0);
  const computeScoreUser = (v: IVisibleUser) => computeScoreString(v.displayName);
  const computeScoreGroup = (v: IVisibleGroup) => computeScoreString(v.groupDisplayName || v.name);
  const filterFunc = (v: { score: number }) => v.score >= (threshold ?? 1);
  const omitIds = omitResults ? omitResults.map(v => v.id) : [];
  const filterFunc2 = (v: IVisibleGroup | IVisibleUser) => !omitIds.includes(v.id);
  const sortFunc = (a: { score: number }, b: { score: number }) => b.score - a.score;
  const computed = [] as ((IVisibleGroup | IVisibleUser) & { score: number })[];
  for (const g of visibles.groups) {
    computed.push({ ...g, score: computeScoreGroup(g) });
  }
  for (const u of visibles.users) {
    computed.push({ ...u, score: computeScoreUser(u) });
  }
  const res = computed
    .filter(v => filterFunc(v) && filterFunc2(v))
    .sort(sortFunc)
    .slice(0, limit ?? 20) as (IVisibleGroup | IVisibleUser)[];
  return res;
};
