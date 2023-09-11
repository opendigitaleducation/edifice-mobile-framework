import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { IUserListItem } from '~/framework/components/UserList';
import type { ISession } from '~/framework/modules/auth/model';
import type { ISchoolYear, ITerm } from '~/framework/modules/viescolaire/common/model';
import type {
  fetchPresencesHistoryAction,
  fetchPresencesSchoolYearAction,
  fetchPresencesTermsAction,
  fetchPresencesUserChildrenAction,
} from '~/framework/modules/viescolaire/presences/actions';
import type { IHistory, IUserChild } from '~/framework/modules/viescolaire/presences/model';
import type { PresencesNavigationParams, presencesRouteNames } from '~/framework/modules/viescolaire/presences/navigation';
import type { IPresencesNotification } from '~/framework/modules/viescolaire/presences/notif-handler';
import type { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

export interface PresencesHistoryDetailsScreenProps {
  initialLoadingState: AsyncPagedLoadingState;
}

export interface PresencesHistoryDetailsScreenNavParams {
  notification?: IPresencesNotification;
}

export interface PresencesHistoryDetailsScreenStoreProps {
  history: IHistory;
  schoolYear: ISchoolYear | undefined;
  terms: ITerm[];
  children?: IUserListItem[];
  classes?: string[];
  hasPresencesCreateAbsenceRight?: boolean;
  session?: ISession;
  userId?: string;
  userType?: string;
}

export interface PresencesHistoryDetailsScreenDispatchProps {
  tryFetchHistory: (...args: Parameters<typeof fetchPresencesHistoryAction>) => Promise<IHistory>;
  tryFetchSchoolYear: (...args: Parameters<typeof fetchPresencesSchoolYearAction>) => Promise<ISchoolYear>;
  tryFetchTerms: (...args: Parameters<typeof fetchPresencesTermsAction>) => Promise<ITerm[]>;
  tryFetchUserChildren: (...args: Parameters<typeof fetchPresencesUserChildrenAction>) => Promise<IUserChild[]>;
}

export type PresencesHistoryDetailsScreenPrivateProps = PresencesHistoryDetailsScreenProps &
  PresencesHistoryDetailsScreenStoreProps &
  PresencesHistoryDetailsScreenDispatchProps &
  NativeStackScreenProps<PresencesNavigationParams, typeof presencesRouteNames.historyDetails>;
