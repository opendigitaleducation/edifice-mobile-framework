import { createStackNavigator } from 'react-navigation-stack';

import moduleConfig from './moduleConfig';
import SchoolbookWordDetailsScreen from './screens/SchoolbookWordDetailsScreen';
import SchoolbookWordListScreen from './screens/SchoolbookWordListScreen';
import SchoolbookWordReportScreen from './screens/SchoolbookWordReportScreen';

export const timelineRoutes = {
  [`${moduleConfig.routeName}`]: {
    screen: SchoolbookWordListScreen,
  },
  [`${moduleConfig.routeName}/details`]: {
    screen: SchoolbookWordDetailsScreen,
  },
  [`${moduleConfig.routeName}/report`]: {
    screen: SchoolbookWordReportScreen,
  },
};

export default () =>
  createStackNavigator(
    {
      ...timelineRoutes,
    },
    {
      headerMode: 'none',
    },
  );
