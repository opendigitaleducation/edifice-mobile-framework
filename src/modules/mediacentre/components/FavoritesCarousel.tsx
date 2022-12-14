import Clipboard from '@react-native-clipboard/clipboard';
import I18n from 'i18n-js';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import Toast from 'react-native-tiny-toast';

import theme from '~/app/theme';
import { TouchCardWithoutPadding } from '~/framework/components/card';
import { UI_ANIMATIONS, UI_SIZES } from '~/framework/components/constants';
import { SmallBoldText } from '~/framework/components/text';
import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { openUrl } from '~/framework/util/linking';
import { FavoriteIcon, IconButton } from '~/modules/mediacentre/components/SmallCard';
import { IResource, Source } from '~/modules/mediacentre/reducer';

import { ResourceImage } from './ResourceImage';

const styles = StyleSheet.create({
  mainContainer: {
    marginBottom: UI_SIZES.spacing.medium,
  },
  titleText: {
    marginLeft: UI_SIZES.spacing.small,
  },
  cardListContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    margin: UI_SIZES.spacing.small,
  },
  cardSlideContainer: {
    width: 149,
    height: 154,
    padding: UI_SIZES.spacing.small,
  },
  cardContainer: {
    width: 125,
  },
  contentContainer: {
    marginLeft: UI_SIZES.spacing.small,
    padding: UI_SIZES.spacing.minor,
    backgroundColor: theme.ui.background.card,
    borderTopRightRadius: UI_SIZES.radius.card,
    borderBottomRightRadius: UI_SIZES.radius.card,
  },
  cardTitleText: {
    alignSelf: 'center',
  },
  imageContainer: {
    width: 90,
    height: 60,
    alignSelf: 'center',
    marginVertical: UI_SIZES.spacing.tiny,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});

interface ICardProps {
  color: string;
  resource: IResource;

  addFavorite: (id: string, resource: IResource) => any;
  removeFavorite: (id: string, source: Source) => any;
}

interface IFavoritesCarouselProps {
  resources: IResource[];

  addFavorite: (id: string, resource: IResource) => any;
  removeFavorite: (id: string, source: Source) => any;
}

const getCardColors = (length: number): string[] => {
  const colors = [
    theme.palette.status.info,
    theme.palette.complementary.green.regular,
    theme.palette.complementary.yellow.regular,
    theme.palette.complementary.red.regular,
    theme.palette.complementary.pink.regular,
    theme.palette.complementary.purple.regular,
    theme.palette.complementary.indigo.regular,
  ];
  const cardColors: string[] = [];

  for (let index = 0; index < length; index += 1) {
    cardColors.push(colors[Math.floor(Math.random() * colors.length)] as string);
  }
  return cardColors;
};

const Card: React.FunctionComponent<ICardProps> = (props: ICardProps) => {
  const openUrlCallback = () => {
    if (props.resource.source === Source.SIGNET) {
      return openUrl(props.resource.link);
    }
    const link = encodeURIComponent(props.resource.link);
    openUrl(`${DEPRECATED_getCurrentPlatform()!.url}/mediacentre/resource/open?url=${link}`);
  };
  const copyToClipboard = () => {
    Clipboard.setString(props.resource.link);
    Toast.show(I18n.t('mediacentre.link-copied'), { ...UI_ANIMATIONS.toast });
  };
  return (
    <TouchCardWithoutPadding onPress={openUrlCallback} style={[styles.cardContainer, { backgroundColor: props.color }]}>
      <View style={styles.contentContainer}>
        <SmallBoldText numberOfLines={1} style={styles.cardTitleText}>
          {props.resource.title}
        </SmallBoldText>
        <ResourceImage image={props.resource.image} style={styles.imageContainer} resizeMode="contain" />
        <View style={styles.actionsContainer}>
          <FavoriteIcon {...props} />
          <IconButton icon="link" size={20} onPress={copyToClipboard} />
        </View>
      </View>
    </TouchCardWithoutPadding>
  );
};

export const FavoritesCarousel: React.FunctionComponent<IFavoritesCarouselProps> = (props: IFavoritesCarouselProps) => {
  const [cardColors, setCardColors] = useState<string[]>(getCardColors(props.resources.length));
  const { width } = UI_SIZES.screen;
  const renderFavorite = ({ index, item }) => {
    return (
      <View style={styles.cardSlideContainer}>
        <Card {...props} resource={item} color={cardColors[index % cardColors.length]} key={item.uid || item.id} />
      </View>
    );
  };
  useEffect(() => {
    if (props.resources.length > cardColors.length) {
      const difference = props.resources.length - cardColors.length;
      const colors = cardColors.concat(getCardColors(difference));
      setCardColors(colors);
    }
  }, [props.resources.length, cardColors]);
  return (
    <View style={styles.mainContainer}>
      <SmallBoldText style={styles.titleText}>{I18n.t('mediacentre.favorites').toUpperCase()}</SmallBoldText>
      {props.resources.length > 2 ? (
        <Carousel
          data={props.resources}
          renderItem={renderFavorite}
          itemWidth={styles.cardSlideContainer.width}
          sliderWidth={width}
          itemHeight={styles.cardSlideContainer.height}
          sliderHeight={styles.cardSlideContainer.height}
          inactiveSlideOpacity={1}
          enableMomentum
          loop
        />
      ) : (
        <View style={styles.cardListContainer}>
          {props.resources.map((item, index) => {
            return <Card {...props} resource={item} color={cardColors[index]} key={item.uid || item.id} />;
          })}
        </View>
      )}
    </View>
  );
};
