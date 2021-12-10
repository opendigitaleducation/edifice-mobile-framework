/**
 * Blog Reducer
 */

import { Moment } from 'moment';
import { combineReducers } from "redux";


import { createSessionReducer } from '~/framework/util/redux/reducerFactory';
import { resourceRightFilter } from '~/framework/util/resourceRights';
import { IUserSession } from '~/framework/util/session';
import { AsyncState, createAsyncActionTypes, createInitialAsyncState, createSessionAsyncReducer } from "~/framework/util/redux/async";

import moduleConfig from "./moduleConfig";
import { createBlogPostResourceRight } from "./rights";

// Types

export interface IBlogPostWithComments extends IBlogPost {
    comments: IBlogPostComments;
}

export interface IBlog {
    id: string;
    visibility: string;
    title: string;
    thumbnail?: string;
    trashed?: boolean;
    'comment-type': string;
    'publish-type': string;
    description?: string;
    created: Moment;
    modified: Moment;
    author: { userId: string; username: string; login: string };
    shared?: ({
        [key: string]: boolean | string | undefined;
    } & {
            [key in 'userId' | 'groupId']: string;
        })[];
    fetchPosts: (Omit<IBlogPost, 'content'>)[]
}
export type IBlogList = IBlog[];

export interface IBlogPostComment {
    author: {
        login: string;
        userId: string;
        username: string;
    };
    comment: string;
    created: Moment;
    id: string;
    state: string;
}

export type IBlogPostComments = IBlogPostComment[];

export interface IBlogPost {
    author: {
        login: string;
        userId: string;
        username: string;
    };
    content: string;
    created: Moment;
    firstPublishDate?: Moment;
    modified: Moment;
    state: string;
    title: string;
    views: number;
    _id: string;
}

export interface IBlogFolder {
    id: string;
    name: string;
    owner: { userId: string; displayName: string; };
    created: Moment;
    modified: Moment;
    trashed?: boolean;
    parentId?: string;
    resourceIds: string[];
}

// State

interface IBlog_StateData {
    blogs: IBlog[];
    folders: IBlogFolder[];
};
export interface IBlog_State {
    blogs: AsyncState<IBlog[]>;
    folders: AsyncState<IBlogFolder[]>;
};

// Reducer

const initialState: IBlog_StateData = {
    blogs: [],
    folders: [],
};

export const actionTypes = {
    blogs: createAsyncActionTypes(moduleConfig.namespaceActionType('BLOGS')),
    folders: createAsyncActionTypes(moduleConfig.namespaceActionType('FOLDERS')),
}

export default combineReducers({
    blogs: createSessionAsyncReducer(
        initialState.blogs,
        actionTypes.blogs
    ),
    folders: createSessionAsyncReducer(
        initialState.folders,
        actionTypes.folders
    ),
})

// Getters

export const getPublishableBlogs = (session: IUserSession, blogs: IBlogList) => {
    const publishableBlogs = (resourceRightFilter(
        blogs,
        createBlogPostResourceRight,
        session) as IBlogList)
        .filter((blog: IBlog) => !blog.trashed);
    return publishableBlogs;
}

// Other functions

/**
 * Return the content (blogs and subfolders) of the given folder.
 * If `undefined` is given as folderId, it is treated as the root of blogs.
 */
export const getFolderContent = (blogs: IBlog[], folders: IBlogFolder[], folderId: string | undefined) => {
    const ret = {
        folders: folders.filter(folder => folder.parentId == folderId)
    };

    if (!folderId) {
        const idsOfAllBlogsThatAreInAFolder = folders.reduce(
            (acc, folder) => [...acc, ...folder.resourceIds], [] as string[]
        );
        return {
            ...ret,
            blogs: blogs.filter(blog => !idsOfAllBlogsThatAreInAFolder.includes(blog.id))
        }
    } else {
        const folder = folders.find(folder => folder.id === folderId);
        if (!folder) return { ...ret, blogs: [] };
        return {
            ...ret,
            blogs: folder.resourceIds.map(resourceId => blogs.find(blog => blog.id === resourceId))
                .filter(blog => blog !== undefined) as IBlog[]
        }
    }
}

export const filterTrashed = <T extends { trashed?: boolean }>(items: Array<T>, trashed: boolean) =>
    items.filter(i => (i.trashed || false) === trashed);