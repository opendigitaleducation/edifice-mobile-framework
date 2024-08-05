import { useHeaderHeight } from '@react-navigation/elements';
import * as React from 'react';
import { ImageProps, View } from 'react-native';
import Pdf from 'react-native-pdf';
import Carousel, { TCarouselProps } from 'react-native-reanimated-carousel';
import { WebViewSourceUri } from 'react-native-webview/lib/WebViewTypes';
import Zoom from 'react-native-zoom-reanimated';
import { connect } from 'react-redux';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { LoadingIndicator } from '~/framework/components/loading';
import MediaPlayer from '~/framework/components/media/player-carousel';
import { PageView } from '~/framework/components/page';
import StatusBar from '~/framework/components/status-bar';
import { ToastHandler } from '~/framework/components/toast';
import { DEFAULTS } from '~/framework/components/toast/component';
import WebView from '~/framework/components/webview';
import { getCurrentQueryParamToken } from '~/framework/modules/auth/reducer';
import { navBarOptions } from '~/framework/navigation/navBar';
import { openUrl } from '~/framework/util/linking';
import type {
  formatMediaSource,
  IAttachmentMedia,
  IAudioMedia,
  IImageMedia,
  IMedia,
  IPdfMedia,
  IVideoMedia,
} from '~/framework/util/media';
import { formatMediaSourceArray, Image } from '~/framework/util/media';
import { OAuth2RessourceOwnerPasswordClient } from '~/infra/oauth';

import styles from './styles';
import { CarouselScreenProps } from './types';

export namespace CarouselScreen {
  const onLinkPress = (uri: string) => {
    openUrl(uri);
  };

  const renderLoading = () => <LoadingIndicator />;

  const getScreenTitle = (current: number, total: number) =>
    total > 1 ? I18n.get('carousel-counter', { current: current + 1, total }) : '';

  const getNavBarOptions = (
    navigation: CarouselScreenProps.Navigation['navigation'],
    route: CarouselScreenProps.Navigation['route'],
    current: number,
    total: number,
  ) =>
    navBarOptions({
      navigation,
      route,
      title: getScreenTitle(current, total),
      // titleStyle: styles.title,
    });

  export const navOptions: CarouselScreenProps.NavBarConfig = ({ navigation, route }) => {
    const { medias, startIndex = 0 } = route.params;
    return {
      presentation: 'fullScreenModal',
      ...getNavBarOptions(navigation, route, startIndex, medias.length),
      headerTransparent: true,
      headerBlurEffect: 'dark',
      headerStyle: { backgroundColor: theme.ui.shadowColorTransparent.toString() },
    };
  };

  interface CarouselItemProps<MediaType extends IMedia = IMedia> {
    media: ReturnType<typeof formatMediaSource<MediaType>>;
    index: number;
    carouselRef: React.RefObject<CarouselScreenHandle>;
  }

  const carouselItemImageComponentDoubleTapConfig = {
    minZoomScale: 1,
    maxZoomScale: 10,
    defaultScale: 4,
  };

  const CarouselItemImageComponent = ({ media }: CarouselItemProps<IImageMedia>) => {
    const [wh, setWh] = React.useState<{ w: number; h: number } | undefined>(undefined);
    const containerStyle = React.useMemo<ImageProps['style']>(
      () => [styles.container, { aspectRatio: wh && wh.h !== 0 ? wh.w / wh.h : 'auto' }],
      [wh],
    );
    return (
      <Zoom style={styles.pinchable} doubleTapConfig={carouselItemImageComponentDoubleTapConfig}>
        <View style={containerStyle}>
          <Image
            source={media.src}
            style={styles.image}
            onLoad={React.useCallback(
              ({
                nativeEvent: {
                  source: { width, height },
                },
              }) => {
                setWh({ w: width, h: height });
              },
              [],
            )}
          />
        </View>
      </Zoom>
    );
  };

  const CarouselItemPlayerComponent = ({ media }: CarouselItemProps<IAudioMedia | IVideoMedia>) => {
    return <MediaPlayer media={media} />;
  };

