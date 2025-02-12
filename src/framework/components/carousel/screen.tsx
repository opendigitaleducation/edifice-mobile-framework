/**
 * New implementation of Carousel built with our custom react-native-image-viewer !
 */
import * as React from 'react';
import { Alert, ImageURISource, Platform, StatusBar, StyleSheet } from 'react-native';

import getPath from '@flyerhq/react-native-android-uri-path';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment, { Moment } from 'moment';
import DeviceInfo from 'react-native-device-info';
import RNFastImage from 'react-native-fast-image';
import Share from 'react-native-share';

import { IImageSize } from './image-viewer/image-viewer.type';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import ImageViewer from '~/framework/components/carousel/image-viewer';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyScreen } from '~/framework/components/empty-screens';
import PopupMenu from '~/framework/components/menus/popup';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import NavBarActionsGroup from '~/framework/components/navigation/navbar-actions-group';
import { PageView } from '~/framework/components/page';
import Toast from '~/framework/components/toast';
import { DEFAULTS, ToastHandler } from '~/framework/components/toast/component';
import { markViewAudience } from '~/framework/modules/audience';
import { AudienceParameter } from '~/framework/modules/audience/types';
import { assertSession } from '~/framework/modules/auth/reducer';
import { IModalsNavigationParams, ModalsRouteNames } from '~/framework/navigation/modals';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { IMAGE_MAX_DIMENSION, LocalFile, SyncedFile } from '~/framework/util/fileHandler';
import fileTransferService from '~/framework/util/fileHandler/service';
import { FastImage, IMedia } from '~/framework/util/media';
import { isEmpty } from '~/framework/util/object';
import { assertPermissions, PermissionError } from '~/framework/util/permissions';
import { OldStorageFunctions } from '~/framework/util/storage';
import { urlSigner } from '~/infra/oauth';
import { Loading } from '~/ui/Loading';

export interface ICarouselNavParams {
  data: IMedia[];
  startIndex?: number;
  referer: AudienceParameter; // used for audience tracking
}

export interface ICarouselProps extends NativeStackScreenProps<IModalsNavigationParams, ModalsRouteNames.Carousel> {}

const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  errorScreen: {
    backgroundColor: 'transparent',
    height: UI_SIZES.screen.height,
    justifyContent: 'center',
  },

  page: { backgroundColor: theme.palette.grey.black },
  title: {
    width: undefined,
  },
});

export const Buttons = ({ disabled, imageViewerRef }: { disabled: boolean; imageViewerRef }) => {
  const showPrivacyAlert = async action => {
    try {
      const getDatePrivacyAlert: Moment | undefined = await OldStorageFunctions.getItemJson('privacyAlert');
      if (isEmpty(getDatePrivacyAlert) || moment().startOf('day').isAfter(getDatePrivacyAlert)) {
        Alert.alert(I18n.get('carousel-privacy-title'), I18n.get('carousel-privacy-text'), [
          {
            onPress: action,
            text: I18n.get('carousel-privacy-button'),
          },
        ]);
        await OldStorageFunctions.setItemJson('privacyAlert', moment().startOf('day'));
      } else {
        action();
      }
    } catch {
      throw new Error();
    }
  };

  return (
    <NavBarActionsGroup
      elements={[
        <NavBarAction
          onPress={() => showPrivacyAlert(() => imageViewerRef.current?.saveToLocal?.())}
          icon="ui-download"
          disabled={disabled}
        />,
        <PopupMenu
          actions={[
            {
              action: () => showPrivacyAlert(() => imageViewerRef.current?.share?.()),
              icon: {
                android: 'ic-menu-share',
                ios: 'square.and.arrow.up',
              },
              title: I18n.get('carousel-share'),
            },
          ]}>
          <NavBarAction disabled={disabled} icon="ui-options" />
        </PopupMenu>,
      ]}
    />
  );
};

