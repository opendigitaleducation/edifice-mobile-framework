import { CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Viewport } from '@skele/components';
import * as React from 'react';
import { Alert, EmitterSubscription, Keyboard, Platform, RefreshControl, View } from 'react-native';
import { KeyboardAvoidingFlatList } from 'react-native-keyboard-avoiding-scroll-view';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { BottomButtonSheet } from '~/framework/components/BottomButtonSheet';
import BottomEditorSheet from '~/framework/components/BottomEditorSheet';
import { BottomSheet } from '~/framework/components/BottomSheet';
import CommentField, { InfoCommentField } from '~/framework/components/commentField';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import FlatList from '~/framework/components/list/flat-list';
import { deleteAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import { NavBarAction } from '~/framework/components/navigation';
import { KeyboardPageView, PageView } from '~/framework/components/page';
import { SmallBoldText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import usePreventBack from '~/framework/hooks/prevent-back';
import { markViewAudience } from '~/framework/modules/audience';
import { audienceService } from '~/framework/modules/audience/service';
import { getSession } from '~/framework/modules/auth/reducer';
import {
  deleteBlogPostAction,
  deleteBlogPostCommentAction,
  getBlogPostDetailsAction,
  publishBlogPostAction,
  publishBlogPostCommentAction,
  updateBlogPostCommentAction,
} from '~/framework/modules/blog/actions';
import BlogPostDetails from '~/framework/modules/blog/components/blog-post-details';
import BlogPlaceholderDetails from '~/framework/modules/blog/components/placeholder/details';
import { BlogNavigationParams, blogRouteNames } from '~/framework/modules/blog/navigation';
import { BlogPostComment, BlogPostWithAudience } from '~/framework/modules/blog/reducer';
import {
  commentBlogPostResourceRight,
  deleteCommentBlogPostResourceRight,
  hasPermissionManager,
  publishBlogPostResourceRight,
  updateCommentBlogPostResourceRight,
} from '~/framework/modules/blog/rights';
import { blogPostGenerateResourceUriFunction, blogService, blogUriCaptureFunction } from '~/framework/modules/blog/service';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { resourceHasRight } from '~/framework/util/resourceRights';
import { OAuth2RessourceOwnerPasswordClient } from '~/infra/oauth';

import styles from './styles';
import {
  BlogPostCommentLoadingState,
  BlogPostDetailsLoadingState,
  BlogPostDetailsScreenDataProps,
  BlogPostDetailsScreenEventProps,
  BlogPostDetailsScreenProps,
  BlogPostDetailsScreenState,
} from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<BlogNavigationParams, typeof blogRouteNames.blogPostDetails>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: '',
  }),
});

function PreventBack(props: { infoComment: InfoCommentField }) {
  const { infoComment } = props;
  usePreventBack({
    title: I18n.get(
      infoComment.isPublication
        ? 'blog-postdetails-confirmation-unsaved-publication'
        : 'blog-postdetails-confirmation-unsaved-modification',
    ),
    text: I18n.get(
      `blog-postdetails-${infoComment.type}-confirmation-unsaved-${infoComment.isPublication ? 'publication' : 'modification'}`,
    ),
    showAlert: infoComment.changed,
  });
  return null;
}

const ListComponent = Platform.select<React.ComponentType<any>>({
  ios: FlatList,
  android: KeyboardAvoidingFlatList,
})!;

