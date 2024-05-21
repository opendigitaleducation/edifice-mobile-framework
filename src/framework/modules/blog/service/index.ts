/**
 * Blog services
 */
import moment from 'moment';

import { AuthActiveAccount } from '~/framework/modules/auth/model';
import {
  Blog,
  BlogFolder,
  BlogList,
  BlogPost,
  BlogPostComment,
  BlogPostComments,
  BlogPostList,
} from '~/framework/modules/blog/reducer';
import { AudienceReactions, AudienceViewer, AudienceViews } from '~/framework/modules/core/audience/types';
import { IResourceUriCaptureFunction } from '~/framework/util/notifications';
import { fetchJSONWithCache, signedFetch, signedFetchJson } from '~/infra/fetchWithCache';

export interface IEntcoreBlog {
  _id: string;
  visibility: string;
  title: string;
  thumbnail?: string;
  trashed?: boolean;
  'comment-type': string;
  'publish-type': string;
  description?: string;
  created: { $date: number };
  modified: { $date: number };
  author: { userId: string; username: string; login: string };
  shared?: ({
    [key: string]: boolean | string | undefined;
  } & {
    [key in 'userId' | 'groupId']: string;
  })[];
  fetchPosts?: Omit<IEntcoreBlogPost, 'content'>[];
}
export type IEntcoreBlogList = IEntcoreBlog[];

interface IEntcoreBlogPostBase {
  author: {
    login: string;
    userId: string;
    username: string;
  };
  comments?: IEntcoreBlogPostComments;
  content: string;
  created: { $date: number };
  modified: { $date: number };
  state: string;
  title: string;
  views: number;
  _id: string;
}

export interface IEntcoreBlogPost extends IEntcoreBlogPostBase {
  firstPublishDate?: { $date: number };
}

export type IEntcoreBlogPostList = IEntcoreBlogPost[];

export interface IEntcoreCreatedBlogPost extends IEntcoreBlogPostBase {
  comments: any[];
  blog: {
    $ref: string;
    $id: string;
  };
  sorted: { $date: number };
  contentPlain: string;
}

export interface IEntcoreBlogPostComment {
  author: {
    login: string;
    userId: string;
    username: string;
  };
  coauthor?: {
    login: string;
    userId: string;
    username: string;
  };
  comment: string;
  created: { $date: number };
  id: string;
  modified?: { $date: number };
  state: string;
}

export type IEntcoreBlogPostComments = IEntcoreBlogPostComment[];

export interface IEntcoreBlogFolder {
  _id: string;
  name: string;
  ressourceIds: string[];
  created: { $date: number };
  modified: { $date: number };
  owner: { userId: string; displayName: string };
  parentId?: string;
  trashed?: boolean;
}

export interface IEntcoreBlogViews {
  uniqueViewsCounter: number;
  uniqueViewsPerProfile: {
    counter: number;
    profile: string;
  }[];
  viewsCounter: number;
}

export interface IEntcoreBlogReactions {
  reactionCounters: {
    allReactionsCounter: number;
    countByType: object;
  };
  userReactions: {
    userId: string;
    profile: string;
    reactionType: string;
    displayName: string;
  }[];
}

export const blogFetchPostAdapter = (blogPost: Omit<IEntcoreBlogPost, 'content'>) => {
  const ret = {
    _id: blogPost._id,
    author: {
      login: blogPost.author.login,
      userId: blogPost.author.userId,
      username: blogPost.author.username,
    },
    created: moment(blogPost.created.$date),
    modified: moment(blogPost.modified.$date),
    firstPublishDate: blogPost.firstPublishDate?.$date && moment(blogPost.firstPublishDate.$date),
    state: blogPost.state,
    title: blogPost.title,
    views: blogPost.views,
  };
  return ret as Omit<BlogPost, 'content'>;
};

export const blogAdapter = (blog: IEntcoreBlog) => {
  const ret = {
    id: blog._id,
    visibility: blog.visibility,
    title: blog.title,
    thumbnail: blog.thumbnail,
    trashed: blog.trashed,
    'comment-type': blog['comment-type'],
    'publish-type': blog['publish-type'],
    description: blog.description,
    created: moment(blog.created.$date),
    modified: moment(blog.modified.$date),
    author: {
      login: blog.author.login,
      userId: blog.author.userId,
      username: blog.author.username,
    },
    shared: blog.shared,
    fetchPosts: blog.fetchPosts?.map(bp => blogFetchPostAdapter(bp)),
  };
  return ret as Blog;
};

