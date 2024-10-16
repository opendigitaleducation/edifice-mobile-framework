import Clipboard from '@react-native-clipboard/clipboard';
import * as React from 'react';
import { memo } from 'react';
import { View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import { TouchCardWithoutPadding } from '~/framework/components/card/base';
import { UI_STYLES } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture';
import { BodyText, CaptionText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { getSession } from '~/framework/modules/auth/reducer';
import { Source } from '~/framework/modules/mediacentre/model';
import { openUrl } from '~/framework/util/linking';
import { Image } from '~/framework/util/media';

import { defaultStyles, pinStyles, previewStyles } from './styles';
import { ResourceCardProps } from './types';

const ResourceCard: React.FunctionComponent<ResourceCardProps> = ({
  isFavorite,
  resource,
  variant = 'default',
  onAddFavorite,
  onRemoveFavorite,
}) => {
  const handlePress = () => {
    if (resource.source === Source.SIGNET) {
      openUrl(resource.link);
    } else {
      const link = encodeURIComponent(resource.link);
      const session = getSession();
      if (!session) return;
      openUrl(`${session.platform.url}/mediacentre/resource/open?url=${link}`);
    }
  };

  const handleCopyLink = () => {
    Clipboard.setString(resource.link);
    Toast.showInfo(I18n.get('mediacentre-resourcecard-linkcopied'));
  };

  const renderTypeIcon = () => {
    const iconName = resource.source === Source.SIGNET ? 'ui-bookmark' : resource.isTextbook ? 'ui-toga' : 'ui-laptop';

    return (
      <View style={defaultStyles.iconContainer}>
        <NamedSVG name={iconName} fill={theme.palette.grey.graphite} width={16} height={16} />
      </View>
    );
  };

  const renderCard = () => {
    if (variant === 'pin')
      return (
        <TouchCardWithoutPadding onPress={handlePress} style={pinStyles.mainContainer}>
          <View style={pinStyles.topContainer}>
            <Image source={{ uri: resource.image }} style={pinStyles.imageContainer} resizeMode="contain" />
            <View style={pinStyles.rightContainer}>
              <SmallText numberOfLines={1}>{resource.title}</SmallText>
              {resource.pinnedDescription ? (
                <CaptionText numberOfLines={2} style={UI_STYLES.flexShrink1}>
                  {resource.pinnedDescription}
                </CaptionText>
              ) : null}
            </View>
          </View>
          <View style={pinStyles.lowerContainer}>
            {resource.isParent ? (
              <View style={pinStyles.highlightContainer}>
                <NamedSVG name="ui-sparkle" fill={theme.ui.text.light} width={12} height={12} />
                <CaptionText numberOfLines={1} style={pinStyles.lightText}>
                  {I18n.get('mediacentre-resourcecard-highlight')}
                </CaptionText>
              </View>
            ) : null}
            <IconButton
              icon="ui-copy"
              color={theme.palette.primary.regular}
              action={handleCopyLink}
              style={pinStyles.copyActionContainer}
            />
            <IconButton
              icon="ui-star-filled"
              color={isFavorite ? theme.palette.complementary.yellow.regular : theme.palette.grey.grey}
              action={isFavorite ? onRemoveFavorite : onAddFavorite}
            />
          </View>
        </TouchCardWithoutPadding>
      );

    if (variant === 'preview')
      return (
        <TouchCardWithoutPadding onPress={handlePress} style={previewStyles.mainContainer}>
          <SmallText numberOfLines={1}>{resource.title}</SmallText>
          <Image source={{ uri: resource.image }} style={previewStyles.imageContainer} resizeMode="contain" />
          <View style={previewStyles.actionsContainer}>
            <IconButton icon="ui-copy" color={theme.palette.primary.regular} action={handleCopyLink} />
            <IconButton
              icon="ui-star-filled"
              color={isFavorite ? theme.palette.complementary.yellow.regular : theme.palette.grey.grey}
              action={isFavorite ? onRemoveFavorite : onAddFavorite}
            />
          </View>
        </TouchCardWithoutPadding>
      );

    return (
      <TouchCardWithoutPadding onPress={handlePress} style={defaultStyles.mainContainer}>
        <Image source={{ uri: resource.image }} style={defaultStyles.imageContainer} />
        <View style={defaultStyles.innerContainer}>
          <View style={defaultStyles.titleContainer}>
            <BodyText numberOfLines={2} style={defaultStyles.titleText}>
              {resource.title}
            </BodyText>
            {renderTypeIcon()}
          </View>
          <View style={defaultStyles.lowerContainer}>
            <SmallText numberOfLines={1} style={defaultStyles.secondaryText}>
              {resource.source === Source.SIGNET ? resource.authors : resource.editors}
            </SmallText>
            <View style={defaultStyles.actionsContainer}>
              <IconButton icon="ui-copy" color={theme.palette.primary.regular} action={handleCopyLink} />
              <IconButton
                icon="ui-star-filled"
                color={isFavorite ? theme.palette.complementary.yellow.regular : theme.palette.grey.grey}
                action={isFavorite ? onRemoveFavorite : onAddFavorite}
              />
            </View>
          </View>
        </View>
      </TouchCardWithoutPadding>
    );
  };

  return renderCard();
};

export default memo(ResourceCard);