function BlogPostDetailsFlatList(props: {
  contentSetRef;
  initialNumToRender;
  data;
  blogInfos;
  blogPostData;
  onReady;
  renderItem;
  onRefresh;
  loadingState;
  onContentSizeChange;
  onLayout;
  footer;
  session;
}) {
  return (
    <Viewport.Tracker>
      <>
        <ListComponent
          ref={props.contentSetRef}
          initialNumToRender={props.initialNumToRender}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          data={props.data}
          keyExtractor={BlogPostDetailsScreen.contentKeyExtractor}
          ListHeaderComponent={
            props.blogInfos && props.blogPostData ? (
              <BlogPostDetails blog={props.blogInfos} post={props.blogPostData} onReady={props.onReady} session={props.session} />
            ) : null
          }
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl
              refreshing={[BlogPostDetailsLoadingState.REFRESH, BlogPostDetailsLoadingState.INIT].includes(props.loadingState)}
              onRefresh={props.onRefresh}
            />
          }
          renderItem={props.renderItem}
          style={styles.contentStyle2}
          onContentSizeChange={props.onContentSizeChange}
          onLayout={props.onLayout}
          {...React.useMemo(() => Platform.select({ ios: {}, android: { stickyFooter: props.footer } }), [props.footer])}
        />
        {React.useMemo(() => Platform.select({ ios: props.footer, android: null }), [props.footer])}
      </>
    </Viewport.Tracker>
  );
}

export class BlogPostDetailsScreen extends React.PureComponent<BlogPostDetailsScreenProps, BlogPostDetailsScreenState> {
  flatListRef = React.createRef<FlatList | typeof KeyboardAvoidingFlatList | null>();

  commentFieldRefs = [];

  editedCommentId?: string = undefined;

  bottomEditorSheetRef: { current: any } = React.createRef();

  event: string | null = null;

  showSubscription: EmitterSubscription | undefined;

  hideSubscription: EmitterSubscription | undefined;

  cleanupFocusSubscription: (() => void) | undefined;

  editorOffsetRef = React.createRef<number | null>() as React.MutableRefObject<number | null>;

  state: BlogPostDetailsScreenState = {
    loadingState: BlogPostDetailsLoadingState.PRISTINE,
    publishCommentLoadingState: BlogPostCommentLoadingState.PRISTINE,
    updateCommentLoadingState: BlogPostCommentLoadingState.PRISTINE,
    blogInfos: undefined,
    blogPostData: undefined,
    errorState: false,
    isCommentFieldFocused: false,
    infoComment: {
      type: '',
      isPublication: false,
      changed: false,
      value: '',
    },
  };

  listHeight = 0;

  loaderRef = React.createRef<View>();

  async doInit() {
    try {
      this.setState({ loadingState: BlogPostDetailsLoadingState.INIT });
      await OAuth2RessourceOwnerPasswordClient.connection?.getOneSessionId();
      await this.doGetBlogPostDetails();
      await this.doGetBlogInfos();
      await OAuth2RessourceOwnerPasswordClient.connection?.getOneSessionId();
    } finally {
      this.setState({ loadingState: BlogPostDetailsLoadingState.DONE });
      if (this.state.blogPostData?._id)
        markViewAudience({ module: 'blog', resourceType: 'post', resourceId: this.state.blogPostData._id });
      else {
        console.warn(`[Audience] cannot recieve blog post id.`);
      }
    }
  }

  async doRefresh() {
    try {
      await this.doGetBlogPostDetails();
    } finally {
      this.setState({ loadingState: BlogPostDetailsLoadingState.DONE });
    }
  }

  async doRefreshSilent() {
    try {
      await this.doGetBlogPostDetails();
    } finally {
      this.setState({ loadingState: BlogPostDetailsLoadingState.DONE });
    }
  }

  async doCreateComment(comment: string, commentId?: string) {
    try {
      if (commentId) {
        this.setState({ updateCommentLoadingState: BlogPostCommentLoadingState.PUBLISH });
      } else {
        this.setState({ publishCommentLoadingState: BlogPostCommentLoadingState.PUBLISH });
      }
      await this.doCreateBlogPostComment(comment, commentId);
      await this.doGetBlogPostDetails();
      // Note #1: setTimeout is used to wait for the FlatList height to update (after a comment is added).
      // Note #2: scrollToEnd seems to become less precise once there is lots of data.
      if (!commentId) {
        this.bottomEditorSheetRef?.current?.clearCommentField();
        setTimeout(() => {
          (this.flatListRef.current as FlatList)?.scrollToOffset({
            offset: this.listHeight,
          });
        }, 50);
      } else this.commentFieldRefs[commentId]?.setIsEditingFalse();
    } finally {
      if (commentId) {
        this.setState({ updateCommentLoadingState: BlogPostCommentLoadingState.DONE });
      } else {
        this.setState({ publishCommentLoadingState: BlogPostCommentLoadingState.DONE });
      }
    }
  }

