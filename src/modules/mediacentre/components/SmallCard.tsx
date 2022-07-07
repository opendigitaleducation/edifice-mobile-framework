import Clipboard from '@react-native-clipboard/clipboard';
import I18n from 'i18n-js';
import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-tiny-toast';

import theme from '~/app/theme';
import { TouchCard } from '~/framework/components/card';
import { Icon } from '~/framework/components/picture/Icon';
import { Text, TextBold, TextSizeStyle } from '~/framework/components/text';
import { openUrl } from '~/framework/util/linking';
import { ResourceImage, SourceImage } from '~/modules/mediacentre/components/ResourceImage';
import { IResource, Source } from '~/modules/mediacentre/utils/Resource';

const styles = StyleSheet.create({
  upperContentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5, // MO-142 use UI_SIZES.spacing here
  },
  titleText: {
    color: theme.palette.primary.regular,
    flexShrink: 1,
    marginRight: 5, // MO-142 use UI_SIZES.spacing here
  },
  lowerContentContainer: {
    flexDirection: 'row',
  },
  imageContainer: {
    height: 70,
    width: 50,
  },
  secondaryContainer: {
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 5, // MO-142 use UI_SIZES.spacing here
  },
  descriptionText: {
    ...TextSizeStyle.Small,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

interface IIconButtonProps {
  color?: string;
  icon: string;
  size: number;

  onPress: () => void;
}

interface IFavoriteIconProps {
  resource: IResource;

  addFavorite: (id: string, resource: IResource) => any;
  removeFavorite: (id: string, source: Source) => any;
}

interface ISmallCardProps {
  resource: IResource;

  addFavorite: (id: string, resource: IResource) => any;
  removeFavorite: (id: string, source: Source) => any;
}

export const IconButton: React.FunctionComponent<IIconButtonProps> = (props: IIconButtonProps) => (
  <TouchableOpacity onPress={props.onPress}>
    <Icon size={props.size} color={props.color || theme.palette.primary.regular} name={props.icon} />
  </TouchableOpacity>
);

export const FavoriteIcon: React.FunctionComponent<IFavoriteIconProps> = (props: IFavoriteIconProps) => {
  const removeFavorite = () => {
    props.removeFavorite(props.resource.id, props.resource.source);
  };
  const addFavorite = () => {
    props.addFavorite(props.resource.id, props.resource);
  };
  return props.resource.favorite ? (
    <IconButton icon="star" size={20} color="#FEC63D" onPress={removeFavorite} />
  ) : (
    <IconButton icon="star" size={20} color="#D6D6D6" onPress={addFavorite} />
  );
};

export class SmallCard extends React.PureComponent<ISmallCardProps> {
  openUrlCallback = () => {
    openUrl(this.props.resource.link);
  };

  copyToClipboard = () => {
    Clipboard.setString(this.props.resource.link);
    Toast.show(I18n.t('mediacentre.link-copied'));
  };

  public render() {
    const { resource } = this.props;
    return (
      <TouchCard onPress={this.openUrlCallback}>
        <View style={styles.upperContentContainer}>
          <TextBold numberOfLines={1} style={styles.titleText}>
            {resource.title}
          </TextBold>
          {resource.source !== Source.SIGNET ? <SourceImage source={resource.source} size={18} /> : null}
        </View>
        <View style={styles.lowerContentContainer}>
          <ResourceImage image={resource.image} style={styles.imageContainer} />
          <View style={styles.secondaryContainer}>
            <Text numberOfLines={2} style={styles.descriptionText}>
              {resource.source === Source.SIGNET ? resource.authors : resource.editors}
            </Text>
            <View style={styles.actionsContainer}>
              <FavoriteIcon {...this.props} />
              <IconButton icon="link" size={20} onPress={this.copyToClipboard} />
            </View>
          </View>
        </View>
      </TouchCard>
    );
  }
}
