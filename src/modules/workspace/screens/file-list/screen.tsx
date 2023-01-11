import I18n from 'i18n-js';
import * as React from 'react';
import { Platform, RefreshControl } from 'react-native';
import { Asset } from 'react-native-image-picker';
import { NavigationActions, NavigationEventSubscription } from 'react-navigation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { IGlobalState } from '~/AppStore';
import theme from '~/app/theme';
import { openCarousel } from '~/framework/components/carousel';
import { EmptyContentScreen } from '~/framework/components/emptyContentScreen';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import { HeaderBackAction, HeaderIcon, HeaderTitle } from '~/framework/components/header';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import PopupMenu, {
  DocumentPicked,
  PopupMenuAction,
  cameraAction,
  deleteAction,
  documentAction,
  galleryAction,
} from '~/framework/components/popup-menu';
import ScrollView from '~/framework/components/scrollView';
import SwipeableList from '~/framework/components/swipeableList';
import { LocalFile } from '~/framework/util/fileHandler';
import { IMedia } from '~/framework/util/media';
import { computeRelativePath } from '~/framework/util/navigation';
import { tryAction } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';
import { getUserSession } from '~/framework/util/session';
import {
  copyWorkspaceFilesAction,
  createWorkspaceFolderAction,
  deleteWorkspaceFilesAction,
  downloadThenOpenWorkspaceFileAction,
  downloadWorkspaceFilesAction,
  fetchWorkspaceFilesAction,
  listWorkspaceFoldersAction,
  moveWorkspaceFilesAction,
  renameWorkspaceFileAction,
  restoreWorkspaceFilesAction,
  trashWorkspaceFilesAction,
  uploadWorkspaceFileAction,
} from '~/modules/workspace/actions';
import { WorkspaceFileListItem } from '~/modules/workspace/components/WorkspaceFileListItem';
import { WorkspaceModal, WorkspaceModalType } from '~/modules/workspace/components/WorkspaceModal';
import moduleConfig from '~/modules/workspace/moduleConfig';
import { Filter, IFile } from '~/modules/workspace/reducer';

import styles from './styles';
import { IWorkspaceFileListScreenProps } from './types';