export function computeNavBar({
  navigation,
  route,
}: NativeStackScreenProps<IModalsNavigationParams, ModalsRouteNames.Carousel>): NativeStackNavigationOptions {
  return {
    ...navBarOptions({
      navigation,
      route,
      title:
        route.params.data.length !== 1
          ? I18n.get('carousel-counter', { current: route.params.startIndex ?? 1, total: route.params.data.length })
          : '',
      titleStyle: styles.title,
    }),
    headerBlurEffect: 'dark',
    headerStyle: { backgroundColor: theme.ui.shadowColorTransparent.toString() },
    headerTransparent: true,
  };
}

export function Carousel(props: ICarouselProps) {
  const { navigation, route } = props;
  const startIndex = route.params.startIndex ?? 0;
  const data = React.useMemo(() => route.params.data ?? [], [route]);

  const dataAsImages = React.useMemo(
    () =>
      data.map(d => {
        const source = urlSigner.signURISource(d.src);
        const uri = new URL(source.uri);
        uri.searchParams.delete('thumbnail');
        uri.searchParams.append('thumbnail', `${IMAGE_MAX_DIMENSION}x0`);
        source.uri = uri.toString();
        source.cache = 'web';
        return {
          props: { source },
        };
      }),
    [data]
  );

  const [indexDisplay, setIndexDisplay] = React.useState((route.params.startIndex ?? 0) + 1);

  const [imageState, setImageState] = React.useState('');

  const [isNavBarVisible, setNavBarVisible] = React.useState(true);

  const imageViewerRef = React.useRef<ImageViewer>();

  const getButtons = React.useCallback(
    (disabled: boolean) => <Buttons disabled={disabled} imageViewerRef={imageViewerRef} />,
    [imageViewerRef]
  );

  const downloadFile = React.useCallback(
    async (url: string | ImageURISource) => {
      const realUrl = urlSigner.getRelativeUrl(urlSigner.getSourceURIAsString(url));
      if (!realUrl) throw new Error('[Carousel] cannot download : no url provided.');
      await assertPermissions('galery.write');
      const foundData = data.find(d => (d.src = url));
      const sf = await fileTransferService.downloadFile(assertSession(), { filetype: foundData?.mime, url: realUrl }, {});
      return sf;
    },
    [data]
  );

  const getSyncedFile = React.useCallback(
    async (url: string | ImageURISource) => {
      let sf: SyncedFile;
      const foundData = data.find(d => (d.src = url));
      const realUrl = urlSigner.getRelativeUrl(urlSigner.getSourceURIAsString(url));
      if (realUrl!.indexOf('file://') > -1) {
        sf = new SyncedFile(
          new LocalFile({ filename: '', filepath: realUrl!, filetype: foundData?.mime! }, { _needIOSReleaseSecureAccess: false }),
          {
            url: realUrl!,
          }
        );
      } else {
        sf = await downloadFile(url);
      }
      return sf;
    },
    [data, downloadFile]
  );

  const onSave = React.useCallback(
    async (url: string | ImageURISource) => {
      try {
        const sf = await getSyncedFile(url);
        try {
          if (!sf) return;
          await assertPermissions('galery.write');
        } catch (e) {
          if (e instanceof PermissionError) {
            Alert.alert(
              I18n.get('carousel-savetocameraroll-permissionblocked-title'),
              I18n.get('carousel-savetocameraroll-permissionblocked-text', { appName: DeviceInfo.getApplicationName() })
            );
            return undefined;
          } else {
            throw e;
          }
        }
        const realFilePath = Platform.select({
          android: getPath(sf._filepathNative!),
          default: decodeURI(sf._filepathNative!),
        });
        if (Platform.OS === 'android') {
          await CameraRoll.saveAsset(realFilePath, { album: 'Download' }); // Will put in the actual folder "Download", but still displayed in "Camera" album :/
        } else {
          await CameraRoll.saveAsset(realFilePath);
        }
        Toast.showSuccess(I18n.get('carousel-savetocameraroll-success'));
      } catch (e) {
        console.error(`Fail saving from Carousel: `, e);
        Toast.showError(I18n.get('carousel-savetocameraroll-error'));
      }
    },
    [getSyncedFile]
  );

  const onShare = React.useCallback(
    async (url: string | ImageURISource) => {
      try {
        const sf = await getSyncedFile(url);
        if (!sf) return;
        await Share.open({
          failOnCancel: false,
          showAppsToView: true,
          type: sf.filetype || 'text/html',
          url: Platform.OS === 'android' ? 'file://' + sf.filepath : sf.filepath,
        });
      } catch (e) {
        if (e instanceof PermissionError) {
          Alert.alert(
            I18n.get('carousel-share-permissionblocked-title'),
            I18n.get('carousel-share-permissionblocked-text', { appName: DeviceInfo.getApplicationName() })
          );
          return undefined;
        } else {
          Toast.showError(I18n.get('carousel-share-error'));
        }
      }
    },
    [getSyncedFile]
  );

  const loadingComponent = React.useMemo(() => <Loading />, []);
  const renderLoading = React.useCallback(() => loadingComponent, [loadingComponent]);

  const renderImage = React.useCallback(imageProps => {
    return <FastImage {...imageProps} />;
  }, []);

  const renderFailImage = React.useCallback(imageProps => {
    return (
      <EmptyScreen
        customStyle={styles.errorScreen}
        svgImage="image-not-found"
        title=""
        text={I18n.get('carousel-imagenotfound')}
        svgFillColor={theme.palette.grey.fog}
        textColor={theme.palette.grey.fog}
      />
    );
  }, []);

  React.useEffect(() => {
    if (isNavBarVisible) {
      navigation.setOptions({
        ...computeNavBar({ navigation, route }),
        headerRight: () => getButtons(imageState !== 'success'),
        headerTitle: navBarTitle(
          route.params.data.length !== 1
            ? I18n.get('carousel-counter', { current: indexDisplay, total: route.params.data.length })
            : '',
          styles.title
        ),
      });
    } else {
      navigation.setOptions({
        headerBlurEffect: undefined,
        headerLeft: undefined,
        headerRight: undefined,
        headerStyle: { backgroundColor: 'transparent' },
        headerTitle: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexDisplay, isNavBarVisible, imageState]);

  // Audience hook
  useFocusEffect(
    React.useCallback(() => {
      if (route.params.referer) {
        markViewAudience(route.params.referer);
      }
    }, [route.params.referer])
  );

  // Cache management
  React.useEffect(() => {
    RNFastImage.clearMemoryCache();
    console.debug('Carousel : Empty RNFast Image on mount');
    const preloads = dataAsImages.map(i => i.props.source);
    RNFastImage.preload(preloads);
    console.debug(`Carousel : Preload ${preloads.length} images`);
    return () => {
      RNFastImage.clearMemoryCache();
      console.debug('Carousel : Empty RNFast Image on unmount');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClick = React.useCallback(() => setNavBarVisible(!isNavBarVisible), [isNavBarVisible]);

  const renderIndicator = React.useCallback((index?: number, total?: number, imageStatus?: IImageSize['status']) => {
    if (index !== undefined) setIndexDisplay(index);
    if (imageStatus !== undefined) setImageState(imageStatus);
    return <></>;
  }, []);

  const imageViewer = React.useMemo(
    () => (
      <ImageViewer
        ref={imageViewerRef as React.RefObject<ImageViewer>}
        enableSwipeDown
        show
        imageUrls={dataAsImages}
        index={startIndex}
        onCancel={navigation.goBack}
        onSave={onSave}
        onShare={onShare}
        renderImage={renderImage}
        loadingRender={renderLoading}
        loadWindow={1}
        saveToLocalByLongPress={false}
        onClick={onClick}
        renderFailImage={renderFailImage}
        renderIndicator={renderIndicator}
      />
    ),
    // We want to remove `navigation` and `startIndex` from the dependencies here to avoid re-rendering when navState changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataAsImages, isNavBarVisible, onSave, onShare, renderFailImage, renderImage, renderLoading]
  );

  const navBarAndStatusBarHeight = useHeaderHeight();

  return (
    <PageView style={styles.page} showNetworkBar={false} showToast={false}>
      <StatusBar backgroundColor={theme.ui.shadowColor} barStyle="light-content" hidden={!isNavBarVisible} />
      {imageViewer}
      <ToastHandler offset={navBarAndStatusBarHeight + DEFAULTS.offset} />
    </PageView>
  );
}

export default Carousel;
