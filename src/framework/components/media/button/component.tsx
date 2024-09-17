/**
 * Player (audio/video)
 */
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES, getScaleHeight, getScaleImageSize } from '~/framework/components/constants';
import MediaIcon from '~/framework/components/media/icon';
import { MediaType, openMediaPlayer } from '~/framework/components/media/player';
import { NamedSVG } from '~/framework/components/picture';
import { SmallItalicText } from '~/framework/components/text';
import { Image } from '~/framework/util/media';
import { urlSigner } from '~/infra/oauth';

import styles from './styles';
import { IPlayerProps } from './types';

const iconSizeAudio = getScaleImageSize(20);
const iconSizeVideo = getScaleImageSize(24);

const notAvailableMediaText = {
  video: 'mediabutton-video-notavailable',
  audio: 'mediabutton-audio-notavailable',
  media: 'mediabutton-media-notavailable',
  image: 'mediabutton-image-notavailable',
};

const MediaButton = (props: IPlayerProps) => {
  const { type, source, ratio, posterSource, style } = props;

  const widthWaves = UI_SIZES.screen.width - 4 * UI_SIZES.spacing.medium - getScaleHeight(36) - 3 * UI_SIZES.spacing.small;
  const heightWaves = Math.round(widthWaves * (36 / 237));

  const isAudio = type === 'audio';
  const isVideoOrWebview = type === 'video' || type === 'web';

  const playerStyle = {
    aspectRatio: ratio || 16 / 10,
  };

  const showMediaPlayer = () => {
    openMediaPlayer({
      type: props.type as MediaType,
      source: urlSigner.signURISource(props.source),
      referer: props.referer,
    });
  };

  const getPreviewVideo = () => {
    return !source || !type ? (
      <SmallItalicText>{I18n.get(notAvailableMediaText[type || 'media'])}</SmallItalicText>
    ) : (
      <TouchableOpacity onPress={() => showMediaPlayer()} style={[styles.previewVideo, style]}>
        {posterSource ? <Image source={posterSource || {}} style={[playerStyle, styles.player]} resizeMode="contain" /> : null}
        <View style={styles.viewVideo}>
          <MediaIcon icon="ui-play-filled" iconSize={iconSizeVideo} />
        </View>
      </TouchableOpacity>
    );
  };

  const getPreviewAudio = () => {
    return (
      <TouchableOpacity onPress={() => showMediaPlayer()}>
        <View style={styles.previewAudio}>
          <MediaIcon icon="ui-play-filled" iconSize={iconSizeAudio} style={styles.iconAudio} />
          <NamedSVG width={widthWaves} height={heightWaves} fill={theme.palette.primary.light} name="ui-wavering" />
        </View>
      </TouchableOpacity>
    );
  };

  return <>{isVideoOrWebview ? getPreviewVideo() : isAudio ? getPreviewAudio() : null}</>;
};

export default MediaButton;
