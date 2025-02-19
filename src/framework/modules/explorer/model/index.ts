/**
 * Data model for the module explorer
 */

import type { ExplorerData, Folder, Resource } from './types';

export const explorerItemIsLoading = (item: ExplorerData['items'][0]) => item === null;

export const explorerItemIsFolder = (item: ExplorerData['items'][0]): item is Folder => item?.resourceType === 'folder';

export const explorerItemIsResource = (item: ExplorerData['items'][0]): item is Resource => item?.resourceType !== 'folder';
