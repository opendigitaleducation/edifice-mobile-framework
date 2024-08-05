import * as React from 'react';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { BodyBoldText } from '~/framework/components/text';
import { navBarOptions } from '~/framework/navigation/navBar';

import styles from './styles';
import { CarouselScreenProps } from './types';

export namespace CarouselScreen {
  export const navOptions: CarouselScreenProps.NavBarConfig = ({ navigation, route }) => {
    const { medias, startIndex } = route.params;
    return {
      presentation: 'fullScreenModal',
      ...navBarOptions({
        navigation,
        route,
        title: medias.length !== 1 ? I18n.get('carousel-counter', { current: startIndex ?? 1, total: medias.length }) : '',
        titleStyle: styles.title,
      }),
      headerTransparent: true,
      headerBlurEffect: 'dark',
      headerStyle: { backgroundColor: theme.ui.shadowColorTransparent.toString() },
    };
  };

  export function CarouselScreenComponent(props: CarouselScreenProps.All) {
    const { medias, startIndex = 0 } = props.route.params;
    return (
      <>
        <BodyBoldText>{startIndex}</BodyBoldText>
        <BodyBoldText>{JSON.stringify(medias)}</BodyBoldText>
      </>
    );
  }
}
