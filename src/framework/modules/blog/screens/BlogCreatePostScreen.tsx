import { NavigationProp, ParamListBase, UNSTABLE_usePreventRemove, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { LoadingIndicator } from '~/framework/components/loading';
import { ImagePicked, imagePickedToLocalFile } from '~/framework/components/menus/actions';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { KeyboardPageView } from '~/framework/components/page';
import { SmallBoldText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { ISession } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { sendBlogPostAction, uploadBlogPostImagesAction } from '~/framework/modules/blog/actions';
import { BlogNavigationParams, blogRouteNames } from '~/framework/modules/blog/navigation';
import { Blog } from '~/framework/modules/blog/reducer';
import {
  createBlogPostResourceRight,
  getBlogPostRight,
  publishBlogPostResourceRight,
  submitBlogPostResourceRight,
} from '~/framework/modules/blog/rights';
import { startLoadNotificationsAction } from '~/framework/modules/timeline/actions';
import { timelineRouteNames } from '~/framework/modules/timeline/navigation';
import { clearConfirmNavigationEvent, handleRemoveConfirmNavigationEvent } from '~/framework/navigation/helper';
import { navBarOptions } from '~/framework/navigation/navBar';
import { SyncedFile } from '~/framework/util/fileHandler';
import { isEmpty } from '~/framework/util/object';
import { Trackers } from '~/framework/util/tracker';
import { ILocalAttachment } from '~/ui/Attachment';
import { AttachmentPicker } from '~/ui/AttachmentPicker';
import { GridAvatars } from '~/ui/avatars/GridAvatars';
import moduleConfig from '~/framework/modules/blog/module-config';
import { uppercaseFirstLetter } from '~/framework/util/string';

export interface BlogCreatePostScreenDataProps {
  session?: ISession;
}

export interface BlogCreatePostScreenEventProps {
  handleUploadPostImages(images: ImagePicked[]): Promise<SyncedFile[]>;
  handleSendBlogPost(blog: Blog, title: string, content: string, uploadedPostImages?: SyncedFile[]): Promise<string | undefined>;
  handleInitTimeline(): Promise<void>;
  dispatch: ThunkDispatch<any, any, any>;
}

export interface BlogCreatePostScreenNavParams {
  blog: Blog;
  referrer?: string;
}

export type BlogCreatePostScreenProps = BlogCreatePostScreenDataProps &
  BlogCreatePostScreenEventProps &
  NativeStackScreenProps<BlogNavigationParams, typeof blogRouteNames.blogCreatePost>;

export interface BlogCreatePostScreenState {
  sendLoadingState: boolean;
  title: string;
  content: string;
  images: ImagePicked[] | ILocalAttachment[];
  onPublish: boolean;
}

const styles = StyleSheet.create({
  input: {
    marginBottom: UI_SIZES.spacing.big,
    padding: UI_SIZES.spacing.small,
    backgroundColor: theme.ui.background.card,
    borderColor: theme.ui.border.input,
    borderWidth: 1,
    borderRadius: 5,
    color: theme.ui.text.regular,
  },
  inputArea: {
    marginBottom: UI_SIZES.spacing.medium,
    height: 140,
  },
  loaderPublish: {
    justifyContent: 'center',
    paddingHorizontal: UI_SIZES.spacing.big,
  },
  scrollView: {
    flexGrow: 1,
    paddingVertical: UI_SIZES.spacing.small,
    paddingHorizontal: UI_SIZES.spacing.medium,
  },
  userInfos: {
    marginBottom: UI_SIZES.spacing.big,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfos_texts: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: UI_SIZES.spacing.minor,
  },
});

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<BlogNavigationParams, typeof blogRouteNames.blogCreatePost>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('blog-createpost-title'),
    titleStyle: { width: undefined },
  }),
});

function PreventBack(props: { isEditing: boolean }) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  UNSTABLE_usePreventRemove(props.isEditing, ({ data }) => {
    Alert.alert(I18n.get('blog-createpost-confirmation-unsavedpublication'), I18n.get('blog-createpost-unsavedpublication'), [
      {
        text: I18n.get('common-quit'),
        onPress: () => {
          handleRemoveConfirmNavigationEvent(data.action, navigation);
        },
        style: 'destructive',
      },
      {
        text: I18n.get('common-continue'),
        style: 'default',
        onPress: () => {
          clearConfirmNavigationEvent();
        },
      },
    ]);
  });
  return null;
}