  async doDeleteComment(commentId: string) {
    await this.doDeleteBlogPostComment(commentId);
    await this.doGetBlogPostDetails();
  }

  async doGetAudienceInfos() {
    try {
      const blogPostId = this.state.blogPostData?._id!;
      const views = await audienceService.view.getSummary('blog', 'post', [blogPostId]);
      const reactions = await audienceService.reaction.getSummary('blog', 'post', [blogPostId]);
      const newBlogPostData = {
        ...this.state.blogPostData,
        audience: {
          views: views[blogPostId],
          reactions: {
            total: reactions.reactionsByResource[blogPostId].totalReactionsCounter ?? 0,
            types: reactions.reactionsByResource[blogPostId].reactionTypes,
            userReaction: reactions.reactionsByResource[blogPostId].userReaction ?? null,
          },
        },
      } as BlogPostWithAudience;
      this.setState(prevState => ({ ...prevState, blogPostData: newBlogPostData }));
    } catch (e) {
      console.error(e);
    }
  }

  async doGetBlogPostDetails() {
    try {
      const { route, handleGetBlogPostDetails } = this.props;
      const notification = route.params.notification;
      const useNotification = route.params.useNotification ?? true;
      const ids = this.getBlogPostIds();
      let blogPostState: string | undefined;
      if (notification && useNotification && notification['event-type'] === 'SUBMIT-POST') {
        blogPostState = undefined; // Will be got by an additional request to api
      } else blogPostState = route.params.blogPost?.state;
      const blogPostData = await handleGetBlogPostDetails(ids, blogPostState);
      if (!blogPostData) throw new Error('blogPostData is undefined');
      this.setState({ blogPostData });
      this.doGetAudienceInfos();
    } catch {
      // ToDo: Error handling
      this.setState({ errorState: true });
      this.removePlaceholder();
    }
  }

  async doCreateBlogPostComment(comment: string, commentId?: string) {
    try {
      const { handlePublishBlogPostComment, handleUpdateBlogPostComment } = this.props;
      const ids = this.getBlogPostIds();
      if (commentId) {
        ids.commentId = commentId;
        await handleUpdateBlogPostComment(ids, comment);
      } else await handlePublishBlogPostComment(ids, comment);
    } catch {
      // ToDo: Error handling
      Alert.alert(I18n.get('blog-postdetails-error-title'), I18n.get('blog-postdetails-error-text'));
    }
  }

  async doDeleteBlogPostComment(commentId: string) {
    try {
      const { handleDeleteBlogPostComment } = this.props;
      if (!commentId) {
        throw new Error('failed to call api (commentId is undefined)');
      }
      const ids = this.getBlogPostIds();
      ids.commentId = commentId;
      await handleDeleteBlogPostComment(ids);
    } catch {
      // ToDo: Error handling
      Alert.alert(I18n.get('blog-postdetails-error-title'), I18n.get('blog-postdetails-error-text'));
    }
  }

  async doDeleteBlogPost(postId: string) {
    try {
      const { handleDeleteBlogPost } = this.props;
      if (!postId) {
        throw new Error('failed to call api (commentId is undefined)');
      }
      const ids = this.getBlogPostIds();
      ids.postID = postId;

      await handleDeleteBlogPost(ids);
    } catch {
      Alert.alert(I18n.get('blog-postdetails-error-title'), I18n.get('blog-postdetails-error-text'));
    }
  }

  async doGetBlogInfos() {
    try {
      const { session } = this.props;
      if (!session) throw new Error('BlogPostDetailsScreen.doGetBlogInfos: no session');
      const ids = this.getBlogPostIds();
      const blogId = ids?.blogId;
      const blogInfos = await blogService.get(session, blogId);
      this.setState({ blogInfos });
    } catch {
      // ToDo: Error handling
    }
  }

