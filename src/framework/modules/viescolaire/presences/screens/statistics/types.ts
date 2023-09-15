import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ISession } from '~/framework/modules/auth/model';
import type { ISchoolYear, ITerm } from '~/framework/modules/viescolaire/common/model';
import type {
  fetchPresencesSchoolYearAction,
  fetchPresencesStatisticsAction,
  fetchPresencesTermsAction,
  fetchPresencesUserChildrenAction,
} from '~/framework/modules/viescolaire/presences/actions';
import type { IStatistics, IUserChild } from '~/framework/modules/viescolaire/presences/model';
import type { PresencesNavigationParams, presencesRouteNames } from '~/framework/modules/viescolaire/presences/navigation';
import type { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

export interface PresencesStatisticsScreenProps {
  initialLoadingState: AsyncPagedLoadingState;
}

export interface PresencesStatisticsScreenNavParams {
  studentId?: string;
}

export interface PresencesStatisticsScreenStoreProps {
  schoolYear: ISchoolYear | undefined;
  statistics: IStatistics;
  terms: ITerm[];
  classes?: string[];
  session?: ISession;
  userId?: string;
  userType?: string;
}

export interface PresencesStatisticsScreenDispatchProps {
  tryFetchSchoolYear: (...args: Parameters<typeof fetchPresencesSchoolYearAction>) => Promise<ISchoolYear>;
  tryFetchStatistics: (...args: Parameters<typeof fetchPresencesStatisticsAction>) => Promise<IStatistics>;
  tryFetchTerms: (...args: Parameters<typeof fetchPresencesTermsAction>) => Promise<ITerm[]>;
  tryFetchUserChildren: (...args: Parameters<typeof fetchPresencesUserChildrenAction>) => Promise<IUserChild[]>;
}

export type PresencesStatisticsScreenPrivateProps = PresencesStatisticsScreenProps &
  PresencesStatisticsScreenStoreProps &
  PresencesStatisticsScreenDispatchProps &
  NativeStackScreenProps<PresencesNavigationParams, typeof presencesRouteNames.statistics>;
