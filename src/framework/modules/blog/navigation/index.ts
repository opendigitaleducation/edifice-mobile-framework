import { ParamListBase } from '@react-navigation/native';

import moduleConfig from '~/framework/modules/blog/module-config';
import { BlogExplorerScreenNavigationParams } from '~/framework/modules/blog/screens/BlogExplorerScreen';
import { BlogSelectScreenNavParams } from '~/framework/modules/blog/screens/BlogSelectScreen';
import { BlogPostDetailsScreenNavParams } from '~/framework/modules/blog/screens/blog-post-details/types';
import { BlogCreatePostScreenNavParams } from '~/framework/modules/blog/screens/create-post/types';
import { BlogEditPostScreenNavParams } from '~/framework/modules/blog/screens/edit/types';
import { BlogPostListScreenNavigationParams } from '~/framework/modules/blog/screens/list/types';

export interface BlogNavigationParams extends ParamListBase {
  home: BlogSelectScreenNavParams;
  blogExplorer: BlogExplorerScreenNavigationParams;
  blogPostList: BlogPostListScreenNavigationParams;
  blogPostDetails: BlogPostDetailsScreenNavParams;
  blogCreatePost: BlogCreatePostScreenNavParams;
  blogEditPost: BlogEditPostScreenNavParams;
}

export const blogRouteNames = {
  home: `${moduleConfig.routeName}/select` as 'home',
  blogExplorer: `${moduleConfig.routeName}` as 'blogExplorer',
  blogPostList: `${moduleConfig.routeName}/posts` as 'blogPostList',
  blogPostDetails: `${moduleConfig.routeName}/details` as 'blogPostDetails',
  blogCreatePost: `${moduleConfig.routeName}/create` as 'blogCreatePost',
  blogEditPost: `${moduleConfig.routeName}/edit` as 'blogEditPost',
};