const WorkspaceFileListScreen = (props: IWorkspaceFileListScreenProps) => {
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
  const [modalType, setModalType] = React.useState<WorkspaceModalType>(WorkspaceModalType.NONE);
  const modalBoxRef: { current: any } = React.createRef();
  const isSelectionActive = selectedFiles.length > 0;

  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchList = async (parentId: string = props.parentId, shouldRefreshFolderList?: boolean) => {
    try {
      await props.fetchFiles(props.filter, parentId);
      if (!props.folderTree.length || shouldRefreshFolderList) {
        await props.listFolders();
      }
    } catch (e) {
      throw e;
    }
  };

  const init = () => {
    setLoadingState(AsyncPagedLoadingState.INIT);
    fetchList()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    fetchList()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH);
    fetchList()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  const fetchOnNavigation = () => {
    if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
  };

  const focusEventListener = React.useRef<NavigationEventSubscription>();
  React.useEffect(() => {
    focusEventListener.current = props.navigation.addListener('didFocus', () => {
      fetchOnNavigation();
    });
    return () => {
      focusEventListener.current?.remove();
    };
  }, []);

  const onGoBack = () => {
    if (isSelectionActive) {
      setSelectedFiles([]);
      return false;
    }
    return true;
  };

  const onPressBackAction = () => {
    if (onGoBack()) {
      props.navigation.dispatch(NavigationActions.back());
    }
  };

  const openModal = (type: WorkspaceModalType) => {
    setModalType(type);
    modalBoxRef?.current?.doShowModal();
  };

  const selectFile = (file: IFile) => {
    if (selectedFiles.includes(file.id)) {
      setSelectedFiles(selectedFiles.filter(id => id !== file.id));
    } else {
      setSelectedFiles(selected => [...selected, file.id]);
    }
  };

  const openMedia = (file: IFile) => {
    const data = props.files
      .filter(f => f.contentType?.startsWith('image'))
      .map(f => ({
        type: 'image',
        src: { uri: f.url },
        link: f.url,
      })) as IMedia[];
    const startIndex = data.findIndex(f => f.link === file.url);
    openCarousel({ data, startIndex }, props.navigation);
  };

  const onPressFile = (file: IFile) => {
    if (isSelectionActive) {
      return selectFile(file);
    }
    if (file.contentType?.startsWith('image')) {
      return openMedia(file);
    }
    if (Platform.OS === 'ios' && !file.isFolder) {
      return props.previewFile(file);
    }
    const { id, name: title, isFolder } = file;
    if (isFolder) {
      const filter = props.filter === Filter.ROOT ? id : props.filter;
      props.navigation.push(computeRelativePath(moduleConfig.routeName, props.navigation.state), { filter, parentId: id, title });
    } else {
      props.navigation.navigate(computeRelativePath(`${moduleConfig.routeName}/preview`, props.navigation.state), { file, title });
    }
  };

  const uploadFile = async (file: Asset | DocumentPicked) => {
    const lf = new LocalFile(file, { _needIOSReleaseSecureAccess: false });
    await props.uploadFile(props.parentId, lf);
    props.fetchFiles(props.filter, props.parentId);
  };

  const restoreSelectedFiles = async () => {
    const ids = selectedFiles;
    setSelectedFiles([]);
    props.restoreFiles(props.parentId, ids);
    props.fetchFiles(props.filter, props.parentId);
  };

  const onModalAction = async (files: IFile[], value: string, destinationId: string) => {
    const { parentId } = props;
    const ids = files.map(f => f.id);
    setSelectedFiles([]);
    modalBoxRef?.current?.doDismissModal();
    switch (modalType) {
      case WorkspaceModalType.CREATE_FOLDER:
        await props.createFolder(value, parentId);
        return fetchList(parentId, true);
      case WorkspaceModalType.DELETE:
        await props.deleteFiles(parentId, ids);
        return fetchList(parentId, true);
      case WorkspaceModalType.DOWNLOAD:
        return props.downloadFiles(files);
      case WorkspaceModalType.DUPLICATE:
        await props.duplicateFiles(parentId, ids, destinationId);
        return fetchList(destinationId, true);
      case WorkspaceModalType.EDIT:
        await props.renameFile(files[0], value);
        return fetchList(parentId, true);
      case WorkspaceModalType.MOVE:
        await props.moveFiles(parentId, ids, destinationId);
        props.fetchFiles(props.filter, destinationId);
        return fetchList(parentId, true);
      case WorkspaceModalType.TRASH:
        await props.trashFiles(parentId, ids);
        return fetchList(parentId, true);
    }
  };

  const getMenuActions = (): {
    navBarActions: { icon: string };
    popupMenuActions: PopupMenuAction[];
  } => {
    if (isSelectionActive) {
      const isFolderSelected = props.files.filter(file => selectedFiles.includes(file.id)).some(file => file.isFolder);
      const popupMenuActions = [
        ...(selectedFiles.length === 1 && props.filter === Filter.OWNER
          ? [
              {
                title: I18n.t('rename'),
                action: () => openModal(WorkspaceModalType.EDIT),
                iconIos: 'pencil',
                iconAndroid: 'ic_pencil',
              },
            ]
          : []),
        ...(props.filter !== Filter.TRASH
          ? [
              {
                title: I18n.t('copy'),
                action: () => openModal(WorkspaceModalType.DUPLICATE),
                iconIos: 'square.on.square',
                iconAndroid: 'ic_content_copy',
              },
            ]
          : []),
        ...(props.filter === Filter.OWNER
          ? [
              {
                title: I18n.t('move'),
                action: () => openModal(WorkspaceModalType.MOVE),
                iconIos: 'arrow.up.square',
                iconAndroid: 'ic_move_to_inbox',
              },
            ]
          : []),
        ...(props.filter === Filter.TRASH
          ? [
              {
                title: I18n.t('conversation.restore'),
                action: () => restoreSelectedFiles,
                iconIos: 'arrow.uturn.backward.circle',
                iconAndroid: 'ic_restore',
              },
            ]
          : []),
        ...(Platform.OS !== 'ios' && !isFolderSelected
          ? [
              {
                title: I18n.t('download'),
                action: () => openModal(WorkspaceModalType.DOWNLOAD),
                iconIos: 'square.and.arrow.down',
                iconAndroid: 'ic_download',
              },
            ]
          : []),
        ...((selectedFiles.length >= 1 && props.filter === Filter.OWNER) || props.filter === Filter.TRASH
          ? [
              deleteAction({
                action: () => openModal(props.filter === Filter.TRASH ? WorkspaceModalType.DELETE : WorkspaceModalType.TRASH),
              }),
            ]
          : []),
      ];
      return { navBarActions: { icon: 'more_vert' }, popupMenuActions };
    }
    if (props.filter === Filter.OWNER || (props.filter === Filter.SHARED && props.parentId !== Filter.SHARED)) {
      const popupMenuActions = [
        cameraAction({ callback: uploadFile }),
        galleryAction({ callback: uploadFile, multiple: true }),
        documentAction({ callback: uploadFile }),
        ...(props.filter === Filter.OWNER
          ? [
              {
                title: I18n.t('create-folder'),
                action: () => openModal(WorkspaceModalType.CREATE_FOLDER),
                iconIos: 'folder.badge.plus',
                iconAndroid: 'ic_create_new_folder',
              },
            ]
          : []),
      ];
      return { navBarActions: { icon: 'add' }, popupMenuActions };
    }
    return { navBarActions: { icon: '' }, popupMenuActions: [] };
  };

  const menuActions = getMenuActions();
  const navBarInfo = {
    left: (
      <>
        <HeaderBackAction onPress={onPressBackAction} />
        {isSelectionActive ? <HeaderTitle>{selectedFiles.length}</HeaderTitle> : null}
      </>
    ),
    title: isSelectionActive ? null : props.navigation.getParam('title'),
    right: (
      <PopupMenu actions={menuActions.popupMenuActions}>
        <HeaderIcon name={menuActions.navBarActions.icon} iconSize={menuActions.navBarActions.icon === 'more_vert' ? 26 : 20} />
      </PopupMenu>
    ),
  };

  const renderEmpty = () => {
    const image = props.parentId === Filter.TRASH ? 'empty-trash' : 'empty-workspace';
    const screen = Object.values(Filter).includes(props.parentId as Filter) ? props.parentId : 'subfolder';
    return (
      <EmptyScreen
        svgImage={image}
        title={I18n.t(`workspace.emptyScreen.${screen}.title`)}
        text={I18n.t(`workspace.emptyScreen.${screen}.text`)}
      />
    );
  };

  const renderError = () => {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={() => reload()} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  const renderModal = () => {
    const files = props.files.filter(file => selectedFiles.includes(file.id));
    return (
      <WorkspaceModal
        filter={props.filter}
        folderTree={props.folderTree}
        modalBoxRef={modalBoxRef}
        parentId={props.parentId}
        selectedFiles={files}
        type={modalType}
        onAction={onModalAction}
      />
    );
  };

  const renderFileList = () => {
    return (
      <>
        <SwipeableList
          data={props.files}
          keyExtractor={(item: IFile) => item.id}
          renderItem={({ item }) => (
            <WorkspaceFileListItem
              item={item}
              isSelected={selectedFiles.includes(item.id)}
              onPress={onPressFile}
              onLongPress={selectFile}
            />
          )}
          refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.REFRESH} onRefresh={refresh} />}
          ListEmptyComponent={renderEmpty()}
          contentContainerStyle={styles.listContainer}
          bottomInset
          rightOpenValue={-140}
          leftOpenValue={140}
          swipeActionWidth={140}
          itemSwipeActionProps={({ item }) => ({
            left:
              props.filter === Filter.TRASH
                ? [
                    {
                      action: async row => {
                        if (selectedFiles.includes(item.key)) {
                          selectFile(item);
                        }
                        props.restoreFiles(props.parentId, [item.key]).then(() => fetchList(props.parentId, true));
                        row[item.key]?.closeRow();
                      },
                      backgroundColor: theme.palette.status.success.regular,
                      actionText: I18n.t('conversation.restore'),
                      actionIcon: 'ui-unarchive',
                    },
                  ]
                : [],
            right:
              props.filter === Filter.OWNER
                ? [
                    {
                      action: async row => {
                        if (selectedFiles.includes(item.key)) {
                          selectFile(item);
                        }
                        props.trashFiles(props.parentId, [item.key]).then(() => fetchList(props.parentId, true));
                        row[item.key]?.closeRow();
                      },
                      backgroundColor: theme.palette.status.failure.regular,
                      actionText: I18n.t('delete'),
                      actionIcon: 'ui-trash',
                    },
                  ]
                : props.filter === Filter.TRASH
                ? [
                    {
                      action: async row => {
                        if (selectedFiles.includes(item.key)) {
                          selectFile(item);
                        }
                        props.deleteFiles(props.parentId, [item.key]).then(() => fetchList(props.parentId, true));
                        row[item.key]?.closeRow();
                      },
                      backgroundColor: theme.palette.status.failure.regular,
                      actionText: I18n.t('delete'),
                      actionIcon: 'ui-trash',
                    },
                  ]
                : [],
          })}
        />
        {renderModal()}
      </>
    );
  };

  const renderPage = () => {
    switch (loadingState) {
      case AsyncPagedLoadingState.DONE:
      case AsyncPagedLoadingState.REFRESH:
      case AsyncPagedLoadingState.REFRESH_FAILED:
      case AsyncPagedLoadingState.REFRESH_SILENT:
        return renderFileList();
      case AsyncPagedLoadingState.PRISTINE:
      case AsyncPagedLoadingState.INIT:
        return <LoadingIndicator />;
      case AsyncPagedLoadingState.INIT_FAILED:
      case AsyncPagedLoadingState.RETRY:
        return renderError();
    }
  };

  return (
    <PageView navigation={props.navigation} navBar={navBarInfo} onBack={onGoBack}>
      {renderPage()}
    </PageView>
  );
};

