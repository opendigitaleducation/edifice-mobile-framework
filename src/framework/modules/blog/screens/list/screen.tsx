/**
 * Blog post list
 */
import { NavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen, EmptyContentScreen, EmptyScreen } from '~/framework/components/empty-screens';
import FlatList from '~/framework/components/list/flat-list';
import { LoadingIndicator } from '~/framework/components/loading';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { PageView } from '~/framework/components/page';
import { audienceService } from '~/framework/modules/audience/service';
import { AuthActiveAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import BlogPlaceholderList from '~/framework/modules/blog/components/placeholder/list';
import BlogPostResourceCard from '~/framework/modules/blog/components/post-resource-card';
import moduleConfig from '~/framework/modules/blog/module-config';
import { BlogNavigationParams, blogRouteNames } from '~/framework/modules/blog/navigation';
import { Blog, BlogPost, BlogPostList, BlogPostWithAudience } from '~/framework/modules/blog/reducer';
import { getBlogPostRight, hasPermissionManager } from '~/framework/modules/blog/rights';
import { blogService } from '~/framework/modules/blog/service';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

import { styles } from './styles';
import { BlogPostListScreenDataProps, BlogPostListScreenEventProps, BlogPostListScreenProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<BlogNavigationParams, typeof blogRouteNames.blogPostList>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('blog-appname'),
  }),
});

const BlogPostListItem = ({ blog, post, session }: { blog: Blog; post: BlogPostWithAudience; session: AuthActiveAccount }) => {
  const navigation = useNavigation<NavigationProp<BlogNavigationParams, typeof blogRouteNames.blogPostList>>();
  const onOpenBlogPost = React.useCallback(() => {
    navigation.navigate(blogRouteNames.blogPostDetails, {
      blogPost: post,
      blog,
    });
  }, [blog, navigation, post]);

  const dateAsMoment = React.useMemo(() => moment(post.created), [post.created]);

  return (
    <BlogPostResourceCard
      action={onOpenBlogPost}
      authorId={post.author.userId}
      authorName={post.author.username}
      comments={post.comments?.length as number}
      contentHtml={post.content}
      date={dateAsMoment}
      title={post.title}
      state={post.state as 'PUBLISHED' | 'SUBMITTED'}
      resourceId={post._id}
      audience={post.audience}
      session={session}
      blogVisibility={blog.visibility}
      isManager={session && hasPermissionManager(blog, session)}
    />
  );
};