  getBlogPostIds() {
    const { route } = this.props;
    const notification = route.params.notification;
    const useNotification = route.params.useNotification ?? true;
    let ids;
    if (notification && useNotification) {
      const resourceUri = notification?.resource.uri;
      if (!resourceUri) {
        throw new Error('failed to call api (resourceUri is undefined)');
      }
      ids = blogUriCaptureFunction(resourceUri) as Required<ReturnType<typeof blogUriCaptureFunction>>;
      if (!ids.blogId || !ids.postId) {
        throw new Error(`failed to capture resourceUri "${resourceUri}": ${ids}`);
      }
    } else {
      const blogId = route.params.blog?.id;
      const postId = route.params.blogPost?._id;
      if (!blogId || !postId) {
        throw new Error(`missing blogId or postId : ${{ blogId, postId }}`);
      }
      ids = { blogId, postId };
    }
    return ids;
  }

  setActionNavbar = () => {
    const { route, navigation, session } = this.props;
    const { blogPostData, blogInfos, errorState } = this.state;
    const notification = (route.params.useNotification ?? true) && route.params.notification;
    const blogId = route.params.blog?.id;
    let resourceUri = notification && notification?.resource.uri;
    if (!resourceUri && blogPostData && blogId) {
      resourceUri = blogPostGenerateResourceUriFunction({ blogId, postId: blogPostData._id });
    }

    const menuData =
      session && (hasPermissionManager(blogInfos!, session) || blogPostData?.author.userId === session.user.id)
        ? [
            {
              title: I18n.get('common-edit'),
              icon: {
                ios: 'pencil',
                android: 'ic_edit',
              },
              action: () =>
                navigation.navigate(blogRouteNames.blogEditPost, {
                  blog: this.state.blogInfos,
                  title: this.state.blogPostData.title,
                  content: this.state.blogPostData?.content,
                  postId: this.state.blogPostData?._id,
                  postState: this.state.blogPostData?.state,
                }),
            },
            deleteAction({
              action: () => {
                Alert.alert(I18n.get('blog-postdetails-deletion-title'), I18n.get('blog-postdetails-deletion-text'), [
                  {
                    text: I18n.get('common-cancel'),
                    style: 'default',
                  },
                  {
                    text: I18n.get('common-delete'),
                    style: 'destructive',
                    onPress: () => {
                      this.doDeleteBlogPost(blogPostData!._id).then(() => {
                        navigation.dispatch(CommonActions.goBack());
                      });
                    },
                  },
                ]);
              },
            }),
          ]
        : [];

    this.props.navigation.setOptions({
      ...navBarOptions({
        navigation,
        route,
      }),
      headerTitle: navBarTitle(blogPostData?.title),
      ...(menuData.length
        ? {
            // eslint-disable-next-line react/no-unstable-nested-components
            headerRight: () =>
              resourceUri && !errorState ? (
                <PopupMenu actions={menuData}>
                  <NavBarAction icon="ui-options" />
                </PopupMenu>
              ) : undefined,
          }
        : undefined),
    });
  };

  async componentDidMount() {
    const { route } = this.props;
    const blogPost = route.params.blogPost;
    const blog = route.params.blog;
    const notification = (route.params.useNotification ?? true) && route.params.notification;

    if (blog && blogPost) {
      await OAuth2RessourceOwnerPasswordClient.connection?.getOneSessionId();
      this.setState({
        blogInfos: blog,
        blogPostData: blogPost,
        loadingState: BlogPostDetailsLoadingState.DONE,
      });
      markViewAudience({ module: 'blog', resourceType: 'post', resourceId: blogPost._id });
      this.doGetAudienceInfos();
    } else this.doInit();

    // Update notification event if any
    this.event = notification ? notification['event-type'] : null;

    this.cleanupFocusSubscription = this.props.navigation.addListener('focus', () => {
      this.doRefreshSilent();
    });
  }

