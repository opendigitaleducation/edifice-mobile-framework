import { NavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ReactJSXElement } from 'node_modules/@emotion/react/dist/declarations/types/jsx-namespace';
import * as React from 'react';
import { ColorValue, TextInput, TouchableOpacity, View } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { Log } from '~/app/log';
import { defaultTheme } from '~/app/theme';
import FlatList from '~/framework/components/list/flat-list';
import PopupMenu from '~/framework/components/menus/popup';
import { NavBarAction } from '~/framework/components/navigation';
import { PageView } from '~/framework/components/page';
import { BodyText } from '~/framework/components/text';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { LogData, MenuData, LogScreenPrivateProps } from '~/framework/modules/user/screens/debug/log/types';
import { navBarOptions } from '~/framework/navigation/navBar';

import styles from './styles';

const exportLogFile = async () => {
  try {
    const logFileExists = await RNFS.exists(Log.logFilePath);

    if (!logFileExists) {
      console.error('Log file does not exist');
      return;
    }

    await Share.open({
      title: 'Export log file',
      url: `file://${Log.logFilePath}`,
    });
  } catch (error) {
    console.error('Error exporting log file: ', error as Error);
  }
};

export const computeNavBar = (
  { navigation, route }: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.log>,
  menuData: MenuData[],
): NativeStackNavigationOptions => {
  const hasMenuData = Array.isArray(menuData) && menuData.length > 0;

  return {
    ...navBarOptions({
      navigation,
      route,
      title: 'Debug log',
    }),
    ...(hasMenuData
      ? {
          headerRight: () => (
            <PopupMenu actions={menuData}>
              <NavBarAction icon="ui-options" />
            </PopupMenu>
          ),
        }
      : {}),
  };
};

const getRenderItem = ({ item }) => {
  return <LogCard item={item} />;
};

const ItemSeparator = () => (
  <View style={styles.separatorContainer}>
    <View style={styles.separator} />
  </View>
);

export const getSeverityColor = (severity: string): ColorValue => {
  switch (severity) {
    case 'INFO':
      return defaultTheme.palette.status.info.regular;
    case 'WARN':
      return defaultTheme.palette.status.warning.regular;
    case 'ERROR':
      return defaultTheme.palette.status.failure.regular;
    default:
      return defaultTheme.palette.grey.black;
  }
};

const LogCard = ({ item }): ReactJSXElement => {
  const navigation = useNavigation<NavigationProp<UserNavigationParams>>();
  const { time, severity, message } = item;

  return (
    <TouchableOpacity style={styles.logContainer} onPress={() => navigation.navigate(userRouteNames.detailed, { logData: item })}>
      {time && severity ? (
        <View style={styles.logTimeAndSeverityContainer}>
          <BodyText style={[styles.logSeverity, { color: getSeverityColor(severity) }]}>{severity}</BodyText>
          <BodyText>{time}</BodyText>
        </View>
      ) : null}
      <View style={styles.logMessageContainer}>
        <BodyText ellipsizeMode="tail" numberOfLines={2}>
          {message}
        </BodyText>
      </View>
    </TouchableOpacity>
  );
};

const LogScreen = (props: LogScreenPrivateProps) => {
  const [dataToLog, setDataToLog] = React.useState<LogData[] | []>([]);
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<string>('');
  const [filteredData, setFilteredData] = React.useState<LogData[] | []>([]);

  const togglePauseResume = () => {
    if (isPaused) {
      Log.resume();
    } else {
      Log.pause();
    }
    setIsPaused(!isPaused);
  };

  const clearLog = () => {
    Log.clear();
    setDataToLog([]);
  };

  const menuData: MenuData[] = React.useMemo(
    () => [
      { title: isPaused ? 'Resume' : 'Pause', action: togglePauseResume },
      { title: 'Clear log', action: clearLog },
      { title: 'Export log', action: exportLogFile },
    ],
    [isPaused],
  );

  React.useEffect(() => {
    const getDebugLogs = async () => {
      const debugLogs = await Log.contentsAsArray();
      const parsedLogs = debugLogs.map(parseLog) as LogData[];
      setDataToLog(parsedLogs);
      setFilteredData(parsedLogs);
    };
    getDebugLogs();
  }, [dataToLog]);

  React.useEffect(() => {
    if (query === '') {
      setFilteredData(dataToLog);
    } else {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = dataToLog.filter(
        log =>
          log.message?.toLowerCase().includes(lowerCaseQuery) ||
          log.time?.toLowerCase().includes(lowerCaseQuery) ||
          log.severity?.toLowerCase().includes(lowerCaseQuery),
      );
      setFilteredData(filtered);
    }
  }, [query, dataToLog]);

  React.useLayoutEffect(() => {
    props.navigation.setOptions(computeNavBar(props, menuData));
  }, [props.navigation, menuData]);

  const updateQuery = (value: string) => setQuery(value);

  const parseLog = (log: string) => {
    const logRegex = /(\d{2}:\d{2}:\d{2})\s+\|\s+\w+\s+\|\s+(\w+)\s+:\s+(.*)/;
    const match = log.match(logRegex);

    if (match) {
      const [_, time, severity, message] = match;
      return { time, severity, message };
    }

    return { time: null, severity: null, message: log };
  };

  return (
    <PageView style={styles.page}>
      {isPaused && (
        <View style={styles.pausedBanner}>
          <BodyText>Paused</BodyText>
        </View>
      )}
      <View style={styles.searchBarContainer}>
        <TextInput value={query} onChangeText={updateQuery} style={styles.searchBar} placeholder="Search..." />
      </View>
      <FlatList data={filteredData} ItemSeparatorComponent={ItemSeparator} renderItem={getRenderItem} />
    </PageView>
  );
};

export default LogScreen;
