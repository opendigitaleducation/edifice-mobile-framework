/**
 * New implementation of Carousel built with our custom react-native-image-viewer !
 */
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import I18n from 'i18n-js';
import * as React from 'react';
import { ImageURISource, Platform, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Share from 'react-native-share';
import { NavigationInjectedProps } from 'react-navigation';

import theme from '~/app/theme';
import { ActionButton } from '~/framework/components/ActionButton';
import ImageViewer from '~/framework/components/carousel/image-viewer';
import { UI_SIZES, UI_STYLES } from '~/framework/components/constants';
import { FakeHeader } from '~/framework/components/header';
import { PageView } from '~/framework/components/page';
import fileTransferService from '~/framework/util/fileHandler/service';
import { FastImage, IMedia } from '~/framework/util/media';
import { getUserSession } from '~/framework/util/session';
import { urlSigner } from '~/infra/oauth';
import { Loading } from '~/ui/Loading';

import { NamedSVG } from '../picture';
import PopupMenu from '../popupMenu';

export interface ICarouselNavParams {
  data: IMedia[];
  startIndex?: number;
}

export interface ICarouselProps extends NavigationInjectedProps<ICarouselNavParams> {}

const HEADER_BGCOLOR = '#0000007f';

const styles = StyleSheet.create({
  page: { backgroundColor: theme.palette.grey.black },
  header: {
    position: 'absolute',
    backgroundColor: HEADER_BGCOLOR,
    zIndex: 10,
  },
  // eslint-disable-next-line react-native/no-color-literals
  closeButton: {
    width: UI_SIZES.dimensions.width.huge,
    height: UI_SIZES.dimensions.width.huge,
    padding: 0,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    marginHorizontal: UI_SIZES.spacing.minor,
  },
});

export function Carousel(props: ICarouselProps) {
  const { navigation } = props;
  const startIndex = navigation.getParam('startIndex') ?? 0;
  const data = React.useMemo(() => navigation.getParam('data') ?? [], [navigation]);
  const dataAsImages = React.useMemo(() => data.map(d => ({ url: '', props: { source: urlSigner.signURISource(d.src) } })), [data]);

  const [isNavBarVisible, setNavBarVisible] = React.useState(true);

  const closeButton = React.useMemo(
    () => <ActionButton action={navigation.goBack} iconName="ui-rafterLeft" style={styles.closeButton} />,
    [navigation],
  );

  const imageViewerRef = React.useRef<ImageViewer>();
  const popupMenuRef = React.useRef<PopupMenu>();
  const dotsButton = React.useCallback(
    onPress => <ActionButton iconName="ui-options" style={styles.closeButton} action={onPress} />,
    [],
  );
  const buttons = React.useMemo(
    () => (
      <>
        <ActionButton
          action={() => {
            imageViewerRef.current?.saveToLocal?.();
          }}
          iconName="ui-download"
          style={styles.closeButton}
        />
        <PopupMenu
          button={dotsButton}
          options={[
            {
              i18n: 'share',
              icon: (
                <NamedSVG
                  name="ui-send"
                  fill={theme.palette.grey.black}
                  width={UI_SIZES.dimensions.width.large}
                  height={UI_SIZES.dimensions.width.large}
                  style={{ marginHorizontal: UI_SIZES.spacing.small }}
                />
              ),
              onClick: () => imageViewerRef.current?.share?.(),
            },
          ]}
          ref={popupMenuRef as React.LegacyRef<PopupMenu>} // Some type hack here...
          style={{
            top: UI_SIZES.elements.navbarHeight + UI_SIZES.spacing.minor,
          }}
        />
      </>
    ),
    [dotsButton],
  );

  const downloadFile = React.useCallback(async (url: string | ImageURISource) => {
    const realUrl = urlSigner.getRelativeUrl(urlSigner.getSourceURIAsString(url));
    if (!realUrl) throw new Error('[Carousel] cannot download : no url provided.');
    const sf = await fileTransferService.downloadFile(getUserSession(), { url: realUrl }, {});
    return sf;
  }, []);

  const onSave = React.useCallback(
    async (url: string | ImageURISource) => {
      const sf = await downloadFile(url);
      await CameraRoll.save(sf.filepath);
    },
    [downloadFile],
  );

  const onShare = React.useCallback(
    async (url: string | ImageURISource) => {
      const sf = await downloadFile(url);
      await Share.open({
        type: sf.filetype || 'text/html',
        url: Platform.OS === 'android' ? 'file://' + sf.filepath : sf.filepath,
        showAppsToView: true,
      });
    },
    [downloadFile],
  );

  const loadingComponent = React.useMemo(() => <Loading />, []);
  const renderLoading = React.useCallback(() => loadingComponent, [loadingComponent]);

  const headerStyle = React.useMemo(() => [styles.header, { opacity: isNavBarVisible ? 1 : 0 }], [isNavBarVisible]);

  const renderImage = React.useCallback(imageProps => <FastImage {...imageProps} />, []);

  return (
    <GestureHandlerRootView style={UI_STYLES.flex1}>
      <PageView navigation={navigation} style={styles.page}>
        <StatusBar backgroundColor={theme.ui.shadowColor} barStyle="light-content" />

        <ImageViewer
          ref={imageViewerRef as React.RefObject<ImageViewer>}
          enableSwipeDown
          show
          useNativeDriver
          imageUrls={dataAsImages}
          index={startIndex}
          onCancel={() => {
            navigation.goBack();
          }}
          onSave={onSave}
          onShare={onShare}
          renderImage={renderImage}
          loadingRender={renderLoading}
          loadWindow={1}
          renderIndicator={(current, total) => (
            <FakeHeader
              left={closeButton}
              style={headerStyle}
              title={I18n.t('carousel.counter', { current, total })}
              right={buttons}
            />
          )}
          saveToLocalByLongPress={false}
          onClick={() => {
            setNavBarVisible(!isNavBarVisible);
          }}
        />
      </PageView>
    </GestureHandlerRootView>
  );
}

export default Carousel;

export function openCarousel(props: ICarouselNavParams, navigation: any) {
  navigation.navigate('carouselModal2', props);
}
