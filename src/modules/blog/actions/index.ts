/**
 * Blog actions
 */
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

import workspaceFileTransferActions from '~/framework/modules/workspace/actions/fileTransfer';
import { IDistantFile, LocalFile } from '~/framework/util/fileHandler';
import { createAsyncActionCreators } from '~/framework/util/redux/async';
import { getUserSession } from '~/framework/util/session';
import moduleConfig from '~/modules/blog/moduleConfig';
import { IBlog, IBlogFolder, IBlogPost, actionTypes, getPublishableBlogs } from '~/modules/blog/reducer';
import {
  createBlogPostResourceRight,
  getBlogPostRight,
  publishBlogPostResourceRight,
  submitBlogPostResourceRight,
} from '~/modules/blog/rights';
import { blogService } from '~/modules/blog/service';

/**
 * Fetch the details of a given blog post.
 * Info: no reducer is used in this action.
 */
export const getBlogPostDetailsAction =
  (blogPostId: { blogId: string; postId: string }, blogPostState?: string) =>
  async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      const session = getUserSession();

      // Get blog post and comments
      const [blogPost, blogPostComments] = await Promise.all([
        blogService.post.get(session, blogPostId, blogPostState),
        blogService.comments.get(session, blogPostId),
      ]);
      const blogPostWithComments = {
        ...blogPost,
        comments: blogPostComments,
      };
      return blogPostWithComments;
    } catch (e) {
      // ToDo: Error handling
    }
  };

/**
 * Fetch the posts of a given blog.
 */
export const blogPostsActionsCreators = createAsyncActionCreators(actionTypes.blogPosts);
export const fetchBlogPostsAction =
  (blogId: string): ThunkAction<Promise<IBlogPost[]>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = getUserSession();
      dispatch(blogPostsActionsCreators.request());
      const blogPosts = await blogService.posts.get(session, blogId);
      dispatch(blogPostsActionsCreators.receipt(blogPosts));
      return blogPosts;
    } catch (e) {
      dispatch(blogPostsActionsCreators.error(e as Error));
      throw e;
    }
  };

/**
 * Fetch the user's publishable blog list.
 * Info: no reducer is used in this action.
 */
export const getPublishableBlogListAction = () => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
  try {
    const session = getUserSession();

    const allBlogs = await blogService.list(session);
    const publishableBlogs = getPublishableBlogs(session, allBlogs);
    return publishableBlogs;
  } catch (e) {
    // ToDo: Error handling
  }
};

export const getBlogsAction = () => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
  const session = getUserSession();
  const ret = await Promise.all([blogService.list(session), blogService.folders.list(session)]);
  return { blogs: ret[0], folders: ret[1] };
};

export const uploadBlogPostImagesAction =
  (images: LocalFile[]) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    return dispatch(
      workspaceFileTransferActions.uploadFilesAction(images, {
        parent: 'protected',
      }),
    );
  };

/**
 * Create and submit/publish a post for a given blog.
 * Info: no reducer is used in this action.
 */
export const sendBlogPostAction =
  (blog: IBlog, postTitle: string, postContent: string, uploadedPostImages?: IDistantFile[]) =>
  async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      const session = getUserSession();
      const blogId = blog.id;
      const blogPostRight = getBlogPostRight(blog, session);
      if (!blogPostRight) {
        throw new Error('[sendBlogPostAction] user has no post rights for this blog');
      }

      // Create post
      const postId = (await dispatch(
        createBlogPostAction(blogId, postTitle, postContent, uploadedPostImages),
      )) as unknown as string;

      // Submit or publish post
      if (!postId) {
        throw new Error('[sendBlogPostAction] failed to access id of created post');
      }
      const blogPostActionRight = blogPostRight.actionRight;
      const shareAction = {
        [createBlogPostResourceRight]: undefined,
        [submitBlogPostResourceRight]: () => dispatch(submitBlogPostAction(blogId, postId)) as unknown as Promise<string>,
        [publishBlogPostResourceRight]: () => dispatch(publishBlogPostAction(blogId, postId)) as unknown as Promise<string>,
      }[blogPostActionRight];
      shareAction && (await shareAction());
    } catch (e) {
      // ToDo: Error handling
    }
  };

/**
 * Create a post for a given blog.
 * Info: no reducer is used in this action.
 */
