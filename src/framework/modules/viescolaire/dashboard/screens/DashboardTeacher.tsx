import * as React from 'react';
import { connect } from 'react-redux';

import DashboardComponent from '~/framework/modules/viescolaire/dashboard/components/DashboardTeacher';

class Dashboard extends React.PureComponent<any> {
  public render() {
    return <DashboardComponent {...this.props} />;
  }
}

const mapStateToProps: (state: any) => any = state => {
  const structureId = state.user.info.administrativeStructures[0].id || state.user.info.structures[0];

  return {
    structureId,
  };
};

export default connect(mapStateToProps)(Dashboard);
