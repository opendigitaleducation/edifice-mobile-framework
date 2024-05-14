import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal as RNBottomSheetModal,
} from '@gorhom/bottom-sheet';
import { useHeaderHeight } from '@react-navigation/elements';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import DefaultButton from '~/framework/components/buttons/default';
import IconButton from '~/framework/components/buttons/icon';
import PrimaryButton from '~/framework/components/buttons/primary';
import { UI_ANIMATIONS, UI_SIZES } from '~/framework/components/constants';
import RichEditor from '~/framework/components/inputs/rich-text/editor/RichEditor';
import RichToolbar from '~/framework/components/inputs/rich-text/toolbar/component';
import { ImagePicked, cameraAction, galleryAction, imagePickedToLocalFile } from '~/framework/components/menus/actions';
import BottomSheetModal, { BottomSheetModalMethods } from '~/framework/components/modals/bottom-sheet';
import { PageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';
import { BodyText, CaptionBoldText, CaptionText, HeadingXSText, SmallText } from '~/framework/components/text';
import { assertSession } from '~/framework/modules/auth/reducer';
import workspaceService from '~/framework/modules/workspace/service';
import { LocalFile, formatBytes } from '~/framework/util/fileHandler';
import { isEmpty } from '~/framework/util/object';

import styles from './styles';
import { RichEditorFormProps, UploadFile, UploadStatus } from './types';

let addedFiles: UploadFile[] = [];

const RichEditorForm = (props: RichEditorFormProps) => {
  const headerHeight = useHeaderHeight();
  const session = assertSession();

  //
  // Editor management
  //

  const [isFocus, setIsFocus] = React.useState<boolean>(false);

  const richText = React.useRef<RichEditor>(null);

  const focusRichText = () => {
    richText.current?.focusContentEditor();
    setIsFocus(true);
  };

  //
  // Files management
  //

  const [files, setFiles] = React.useState<UploadFile[]>([]);

  const updateFiles = () => {
    if (isEmpty(addedFiles)) hideAddFilesResults();
    else setFiles([...addedFiles]);
  };

  const resetFiles = () => {
    addedFiles = [];
    setFiles([]);
  };

  const updateFileStatusAndID = ({ index, status, id }: { index: number; status: UploadStatus; id?: string }) => {
    const file = addedFiles[index];
    file.status = status;
    if (id) file.workspaceID = id;
    updateFiles();
  };

  const uploadFile = ({ file, index }: { file: UploadFile; index: number }) => {
    workspaceService.file
      .uploadFile(session, file.localFile, props.uploadParams)
      .then(resp => {
        updateFileStatusAndID({ index, status: UploadStatus.OK, id: resp.df.id });
      })
      .catch(error => {
        console.debug(`Rich Editor File Upload Failed: ${error}`);
        updateFileStatusAndID({ index, status: UploadStatus.KO });
      });
  };

  const handleAddPics = async (pics: ImagePicked[]) => {
    showAddFilesResults();
    addedFiles = pics.map(pic => ({
      localFile: { ...imagePickedToLocalFile(pic), filesize: pic.fileSize } as LocalFile,
      status: UploadStatus.PENDING,
    }));

    addedFiles.forEach((file, index) => uploadFile({ file, index }));
    updateFiles();
  };

  const handleRemoveFile = async index => {
    if (index >= addedFiles.length) return;
    Alert.alert(I18n.get('richeditor-showfilesresult-deletefiletitle'), I18n.get('richeditor-showfilesresult-deletefiletext'), [
      {
        text: I18n.get('common-cancel'),
        onPress: () => {},
      },
      {
        text: I18n.get('common-delete'),
        style: 'destructive',
        onPress: () => {
          const file = addedFiles[index];
          if (file.workspaceID === undefined) {
            addedFiles.splice(index, 1);
            updateFiles();
          } else {
            workspaceService.files
              .trash(session, [file.workspaceID!])
              .then(() => {
                addedFiles.splice(index, 1);
                updateFiles();
              })
              .catch(error => {
                console.debug(`Rich Editor file removal failed: ${error}`);
              });
          }
        },
      },
    ]);
  };

  const handleRetryFile = async index => {
    const file = addedFiles[index];
    file.status = UploadStatus.PENDING;
    updateFiles();
    uploadFile({ file, index });
  };

  //
  // Add files results bottom sheet management
  //

  const addFilesResultsRef = React.useRef<BottomSheetModalMethods>(null);

  const handleAddFilesResultsDismissed = async () => {
    // TODO V1: Show confirmation box
    workspaceService.files.trash(
      session,
      addedFiles.map(f => f.workspaceID!),
    );
    resetFiles();
    focusRichText();
  };

  const hideAddFilesResults = () => {
    addFilesResultsRef.current?.dismiss();
    resetFiles();
    focusRichText();
  };

  const showAddFilesResults = () => {
    richText?.current?.blurContentEditor();
    setIsFocus(false);
    addFilesResultsRef.current?.present();
  };

  const addHtmlFiles = () => {
    let filesHTML = '';
    addedFiles.forEach(file => {
      if (file.status === UploadStatus.OK) {
        filesHTML += `<img class="custom-image" src="/workspace/document/${file.workspaceID}" width="350" height="NaN">`;
      }
    });
    richText.current?.insertHTML(`${filesHTML}`);
    hideAddFilesResults();
    setTimeout(() => richText.current?.insertHTML(`<br>\r\n`), 300);
  };

  const handleAddFiles = () => {
    const nbErrorFiles = addedFiles.filter(file => file.status === UploadStatus.KO).length;
    if (nbErrorFiles === addedFiles.length) {
      Alert.alert(I18n.get('richeditor-showfilesresult-canceltitle'), I18n.get('richeditor-showfilesresult-canceltext'), [
        {
          text: I18n.get('common-cancel'),
          onPress: () => {},
        },
        {
          text: I18n.get('common-quit'),
          style: 'destructive',
          onPress: hideAddFilesResults,
        },
      ]);
      return;
    }
    if (nbErrorFiles > 0) {
      Alert.alert(
        I18n.get(`richeditor-showfilesresult-addfileswitherror${nbErrorFiles > 1 ? 's' : ''}title`),
        I18n.get(`richeditor-showfilesresult-addfileswitherror${nbErrorFiles > 1 ? 's' : ''}text`, { nb: nbErrorFiles }),
        [
          {
            text: I18n.get('common-cancel'),
            onPress: () => {},
          },
          {
            text: I18n.get('common-ok'),
            onPress: addHtmlFiles,
          },
        ],
      );
      return;
    }
    addHtmlFiles();
  };

  const fileStatusIcon = (index: number, status: UploadStatus) => {
    switch (status) {
      case UploadStatus.OK:
        return <IconButton icon="ui-success" color={theme.palette.status.success.regular} />;
      case UploadStatus.KO:
        return <IconButton icon="ui-restore" color={theme.palette.status.failure.regular} action={() => handleRetryFile(index)} />;
      default:
        return <ActivityIndicator size={UI_SIZES.elements.icon.small} color={theme.palette.primary.regular} />;
    }
  };

  const snapPoints = React.useMemo(() => ['50%', '70%'], []);

  const renderBackdrop = (backdropProps: BottomSheetBackdropProps) => {
    return <BottomSheetBackdrop {...backdropProps} disappearsOnIndex={-1} appearsOnIndex={0} />;
  };

  const addFilesResults = () => {
    return (
      <RNBottomSheetModal
        ref={addFilesResultsRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={handleAddFilesResultsDismissed}>
        <BottomSheetFlatList
          data={files}
          contentContainerStyle={styles.addFilesResults}
          renderItem={({ item, index }) => (
            <View key={index} style={styles.addFilesResultsItem}>
              <View
                style={[
                  styles.addFilesResultsType,
                  {
                    backgroundColor:
                      item.status === UploadStatus.KO ? theme.palette.status.failure.pale : theme.palette.complementary.green.pale,
                  },
                ]}>
                <NamedSVG
                  name={item.status === UploadStatus.KO ? 'ui-error' : 'ui-image'}
                  height={UI_SIZES.elements.icon.small}
                  width={UI_SIZES.elements.icon.small}
                  fill={item.status === UploadStatus.KO ? theme.palette.status.failure.regular : theme.palette.grey.black}
                />
              </View>
              <View style={styles.addFilesResultsFile}>
                <SmallText>{item.localFile.filename}</SmallText>
                {item.status === UploadStatus.KO ? (
                  <CaptionBoldText>{I18n.get('richeditor-showfilesresult-uploaderror')}</CaptionBoldText>
                ) : (
                  <CaptionText>
                    {item.localFile.filetype} - {formatBytes(item.localFile.filesize)}
                  </CaptionText>
                )}
              </View>
              {fileStatusIcon(index, item.status)}
              <IconButton
                icon="ui-close"
                style={{ marginLeft: UI_SIZES.spacing.small }}
                color={theme.palette.grey.black}
                action={() => handleRemoveFile(index)}
              />
            </View>
          )}
          ListHeaderComponent={
            <HeadingXSText style={styles.addFilesResultsTitle}>
              {addedFiles.length} {I18n.get(`richeditor-showfilesresult-${addedFiles.length > 1 ? 'multiple' : 'single'}title`)}
            </HeadingXSText>
          }
          ListFooterComponent={
            <PrimaryButton
              style={styles.addButton}
              text={I18n.get(
                addedFiles.some(f => f.status !== UploadStatus.KO) ? 'richeditor-showfilesresult-addfiles' : 'common-cancel',
              )}
              disabled={addedFiles.some(f => f.status === UploadStatus.PENDING)}
              action={handleAddFiles}
            />
          }
        />
      </RNBottomSheetModal>
    );
  };

  //
  // Add pics bottom sheet management
  //

  const choosePicsMenuRef = React.useRef<BottomSheetModalMethods>(null);

  const handleChoosePicsMenuDismissed = () => {
    focusRichText();
  };

  const hideChoosePicsMenu = () => {
    choosePicsMenuRef.current?.dismiss();
  };

  const showChoosePicsMenu = () => {
    choosePicsMenuRef.current?.present();
  };

  const handleChoosePics = async () => {
    hideChoosePicsMenu();
    await galleryAction({ callback: handleAddPics, multiple: true }).action({ callbackOnce: true });
  };

  const handleTakePic = async () => {
    hideChoosePicsMenu();
    await cameraAction({ callback: file => handleAddPics([file]) }).action();
  };

  const choosePicsMenu = () => {
    return (
      <BottomSheetModal ref={choosePicsMenuRef} onDismiss={handleChoosePicsMenuDismissed}>
        <DefaultButton
          iconLeft="ui-image"
          text={I18n.get('pickfile-image')}
          contentColor={theme.palette.complementary.green.regular}
          disabled
          style={styles.choosePicsMenuTitle}
        />
        <TouchableOpacity style={styles.choosePicsMenuElement} onPress={handleTakePic}>
          <NamedSVG
            height={UI_SIZES.elements.icon.default}
            width={UI_SIZES.elements.icon.default}
            name="ui-camera"
            fill={theme.palette.grey.black}
          />
          <BodyText>{I18n.get('pickfile-take')}</BodyText>
        </TouchableOpacity>
        <View style={styles.choosePicsMenuSeparator} />
        <TouchableOpacity style={styles.choosePicsMenuElement} onPress={handleChoosePics}>
          <NamedSVG
            height={UI_SIZES.elements.icon.default}
            width={UI_SIZES.elements.icon.default}
            name="ui-smartphone"
            fill={theme.palette.grey.black}
          />
          <BodyText>{I18n.get('pickfile-pick')}</BodyText>
        </TouchableOpacity>
      </BottomSheetModal>
    );
  };

  //
  // Toolbar management
  //

  const toolbarOpacity = React.useRef(new Animated.Value(0)).current;
  const toolbarYPos = React.useRef(new Animated.Value(90)).current;

  const animateToolbar = React.useCallback(
    ({ opacity, ypos }: { opacity: number; ypos: number }) => {
      Animated.parallel([
        Animated.timing(toolbarOpacity, {
          toValue: opacity,
          ...UI_ANIMATIONS.fade,
        }),
        Animated.timing(toolbarYPos, {
          toValue: ypos,
          ...UI_ANIMATIONS.translate,
        }),
      ]).start();
    },
    [toolbarOpacity, toolbarYPos],
  );

  const toolbar = () => {
    return (
      <Animated.View style={[styles.toolbar, { transform: [{ translateY: toolbarYPos }] }, { opacity: toolbarOpacity }]}>
        <RichToolbar editor={richText} showBottomSheet={showChoosePicsMenu} />
      </Animated.View>
    );
  };

  //
  // Rich Editor management
  //

  const scrollRef = React.useRef<ScrollView>(null);

  const handleBlur = React.useCallback(() => {
    animateToolbar({ opacity: 0, ypos: 2 * UI_SIZES.elements.editor.toolbarHeight });
    setIsFocus(false);
  }, [animateToolbar]);

  const handleChange = React.useCallback(
    (html: string) => {
      props.onChangeText(html);
    },
    [props],
  );

  const handleCursorPosition = React.useCallback((scrollY: number) => {
    scrollRef.current?.scrollTo({ y: scrollY - 30, animated: true });
  }, []);

  const handleFocus = React.useCallback(() => {
    animateToolbar({ opacity: 1, ypos: UI_SIZES.elements.editor.toolbarHeight });
    setIsFocus(true);
  }, [animateToolbar]);

  return (
    <PageView style={styles.page}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={headerHeight}
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardDismissMode="none"
          nestedScrollEnabled
          ref={scrollRef}
          scrollEventThrottle={20}
          bounces={false}
          style={styles.scrollView}>
          {props.topForm}
          <RichEditor
            disabled={false}
            enterKeyHint="done"
            editorStyle={styles.container}
            firstFocusEnd={false}
            initialContentHTML={props.initialContentHtml ?? ''}
            initialFocus={false}
            pasteAsPlainText
            placeholder={I18n.get('blog-createpost-postcontent-placeholder')}
            ref={richText}
            style={styles.richEditor}
            useContainer
            useComposition={false}
            onBlur={handleBlur}
            onChange={handleChange}
            onCursorPosition={handleCursorPosition}
            onFocus={handleFocus}
            autoCorrect
            autoCapitalize
          />
        </ScrollView>
        {isFocus ? toolbar() : null}
        {choosePicsMenu()}
        {addFilesResults()}
      </KeyboardAvoidingView>
    </PageView>
  );
};

export default RichEditorForm;
