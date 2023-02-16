import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import I18n from 'i18n-js';
import * as React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { IGlobalState } from '~/app/store';
import { PageView } from '~/framework/components/page';
import { assertSession } from '~/framework/modules/auth/reducer';
import {
  downloadThenOpenWorkspaceFileAction,
  downloadThenShareWorkspaceFileAction,
  downloadWorkspaceFilesAction,
} from '~/framework/modules/workspace/actions/fileTransfer';
import { renderImage } from '~/framework/modules/workspace/components/image';
import { WorkspaceNavigationParams, workspaceRouteNames } from '~/framework/modules/workspace/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { tryAction } from '~/framework/util/redux/actions';
import { ButtonIconText } from '~/ui/ButtonIconText';

import styles from './styles';
import { IWorkspaceFilePreviewScreenProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<WorkspaceNavigationParams, typeof workspaceRouteNames.filePreview>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
  }),
  title: '',
});

const WorkspaceFilePreviewScreen = (props: IWorkspaceFilePreviewScreenProps) => {
  const preview = () => {
    props.previewFile(props.file);
  };

  const download = () => {
    props.downloadFile(props.file);
  };

  const share = () => {
    props.shareFile(props.file);
  };

  React.useEffect(() => {
    props.navigation.setParams({
      title: props.title,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.title]);

  return (
    <PageView>
      <TouchableOpacity onPress={preview}>{renderImage(props.file, false, props.file.name)}</TouchableOpacity>
      <View style={styles.actionsContainer}>
        {Platform.OS !== 'ios' ? (
          <ButtonIconText name="download" onPress={download}>
            {I18n.t('download')}
          </ButtonIconText>
        ) : null}
        <ButtonIconText name="share-variant" onPress={share}>
          {I18n.t('share')}
        </ButtonIconText>
      </View>
    </PageView>
  );
};

export default connect(
  (gs: IGlobalState, props: any) => {
    return {
      file: props.route.params.file,
      title: props.route.params.title,
      session: assertSession(),
    };
  },
  (dispatch: ThunkDispatch<any, any, any>) =>
    bindActionCreators(
      {
        downloadFile: tryAction(
          downloadWorkspaceFilesAction,
          undefined,
          true,
        ) as unknown as IWorkspaceFilePreviewScreenProps['downloadFile'],
        previewFile: tryAction(
          downloadThenOpenWorkspaceFileAction,
          undefined,
          true,
        ) as unknown as IWorkspaceFilePreviewScreenProps['previewFile'],
        shareFile: tryAction(
          downloadThenShareWorkspaceFileAction,
          undefined,
          true,
        ) as unknown as IWorkspaceFilePreviewScreenProps['shareFile'],
      },
      dispatch,
    ),
)(WorkspaceFilePreviewScreen);