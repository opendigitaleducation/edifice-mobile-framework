/**
 * Blog explorer
 */
import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen, EmptyContentScreen, EmptyScreen } from '~/framework/components/empty-screens';
import ResourceExplorer from '~/framework/components/explorer/resource-explorer';
import {
  ResourceExplorerFolderItem,
  ResourceExplorerItemWithIcon,
  ResourceExplorerItemWithImage,
} from '~/framework/components/explorer/resource-explorer/types';
import { PageView } from '~/framework/components/page';
import { SvgProps } from '~/framework/components/picture';
import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { fetchBlogsAndFoldersAction } from '~/framework/modules/blog/actions';
import BlogPlaceholderExplorer from '~/framework/modules/blog/components/placeholder/explorer';
import moduleConfig from '~/framework/modules/blog/module-config';
import { BlogNavigationParams, blogRouteNames } from '~/framework/modules/blog/navigation';
import { Blog, BlogFlatTree, BlogFolder, BlogFolderWithChildren, BlogFolderWithResources } from '~/framework/modules/blog/reducer';
import { getBlogWorkflowInformation } from '~/framework/modules/blog/rights';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { formatSource } from '~/framework/util/media';
import { tryAction } from '~/framework/util/redux/actions';
import { AsyncLoadingState } from '~/framework/util/redux/async';

export interface BlogExplorerScreenDataProps {
  tree?: BlogFlatTree;
  initialLoadingState: AsyncLoadingState;
  error?: Error;
  session?: AuthLoggedAccount;
}

export interface BlogExplorerScreenEventProps {
  tryFetch: () => Promise<[Blog[], BlogFolder[]] | undefined>;
}

export interface BlogExplorerScreenNavigationParams {
  folderId?: string;
  filter?: 'trash' | 'public' | 'sharedWithMe';
}

export type BlogExplorerScreenProps = BlogExplorerScreenDataProps &
  BlogExplorerScreenEventProps &
  NativeStackScreenProps<BlogNavigationParams, typeof blogRouteNames.blogExplorer>;

export type DisplayedBlog = Omit<Blog, 'thumbnail'>;

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<BlogNavigationParams, typeof blogRouteNames.blogExplorer>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('blog-appname'),
  }),
});