export const blogPostCommentsAdapter = (blogPostComments: IEntcoreBlogPostComments) => {
  const ret = blogPostComments.map(blogPostComment => {
    const adaptedBlogPostComment: BlogPostComment = {
      ...blogPostComment,
      created: moment(blogPostComment.created.$date),
      modified: blogPostComment.modified ? moment(blogPostComment.modified.$date) : undefined,
    };
    return adaptedBlogPostComment;
  });
  return ret as BlogPostComments;
};

export const blogPostAdapter = (blogPost: IEntcoreBlogPost) => {
  const ret = {
    author: {
      login: blogPost.author.login,
      userId: blogPost.author.userId,
      username: blogPost.author.username,
    },
    comments: blogPost.comments && blogPostCommentsAdapter(blogPost.comments),
    content: blogPost.content,
    created: moment(blogPost.created.$date),
    firstPublishDate: blogPost.firstPublishDate && moment(blogPost.firstPublishDate.$date),
    modified: moment(blogPost.modified.$date),
    state: blogPost.state,
    title: blogPost.title,
    views: blogPost.views,
    _id: blogPost._id,
  };
  return ret as BlogPost;
};

export const blogFolderAdapter = (blogFolder: IEntcoreBlogFolder) => {
  return {
    ...blogFolder,
    id: blogFolder._id,
    created: moment(blogFolder.created.$date),
    modified: moment(blogFolder.created.$date),
    resourceIds: blogFolder.ressourceIds,
  } as BlogFolder;
};

export const blogViewsAdapter = (blogViews: IEntcoreBlogViews) => {
  return {
    uniqueViewsCounter: blogViews.uniqueViewsCounter,
    uniqueViewsPerProfile: blogViews.uniqueViewsPerProfile as AudienceViewer[],
    viewsCounter: blogViews.viewsCounter,
  } as AudienceViews;
};

export const blogReactionsAdapter = (blogReactions: IEntcoreBlogReactions) => {
  return {
    allReactionsCounter: blogReactions.reactionCounters.allReactionsCounter,
    countByType: blogReactions.reactionCounters.countByType,
    userReactions: blogReactions.userReactions,
  } as AudienceReactions;
};

export const blogUriCaptureFunction: IResourceUriCaptureFunction<{ blogId: string; postId: string }> = url => {
  const blogPostIdRegex = /^\/blog.+\/([a-z0-9-]{36})\/([a-z0-9-]{36})\/?/;
  const blogIdRegex = /^\/blog.+\/([a-z0-9-]{36})\/?/;
  const blogPostIdMatch = url.match(blogPostIdRegex);
  return !blogPostIdMatch
    ? {
        blogId: url.match(blogIdRegex)?.[1],
      }
    : {
        blogId: blogPostIdMatch?.[1],
        postId: blogPostIdMatch?.[2],
      };
};
export const blogPostGenerateResourceUriFunction = ({ blogId, postId }: { blogId: string; postId: string }) => {
  return `/blog#/detail/${blogId}/${postId}`;
};

