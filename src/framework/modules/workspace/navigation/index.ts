import { ParamListBase } from '@react-navigation/native';

import moduleConfig from '~/framework/modules/workspace/module-config';
import type { IWorkspaceFileListScreenNavigationParams } from '~/framework/modules/workspace/screens/file-list';
import type { IWorkspaceFilePreviewScreenNavigationParams } from '~/framework/modules/workspace/screens/file-preview';

export const workspaceRouteNames = {
  home: `${moduleConfig.routeName}` as 'home',
  filePreview: `${moduleConfig.routeName}/file-preview` as 'filePreview',
};
export interface WorkspaceNavigationParams extends ParamListBase {
  home: IWorkspaceFileListScreenNavigationParams;
  filePreview: IWorkspaceFilePreviewScreenNavigationParams;
}