export class BlogCreatePostScreen extends React.PureComponent<BlogCreatePostScreenProps, BlogCreatePostScreenState> {
  state: BlogCreatePostScreenState = {
    sendLoadingState: false,
    title: '',
    content: '',
    images: [],
    onPublish: false,
  };

  async doSend() {
    Keyboard.dismiss();
    try {
      this.setState({ sendLoadingState: true });
      await this.doSendPost();
    } finally {
      this.setState({ sendLoadingState: false });
    }
  }

  async doSendPost() {
    try {
      const { route, navigation, session, handleUploadPostImages, handleSendBlogPost, handleInitTimeline, dispatch } = this.props;
      const { title, content, images } = this.state;
      const blog = route.params.blog;
      const blogId = blog && blog.id;
      if (!blog || !blogId) {
        throw new Error('[doSendPost] failed to retrieve blog information');
      }
      const blogPostRight = blog && session && getBlogPostRight(blog, session);
      if (!blogPostRight) {
        throw new Error('[doSendPost] user has no post rights for this blog');
      }

      // Upload post images (if added)
      let uploadedPostImages: undefined | SyncedFile[];
      if (images.length > 0) {
        try {
          uploadedPostImages = await handleUploadPostImages(images);
        } catch (e: any) {
          // Full storage management
          // statusCode = 400 on iOS and code = 'ENOENT' on Android
          if (e.response?.statusCode === 400 || e.code === 'ENOENT') {
            Alert.alert('', I18n.get('blog-createpost-fullstorage'));
          } else {
            Alert.alert('', I18n.get('blog-createpost-uploadattachments-error-text'));
          }
          throw new Error('handled');
        }
      }

      // Translate entered content to httml
      const htmlContent = content.replace(/\n/g, '<br>');

      // Create and submit/publish post
      await handleSendBlogPost(blog, title, htmlContent, uploadedPostImages);

      // Track action, load/navigate to timeline and display toast
      const blogPostDisplayRight = blogPostRight.displayRight;
      const event = {
        [createBlogPostResourceRight]: 'Enregistrer',
        [submitBlogPostResourceRight]: 'Soumettre',
        [publishBlogPostResourceRight]: 'Publier',
      }[blogPostDisplayRight];
      const eventName = `Rédaction blog - ${event}`;
      const eventCategory = route.params.referrer ? 'Blog' : 'Timeline';
      const toastSuccessText = {
        [createBlogPostResourceRight]: I18n.get('blog-createpost-create-success'),
        [submitBlogPostResourceRight]: I18n.get('blog-createpost-submit-success'),
        [publishBlogPostResourceRight]: I18n.get('blog-createpost-publish-success'),
      }[blogPostDisplayRight];

      Trackers.trackEvent(eventCategory, 'Créer un billet', eventName);
      await handleInitTimeline();
      this.setState({
        onPublish: true,
      });
      navigation.navigate(route.params.referrer ?? timelineRouteNames.Home, {
        ...(route.params.referrer ? { selectedBlog: route.params.blog } : {}),
      });
      Toast.showSuccess(toastSuccessText);
    } catch (e: any) {
      if (e.response?.body === '{"error":"file.too.large"}') {
        Toast.showError(I18n.get('blog-createpost-fullstorage'));
      }
      if ((e as Error).message && (e as Error).message !== 'handled') {
        Toast.showError(I18n.get('blog-createpost-publish-error-text'));
      }
    }
  }

