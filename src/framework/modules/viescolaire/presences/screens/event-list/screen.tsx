import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment, { Moment } from 'moment';
import * as React from 'react';
import { ColorValue, FlatList, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { EmptyScreen } from '~/framework/components/empty-screens';
import { PageView } from '~/framework/components/page';
import { NestedBoldText, SmallText } from '~/framework/components/text';
import {
  CommonEvent,
  Event,
  EventType,
  ForgottenNotebook,
  Incident,
  Punishment,
} from '~/framework/modules/viescolaire/presences/model';
import { PresencesNavigationParams, presencesRouteNames } from '~/framework/modules/viescolaire/presences/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import appConf from '~/framework/util/appConf';
import { isEmpty } from '~/framework/util/object';

import styles from './styles';
import type { PresencesEventListScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<PresencesNavigationParams, typeof presencesRouteNames.eventList>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get(`presences-statistics-${route.params.key}-title`),
  }),
});

const PresencesEventListScreen = (props: PresencesEventListScreenPrivateProps) => {
  const renderEvent = (color: ColorValue, startDate: Moment, endDate: Moment, isLatenessOrDeparture?: boolean) => {
    const isSingleDay = startDate.isSame(endDate, 'day');
    const format = moment().isSame(startDate, 'year') ? 'D MMMM' : 'D MMM YYYY';
    const time = isSingleDay
      ? appConf.is1d
        ? I18n.get(startDate.get('hour') < 12 ? 'presences-statistics-card-morning' : 'presences-statistics-card-afternoon')
        : startDate.format('H[h]mm') + ' - ' + endDate.format('H[h]mm')
      : null;
    const duration = endDate.diff(startDate, 'minutes');

    return (
      <View style={styles.eventContainer}>
        <View style={[styles.eventBulletContainer, { backgroundColor: color }]} />
        <SmallText>
          <NestedBoldText>
            {isSingleDay
              ? startDate.format(format)
              : I18n.get('presences-statistics-card-dates', { start: startDate.format('D'), end: endDate.format(format) })}
          </NestedBoldText>
          {isLatenessOrDeparture
            ? ` (${I18n.get('presences-history-eventcard-lateness-duration', { duration })})`
            : time
              ? ` (${time})`
              : null}
        </SmallText>
      </View>
    );
  };

  const renderSimpleEvent = (color: ColorValue, date: Moment, showTime?: boolean) => {
    const format = moment().isSame(date, 'year') ? 'D MMMM' : 'D MMM YYYY';

    return (
      <View style={styles.eventContainer}>
        <View style={[styles.eventBulletContainer, { backgroundColor: color }]} />
        <SmallText>
          <NestedBoldText>{date.format(format)}</NestedBoldText>
          {showTime ? date.format(' (H[h]mm)') : null}
        </SmallText>
      </View>
    );
  };

  const renderListItem = ({ item }: { item: Event }) => {
    switch (item.type) {
      case EventType.DEPARTURE:
        return renderEvent(
          theme.palette.complementary.pink.regular,
          (item as CommonEvent).startDate,
          (item as CommonEvent).endDate,
          true,
        );
      case EventType.FORGOTTEN_NOTEBOOK:
        return renderSimpleEvent(theme.palette.complementary.indigo.regular, (item as ForgottenNotebook).date);
      case EventType.INCIDENT:
        return renderSimpleEvent(theme.palette.grey.graphite, (item as Incident).date, true);
      case EventType.LATENESS:
        return renderEvent(
          theme.palette.complementary.purple.regular,
          (item as CommonEvent).startDate,
          (item as CommonEvent).endDate,
          true,
        );
      case EventType.NO_REASON:
        return renderEvent(theme.palette.complementary.red.regular, (item as CommonEvent).startDate, (item as CommonEvent).endDate);
      case EventType.PUNISHMENT:
        return renderSimpleEvent(theme.palette.complementary.yellow.regular, (item as Punishment).createdAt, true);
      case EventType.REGULARIZED:
        return renderEvent(
          theme.palette.complementary.green.regular,
          (item as CommonEvent).startDate,
          (item as CommonEvent).endDate,
        );
      case EventType.STATEMENT_ABSENCE:
      case EventType.UNREGULARIZED:
        return renderEvent(
          theme.palette.complementary.orange.regular,
          (item as CommonEvent).startDate,
          (item as CommonEvent).endDate,
        );
    }
  };

  const renderEmptyScreen = () => {
    return (
      <EmptyScreen
        svgImage="empty-zimbra"
        title={I18n.get('presences-statistics-empty-title')}
        textColor={theme.palette.grey.black}
        text={I18n.get('presences-statistics-empty-text')}
      />
    );
  };

  return (
    <PageView style={styles.pageContainer}>
      {isEmpty(props.route.params.events) ? (
        renderEmptyScreen()
      ) : (
        <FlatList
          data={props.route.params.events}
          keyExtractor={item => item.id}
          renderItem={renderListItem}
          ListHeaderComponent={
            <SmallText style={styles.headingText}>{I18n.get(`presences-statistics-${props.route.params.key}-heading`)}</SmallText>
          }
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </PageView>
  );
};

export default PresencesEventListScreen;
