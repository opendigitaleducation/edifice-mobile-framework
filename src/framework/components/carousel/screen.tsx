import { useHeaderHeight } from '@react-navigation/elements';
import * as React from 'react';
import Pinchable from 'react-native-pinchable';
import Carousel from 'react-native-reanimated-carousel';
import { connect } from 'react-redux';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import StatusBar from '~/framework/components/status-bar';
import { ToastHandler } from '~/framework/components/toast';
import { DEFAULTS } from '~/framework/components/toast/component';
import { getCurrentQueryParamToken } from '~/framework/modules/auth/reducer';
import { navBarOptions } from '~/framework/navigation/navBar';
import type { formatMediaSource } from '~/framework/util/media';
import { formatMediaSourceArray, Image } from '~/framework/util/media';
import { OAuth2RessourceOwnerPasswordClient } from '~/infra/oauth';
import { Loading } from '~/ui/Loading';

import styles from './styles';
import { CarouselScreenProps } from './types';

export namespace CarouselScreen {
  export const navOptions: CarouselScreenProps.NavBarConfig = ({ navigation, route }) => {
    const { medias, startIndex = 0 } = route.params;
    return {
      presentation: 'fullScreenModal',
      fullScreenGestureEnabled: true,
      ...navBarOptions({
        navigation,
        route,
        title: medias.length !== 1 ? I18n.get('carousel-counter', { current: startIndex + 1, total: medias.length }) : '',
        titleStyle: styles.title,
      }),
      headerTransparent: true,
      headerBlurEffect: 'dark',
      headerStyle: { backgroundColor: theme.ui.shadowColorTransparent.toString() },
    };
  };

  const CarouselItemImageComponent = ({ media, index }: { media: ReturnType<typeof formatMediaSource>; index: number }) => {
    return (
      <Pinchable style={styles.pinchable}>
        <Image source={media.src} style={styles.image} />
      </Pinchable>
    );
  };

  const CarouselItemComponent = ({ media, index }: { media: ReturnType<typeof formatMediaSource>; index: number }) => {
    if (media.type === 'image') {
      return <CarouselItemImageComponent media={media} index={index} />;
    } else return null;
  };

  const renderItem = ({ item, index }) => <CarouselItemComponent media={item} index={index} />;

  const carouselAnimationConfig = {
    type: 'spring' as const,
    config: {
      stiffness: 1000,
      damping: 500,
      overshootClamping: true,
    },
  };

  export const CarouselScreenComponent = connect(() => ({
    queryParamToken: getCurrentQueryParamToken(),
  }))((props: CarouselScreenProps.All) => {
    const { queryParamToken } = props;
    const { startIndex = 0 } = props.route.params;
    const medias = React.useMemo(() => formatMediaSourceArray(props.route.params.medias, { absolute: true }), []);
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

    return (
      <PageView style={styles.page} showNetworkBar={false} showToast={false}>
        <StatusBar type="dark" hidden={navBarHidden} />
        <ToastHandler offset={navBarAndStatusBarHeight + DEFAULTS.offset} />
        {loading ? (
          <Loading />
        ) : (
          <Carousel
            style={styles.page}
            data={medias}
            renderItem={renderItem}
            defaultIndex={startIndex}
            width={UI_SIZES.screen.width}
            height={UI_SIZES.screen.height}
            windowSize={3}
            withAnimation={carouselAnimationConfig}
          />
        )}
      </PageView>
    );
  });
}
