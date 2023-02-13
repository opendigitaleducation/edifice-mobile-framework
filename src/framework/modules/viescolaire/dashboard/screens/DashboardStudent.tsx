import moment from 'moment';
import * as React from 'react';
import { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { IGlobalState } from '~/app/store';
import { getSession } from '~/framework/modules/auth/reducer';
import { fetchCompetencesDevoirsAction, fetchCompetencesLevelsAction } from '~/framework/modules/viescolaire/competences/actions';
import { IDevoirsMatieres, ILevel } from '~/framework/modules/viescolaire/competences/model';
import competencesConfig from '~/framework/modules/viescolaire/competences/module-config';
import { fetchPersonnelListAction } from '~/framework/modules/viescolaire/dashboard/actions/personnel';
import DashboardComponent from '~/framework/modules/viescolaire/dashboard/components/DashboardStudent';
import { fetchDiaryHomeworksAction, updateDiaryHomeworkProgressAction } from '~/framework/modules/viescolaire/diary/actions';
import { IHomeworkMap } from '~/framework/modules/viescolaire/diary/model';
import diaryConfig from '~/framework/modules/viescolaire/diary/module-config';
import { AsyncState } from '~/framework/util/redux/async';

import { IAuthorizedViescoApps } from './home/screen';

class Dashboard extends React.PureComponent<{
  authorizedViescoApps: IAuthorizedViescoApps;
  homeworks: AsyncState<IHomeworkMap>;
  structureId: string;
  childId: string;
  evaluations: AsyncState<IDevoirsMatieres>;
  levels: ILevel[];
  getTeachers: (structureId: string) => void;
  getHomeworks: (structureId: string, startDate: string, endDate: string) => void;
  getDevoirs: (structureId: string, childId: string) => void;
  getLevels: (structureId: string) => void;
  navigation: NavigationScreenProp<any>;
}> {
  constructor(props) {
    super(props);
    const { structureId, getHomeworks, childId } = props;
    this.state = {
      // fetching next month homeworks only, when screen is focused
      focusListener: this.props.navigation.addListener('willFocus', () => {
        getHomeworks(structureId, moment().add(1, 'days').format('YYYY-MM-DD'), moment().add(1, 'month').format('YYYY-MM-DD'));
        this.props.getDevoirs(structureId, childId);
      }),
    };
  }

  public componentDidMount() {
    const { structureId } = this.props;
    this.props.getTeachers(structureId);
    this.props.getLevels(structureId);
  }

  public render() {
    return <DashboardComponent {...this.props} />;
  }
}

// ------------------------------------------------------------------------------------------------

const mapStateToProps = (state: IGlobalState): any => {
  const session = getSession(state);
  const competencesState = competencesConfig.getState(state);
  const diaryState = diaryConfig.getState(state);

  return {
    homeworks: diaryState.homeworks,
    structureId: session?.user.structures?.[0]?.id,
    childId: session?.user.id,
    evaluations: competencesState.devoirsMatieres,
    levels: competencesState.levels.data,
  };
};

const mapDispatchToProps: (dispatch: any) => any = dispatch => {
  return bindActionCreators(
    {
      getTeachers: fetchPersonnelListAction,
      getHomeworks: fetchDiaryHomeworksAction,
      updateHomeworkProgress: updateDiaryHomeworkProgressAction,
      getDevoirs: fetchCompetencesDevoirsAction,
      getLevels: fetchCompetencesLevelsAction,
    },
    dispatch,
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
