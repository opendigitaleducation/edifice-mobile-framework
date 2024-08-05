import { I18n } from '~/app/i18n';
import { navBarOptions } from '~/framework/navigation/navBar';

import { CarouselScreen } from './types';

export const computeNavBar: CarouselScreen.NavBarConfig = ({ navigation, route }) => {
  return {
    ...navBarOptions({
      navigation,
      route,
      title:
        route.params.medias.length !== 1
          ? I18n.get('carousel-counter', { current: route.params.startIndex ?? 1, total: route.params.data.length })
          : '',
      titleStyle: styles.title,
    }),
    headerTransparent: true,
    headerBlurEffect: 'dark',
    headerStyle: { backgroundColor: theme.ui.shadowColorTransparent.toString() },
  };
};
