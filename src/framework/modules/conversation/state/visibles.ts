import { AccountType } from '~/framework/modules/auth/model';
import conversationConfig from '~/framework/modules/conversation/module-config';
import { AsyncState, createAsyncActionTypes } from '~/framework/util/redux/async';

// THE MODEL --------------------------------------------------------------------------------------
export enum VisibleType {
  USER = 'User',
  GROUP = 'Group',
  BROADCASTGROUP = 'BroadcastGroup',
  SHAREBOOKMARK = 'ShareBookmark',
}

export enum VisibleRecipientType {
  TO = 'TO',
  CC = 'CC',
  CCI = 'CCI',
}

export interface IVisible {
  id: string;
  displayName: string;
  profile: AccountType;
  type: VisibleType;
  usedIn: ('TO' | 'CC' | 'CCI')[];
  classrooms?: { id: string; name: string }[];
  subjects?: string[];
  relatives?: { id: string; displayName: string }[];
  children?: { id: string; displayName: string }[];
  functions?: string[];
  disciplines?: { id: string; name: string }[];
  nbUsers?: number;
  groupType?: string;
}

export type IVisibles = IVisible[];

// THE STATE --------------------------------------------------------------------------------------

export type IVisiblesState = AsyncState<IVisibles>;

export const initialState: IVisibles = [];

export const getVisiblesState = (globalState: any) => conversationConfig.getState(globalState).visibles as IVisiblesState;

// THE ACTION TYPES -------------------------------------------------------------------------------

export const actionTypes = createAsyncActionTypes(conversationConfig.namespaceActionType('VISIBLES'));

// THE UTILITARY ----------------------------------------------------------------------------------

const normalizeString = str => {
  return str
    .normalize('NFD') // Décompose les caractères spéciaux
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^\w\s]/gi, '') // Supprime les caractères spéciaux
    .toLowerCase(); // Convertit en minuscules
};

export const filterVisibles = (visibles: IVisibles, query: string) => {
  const normalizedQuery = normalizeString(query);

  const matchedByDisplayName: IVisibles = [];
  const matchedByOthers: IVisibles = [];

  visibles.forEach(item => {
    const { displayName, children, functions, disciplines } = item;

    // Check if the query matches the displayName
    if (normalizeString(displayName).includes(normalizedQuery)) {
      matchedByDisplayName.push(item);
    } else {
      // Check if the query matches any of the children displayName
      const childrenMatch = children && children.some(child => normalizeString(child.displayName).includes(normalizedQuery));

      // Check if the query matches any of the functions
      const functionsMatch = functions && functions.some(func => normalizeString(func).includes(normalizedQuery));

      // Check if the query matches any of the disciplines names
      const disciplinesMatch =
        disciplines && disciplines.some(discipline => normalizeString(discipline.name).includes(normalizedQuery));

      if (childrenMatch || functionsMatch || disciplinesMatch) {
        matchedByOthers.push(item);
      }
    }
  });

  const result = [...matchedByDisplayName, ...matchedByOthers];

  return result;
};