  setActionNavbar = () => {
    const blog = this.props.route.params.blog;
    const blogPostRight = blog && this.props.session && getBlogPostRight(blog, this.props.session);
    const blogPostDisplayRight = blogPostRight && blogPostRight.displayRight;
    const actionText =
      blogPostDisplayRight &&
      {
        [createBlogPostResourceRight]: I18n.get('blog-createpost-create'),
        [submitBlogPostResourceRight]: I18n.get('blog-createpost-submit'),
        [publishBlogPostResourceRight]: I18n.get('blog-createpost-publish'),
      }[blogPostDisplayRight];
    this.props.navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () =>
        this.state.sendLoadingState ? (
          <LoadingIndicator small customColor={theme.ui.text.inverse} customStyle={styles.loaderPublish} />
        ) : (
          <NavBarAction
            title={actionText}
            disabled={this.state.title.length === 0 || this.state.content.length === 0}
            onPress={() => this.doSend()}
          />
        ),
    });
  };

  componentDidMount() {
    this.setActionNavbar();
  }

  componentDidUpdate() {
    this.setActionNavbar();
  }

  renderError() {
    return <SmallBoldText>Error</SmallBoldText>; // ToDo: great error screen here
  }

  renderContent() {
    return (
      <>
        {this.renderBlogInfos()}
        {this.renderPostInfos()}
        {this.renderPostMedia()}
      </>
    );
  }

  renderBlogInfos() {
    const { route, session } = this.props;
    if (!session) return <View style={styles.userInfos} />;
    const { id, displayName } = session.user;
    const blog = route.params.blog;
    return (
      <View style={styles.userInfos}>
        <GridAvatars users={[id]} />
        <View style={styles.userInfos_texts}>
          <SmallBoldText>{displayName}</SmallBoldText>
          <SmallText>{blog?.title}</SmallText>
        </View>
      </View>
    );
  }

  renderPostInfos() {
    const { title, content } = this.state;
    return (
      <>
        <SmallBoldText style={{ marginBottom: UI_SIZES.spacing.small }}>{I18n.get('blog-createpost-post-title')}</SmallBoldText>
        <TextInput
          placeholder={I18n.get('blog-createpost-post-title-placeholder')}
          value={title}
          onChangeText={text => this.setState({ title: text })}
          style={styles.input}
        />
        <SmallBoldText style={{ marginBottom: UI_SIZES.spacing.small }}>{I18n.get('blog-createpost-postcontent')}</SmallBoldText>
        <TextInput
          placeholder={I18n.get('blog-createpost-postcontent-placeholder')}
          value={content}
          onChangeText={text => this.setState({ content: text })}
          style={[styles.input, styles.inputArea]}
          textAlignVertical="top"
          multiline
        />
      </>
    );
  }

  renderPostMedia() {
    const { images } = this.state;
    return (
      <View>
        <AttachmentPicker
          onlyImages
          notifierId={uppercaseFirstLetter(moduleConfig.name)}
          imageCallback={image => this.setState(prevState => ({ images: [...prevState.images, image] }))}
          onAttachmentRemoved={images => this.setState({ images })}
          attachments={images.map(image => ({
            mime: image.type,
            name: image.fileName,
            uri: image.uri,
          }))}
        />
      </View>
    );
  }

  render() {
    const isEditing = !isEmpty(this.state.title || this.state.content || this.state.images) && !this.state.onPublish;
    return (
      <>
        <PreventBack isEditing={isEditing} />
        <KeyboardPageView scrollable={false}>
          {/* ToDo : don't use magic keywords like this. */}
          <ScrollView alwaysBounceVertical={false} overScrollMode="never" contentContainerStyle={styles.scrollView}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>{this.renderContent()}</TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardPageView>
      </>
    );
  }
}

const mapStateToProps: (s: IGlobalState) => BlogCreatePostScreenDataProps = s => {
  return {
    session: getSession(),
  };
};

const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>) => BlogCreatePostScreenEventProps = dispatch => ({
  handleUploadPostImages: async (images: ImagePicked[]) => {
    const localFiles = images.map(img => imagePickedToLocalFile(img));
    return dispatch(uploadBlogPostImagesAction(localFiles)) as unknown as Promise<SyncedFile[]>;
  },
  handleSendBlogPost: async (blog: Blog, title: string, content: string, uploadedPostImages?: SyncedFile[]) => {
    return (await dispatch(sendBlogPostAction(blog, title, content, uploadedPostImages))) as unknown as string | undefined;
  },
  handleInitTimeline: async () => {
    await dispatch(startLoadNotificationsAction());
  },
  dispatch,
});

const BlogCreatePostScreenConnected = connect(mapStateToProps, mapDispatchToProps)(BlogCreatePostScreen);
export default BlogCreatePostScreenConnected;
