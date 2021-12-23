/**
 * Blog post list
 */

import I18n from 'i18n-js';
import moment from 'moment';
import React from 'react';
import { Platform, RefreshControl, View, ScrollView, FlatList } from 'react-native';
import { NavigationActions, NavigationInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { IGlobalState } from '~/AppStore';
import theme from '~/app/theme';
import { EmptyContentScreen } from '~/framework/components/emptyContentScreen';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import {
  FakeHeader,
  HeaderAction,
  HeaderCenter,
  HeaderLeft,
  HeaderRow,
  HeaderSubtitle,
  HeaderTitle,
} from '~/framework/components/header';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import { AsyncLoadingState } from '~/framework/util/redux/async';
import { getUserSession, IUserSession } from '~/framework/util/session';

import moduleConfig from '../moduleConfig';
import { getBlogWorkflowInformation } from '../rights';
import { IDisplayedBlog } from './BlogExplorerScreen';
import { blogService } from '../service';
import { BlogPostResourceCard } from '~/modules/blog/components/BlogPostResourceCard';
import { ButtonIcon } from '~/framework/components/popupMenu';
import { hasNotch } from 'react-native-device-info';
import { UI_SIZES } from '~/framework/components/constants';

// TYPES ==========================================================================================

export interface IBlogPostListScreen_DataProps {
  // tree?: IBlogFlatTree; //🟠TODO: use?
  initialLoadingState: AsyncLoadingState;
  session: IUserSession;
}
export interface IBlogPostListScreen_EventProps {
  // doFetch: () => Promise<[IBlog[], IBlogFolder[]] | undefined>; //🟠TODO: use?
}
export interface IBlogPostListScreen_NavigationParams {
  selectedBlog: IDisplayedBlog;
}
export type IBlogPostListScreen_Props = IBlogPostListScreen_DataProps &
  IBlogPostListScreen_EventProps &
  NavigationInjectedProps<IBlogPostListScreen_NavigationParams>;

// COMPONENT ======================================================================================

const BlogPostListScreen = (props: IBlogPostListScreen_Props) => {
  const hasBlogCreationRights = getBlogWorkflowInformation(props.session) && getBlogWorkflowInformation(props.session).blog.create;
  const selectedBlog = props.navigation.getParam('selectedBlog');
  const selectedBlogTitle = selectedBlog && selectedBlog.title;
  const selectedBlogId = selectedBlog && selectedBlog.id;

  // LOADER =====================================================================================

  // ToDo : Make this in a useLoadingState.

  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState);

  React.useEffect(() => {
    if (selectedBlogId && loadingState === AsyncLoadingState.PRISTINE) {
      setLoadingState(AsyncLoadingState.INIT);
      // props
      //   .doFetch() // 🟠TODO: use doFetch()
      fetchBlogPostsWithDetails(selectedBlogId)
        .then(() => setLoadingState(AsyncLoadingState.DONE))
        .catch(() => setLoadingState(AsyncLoadingState.INIT_FAILED));
    }
  }, []);

  const reload = selectedBlogId => {
    if (selectedBlogId) {
      setLoadingState(AsyncLoadingState.RETRY);
      // props
      //   .doFetch() // 🟠TODO: use doFetch()
      fetchBlogPostsWithDetails(selectedBlogId)
        .then(() => setLoadingState(AsyncLoadingState.DONE))
        .catch(() => setLoadingState(AsyncLoadingState.INIT_FAILED));
    }
  };

  const refresh = selectedBlogId => {
    if (selectedBlogId) {
      setLoadingState(AsyncLoadingState.REFRESH);
      // props
      //   .doFetch() // 🟠TODO: use doFetch()
      fetchBlogPostsWithDetails(selectedBlogId)
        .then(() => setLoadingState(AsyncLoadingState.DONE))
        .catch(() => setLoadingState(AsyncLoadingState.REFRESH_FAILED));
    }
  };

  // EVENTS =====================================================================================

  // 🟠TODO: remove fetchBlogPostsWithDetails() (put in redux)
  const [detailedBlogPostsState, setDetailedBlogPostsState] = React.useState([]);
  const fetchBlogPostsWithDetails = async (blogId: string) => {
    try {
      const session = props.session;
      const simpleBlogPosts = await blogService.posts.get(session, blogId);
      const detailedBlogPosts = await Promise.all(
        simpleBlogPosts.map(async post => {
          const blogPostId = { blogId, postId: post._id };
          const [blogPost, blogPostComments] = await Promise.all([
            blogService.post.get(session, blogPostId, post.state === 'DRAFT' ? post.state : undefined),
            blogService.comments.get(session, blogPostId),
          ]);
          const blogPostWithComments = {
            ...blogPost,
            comments: blogPostComments,
          };
          return blogPostWithComments;
        }),
      );
      setDetailedBlogPostsState(detailedBlogPosts); // 🟠TODO: type (once in redux)
    } catch (e) {
      throw e;
    }
  };

  const onGoToPostCreationScreen = () =>
  props.navigation.navigate(`${moduleConfig.routeName}/create`, {
    blog: selectedBlog,
    referrer: `${moduleConfig.routeName}/posts`,
  });

  const onOpenBlogPost = (/*🟠TODO: insert type --> item: type*/) => {
    // 🟠TODO: insert navigation action (example: props.navigation.navigate(`${moduleConfig.routeName}/posts`, { selectedBlog: item }))
    console.log("navigate to blog post.");
  };

  // HEADER =====================================================================================

  const header = (
    <FakeHeader>
      <HeaderRow>
        <HeaderLeft>
          <HeaderAction
            iconName={Platform.OS === 'ios' ? 'chevron-left1' : 'back'}
            iconSize={24}
            onPress={() => props.navigation.dispatch(NavigationActions.back())}
          />
        </HeaderLeft>
        <HeaderCenter>
          {selectedBlogTitle ? (
            <>
              <HeaderTitle>{selectedBlogTitle}</HeaderTitle>
              <HeaderSubtitle>{I18n.t('blog.appName')}</HeaderSubtitle>
            </>
          ) : (
            <HeaderTitle>{I18n.t('blog.appName')}</HeaderTitle>
          )}
        </HeaderCenter>
      </HeaderRow>
    </FakeHeader>
  );

  // CREATE BUTTON ================================================================================

  const renderCreateButton = () => {
    return hasBlogCreationRights ? (
      <ButtonIcon
        name={'new_post'}
        onPress={() => {
          onGoToPostCreationScreen();
        }}
        style={{
          position: 'absolute',
          zIndex: 100,
          right: 20,
          top: Platform.select({ android: 14, ios: hasNotch() ? 61 : 34 }),
        }}
      />
    ) : null;
  };

  // EMPTY SCREEN =================================================================================

  const renderEmpty = () => {
    return (
      <EmptyScreen
        imageSrc={require('ASSETS/images/empty-screen/blog.png')}
        imgWidth={265.98}
        imgHeight={279.97}
        customStyle={{ backgroundColor: theme.color.background.card }}
        title={I18n.t(`blog.blogPostListScreen.emptyScreen.title${hasBlogCreationRights ? '' : 'NoCreationRights'}`)}
        text={I18n.t(`blog.blogPostListScreen.emptyScreen.text${hasBlogCreationRights ? '' : 'NoCreationRights'}`)}
        buttonText={hasBlogCreationRights ? I18n.t('blog.blogPostListScreen.emptyScreen.button') : undefined}
        buttonAction={() => onGoToPostCreationScreen()}
      />
    );
  };

  // ERROR ========================================================================================

  const renderError = () => {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={loadingState === AsyncLoadingState.RETRY} onRefresh={() => reload(selectedBlogId)} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  // BLOG POST LIST ====================================================================================

  const renderBlogPostList = () => {
    return (
      <FlatList
        data={detailedBlogPostsState} // 🟠TODO: type (once in redux)
        renderItem={({ item }) => {
          return (
            <BlogPostResourceCard
              action={onOpenBlogPost}
              authorId={item.author.userId}
              authorName={item.author.username}
              comments={item.comments.length}
              contentHtml={item.content}
              date={moment(item.created)}
              title={item.title}
            />
          );
        }}
        keyExtractor={item => item._id}
        ListEmptyComponent={renderEmpty()}
        ListHeaderComponent={hasBlogCreationRights ? <View style={{ height: 12 }} /> : null}
        ListFooterComponent={<View style={{ paddingBottom: UI_SIZES.bottomInset }} />}
        refreshControl={<RefreshControl refreshing={loadingState === AsyncLoadingState.REFRESH} onRefresh={() => refresh(selectedBlogId)} />}
        style={{ backgroundColor: theme.color.background.card }}
        contentContainerStyle={{ flexGrow: 1 }}
        scrollIndicatorInsets={{ right: 0.001 }} // 🍎 Hack to guarantee scrollbar to be stick on the right edge of the screen.
      />
    );
  };

  // RENDER =======================================================================================

  const renderPage = () => {
    if (!selectedBlog) {
      return renderError();
    }
    switch (loadingState) {
      case AsyncLoadingState.DONE:
      case AsyncLoadingState.REFRESH:
      case AsyncLoadingState.REFRESH_FAILED:
        return renderBlogPostList();
      case AsyncLoadingState.PRISTINE:
      case AsyncLoadingState.INIT:
        return <LoadingIndicator />;
      case AsyncLoadingState.INIT_FAILED:
      case AsyncLoadingState.RETRY:
        return renderError();
    }
  };

  return (
    <>
      {header}
      {renderCreateButton()}
      <PageView path={props.navigation.state.routeName}>{renderPage()}</PageView>
    </>
  );
};

// MAPPING ========================================================================================

export default connect(
  (gs: IGlobalState) => {
    const bs = moduleConfig.getState(gs);
    return {
      session: getUserSession(gs),
      // tree: bs.tree,  // 🟠TODO: use (blogposts state)
      initialLoadingState: AsyncLoadingState.PRISTINE,
    };
  },
  dispatch =>
    bindActionCreators(
      {
        // doFetch: tryAction(fetchBlogPostsAction/*, undefined, true*/) as any, // 🟠TODO: use
      },
      dispatch,
    ),
)(BlogPostListScreen);
