import { ThunkDispatch } from 'redux-thunk';

import { newsService } from '~/framework/modules/newsv2/service';

/**
 * Get all threads
 */
export const getNewsThreadsAction = () => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
  const newsThreads = await newsService.threads.get();
  return newsThreads;
};

/**
 * Get all infos
 */
export const getNewsItemsAction = () => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
  const newsItems = await newsService.infos.get();
  return newsItems;
};

/**
 * Get all infos for selected thread
 */
export const getNewsItemsForSelectedThreadAction =
  (threadId: number) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    const newsItems = await newsService.infos.getById(threadId);
    return newsItems;
  };

/**
 * Get all comments for info
 */
export const getNewsItemCommentsAction =
  (newsItemId: number) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    const newsItemComments = await newsService.comments.get(newsItemId);
    return newsItemComments;
  };

/**
 * Get info by id
 */
export const getNewsItemAction = (infoId: number) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
  return newsService.info.get(infoId);
};

/**
 * Delete info by id
 */
export const deleteNewsItemAction =
  (threadId: number, infoId: number) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    return newsService.info.delete(threadId, infoId);
  };

/**
 * Delete comment
 */
export const deleteCommentNewsItemAction =
  (infoId: number, commentId: number) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    return newsService.comments.delete(infoId, commentId);
  };

/**
 * Delete comment
 */
export const publishCommentNewsItemAction =
  (infoId: number, comment: string) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    return newsService.comments.post(infoId, comment);
  };

/**
 * Edit comment
 */
export const editCommentNewsItemAction =
  (infoId: number, comment: string, commentId: number) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    return newsService.comments.update(infoId, comment, commentId);
  };
