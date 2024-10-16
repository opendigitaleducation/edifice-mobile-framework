import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { FlatList, RefreshControl, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { ModalBoxHandle } from '~/framework/components/ModalBox';
import { EmptyContentScreen, EmptyScreen } from '~/framework/components/empty-screens';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import SearchBar from '~/framework/components/search-bar';
import { getSession } from '~/framework/modules/auth/reducer';
import { fetchFormDistributionsAction, fetchFormsReceivedAction } from '~/framework/modules/form/actions';
import { FormDistributionCard } from '~/framework/modules/form/components/FormDistributionCard';
import FormDistributionListModal from '~/framework/modules/form/components/FormDistributionListModal';
import { DistributionStatus, IForm } from '~/framework/modules/form/model';
import moduleConfig from '~/framework/modules/form/module-config';
import { FormNavigationParams, formRouteNames } from '~/framework/modules/form/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { tryAction } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

import styles from './styles';
import { FormDistributionListScreenDispatchProps, FormDistributionListScreenPrivateProps, IFormDistributions } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<FormNavigationParams, typeof formRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('form-distributionlist-title'),
  }),
});

const FormDistributionListScreen = (props: FormDistributionListScreenPrivateProps) => {
  const [query, setQuery] = React.useState<string>('');
  const modalBoxRef = React.useRef<ModalBoxHandle>(null);
  const [modalDistributions, setModalDistributions] = React.useState<IFormDistributions | undefined>();
  const [hasOpenedNotificationForm, setOpenedNotificationForm] = React.useState<boolean>(false);

  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchList = async () => {
    try {
      await props.tryFetchDistributions();
      await props.tryFetchForms();
    } catch {
      throw new Error();
    }
  };

  const init = () => {
    setLoadingState(AsyncPagedLoadingState.INIT);
    fetchList()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    fetchList()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH);
    fetchList()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  const refreshSilent = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
    fetchList()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', () => {
      if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
      else refreshSilent();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navigation]);

  React.useEffect(() => {
    const { notificationFormId } = props.route.params;
    if (!notificationFormId || loadingState !== AsyncPagedLoadingState.DONE || hasOpenedNotificationForm) return;
    const item = props.formDistributions.find(f => f.id === notificationFormId);

    if (item) {
      setModalDistributions(item);
      modalBoxRef.current?.doShowModal();
      setOpenedNotificationForm(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  const updateQuery = (value: string) => setQuery(value);

  const openDistribution = (id: number, status: DistributionStatus, form: IForm) => {
    modalBoxRef.current?.doDismissModal();
    setTimeout(() => {
      props.navigation.navigate(formRouteNames.distribution, {
        id,
        status,
        formId: form.id,
        title: form.title,
        editable: form.editable,
      });
    }, 500); // prevent freeze due to navigation when modal is not dismissed
  };

  const onPressItem = (item: IFormDistributions) => {
    const { distributions } = item;

    if (!item.multiple || !distributions.some(distribution => distribution.status === DistributionStatus.FINISHED)) {
      openDistribution(distributions[0].id, distributions[0].status, item as IForm);
    } else {
      setModalDistributions(item);
      modalBoxRef.current?.doShowModal();
    }
  };

  const renderEmpty = () => {
    return query.length ? (
      <EmptyScreen svgImage="empty-search" title={I18n.get('form-distributionlist-emptyscreen-title-search')} />
    ) : (
      <EmptyScreen
        svgImage="empty-form"
        title={I18n.get('form-distributionlist-emptyscreen-title-default')}
        text={I18n.get('form-distributionlist-emptyscreen-text')}
      />
    );
  };

  const renderError = () => {
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={reload} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  const renderDistributionList = () => {
    return (
      <>
        <FlatList
          data={
            query
              ? props.formDistributions.filter(form => form.title.toLowerCase().includes(query.toLowerCase()))
              : props.formDistributions
          }
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <FormDistributionCard formDistributions={item} onOpen={onPressItem} />}
          refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.REFRESH} onRefresh={refresh} />}
          ListHeaderComponent={
            props.formDistributions.length > 4 ? (
              <SearchBar
                query={query}
                placeholder={I18n.get('form-distributionlist-searchbar-placeholder')}
                onChangeQuery={updateQuery}
              />
            ) : null
          }
          ListEmptyComponent={renderEmpty()}
          contentContainerStyle={styles.listContentContainer}
        />
        <FormDistributionListModal
          ref={modalBoxRef}
          distributions={modalDistributions?.distributions}
          form={modalDistributions as IForm}
          openDistribution={openDistribution}
        />
      </>
    );
  };

  const renderPage = () => {
    switch (loadingState) {
      case AsyncPagedLoadingState.DONE:
      case AsyncPagedLoadingState.REFRESH:
      case AsyncPagedLoadingState.REFRESH_FAILED:
      case AsyncPagedLoadingState.REFRESH_SILENT:
        return renderDistributionList();
      case AsyncPagedLoadingState.PRISTINE:
      case AsyncPagedLoadingState.INIT:
        return <LoadingIndicator />;
      case AsyncPagedLoadingState.INIT_FAILED:
      case AsyncPagedLoadingState.RETRY:
        return renderError();
    }
  };

  return <PageView>{renderPage()}</PageView>;
};

export default connect(
  (state: IGlobalState) => {
    const formState = moduleConfig.getState(state);
    const session = getSession();

    return {
      formDistributions: formState.forms.data
        .filter(form => !form.archived)
        .map(form => {
          return {
            ...form,
            distributions: formState.distributions.data.filter(d => d.formId === form.id),
          } as IFormDistributions;
        })
        .sort((a, b) => (a.distributions[0].dateSending < b.distributions[0].dateSending ? 1 : -1)),
      initialLoadingState: formState.distributions.isPristine ? AsyncPagedLoadingState.PRISTINE : AsyncPagedLoadingState.DONE,
      session,
    };
  },
  dispatch =>
    bindActionCreators<FormDistributionListScreenDispatchProps>(
      {
        tryFetchDistributions: tryAction(fetchFormDistributionsAction),
        tryFetchForms: tryAction(fetchFormsReceivedAction),
      },
      dispatch,
    ),
)(FormDistributionListScreen);