const BlogPostListScreen = (props: BlogPostListScreenProps) => {
  const selectedBlog = props.route.params.selectedBlog;
  const selectedBlogTitle = selectedBlog && selectedBlog.title;
  const selectedBlogId = selectedBlog && selectedBlog.id;
  const hasBlogPostCreationRights = props.session && selectedBlog && getBlogPostRight(selectedBlog, props.session)?.actionRight;
  const [blogPosts, setBlogPosts] = React.useState([] as BlogPostList);
  const [nextPageToFetchState, setNextPageToFetch] = React.useState(0);
  const [pagingSizeState, setPagingSize] = React.useState<number | undefined>(undefined);

  // ToDo : Make this in a useLoadingState.

  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchAudience = React.useCallback(async (newBlogPosts: BlogPost[]) => {
    try {
      const viewsForPosts = await audienceService.view.getSummary(
        'blog',
        'post',
        newBlogPosts.map(p => p._id),
      );
      const reactionsForPosts = await audienceService.reaction.getSummary(
        'blog',
        'post',
        newBlogPosts.map(p => p._id),
      );
      return newBlogPosts.map(p => {
        const views = viewsForPosts[p._id];
        const reactions = reactionsForPosts.reactionsByResource[p._id];
        return {
          ...p,
          audience: {
            views,
            reactions: {
              total: reactions?.totalReactionsCounter ?? 0,
              types: reactions?.reactionTypes ?? [],
              userReaction: reactions?.userReaction ?? null,
            },
          },
        };
      });
    } catch (e) {
      console.error('[BlogPostListScreen] fetchViews error :', e);
    }
  }, []);

  // Fetch a page of blog posts.
  // Auto-increment nextPageNumber unless `fromPage` is provided.
  // If `flushAfter` is also provided along `fromPage`, all content after the loaded page will be erased.
  /**
   * @throws Error
   */
  const fetchPage = React.useCallback(
    async (blogId: string, fromPage?: number, flushAfter?: boolean) => {
      try {
        const pageToFetch = fromPage ?? nextPageToFetchState; // If page is not defined, automatically fetch the next page
        if (pageToFetch < 0) return; // Negatives values are used to tell end has been reached.
        const session = props.session;
        if (!session) throw new Error('BlogPostListScreen.fetchPage: no session');
        let newBlogPosts: BlogPostWithAudience[] = await blogService.posts.page(session, blogId, pageToFetch, [
          'PUBLISHED',
          'SUBMITTED',
        ]);
        let pagingSize = pagingSizeState;
        if (!pagingSize) {
          setPagingSize(newBlogPosts.length);
          pagingSize = newBlogPosts.length;
        }
        if (pagingSize) {
          if (selectedBlog.visibility !== 'PUBLIC') {
            newBlogPosts = (await fetchAudience(newBlogPosts)) ?? newBlogPosts;
          }
          if (newBlogPosts!.length) {
            setBlogPosts([
              ...blogPosts.slice(0, pagingSize * pageToFetch),
              ...newBlogPosts,
              ...(flushAfter ? [] : blogPosts.slice(pagingSize * (pageToFetch + 1))),
            ]);
          }

          if (!fromPage) {
            setNextPageToFetch(newBlogPosts.length === 0 || newBlogPosts.length < pagingSize ? -1 : pageToFetch + 1);
          } else if (flushAfter) {
            setNextPageToFetch(fromPage + 1);
          }
          // Only increment pagecount when fromPage is not specified
        } else setBlogPosts([]);
      } catch {
        throw new Error();
      }
    },
    [blogPosts, fetchAudience, nextPageToFetchState, pagingSizeState, props.session, selectedBlog.visibility],
  );

  const fetchFromStart = React.useCallback(
    async (blogId: string) => {
      return fetchPage(blogId, 0, true);
    },
    [fetchPage],
  );

  const init = (selectedBlog_Id: string) => {
    if (selectedBlog_Id) {
      setLoadingState(AsyncPagedLoadingState.INIT);
      fetchFromStart(selectedBlog_Id)
        .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
        .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
    }
  };

  const reload = React.useCallback(
    (selectedBlog_Id: string) => {
      if (selectedBlog_Id) {
        setLoadingState(AsyncPagedLoadingState.RETRY);
        fetchFromStart(selectedBlog_Id)
          .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
          .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
      }
    },
    [fetchFromStart],
  );

  const refresh = React.useCallback(
    (selectedBlog_Id: string) => {
      if (selectedBlog_Id) {
        setLoadingState(AsyncPagedLoadingState.REFRESH);
        fetchFromStart(selectedBlog_Id)
          .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
          .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
      }
    },
    [fetchFromStart],
  );
  const refreshSilent = React.useCallback(
    (selectedBlog_Id: string) => {
      if (selectedBlog_Id) {
        setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
        fetchFromStart(selectedBlog_Id)
          .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
          .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
      }
    },
    [fetchFromStart],
  );
  const fetchNextPage = React.useCallback(
    (selectedBlog_Id: string) => {
      if (selectedBlog_Id) {
        setLoadingState(AsyncPagedLoadingState.FETCH_NEXT);
        fetchPage(selectedBlog_Id)
          .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
          .catch(() => setLoadingState(AsyncPagedLoadingState.FETCH_NEXT_FAILED));
      }
    },
    [fetchPage],
  );

  const onGoToPostCreationScreen = React.useCallback(
    () =>
      props.navigation.navigate(blogRouteNames.blogCreatePost, {
        blog: selectedBlog,
        referrer: `${moduleConfig.routeName}/posts`,
      }),
    [props.navigation, selectedBlog],
  );

  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', () => {
      if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init(selectedBlogId);
      else refreshSilent(selectedBlogId);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navigation]);

  React.useEffect(() => {
    const hasError =
      !selectedBlog || loadingState === AsyncPagedLoadingState.RETRY || loadingState === AsyncPagedLoadingState.INIT_FAILED;
    props.navigation.setOptions({
      headerTitle: navBarTitle(selectedBlogTitle ?? I18n.get('blog-appname')),
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () =>
        hasBlogPostCreationRights && !hasError ? (
          <NavBarAction
            icon="ui-plus"
            onPress={() => {
              onGoToPostCreationScreen();
            }}
          />
        ) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderEmpty = React.useCallback(() => {
    return (
      <EmptyScreen
        svgImage="empty-blog"
        title={I18n.get(
          hasBlogPostCreationRights ? 'blog-postlist-emptyscreen-title' : 'blog-postlist-emptyscreen-title-nocreationrights',
        )}
        text={I18n.get(
          hasBlogPostCreationRights ? 'blog-postlist-emptyscreen-text' : 'blog-postlist-emptyscreen-text-nocreationrights',
        )}
        {...(hasBlogPostCreationRights
          ? {
              buttonText: I18n.get('blog-postlist-emptyscreen-button'),
              buttonAction: onGoToPostCreationScreen,
            }
          : {})}
      />
    );
  }, [hasBlogPostCreationRights, onGoToPostCreationScreen]);

  const renderError = React.useCallback(() => {
    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={() => reload(selectedBlogId)} />
        }>
        <EmptyConnectionScreen />
      </ScrollView>
    );
  }, [loadingState, reload, selectedBlogId]);

  const renderItem = React.useCallback(
    ({ item }) => <BlogPostListItem blog={selectedBlog} post={item} session={props.session!} />,
    [props.session, selectedBlog],
  );

  const keyExtractor = React.useCallback((item: BlogPostWithAudience) => item._id, []);

  const onEndReached = React.useCallback(() => {
    fetchNextPage(selectedBlogId);
  }, [fetchNextPage, selectedBlogId]);

  const listHeaderComponent = React.useMemo(() => <View style={{ height: UI_SIZES.spacing.medium }} />, []);
  const listFooterComponent = React.useMemo(
    () => (
      <>
        {loadingState === AsyncPagedLoadingState.FETCH_NEXT ? <LoadingIndicator withVerticalMargins /> : null}
        <View style={{ paddingBottom: UI_SIZES.screen.bottomInset }} />
      </>
    ),
    [loadingState],
  );

  const refreshControl = React.useMemo(
    () => <RefreshControl refreshing={loadingState === AsyncPagedLoadingState.REFRESH} onRefresh={() => refresh(selectedBlogId)} />,
    [loadingState, refresh, selectedBlogId],
  );

  const renderBlogPostList = () => {
    return (
      <FlatList
        data={blogPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={listHeaderComponent}
        ListFooterComponent={listFooterComponent}
        refreshControl={refreshControl}
        contentContainerStyle={styles.flexGrow1}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    );
  };

  const renderPage = () => {
    if (!selectedBlog) {
      return <EmptyContentScreen />;
    }
    switch (loadingState) {
      case AsyncPagedLoadingState.DONE:
      case AsyncPagedLoadingState.REFRESH:
      case AsyncPagedLoadingState.REFRESH_FAILED:
      case AsyncPagedLoadingState.REFRESH_SILENT:
      case AsyncPagedLoadingState.FETCH_NEXT:
      case AsyncPagedLoadingState.FETCH_NEXT_FAILED:
        return renderBlogPostList();
      case AsyncPagedLoadingState.PRISTINE:
      case AsyncPagedLoadingState.INIT:
        return <BlogPlaceholderList />;
      case AsyncPagedLoadingState.INIT_FAILED:
      case AsyncPagedLoadingState.RETRY:
        return renderError();
    }
  };

  return (
    <>
      <PageView>{renderPage()}</PageView>
    </>
  );
};

const mapStateToProps: (s: IGlobalState) => BlogPostListScreenDataProps = s => ({
  session: getSession(),
  initialLoadingState: AsyncPagedLoadingState.PRISTINE,
});

const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => BlogPostListScreenEventProps = (
  dispatch,
  getState,
) => ({
  dispatch,
});

const BlogPostListScreenConnected = connect(mapStateToProps, mapDispatchToProps)(BlogPostListScreen);
export default BlogPostListScreenConnected;
