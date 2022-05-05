import moment from 'moment';
import * as React from 'react';
import { NavigationScreenProp, withNavigationFocus } from 'react-navigation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { getUserSession } from '~/framework/util/session';
import withViewTracking from '~/framework/util/tracker/withViewTracking';
import { fetchChildHomeworkAction } from '~/modules/viescolaire/cdt/actions/homeworks';
import { IHomeworkListState, getHomeworksListState } from '~/modules/viescolaire/cdt/state/homeworks';
import { fetchLevelsAction } from '~/modules/viescolaire/competences/actions/competencesLevels';
import { fetchDevoirListAction } from '~/modules/viescolaire/competences/actions/devoirs';
import { ILevelsList, getLevelsListState } from '~/modules/viescolaire/competences/state/competencesLevels';
import { IDevoirsMatieresState, getDevoirListState } from '~/modules/viescolaire/competences/state/devoirs';
import { fetchChildrenGroupsAction } from '~/modules/viescolaire/viesco/actions/childrenGroups';
import { fetchPersonnelListAction } from '~/modules/viescolaire/viesco/actions/personnel';
import { fetchSubjectListAction } from '~/modules/viescolaire/viesco/actions/subjects';
import DashboardComponent from '~/modules/viescolaire/viesco/components/DashboardRelative';
import { getSelectedChild, getSelectedChildStructure } from '~/modules/viescolaire/viesco/state/children';
import { getSubjectsListState } from '~/modules/viescolaire/viesco/state/subjects';

import NotificationRelativesModal from '../../presences/containers/NotificationRelativesModal';
import { IAuthorizedViescoApps } from './Dashboard';

type IDashboardContainerProps = {
  authorizedViescoApps: IAuthorizedViescoApps;
  userId: string;
  homeworks: IHomeworkListState;
  evaluations: IDevoirsMatieresState;
  hasRightToCreateAbsence: boolean;
  structureId: string;
  childId: string;
  levels: ILevelsList;
  getSubjects: (structureId: string) => void;
  getHomeworks: (childId: string, structureId: string, startDate: string, endDate: string) => void;
  getDevoirs: (structureId: string, childId: string) => void;
  getTeachers: (structureId: string) => void;
  getLevels: (structureId: string) => void;
  getChildrenGroups: (structureId: string) => void;
  navigation: NavigationScreenProp<any>;
  isFocused: boolean;
};

type IDashboardContainerState = {
  notificationModal: boolean;
};

class Dashboard extends React.PureComponent<IDashboardContainerProps, IDashboardContainerState> {
  constructor(props) {
    super(props);

    this.state = {
      notificationModal: true,
    };
  }

  public componentDidMount() {
    const { childId, structureId } = this.props;

    this.props.getSubjects(this.props.structureId);
    this.props.getTeachers(this.props.structureId);
    this.props.getHomeworks(
      childId,
      structureId,
      moment().add(1, 'day').format('YYYY-MM-DD'),
      moment().add(1, 'month').format('YYYY-MM-DD'),
    );
    this.props.getDevoirs(structureId, childId);
    this.props.getLevels(structureId);
    this.props.getChildrenGroups(structureId);
  }

  public componentDidUpdate(prevProps) {
    const { childId, structureId, isFocused } = this.props;

    if (prevProps.childId !== childId) {
      this.props.getSubjects(this.props.structureId);
      this.props.getTeachers(this.props.structureId);
      this.props.getLevels(structureId);
      this.props.getChildrenGroups(structureId);
    }
    if (isFocused && (prevProps.isFocused !== isFocused || prevProps.childId !== childId)) {
      this.props.getHomeworks(
        childId,
        structureId,
        moment().add(1, 'day').format('YYYY-MM-DD'),
        moment().add(1, 'month').format('YYYY-MM-DD'),
      );
      this.props.getDevoirs(structureId, childId);
    }
  }

  onCloseNotificationModal = () => this.setState({ notificationModal: false });

  public render() {
    return (
      <>
        <DashboardComponent {...this.props} />
        {/*this.props.authorizedViescoApps.presences ? (
          <NotificationRelativesModal showModal={this.state.notificationModal} onClose={this.onCloseNotificationModal} />
        ) : null*/}
      </>
    );
  }
}

// ------------------------------------------------------------------------------------------------

const mapStateToProps: (state: any) => any = state => {
  const userId = getUserSession().user.id;
  const childId = getSelectedChild(state).id;
  const homeworks = getHomeworksListState(state);
  const subjects = getSubjectsListState(state);
  const structureId = getSelectedChildStructure(state)?.id;
  const evaluations = getDevoirListState(state);
  const levels = getLevelsListState(state).data;

  const authorizedActions = state.user.info.authorizedActions;
  const hasRightToCreateAbsence =
    authorizedActions && authorizedActions.some(action => action.displayName === 'presences.absence.statements.create');

  return {
    userId,
    homeworks,
    evaluations,
    hasRightToCreateAbsence,
    structureId,
    childId,
    subjects,
    levels,
  };
};

const mapDispatchToProps: (dispatch: any) => any = dispatch => {
  return bindActionCreators(
    {
      getSubjects: fetchSubjectListAction,
      getTeachers: fetchPersonnelListAction,
      getHomeworks: fetchChildHomeworkAction,
      getDevoirs: fetchDevoirListAction,
      getLevels: fetchLevelsAction,
      getChildrenGroups: fetchChildrenGroupsAction,
    },
    dispatch,
  );
};

export default withViewTracking('viesco')(connect(mapStateToProps, mapDispatchToProps)(withNavigationFocus(Dashboard)));