export const blogService = {
  // This service automatically filters only non-trashed content.
  list: async (session: AuthActiveAccount) => {
    const api = `/blog/list/all`;
    const entcoreBlogList = (await fetchJSONWithCache(api)) as IEntcoreBlogList;
    const blogList = [] as BlogList;
    for (const entcoreBlog of entcoreBlogList) {
      if (!entcoreBlog.trashed) blogList.push(blogAdapter(entcoreBlog));
    }
    return blogList;
  },
  get: async (session: AuthActiveAccount, blogId: string) => {
    const api = `/blog/${blogId}`;
    const entcoreBlog = (await fetchJSONWithCache(api)) as IEntcoreBlog;
    return blogAdapter(entcoreBlog);
  },
  // This service automatically filters only non-trashed content.
  folders: {
    list: async (session: AuthActiveAccount) => {
      const api = `/blog/folder/list/all`;
      const entcoreBlogFolderList = (await fetchJSONWithCache(api)) as IEntcoreBlogFolder[];
      return (entcoreBlogFolderList.map(b => blogFolderAdapter(b as IEntcoreBlogFolder)) as BlogFolder[]).filter(f => !f.trashed);
    },
  },
  posts: {
    get: async (session: AuthActiveAccount, blogId: string, state?: string | string[]) => {
      let stateAsArray: string[] | undefined;
      if (typeof state === 'string') stateAsArray = [state];
      else stateAsArray = state;
      let api = `/blog/post/list/all/${blogId}?content=true`;
      if (stateAsArray) api += `&states=${stateAsArray.join(',')}`;
      const entcoreBlogPostList = (await fetchJSONWithCache(api)) as IEntcoreBlogPostList;
      const blogPosts = entcoreBlogPostList.map(bp => blogPostAdapter(bp)) as BlogPostList;
      return blogPosts;
    },
    page: async (session: AuthActiveAccount, blogId: string, page: number, state?: string | string[]) => {
      // Compute state parameter
      let stateAsArray: string[] | undefined;
      if (typeof state === 'string') stateAsArray = [state];
      else stateAsArray = state;
      // Call API
      let api = `/blog/post/list/all/${blogId}?content=true&page=${page}`;
      if (stateAsArray) api += `&states=${stateAsArray.join(',')}`;
      const entcoreBlogPostList = (await fetchJSONWithCache(api)) as IEntcoreBlogPostList;
      const blogPosts = entcoreBlogPostList.map(bp => blogPostAdapter(bp)) as BlogPostList;
      return blogPosts;
    },
  },
  post: {
    get: async (session: AuthActiveAccount, blogPostId: { blogId: string; postId: string }, state?: string) => {
      const { blogId, postId } = blogPostId;
      if (!state) {
        const apiMetadata = `/blog/post/list/all/${blogId}?postId=${postId}`;
        const entcoreBlogPostMetadata = (await fetchJSONWithCache(apiMetadata)) as IEntcoreBlogPost;
        state = entcoreBlogPostMetadata[0].state;
      }
      let api = `/blog/post/${blogId}/${postId}`;
      if (state) {
        api += `?state=${state}`;
      }
      const entcoreBlogPost = (await fetchJSONWithCache(api)) as IEntcoreBlogPost;
      // Run the adapter for the received blog post
      return blogPostAdapter(entcoreBlogPost) as BlogPost;
    },
    create: async (session: AuthActiveAccount, blogId: string, postTitle: string, postContentHtml: string) => {
      const api = `/blog/post/${blogId}`;
      const body = JSON.stringify({ title: postTitle, content: postContentHtml });
      return signedFetchJson(`${session.platform.url}${api}`, {
        method: 'POST',
        body,
      }) as Promise<IEntcoreCreatedBlogPost>;
    },
    edit: async (session: AuthActiveAccount, blogId: string, postId: string, postTitle: string, postContentHtml: string) => {
      const api = `/blog/post/${blogId}/${postId}`;
      const body = JSON.stringify({ title: postTitle, content: postContentHtml });
      return signedFetchJson(`${session.platform.url}${api}`, {
        method: 'PUT',
        body,
      });
    },
    submit: async (session: AuthActiveAccount, blogId: string, postId: string) => {
      const api = `/blog/post/submit/${blogId}/${postId}`;
      return signedFetchJson(`${session.platform.url}${api}`, { method: 'PUT' }) as Promise<{ number: number }>;
    },
    publish: async (session: AuthActiveAccount, blogId: string, postId: string) => {
      const api = `/blog/post/publish/${blogId}/${postId}`;
      return signedFetchJson(`${session.platform.url}${api}`, { method: 'PUT' }) as Promise<{ number: number }>;
    },
    delete: async (session: AuthActiveAccount, blogPostId: { blogId: string; postId: string }) => {
      const { blogId, postId } = blogPostId;
      const api = `/blog/post/${blogId}/${postId}`;
      return signedFetch(`${session.platform.url}${api}`, {
        method: 'DELETE',
      }) as Promise<Response>;
    },
  },
  comments: {
    get: async (session: AuthActiveAccount, blogPostId: { blogId: string; postId: string }) => {
      const { blogId, postId } = blogPostId;
      const api = `/blog/comments/${blogId}/${postId}`;
      const entcoreBlogPostComments = (await fetchJSONWithCache(api)) as IEntcoreBlogPostComments;
      // Run the adapter for the received blog post comments
      return blogPostCommentsAdapter(entcoreBlogPostComments) as BlogPostComments;
    },
    publish: async (session: AuthActiveAccount, blogPostId: { blogId: string; postId: string }, comment: string) => {
      const { blogId, postId } = blogPostId;
      const api = `/blog/comment/${blogId}/${postId}`;
      const body = JSON.stringify({ comment });
      return signedFetchJson(`${session.platform.url}${api}`, {
        method: 'POST',
        body,
      }) as Promise<{ number: number }>;
    },
    update: async (
      session: AuthActiveAccount,
      blogPostCommentId: { blogId: string; postId: string; commentId: string },
      comment: string,
    ) => {
      const { blogId, postId, commentId } = blogPostCommentId;
      const api = `/blog/comment/${blogId}/${postId}/${commentId}`;
      const body = JSON.stringify({ comment });
      return signedFetchJson(`${session.platform.url}${api}`, {
        method: 'PUT',
        body,
      }) as Promise<{ number: number }>;
    },
    delete: async (session: AuthActiveAccount, blogPostCommentId: { blogId: string; postId: string; commentId: string }) => {
      const { blogId, postId, commentId } = blogPostCommentId;
      const api = `/blog/comment/${blogId}/${postId}/${commentId}`;
      return signedFetchJson(`${session.platform.url}${api}`, {
        method: 'DELETE',
      }) as Promise<{ number: number }>;
    },
  },
  audience: {
    views: {
      get: async (blogPostId: string) => {
        const api = `/audience/views/details/blog/post/${blogPostId}`;
        const entcoreBlogPostViews = (await fetchJSONWithCache(api)) as IEntcoreBlogViews;
        return blogViewsAdapter(entcoreBlogPostViews) as AudienceViews;
      },
      getForManyPosts: async (blogPostIds: string[]) => {
        const api = `/audience/views/count/blog/post?resourceIds=${blogPostIds.join('&')}`;
        const entcoreBlogPostsViews = await fetchJSONWithCache(api);
        return entcoreBlogPostsViews;
      },

      post: async (session: AuthActiveAccount, blogPostId: string) => {
        const api = `/audience/views/blog/post/${blogPostId}`;
        const body = JSON.stringify({});
        return signedFetchJson(`${session.platform.url}${api}`, {
          method: 'POST',
          body,
        }) as Promise<{ number: number }>;
      },
    },
    reactions: {
      get: async (blogPostId: string) => {
        const api = `/audience/reactions/blog/post/${blogPostId}?page=1&size=30`;
        const entcoreBlogPostReactions = (await fetchJSONWithCache(api)) as IEntcoreBlogReactions;
        return blogReactionsAdapter(entcoreBlogPostReactions) as AudienceReactions;
      },
      post: async (session: AuthActiveAccount, blogPostId: string, reaction: string) => {
        const api = `/audience/reactions/blog/post`;
        const body = JSON.stringify({
          ressourceId: blogPostId,
          reactionType: reaction,
        });
        return signedFetchJson(`${session.platform.url}${api}`, {
          method: 'POST',
          body,
        }) as Promise<any>;
      },
      update: async (session: AuthActiveAccount, blogPostId: string, reaction: string) => {
        const api = `/audience/reactions/blog/post`;
        const body = JSON.stringify({
          ressourceId: blogPostId,
          reactionType: reaction,
        });
        return signedFetchJson(`${session.platform.url}${api}`, {
          method: 'PUT',
          body,
        }) as Promise<{ number: number }>;
      },
      delete: async (session: AuthActiveAccount, blogPostId: string) => {
        const api = `/audience/reactions/blog/post/${blogPostId}`;
        return signedFetchJson(`${session.platform.url}${api}`, {
          method: 'DELETE',
        }) as Promise<{ number: number }>;
      },
    },
  },
};