  const CarouselItemPdfComponent = ({ media, carouselRef }: CarouselItemProps<IPdfMedia>) => {
    const onScaleChanged = React.useCallback(
      (scale: number) => {
        if (scale <= 1) {
          carouselRef.current?.setSwipeEnabled(true);
        } else {
          carouselRef.current?.setSwipeEnabled(false);
        }
      },
      [carouselRef],
    );

    return (
      <Pdf
        source={media.src}
        style={styles.webview}
        trustAllCerts={false}
        // onError={() => this.setState({ error: true })}
        onPressLink={onLinkPress}
        renderActivityIndicator={renderLoading}
        onScaleChanged={onScaleChanged}
      />
    );
  };

  const CarouselItemAttachmentComponent = ({ media, index }: CarouselItemProps<IAttachmentMedia>) => {
    return <WebView source={media.src as WebViewSourceUri} style={styles.webview} />;
  };

  const CarouselItemComponent = ({ media, index, carouselRef }: CarouselItemProps) => {
    if (media.type === 'image') {
      return <CarouselItemImageComponent media={media} index={index} carouselRef={carouselRef} />;
    } else if (media.type === 'audio' || media.type === 'video') {
      return <CarouselItemPlayerComponent media={media} index={index} carouselRef={carouselRef} />;
    } else if (media.type === 'pdf') {
      return <CarouselItemPdfComponent media={media} index={index} carouselRef={carouselRef} />;
    } else if (media.type === 'attachment') {
      return <CarouselItemAttachmentComponent media={media} index={index} carouselRef={carouselRef} />;
    } else return null;
  };

  const carouselAnimationConfig = {
    type: 'spring' as const,
    config: {
      stiffness: 1000,
      damping: 500,
      overshootClamping: true,
    },
  };

  export type CarouselScreenHandle = {
    setSwipeEnabled: (v: boolean) => void;
  };

  export const CarouselScreenComponent = connect(() => ({
    queryParamToken: getCurrentQueryParamToken(),
  }))((props: CarouselScreenProps.All) => {
    const { queryParamToken, navigation, route } = props;
    const { startIndex = 0 } = props.route.params;
    const medias = React.useMemo(
      () => formatMediaSourceArray(props.route.params.medias, { absolute: true, queryParamToken }),
      [props.route.params.medias, queryParamToken],
    );
    const [navBarHidden, setNavBarHidden] = React.useState(false);
    const navBarAndStatusBarHeight = useHeaderHeight();

    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
      if (queryParamToken && !OAuth2RessourceOwnerPasswordClient.tokenIsExpired(queryParamToken)) {
        setLoading(false);
      } else {
        OAuth2RessourceOwnerPasswordClient.connection?.getQueryParamToken();
      }
    }, [queryParamToken]);

    const carouselRef = React.useRef<CarouselScreenHandle>(null);
    const [swipeEnabled, setSwipeEnabled] = React.useState(true);
    React.useImperativeHandle(carouselRef, () => ({
      setSwipeEnabled,
    }));

    const renderItem = React.useCallback(
      ({ item, index }) => <CarouselItemComponent media={item} index={index} carouselRef={carouselRef} />,
      [carouselRef],
    );

    const onSnapToItem = React.useCallback<NonNullable<TCarouselProps['onSnapToItem']>>(
      index => {
        navigation.setOptions({ headerTitle: getNavBarOptions(navigation, route, index, medias.length).headerTitle });
      },
      [medias.length, navigation, route],
    );

    return (
      <PageView style={styles.page} showNetworkBar={false} showToast={false}>
        <StatusBar type="dark" hidden={navBarHidden} />
        <ToastHandler offset={navBarAndStatusBarHeight + DEFAULTS.offset} />
        {loading ? (
          <LoadingIndicator />
        ) : (
          <Carousel
            enabled={swipeEnabled}
            style={styles.page}
            data={medias}
            renderItem={renderItem}
            defaultIndex={startIndex}
            width={UI_SIZES.screen.width}
            height={UI_SIZES.screen.height}
            windowSize={3}
            withAnimation={carouselAnimationConfig}
            loop={false}
            onSnapToItem={onSnapToItem}
          />
        )}
      </PageView>
    );
  });
}