export default connect(
  (gs: IGlobalState, props: any) => {
    const state = moduleConfig.getState(gs);
    const parentId = props.navigation.getParam('parentId');
    return {
      files: state.directories.data[parentId] ?? [],
      filter: props.navigation.getParam('filter'),
      folderTree: state.folderTree.data,
      initialLoadingState:
        state.directories[parentId] === undefined ? AsyncPagedLoadingState.PRISTINE : AsyncPagedLoadingState.DONE,
      parentId,
      session: getUserSession(),
    };
  },
  (dispatch: ThunkDispatch<any, any, any>) =>
    bindActionCreators(
      {
        createFolder: tryAction(createWorkspaceFolderAction, undefined, true),
        deleteFiles: tryAction(deleteWorkspaceFilesAction, undefined, true),
        downloadFiles: tryAction(downloadWorkspaceFilesAction, undefined, true),
        duplicateFiles: tryAction(copyWorkspaceFilesAction, undefined, true),
        fetchFiles: tryAction(fetchWorkspaceFilesAction, undefined, true),
        listFolders: tryAction(listWorkspaceFoldersAction, undefined, true),
        moveFiles: tryAction(moveWorkspaceFilesAction, undefined, true),
        previewFile: tryAction(downloadThenOpenWorkspaceFileAction, undefined, true),
        renameFile: tryAction(renameWorkspaceFileAction, undefined, true),
        restoreFiles: tryAction(restoreWorkspaceFilesAction, undefined, true),
        trashFiles: tryAction(trashWorkspaceFilesAction, undefined, true),
        uploadFile: tryAction(uploadWorkspaceFileAction, undefined, true),
      },
      dispatch,
    ),
)(WorkspaceFileListScreen);