export const createBlogPostAction =
  (blogId: string, postTitle: string, postContent: string, uploadedPostImages?: IDistantFile[]) =>
  async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      const session = getUserSession();

      let postContentHtml = `<p class="ng-scope" style="">${postContent}</p>`;
      if (uploadedPostImages) {
        const postImageUploads = Object.values(uploadedPostImages);
        const images = postImageUploads
          .map(postImageUpload => `<img src="${postImageUpload.url}?thumbnail=2600x0" class="">`)
          .join('');
        const imagesHtml = `<p class="ng-scope" style="">
        <span contenteditable="false" class="image-container ng-scope" style="">
          ${images}
        </span>
      </p>`;
        postContentHtml = postContentHtml + imagesHtml;
      }

      const createdPost = await blogService.post.create(session, blogId, postTitle, postContentHtml);
      const postId = createdPost._id;
      return postId;
    } catch (e) {
      // ToDo: Error handling
    }
  };

/**
 * Submit a created post for a given blog.
 * Info: no reducer is used in this action.
 */
export const submitBlogPostAction =
  (blogId: string, postId: string) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      const session = getUserSession();

      return blogService.post.submit(session, blogId, postId);
    } catch (e) {
      // ToDo: Error handling
    }
  };

/**
 * Publish a created post for a given blog.
 * Info: no reducer is used in this action.
 */
export const publishBlogPostAction =
  (blogId: string, postId: string) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      const session = getUserSession();

      return blogService.post.publish(session, blogId, postId);
    } catch (e) {
      // ToDo: Error handling
    }
  };

/**
 * Delete a blog post.
 * Info: no reducer is used in this action.
 */
export const deleteBlogPostAction = (blogPostId: { blogId: string; postId: string }) => async () => {
  try {
    const session = getUserSession();
    return blogService.post.delete(session, blogPostId);
  } catch (e) {
    // ToDo: Error handling
  }
};

/**
 * Publish a comment for a given blog post.
 * Info: no reducer is used in this action.
 */
export const publishBlogPostCommentAction =
  (blogPostId: { blogId: string; postId: string }, comment: string) =>
  async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      const session = getUserSession();
      return blogService.comments.publish(session, blogPostId, comment);
    } catch (e) {
      // ToDo: Error handling
    }
  };

/**
 * Update a comment for a given blog post.
 * Info: no reducer is used in this action.
 */
export const updateBlogPostCommentAction =
  (blogPostCommentId: { blogId: string; postId: string; commentId: string }, comment: string) =>
  async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      const session = getUserSession();
      return blogService.comments.update(session, blogPostCommentId, comment);
    } catch (e) {
      // ToDo: Error handling
    }
  };

/**
 * Delete a comment for a given blog post.
 * Info: no reducer is used in this action.
 */
export const deleteBlogPostCommentAction =
  (blogPostCommentId: { blogId: string; postId: string; commentId: string }) =>
  async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      const session = getUserSession();
      return blogService.comments.delete(session, blogPostCommentId);
    } catch (e) {
      // ToDo: Error handling
    }
  };

/**
 * These are actions to fetch and populate Blog main reducer.
 */
export const blogFoldersActionsCreators = createAsyncActionCreators(actionTypes.folders);
export const fetchBlogFoldersAction = (): ThunkAction<Promise<IBlogFolder[]>, any, any, any> => async (dispatch, getState) => {
  try {
    const session = getUserSession();
    dispatch(blogFoldersActionsCreators.request());
    const res = await blogService.folders.list(session);
    dispatch(blogFoldersActionsCreators.receipt(res));
    return res;
  } catch (e) {
    dispatch(blogFoldersActionsCreators.error(e as Error));
    throw e;
  }
};
export const blogActionsCreators = createAsyncActionCreators(actionTypes.blogs);
export const fetchBlogsAction = (): ThunkAction<Promise<IBlog[]>, any, any, any> => async (dispatch, getState) => {
  try {
    const session = getUserSession();
    dispatch(blogActionsCreators.request());
    const res = await blogService.list(session);
    dispatch(blogActionsCreators.receipt(res));
    return res;
  } catch (e) {
    dispatch(blogActionsCreators.error(e as Error));
    throw e;
  }
};
export const fetchBlogsAndFoldersAction =
  (): ThunkAction<Promise<[IBlog[], IBlogFolder[]]>, any, any, any> => async (dispatch, getState) => {
    const data = await Promise.all([dispatch(fetchBlogsAction()), dispatch(fetchBlogFoldersAction())]);
    // ToDo : call line below when tha case of trashed blogs will be handled
    await dispatch({ type: actionTypes.tree.compute, blogs: data[0], folders: data[1] });
    return data;
  };