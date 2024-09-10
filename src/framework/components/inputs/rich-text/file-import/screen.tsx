import * as React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { Fade, Placeholder, PlaceholderLine, PlaceholderMedia } from 'rn-placeholder';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyContentScreen } from '~/framework/components/empty-screens';
import { UploadFile, UploadStatus } from '~/framework/components/inputs/rich-text/form/types';
import FlatList from '~/framework/components/list/flat-list';
import { ImagePicked, cameraAction, galleryAction, imagePickedToLocalFile } from '~/framework/components/menus/actions';
import { NavBarAction } from '~/framework/components/navigation';
import { PageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';
import { CaptionBoldText, SmallText } from '~/framework/components/text';
import usePreventBack from '~/framework/hooks/prevent-back';
import { getSession } from '~/framework/modules/auth/reducer';
import workspaceService from '~/framework/modules/workspace/service';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { LocalFile } from '~/framework/util/fileHandler';
import { Image } from '~/framework/util/media';

import styles from './styles';
import { FileImportScreenProps } from './types';

const headerTitleStyle = {
  color: theme.palette.grey.darkness,
};

export const computeNavBar: FileImportScreenProps.NavBarConfig = ({ navigation, route }) => ({
  presentation: 'modal',
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('import-title'),
  }),
  headerStyle: {
    position: 'absolute',
    backgroundColor: theme.ui.background.page,
    zIndex: 100,
    top: 0,
    left: 0,
    right: 0,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTitleStyle,
});

const formatFile = (pic: ImagePicked) =>
  ({
    localFile: { ...imagePickedToLocalFile(pic), filesize: pic.fileSize } as LocalFile,
    status: UploadStatus.IDLE,
    error: undefined as string | undefined,
    workspaceID: undefined as string | undefined,
  }) as UploadFile;

const textErrorUploadFile: (error) => string = error => {
  // Full storage management
  // statusCode = 400 on iOS and code = 'ENOENT' on Android
  if (error?.response?.statusCode === 400 || error?.code === 'ENOENT') {
    return I18n.get('import-error-filetoolarge');
  } else {
    return I18n.get('import-uploaderror');
  }
};

const renderPlaceholder = () => {
  return (
    <Placeholder style={styles.placeholder} Animation={Fade}>
      <View style={styles.placeholderRow}>
        <PlaceholderMedia style={styles.placeholderMedia} size={36} />
        <PlaceholderLine style={styles.h22} width={80} />
      </View>
      <View style={styles.placeholderRow}>
        <PlaceholderMedia style={styles.placeholderMedia} size={36} />
        <PlaceholderLine style={styles.h22} width={55} />
      </View>
      <View style={styles.placeholderRow}>
        <PlaceholderMedia style={styles.placeholderMedia} size={36} />
        <PlaceholderLine style={styles.h22} width={65} />
      </View>
      <View style={styles.placeholderRow}>
        <PlaceholderMedia style={styles.placeholderMedia} size={36} />
        <PlaceholderLine style={styles.h22} width={35} />
      </View>
      <View style={styles.placeholderRow}>
        <PlaceholderMedia style={styles.placeholderMedia} size={36} />
        <PlaceholderLine style={styles.h22} width={70} />
      </View>
    </Placeholder>
  );
};