  componentDidUpdate(prevProps: BlogPostDetailsScreenProps, prevState: BlogPostDetailsScreenState) {
    const { blogPostData } = this.state;
    if (this.state.loadingState === BlogPostDetailsLoadingState.DONE && !this.state.errorState) this.setActionNavbar();
    if (prevState.blogPostData !== blogPostData) {
      this.showSubscription?.remove();
      this.showSubscription = Keyboard.addListener(
        Platform.select({ ios: 'keyboardDidShow', android: 'keyboardDidShow' })!,
        event => {
          if (this.editedCommentId && this.commentFieldRefs[this.editedCommentId]?.isCommentFieldFocused())
            this.setState({ isCommentFieldFocused: true });
          setTimeout(() => {
            if (!this.editedCommentId) return;
            const commentIndex = blogPostData?.comments?.findIndex(c => c.id === this.editedCommentId);
            if (commentIndex !== undefined && commentIndex > -1) {
              if (Platform.OS === 'ios') {
                (this.flatListRef.current as FlatList)?.scrollToIndex({
                  index: commentIndex,
                  viewPosition: 1,
                });
              } else {
                (this.flatListRef.current as FlatList)?.scrollToIndex({
                  index: commentIndex,
                  viewPosition: 0,
                  viewOffset:
                    UI_SIZES.screen.height -
                    UI_SIZES.elements.navbarHeight -
                    event.endCoordinates.height -
                    (this.editorOffsetRef.current ?? 0),
                });
              }
            }
          }, 50);
        },
      );

      this.hideSubscription = Keyboard.addListener(
        Platform.select({ ios: 'keyboardWillHide', android: 'keyboardDidHide' })!,
        () => {
          if (this.editedCommentId && !this.commentFieldRefs[this.editedCommentId]?.isCommentFieldFocused())
            this.setState({ isCommentFieldFocused: false });
        },
      );
    }
  }

  componentWillUnmount() {
    this.showSubscription?.remove();
    this.hideSubscription?.remove();
    this.cleanupFocusSubscription?.();
  }

  renderError() {
    return <EmptyConnectionScreen />;
  }

  static contentKeyExtractor(item: BlogPostComment) {
    return item.id.toString();
  }

  contentSetRef(node: any) {
    this.flatListRef.current = node;
  }

  contentRenderItem({ item, index }) {
    return this.renderComment(item, index);
  }

  contentSizeChange(width, height) {
    this.listHeight = height;
  }

  contentOnLayout() {
    // Scroll to last comment if coming from blog spot comment notification
    if (this.flatListRef.current && this.event === 'PUBLISH-COMMENT')
      setTimeout(() => {
        (this.flatListRef.current as FlatList)?.scrollToEnd();
        this.event = null;
      }, 50);
  }

  constructor(props) {
    super(props);
    this.contentSetRef = this.contentSetRef.bind(this);
    this.contentRenderItem = this.contentRenderItem.bind(this);
    this.contentSizeChange = this.contentSizeChange.bind(this);
    this.contentOnLayout = this.contentOnLayout.bind(this);
    this.doRefresh = this.doRefresh.bind(this);
    this.doRefreshSilent = this.doRefreshSilent.bind(this);
    this.removePlaceholder = this.removePlaceholder.bind(this);
  }

  renderContent() {
    const { session } = this.props;
    const { loadingState, publishCommentLoadingState, blogPostData, blogInfos } = this.state;
    const blogPostComments = blogPostData?.comments;
    const isPublishingComment = publishCommentLoadingState === BlogPostCommentLoadingState.PUBLISH;
    const hasCommentBlogPostRight = session && blogInfos && resourceHasRight(blogInfos, commentBlogPostResourceRight, session);
    const hasPublishBlogPostRight = session && blogInfos && resourceHasRight(blogInfos, publishBlogPostResourceRight, session);

    const footer = this.renderFooter(isPublishingComment, hasCommentBlogPostRight ?? false, hasPublishBlogPostRight ?? false);

    return (
      <>
        <BlogPostDetailsFlatList
          data={blogPostComments}
          blogInfos={blogInfos}
          blogPostData={blogPostData}
          onReady={this.removePlaceholder}
          contentSetRef={this.contentSetRef}
          initialNumToRender={blogPostComments?.length}
          renderItem={this.contentRenderItem}
          onRefresh={this.doRefresh}
          loadingState={loadingState}
          onContentSizeChange={this.contentSizeChange}
          onLayout={this.contentOnLayout}
          footer={footer}
          session={this.props.session!}
        />
      </>
    );
  }

