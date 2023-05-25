import { NavigationProp, ParamListBase, UNSTABLE_usePreventRemove, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert } from 'react-native';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import CheckboxButton from '~/framework/components/buttons/checkbox';
import FlatList from '~/framework/components/flatList';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { PageView } from '~/framework/components/page';
import { setFiltersAction } from '~/framework/modules/timeline/actions/notif-settings';
import moduleConfig from '~/framework/modules/timeline/module-config';
import { ITimelineNavigationParams, timelineRouteNames } from '~/framework/modules/timeline/navigation';
import { TimelineState } from '~/framework/modules/timeline/reducer';
import { NotificationFilter } from '~/framework/modules/timeline/reducer/notif-definitions/notif-filters';
import { INotifFilterSettings } from '~/framework/modules/timeline/reducer/notif-settings/notif-filter-settings';
import { clearConfirmNavigationEvent, handleRemoveConfirmNavigationEvent } from '~/framework/navigation/helper';
import { navBarOptions } from '~/framework/navigation/navBar';
import { shallowEqual } from '~/framework/util/object';

export interface ITimelineFiltersScreenDataProps {
  notifFilterSettings: INotifFilterSettings;
  notifFilters: NotificationFilter[];
}
export interface ITimelineFiltersScreenEventProps {
  handleSetFilters(selectedFilters: INotifFilterSettings): Promise<void>;
}
export type ITimelineFiltersScreenProps = ITimelineFiltersScreenDataProps &
  ITimelineFiltersScreenEventProps &
  NativeStackScreenProps<ITimelineNavigationParams, 'Filters'>;

export interface ITimelineFiltersScreenState {
  selectedFilters: INotifFilterSettings;
}

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<ITimelineNavigationParams, typeof timelineRouteNames.Filters>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('timeline.filtersScreen.title'),
  }),
});

function PreventBack(props: { onPreventBack: boolean }) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  UNSTABLE_usePreventRemove(props.onPreventBack, ({ data }) => {
    Alert.alert(I18n.get('common.confirmationLeaveAlert.title'), I18n.get('common.confirmationLeaveAlert.message'), [
      {
        text: I18n.get('common.cancel'),
        style: 'cancel',
        onPress: () => {
          clearConfirmNavigationEvent();
        },
      },
      {
        text: I18n.get('common.quit'),
        style: 'destructive',
        onPress: () => {
          handleRemoveConfirmNavigationEvent(data.action, navigation);
        },
      },
    ]);
  });
  return null;
}

export class TimelineFiltersScreen extends React.PureComponent<ITimelineFiltersScreenProps, ITimelineFiltersScreenState> {
  state: ITimelineFiltersScreenState = {
    selectedFilters: { ...this.props.notifFilterSettings },
  };

  render() {
    const { selectedFilters } = this.state;
    const { notifFilterSettings } = this.props;
    const areFiltersUnchanged = shallowEqual(notifFilterSettings, selectedFilters);
    const noneSet = Object.values(selectedFilters).every(value => !value);
    this.updateNavBar();
    return (
      <>
        <PreventBack onPreventBack={(!areFiltersUnchanged || noneSet) && Object.keys(notifFilterSettings).length > 0} />
        <PageView>{this.renderList()}</PageView>
      </>
    );
  }

  renderList() {
    const { notifFilters } = this.props;
    const { selectedFilters } = this.state;
    const someNotSet = Object.values(selectedFilters).some(value => !value);
    return (
      <FlatList
        // data
        data={notifFilters}
        initialNumToRender={15} // Items are thin, 15 renders ok on iPhone 13
        ListHeaderComponent={
          notifFilters.length < 2 ? null : (
            <CheckboxButton onPress={() => this.doToggleAllFilters()} title="common.all" isChecked={!someNotSet} isAllButton />
          )
        }
        renderItem={({ item }) => this.renderFilterItem(item)}
      />
    );
  }

  renderFilterItem(item: NotificationFilter) {
    const { selectedFilters } = this.state;
    return <CheckboxButton onPress={() => this.doToggleFilter(item)} title={item.i18n} isChecked={selectedFilters[item.type]} />;
  }

  mounted: boolean = false;

  componentDidMount(): void {
    this.mounted = true;
    this.updateNavBar();
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  doToggleFilter(item: NotificationFilter) {
    if (!this.mounted) return;
    const { selectedFilters } = this.state;
    this.setState({
      selectedFilters: { ...selectedFilters, [item.type]: !selectedFilters[item.type] },
    });
  }

  doToggleAllFilters() {
    if (!this.mounted) return;
    const { selectedFilters } = this.state;
    const someNotSet = Object.values(selectedFilters).some(value => !value);
    const selectedFiltersKeys = Object.keys(selectedFilters);
    const updatedSelectedFilters = selectedFilters;
    selectedFiltersKeys.forEach(element => (updatedSelectedFilters[element] = someNotSet));
    this.setState({ selectedFilters: { ...updatedSelectedFilters } });
  }

  async doSetFilters(selectedFilters: INotifFilterSettings) {
    if (!this.mounted) return;
    const { handleSetFilters, navigation } = this.props;
    await handleSetFilters(selectedFilters);
    navigation.navigate(timelineRouteNames.Home, { reloadWithNewSettings: true });
  }

  updateNavBar() {
    if (!this.mounted) return;
    const { selectedFilters } = this.state;
    const { notifFilterSettings } = this.props;
    const areFiltersUnchanged = shallowEqual(notifFilterSettings, selectedFilters);
    const noneSet = Object.values(selectedFilters).every(value => !value);
    this.props.navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <NavBarAction
          icon="ui-check"
          disabled={areFiltersUnchanged || noneSet}
          onPress={() => this.doSetFilters(selectedFilters)}
        />
      ),
    });
  }
}

const mapStateToProps: (s: IGlobalState) => ITimelineFiltersScreenDataProps = s => {
  const ts = moduleConfig.getState(s) as TimelineState;
  return {
    notifFilterSettings: ts.notifSettings.notifFilterSettings.data,
    notifFilters:
      ts?.notifDefinitions?.notifFilters?.data?.sort((a, b) => I18n.get(a.i18n).localeCompare(I18n.get(b.i18n), I18n.language)) ||
      [],
  };
};

const mapDispatchToProps: (
  dispatch: ThunkDispatch<any, any, any>,
  getState: () => IGlobalState,
) => ITimelineFiltersScreenEventProps = (dispatch, getState) => ({
  handleSetFilters: async (selectedFilters: INotifFilterSettings) => {
    await dispatch(setFiltersAction(selectedFilters));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(TimelineFiltersScreen);