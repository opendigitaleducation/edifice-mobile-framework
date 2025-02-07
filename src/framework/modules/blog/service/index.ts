/**
 * Blog services
 */
import moment from 'moment';

import { AuthActiveAccount } from '~/framework/modules/auth/model';
import { Blog, BlogFolder, BlogList, BlogPost, BlogPostComment, BlogPostComments } from '~/framework/modules/blog/reducer';
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

export const blogFetchPostAdapter = (blogPost: Omit<IEntcoreBlogPost, 'content'>) => {
  const ret = {
    _id: blogPost._id,
    author: {
      login: blogPost.author.login,
      userId: blogPost.author.userId,
      username: blogPost.author.username,
    },
    created: moment(blogPost.created.$date),
    firstPublishDate: blogPost.firstPublishDate?.$date && moment(blogPost.firstPublishDate.$date),
    modified: moment(blogPost.modified.$date),
    state: blogPost.state,
    title: blogPost.title,
    views: blogPost.views,
  };
  return ret as Omit<BlogPost, 'content'>;
};

export const blogAdapter = (blog: IEntcoreBlog) => {
  const ret = {
    author: {
      login: blog.author.login,
      userId: blog.author.userId,
      username: blog.author.username,
    },
    'comment-type': blog['comment-type'],
    created: moment(blog.created.$date),
    description: blog.description,
    fetchPosts: blog.fetchPosts?.map(bp => blogFetchPostAdapter(bp)),
    id: blog._id,
    modified: moment(blog.modified.$date),
    'publish-type': blog['publish-type'],
    shared: blog.shared,
    thumbnail: blog.thumbnail,
    title: blog.title,
    trashed: blog.trashed,
    visibility: blog.visibility,
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
    _id: blogPost._id,
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
  };
  return ret as BlogPost;
};

export const blogFolderAdapter = (blogFolder: IEntcoreBlogFolder) => {
  return {
    ...blogFolder,
    created: moment(blogFolder.created.$date),
    id: blogFolder._id,
    modified: moment(blogFolder.created.$date),
    resourceIds: blogFolder.ressourceIds,
  } as BlogFolder;
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
  comments: {
    delete: async (session: AuthActiveAccount, blogPostCommentId: { blogId: string; postId: string; commentId: string }) => {
      const { blogId, commentId, postId } = blogPostCommentId;
      const api = `/blog/comment/${blogId}/${postId}/${commentId}`;
      return signedFetchJson(`${session.platform.url}${api}`, {
        method: 'DELETE',
      }) as Promise<{ number: number }>;
    },
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
        body,
        method: 'POST',
      }) as Promise<{ number: number }>;
    },
    update: async (
      session: AuthActiveAccount,
      blogPostCommentId: { blogId: string; postId: string; commentId: string },
      comment: string,
    ) => {
      const { blogId, commentId, postId } = blogPostCommentId;
      const api = `/blog/comment/${blogId}/${postId}/${commentId}`;
      const body = JSON.stringify({ comment });
      return signedFetchJson(`${session.platform.url}${api}`, {
        body,
        method: 'PUT',
      }) as Promise<{ number: number }>;
    },
  },

  // This service automatically filters only non-trashed content.
  folders: {
    list: async (session: AuthActiveAccount) => {
      const api = `/blog/folder/list/all`;
      const entcoreBlogFolderList = (await fetchJSONWithCache(api)) as IEntcoreBlogFolder[];
      return (entcoreBlogFolderList.map(b => blogFolderAdapter(b as IEntcoreBlogFolder)) as BlogFolder[]).filter(f => !f.trashed);
    },
  },

  get: async (session: AuthActiveAccount, blogId: string) => {
    const api = `/blog/${blogId}`;
    const entcoreBlog = (await fetchJSONWithCache(api)) as IEntcoreBlog;
    return blogAdapter(entcoreBlog);
  },
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
  post: {
    create: async (session: AuthActiveAccount, blogId: string, postTitle: string, postContentHtml: string) => {
      const api = `/blog/post/${blogId}`;
      const body = JSON.stringify({ content: postContentHtml, title: postTitle });
      return signedFetchJson(`${session.platform.url}${api}`, {
        body,
        method: 'POST',
      }) as Promise<IEntcoreCreatedBlogPost>;
    },
    delete: async (session: AuthActiveAccount, blogPostId: { blogId: string; postId: string }) => {
      const { blogId, postId } = blogPostId;
      const api = `/blog/post/${blogId}/${postId}`;
      return signedFetch(`${session.platform.url}${api}`, {
        method: 'DELETE',
      }) as Promise<Response>;
    },
    edit: async (session: AuthActiveAccount, blogId: string, postId: string, postTitle: string, postContentHtml: string) => {
      const api = `/blog/post/${blogId}/${postId}`;
      const body = JSON.stringify({ content: postContentHtml, title: postTitle });
      return signedFetchJson(`${session.platform.url}${api}`, {
        body,
        method: 'PUT',
      });
    },
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
    publish: async (session: AuthActiveAccount, blogId: string, postId: string) => {
      const api = `/blog/post/publish/${blogId}/${postId}`;
      return signedFetchJson(`${session.platform.url}${api}`, { method: 'PUT' }) as Promise<{ number: number }>;
    },
    submit: async (session: AuthActiveAccount, blogId: string, postId: string) => {
      const api = `/blog/post/submit/${blogId}/${postId}`;
      return signedFetchJson(`${session.platform.url}${api}`, { method: 'PUT' }) as Promise<{ number: number }>;
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
      const blogPosts = entcoreBlogPostList.map(bp => blogPostAdapter(bp)) as BlogPost[];
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
      const blogPosts = entcoreBlogPostList.map(bp => blogPostAdapter(bp)) as BlogPost[];
      return blogPosts;
    },
  },
};