  renderFooter(isPublishingComment: boolean, hasCommentBlogPostRight: boolean, hasPublishBlogPostRight: boolean) {
    const { blogPostData, blogInfos, isCommentFieldFocused } = this.state;
    return blogPostData?.state === 'PUBLISHED' ? (
      hasCommentBlogPostRight && !isCommentFieldFocused ? (
        <BottomEditorSheet
          ref={this.bottomEditorSheetRef}
          onPublishComment={(comment, commentId) => this.doCreateComment(comment, commentId)}
          isPublishingComment={isPublishingComment}
          onChangeText={data => this.setState({ infoComment: data })}
        />
      ) : (
        <View style={styles.footerNoComment} />
      )
    ) : blogPostData?.state === 'SUBMITTED' ? (
      hasPublishBlogPostRight ? (
        <BottomButtonSheet
          text={I18n.get('blog-postdetails-publish')}
          action={async () => {
            try {
              await this.props.handlePublishBlogPost({ blogId: blogInfos!.id, postId: blogPostData._id });
              const newBlogPostData = await this.props.handleGetBlogPostDetails({
                blogId: blogInfos!.id,
                postId: blogPostData._id,
              });
              if (newBlogPostData) {
                this.setState({ blogPostData: newBlogPostData });
                this.props.navigation.setParams({
                  blogPost: newBlogPostData,
                });
              }
              Toast.showSuccess(I18n.get('blog-postdetails-publish-success'));
            } catch {
              Toast.showError(I18n.get('blog-postdetails-error-text'));
            }
          }}
        />
      ) : (
        <BottomSheet
          content={
            <SmallBoldText style={styles.footerWaitingValidation}>{I18n.get('blog-postdetails-waitingvalidation')}</SmallBoldText>
          }
        />
      )
    ) : null;
  }

  removePlaceholder() {
    this.loaderRef.current?.setNativeProps({
      style: { opacity: 0 },
    });
  }

  renderComment(blogPostComment: BlogPostComment, index: number) {
    const { session } = this.props;
    const { blogInfos, blogPostData, updateCommentLoadingState } = this.state;

    const isUpdatingComment = updateCommentLoadingState === BlogPostCommentLoadingState.PUBLISH;
    const hasUpdateCommentBlogPostRight =
      session && blogInfos && resourceHasRight(blogInfos, updateCommentBlogPostResourceRight, session);
    const hasDeleteCommentBlogPostRight =
      session && blogInfos && resourceHasRight(blogInfos, deleteCommentBlogPostResourceRight, session);
    return (
      <CommentField
        ref={element => (this.commentFieldRefs[blogPostComment.id] = element)}
        index={index}
        isPublishingComment={isUpdatingComment}
        onPublishComment={
          hasUpdateCommentBlogPostRight ? (comment, commentId) => this.doCreateComment(comment, commentId) : undefined
        }
        onDeleteComment={
          hasDeleteCommentBlogPostRight || (session && hasPermissionManager(blogInfos!, session))
            ? () => {
                Alert.alert(I18n.get('blog-postdetails-deletion'), I18n.get('blog-postdetails-deleteconfirmation'), [
                  {
                    text: I18n.get('common-cancel'),
                    style: 'default',
                  },
                  {
                    text: I18n.get('common-delete'),
                    style: 'destructive',
                    onPress: () => this.doDeleteComment(blogPostComment.id),
                  },
                ]);
              }
            : undefined
        }
        onChangeText={data => this.setState({ infoComment: data })}
        editCommentCallback={() => {
          const blogPostComments = blogPostData?.comments;
          const otherBlogPostComments = blogPostComments?.filter(comment => comment.id !== blogPostComment.id);
          this.editedCommentId = blogPostComment.id;
          otherBlogPostComments?.forEach(otherBlogPostComment => {
            this.commentFieldRefs[otherBlogPostComment.id]?.setIsEditingFalse();
          });
        }}
        comment={blogPostComment.comment}
        commentId={blogPostComment.id}
        commentAuthorId={blogPostComment.author.userId}
        commentAuthor={blogPostComment.author.username}
        commentDate={blogPostComment.created}
        onEditableLayoutHeight={val => {
          this.editorOffsetRef.current = val;
        }}
        isManager={session && hasPermissionManager(blogInfos!, session)}
      />
    );
  }

