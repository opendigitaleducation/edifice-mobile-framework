import React, { useCallback } from 'react';
import { View } from 'react-native';

import { Fade, Placeholder } from 'rn-placeholder';

import styles from './styles';
import { ImageFallbackType, ImageLoadingState, ModuleImageProps } from './types';

import theme from '~/app/theme';
import { Picture, PictureProps } from '~/framework/components/picture';
import { Image } from '~/framework/util/media';

const ImageFallbackWithModuleConfig: React.FC<ImageFallbackType> = ({ moduleConfig }) => {
  const { displayColor, displayPicture } = moduleConfig;
  const imageType = displayPicture?.type;
  const imageName = displayPicture?.name;

  const renderPicture = useCallback(() => {
    switch (imageType) {
      case 'Svg':
        return <Picture type="Svg" name={imageName} fill={displayColor?.regular} />;
      case 'Icon':
        return <Picture type="Icon" name={imageName} color={displayColor?.regular} />;
      case 'Image':
        return <Picture type="Image" src={''} resizeMode="contain" />;
      default:
        return null;
    }
  }, [imageType, imageName, displayColor]);

  return <View style={[styles.moduleImage, { backgroundColor: displayColor?.pale }]}>{renderPicture()}</View>;
};

const ImageFallbackWithoutModuleConfig: React.FC<Partial<PictureProps>> = () => {
  return (
    <View style={[styles.moduleImage, { backgroundColor: theme.palette.grey.pearl }]}>
      <Picture type="Svg" name="image-not-found" fill={theme.palette.grey.white} />
    </View>
  );
};

const ImageLoader: React.FC = () => (
  <View style={[styles.moduleImage, styles.imageLoader]}>
    <Placeholder Animation={Fade} />
  </View>
);

const ModuleImage: React.FC<ModuleImageProps> = ({ moduleConfig, source, ...props }) => {
  const [imageLoadingState, setImageLoadingState] = React.useState<ImageLoadingState>(ImageLoadingState.LOADING);
  const onImageLoadStart = () => setImageLoadingState(ImageLoadingState.LOADING);
  const onImageLoadSuccess = () => setImageLoadingState(ImageLoadingState.SUCCESS);
  const onImageLoadError = () => setImageLoadingState(ImageLoadingState.ERROR);

  const renderFallbackImage = useCallback(() => {
    if (imageLoadingState !== ImageLoadingState.ERROR) return null;
    else return moduleConfig ? <ImageFallbackWithModuleConfig moduleConfig={moduleConfig} /> : <ImageFallbackWithoutModuleConfig />;
  }, [imageLoadingState, moduleConfig]);

  return (
    <View style={styles.moduleImageContainer}>
      {imageLoadingState === ImageLoadingState.LOADING && <ImageLoader />}
      {renderFallbackImage()}
      <Image source={source} {...props} onLoad={onImageLoadSuccess} onLoadStart={onImageLoadStart} onError={onImageLoadError} />
    </View>
  );
};

export default ModuleImage;