const BlogExplorerScreen = (props: BlogExplorerScreenProps) => {
  const hasBlogCreationRights =
    props.session && getBlogWorkflowInformation(props.session) && getBlogWorkflowInformation(props.session).blog.create;

  // ToDo : Make this in a useLoadingState.

  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState);

  const reload = () => {
    setLoadingState(AsyncLoadingState.RETRY);
    props
      .tryFetch()
      .then(() => setLoadingState(AsyncLoadingState.DONE))
      .catch(() => setLoadingState(AsyncLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncLoadingState.REFRESH);
    props
      .tryFetch()
      .then(() => setLoadingState(AsyncLoadingState.DONE))
      .catch(() => setLoadingState(AsyncLoadingState.REFRESH_FAILED));
  };

  const onOpenBlog = (item: DisplayedBlog) => {
    props.navigation.navigate(blogRouteNames.blogPostList, { selectedBlog: item });
  };

  const onOpenFolder = (item: BlogFolder | 'root') => {
    if (props.navigation.push) {
      props.navigation.push(`${moduleConfig.routeName}`, {
        folderId: item === 'root' ? undefined : item.id,
      });
    }
  };

  const onOpenItem = (
    item:
      | (ResourceExplorerFolderItem & BlogFolder)
      | (ResourceExplorerItemWithImage & DisplayedBlog)
      | (ResourceExplorerItemWithIcon & DisplayedBlog),
  ) => {
    if (item.type === 'folder') {
      onOpenFolder(item);
    } else if (item.type === 'resource') {
      onOpenBlog(item);
    } else {
      // No-op
    }
  };

  useEffect(() => {
    if (loadingState === AsyncLoadingState.PRISTINE) {
      setLoadingState(AsyncLoadingState.INIT);
      props
        .tryFetch()
        .then(() => setLoadingState(AsyncLoadingState.DONE))
        .catch(() => setLoadingState(AsyncLoadingState.INIT_FAILED));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentFolderId = props.route.params.folderId;
    const currentFolder = props.tree ? props.tree.folders.find(f => f.id === currentFolderId) : null;
    props.navigation.setOptions({
      headerTitle: navBarTitle(currentFolder ? currentFolder.name : I18n.get('blog-appname')),
    });
  }, [props.navigation, props.route.params.folderId, props.tree]);

  const renderEmpty = () => {
    return (
      <EmptyScreen
        svgImage="empty-search"
        title={I18n.get('blog-explorer-emptyscreen-title')}
        text={I18n.get(
          hasBlogCreationRights ? 'blog-explorer-emptyscreen-text' : 'blog-explorer-emptyscreen-text-nocreationrights',
        )}
        buttonText={hasBlogCreationRights ? I18n.get('blog-explorer-emptyscreen-button') : undefined}
        buttonUrl="/blog#/edit/new"
      />
    );
  };

  const renderError = () => {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={loadingState === AsyncLoadingState.RETRY} onRefresh={() => reload()} />}>
        <EmptyConnectionScreen />
      </ScrollView>
    );
  };

  const renderExplorer = ({
    folders,
    resources,
  }: {
    resources: Blog[];
    folders: (BlogFolderWithChildren & BlogFolderWithResources & { depth: number })[];
  }) => {
    const currentFolderId = props.route.params.folderId;
    const currentFolder = props.tree ? props.tree.folders.find(f => f.id === currentFolderId) : null;
    if (currentFolderId && !currentFolder) {
      return <EmptyContentScreen />;
    }
    const finalFolders = currentFolder ? currentFolder!.children || [] : folders.filter(f => f.depth === 0);
    const finalBlogs = currentFolder ? currentFolder!.resources || [] : resources;

    // Format data

    const { displayedblogs, displayedFolders } = (() => {
      const db = finalBlogs
        .map(bb => {
          const { thumbnail, ...b } = bb;
          return {
            ...b,
            color: (moduleConfig.displayPicture as SvgProps).fill ?? theme.palette.complementary.indigo.regular,
            date: moment.max(
              b.fetchPosts?.[0]?.firstPublishDate ??
                b.fetchPosts?.[0]?.modified ??
                b.fetchPosts?.[0]?.created ??
                b.modified ??
                b.created,
              b.modified ?? b.created,
            ),
            icon: 'bullhorn',
            ...(thumbnail && { thumbnail: formatSource(thumbnail) }),
          };
        })
        .sort((a, b) => b.date.valueOf() - a.date.valueOf());

      const df = finalFolders.map(f => ({
        ...f,
        color: (moduleConfig.displayPicture as SvgProps).fill ?? theme.palette.complementary.indigo.regular,
      }));
      return { displayedblogs: db, displayedFolders: df };
    })();

    return (
      <ResourceExplorer
        folders={displayedFolders}
        resources={displayedblogs}
        onItemPress={onOpenItem}
        refreshControl={<RefreshControl refreshing={loadingState === AsyncLoadingState.REFRESH} onRefresh={() => refresh()} />}
        ListFooterComponent={<View style={{ paddingBottom: UI_SIZES.screen.bottomInset }} />}
        ListEmptyComponent={renderEmpty()}
        keyExtractor={item => item.id}
      />
    );
  };

  const renderPage = () => {
    switch (loadingState) {
      case AsyncLoadingState.DONE:
      case AsyncLoadingState.REFRESH:
      case AsyncLoadingState.REFRESH_FAILED:
        return <>{renderExplorer(props.tree || { folders: [], resources: [] })}</>;

      case AsyncLoadingState.PRISTINE:
      case AsyncLoadingState.INIT:
        return <BlogPlaceholderExplorer />;

      case AsyncLoadingState.INIT_FAILED:
      case AsyncLoadingState.RETRY:
        return renderError();
    }
  };

  return <PageView>{renderPage()}</PageView>;
};

export default connect(
  (gs: IGlobalState) => {
    const bs = moduleConfig.getState(gs);
    return {
      error: bs.blogs.error ?? bs.folders.error,
      initialLoadingState: bs.folders.isPristine || bs.blogs.isPristine ? AsyncLoadingState.PRISTINE : AsyncLoadingState.DONE,
      session: getSession(),
      tree: bs.tree,
    };
  },
  dispatch =>
    bindActionCreators<BlogExplorerScreenEventProps>(
      {
        tryFetch: tryAction(fetchBlogsAndFoldersAction),
      },
      dispatch,
    ),
)(BlogExplorerScreen);