  render() {
    const { route, session } = this.props;
    const { loadingState, errorState, blogPostData, blogInfos } = this.state;

    const blogId = blogInfos?.id;
    const hasCommentBlogPostRight = session && blogInfos && resourceHasRight(blogInfos, commentBlogPostResourceRight, session);
    const isBottomSheetVisible =
      (blogPostData?.state === 'PUBLISHED' && hasCommentBlogPostRight) || blogPostData?.state === 'SUBMITTED';
    const notification = (route.params.useNotification ?? true) && route.params.notification;
    let resourceUri = notification && notification?.resource.uri;
    if (!resourceUri && blogPostData && blogId) {
      resourceUri = blogPostGenerateResourceUriFunction({ blogId, postId: blogPostData._id });
    }

    const PageComponent = Platform.select<typeof KeyboardPageView | typeof PageView>({ ios: KeyboardPageView, android: PageView })!;

    return (
      <>
        <PreventBack infoComment={this.state.infoComment} />
        <PageComponent {...Platform.select({ ios: { safeArea: !isBottomSheetVisible }, android: {} })}>
          {[BlogPostDetailsLoadingState.PRISTINE, BlogPostDetailsLoadingState.INIT].includes(loadingState)
            ? null
            : errorState
              ? this.renderError()
              : this.renderContent()}

          <View ref={this.loaderRef} style={styles.loader}>
            <BlogPlaceholderDetails />
          </View>
        </PageComponent>
      </>
    );
  }
}

const mapStateToProps: (s: IGlobalState) => BlogPostDetailsScreenDataProps = s => ({
  session: getSession(),
});

const mapDispatchToProps: (
  dispatch: ThunkDispatch<any, any, any>,
  getState: () => IGlobalState,
) => BlogPostDetailsScreenEventProps = (dispatch, getState) => ({
  handleGetBlogPostDetails: async (blogPostId: { blogId: string; postId: string }, blogPostState?: string) => {
    return (await dispatch(getBlogPostDetailsAction(blogPostId, blogPostState))) as unknown as BlogPostWithAudience | undefined;
  }, // TS BUG: dispatch mishandled
  handlePublishBlogPostComment: async (blogPostId: { blogId: string; postId: string }, comment: string) => {
    return (await dispatch(publishBlogPostCommentAction(blogPostId, comment))) as unknown as number | undefined;
  }, // TS BUG: dispatch mishandled
  handleUpdateBlogPostComment: async (
    blogPostCommentId: { blogId: string; postId: string; commentId: string },
    comment: string,
  ) => {
    return (await dispatch(updateBlogPostCommentAction(blogPostCommentId, comment))) as unknown as number | undefined;
  }, // TS BUG: dispatch mishandled
  handleDeleteBlogPostComment: async (blogPostCommentId: { blogId: string; postId: string; commentId: string }) => {
    return (await dispatch(deleteBlogPostCommentAction(blogPostCommentId))) as unknown as number | undefined;
  }, // TS BUG: dispatch mishandled
  handleDeleteBlogPost: async (blogPostId: { blogId: string; postId: string }) => {
    return (await dispatch(deleteBlogPostAction(blogPostId))) as unknown as number | undefined;
  }, // TS BUG: dispatch mishandled
  handlePublishBlogPost: async (blogPostId: { blogId: string; postId: string }) => {
    return dispatch(publishBlogPostAction(blogPostId.blogId, blogPostId.postId));
  },
  dispatch,
});

const BlogPostDetailsScreenConnected = connect(mapStateToProps, mapDispatchToProps)(BlogPostDetailsScreen);
export default BlogPostDetailsScreenConnected;
