import rootReducer from "../reducers";
import { NavigationScreenProp } from "react-navigation";
import {IArrayById} from "../../infra/collections";

export enum FiltersEnum {
  owner = "owner",
  shared = "shared",
  protected = "protected",
  trash = "trash",
}

export type IFiltersParameters = {
  filter?: FiltersEnum;
  parentId?: string;
};

export type IRight = {
  owner: FiltersEnum;
  ownerName: string;
}

export type IEntity = IRight & {
  date: string,
  id: string,
  name: string,
  number: number
  isFolder: boolean
}

export type IEntityArray = IArrayById<IEntity>;

export interface IState {
  filesFolders: IEntityArray;
}

export interface IActionProps {
  fetchWorkspaceList: (params: IFiltersParameters) => void
}

export interface IEventProps {
  onPress: (id: string) => void
}

export interface INavigationProps {
  navigation: NavigationScreenProp<{}>;
}

export interface IDataProps {
  filesFolders: IEntityArray;
}

export type IProps = IActionProps & IEventProps & INavigationProps & IDataProps

export type Reducer = ReturnType<typeof rootReducer>;