export default function FileImportScreen(props: FileImportScreenProps.AllProps) {
  const { navigation, route } = props;
  const session = getSession();

  // State that triggers exit the screen without confirmation prompt.
  const [validateImport, setValidateImport] = React.useState(false);

  // State that indicates the files to upload has been received from the device' storage
  const [listReady, setListReady] = React.useState(0);

  // The list of files to import and their import status
  const filesRef = React.useRef<UploadFile[]>(route.params.files ? route.params.files.map(formatFile) : []);

  // The bucket of allowed simultaneous uploading processes.
  const uploadingTasksRef = React.useRef<Set<UploadFile>>(new Set());
  const MAX_PARALLEL_UPLOADS_TASKS = 6;

  const updateFileStatusAndID = React.useCallback(
    ({ file, status, id, error }: { file: UploadFile; status: UploadStatus; id?: string; error?: string }) => {
      file.status = status;
      if (id) file.workspaceID = id;
      if (error) file.error = error;
      setListReady(val => val + 1); // Update view
    },
    [],
  );

  const uploadFile = React.useCallback(
    (file: UploadFile, index: number) => {
      if (file.status === UploadStatus.PENDING || file.status === UploadStatus.OK) return;
      if (!session) {
        updateFileStatusAndID({ file, status: UploadStatus.KO });
        return;
      }
      uploadingTasksRef.current.add(file);
      updateFileStatusAndID({ file, status: UploadStatus.PENDING });
      workspaceService.file
        .uploadFile(session, file.localFile, route.params.uploadParams)
        .then(resp => {
          updateFileStatusAndID({ file, status: UploadStatus.OK, id: resp.df.id });
        })
        .catch(error => {
          console.debug(`Import File Upload Failed: ${error}`);
          updateFileStatusAndID({ file, status: UploadStatus.KO, error: textErrorUploadFile(error) });
        })
        .finally(() => {
          uploadingTasksRef.current.delete(file);
        });
    },
    [route.params.uploadParams, session, updateFileStatusAndID],
  );

  const uploadFiles = React.useCallback(() => {
    for (let i = 0; i < filesRef.current.length; ++i) {
      if (uploadingTasksRef.current.size >= MAX_PARALLEL_UPLOADS_TASKS) break;
      const file = filesRef.current[i];
      if (file.status !== UploadStatus.IDLE) continue;
      uploadFile(file, i);
    }
  }, [uploadFile]);

  const setFiles = React.useCallback(
    (f: ReturnType<typeof formatFile>[]) => {
      if (f.length === 0) {
        navigation.goBack();
        return;
      }
      filesRef.current = f;
      setListReady(val => val + 1);
      uploadFiles();
    },
    [uploadFiles, navigation],
  );

  const removeAllFiles = React.useCallback(() => {
    workspaceService.files.trash(
      session!,
      filesRef.current.map(f => f.workspaceID!),
    );
  }, [session]);

  usePreventBack({
    title: I18n.get('import-back-confirm-title'),
    text: I18n.get('import-back-confirm-text'),
    showAlert: filesRef.current.length > 0 && !validateImport,
    actionOnBack: removeAllFiles,
  });

  // Manage nav bar actions
  React.useEffect(() => {
    const fileCount = filesRef.current.length;
    navigation.setOptions({
      // navigation.setOptions() requires to define the component on demand.
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () =>
        filesRef.current.some(upload => upload.status === UploadStatus.PENDING) ? (
          <ActivityIndicator size={UI_SIZES.elements.navbarIconSize} color={theme.palette.grey.black} />
        ) : (
          <NavBarAction
            title={I18n.get('import-confirm-button', { count: filesRef.current.filter(f => f.status === UploadStatus.OK).length })}
            titleStyle={{ color: theme.palette.grey.darkness }}
            onPress={() => {
              setValidateImport(true);
            }}
            disabled={
              !listReady ||
              (fileCount > 0 &&
                filesRef.current.some(
                  f => f.status === UploadStatus.PENDING || f.status === UploadStatus.IDLE || f.status === UploadStatus.KO,
                ))
            }
          />
        ),
      headerTitle:
        fileCount === 0
          ? navBarTitle(I18n.get('import-title_zero'), headerTitleStyle)
          : navBarTitle(I18n.get('import-title_other', { count: fileCount }), headerTitleStyle),
    });
  }, [navigation, listReady]);

  React.useEffect(() => {
    if (validateImport) {
      navigation.navigate(route.params.redirectTo.name, {
        ...route.params.redirectTo.params,
        importResult: filesRef.current.map(f => ({
          status: f.status,
          workspaceID: f.workspaceID,
        })),
      });
    }
  }, [validateImport, navigation, route]);

  React.useEffect(() => {
    if (filesRef.current.length === 0 && listReady) {
      navigation.goBack();
    }
  }, [listReady, navigation]);

  // Refresh remaining tasks everytime a file has been handled.
  React.useEffect(() => {
    if (listReady) {
      uploadFiles();
    }
  }, [listReady, uploadFiles]);

  React.useEffect(() => {
    setTimeout(() => {
      if (route.params.source === 'galery') {
        galleryAction({
          callback: (pics: ImagePicked[]) => {
            setFiles(pics.map(formatFile));
          },
          multiple: true,
        }).action({ callbackOnce: true });
      } else if (route.params.source === 'camera') {
        cameraAction({
          callback: (pics: ImagePicked[]) => {
            setFiles(pics.map(formatFile));
          },
        }).action({ callbackOnce: true });
      }
    }, 350);
    // On purpose : only when component is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFile = React.useCallback(
    async (index: number) => {
      if (!session) return;
      if (index >= filesRef.current.length) return;
      Alert.alert(I18n.get('richeditor-showfilesresult-deletefiletitle'), I18n.get('richeditor-showfilesresult-deletefiletext'), [
        {
          text: I18n.get('common-cancel'),
          onPress: () => {},
        },
        {
          text: I18n.get('common-delete'),
          style: 'destructive',
          onPress: () => {
            const file = filesRef.current[index];
            if (file.workspaceID === undefined) {
              setFiles(filesRef.current.filter((_, i) => i !== index));
            } else {
              workspaceService.files
                .trash(session, [file.workspaceID!])
                .then(() => {
                  setFiles(filesRef.current.filter((_, i) => i !== index));
                })
                .catch(error => {
                  console.error(`Rich Editor file removal failed: ${error}`);
                });
            }
          },
        },
      ]);
    },
    [session, setFiles],
  );

  const retryFile = async (index: number) => {
    const file = filesRef.current[index];
    file.status = UploadStatus.PENDING;
    uploadFile(file, index);
  };

  const fileStatusIcon = (index: number, status: UploadStatus) => {
    switch (status) {
      case UploadStatus.OK:
        return <IconButton icon="ui-success" color={theme.palette.status.success.regular} />;
      case UploadStatus.KO:
        return <IconButton icon="ui-restore" color={theme.palette.status.failure.regular} action={() => retryFile(index)} />;
      case UploadStatus.PENDING:
        return <ActivityIndicator size={UI_SIZES.elements.icon.small} color={theme.palette.primary.regular} />;
      default:
        return null;
    }
  };

  const renderThumbnail = (file: UploadFile) => {
    if (file.status === UploadStatus.OK) return <Image style={styles.addFilesResultsType} src={file.localFile._filepathNative} />;
    return (
      <View
        style={[
          styles.addFilesResultsType,
          {
            backgroundColor:
              file.status === UploadStatus.KO ? theme.palette.status.failure.pale : theme.palette.complementary.green.pale,
          },
        ]}>
        <NamedSVG
          name={file.status === UploadStatus.KO ? 'ui-error' : 'ui-image'}
          height={UI_SIZES.elements.icon.small}
          width={UI_SIZES.elements.icon.small}
          fill={file.status === UploadStatus.KO ? theme.palette.status.failure.regular : theme.palette.grey.black}
        />
      </View>
    );
  };

  if (!session) return <EmptyContentScreen />;

  return (
    <PageView>
      {!listReady ? (
        renderPlaceholder()
      ) : (
        <FlatList
          data={filesRef.current}
          contentContainerStyle={styles.addFilesResults}
          alwaysBounceVertical={false}
          renderItem={({ item, index }) => (
            <View key={index} style={styles.addFilesResultsItem}>
              {renderThumbnail(item)}
              <View style={styles.addFilesResultsFile}>
                <SmallText numberOfLines={1}>{item.localFile.filename}</SmallText>
                {item.status === UploadStatus.KO ? <CaptionBoldText>{item.error}</CaptionBoldText> : null}
              </View>
              {fileStatusIcon(index, item.status)}
              <IconButton
                icon="ui-close"
                style={{ marginLeft: UI_SIZES.spacing.small }}
                color={theme.palette.grey.black}
                action={() => removeFile(index)}
              />
            </View>
          )}
        />
      )}
    </PageView>
  );
}
