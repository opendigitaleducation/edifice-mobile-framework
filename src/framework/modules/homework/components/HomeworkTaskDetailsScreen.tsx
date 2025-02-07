import * as React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import { Moment } from 'moment';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import SecondaryButton from '~/framework/components/buttons/secondary';
import { getScaleHeight, UI_SIZES } from '~/framework/components/constants';
import { deleteAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { HeadingSText, TextSizeStyle } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import HomeworkDayCheckpoint from '~/framework/modules/homework/components/HomeworkDayCheckpoint';
import { HomeworkNavigationParams, homeworkRouteNames } from '~/framework/modules/homework/navigation';
import { IHomeworkDiary } from '~/framework/modules/homework/reducers/diaryList';
import {
  deleteHomeworkEntryResourceRight,
  getHomeworkWorkflowInformation,
  hasPermissionManager,
} from '~/framework/modules/homework/rights';
import { getDayOfTheWeek } from '~/framework/util/date';
import Feedback from '~/framework/util/feedback/feedback';
import { Trackers } from '~/framework/util/tracker';
import HtmlContentView from '~/ui/HtmlContentView';

const dayImages = {
  friday: 'days-friday',
  monday: 'days-monday',
  saturday: 'days-saturday',
  thursday: 'days-thursday',
  tuesday: 'days-tuesday',
  wednesday: 'days-wednesday',
};

export interface HomeworkTaskDetailsScreenDataProps {
  diaryInformation?: IHomeworkDiary;
  session?: AuthLoggedAccount;
}

export interface HomeworkTaskDetailsScreenEventProps {
  handleDeleteHomeworkEntry(diaryId: string, entryId: string, date: Moment): Promise<void>;
  handleToggleHomeworkEntryStatus(diaryId: string, entryId: string, finished: boolean): Promise<void>;
  handleGetHomeworkTasks(diaryId: string): Promise<void>;
  dispatch: ThunkDispatch<any, any, any>;
}

export type IHomeworkTaskDetailsScreenProps = HomeworkTaskDetailsScreenDataProps &
  HomeworkTaskDetailsScreenEventProps &
  NativeStackScreenProps<HomeworkNavigationParams, typeof homeworkRouteNames.homeworkTaskDetails>;

const styles = StyleSheet.create({
  banner: {
    alignItems: 'flex-end',
    aspectRatio: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.minor,
  },
  checkboxButtonContainer: {
    alignItems: 'center',
    margin: UI_SIZES.spacing.big,
  },
  confetti: {
    height: '100%',
  },
  confettiContainer: {
    bottom: -getScaleHeight(28),
    height: getScaleHeight(180),
    position: 'absolute',
    width: '100%',
  },
  content: {
    ...TextSizeStyle.Medium,
    marginTop: UI_SIZES.spacing.medium,
  },
  contentContainer: {
    padding: UI_SIZES.spacing.medium,
  },
  dayImage: {
    aspectRatio: 1,
    height: '100%',
  },
  page: {
    backgroundColor: theme.ui.background.card,
  },
});

export class HomeworkTaskDetailsScreen extends React.PureComponent<IHomeworkTaskDetailsScreenProps, object> {
  state = {
    checked: this.props.route.params.task.finished,
    playAnimation: false,
  };

  async doDeleteDiaryEntry(diaryId: string, entryId: string, date: Moment) {
    try {
      const { handleDeleteHomeworkEntry, handleGetHomeworkTasks, navigation } = this.props;
      if (!diaryId || !entryId || !date) {
        throw new Error('failed to call api (missing information)');
      }

      await handleDeleteHomeworkEntry(diaryId, entryId, date);
      await handleGetHomeworkTasks(diaryId);
      navigation.goBack();
    } catch {
      Toast.showError(I18n.get('homework-taskdetails-deletion-error'));
    }
  }

  async doToggleDiaryEntryStatus(finished: boolean) {
    try {
      const { handleGetHomeworkTasks, handleToggleHomeworkEntryStatus, route } = this.props;
      const { checked } = this.state;
      const diaryId = route.params.diaryId;
      const taskId = route.params.task.taskId;
      if (!diaryId || !taskId) {
        throw new Error('failed to call api (missing information)');
      }
      await handleToggleHomeworkEntryStatus(diaryId, taskId, finished);
      await handleGetHomeworkTasks(diaryId);
      this.setState({ checked: !checked, playAnimation: !checked });
      Feedback.actionDone();
    } catch {
      Toast.showError(I18n.get('homework-taskdetails-status-error'));
    }
  }

  handleAnimationFinished() {
    this.setState({ playAnimation: false });
  }

  updateNavBarTitle() {
    const { diaryInformation, navigation, route, session } = this.props;
    const hasDeletionRight =
      session &&
      (hasPermissionManager(diaryInformation!, deleteHomeworkEntryResourceRight, session) ||
        diaryInformation?.owner.userId === session.user.id);
    const diaryId = route.params.diaryId;
    const task = route.params.task;
    const taskId = task.taskId;
    const date = task.date;
    const menuData = [
      deleteAction({
        action: () => {
          Alert.alert(I18n.get('homework-taskdetails-deletion-title'), I18n.get('homework-taskdetails-deletion-text'), [
            {
              style: 'default',
              text: I18n.get('common-cancel'),
            },
            {
              onPress: () => {
                this.doDeleteDiaryEntry(diaryId, taskId, date);
              },
              style: 'destructive',
              text: I18n.get('common-delete'),
            },
          ]);
        },
      }),
    ];

    navigation.setOptions({
      headerRight: () =>
        hasDeletionRight ? (
          <PopupMenu actions={menuData}>
            <NavBarAction icon="ui-options" />
          </PopupMenu>
        ) : undefined,
    });
  }

  componentDidMount() {
    this.updateNavBarTitle();
  }

  render() {
    const { route, session } = this.props;
    const { checked, playAnimation } = this.state;
    const { content, date, title } = route.params.task;
    const dayOfTheWeek = getDayOfTheWeek(date);
    const dayColor = theme.color.homework.days[dayOfTheWeek].background;
    const opacity = 80;
    const bannerColor = `${dayColor}${opacity}`;
    const homeworkWorkflowInformation = session && getHomeworkWorkflowInformation(session);
    const hasCheckHomeworkResourceRight = homeworkWorkflowInformation && homeworkWorkflowInformation.check;
    const animationSource = require('ASSETS/animations/homework/done.json');
    return (
      <PageView style={styles.page}>
        <View style={[styles.banner, { backgroundColor: bannerColor }]}>
          <View>
            <HomeworkDayCheckpoint date={date} />
          </View>
          <Svg name={dayImages[dayOfTheWeek]} style={styles.dayImage} />
        </View>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {title ? <HeadingSText>{title}</HeadingSText> : null}
          {content ? (
            <HtmlContentView
              html={content}
              opts={{ globalTextStyle: styles.content }}
              onDownload={() => Trackers.trackEvent('Homeworks', 'DOWNLOAD ATTACHMENT', 'Read mode')}
              onError={() => Trackers.trackEvent('Homeworks', 'DOWNLOAD ATTACHMENT ERROR', 'Read mode')}
              onDownloadAll={() => Trackers.trackEvent('Homeworks', 'DOWNLOAD ALL ATTACHMENTS', 'Read mode')}
              onOpen={() => Trackers.trackEvent('Homeworks', 'OPEN ATTACHMENT', 'Read mode')}
            />
          ) : null}

          {hasCheckHomeworkResourceRight ? (
            <View style={styles.checkboxButtonContainer}>
              <SecondaryButton
                text={I18n.get('homework-taskdetails-status-done')}
                action={() => this.doToggleDiaryEntryStatus(!checked)}
                iconLeft={checked ? 'ui-checkbox-on' : 'ui-checkbox-off'}
              />
              {playAnimation ? (
                <View pointerEvents="none" style={styles.confettiContainer}>
                  <LottieView
                    autoPlay
                    loop={false}
                    resizeMode="contain"
                    source={animationSource}
                    style={styles.confetti}
                    onAnimationFinish={() => this.handleAnimationFinished()}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </PageView>
    );
  }
}

export default HomeworkTaskDetailsScreen;
