import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { EmptyScreen } from '~/framework/components/empty-screens';
import ResourcePicker from '~/framework/components/explorer/resource-picker';
import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { getPublishableBlogListAction } from '~/framework/modules/blog/actions';
import { moduleColor } from '~/framework/modules/blog/module-config';
import { BlogNavigationParams, blogRouteNames } from '~/framework/modules/blog/navigation';
import { BlogList } from '~/framework/modules/blog/reducer';
import { getBlogWorkflowInformation } from '~/framework/modules/blog/rights';
import { navBarOptions } from '~/framework/navigation/navBar';

export interface BlogSelectScreenDataProps {
  session?: AuthLoggedAccount;
}
export interface BlogSelectScreenEventProps {
  handleGetPublishableBlogList(): Promise<BlogList | undefined>;
}
export interface BlogSelectScreenNavParams {
  blogsData: BlogList;
}
export type BlogSelectScreenProps = BlogSelectScreenDataProps &
  BlogSelectScreenEventProps &
  NativeStackScreenProps<BlogNavigationParams, typeof blogRouteNames.home>;

export interface BlogSelectScreenState {
  blogsData: BlogList;
}

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<BlogNavigationParams, typeof blogRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('blog-select-title'),
  }),
});

export class BlogSelectScreen extends React.PureComponent<BlogSelectScreenProps, BlogSelectScreenState> {
  state: BlogSelectScreenState = { blogsData: this.props.route.params.blogsData };

  doGetPublishableBlogList = async () => {
    const { handleGetPublishableBlogList } = this.props;
    const blogsData = await handleGetPublishableBlogList();
    if (!blogsData) {
      throw new Error('[doGetPublishableBlogList] failed to retrieve the publishable blog list');
    }
    this.setState({ blogsData });
  };

  onPressBlog = blog => {
    const { navigation } = this.props;
    navigation.navigate(blogRouteNames.blogCreatePost, { blog });
  };

  renderEmptyBlogList = () => {
    const { session } = this.props;
    const hasBlogCreationRights = session && getBlogWorkflowInformation(session)?.blog.create;
    return (
      <EmptyScreen
        svgImage="empty-search"
        title={I18n.get('blog-select-emptyscreen-title')}
        text={I18n.get(hasBlogCreationRights ? 'blog-select-emptyscreen-text' : 'blog-select-emptyscreen-text-nocreationrights')}
        buttonText={hasBlogCreationRights ? I18n.get('blog-select-emptyscreen-button') : undefined}
        buttonUrl="/blog#/edit/new"
      />
    );
  };

  render() {
    const { blogsData } = this.state;

    return (
      <ResourcePicker
        data={blogsData}
        emptyComponent={this.renderEmptyBlogList}
        onRefresh={this.doGetPublishableBlogList}
        onPressItem={this.onPressBlog}
        defaultThumbnail={{ name: 'blog', fill: moduleColor.regular, background: moduleColor.pale }}
      />
    );
  }
}

const mapStateToProps: (s: IGlobalState) => BlogSelectScreenDataProps = s => ({ session: getSession() });

const mapDispatchToProps: (
  dispatch: ThunkDispatch<any, any, any>,
  getState: () => IGlobalState,
) => BlogSelectScreenEventProps = dispatch => ({
  handleGetPublishableBlogList: async () => {
    const blogs = (await dispatch(getPublishableBlogListAction())) as unknown as BlogList;
    return blogs;
  },
});

const BlogSelectScreenConnected = connect(mapStateToProps, mapDispatchToProps)(BlogSelectScreen);
export default BlogSelectScreenConnected;
