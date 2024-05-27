import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import MultilineTextInput from '~/framework/components/inputs/multiline';
import { RichEditorForm } from '~/framework/components/inputs/rich-text';
import { LoadingIndicator } from '~/framework/components/loading';
import { NavBarAction, NavBarActionsGroup } from '~/framework/components/navigation';
import Toast from '~/framework/components/toast';
import { getSession } from '~/framework/modules/auth/reducer';
import { editBlogPostAction } from '~/framework/modules/blog/actions';
import { BlogNavigationParams, blogRouteNames } from '~/framework/modules/blog/navigation';
import { Blog } from '~/framework/modules/blog/reducer';
import { getBlogPostRight } from '~/framework/modules/blog/rights';
import { startLoadNotificationsAction } from '~/framework/modules/timeline/actions';
import { navBarOptions } from '~/framework/navigation/navBar';

import styles from './styles';
import { BlogEditPostScreenDataProps, BlogEditPostScreenEventProps, BlogEditPostScreenProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<BlogNavigationParams, typeof blogRouteNames.blogCreatePost>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('blog-editpost-title'),
    titleStyle: { width: undefined },
  }),
});

const preventBackI18n = {
  title: 'blog-createpost-confirmation-unsavedpublication',
  text: 'blog-createpost-unsavedpublication',
};

const BlogEditPostScreen = (props: BlogEditPostScreenProps) => {
  const [loadingState, setLoadingState] = React.useState(false);
  const [title, setTitle] = React.useState(props.route.params.title);
  const [content, setContent] = React.useState(props.route.params.content);

  const { route, navigation, session, handleEditBlogPost } = props;
  const blog = route.params.blog;

  const doEditPost = async () => {
    try {
      const blogId = blog && blog.id;
      if (!blog || !blogId) {
        throw new Error('[doEditPost] failed to retrieve blog information');
      }
      const blogPostRight = blog && session && getBlogPostRight(blog, session);
      if (!blogPostRight) {
        throw new Error('[doEditPost] user has no post rights for this blog');
      }

      // Translate entered content to httml
      const htmlContent = content.replace(/\n/g, '<br>').trim();

      await handleEditBlogPost(blog, props.route.params.postId, title.trim(), htmlContent);

      navigation.goBack();
      Toast.showSuccess(I18n.get('blog-createpost-publish-success'));
    } catch {
      Toast.showError(I18n.get('blog-createpost-publish-error-text'));
    }
  };

  const doEdit = async () => {
    Keyboard.dismiss();
    try {
      setLoadingState(true);
      await doEditPost();
    } finally {
      setLoadingState(false);
    }
  };

  React.useEffect(() => {
    props.navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <NavBarActionsGroup
          elements={[
            {
              ...(loadingState ? (
                <LoadingIndicator small customColor={theme.ui.text.inverse} />
              ) : (
                <NavBarAction icon="ui-save" onPress={doEdit} />
              )),
            },
          ]}
        />
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, loadingState, content]);

  const topForm = React.useCallback(
    onChange => (
      <MultilineTextInput
        style={styles.inputTitle}
        placeholder={I18n.get('blog-editpost-inputtitle')}
        numberOfLines={1}
        onChangeText={text => {
          setTitle(text);
          onChange();
        }}
        value={title}
      />
    ),
    [title],
  );

  const renderPostInfos = () => {
    return (
      <RichEditorForm
        topForm={topForm}
        initialContentHtml={props.route.params.content}
        uploadParams={
          blog.visibility === 'PUBLIC'
            ? {
                public: true,
              }
            : {
                parent: 'protected',
              }
        }
        onChangeText={value => setContent(value)}
        preventBackI18n={preventBackI18n}
      />
    );
  };

  return <>{renderPostInfos()}</>;
};

const mapStateToProps: (s: IGlobalState) => BlogEditPostScreenDataProps = s => {
  return {
    session: getSession(),
  };
};

const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>) => BlogEditPostScreenEventProps = dispatch => ({
  handleEditBlogPost: async (blog: Blog, postId: string, title: string, content: string) => {
    return (await dispatch(editBlogPostAction(blog, postId, title, content))) as unknown as string | undefined;
  },
  handleInitTimeline: async () => {
    await dispatch(startLoadNotificationsAction());
  },
  dispatch,
});

const BlogEditPostScreenConnected = connect(mapStateToProps, mapDispatchToProps)(BlogEditPostScreen);
export default BlogEditPostScreenConnected;
