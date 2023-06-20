import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { EmptyConnectionScreen } from '~/framework/components/emptyConnectionScreen';
import FlatList from '~/framework/components/list/flat-list';
import { PageView } from '~/framework/components/page';
import ScrollView from '~/framework/components/scrollView';
import { getSession } from '~/framework/modules/auth/reducer';
import { getNewsItemsAction, getNewsThreadsAction } from '~/framework/modules/newsv2/actions';
import NoNewsScreen from '~/framework/modules/newsv2/components/empty-screen';
import NewsCard from '~/framework/modules/newsv2/components/news-card';
import NewsPlaceholderHome from '~/framework/modules/newsv2/components/placeholder/home';
import ThreadsSelector from '~/framework/modules/newsv2/components/threads-selector';
import { NewsItem, NewsThreadItem } from '~/framework/modules/newsv2/model';
import { NewsNavigationParams, newsRouteNames } from '~/framework/modules/newsv2/navigation';
import { getNewsRights } from '~/framework/modules/newsv2/rights';
import { navBarOptions } from '~/framework/navigation/navBar';
import { isEmpty } from '~/framework/util/object';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

import styles from './styles';
import { NewsHomeScreenDataProps, NewsHomeScreenEventProps, NewsHomeScreenProps, NewsThreadItemReduce } from './types';

const convertArrayToObject = (array: NewsThreadItem[], key) => {
  const initialValue = {};
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: { title: item.title, icon: item.icon, sharedRights: item.sharedRights, ownerId: item.owner.id },
    };
  }, initialValue);
};

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<NewsNavigationParams, typeof newsRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('news-appName'),
  }),
});

const NewsHomeScreen = (props: NewsHomeScreenProps) => {
  const { navigation, session, handleGetNewsItems, handleGetNewsThreads } = props;

  const [threads, setThreads] = useState<NewsThreadItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [idThreadSelected, setIdThreadSelected] = useState<number | undefined>(undefined);
  const [showPlaceholder, setShowPlaceholder] = useState<boolean>(true);
  const [loadingState, setLoadingState] = useState<AsyncPagedLoadingState>(AsyncPagedLoadingState.PRISTINE);
  const [page, setPage] = useState<number>(0);

  const threadsInfosReduce = useMemo(() => convertArrayToObject(threads, 'id'), [threads]);
  const wf = useMemo(() => getNewsRights(session!), [session]);
  const canCreateNewsForSelectedThread: boolean = React.useMemo(
    () => (idThreadSelected ? !isEmpty(threadsInfosReduce[idThreadSelected].sharedRights) : false),
    [idThreadSelected, threadsInfosReduce],
  );
  const canCreateNewsForOneThread: boolean = React.useMemo(() => threads?.some(thread => !isEmpty(thread.sharedRights)), [threads]);

  const onOpenNewsItem = useCallback(
    (item: NewsItem, thread: NewsThreadItemReduce) => {
      navigation.navigate(newsRouteNames.details, {
        news: item,
        thread,
      });
    },
    [navigation],
  );

  const onFilter = useCallback(
    async (idThread: number | undefined) => {
      try {
        setPage(0);
        setIdThreadSelected(idThread);

        const data = await handleGetNewsItems(0, idThread);
        setNews(data);
      } catch {
        setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED);
        throw new Error();
      }
    },
    [handleGetNewsItems],
  );

  const init = useCallback(async () => {
    try {
      const data = await Promise.all([handleGetNewsThreads(), handleGetNewsItems(0, idThreadSelected)]);
      setThreads(data[0]);
      setNews(data[1]);
      setShowPlaceholder(false);
      setLoadingState(AsyncPagedLoadingState.DONE);
    } catch {
      setShowPlaceholder(false);
      setLoadingState(AsyncPagedLoadingState.INIT_FAILED);
    }
  }, [handleGetNewsItems, handleGetNewsThreads, idThreadSelected]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (loadingState === AsyncPagedLoadingState.PRISTINE) init();
    });
    return unsubscribe;
  }, [init, loadingState, navigation]);

  const renderError = useCallback(() => {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.REFRESH} onRefresh={() => init()} />}>
        <EmptyConnectionScreen />
      </ScrollView>
    );
  }, [init, loadingState]);

  const fetchNextPage = useCallback(
    async (threadIdSelected: number | undefined) => {
      try {
        const data = await handleGetNewsItems(page + 1, threadIdSelected);
        if (!isEmpty(data)) setPage(page + 1);
        setNews(news.concat(data));
      } catch {
        setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED);
        throw new Error();
      }
    },
    [handleGetNewsItems, news, page],
  );

  const renderPage = useCallback(() => {
    if (loadingState === (AsyncPagedLoadingState.INIT_FAILED || AsyncPagedLoadingState.REFRESH_FAILED)) return renderError();
    // empty screen with create threads button when no threads, news && can create threads
    if (isEmpty(threads) && isEmpty(news) && wf.threads.create) return <NoNewsScreen createThreads />;
    // empty screen with create news button when only one thread && no news && can create news on this thread
    if (threads.length === 1 && isEmpty(news) && !isEmpty(threads[0].sharedRights)) return <NoNewsScreen createNews />;
    // empty screen with no button when only one thread && no news or no threads && no news
    if ((threads.length === 1 && isEmpty(news)) || (isEmpty(threads) && isEmpty(news))) return <NoNewsScreen />;

    return (
      <FlatList
        style={[styles.flatlist, threads.length <= 1 ? styles.flatlistNoThreadSelector : null]}
        data={news}
        renderItem={({ item }: { item: NewsItem }) => {
          const newsThread: NewsThreadItemReduce = threadsInfosReduce[`${item.threadId}`];
          return <NewsCard news={item} thread={newsThread} onPress={() => onOpenNewsItem(item, newsThread)} />;
        }}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={threads.length > 1 ? <ThreadsSelector threads={threads} onSelect={id => onFilter(id)} /> : undefined}
        ListEmptyComponent={
          <NoNewsScreen createNews={idThreadSelected ? canCreateNewsForSelectedThread : canCreateNewsForOneThread} />
        }
        refreshControl={
          <RefreshControl
            refreshing={loadingState === AsyncPagedLoadingState.REFRESH}
            onRefresh={() => {
              setPage(0);
              init();
            }}
          />
        }
        onEndReached={() => fetchNextPage(idThreadSelected)}
        onEndReachedThreshold={0.5}
      />
    );
  }, [
    loadingState,
    renderError,
    threads,
    news,
    wf,
    idThreadSelected,
    canCreateNewsForSelectedThread,
    canCreateNewsForOneThread,
    threadsInfosReduce,
    onOpenNewsItem,
    onFilter,
    init,
    fetchNextPage,
  ]);

  return <PageView>{showPlaceholder ? <NewsPlaceholderHome /> : renderPage()}</PageView>;
};

const mapStateToProps: (s: IGlobalState) => NewsHomeScreenDataProps = s => ({
  session: getSession(),
});

const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => NewsHomeScreenEventProps = (
  dispatch,
  getState,
) => ({
  handleGetNewsThreads: async () => {
    return (await dispatch(getNewsThreadsAction())) as NewsThreadItem[];
  },
  handleGetNewsItems: async (page: number, threadId?: number) => {
    return (await dispatch(getNewsItemsAction(page, threadId))) as NewsItem[];
  },
});

const NewsHomeScreenConnected = connect(mapStateToProps, mapDispatchToProps)(NewsHomeScreen);
export default NewsHomeScreenConnected;
