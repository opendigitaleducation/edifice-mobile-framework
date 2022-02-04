import { Viewport } from '@skele/components';
import I18n from 'i18n-js';
import moment from 'moment';
import * as React from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
  RefreshControl,
  SafeAreaView,
  View,
  TouchableOpacity,
  Keyboard,
  EmitterSubscription,
} from 'react-native';
import { hasNotch } from 'react-native-device-info';
import { NavigationActions, NavigationInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { IDisplayedBlog } from './BlogExplorerScreen';

import { IGlobalState } from '~/AppStore';
import theme from '~/app/theme';
import ActionsMenu from '~/framework/components/actionsMenu';
import { ContentCardHeader, ContentCardIcon, ResourceView } from '~/framework/components/card';
import CommentField from '~/framework/components/commentField';
import {
  FakeHeader,
  HeaderAction,
  HeaderCenter,
  HeaderLeft,
  HeaderRight,
  HeaderRow,
  HeaderSubtitle,
  HeaderTitle,
} from '~/framework/components/header';
import { Icon } from '~/framework/components/icon';
import { ListItem } from '~/framework/components/listItem';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import { TextBold, TextLight, TextLightItalic, TextSemiBold, TextSizeStyle } from '~/framework/components/text';
import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { openUrl } from '~/framework/util/linking';
import { IResourceUriNotification, ITimelineNotification } from '~/framework/util/notifications';
import { resourceHasRight } from '~/framework/util/resourceRights';
import { getUserSession, IUserSession } from '~/framework/util/session';
import { Trackers } from '~/framework/util/tracker';
import {
  deleteBlogPostCommentAction,
  getBlogPostDetailsAction,
  publishBlogPostCommentAction,
  updateBlogPostCommentAction,
} from '~/modules/blog/actions';
import moduleConfig from '~/modules/blog/moduleConfig';
import { IBlogPostComment, IBlogPost, IBlog } from '~/modules/blog/reducer';
import {
  commentBlogPostResourceRight,
  deleteCommentBlogPostResourceRight,
  updateCommentBlogPostResourceRight,
} from '~/modules/blog/rights';
import { blogPostGenerateResourceUriFunction, blogService, blogUriCaptureFunction } from '~/modules/blog/service';
import { CommonStyles } from '~/styles/common/styles';
import { HtmlContentView } from '~/ui/HtmlContentView';
import { TextPreview } from '~/ui/TextPreview';
import { GridAvatars } from '~/ui/avatars/GridAvatars';

// TYPES ==========================================================================================

export interface IBlogPostDetailsScreenDataProps {
  session: IUserSession;
}
export interface IBlogPostDetailsScreenEventProps {
  handleGetBlogPostDetails(blogPostId: { blogId: string; postId: string }, blogPostState?: string): Promise<IBlogPost | undefined>;
  handlePublishBlogPostComment(blogPostId: { blogId: string; postId: string }, comment: string): Promise<number | undefined>;
  handleUpdateBlogPostComment(
    blogPostCommentId: { blogId: string; postId: string; commentId: string },
    comment: string,
  ): Promise<number | undefined>;
  handleDeleteBlogPostComment(blogPostCommentId: {
    blogId: string;
    postId: string;
    commentId: string;
  }): Promise<number | undefined>;
}
export interface IBlogPostDetailsScreenNavParams {
  notification: ITimelineNotification & IResourceUriNotification;
  blogPost?: IBlogPost;
  blogId?: string;
  blog: IDisplayedBlog;
  useNotification?: boolean;
}
export type IBlogPostDetailsScreenProps = IBlogPostDetailsScreenDataProps &
  IBlogPostDetailsScreenEventProps &
  NavigationInjectedProps<Partial<IBlogPostDetailsScreenNavParams>>;

export enum BlogPostDetailsLoadingState {
  PRISTINE,
  INIT,
  REFRESH,
  DONE,
}
export enum BlogPostCommentLoadingState {
  PRISTINE,
  PUBLISH,
  DONE,
}
export interface IBlogPostDetailsScreenState {
  loadingState: BlogPostDetailsLoadingState;
  publishCommentLoadingState: BlogPostCommentLoadingState;
  blogInfos: IDisplayedBlog | IBlog | undefined;
  blogPostData: IBlogPost | undefined;
  errorState: boolean;
  showHeaderTitle: boolean;
  showMenu: boolean;
}

// COMPONENT ======================================================================================

export class BlogPostDetailsScreen extends React.PureComponent<IBlogPostDetailsScreenProps, IBlogPostDetailsScreenState> {
  // DECLARATIONS =================================================================================

  flatListRef: FlatList | null = null;
  commentFieldRef: { current: any } = React.createRef();
  _titleRef?: React.Ref<any> = undefined;
  showSubscription: EmitterSubscription | undefined;
  state: IBlogPostDetailsScreenState = {
    loadingState: BlogPostDetailsLoadingState.PRISTINE,
    publishCommentLoadingState: BlogPostCommentLoadingState.PRISTINE,
    blogInfos: undefined,
    blogPostData: undefined,
    errorState: false,
    showHeaderTitle: false,
    showMenu: false,
  };

  // RENDER =======================================================================================

  render() {
    const { navigation } = this.props;
    const { loadingState, errorState, showMenu, blogPostData } = this.state;
    const keyboardAvoidingViewBehavior = Platform.select({
      ios: 'padding',
      android: 'height',
    }) as KeyboardAvoidingViewProps['behavior'];
    // const insets = useSafeAreaInsets();                            // Note : this commented code is the theory
    // const keyboardAvoidingViewVerticalOffset = insets.top + 56;    // But Practice >> Theory. Here, magic values ont the next ligne give better results.
    const keyboardAvoidingViewVerticalOffset = hasNotch() ? 100 : 76; // Those are "magic" values found by try&error. Seems to be fine on every phone.
    const notification = navigation.getParam('useNotification', true) && navigation.getParam('notification');
    const blogId = navigation.getParam('blog')?.id;
    let resourceUri = notification && notification?.resource.uri;
    if (!resourceUri && blogPostData && blogId) {
      resourceUri = blogPostGenerateResourceUriFunction({ blogId, postId: blogPostData._id });
    }
    const menuData = [
      {
        text: I18n.t('common.openInBrowser'),
        icon: 'arrow-right',
        onPress: () => {
          //TODO: create generic function inside oauth (use in myapps, etc.)
          if (!DEPRECATED_getCurrentPlatform()) {
            console.warn('Must have a platform selected to redirect the user');
            return null;
          }
          const url = `${DEPRECATED_getCurrentPlatform()!.url}${resourceUri}`;
          openUrl(url);
          Trackers.trackEvent('Blog', 'GO TO', 'View in Browser');
        },
      },
    ];

    return (
      <>
        {this.renderHeader()}
        <PageView>
          <SafeAreaView style={{ backgroundColor: theme.color.background.card }}>
            <KeyboardAvoidingView
              behavior={keyboardAvoidingViewBehavior}
              keyboardVerticalOffset={keyboardAvoidingViewVerticalOffset}
              style={{ height: '100%' }}>
              {[BlogPostDetailsLoadingState.PRISTINE, BlogPostDetailsLoadingState.INIT].includes(loadingState) ? (
                <LoadingIndicator />
              ) : errorState ? (
                this.renderError()
              ) : (
                this.renderContent()
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </PageView>
        <ActionsMenu onClickOutside={this.showMenu} show={showMenu} data={menuData} />
      </>
    );
  }

  renderHeader() {
    const { navigation } = this.props;
    const { blogPostData } = this.state;
    const notification = navigation.getParam('useNotification', true) && navigation.getParam('notification');
    const blogId = navigation.getParam('blog')?.id;
    let resourceUri = notification && notification?.resource.uri;
    if (!resourceUri && blogPostData && blogId) {
      resourceUri = blogPostGenerateResourceUriFunction({ blogId, postId: blogPostData._id });
    }
    return (
      <FakeHeader>
        <HeaderRow>
          <HeaderLeft>
            <HeaderAction
              iconName={Platform.OS === 'ios' ? 'chevron-left1' : 'back'}
              iconSize={24}
              onPress={() => {
                const commentFieldComment = this.commentFieldRef?.current?.getComment();
                const goBack = () => navigation.dispatch(NavigationActions.back());
                commentFieldComment ? this.commentFieldRef?.current?.confirmDiscard(() => goBack()) : goBack();
              }}
            />
          </HeaderLeft>
          <HeaderCenter>
            {blogPostData?.title && this.state.showHeaderTitle ? (
              <>
                <HeaderTitle numberOfLines={1}>{blogPostData?.title}</HeaderTitle>
                <HeaderSubtitle>{I18n.t('timeline.blogPostDetailsScreen.title')}</HeaderSubtitle>
              </>
            ) : (
              <HeaderTitle numberOfLines={2}>{I18n.t('timeline.blogPostDetailsScreen.title')}</HeaderTitle>
            )}
          </HeaderCenter>
          {resourceUri ? (
            <HeaderRight style={{ alignItems: 'center' }}>
              <TouchableOpacity onPress={this.showMenu}>
                <Icon name="more_vert" size={24} color="white" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            </HeaderRight>
          ) : null}
        </HeaderRow>
      </FakeHeader>
    );
  }

  renderError() {
    return <TextSemiBold>Error</TextSemiBold>; // ToDo: great error screen here
  }

  renderContent() {
    const { session } = this.props;
    const { loadingState, publishCommentLoadingState, blogPostData, blogInfos } = this.state;
    const blogPostComments = blogPostData?.comments;
    const isPublishingComment = publishCommentLoadingState === BlogPostCommentLoadingState.PUBLISH;
    const hasCommentBlogPostRight = blogInfos && resourceHasRight(blogInfos, commentBlogPostResourceRight, session);
    return (
      <>
        <Viewport.Tracker>
          <FlatList
            ref={ref => (this.flatListRef = ref)}
            data={blogPostComments}
            renderItem={({ item }: { item: IBlogPostComment }) => this.renderComment(item)}
            keyExtractor={(item: IBlogPostComment) => item.id.toString()}
            ListHeaderComponent={this.renderBlogPostDetails()}
            style={{ backgroundColor: theme.color.background.page }}
            contentContainerStyle={{ flexGrow: 1, backgroundColor: theme.color.background.page }}
            scrollIndicatorInsets={{ right: 0.001 }} // 🍎 Hack to guarantee scrollbar to be stick on the right edge of the screen.
            refreshControl={
              <RefreshControl
                refreshing={[BlogPostDetailsLoadingState.REFRESH, BlogPostDetailsLoadingState.INIT].includes(loadingState)}
                onRefresh={() => this.doRefresh()}
              />
            }
          />
        </Viewport.Tracker>
        {hasCommentBlogPostRight ? (
          <CommentField
            ref={this.commentFieldRef}
            onPublishComment={(comment, commentId) => this.doCreateComment(comment, commentId)}
            isPublishingComment={isPublishingComment}
          />
        ) : null}
      </>
    );
  }

  renderBlogPostDetails() {
    const { blogInfos, blogPostData } = this.state;
    const blogPostContent = blogPostData?.content;
    const blogPostComments = blogPostData?.comments;
    const hasComments = blogPostComments && blogPostComments.length > 0;
    const commentsString = hasComments
      ? blogPostComments.length === 1
        ? `1 ${I18n.t('common.comment.comment').toLowerCase()}`
        : `${blogPostComments.length} ${I18n.t('common.comment.comments').toLowerCase()}`
      : I18n.t('common.comment.noComments').toLowerCase();
    const ViewportAwareTitle = Viewport.Aware(View);
    return (
      <View style={{ backgroundColor: theme.color.background.card }}>
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <ResourceView
            header={
              <ContentCardHeader
                icon={<ContentCardIcon userIds={[blogPostData?.author.userId || require('ASSETS/images/system-avatar.png')]} />}
                text={
                  blogPostData?.author.username ? (
                    <TextSemiBold numberOfLines={1}>{`${I18n.t('common.by')} ${blogPostData?.author.username}`}</TextSemiBold>
                  ) : undefined
                }
                date={blogPostData?.modified}
              />
            }>
            <TextBold style={{ color: theme.color.text.light }}>{blogInfos?.title}</TextBold>
            <ViewportAwareTitle
              style={{ marginBottom: 16 }}
              onViewportEnter={() => this.updateVisible(true)}
              onViewportLeave={() => this.updateVisible(false)}
              innerRef={ref => (this._titleRef = ref)}>
              <TextBold style={{ ...TextSizeStyle.Big }}>{blogPostData?.title}</TextBold>
            </ViewportAwareTitle>
            <HtmlContentView
              html={blogPostContent}
              onDownload={() => Trackers.trackEvent('Blog', 'DOWNLOAD ATTACHMENT', 'Read mode')}
              onError={() => Trackers.trackEvent('Blog', 'DOWNLOAD ATTACHMENT ERROR', 'Read mode')}
              onDownloadAll={() => Trackers.trackEvent('Blog', 'DOWNLOAD ALL ATTACHMENTS', 'Read mode')}
              onOpen={() => Trackers.trackEvent('Blog', 'OPEN ATTACHMENT', 'Read mode')}
            />
          </ResourceView>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: theme.color.inputBorder,
            borderBottomColor: theme.color.inputBorder,
          }}>
          <Icon style={{ marginRight: 5 }} size={18} name="chat3" color={theme.color.text.regular} />
          <TextSemiBold style={{ color: theme.color.text.light, fontSize: 12 }}>{commentsString}</TextSemiBold>
        </View>
      </View>
    );
  }

  renderCommentActions(blogPostComment: IBlogPostComment) {
    const { session } = this.props;
    const { blogInfos } = this.state;
    const hasUpdateCommentBlogPostRight = blogInfos && resourceHasRight(blogInfos, updateCommentBlogPostResourceRight, session);
    const hasDeleteCommentBlogPostRight = blogInfos && resourceHasRight(blogInfos, deleteCommentBlogPostResourceRight, session);
    const hasNoCommentBlogPostRights = !hasUpdateCommentBlogPostRight && !hasDeleteCommentBlogPostRight;
    const isCommentByOtherUser = blogPostComment.author.userId !== session.user.id;

    if (isCommentByOtherUser || hasNoCommentBlogPostRights) {
      return null;
    } else
      return (
        <View style={{ alignSelf: 'flex-end', flexDirection: 'row', marginTop: 5 }}>
          {hasDeleteCommentBlogPostRight ? (
            <TouchableOpacity
              style={{ marginRight: hasUpdateCommentBlogPostRight ? 15 : undefined }}
              onPress={() => {
                Alert.alert(I18n.t('common.deletion'), I18n.t('common.comment.confirmationDelete'), [
                  {
                    text: I18n.t('common.cancel'),
                    style: 'default',
                  },
                  {
                    text: I18n.t('common.delete'),
                    style: 'destructive',
                    onPress: () => this.doDeleteComment(blogPostComment.id),
                  },
                ]);
              }}>
              <Icon name="trash" color={theme.color.failure} size={16} />
            </TouchableOpacity>
          ) : null}
          {hasUpdateCommentBlogPostRight ? (
            <TouchableOpacity
              onPress={() => this.commentFieldRef?.current?.prefillCommentField(blogPostComment.comment, blogPostComment.id)}>
              <Icon name="pencil" color={theme.color.secondary.regular} size={16} />
            </TouchableOpacity>
          ) : null}
        </View>
      );
  }

  renderComment(blogPostComment: IBlogPostComment) {
    return (
      <View>
        <ListItem
          style={{ justifyContent: 'flex-start', alignItems: 'flex-start', backgroundColor: theme.color.secondary.extraLight }}
          leftElement={
            <GridAvatars
              users={[blogPostComment.author.userId || require('ASSETS/images/resource-avatar.png')]}
              fallback={require('ASSETS/images/resource-avatar.png')}
            />
          }
          rightElement={
            <View style={{ flex: 1, marginLeft: 15 }}>
              <View style={{ flexDirection: 'row' }}>
                <TextSemiBold numberOfLines={2} style={{ fontSize: 12, marginRight: 5, maxWidth: '70%' }}>
                  {blogPostComment.author.username}
                </TextSemiBold>
                <TextLight style={{ fontSize: 10 }}>{moment(blogPostComment.created).fromNow()}</TextLight>
              </View>
              <TextPreview
                textContent={blogPostComment.comment}
                numberOfLines={5}
                textStyle={{
                  color: CommonStyles.textColor,
                  fontFamily: CommonStyles.primaryFontFamily,
                  fontSize: 12,
                  marginTop: 5,
                }}
                expandMessage={I18n.t('common.readMore')}
                expansionTextStyle={{ fontSize: 12 }}
                additionalText={
                  blogPostComment.modified ? (
                    <TextLightItalic style={{ fontSize: 10 }}>{I18n.t('common.modified')}</TextLightItalic>
                  ) : undefined
                }
              />
              {this.renderCommentActions(blogPostComment)}
            </View>
          }
        />
      </View>
    );
  }

  // LIFECYCLE ====================================================================================

  componentDidMount() {
    const { navigation } = this.props;
    const blogPost = navigation.getParam('blogPost');
    const blog = navigation.getParam('blog');

    if (blog && blogPost) {
      this.setState({
        blogInfos: blog,
        blogPostData: blogPost,
        loadingState: BlogPostDetailsLoadingState.DONE,
      });
    } else this.doInit();

    this.showSubscription = Keyboard.addListener('keyboardDidHide', () => {
      this.commentFieldRef?.current?.confirmDiscard();
    });
  }

  componentWillUnmount() {
    this.showSubscription?.remove();
  }

  private updateVisible(isVisible: boolean) {
    const { showHeaderTitle } = this.state;
    if (showHeaderTitle && isVisible) this.setState({ showHeaderTitle: false });
    else if (!showHeaderTitle && !isVisible) this.setState({ showHeaderTitle: true });
  }

  public showMenu = () => {
    const { showMenu } = this.state;
    this.setState({
      showMenu: !showMenu,
    });
  };

  // METHODS ======================================================================================

  async doInit() {
    try {
      this.setState({ loadingState: BlogPostDetailsLoadingState.INIT });
      await this.doGetBlogPostDetails();
      await this.doGetBlogInfos();
    } finally {
      this.setState({ loadingState: BlogPostDetailsLoadingState.DONE });
    }
  }

  async doRefresh() {
    try {
      this.setState({ loadingState: BlogPostDetailsLoadingState.REFRESH });
      await this.doGetBlogPostDetails();
    } finally {
      this.setState({ loadingState: BlogPostDetailsLoadingState.DONE });
    }
  }

  async doCreateComment(comment: string, commentId?: string) {
    try {
      this.setState({ publishCommentLoadingState: BlogPostCommentLoadingState.PUBLISH });
      await this.doCreateBlogPostComment(comment, commentId);
      await this.doGetBlogPostDetails();
      // Note #1: setTimeout is used to wait for the FlatList height to update (after a comment is added).
      // Note #2: scrollToEnd seems to become less precise once there is lots of data.
      !commentId && setTimeout(() => this.flatListRef?.scrollToEnd(), 1000);
      this.commentFieldRef?.current?.clearCommentField();
    } finally {
      this.setState({ publishCommentLoadingState: BlogPostCommentLoadingState.DONE });
    }
  }

  async doDeleteComment(commentId: string) {
    await this.doDeleteBlogPostComment(commentId);
    await this.doGetBlogPostDetails();
    const commentFieldCommentId = this.commentFieldRef?.current?.getCommentId();
    const isDeletedCommentEdited = commentId === commentFieldCommentId;
    isDeletedCommentEdited && this.commentFieldRef?.current?.clearCommentField();
  }

  async doGetBlogPostDetails() {
    try {
      const { navigation, handleGetBlogPostDetails } = this.props;
      const notification = navigation.getParam('notification');
      const useNotification = navigation.getParam('useNotification', true);
      const ids = this.getBlogPostIds();
      let blogPostState: string | undefined = undefined;
      if (notification && useNotification && notification['event-type'] === 'SUBMIT-POST') {
        blogPostState = 'SUBMITTED';
      } else blogPostState = navigation.getParam('blogPost')?.state;
      const blogPostData = await handleGetBlogPostDetails(ids, blogPostState);
      this.setState({ blogPostData });
    } catch (e) {
      // ToDo: Error handling
      this.setState({ errorState: true });
      console.warn(`[${moduleConfig.name}] doGetBlogPostDetails failed`, e);
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
    } catch (e) {
      // ToDo: Error handling
      Alert.alert(I18n.t('common.error.title'), I18n.t('common.error.text'));
      console.warn(`[${moduleConfig.name}] doCreateBlogPostComment failed`, e);
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
    } catch (e) {
      // ToDo: Error handling
      Alert.alert(I18n.t('common.error.title'), I18n.t('common.error.text'));
      console.warn(`[${moduleConfig.name}] doDeleteBlogPostComment failed`, e);
    }
  }

  async doGetBlogInfos() {
    try {
      const { session } = this.props;
      const ids = this.getBlogPostIds();
      const blogId = ids?.blogId;
      const blogInfos = await blogService.get(session, blogId);
      this.setState({ blogInfos });
    } catch (e) {
      // ToDo: Error handling
      console.warn(`[${moduleConfig.name}] doGetBlogInfos failed`, e);
    }
  }

  getBlogPostIds() {
    const { navigation } = this.props;
    const notification = navigation.getParam('notification');
    const useNotification = navigation.getParam('useNotification', true);
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
      const blogId = navigation.getParam('blog')?.id;
      const postId = navigation.getParam('blogPost')?._id;
      if (!blogId || !postId) {
        throw new Error(`missing blogId or postId : ${{ blogId, postId }}`);
      }
      ids = { blogId, postId };
    }
    return ids;
  }
}

// UTILS ==========================================================================================

// MAPPING ========================================================================================

const mapStateToProps: (s: IGlobalState) => IBlogPostDetailsScreenDataProps = s => ({
  session: getUserSession(s),
});

const mapDispatchToProps: (
  dispatch: ThunkDispatch<any, any, any>,
  getState: () => IGlobalState,
) => IBlogPostDetailsScreenEventProps = (dispatch, getState) => ({
  handleGetBlogPostDetails: async (blogPostId: { blogId: string; postId: string }, blogPostState?: string) => {
    return (await dispatch(getBlogPostDetailsAction(blogPostId, blogPostState))) as unknown as IBlogPost | undefined;
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
});

const BlogPostDetailsScreen_Connected = connect(mapStateToProps, mapDispatchToProps)(BlogPostDetailsScreen);
export default BlogPostDetailsScreen_Connected;
